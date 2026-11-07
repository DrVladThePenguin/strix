/**
 * Print a Google consent URL, then exchange a pasted code for a refresh token.
 * The token is printed once. Do not commit it.
 *
 *   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/google-auth.mjs
 *   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/google-auth.mjs --code 'PASTED_CODE'
 */
const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
const redirectUri = "http://127.0.0.1:8787/callback";
const codeFlag = process.argv.indexOf("--code");
const code = codeFlag >= 0 ? process.argv[codeFlag + 1] : undefined;

if (clientId === "" || clientSecret === "") {
  console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
  process.exit(1);
}

if (code === undefined || code === "") {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("scope", "https://www.googleapis.com/auth/calendar");
  console.log(url.toString());
  console.error("Add this redirect URI on the OAuth client: " + redirectUri);
  console.error("After you approve, copy the code parameter from the browser address bar.");
  process.exit(0);
}

const response = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  }),
});
const parsed = await response.json();
if (!response.ok || typeof parsed.refresh_token !== "string") {
  console.error(parsed.error_description ?? parsed.error ?? "Token exchange failed.");
  process.exit(1);
}
console.log(parsed.refresh_token);
