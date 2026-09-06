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
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Deteksi apakah sudah diinstall sebagai PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

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
    if (outcome === "accepted") {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden flex flex-col items-center gap-2">

      {/* PWA Install chip — muncul di atas nav ketika bisa diinstall */}
      {installPrompt && !isInstalled && (
        <button
          onClick={handleInstall}
          className="flex items-center gap-2 bg-[#aef846] text-[#112000] text-xs font-bold px-4 py-2 rounded-full shadow-[0_4px_16px_rgba(174,248,70,0.4)] hover:scale-105 active:scale-95 transition-transform animate-bounce-subtle"
        >
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
            install_mobile
          </span>
          Install LifePilot AI
        </button>
      )}

      {/* Floating pill nav */}
      <nav className="flex items-center gap-0.5 bg-[#191f2f]/95 backdrop-blur-xl border border-[#424936]/80 rounded-2xl px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.04)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          if (item.isMic) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex items-center justify-center mx-1 -mt-5"
                aria-label="Voice AI"
              >
                <span className="absolute w-14 h-14 rounded-full bg-[#aef846]/30 animate-ping" />
                <span className={cn(
                  "w-14 h-14 rounded-full bg-[#aef846] flex items-center justify-center text-[#112000] z-10",
                  "shadow-[0_0_20px_rgba(174,248,70,0.6)] border-4 border-[#191f2f]",
                  "hover:scale-105 active:scale-95 transition-transform"
                )}>
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
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
                "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-[#2f3445] text-[#aef846] shadow-[inset_0_0_0_1px_rgba(174,248,70,0.2)]"
                  : "text-[#c1cab0] hover:text-[#dde2f8] hover:bg-[#242a3a]"
              )}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
