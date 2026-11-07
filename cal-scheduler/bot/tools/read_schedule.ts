import { defineTool } from "@grok/agent-sdk/tools";
import { z } from "zod";

import { callCalendar } from "../lib/call.js";
import { readPreferences, readSchedule } from "../lib/client.js";

const Instant = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/);

export default defineTool({
  description: "Read events on the connected Google Calendar between two absolute times.",
  effect: "read",
  timeArgs: ["start", "end"],
  inputSchema: z.object({
    start: Instant,
    end: Instant,
    query: z.string().min(1).max(200).optional(),
  }),
  async execute(input, ctx) {
    const preferences = await readPreferences(ctx.host.kv);
    return readSchedule((tool, args) => callCalendar(ctx, tool, args), preferences, input);
  },
});
