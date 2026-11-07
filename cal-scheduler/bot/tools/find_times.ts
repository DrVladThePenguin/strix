import { defineTool } from "@grok/agent-sdk/tools";
import { z } from "zod";

import { callCalendar } from "../lib/call.js";
import { findTimes, readPreferences } from "../lib/client.js";

const Instant = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/);
const Email = z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

export default defineTool({
  description: "Find open meeting slots inside saved working hours. Pass guest emails when other people must also be free.",
  effect: "read",
  timeArgs: ["start", "end"],
  inputSchema: z.object({
    start: Instant,
    end: Instant,
    durationMinutes: z.number().int().min(15).max(240).optional(),
    attendeeEmails: z.array(Email).max(12).optional(),
    limit: z.number().int().min(1).max(8).optional(),
  }),
  async execute(input, ctx) {
    const preferences = await readPreferences(ctx.host.kv);
    return findTimes((tool, args) => callCalendar(ctx, tool, args), preferences, {
      start: input.start,
      end: input.end,
      durationMinutes: input.durationMinutes ?? preferences.defaultDurationMinutes,
      attendeeEmails: input.attendeeEmails ?? [],
      limit: input.limit ?? 5,
    });
  },
});
