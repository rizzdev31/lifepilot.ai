import { signInWithGoogle, signInAsGuest } from "./actions";

interface LoginPageProps {
  searchParams: Promise<{ error?: string; next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <div className="min-h-dvh bg-[#0d1322] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background layers */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(rgba(140,148,124,0.12) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-50"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(66,73,54,0.04) 10px,rgba(66,73,54,0.04) 11px)",
        }}
      />
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-[#aef846] mix-blend-screen blur-[120px] opacity-20 pointer-events-none z-0 rounded-full" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#adc6ff] mix-blend-screen blur-[150px] opacity-10 pointer-events-none z-0 rounded-full" />

      <main className="w-full max-w-sm px-4 flex flex-col items-center z-10">
        {/* Logo */}
        <div className="mb-12 flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-[#191f2f] border border-[#424936] flex items-center justify-center shadow-[0_0_30px_rgba(174,248,70,0.3)]">
            <span
              className="material-symbols-outlined text-[#aef846] text-2xl"
              style={{
                fontVariationSettings: "'FILL' 1",
                filter: "drop-shadow(0 0 8px rgba(174,248,70,0.8))",
              }}
            >
              explore
            </span>
          </div>
          <h1 className="font-extrabold text-[#ffffff] tracking-tighter text-2xl uppercase mt-2">
            LIFEPILOT AI
          </h1>
        </div>

        {/* Headline */}
        <div className="text-center mb-10 w-full">
          <h2 className="text-3xl font-extrabold text-[#ffffff] mb-4 tracking-tight leading-tight">
            Main character energy.
          </h2>
          <p className="text-lg text-[#c1cab0] max-w-xs mx-auto leading-relaxed">
            Drop your Google below to let AI handle the boring stuff.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="w-full mb-6 bg-[#93000a]/20 border border-[#ffb4ab]/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-[#ffb4ab] text-lg">error</span>
            <p className="text-sm text-[#ffb4ab]">{decodeURIComponent(error)}</p>
          </div>
        )}

        {/* Google Sign-In — Server Action via form */}
        <form action={signInWithGoogle} className="w-full mb-8">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-[#ffffff] text-[#111827] font-semibold text-sm py-4 px-6 rounded-xl hover:bg-[#f3f4f6] transition-all duration-300 shadow-lg active:scale-[0.98]"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </form>

        {/* Demo / Guest mode */}
        <div className="w-full flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-[#424936]" />
          <span className="text-xs text-[#8c947c] font-medium">atau</span>
          <div className="flex-1 h-px bg-[#424936]" />
        </div>

        <form action={signInAsGuest} className="w-full mb-8">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-transparent border border-[#aef846]/40 text-[#aef846] font-semibold text-sm py-3.5 px-6 rounded-xl hover:bg-[#aef846]/8 transition-all duration-200 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
            Coba Demo Tanpa Login
          </button>
        </form>

        {/* Telegram Info Card */}
        <div className="w-full bg-[#191f2f] border border-[#424936] rounded-2xl p-4 flex items-center justify-between mb-8 hover:bg-[#242a3a] hover:shadow-[0_0_15px_rgba(174,248,70,0.1)] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#2f3445] flex items-center justify-center text-[#adc6ff]">
              <span
                className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                send
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#dde2f8]">Link Telegram</h3>
              <p className="text-xs text-[#c1cab0] mt-0.5">
                For AI pings &amp; daily reminders
              </p>
            </div>
          </div>
          {/* Visual toggle — functional setup is in /profile after login */}
          <div className="relative w-11 h-6">
            <div className="w-11 h-6 bg-[#aef846] rounded-full shadow-[0_0_15px_rgba(174,248,70,0.4)] relative">
              <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full" />
            </div>
          </div>
        </div>

        {/* Legal */}
        <p className="text-xs text-[#c1cab0] text-center opacity-60">
          By continuing you agree to our Terms &amp; Privacy
        </p>
      </main>
    </div>
  );
}
