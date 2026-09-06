import { google } from "googleapis";
import type { Task } from "@/lib/types";

export interface CalendarEventResult {
  google_event_id: string;
  calendar_link: string;
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  task: Pick<Task, "title" | "description" | "deadline" | "estimated_duration">
): Promise<CalendarEventResult> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth });

  const start = new Date(task.deadline!);
  const durationMs = (task.estimated_duration ?? 60) * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: `[LifePilot] ${task.title}`,
      description: task.description ?? "",
      start: { dateTime: start.toISOString(), timeZone: "Asia/Jakarta" },
      end: { dateTime: end.toISOString(), timeZone: "Asia/Jakarta" },
      colorId: "2", // sage green — matches brand
    },
  });

  return {
    google_event_id: res.data.id ?? "",
    calendar_link: res.data.htmlLink ?? "",
  };
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  googleEventId: string
): Promise<void> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({ calendarId: "primary", eventId: googleEventId });
}
