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
    slug: 'what-an-ai-agent-does-in-a-small-business',
    title: 'What an AI agent actually does in a small business, and what it shouldn’t',
    description:
      'What an AI agent really does in a small business: one job each, working as a team, with anything that matters waiting for you to approve it. And where to stop.',
    excerpt: 'One job each, a team that reports to you, and a clear line on what never goes out without your yes.',
    date: '2026-11-04',
    minutes: 4,
    topic: 'AI agents',
    draft: true,
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
    slug: 'get-found-by-chatgpt',
    title: 'How to get your business found by ChatGPT',
    description: 'People now ask AI who to call. What it reads, what it trusts, and what you can change this week.',
    excerpt: 'People now ask AI who to call. What it reads, what it trusts, and what you can change this week.',
    date: '2026-10-21',
    minutes: 6,
    topic: 'AI discoverability',
    draft: true,
    placeholder: true,
    body: [{ type: 'p', text: 'Placeholder. This post has not been written yet.' }],
  },
  {
    slug: 'when-to-move-off-spreadsheets',
    title: 'One spreadsheet too many: when it’s time for a real system',
    description: 'The signs your business has outgrown the sheet, and what to keep when you move off it.',
    excerpt: 'The signs your business has outgrown the sheet, and what to keep when you move off it.',
    date: '2026-10-14',
    minutes: 5,
    topic: 'Custom systems',
    draft: true,
    placeholder: true,
    body: [{ type: 'p', text: 'Placeholder. This post has not been written yet.' }],
  },
  {
    slug: 'map-before-you-automate',
    title: 'What to map before you automate anything',
    description: 'Automating a messy process just makes the mess faster. The five questions we ask first.',
    excerpt: 'Automating a messy process just makes the mess faster. The five questions we ask first.',
    date: '2026-10-07',
    minutes: 4,
    topic: 'Custom systems',
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
  {
    slug: 'questions-before-an-ai-agent',
    title: 'Five questions to ask before you hire an AI agent',
    description: 'What it will do, what it won’t, who checks it, and how you’ll know it’s working.',
    excerpt: 'What it will do, what it won’t, who checks it, and how you’ll know it’s working.',
    date: '2026-09-23',
    minutes: 5,
    topic: 'AI agents',
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
  heading: 'Notes from',
  emphasis: 'the work.',
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
    heading: 'Notes from',
    emphasis: 'the work.',
    action: 'See all posts',
  },
}
