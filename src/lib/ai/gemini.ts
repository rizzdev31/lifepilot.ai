import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ExtractedTask, Task } from "@/lib/types";

// ── shared helpers ──────────────────────────────────────────────

function getModel() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY belum diset di .env.local");
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

/** Parse JSON array dari berbagai format response Gemini */
function parseJsonArray(raw: string): unknown[] | null {
  const strategies = [
    () => raw.trim(),
    () => raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim(),
    () => { const m = raw.match(/\[[\s\S]*\]/); return m?.[0] ?? null; },
    () => { const m = raw.match(/\{[\s\S]*\}/); return m ? `[${m[0]}]` : null; },
  ];

  for (const fn of strategies) {
    try {
      const s = fn();
      if (!s) continue;
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* next */ }
  }
  return null;
}

// ── 1. TASK EXTRACTION ─────────────────────────────────────────

export async function extractTasksFromTranscript(
  transcript: string
): Promise<ExtractedTask[]> {
  const model = getModel();
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const prompt = `Kamu adalah AI ekstraksi task untuk aplikasi produktivitas LifePilot AI.

TUGAS: Ekstrak SEMUA task/to-do dari transcript percakapan berikut dan kembalikan sebagai JSON array.

Transcript: """
${transcript}
"""

Tanggal hari ini: ${today}
Tanggal besok: ${tomorrow}

PENTING: Kembalikan HANYA JSON array yang valid. TIDAK boleh ada teks lain, TIDAK ada markdown.

Format setiap task:
{"title":"...","description":"...atau null","priority":"urgent|high|medium|low","deadline":"ISO8601 atau null","category":"Business|Personal|Work|Health|Finance|Content|Learning|Shopping|Travel|General","estimated_duration": menit atau null}

ATURAN PRIORITAS: urgent=secepatnya/ASAP, high=penting/segera, medium=default, low=santai/nanti
ATURAN DEADLINE: besok→${tomorrow}T09:00:00+07:00, hari ini→${today}T09:00:00+07:00, malam→${today}T20:00:00+07:00, sore→${today}T15:00:00+07:00

Jika tidak ada task → kembalikan: []`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();
  console.log("[Gemini/extract] Response:", raw.substring(0, 300));

  const parsed = parseJsonArray(raw);
  if (!parsed) throw new Error(`Gagal parse response Gemini: ${raw.substring(0, 150)}`);

  return parsed
    .filter((t): t is Record<string, unknown> => !!t && typeof t === "object")
    .map((t) => ({
      title: String(t.title ?? "Task baru").slice(0, 80),
      description: t.description ? String(t.description) : undefined,
      priority: (["urgent", "high", "medium", "low"].includes(String(t.priority))
        ? t.priority : "medium") as ExtractedTask["priority"],
      deadline: t.deadline ? String(t.deadline) : undefined,
      category: t.category ? String(t.category) : undefined,
      estimated_duration: typeof t.estimated_duration === "number"
        ? t.estimated_duration : undefined,
    }));
}

// ── 2. ROADMAP GENERATION (dengan learning materials) ──────────

export interface RoadmapStepRaw {
  title: string;
  description: string;
  order: number;
  step_type: "action" | "learn" | "review";
  content?: string; // materi belajar — hanya untuk step_type="learn"
}

export async function generateRoadmapForTask(
  task: Pick<Task, "title" | "description" | "category" | "priority" | "deadline" | "estimated_duration">
): Promise<RoadmapStepRaw[]> {
  const model = getModel();

  const deadlineStr = task.deadline
    ? new Date(task.deadline).toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long",
      })
    : "Tidak ada deadline";

  const durationStr = task.estimated_duration
    ? `${task.estimated_duration} menit`
    : "Tidak ditentukan";

  const prompt = `Kamu adalah LifePilot AI — asisten produktivitas cerdas.

DETAIL TASK:
- Judul: ${task.title}
- Deskripsi: ${task.description ?? "-"}
- Kategori: ${task.category ?? "General"}
- Prioritas: ${task.priority}
- Deadline: ${deadlineStr}
- Estimasi: ${durationStr}

TUGAS: Buat 3-5 langkah roadmap praktis. WAJIB sertakan minimal 1 langkah "learn" yang relevan dengan task ini. Setiap langkah harus memiliki step_type:
- "action" → langkah melakukan sesuatu
- "learn"  → langkah mempelajari/mempersiapkan pengetahuan (WAJIB ada minimal 1)
- "review" → langkah cek/evaluasi akhir

Untuk langkah step_type="learn" WAJIB sertakan field "content" berisi materi belajar singkat yang relevan dan langsung bisa dipraktikkan. Format content:
• Gunakan header **Judul:** untuk kategorisasi
• Gunakan bullet • **istilah** — penjelasan untuk poin-poin
• Maks 6-8 poin, padat dan berguna

Untuk langkah step_type="action" atau "review" → "content" harus null.

PENTING: Kembalikan HANYA JSON array valid, tanpa markdown, tanpa penjelasan.

Format:
[{"title":"judul (kata kerja, maks 50 char)","description":"panduan 1-2 kalimat HOW-TO","order":1,"step_type":"action","content":null}]

Contoh task "Persiapan rapat bisnis dalam bahasa Inggris":
[
  {"title":"Pahami agenda rapat","description":"Baca kembali undangan rapat, catat topik utama dan siapa saja pesertanya.","order":1,"step_type":"action","content":null},
  {"title":"Pelajari frasa bisnis penting","description":"Kuasai kalimat pembuka, menyetujui/menolak ide, dan menutup diskusi dalam bahasa bisnis.","order":2,"step_type":"learn","content":"**Frasa Pembuka:**\n• **Shall we get started?** — Ayo mulai\n• **The purpose of today's meeting is...** — Tujuan rapat ini adalah...\n\n**Menyampaikan Pendapat:**\n• **In my opinion...** — Menurut saya\n• **I'd like to point out that...** — Saya ingin menyoroti bahwa\n• **Could you elaborate on that?** — Bisakah Anda jelaskan lebih lanjut?\n\n**Tips Cepat:**\n• Speak slowly and clearly\n• Confirm understanding: 'Does that make sense to everyone?'"},
  {"title":"Siapkan poin presentasi","description":"Buat 3 poin utama yang ingin Anda sampaikan, masing-masing 1 kalimat singkat.","order":3,"step_type":"action","content":null},
  {"title":"Review & latihan singkat","description":"Baca ulang frasa bisnis sekali, lalu coba ucapkan poin-poin Anda dengan lantang 1-2 kali.","order":4,"step_type":"review","content":null}
]`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();
  console.log("[Gemini/roadmap]", task.title, "→", raw.substring(0, 300));

  const parsed = parseJsonArray(raw);
  if (!parsed) {
    console.error("[Gemini/roadmap] Parse gagal, fallback ke default");
    return defaultSteps(task.title);
  }

  const steps = parsed
    .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
    .map((s, i) => ({
      title: String(s.title ?? `Langkah ${i + 1}`).slice(0, 80),
      description: s.description ? String(s.description) : "Selesaikan langkah ini.",
      order: typeof s.order === "number" ? s.order : i + 1,
      step_type: (["action", "learn", "review"].includes(String(s.step_type))
        ? s.step_type : "action") as RoadmapStepRaw["step_type"],
      content: (s.step_type === "learn" && s.content && String(s.content).length > 5)
        ? String(s.content)
        : undefined,
    }));

  if (steps.length === 0) return defaultSteps(task.title);
  return steps;
}

/** Fallback 4 langkah universal jika Gemini gagal — tetap ada learn step */
function defaultSteps(taskTitle: string): RoadmapStepRaw[] {
  return [
    {
      title: "Persiapan & perencanaan",
      description: `Luangkan 5 menit untuk memahami apa yang dibutuhkan untuk menyelesaikan task ini. Kumpulkan semua bahan yang diperlukan.`,
      order: 1,
      step_type: "action",
    },
    {
      title: "Pelajari strategi yang tepat",
      description: `Kuasai pendekatan terbaik agar "${taskTitle}" dapat diselesaikan secara efisien dan efektif.`,
      order: 2,
      step_type: "learn",
      content: `**Prinsip Produktivitas Kunci:**\n• **Time-blocking** — Jadwalkan waktu khusus tanpa gangguan untuk task ini\n• **Single-tasking** — Fokus satu hal, selesaikan tuntas sebelum lanjut\n• **Parkinson's Law** — Beri batas waktu ketat agar tidak berlarut-larut\n\n**Framework Eksekusi:**\n• **Identifikasi** output yang diinginkan sejelas mungkin\n• **Pecah** menjadi sub-langkah yang bisa diselesaikan dalam 25 menit\n• **Eliminasi** distraksi (mode fokus, tutup tab tidak perlu)\n\n**Tips:** Mulai dari bagian yang paling mudah untuk membangun momentum, lalu tackle bagian tersulit saat energi masih tinggi.`,
    },
    {
      title: "Eksekusi utama",
      description: `Fokus kerjakan "${taskTitle}". Matikan notifikasi dan set timer untuk deep work.`,
      order: 3,
      step_type: "action",
    },
    {
      title: "Review & selesaikan",
      description: "Cek hasil pekerjaan, perbaiki jika ada yang kurang, lalu tandai task sebagai selesai.",
      order: 4,
      step_type: "review",
    },
  ];
}

// ── 3. AI DAILY BRIEFING ───────────────────────────────────────

export interface BriefingContent {
  greeting: string;       // 2-3 kalimat personal summary
  focus_text: string;     // 1 kalimat rekomendasi fokus
  insight: string;        // 1 kalimat productivity tip/quote
}

export async function generateBriefingContent(context: {
  name: string;
  totalTasks: number;
  urgentCount: number;
  doneCount: number;
  topTask?: string;
}): Promise<BriefingContent> {
  const fallback: BriefingContent = {
    greeting: context.totalTasks === 0
      ? `Hei ${context.name}, hari ini slate kamu masih bersih. Tap mic dan bilang apa yang perlu diselesaikan — AI siap atur semuanya.`
      : `${context.name}, kamu punya ${context.totalTasks} task aktif hari ini.${context.urgentCount > 0 ? ` ${context.urgentCount} butuh perhatian segera.` : " Semua manageable."} Keep going.`,
    focus_text: context.topTask
      ? `Mulai dengan "${context.topTask}" — selesaikan ini dulu sebelum yang lain.`
      : "Gunakan Voice AI untuk capture semua yang ada di kepala kamu sekarang.",
    insight: context.doneCount > 0
      ? `Kamu udah selesaikan ${context.doneCount} task hari ini — momentum itu aset. Stack terus.`
      : "Single-tasking beats multitasking every time. Pick one, go deep.",
  };

  if (!process.env.GEMINI_API_KEY) return fallback;

  try {
    const model = getModel();
    const prompt = `Kamu adalah LifePilot AI. Generate briefing harian untuk ${context.name}.

Konteks: ${context.totalTasks} task aktif, ${context.urgentCount} urgent, ${context.doneCount} selesai hari ini.
${context.topTask ? `Task prioritas utama: "${context.topTask}".` : "Belum ada task."}

Kembalikan HANYA JSON valid (tanpa markdown):
{
  "greeting": "2-3 kalimat personal — campur Indo-Inggris, nada calm+smart, sebutkan angka relevan, akhiri dengan micro-action. Maks 60 kata.",
  "focus_text": "1 kalimat rekomendasi spesifik apa yang harus dikerjakan pertama. Maks 25 kata.",
  "insight": "1 kalimat productivity tip/quote yang relevan dengan kondisi user. Maks 20 kata."
}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(clean);

    return {
      greeting: String(parsed.greeting ?? fallback.greeting),
      focus_text: String(parsed.focus_text ?? fallback.focus_text),
      insight: String(parsed.insight ?? fallback.insight),
    };
  } catch {
    return fallback;
  }
}
