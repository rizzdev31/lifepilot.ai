"use client";

import { useState, useTransition } from "react";
import { syncToCalendar } from "@/app/tasks/[id]/actions";

interface Props {
  taskId: string;
  deadline?: string | null;
  existingLink?: string | null;
}

export default function CalendarSyncButton({ taskId, deadline, existingLink }: Props) {
  const [isPending, startTransition] = useTransition();
  const [calLink, setCalLink] = useState<string | null>(existingLink ?? null);
  const [error, setError] = useState("");
  const [synced, setSynced] = useState(!!existingLink);

  function handleSync() {
    if (!deadline) {
      setError("Task belum punya deadline.");
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await syncToCalendar(taskId);
      if (res.success && res.calendarLink) {
        setCalLink(res.calendarLink);
        setSynced(true);
      } else {
        setError(res.error ?? "Sync gagal.");
      }
    });
  }

  return (
    <div className="bg-[#191f2f] rounded-xl p-4 border border-[#424936]/30 flex items-center justify-between hover:bg-[#242a3a] transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#2f3445] flex items-center justify-center border border-[#424936]/50">
          <span className="material-symbols-outlined text-[#0566d9] text-lg">calendar_month</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#dde2f8]">Google Calendar</p>
          <p className="text-xs text-[#c1cab0]">
            {synced
              ? "Tersinkronisasi ✓"
              : deadline
              ? new Date(deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
              : "Belum dijadwalkan"}
          </p>
          {error && (
            <p className="text-xs text-[#ffb4ab] mt-1">{error}</p>
          )}
        </div>
      </div>

      {synced && calLink ? (
        <a
          href={calLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-[#aef846]/10 border border-[#aef846]/30 flex items-center justify-center hover:bg-[#aef846]/20 transition-colors"
          title="Buka di Google Calendar"
        >
          <span className="material-symbols-outlined text-[#aef846] text-sm">open_in_new</span>
        </a>
      ) : (
        <button
          onClick={handleSync}
          disabled={isPending || !deadline}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#0566d9]/10 border border-[#0566d9]/30 text-[#adc6ff] hover:bg-[#0566d9]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={!deadline ? "Tambahkan deadline dulu" : "Sync ke Google Calendar"}
        >
          {isPending ? (
            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-sm">sync</span>
          )}
          {isPending ? "Syncing..." : "Sync"}
        </button>
      )}
    </div>
  );
}
