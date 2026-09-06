"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: "home",           label: "Home"     },
  { href: "/tasks",     icon: "task_alt",        label: "Tasks"    },
  { href: "/voice",     icon: "mic",             label: "Voice",   isMic: true },
  { href: "/calendar",  icon: "calendar_month",  label: "Calendar" },
  { href: "/profile",   icon: "person",          label: "Profile"  },
];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function BottomNav() {
  const pathname = usePathname();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  }

  return (
    <>
      {/* PWA install banner — muncul di atas nav saat bisa diinstall */}
      {installPrompt && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center z-50 px-4 pb-2 md:hidden">
          <button
            onClick={handleInstall}
            className="flex items-center gap-2 bg-[#aef846] text-[#112000] text-xs font-bold px-5 py-2.5 rounded-full shadow-[0_4px_20px_rgba(174,248,70,0.4)] hover:scale-105 active:scale-95 transition-transform animate-bounce-subtle"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              install_mobile
            </span>
            Install LifePilot AI
          </button>
        </div>
      )}

      {/* Bottom nav — original design, fixed */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe h-20 bg-[#191f2f] border-t border-[#424936] shadow-[0_-4px_20px_rgba(0,0,0,0.5)] rounded-t-xl md:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          if (item.isMic) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center -mt-8"
                aria-label="Voice AI"
              >
                <span className="absolute inset-0 bg-[#aef846]/40 rounded-full animate-ping opacity-50 w-16 h-16" />
                <span className="w-16 h-16 rounded-full bg-[#aef846] flex items-center justify-center text-[#112000] shadow-[0_0_20px_rgba(174,248,70,0.5)] z-10 border-4 border-[#191f2f]">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    mic
                  </span>
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                "flex flex-col items-center justify-center p-2 transition-all duration-200",
                isActive
                  ? "text-[#aef846] bg-[#2f3445] rounded-full scale-110 shadow-[0_0_15px_rgba(174,248,70,0.25)]"
                  : "text-[#c1cab0] hover:text-[#dde2f8]"
              )}
            >
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
