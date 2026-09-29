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
        phase: 'UNDERSTAND',
        title: 'Find the real path.',
        body: 'First, we follow a request through its handoffs and decisions. That shows us where work slows down and what the system actually needs to solve.',
      },
      {
        phase: 'DESIGN',
        title: 'Design for the team.',
        body: 'Then we use that map to design roles, screens and next steps, so each person can do their part without working around the tool.',
      },
      {
        phase: 'BUILD',
        title: 'Connect the whole flow.',
        body: 'Finally, we build the workflow end to end, linking decisions and follow-up. The team can see what happened, who owns the next step and where the work stands.',
      },
    ],
  },
  work: {
    label: 'The work',
    heading: 'Two teams. Two different systems.',
    intro: 'Different requirements, same starting point: understand what the team needs to run before deciding what to build. Here is the work behind both systems.',
  },
  projects: [
    {
      id: 'bidding',
      number: '01',
      label: 'Expert bidding · Private system',
      title: 'From project brief to a clear decision.',
      body: 'A private bidding process, not an open marketplace. The brief, invitation, bid and final assignment all needed to follow one controlled path.',
      requirement: 'The team needed to create project briefs, invite only relevant experts and collect bids without showing them to other experts. It also needed to choose an expert and follow the project after that decision.',
      process: [
        {
          title: 'Separate the roles.',
          body: 'We defined an admin view for projects, experts and bids, and an expert view limited to assigned projects. That access model kept the bidding process private from the start.',
        },
        {
          title: 'Build the invitation path.',
          body: 'We connected briefs and categories to selected expert assignments. Invited experts receive the project, see their own brief and can place a bid within the allowed range.',
        },
        {
          title: 'Close the decision loop.',
          body: 'We brought incoming bids into the admin view, then added expert selection and project status so the team could carry an open bid into ongoing work and completion.',
        },
      ],
      outcome: 'One role-aware workspace for briefs, invitations, private bids and assignments. Experts see only their own projects; the team can make a selection and follow its status through completion.',
      flow: ['Brief', 'Experts', 'Bids', 'Decision'],
      flowDetails: ['Project scoped', 'Selected invites', 'Private responses', 'Expert assigned'],
      visualNote: 'Private bids · tracked decisions',
    },
    {
      id: 'laha',
      number: '02',
      label: 'Laha Space · Internal operations',
      title: 'The work behind every booking.',
      body: 'The public teacher listing was only the visible end of a longer operation. The Laha team needed a place to manage the work before and after it went live.',
      requirement: 'The team needed to take a teacher from application through a structured review before publishing a profile. Once live, they also had to manage availability, bookings and public reviews without losing track of the admin work behind them.',
      process: [
        {
          title: 'Follow the application.',
          body: 'We mapped the seven review stages, notes and documents the team uses to assess a teacher. Applicant details and uploads needed to stay inside the private admin workflow.',
        },
        {
          title: 'Build the review workspace.',
          body: 'We gave the team a place to move an applicant through stages, keep notes and protected documents, then create a draft profile and decide when it goes public.',
        },
        {
          title: 'Connect profile to booking.',
          body: 'We linked published profiles to weekly availability and generated slots, and brought bookings, reviews and community moderation into the admin area.',
        },
      ],
      outcome: 'One operational path from application to published teacher and booked session. The Laha team can oversee each stage and control what goes public and when.',
      flow: ['Apply', 'Review', 'Publish', 'Book'],
      flowDetails: ['Teacher applies', 'Seven-stage review', 'Profile goes live', 'Slot is booked'],
      visualNote: 'Vetting · publishing · sessions',
    },
  ],
  close: {
    label: 'Your turn',
    heading: 'Where does the work get stuck?',
    body: 'Bring us the real process, messy parts included. We’ll help you find a clearer way forward.',
    action: 'Talk it through',
  },
} as const
