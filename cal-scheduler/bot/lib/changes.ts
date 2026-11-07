/** Staged calendar writes. Google is contacted only when a staged change is applied. */

export type CreateChange = {
  action: "create";
  summary: string;
  start: string;
  end: string;
  attendeeEmails: string[];
  description?: string;
  location?: string;
  addGoogleMeet: boolean;
  calendarId: string;
  timeZone: string;
};

export type UpdateChange = {
  action: "update";
  eventId: string;
  calendarId: string;
  timeZone: string;
  summary?: string;
  start?: string;
  end?: string;
  attendeeEmails?: string[];
  description?: string;
  location?: string;
  addGoogleMeet?: boolean;
};

export type DeleteChange = {
  action: "delete";
  eventId: string;
  calendarId: string;
  notify: "ALL" | "NONE" | "EXTERNAL_ONLY";
};

export type StagedChange = CreateChange | UpdateChange | DeleteChange;

export type StoredProposal = {
  id: string;
  preview: string;
  change: StagedChange;
  createdAt: string;
  status: "staged" | "applying" | "applied";
  result?: Record<string, string | number | boolean | null>;
  lastError?: string;
};

export function proposalKey(id: string): string {
  return `schedule:proposal:${id}`;
}

export const PREFERENCES_KEY = "schedule:preferences";

export function previewOf(change: StagedChange): string {
  if (change.action === "create") {
    const guests = change.attendeeEmails.length > 0 ? ` with ${change.attendeeEmails.join(", ")}` : "";
    const meet = change.addGoogleMeet ? " and a Google Meet link" : "";
    return `Create "${change.summary}" from ${change.start} to ${change.end}${guests}${meet} on calendar ${change.calendarId}.`;
  }
  if (change.action === "update") {
    const bits = [
      change.summary ? `title "${change.summary}"` : "",
      change.start ? `start ${change.start}` : "",
      change.end ? `end ${change.end}` : "",
      change.attendeeEmails ? `guests ${change.attendeeEmails.join(", ")}` : "",
      change.location ? `location ${change.location}` : "",
    ].filter((bit) => bit !== "");
    return `Update event ${change.eventId} (${bits.join(", ")}) on calendar ${change.calendarId}.`;
  }
  return `Delete event ${change.eventId} on calendar ${change.calendarId} and notify ${change.notify}.`;
}

export function createEventArgs(change: CreateChange): Record<string, unknown> {
  return {
    summary: change.summary,
    startTime: change.start,
    endTime: change.end,
    calendarId: change.calendarId,
    timeZone: change.timeZone,
    addGoogleMeetUrl: change.addGoogleMeet,
    ...(change.description ? { description: change.description } : {}),
    ...(change.location ? { location: change.location } : {}),
    ...(change.attendeeEmails.length > 0
      ? { attendees: change.attendeeEmails.map((email) => ({ email })) }
      : {}),
  };
}

export function updateEventArgs(change: UpdateChange): Record<string, unknown> {
  return {
    eventId: change.eventId,
    calendarId: change.calendarId,
    timeZone: change.timeZone,
    ...(change.summary ? { summary: change.summary } : {}),
    ...(change.start ? { startTime: change.start } : {}),
    ...(change.end ? { endTime: change.end } : {}),
    ...(change.description ? { description: change.description } : {}),
    ...(change.location ? { location: change.location } : {}),
    ...(change.addGoogleMeet !== undefined ? { addGoogleMeetUrl: change.addGoogleMeet } : {}),
    ...(change.attendeeEmails && change.attendeeEmails.length > 0
      ? { addedAttendees: change.attendeeEmails.map((email) => ({ email })) }
      : {}),
  };
}

export function deleteEventArgs(change: DeleteChange): Record<string, unknown> {
  return {
    eventId: change.eventId,
    calendarId: change.calendarId,
    notificationLevel: change.notify,
  };
}

export function isStoredProposal(value: unknown): value is StoredProposal {
  if (value === null || typeof value !== "object") return false;
  const raw = value as Record<string, unknown>;
  const change = raw.change;
  return typeof raw.id === "string"
    && typeof raw.preview === "string"
    && typeof raw.createdAt === "string"
    && (raw.status === "staged" || raw.status === "applying" || raw.status === "applied")
    && change !== null
    && typeof change === "object"
    && (change as { action?: string }).action !== undefined;
}
