import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
import TopBar from "@/components/layout/TopBar";
import { getAllTasks } from "@/lib/supabase/queries";
import type { Task } from "@/lib/types";

// ── helpers ────────────────────────────────────────────────────
function formatDeadline(deadline?: string | null): string {
  if (!deadline) return "";
  const d = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor(
    (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("id-ID", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function deadlineColor(deadline?: string | null): string {
  if (!deadline) return "text-[#c1cab0]";
  const d = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor(
    (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return "text-[#ffb4ab]";
  if (diff === 0) return "text-[#aef846]";
  return "text-[#c1cab0]";
}

// ── static fallback ─────────────────────────────────────────────
const FALLBACK_TASKS: Task[] = [
  {
    id: "demo-1",
    user_id: "",
    title: "Revisi proposal bisnis",
    category: "Marketing",
    priority: "high",
    status: "in_progress",
    deadline: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    user_id: "",
    title: "Booking tiket flight",
    category: "Development",
    priority: "urgent",
    status: "pending",
    deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-3",
    user_id: "",
    title: "Update portofolio",
    category: "General",
    priority: "low",
    status: "pending",
    deadline: new Date(Date.now() + 4 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-4",
    user_id: "",
    title: "Review Q3 Report",
    category: "Management",
    priority: "medium",
    status: "done",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const filters = ["All", "Today", "Urgent", "Done"];

export default async function TasksPage() {
  const rawTasks = await getAllTasks();
  const tasks: Task[] = rawTasks.length > 0 ? rawTasks : FALLBACK_TASKS;

  return (
    <div
      className="min-h-dvh text-[#dde2f8] pb-24 md:pb-8"
      style={{
        backgroundColor: "#0B1120",
        backgroundImage:
          "radial-gradient(circle at 1px 1px, #1E2F4D 1px, transparent 0)",
        backgroundSize: "24px 24px",
      }}
    >
      <TopBar title="My Tasks" showNotification />

      {/* Desktop Side Nav */}
      <aside className="hidden md:flex flex-col w-64 bg-[#191f2f] border-r border-[#424936] h-screen fixed top-0 left-0 pt-16 z-30">
        <nav className="flex-1 py-6 px-4 space-y-2">
          {[
            { href: "/dashboard", icon: "home", label: "Home", active: false },
            { href: "/tasks", icon: "task_alt", label: "Tasks", active: true },
            { href: "/voice", icon: "mic", label: "Voice AI", active: false },
            { href: "/calendar", icon: "calendar_month", label: "Calendar", active: false },
            { href: "/profile", icon: "person", label: "Profile", active: false },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                item.active
                  ? "text-[#aef846] bg-[#2f3445] relative pl-4"
                  : "text-[#c1cab0] hover:text-[#dde2f8] hover:bg-[#2f3445]"
              }`}
            >
              {item.active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#aef846] rounded-r-full" />
              )}
              <span
                className="material-symbols-outlined"
                style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-sm font-semibold">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 md:ml-64 pt-4 px-4 md:px-12 md:pt-8 w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-[#ffffff] mb-1 tracking-tight">
              My Tasks
            </h2>
            <p className="text-sm text-[#c1cab0]">
              {rawTasks.length > 0
                ? `${rawTasks.length} task${rawTasks.length !== 1 ? "s" : ""} total`
                : "Stay on top of your workflow."}
            </p>
          </div>

          {/* Filters (visual — full interactivity in Day 5+) */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {filters.map((f, i) => (
              <button
                key={f}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  i === 0
                    ? "bg-[#aef846] text-[#112000] shadow-[0_0_15px_rgba(174,248,70,0.4)] border border-[#aef846]"
                    : "border border-[#424936] text-[#c1cab0] hover:bg-[#2f3445]"
                }`}
              >
                {f === "Urgent" && (
                  <span className="inline-block w-2 h-2 rounded-full bg-[#ffb4ab] mr-1.5" />
                )}
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <span
                className="material-symbols-outlined text-5xl text-[#aef846]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                task_alt
              </span>
              <p className="text-lg font-bold text-[#ffffff]">All clear!</p>
              <p className="text-sm text-[#c1cab0]">
                Tap the mic to add your first task with AI.
              </p>
            </div>
          ) : (
            tasks.map((task) => {
              const isDone = task.status === "done";
              const isUrgent =
                task.priority === "urgent" || task.priority === "high";
              const dl = formatDeadline(task.deadline);
              const dlColor = deadlineColor(task.deadline);

              return (
                <Link key={task.id} href={`/tasks/${task.id}`}>
                  <div
                    className={`rounded-xl p-4 flex items-start gap-4 cursor-pointer transition-colors border-t ${
                      isDone
                        ? "bg-[#151b2b] border-[#1E2F4D] opacity-60"
                        : "bg-[#111D30] border-[#1E2F4D] hover:bg-[#2f3445]"
                    } relative overflow-hidden`}
                  >
                    {isUrgent && !isDone && (
                      <div className="absolute right-0 top-0 w-1 bg-[#aef846] h-full shadow-[0_0_10px_rgba(174,248,70,0.4)]" />
                    )}

                    {/* Checkbox */}
                    <div className="pt-1">
                      <div
                        className={`w-6 h-6 rounded-xl flex items-center justify-center border-2 transition-all ${
                          isDone
                            ? "bg-[#aef846] border-[#aef846] shadow-[0_0_10px_rgba(174,248,70,0.4)]"
                            : "border-[#424936]"
                        }`}
                      >
                        {isDone && (
                          <span className="material-symbols-outlined text-[#112000] text-sm">
                            check
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3
                        className={`text-lg font-bold mb-2 ${
                          isDone
                            ? "text-[#c1cab0] line-through"
                            : "text-[#ffffff]"
                        }`}
                      >
                        {task.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        {task.category && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-semibold border bg-[#33394a] text-[#dde2f8] border-[#424936]">
                            {task.category}
                          </span>
                        )}
                        {dl && (
                          <div className={`flex items-center gap-1 text-xs ${dlColor}`}>
                            <span className="material-symbols-outlined text-sm">
                              schedule
                            </span>
                            {dl}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-[#c1cab0]">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              task.priority === "urgent"
                                ? "bg-[#ffb4ab] shadow-[0_0_6px_rgba(255,180,171,0.5)]"
                                : task.priority === "high"
                                ? "bg-[#aef846] shadow-[0_0_6px_rgba(174,248,70,0.5)]"
                                : "bg-[#424936]"
                            }`}
                          />
                          {task.priority.charAt(0).toUpperCase() +
                            task.priority.slice(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </main>

      {/* FAB */}
      <Link
        href="/voice"
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-[#aef846] rounded-full shadow-[0_0_20px_rgba(174,248,70,0.4)] flex items-center justify-center hover:scale-110 transition-transform z-50 text-[#112000]"
      >
        <span className="material-symbols-outlined text-3xl">mic</span>
      </Link>

      <BottomNav />
    </div>
  );
}
