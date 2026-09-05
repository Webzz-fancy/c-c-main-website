import { useState, useEffect } from 'react'
import CursorGlow from './components/CursorGlow'
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

type Page = 'home' | 'simple' | 'complex'
function getPage(path: string): Page {
  if (path.startsWith('/simple')) return 'simple'
  if (path.startsWith('/complex')) return 'complex'
  return 'home'
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [loaderGone, setLoaderGone] = useState(false)
  const [page, setPage] = useState<Page>(() =>
    typeof window !== 'undefined' ? getPage(window.location.pathname) : 'home',
  )

  useEffect(() => {
    const onPop = () => setPage(getPage(window.location.pathname))
    window.addEventListener('popstate', onPop)
    // lightweight SPA for /simple and /complex without touching main page
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a')
      if (!a) return
      const href = a.getAttribute('href')
      if (!href || !href.startsWith('/')) return
      const isProjectRoute = href.startsWith('/simple') || href.startsWith('/complex')
      const isOnProjectRoute = page !== 'home'
      if (isProjectRoute || isOnProjectRoute) {
        if (href === window.location.pathname) return
        // only intercept known project routes + home
        if (!['/','/simple','/complex'].some((p) => href === p || href.startsWith(p + '/'))) {
          if (!isProjectRoute) return
        }
        e.preventDefault()
        window.history.pushState(null, '', href)
        setPage(getPage(href))
        window.scrollTo(0, 0)
      }
    }
    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('popstate', onPop)
      document.removeEventListener('click', onClick)
    }
  }, [page])

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
            <CursorGlow />
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
