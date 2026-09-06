import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-[#0d1322] text-[#dde2f8] relative overflow-x-hidden dot-grid">
      {/* Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#0566d9]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#aef846]/10 rounded-full blur-[150px]" />
      </div>

      {/* Nav */}
      <header className="w-full fixed top-0 z-50 px-4 md:px-12 h-20 flex justify-between items-center backdrop-blur-md bg-[#0d1322]/80 border-b border-[#2f3445]">
        <div className="flex flex-col">
          <h1 className="font-extrabold text-[#ffffff] tracking-tighter text-xl">LIFEPILOT AI</h1>
          <span className="text-[10px] font-bold text-[#c1cab0] uppercase tracking-widest">
            Just speak. AI organizes your life.
          </span>
        </div>
        <div className="hidden md:flex gap-4">
          <Link
            href="/login"
            className="px-6 py-2 rounded-full font-semibold text-sm border border-[#0566d9] text-[#adc6ff] hover:bg-[#0566d9]/10 transition-colors"
          >
            Log In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="pt-32 pb-24 px-4 md:px-12 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-dvh relative z-10">
        <div className="text-center max-w-3xl mb-12 mt-10">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tighter">
            Your{" "}
            <span className="text-[#aef846] neon-text">AI Executive</span>{" "}
            Assistant
          </h2>
          <p className="text-lg text-[#c1cab0] mb-10 max-w-2xl mx-auto leading-relaxed">
            Delegate tasks instantly using natural language. LifePilot AI captures, organizes, and executes
            your roadmap while you focus on what matters.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {[
              { icon: "mic", label: "Voice to Task" },
              { icon: "route", label: "AI Roadmap" },
              { icon: "notifications_active", label: "Smart Reminders" },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 bg-[#191f2f] border border-[#424936] px-4 py-2 rounded-full hover:border-[#aef846] hover:shadow-[0_0_15px_rgba(174,248,70,0.2)] transition-all cursor-default"
              >
                <span
                  className="material-symbols-outlined text-[#aef846] text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {f.icon}
                </span>
                <span className="text-sm font-semibold text-[#ffffff]">{f.label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/login"
              className="bg-[#aef846] text-[#112000] font-bold text-lg px-10 py-4 rounded-xl transition-all duration-300 shadow-[0_0_25px_rgba(174,248,70,0.3)] hover:scale-105 active:scale-95 flex items-center gap-3 hover:bg-[#bdf968] hover:shadow-[0_0_40px_rgba(174,248,70,0.5)]"
            >
              Get Started Free
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <a
              href="#how-it-works"
              className="text-xs font-bold text-[#aef846] hover:text-[#ffffff] transition-colors flex items-center gap-1 mt-2 uppercase tracking-wider"
            >
              See how it works{" "}
              <span className="material-symbols-outlined text-sm">arrow_downward</span>
            </a>
          </div>
        </div>

        {/* AI Visualizer */}
        <div className="relative w-full max-w-lg h-64 my-12 flex justify-center items-center">
          <div className="absolute inset-0 bg-[#aef846]/10 rounded-full blur-3xl" />

          {/* Mic Circle */}
          <div className="relative z-10 flex flex-col items-center justify-center w-48 h-48 bg-[#151b2b] rounded-full border border-[#aef846]/30 shadow-[0_0_50px_rgba(174,248,70,0.2)]">
            <div className="w-20 h-20 bg-[#aef846]/30 rounded-full flex items-center justify-center animate-mic-pulse mb-2">
              <span
                className="material-symbols-outlined text-5xl text-[#aef846] neon-text"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                mic
              </span>
            </div>
            {/* Waveform */}
            <div className="flex gap-1 items-end h-8">
              {[10, 28, 48, 22, 14].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-[#aef846] rounded-full wave-bar shadow-[0_0_8px_rgba(174,248,70,0.6)]"
                  style={{ height: h, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>

          {/* Floating Task Cards */}
          <div className="absolute top-0 -left-4 md:-left-20 bg-[#191f2f] border border-[#aef846]/40 rounded-xl p-4 shadow-[0_0_15px_rgba(174,248,70,0.15)] float-card z-20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0566d9]/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#adc6ff] text-sm">edit_document</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#ffffff]">Siapin deck pitching</p>
                <p className="text-xs font-bold text-[#aef846]">Due today, 5PM</p>
              </div>
            </div>
          </div>

          <div
            className="absolute bottom-4 -right-4 md:-right-24 bg-[#191f2f] border border-[#aef846]/40 rounded-xl p-4 shadow-[0_0_15px_rgba(174,248,70,0.15)] float-card z-20"
            style={{ animationDelay: "0.8s" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#aef846]/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#aef846] text-sm">check_circle</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#ffffff]">Meeting Tim 9AM</p>
                <p className="text-xs font-bold text-[#aef846]">Added to calendar</p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <section id="how-it-works" className="w-full max-w-3xl mt-16">
          <h3 className="text-center text-xs font-bold uppercase tracking-widest text-[#c1cab0] mb-8">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", icon: "mic", title: "Speak Naturally", desc: "Tap the mic and say what's on your mind, in Bahasa or English." },
              { step: "02", icon: "smart_toy", title: "AI Analyzes", desc: "Gemini AI understands context, extracts tasks, deadlines & priorities." },
              { step: "03", icon: "bolt", title: "Auto Organized", desc: "Dashboard updates, calendar synced, Telegram reminder sent." },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-[#111D30] border border-[#1E2F4D] rounded-2xl p-6 flex flex-col gap-3 hover:border-[#aef846]/30 hover:shadow-[0_0_20px_rgba(174,248,70,0.1)] transition-all"
              >
                <span className="text-xs font-bold text-[#aef846] uppercase tracking-wider">{item.step}</span>
                <span
                  className="material-symbols-outlined text-[#aef846] text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {item.icon}
                </span>
                <h4 className="font-bold text-[#ffffff] text-lg">{item.title}</h4>
                <p className="text-sm text-[#c1cab0] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <div className="mt-20 text-center">
          <p className="text-2xl font-extrabold text-[#ffffff] mb-4 tracking-tight">
            Ready to take control?
          </p>
          <Link
            href="/login"
            className="bg-[#aef846] text-[#112000] font-bold text-base px-8 py-3 rounded-xl inline-flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(174,248,70,0.3)]"
          >
            Start for free
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
