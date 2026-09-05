import { useEffect, useRef, useState } from 'react'
import SimpleHero from '../components/simple/SimpleHero'
import SimpleSecond from '../components/simple/SimpleSecond'
import Robot3D from '../components/simple/Robot3D'
import Header from '../components/Header'
import Loader from '../components/Loader'

export default function SimplePage() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const secondRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null) // full math path (hidden)
  const heroPathRef = useRef<SVGPathElement>(null)
  const secondPathRef = useRef<SVGPathElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const arrowRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const [loaderGone, setLoaderGone] = useState(false)

  // scroll progress 0 at top, 1 at end of second
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const hero = heroRef.current
        const second = secondRef.current
        if (!hero || !second || !loaderGone) return
        const heroH = hero.offsetHeight
        const secondH = second.offsetHeight
        const vh = window.innerHeight
        const total = heroH + secondH - vh * 0.32
        const y = window.scrollY
        const p = Math.max(0, Math.min(1, y / Math.max(1, total)))
        setProgress(p)
      })
    }
    // only start tracking after loader gone
    if (loaderGone) {
      onScroll()
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onScroll)
    }
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [loaderGone])

  // dotted line is PRODUCED by the arrow — not visible before scroll
  useEffect(() => {
    const full = pathRef.current
    const heroP = heroPathRef.current
    const secondP = secondPathRef.current
    const dot = dotRef.current
    const arrow = arrowRef.current
    if (!full || !heroP || !secondP || !dot || !arrow) return
    const fullLen = full.getTotalLength()
    const heroLen = heroP.getTotalLength()
    const secondLen = secondP.getTotalLength()
    // hero draws 0 -> 0.38, second draws 0.38 -> 1
    const heroProg = Math.max(0, Math.min(1, progress / 0.38))
    const secondProg = Math.max(0, Math.min(1, (progress - 0.38) / 0.62))
    heroP.style.strokeDasharray = `7 11`
    secondP.style.strokeDasharray = `7 11`
    heroP.style.strokeDashoffset = `${heroLen * (1 - heroProg)}`
    secondP.style.strokeDashoffset = `${secondLen * (1 - secondProg)}`
    heroP.style.opacity = progress > 0.01 ? '1' : '0'
    secondP.style.opacity = progress > 0.38 ? '1' : progress > 0.32 ? `${(progress - 0.32) / 0.06}` : '0'

    // dot + arrow ride the full path length
    const p = full.getPointAtLength(fullLen * Math.min(1, progress))
    const p2 = full.getPointAtLength(fullLen * Math.min(1, progress + 0.007))
    const ang = Math.atan2(p2.y - p.y, p2.x - p.x) * (180 / Math.PI)
    dot.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`
    dot.style.opacity = progress > 0.02 && progress < 0.985 ? '1' : '0'

    if (progress < 0.02) {
      arrow.style.opacity = '0'
      arrow.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) rotate(${ang}deg) scale(0.85)`
    } else if (progress < 0.88) {
      arrow.style.opacity = '1'
      arrow.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) rotate(${ang}deg) scale(1)`
    } else {
      const extra = (progress - 0.88) * 90
      const rad = (ang * Math.PI) / 180
      const px = p.x + Math.cos(rad) * extra
      const py = p.y + Math.sin(rad) * extra
      arrow.style.opacity = `${Math.max(0, 1 - (progress - 0.88) * 7)}`
      arrow.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%) rotate(${ang}deg) scale(1)`
    }
  }, [progress])

  return (
    <div ref={wrapperRef} className="relative min-h-screen bg-cream">
      {!loaderGone && <Loader onReveal={() => setReady(true)} onGone={() => setLoaderGone(true)} />}
      {ready && (
        <>
          <Header />

          {/* wavy dotted — PRODUCED by arrow, starts hidden */}
          <div className="pointer-events-none absolute inset-0 z-[5] hidden lg:block" aria-hidden>
            <svg viewBox="0 0 1000 1600" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" style={{ overflow: 'visible' }}>
              <path
                ref={pathRef}
                d="M 500 580 C 380 610, 292 672, 252 768 C 212 864, 232 958, 312 1034 C 392 1110, 512 1152, 642 1126 C 772 1100, 864 1024, 884 924"
                fill="none"
                stroke="transparent"
                strokeWidth="1"
              />
              <path
                ref={heroPathRef}
                d="M 500 580 C 380 610, 292 672, 252 768"
                fill="none"
                stroke="rgba(17,17,17,0.20)"
                strokeWidth="1.35"
                strokeLinecap="round"
              />
              <path
                ref={secondPathRef}
                d="M 252 768 C 212 864, 232 958, 312 1034 C 392 1110, 512 1152, 642 1126 C 772 1100, 864 1024, 884 924"
                fill="none"
                stroke="rgba(255,255,255,0.88)"
                strokeWidth="1.35"
                strokeLinecap="round"
              />
            </svg>
            <div ref={dotRef} className="absolute left-0 top-0 h-[8px] w-[8px] rounded-full bg-ink lg:bg-white shadow-[0_0_10px_rgba(0,0,0,0.18)] lg:shadow-[0_0_14px_rgba(255,255,255,0.9)]" style={{ willChange: 'transform', opacity: 0 }} />
            <div ref={arrowRef} className="absolute left-0 top-0 text-ink lg:text-[#F2AFA0] drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)]" style={{ willChange: 'transform', opacity: 0 }}>
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none"><path d="M28.2 4.2L4.1 14.6l8.4 4.7 3.7 9.1 12-24.2z" fill="currentColor" /></svg>
            </div>
          </div>

          {/* mobile — same produce effect, simpler */}
          <div className="pointer-events-none absolute inset-0 z-[5] lg:hidden" aria-hidden>
            <svg viewBox="0 0 400 1600" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              <path d="M 200 560 C 140 600, 110 660, 110 760 C 110 880, 160 980, 240 1040 C 300 1080, 320 1050, 320 980" fill="none" stroke="rgba(17,17,17,0.18)" strokeWidth="1.2" strokeDasharray="6 9" strokeLinecap="round" style={{ opacity: progress > 0.02 ? 1 : 0 }} />
            </svg>
          </div>

          {/* robot — travels from hero to second and stays, not vanishing */}
          <div className="pointer-events-none fixed inset-0 z-[6]">
            <div
              className="absolute left-1/2 top-[50%] h-[min(60vh,520px)] w-[min(86vw,360px)] -translate-x-1/2 -translate-y-1/2 lg:top-[48%] lg:h-[min(76vh,680px)] lg:w-[min(40vw,520px)]"
              style={{ transform: `translate(-50%, -50%) translateY(${progress * 15}vh) translateX(${progress * -8}px)` }}
            >
              <Robot3D scrollProgress={progress} />
            </div>
          </div>

          <div ref={heroRef}>
            <SimpleHero />
          </div>
          <div ref={secondRef}>
            <SimpleSecond progress={progress} />
          </div>

          <div className="bg-[#08080A] px-6 pb-14 pt-8 text-center">
            <p className="mx-auto max-w-xl border-t border-white/10 pt-6 text-sm font-light text-white/40">— Next: project display for Simple.</p>
            <a href="/" className="mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink">Back to home</a>
          </div>
        </>
      )}
    </div>
  )
}
