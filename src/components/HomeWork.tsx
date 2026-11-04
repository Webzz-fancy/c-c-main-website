import { HOME_WORK } from '../content/home'
import './home.css'

/**
 * A short band that sends people to the full projects page, where the work
 * is searchable and each project opens in detail.
 */
export default function HomeWork() {
  return (
    <section id="work" className="home-work w-full bg-cream" aria-labelledby="home-work-title">
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-10">
        <div className="home-work__band">
          <div>
            <p className="home-work__label">{HOME_WORK.label}</p>
            <h2 id="home-work-title">
              {HOME_WORK.heading} <em>{HOME_WORK.emphasis}</em>
            </h2>
            <p className="home-work__intro">{HOME_WORK.intro}</p>
            <ul className="home-work__kinds">
              {HOME_WORK.kinds.map((kind) => <li key={kind}>{kind}</li>)}
            </ul>
          </div>
          <a className="home-work__go" href={HOME_WORK.href}>
            {HOME_WORK.action} <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
