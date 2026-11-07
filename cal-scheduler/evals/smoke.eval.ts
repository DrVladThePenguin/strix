import { defineEval } from "@grok/agent-sdk/evals";

export default defineEval({
  tags: ["smoke"],
  description: "A scheduling request looks up times and does not write the calendar.",
  async test(t) {
    await t.send(
      "Find a 30 minute slot tomorrow afternoon for a sync with alex@example.com. Do not book it.",
    );
    t.succeeded();
    t.calledTool("find_times");
    t.notCalledTool("apply_change");
    t.notCalledTool("stage_change");
  },
});
