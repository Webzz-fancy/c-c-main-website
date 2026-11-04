import Eyebrow from './Eyebrow'
import { BLOG, POSTS, formatDate, postPath } from '../content/blog'

/**
 * The three newest posts, just before the fix plan. The home page only
 * shows this once there are three (BLOG_ON_HOME), so it never looks thin.
 */
export default function BlogStrip() {
  return (
    <section id="blog" className="w-full bg-cream py-[clamp(48px,7vh,72px)]" aria-labelledby="home-blog-title">
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>{BLOG.strip.label}</Eyebrow>
            <h2 id="home-blog-title" className="mt-5 font-display text-[clamp(2.1rem,3.6vw,3.3rem)] leading-[1.05] tracking-[-0.02em] text-ink">
              {BLOG.strip.heading} <span className="italic text-brand-600">{BLOG.strip.emphasis}</span>
            </h2>
          </div>
          <a href="/blog" className="text-[14.5px] font-semibold text-ink">
            {BLOG.strip.action} <span aria-hidden="true" className="text-brand-600">→</span>
          </a>
        </div>

        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {POSTS.slice(0, 3).map((post) => (
            <li key={post.slug}>
              <a
                href={postPath(post)}
                className="group flex h-full flex-col rounded-[20px] border border-black/[0.08] bg-white/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand/50 hover:bg-white hover:shadow-[0_24px_50px_-30px_rgba(27,26,23,0.45)]"
              >
                <p className="text-[12.5px] text-ink-soft">
                  <span className="font-semibold uppercase tracking-[0.12em] text-glass">{post.topic}</span> ·{' '}
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                </p>
                <h3 className="mt-3 font-display text-[1.35rem] leading-snug tracking-[-0.01em] text-ink">{post.title}</h3>
                <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-ink-soft">{post.excerpt}</p>
                <span className="mt-5 text-[13.5px] font-semibold text-ink">
                  {BLOG.read} <span aria-hidden="true" className="inline-block text-brand-600 transition-transform duration-300 group-hover:translate-x-1">→</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
