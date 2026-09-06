import BottomNav from "@/components/layout/BottomNav";
import ReminderBell from "@/components/layout/ReminderBell";
import Link from "next/link";
import {
  getAuthUser,
  getTaskStats,
  getUrgentTasks,
} from "@/lib/supabase/queries";
import { generateBriefingContent } from "@/lib/ai/gemini";

export const dynamic = "force-dynamic";

export default async function BriefingPage() {
  const [user, stats, urgentTasks] = await Promise.all([
    getAuthUser(),
    getTaskStats(),
    getUrgentTasks(),
  ]);

  const displayName =
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.user_metadata?.name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "there";

  const todayLabel = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Satu Gemini call untuk semua teks briefing
  const briefing = await generateBriefingContent({
    name: displayName,
    totalTasks: stats.today,
    urgentCount: stats.urgent,
    doneCount: stats.done,
    topTask: urgentTasks[0]?.title,
  });

  return (
    <div className="min-h-dvh bg-[#0d1322] relative overflow-x-hidden">
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(#2f3445 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Header */}
      <header className="bg-[#0d1322] border-b border-[#424936] relative z-20">
        <div className="flex justify-between items-center w-full px-4 h-16 max-w-2xl mx-auto">
          <Link
            href="/dashboard"
            className="w-10 h-10 flex items-center justify-center text-[#c1cab0] hover:text-[#aef846] rounded-full hover:bg-[#2f3445] transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="font-extrabold text-[#ffffff] tracking-tighter uppercase">
            LIFEPILOT AI
          </h1>
          <ReminderBell />
        </div>
      </header>

      <main className="relative z-10 w-full max-w-2xl mx-auto px-4 md:px-12 pt-8 pb-32 flex flex-col gap-6">
        {/* Title */}
        <header className="flex flex-col gap-2">
          <p
            className="text-xs font-bold text-[#aef846] uppercase tracking-widest"
            style={{ filter: "drop-shadow(0 0 8px rgba(174,248,70,0.5))" }}
          >
            {todayLabel}
          </p>
          <h2 className="text-3xl font-extrabold text-[#ffffff] tracking-tight">
            AI Daily Briefing
          </h2>
        </header>

        {/* AI Greeting — now fully AI-generated */}
        <section className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="relative w-8 h-8 shrink-0 flex items-center justify-center mt-1">
              <div className="absolute inset-0 bg-[#aef846] rounded-full opacity-40 animate-pulse-ring" />
              <div className="w-3 h-3 bg-[#aef846] rounded-full neon-glow z-10" />
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-2xl font-bold text-[#ffffff]">
                What&apos;s good, {displayName}.
              </h3>
              <p className="text-base text-[#c1cab0] leading-relaxed">
                {briefing.greeting}
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3">
          {[
            {
              icon: "task_alt",
              value: String(stats.today),
              label: "Tasks Aktif",
              color: "text-[#aef846]",
              borderColor: "border-[#aef846]/30",
              bg: "bg-[#aef846]/5",
            },
            {
              icon: "priority_high",
              value: String(stats.urgent),
              label: "Urgent",
              color: "text-[#ffb4ab]",
              borderColor: "border-[#ffb4ab]/50",
              bg: "bg-[#ffb4ab]/5",
              topBar: true,
            },
            {
              icon: "check_circle",
              value: String(stats.done),
              label: "Selesai",
              color: "text-[#c1cab0]",
              borderColor: "border-[#424936]",
              bg: "bg-[#191f2f]",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.bg} border-2 ${stat.borderColor} rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.5)] relative overflow-hidden`}
            >
              {stat.topBar && (
                <div className="absolute top-0 left-0 w-full h-1 bg-[#ffb4ab]" />
              )}
              <span
                className={`material-symbols-outlined ${stat.color}`}
                style={{
                  fontVariationSettings: "'FILL' 1",
                  filter:
                    stat.color === "text-[#aef846]"
                      ? "drop-shadow(0 0 8px rgba(174,248,70,0.5))"
                      : undefined,
                }}
              >
                {stat.icon}
              </span>
              <span className={`text-2xl font-bold tabular-nums ${stat.color}`}>
                {stat.value}
              </span>
              <span className="text-xs font-bold text-[#dde2f8] uppercase text-center">
                {stat.label}
              </span>
            </div>
          ))}
        </section>

        {/* Focus Recommendation — AI-generated text */}
        <section className="flex flex-col gap-3">
          <h3
            className="text-xs font-bold text-[#aef846] uppercase tracking-widest flex items-center gap-2"
            style={{ filter: "drop-shadow(0 0 8px rgba(174,248,70,0.3))" }}
          >
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              adjust
            </span>
            Fokus Utama
          </h3>
          <div className="bg-[#191f2f] border border-[#aef846]/50 rounded-xl p-5 neon-glow relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#aef846] shadow-[0_0_10px_rgba(174,248,70,0.8)]" />
            <div className="flex flex-col gap-2 pl-3">
              {urgentTasks[0] && (
                <Link
                  href={`/tasks/${urgentTasks[0].id}`}
                  className="text-sm font-bold text-[#ffffff] hover:text-[#aef846] transition-colors line-clamp-1"
                >
                  {urgentTasks[0].title}
                </Link>
              )}
              <p className="text-sm text-[#c1cab0]">{briefing.focus_text}</p>
            </div>
          </div>
        </section>

        {/* Warnings — data-driven */}
        {urgentTasks.length > 0 && (
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[#c1cab0] uppercase tracking-widest flex items-center gap-2">
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
              Perlu Perhatian
            </h3>
            <div className="flex flex-col gap-3">
              {urgentTasks.slice(0, 3).map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="bg-[#191f2f] border border-[#ffb4ab]/30 rounded-xl p-5 relative overflow-hidden hover:border-[#ffb4ab]/60 transition-colors block"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#ffb4ab]" />
                  <div className="flex items-start gap-3 pl-2">
                    <span
                      className="material-symbols-outlined text-[#ffb4ab] mt-0.5 shrink-0"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      schedule
                    </span>
                    <div className="flex flex-col gap-1 min-w-0">
                      <h4 className="text-sm font-semibold text-[#ffffff] truncate">
                        {task.title}
                      </h4>
                      <p className="text-sm text-[#c1cab0]">
                        {task.priority === "urgent"
                          ? "Urgent — perlu dikerjakan hari ini."
                          : "Prioritas tinggi — jangan dibiarkan slip."}
                        {task.deadline &&
                          ` Deadline: ${new Date(task.deadline).toLocaleDateString("id-ID", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}.`}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Productivity Insight — AI-generated */}
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-[#c1cab0] uppercase tracking-widest flex items-center gap-2">
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              lightbulb
            </span>
            Insight Hari Ini
          </h3>
          <div className="bg-[#191f2f] border border-[#424936] rounded-xl p-5">
            <div className="flex items-start gap-3">
              <span
                className="material-symbols-outlined text-[#aef846] shrink-0 mt-0.5"
                style={{ fontVariationSettings: "'FILL' 1", fontSize: "18px" }}
              >
                format_quote
              </span>
              <p className="text-sm text-[#dde2f8] italic leading-relaxed">
                {briefing.insight}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[#0d1322] via-[#0d1322]/90 to-transparent z-30 pb-safe pb-8">
        <div className="max-w-2xl mx-auto flex justify-center">
          <Link
            href="/dashboard"
            className="w-full md:w-auto md:min-w-[300px] bg-[#aef846] text-[#112000] font-bold text-lg py-4 px-8 rounded-full flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(174,248,70,0.3)] hover:shadow-[0_0_35px_rgba(174,248,70,0.5)]"
          >
            Let&apos;s start ✦
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
