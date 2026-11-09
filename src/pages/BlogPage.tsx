import { useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ScrollRope from '../components/ScrollRope'
import Eyebrow from '../components/Eyebrow'
import { Bot } from '../components/complex/AgentLab'
import PostCard from '../components/blog/PostCard'
import { BLOG, POSTS, TOPICS, type Topic } from '../content/blog'
import { site } from '../config/site'
import './blog.css'

/**
 * The blog. The newest post sits beside the heading; the topics filter
 * everything below; the rest sit in a grid of the same glass cards as the
 * projects page, each with its topic's robot on the cover.
 */
export default function BlogPage() {
  const [topic, setTopic] = useState<Topic | null>(null)
  const shown = topic ? POSTS.filter((post) => post.topic === topic) : POSTS
  const [latest, ...rest] = shown
  const count = (t: Topic) => POSTS.filter((post) => post.topic === t).length

  return (
    <div className="min-h-screen bg-cream">
      <ScrollRope />
      <Header />
      <main className="blog-page">
        <section className="blog-hero">
          <div className="blog-hero__text">
            <Eyebrow>{BLOG.label}</Eyebrow>
            <h1>
              {BLOG.heading} <em>{BLOG.emphasis}</em>
            </h1>
            <p className="blog-hero__sub">{BLOG.subheading}</p>
            <p className="blog-hero__intro">{BLOG.intro}</p>

            <div className="blog-topics" role="group" aria-label="Filter by topic">
              <button type="button" className="blog-topic" aria-pressed={topic === null} onClick={() => setTopic(null)}>
                All <span>{POSTS.length}</span>
              </button>
              {TOPICS.filter((t) => count(t.label)).map((t) => (
                <button
                  key={t.label}
                  type="button"
                  className="blog-topic"
                  aria-pressed={topic === t.label}
                  onClick={() => setTopic(topic === t.label ? null : t.label)}
                >
                  <Bot glyph={t.glyph} className="blog-topic__bot" />
                  {t.label} <span>{count(t.label)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="blog-hero__latest">
            {latest ? <PostCard post={latest} feature /> : <p className="blog-empty">{BLOG.empty}</p>}
          </div>
        </section>

        {rest.length > 0 && (
          <section className="blog-list" aria-labelledby="blog-list-title">
            <div className="blog-list__head">
              <h2 id="blog-list-title">{topic ?? 'More notes'}</h2>
              <p>
                {shown.length} {shown.length === 1 ? 'post' : 'posts'}
              </p>
            </div>
            <ul className="blog-grid">
              {rest.map((post) => (
                <li key={post.slug}>
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="blog-band" aria-labelledby="blog-band-title">
          <div>
            <h2 id="blog-band-title">{BLOG.close.heading}</h2>
            <p>{BLOG.close.body}</p>
          </div>
          <div className="blog-band__actions">
            <a className="blog-band__book" href={site.links.booking} target="_blank" rel="noopener">
              Book a consultation <span aria-hidden="true">↗</span>
            </a>
            <a className="blog-band__quiz" href="/#quiz">
              Not sure where to start? Get your fix plan
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
