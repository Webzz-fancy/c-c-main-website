# Paid strategy sessions with Ziina

How the AED 1,200 Strategic Consultation should take payment before the
calendar opens. Today the site shows both calendars in the booking popup
(`src/components/BookingPopup.tsx`, copy in `src/content/booking.ts`), and
Sumaiya sends a Ziina payment link by hand after a strategy booking. This
note is the plan to make that automatic.

## What happens for the visitor

1. They click any "Book a consultation" link. The popup opens on two choices.
2. **Initial Consultation** (free, 20 minutes): the calendar opens straight
   away. Nothing changes here.
3. **Strategic Consultation** (AED 1,200, 90 minutes): the site sends them to
   Ziina's hosted payment page.
4. After paying, Ziina sends them back to the site. The server confirms the
   payment with Ziina, and only then returns the 90-minute calendar link.
5. They pick their time in the popup.

If they cancel or the payment fails, they come back to the popup's choices.

## What Sumaiya provides

| Item | Where it comes from | Where it goes |
|---|---|---|
| Ziina **live** API key | Ziina dashboard, developer or API settings | Hostinger environment variable `ZIINA_API_KEY`, set in hPanel. Never in the repo, never in chat, never a `VITE_` variable |
| Ziina **test** API key | Same place | Local `.env` for development only |
| 90-minute calendar link | Google Appointments (already sent) | Hostinger environment variable `BOOKING_STRATEGY_EMBED`, so it leaves the frontend bundle |

## What the developer builds

All Ziina requests happen on the server. Ziina's API docs:
<https://docs.ziina.com>

1. **`POST /api/strategy/checkout`**
   - Calls Ziina `POST /payment_intent` with `amount: 120000` (base units:
     AED 1,200.00), `currency_code: 'AED'`, a `message` naming the session,
     and:
     - `success_url`: `https://clauseandcode.com/?booking=paid&pi={id}`
     - `cancel_url` and `failure_url`: `https://clauseandcode.com/?booking=cancelled`
   - Returns only the hosted payment URL to the browser.
   - Rate limited, with the same abuse rules as the quiz endpoint
     (`docs/quiz-backend.md`).
2. **`GET /api/strategy/calendar?pi={id}`**
   - Fetches that payment intent from Ziina with the secret key, and checks
     its status is completed and its amount and currency match.
   - Only then returns `BOOKING_STRATEGY_EMBED`. Otherwise `{ ok: false }`.
   - Never trust the `?booking=paid` in the address on its own: anyone can
     type it.
3. **Webhook (recommended)**: register `POST /api/ziina/webhook` for
   `payment_intent.status.updated`, so a payment is recorded even if the
   visitor closes the tab before returning. Ziina retries a failed delivery
   3 times, so handle repeats.
4. **Frontend**: in `BookingPopup.tsx`, the strategy button calls the
   checkout endpoint and goes to Ziina instead of opening the calendar. On
   load, if the address has `booking=paid&pi=…`, open the popup and ask the
   calendar endpoint for the link. Remove the hard-coded strategy `embed` and
   the "we'll send a secure payment link" note from `src/content/booking.ts`.
5. **Security branch**: its content security policy must allow
   `frame-src https://calendar.google.com` for both calendars, and
   `connect-src` stays `'self'` since Ziina is only called from the server.

## Rules that stay true

- Payment comes before the session.
- Cancel anytime for a full refund. Refunds are done by hand from the Ziina
  dashboard.
- The fee is credited in full if the client goes ahead with a project.
- The 90-minute calendar link is never written into the website's code once
  this ships, or anyone could book without paying.

## Test before going live

Use the test key: pay, cancel and fail one each, check the calendar only
appears after a real completed payment, and that `?booking=paid&pi=fake`
gets nothing. Then switch to the live key in hPanel.
