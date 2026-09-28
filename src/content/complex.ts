/**
 * Copy shared by the interactive page and its readable, no-JS prerender.
 * The bidding client stays anonymous throughout the public site. The flows
 * are editorial diagrams of the work, not screenshots of private software.
 */
export const COMPLEX = {
  hero: {
    label: 'Our Projects · Systems & operations',
    firstLine: 'The work behind your business,',
    secondLine: 'made easier to run.',
    intro: 'We map how the work actually moves between people and decisions. Then we build a custom system around the way your team needs to work.',
  },
  method: {
    label: 'How we work',
    heading: ['First, understand the work.', 'Then build around it.'],
    intro: 'The answer is not always another tool. It starts with knowing what happens, who is involved and what should happen next.',
    steps: [
      {
        title: 'Map the real process.',
        body: 'Follow the work from the first request to the final decision. Find the handoffs that slow it down.',
      },
      {
        title: 'Build for the people in it.',
        body: 'Give each person a clear place to do their part, shaped around the way the team actually works.',
      },
      {
        title: 'Keep the next step clear.',
        body: 'Bring the moving parts together so the work can keep moving as the business grows.',
      },
    ],
  },
  work: {
    label: 'The work',
    heading: 'Two teams. Two different systems.',
    intro: 'The problems were different. The starting point was the same: understand the work before building the solution.',
  },
  projects: [
    {
      id: 'bidding',
      number: '01',
      label: 'Expert bidding · Private system',
      title: 'From project brief to a clear decision.',
      body: 'We mapped how a project reaches the right experts, how bids come back, and how the team chooses a way forward. Then we built one private place to manage that whole journey.',
      outcome: 'One clear path from assignment to bid to decision.',
      flow: ['Brief', 'Experts', 'Bids', 'Decision'],
    },
    {
      id: 'laha',
      number: '02',
      label: 'Laha Space · Internal operations',
      title: 'The work behind every booking.',
      body: 'Behind each booked session is a team reviewing teacher applications, preparing profiles and managing availability. We built the admin side to keep that work and the bookings in one place.',
      outcome: 'From first application to booked session, one view for the team.',
      flow: ['Apply', 'Review', 'Publish', 'Book'],
    },
  ],
  close: {
    label: 'Your turn',
    heading: 'Where does the work get stuck?',
    body: 'Bring us the real process, messy parts included. We’ll help you find a clearer way forward.',
    action: 'Talk it through',
  },
} as const
