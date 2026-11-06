import { useState, useEffect, lazy, Suspense } from 'react'
import ScrollRope from './components/ScrollRope'
import Header from './components/Header'
import Hero from './components/Hero'
import Approach from './components/Approach'
import Quiz from './components/Quiz'
import SameDay from './components/SameDay'
import Abilities from './components/Abilities'
import HomeWork from './components/HomeWork'
import Footer from './components/Footer'
import Loader from './components/Loader'
import { RobotMoodProvider } from './context/RobotMood'
import ComplexPage from './pages/ComplexPage'
import ContactPage from './pages/ContactPage'
import LegalPage from './pages/LegalPage'
import PrivacyPage from './pages/PrivacyPage'
import BlogPage from './pages/BlogPage'
import PostPage from './pages/PostPage'
import { BLOG_ON_HOME, postBySlug } from './content/blog'
import BlogStrip from './components/BlogStrip'
import { TERMS } from './content/legal'
import { pageForPath } from './config/seo'
import { applyHead } from './lib/head'

// the websites page carries the 3D robot (three.js); only that page loads it
const SimplePage = lazy(() => import('./pages/SimplePage'))

type Page = 'home' | 'simple' | 'complex' | 'contact' | 'privacy' | 'terms' | 'blog' | 'post'
function getPage(path: string): Page {
  if (path === '/blog' || path === '/blog/') return 'blog'
  if (/^\/blog\/[a-z0-9-]+\/?$/.test(path)) return 'post'
  if (path === '/simple' || path === '/simple/') return 'simple'
  if (path === '/projects' || path === '/projects/') return 'complex'
  if (path === '/contact' || path === '/contact/') return 'contact'
  if (path === '/privacy' || path === '/privacy/') return 'privacy'
  if (path === '/terms' || path === '/terms/') return 'terms'
  return 'home'
}

function removeLegacySlash() {
  const path = window.location.pathname
  if (path === '/simple/' || path === '/projects/' || path === '/contact/' || path === '/privacy/' || path === '/terms/' || /^\/blog(\/[a-z0-9-]+)?\/$/.test(path)) {
    window.history.replaceState(window.history.state, '', path.slice(0, -1) + window.location.search + window.location.hash)
  }
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [loaderGone, setLoaderGone] = useState(false)
  const [page, setPage] = useState<Page>(() =>
    typeof window !== 'undefined' ? getPage(window.location.pathname) : 'home',
  )

  // An old permanent redirect to /simple/ may still be cached in a browser.
  // The server keeps that address working, and this cleans up the displayed
  // URL without sending the browser around a redirect loop.
  useEffect(() => { removeLegacySlash() }, [])

  // The build embeds a readable copy outside #root. Leave it present while
  // the home loader runs (so crawlers do not see just "0%"); remove it only
  // after the real content mounts. The project pages mount immediately.
  useEffect(() => {
    if (page !== 'home' || ready) document.getElementById('prerender')?.remove()
  }, [page, ready])

  // the document head follows the page: title, description, canonical,
  // social card and JSON-LD (the build pre-renders the same for each URL)
  useEffect(() => {
    applyHead(pageForPath(window.location.pathname))
  }, [page])

  useEffect(() => {
    const onPop = () => {
      removeLegacySlash()
      setPage(getPage(window.location.pathname))
    }
    window.addEventListener('popstate', onPop)
    // Keep in-app navigation on the canonical page URLs. Unknown/old paths
    // must reach the server for a real 404, not become a duplicate SPA page.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element).closest('a')
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return
      const href = a.getAttribute('href')
      if (!href || !href.startsWith('/')) return
      const target = new URL(href, window.location.href)
      if (target.origin !== window.location.origin) return
      const isProjectRoute = ['/simple', '/projects', '/contact', '/privacy', '/terms', '/blog'].includes(target.pathname) || /^\/blog\/[a-z0-9-]+$/.test(target.pathname)
      if (!isProjectRoute && target.pathname !== '/') return
      if (page === 'home' && !isProjectRoute) return
      if (target.pathname === window.location.pathname) return
      e.preventDefault()
      window.history.pushState(null, '', target.pathname + target.search + target.hash)
      setPage(getPage(target.pathname))
      window.scrollTo(0, 0)
    }
    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('popstate', onPop)
      document.removeEventListener('click', onClick)
    }
  }, [page])

  // a home-section link followed from a project page ("/#projects"): the
  // home page mounts fresh behind its loader, so the section is scrolled to
  // once the loader has released the page
  useEffect(() => {
    if (page !== 'home' || !loaderGone) return
    const hash = window.location.hash
    if (!hash || hash === '#home') return
    const target = document.getElementById(hash.slice(1))
    if (!target) return
    const id = window.setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    return () => window.clearTimeout(id)
  }, [page, loaderGone])

  if (page === 'simple') {
    return (
      <RobotMoodProvider>
        <Suspense fallback={null}>
          <SimplePage />
        </Suspense>
      </RobotMoodProvider>
    )
  }
  if (page === 'contact') {
    return (
      <RobotMoodProvider>
        <ContactPage />
      </RobotMoodProvider>
    )
  }
  if (page === 'privacy') {
    return (
      <RobotMoodProvider>
        <PrivacyPage />
      </RobotMoodProvider>
    )
  }
  if (page === 'terms') {
    return (
      <RobotMoodProvider>
        <LegalPage doc={TERMS} />
      </RobotMoodProvider>
    )
  }
  if (page === 'blog') {
    return (
      <RobotMoodProvider>
        <BlogPage />
      </RobotMoodProvider>
    )
  }
  if (page === 'post') {
    const post = postBySlug(window.location.pathname.split('/')[2]?.toLowerCase() ?? '')
    return (
      <RobotMoodProvider>
        {post ? <PostPage post={post} /> : <BlogPage />}
      </RobotMoodProvider>
    )
  }
  if (page === 'complex') {
    return (
      <RobotMoodProvider>
        <ComplexPage />
      </RobotMoodProvider>
    )
  }

  return (
    <RobotMoodProvider>
      <div className="min-h-screen bg-cream">
        {!loaderGone && (
          <Loader onReveal={() => setReady(true)} onGone={() => setLoaderGone(true)} />
        )}
        {ready && (
          <>
            <ScrollRope />
            <Header />
            <main>
              <Hero />
              <SameDay />
              <Abilities />
              <HomeWork />
              <Approach />
              {BLOG_ON_HOME && <BlogStrip />}
              <Quiz />
            </main>
            <Footer />
          </>
        )}
      </div>
    </RobotMoodProvider>
  )
}
