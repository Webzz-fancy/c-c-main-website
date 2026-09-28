import { useState, useEffect } from 'react'
import ScrollRope from './components/ScrollRope'
import Header from './components/Header'
import Hero from './components/Hero'
import Approach from './components/Approach'
import Projects from './components/Projects'
import WaysToWork from './components/WaysToWork'
import Quiz from './components/Quiz'
import Footer from './components/Footer'
import Loader from './components/Loader'
import { RobotMoodProvider } from './context/RobotMood'
import SimplePage from './pages/SimplePage'
import ComplexPage from './pages/ComplexPage'
import { pageForPath } from './config/seo'
import { applyHead } from './lib/head'

type Page = 'home' | 'simple' | 'complex'
function getPage(path: string): Page {
  // The bare paths still work when running Vite locally; production sends
  // them to the slash-terminated canonical URLs before the app loads.
  if (path === '/simple' || path === '/simple/') return 'simple'
  if (path === '/complex' || path === '/complex/') return 'complex'
  return 'home'
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [loaderGone, setLoaderGone] = useState(false)
  const [page, setPage] = useState<Page>(() =>
    typeof window !== 'undefined' ? getPage(window.location.pathname) : 'home',
  )

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
    const onPop = () => setPage(getPage(window.location.pathname))
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
      const isProjectRoute = target.pathname === '/simple/' || target.pathname === '/complex/'
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
        <SimplePage />
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
              <Approach />
              <Projects />
              <WaysToWork />
              <Quiz />
            </main>
            <Footer />
          </>
        )}
      </div>
    </RobotMoodProvider>
  )
}
