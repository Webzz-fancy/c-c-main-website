import { useMemo, useState } from 'react'
import { COMPLEX, type ComplexIndustry, type ComplexNeed } from '../../content/complex'
import { BookButton } from './cta'

/**
 * The hero's search: a visitor types the work they want handled, or taps a
 * task they recognise, and the agents and projects that do something like it
 * come to the front of the list below, with how we would approach it. Naming
 * their kind of business points them to the agents, set up for it. It matches
 * on the page, against words we wrote for each problem: no chat, and no
 * request leaves the browser.
 */

// three agent tasks fit on one line under the search; the rest sit behind "More"
const FIRST = 3

// `need` or `industry` is what matched, if anything did, so the hero map can show it
export type FinderMatch = { ids: string[]; plan: string | null; none: boolean; need: string | null; industry: string | null }

const INDUSTRIES = COMPLEX.agents.industries.items

const NAMES: Record<string, string> = Object.fromEntries([
  ['agents', COMPLEX.index.agents.name],
  ...COMPLEX.projects.map((p) => [p.id, p.card.name]),
  [COMPLEX.discoverability.id, COMPLEX.discoverability.name],
])

// where the answer leads: a named business goes to the agents, set up for it;
// anything else to the work, where the closest matches now lead the slider
const anchor = (match: FinderMatch) => (match.industry ? '#agents' : '#complex-index')

// Everything a project says about itself, for words that no problem lists.
const HAYSTACK: Record<string, string> = Object.fromEntries([
  [
    'agents',
    [COMPLEX.agents.intro, ...COMPLEX.agents.teams.flatMap((t) => [t.name, t.job]), ...INDUSTRIES.flatMap((i) => [...i.clients, ...i.operations])]
      .join(' ')
      .toLowerCase(),
  ],
  ...COMPLEX.projects.map((p) => [
    p.id,
    [p.card.name, p.card.area, p.card.before, p.card.after, p.lede, ...p.stops.flatMap((s) => [s.node, s.title, s.body]), ...p.features]
      .join(' ')
      .toLowerCase(),
  ]),
  [
    COMPLEX.discoverability.id,
    [COMPLEX.discoverability.name, COMPLEX.discoverability.before, COMPLEX.discoverability.after, ...COMPLEX.discoverability.sources]
      .join(' ')
      .toLowerCase(),
  ],
])

const STOP_WORDS = new Set(['with', 'that', 'this', 'from', 'have', 'they', 'them', 'take', 'takes', 'forever', 'want', 'need', 'help', 'what', 'when', 'just', 'like', 'into', 'about', 'there', 'their', 'your', 'ours', 'were', 'been', 'much', 'many', 'some', 'very', 'really', 'business', 'every', 'always'])

function fromNeeds(needs: ComplexNeed[]): FinderMatch {
  const ids = [...new Set(needs.flatMap((n) => n.projects))]
  return { ids, plan: needs[0]?.plan ?? null, none: false, need: needs[0]?.id ?? null, industry: null }
}

function fromIndustry(industry: ComplexIndustry): FinderMatch {
  return { ids: ['agents', ...industry.projects], plan: null, none: false, need: null, industry: industry.id }
}

const score = (q: string, keywords: string[]) => keywords.filter((k) => q.includes(k)).reduce((sum, k) => sum + k.length, 0)

export function matchQuery(query: string): FinderMatch | null {
  const q = ` ${query.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ')} `
  if (!q.trim()) return null

  // the problems whose words appear in what they typed, strongest first; a
  // longer, more specific word ("appointment") outweighs a general one ("forget")
  const scored = COMPLEX.finder.needs
    .map((need) => ({ need, score: score(q, need.keywords) }))
    .filter((n) => n.score > 0)
    .sort((a, b) => b.score - a.score)

  // naming their kind of business ("we're a law firm") beats a task word
  const industry = INDUSTRIES.map((item) => ({ item, score: score(q, item.keywords) }))
    .filter((i) => i.score > 0)
    .sort((a, b) => b.score - a.score)[0]
  if (industry && industry.score >= (scored[0]?.score ?? 0)) return fromIndustry(industry.item)

  if (scored.length) {
    const top = scored[0].score
    return fromNeeds(scored.filter((n) => n.score >= top * 0.75).slice(0, 2).map((n) => n.need))
  }

  // otherwise, the projects that use the same words
  const words = q.split(/\s+/).filter((w) => w.length >= 4 && !STOP_WORDS.has(w))
  const ids = Object.entries(HAYSTACK)
    .map(([id, text]) => ({ id, score: words.filter((w) => text.includes(w.replace(/s$/, ''))).length }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((p) => p.id)
  return ids.length
    ? { ids, plan: null, none: false, need: null, industry: null }
    : { ids: [], plan: null, none: true, need: null, industry: null }
}

export default function ProjectFinder({ onMatch }: { onMatch: (match: FinderMatch | null) => void }) {
  const { finder, agents } = COMPLEX
  const [picked, setPicked] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [more, setMore] = useState(false)

  const resolve = (nextPicked: string | null, nextQuery: string): FinderMatch | null => {
    if (nextPicked) {
      const need = finder.needs.find((n) => n.id === nextPicked)
      return need ? fromNeeds([need]) : null
    }
    return matchQuery(nextQuery)
  }
  const match = useMemo(() => resolve(picked, query), [picked, query])

  const update = (nextPicked: string | null, nextQuery: string) => {
    setPicked(nextPicked)
    setQuery(nextQuery)
    onMatch(resolve(nextPicked, nextQuery))
  }

  const industry = match?.industry ? INDUSTRIES.find((i) => i.id === match.industry) : undefined
  const names = match?.ids.slice(0, 3).map((id) => NAMES[id]).filter(Boolean) ?? []
  const shown = more ? finder.needs : finder.needs.slice(0, FIRST)

  return (
    <div className="complex-finder">
      <form
        role="search"
        className="complex-finder__form"
        onSubmit={(e) => {
          e.preventDefault()
          if (match && !match.none) document.querySelector(anchor(match))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
      >
        <label className="complex-finder__label" htmlFor="complex-finder-input">{finder.label}</label>
        <div className="complex-finder__search">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="7" cy="7" r="4.6" /><path d="M10.5 10.5 14 14" /></svg>
          <input
            id="complex-finder-input"
            type="search"
            value={query}
            placeholder={finder.placeholder}
            aria-describedby="complex-finder-hint"
            onChange={(e) => update(null, e.target.value)}
            autoComplete="off"
            enterKeyHint="search"
          />
          <button type="submit" className="complex-finder__go">Search</button>
        </div>
        <span id="complex-finder-hint" className="sr-only">{finder.heading}</span>
      </form>
      <div className="complex-finder__chips" role="group" aria-label="Popular tasks">
        {shown.map((need) => (
          <button
            key={need.id}
            type="button"
            className="complex-finder__chip"
            aria-pressed={picked === need.id}
            onClick={() => update(picked === need.id ? null : need.id, '')}
          >
            {need.label}
          </button>
        ))}
        {!more && (
          <button type="button" className="complex-finder__chip complex-finder__chip--more" onClick={() => setMore(true)}>
            More <span aria-hidden="true">+</span>
          </button>
        )}
      </div>

      <div className="complex-finder__answer" aria-live="polite" data-shown={match ? '' : undefined}>
        {match && (match.none ? (
          <>
            <p>{finder.none}</p>
            <div className="complex-finder__actions"><BookButton /></div>
          </>
        ) : industry ? (
          <>
            <p><b>{agents.industries.intro} {/^[aeiou]/i.test(industry.label) ? 'an' : 'a'} {industry.label.toLowerCase()}:</b> {industry.teams.map((t) => t.name.toLowerCase()).join(', ')} and more.</p>
            <p className="complex-finder__plan"><b>Closest work we have built:</b> {industry.projects.map((id) => NAMES[id]).join(', ')}.</p>
            <div className="complex-finder__actions">
              <a className="complex-link complex-link--brand" href="#agents">See the agents <span aria-hidden="true">↓</span></a>
              <a className="complex-finder__reset" href="#complex-grid">See the work</a>
              <button type="button" className="complex-finder__reset" onClick={() => update(null, '')}>{finder.reset}</button>
            </div>
          </>
        ) : (
          <>
            <p><b>Closest:</b> {names.join(', ')}.</p>
            {match.plan && <p className="complex-finder__plan">{match.plan}</p>}
            <div className="complex-finder__actions">
              <a className="complex-link complex-link--brand" href={anchor(match)}>See them <span aria-hidden="true">↓</span></a>
              <button type="button" className="complex-finder__reset" onClick={() => update(null, '')}>{finder.reset}</button>
            </div>
          </>
        ))}
      </div>
    </div>
  )
}
