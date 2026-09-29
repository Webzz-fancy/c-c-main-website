/**
 * Copy shared by the interactive page and its readable, no-JS prerender.
 *
 * The bidding client stays anonymous throughout the public site. The workflow
 * maps are editorial diagrams of the work, not screenshots of private
 * software, and every claim here comes from the systems themselves.
 */

export type ComplexStop = {
  /** Short title printed inside the workflow map. */
  node: string
  /** The line under it in the map, in the client's own vocabulary. */
  detail: string
  /** Panel heading. */
  title: string
  body: string
  guard: string
  /**
   * Which side of the access boundary this step belongs to: `near` is the
   * client's own workspace, `far` is the side others see. Used by the narrow
   * vertical map, where the boundary is marked per step.
   */
  side: 'near' | 'far'
}

export type ComplexProject = {
  id: string
  number: string
  label: string
  title: string
  lede: string
  stops: ComplexStop[]
  result: string
}

export type ComplexContent = {
  hero: { label: string; firstLine: string; secondLine: string; intro: string }
  method: { label: string; heading: string[]; intro: string; steps: { phase: string; title: string; body: string }[] }
  work: { label: string; heading: string; intro: string }
  projects: ComplexProject[]
  close: { label: string; heading: string; body: string; assurance: string; action: string }
}

export const COMPLEX: ComplexContent = {
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
    heading: 'Systems around the work you already do.',
    intro: 'Both systems below are live products: one runs a private bidding process, the other the operation behind a booking platform. Each began as a map of how the work moves, and in both, what a person can reach is decided by their role.',
  },
  projects: [
    {
      id: 'bidding',
      number: '01',
      label: 'Expert bidding · Invitation only',
      title: 'The shortlist was the whole point.',
      lede: 'This team places work with experts it chooses itself. The brief, the invitations, the bids and the assignment all had to stay inside that circle.',
      stops: [
        {
          node: 'Brief',
          detail: 'scope · category · range',
          title: 'One brief, written once.',
          body: 'The project is described in the system: what the work covers, which category it sits in and the range it is worth. Every step after that reads from the same record instead of a version pasted into an email.',
          guard: 'One source: the brief holds the scope and the range.',
          side: 'near',
        },
        {
          node: 'Invitations',
          detail: 'chosen expert by expert',
          title: 'Invitations, not listings.',
          body: 'The team decides which experts see which brief. There is no open board to search and no bid posted in public — an expert finds work in their account because someone chose them for it.',
          guard: 'Selected access: nothing is published to a marketplace.',
          side: 'near',
        },
        {
          node: 'Expert view',
          detail: 'their projects only',
          title: 'An expert sees their own work, and stops there.',
          body: 'An expert account reaches the projects it was invited to. Inside them it holds that person’s brief, that person’s bid and the outcome of their own invitation — nothing from anyone else on the list.',
          guard: 'Isolated: no expert can reach another expert’s bid.',
          side: 'far',
        },
        {
          node: 'Private bids',
          detail: 'kept per expert',
          title: 'Bids arrive inside the range.',
          body: 'Each bid is checked against the range set on the brief, so the team reads numbers it can actually compare. When the responses are in, they sit together in one view rather than in a folder of replies.',
          guard: 'Validated: a bid outside the brief’s range is refused.',
          side: 'far',
        },
        {
          node: 'Decision',
          detail: 'one expert selected',
          title: 'One decision, made where it can be seen.',
          body: 'The team compares the bids and selects an expert once, in the system. Bidding closes for everyone else, and the choice stays attached to the project rather than living in someone’s memory.',
          guard: 'Recorded: one selection, and no second winner.',
          side: 'near',
        },
        {
          node: 'Assigned',
          detail: 'open → ongoing → done',
          title: 'Then the work carries on.',
          body: 'Selection opens the project, and its status moves from open to ongoing to completed. Access stays with the assigned expert, so the assignment is still visible long after the decision that created it.',
          guard: 'Scoped: the assignment opens the project, not the account.',
          side: 'near',
        },
      ],
      result: 'A private process that runs from brief to completed work without a single public listing. Who sees what is settled by the invitation, and by nothing else.',
    },
    {
      id: 'laha',
      number: '02',
      label: 'Laha Space · Internal operations',
      title: 'A profile goes live on purpose.',
      lede: 'The public side of Laha shows teachers who are ready to be booked. Behind it runs a review the team does itself, applicant by applicant.',
      stops: [
        {
          node: 'Application',
          detail: 'submitted by a teacher',
          title: 'Every application lands in one place.',
          body: 'A teacher applies, and the application enters a queue the team can work through. The person, their details and their documents stay together from the first day instead of being spread across inboxes.',
          guard: 'Held internally: an application is never public.',
          side: 'near',
        },
        {
          node: 'Review stages',
          detail: 'seven steps · notes',
          title: 'Review moves through stages, not opinions.',
          body: 'Applicants are reviewed in defined stages, so each one is either in review or past it. Notes are written next to the application, which means a decision can still be explained months after it was taken.',
          guard: 'On file: stage history and notes stay with the applicant.',
          side: 'near',
        },
        {
          node: 'Documents',
          detail: 'private verification',
          title: 'The documents nobody else sees.',
          body: 'Verification documents are uploaded and read inside the admin area, behind the team’s own sign-in. Identity material is never left in a public folder or an open drive where it could be found by accident.',
          guard: 'Protected: files are served to the team, not to the site.',
          side: 'near',
        },
        {
          node: 'Draft → published',
          detail: 'the team decides',
          title: 'Draft first. Publish deliberately.',
          body: 'A teacher who passes review becomes a draft profile the team can complete and edit. It appears on the site when they publish it, so going live is a decision rather than a side effect of applying.',
          guard: 'Controlled: nothing is visible until it is published.',
          side: 'far',
        },
        {
          node: 'Availability',
          detail: 'weekly hours → slots',
          title: 'Availability becomes time people can book.',
          body: 'The teacher sets their week, and those hours become the slots students can book. What the calendar offers matches what the teacher can actually take, so a confirmed session holds.',
          guard: 'Accurate: time that is not offered cannot be booked.',
          side: 'far',
        },
        {
          node: 'Bookings',
          detail: 'moderated by the team',
          title: 'And the public space is kept in order.',
          body: 'Bookings, reviews and community activity arrive in the same admin area for moderation. The team sees what is posted before it stands, and can take something down without hunting for the right screen.',
          guard: 'Moderated: reviews and posts are removed by the team.',
          side: 'far',
        },
      ],
      result: 'One operational path for every teacher on the platform: application, review, publication, availability, and the sessions that follow.',
    },
  ],
  close: {
    label: 'Your turn',
    heading: 'Got a system to build?',
    body: 'Bring the process that slows your team down, messy parts included. We start by mapping how the work actually moves before anything gets built.',
    assurance: 'We don’t compromise on security.',
    action: 'Talk it through',
  },
}
