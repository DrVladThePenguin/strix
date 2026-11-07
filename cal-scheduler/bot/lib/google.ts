/** Normalize Google Calendar MCP payloads. No network calls live here. */

import type { BusyInterval } from "./slots.js";

export type CalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  htmlLink: string;
  attendeeEmails: string[];
};

export type McpResult = {
  isError?: boolean;
  structuredContent?: { [key: string]: unknown };
  content: ReadonlyArray<{ type: string; text?: string }>;
};

export function mcpData(result: McpResult): { ok: true; value: unknown } | { ok: false; message: string } {
  const text = result.content
    .map((block) => (typeof block.text === "string" ? block.text : ""))
    .join("\n")
    .trim();
  if (result.isError === true) {
    return { ok: false, message: clip(text || "Google Calendar rejected the request.") };
  }
  if (result.structuredContent && Object.keys(result.structuredContent).length > 0) {
    return { ok: true, value: result.structuredContent };
  }
  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      return { ok: true, value: JSON.parse(text) as unknown };
    } catch {
      return { ok: false, message: "Google Calendar returned unreadable data." };
    }
  }
  if (text !== "") return { ok: true, value: { text } };
  return { ok: true, value: {} };
}

export function extractEvents(payload: unknown): CalendarEvent[] {
  const list = eventArray(payload);
  const events: CalendarEvent[] = [];
  for (const item of list) {
    if (item === null || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const start = instantOf(record.startTime) ?? instantOf(record.start);
    const end = instantOf(record.endTime) ?? instantOf(record.end);
    if (start === undefined || end === undefined) continue;
    const id = typeof record.id === "string" ? record.id : typeof record.eventId === "string" ? record.eventId : "";
    events.push({
      id,
      summary: clip(typeof record.summary === "string" ? record.summary : "(no title)", 180),
      start,
      end,
      htmlLink: typeof record.htmlLink === "string" ? record.htmlLink : "",
      attendeeEmails: emailsOf(record.attendees),
    });
  }
  return events;
}

export function extractSlots(payload: unknown): BusyInterval[] {
  if (payload === null || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  const list = firstArray(record, ["timeSlots", "slots", "suggestions"]);
  const slots: BusyInterval[] = [];
  for (const item of list) {
    if (item === null || typeof item !== "object") continue;
    const slot = item as Record<string, unknown>;
    const start = instantOf(slot.startTime) ?? instantOf(slot.start);
    const end = instantOf(slot.endTime) ?? instantOf(slot.end);
    if (start !== undefined && end !== undefined) slots.push({ start, end });
  }
  return slots;
}

export function extractLink(payload: unknown): string {
  if (payload === null || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  if (typeof record.htmlLink === "string") return record.htmlLink;
  const event = record.event;
  if (event !== null && typeof event === "object" && typeof (event as { htmlLink?: unknown }).htmlLink === "string") {
    return (event as { htmlLink: string }).htmlLink;
  }
  return "";
}

export function clip(value: string, max = 400): string {
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
  return cleaned.length <= max ? cleaned : `${cleaned.slice(0, max)}…`;
}

function eventArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload === null || typeof payload !== "object") return [];
  return firstArray(payload as Record<string, unknown>, ["events", "items", "eventList"]);
}

function firstArray(record: Record<string, unknown>, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function instantOf(value: unknown): string | undefined {
  if (typeof value === "string" && value.includes("T")) return value;
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.dateTime === "string") return record.dateTime;
    if (typeof record.date === "string") return `${record.date}T00:00:00Z`;
  }
  return undefined;
}

function emailsOf(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const emails: string[] = [];
  for (const item of value) {
    if (item !== null && typeof item === "object" && typeof (item as { email?: unknown }).email === "string") {
      emails.push((item as { email: string }).email);
    }
  }
  return emails.slice(0, 12);
}
