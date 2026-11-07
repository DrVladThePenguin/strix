import { defineConnection } from "@grok/agent-sdk/connections";

/** Host-only. The model cannot call create, update, or delete on this server directly. */
export default defineConnection({
  description: "Google Calendar MCP. Writes go through apply_change after a person approves.",
  url: "https://calendarmcp.googleapis.com/mcp/v1",
  oauth: true,
  tools: ["list_events", "suggest_time", "create_event", "update_event", "delete_event"],
});
