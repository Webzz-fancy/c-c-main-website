import Header from '../components/Header'
import Footer from '../components/Footer'
import ScrollRope from '../components/ScrollRope'
import ProjectContent from '../components/complex/ProjectContent'
import type { ComplexProject } from '../content/complex'
import { SERVICES } from '../content/services'
import './complex.css'
import './service.css'

/**
 * One project as a full page, at /work/<slug>: where search engines, AI
 * assistants and shared links land. On /projects the same details still open
 * in a popup.
 */
export default function WorkPage({ project }: { project: ComplexProject }) {
  const services = SERVICES.filter((service) => service.projects.includes(project.id))

  return (
    <div className="complex-page work-page">
      <Header />
      <ScrollRope />
      <main className="work-page__main">
        <nav className="work-page__crumbs" aria-label="Breadcrumb">
          <a href="/projects"><span aria-hidden="true">←</span> All projects</a>
          <span>{project.card.kind}</span>
          <span>{project.card.area}</span>
        </nav>
        <article>
          <ProjectContent project={project} page />
        </article>
        {services.length > 0 && (
          <nav className="work-page__related" aria-label="Related services">
            <p>Related</p>
            <ul>
              {services.map((service) => (
                <li key={service.path}>
                  <a href={service.path}>{service.name} <span aria-hidden="true">→</span></a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </main>
      <Footer />
    </div>
  )
}
