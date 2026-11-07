import { defineTool } from "@grok/agent-sdk/tools";
import { z } from "zod";

import { writePreferences } from "../lib/client.js";

const Clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export default defineTool({
  description: "Save scheduling preferences: time zone, working hours, meeting length, buffer, and Google Meet.",
  effect: "idempotent",
  inputSchema: z.object({
    timeZone: z.string().min(1).max(80).optional(),
    workStart: Clock.optional(),
    workEnd: Clock.optional(),
    defaultDurationMinutes: z.number().int().min(15).max(240).optional(),
    bufferMinutes: z.number().int().min(0).max(120).optional(),
    excludeWeekends: z.boolean().optional(),
    addGoogleMeet: z.boolean().optional(),
    calendarId: z.string().min(1).max(200).optional(),
  }),
  async execute(input, ctx) {
    const preferences = await writePreferences(ctx.host.kv, input);
    return { saved: true, preferences };
  },
});
