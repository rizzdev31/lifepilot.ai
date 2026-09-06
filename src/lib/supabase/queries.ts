import { createClient } from "./server";
import type { Task, RoadmapStep, User } from "@/lib/types";

// ── Demo data untuk fallback saat Supabase tidak bisa direach ──
const DEMO_TASKS: Task[] = [
  {
    id: "demo-1",
    user_id: "demo",
    title: "Revisi Proposal Bisnis",
    description: "Adjust Q3 revenue estimates based on new market data.",
    priority: "urgent",
    status: "in_progress",
    category: "Business",
    deadline: new Date(Date.now() + 86400000).toISOString(),
    estimated_duration: 120,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    user_id: "demo",
    title: "Brainstorming Konten IG",
    description: "Ideation session dengan creative team.",
    priority: "medium",
    status: "pending",
    category: "Content",
    deadline: undefined,
    estimated_duration: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-3",
    user_id: "demo",
    title: "Review Laporan Keuangan",
    description: "Cek laporan bulanan dan rekap pengeluaran.",
    priority: "high",
    status: "pending",
    category: "Finance",
    deadline: new Date(Date.now() + 172800000).toISOString(),
    estimated_duration: 90,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEMO_STEPS: RoadmapStep[] = [
  {
    id: "step-1", task_id: "demo-1",
    title: "Kumpulkan data pasar Q3",
    description: "Riset data kompetitor dan tren industri. Buka laporan lama, catat 3-5 angka kunci yang relevan.",
    order: 1, status: "done", step_type: "action",
  },
  {
    id: "step-2", task_id: "demo-1",
    title: "Pelajari istilah bisnis kunci",
    description: "Kuasai terminologi yang akan dibahas dalam proposal agar presentasi terdengar profesional.",
    order: 2, status: "in_progress", step_type: "learn",
    content: "**Istilah Bisnis Penting:**\n• **ROI** (Return on Investment) — rasio keuntungan terhadap investasi\n• **Revenue Projection** — estimasi pendapatan ke depan\n• **Market Share** — pangsa pasar yang dikuasai\n• **Burn Rate** — kecepatan pengeluaran modal\n• **Break Even** — titik balik modal\n\n**Tips:** Gunakan istilah ini di bagian Executive Summary untuk kesan profesional.",
  },
  {
    id: "step-3", task_id: "demo-1",
    title: "Update proyeksi revenue",
    description: "Revisi angka proyeksi berdasarkan data Q3 baru. Gunakan format tabel perbandingan sebelum-sesudah.",
    order: 3, status: "pending", step_type: "action",
  },
  {
    id: "step-4", task_id: "demo-1",
    title: "Review & finalisasi proposal",
    description: "Baca ulang sekali, cek konsistensi angka, minta satu orang review sebelum kirim.",
    order: 4, status: "pending", step_type: "review",
  },
];

// ── Safe Supabase wrapper ──────────────────────────────────────
async function safeGetUser() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return { supabase, user };
  } catch {
    return { supabase: null, user: null };
  }
}

// ============================================================
// USER
// ============================================================

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;
    const { data } = await supabase.from("users").select("*").eq("id", authUser.id).single();
    return data as User | null;
  } catch {
    return null;
  }
}

export async function getAuthUser() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

// ============================================================
// TASKS
// ============================================================

export async function getTodayTasks(): Promise<Task[]> {
  try {
    const { supabase, user } = await safeGetUser();
    if (!supabase || !user) return DEMO_TASKS.slice(0, 2);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "done")
      .or(`deadline.gte.${todayStart.toISOString()},deadline.lte.${todayEnd.toISOString()},deadline.is.null`)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) return DEMO_TASKS.slice(0, 2);
    return (data as Task[]).length > 0 ? (data as Task[]) : DEMO_TASKS.slice(0, 2);
  } catch {
    return DEMO_TASKS.slice(0, 2);
  }
}

export async function getAllTasks(): Promise<Task[]> {
  try {
    const { supabase, user } = await safeGetUser();
    if (!supabase || !user) return DEMO_TASKS;

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return DEMO_TASKS;
    return (data as Task[]).length > 0 ? (data as Task[]) : DEMO_TASKS;
  } catch {
    return DEMO_TASKS;
  }
}

export async function getTaskById(id: string): Promise<Task | null> {
  // Demo task
  const demoTask = DEMO_TASKS.find((t) => t.id === id);
  if (demoTask) return demoTask;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("tasks").select("*").eq("id", id).single();
    if (error) return null;
    return data as Task;
  } catch {
    return null;
  }
}

export async function getUrgentTasks(): Promise<Task[]> {
  try {
    const { supabase, user } = await safeGetUser();
    if (!supabase || !user) return DEMO_TASKS.filter((t) => t.priority === "urgent" || t.priority === "high");

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .in("priority", ["urgent", "high"])
      .neq("status", "done")
      .order("deadline", { ascending: true })
      .limit(5);

    return (data as Task[]) ?? DEMO_TASKS.filter((t) => t.priority === "urgent" || t.priority === "high");
  } catch {
    return DEMO_TASKS.filter((t) => t.priority === "urgent" || t.priority === "high");
  }
}

export async function getTaskStats(): Promise<{ today: number; urgent: number; done: number }> {
  try {
    const { supabase, user } = await safeGetUser();
    if (!supabase || !user) return { today: 3, urgent: 2, done: 1 };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todayResult, urgentResult, doneResult] = await Promise.all([
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("status", "done"),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id).in("priority", ["urgent", "high"]).neq("status", "done"),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "done").gte("updated_at", todayStart.toISOString()),
    ]);

    return {
      today: todayResult.count ?? 0,
      urgent: urgentResult.count ?? 0,
      done: doneResult.count ?? 0,
    };
  } catch {
    return { today: 3, urgent: 2, done: 1 };
  }
}

// ============================================================
// ROADMAP STEPS
// ============================================================

export async function getRoadmapStepsByTask(taskId: string): Promise<RoadmapStep[]> {
  // Demo steps untuk demo task
  if (taskId === "demo-1") return DEMO_STEPS;
  if (taskId.startsWith("demo-")) return [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("roadmap_steps")
      .select("*")
      .eq("task_id", taskId)
      .order("order", { ascending: true });

    return (data as RoadmapStep[]) ?? [];
  } catch {
    return [];
  }
}

export async function getLatestRoadmap(): Promise<{ task: Task; steps: RoadmapStep[] } | null> {
  try {
    const { supabase, user } = await safeGetUser();
    if (!supabase || !user) return { task: DEMO_TASKS[0], steps: DEMO_STEPS };

    const { data: task } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "in_progress")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (!task) return { task: DEMO_TASKS[0], steps: DEMO_STEPS };

    const steps = await getRoadmapStepsByTask(task.id);
    return { task: task as Task, steps };
  } catch {
    return { task: DEMO_TASKS[0], steps: DEMO_STEPS };
  }
}

// ============================================================
// CALENDAR EVENTS
// ============================================================

export async function getCalendarEvent(
  taskId: string
): Promise<{ task_id: string; google_event_id?: string; calendar_link?: string } | null> {
  if (taskId.startsWith("demo-")) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("calendar_events")
      .select("task_id, google_event_id, calendar_link")
      .eq("task_id", taskId)
      .single();
    return data ?? null;
  } catch {
    return null;
  }
}

export async function getTasksForCalendar(): Promise<Task[]> {
  try {
    const { supabase, user } = await safeGetUser();
    if (!supabase || !user) return DEMO_TASKS;

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .not("deadline", "is", null)
      .neq("status", "done")
      .order("deadline", { ascending: true })
      .limit(50);

    if (error) return DEMO_TASKS;
    return (data as Task[]).length > 0 ? (data as Task[]) : DEMO_TASKS;
  } catch {
    return DEMO_TASKS;
  }
}

// ============================================================
// REMINDERS
// ============================================================

export interface ReminderWithTask {
  id: string;
  task_id: string;
  message: string;
  remind_at: string;
  status: string;
  task_title?: string;
}

const DEMO_REMINDERS: ReminderWithTask[] = [
  {
    id: "rem-1",
    task_id: "demo-1",
    message: "Revisi Proposal Bisnis — deadline dalam 1 jam!",
    remind_at: new Date(Date.now() - 3600000).toISOString(), // 1 jam lalu (sudah aktif)
    status: "pending",
    task_title: "Revisi Proposal Bisnis",
  },
];

export async function getActiveReminders(): Promise<ReminderWithTask[]> {
  try {
    const { supabase, user } = await safeGetUser();
    if (!supabase || !user) return DEMO_REMINDERS;

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("reminders")
      .select("id, task_id, message, remind_at, status, tasks(title)")
      .eq("status", "pending")
      .lte("remind_at", now)
      .order("remind_at", { ascending: false })
      .limit(20);

    if (error || !data) return DEMO_REMINDERS;

    return data.map((r) => ({
      id: r.id,
      task_id: r.task_id,
      message: r.message,
      remind_at: r.remind_at,
      status: r.status,
      task_title: (r.tasks as { title?: string } | null)?.title,
    }));
  } catch {
    return DEMO_REMINDERS;
  }
}

export async function getReminderCount(): Promise<number> {
  try {
    const { supabase, user } = await safeGetUser();
    if (!supabase || !user) return DEMO_REMINDERS.length;

    const now = new Date().toISOString();
    const { count } = await supabase
      .from("reminders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lte("remind_at", now);

    return count ?? 0;
  } catch {
    return DEMO_REMINDERS.length;
  }
}

// ============================================================
// MUTATIONS
// ============================================================

export async function updateTaskStatus(taskId: string, status: Task["status"]): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("tasks")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", taskId);
    return !error;
  } catch {
    return false;
  }
}

export async function updateRoadmapStep(stepId: string, status: RoadmapStep["status"]): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("roadmap_steps")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", stepId);
    return !error;
  } catch {
    return false;
  }
}
