import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ScrollRope from '../components/ScrollRope'
import PostCard, { PostCover, PostFlags } from '../components/blog/PostCard'
import { BLOG, POSTS, formatDate, type BlogBlock, type BlogPost } from '../content/blog'
import { site } from '../config/site'
import './blog.css'

const anchor = (text: string) =>
  text.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function Block({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case 'h2':
      return <h2 id={anchor(block.text)}>{block.text}</h2>
    case 'list':
      return (
        <ul>
          {block.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )
    case 'quote':
      return <blockquote>{block.text}</blockquote>
    default:
      return <p>{block.text}</p>
  }
}

/**
 * One post. The cover and the title share the top; below, the sections are
 * listed beside the text and follow the reader down. Then three more to
 * read, the same topic first, and the way to talk to us about it.
 */
export default function PostPage({ post }: { post: BlogPost }) {
  const sections = post.body.filter((b): b is Extract<BlogBlock, { type: 'h2' }> => b.type === 'h2')
  const [current, setCurrent] = useState(sections[0] ? anchor(sections[0].text) : '')

  // the section being read lights up in the list beside the text: the last
  // heading that has passed a third of the way down the screen
  useEffect(() => {
    const heads = sections.map((s) => document.getElementById(anchor(s.text))).filter(Boolean) as HTMLElement[]
    if (!heads.length) return
    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight * 0.35
      const passed = heads.filter((h) => h.getBoundingClientRect().top <= line)
      setCurrent((passed[passed.length - 1] ?? heads[0]).id)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.cancelAnimationFrame(frame)
    }
  }, [post.slug]) // the sections only change with the post

  const others = POSTS.filter((p) => p.slug !== post.slug)
  const more = [...others.filter((p) => p.topic === post.topic), ...others.filter((p) => p.topic !== post.topic)].slice(0, 3)

  return (
    <div className="min-h-screen bg-cream">
      <ScrollRope />
      <Header />
      <main className="blog-page">
        <header className="post-head">
          <div className="post-head__text">
            <a href="/blog" className="post-back">
              <span aria-hidden="true">←</span> {BLOG.back}
            </a>
            <p className="post-head__topic">
              {post.topic} <PostFlags post={post} />
            </p>
            <h1>{post.title}</h1>
            <p className="post-head__excerpt">{post.excerpt}</p>
            <p className="post-head__meta">
              By {site.name} · <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.minutes} min read
            </p>
          </div>
          <PostCover post={post} size="hero" />
        </header>

        <div className="post-layout">
          {sections.length > 1 && (
            <nav className="post-toc" aria-label="In this post">
              <p>In this post</p>
              <ol>
                {sections.map((s) => (
                  <li key={s.text}>
                    <a href={`#${anchor(s.text)}`} aria-current={current === anchor(s.text) ? 'true' : undefined}>
                      {s.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <article className="post-body">
            {post.body.map((block, i) => <Block key={i} block={block} />)}
          </article>
        </div>

        <section className="blog-band post-band" aria-labelledby="post-band-title">
          <div>
            <h2 id="post-band-title">{BLOG.close.heading}</h2>
            <p>{BLOG.close.body}</p>
            <p className="blog-band__note">{site.consultation}</p>
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

        {more.length > 0 && (
          <section className="blog-list post-more" aria-labelledby="post-more-title">
            <div className="blog-list__head">
              <h2 id="post-more-title">Keep reading</h2>
              <a href="/blog">
                {BLOG.back} <span aria-hidden="true">→</span>
              </a>
            </div>
            <ul className="blog-grid">
              {more.map((p) => (
                <li key={p.slug}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
