import type { RefObject } from 'react'
import type { ComplexProject } from '../../content/complex'
import { StopsMiniMap } from './MiniMap'
import WorkflowWalk from './WorkflowWalk'
import { BookButton, QuizLink } from './cta'

/**
 * A project's details: the drawing, before and now, who uses it, how the work
 * runs step by step, what else it does, and the result. The popup on
 * /projects and the full page at /work/<slug> both show this, so they cannot
 * drift apart. In the popup it scrolls inside `scrollRoot`; on the full page
 * it scrolls with the window.
 */
type Props = {
  project: ComplexProject
  /** the full page: the project's name is the page's main heading */
  page?: boolean
  scrollRoot?: RefObject<HTMLElement | null>
}

export default function ProjectContent({ project: p, page = false, scrollRoot }: Props) {
  const Title = page ? 'h1' : 'h2'
  const Heading = page ? 'h2' : 'h3'

  return (
    <>
      <header className="complex-detail__head">
        <Title id="complex-detail-title">{p.card.name}</Title>
        <p className="complex-detail__lede">{p.lede}</p>
        <div className="complex-detail__actions"><BookButton /></div>
      </header>

      <div className="complex-detail__overview">
        <div className="complex-card__visual"><StopsMiniMap stops={p.stops} /></div>
        <div className="complex-card__shift complex-detail__shift">
          <span className="complex-card__before"><b>Before</b>{p.card.before}</span>
          <span className="complex-card__after"><b>Now</b>{p.title}</span>
        </div>
      </div>

      <section className="complex-detail__section" aria-labelledby="complex-detail-roles">
        <Heading id="complex-detail-roles">Who does what</Heading>
        <ul className="complex-detail__roles">
          {p.roles.map((role) => (
            <li key={role.name}>
              <b>{role.name}</b>
              <span>{role.access}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="complex-detail__section" aria-labelledby="complex-detail-steps">
        <Heading id="complex-detail-steps">{p.walk}</Heading>
        <WorkflowWalk project={p} scrollRoot={scrollRoot} />
      </section>

      <section className="complex-detail__section" aria-labelledby="complex-detail-features">
        <Heading id="complex-detail-features">Also built in</Heading>
        <ul className="complex-detail__features">
          {p.features.map((feature) => <li key={feature}>{feature}</li>)}
        </ul>
      </section>

      <section className="complex-detail__result">
        <Heading>The result</Heading>
        <p>{p.result}</p>
        <div className="complex-detail__actions">
          <BookButton />
          <QuizLink />
        </div>
      </section>
    </>
  )
}
