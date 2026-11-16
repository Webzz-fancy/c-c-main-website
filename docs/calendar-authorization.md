# Calendar access: test setup

This local helper checks a calendar owner's Google authorization. It does not deploy the strategy backend, connect Supabase, match bookings or enable payments. Do not use it as proof that the complete workflow is ready. Never share keys, authorization URLs, codes, tokens, terminal output or event details in chat, screenshots or Git.

## Prepare Google Cloud

1. With the business owner's approval, open Google Cloud Console and select an existing suitable project or create one. Don't change another application's OAuth consent settings without checking first.
2. Enable Google Calendar API in that project.
3. In Google Auth Platform, configure the consent screen. Select Internal only if available and the calendar owner's Workspace account is within the same organization; otherwise use External and keep it in Testing while developing. Add the calendar owner as a test user for an External testing app. Workspace administrators may need to approve the app.
4. Under Data Access, add `https://www.googleapis.com/auth/calendar.events.readonly`. This grants read access to events available to the consenting account, not just one calendar. Prefer an account with access only to the intended calendar if privacy requires that isolation.
5. Create OAuth client credentials of type **Desktop app**, not an API key or web app. Store the client ID and secret privately. Do not paste them into source code, tickets or chat. No redirect URI needs to be entered for this desktop loopback flow.

Google External Testing authorizations for this scope expire after seven days, including refresh tokens. This helper is for testing, not a durable production authorization setup. Production publication/verification and any Workspace restrictions need separate review. Avoid reconfiguring an existing shared application.

## Authorize on a private Windows computer

Run from this repository in Windows Command Prompt, not on the public server or a remote terminal:

```cmd
node scripts\authorize-calendar.cjs
```

Enter the client ID and secret privately. The secret is visible while typed, so don't share your screen or capture terminal output. Enter the intended calendar ID, or press Enter for the signing-in account's primary calendar. The calendar ID is in Google Calendar settings for that calendar; `primary` only means the signing-in account's primary calendar, which may not be the one used for the appointment schedule.

Open the displayed Google link on the **same computer**. The calendar owner signs in to the intended account and reads/approves the scope. After Google returns to the local helper, it checks whether it can read events from the selected calendar. It does not show event data. A successful check does not prove appointment bookings are on this calendar or that custom answers are accessible.

The refresh token is displayed in the private terminal once. Treat it as a password; do not share or store it in Git. The helper does not save it or configure hPanel. If you choose to prepare the server settings, add `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REFRESH_TOKEN` and `GOOGLE_CALENDAR_ID` as server-only environment variables (use `primary` for the selected account's primary calendar). The backend is not wired to these variables yet. Close the terminal after copying the token. If an error occurs, don't send terminal output containing the link or secrets; describe the error without credentials. A successful access check still needs a real consented test appointment and review of returned data before any matching is implemented.
