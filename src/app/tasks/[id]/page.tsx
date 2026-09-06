import BottomNav from "@/components/layout/BottomNav";
import RoadmapSteps from "@/components/tasks/RoadmapSteps";
import CalendarSyncButton from "@/components/tasks/CalendarSyncButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTaskById, getRoadmapStepsByTask, getCalendarEvent } from "@/lib/supabase/queries";

// ── helpers ────────────────────────────────────────────────────
function formatDeadline(deadline?: string | null): string {
  if (!deadline) return "Tidak ada deadline";
  const d = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `Overdue (${d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })})`;
  if (diff === 0) return `Hari ini, ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
  if (diff === 1) return `Besok, ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

function statusConfig(status: string) {
  switch (status) {
    case "in_progress": return { label: "In Progress", color: "text-[#aef846]", border: "border-[#aef846]/30", dot: "bg-[#aef846] animate-pulse" };
    case "done":        return { label: "Selesai", color: "text-[#c1cab0]", border: "border-[#c1cab0]/30", dot: "bg-[#c1cab0]" };
    case "overdue":     return { label: "Overdue", color: "text-[#ffb4ab]", border: "border-[#ffb4ab]/30", dot: "bg-[#ffb4ab] animate-pulse" };
    default:            return { label: "Pending", color: "text-[#c1cab0]", border: "border-[#424936]", dot: "bg-[#424936]" };
  }
}

function priorityConfig(priority: string) {
  switch (priority) {
    case "urgent": return { label: "Urgent", color: "text-[#ffb4ab]" };
    case "high":   return { label: "High Priority", color: "text-[#aef846]" };
    case "medium": return { label: "Medium Priority", color: "text-[#adc6ff]" };
    default:       return { label: "Low Priority", color: "text-[#c1cab0]" };
  }
}

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;

  // Demo task IDs — skip DB fetch
  if (id.startsWith("demo-")) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0d1322] px-4">
        <div className="text-center">
          <p className="text-[#c1cab0] mb-4">Demo task tidak bisa dibuka secara langsung.</p>
          <Link href="/tasks" className="text-[#aef846] font-bold">← Kembali ke Tasks</Link>
        </div>
      </div>
    );
  }

  const [task, steps, calEvent] = await Promise.all([
    getTaskById(id),
    getRoadmapStepsByTask(id),
    getCalendarEvent(id),
  ]);

  if (!task) notFound();

  const status = statusConfig(task.status);
  const priority = priorityConfig(task.priority);
  const doneSteps = steps.filter((s) => s.status === "done").length;

  return (
    <div
      className="min-h-dvh text-[#dde2f8] pb-32 flex flex-col"
      style={{
        backgroundColor: "#0d1322",
        backgroundImage: "radial-gradient(circle, #2f3445 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* Header */}
      <header className="flex justify-between items-center w-full px-4 h-16 bg-[#0d1322]/90 backdrop-blur-md border-b border-[#424936]/30 sticky top-0 z-50">
        <Link
          href="/tasks"
          className="w-10 h-10 flex items-center justify-center text-[#dde2f8] hover:text-[#aef846] hover:bg-[#2f3445] rounded-full transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-sm font-bold text-[#ffffff] uppercase tracking-widest">
          Task Detail
        </h1>
        <button className="w-10 h-10 flex items-center justify-center text-[#aef846] hover:bg-[#2f3445] rounded-full transition-colors">
          <span className="material-symbols-outlined">edit</span>
        </button>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto">

        {/* ── Title & Status ── */}
        <section className="px-4 py-6">
          <div className="flex justify-between items-start gap-4 mb-5">
            <h2 className="text-2xl font-extrabold text-[#ffffff] tracking-tight flex-1 leading-tight">
              {task.title}
            </h2>
            <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#191f2f] border ${status.border} rounded-full`}>
              <span className={`w-2 h-2 rounded-full ${status.dot}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${status.color}`}>
                {status.label}
              </span>
            </div>
          </div>

          {task.description && (
            <p className="text-sm text-[#c1cab0] leading-relaxed mb-5">
              {task.description}
            </p>
          )}

          {/* Info chips */}
          <div className="flex flex-wrap gap-2">
            {task.category && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#242a3a] rounded-full border border-[#424936]/50">
                <span className="material-symbols-outlined text-sm text-[#c1cab0]">folder_open</span>
                <span className="text-xs font-semibold text-[#dde2f8]">{task.category}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#242a3a] rounded-full border border-[#424936]/50">
              <span className={`material-symbols-outlined text-sm ${priority.color}`}>priority_high</span>
              <span className="text-xs font-semibold text-[#dde2f8]">{priority.label}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#242a3a] rounded-full border border-[#424936]/50">
              <span className="material-symbols-outlined text-sm text-[#c1cab0]">schedule</span>
              <span className="text-xs font-semibold text-[#dde2f8]">{formatDeadline(task.deadline)}</span>
            </div>
            {task.estimated_duration && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#242a3a] rounded-full border border-[#424936]/50">
                <span className="material-symbols-outlined text-sm text-[#c1cab0]">timer</span>
                <span className="text-xs font-semibold text-[#dde2f8]">{task.estimated_duration} menit</span>
              </div>
            )}
            {steps.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#aef846]/10 rounded-full border border-[#aef846]/30">
                <span className="material-symbols-outlined text-sm text-[#aef846]">route</span>
                <span className="text-xs font-bold text-[#aef846]">
                  {doneSteps}/{steps.length} langkah
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ── AI Roadmap section ── */}
        <section className="px-4 py-4">
          <div className="flex items-center gap-2 mb-5">
            <div className="relative w-6 h-6 flex items-center justify-center">
              <span className="absolute inset-0 bg-[#aef846]/20 rounded-full animate-pulse" />
              <span
                className="material-symbols-outlined text-[#aef846] text-base z-10"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                smart_toy
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#ffffff] uppercase tracking-widest">
              AI Roadmap
            </h3>
            <span className="text-xs text-[#c1cab0] bg-[#191f2f] border border-[#424936] px-2 py-0.5 rounded-full ml-1">
              Step-by-step guide
            </span>
          </div>

          <div className="bg-[#111D30] border border-[#1E2F4D] rounded-2xl p-5">
            <RoadmapSteps steps={steps} task={task} />
          </div>
        </section>

        {/* ── Integrations ── */}
        <section className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Telegram */}
          <div className="bg-[#191f2f] rounded-xl p-4 border border-[#424936]/30 flex items-center justify-between hover:bg-[#242a3a] transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0088cc]/10 flex items-center justify-center border border-[#0088cc]/30">
                <span className="material-symbols-outlined text-[#0088cc] text-lg">send</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#dde2f8]">Telegram</p>
                <p className="text-xs text-[#c1cab0]">Reminder otomatis</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#aef846] uppercase">Active</span>
          </div>

          {/* Calendar */}
          <CalendarSyncButton
            taskId={task.id}
            deadline={task.deadline}
            existingLink={calEvent?.calendar_link ?? null}
          />
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
