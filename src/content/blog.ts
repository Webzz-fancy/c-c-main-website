import type { Glyph } from '../components/complex/AgentLab'

/**
 * The blog: every post lives here, newest first once sorted. The pages, the
 * home page strip, the crawler copy, the sitemap and llms.txt all read from
 * this one list.
 *
 * Publishing a post: write it below, keep `draft: true` while it is being
 * reviewed (drafts show on the local preview only, never on the live site),
 * then remove `draft` to publish. Dates are YYYY-MM-DD.
 *
 * Until the first post is published, /blog stays out of search results and
 * out of the menus. The home page strip appears once there are three.
 */

export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string }
  /** a sentence that leads to one page on the site, closing the post */
  | { type: 'link'; text: string; href: string; label: string }

/** what the blog writes about; each topic has its own robot face */
export const TOPICS = [
  { label: 'AI agents', glyph: 'chat' },
  { label: 'AI discoverability', glyph: 'eyes' },
  { label: 'Custom systems', glyph: 'list' },
  { label: 'Small fixes', glyph: 'pen' },
  { label: 'Client experience', glyph: 'heart' },
] as const satisfies readonly { label: string; glyph: Glyph }[]
export type Topic = (typeof TOPICS)[number]['label']
export const glyphFor = (topic: Topic): Glyph => TOPICS.find((t) => t.label === topic)?.glyph ?? 'chat'

export type BlogPost = {
  /** the address: /blog/<slug>, lowercase words joined by hyphens */
  slug: string
  title: string
  /** for search results and link previews, 140 to 160 characters */
  description: string
  /** one or two lines for the blog list and the home page strip */
  excerpt: string
  date: string
  updated?: string
  /** minutes to read */
  minutes: number
  topic: Topic
  draft?: boolean
  /** a layout stand-in with no real text yet; always a draft */
  placeholder?: boolean
  body: BlogBlock[]
}

const ALL: BlogPost[] = [
  {
    slug: 'ai-agent-vs-chatbot',
    title: 'AI Agent vs Chatbot: Which Does a Small Business Need?',
    description:
      'A chatbot answers questions. An AI agent carries a job from start to finish. Here is the real difference, and when a small business only needs a chatbot.',
    excerpt: 'A chatbot answers the message in front of it. An agent takes on a whole job. Here is how to tell which one your business needs, and when the cheap option is enough.',
    date: '2026-11-09',
    minutes: 3,
    topic: 'AI agents',
    body: [
      { type: 'p', text: 'A chatbot answers the message in front of it, and an AI agent takes on a whole job. If your problem is too many repeat questions, a chatbot is probably enough. If your problem is the work that comes after the question, you may need an agent.' },
      { type: 'h2', text: 'What each one actually does' },
      { type: 'p', text: 'Picture a salon. A customer messages after closing asking if you do keratin treatments and what time you close on Saturday. A chatbot reads your price list and opening hours and replies. Then the conversation ends. Nothing else in your business changes.' },
      { type: 'p', text: 'Now picture a training institute. Someone asks about a course. An agent answers, checks which batch has seats, records the person in your enquiry list, drafts a follow up for three days later, and puts that draft in front of you to approve. It did several steps, across several tools, without someone telling it each one.' },
      { type: 'p', text: 'That is the test. A chatbot talks. An agent talks and then does the next thing.' },
      { type: 'h2', text: 'When a plain chatbot is enough' },
      { type: 'p', text: 'You do not need an agent if most of these are true:' },
      { type: 'list', items: ['The same few questions make up most of your messages: prices, hours, location, what to bring.', 'The answers rarely change and fit on one page.', 'Once the question is answered, nothing else has to happen, or a person is happy to take it from there.', 'You get a modest number of messages, and nobody is losing work because of the wait.'] },
      { type: 'p', text: 'A small clinic that keeps getting asked about parking and opening hours should buy a cheap off the shelf tool, or use the saved quick replies and away messages already in the WhatsApp Business app, and stop there. Paying for more would be a waste.' },
      { type: 'h2', text: 'When small businesses need an agent' },
      { type: 'p', text: 'Look at what happens after the message. A trading company gets a request for a quote. Someone has to check stock, work out the price, write the quote, send it, and chase it a week later. Answering was the easy part. The chasing is what gets forgotten when the team is busy.' },
      { type: 'p', text: 'An agent suits work that has clear steps, happens often, and touches more than one tool. If your process lives in one person’s head and changes every time, write it down first. An agent cannot follow steps nobody can describe.' },
      { type: 'h2', text: 'The limits of both' },
      { type: 'p', text: 'Both can be confidently wrong. In 2024, a tribunal in British Columbia held Air Canada responsible after its website chatbot gave a passenger wrong information about a bereavement fare. The airline argued the chatbot was responsible for itself. That argument failed. Assume whatever your bot says is you saying it.' },
      { type: 'p', text: 'Agents raise the stakes, because they can act as well as speak. So set a rule before you switch one on: research, drafts and internal notes can run alone, but anything going to a customer, or involving money or a promise, waits for a person. Agents also take more work to set up and need someone watching them.' },
      { type: 'h2', text: 'How to decide this week' },
      { type: 'p', text: 'Read your last 30 customer messages. Mark each one as answered and done, or answered and then more work. Mostly done means a chatbot. Mostly more work means you have found the job an agent should take first.' },
      { type: 'p', text: 'Clause & Code maps how that work moves, then builds agents around your tools and rules, with anything for a client waiting for your yes.' },
      { type: 'link', text: 'If the work after the message is your problem, see what an agent could take on in', href: '/ai-agents', label: 'AI agents for small businesses' },
    ],
  },
  {
    slug: 'how-much-does-an-ai-agent-cost',
    title: 'How Much Does an AI Agent Cost? What Drives the Price',
    description:
      'How much does an AI agent cost? What really sets the price: the build, running costs, tool connections and upkeep, plus what a cheap quote leaves out.',
    excerpt: 'Why published prices for AI agents vary so widely, what really drives the bill, and the questions that get you an honest quote.',
    date: '2026-11-09',
    minutes: 3,
    topic: 'AI agents',
    body: [
      { type: 'p', text: 'How much an AI agent costs depends on four things: the build, the running costs, the connections to your tools, and the upkeep. Companies that sell builds publish figures from about $15,000 to over $500,000, so there is no fair single price.' },
      { type: 'p', text: 'So treat any number you read as marketing, and learn what you are paying for.' },
      { type: 'h2', text: 'What drives AI agent development cost' },
      { type: 'p', text: 'An AI agent is software that takes on a whole job, such as reading an enquiry, checking a calendar and drafting a reply. The first cost is building it. One agent with one job costs far less than several working together.' },
      { type: 'p', text: 'Risk adds cost too. A clinic agent that drafts appointment reminders is small. One that touches patient notes needs far more rules and testing.' },
      { type: 'p', text: 'Then come the connections to your tools. A trading company with a modern accounting app is one job. The same company with orders spread across old spreadsheets is a much bigger one, because someone has to clean that data first.' },
      { type: 'h2', text: 'The costs that keep coming' },
      { type: 'p', text: 'An agent rents its intelligence from an AI model, and companies like OpenAI and Anthropic charge by the token, which is a small piece of text. On their public price lists, the dearest model costs at least 100 times as much as the cheapest for the same text.' },
      { type: 'p', text: 'Agents also take several steps per job, and each step is paid for. A training institute handling a few enquiries a day and one handling hundreds will get very different bills.' },
      { type: 'p', text: 'The agent also needs somewhere to run and keep its records, which is hosting. And it needs upkeep. Models change, your tools update, your prices move. Someone has to test and adjust it, or it slowly drifts out of date.' },
      { type: 'h2', text: 'Questions that get an honest quote' },
      { type: 'list', items: ['What exact job will it do, and what will it never do?', 'Which of our tools does it connect to, and is that in the price?', 'Who pays the monthly model and hosting bills, and what is your estimate at our real volume?', 'Who checks its work before a client sees it?', 'What does upkeep cost after launch, and what does that cover?', 'If we leave, what do we keep?'] },
      { type: 'h2', text: 'What a suspiciously cheap quote leaves out' },
      { type: 'p', text: 'A very low price often buys a demo. It works on a tidy example, then meets your real messages and misspelled names. Usually missing are testing on real work, monthly running costs, an approval step before anything goes out, a record of what it did, and anyone to fix it later.' },
      { type: 'p', text: 'In June 2025, the research firm Gartner predicted that over 40 percent of AI agent projects would be cancelled by the end of 2027, over rising costs, unclear value or weak risk controls. It also warned that many vendors relabel plain chatbots as agents.' },
      { type: 'h2', text: 'When you do not need one' },
      { type: 'p', text: 'If a salon only wants appointment reminders, the reminders in its booking app may be enough. A cheap tool that does the job beats a custom agent that does it slightly better.' },
      { type: 'p', text: 'Before asking anyone for a quote, write down the one job, how often it happens, which tools it touches, and what a mistake would cost you. If the job is small and rare, stop there.' },
      { type: 'p', text: 'Clause & Code maps how your work moves first, builds agents around your tools and rules, tests them beside your team and keeps them running.' },
      { type: 'link', text: 'To see which jobs an agent could take on and what stays with your team, read about', href: '/ai-agents', label: 'custom AI agents' },
    ],
  },
  {
    slug: 'workflow-automation-vs-ai-agents',
    title: 'Workflow Automation vs AI Agents: Which Do You Need?',
    description:
      'Workflow automation follows fixed rules. AI agents handle the reading and judgement. See everyday examples, how they combine, and when AI is unnecessary.',
    excerpt: 'Automation follows fixed rules. AI handles the parts that need reading or judgement. Here is how to tell which your work needs, and when AI is a waste of money.',
    date: '2026-11-09',
    minutes: 3,
    topic: 'AI agents',
    body: [
      { type: 'p', text: 'Workflow automation follows fixed rules you set in advance, and AI agents handle the parts that need reading or judgement. Start with automation, and add AI only to the steps that truly need it.' },
      { type: 'h2', text: 'The difference in plain words' },
      { type: 'p', text: 'An automation is a recipe. When this happens, do that. Zapier is a well known example: one event, like a new email, sets off one or more actions, like sending a text.' },
      { type: 'p', text: 'An AI agent is more like a new assistant. You give it a job and some tools, and it works out the steps itself. It can read a messy message and decide what it means. That freedom is the point, and also the risk.' },
      { type: 'h2', text: 'Side by side examples' },
      { type: 'list', items: ['Clinic. Automation sends every patient a reminder the day before an appointment. AI reads a long patient message and works out whether they want to rebook, have a billing question or need a call back.', 'Salon. Automation asks for a review the day after a visit. AI reads the reviews that come in and drafts a reply that fits what each person said.', 'Trading company. Automation reminds sales when a quote has had no answer for three days. AI reads an order a buyer typed into an email and pulls out the products and quantities.'] },
      { type: 'p', text: 'If what comes in looks the same every time, use a rule. If a person would have to read it to understand it, AI can help.' },
      { type: 'h2', text: 'AI workflow automation: how the two work together' },
      { type: 'p', text: 'Often the answer is both, in a chain. Here is a new enquiry, step by step:' },
      { type: 'list', items: ['An email arrives, and automation creates a record.', 'AI reads it and drafts a summary and a reply.', 'A person checks the draft and approves it.', 'Automation sends it, files it and sets a follow up reminder.'] },
      { type: 'p', text: 'Rules carry the work between steps. AI touches only the step that needs reading. A person keeps the decision.' },
      { type: 'h2', text: 'When plain automation is cheaper and safer' },
      { type: 'p', text: 'If a step has clear rules, you do not need AI. Adding it brings real costs.' },
      { type: 'list', items: ['Money. AI is usually billed by how much text it reads and writes, and agents that work through many steps generally cost more and run slower.', 'Predictability. A rule gives the same result every time. An agent may take a different path on the same job.', 'Mistakes. AI can state something false and sound completely sure, a risk the US standards agency NIST describes in its guidance.'] },
      { type: 'p', text: 'So keep AI away from adding up an invoice, checking whether a payment arrived or sending a reminder on a set date. A spreadsheet formula or a simple off the shelf tool is enough. Anthropic, which builds AI models, gives the same advice to developers: find the simplest solution, and sometimes do not build an agent at all.' },
      { type: 'h2', text: 'Try it on one job' },
      { type: 'p', text: 'Pick one job your team repeats. Write every step on one page, then mark each one:' },
      { type: 'list', items: ['Same every time: automate it with a rule.', 'Needs reading or sorting: try AI, and check its work.', 'Involves money, a promise or a client: keep a person in charge.'] },
      { type: 'p', text: 'If the steps turn out to be a mess, fix that first.' },
      { type: 'p', text: 'That page of steps is also where Clause & Code starts: we map how the work really moves, then use rules for the routine and AI for the messy parts.' },
      { type: 'link', text: 'To see how that looks on real processes, read about our', href: '/workflow-automation', label: 'workflow automation work' },
    ],
  },
  {
    slug: 'what-to-automate-first',
    title: 'What Business Processes Should Be Automated First?',
    description:
      'Automate first the work that repeats often, follows the same steps, eats hours and has mistakes that are cheap to catch. Here is a simple way to choose.',
    excerpt: 'A simple four question test for choosing your first automation, good examples to start with, and what to leave alone for now.',
    date: '2026-11-09',
    minutes: 3,
    topic: 'Small fixes',
    body: [
      { type: 'p', text: 'The business processes to automate first are the ones that repeat often, follow the same steps every time, eat up hours, and have mistakes that are cheap to catch. Pick one small job that passes all four tests, like appointment reminders, and leave everything else alone until that one works.' },
      { type: 'p', text: 'Good business automation starts small and boring.' },
      { type: 'h2', text: 'A simple four question test' },
      { type: 'p', text: 'Take one job your team did this week and ask:' },
      { type: 'list', items: ['Does it repeat often? Daily or weekly is good. Twice a year is not worth the effort.', 'Are the steps the same each time? If you can write it as "when this happens, do that", a computer can follow it.', 'Does it eat hours? Add up the time across everyone who touches it. Ten minutes every working day is about 40 hours a year.', 'Are mistakes cheap to catch? If something goes wrong, can a person spot it and fix it in a minute?'] },
      { type: 'p', text: 'Four yeses means start there. If the last answer is no, stop, even if the other three are yes.' },
      { type: 'h2', text: 'Business process automation examples that make good first projects' },
      { type: 'list', items: ['A clinic: the day before each appointment, a reminder goes to the patient.', 'A salon: after each visit, a thank you message goes out with a link to book again.', 'A trading company: when an order is marked approved, the next person is assigned and told.', 'A training institute: when someone signs up, they get a welcome email with the timetable, and their name lands on the class list.', 'Almost any business: details from the website enquiry form go straight into your customer list instead of being typed in by hand.'] },
      { type: 'p', text: 'Many of these need no custom build. Check the software you already pay for, because reminders or welcome emails may be sitting in a settings page. A tool like Zapier, which connects your apps on a "when this happens, do that" basis, is often enough. If that does the job, stop there.' },
      { type: 'h2', text: 'What not to automate yet' },
      { type: 'list', items: ['Work you are still figuring out, like a new service whose steps change every month.', 'Judgement calls, like whether to refund an upset client or who to hire.', 'Anything expensive or hard to undo, like paying suppliers or running payroll. A computer can prepare it, but a person should approve it.', 'Jobs that should not exist. If nobody reads the weekly report, stop making it.'] },
      { type: 'h2', text: 'Write down how the work runs today first' },
      { type: 'p', text: 'Automating a messy process just makes the mess faster. If orders sometimes get entered twice today, an automation can enter them twice all day, and nobody will be looking.' },
      { type: 'p', text: 'So before you build anything, write down what really happens, not what is supposed to happen. Sit with the person who does the job and follow one real example from start to finish. For each step, note who does it, which tool they use, and where the work waits.' },
      { type: 'p', text: 'You will probably find surprises: a step only one person knows about, an approval nobody needs, or three people keeping their own copy of the same spreadsheet. Fix or delete those first. Sometimes that is the whole fix, and you need no automation at all.' },
      { type: 'p', text: 'Then automate one step, and have a person check the results until you trust it.' },
      { type: 'p', text: 'Clause & Code works this way too: we map the work with your team, then automate the handoffs, reminders and emails.' },
      { type: 'link', text: 'To see what that looks like, read about', href: '/workflow-automation', label: 'workflow automation that starts with a map' },
    ],
  },
  {
    slug: 'custom-crm-or-off-the-shelf',
    title: 'Custom CRM or Off the Shelf: How to Decide',
    description:
      'Most small businesses should start with an off the shelf CRM. Here are the signs a custom CRM is worth it, and what to keep when moving off spreadsheets.',
    excerpt: 'Most small businesses should buy a CRM, not build one. Here is how to spot the point where that stops being true.',
    date: '2026-11-09',
    minutes: 3,
    topic: 'Custom systems',
    body: [
      { type: 'p', text: 'Most small businesses should start with an off the shelf CRM, and many never need anything else. A custom CRM is worth paying for only when your work truly does not fit the tool and that misfit costs you time every week.' },
      { type: 'p', text: 'A CRM is simply one place that holds your customers and where each one stands. A salon or a small clinic usually needs names, notes and follow ups. A ready made tool does that, and you can try it before you commit. HubSpot, for example, has a free plan for up to two users.' },
      { type: 'h2', text: 'Why buying comes first' },
      { type: 'p', text: 'With a bought tool, you start quickly, someone else fixes the bugs, and you can leave if it is wrong. A custom system costs real money up front, takes time to build, and needs looking after for as long as you use it.' },
      { type: 'p', text: 'Even if you go custom later, time on a cheap tool teaches you exactly what you need. If your process still changes every month, wait.' },
      { type: 'h2', text: 'Signs a custom CRM is worth it' },
      { type: 'list', items: ['The work does not fit the tool. A training institute follows a student through a placement test, a class, attendance and fees. A sales pipeline has no natural home for that.', 'Staff live in a spreadsheet. The CRM gets updated because the boss asks, while the real work happens in the sheet.', 'You pay for many seats or add ons. Paid plans such as HubSpot’s charge per seat, meaning per person. If twenty people each need one screen, compare the yearly bill with building and maintaining your own.', 'Your tools do not talk to each other. A trading company takes enquiries on WhatsApp, quotes in Excel and invoices in accounting software, and someone types the same customer in three times.'] },
      { type: 'p', text: 'One sign alone is rarely enough. Try cheap fixes first: change the tool’s settings or connect two apps with something like Zapier. If two or more signs still show up every week, a custom build is worth pricing.' },
      { type: 'h2', text: 'When to move off spreadsheets, and what to keep' },
      { type: 'p', text: 'A spreadsheet is fine while one or two people use it and nothing slips. Move when people overwrite each other, follow ups get missed, or the monthly numbers have to be rebuilt by hand. Whatever you move to, keep these:' },
      { type: 'list', items: ['Customer history: past notes, dates and amounts.', 'The columns people really use. Ask what the colours mean too. Yellow is often a status nobody ever wrote down.', 'The rules hidden in formulas, like a discount or a commission. Write them out in plain words.', 'The reports people rely on. Check the new system gives the same numbers.', 'The original file, saved somewhere safe and left untouched.'] },
      { type: 'p', text: 'Test with twenty real customers before moving the rest. Then set a date to retire the old sheet, or people will carry on with it. Before signing up, check you can get your data back out.' },
      { type: 'h2', text: 'A test you can do this week' },
      { type: 'p', text: 'Write down every step a customer goes through, from first message to final payment. Mark which ones your tool handles. If most are handled, keep the tool and fix the rest. If most happen elsewhere, you have a real case for building.' },
      { type: 'p', text: 'Clause & Code builds custom systems, and each one starts with a map of how the work actually moves. If you are unsure, tell us how things run today and we will tell you which we would do.' },
      { type: 'link', text: 'To see what a custom system can take over, visit our', href: '/custom-business-systems', label: 'custom business systems page' },
    ],
  },
  {
    slug: 'instagram-dm-booking',
    title: 'Instagram DM Booking: 3 Ways to Automate It',
    description:
      'How to take bookings in Instagram DMs automatically: three options from a booking link to a calendar assistant, and the 24 hour rule that limits them all.',
    excerpt: 'Three ways to take bookings in Instagram DMs automatically, what each can and cannot do, and the messaging rules that apply to all of them.',
    date: '2026-11-09',
    minutes: 3,
    topic: 'Client experience',
    body: [
      { type: 'p', text: 'You can take bookings in Instagram DMs automatically in three ways: an automatic reply with a booking link, a DM automation tool, or an assistant connected to your calendar. Start with the simplest one that stops clients waiting, because each step up takes more work to set up and look after.' },
      { type: 'h2', text: 'The rules for automated booking on Instagram' },
      { type: 'p', text: 'Meta’s rules apply to all three options.' },
      { type: 'list', items: ['You need a professional account, which means a business or creator account.', 'The client has to contact you first. Software cannot message someone out of the blue.', 'After most client actions you have 24 hours to reply. If someone first messages you after tapping an ad that opens a DM, that window can last up to 7 days.', 'A real staff member can get 7 days to reply, using a human agent tag if your software supports it. Automated messages cannot use it.', 'Where the law requires it, a bot must say it is a bot at the start of the chat. Meta suggests doing this anyway.'] },
      { type: 'h2', text: 'Option 1: a booking link and automatic answers' },
      { type: 'p', text: 'Instagram lets a business add a Book button to its profile through partner booking tools such as Fresha, Vagaro and Acuity. In your message tools you can also set up to four frequently asked questions with automatic replies. Make one of them "How do I book?" and put your link in the reply.' },
      { type: 'p', text: 'A salon client taps the question at midnight, gets the link and picks a slot. For many small businesses, this is enough. But it cannot understand a typed message like "Can you fit me in Thursday after work?", and the client leaves the chat to book. You only need a booking tool account and your four answers.' },
      { type: 'h2', text: 'Option 2: a DM automation tool' },
      { type: 'p', text: 'These tools connect to your account and run a scripted chat. A client taps Book, then a service, and gets the right link. A clinic could send skin patients and dental patients to different diaries, and collect a name and phone number on the way.' },
      { type: 'p', text: 'The limit is the script. Anything unexpected needs a person, and unless the tool is linked to your diary, it does not know which slots are free. To set one up, give the tool access to your messages, write each path, and name who takes over. Ask whether it uses Meta’s official messaging connection.' },
      { type: 'h2', text: 'Option 3: an assistant connected to your calendar' },
      { type: 'p', text: 'This reads normal sentences, checks your live diary and books inside the chat. A client writes at 10pm, "Any time Thursday for a cut and colour?" The assistant checks how long that takes, offers two open slots, books the one they pick and confirms it.' },
      { type: 'p', text: 'It is also the most work. It needs a booking system other software can connect to, your services with their lengths, your staff, your deposit and cancellation rules, and proper testing. It only knows what you tell it. A clinic should pass anything medical straight to staff. If you get a handful of DMs a day, you do not need this.' },
      { type: 'h2', text: 'The catch with reminders' },
      { type: 'p', text: 'The 24 hour window trips people up. Someone books on Monday for Friday. By Thursday, your software cannot DM them unless they have messaged you again. So collect a phone number or email when they book, and send reminders from your booking system by text or email.' },
      { type: 'p', text: 'Clause & Code builds assistants like this for clinics and salons, with anything medical left to your staff.' },
      { type: 'link', text: 'To see what it handles and how it is set up, read about our', href: '/ai-booking-assistant', label: 'AI booking assistant' },
    ],
  },
  {
    slug: 'ai-receptionist-for-clinics-and-salons',
    title: 'AI Receptionist for Clinics and Salons: What It Can Do',
    description:
      'What an AI receptionist can do for a clinic or salon, what must stay with your staff, how the handover should work, and what to ask about client data.',
    excerpt: 'What an AI receptionist handles well, what must stay with your staff, and what to ask about patient and client data before you sign up.',
    date: '2026-11-09',
    minutes: 3,
    topic: 'Client experience',
    body: [
      { type: 'p', text: 'An AI receptionist can answer common questions, book and move appointments, and send reminders for a clinic or salon. It should not give medical advice, handle anything urgent, or deal with an unhappy client on its own.' },
      { type: 'p', text: 'An AI receptionist is software that replies to clients using information you give it. Some work on phone calls. Others work only in messages, such as Instagram and WhatsApp. If most of your bookings come by phone, a tool that only reads messages will not help much.' },
      { type: 'h2', text: 'What it handles well' },
      { type: 'list', items: ['Common questions: hours, location, parking, which services you offer. It answers from what you told it, so keep that information current.', 'Booking: someone messages after closing asking for a Saturday facial, sees the open slots and picks one.', 'Confirming and moving: a patient changes Tuesday to Thursday and the diary updates.', 'Reminders: sent by themselves before each visit, so nobody works through the list by hand.'] },
      { type: 'p', text: 'If you get a handful of messages a day, you probably do not need this. A booking link and a few saved replies may be enough.' },
      { type: 'h2', text: 'What must stay with people' },
      { type: 'list', items: ['Medical advice. "Is this rash normal?" or "Can I take this before my procedure?" goes to clinical staff. The assistant should never guess.', 'Anything urgent. Severe pain, a bad reaction after a treatment, a burn at the salon. The assistant should stop and send a fixed message you wrote in advance, saying who to contact right now.', 'Unhappy clients. Someone upset about a bad colour wants a person who can say sorry and put it right.'] },
      { type: 'h2', text: 'How the handover to staff should work' },
      { type: 'p', text: 'A handover fails when the assistant says "someone will reply" and nobody is told. Agree these points before you go live:' },
      { type: 'list', items: ['Write down what stops the assistant: symptoms, medication, pregnancy, complaints, refunds, or a client asking for a person.', 'Name who gets the alert on each shift, and send it somewhere they will see it.', 'Pass on the whole conversation, so the client never repeats themselves.', 'Tell the client a person is taking over and when to expect a reply, especially at night.', 'Keep the assistant quiet until staff hand the chat back.'] },
      { type: 'p', text: 'Before launch, send it ten awkward messages and see who actually gets told.' },
      { type: 'h2', text: 'What to ask about patient and client data' },
      { type: 'p', text: 'Clinics hold health details, and even a salon’s note about an allergy may count as one. Under the EU’s GDPR, health data gets stricter protection, and a supplier handling personal data for you must work under a written contract. In the United States, a clinic covered by HIPAA, the health privacy law, needs a written agreement with a vendor that handles patient information for it. Other countries have their own rules, so confirm what applies with an adviser in yours.' },
      { type: 'p', text: 'Ask every supplier:' },
      { type: 'list', items: ['Where is our data stored, and which other companies can see it?', 'Is it used to train AI models? Can we refuse in writing?', 'How long are chats kept, and can you delete them on request?', 'Will you sign the contract our country’s law requires?', 'What happens to our data if we leave?'] },
      { type: 'p', text: 'Instagram and WhatsApp are run by an outside company, and WhatsApp’s policy limits health details in chats where the law demands stronger protection. Keep medical history out of those chats, and tell clients plainly they are talking to an assistant.' },
      { type: 'link', text: 'If your bookings arrive on Instagram and WhatsApp, Clause & Code builds an assistant for those messages, though not for phone calls. See what it handles and what stays with your staff on', href: '/ai-booking-assistant', label: 'the AI booking assistant page' },
    ],
  },
  {
    slug: 'add-ai-to-business-whatsapp-uae',
    title: 'How to Add AI to Your Business WhatsApp in the UAE',
    description:
      'How to add AI to your business WhatsApp in the UAE: the app versus the API, what you need, what Meta allows, and the honest answer on free chatbots.',
    excerpt: 'The WhatsApp Business app versus the API, what you need to start, what Meta allows, and whether a free chatbot is really free.',
    date: '2026-11-09',
    minutes: 3,
    topic: 'AI agents',
    body: [
      { type: 'p', text: 'To add AI to your business WhatsApp, you connect your number to the WhatsApp Business Platform, Meta’s API (a doorway that lets software read and send messages), usually through a provider, then attach an AI to it. If you only get a few messages a day, you probably do not need AI at all.' },
      { type: 'h2', text: 'The WhatsApp Business app or the API?' },
      { type: 'p', text: 'The WhatsApp Business app is free to download. It has greeting messages, away messages and saved quick replies. For a small salon with ten chats a day, that is often enough.' },
      { type: 'p', text: 'Meta also has its own AI for the app, called Meta Business Agent. It is only open to some businesses in some countries, and Meta does not list them or confirm Arabic. If it is not under Tools in your app, you cannot use it yet.' },
      { type: 'p', text: 'The API is for when software must do the work, like checking a clinic’s calendar or a trading company’s orders. It has no screen of its own, so you need a provider or developer.' },
      { type: 'h2', text: 'What you need for the WhatsApp Business API in the UAE' },
      { type: 'list', items: ['A Meta business portfolio, your company’s account with Meta. New accounts can only start chats with 250 people a day, and verifying your business can raise that.', 'A phone number you own that can receive a call or SMS.', 'A plan for your current number. It must be deleted from WhatsApp first, unless your provider offers coexistence, which keeps it on both the app and the API but switches off broadcast lists.', 'A payment method. Meta can bill in dirhams.', 'Your prices, hours, booking rules and most common questions.'] },
      { type: 'h2', text: 'What Meta allows' },
      { type: 'p', text: 'Meta bans AI companies from the platform when the AI is the main thing being offered, like a general chatbot. A salon’s assistant that books appointments is a supporting feature, so as the terms are written, that ban does not cover it.' },
      { type: 'p', text: 'You do have to follow these rules:' },
      { type: 'list', items: ['You need permission before you message someone.', 'Automatic replies are allowed for 24 hours after a customer messages you.', 'After that, or to start a chat, you can only send templates, which are messages Meta approves first.', 'Customers must have a clear way to reach a human.', 'Medical products are restricted, and Meta says not to use WhatsApp for telemedicine or health information where local law demands stronger protection. Clinics should read the policy first.'] },
      { type: 'h2', text: 'Is there a free WhatsApp AI chatbot?' },
      { type: 'p', text: 'For real business use, not really. The free tools in the app are not AI. On the API, Meta changed its pricing on 1 October 2026, so older articles saying replies are free are out of date.' },
      { type: 'p', text: 'Each number now gets 1,000 free service messages a month, meaning replies sent within those 24 hours. After that, Meta charges per message. Template messages are charged too. The UAE has its own rates on Meta’s rate card, so check it before you budget.' },
      { type: 'p', text: 'You will also pay for the AI itself and usually a provider. If a tool says free, ask which of those costs it covers.' },
      { type: 'h2', text: 'Test it in Arabic and in English' },
      { type: 'p', text: 'An assistant that sounds fine in English can get details wrong in Arabic, so test each language on its own. Use real messages from your chats, including mixed Arabic and English, and Arabic typed in English letters. Check every price and time it gives back, and ask a native speaker to read the replies.' },
      { type: 'link', text: 'Clause & Code builds these for clinics and salons on WhatsApp, in English and Arabic, and you can see what one handles on our', href: '/ai-booking-assistant', label: 'AI booking assistant page' },
    ],
  },
  {
    slug: 'why-your-business-is-not-in-chatgpt',
    title: 'Why Your Business Is Not Showing Up in ChatGPT',
    description:
      'Why your business is not showing up in ChatGPT, what you can check yourself in an afternoon, and what nobody can honestly promise to fix for you.',
    excerpt: 'Nobody can make ChatGPT name your business. But you can check whether it is able to read your site, and whether anyone else talks about you.',
    date: '2026-11-09',
    minutes: 3,
    topic: 'AI discoverability',
    body: [
      { type: 'p', text: 'Your business may not be showing up in ChatGPT because its crawler cannot read your site, or because little on the web says clearly what you do. You can check both, but nobody can make an assistant name your business.' },
      { type: 'p', text: 'OpenAI says placement is not guaranteed. Answers also shift from one run to the next. In a January 2026 SparkToro study, asking the same question 100 times almost never gave the same list of brands twice. So one missing answer proves very little.' },
      { type: 'h2', text: 'How ChatGPT finds a business' },
      { type: 'p', text: 'When a question needs current information, ChatGPT may search the web. It turns the question into a few targeted searches, reads the results and links its sources.' },
      { type: 'p', text: 'OpenAI runs separate crawlers, which are programs that read websites. One feeds ChatGPT search. Another, GPTBot, collects content that may train its models. Blocking GPTBot does not by itself remove you from search answers.' },
      { type: 'h2', text: 'What to check if ChatGPT doesn’t mention your business' },
      { type: 'list', items: ['Can the crawler get in? Open yoursite.com/robots.txt, a short public file of rules for bots. Look for a block on OpenAI’s search crawler (its name starts with OAI and ends with SearchBot) or a rule blocking all bots. OpenAI says blocked sites are not shown in search answers. Ask your web person to allow it and check your host does too. Changes can take about 24 hours.', 'Is your text in the page itself? Some sites fill in their words using JavaScript, code that runs after the page loads. OpenAI’s crawler page does not say whether its crawlers run that code, so play safe. Right click your page, choose View Page Source and search for your main service. If it is missing, tell your developer.', 'Do you say plainly what you do and for whom? "Family dental clinic in Leeds, open Saturdays" can be matched to a question. "Smiles, redefined" cannot.', 'Are your details the same everywhere? Compare your name, phone, address and hours on your site, Google Business Profile, Instagram and directories. Google says complete and accurate details help in its local results. OpenAI publishes no such rule, but a training institute with two phone numbers confuses everyone.', 'Does anyone else talk about you? Google counts reviews and links when judging how well known a local business is. ChatGPT can only cite what is published, so a salon nobody writes about gives it little to work with. Ask happy customers for honest reviews and look for real mentions, such as a trade association listing or local news.'] },
      { type: 'h2', text: 'Special files are not the fix' },
      { type: 'p', text: 'Someone may offer to add an llms.txt file or special code to your site. Google says you need no new machine readable files or special markup for its AI features, and that Google Search ignores llms.txt. OpenAI’s crawler guide does not ask for one either. Spend the time on the list above instead.' },
      { type: 'h2', text: 'How to test it fairly' },
      { type: 'p', text: 'Ask ChatGPT what a customer would ask, such as "physiotherapist near me for a knee injury". Use a new chat each time and repeat over several days. Note how often you appear and which sources it links, because those are the places worth being mentioned. Then ask about your business by name, and follow the links behind anything wrong.' },
      { type: 'p', text: 'Links from ChatGPT are tagged, so look for chatgpt.com in your website analytics.' },
      { type: 'p', text: 'If customers mostly come from word of mouth, the first and fourth checks may be enough.' },
      { type: 'link', text: 'If you would rather have someone go through this with you, Clause & Code does this work for coaches, clinics and professional practices:', href: 'https://ai.clauseandcode.com/', label: 'AI discoverability at Clause & Code' },
    ],
  },
  {
    slug: 'what-to-ask-an-ai-automation-agency',
    title: 'What to ask an AI automation agency in Dubai before hiring',
    description:
      'Six questions to ask an AI automation agency in Dubai before you hire one, from how it will learn your work to what it would tell you not to automate.',
    excerpt: 'Six questions that separate an agency that maps your work from one selling a bot.',
    date: '2026-11-09',
    minutes: 2,
    topic: 'AI agents',
    body: [
      { type: 'p', text: 'Ask to see how it will learn your business before it talks about tools. These six questions separate an agency that maps your work from one selling a bot.' },
      {
        type: 'list',
        items: [
          'How will you learn how our work actually runs? Look for sitting with your team and tracing the real steps before anything is built.',
          'What will the AI do by itself, and what waits for a person? You want a clear line. Anything sent to a client, or involving money, should wait for a yes.',
          'Where is every action written down? You should be able to see who approved what.',
          'Can we see real work? Client names can stay private. What should be visible is how the process ran before, and what runs now.',
          'What happens after launch? Someone has to test it beside your team, train them and keep it running.',
          'What would you tell us not to automate? An agency with no answer has not thought about your business.',
        ],
      },
      { type: 'p', text: 'One more check if you are hiring in Dubai: ask about language. If your clients write in Arabic and English, the agents and messages have to work in both, so test both before launch.' },
      { type: 'p', text: 'This is how we work at Clause & Code: map first, then build. Book a call and ask us the same six questions.' },
      { type: 'link', text: 'See how we map the work first and build the agents around it.', href: '/ai-agents', label: 'AI agents for your business' },
    ],
  },
  {
    slug: 'what-an-ai-agent-does-in-a-small-business',
    title: 'What an AI agent actually does in a small business, and what it shouldn’t',
    description:
      'What an AI agent really does in a small business: one job each, working as a team, with anything that matters waiting for you to approve it. And where to stop.',
    excerpt: 'One job each, a team that reports to you, and a clear line on what never goes out without your yes.',
    date: '2026-11-04',
    minutes: 4,
    topic: 'AI agents',
    body: [
      { type: 'p', text: 'Most owners we talk to have heard that AI agents can “run the business for you”. That is not what a good one does, and it is not what you want. Here is what an agent actually does in a business your size, and where we draw the line.' },
      { type: 'h2', text: 'One agent, one job' },
      { type: 'p', text: 'An agent is not a general assistant you ask for anything. It does one job, the way you would hand one job to a new hire: answer the enquiries that come in overnight, follow up with the leads who went quiet, or pull the day’s numbers into a report.' },
      { type: 'p', text: 'Keeping each agent to one job is what makes it reliable. It knows your rules for that job, it knows where to find what it needs, and you always know who did what.' },
      { type: 'h2', text: 'A team that reports to you' },
      { type: 'p', text: 'Several agents work as one team. A director agent plans the day and checks what the others produce before it reaches you. You get one place to see what came in, what went out and what is waiting for you.' },
      { type: 'h2', text: 'What never goes out without you' },
      { type: 'list', items: ['Anything sent to a client or the public', 'Anything involving money or a commitment', 'Anything the agent is not sure about'] },
      { type: 'p', text: 'Those wait in a short queue for you or your team to approve, edit or reject. Everything else, the sorting, drafting, chasing and adding up, just gets done. And every job and decision is written down, with who approved it.' },
      { type: 'h2', text: 'Where to start' },
      { type: 'p', text: 'Start with the job that eats the most of your week and follows the same steps every time. For most businesses that is replying to enquiries or following up. We map how that work moves today, build the agent around your tools and rules, and run it beside your team until it is right.' },
      { type: 'quote', text: 'If a checklist would fix it, we’ll tell you. An agent is for the work that is still there after the checklist.' },
      { type: 'link', text: 'See what a team of agents could take off your week.', href: '/ai-agents', label: 'AI agents for your business' },
    ],
  },
  // ---- placeholders: stand-ins for the layout, never published ----
  {
    slug: 'why-follow-ups-slip',
    title: 'Why your follow-ups slip, and the checklist to try before any system',
    description: 'Most lost leads aren’t lost to a competitor. They’re lost to nobody being sure whose turn it was.',
    excerpt: 'Most lost leads aren’t lost to a competitor. They’re lost to nobody being sure whose turn it was.',
    date: '2026-10-28',
    minutes: 5,
    topic: 'Small fixes',
    draft: true,
    placeholder: true,
    body: [{ type: 'p', text: 'Placeholder. This post has not been written yet.' }],
  },
  {
    slug: 'website-like-meeting-you',
    title: 'Your website should feel like meeting you',
    description: 'If people buy from you in person, a flat page loses the part that sells. Here’s how to bring it online.',
    excerpt: 'If people buy from you in person, a flat page loses the part that sells. Here’s how to bring it online.',
    date: '2026-09-30',
    minutes: 4,
    topic: 'Client experience',
    draft: true,
    placeholder: true,
    body: [{ type: 'p', text: 'Placeholder. This post has not been written yet.' }],
  },
]

/** what this build shows: drafts appear on the local preview only */
export const POSTS: BlogPost[] = ALL.filter((post) => !post.draft || import.meta.env.DEV).sort((a, b) =>
  b.date.localeCompare(a.date),
)

/** the blog is in the menus and search once it has a post */
export const BLOG_LIVE = POSTS.length > 0
/** the home page strip needs three, so it never looks thin */
export const BLOG_ON_HOME = POSTS.length >= 3

export const postPath = (post: BlogPost) => `/blog/${post.slug}`
export const postBySlug = (slug: string) => POSTS.find((post) => post.slug === slug)

/** "4 November 2026" */
export function formatDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${d} ${months[m - 1]} ${y}`
}

export const BLOG = {
  label: 'Blog',
  heading: 'The',
  emphasis: 'blog.',
  subheading: 'Notes from the work.',
  intro: 'What we learn mapping and building for real businesses: AI agents, systems, getting found by AI, and the small fixes that come before any of it.',
  empty: 'The first posts are on their way.',
  read: 'Read it',
  back: 'All posts',
  close: {
    heading: 'Want this for your business?',
    body: 'Tell us how things run today, and we’ll tell you honestly what we’d fix first.',
  },
  strip: {
    label: 'From the blog',
    heading: 'The',
    emphasis: 'blog.',
    action: 'See all posts',
  },
}
