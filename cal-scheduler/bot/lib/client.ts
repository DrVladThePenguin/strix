/** Preference store and the confirm-then-write path. Network access stays in the caller. */

import {
  PREFERENCES_KEY,
  createEventArgs,
  deleteEventArgs,
  isStoredProposal,
  previewOf,
  proposalKey,
  updateEventArgs,
  type StagedChange,
  type StoredProposal,
} from "./changes.js";
import { clip, extractEvents, extractLink, extractSlots, mcpData, type CalendarEvent, type McpResult } from "./google.js";
import {
  DEFAULT_PREFERENCES,
  findOpenSlots,
  fitsRules,
  mergePreferences,
  normalizePreferences,
  type BusyInterval,
  type SchedulePreferences,
} from "./slots.js";

export type KvStore = {
  get(key: string): Promise<unknown>;
  put(key: string, value: unknown): Promise<void>;
};

export type CalendarCaller = (tool: string, args: Record<string, unknown>) => Promise<McpResult>;

export type Result = {
  [key: string]: Result | Result[] | string | number | boolean | null;
};

function asResult(value: unknown): Result {
  return JSON.parse(JSON.stringify(value)) as Result;
}

const CONNECT = "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN. Create the refresh token with: node scripts/google-auth.mjs";

export async function readPreferences(kv: KvStore): Promise<SchedulePreferences> {
  return normalizePreferences(await kv.get(PREFERENCES_KEY));
}

export async function writePreferences(
  kv: KvStore,
  patch: Partial<SchedulePreferences>,
): Promise<SchedulePreferences> {
  const next = mergePreferences(await readPreferences(kv), patch);
  await kv.put(PREFERENCES_KEY, next);
  return next;
}

export async function readSchedule(
  call: CalendarCaller,
  preferences: SchedulePreferences,
  input: { start: string; end: string; query?: string },
): Promise<
  | { connected: true; events: CalendarEvent[]; preferences: SchedulePreferences }
  | { connected: false; events: []; preferences: SchedulePreferences; message: string }
> {
  const result = await call("list_events", {
    calendarId: preferences.calendarId,
    startTime: input.start,
    endTime: input.end,
    timeZone: preferences.timeZone,
    orderBy: "startTime",
    pageSize: 20,
    ...(input.query ? { fullText: input.query } : {}),
  });
  const parsed = mcpData(result);
  if (!parsed.ok) return { connected: false, events: [], preferences, message: parsed.message };
  return { connected: true, events: extractEvents(parsed.value), preferences };
}

export async function findTimes(
  call: CalendarCaller,
  preferences: SchedulePreferences,
  input: { start: string; end: string; durationMinutes: number; attendeeEmails: string[]; limit: number },
): Promise<Result> {
  const listed = await readSchedule(call, preferences, { start: input.start, end: input.end });
  if (!listed.connected) {
    return asResult({
      connected: false,
      slots: [],
      preferences,
      message: listed.message,
      connect: CONNECT,
    });
  }
  const busy: BusyInterval[] = listed.events.map((event) => ({ start: event.start, end: event.end }));
  const search = {
    busy,
    preferences,
    windowStart: input.start,
    windowEnd: input.end,
    durationMinutes: input.durationMinutes,
    limit: input.limit,
  };
  const local = findOpenSlots(search);
  let slots = local.slots;
  let checkedAttendees = false;
  let attendeeNote = "";
  if (input.attendeeEmails.length > 0) {
    const suggested = await call("suggest_time", {
      attendeeEmails: input.attendeeEmails,
      startTime: input.start,
      endTime: input.end,
      timeZone: preferences.timeZone,
      durationMinutes: input.durationMinutes,
      preferences: {
        startHour: preferences.workStart,
        endHour: preferences.workEnd,
        excludeWeekends: preferences.excludeWeekends,
        pageSize: input.limit,
        bufferMinutes: preferences.bufferMinutes,
      },
    });
    const parsed = mcpData(suggested);
    if (parsed.ok) {
      checkedAttendees = true;
      const theirs = extractSlots(parsed.value).filter((slot) => fitsRules(slot, search));
      if (theirs.length > 0) slots = theirs.slice(0, input.limit);
      else attendeeNote = "No overlap between your open hours and the other people's free time.";
    } else {
      attendeeNote = "Your calendar was checked. The other people's free time was not.";
    }
  }
  return asResult({
    connected: true,
    preferencesConfirmed: preferences.confirmed,
    slots,
    busy: listed.events.map((event) => ({
      id: event.id,
      summary: event.summary,
      start: event.start,
      end: event.end,
    })),
    checkedAttendees,
    note: [attendeeNote, local.clamped ? "The search window was capped at 14 days." : ""].filter(Boolean).join(" "),
    preferences,
  });
}

export async function stageChange(
  kv: KvStore,
  preferences: SchedulePreferences,
  change: StagedChange,
  now: string,
  id: string,
): Promise<Result> {
  if (!preferences.confirmed) {
    return asResult({
      staged: false,
      code: "preferences_required",
      message: "Save a time zone with save_preferences before staging a calendar change.",
      preferences,
    });
  }
  const proposal: StoredProposal = {
    id,
    preview: previewOf(change),
    change,
    createdAt: now,
    status: "staged",
  };
  await kv.put(proposalKey(id), proposal);
  return asResult({
    staged: true,
    proposalId: id,
    preview: proposal.preview,
    message: "This is not on Google Calendar yet. Show the preview and wait for an explicit yes, then call apply_change.",
  });
}

export async function applyChange(
  kv: KvStore,
  call: CalendarCaller | undefined,
  input: { proposalId: string; preview: string },
  mode: "live" | "eval",
): Promise<Result> {
  const stored = await kv.get(proposalKey(input.proposalId));
  if (!isStoredProposal(stored) || stored.id !== input.proposalId) {
    return asResult({ applied: false, code: "unknown_proposal", message: "Stage the change again." });
  }
  if (stored.preview !== input.preview) {
    return asResult({ applied: false, code: "preview_mismatch", message: "The preview does not match the staged change." });
  }
  if (stored.status === "applied" && stored.result) {
    return asResult({ applied: true, alreadyApplied: true, ...stored.result });
  }
  if (stored.status === "applying") {
    return asResult({
      applied: false,
      code: "already_started",
      message: "This change is already being written. Check the calendar before trying again.",
    });
  }
  if (mode === "eval" || call === undefined) {
    return asResult({ applied: false, code: "eval", proposalId: stored.id, preview: stored.preview });
  }
  await kv.put(proposalKey(stored.id), { ...stored, status: "applying" });
  const tool = stored.change.action === "create"
    ? "create_event"
    : stored.change.action === "update"
      ? "update_event"
      : "delete_event";
  const args = stored.change.action === "create"
    ? createEventArgs(stored.change)
    : stored.change.action === "update"
      ? updateEventArgs(stored.change)
      : deleteEventArgs(stored.change);
  let result: McpResult;
  try {
    result = await call(tool, args);
  } catch (error) {
    await kv.put(proposalKey(stored.id), {
      ...stored,
      status: "staged",
      lastError: clip(error instanceof Error ? error.message : "Calendar request failed."),
    });
    return asResult({
      applied: false,
      connected: false,
      proposalId: stored.id,
      message: "Google Calendar is not connected, so nothing was written.",
      connect: CONNECT,
    });
  }
  const parsed = mcpData(result);
  if (!parsed.ok) {
    await kv.put(proposalKey(stored.id), { ...stored, status: "staged", lastError: parsed.message });
    return asResult({ applied: false, connected: false, proposalId: stored.id, message: parsed.message, connect: CONNECT });
  }
  const link = extractLink(parsed.value);
  const saved = {
    applied: true,
    connected: true,
    proposalId: stored.id,
    action: stored.change.action,
    htmlLink: link,
    preview: stored.preview,
  };
  await kv.put(proposalKey(stored.id), { ...stored, status: "applied", result: saved });
  return asResult(saved);
}

export function defaultPreferences(): SchedulePreferences {
  return { ...DEFAULT_PREFERENCES };
}
