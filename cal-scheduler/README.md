# Cal Scheduler

A scheduling assistant for one Google Calendar. Ask it for a time, confirm the preview, and approve the write. It will not create, move, or delete an event before that approval.

Version 0.1.0.

## Connect your calendar

1. In Google Cloud, enable the Google Calendar API. Create a web OAuth client and add this redirect URI: `http://127.0.0.1:8787/callback`.
2. Print the consent link and open it:

```bash
GOOGLE_CLIENT_ID="your-id" GOOGLE_CLIENT_SECRET="your-secret" node scripts/google-auth.mjs
```

3. After you approve, the browser address bar contains `code`. Copy that value:

```bash
GOOGLE_CLIENT_ID="your-id" GOOGLE_CLIENT_SECRET="your-secret" node scripts/google-auth.mjs --code "PASTED_CODE"
```

4. Export the printed refresh token as `GOOGLE_REFRESH_TOKEN`, next to the client id and secret. Do not commit those values.

The assistant uses these three variables. On a hosted deploy, store them with `npx @grok/agent-sdk secret set`, not in the repo.

## Run it

```bash
npx @grok/agent-sdk dev
```

Open the playground URL the command prints. Example: "Find 30 minutes with alex@example.com tomorrow afternoon." Say yes to the preview, then approve the calendar write.

A weekday agenda runs at 13:00 UTC, Monday through Friday. It only reads the calendar.

## Checks

```bash
npm test
npm run check
npx @grok/agent-sdk validate
```
