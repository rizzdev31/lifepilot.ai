"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { processTranscript, saveVoiceAndTasks } from "./actions";
import type { ExtractedTask } from "@/lib/types";

type VoiceState =
  | "idle"
  | "recording"
  | "processing"
  | "results"
  | "saving"
  | "error";

// ── helpers ────────────────────────────────────────────────────
function priorityBadge(priority: string) {
  switch (priority) {
    case "urgent":
      return "bg-[#ffb4ab]/15 text-[#ffb4ab] border-[#ffb4ab]/30";
    case "high":
      return "bg-[#aef846]/15 text-[#aef846] border-[#aef846]/30";
    case "medium":
      return "bg-[#adc6ff]/15 text-[#adc6ff] border-[#adc6ff]/30";
    default:
      return "bg-[#2f3445] text-[#c1cab0] border-[#424936]";
  }
}

function formatDeadline(deadline?: string): string {
  if (!deadline) return "";
  try {
    return new Date(deadline).toLocaleString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return deadline;
  }
}

const WAVE_BARS = [7, 11, 15, 9, 13, 5, 11, 15, 9, 7, 13, 11];

export default function VoicePage() {
  const router = useRouter();

  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const [debugInfo, setDebugInfo] = useState(""); // mostra apa yang dikirim ke AI

  // Refs untuk menghindari stale closure
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");
  const shouldProcessRef = useRef(false); // flag: process di onend

  // Check browser support
  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);
    setIsBrowserSupported(supported);
  }, []);

  // ── Kirim transcript ke Gemini dan update state ──────────────
  const runGemini = useCallback(async (text: string) => {
    setTranscript(text);
    setDebugInfo(text);
    setVoiceState("processing");

    const { tasks, error } = await processTranscript(text);

    if (error) {
      setErrorMsg(error);
      setVoiceState("error");
      return;
    }

    setExtractedTasks(tasks);
    setVoiceState("results");
  }, []);

  // ── Mulai merekam ────────────────────────────────────────────
  const startRecording = useCallback(() => {
    const SpeechRec =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRec) {
      setErrorMsg("Gunakan Chrome atau Edge untuk Voice AI.");
      setVoiceState("error");
      return;
    }

    // Reset state
    finalTranscriptRef.current = "";
    shouldProcessRef.current = false;
    setTranscript("");
    setInterimText("");
    setExtractedTasks([]);
    setErrorMsg("");
    setDebugInfo("");

    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "id-ID";

    // Hasil real-time
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          finalTranscriptRef.current += r[0].transcript + " ";
          setTranscript(finalTranscriptRef.current.trim());
        } else {
          interim += r[0].transcript;
        }
      }
      setInterimText(interim);
    };

    // ⚡ KEY FIX: proses transcript di sini — SETELAH semua results masuk
    recognition.onend = () => {
      setInterimText("");

      if (shouldProcessRef.current) {
        shouldProcessRef.current = false;
        const full = finalTranscriptRef.current.trim();

        if (!full) {
          setErrorMsg(
            "Tidak ada suara yang terdeteksi. Pastikan mikrofon aktif dan bicara lebih keras."
          );
          setVoiceState("error");
          return;
        }

        // Panggil Gemini sekarang — semua final results sudah ada
        void runGemini(full);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed") {
        setErrorMsg("Akses mikrofon ditolak. Izinkan di settings browser.");
        setVoiceState("error");
      } else if (event.error === "network") {
        setErrorMsg("Koneksi internet diperlukan untuk Speech Recognition.");
        setVoiceState("error");
      } else if (event.error !== "no-speech") {
        console.warn("[SpeechRecognition] error:", event.error);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setVoiceState("recording");
  }, [runGemini]);

  // ── Stop — set flag lalu stop, biarkan onend yang proses ────
  const stopAndProcess = useCallback(() => {
    if (!recognitionRef.current) return;
    shouldProcessRef.current = true;        // onend akan trigger runGemini
    recognitionRef.current.stop();
    // JANGAN baca transcript di sini — tunggu onend
  }, []);

  // ── Simpan task ke Supabase ──────────────────────────────────
  const saveTasks = useCallback(async () => {
    if (extractedTasks.length === 0) {
      router.push("/tasks");
      return;
    }

    setVoiceState("saving");
    const { success, count, error } = await saveVoiceAndTasks(
      transcript,
      extractedTasks
    );

    if (!success || error) {
      setErrorMsg(error ?? "Gagal menyimpan. Coba lagi.");
      setVoiceState("error");
      return;
    }

    await new Promise((r) => setTimeout(r, 500));
    router.push(`/tasks?saved=${count}`);
  }, [extractedTasks, transcript, router]);

  // ── Hapus satu task dari hasil ───────────────────────────────
  const removeTask = useCallback((i: number) => {
    setExtractedTasks((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  // ── Reset ke idle ────────────────────────────────────────────
  const reset = useCallback(() => {
    finalTranscriptRef.current = "";
    shouldProcessRef.current = false;
    setVoiceState("idle");
    setTranscript("");
    setInterimText("");
    setExtractedTasks([]);
    setErrorMsg("");
    setDebugInfo("");
  }, []);

  // ── Derived state ────────────────────────────────────────────
  const isRecording = voiceState === "recording";
  const isProcessing = voiceState === "processing" || voiceState === "saving";
  const showResults = voiceState === "results";
  const isIdle = voiceState === "idle";
  const isError = voiceState === "error";

  const statusText: Record<VoiceState, string> = {
    idle: "Tap mic untuk mulai bicara",
    recording: "Sedang mendengarkan...",
    processing: "AI sedang menganalisis...",
    results: `${extractedTasks.length} task diekstrak`,
    saving: "Menyimpan task...",
    error: "Terjadi error",
  };

  return (
    <div className="min-h-dvh bg-[#0d1322] dot-grid relative overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-[#0d1322]/80 backdrop-blur-md border-b border-[#242a3a] flex justify-between items-center w-full px-4 h-16 z-50 relative">
        <Link
          href="/dashboard"
          className="w-10 h-10 flex items-center justify-center text-[#dde2f8] hover:text-[#aef846] transition-colors rounded-full hover:bg-[#2f3445]"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-extrabold text-[#ffffff] tracking-tighter absolute left-1/2 -translate-x-1/2">
          Voice AI
        </h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 flex flex-col items-center px-4 pt-8 pb-44 relative z-10 w-full max-w-lg mx-auto">

        {/* Status */}
        <div className="mb-10 text-center">
          <span
            className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 justify-center ${
              isError
                ? "text-[#ffb4ab]"
                : isRecording
                ? "text-[#aef846]"
                : showResults && extractedTasks.length > 0
                ? "text-[#aef846]"
                : "text-[#c1cab0]"
            }`}
            style={isRecording ? { textShadow: "0 0 8px rgba(174,248,70,0.6)" } : undefined}
          >
            {isRecording && (
              <span className="w-2 h-2 rounded-full bg-[#aef846] shadow-[0_0_12px_rgba(174,248,70,1)] animate-pulse" />
            )}
            {showResults && extractedTasks.length > 0 && (
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            )}
            {isError && (
              <span className="material-symbols-outlined text-sm">error</span>
            )}
            {statusText[voiceState]}
          </span>
        </div>

        {/* Mic button — sembunyikan saat results */}
        {!showResults && (
          <>
            <div className="relative mb-14 flex justify-center items-center">
              {/* Framer Motion pulse rings — hanya saat recording */}
              <AnimatePresence>
                {isRecording && (
                  <>
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="absolute rounded-full border border-[#aef846]"
                        initial={{ width: 128, height: 128, opacity: 0.7 }}
                        animate={{ width: 128 + (i + 1) * 56, height: 128 + (i + 1) * 56, opacity: 0 }}
                        transition={{
                          duration: 1.6,
                          delay: i * 0.45,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                        style={{ borderWidth: 1.5 - i * 0.3 }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>

              {/* Mic button */}
              <motion.button
                onClick={isIdle || isError ? startRecording : isRecording ? stopAndProcess : undefined}
                disabled={isProcessing || !isBrowserSupported}
                aria-label={isRecording ? "Stop recording" : "Start recording"}
                animate={
                  isRecording
                    ? { scale: [1.1, 1.13, 1.1], boxShadow: ["0 0 40px rgba(174,248,70,0.5)", "0 0 70px rgba(174,248,70,0.8)", "0 0 40px rgba(174,248,70,0.5)"] }
                    : { scale: 1 }
                }
                whileHover={!isProcessing && !isBrowserSupported ? {} : { scale: isRecording ? 1.13 : 1.05 }}
                whileTap={{ scale: 0.96 }}
                transition={isRecording ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
                className={`relative w-32 h-32 rounded-full flex items-center justify-center focus:outline-none ${
                  isRecording
                    ? "bg-[#1a2e10] border-2 border-[#aef846]"
                    : isProcessing
                    ? "bg-[#242a3a] border-2 border-[#424936] opacity-60 cursor-not-allowed"
                    : "bg-[#242a3a] border-2 border-[#aef846]/60 shadow-[0_0_30px_rgba(174,248,70,0.2)]"
                }`}
              >
                {isProcessing ? (
                  <motion.span
                    className="material-symbols-outlined text-[#aef846] text-5xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    progress_activity
                  </motion.span>
                ) : (
                  <span
                    className="material-symbols-outlined text-6xl"
                    style={{
                      fontVariationSettings: "'FILL' 1",
                      color: isError ? "#ffb4ab" : "#aef846",
                      filter: isRecording
                        ? "drop-shadow(0 0 18px rgba(174,248,70,1))"
                        : "drop-shadow(0 0 8px rgba(174,248,70,0.5))",
                    }}
                  >
                    {isError ? "mic_off" : "mic"}
                  </span>
                )}
              </motion.button>
            </div>

            {/* Waveform — Framer Motion bars */}
            <div
              className="flex items-center justify-center gap-1.5 h-14 w-full max-w-xs mb-10"
              style={{ filter: isRecording ? "drop-shadow(0 0 8px rgba(174,248,70,0.5))" : "none" }}
            >
              {WAVE_BARS.map((h, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 rounded-full"
                  animate={
                    isRecording
                      ? { height: [4, h * 2, h * 1.2, h * 2, 4], backgroundColor: "#aef846" }
                      : { height: 4, backgroundColor: "#2f3445" }
                  }
                  transition={
                    isRecording
                      ? { duration: 0.8 + (i % 3) * 0.2, delay: (i % 5) * 0.1, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.3 }
                  }
                />
              ))}
            </div>
          </>
        )}

        {/* Transcript live — saat recording/processing */}
        {(isRecording || isProcessing) && (
          <div className="w-full bg-[#191f2f] border border-[#424936] rounded-xl p-5 relative shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-[#aef846]/40 rounded-tr-xl" />
            <p className="text-xs font-bold text-[#aef846]/70 uppercase tracking-wider mb-3">
              Transcript
            </p>
            <p className="text-base text-[#dde2f8] leading-relaxed min-h-[3rem]">
              {transcript || (
                <span className="text-[#c1cab0] italic">Mulai bicara...</span>
              )}
              {interimText && (
                <span className="text-[#c1cab0]">{interimText}</span>
              )}
              {isRecording && (
                <span className="inline-block w-0.5 h-5 bg-[#aef846] ml-1 align-middle animate-pulse" />
              )}
            </p>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="w-full bg-[#93000a]/10 border border-[#ffb4ab]/30 rounded-xl p-5 mb-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-[#ffb4ab] mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
              error
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#ffb4ab] mb-1">Error</p>
              <p className="text-sm text-[#c1cab0]">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Browser not supported */}
        {!isBrowserSupported && isIdle && (
          <div className="w-full bg-[#ffb4ab]/5 border border-[#ffb4ab]/30 rounded-xl p-5">
            <p className="text-sm text-[#ffb4ab] font-semibold mb-1">
              ⚠ Browser tidak mendukung Voice AI
            </p>
            <p className="text-xs text-[#c1cab0]">
              Gunakan Google Chrome atau Microsoft Edge.
            </p>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div className="w-full flex flex-col gap-4">

            {/* Transcript recap */}
            <div className="bg-[#191f2f] border border-[#424936] rounded-xl p-4">
              <p className="text-xs font-bold text-[#c1cab0] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">record_voice_over</span>
                Yang kamu ucapkan
              </p>
              <p className="text-sm text-[#dde2f8] leading-relaxed">
                &ldquo;{debugInfo}&rdquo;
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#242a3a]" />
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  extractedTasks.length > 0 ? "text-[#aef846]" : "text-[#c1cab0]"
                }`}
              >
                {extractedTasks.length > 0
                  ? `${extractedTasks.length} task diekstrak AI`
                  : "Tidak ada task ditemukan"}
              </span>
              <div className="flex-1 h-px bg-[#242a3a]" />
            </div>

            {/* Empty hasil */}
            {extractedTasks.length === 0 && (
              <div className="text-center py-6 bg-[#191f2f] border border-[#424936] rounded-xl p-6">
                <span
                  className="material-symbols-outlined text-4xl text-[#c1cab0] mb-3 block"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  search_off
                </span>
                <p className="text-sm font-semibold text-[#dde2f8] mb-2">
                  AI tidak menemukan task
                </p>
                <p className="text-xs text-[#c1cab0] leading-relaxed">
                  Coba ucapkan lebih eksplisit, misalnya:
                  <br />
                  <span className="text-[#aef846]">
                    &ldquo;Besok jam 3 meeting zoom, urgent bayar tagihan hari ini&rdquo;
                  </span>
                </p>
              </div>
            )}

            {/* Task cards */}
            {extractedTasks.map((task, i) => (
              <div
                key={`${task.title}-${i}`}
                className="bg-[#111D30] border border-[#1E2F4D] rounded-xl p-4 relative"
                style={{ animation: `fadeSlideIn 0.25s ease-out ${i * 0.07}s both` }}
              >
                <button
                  onClick={() => removeTask(i)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-[#c1cab0] hover:text-[#ffb4ab] hover:bg-[#2f3445] transition-colors"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>

                <div className="flex flex-wrap gap-2 mb-3 pr-8">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${priorityBadge(task.priority)}`}>
                    {task.priority}
                  </span>
                  {task.category && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-[#2f3445] text-[#dde2f8] border-[#424936]">
                      {task.category}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-[#ffffff] mb-1.5 pr-8">
                  {task.title}
                </h3>

                {task.description && (
                  <p className="text-sm text-[#c1cab0] mb-2 leading-relaxed">
                    {task.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 mt-2">
                  {task.deadline && (
                    <div className="flex items-center gap-1 text-xs text-[#adc6ff]">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {formatDeadline(task.deadline)}
                    </div>
                  )}
                  {task.estimated_duration && (
                    <div className="flex items-center gap-1 text-xs text-[#c1cab0]">
                      <span className="material-symbols-outlined text-sm">timer</span>
                      {task.estimated_duration} menit
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 w-full px-4 pb-8 pt-4 bg-gradient-to-t from-[#0d1322] via-[#0d1322]/95 to-transparent z-50">
        <div className="max-w-lg mx-auto flex flex-col gap-3">

          {/* Idle / Error → Mulai */}
          {(isIdle || isError) && (
            <button
              onClick={startRecording}
              disabled={!isBrowserSupported}
              className="w-full bg-[#aef846] text-[#112000] font-bold text-base py-4 rounded-xl shadow-[0_0_15px_rgba(174,248,70,0.4)] hover:shadow-[0_0_30px_rgba(174,248,70,0.6)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                mic
              </span>
              {isError ? "Coba Lagi" : "Mulai Merekam"}
            </button>
          )}

          {/* Recording → Stop */}
          {isRecording && (
            <button
              onClick={stopAndProcess}
              className="w-full bg-[#aef846] text-[#112000] font-bold text-base py-4 rounded-xl shadow-[0_0_25px_rgba(174,248,70,0.6)] flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                stop_circle
              </span>
              Stop &amp; Proses AI
            </button>
          )}

          {/* Processing / Saving → Disabled */}
          {isProcessing && (
            <button
              disabled
              className="w-full bg-[#2f3445] text-[#c1cab0] font-bold text-base py-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <span className="material-symbols-outlined animate-spin text-[#aef846]">
                progress_activity
              </span>
              {voiceState === "saving" ? "Menyimpan..." : "AI sedang memproses..."}
            </button>
          )}

          {/* Results → Simpan + Rekam ulang */}
          {showResults && (
            <>
              <button
                onClick={saveTasks}
                disabled={extractedTasks.length === 0}
                className="w-full bg-[#aef846] text-[#112000] font-bold text-base py-4 rounded-xl shadow-[0_0_15px_rgba(174,248,70,0.4)] hover:shadow-[0_0_30px_rgba(174,248,70,0.6)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  save
                </span>
                Simpan {extractedTasks.length} Task
              </button>
              <button
                onClick={reset}
                className="w-full border border-[#424936] text-[#c1cab0] font-semibold text-base py-3.5 rounded-xl hover:bg-[#2f3445] hover:text-[#dde2f8] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Rekam Ulang
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
