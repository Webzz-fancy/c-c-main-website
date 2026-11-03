/**
 * Copy shared by the interactive page and its readable, no-JS prerender.
 *
 * Every systems client stays anonymous throughout the public site: no names,
 * only the kind of business and the work. The workflow
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
 * What a reader needs to recognise their own problem: the kind of business,
 * how the work ran before, and what runs now. Outcomes are stated from what
 * the system does; no invented figures.
 */
export type ComplexCard = {
  name: string
  /** what kind of work it was: a custom system, process mapping, a funnel */
  kind: string
  /** what the work covers, never who the client is or what they sell */
  area: string
  before: string
  after: string
  users: string
}

export type ComplexProject = {
  id: string
  /** where it sits in the header's projects menu */
  group: 'systems' | 'automation' | 'websites'
  /** the drawing on its card, chosen to show the shape of the work */
  visual: 'match' | 'stages' | 'roles' | 'phone' | 'pipeline' | 'funnel' | 'path' | 'journey'
  title: string
  /** the heading over its step by step walk-through */
  walk: string
  lede: string
  card: ComplexCard
  /** each role, and what it can reach */
  roles: { name: string; access: string }[]
  stops: ComplexStop[]
  /**
   * How the workflow map is drawn. `columns`: the third and fourth stops sit
   * across the line on the right; `rows`: the first three run along the top,
   * the last three back along the bottom, across the line.
   */
  map: { shape: 'columns' | 'rows'; near: string; far: string; caption: string; note: string }
  /** the rest of what the system does, beyond the main workflow */
  features: string[]
  result: string
}

/** A product we run rather than a client system: it links out for details. */
export type ComplexProduct = {
  id: string
  name: string
  /** the card's label, in plain words */
  kind: string
  sector: string
  before: string
  after: string
  users: string
  /** the touchpoints that feed the hub, then the hub and where it leads */
  sources: string[]
  hub: string
  destination: string
  url: string
  action: string
}

/**
 * A problem a visitor might recognise, the words they might use for it, and
 * the projects that solved something like it. The finder on the projects page
 * matches what they pick or type against these; nothing leaves the page.
 */
export type ComplexNeed = {
  id: string
  label: string
  keywords: string[]
  /** project ids, closest first; 'ai-client-engine' is the AI discoverability card */
  projects: string[]
  /** how we would approach it, in one sentence */
  plan: string
}

/**
 * What a team of agents could do for one kind of business: the desks drawn on
 * the office floor, what waits on the owner, and the work the agents take on,
 * with clients and behind the scenes. Possibilities, not past projects.
 */
/**
 * One step of a job going through the office: where it is on the floor (a
 * desk by its index, the director, the owner's queue or the owner), the
 * level of control it runs at, and what happens.
 */
export type ComplexStoryStep = {
  at: number | 'director' | 'queue' | 'you'
  level: 'Automatic' | 'Checked' | 'Your yes' | 'On record'
  text: string
}

export type ComplexIndustry = {
  id: string
  label: string
  keywords: string[]
  teams: { name: string; job: string }[]
  queue: string[]
  /** one job, start to finish; its "Your yes" step is the queue's first item */
  story: ComplexStoryStep[]
  /** the built projects closest to this kind of business, closest first */
  projects: string[]
  clients: string[]
  operations: string[]
}

/** The AI agents we build, and run ourselves. */
export type ComplexAgents = {
  label: string
  heading: string
  emphasis: string
  intro: string
  /** the agent on the page, introducing itself */
  director: { name: string; job: string }
  teams: { name: string; job: string; state: 'working' | 'reported' | 'needs-you' }[]
  queue: { label: string; items: string[] }
  story: { label: string; steps: ComplexStoryStep[] }
  control: { label: string; steps: { level: string; what: string; says: string }[] }
  setup: { label: string; steps: { step: string; what: string }[] }
  /** what an office does for any business, before one is picked */
  general: { clients: string[]; operations: string[] }
  industries: { label: string; any: string; intro: string; note: string; items: ComplexIndustry[] }
  action: string
}

export type ComplexContent = {
  agents: ComplexAgents
  hero: { label: string; firstLine: string; secondLine: string; intro: string; action: string }
  index: {
    label: string
    heading: string
    intro: string
    /** the agents' card, first on the slider */
    agents: { kind: string; name: string; change: string; action: string }
  }
  finder: { label: string; heading: string; placeholder: string; none: string; reset: string; needs: ComplexNeed[] }
  projects: ComplexProject[]
  discoverability: ComplexProduct
  close: { label: string; heading: string; body: string; action: string; quiz: string }
}

/** The header's projects menu: the groups, in order, and what each holds. */
export const PROJECT_GROUPS: { id: ComplexProject['group'] | 'ai'; label: string }[] = [
  { id: 'ai', label: 'AI' },
  { id: 'systems', label: 'Custom systems' },
  { id: 'automation', label: 'Automation and funnels' },
  { id: 'websites', label: 'Online user experience' },
]

export const COMPLEX: ComplexContent = {
  agents: {
    label: 'AI agents',
    heading: 'A team of AI agents.',
    emphasis: 'You approve. They do the rest.',
    intro: 'Customised to your business. We map how your work moves, build the agents around it, and keep them running.',
    director: { name: 'Director agent', job: 'Plans the day · checks every report' },
    teams: [
      { name: 'Front desk', job: 'Answers enquiries · books calls', state: 'working' },
      { name: 'Sales', job: 'Researches leads · drafts follow ups', state: 'reported' },
      { name: 'Operations', job: 'Orders · invoices · deadlines', state: 'working' },
      { name: 'Reports', job: 'Numbers · targets · what slipped', state: 'reported' },
      { name: 'Content', job: 'Creates · schedules · manages posts', state: 'needs-you' },
    ],
    queue: {
      label: 'Waiting on you',
      items: ['Approve 3 follow up emails', 'Invoice batch ready to send', '2 posts passed QA'],
    },
    story: {
      label: 'Watch one job go through',
      steps: [
        { at: 'director', level: 'Automatic', text: 'Morning: the director agent sets today’s three priorities and hands out the work.' },
        { at: 1, level: 'Automatic', text: 'Sales researches three new leads and drafts a personal follow up for each.' },
        { at: 4, level: 'Checked', text: 'Content checks every draft against your tone and the facts.' },
        { at: 'queue', level: 'Your yes', text: 'The drafts wait in your queue. You approve, edit or reject them in one batch.' },
        { at: 'you', level: 'On record', text: 'Approved emails go out, and every step is saved with who approved it.' },
      ],
    },
    control: {
      label: 'You stay in control',
      steps: [
        { level: 'Automatic', what: 'Research, drafts and internal records.', says: 'Research, drafts and internal records, I get on with by myself.' },
        { level: 'Checked', what: 'Routine work passes a separate quality check first.', says: 'Routine work goes through a separate quality check before it moves on.' },
        { level: 'Your yes', what: 'Anything sent to a client or the public, and anything involving money or a commitment, waits for you.', says: 'Anything for a client or the public, or involving money or a commitment, waits for your yes.' },
        { level: 'On record', what: 'Every job, report and decision is written down and kept.', says: 'Everything I do is written down, with who approved it.' },
      ],
    },
    setup: {
      label: 'How we set it up',
      steps: [
        { step: 'Map', what: 'How your work moves today' },
        { step: 'Build', what: 'Agents around your tools and rules' },
        { step: 'Test', what: 'Beside your team until it’s right' },
        { step: 'Run', what: 'Kept running, added to as you grow' },
      ],
    },
    general: {
      clients: ['Answers enquiries and books calls, day and night', 'Researches leads and drafts each follow up', 'Sends updates, reminders and review requests on time'],
      operations: ['Orders, invoices and payment reminders', 'Reports with targets and what slipped', 'Content drafted and checked before it goes out', 'Deadlines and renewals tracked'],
    },
    industries: {
      label: 'See it for your business',
      any: 'Any business',
      intro: 'What AI agents could take on for',
      note: 'Every draft and decision waits for your yes.',
      items: [
        {
          id: 'law',
          label: 'Law firm',
          keywords: ['law firm', 'law', 'lawyer', 'legal', 'solicitor', 'attorney', 'barrister', 'litigation', 'paralegal'],
          teams: [{ name: 'Intake', job: 'Intake questions · conflict check' }, { name: 'Documents', job: 'Drafts letters · for a lawyer to review' }, { name: 'Deadlines', job: 'Filing dates · court dates' }, { name: 'Billing', job: 'Time logs · invoice drafts' }],
          queue: ['Approve 2 engagement letters', 'New intake ready to review', 'Filing due on Friday'],
          story: [
            { at: 0, level: 'Automatic', text: '11:40pm, a new enquiry. Intake asks your intake questions and runs a conflict check. It never gives advice.' },
            { at: 1, level: 'Automatic', text: 'Documents drafts the engagement letter from your own template.' },
            { at: 'director', level: 'Checked', text: 'The director agent checks it is complete and matches the intake before it reaches you.' },
            { at: 'queue', level: 'Your yes', text: 'It waits for a lawyer, who approves, edits or rejects it.' },
            { at: 2, level: 'On record', text: 'Once signed, Deadlines adds the key dates for a lawyer to confirm, and the whole trail is saved to the matter.' },
          ],
          projects: ['orders', 'bidding', 'membership'],
          clients: ['Answers new enquiries and books consultations, never giving advice', 'Runs your intake questions and a conflict check first', 'Drafts client updates for the responsible lawyer to send'],
          operations: ['Drafts standard letters for a lawyer to review', 'Tracks filing and court dates for a lawyer to confirm', 'Turns time logs into invoice drafts', 'A weekly report on every open matter'],
        },
        {
          id: 'clinic',
          label: 'Clinic',
          keywords: ['clinic', 'dental', 'dentist', 'doctor', 'medical', 'patient', 'physio', 'therapy', 'therapist', 'aesthetic', 'health'],
          teams: [{ name: 'Front desk', job: 'WhatsApp · books · moves visits' }, { name: 'Recalls', job: 'Patients due a visit' }, { name: 'Supplies', job: 'Stock watch · reorder drafts' }, { name: 'Aftercare', job: 'Care messages · review requests' }],
          queue: ['5 recall messages to approve', 'Reorder ready to send', 'Approve this week’s rota'],
          story: [
            { at: 0, level: 'Automatic', text: '10pm, a patient asks on WhatsApp to move an appointment. Front desk offers open slots and rebooks it.' },
            { at: 1, level: 'Automatic', text: 'Recalls finds five patients due a visit and drafts a message for each.' },
            { at: 'director', level: 'Checked', text: 'Every message is checked against your clinic’s rules. Nothing medical is written by an agent.' },
            { at: 'queue', level: 'Your yes', text: 'The recall messages wait for your front desk to approve.' },
            { at: 3, level: 'On record', text: 'They go out, reminders follow on their own, and every message is saved.' },
          ],
          projects: ['client-app', 'ai-client-engine'],
          clients: ['Answers WhatsApp and Instagram, and books, confirms and moves appointments', 'Reminders and confirmations that cut no-shows', 'Recalls patients when a visit is due'],
          operations: ['Preparation and aftercare messages, checked by staff', 'Watches stock and drafts reorders', 'Drafts the staff rota', 'Asks for reviews after each visit'],
        },
        {
          id: 'accounting',
          label: 'Accounting firm',
          keywords: ['accountant', 'accounting', 'bookkeep', 'tax', 'audit', 'payroll', 'cpa'],
          teams: [{ name: 'Documents', job: 'Chases · files client papers' }, { name: 'Deadlines', job: 'Every filing and tax date' }, { name: 'Summaries', job: 'Monthly summaries · drafts' }, { name: 'Onboarding', job: 'New clients · step by step' }],
          queue: ['Review 4 monthly summaries', 'Two clients missing papers', 'New client checklist ready'],
          story: [
            { at: 0, level: 'Automatic', text: 'Documents chases two clients for missing papers and files what comes in to the right client.' },
            { at: 2, level: 'Automatic', text: 'Summaries drafts each client’s monthly summary from their files.' },
            { at: 'director', level: 'Checked', text: 'The director agent checks every figure has a source document behind it.' },
            { at: 'queue', level: 'Your yes', text: 'A partner reviews the summaries in one batch.' },
            { at: 1, level: 'On record', text: 'Approved summaries go out, Deadlines tracks the next filing date, and it is all saved.' },
          ],
          projects: ['orders', 'academy', 'membership'],
          clients: ['Chases clients for missing documents', 'Answers routine questions', 'Onboards new clients step by step'],
          operations: ['Files incoming documents to the right client', 'Tracks every filing and tax deadline', 'Drafts monthly summaries for review', 'A workload report per accountant'],
        },
        {
          id: 'property',
          label: 'Real estate agency',
          keywords: ['real estate', 'property', 'estate agent', 'realtor', 'letting', 'rental', 'tenant', 'landlord', 'broker'],
          teams: [{ name: 'Enquiries', job: 'WhatsApp · replies · qualifies' }, { name: 'Viewings', job: 'Books · follows up after' }, { name: 'Paperwork', job: 'Chases documents per deal' }, { name: 'Listings', job: 'Descriptions · for approval' }],
          queue: ['Approve 2 listing drafts', 'Offer letter ready to send', 'Renewal due next week'],
          story: [
            { at: 0, level: 'Automatic', text: 'A listing enquiry arrives on WhatsApp at night. Enquiries answers it and qualifies the buyer.' },
            { at: 1, level: 'Automatic', text: 'Viewings books a time that suits you both and sends the details.' },
            { at: 3, level: 'Checked', text: 'Listings drafts two new descriptions, checked against the property details.' },
            { at: 'queue', level: 'Your yes', text: 'The listing drafts wait for your yes before they go public.' },
            { at: 2, level: 'On record', text: 'Paperwork chases what each deal still needs, and every step is saved.' },
          ],
          projects: ['ai-client-engine', 'client-app', 'orders'],
          clients: ['Replies to listing enquiries day and night', 'Qualifies buyers and tenants', 'Books viewings and follows up after'],
          operations: ['Chases the documents for each deal', 'Drafts listing descriptions for approval', 'Reminds you of renewals and inspections', 'A weekly pipeline report'],
        },
        {
          id: 'agency',
          label: 'Agency or consultancy',
          keywords: ['agency', 'consult', 'marketing agency', 'studio', 'freelance', 'advisory'],
          teams: [{ name: 'Sales', job: 'Researches leads · drafts outreach' }, { name: 'Proposals', job: 'Call notes into proposals' }, { name: 'Projects', job: 'Status · flags overruns' }, { name: 'Reports', job: 'Monthly client reports' }],
          queue: ['Proposal ready to review', 'Approve 3 outreach drafts', 'Client report passed QA'],
          story: [
            { at: 0, level: 'Automatic', text: 'Sales researches three leads that look like your best clients.' },
            { at: 1, level: 'Automatic', text: 'Proposals turns yesterday’s call notes into a proposal draft.' },
            { at: 'director', level: 'Checked', text: 'The director agent checks the scope and pricing against your rate card.' },
            { at: 'queue', level: 'Your yes', text: 'The proposal waits for you to review and send.' },
            { at: 2, level: 'On record', text: 'Once it is signed, Projects sets up the work and reports its status every week.' },
          ],
          projects: ['bidding', 'orders', 'quiz-funnel'],
          clients: ['Researches leads and drafts outreach', 'Turns call notes into proposals', 'Sends each client a weekly update'],
          operations: ['Pulls project status from your tools', 'Flags work running over time or budget', 'Drafts and checks content', 'Builds the monthly client reports'],
        },
        {
          id: 'academy',
          label: 'School or academy',
          keywords: ['school', 'academy', 'institute', 'tutor', 'tuition', 'training', 'course', 'student', 'parent', 'education'],
          teams: [{ name: 'Admissions', job: 'Enquiries · enrolment' }, { name: 'Attendance', job: 'Registers · progress' }, { name: 'Fees', job: 'Reminders · unpaid fees' }, { name: 'Timetable', job: 'Teacher cover · term plan' }],
          queue: ['Approve fee reminders', 'Cover needed on Tuesday', 'Term report ready'],
          story: [
            { at: 0, level: 'Automatic', text: '9pm, a parent asks about classes. Admissions answers and starts the enrolment.' },
            { at: 2, level: 'Automatic', text: 'Fees finds unpaid invoices and drafts a polite reminder for each family.' },
            { at: 'director', level: 'Checked', text: 'The director agent checks every amount against your records.' },
            { at: 'queue', level: 'Your yes', text: 'The reminders wait for the office to approve.' },
            { at: 1, level: 'On record', text: 'They go out, and Attendance keeps registers and progress up to date.' },
          ],
          projects: ['academy', 'community', 'membership'],
          clients: ['Answers parent and student enquiries', 'Runs enrolment and the reminders', 'Chases unpaid fees politely'],
          operations: ['Attendance and progress reports', 'Finds cover when a teacher is out', 'Drafts the term timetable', 'A weekly report for the office'],
        },
        {
          id: 'store',
          label: 'Online store or wholesaler',
          keywords: ['shop', 'store', 'ecommerce', 'e-commerce', 'shopify', 'wholesale', 'retail', 'product', 'stock', 'inventory', 'brand'],
          teams: [{ name: 'Support', job: 'WhatsApp · orders · delivery' }, { name: 'Orders', job: 'Orders · invoices · payments' }, { name: 'Stock', job: 'Alerts · reorder drafts' }, { name: 'Suppliers', job: 'Follow ups · deliveries' }],
          queue: ['Approve 2 reorders', 'Trade quote ready to send', 'A refund needs your yes'],
          story: [
            { at: 0, level: 'Automatic', text: 'A customer asks on WhatsApp where their order is. Support replies with the tracking.' },
            { at: 2, level: 'Automatic', text: 'Stock sees two products running low and drafts the reorders.' },
            { at: 'director', level: 'Checked', text: 'The director agent checks the quantities against recent sales.' },
            { at: 'queue', level: 'Your yes', text: 'The reorders wait for your yes.' },
            { at: 3, level: 'On record', text: 'Approved orders go to your suppliers, and Suppliers follows up on delivery.' },
          ],
          projects: ['orders', 'quiz-funnel', 'ai-client-engine'],
          clients: ['Answers order and delivery questions', 'Quotes trade buyers from your price list', 'Asks for reviews after delivery'],
          operations: ['Stock alerts and reorder drafts', 'Matches orders, invoices and payments', 'Follows up with suppliers', 'A daily sales report'],
        },
        {
          id: 'trades',
          label: 'Field service business',
          keywords: ['contractor', 'plumb', 'electric', 'builder', 'construction', 'cleaning', 'landscap', 'repair', 'install', 'trades', 'field'],
          teams: [{ name: 'Bookings', job: 'Job enquiries · site visits' }, { name: 'Quotes', job: 'From your price list' }, { name: 'Scheduling', job: 'Team days · routes' }, { name: 'Invoices', job: 'Invoices · payment reminders' }],
          queue: ['Approve 3 quotes', 'Tomorrow’s routes ready', '2 invoices overdue'],
          story: [
            { at: 0, level: 'Automatic', text: '8pm, a job request. Bookings asks for photos and books a site visit.' },
            { at: 1, level: 'Automatic', text: 'Quotes prices the job from your price list and the visit notes.' },
            { at: 'director', level: 'Checked', text: 'The director agent checks the quote covers everything in the notes.' },
            { at: 'queue', level: 'Your yes', text: 'Three quotes wait for your yes.' },
            { at: 3, level: 'On record', text: 'When the job is done, Invoices sends the invoice and chases it until it is paid.' },
          ],
          projects: ['orders', 'client-app', 'bidding'],
          clients: ['Replies to job enquiries and books visits', 'Sends quotes from your price list', 'Reminds customers the day before'],
          operations: ['Plans each team’s day and route', 'Invoices as soon as a job is done', 'Chases unpaid invoices', 'A weekly jobs and cash report'],
        },
      ],
    },
    action: 'Talk to us about your agents',
  },
  hero: {
    label: 'Our Projects',
    firstLine: 'Tell us the work.',
    secondLine: 'See the agents and systems we built for it.',
    intro: 'AI agents and custom systems we have built, and the work each one takes off a team. Search for the task you want handled and the closest work comes first.',
    action: 'See the projects',
  },
  index: {
    label: 'The projects',
    heading: 'Work we have built, and what it changed.',
    agents: {
      kind: 'AI agents',
      name: 'A team of AI agents',
      change: 'An agent for each job in the business, working beside the team. Clause & Code runs on them, and anything that matters waits for a yes.',
      action: 'See the agents at work',
    },
    intro: 'AI agents, AI discoverability, custom systems and automation. Every project started with a map of how the work actually moves.',
  },
  finder: {
    label: 'Search our work to find what’s right for you',
    heading: 'Search our work by the task you want handled',
    placeholder: 'Type a task, e.g. “answer enquiries at night”',
    none: 'Nothing here matches that exactly yet. Every system on this page started as a problem like yours, mapped first and built after. Tell us about it.',
    reset: 'Clear',
    needs: [
      {
        id: 'enquiries',
        label: 'Answer enquiries 24/7',
        keywords: ['enquir', 'inquir', 'dm', 'message', 'respond', 'repl', 'answer', 'instagram', 'whatsapp', 'miss', 'unanswered', 'inbox', 'contact', 'after hours', 'night'],
        projects: ['ai-client-engine', 'agents', 'orders'],
        plan: 'Catch every enquiry the moment it arrives, answer it, and move it into one tracked pipeline so nobody follows up from memory.',
      },
      {
        id: 'leads',
        label: 'Follow up on leads',
        keywords: ['lead', 'outreach', 'prospect', 'cold', 'pipeline', 'sales', 'linkedin', 'client acquisition', 'new clients', 'research'],
        projects: ['agents', 'ai-client-engine', 'orders'],
        plan: 'An agent researches each lead, drafts a personal message for your yes, and follows up on time so no lead goes cold.',
      },
      {
        id: 'reports',
        label: 'Daily reports',
        keywords: ['report', 'dashboard', 'kpi', 'target', 'numbers', 'progress', 'update', 'status', 'visibility', 'weekly', 'daily'],
        projects: ['agents', 'academy', 'client-app'],
        plan: 'Agents gather the numbers each day, show targets and what slipped, and put one short report in front of you.',
      },
      {
        id: 'proposals',
        label: 'Proposals and pitches',
        keywords: ['proposal', 'pitch', 'tender', 'brief', 'deck', 'one pager', 'scope', 'estimate'],
        projects: ['agents', 'orders', 'bidding'],
        plan: 'An agent turns your call notes or a brief into a proposal or pitch draft, ready for you to check and send.',
      },
      {
        id: 'content',
        label: 'Content and posts',
        keywords: ['content', 'post', 'social', 'blog', 'newsletter', 'caption', 'write', 'writing', 'marketing', 'instagram post', 'linkedin post'],
        projects: ['agents', 'quiz-funnel'],
        plan: 'Agents draft the posts and emails, a second agent checks them, and nothing goes out without your yes.',
      },
      {
        id: 'handoffs',
        label: 'Handoffs and approvals',
        keywords: ['handoff', 'hand off', 'hand over', 'approv', 'assign', 'chase', 'chasing', 'follow up', 'forget', 'email', 'whatsapp', 'manual', 'by hand', 'task', 'lost', 'who does', 'responsib', 'bottleneck', 'delay'],
        projects: ['orders', 'bidding', 'membership'],
        plan: 'Map how the work really moves, then turn every handoff into a status that assigns the next person and reminds them.',
      },
      {
        id: 'people',
        label: 'Vetting and matching people',
        keywords: ['vet', 'hire', 'hiring', 'recruit', 'expert', 'freelanc', 'contractor', 'teacher', 'tutor', 'consultant', 'coach', 'match', 'shortlist', 'supplier', 'vendor', 'bid', 'tender', 'screen', 'interview', 'applicant'],
        projects: ['bidding', 'community'],
        plan: 'Put every applicant or expert through the same tracked stages, then let the system suggest who fits each piece of work.',
      },
      {
        id: 'bookings',
        label: 'Bookings and reminders',
        keywords: ['book', 'appointment', 'schedul', 'calendar', 'remind', 'no show', 'no-show', 'noshow', 'follow', 'review', 'referral', 'session', 'cancel', 'reschedul', 'slot'],
        projects: ['client-app', 'community', 'ai-client-engine'],
        plan: 'Let clients book themselves, then send the reminders, follow ups, review requests and referrals on time, automatically.',
      },
      {
        id: 'onboarding',
        label: 'Onboarding and sign ups',
        keywords: ['onboard', 'welcome', 'member', 'application', 'apply', 'intake', 'form', 'waitlist', 'sign up', 'signup', 'register', 'registration', 'enrol', 'new client'],
        projects: ['membership', 'quiz-funnel', 'academy'],
        plan: 'Design one path from sign up to welcome, with the forms, approvals, payments and emails built in, so every new person starts the same way.',
      },
      {
        id: 'selling',
        label: 'Selling a program online',
        keywords: ['course', 'program', 'programme', 'funnel', 'landing', 'quiz', 'launch', 'sell', 'sequence', 'offer', 'digital', 'webinar', 'cohort'],
        projects: ['quiz-funnel', 'membership', 'ai-client-engine'],
        plan: 'Build the page, the quiz or application, the payment and the email sequence as one funnel that sells and delivers without you sending each email.',
      },
      {
        id: 'scattered',
        label: 'One system for everything',
        keywords: ['spreadsheet', 'excel', 'sheet', 'scattered', 'separate', 'tools', 'one place', 'chaos', 'chaotic', 'messy', 'mess', 'track', 'attendance', 'data', 'crm'],
        projects: ['academy', 'client-app', 'orders'],
        plan: 'Bring the records into one system where each role sees only its part, and the reports come out of it instead of being rebuilt by hand.',
      },
      {
        id: 'payments',
        label: 'Quotes, invoices, payments',
        keywords: ['payment', 'invoice', 'quote', 'fee', 'pay', 'billing', 'receipt', 'overdue', 'late', 'pricing', 'price', 'order'],
        projects: ['orders', 'academy', 'membership'],
        plan: 'Tie quotes, invoices and payments to the same record, with reminders when something is late and nothing released until it is paid.',
      },
      {
        id: 'website',
        label: 'A website people experience',
        keywords: ['website', 'web site', 'web design', 'redesign', 'homepage', 'home page', 'seo', 'google', 'search engine', 'search result', 'get found', 'be found', 'visib', 'portfolio', 'gallery', 'artist', 'artisan', 'maker', 'handmade', 'craft', 'watch', 'jewel', 'commission', 'collector', 'first impression'],
        projects: ['website-journey', 'ai-client-engine', 'quiz-funnel'],
        plan: 'Map who visits and what they came to do, then build the site around it: the story in the scroll, the work up close, the facts to decide, and ordering or commissioning on the page.',
      },
    ],
  },
  projects: [
    {
      id: 'bidding',
      group: 'systems',
      visual: 'match',
      title: 'The right experts for every project, found by the system.',
      walk: 'How a project finds its expert',
      lede: 'A team delivers projects through a network of independent experts. When a project comes in, the system finds the experts whose expertise fits, the team invites the ones it wants, and the bids, the choice and the work all stay inside that circle.',
      card: {
        name: 'Expert matching and bidding',
        kind: 'Custom system',
        area: 'Expert matching · bidding · assignment',
        before: 'Every project meant searching the expert list by hand, emailing invitations and chasing bids across inboxes.',
        after: 'The system suggests the experts who fit, the team invites them from one screen, and every bid arrives in one place.',
        users: 'Admin team · invited experts',
      },
      roles: [
        { name: 'Admin team', access: 'Uploads each project, reviews the experts the system suggests, sends the invitations, compares the bids and selects one.' },
        { name: 'Invited expert', access: 'Sees only the projects they were invited to, bids inside the range, and follows the work once assigned.' },
      ],
      stops: [
        {
          node: 'Project',
          detail: 'scope · discipline · range',
          title: 'The project goes in once.',
          body: 'The team uploads each new project with its scope, its discipline and the range it is worth. Every step after that reads from the same record instead of a version pasted into an email.',
          guard: 'One source: the project holds the scope and the range.',
          side: 'near',
        },
        {
          node: 'Matching',
          detail: 'expertise → shortlist',
          title: 'The system finds who fits.',
          body: 'The system compares the project with every expert’s areas of expertise and lists the ones who match. The team starts from a shortlist of likely experts instead of searching the whole network by hand.',
          guard: 'Suggested, not sent: nothing reaches an expert until the team chooses.',
          side: 'near',
        },
        {
          node: 'Invitations',
          detail: 'chosen from the shortlist',
          title: 'Invitations, not listings.',
          body: 'The team picks from the shortlist and sends the invitations. Each invited expert finds the project waiting in their own account. There is no open board to search and nothing is posted in public.',
          guard: 'Selected access: only invited experts ever see the project.',
          side: 'far',
        },
        {
          node: 'Private bids',
          detail: 'kept per expert',
          title: 'Each expert bids privately.',
          body: 'An invited expert reads the brief and submits a bid. Each bid is checked against the project’s range, so the team compares numbers it can actually use, all in one view rather than a folder of replies.',
          guard: 'Isolated: no expert can see another expert’s bid.',
          side: 'far',
        },
        {
          node: 'Selection',
          detail: 'one expert chosen',
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
      map: { shape: 'columns', near: 'Team workspace', far: 'Invited experts', caption: 'Invitation only', note: 'Nobody outside the shortlist is ever shown the brief.' },
      features: [
        'Experts matched to each project by their areas of expertise',
        'Every project carries its scope, discipline and value range',
        'Bids outside the project’s range are refused',
        'No expert can see another expert’s bid',
        'One recorded selection per project, then bidding closes',
        'Project status from open to ongoing to completed',
      ],
      result: 'Every project reaches the right experts without searching by hand, and runs from upload to completed work without a single public listing.',
    },
    {
      id: 'community',
      group: 'systems',
      visual: 'stages',
      title: 'Only vetted teachers, matched to the right student.',
      walk: 'How a teacher gets in and gets matched',
      lede: 'A learning community connects students with one on one teachers. Trust is the whole promise: every teacher clears seven stages before going live, and each student is then pointed to the teacher who fits.',
      card: {
        name: 'Teacher vetting and matching',
        kind: 'Custom system',
        area: 'Vetting · matching · booking',
        before: 'Vetting teachers and arranging sessions meant coordinating applications, interviews and bookings by hand.',
        after: 'Every teacher clears seven tracked stages, and students are matched and booked with the right teacher automatically.',
        users: 'Community team · teachers · students',
      },
      roles: [
        { name: 'Community team', access: 'Moves each applicant through the seven stages, checks documents, records interviews and teaching tests, and decides who goes live.' },
        { name: 'Teacher', access: 'Applies once, completes the training, then sets the hours students can book.' },
        { name: 'Student', access: 'Sees only vetted teachers, is pointed to the ones who fit their goal and level, and books a free discovery session.' },
      ],
      stops: [
        {
          node: 'Application',
          detail: 'qualifications · references',
          title: 'One application holds the full picture.',
          body: 'A teacher applies with their qualifications, teaching experience and references. Everything they submit stays together in one record the team works from, instead of being spread across inboxes.',
          guard: 'Held internally: an application is never public.',
          side: 'near',
        },
        {
          node: 'Screening',
          detail: 'every document checked',
          title: 'Every document is checked first.',
          body: 'The team reviews each document and follows up on anything missing before the applicant moves on. Verification files are read inside the admin area, behind the team’s own sign in.',
          guard: 'Protected: documents are served to the team, not to the site.',
          side: 'near',
        },
        {
          node: 'Interview',
          detail: 'interview · teaching test',
          title: 'Seen teaching, not just on paper.',
          body: 'A one on one interview, a team review, then a live teaching test the team observes and evaluates. Notes from every stage stay with the applicant, so each decision can still be explained months later.',
          guard: 'On file: stage history and notes stay with the applicant.',
          side: 'near',
        },
        {
          node: 'Go live',
          detail: 'training → profile',
          title: 'Live only after all seven stages.',
          body: 'Accepted teachers complete the training program, and only then does the team publish the profile. Going live is a decision, never a side effect of applying.',
          guard: 'Controlled: nothing is visible until every stage is cleared.',
          side: 'far',
        },
        {
          node: 'Matching',
          detail: 'goal · level · focus',
          title: 'Each student meets the right teacher.',
          body: 'Students browse vetted teachers by focus and level, and the system points each one to the teachers who fit what they want to learn, so nobody has to guess from a long list.',
          guard: 'Vetted only: students only ever see teachers who cleared every stage.',
          side: 'far',
        },
        {
          node: 'Booking',
          detail: 'discovery session · sessions',
          title: 'The coordination runs on its own.',
          body: 'A student books a free discovery session from the hours the teacher offers, and the scheduling between them is coordinated automatically from there. The team is no longer passing messages back and forth.',
          guard: 'Accurate: only hours a teacher offers can be booked.',
          side: 'far',
        },
      ],
      map: { shape: 'rows', near: 'Team workspace · admin only', far: 'Live in the community', caption: 'The work behind every booking', note: 'Notes and ID files stay behind the team’s sign in.' },
      features: [
        'Seven stage vetting, tracked for every applicant with notes',
        'Verification documents behind the team’s own sign in',
        'Profiles stay as drafts until the team publishes them',
        'Teachers browsed by focus and level',
        'Free discovery sessions booked from real availability',
        'Community sign up with weekly reminders',
      ],
      result: 'Every teacher in the community has cleared the same seven stages, and every student reaches the right teacher without the team coordinating by hand.',
    },
    {
      id: 'academy',
      group: 'systems',
      visual: 'roles',
      title: 'One office, one record per student.',
      walk: 'How a student moves through the academy',
      lede: 'An academy ran enrolment, classes, attendance and fees in separate places. The office needed one system, and teachers needed only their part of it.',
      card: {
        name: 'Academy management platform',
        kind: 'Custom system',
        area: 'Enrolment · classes · attendance · payments',
        before: 'Enrolment, attendance, progress and fees were tracked in separate places.',
        after: 'One platform for the whole academy, in English and Arabic, live in 10 to 16 business days.',
        users: 'Admin office · teachers · families',
      },
      roles: [
        { name: 'Admin office', access: 'Full access: approves enrolments, sets programs and fees, records payments and runs reports.' },
        { name: 'Teacher', access: 'Their assigned classes only: marks attendance and logs progress.' },
        { name: 'Families', access: 'The public registration page only.' },
      ],
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
      map: { shape: 'columns', near: 'Admin office', far: 'Teachers', caption: 'One academy, two roles', note: 'Payments and family contacts stay with the office.' },
      features: [
        'English and Arabic throughout',
        'A PDF receipt for every payment',
        'Report cards, plus CSV and PDF exports',
        'Search and filters across students and classes',
        'Student status from active to graduated or withdrawn',
        'Privacy policy and terms pages built in',
      ],
      result: 'One system for the whole academy: enrolment, classes, attendance, progress and payments, in English and Arabic, with each role seeing only its part.',
    },
    {
      id: 'client-app',
      group: 'systems',
      visual: 'phone',
      title: 'Every appointment, from booking to the next one.',
      walk: 'How an appointment runs',
      lede: 'A client app, an admin system for the team and a live dashboard for owners, built as one platform. The client is guided before the visit, looked after once it is over, and asked for a review and a referral at the right moment, without anyone on the team chasing it.',
      card: {
        name: 'Client journey platform',
        kind: 'Custom platform',
        area: 'Client app · admin system · owner dashboard',
        before: 'Bookings, reminders, follow ups, reviews and referrals each depended on someone remembering to do them.',
        after: 'Clients book, prepare and get followed up in their own app, while the team and owners see every appointment and number live.',
        users: 'Clients · front desk team · owners',
      },
      roles: [
        { name: 'Client', access: 'Books on their phone, gets reminders and preparation steps, follow up check ins after the visit, loyalty points, and a one tap referral link.' },
        { name: 'Front desk team', access: 'Manages services, staff, schedules and bookings in the admin system, with each appointment’s status updated live.' },
        { name: 'Owners', access: 'See revenue by service, bookings and revenue per slot across every branch, side by side, in real time.' },
      ],
      stops: [
        {
          node: 'Booking',
          detail: 'in the app · own calendar',
          title: 'Booked in a few taps.',
          body: 'The client books from their phone and the appointment goes straight into their own calendar. The front desk sees the booking arrive in the admin system with no call or message in between.',
          guard: 'One record: the app and the admin system read the same booking.',
          side: 'near',
        },
        {
          node: 'Reminders',
          detail: 'sent automatically',
          title: 'Nobody forgets the appointment.',
          body: 'Reminders go out on their own ahead of the visit, so the team is not phoning through the day’s list to confirm who is coming.',
          guard: 'Automatic: reminders follow the booking, not someone’s memory.',
          side: 'near',
        },
        {
          node: 'Preparation',
          detail: 'steps before the visit',
          title: 'Ready before they arrive.',
          body: 'Before the visit, the app walks the client through what to expect and how to prepare, so the appointment starts on time and nothing has to be explained twice.',
          guard: 'Guided: every client gets the same preparation, every time.',
          side: 'near',
        },
        {
          node: 'Follow up',
          detail: 'timed check ins',
          title: 'Looked after once it is over.',
          body: 'After the visit, timed prompts and check ins run through the following days. The client is cared for between appointments without the team sending a single message by hand.',
          guard: 'Timed: each check in arrives when it is useful, not when someone has a minute.',
          side: 'far',
        },
        {
          node: 'Reviews',
          detail: 'asked at the right moment',
          title: 'Asked when they are happiest.',
          body: 'The review request is timed for the point where the client is most pleased with the result, not sent the moment they walk out of the door.',
          guard: 'Earned: a review is only asked for once the follow up has run.',
          side: 'far',
        },
        {
          node: 'Referrals',
          detail: 'one tap · loyalty points',
          title: 'Happy clients bring the next ones.',
          body: 'Clients collect loyalty points and share a referral with friends in one tap. Owners see which services bring the most value, by branch, as it happens.',
          guard: 'Measured: every booking, review and referral feeds the owner dashboard.',
          side: 'far',
        },
      ],
      map: { shape: 'rows', near: 'Before the visit', far: 'After the visit', caption: 'One client, end to end', note: 'Owners see every branch’s numbers live, side by side.' },
      features: [
        'Services, staff and schedules managed in one admin system',
        'Live status on every appointment',
        'Appointments added to the client’s own calendar',
        'Loyalty points inside the app',
        'Revenue by service and per slot, across branches',
        'High value client segments shown on the dashboard',
      ],
      result: 'The whole client journey, from booking to referral, runs in one platform, and owners read the business from a live dashboard instead of a spreadsheet.',
    },
    {
      id: 'orders',
      group: 'automation',
      visual: 'pipeline',
      title: 'B2B orders that move themselves to the next person.',
      walk: 'How an order moves',
      lede: 'We mapped how B2B enquiries and orders actually moved through the business, found where they stalled, and rebuilt the process as one pipeline. Every handoff is now a status change that assigns the next person automatically.',
      card: {
        name: 'B2B order pipeline',
        kind: 'Process mapping and automation',
        area: 'Enquiries · onboarding · quotes · fulfilment',
        before: 'Tasks lived in email and chat, enquiries were followed up from memory, and every quote and invoice detail was copied by hand.',
        after: 'One pipeline from enquiry to dispatch, with automatic assignment, reminders, a written SOP and video walkthroughs for the team.',
        users: 'Founder · admin · finance · fulfilment',
      },
      roles: [
        { name: 'Founder', access: 'Reviews each new enquiry and approves or rejects it, and is told automatically when a quote is turned down.' },
        { name: 'Admin', access: 'Is assigned every approved account, sends pricing, checks stock and minimum orders, quotes, and closes the order out.' },
        { name: 'Finance', access: 'Is told to confirm reserved stock, raises the invoice, and gets a reminder when payment is late.' },
      ],
      stops: [
        {
          node: 'Enquiry',
          detail: 'one branded form',
          title: 'One form instead of two emails.',
          body: 'The old enquiry form and the questionnaire admin used to email out were merged into one branded form. Each submission creates a record on its own, so no enquiry depends on someone spotting it in the inbox.',
          guard: 'Captured: every enquiry becomes a record the moment it is sent.',
          side: 'near',
        },
        {
          node: 'Review',
          detail: 'approve · reject',
          title: 'A decision, not a lost email.',
          body: 'New records are set to In review and assigned to the founder. If a review sits for three days, a reminder goes out, so warm leads are not left waiting.',
          guard: 'Reminded: nothing stays in review for more than three days unnoticed.',
          side: 'near',
        },
        {
          node: 'Onboarding',
          detail: 'assigned to admin',
          title: 'Approval starts the work.',
          body: 'Approving an account moves it to Onboarding, assigns it to admin with a task to send pricing and the brochure within three days, and tells finance to check any reserved stock.',
          guard: 'Handed over: approval assigns the next two people automatically.',
          side: 'near',
        },
        {
          node: 'Quote',
          detail: 'stock · minimum order',
          title: 'Quoted against the rules.',
          body: 'Admin checks stock and the minimum order rules before quoting. If a quote is rejected, the founder is notified to follow up personally.',
          guard: 'Escalated: a rejected quote always reaches the founder.',
          side: 'far',
        },
        {
          node: 'Payment',
          detail: 'invoice · 3 day reminder',
          title: 'Paid before it ships.',
          body: 'Finance raises the invoice in the accounting software and a payment follow up is set for three days later. New accounts pay before anything is fulfilled.',
          guard: 'Protected: first orders are only released once paid.',
          side: 'far',
        },
        {
          node: 'Dispatch',
          detail: 'tracking → completed',
          title: 'Closed with tracking.',
          body: 'The order goes to fulfilment, tracking is added and sent to the buyer, and the order is marked completed and archived, so the pipeline only ever shows live work.',
          guard: 'Finished: every order ends with tracking sent and a completed status.',
          side: 'far',
        },
      ],
      map: { shape: 'rows', near: 'New accounts', far: 'Orders', caption: 'Mapped, then automated', note: 'Each status change assigns the next person automatically.' },
      features: [
        'Workflows mapped with the founder before anything was built',
        'A workspace with a space for each department',
        'New and existing accounts kept apart, with large accounts in their own space',
        'A written B2B admin SOP',
        'Video walkthroughs of every step for the team',
        'An enquiry log and a connected support inbox',
      ],
      result: 'Enquiries and orders now follow one written, automated path, and the team can see who owns every account at every step.',
    },
    {
      id: 'quiz-funnel',
      group: 'automation',
      visual: 'funnel',
      title: 'A quiz that sells, onboards and delivers on its own.',
      walk: 'How a quiz taker becomes a client',
      lede: 'A long online program existed only as written content: no page to sell it, no sign up flow and no way to deliver it. We built the funnel and the delivery around it, from a personality quiz on the landing page to the feedback form after the last session.',
      card: {
        name: 'Quiz funnel and program delivery',
        kind: 'Funnel and automation',
        area: 'Landing page · quiz · payments · email delivery',
        before: 'The program was written, but there was no landing page, no quiz, no payment flow, no email setup and no onboarding.',
        after: 'A landing page with a scored quiz, a personal result for every visitor, and an email sequence that runs the program from payment to feedback.',
        users: 'Program owner · visitors · members',
      },
      roles: [
        { name: 'Visitor', access: 'Takes the quiz on the landing page, sees their result, and gets a guide written for their type.' },
        { name: 'Member', access: 'Pays, fills in the intake form, and receives every resource, reminder, recap and recording on time.' },
        { name: 'Program owner', access: 'Runs the sessions while subscribers are grouped by type and the emails send themselves.' },
      ],
      stops: [
        {
          node: 'Landing page',
          detail: 'copy · structure · FAQs',
          title: 'One page, quiz built in.',
          body: 'We wrote the copy, structure and FAQs, built the page and moved it onto the existing site. The quiz sits on the same page, so nobody is sent somewhere else to start.',
          guard: 'One step: the quiz is on the page, not behind another link.',
          side: 'near',
        },
        {
          node: 'Quiz',
          detail: '20 questions · 5 types',
          title: 'A quiz with real scoring.',
          body: 'Twenty questions, five answers each, scored into five result types, with a rule for ties. Every visitor gets an answer that is about them.',
          guard: 'Consistent: the same answers always give the same type.',
          side: 'near',
        },
        {
          node: 'Result',
          detail: 'tagged · personal guide',
          title: 'A result that keeps talking.',
          body: 'The visitor sees their result on screen, joins the email list tagged with their type, and receives a guide written for that type plus a gift eBook. A missing type sends a fallback email and an alert.',
          guard: 'Segmented: each type only receives what was written for it.',
          side: 'near',
        },
        {
          node: 'Payment',
          detail: 'confirmation → sequence',
          title: 'Payment starts everything.',
          body: 'A confirmed payment starts the sign up sequence. Visitors who took the quiz but did not join get one gentle follow up, and a waitlist opens once intake closes.',
          guard: 'Triggered: only a confirmed payment starts onboarding.',
          side: 'far',
        },
        {
          node: 'Onboarding',
          detail: 'intake · resource pack',
          title: 'Ready before session one.',
          body: 'Confirmation, the intake form and the resource pack go out in order within the first hours, followed by reminders three days and one hour before each session.',
          guard: 'Timed: every member gets the same start, in the same order.',
          side: 'far',
        },
        {
          node: 'Delivery',
          detail: 'recaps → feedback',
          title: 'Delivered to the last session.',
          body: 'After each session a recap and recording go out, with a different email for anyone who missed it. A mid program check in, a completion email and a feedback form close the program.',
          guard: 'Covered: missed sessions get their own email, not silence.',
          side: 'far',
        },
      ],
      map: { shape: 'rows', near: 'Before they join', far: 'After they pay', caption: 'From first click to feedback', note: 'Each email goes only to the people it was written for.' },
      features: [
        'Five personal result guides and a gift eBook',
        'A workbook and slide deck for the program',
        'Program content rewritten where it needed it',
        'Email platform setup with subscriber groups by type',
        'Intake and feedback forms',
        'A GDPR check across the funnel',
      ],
      result: 'The program can now be sold, joined and delivered without the owner sending a single email by hand, and the whole setup stays theirs to run.',
    },
    {
      id: 'membership',
      group: 'automation',
      visual: 'path',
      title: 'A complete membership system, built from the ground up.',
      walk: 'How a member joins and stays',
      lede: 'A growing business needed a steadier model and a system to run it. We designed the membership and built the whole system behind it: the strategy and numbers, the site members sign up through, the workspace the team runs it from, the emails and payments, and every step from the first sign up to the welcome, so nothing depends on the founders doing it by hand.',
      card: {
        name: 'Membership system',
        kind: 'Strategy and membership system',
        area: 'Model · sign up · workspace · emails · payments · contracts',
        before: 'Income rose and fell with each sale, there were no systems behind the business, and nearly every step was done by hand.',
        after: 'A complete membership system: the model and positioning, sign up and applications, a team workspace, emails, payments, onboarding and the contracts behind it.',
        users: 'Founders · team · members',
      },
      roles: [
        { name: 'Founders', access: 'Have a membership model, positioning, financial projections and a clear split of who owns what.' },
        { name: 'Team', access: 'Reviews applications, interviews and approves members from one workspace instead of scattered forms and chats.' },
        { name: 'Member', access: 'Joins the waitlist on the website, applies, pays once approved, and is welcomed in the same way as everyone else.' },
      ],
      stops: [
        {
          node: 'Waitlist',
          detail: 'on the website',
          title: 'Interest is captured, not lost.',
          body: 'A prospective member joins the waitlist on the website instead of sending a message, so every lead is recorded from the first moment.',
          guard: 'Captured: every interested person lands in one list.',
          side: 'near',
        },
        {
          node: 'Application',
          detail: 'intro email · form',
          title: 'Everyone gets the same start.',
          body: 'An intro email explains how membership works and links to the application form, so each applicant hears the same thing and nobody is answered from memory.',
          guard: 'Consistent: one process, explained the same way to everyone.',
          side: 'near',
        },
        {
          node: 'Tracking',
          detail: 'one workspace',
          title: 'One place to manage applicants.',
          body: 'Applications feed one workspace where the team updates each one, rather than tracking people across inboxes and chats.',
          guard: 'Visible: the team sees every applicant’s stage at once.',
          side: 'near',
        },
        {
          node: 'Interview',
          detail: 'reviewed · approved',
          title: 'Members are chosen, not just accepted.',
          body: 'The team speaks with each applicant and approves the ones who fit, so the membership is built on who is in it, not only on who paid.',
          guard: 'Curated: nobody joins without an approval.',
          side: 'far',
        },
        {
          node: 'Payment',
          detail: 'approval email · link',
          title: 'Approval comes with a way to pay.',
          body: 'An approval email goes out with the payment link, so an approved applicant can join straight away instead of waiting for an invoice.',
          guard: 'Ordered: the payment link only follows an approval.',
          side: 'far',
        },
        {
          node: 'Welcome',
          detail: 'welcome pack',
          title: 'A welcome that starts the relationship.',
          body: 'A welcome pack goes out and the new member is introduced to everyone else, so joining feels like arriving rather than receiving a receipt.',
          guard: 'Planned: every member is welcomed the same way.',
          side: 'far',
        },
      ],
      map: { shape: 'rows', near: 'Applying', far: 'Joining', caption: 'Waitlist to member', note: 'Only approved applicants ever receive a payment link.' },
      features: [
        'Membership model and financial projections',
        'Market research and brand positioning',
        'The member sign up site, with the waitlist built in',
        'Email accounts, email platform and member emails set up',
        'Team roles and a clear division of responsibility',
        'Contracts written and reviewed',
      ],
      result: 'The business runs on a membership system instead of one sale at a time: members come in, are approved, pay and are welcomed the same way every time, with a model to grow on and contracts it can rely on.',
    },
    {
      id: 'website-journey',
      group: 'websites',
      visual: 'journey',
      title: 'Websites people experience, not just visit.',
      walk: 'How a visit unfolds',
      lede: 'For makers, artisans, artists and brands, the work sells when people can feel it: the detail, the story, how it is made. We design the whole online experience around what a visitor came to do, whether that is to look closely, walk through, order, buy or commission, and tell the story as they scroll.',
      card: {
        name: 'From first look to first order',
        kind: 'Online user experience',
        area: 'Story · close looks · the facts · ordering · found by AI',
        before: 'Work that sells in person, where the detail and the story do the selling, but online only a flat page and a contact form.',
        after: 'Sites built around what visitors come to do: look closely, walk through, order, buy or commission, told as a story in the scroll and structured so people and AI can find them.',
        users: 'Visitors and buyers · the owner · search engines and AI assistants',
      },
      roles: [
        { name: 'Visitor', access: 'Follows the story as they scroll, looks at each piece up close, finds the facts they need, and orders, reserves or enquires on the page.' },
        { name: 'Owner', access: 'Has a site built around how the work is actually sold, easy to keep current as new pieces and collections arrive.' },
        { name: 'Search and AI assistants', access: 'Read fast, structured pages, so the work can be found and recommended when people ask.' },
      ],
      stops: [
        {
          node: 'Mapped',
          detail: 'who visits · what for',
          title: 'Mapped before it is designed.',
          body: 'We start with who visits and what they came to do: see a collection, order a meal, view an original, walk through a project. Every page is then built for that job, not for a template.',
          guard: 'Purposeful: every page has one job for the visitor.',
          side: 'near',
        },
        {
          node: 'The story',
          detail: 'scroll · motion',
          title: 'The story told as they scroll.',
          body: 'Motion with a reason: a product turning as you read, light moving from day to night across a building, the heat of a kitchen rising down the page. The brand’s story carries the visitor from the first screen to the work.',
          guard: 'Purposeful motion: it explains, it never just decorates.',
          side: 'near',
        },
        {
          node: 'Close look',
          detail: 'pieces · walkthroughs',
          title: 'The work, up close.',
          body: 'Each piece opens to be looked at properly. Collections show what sets each line apart, and spaces can be walked through in 360°, so the visitor gets as close to the work as they would in person.',
          guard: 'Close: nothing important is a thumbnail.',
          side: 'near',
        },
        {
          node: 'The facts',
          detail: 'sizes · prices · availability',
          title: 'Everything a buyer needs to decide.',
          body: 'Sizes, prices and availability on each original; the ingredients and flavours of each product; the credentials behind the practice. The answers sit beside the work, so nobody has to ask first.',
          guard: 'Clear: the facts are on the page, not behind a message.',
          side: 'far',
        },
        {
          node: 'Act',
          detail: 'order · reserve · commission',
          title: 'The next step on the page itself.',
          body: 'Build your own order, reserve a table, buy an original or commission a new one, add a bundle to a cart that applies its own discount, or enquire about corporate gifting, without leaving the page.',
          guard: 'Direct: the step a visitor wants is one tap away.',
          side: 'far',
        },
        {
          node: 'Found',
          detail: 'fast · structured',
          title: 'Fast, and found.',
          body: 'Every site loads quickly on a phone and is structured so search engines and AI assistants like ChatGPT and Gemini can read what the business does and recommend it.',
          guard: 'Readable: by people and by the machines that point people to it.',
          side: 'far',
        },
      ],
      map: { shape: 'rows', near: 'Drawn into the work', far: 'Ready to buy', caption: 'From a first look to a first order', note: 'Each site is built around what its visitors came to do.' },
      features: [
        'Visitor mapping before any page is designed',
        'Scroll driven storytelling, animated with purpose',
        'Pieces that open to be looked at closely, and 360° walkthroughs',
        'Sizes, prices and availability beside the work',
        'Live ordering, reservations, buy and commission flows',
        'A cart that applies bundle discounts on its own, and corporate gifting',
        'Fast on a phone, structured for search and AI',
      ],
      result: 'The website stops being a brochure and becomes the place the work is experienced and bought: a story to follow, the detail up close, the facts to decide, and the next step right there.',
    },
  ],
  discoverability: {
    id: 'ai-client-engine',
    name: 'AI discoverability',
    kind: 'Being found by AI',
    sector: 'Coaches, clinics and professional practices',
    before: 'People now ask ChatGPT and Gemini who to call. These businesses were not the answer, and enquiries in DMs went unanswered.',
    after: 'Your business found and recommended when people ask ChatGPT, Gemini or Google, with your own assistant on Instagram and WhatsApp booking the calls. Live in 5 working days.',
    users: 'Practice owners · their clients',
    sources: ['ChatGPT', 'Gemini', 'WhatsApp · Instagram'],
    hub: 'Landing page',
    destination: 'Booking',
    url: 'https://ai.clauseandcode.com/',
    action: 'See the full details',
  },
  close: {
    label: 'Your turn',
    heading: 'Let’s find what to build first.',
    body: 'A team of agents, being found by AI, or a system your business has outgrown: we map how the work moves first, then build it, and we don’t compromise on security.',
    action: 'Book a consultation',
    quiz: 'Not sure where to start?',
  },
}
