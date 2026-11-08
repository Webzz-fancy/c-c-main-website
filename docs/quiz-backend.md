# Business fix plan: contact requests

The quiz shows the plan immediately, without collecting contact details. Visitors can save it as a PDF or send it to the team via WhatsApp. They can also choose whether to request a personal follow-up. Only when they choose **Yes**, select WhatsApp or email, provide their name and the relevant contact details, and submit the form does it send the request and quiz answers to the server.

## Endpoint

`POST /api/quiz-plan` accepts JSON such as:

```json
{
  "name": "Sam",
  "reachOut": true,
  "contactMethod": "whatsapp",
  "phone": "+971 50 123 4567",
  "answers": {
    "model": "services",
    "team": 1,
    "belief": "clients",
    "answers": [1, 1, 2, 0, 1, 0, 0, 1, 1],
    "extra": 2
  }
}
```

For email, use `"contactMethod": "email"` and `"email": "sam@example.com"` instead of `phone`. The optional `otherBusiness` field inside `answers` is supported when `model` is `other`. The server validates the answers and selected contact details and saves the request to `data/quiz-leads.jsonl` before attempting an internal email notification. The file is excluded from Git; arrange access, backups, retention, and deletion securely on the host.

The response `{ "ok": true, "notified": true }` means the SMTP server accepted the team notification, not that an inbox delivered or read it. `{ "ok": true, "notified": false }` means the request was saved but the notification was not sent. In that case, the page asks the visitor to contact the team directly. Saving or validation errors return a non-2xx response. Legacy name/email/marketing submissions remain accepted for older cached clients, but are not consent to a personal follow-up. Their response has `ok: false` so the old page does not falsely claim a plan email was sent.

## Email configuration

Set these **server-side environment variables** on the host; never commit credentials:

- `MAIL_HOST`, `MAIL_PORT`, and `MAIL_SECURE` (`true` for implicit TLS, otherwise STARTTLS as negotiated by the server)
- `MAIL_USER` and `MAIL_PASS` if authentication is required
- `MAIL_FROM`: the sender address permitted by the mail provider
- `LEADS_TO`: the team inbox receiving requests

A configured and working SMTP service is required for the team notifications. Check server logs and the team inbox after a test submission. If settings are missing or sending fails, requests are still saved and the page explains that the team could not be notified.

**No automated visitor emails are sent.** The old plan and nudge templates in `src/content/quizEmails.ts` are not wired to the server, and no nudge is scheduled. The new form does not collect marketing consent or subscribe visitors to a mailing list. The team should manually contact only people who requested a follow-up, using the selected method.
