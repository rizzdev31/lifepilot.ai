"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveReminders, getReminderCount } from "@/lib/supabase/queries";
import type { ReminderWithTask } from "@/lib/supabase/queries";

export async function fetchReminders(): Promise<{ reminders: ReminderWithTask[]; count: number }> {
  const [reminders, count] = await Promise.all([
    getActiveReminders(),
    getReminderCount(),
  ]);
  return { reminders, count };
}

export async function dismissReminder(reminderId: string): Promise<{ success: boolean }> {
  // Demo: skip DB call
  if (reminderId.startsWith("rem-")) return { success: true };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("reminders")
      .update({ status: "sent", updated_at: new Date().toISOString() })
      .eq("id", reminderId);
    return { success: !error };
  } catch {
    return { success: false };
  }
}
