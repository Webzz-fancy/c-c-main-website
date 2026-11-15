# Ziina strategy booking — preparation (not live)

**Status: foundation only. Do not accept payments or deploy this as a completed integration.** The current checkout lacks the newer Webz booking popup. The actual checkout endpoints, payment recovery, Google Calendar authorization and matching, operations interface, and frontend are not implemented yet. The helper and SQL migration in this branch do not register routes or make network requests. Do not apply the SQL to a real project until the full flow and access controls are reviewed.

## Agreed visitor journey

- The free 20-minute consultation remains unchanged.
- Before payment for the 90-minute AED 1,200 session, ask only for a WhatsApp number in international format. Explain why it is collected and link to privacy information.
- Record an attempt before redirecting to Ziina. Mark it paid only after the server verifies Ziina's actual payment intent: expected account, recorded ID, `completed`, 120000 base units, AED, and the expected test/live environment. Never trust a browser URL or a webhook by itself.
- After payment, show a reference and the paid calendar. The customer enters the reference in a required question on Google's appointment form. Google separately requests their name and email.
- With the calendar owner's permission, the server will read bookings and attempt to match the reference. Unmatched or duplicate records require manual review; a reference does not stop the calendar link or reference from being shared. Do not automatically cancel events.
- Give the team a private way to see completed-but-not-booked payments and assist through WhatsApp. Provide a recovery path for someone who closes the payment page. Never ask the visitor to pay again just because return or calendar matching failed.

## What is prepared in this branch

- `server/strategy-safety.cjs`: isolated helpers for strict international phone format, random references, recovery-token hashes, raw-body HMAC verification, and matching a verified payment intent. They are **not** connected to any route.
- `supabase/migrations/20261106000000_strategy_bookings.sql`: proposed private data table with RLS and no public client access; not applied anywhere. Requires migration and security review, retention rules, backups, and tests on the actual project.
- `tests/strategy-safety.test.cjs`: local tests for those helpers only (`node --test tests/strategy-safety.test.cjs`). Passing these tests does not mean the integration works or is ready for money.

## Information and private setup needed later

1. **Ziina:** account/API access with the permissions needed for creating and reading payment intents and, if enabled, webhooks. The user or account owner must add the key privately in Hostinger, never in chat or Git. Ziina documents `test: true` for test payments; confirm account capabilities and test credentials before use. Never enter a live charge until test cases and sign-off are complete.
2. **Supabase:** a project and approved contributor access. We need its project URL and a server-only credential with access to the private table, installed privately in Hostinger. Never place a secret/service-role key in a `VITE_` variable or browser. Verify grants, policies, backups, retention and who can see personal data with the owner.
3. **Google Calendar:** the actual paid appointment schedule and owner's authorization with minimum necessary read access. Configure a required booking-reference question, then make a test booking and verify that the authorized Calendar API exposes the answer and booking email in a reliable format. It may not; until verified, matching is manual. The paid Google booking URL is already present in public historical site code: removing it from the bundle does not revoke the old link. Ask the owner how to retire/recreate that schedule if appropriate.
4. **Hosting:** a stable HTTPS public URL and a reviewed secret for webhook verification. Ziina documents one account webhook URL: setting another can replace an existing integration, so check with the owner before registration. Verify Ziina's signature against the exact raw request body and arrange reliable delivery/reconciliation; do not rely solely on browser return. Do not put phone numbers, API keys, or webhook secrets into logs.

## Before any launch

- Build and locally test the complete flow against mock Ziina, Supabase and Google Calendar services without real credentials. Add explicit server-side off/test/live safeguards; empty or placeholder configuration must never activate checkout.
- Confirm visitor return, paid-but-no-booking recovery, pending/failure/cancel/refund, invalid amount/account/currency/intent, forged signatures, replay/duplicate events, and outages. Validate webhook authentication, deduplication, persistent records and safe access under Node 18.
- Confirm the actual Google booking form and real Calendar API representation, required reference field, phone privacy notice, and manual handling for mismatches, duplicate bookings and refunds.
- Run real Ziina test-mode checkout and test booking after authorization. Confirm support access, backup/recovery and existing webhook use. Only then obtain owner approval for live mode and perform a controlled live test/refund if the owner agrees.

Reference: Ziina's current [payment-intent documentation](https://docs.ziina.com/api-reference/payment-intent/create) and [webhook documentation](https://docs.ziina.com/api-reference/webhook).

## Environment-variable planning (not wired yet)

Do not add dummy values to Hostinger. No integration reads these names yet; the exact list will be finalized once the implementation and Google authorization method are confirmed. Expected server-side settings include:

- Ziina API key, account ID, and a mode that explicitly defaults to disabled and must distinguish test from live.
- Supabase project URL and a private server-only key with the necessary access.
- A webhook signing secret (generated privately and also registered with Ziina, after checking existing webhook use).
- The paid calendar link, calendar ID, and Google Calendar authorization details. The exact Google credentials depend on the approved authorization method.

Any secret belongs only in server-side Hostinger environment variables, never `VITE_`, Git, chat, browser code, or screenshots. We will provide exact variable names and verified instructions after the runtime integration exists and has been tested.
