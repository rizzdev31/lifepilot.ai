import Link from "next/link";

export default function WelcomePage() {
  const features = [
    {
      icon: "mic",
      label: "Voice AI",
      desc: "Cukup bicara, AI langsung buat rencana",
    },
    {
      icon: "map",
      label: "Roadmap",
      desc: "Langkah-langkah terstruktur menuju tujuan",
    },
    {
      icon: "wb_sunny",
      label: "Daily Briefing",
      desc: "Ringkasan harian & saran fokus AI",
    },
  ];

  return (
    <div className="min-h-dvh bg-[#0d1322] flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(140,148,124,0.10) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Ambient glow blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#aef846] opacity-[0.06] blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-60 h-60 bg-[#adc6ff] opacity-[0.05] blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-48 h-48 bg-[#aef846] opacity-[0.04] blur-[60px] rounded-full pointer-events-none" />

      {/* Main content */}
      <main className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
        {/* Logo */}
        <div
          className="mb-8"
          style={{ animation: "welcomeIn 0.5s cubic-bezier(0.22,1,0.36,1) both" }}
        >
          <div
            className="w-20 h-20 rounded-3xl bg-[#111d30] border border-[#424936] flex items-center justify-center mx-auto"
            style={{
              boxShadow:
                "0 0 0 1px rgba(174,248,70,0.15), 0 0 40px rgba(174,248,70,0.25)",
            }}
          >
            <span
              className="material-symbols-outlined text-[#aef846] text-4xl"
              style={{
                fontVariationSettings: "'FILL' 1",
                filter: "drop-shadow(0 0 12px rgba(174,248,70,0.9))",
                animation: "logoPulse 3s ease-in-out infinite",
              }}
            >
              explore
            </span>
          </div>
        </div>

        {/* Heading */}
        <div
          style={{ animation: "welcomeIn 0.5s 0.1s cubic-bezier(0.22,1,0.36,1) both" }}
        >
          <p className="text-xs font-semibold tracking-[0.2em] text-[#aef846] uppercase mb-3">
            Selamat Datang di
          </p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            LifePilot <span className="text-[#aef846]">AI</span>
          </h1>
          <p className="text-lg text-[#c1cab0] leading-relaxed max-w-xs mx-auto">
            Mari atur rencana dan jadwal secara{" "}
            <span className="text-[#dde2f8] font-medium">teratur</span> dan{" "}
            <span className="text-[#dde2f8] font-medium">matang</span>
          </p>
        </div>

        {/* Divider */}
        <div
          className="w-16 h-px bg-gradient-to-r from-transparent via-[#424936] to-transparent my-8"
          style={{ animation: "welcomeIn 0.5s 0.2s cubic-bezier(0.22,1,0.36,1) both" }}
        />

        {/* Feature cards */}
        <div className="w-full flex flex-col gap-3 mb-10">
          {features.map((f, i) => (
            <div
              key={f.label}
              className="flex items-center gap-4 bg-[#111d30] border border-[#1e2f4d] rounded-2xl px-4 py-4"
              style={{
                animation: `welcomeIn 0.5s ${0.25 + i * 0.08}s cubic-bezier(0.22,1,0.36,1) both`,
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-[#191f2f] border border-[#2f3445] flex items-center justify-center flex-shrink-0">
                <span
                  className="material-symbols-outlined text-[#aef846] text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {f.icon}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-[#dde2f8]">{f.label}</p>
                <p className="text-xs text-[#8c947c] mt-0.5 leading-snug">{f.desc}</p>
              </div>
              <span className="material-symbols-outlined text-[#424936] text-base ml-auto">
                chevron_right
              </span>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <div
          className="w-full"
          style={{ animation: "welcomeIn 0.5s 0.5s cubic-bezier(0.22,1,0.36,1) both" }}
        >
          <Link
            href="/voice"
            className="block w-full py-4 rounded-2xl font-bold text-base text-[#112000] bg-[#aef846] hover:bg-[#c4fc6a] active:scale-[0.98] transition-all duration-200 text-center"
            style={{
              boxShadow: "0 0 24px rgba(174,248,70,0.4), 0 4px 16px rgba(0,0,0,0.3)",
            }}
          >
            Mulai Sekarang
          </Link>

          <Link
            href="/dashboard"
            className="block mt-3 text-sm text-[#8c947c] hover:text-[#c1cab0] transition-colors text-center"
          >
            Lihat dashboard dulu
          </Link>
        </div>
      </main>

      <style>{`
        @keyframes welcomeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes logoPulse {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(174,248,70,0.7)); }
          50%       { filter: drop-shadow(0 0 18px rgba(174,248,70,1)); }
        }
      `}</style>
    </div>
  );
}
