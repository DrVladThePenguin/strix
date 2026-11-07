import { defineAgent } from "@grok/agent-sdk";

export default defineAgent({
  name: "Cal Scheduler",
  description: "Finds open times and updates Google Calendar after you approve each change.",
  model: {
    id: "grok-4.7",
    params: [
      { id: "reasoning_effort", value: "high" },
      { id: "fast", value: "true" },
    ],
  },
  tools: ["read", "grep", "glob"],
  hosting: {
    egressDomains: [
      "calendarmcp.googleapis.com",
      "oauth2.googleapis.com",
      "accounts.google.com",
      "www.googleapis.com",
    ],
    secretNames: [
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_REFRESH_TOKEN",
    ],
  },
});
