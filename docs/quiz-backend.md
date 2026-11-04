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

- Under the plan there is a "Keep a copy" form: first name, email, and a separate, unticked box for one nudge 3 days later.
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
   - Send `planEmail(answers, name)`. It is built from `buildPlan(answers)`, so the email says exactly what the page says.
   - The only visitor text allowed in the email is their first name, escaped. This stops the form being used to send spam.
3. **Notify us.**
   - Send `teamEmail()` to our inbox. It has the name, the email, whether they ticked the box, and every answer.
4. **Schedule the nudge only if `marketing` is true.**
   - Send `nudgeEmail()` 3 days later. A scheduled send in the email service, or a simple queue, is enough. No list or automation is needed.
   - Without the tick, they get the plan email and nothing else.
5. **Log only what is needed:** name, email, first priority. No full answers in logs.

To use `src/content/quiz.ts` and `src/content/quizEmails.ts` from `server.js`, bundle them for Node at build time.

- `scripts/prerender.mjs` already does this for `src/content/static.ts` with vite's SSR build. The same pattern works, with output format `cjs`.
- `quiz.ts` imports `src/config/site.ts`, which reads `import.meta.env`. Vite fills that in at build time.

## 2. The emails are already written

There are two emails for the visitor and one notice for us, all written and rendered in `src/content/quizEmails.ts`. The server only sends them.

Preview: https://claude.ai/artifact/VRqNF7uTptH5GP2WPE6jd9 (ask the owner to share it with you).

| Function | Email | Who gets it | When |
|---|---|---|---|
| `planEmail(answers, name)` | Their fix plan again, so it lives in their inbox | Everyone who asks for a copy | Straight away |
| `nudgeEmail(answers, name)` | "Did the check surprise you?", one friendly nudge asking for a reply | Only if `marketing` is true | 3 days later |
| `teamEmail(answers, { name, email, marketing })` | New plan notice with every answer | Our inbox (`LEADS_TO`) | Straight away |

Each email has `subject`, `preheader`, `day` and `marketing`.

To send:

- Turn each email into HTML with `renderHtml(email, unsubscribeUrl)` and into plain text with `renderText(email, unsubscribeUrl)`, and send both versions.
- Only the nudge needs the email tool's unsubscribe link.
- Images load from `https://clauseandcode.com/logo.png` and `https://clauseandcode.com/email/`, so the site must be live first.
- The nudge asks people to reply. Set the reply-to address to an inbox someone reads and answers, for example `support@clauseandcode.com`.
- There is no other sequence. Don't add people to any list unless they have given separate consent.

## 3. Services and settings to set up

- **An email sending service**, with clauseandcode.com verified (SPF and DKIM).
  - Options: Resend, Postmark, Brevo, or the Hostinger mailbox over SMTP.
  - It needs a from address, such as `plans@clauseandcode.com`.
- **Environment variables on Hostinger**, never committed:
  - `MAIL_API_KEY`
  - `MAIL_FROM`
  - `LEADS_TO`, our inbox

## 4. Privacy

- Store only what the form collects: first name, email, the consent choice with its date, and the answers.
- Keep the consent choice. If someone did not tick the box, they must never be added to the list.
- Before the email form goes live, add a short privacy page linked from the footer. It should say what is collected, why, and how to ask for it to be deleted.
