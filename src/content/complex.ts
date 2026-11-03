/**
 * Copy shared by the interactive page and its readable, no-JS prerender.
 *
 * The bidding and academy clients stay anonymous throughout the public site. The workflow
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

/**
 * The same facts for every project, so the index reads as one comparable set.
 * Outcomes are stated from what the system does; no invented figures.
 */
export type ComplexCard = {
  /** What kind of work this was. More kinds (AI agents) join as they ship. */
  kind: 'Custom system'
  name: string
  sector: string
  problem: string
  built: string
  users: string
  outcome: string
}

export type ComplexProject = {
  id: string
  number: string
  label: string
  title: string
  lede: string
  card: ComplexCard
  stops: ComplexStop[]
  result: string
}

export type ComplexContent = {
  hero: { label: string; firstLine: string; secondLine: string; intro: string; action: string }
  index: { label: string; heading: string; intro: string }
  work: { label: string; heading: string; intro: string }
  projects: ComplexProject[]
  close: { label: string; heading: string; body: string; action: string }
}

export const COMPLEX: ComplexContent = {
  hero: {
    label: 'Our Projects · Systems & operations',
    firstLine: 'The work behind your business,',
    secondLine: 'made easier to run.',
    intro: 'We map how the work actually moves between people and decisions. Then we build a custom system around the way your team needs to work.',
    action: 'See the projects',
  },
  index: {
    label: 'The projects',
    heading: 'Systems we have built, and what they changed.',
    intro: 'Every project here started as a map of how the work actually moves. Then we built the system around it. Each one shows the problem, what we built, who uses it and what runs differently now.',
  },
  work: {
    label: 'Inside the work',
    heading: 'Open each system, one step at a time.',
    intro: 'Scroll through each workflow the way its team runs it. In every one, what a person can reach is decided by their role, and the drawing shows where that line sits.',
  },
  projects: [
    {
      id: 'bidding',
      number: '01',
      label: 'Expert bidding · Invitation only',
      title: 'The shortlist was the whole point.',
      lede: 'This team places work with experts it chooses itself. The brief, the invitations, the bids and the assignment all had to stay inside that circle.',
      card: {
        kind: 'Custom system',
        name: 'Private expert bidding',
        sector: 'Expert network',
        problem: 'Briefs, invitations and bids moved through email, with no real control over who saw what.',
        built: 'An invitation only bidding system: one brief, chosen experts, private bids checked against the range, and one recorded decision.',
        users: 'Admin team · invited experts',
        outcome: 'Work goes from brief to completion without a single public listing.',
      },
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
      card: {
        kind: 'Custom system',
        name: 'Laha Space operations',
        sector: 'Education marketplace',
        problem: 'Teacher applications, ID documents and review notes were spread across inboxes.',
        built: 'The admin system behind the booking platform: staged review, private documents, deliberate publishing, availability and moderation.',
        users: 'Laha team · teachers · students',
        outcome: 'Every teacher follows one path from application to a bookable profile.',
      },
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
    {
      id: 'academy',
      number: '03',
      label: 'Academy management · Two roles',
      title: 'One office, one record per student.',
      lede: 'A private academy ran enrolment, classes, attendance and fees in separate places. The office needed one system, and teachers needed only their part of it.',
      card: {
        kind: 'Custom system',
        name: 'Academy management platform',
        sector: 'Education · private academy',
        problem: 'Enrolment, attendance, progress and fees lived in separate places, so nobody had the full picture of a student.',
        built: 'One platform for registrations, programs and classes, attendance, progress, payments and reports, in English and Arabic.',
        users: 'Admin office · teachers · families',
        outcome: 'Set up, migrated and live in 10 to 16 business days, with the team trained on it.',
      },
      stops: [
        {
          node: 'Registration',
          detail: 'public form · approval',
          title: 'Every enrolment passes through the office.',
          body: 'Families register through a public page. Nothing becomes a student record until an admin reviews and approves it, so the list of students is always one the office has agreed to.',
          guard: 'Approved: a registration is not a student until the office says so.',
          side: 'near',
        },
        {
          node: 'Classes',
          detail: 'fees · schedule · capacity',
          title: 'Programs set the rules once.',
          body: 'Each program carries its fee. Classes under it carry the schedule, the teacher and the capacity, and students are placed on a roster. Everything after reads from these records instead of a spreadsheet.',
          guard: 'One source: fees and schedules live on the program.',
          side: 'near',
        },
        {
          node: 'Teacher view',
          detail: 'assigned classes only',
          title: 'A teacher sees their classes, and stops there.',
          body: 'A teacher signs in to the classes they are assigned to teach. Fees, payments and the rest of the academy stay with the office, so each person has exactly what their job needs.',
          guard: 'Scoped: a teacher reaches only their assigned classes.',
          side: 'far',
        },
        {
          node: 'Attendance',
          detail: 'marks · quizzes · scores',
          title: 'The day is recorded where it happens.',
          body: 'Teachers mark each class present, absent, late or excused, and log quizzes and progress against the program. Every mark joins the student’s history rather than a sheet that gets lost.',
          guard: 'On file: every mark stays in the student’s history.',
          side: 'far',
        },
        {
          node: 'Payments',
          detail: 'admin only · receipts',
          title: 'Fees are tracked by the office alone.',
          body: 'Payments are recorded against the student with their method and status, and a PDF receipt is produced on the spot. Payment data and family contact details never appear in a teacher account.',
          guard: 'Admin only: payment records never reach a teacher.',
          side: 'near',
        },
        {
          node: 'Reports',
          detail: 'report cards · CSV · PDF',
          title: 'The whole academy, in one export.',
          body: 'Attendance, enrolment and progress summaries come out as CSV or PDF, along with report cards for families. The office answers questions from the system instead of rebuilding the numbers by hand.',
          guard: 'Complete: reports read from the same records the team keeps.',
          side: 'near',
        },
      ],
      result: 'One system for the whole academy: enrolment, classes, attendance, progress and payments, in English and Arabic, with each role seeing only its part.',
    },
  ],
  close: {
    label: 'Your turn',
    heading: 'Got a system to build?',
    body: 'From a system that does not exist yet to one that has outgrown how it is run: we map the work first, and we don’t compromise on security.',
    action: 'Talk it through',
  },
}
