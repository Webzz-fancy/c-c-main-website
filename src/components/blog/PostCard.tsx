import type { PointerEvent } from 'react'
import { Bot } from '../complex/AgentLab'
import { BLOG, formatDate, glyphFor, postPath, type BlogPost } from '../../content/blog'
import '../../pages/blog.css'

/**
 * A post's cover: the same dark screen as the project cards, with the robot
 * for the post's topic. No stock photos, so every cover belongs to the site.
 */
export function PostCover({ post, size = 'card' }: { post: BlogPost; size?: 'card' | 'feature' | 'hero' }) {
  return (
    <span className={`blog-cover blog-cover--${size}`} aria-hidden="true">
      <span className="blog-cover__topic">{post.topic}</span>
      <span className="blog-cover__time">{post.minutes} min</span>
      <span className="blog-cover__ring" />
      <Bot glyph={glyphFor(post.topic)} size="md" className="blog-cover__bot" />
    </span>
  )
}

/** the stand-in and draft labels, local preview only */
export function PostFlags({ post }: { post: BlogPost }) {
  if (post.placeholder) return <span className="blog-flag">Placeholder</span>
  if (post.draft) return <span className="blog-flag">Draft, not live</span>
  return null
}

// the light on the glass follows the pointer, as on the project cards
const follow = (e: PointerEvent<HTMLAnchorElement>) => {
  const box = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mx', `${e.clientX - box.left}px`)
  e.currentTarget.style.setProperty('--my', `${e.clientY - box.top}px`)
}

export default function PostCard({ post, feature = false }: { post: BlogPost; feature?: boolean }) {
  return (
    <a href={postPath(post)} className={`blog-card${feature ? ' blog-card--feature' : ''}`} onPointerMove={follow}>
      <PostCover post={post} size={feature ? 'feature' : 'card'} />
      <span className="blog-card__body">
        <span className="blog-card__meta">
          {feature && <span className="blog-card__latest">Latest</span>}
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <PostFlags post={post} />
        </span>
        <h3 className="blog-card__title">{post.title}</h3>
        <span className="blog-card__excerpt">{post.excerpt}</span>
        <span className="blog-card__go">
          {BLOG.read} <span aria-hidden="true">→</span>
        </span>
      </span>
    </a>
  )
}
