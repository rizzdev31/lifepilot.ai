"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { fetchReminders, dismissReminder } from "@/app/reminders/actions";
import type { ReminderWithTask } from "@/lib/supabase/queries";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hari lalu`;
}

export default function ReminderBell() {
  const [reminders, setReminders] = useState<ReminderWithTask[]>([]);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReminders().then(({ reminders, count }) => {
      setReminders(reminders);
      setCount(count);
    });
  }, []);

  // Tutup saat klik di luar
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleDismiss(id: string) {
    startTransition(async () => {
      await dismissReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
      setCount((c) => Math.max(0, c - 1));
    });
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 flex items-center justify-center text-[#c1cab0] hover:text-[#dde2f8] hover:bg-[#2f3445] transition-colors rounded-full relative"
        aria-label={`${count} reminder aktif`}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: count > 0 ? "'FILL' 1" : "'FILL' 0" }}
        >
          notifications
        </span>
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-[#aef846] rounded-full flex items-center justify-center px-0.5 shadow-[0_0_6px_rgba(174,248,70,0.8)]">
            <span className="text-[9px] font-black text-[#112000] tabular-nums">
              {count > 9 ? "9+" : count}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-12 right-0 w-80 bg-[#111827] border border-[#2f3445] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E2F4D]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#aef846] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                notifications_active
              </span>
              <span className="text-xs font-bold text-[#dde2f8] uppercase tracking-wider">Reminder</span>
            </div>
            {count > 0 && (
              <span className="text-[10px] bg-[#aef846]/15 text-[#aef846] font-bold px-2 py-0.5 rounded-full border border-[#aef846]/20">
                {count} aktif
              </span>
            )}
          </div>

          {/* Reminder list */}
          <div className="max-h-80 overflow-y-auto">
            {reminders.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 px-4">
                <span className="material-symbols-outlined text-[#424936] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <p className="text-xs text-[#c1cab0] text-center">Semua sudah beres. Tidak ada reminder aktif.</p>
              </div>
            ) : (
              reminders.map((r) => (
                <div
                  key={r.id}
                  className="flex gap-3 px-4 py-3 border-b border-[#1a2036] hover:bg-[#1a2036]/50 transition-colors"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-8 h-8 bg-[#aef846]/10 rounded-full flex items-center justify-center mt-0.5">
                    <span className="material-symbols-outlined text-[#aef846] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      alarm
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {r.task_title && (
                      <Link
                        href={`/tasks/${r.task_id}`}
                        onClick={() => setOpen(false)}
                        className="text-xs font-bold text-[#dde2f8] hover:text-[#aef846] transition-colors line-clamp-1"
                      >
                        {r.task_title}
                      </Link>
                    )}
                    <p className="text-[11px] text-[#c1cab0] mt-0.5 line-clamp-2">{r.message}</p>
                    <p className="text-[10px] text-[#424936] mt-1">{timeAgo(r.remind_at)}</p>
                  </div>

                  {/* Dismiss */}
                  <button
                    onClick={() => handleDismiss(r.id)}
                    disabled={isPending}
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-[#424936] hover:text-[#dde2f8] hover:bg-[#2f3445] rounded-full transition-colors mt-0.5"
                    title="Tutup"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {reminders.length > 0 && (
            <div className="px-4 py-2 border-t border-[#1E2F4D]">
              <button
                onClick={() => {
                  reminders.forEach((r) => handleDismiss(r.id));
                  setOpen(false);
                }}
                className="w-full text-[11px] text-[#c1cab0] hover:text-[#dde2f8] py-1 transition-colors"
              >
                Tandai semua selesai
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
