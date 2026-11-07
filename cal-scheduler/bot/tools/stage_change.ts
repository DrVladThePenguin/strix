import { randomUUID } from "node:crypto";

import { defineTool } from "@grok/agent-sdk/tools";
import { z } from "zod";

import { buildChange } from "../lib/build.js";
import { bindKv } from "../lib/call.js";
import { readPreferences, stageChange } from "../lib/client.js";

const Instant = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/);
const Email = z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

export default defineTool({
  description: "Prepare one calendar create, update, or delete. This does not write to Google Calendar.",
  effect: "write",
  dryRunResult: () => ({ staged: false, dryRun: true }),
  inputSchema: z.object({
    action: z.enum(["create", "update", "delete"]),
    summary: z.string().min(1).max(300).optional(),
    start: Instant.optional(),
    end: Instant.optional(),
    attendeeEmails: z.array(Email).max(12).optional(),
    description: z.string().max(2000).optional(),
    location: z.string().max(300).optional(),
    eventId: z.string().min(1).max(1024).optional(),
    addGoogleMeet: z.boolean().optional(),
    notify: z.enum(["ALL", "NONE", "EXTERNAL_ONLY"]).optional(),
  }),
  async execute(input, ctx) {
    const kv = bindKv(ctx.host.kv);
    const preferences = await readPreferences(kv);
    const change = buildChange(input, preferences);
    if ("staged" in change) return change;
    return stageChange(kv, preferences, change, ctx.now().toISOString(), `prop_${randomUUID()}`);
  },
});
