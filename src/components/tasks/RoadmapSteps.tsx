"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeStep, undoStep, generateRoadmapOnDemand, markTaskDone, regenerateRoadmap } from "@/app/tasks/[id]/actions";
import type { RoadmapStep, Task } from "@/lib/types";

// ── Render content materi belajar (teks dengan **bold** dan bullet •) ──
function LearningContent({ content }: { content: string }) {
  const lines = content.split("\n").filter(Boolean);
  return (
    <div className="mt-3 p-3 bg-[#0d1322] border border-[#adc6ff]/20 rounded-lg flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="material-symbols-outlined text-[#adc6ff] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
          menu_book
        </span>
        <span className="text-[10px] font-bold text-[#adc6ff] uppercase tracking-widest">Materi Belajar</span>
      </div>
      {lines.map((line, i) => {
        // Bold headers: **text**
        const isBoldHeader = /^\*\*.*\*\*$/.test(line.trim());
        if (isBoldHeader) {
          return (
            <p key={i} className="text-xs font-bold text-[#dde2f8] mt-1">
              {line.replace(/\*\*/g, "")}
            </p>
          );
        }
        // Bullet points: • item atau **bold** text — explanation
        const bulletMatch = line.match(/^•\s+\*\*(.+?)\*\*\s*[—-]?\s*(.*)/);
        if (bulletMatch) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-[#adc6ff] flex-shrink-0 mt-px">•</span>
              <p className="text-xs text-[#c1cab0] leading-relaxed">
                <span className="font-bold text-[#dde2f8]">{bulletMatch[1]}</span>
                {bulletMatch[2] ? <span> — {bulletMatch[2]}</span> : null}
              </p>
            </div>
          );
        }
        // Plain bullet
        const plainBullet = line.match(/^[•·-]\s+(.*)/);
        if (plainBullet) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-[#adc6ff] flex-shrink-0 mt-px">•</span>
              <p className="text-xs text-[#c1cab0] leading-relaxed">{plainBullet[1]}</p>
            </div>
          );
        }
        // Plain text / tips
        return (
          <p key={i} className="text-xs text-[#c1cab0] leading-relaxed italic">
            {line.replace(/\*\*/g, "")}
          </p>
        );
      })}
    </div>
  );
}

interface RoadmapStepsProps {
  steps: RoadmapStep[];
  task: Pick<Task, "id" | "title" | "description" | "category" | "priority" | "deadline" | "estimated_duration" | "status">;
}

export default function RoadmapSteps({ steps, task }: RoadmapStepsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingStepId, setLoadingStepId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [localSteps, setLocalSteps] = useState<RoadmapStep[]>(steps);
  const [taskDone, setTaskDone] = useState(task.status === "done");
  const [error, setError] = useState("");

  // Hitung progress
  const doneCount = localSteps.filter((s) => s.status === "done").length;
  const totalCount = localSteps.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const currentStep = localSteps.find((s) => s.status === "in_progress");

  // ── Tandai step selesai ──────────────────────────────────────
  function handleComplete(step: RoadmapStep) {
    if (isPending || loadingStepId) return;
    setLoadingStepId(step.id);
    setError("");

    // Optimistic update
    setLocalSteps((prev) => {
      const updated = prev.map((s) =>
        s.id === step.id ? { ...s, status: "done" as const } : s
      );
      const allDone = updated.every((s) => s.status === "done");
      if (allDone) {
        setTaskDone(true);
        return updated;
      }
      // Advance next pending
      const nextPending = updated
        .filter((s) => s.status === "pending")
        .sort((a, b) => a.order - b.order)[0];
      return updated.map((s) =>
        s.id === nextPending?.id ? { ...s, status: "in_progress" as const } : s
      );
    });

    startTransition(async () => {
      const { allDone } = await completeStep(step.id, task.id);
      if (allDone) setTaskDone(true);
      setLoadingStepId(null);
    });
  }

  // ── Undo step ────────────────────────────────────────────────
  function handleUndo(step: RoadmapStep) {
    if (isPending || loadingStepId) return;
    setLoadingStepId(step.id);
    setError("");

    setLocalSteps((prev) =>
      prev.map((s) => s.id === step.id ? { ...s, status: "pending" as const } : s)
    );
    setTaskDone(false);

    startTransition(async () => {
      await undoStep(step.id, task.id);
      setLoadingStepId(null);
    });
  }

  // ── Regenerate roadmap (hapus lama, buat baru) ────────────────
  async function handleRegenerate() {
    setIsRegenerating(true);
    setError("");
    const { success, error: err } = await regenerateRoadmap(task);
    if (!success) {
      setError(err ?? "Regenerate roadmap gagal.");
      setIsRegenerating(false);
      return;
    }
    router.refresh();
    setIsRegenerating(false);
  }

  // ── Generate roadmap on-demand ───────────────────────────────
  async function handleGenerate() {
    setIsGenerating(true);
    setError("");
    const { success, error: err } = await generateRoadmapOnDemand(task);
    if (!success) {
      setError(err ?? "Generate roadmap gagal.");
      setIsGenerating(false);
      return;
    }
    router.refresh();
    setIsGenerating(false);
  }

  // ── Mark task done manual ────────────────────────────────────
  function handleMarkDone() {
    if (isPending) return;
    setTaskDone(true);
    setLocalSteps((prev) => prev.map((s) => ({ ...s, status: "done" as const })));
    startTransition(async () => {
      await markTaskDone(task.id);
    });
  }

  // ── No steps yet ─────────────────────────────────────────────
  if (localSteps.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-[#191f2f] border border-[#424936] flex items-center justify-center">
          <span
            className="material-symbols-outlined text-[#aef846] text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            smart_toy
          </span>
        </div>
        <div>
          <p className="text-sm font-bold text-[#dde2f8] mb-1">
            AI Roadmap belum dibuat
          </p>
          <p className="text-xs text-[#c1cab0]">
            Biarkan AI membuatkan rencana langkah demi langkah untuk task ini.
          </p>
        </div>

        {error && (
          <p className="text-xs text-[#ffb4ab] bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#aef846] text-[#112000] font-bold text-sm rounded-xl shadow-[0_0_15px_rgba(174,248,70,0.3)] hover:shadow-[0_0_25px_rgba(174,248,70,0.5)] hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isGenerating ? (
            <>
              <span className="material-symbols-outlined animate-spin text-base">
                progress_activity
              </span>
              Generating...
            </>
          ) : (
            <>
              <span
                className="material-symbols-outlined text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              Generate AI Roadmap
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-[#242a3a] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#aef846] rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              boxShadow: progressPct > 0 ? "0 0 8px rgba(174,248,70,0.6)" : "none",
            }}
          />
        </div>
        <span className="text-xs font-bold text-[#aef846] tabular-nums whitespace-nowrap">
          {doneCount}/{totalCount} done
        </span>
      </div>

      {/* Current active step highlight */}
      {currentStep && !taskDone && (
        <div className="bg-[#aef846]/8 border border-[#aef846]/30 rounded-xl p-3 flex items-center gap-3">
          <span
            className="material-symbols-outlined text-[#aef846] text-sm animate-pulse"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            play_arrow
          </span>
          <p className="text-xs font-semibold text-[#aef846]">
            Langkah aktif: {currentStep.title}
          </p>
        </div>
      )}

      {/* Task completed banner */}
      {taskDone && (
        <div className="bg-[#aef846]/10 border border-[#aef846]/40 rounded-xl p-4 flex items-center gap-3 shadow-[0_0_20px_rgba(174,248,70,0.15)]">
          <span
            className="material-symbols-outlined text-[#aef846] text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            celebration
          </span>
          <div>
            <p className="text-sm font-bold text-[#aef846]">Task selesai! 🎉</p>
            <p className="text-xs text-[#c1cab0]">Semua langkah sudah dikerjakan.</p>
          </div>
        </div>
      )}

      {/* Steps list */}
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-[15px] top-5 bottom-5 w-px bg-[#242a3a]" />

        <div className="flex flex-col gap-5">
          {localSteps.map((step, i) => {
            const isDone = step.status === "done";
            const isActive = step.status === "in_progress";
            const isPendingStep = step.status === "pending";
            const isLoading = loadingStepId === step.id;
            const isLearn = step.step_type === "learn";
            const isReview = step.step_type === "review";

            // Warna step indicator berdasarkan type
            const indicatorColor = isLearn
              ? { border: "border-[#adc6ff]", bg: "bg-[#adc6ff]", glow: "shadow-[0_0_12px_rgba(173,198,255,0.4)]" }
              : isReview
              ? { border: "border-[#f8daee]", bg: "bg-[#f8daee]", glow: "shadow-[0_0_12px_rgba(248,218,238,0.4)]" }
              : { border: "border-[#aef846]", bg: "bg-[#aef846]", glow: "shadow-[0_0_12px_rgba(174,248,70,0.4)]" };

            return (
              <div key={step.id} className="flex gap-4 relative z-10">
                {/* Step indicator */}
                <div className="flex-shrink-0 mt-0.5">
                  {isDone ? (
                    <button
                      onClick={() => handleUndo(step)}
                      disabled={!!loadingStepId}
                      title="Undo"
                      className={`w-8 h-8 rounded-full ${indicatorColor.bg} text-[#112000] flex items-center justify-center ${indicatorColor.glow} hover:scale-110 transition-transform disabled:cursor-not-allowed`}
                    >
                      {isLoading ? (
                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-sm font-bold">check</span>
                      )}
                    </button>
                  ) : isActive ? (
                    <div className={`w-8 h-8 rounded-full bg-[#191f2f] border-2 ${indicatorColor.border} flex items-center justify-center ${indicatorColor.glow}`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${indicatorColor.bg} animate-pulse`} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#191f2f] border-2 border-[#424936] flex items-center justify-center">
                      {isLearn ? (
                        <span className="material-symbols-outlined text-[#adc6ff] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                      ) : isReview ? (
                        <span className="material-symbols-outlined text-[#f8daee] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>rate_review</span>
                      ) : (
                        <span className="text-xs font-bold text-[#c1cab0]">{i + 1}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Step content */}
                <div
                  className={`flex-1 rounded-xl p-4 border transition-all ${
                    isActive && isLearn
                      ? "bg-[#111D30] border-[#adc6ff]/30 shadow-[0_0_15px_rgba(173,198,255,0.08)]"
                      : isActive
                      ? "bg-[#111D30] border-[#aef846]/30 shadow-[0_0_15px_rgba(174,248,70,0.08)]"
                      : isDone
                      ? "bg-[#0d1322] border-[#1E2F4D] opacity-70"
                      : "bg-[#191f2f] border-[#424936]/50"
                  }`}
                >
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {isActive && (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        isLearn
                          ? "text-[#adc6ff] bg-[#adc6ff]/10 border-[#adc6ff]/20"
                          : "text-[#aef846] bg-[#aef846]/10 border-[#aef846]/20"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLearn ? "bg-[#adc6ff]" : "bg-[#aef846]"}`} />
                        Sedang dikerjakan
                      </span>
                    )}
                    {isLearn && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#adc6ff] uppercase tracking-wider bg-[#adc6ff]/8 border border-[#adc6ff]/15 px-2 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                        Materi
                      </span>
                    )}
                    {isReview && !isActive && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#f8daee] uppercase tracking-wider bg-[#f8daee]/8 border border-[#f8daee]/15 px-2 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>rate_review</span>
                        Review
                      </span>
                    )}
                  </div>

                  <h4
                    className={`text-sm font-bold mb-1 ${
                      isDone ? "text-[#c1cab0] line-through" : isActive ? "text-[#ffffff]" : "text-[#dde2f8]"
                    }`}
                  >
                    {step.title}
                  </h4>

                  {step.description && (
                    <p className={`text-xs leading-relaxed ${isDone ? "text-[#424936]" : "text-[#c1cab0]"}`}>
                      {step.description}
                    </p>
                  )}

                  {/* Learning content — tampilkan selalu untuk step type learn */}
                  {isLearn && step.content && (
                    <LearningContent content={step.content} />
                  )}

                  {/* Action button */}
                  {(isActive || isPendingStep) && !taskDone && (
                    <button
                      onClick={() => handleComplete(step)}
                      disabled={!!loadingStepId || isPendingStep}
                      className={`mt-3 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                        isActive && isLearn
                          ? "bg-[#adc6ff] text-[#0d1322] hover:shadow-[0_0_12px_rgba(173,198,255,0.4)] hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                          : isActive
                          ? "bg-[#aef846] text-[#112000] hover:shadow-[0_0_12px_rgba(174,248,70,0.4)] hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                          : "bg-[#2f3445] text-[#c1cab0] cursor-not-allowed opacity-50"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {isActive ? (isLearn ? "check_circle" : "check_circle") : "lock"}
                          </span>
                          {isActive
                            ? isLearn ? "Sudah Dipelajari" : "Tandai Selesai"
                            : "Selesaikan langkah sebelumnya"}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-[#ffb4ab] bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Manual complete all button */}
      {!taskDone && localSteps.length > 0 && (
        <button
          onClick={handleMarkDone}
          disabled={isPending}
          className="mt-1 w-full flex items-center justify-center gap-2 text-xs text-[#c1cab0] hover:text-[#aef846] transition-colors py-2 border border-dashed border-[#424936] rounded-xl hover:border-[#aef846]/30"
        >
          <span className="material-symbols-outlined text-sm">done_all</span>
          Tandai semua selesai sekarang
        </button>
      )}

      {/* Regenerate roadmap */}
      {localSteps.length > 0 && (
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating || !!loadingStepId}
          className="w-full flex items-center justify-center gap-2 text-xs text-[#8c947c] hover:text-[#adc6ff] transition-colors py-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isRegenerating ? (
            <>
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              Regenerating dengan AI...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Regenerate roadmap dengan AI
            </>
          )}
        </button>
      )}
    </div>
  );
}
