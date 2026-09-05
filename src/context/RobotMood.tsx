import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

/**
 * The robot's facial state.
 *  - 'idle'      normal resting smile
 *  - 'surprised' small round "o" mouth
 *  - 'happy'     big filled grin (Book a Consultation hover)
 *
 * Hover always wins. When nothing is hovered the robot idles on a loop:
 * 5s resting, then 2s of the "o" mouth, repeating.
 */
export type RobotMood = 'idle' | 'surprised' | 'happy'

type RobotMoodContextValue = {
  mood: RobotMood
  setMood: (mood: RobotMood) => void
  /** Convenience: set on enter/focus, reset on leave/blur. */
  moodHandlers: (mood: RobotMood) => {
    onMouseEnter: () => void
    onMouseLeave: () => void
    onFocus: () => void
    onBlur: () => void
  }
}

const RobotMoodContext = createContext<RobotMoodContextValue | null>(null)

/** Idle loop timings. */
const IDLE_REST_MS = 5000
const IDLE_SURPRISED_MS = 2000

export function RobotMoodProvider({ children }: { children: ReactNode }) {
  /** Mood forced by a hovered/focused element — null when nothing is hovered. */
  const [hoverMood, setHoverMood] = useState<RobotMood | null>(null)
  /** Ambient mood from the idle loop. */
  const [idleMood, setIdleMood] = useState<RobotMood>('idle')

  const hoverRef = useRef<RobotMood | null>(null)
  hoverRef.current = hoverMood

  // Ambient "o" pulse: rest 5s, surprised 2s, repeat. Pauses while hovering
  // and while the tab is hidden.
  useEffect(() => {
    let timer: number
    let cancelled = false

    const schedule = (next: RobotMood, delay: number) => {
      timer = window.setTimeout(() => {
        if (cancelled) return
        if (document.hidden || hoverRef.current) {
          // Something else owns the face — check again shortly.
          setIdleMood('idle')
          schedule('surprised', IDLE_REST_MS)
          return
        }
        setIdleMood(next)
        schedule(next === 'surprised' ? 'idle' : 'surprised',
          next === 'surprised' ? IDLE_SURPRISED_MS : IDLE_REST_MS)
      }, delay)
    }

    schedule('surprised', IDLE_REST_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  // Hover always takes priority over the ambient loop.
  const mood: RobotMood = hoverMood ?? idleMood

  const setMood = (next: RobotMood) => setHoverMood(next === 'idle' ? null : next)

  const value = useMemo<RobotMoodContextValue>(
    () => ({
      mood,
      setMood,
      moodHandlers: (next: RobotMood) => ({
        onMouseEnter: () => setHoverMood(next),
        onMouseLeave: () => setHoverMood(null),
        onFocus: () => setHoverMood(next),
        onBlur: () => setHoverMood(null),
      }),
    }),
    [mood],
  )

  return <RobotMoodContext.Provider value={value}>{children}</RobotMoodContext.Provider>
}

export function useRobotMood() {
  const ctx = useContext(RobotMoodContext)
  if (!ctx) throw new Error('useRobotMood must be used within a RobotMoodProvider')
  return ctx
}
