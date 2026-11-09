import Header from '../components/Header'
import Footer from '../components/Footer'
import ScrollRope from '../components/ScrollRope'
import { BookButton, QuizLink } from '../components/complex/cta'
import { COMPLEX } from '../content/complex'
import { workPath } from '../content/work'
import type { Service, ServiceSection } from '../content/services'
import { PORTFOLIO } from '../config/seo'
import { site } from '../config/site'
import './complex.css'
import './service.css'

function Section({ section }: { section: ServiceSection }) {
  const Items = section.style === 'steps' ? 'ol' : 'ul'
  return (
    <section className="service-section">
      <div className="service-section__head">
        <h2>{section.heading}</h2>
        {section.intro && <p>{section.intro}</p>}
      </div>
      <Items className={`service-items service-items--${section.style}`}>
        {section.items.map((item) => (
          <li key={item.title ?? item.body}>
            {item.title && <h3>{item.title}</h3>}
            <p>{item.body}</p>
          </li>
        ))}
      </Items>
    </section>
  )
}

/** One service: what it is, what it covers, how we do it, and work to look at. */
export default function ServicePage({ service }: { service: Service }) {
  const projects = service.projects
    .map((id) => COMPLEX.projects.find((project) => project.id === id))
    .filter((project) => project !== undefined)

  return (
    <div className="complex-page service-page">
      <Header />
      <ScrollRope />
      <main>
        <header className="service-hero">
          <p className="complex-eyebrow">{service.label}</p>
          <h1>{service.heading} <em>{service.emphasis}</em></h1>
          <div className="service-hero__intro">
            {service.intro.map((text) => <p key={text}>{text}</p>)}
          </div>
          <div className="complex-detail__actions">
            <BookButton />
            <QuizLink />
          </div>
        </header>

        {service.sections.map((section) => <Section key={section.heading} section={section} />)}

        {projects.length > 0 && (
          <section className="service-section">
            <div className="service-section__head">
              <h2>Systems we have built</h2>
            </div>
            <ul className="service-work">
              {projects.map((project) => (
                <li key={project.id}>
                  <a href={workPath(project)}>
                    <span>{project.card.kind}</span>
                    <h3>{project.card.name}</h3>
                    <p>{project.title}</p>
                    <b>See the project <span aria-hidden="true">→</span></b>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {service.portfolio && (
          <section className="service-section">
            <div className="service-section__head">
              <h2>Recent builds</h2>
            </div>
            <ul className="service-builds">
              {PORTFOLIO.map((build) => (
                <li key={build.url}>
                  <a href={build.url} target="_blank" rel="noopener">{build.tag} <span aria-hidden="true">↗</span></a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {service.faq.length > 0 && (
          <section className="service-section">
            <div className="service-section__head">
              <h2>Questions people ask</h2>
            </div>
            <dl className="service-faq">
              {service.faq.map(({ q, a }) => (
                <div key={q}>
                  <dt>{q}</dt>
                  <dd>{a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="service-close">
          <div>
            <h2>{service.close.heading}</h2>
            <p>{service.close.body}</p>
            <p className="service-close__note">{site.consultation}</p>
          </div>
          <div className="service-close__actions"><BookButton /></div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
