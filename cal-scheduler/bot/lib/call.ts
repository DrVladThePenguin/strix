import type { KvStore } from "./client.js";
import { clip, type McpResult } from "./google.js";
import { restCall, restConfigured } from "./rest.js";

type CalendarContext = {
  host: {
    mcp: {
      callTool(connection: string, tool: string, args?: Record<string, unknown>): Promise<{
        isError?: boolean;
        structuredContent?: { [key: string]: unknown };
        content: ReadonlyArray<{ type: string; text?: string }>;
      }>;
    };
  };
};

export function bindKv(kv: {
  get(key: string): Promise<unknown>;
  put(key: string, value: never): Promise<void>;
}): KvStore {
  return {
    get: (key) => kv.get(key),
    put: (key, value) => kv.put(key, JSON.parse(JSON.stringify(value)) as never),
  };
}

export async function callCalendar(
  ctx: CalendarContext,
  tool: string,
  args: Record<string, unknown>,
): Promise<McpResult> {
  if (restConfigured()) {
    return restCall(tool, args);
  }
  try {
    return await ctx.host.mcp.callTool("calendar", tool, args);
  } catch (error) {
    let message = clip(error instanceof Error ? error.message : "Google Calendar is not connected.");
    if (message.includes("dynamic client registration")) {
      message = "Google Calendar is not connected. Automatic app registration is not available.";
    }
    return { isError: true, content: [{ type: "text", text: message }] };
  }
}
