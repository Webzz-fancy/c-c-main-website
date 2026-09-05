import { useEffect, useRef } from 'react'
import { clamp, damp, prefersReducedMotion, usePointer } from '../hooks/usePointer'
import { useRobotMood } from '../context/RobotMood'

/**
 * Full-body Clause & Code robot for the hero: standing, arms crossed.
 *
 * The artwork is split into two perfectly-registered layers sharing one
 * 717 x 1229 canvas:
 *   - /robot-hero-head.webp  — head + antenna + a neck tube that extends
 *     down behind the collar, so the head can pivot without showing a seam
 *   - /robot-hero-body.webp  — torso, crossed arms and legs, drawn on top
 *
 * The face (eyes + mouth) is rendered live as SVG inside the head layer, so
 * the eyes can track the cursor independently of the head and the mood
 * system (idle / surprised / happy) keeps working exactly as elsewhere.
 *
 * Motion model (single rAF loop, refs only — zero React re-renders):
 *   pointer → eyes            fast damp   (the gaze leads)
 *   pointer → look target     slow damp   (a beat of hesitation)
 *   look target → head pose   medium damp (the head settles after the eyes)
 * All rotation happens around the neck pivot, clamped to small angles.
 */

/** Intrinsic geometry of the layered artwork. */
const ART_W = 715
const ART_H = 1391

/** Dark face screen bounds inside the artwork. */
const SCREEN = { x: 141, y: 134, w: 442, h: 359 }
const SCREEN_CX = SCREEN.x + SCREEN.w / 2

const EYE = {
  y: SCREEN.y + SCREEN.h * 0.42, // vertical centre of both eyes
  dx: 82, // horizontal offset from the screen centre
  rx: 33,
  ry: 44,
}

/** Maximum pupil travel inside the eye, in artwork units. */
const PUPIL_RANGE = { x: 11.5, y: 10 }

const MOUTH_Y = EYE.y + 97

/** Doraemon-style pocket grin: flat top edge, deep semicircular bowl. */
const BIG_SMILE_W = 165
const BIG_SMILE_D = 77
const BIG_SMILE_PATH = [
  `M ${SCREEN_CX - BIG_SMILE_W / 2} ${MOUTH_Y}`,
  `H ${SCREEN_CX + BIG_SMILE_W / 2}`,
  `A ${BIG_SMILE_W / 2} ${BIG_SMILE_D} 0 0 1 ${SCREEN_CX - BIG_SMILE_W / 2} ${MOUTH_Y}`,
  'Z',
].join(' ')

const IDLE_SMILE_PATH = `M ${SCREEN_CX - 58} ${MOUTH_Y + 5} Q ${SCREEN_CX} ${MOUTH_Y + 57} ${SCREEN_CX + 58} ${MOUTH_Y + 5}`

/** Neck pivot — where the head meets the torso — as % of the artwork box. */
const PIVOT = { x: 47.3, y: 41.6 }

/** Head rotation limits, in degrees. Small on purpose. */
const MAX_YAW = 10.5 // left / right turn
const MAX_PITCH_UP = 6.5
const MAX_PITCH_DOWN = 4.5

type HeroRobotProps = {
  className?: string
}

export default function HeroRobot({ className = '' }: HeroRobotProps) {
  const pointer = usePointer()
  const { mood } = useRobotMood()

  const wrapRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)
  const faceRef = useRef<SVGGElement>(null)
  const leftPupilRef = useRef<SVGGElement>(null)
  const rightPupilRef = useRef<SVGGElement>(null)
  const leftBlinkRef = useRef<SVGGElement>(null)
  const rightBlinkRef = useRef<SVGGElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return

    const wrap = wrapRef.current
    if (!wrap) return

    // Touch / stylus devices have no hovering cursor: the robot falls back to
    // a gentle autonomous "look around" behaviour instead.
    const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches

    let raf = 0
    let running = false
    let last = performance.now()

    // ---- smoothed state --------------------------------------------------
    let lookX = 0 // damped look target, -1..1 (adds the "beat" of lag)
    let lookY = 0
    let yaw = 0
    let pitch = 0
    let pupilX = 0
    let pupilY = 0

    // Autonomous gaze (touch devices / before the pointer first moves).
    let wanderX = 0
    let wanderY = 0
    let nextWanderAt = performance.now() + 2200

    // Blink state.
    let blink = 0 // 0 = open, 1 = fully closed
    let blinkStart = -1
    let nextBlinkAt = performance.now() + 2400
    const BLINK_MS = 150

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      const head = headRef.current
      const body = bodyRef.current
      if (!head || !body) {
        raf = requestAnimationFrame(tick)
        return
      }

      const { x, y, active } = pointer.current
      const followCursor = active && !coarse

      // Measure from the static wrapper so the transformed head never feeds
      // back into its own input. One read per frame, reused below.
      const rect = wrap.getBoundingClientRect()
      const faceCX = rect.left + rect.width * (SCREEN_CX / ART_W)
      const faceCY = rect.top + rect.height * (EYE.y / ART_H)

      // ---- where is the robot looking? (-1..1 on both axes) --------------
      let tx: number
      let ty: number
      if (followCursor) {
        tx = clamp((x - faceCX) / (window.innerWidth * 0.55), -1, 1)
        ty = clamp((y - faceCY) / (window.innerHeight * 0.6), -1, 1)
      } else {
        // Occasionally glance somewhere nearby, mostly return to centre.
        if (now >= nextWanderAt) {
          const recentre = Math.random() < 0.42
          wanderX = recentre ? 0 : (Math.random() * 2 - 1) * 0.45
          wanderY = recentre ? 0 : (Math.random() * 2 - 1) * 0.22
          nextWanderAt = now + 2600 + Math.random() * 2600
        }
        tx = wanderX
        ty = wanderY
      }

      // ---- two-stage head smoothing (eyes lead, head settles after) ------
      lookX = damp(lookX, tx, 3.4, dt)
      lookY = damp(lookY, ty, 3.4, dt)

      yaw = damp(yaw, lookX * MAX_YAW, 6, dt)
      pitch = damp(pitch, lookY < 0 ? lookY * MAX_PITCH_UP : lookY * MAX_PITCH_DOWN, 6, dt)
      const roll = yaw * 0.2 // lean slightly into the turn

      // ---- breathing (very subtle, ~4.5s cycle) ---------------------------
      const breathe = Math.sin(now * 0.0014)
      const bodyScaleY = 1 + breathe * 0.004
      const headBob = Math.sin(now * 0.0014 - 0.7) * 1.6

      head.style.transform =
        `perspective(1100px) ` +
        `translate3d(${(lookX * 3).toFixed(2)}px, ${headBob.toFixed(2)}px, 0) ` +
        `rotateY(${yaw.toFixed(3)}deg) ` +
        `rotateX(${(-pitch).toFixed(3)}deg) ` +
        `rotate(${roll.toFixed(3)}deg)`

      body.style.transform = `scaleY(${bodyScaleY.toFixed(4)})`

      if (shadowRef.current) {
        shadowRef.current.style.transform =
          `translateX(-50%) scaleX(${(1 + breathe * 0.01).toFixed(4)})`
      }

      // ---- eyes (faster than the head, with a wider input range) ---------
      let ex: number
      let ey: number
      if (followCursor) {
        ex = clamp((x - faceCX) / (window.innerWidth * 0.38), -1, 1)
        ey = clamp((y - faceCY) / (window.innerHeight * 0.42), -1, 1)
      } else {
        ex = clamp(tx * 1.3, -1, 1)
        ey = clamp(ty * 1.3, -1, 1)
      }
      // Vestibulo-ocular compensation: as the head turn "absorbs" part of
      // the gaze, the pupils ease back toward centre. The eyes dart first,
      // the head follows, the eyes settle — like a person, not a gimmick.
      const normPitch = pitch < 0 ? pitch / MAX_PITCH_UP : pitch / MAX_PITCH_DOWN
      const eyeTargetX = ex * PUPIL_RANGE.x - (yaw / MAX_YAW) * PUPIL_RANGE.x * 0.38
      const eyeTargetY = ey * PUPIL_RANGE.y - normPitch * PUPIL_RANGE.y * 0.32
      pupilX = damp(pupilX, clamp(eyeTargetX, -PUPIL_RANGE.x, PUPIL_RANGE.x), 10, dt)
      pupilY = damp(pupilY, clamp(eyeTargetY, -PUPIL_RANGE.y, PUPIL_RANGE.y), 10, dt)

      const pupilT = `translate(${pupilX.toFixed(2)} ${pupilY.toFixed(2)})`
      leftPupilRef.current?.setAttribute('transform', pupilT)
      rightPupilRef.current?.setAttribute('transform', pupilT)

      // The screen graphics drift a touch too, so the face reads as a layer
      // of its own rather than a sticker glued to the shell.
      faceRef.current?.setAttribute(
        'transform',
        `translate(${(pupilX * 0.35).toFixed(2)} ${(pupilY * 0.3).toFixed(2)})`,
      )

      // ---- blink -----------------------------------------------------------
      if (blinkStart < 0 && now >= nextBlinkAt) {
        blinkStart = now
        // Mostly single blinks, sometimes a quick double.
        nextBlinkAt = now + (Math.random() < 0.24 ? 340 : 2600 + Math.random() * 4200)
      }
      if (blinkStart >= 0) {
        const t = (now - blinkStart) / BLINK_MS
        if (t >= 1) {
          blink = 0
          blinkStart = -1
        } else {
          blink = Math.sin(t * Math.PI)
        }
      }
      const blinkScale = 1 - blink * 0.88
      for (const [ref, side] of [
        [leftBlinkRef, -1],
        [rightBlinkRef, 1],
      ] as const) {
        const cx = SCREEN_CX + side * EYE.dx
        ref.current?.setAttribute(
          'transform',
          `translate(${cx} ${EYE.y}) scale(1 ${blinkScale.toFixed(3)}) translate(${-cx} ${-EYE.y})`,
        )
      }

      raf = requestAnimationFrame(tick)
    }

    // Only run the loop while the hero is actually on screen.
    const start = () => {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: '80px' },
    )
    io.observe(wrap)

    return () => {
      io.disconnect()
      stop()
    }
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
    <div ref={wrapRef} className={`relative h-full w-full select-none ${className}`} aria-hidden="true">
      {/* Warm ambient glow behind the robot (matches the hero's orange corner) */}
      <div
        className="pointer-events-none absolute left-1/2 top-[8%] h-[62%] w-[130%] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(225,173,52,0.12) 0%, rgba(225,173,52,0) 68%)',
        }}
      />

      {/* Contact shadow under the feet */}
      <div
        ref={shadowRef}
        className="pointer-events-none absolute bottom-[-1.5%] left-1/2 h-[5%] w-[74%] -translate-x-1/2 rounded-[50%] blur-md"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(27,26,23,0.28) 0%, rgba(27,26,23,0) 70%)',
        }}
      />

      {/* ---------- Head layer (pivots at the neck) ---------- */}
      <div
        ref={headRef}
        className="absolute inset-0 will-change-transform"
        style={{ transformOrigin: `${PIVOT.x}% ${PIVOT.y}%` }}
      >
        <img
          src="/robot-hero-head.webp"
          alt=""
          width={ART_W}
          height={ART_H}
          className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_18px_26px_rgba(27,26,23,0.14)]"
          draggable={false}
        />

        {/* Live face — same coordinate system as the artwork */}
        <svg
          viewBox={`0 0 ${ART_W} ${ART_H}`}
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <defs>
            <radialGradient id="cc-hero-eye-fill" cx="42%" cy="34%" r="78%">
              <stop offset="0%" stopColor="#FFE28A" />
              <stop offset="55%" stopColor="#F3C24A" />
              <stop offset="100%" stopColor="#E1AD34" />
            </radialGradient>
            <filter id="cc-hero-eye-glow" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g ref={faceRef}>
            {/* ---------- Eyes ---------- */}
            {[-1, 1].map((side) => {
              const cx = SCREEN_CX + side * EYE.dx
              return (
                <g key={side} ref={side === -1 ? leftBlinkRef : rightBlinkRef}>
                  <g filter="url(#cc-hero-eye-glow)">
                    <ellipse
                      cx={cx}
                      cy={EYE.y}
                      rx={EYE.rx}
                      ry={isHappy ? EYE.ry * 0.86 : EYE.ry}
                      fill="url(#cc-hero-eye-fill)"
                      opacity="0.97"
                      style={{ transition: 'ry 320ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    />
                    <g ref={side === -1 ? leftPupilRef : rightPupilRef}>
                      <ellipse cx={cx} cy={EYE.y} rx={13} ry={16.5} fill="#221F1A" opacity="0.92" />
                      <circle cx={cx - 4.4} cy={EYE.y - 6.3} r={4} fill="#FFFDF6" opacity="0.85" />
                    </g>
                  </g>
                </g>
              )
            })}

            {/* ---------- Mouth: three crossfading expressions ---------- */}
            <g filter="url(#cc-hero-eye-glow)">
              {/* Resting smile */}
              <path
                d={IDLE_SMILE_PATH}
                fill="none"
                stroke="#E1AD34"
                strokeWidth="11"
                strokeLinecap="round"
                style={mouthStyle(!isHappy && !isSurprised, 0.7)}
              />

              {/* Surprised "o" */}
              <ellipse
                cx={SCREEN_CX}
                cy={MOUTH_Y + 22}
                rx={21}
                ry={26}
                fill="none"
                stroke="#E1AD34"
                strokeWidth="10.5"
                style={mouthStyle(isSurprised, 0.35)}
              />

              {/* Big filled "pocket" grin */}
              <path d={BIG_SMILE_PATH} fill="#E1AD34" style={mouthStyle(isHappy, 0.45)} />
            </g>
          </g>
        </svg>
      </div>

      {/* ---------- Body layer (static, covers the neck joint) ---------- */}
      <div
        ref={bodyRef}
        className="absolute inset-0 will-change-transform"
        style={{ transformOrigin: '50% 97%' }}
      >
        <img
          src="/robot-hero-body.webp"
          alt="Clause & Code robot assistant standing with arms crossed"
          width={ART_W}
          height={ART_H}
          className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_26px_36px_rgba(27,26,23,0.16)]"
          draggable={false}
        />
      </div>
    </div>
  )
}
