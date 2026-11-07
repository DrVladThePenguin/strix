import type { DeleteChange, StagedChange } from "./changes.js";
import type { SchedulePreferences } from "./slots.js";

export type ChangeInput = {
  action: "create" | "update" | "delete";
  summary?: string;
  start?: string;
  end?: string;
  attendeeEmails?: string[];
  description?: string;
  location?: string;
  eventId?: string;
  addGoogleMeet?: boolean;
  notify?: DeleteChange["notify"];
};

export function buildChange(
  input: ChangeInput,
  preferences: SchedulePreferences,
): StagedChange | { staged: false; code: string; message: string } {
  if (input.action === "delete") {
    if (!input.eventId) return { staged: false, code: "missing_event", message: "A delete needs the event id from read_schedule." };
    return { action: "delete", eventId: input.eventId, calendarId: preferences.calendarId, notify: input.notify ?? "ALL" };
  }
  if (input.start !== undefined && input.end !== undefined && new Date(input.end) <= new Date(input.start)) {
    return { staged: false, code: "bad_range", message: "The end time must be after the start time." };
  }
  if (input.action === "create") {
    if (!input.summary || !input.start || !input.end) {
      return { staged: false, code: "missing_fields", message: "A new event needs a title, start, and end." };
    }
    return {
      action: "create",
      summary: input.summary,
      start: input.start,
      end: input.end,
      attendeeEmails: input.attendeeEmails ?? [],
      ...(input.description ? { description: input.description } : {}),
      ...(input.location ? { location: input.location } : {}),
      addGoogleMeet: input.addGoogleMeet ?? preferences.addGoogleMeet,
      calendarId: preferences.calendarId,
      timeZone: preferences.timeZone,
    };
  }
  if (!input.eventId) return { staged: false, code: "missing_event", message: "An update needs the event id from read_schedule." };
  const hasField = input.summary || input.start || input.end || input.description || input.location
    || input.addGoogleMeet !== undefined || (input.attendeeEmails?.length ?? 0) > 0;
  if (!hasField) return { staged: false, code: "empty_update", message: "Say what should change on the event." };
  return {
    action: "update",
    eventId: input.eventId,
    calendarId: preferences.calendarId,
    timeZone: preferences.timeZone,
    ...(input.summary ? { summary: input.summary } : {}),
    ...(input.start ? { start: input.start } : {}),
    ...(input.end ? { end: input.end } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.location ? { location: input.location } : {}),
    ...(input.addGoogleMeet !== undefined ? { addGoogleMeet: input.addGoogleMeet } : {}),
    ...(input.attendeeEmails ? { attendeeEmails: input.attendeeEmails } : {}),
  };
}
