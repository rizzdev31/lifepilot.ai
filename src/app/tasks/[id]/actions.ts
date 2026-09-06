"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateRoadmapForTask } from "@/lib/ai/gemini";
import { createGoogleCalendarEvent } from "@/lib/google/calendar";
import type { Task } from "@/lib/types";

// ── Tandai step selesai & otomatis advance step berikutnya ─────
export async function completeStep(
  stepId: string,
  taskId: string
): Promise<{ success: boolean; allDone: boolean }> {
  const supabase = await createClient();

  // 1. Tandai step ini sebagai done
  await supabase
    .from("roadmap_steps")
    .update({ status: "done", updated_at: new Date().toISOString() })
    .eq("id", stepId);

  // 2. Ambil semua steps untuk task ini
  const { data: steps } = await supabase
    .from("roadmap_steps")
    .select("id, status, order")
    .eq("task_id", taskId)
    .order("order", { ascending: true });

  if (!steps) {
    revalidatePath(`/tasks/${taskId}`);
    return { success: true, allDone: false };
  }

  // 3. Cek apakah semua steps sudah done
  const updatedSteps = steps.map((s) =>
    s.id === stepId ? { ...s, status: "done" } : s
  );
  const allDone = updatedSteps.every((s) => s.status === "done");

  if (allDone) {
    // Semua steps selesai → tandai task sebagai done
    await supabase
      .from("tasks")
      .update({ status: "done", updated_at: new Date().toISOString() })
      .eq("id", taskId);
  } else {
    // Advance step berikutnya ke in_progress
    const nextPending = updatedSteps
      .filter((s) => s.status === "pending")
      .sort((a, b) => a.order - b.order)[0];

    if (nextPending) {
      await supabase
        .from("roadmap_steps")
        .update({ status: "in_progress", updated_at: new Date().toISOString() })
        .eq("id", nextPending.id);
    }
  }

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true, allDone };
}

// ── Batalkan completion step (undo) ───────────────────────────
export async function undoStep(
  stepId: string,
  taskId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();

  await supabase
    .from("roadmap_steps")
    .update({ status: "pending", updated_at: new Date().toISOString() })
    .eq("id", stepId);

  // Jika task sudah done, kembalikan ke in_progress
  await supabase
    .from("tasks")
    .update({ status: "in_progress", updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("status", "done");

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}

// ── Generate roadmap on-demand (untuk task tanpa roadmap) ─────
export async function generateRoadmapOnDemand(
  task: Pick<Task, "id" | "title" | "description" | "category" | "priority" | "deadline" | "estimated_duration">
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    const steps = await generateRoadmapForTask(task);

    if (steps.length === 0) {
      return { success: false, error: "AI tidak bisa generate roadmap untuk task ini." };
    }

    const stepsToInsert = steps.map((step, i) => ({
      task_id: task.id,
      title: step.title,
      description: step.description,
      order: step.order,
      step_type: step.step_type ?? "action",
      content: step.content ?? null,
      status: i === 0 ? "in_progress" : "pending",
    }));

    const { error } = await supabase.from("roadmap_steps").insert(stepsToInsert);

    if (error) {
      return { success: false, error: error.message };
    }

    // Update task ke in_progress
    await supabase
      .from("tasks")
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", task.id)
      .eq("status", "pending");

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Generate roadmap gagal.";
    return { success: false, error: msg };
  }

  revalidatePath(`/tasks/${task.id}`);
  return { success: true };
}

// ── Sync task ke Google Calendar ─────────────────────────────
export async function syncToCalendar(
  taskId: string
): Promise<{ success: boolean; calendarLink?: string; error?: string }> {
  const supabase = await createClient();

  // Ambil provider_token (Google OAuth access token) dari session
  const { data: { session } } = await supabase.auth.getSession();
  const providerToken = session?.provider_token;

  if (!providerToken) {
    return { success: false, error: "Login ulang dengan Google untuk sync Calendar." };
  }

  // Ambil data task
  const { data: task, error: taskErr } = await supabase
    .from("tasks")
    .select("id, title, description, deadline, estimated_duration")
    .eq("id", taskId)
    .single();

  if (taskErr || !task) return { success: false, error: "Task tidak ditemukan." };
  if (!task.deadline) return { success: false, error: "Task belum punya deadline — tambahkan deadline dulu." };

  try {
    const { google_event_id, calendar_link } = await createGoogleCalendarEvent(
      providerToken,
      task
    );

    // Simpan ke calendar_events
    await supabase.from("calendar_events").upsert(
      { task_id: taskId, google_event_id, calendar_link },
      { onConflict: "task_id" }
    );

    revalidatePath(`/tasks/${taskId}`);
    revalidatePath("/calendar");
    return { success: true, calendarLink: calendar_link };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal sync ke Google Calendar.";
    return { success: false, error: msg };
  }
}

// ── Hapus & regenerate roadmap untuk task ─────────────────────
export async function regenerateRoadmap(
  task: Pick<Task, "id" | "title" | "description" | "category" | "priority" | "deadline" | "estimated_duration">
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // 1. Hapus semua steps lama
    await supabase.from("roadmap_steps").delete().eq("task_id", task.id);

    // 2. Generate steps baru dari AI
    const steps = await generateRoadmapForTask(task);
    if (steps.length === 0) {
      return { success: false, error: "AI tidak bisa generate roadmap." };
    }

    const stepsToInsert = steps.map((step, i) => ({
      task_id: task.id,
      title: step.title,
      description: step.description,
      order: step.order,
      step_type: step.step_type ?? "action",
      content: step.content ?? null,
      status: i === 0 ? "in_progress" : "pending",
    }));

    const { error } = await supabase.from("roadmap_steps").insert(stepsToInsert);
    if (error) return { success: false, error: error.message };

    // 3. Reset task ke in_progress
    await supabase
      .from("tasks")
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", task.id);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal regenerate." };
  }

  revalidatePath(`/tasks/${task.id}`);
  return { success: true };
}

// ── Tandai seluruh task sebagai done ──────────────────────────
export async function markTaskDone(taskId: string): Promise<{ success: boolean }> {
  const supabase = await createClient();

  await supabase
    .from("tasks")
    .update({ status: "done", updated_at: new Date().toISOString() })
    .eq("id", taskId);

  // Tandai semua steps yang belum done jadi done
  await supabase
    .from("roadmap_steps")
    .update({ status: "done", updated_at: new Date().toISOString() })
    .eq("task_id", taskId)
    .neq("status", "done");

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}
