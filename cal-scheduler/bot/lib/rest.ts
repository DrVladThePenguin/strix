/** Google Calendar REST calls for a refresh token the person created. */

import { randomUUID } from "node:crypto";

import { clip, type McpResult } from "./google.js";
import { findOpenSlots, type SchedulePreferences } from "./slots.js";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/calendar/v3";

let cached: { token: string; exp: number } | undefined;

export function restConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN);
}

export async function restCall(tool: string, args: Record<string, unknown>): Promise<McpResult> {
  try {
    const value = await dispatch(tool, args);
    return { content: [{ type: "text", text: JSON.stringify(value) }] };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: clip(error instanceof Error ? error.message : "Google Calendar request failed.") }],
    };
  }
}

async function dispatch(tool: string, args: Record<string, unknown>): Promise<unknown> {
  if (tool === "list_events") return listEvents(args);
  if (tool === "suggest_time") return suggestTime(args);
  if (tool === "create_event") return createEvent(args);
  if (tool === "update_event") return updateEvent(args);
  if (tool === "delete_event") return deleteEvent(args);
  throw new Error(`Unsupported calendar operation: ${tool}`);
}

async function listEvents(args: Record<string, unknown>): Promise<unknown> {
  const params = new URLSearchParams({
    timeMin: text(args.startTime),
    timeMax: text(args.endTime),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "20",
  });
  if (typeof args.timeZone === "string") params.set("timeZone", args.timeZone);
  if (typeof args.fullText === "string") params.set("q", args.fullText);
  return api(`/calendars/${id(args.calendarId)}/events?${params}`);
}

async function suggestTime(args: Record<string, unknown>): Promise<unknown> {
  const emails = stringList(args.attendeeEmails);
  const prefs = args.preferences;
  const preference = prefs !== null && typeof prefs === "object" ? prefs as Record<string, unknown> : {};
  const schedule: SchedulePreferences = {
    timeZone: text(args.timeZone, "UTC"),
    workStart: text(preference.startHour, "09:00"),
    workEnd: text(preference.endHour, "17:00"),
    defaultDurationMinutes: numberValue(args.durationMinutes, 30),
    bufferMinutes: numberValue(preference.bufferMinutes, 0),
    excludeWeekends: preference.excludeWeekends !== false,
    addGoogleMeet: false,
    calendarId: "primary",
    confirmed: true,
  };
  const report = await api("/freeBusy", {
    method: "POST",
    body: JSON.stringify({
      timeMin: text(args.startTime),
      timeMax: text(args.endTime),
      timeZone: schedule.timeZone,
      items: emails.map((email) => ({ id: email })),
    }),
  }) as { calendars?: Record<string, { busy?: Array<{ start?: string; end?: string }>; errors?: unknown[] }> };
  const unavailable: string[] = [];
  const busy: Array<{ start: string; end: string }> = [];
  for (const email of emails) {
    const calendar = report.calendars?.[email];
    if (!calendar || (calendar.errors && calendar.errors.length > 0)) {
      unavailable.push(email);
      continue;
    }
    for (const block of calendar.busy ?? []) {
      if (typeof block.start === "string" && typeof block.end === "string") busy.push({ start: block.start, end: block.end });
    }
  }
  if (unavailable.length > 0) {
    throw new Error(`Could not read free/busy for ${unavailable.join(", ")}.`);
  }
  const { slots } = findOpenSlots({
    busy,
    preferences: schedule,
    windowStart: text(args.startTime),
    windowEnd: text(args.endTime),
    durationMinutes: schedule.defaultDurationMinutes,
    limit: numberValue(preference.pageSize, 5),
  });
  return { timeSlots: slots.map((slot) => ({ startTime: slot.start, endTime: slot.end })) };
}

async function createEvent(args: Record<string, unknown>): Promise<unknown> {
  const meet = args.addGoogleMeetUrl === true;
  const body: Record<string, unknown> = {
    summary: text(args.summary),
    start: { dateTime: text(args.startTime), timeZone: text(args.timeZone, "UTC") },
    end: { dateTime: text(args.endTime), timeZone: text(args.timeZone, "UTC") },
  };
  if (typeof args.description === "string") body.description = args.description;
  if (typeof args.location === "string") body.location = args.location;
  const attendees = attendeesOf(args.attendees);
  if (attendees.length > 0) body.attendees = attendees;
  if (meet) {
    body.conferenceData = {
      createRequest: { requestId: randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } },
    };
  }
  const query = meet ? "?conferenceDataVersion=1" : "";
  return api(`/calendars/${id(args.calendarId)}/events${query}`, { method: "POST", body: JSON.stringify(body) });
}

async function updateEvent(args: Record<string, unknown>): Promise<unknown> {
  const calendarId = id(args.calendarId);
  const eventId = id(args.eventId);
  const existing = await api(`/calendars/${calendarId}/events/${eventId}`) as { attendees?: Array<{ email?: string }> };
  const body: Record<string, unknown> = {};
  if (typeof args.summary === "string") body.summary = args.summary;
  if (typeof args.description === "string") body.description = args.description;
  if (typeof args.location === "string") body.location = args.location;
  if (typeof args.startTime === "string") body.start = { dateTime: args.startTime, timeZone: text(args.timeZone, "UTC") };
  if (typeof args.endTime === "string") body.end = { dateTime: args.endTime, timeZone: text(args.timeZone, "UTC") };
  const added = attendeesOf(args.addedAttendees);
  if (added.length > 0) {
    const seen = new Set((existing.attendees ?? []).map((person) => person.email).filter((email): email is string => typeof email === "string"));
    body.attendees = [
      ...(existing.attendees ?? []),
      ...added.filter((person) => !seen.has(person.email)),
    ];
  }
  if (args.addGoogleMeetUrl === true) {
    body.conferenceData = {
      createRequest: { requestId: randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } },
    };
  }
  const query = args.addGoogleMeetUrl === true ? "?conferenceDataVersion=1" : "";
  return api(`/calendars/${calendarId}/events/${eventId}${query}`, { method: "PATCH", body: JSON.stringify(body) });
}

async function deleteEvent(args: Record<string, unknown>): Promise<unknown> {
  const notify = args.notificationLevel === "NONE"
    ? "none"
    : args.notificationLevel === "EXTERNAL_ONLY"
      ? "externalOnly"
      : "all";
  await api(`/calendars/${id(args.calendarId)}/events/${id(args.eventId)}?sendUpdates=${notify}`, { method: "DELETE" });
  return { status: "cancelled", id: text(args.eventId) };
}

async function api(path: string, init?: { method?: string; body?: string }): Promise<unknown> {
  const token = await accessToken();
  const response = await fetch(`${API}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      authorization: `Bearer ${token}`,
      ...(init?.body ? { "content-type": "application/json" } : {}),
    },
    ...(init?.body ? { body: init.body } : {}),
  });
  if (response.status === 204) return {};
  const parsed = await response.json().catch(() => ({})) as { error?: { message?: string; status?: string } };
  if (!response.ok) {
    const reason = parsed.error?.status ?? parsed.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`Google Calendar request failed (${clip(reason, 180)}).`);
  }
  return parsed;
}

async function accessToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 30_000) return cached.token;
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN ?? "";
  if (clientId === "" || clientSecret === "" || refreshToken === "") {
    throw new Error("Google Calendar credentials are missing.");
  }
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });
  const parsed = await response.json().catch(() => ({})) as { access_token?: string; expires_in?: number; error?: string };
  if (!response.ok || typeof parsed.access_token !== "string") {
    const reason = parsed.error ?? `HTTP ${response.status}`;
    throw new Error(`Google sign-in expired (${clip(reason, 80)}). Create a new refresh token.`);
  }
  cached = { token: parsed.access_token, exp: Date.now() + (parsed.expires_in ?? 3600) * 1000 };
  return parsed.access_token;
}

function id(value: unknown): string {
  const raw = typeof value === "string" && value.trim() !== "" ? value.trim() : "primary";
  return encodeURIComponent(raw);
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function attendeesOf(value: unknown): Array<{ email: string }> {
  if (!Array.isArray(value)) return [];
  const people: Array<{ email: string }> = [];
  for (const item of value) {
    if (item !== null && typeof item === "object" && typeof (item as { email?: unknown }).email === "string") {
      people.push({ email: (item as { email: string }).email });
    }
  }
  return people;
}
