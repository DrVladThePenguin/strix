/** Working-hours and buffer math for one person's calendar. */

export type SchedulePreferences = {
  timeZone: string;
  workStart: string;
  workEnd: string;
  defaultDurationMinutes: number;
  bufferMinutes: number;
  excludeWeekends: boolean;
  addGoogleMeet: boolean;
  calendarId: string;
  confirmed: boolean;
};

export type BusyInterval = {
  start: string;
  end: string;
};

export type OpenSlot = {
  start: string;
  end: string;
};

export const DEFAULT_PREFERENCES: SchedulePreferences = {
  timeZone: "UTC",
  workStart: "09:00",
  workEnd: "17:00",
  defaultDurationMinutes: 30,
  bufferMinutes: 10,
  excludeWeekends: true,
  addGoogleMeet: true,
  calendarId: "primary",
  confirmed: false,
};

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const STEP_MS = 15 * 60 * 1000;

export function isTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function isClock(value: string): boolean {
  return CLOCK.test(value);
}

export function normalizePreferences(value: unknown): SchedulePreferences {
  if (value === null || typeof value !== "object") return { ...DEFAULT_PREFERENCES };
  const raw = value as Record<string, unknown>;
  const timeZone = typeof raw.timeZone === "string" && isTimeZone(raw.timeZone)
    ? raw.timeZone
    : DEFAULT_PREFERENCES.timeZone;
  const workStart = typeof raw.workStart === "string" && isClock(raw.workStart)
    ? raw.workStart
    : DEFAULT_PREFERENCES.workStart;
  const workEnd = typeof raw.workEnd === "string" && isClock(raw.workEnd)
    ? raw.workEnd
    : DEFAULT_PREFERENCES.workEnd;
  return {
    timeZone,
    workStart,
    workEnd,
    defaultDurationMinutes: clampInt(raw.defaultDurationMinutes, 15, 240, DEFAULT_PREFERENCES.defaultDurationMinutes),
    bufferMinutes: clampInt(raw.bufferMinutes, 0, 120, DEFAULT_PREFERENCES.bufferMinutes),
    excludeWeekends: typeof raw.excludeWeekends === "boolean" ? raw.excludeWeekends : DEFAULT_PREFERENCES.excludeWeekends,
    addGoogleMeet: typeof raw.addGoogleMeet === "boolean" ? raw.addGoogleMeet : DEFAULT_PREFERENCES.addGoogleMeet,
    calendarId: typeof raw.calendarId === "string" && raw.calendarId.trim() !== ""
      ? raw.calendarId.trim()
      : DEFAULT_PREFERENCES.calendarId,
    confirmed: raw.confirmed === true,
  };
}

export function mergePreferences(
  current: SchedulePreferences,
  patch: Partial<SchedulePreferences>,
): SchedulePreferences {
  const next = normalizePreferences({ ...current, ...patch });
  next.confirmed = current.confirmed || patch.confirmed === true;
  if (patch.timeZone !== undefined && isTimeZone(patch.timeZone)) next.confirmed = true;
  return next;
}

export type SlotSearch = {
  busy: BusyInterval[];
  preferences: SchedulePreferences;
  windowStart: string;
  windowEnd: string;
  durationMinutes: number;
  limit?: number;
};

export function findOpenSlots(input: SlotSearch): { slots: OpenSlot[]; clamped: boolean } {
  const windowStart = new Date(input.windowStart);
  const requestedEnd = new Date(input.windowEnd);
  const cappedEnd = new Date(Math.min(requestedEnd.getTime(), windowStart.getTime() + MAX_WINDOW_MS));
  const durationMs = input.durationMinutes * 60 * 1000;
  const bufferMs = input.preferences.bufferMinutes * 60 * 1000;
  const limit = Math.min(Math.max(input.limit ?? 5, 1), 8);
  const busy = input.busy
    .map((item) => ({ start: new Date(item.start).getTime() - bufferMs, end: new Date(item.end).getTime() + bufferMs }))
    .filter((item) => Number.isFinite(item.start) && Number.isFinite(item.end) && item.end > item.start);

  const slots: OpenSlot[] = [];
  let cursor = new Date(windowStart);
  const firstDay = formatYmd(cursor, input.preferences.timeZone);
  const lastDay = formatYmd(cappedEnd, input.preferences.timeZone);
  for (let day = firstDay; day <= lastDay && slots.length < limit; day = addDays(day, 1)) {
    if (input.preferences.excludeWeekends && isWeekend(day, input.preferences.timeZone)) continue;
    const open = zonedTimeToUtc(day, input.preferences.workStart, input.preferences.timeZone);
    const close = zonedTimeToUtc(day, input.preferences.workEnd, input.preferences.timeZone);
    if (close.getTime() <= open.getTime()) continue;
    let slotStart = alignStep(Math.max(open.getTime(), windowStart.getTime()));
    const lastStart = Math.min(close.getTime(), cappedEnd.getTime()) - durationMs;
    while (slotStart <= lastStart && slots.length < limit) {
      const slotEnd = slotStart + durationMs;
      if (slotEnd <= close.getTime() && !overlaps(slotStart, slotEnd, busy)) {
        slots.push({ start: new Date(slotStart).toISOString(), end: new Date(slotEnd).toISOString() });
      }
      slotStart += STEP_MS;
    }
  }
  return { slots, clamped: cappedEnd.getTime() !== requestedEnd.getTime() };
}

/** True when a candidate from Google still respects working hours, weekends, and buffers. */
export function fitsRules(slot: OpenSlot, input: Omit<SlotSearch, "limit">): boolean {
  const start = new Date(slot.start).getTime();
  const end = new Date(slot.end).getTime();
  const durationMs = input.durationMinutes * 60 * 1000;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end - start < durationMs - 1000) return false;
  const windowStart = new Date(input.windowStart).getTime();
  const windowEnd = new Date(input.windowEnd).getTime();
  if (start < windowStart || end > windowEnd) return false;
  const ymd = formatYmd(new Date(start), input.preferences.timeZone);
  if (input.preferences.excludeWeekends && isWeekend(ymd, input.preferences.timeZone)) return false;
  const open = zonedTimeToUtc(ymd, input.preferences.workStart, input.preferences.timeZone).getTime();
  const close = zonedTimeToUtc(ymd, input.preferences.workEnd, input.preferences.timeZone).getTime();
  if (start < open || end > close) return false;
  const bufferMs = input.preferences.bufferMinutes * 60 * 1000;
  const busy = input.busy
    .map((item) => ({ start: new Date(item.start).getTime() - bufferMs, end: new Date(item.end).getTime() + bufferMs }))
    .filter((item) => Number.isFinite(item.start) && Number.isFinite(item.end));
  return !overlaps(start, end, busy);
}

function overlaps(start: number, end: number, busy: Array<{ start: number; end: number }>): boolean {
  return busy.some((item) => start < item.end && end > item.start);
}

function alignStep(ms: number): number {
  const remainder = ms % STEP_MS;
  return remainder === 0 ? ms : ms + (STEP_MS - remainder);
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function formatYmd(instant: Date, timeZone: string): string {
  const parts = partsInZone(instant, timeZone);
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
}

function addDays(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const next = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + days));
  return next.toISOString().slice(0, 10);
}

function isWeekend(ymd: string, timeZone: string): boolean {
  const midday = zonedTimeToUtc(ymd, "12:00", timeZone);
  const weekday = partsInZone(midday, timeZone).weekday;
  return weekday === "Sat" || weekday === "Sun";
}

function partsInZone(instant: Date, timeZone: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  weekday: string;
} {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const bag: Record<string, string> = {};
  for (const part of formatted.formatToParts(instant)) bag[part.type] = part.value;
  let hour = Number(bag.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour,
    weekday: bag.weekday ?? "",
  };
}

function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const bag: Record<string, string> = {};
  for (const part of formatted.formatToParts(instant)) bag[part.type] = part.value;
  let hour = Number(bag.hour);
  let day = Number(bag.day);
  if (hour === 24) {
    hour = 0;
    day += 1;
  }
  const asUtc = Date.UTC(Number(bag.year), Number(bag.month) - 1, day, hour, Number(bag.minute), Number(bag.second));
  return asUtc - instant.getTime();
}

export function zonedTimeToUtc(ymd: string, clock: string, timeZone: string): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  const [hour, minute] = clock.split(":").map(Number);
  let utc = Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0, 0);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const next = Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0, 0)
      - timeZoneOffsetMs(new Date(utc), timeZone);
    if (next === utc) break;
    utc = next;
  }
  return new Date(utc);
}
