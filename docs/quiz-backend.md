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
   - Send `planEmail(answers, name)`. It is built from `buildPlan(answers)`, so the email says exactly what the page says.
   - The only visitor text allowed in the email is their first name, escaped. This stops the form being used to send spam.
3. **Notify us.**
   - Send `teamEmail()` to our inbox. It has the name, the email, whether they ticked the box, and every answer.
4. **Add to the email list only if `marketing` is true.**
   - Tag them with: `model`, `belief`, the first priority stage (`plan.area.id`), and `tentative` if `plan.tentative` is true.
   - Without the tick, they get the plan email and nothing else.
5. **Log only what is needed:** name, email, first priority. No full answers in logs.

To use `src/content/quiz.ts` and `src/content/quizEmails.ts` from `server.js`, bundle them for Node at build time.

- `scripts/prerender.mjs` already does this for `src/content/static.ts` with vite's SSR build. The same pattern works, with output format `cjs`.
- `quiz.ts` imports `src/config/site.ts`, which reads `import.meta.env`. Vite fills that in at build time.

## 2. The emails are already written

Every email is written and rendered in `src/content/quizEmails.ts`, so the server only sends them. Preview of every email for each first priority: https://claude.ai/artifact/VRqNF7uTptH5GP2WPE6jd9 (ask the owner to share it with you).

| Function | Email | Who gets it | When |
|---|---|---|---|
| `planEmail(answers, name)` | Their plan, in the same order as the page | Everyone who asks for a copy | Straight away |
| `teamEmail(answers, { name, email, marketing })` | New plan notice with every answer | Our inbox (`LEADS_TO`) | Straight away |
| `followUps(answers, name)[0]` | "Did you run the check?" | Only if `marketing` is true | Day 2 |
| `followUps(answers, name)[1]` | "What good {stage} looks like" | Only if `marketing` is true | Day 5 |
| `followUps(answers, name)[2]` | "When a checklist is enough, and when it isn't" | Only if `marketing` is true | Day 9 |
| `followUps(answers, name)[3]` | "A second pair of eyes on your answers" | Only if `marketing` is true | Day 14 |

Each email has `subject`, `preheader`, `day` and `marketing`.

To send one:

- Turn it into HTML with `renderHtml(email, unsubscribeUrl)` and into plain text with `renderText(email, unsubscribeUrl)`, and send both versions.
- For the four notes, pass the email tool's unsubscribe link, for example Brevo's `{{ unsubscribe }}`. The plan and team emails have no unsubscribe link, because the visitor asked for them.
- The logo loads from `https://clauseandcode.com/logo.png`, so the site must be live first.
- Pass the visitor's first name exactly as validated. The renderer escapes it.

Scheduling:

- Schedule the four notes when the plan is sent. Cancel any notes not yet sent if the person unsubscribes.
- The simplest way is to build all four at once and hand them to the email tool with send dates.
- The other way is to store the answers and build each note on its day.
- Day 2 invites a reply. Set the reply-to address to an inbox someone reads, for example `support@clauseandcode.com`.

The series stops after day 14. Don't add people to any other list unless they have given separate consent.

## 3. Services and settings to set up

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

## 4. Privacy

- Store only what the form collects: first name, email, the consent choice with its date, and the answers.
- Keep the consent choice. If someone did not tick the box, they must never be added to the list.
- Before the email form goes live, add a short privacy page linked from the footer. It should say what is collected, why, and how to ask for it to be deleted.
