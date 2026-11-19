# Ziina strategy booking — test backend in progress

The checkout is **not live**. The backend accepts only explicitly enabled test-mode requests; live payments are blocked in code. The public booking popup keeps the coming-soon message and free calendar. A separate team-only test page and server-side access gate are available for a controlled test; see the test checklist. Private staging is preferable. The owner has approved a temporary protected live-host test, but the remaining work below is still required before live payments.

## Work completed

- `POST /api/strategy/checkout`: validates the customer's name and international WhatsApp number, records a test attempt in Supabase and creates a Ziina **test** payment intent. The name-column migration must be reviewed and applied before using this updated prototype. The session token is stored in a Secure, HttpOnly, SameSite cookie; only its hash is stored in the database.
- `GET /api/strategy/status`: looks up that session and checks the intent directly with Ziina. It returns the reference and calendar only after the stored intent ID, Ziina account, completed status, AED 1,200 amount and currency match. A return URL alone is not proof of payment.
- `POST /api/ziina/webhook`: verifies the HMAC against the raw request bytes and looks up the payment independently. Repeated completed events do not create additional records. Unknown or refund events return an error for review; refunds are **not automated**.
- A read-only Google Calendar adapter and a private operator diagnostic (`scripts/check-strategy-calendar.cjs`) are prepared, but there is no automatic scheduler or public endpoint. The diagnostic reports only counts and field presence, never event details, and does not update the database. A test-only matching module can update an existing completed test-payment row for an unambiguous labelled reference, but it is not wired to a scheduler or route, and its assumed Google event format has not been verified with a real booking. No live matching is enabled.
- Private table migrations and mock-based tests are included. The team reported creating the initial table and service-role grant manually in the chosen Supabase project; this has not been verified here or recorded as a migration. The newer name-column migration has not been applied, and no real provider connection has been tested.

Run `node --test tests/strategy-*.test.cjs` to exercise the mock backend and safety tests. These tests use fake credentials and providers; they do not prove the real services work.

## Test-only environment settings

The settings are listed with blank values in `.env.example`. Do not enter `...` as a value. Never put secrets in a `VITE_` variable, browser code, Git, screenshots or chat.

- `STRATEGY_EXPERIMENTAL`: must be `true` to enable this prototype. Default is `false`.
- `STRATEGY_MODE`: must be `test`. Any other value, including `live`, disables checkout.
- `STRATEGY_TEST_PASSWORD`: server-only random team password, at least 32 characters, for the temporary test access gate.
- `STRATEGY_ORIGIN`: exact HTTPS site origin, without a trailing slash (for example `https://example.com`). Used for redirects and origin checks.
- `ZI_API`: server-only Ziina API key with the required payment intent permissions. The original name `ZIINA_API_KEY` is also accepted; if both are present they must contain the same key or the prototype stays disabled. Use the existing private setting, not a placeholder.
- `ZIINA_ACCOUNT_ID`: Ziina account expected to receive the payment.
- `ZIINA_WEBHOOK_SECRET`: privately generated signing secret, at least 32 characters. It must also be registered with Ziina when the webhook is deliberately configured.
- `SUPABASE_URL`: HTTPS project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: private server-only key with access to the table. It bypasses row-level security and must never reach the browser.
- `BOOKING_STRATEGY_EMBED`: private Google Calendar appointment-schedule embed URL. Once shown to a paid visitor, the URL can still be shared; it is not a secure lock.

These settings must not be enabled until access, migrations, webhook configuration and real test-mode behavior have been reviewed. The calendar reader can use `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REFRESH_TOKEN` and `GOOGLE_CALENDAR_ID`, but nothing starts a calendar sync or matches bookings yet. See `docs/calendar-authorization.md` for private test setup. These Google settings do not enable payments.

## Remaining before launch

1. Review the test-only name/WhatsApp and payment-return UI in a private test build (`VITE_STRATEGY_TEST_UI=true`); it is not suitable for production. The backend only restores the session in the same browser; if a visitor loses it, the team must help manually. Duplicate checkout attempts and payment-provider timeouts need further work to avoid accidental repeat payments.
2. With the calendar owner's authorization, test a real Google appointment form with a required booking reference. Verify what the Calendar API actually returns, then implement and test matching, cancellation/rescheduling, duplicate references and a private review workflow. Do not automatically cancel unmatched bookings.
3. Add reliable operations for paid-but-unbooked customers, refunds, failed webhooks and reconciliation, plus private team access. Review retention, backups, access controls and consent. A database record alone is not an operational recovery system.
4. Review webhook network security at the hosting edge, including Ziina's documented sender IPs and the actual proxy configuration. Do not trust an unverified forwarded IP header. Ziina documents one webhook URL per account; check for an existing integration before registering another. Registration is not automatic.
5. Verify Ziina test intent behavior and test/live isolation with the real account. The documented payment-intent response does not provide a clearly documented test flag to independently confirm mode; this implementation sends `test: true` and stores the attempt as test, but real behavior still needs verification. Keep live payments blocked until that is resolved.
6. Review migrations, row-level security, service-role access and secrets; run test payments, failures, browser interruption, timeouts, refunds, duplicate and out-of-order events, and a real test booking. Obtain approval before any controlled live test.

References: [Ziina payment intents](https://docs.ziina.com/api-reference/payment-intent/create) and [Ziina webhooks](https://docs.ziina.com/api-reference/webhook).
