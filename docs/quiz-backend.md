# Business fix plan: what the backend needs to do

The fix plan on the home page (`#quiz`) is finished on the front end.

**How it works today**

- A visitor answers 12 or 13 short questions:
  - three about their business: kind of business, team size, and what they think the problem is;
  - nine about what actually happens at each stage of the work;
  - one check against their own records, asked only when a stage stands out.
- They see their plan on the page straight away, with no email needed.
- They can save the plan as a PDF or send it to us on WhatsApp. Neither needs a server.

**What the server is for**

- Under the plan there is a "Keep a copy" form: first name, email, and a separate, unticked box for occasional emails.
- Sending that copy, and anything after it, needs the server.
- Until the server exists, the form tells the visitor the copy could not be sent and suggests saving a PDF.

**Where the code lives**

- `src/content/quiz.ts` has all the questions, scoring and plan wording.
- `src/components/Quiz.tsx` is the component.
- `server.js` is the existing server (Express, CommonJS, on Hostinger).

## 1. The endpoint: `POST /api/quiz-plan`

The page already calls `${VITE_API_BASE_URL}/api/quiz-plan` from `submit` in `PlanView`. If that variable is empty, the request goes to the same site.

Request body (JSON):

```json
{
  "name": "Sam",
  "email": "sam@example.com",
  "marketing": false,
  "answers": {
    "model": "services",
    "team": 1,
    "belief": "clients",
    "answers": [1, 1, 2, 0, 1, 0, 0, 1, 1],
    "extra": 2
  }
}
```

The `answers` fields are all ids or indexes into `src/content/quiz.ts`:

- `model` is an id from `MODELS`.
- `team` indexes `TEAM_SIZES`. Index 0, "Just me", changes some questions.
- `belief` is an id from `BELIEFS`.
- `answers[i]` indexes the options of `AREAS[i]`. There are always nine.
- `extra` indexes `VERIFY_SCALE`. It is `null` when nothing stood out and the check was not asked.

Response:

- Return JSON `{ "ok": true }` when the email was sent.
- Anything else, including a non-2xx status, makes the page show the "save it as a PDF" note.

What the endpoint must do:

1. **Validate.**
   - Rate limit with the existing `rateLimited(req.ip)`.
   - Clean `name` (max 60) and `email` (max 160) with the existing `clean()`.
   - Check `email` against the existing `EMAIL` pattern.
   - Treat `marketing` as true only if it is exactly `true`.
   - Run `answers` through `cleanAnswers()` from `src/content/quiz.ts`. It returns `null` for anything invalid, including a missing check when one was due.
   - Reject with `400` if any of these checks fail.
2. **Email the visitor their plan.**
   - Build the plan with `buildPlan(answers)`, so the email says exactly what the page says.
   - The only visitor text allowed in the email is their first name, escaped. This stops the form being used to send spam.
3. **Notify us.**
   - Send a short email to our inbox with the name, the email, whether they ticked the box, and `answerSummary(answers)`.
   - Suggested subject: `New fix plan: {name} ({plan.area.stage or "nothing stood out"})`.
4. **Add to the email list only if `marketing` is true.**
   - Tag them with: `model`, `belief`, the first priority stage (`plan.area.id`), and `tentative` if `plan.tentative` is true.
   - Without the tick, they get the plan email and nothing else.
5. **Log only what is needed:** name, email, first priority. No full answers in logs.

To use `src/content/quiz.ts` from `server.js`, bundle it for Node at build time.

- `scripts/prerender.mjs` already does this for `src/content/static.ts` with vite's SSR build. The same pattern works, with output format `cjs`.
- `quiz.ts` imports `src/config/site.ts`, which reads `import.meta.env`. Vite fills that in at build time.

## 2. The plan email

Subject: `{name}, your business fix plan`

The sections come from `buildPlan()` and follow the page's order:

1. "Hi {name}, here is your business fix plan."
2. "Fix first: {area.stage}", then **{headline}**, then `compare`. If `tentative` is true, add: "You weren't sure about several answers, so treat this as a first read."
3. At a glance: how many stages in `map` are working well (`working`), worth watching (`some` or `risk`), to fix first (`first`) and not sure (`unclear`). Show them as large numbers in one row.
4. **Where things stand:** each row of `map`, as the stage and `STATUS_LABEL[status]`, top to bottom. Use a coloured marker per status, as on the page:
   - blue for working;
   - gold outline for some risk;
   - solid gold for at risk;
   - large gold for fix this first;
   - grey for not sure.
5. **How one problem feeds another**, if `connection` is set: "{connection.from} → {connection.to}", then `connection.line`.
6. **Why it matters:** `why`.
7. **What to do next:**
   - **1. Check it on your own records (about 20 minutes):** `check`, as a list. This is the part people use, so give it room.
   - **2. Fix it, simplest way first.** Under "Start here", put `simple`. Under "If that isn't enough", put `bigger`, then a link `see.label` → `see.href`. Make relative links absolute with `https://clauseandcode.com`.
8. **Based on what you told us:** each item in `evidence`, as the question followed by their answer in quotes.
9. **What we couldn't tell:** each item in `unclear`, if there are any.
10. **Let's look at what's actually causing this:** `QUIZ.close.body`, then two buttons:
   - "Book a call": https://calendar.app.google/3xg59Dqk3t21M8B87
   - "Message us on WhatsApp": https://wa.me/971509718796
11. Footer: Clause & Code · clauseandcode.com.

Design:

- Colours: gold `#E1AD34`, blue `#2D6D8B`, ink `#1B1A17`, cream background `#F8F5F0`.
- Headings use a serif font.
- No boxes, icons or scores. It should read like a letter.

## 3. The follow-up emails (only with the tick)

These go only to people who ticked "Also send me the occasional short note on fixing this".

**Rules**

- Keep each one short and about their first priority. The stage tag picks the version.
- Every email has a one-click unsubscribe.
- Never invent results, numbers or client stories.

| When | Email |
|---|---|
| Day 2 | "Did you run the check?" A reminder of their check (`check`) and what to look for in the result. |
| Day 5 | What a better version of this stage looks like for their kind of business, from `simple`, with one or two practical details. |
| Day 9 | When a checklist is enough and when it isn't: the difference between `simple` and `bigger`, said honestly. |
| Day 14 | "A second pair of eyes": a short offer to go through their answers on a call, with "Book a call" and WhatsApp. |

For each of the nine stages, write one version of each of the four emails. That is 36 short emails. If the first priority is "nothing stood out", use one general version of each.

## 4. Services and settings to set up

- **An email sending service**, with clauseandcode.com verified (SPF and DKIM).
  - Options: Resend, Postmark, Brevo, or the Hostinger mailbox over SMTP.
  - It needs a from address, such as `plans@clauseandcode.com`.
- **An email list tool** for the follow-ups, with automations and tags.
  - Options: Brevo, MailerLite or Kit.
  - Brevo can do both the sending and the list.
- **Environment variables on Hostinger**, never committed:
  - `MAIL_API_KEY`
  - `MAIL_FROM`
  - `LEADS_TO`, our inbox
  - `LIST_API_KEY`
  - `LIST_ID`

## 5. Privacy

- Store only what the form collects: first name, email, the consent choice with its date, and the answers.
- Keep the consent choice. If someone did not tick the box, they must never be added to the list.
- Before the email form goes live, add a short privacy page linked from the footer. It should say what is collected, why, and how to ask for it to be deleted.
