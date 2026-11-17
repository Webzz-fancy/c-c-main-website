const env = import.meta.env

export type Consultation = {
  name: string
  price: string
  length: string
  lead?: string
  body: string
  notes: string[]
  action: string
} & (
  | { id: 'initial'; embed: string }
  | { id: 'strategy' }
)

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
    },
  ] satisfies Consultation[],
}

/**
 * What a visitor wants to talk about. A booking link carries one as
 * `data-topic` (see `topicProps`), the popup shows it and lets them change
 * it, and the button label says it where the page already knows.
 */
export const TOPICS = [
  { id: 'advice', label: 'Advice on where to start', about: 'where to start' },
  { id: 'agents', label: 'AI agents', about: 'AI agents' },
  { id: 'process', label: 'Process mapping and SOPs', about: 'process mapping' },
  { id: 'systems', label: 'A custom system', about: 'a custom system' },
  { id: 'automation', label: 'Automations', about: 'automation' },
  { id: 'websites', label: 'A website', about: 'a website' },
  { id: 'found', label: 'Getting found on Google and ChatGPT', about: 'getting found' },
  { id: 'training', label: 'Training your team', about: 'training' },
  { id: 'other', label: 'Something else', about: 'something else' },
] as const

export type TopicId = (typeof TOPICS)[number]['id']

export const topicById = (id?: string | null) => TOPICS.find((t) => t.id === id)

/** Put on any booking link so the popup opens already knowing the topic. */
export const topicProps = (id?: TopicId) => (id ? { 'data-topic': id } : {})

/** "Book a consultation about AI agents", or the plain label without a topic. */
export const bookLabel = (id?: TopicId) => {
  const t = topicById(id)
  return t ? `Book a consultation about ${t.about}` : 'Book a consultation'
}

export const TOPIC_COPY = {
  ask: 'What’s it about?',
  calendarNote: (label: string) => `About: ${label}. Mention it when you book, so we come prepared.`,
}
