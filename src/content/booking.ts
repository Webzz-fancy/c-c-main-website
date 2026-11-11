const env = import.meta.env

export type Consultation = {
  id: 'initial' | 'strategy'
  name: string
  price: string
  length: string
  lead?: string
  body: string
  notes: string[]
  action: string
  /** the Google appointment page in the form Google allows inside a popup */
  embed: string
}

/**
 * The two ways to book, shown in the booking popup before its calendar. Any
 * booking link on the site opens this choice; the plain link (no JavaScript,
 * or a new tab) goes straight to the free call.
 */
export const BOOKING = {
  heading: 'How can we',
  emphasis: 'help?',
  intro: 'Choose the type of consultation that best suits your needs.',
  back: 'Back to options',
  consultations: [
    {
      id: 'initial',
      name: 'Initial Consultation',
      price: 'Free',
      length: '20 minutes',
      body: 'A brief conversation to understand your business needs, discuss your objectives, and explore how Clause & Code may be able to help.',
      notes: [],
      action: 'Book Initial Consultation',
      embed:
        env.VITE_BOOKING_INITIAL_EMBED ||
        'https://calendar.google.com/calendar/appointments/schedules/AcZssZ0McWvhfTmmKBDTgcy3XR5QAfy2hb1BfLTRtmoJ-vyEa-_sXedMT_TJx9zS68ja-epSjJadMkvG?gv=true',
    },
    {
      id: 'strategy',
      name: 'Strategic Consultation',
      price: 'AED 1,200',
      length: '90 minutes',
      lead: 'Already know what you need? Skip straight here.',
      body: 'A focused advisory session to evaluate your challenges, explore potential solutions, and identify practical next steps.',
      notes: [
        'Credited in full if you go ahead with a project.',
        'Cancel anytime for a full refund.',
        'Once you book, we’ll send a secure payment link to confirm your session.',
      ],
      action: 'Book Strategic Consultation',
      // until payment runs on the server (docs/booking-payments.md), the
      // paid calendar is linked here and paid by link after booking
      embed:
        env.VITE_BOOKING_STRATEGY_EMBED ||
        'https://calendar.google.com/calendar/appointments/schedules/AcZssZ2M52C0Z0PaHMptSB2fIZXR19ja_afWdPJbAGAiver0H2LRRvXiNvaYUeyroxhHwU-_B6wZFnEZ?gv=true',
    },
  ] satisfies Consultation[],
}
