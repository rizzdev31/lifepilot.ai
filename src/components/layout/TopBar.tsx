"use client";

import Link from "next/link";
import ReminderBell from "./ReminderBell";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  showNotification?: boolean;
  rightAction?: React.ReactNode;
  greeting?: string;
  userName?: string;
  avatarUrl?: string;
}

export default function TopBar({
  title,
  showBack = false,
  showNotification = true,
  rightAction,
  greeting,
  userName,
  avatarUrl,
}: TopBarProps) {
  return (
    <header className="bg-[#0d1322] border-b border-[#424936] flex justify-between items-center w-full px-4 h-16 sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
      {/* Left */}
      <div className="flex items-center gap-3">
        {showBack ? (
          <Link
            href=".."
            className="w-10 h-10 flex items-center justify-center text-[#dde2f8] hover:text-[#aef846] transition-colors rounded-full hover:bg-[#2f3445]"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
        ) : greeting ? (
          <>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#2f3445] flex items-center justify-center">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  person
                </span>
              </div>
            )}
            <div>
              <p className="font-extrabold text-[#ffffff] tracking-tighter text-sm uppercase leading-none">
                LIFEPILOT AI
              </p>
              <p className="text-[#c1cab0] text-xs">
                {greeting}, {userName} ☀
              </p>
            </div>
          </>
        ) : (
          <h1 className="font-extrabold text-[#ffffff] tracking-tighter uppercase">
            {title || "LIFEPILOT AI"}
          </h1>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {rightAction}
        {showNotification && <ReminderBell />}
      </div>
    </header>
  );
}
