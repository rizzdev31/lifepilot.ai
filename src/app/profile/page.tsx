import BottomNav from "@/components/layout/BottomNav";
import SettingsList from "@/components/profile/SettingsList";
import { getProfileData } from "./actions";

export default async function ProfilePage() {
  const profile = await getProfileData();

  const displayName = profile?.name ?? "User";
  const email = profile?.email ?? "";
  const avatarUrl = profile?.avatar ?? null;
  const stats = profile?.stats ?? { total: 0, done: 0, inProgress: 0 };
  const isCalendarConnected = profile?.isCalendarConnected ?? false;

  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      })
    : null;

  const completionRate =
    stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="min-h-dvh bg-[#0d1322] relative flex flex-col pb-28">
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top Bar */}
      <header className="fixed top-0 z-40 w-full flex justify-between items-center px-4 h-16 bg-[#0d1322]/95 backdrop-blur-md border-b border-[#424936]/50">
        <div className="w-10 h-10 flex items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover border border-[#424936]"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#242a3a] flex items-center justify-center border border-[#424936]">
              <span className="material-symbols-outlined text-[#ffffff] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_circle
              </span>
            </div>
          )}
        </div>
        <div className="font-extrabold text-[#ffffff] tracking-tighter uppercase">
          LIFEPILOT AI
        </div>
        <div className="w-10 h-10" />
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-md mx-auto pt-24 pb-4 px-4 relative z-10 flex flex-col gap-5">
        <h1 className="text-3xl font-extrabold text-[#ffffff] tracking-tight">Profile</h1>

        {/* Avatar & Identity */}
        <section className="flex flex-col items-center py-4 gap-2">
          <div className="w-24 h-24 rounded-full bg-[#2f3445] flex items-center justify-center border-2 border-[#424936] overflow-hidden shadow-[0_0_20px_rgba(174,248,70,0.15)]">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-4xl text-[#c1cab0]" style={{ fontVariationSettings: "'FILL' 1" }}>
                person
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-[#ffffff] mt-1">{displayName}</h2>
          <p className="text-sm text-[#8c947c]">{email}</p>
          {joinedDate && (
            <p className="text-xs text-[#424936] uppercase tracking-widest">
              Bergabung {joinedDate}
            </p>
          )}
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-3 gap-3">
          <div className="bg-[#111d30] border border-[#1e2f4d] rounded-xl p-3 flex flex-col items-center gap-1">
            <span className="text-2xl font-extrabold text-[#aef846] tabular-nums">
              {stats.total}
            </span>
            <span className="text-[10px] text-[#8c947c] uppercase tracking-wider text-center">Total Task</span>
          </div>
          <div className="bg-[#111d30] border border-[#1e2f4d] rounded-xl p-3 flex flex-col items-center gap-1">
            <span className="text-2xl font-extrabold text-[#adc6ff] tabular-nums">
              {stats.done}
            </span>
            <span className="text-[10px] text-[#8c947c] uppercase tracking-wider text-center">Selesai</span>
          </div>
          <div className="bg-[#111d30] border border-[#1e2f4d] rounded-xl p-3 flex flex-col items-center gap-1">
            <span className="text-2xl font-extrabold text-[#ffffff] tabular-nums">
              {completionRate}%
            </span>
            <span className="text-[10px] text-[#8c947c] uppercase tracking-wider text-center">Completion</span>
          </div>
        </section>

        {/* Completion progress bar */}
        {stats.total > 0 && (
          <div className="bg-[#191f2f] border border-[#2f3445] rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-[#c1cab0]">Progress Keseluruhan</span>
              <span className="text-xs font-bold text-[#aef846]">{completionRate}%</span>
            </div>
            <div className="h-2 bg-[#242a3a] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${completionRate}%`,
                  background: completionRate >= 80
                    ? "linear-gradient(90deg, #aef846, #94da28)"
                    : completionRate >= 40
                    ? "linear-gradient(90deg, #adc6ff, #0566d9)"
                    : "linear-gradient(90deg, #f8daee, #e090b0)",
                  boxShadow: completionRate > 0 ? "0 0 8px rgba(174,248,70,0.4)" : "none",
                }}
              />
            </div>
            <p className="text-xs text-[#8c947c] mt-2">
              {stats.inProgress > 0
                ? `${stats.inProgress} task sedang dikerjakan`
                : stats.done === stats.total && stats.total > 0
                ? "Semua task selesai! 🎉"
                : "Belum ada task aktif"}
            </p>
          </div>
        )}

        {/* Integrations */}
        <div className="bg-[#191f2f] border border-[#2f3445] rounded-xl overflow-hidden">
          <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-[#8c947c] uppercase tracking-widest">
            Integrasi
          </p>

          {/* Telegram */}
          <div className="px-4 py-3 border-b border-[#2f3445] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0088cc]/15 border border-[#0088cc]/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#0088cc] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  send
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#ffffff]">Telegram</p>
                <p className="text-xs text-[#8c947c]">Reminder & notifikasi</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#8c947c] border border-[#424936] bg-[#242a3a] px-3 py-1 rounded-full">
              Segera
            </span>
          </div>

          {/* Google Calendar */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0566d9]/15 border border-[#0566d9]/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#0566d9] text-lg">
                  calendar_month
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#ffffff]">Google Calendar</p>
                <p className="text-xs text-[#8c947c]">Sync otomatis saat buat task</p>
              </div>
            </div>
            {isCalendarConnected ? (
              <div className="flex items-center gap-1.5 bg-[#aef846]/10 border border-[#aef846]/30 rounded-full px-3 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#aef846] animate-pulse" />
                <span className="text-xs font-bold text-[#aef846]">Terhubung</span>
              </div>
            ) : (
              <span className="text-xs font-bold text-[#8c947c] border border-[#424936] bg-[#242a3a] px-3 py-1 rounded-full">
                Login ulang
              </span>
            )}
          </div>
        </div>

        {/* Settings (interactive client component) */}
        <div>
          <p className="px-1 mb-2 text-[10px] font-bold text-[#8c947c] uppercase tracking-widest">
            Pengaturan
          </p>
          <SettingsList />
        </div>

        {/* Version */}
        <div className="flex justify-center py-2">
          <span className="text-xs text-[#424936] uppercase tracking-widest">
            LifePilot AI v1.0 · Built with ♥
          </span>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
