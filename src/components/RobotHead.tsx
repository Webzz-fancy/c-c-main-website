import { useEffect, useRef } from 'react'
import { clamp, damp, prefersReducedMotion, usePointer } from '../hooks/usePointer'
import { useRobotMood } from '../context/RobotMood'

/**
 * Intrinsic geometry of /robot-head.png (554 x 394) measured from the asset,
 * so the SVG face overlay lines up pixel-perfectly at any rendered size.
 */
const ART_W = 554
const ART_H = 394

/** Dark screen bounds inside the artwork. */
const SCREEN = { x: 113, y: 104, w: 345, h: 280 }
const SCREEN_CX = SCREEN.x + SCREEN.w / 2

const EYE = {
  y: SCREEN.y + 100, // vertical centre of both eyes
  dx: 62, // horizontal offset from the screen centre
  rx: 26,
  ry: 35,
}

/** Maximum pupil travel inside the eye, in artwork units. */
const PUPIL_RANGE = { x: 9, y: 8 }

const MOUTH_Y = EYE.y + 72

/** Doraemon-style pocket grin: flat top edge, deep semicircular bowl. */
const BIG_SMILE_W = 132
const BIG_SMILE_D = 62
const BIG_SMILE_PATH = [
  `M ${SCREEN_CX - BIG_SMILE_W / 2} ${MOUTH_Y}`,
  `H ${SCREEN_CX + BIG_SMILE_W / 2}`,
  `A ${BIG_SMILE_W / 2} ${BIG_SMILE_D} 0 0 1 ${SCREEN_CX - BIG_SMILE_W / 2} ${MOUTH_Y}`,
  'Z',
].join(' ')

const IDLE_SMILE_PATH = `M ${SCREEN_CX - 46} ${MOUTH_Y + 4} Q ${SCREEN_CX} ${MOUTH_Y + 46} ${SCREEN_CX + 46} ${MOUTH_Y + 4}`

type RobotHeadProps = {
  className?: string
}

export default function RobotHead({ className = '' }: RobotHeadProps) {
  const pointer = usePointer()
  const { mood } = useRobotMood()

  // The nod is driven inside the rAF loop, so mood is mirrored into a ref.
  const noddingRef = useRef(false)
  noddingRef.current = mood === 'happy'

  const headRef = useRef<HTMLDivElement>(null)
  const leftPupilRef = useRef<SVGGElement>(null)
  const rightPupilRef = useRef<SVGGElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return

    let raf = 0
    let last = performance.now()

    // Smoothed state
    let tilt = 0 // deg, left/right head tilt
    let turnX = 0 // px, subtle horizontal drift
    let bob = 0 // deg, look up/down
    let pupilX = 0
    let pupilY = 0
    let nodAmount = 0 // 0 -> 1 envelope for the nod
    let nodPhase = 0

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      const head = headRef.current
      if (!head) {
        raf = requestAnimationFrame(tick)
        return
      }

      const rect = head.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height * 0.42

      const { x, y, active } = pointer.current

      // Normalised pointer offset from the head centre, in "screens".
      const nx = active ? clamp((x - cx) / (window.innerWidth * 0.5), -1, 1) : 0
      const ny = active ? clamp((y - cy) / (window.innerHeight * 0.7), -1, 1) : 0

      // --- Head tilt / orientation -------------------------------------
      tilt = damp(tilt, nx * 9, 5, dt) // ±9deg roll toward the cursor
      turnX = damp(turnX, nx * 14, 5, dt) // slight lateral shift
      bob = damp(bob, ny * 4, 5, dt) // slight pitch toward the cursor

      // --- Nod ("yes") envelope ----------------------------------------
      const target = noddingRef.current ? 1 : 0
      nodAmount = damp(nodAmount, target, noddingRef.current ? 12 : 7, dt)
      if (nodAmount > 0.001) {
        nodPhase += dt * Math.PI * 2 * 1.55 // ~1.55 nods per second
      } else {
        nodPhase = 0
      }
      const nodY = Math.sin(nodPhase) * 18 * nodAmount
      const nodRot = Math.sin(nodPhase) * 5 * nodAmount

      head.style.transform =
        `translate3d(${turnX.toFixed(2)}px, ${nodY.toFixed(2)}px, 0) ` +
        `rotate(${(tilt + bob * 0.25).toFixed(2)}deg) ` +
        `perspective(900px) rotateX(${(-bob - nodRot).toFixed(2)}deg)`

      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${(turnX * 0.5).toFixed(2)}px, 0, 0)`
      }

      // --- Pupils -------------------------------------------------------
      // Eyes react a touch faster and with a wider range than the head.
      const px = clamp(active ? (x - cx) / (window.innerWidth * 0.32) : 0, -1, 1)
      const py = clamp(active ? (y - cy) / (window.innerHeight * 0.45) : 0, -1, 1)
      pupilX = damp(pupilX, px * PUPIL_RANGE.x, 9, dt)
      pupilY = damp(pupilY, py * PUPIL_RANGE.y, 9, dt)

      const transform = `translate(${pupilX.toFixed(2)} ${pupilY.toFixed(2)})`
      leftPupilRef.current?.setAttribute('transform', transform)
      rightPupilRef.current?.setAttribute('transform', transform)

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [pointer])

  const isHappy = mood === 'happy'
  const isSurprised = mood === 'surprised'

  /** Shared crossfade for the three mouth shapes. */
  const mouthStyle = (visible: boolean, scale: number) => ({
    opacity: visible ? 1 : 0,
    transform: `scale(${visible ? 1 : scale})`,
    transformOrigin: `${SCREEN_CX}px ${MOUTH_Y}px`,
    transition: 'opacity 260ms ease, transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  })

  return (
    <div className={`relative h-full w-full select-none ${className}`} aria-hidden="true">
      {/* Warm floor glow behind the head */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute -bottom-4 left-1/2 h-24 w-[85%] -translate-x-1/2 rounded-[50%] blur-2xl"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(225,173,52,0.32) 0%, rgba(225,173,52,0) 70%)',
        }}
      />

      <div
        ref={headRef}
        className="relative h-full w-full will-change-transform"
        style={{ transformOrigin: '50% 92%' }}
      >
        <img
          src="/robot-head.png"
          alt="Clause & Code robot assistant"
          width={ART_W}
          height={ART_H}
          className="block h-full w-full object-contain drop-shadow-[0_28px_40px_rgba(27,26,23,0.18)]"
          draggable={false}
        />

        {/* Face overlay — matches the artwork's intrinsic coordinate system */}
        <svg
          viewBox={`0 0 ${ART_W} ${ART_H}`}
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <defs>
            <radialGradient id="cc-eye-fill" cx="42%" cy="34%" r="78%">
              <stop offset="0%" stopColor="#FFE28A" />
              <stop offset="55%" stopColor="#F3C24A" />
              <stop offset="100%" stopColor="#E1AD34" />
            </radialGradient>
            <filter id="cc-eye-glow" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ---------- Eyes ---------- */}
          {[-1, 1].map((side) => {
            const cx = SCREEN_CX + side * EYE.dx
            return (
              <g key={side} filter="url(#cc-eye-glow)">
                <ellipse
                  cx={cx}
                  cy={EYE.y}
                  rx={EYE.rx}
                  ry={isHappy ? EYE.ry * 0.86 : EYE.ry}
                  fill="url(#cc-eye-fill)"
                  opacity="0.97"
                  style={{ transition: 'ry 320ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                />
                <g ref={side === -1 ? leftPupilRef : rightPupilRef}>
                  <ellipse cx={cx} cy={EYE.y} rx={10.5} ry={13} fill="#221F1A" opacity="0.92" />
                  <circle cx={cx - 3.5} cy={EYE.y - 5} r={3.2} fill="#FFFDF6" opacity="0.85" />
                </g>
              </g>
            )
          })}

          {/* ---------- Mouth: three crossfading expressions ---------- */}
          <g filter="url(#cc-eye-glow)">
            {/* Resting smile */}
            <path
              d={IDLE_SMILE_PATH}
              fill="none"
              stroke="#E1AD34"
              strokeWidth="9"
              strokeLinecap="round"
              style={mouthStyle(!isHappy && !isSurprised, 0.7)}
            />

            {/* Surprised "o" */}
            <ellipse
              cx={SCREEN_CX}
              cy={MOUTH_Y + 18}
              rx={17}
              ry={21}
              fill="none"
              stroke="#E1AD34"
              strokeWidth="8.5"
              style={mouthStyle(isSurprised, 0.35)}
            />

            {/* Big filled "pocket" grin */}
            <path d={BIG_SMILE_PATH} fill="#E1AD34" style={mouthStyle(isHappy, 0.45)} />
          </g>
        </svg>
      </div>
    </div>
  )
}
