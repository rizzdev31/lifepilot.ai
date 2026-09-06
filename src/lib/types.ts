export type Priority = "urgent" | "high" | "medium" | "low";
export type TaskStatus = "pending" | "in_progress" | "done" | "overdue";
export type ReminderChannel = "telegram" | "email" | "push";
export type RoadmapStepStatus = "done" | "in_progress" | "pending";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  google_id?: string;
  telegram_chat_id?: string;
  created_at: string;
}

export interface VoiceNote {
  id: string;
  user_id: string;
  audio_url?: string;
  transcript: string;
  ai_summary?: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  voice_note_id?: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  category?: string;
  deadline?: string;
  estimated_duration?: number;
  created_at: string;
  updated_at: string;
}

export type StepType = "action" | "learn" | "review";

export interface RoadmapStep {
  id: string;
  task_id: string;
  title: string;
  description?: string;
  scheduled_at?: string;
  status: RoadmapStepStatus;
  order: number;
  step_type?: StepType;
  content?: string; // materi belajar untuk step_type="learn"
}

export interface Reminder {
  id: string;
  task_id: string;
  channel: ReminderChannel;
  message: string;
  remind_at: string;
  status: "pending" | "sent" | "failed";
}

export interface CalendarEvent {
  id: string;
  task_id: string;
  google_event_id?: string;
  calendar_link?: string;
}

export interface ExtractedTask {
  title: string;
  deadline?: string;
  priority: Priority;
  category?: string;
  estimated_duration?: number;
  description?: string;
}

export interface AIBriefing {
  greeting: string;
  summary: string;
  tasks_today: number;
  urgent_count: number;
  done_count: number;
  focus_recommendation?: string;
  warnings?: string[];
  productivity_insight?: string;
}
