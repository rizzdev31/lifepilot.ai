"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: "home", label: "Home" },
  { href: "/tasks", icon: "task_alt", label: "Tasks" },
  { href: "/voice", icon: "mic", label: "Voice", isMic: true },
  { href: "/calendar", icon: "calendar_month", label: "Calendar" },
  { href: "/profile", icon: "person", label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe h-20 bg-[#191f2f] border-t border-[#424936] shadow-[0_-4px_20px_rgba(0,0,0,0.5)] rounded-t-xl md:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href;

        if (item.isMic) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center -mt-8"
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
  );
}
