import { site } from '../config/site'

/**
 * The privacy policy and terms for this website, and only this website. Every
 * line describes what the site actually does today: no analytics, no cookies,
 * self-hosted fonts, and one form (the fix plan's "Keep a copy"). If the site
 * starts collecting anything new, this is the file to change first.
 */

export type LegalSection = { heading: string; body: string[] }
export type LegalDoc = {
  label: string
  heading: string
  emphasis: string
  updated: string
  short: string
  sections: LegalSection[]
}

const EMAIL = site.contact.email
const UPDATED = '4 November 2026'

const SCOPE =
  'This covers clauseandcode.com only. It does not cover the systems, apps, AI agents or websites we build for clients. Those are covered by the agreement with each client, and the client decides what their own system collects.'

export const PRIVACY: LegalDoc = {
  label: 'Privacy',
  heading: 'What this website',
  emphasis: 'knows about you.',
  updated: UPDATED,
  short:
    'Very little. No analytics, no tracking cookies, no ads. We only see what you choose to send us, it stays safe with us, and we never sell it.',
  sections: [
    {
      heading: 'What this covers',
      body: [SCOPE, `Clause & Code is based in the United Arab Emirates. For anything about your data, email ${EMAIL}.`],
    },
    {
      heading: 'Just browsing',
      body: [
        'We do not use analytics, advertising or tracking cookies, or tracking pixels. Our fonts and images are served from our own site, not from other companies.',
        'Like any website, our server has to see your IP address to send you the page. Our hosting provider may keep standard server logs to keep the site running and secure.',
      ],
    },
    {
      heading: 'The business fix plan',
      body: [
        'Your answers are worked out in your own browser. They are not sent to us unless you choose to send them.',
        'Saving the plan as a PDF keeps it on your device. Sending it to us on WhatsApp means you send the summary yourself, through WhatsApp.',
        'If you ask us to email you a copy, we receive your first name, your email address, your answers, and whether you ticked the box for one follow-up email. We use them to send you your plan and to see who asked for one. If you ticked the box, you get one more email a few days later, and nothing after that unless you reply.',
      ],
    },
    {
      heading: 'Email, WhatsApp and booking a call',
      body: [
        'When you email us, message us on WhatsApp or book a call through our Google Calendar booking page, we receive what you send or enter there, and we use it to reply and prepare for the call.',
        'Those services are run by other companies, and their own privacy policies apply to what you send through them.',
      ],
    },
    {
      heading: 'Safe with us',
      body: [
        'Your details are protected and stay with us. We never sell or rent them, and we never add you to a mailing list you did not ask for.',
        'We are an AI company and we use AI tools in our own work, including to help us read, sort and reply to what you send us. They work for us, on our behalf, the same way our hosting and email providers do.',
      ],
    },
    {
      heading: 'Your choices',
      body: [
        `You can ask us what we hold about you, ask us to correct it, or ask us to delete it, at any time, by emailing ${EMAIL}. Every follow-up email can be stopped with one reply or the unsubscribe link.`,
        'If this page changes, the date at the top changes with it.',
      ],
    },
  ],
}

export const TERMS: LegalDoc = {
  label: 'Terms',
  heading: 'Using this website,',
  emphasis: 'the fair way.',
  updated: UPDATED,
  short:
    'Read, explore and take the fix plan as often as you like. It is general guidance, not advice. Our work for clients runs on its own written agreement, not on this page.',
  sections: [
    {
      heading: 'What these terms cover',
      body: [
        'These terms cover using clauseandcode.com. By using the site, you agree to them.',
        'Work we do for clients is covered by a separate written agreement. These terms do not apply to that work or to the systems we build.',
      ],
    },
    {
      heading: 'Information, not advice',
      body: [
        'What you read here is general information about how we work and what we have built.',
        'The business fix plan is general guidance based only on your answers. It is not professional, legal or financial advice. Check it against your own records before acting on it.',
      ],
    },
    {
      heading: 'Our work stays ours',
      body: [
        'The text, design, drawings and the robot on this site belong to Clause & Code. Please do not copy them without asking. You are welcome to quote a short part with a link back.',
      ],
    },
    {
      heading: 'Play fair with the site',
      body: [
        'Please do not try to break, overload or get into parts of the site or its forms that are not meant for you, and do not use the forms to send spam.',
      ],
    },
    {
      heading: 'Links to other places',
      body: [
        'Some links take you to services run by other companies, such as WhatsApp and Google Calendar. Their own terms apply there, and we are not responsible for them.',
      ],
    },
    {
      heading: 'No guarantees',
      body: [
        'We work to keep the site accurate and available, but we cannot promise it will always be either. As far as the law allows, we are not liable for loss that comes from using the site or relying on what it says.',
      ],
    },
    {
      heading: 'The law, and questions',
      body: [
        'These terms are governed by the laws of the United Arab Emirates.',
        `Questions about them? Email ${EMAIL}. If these terms change, the date at the top changes with them.`,
      ],
    },
  ],
}
