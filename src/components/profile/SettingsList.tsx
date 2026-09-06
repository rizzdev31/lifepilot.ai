"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/app/profile/actions";

interface ToggleItem {
  type: "toggle";
  icon: string;
  label: string;
  sublabel: string;
  filled?: boolean;
  value: boolean;
  onToggle: () => void;
}

interface InfoItem {
  type: "info";
  icon: string;
  label: string;
  sublabel: string;
  filled?: boolean;
}

type SettingItem = ToggleItem | InfoItem;

function Toggle({ value }: { value: boolean }) {
  return (
    <div className="w-11 h-6 flex-shrink-0">
      <div
        className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${
          value
            ? "bg-[#aef846] shadow-[0_0_10px_rgba(174,248,70,0.3)]"
            : "bg-[#2f3445]"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            value ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
    </div>
  );
}

export default function SettingsList() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Hindari hydration mismatch: baca localStorage setelah mount
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      const notif = localStorage.getItem("lp_notif");
      if (notif !== null) setNotifications(notif !== "false");
      const dark = localStorage.getItem("lp_dark");
      if (dark !== null) setDarkMode(dark !== "false");
    } catch {
      // localStorage tidak tersedia (private mode, dll)
    }
  }, []);

  function toggleNotif() {
    const next = !notifications;
    setNotifications(next);
    try { localStorage.setItem("lp_notif", String(next)); } catch { /* ignore */ }
  }

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    try { localStorage.setItem("lp_dark", String(next)); } catch { /* ignore */ }
  }

  function handleSignOut() {
    startTransition(async () => {
      try {
        await signOut();
      } catch {
        // redirect() melempar error di Next.js — ini normal, navigasi tetap terjadi
        router.push("/login");
      }
    });
  }

  const items: SettingItem[] = [
    {
      type: "toggle",
      icon: "notifications_active",
      label: "Notifikasi",
      sublabel: mounted ? (notifications ? "Aktif" : "Nonaktif") : "Aktif",
      value: mounted ? notifications : true,
      onToggle: toggleNotif,
    },
    {
      type: "info",
      icon: "schedule",
      label: "Reminder Preference",
      sublabel: "1 jam sebelum deadline",
    },
    {
      type: "info",
      icon: "language",
      label: "AI Language",
      sublabel: "Indonesia / English",
    },
    {
      type: "toggle",
      icon: "dark_mode",
      label: "Dark Mode",
      sublabel: mounted ? (darkMode ? "Aktif" : "Nonaktif") : "Aktif",
      filled: true,
      value: mounted ? darkMode : true,
      onToggle: toggleDark,
    },
    {
      type: "info",
      icon: "shield",
      label: "Privacy & Data",
      sublabel: "Lihat kebijakan",
    },
  ];

  return (
    <div className="bg-[#191f2f] border border-[#2f3445] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const borderClass = !isLast ? "border-b border-[#2f3445]" : "";

        if (item.type === "toggle") {
          return (
            <button
              key={item.label}
              onClick={item.onToggle}
              className={`w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#242a3a] active:bg-[#2f3445] transition-colors group ${borderClass}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-[#c1cab0] text-xl"
                  style={item.filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <div className="text-left">
                  <p className="text-sm font-medium text-[#dde2f8]">{item.label}</p>
                  <p className="text-xs text-[#8c947c] mt-0.5">{item.sublabel}</p>
                </div>
              </div>
              <Toggle value={item.value} />
            </button>
          );
        }

        return (
          <div
            key={item.label}
            className={`px-4 py-3.5 flex items-center justify-between ${borderClass}`}
          >
            <div className="flex items-center gap-3">
              <span
                className="material-symbols-outlined text-[#c1cab0] text-xl"
                style={item.filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <div>
                <p className="text-sm font-medium text-[#dde2f8]">{item.label}</p>
                <p className="text-xs text-[#8c947c] mt-0.5">{item.sublabel}</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#424936] text-xl">
              chevron_right
            </span>
          </div>
        );
      })}

      {/* Logout */}
      <div className="border-t border-[#2f3445]">
        <button
          onClick={handleSignOut}
          disabled={isPending}
          className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-[#93000a]/20 active:bg-[#93000a]/30 transition-colors disabled:opacity-50"
        >
          <span
            className={`material-symbols-outlined text-[#ffb4ab] text-xl ${
              isPending ? "animate-spin" : ""
            }`}
          >
            {isPending ? "progress_activity" : "logout"}
          </span>
          <p className="text-sm font-semibold text-[#ffb4ab]">
            {isPending ? "Keluar..." : "Logout"}
          </p>
        </button>
      </div>
    </div>
  );
}
