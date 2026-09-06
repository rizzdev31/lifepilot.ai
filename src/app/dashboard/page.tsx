import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
import TopBar from "@/components/layout/TopBar";
import {
  getAuthUser,
  getTodayTasks,
  getUrgentTasks,
  getLatestRoadmap,
  getTaskStats,
} from "@/lib/supabase/queries";
// ── helpers ────────────────────────────────────────────────
function formatDeadline(deadline?: string | null): string {
  if (!deadline) return "";
  const d = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
}

function categoryIcon(cat?: string | null) {
  const map: Record<string, string> = {
    Business: "business_center", Personal: "person", Work: "work",
    Health: "favorite", Finance: "payments", Content: "edit_note",
    Learning: "school", Shopping: "shopping_bag", Travel: "flight", General: "task_alt",
  };
  return map[cat ?? ""] ?? "task_alt";
}

function priorityAccent(priority: string) {
  if (priority === "urgent") return { border: "border-t-[#ffb4ab]", badge: "bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/25", icon: "text-[#ffb4ab]", dot: "bg-[#ffb4ab] shadow-[0_0_6px_rgba(255,180,171,0.8)]" };
  if (priority === "high")   return { border: "border-t-[#aef846]", badge: "bg-[#aef846]/10 text-[#aef846] border-[#aef846]/25", icon: "text-[#aef846]", dot: "bg-[#aef846] shadow-[0_0_6px_rgba(174,248,70,0.8)]" };
  if (priority === "medium") return { border: "border-t-[#adc6ff]", badge: "bg-[#adc6ff]/10 text-[#adc6ff] border-[#adc6ff]/25", icon: "text-[#adc6ff]", dot: "bg-[#adc6ff] shadow-[0_0_6px_rgba(173,198,255,0.7)]" };
  return { border: "border-t-[#424936]", badge: "bg-[#2f3445] text-[#c1cab0] border-[#424936]", icon: "text-[#c1cab0]", dot: "bg-[#424936]" };
}



// ── page ───────────────────────────────────────────────────
export default async function DashboardPage() {
  const [user, todayTasks, urgentTasks, roadmap, stats] = await Promise.all([
    getAuthUser(),
    getTodayTasks(),
    getUrgentTasks(),
    getLatestRoadmap(),
    getTaskStats(),
  ]);

  const displayName =
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.user_metadata?.name?.split(" ")[0] ??
    user?.email?.split("@")[0] ?? "there";

  const avatarUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture;

  const displayTasks = todayTasks.slice(0, 4);
  const displayUrgent = urgentTasks.slice(0, 3).map((t) => ({
    id: t.id, title: t.title,
    meta: `${t.category ?? "General"} • Due ${formatDeadline(t.deadline)}`,
    priority: t.priority,
  }));

  const hour = new Date().getHours();
  const greetingWord = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const doneSteps = roadmap?.steps.filter(s => s.status === "done").length ?? 0;
  const totalSteps = roadmap?.steps.length ?? 0;
  const roadmapPct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  return (
    <div className="min-h-dvh bg-[#0d1322] dot-grid pb-24 md:pb-0 md:pl-20">

      {/* ── Mobile TopBar ── */}
      <div className="md:hidden">
        <TopBar greeting={greetingWord} userName={displayName} avatarUrl={avatarUrl} showNotification />
      </div>

      {/* ── Desktop Header ── */}
      <div className="hidden md:flex justify-between items-end px-12 pt-10 pb-6 max-w-6xl mx-auto">
        <div>
          <p className="text-3xl font-extrabold text-[#ffffff] tracking-tighter">
            {greetingWord}, {displayName} ☀
          </p>
          <p className="text-[#c1cab0] mt-1">Here is your digital briefing for today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-11 h-11 flex items-center justify-center rounded-full bg-[#191f2f] border border-[#424936] text-[#c1cab0] hover:text-[#dde2f8] transition-colors">
            <span className="material-symbols-outlined">search</span>
          </button>
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-11 h-11 rounded-full object-cover border-2 border-[#424936]" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-[#2f3445] flex items-center justify-center border-2 border-[#424936]">
              <span className="material-symbols-outlined text-[#c1cab0]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop Side Nav ── */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-[#191f2f] border-r border-[#424936] flex-col items-center py-8 z-50">
        <div className="w-10 h-10 bg-[#aef846] rounded-xl flex items-center justify-center text-[#112000] font-extrabold mb-12 shadow-[0_0_15px_rgba(174,248,70,0.4)] text-sm">
          LP
        </div>
        <div className="flex flex-col gap-6 flex-grow">
          {[
            { href: "/dashboard", icon: "home", active: true },
            { href: "/tasks", icon: "task_alt", active: false },
            { href: "/calendar", icon: "calendar_month", active: false },
            { href: "/briefing", icon: "bolt", active: false },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${
                item.active ? "bg-[#2f3445] text-[#aef846] shadow-[inset_0_0_0_1px_#aef846]"
                : "text-[#c1cab0] hover:bg-[#242a3a] hover:text-[#dde2f8]"
              }`}>
              <span className="material-symbols-outlined" style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                {item.icon}
              </span>
            </Link>
          ))}
        </div>
        <Link href="/voice" className="w-12 h-12 rounded-full bg-[#aef846] text-[#112000] flex items-center justify-center hover:scale-105 transition-transform animate-mic-pulse">
          <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
        </Link>
      </nav>

      {/* ── Main Content ── */}
      <main className="px-4 pt-4 pb-8 max-w-6xl mx-auto w-full md:px-12 md:pt-0">

        {/* ── STATS ROW (upgrade dari versi baru) ── */}
        <section className="mb-5 grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-[#aef846]/12 to-[#aef846]/4 border border-[#aef846]/20 rounded-xl p-3.5">
            <span className="text-2xl font-black text-[#aef846] tabular-nums leading-none block">{stats.today}</span>
            <span className="text-[10px] text-[#8c947c] font-bold uppercase tracking-wider mt-1.5 block">Aktif</span>
          </div>
          <div className="bg-gradient-to-br from-[#ffb4ab]/12 to-[#ffb4ab]/4 border border-[#ffb4ab]/20 rounded-xl p-3.5">
            <span className="text-2xl font-black text-[#ffb4ab] tabular-nums leading-none block">{stats.urgent}</span>
            <span className="text-[10px] text-[#8c947c] font-bold uppercase tracking-wider mt-1.5 block">Urgent</span>
          </div>
          <div className="bg-gradient-to-br from-white/6 to-white/2 border border-white/8 rounded-xl p-3.5">
            <span className="text-2xl font-black text-white tabular-nums leading-none block">{stats.done}</span>
            <span className="text-[10px] text-[#8c947c] font-bold uppercase tracking-wider mt-1.5 block">Selesai</span>
          </div>
        </section>

        {/* ── AI BRIEFING CARD (original style, dipertahankan) ── */}
        <section className="mb-8">
          <div className="bg-[#111D30] rounded-xl border-l-4 border-l-[#aef846] border border-[#1E2F4D] p-5 neon-glow relative overflow-hidden flex flex-col md:flex-row gap-4 md:items-center">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#aef846] rounded-full opacity-5 blur-3xl mix-blend-screen pointer-events-none" />
            <div className="flex items-start gap-4 flex-grow z-10">
              <div className="w-12 h-12 rounded-full bg-[#152240] border border-[#1E2F4D] flex items-center justify-center flex-shrink-0 relative neon-glow">
                <span className="material-symbols-outlined text-[#aef846] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#aef846] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#aef846]" />
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#aef846] uppercase tracking-wider mb-1" style={{ textShadow: "0 0 8px rgba(174,248,70,0.5)" }}>
                  AI Briefing
                </p>
                <p className="text-base text-[#dde2f8] leading-relaxed">
                  {stats.today > 0 ? (
                    <>
                      You have <span className="text-[#ffffff] font-bold">{stats.today} task{stats.today !== 1 ? "s" : ""}</span> today.{" "}
                      {stats.urgent > 0 && <><span className="text-[#aef846] font-semibold">{stats.urgent} urgent</span> {stats.urgent === 1 ? "item needs" : "items need"} your attention.{" "}</>}
                      Stay focused and crush your goals!
                    </>
                  ) : (
                    <>Welcome back, <span className="text-[#ffffff] font-bold">{displayName}</span>! 🎯 Start by tapping the mic to add your first tasks with AI.</>
                  )}
                </p>
              </div>
            </div>
            <Link href="/briefing" className="z-10 text-sm font-semibold text-[#aef846] hover:text-white transition-colors flex items-center gap-1 group shrink-0">
              Read More
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="md:col-span-8 flex flex-col gap-8">

            {/* TODAY'S FOCUS — task cards upgraded dengan icon + status chip */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#ffffff]">Today&apos;s Focus</h3>
                <Link href="/tasks" className="text-sm font-semibold text-[#c1cab0] hover:text-[#ffffff] transition-colors flex items-center gap-0.5">
                  View All
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </Link>
              </div>
              {displayTasks.length === 0 ? (
                <Link href="/voice">
                  <div className="bg-[#111D30] border border-dashed border-[#aef846]/30 rounded-xl p-8 flex flex-col items-center gap-3 hover:bg-[#152240] hover:border-[#aef846]/60 transition-all cursor-pointer text-center">
                    <div className="w-14 h-14 rounded-full bg-[#aef846]/10 border border-[#aef846]/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#aef846] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
                    </div>
                    <div>
                      <p className="text-base font-bold text-[#ffffff]">Belum ada task hari ini</p>
                      <p className="text-sm text-[#8c947c] mt-1">Tap untuk tambah task via Voice AI</p>
                    </div>
                    <span className="text-xs font-bold text-[#aef846] bg-[#aef846]/10 border border-[#aef846]/20 px-3 py-1 rounded-full">
                      Coba sekarang →
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayTasks.map((task) => {
                    const accent = priorityAccent(task.priority);
                    return (
                      <Link key={task.id} href={`/tasks/${task.id}`}>
                        <div className={`bg-[#111D30] rounded-xl border border-[#1E2F4D] border-t-2 ${accent.border} p-5 h-full flex flex-col hover:bg-[#152240] hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] active:scale-[0.99] transition-all cursor-pointer`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent.badge} border`}>
                              <span className={`material-symbols-outlined text-base ${accent.icon}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                {categoryIcon(task.category)}
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                              task.status === "in_progress"
                                ? "bg-[#aef846]/10 text-[#aef846] border-[#aef846]/20"
                                : "bg-[#2f3445] text-[#8c947c] border-[#424936]/50"
                            }`}>
                              {task.status === "in_progress" ? "Active" : "Pending"}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border w-fit mb-2 ${accent.badge}`}>
                            {task.category ?? task.priority}
                          </span>
                          <h4 className="text-base font-bold text-[#ffffff] mb-1 leading-snug">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-[#c1cab0] flex-grow line-clamp-2 leading-relaxed">{task.description}</p>
                          )}
                          <div className="mt-3 flex items-center justify-between">
                            {task.deadline ? (
                              <p className={`text-xs flex items-center gap-1 font-medium ${
                                formatDeadline(task.deadline) === "Overdue" ? "text-[#ffb4ab]" :
                                formatDeadline(task.deadline) === "Today" ? "text-[#aef846]" : "text-[#c1cab0]"
                              }`}>
                                <span className="material-symbols-outlined text-sm">schedule</span>
                                {formatDeadline(task.deadline)}
                              </p>
                            ) : <span />}
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${accent.dot}`} />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* URGENT ACTIONS — upgraded dengan warning icon + colored border */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-[#ffffff]">Urgent Actions</h3>
                  {displayUrgent.length > 0 && (
                    <span className="text-xs font-bold text-[#ffb4ab] bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 px-2 py-0.5 rounded-full">
                      {displayUrgent.length}
                    </span>
                  )}
                </div>
                <Link href="/tasks" className="text-sm font-semibold text-[#c1cab0] hover:text-[#ffffff] transition-colors">View All</Link>
              </div>
              <div className="bg-[#111D30] rounded-xl border border-[#1E2F4D] overflow-hidden">
                {displayUrgent.length > 0 ? (
                  <ul className="divide-y divide-[#1E2F4D]">
                    {displayUrgent.map((task) => (
                      <li key={task.id}>
                        <Link href={`/tasks/${task.id}`}>
                          <div className="p-4 hover:bg-[#152240] transition-colors flex items-center gap-4 cursor-pointer group">
                            <span className="material-symbols-outlined text-[#ffb4ab] text-base flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                              warning
                            </span>
                            <div className="flex-grow min-w-0">
                              <p className="text-sm font-bold text-[#ffffff] truncate">{task.title}</p>
                              <p className="text-xs text-[#c1cab0] mt-0.5">{task.meta}</p>
                            </div>
                            <span className="material-symbols-outlined text-[#424936] group-hover:text-[#aef846] transition-colors flex-shrink-0">
                              arrow_forward
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-[#c1cab0] text-sm">No urgent tasks 🎉</div>
                )}
              </div>
            </section>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="md:col-span-4 flex flex-col gap-8">

            {/* ROADMAP — original layout + progress bar upgrade */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#ffffff]">
                  {roadmap ? "Active Roadmap" : "Project Roadmap"}
                </h3>
                {roadmap && (
                  <Link href={`/tasks/${roadmap.task.id}`} className="text-xs font-semibold text-[#c1cab0] hover:text-[#adc6ff] transition-colors">
                    Detail →
                  </Link>
                )}
              </div>

              <div className="bg-[#111D30] rounded-xl border border-[#1E2F4D] p-5 relative">
                {/* Roadmap task title + progress bar (upgrade dari versi baru) */}
                {roadmap && totalSteps > 0 && (
                  <div className="mb-5 pb-4 border-b border-[#1E2F4D]">
                    <p className="text-xs font-bold text-[#adc6ff] uppercase tracking-widest mb-1">
                      {roadmap.task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-[#1e2f4d] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#adc6ff] to-[#0566d9] transition-all duration-700"
                          style={{ width: `${roadmapPct}%`, boxShadow: "0 0 6px rgba(173,198,255,0.5)" }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-[#adc6ff] tabular-nums">{roadmapPct}%</span>
                    </div>
                  </div>
                )}

                {/* Vertical connector line (original) */}
                <div className="absolute left-[35px] top-[calc(theme(spacing.5)+4.5rem)] bottom-5 w-px bg-[#1E2F4D]" style={{ top: roadmap && totalSteps > 0 ? "8.5rem" : "1.25rem" }} />

                <div className="flex flex-col gap-5">
                  {roadmap && roadmap.steps.length > 0 ? (
                    roadmap.steps.map((step, i) => (
                      <div key={step.id} className="flex gap-4 relative z-10">
                        {step.status === "done" ? (
                          <div className="w-8 h-8 rounded-full bg-[#aef846] text-[#112000] flex items-center justify-center flex-shrink-0 border-4 border-[#111D30] shadow-[0_0_12px_rgba(174,248,70,0.5)]">
                            <span className="material-symbols-outlined text-sm font-bold">check</span>
                          </div>
                        ) : step.status === "in_progress" ? (
                          <div className="w-8 h-8 rounded-full bg-[#152240] border-2 border-[#adc6ff] flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(173,198,255,0.4)]">
                            <div className="w-2 h-2 rounded-full bg-[#adc6ff] animate-pulse" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#152240] border-2 border-[#424936] flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-[#c1cab0]">{i + 1}</span>
                          </div>
                        )}
                        <div className="pt-0.5">
                          <p className={`text-sm font-bold leading-snug ${
                            step.status === "in_progress" ? "text-[#adc6ff]" :
                            step.status === "done" ? "text-[#ffffff]" : "text-[#c1cab0]"
                          }`}>{step.title}</p>
                          <p className="text-xs text-[#8c947c] capitalize mt-0.5">{step.status.replace("_", " ")}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    [
                      { title: "Vibe Check / Research", meta: "Completed", done: true, active: false },
                      { title: "Drafting Caption", meta: "In Progress", done: false, active: true },
                      { title: "Posting & Engagement", meta: "Upcoming", done: false, active: false },
                    ].map((step, i) => (
                      <div key={i} className="flex gap-4 relative z-10">
                        {step.done ? (
                          <div className="w-8 h-8 rounded-full bg-[#aef846] text-[#112000] flex items-center justify-center flex-shrink-0 border-4 border-[#111D30] shadow-[0_0_12px_rgba(174,248,70,0.5)]">
                            <span className="material-symbols-outlined text-sm font-bold">check</span>
                          </div>
                        ) : step.active ? (
                          <div className="w-8 h-8 rounded-full bg-[#152240] border-2 border-[#adc6ff] flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(173,198,255,0.4)]">
                            <div className="w-2 h-2 rounded-full bg-[#adc6ff] animate-pulse" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#152240] border-2 border-[#424936] flex items-center justify-center flex-shrink-0" />
                        )}
                        <div className="pt-0.5">
                          <p className={`text-sm font-bold ${step.active ? "text-[#adc6ff]" : step.done ? "text-[#ffffff]" : "text-[#c1cab0]"}`}>{step.title}</p>
                          <p className="text-xs text-[#8c947c]">{step.meta}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* TODAY'S STATS (original, dipertahankan) */}
            <section>
              <h3 className="text-xl font-bold text-[#ffffff] mb-4">Today&apos;s Stats</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Active",  value: stats.today,  icon: "task_alt",    color: "text-[#aef846]" },
                  { label: "Urgent",  value: stats.urgent, icon: "priority_high", color: "text-[#ffb4ab]" },
                  { label: "Done",    value: stats.done,   icon: "check_circle", color: "text-[#c1cab0]" },
                ].map((s) => (
                  <div key={s.label} className="bg-[#111D30] border border-[#1E2F4D] rounded-xl p-3 flex flex-col items-center gap-1">
                    <span className={`material-symbols-outlined text-xl ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {s.icon}
                    </span>
                    <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
                    <span className="text-[10px] font-bold text-[#c1cab0] uppercase tracking-wider">{s.label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* VOICE CTA — shortcut ke voice AI */}
            <Link href="/voice" className="block">
              <div className="flex items-center gap-4 bg-[#aef846] rounded-xl px-4 py-3.5 hover:shadow-[0_0_25px_rgba(174,248,70,0.4)] active:scale-[0.98] transition-all" style={{ boxShadow: "0 0 15px rgba(174,248,70,0.2)" }}>
                <div className="w-10 h-10 rounded-xl bg-[#112000] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[#aef846] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
                </div>
                <div className="flex-1">
                  <p className="text-[#112000] font-black text-sm leading-tight">Tambah Task via Voice</p>
                  <p className="text-[#3a6000] text-xs mt-0.5">Bicara, AI langsung atur ✨</p>
                </div>
                <span className="material-symbols-outlined text-[#112000]">arrow_forward</span>
              </div>
            </Link>

          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
