import BottomNav from "@/components/layout/BottomNav";
import TopBar from "@/components/layout/TopBar";
import Link from "next/link";
import { getTasksForCalendar } from "@/lib/supabase/queries";
import type { Task } from "@/lib/types";

// ── helpers ────────────────────────────────────────────────────
function getWeekDays(anchor: Date) {
  const dow = anchor.getDay(); // 0=Sun
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((dow + 6) % 7));

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function priorityColor(priority: string) {
  if (priority === "urgent") return "#ffb4ab";
  if (priority === "high")   return "#aef846";
  if (priority === "medium") return "#adc6ff";
  return "#c1cab0";
}

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

function TaskBlock({ task }: { task: Task }) {
  const color = priorityColor(task.priority);
  const deadline = task.deadline ? new Date(task.deadline) : null;
  const timeStr = deadline
    ? deadline.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : "";
  const dur = task.estimated_duration ?? 60;
  // Height proportional to duration (60min = 64px)
  const height = Math.max(48, Math.round((dur / 60) * 64));

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="absolute left-1 right-1 rounded-lg border overflow-hidden cursor-pointer hover:brightness-110 transition-all z-10"
      style={{
        borderColor: color + "40",
        backgroundColor: color + "15",
        height,
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: color }}
      />
      <div className="pl-3 pr-2 py-1.5">
        <p className="text-xs font-bold truncate" style={{ color }}>
          {task.title}
        </p>
        {timeStr && (
          <p className="text-[10px] text-[#c1cab0] mt-0.5">{timeStr}</p>
        )}
      </div>
    </Link>
  );
}

export default async function CalendarPage() {
  const tasks = await getTasksForCalendar();

  const today = new Date();
  const weekDays = getWeekDays(today);

  const monthLabel = today.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  // Group tasks by date and hour for timeline
  const tasksByDate = new Map<string, Task[]>();
  tasks.forEach((t) => {
    if (!t.deadline) return;
    const key = new Date(t.deadline).toDateString();
    if (!tasksByDate.has(key)) tasksByDate.set(key, []);
    tasksByDate.get(key)!.push(t);
  });

  // Tasks for selected day (today)
  const todayTasks = tasks.filter(
    (t) => t.deadline && sameDay(new Date(t.deadline), today)
  );
  const upcomingTasks = tasks
    .filter((t) => t.deadline && new Date(t.deadline) > today)
    .slice(0, 5);

  const nowHour = today.getHours();
  const nowMin = today.getMinutes();

  return (
    <div className="h-dvh bg-[#0d1322] flex flex-col overflow-hidden relative">
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, #424936 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <TopBar showNotification />

      <main className="flex-1 overflow-y-auto z-10 relative flex flex-col pb-28">
        {/* Header */}
        <div className="px-4 pt-6 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-[#ffffff] tracking-tight capitalize">
              {monthLabel}
            </h1>
            <p className="text-xs font-bold text-[#c1cab0] uppercase tracking-widest mt-1">
              {tasks.length} task dijadwalkan
            </p>
          </div>
          <Link
            href="/voice"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#aef846] text-[#112000] font-bold text-xs rounded-full shadow-[0_0_12px_rgba(174,248,70,0.3)] hover:scale-105 transition-all"
          >
            <span className="material-symbols-outlined text-sm">mic</span>
            Tambah Task
          </Link>
        </div>

        {/* Weekly Strip */}
        <div className="px-4 pb-4 flex justify-between items-center border-b border-[#424936]/40">
          {weekDays.map((d, i) => {
            const isToday = sameDay(d, today);
            const dayTasks = tasksByDate.get(d.toDateString()) ?? [];
            const hasEvent = dayTasks.length > 0;
            const isWeekend = i >= 5;

            return (
              <div
                key={i}
                className={`flex flex-col items-center gap-2 cursor-pointer ${isWeekend ? "opacity-40" : ""}`}
              >
                <span className={`text-xs font-bold uppercase ${isToday ? "text-[#ffffff]" : "text-[#c1cab0]"}`}>
                  {DAY_LABELS[i]}
                </span>
                <div
                  className={`w-10 h-10 rounded-full flex flex-col items-center justify-center transition-colors ${
                    isToday
                      ? "bg-[#aef846] text-[#112000] shadow-[0_0_12px_rgba(174,248,70,0.5)]"
                      : "text-[#dde2f8] hover:bg-[#191f2f]"
                  }`}
                >
                  <span className="text-sm font-semibold">{d.getDate()}</span>
                  {hasEvent && !isToday && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#aef846] shadow-[0_0_6px_rgba(174,248,70,0.8)] mt-0.5" />
                  )}
                  {isToday && hasEvent && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#112000] mt-0.5" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline for today */}
        <div className="px-4 py-4 flex flex-col">
          <p className="text-xs font-bold text-[#aef846] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              today
            </span>
            Jadwal Hari Ini
          </p>

          {todayTasks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-[#191f2f] border border-[#424936] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#c1cab0]">calendar_today</span>
              </div>
              <p className="text-sm text-[#c1cab0]">Tidak ada task hari ini</p>
              <Link
                href="/voice"
                className="text-xs font-bold text-[#aef846] hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">mic</span>
                Tambah via Voice AI
              </Link>
            </div>
          ) : (
            <div className="relative">
              {/* Current time indicator */}
              <div
                className="absolute w-full flex items-center z-20 pointer-events-none"
                style={{ top: `${Math.max(0, (nowHour - 7) * 64 + (nowMin / 60) * 64)}px` }}
              >
                <div className="w-14 flex justify-end pr-2">
                  <span className="text-xs font-bold text-[#aef846]">
                    {String(nowHour).padStart(2, "0")}:{String(nowMin).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex-1 h-px bg-[#aef846] shadow-[0_0_6px_rgba(174,248,70,0.6)] relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#aef846]" />
                </div>
              </div>

              {HOURS.map((h) => {
                const slotTasks = todayTasks.filter((t) => {
                  if (!t.deadline) return false;
                  const taskHour = new Date(t.deadline).getHours();
                  return taskHour === h;
                });

                return (
                  <div key={h} className="flex min-h-[64px] group">
                    <div className="w-14 text-right pr-4 pt-1 flex-shrink-0">
                      <span className="text-xs text-[#c1cab0]">
                        {String(h).padStart(2, "0")}:00
                      </span>
                    </div>
                    <div className="flex-1 border-t border-dashed border-[#424936]/30 relative mt-2.5 min-h-[56px]">
                      {slotTasks.map((t) => (
                        <TaskBlock key={t.id} task={t} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming tasks */}
        {upcomingTasks.length > 0 && (
          <div className="px-4 py-2">
            <p className="text-xs font-bold text-[#c1cab0] uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">upcoming</span>
              Mendatang
            </p>
            <div className="flex flex-col gap-2">
              {upcomingTasks.map((t) => {
                const color = priorityColor(t.priority);
                const dl = new Date(t.deadline!);
                return (
                  <Link
                    key={t.id}
                    href={`/tasks/${t.id}`}
                    className="flex items-center gap-3 bg-[#191f2f] rounded-xl p-3 border border-[#424936]/30 hover:bg-[#242a3a] transition-colors"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#dde2f8] truncate">{t.title}</p>
                      <p className="text-xs text-[#c1cab0]">
                        {dl.toLocaleDateString("id-ID", {
                          weekday: "short", day: "numeric", month: "short",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-[#c1cab0] text-sm">chevron_right</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* FAB */}
      <div className="fixed bottom-[88px] right-4 z-40">
        <Link
          href="/voice"
          className="bg-[#aef846] text-[#112000] w-14 h-14 rounded-full font-bold flex items-center justify-center shadow-[0_0_20px_rgba(174,248,70,0.3)] hover:shadow-[0_0_30px_rgba(174,248,70,0.5)] hover:scale-110 transition-all"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
