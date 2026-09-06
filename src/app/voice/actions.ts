"use server";

import { createClient } from "@/lib/supabase/server";
import { extractTasksFromTranscript, generateRoadmapForTask } from "@/lib/ai/gemini";
import { createGoogleCalendarEvent } from "@/lib/google/calendar";
import type { ExtractedTask } from "@/lib/types";

// ── Step 1: transcript → Gemini → extracted tasks ─────────────
export async function processTranscript(
  transcript: string
): Promise<{ tasks: ExtractedTask[]; error?: string }> {
  if (!transcript.trim()) {
    return { tasks: [], error: "Transcript kosong." };
  }

  console.log("[processTranscript] Input:", transcript.substring(0, 200));

  try {
    const tasks = await extractTasksFromTranscript(transcript);
    console.log("[processTranscript] Extracted:", tasks.length, "tasks");
    return { tasks };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI processing gagal.";
    console.error("[processTranscript] Error:", msg);
    return { tasks: [], error: msg };
  }
}

// ── Step 2: simpan tasks + generate roadmap otomatis ──────────
export async function saveVoiceAndTasks(
  transcript: string,
  tasks: ExtractedTask[]
): Promise<{ success: boolean; count: number; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, count: 0, error: "Tidak terautentikasi." };

  // 1. Simpan voice note
  const { data: voiceNote } = await supabase
    .from("voice_notes")
    .insert({
      user_id: user.id,
      transcript,
      ai_summary: `${tasks.length} task diekstrak`,
    })
    .select("id")
    .single();

  // Ambil Google access token untuk Calendar sync
  const { data: { session } } = await supabase.auth.getSession();
  const providerToken = session?.provider_token ?? null;

  // 2. Simpan setiap task lalu generate roadmap + calendar (paralel)
  const taskSavePromises = tasks.map(async (task) => {
    const { data: savedTask, error: taskError } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        voice_note_id: voiceNote?.id ?? null,
        title: task.title,
        description: task.description ?? null,
        priority: task.priority,
        deadline: task.deadline ?? null,
        category: task.category ?? null,
        estimated_duration: task.estimated_duration ?? null,
        status: "pending",
      })
      .select("id, title, description, category, priority, deadline, estimated_duration")
      .single();

    if (taskError || !savedTask) {
      console.error("[saveVoiceAndTasks] task error:", taskError?.message);
      return false;
    }

    // 3. Generate AI roadmap untuk task ini
    try {
      const steps = await generateRoadmapForTask({
        title: savedTask.title,
        description: savedTask.description,
        category: savedTask.category,
        priority: savedTask.priority,
        deadline: savedTask.deadline,
        estimated_duration: savedTask.estimated_duration,
      });

      if (steps.length > 0) {
        // Tandai step pertama sebagai in_progress
        const stepsToInsert = steps.map((step, i) => ({
          task_id: savedTask.id,
          title: step.title,
          description: step.description,
          order: step.order,
          step_type: step.step_type ?? "action",
          content: step.content ?? null,
          status: i === 0 ? "in_progress" : "pending",
        }));

        const { error: stepsError } = await supabase
          .from("roadmap_steps")
          .insert(stepsToInsert);

        if (stepsError) {
          console.error("[saveVoiceAndTasks] steps error:", stepsError.message);
        } else {
          // Update task status ke in_progress karena roadmap sudah ada
          await supabase
            .from("tasks")
            .update({ status: "in_progress" })
            .eq("id", savedTask.id);
        }
      }
    } catch (err) {
      console.error("[saveVoiceAndTasks] roadmap generation error:", err);
    }

    // 4. Auto-create in-app reminder 1 jam sebelum deadline
    if (savedTask.deadline) {
      try {
        const deadlineDate = new Date(savedTask.deadline);
        const remindAt = new Date(deadlineDate.getTime() - 3600000); // -1 jam
        if (remindAt > new Date()) { // hanya buat jika belum lewat
          await supabase.from("reminders").insert({
            task_id: savedTask.id,
            channel: "push",
            message: `"${savedTask.title}" — deadline dalam 1 jam!`,
            remind_at: remindAt.toISOString(),
            status: "pending",
          });
        }
      } catch (err) {
        console.error("[saveVoiceAndTasks] reminder creation error:", err);
      }
    }

    // 5. Auto-sync ke Google Calendar jika task punya deadline & user login
    if (savedTask.deadline && providerToken) {
      try {
        const { google_event_id, calendar_link } = await createGoogleCalendarEvent(
          providerToken,
          {
            title: savedTask.title,
            description: savedTask.description,
            deadline: savedTask.deadline,
            estimated_duration: savedTask.estimated_duration,
          }
        );
        await supabase.from("calendar_events").insert({
          task_id: savedTask.id,
          google_event_id,
          calendar_link,
        });
        console.log("[saveVoiceAndTasks] calendar synced:", calendar_link);
      } catch (err) {
        console.error("[saveVoiceAndTasks] calendar sync error:", err);
        // Tidak fatal — task sudah tersimpan
      }
    }

    return true;
  });

  const results = await Promise.all(taskSavePromises);
  const saved = results.filter(Boolean).length;

  return { success: true, count: saved };
}
