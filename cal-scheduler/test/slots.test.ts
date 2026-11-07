import assert from "node:assert/strict";
import test from "node:test";

import { applyChange, stageChange, type KvStore } from "../bot/lib/client.js";
import { DEFAULT_PREFERENCES, findOpenSlots, fitsRules } from "../bot/lib/slots.js";
import type { CreateChange } from "../bot/lib/changes.js";

const prefs = {
  ...DEFAULT_PREFERENCES,
  timeZone: "America/New_York",
  workStart: "09:00",
  workEnd: "17:00",
  bufferMinutes: 0,
  excludeWeekends: true,
  confirmed: true,
};

test("skips a busy morning and stays inside work hours", () => {
  const { slots } = findOpenSlots({
    preferences: prefs,
    windowStart: "2026-11-09T00:00:00Z",
    windowEnd: "2026-11-10T00:00:00Z",
    durationMinutes: 30,
    busy: [{ start: "2026-11-09T14:00:00Z", end: "2026-11-09T15:00:00Z" }],
    limit: 1,
  });
  assert.deepEqual(slots, [{ start: "2026-11-09T15:00:00.000Z", end: "2026-11-09T15:30:00.000Z" }]);
});

test("a buffer blocks the slot that starts when the meeting ends", () => {
  const search = {
    preferences: { ...prefs, bufferMinutes: 15 },
    windowStart: "2026-11-09T14:30:00Z",
    windowEnd: "2026-11-09T16:00:00Z",
    durationMinutes: 30,
    busy: [{ start: "2026-11-09T14:00:00Z", end: "2026-11-09T15:00:00Z" }],
  };
  assert.equal(
    fitsRules({ start: "2026-11-09T15:00:00Z", end: "2026-11-09T15:30:00Z" }, search),
    false,
  );
  assert.equal(
    fitsRules({ start: "2026-11-09T15:15:00Z", end: "2026-11-09T15:45:00Z" }, search),
    true,
  );
});

test("weekends stay closed", () => {
  const { slots } = findOpenSlots({
    preferences: prefs,
    windowStart: "2026-11-07T00:00:00Z",
    windowEnd: "2026-11-08T00:00:00Z",
    durationMinutes: 30,
    busy: [],
  });
  assert.deepEqual(slots, []);
});

test("apply writes once and refuses a mismatched preview", async () => {
  const store = new Map<string, unknown>();
  const kv: KvStore = {
    get: async (key) => store.get(key),
    put: async (key, value) => {
      store.set(key, value);
    },
  };
  const change: CreateChange = {
    action: "create",
    summary: "Sync",
    start: "2026-11-09T15:00:00Z",
    end: "2026-11-09T15:30:00Z",
    attendeeEmails: ["alex@example.com"],
    addGoogleMeet: true,
    calendarId: "primary",
    timeZone: "America/New_York",
  };
  const staged = await stageChange(kv, prefs, change, "2026-11-07T12:00:00Z", "prop_11111111-1111-1111-1111-111111111111");
  assert.equal(staged.staged, true);
  const preview = String(staged.preview);
  const calls: string[] = [];
  const caller = async (tool: string) => {
    calls.push(tool);
    return { content: [{ type: "text", text: "{\"htmlLink\":\"https://calendar.google.com/event?eid=abc\"}" }] };
  };
  const denied = await applyChange(kv, caller, { proposalId: String(staged.proposalId), preview: "nope" }, "live");
  assert.equal(denied.applied, false);
  assert.deepEqual(calls, []);
  const applied = await applyChange(kv, caller, { proposalId: String(staged.proposalId), preview }, "live");
  assert.equal(applied.applied, true);
  assert.equal(applied.htmlLink, "https://calendar.google.com/event?eid=abc");
  const again = await applyChange(kv, caller, { proposalId: String(staged.proposalId), preview }, "live");
  assert.equal(again.alreadyApplied, true);
  assert.deepEqual(calls, ["create_event"]);
  const evalRun = await applyChange(kv, caller, { proposalId: "missing", preview }, "eval");
  assert.equal(evalRun.code, "unknown_proposal");
});
