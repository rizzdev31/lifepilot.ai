import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case "high":
    case "urgent":
      return "#aef846";
    case "medium":
      return "#adc6ff";
    case "low":
      return "#f59e0b";
    default:
      return "#8c947c";
  }
}

export function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "in_progress":
      return { label: "In Progress", color: "text-[#aef846]", bg: "bg-[#aef846]/10 border-[#aef846]/30" };
    case "done":
    case "completed":
      return { label: "Done", color: "text-[#adc6ff]", bg: "bg-[#adc6ff]/10 border-[#adc6ff]/30" };
    case "overdue":
      return { label: "Overdue", color: "text-[#ffb4ab]", bg: "bg-[#ffb4ab]/10 border-[#ffb4ab]/30" };
    default:
      return { label: "Pending", color: "text-[#c1cab0]", bg: "bg-[#c1cab0]/10 border-[#c1cab0]/30" };
  }
}
