import { defineTool } from "@grok/agent-sdk/tools";
import { z } from "zod";

import { bindKv, callCalendar } from "../lib/call.js";
import { applyChange } from "../lib/client.js";

export default defineTool({
  description: "Write one staged calendar change to Google Calendar. Call this only after the person has explicitly agreed, and only with the preview from stage_change.",
  effect: "idempotent",
  needsApproval: true,
  dryRunResult: ({ proposalId }) => ({ applied: false, dryRun: true, proposalId }),
  inputSchema: z.object({
    proposalId: z.string().regex(/^prop_[0-9a-f-]{36}$/i),
    preview: z.string().min(1).max(2000),
  }),
  async execute(input, ctx) {
    const mode = ctx.session.purpose === "eval" ? "eval" : "live";
    return applyChange(
      bindKv(ctx.host.kv),
      (tool, args) => callCalendar(ctx, tool, args),
      input,
      mode,
    );
  },
});
