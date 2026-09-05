import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { clamp, damp, prefersReducedMotion, usePointer } from '../../hooks/usePointer'

useGLTF.preload('/robot.glb')

const smoothstep = (t: number) => t * t * (3 - 2 * t)

// precise face anchor measured from GLB vertices (Y 0-1, Z ±0.214)
// left eye ~[-0.091,0.851,0.138] right ~[0.102,0.847,0.14] mouth ~[0.0015,0.721,0.161]
// human tweaks: a bit closer, right eye 1-2px lower, oval yellow eyes like HeroRobot
const EYE_Y = 0.848
const EYE_Z = 0.168 // just outside surface
const EYE_DX = 0.074 // closer (was 0.097 too wide)
const EYE_RIGHT_Y_DROP = 0.005 // ~1.5-2px lower from our view (head's slight tilt)
const MOUTH_Y = 0.725
const MOUTH_Z = 0.168

/**
 * A light panel aimed at the robot (world origin). Used inside <Environment>
 * to build a fully local, offline environment map — no remote HDR fetch.
 */
function EnvPanel({
  position,
  scale,
  color = '#FFFFFF',
  intensity = 1,
  form = 'rect',
}: {
  position: [number, number, number]
  scale?: number | [number, number, number]
  color?: string
  intensity?: number
  form?: 'rect' | 'circle'
}) {
  const ref = useRef<THREE.Mesh>(null)
  useLayoutEffect(() => {
    // for non-camera objects, lookAt aims the +Z face at the target
    ref.current?.lookAt(0, 0, 0)
  }, [])
  return <Lightformer ref={ref} form={form} position={position} scale={scale} color={color} intensity={intensity} />
}

function RobotModel({ scrollProgress, onFirstFrame }: { scrollProgress: number; onFirstFrame?: () => void }) {
  const { scene } = useGLTF('/robot.glb')
  const groupRef = useRef<THREE.Group>(null)
  const firstFrame = useRef(false)

  // Clone the exact provided GLB once (not on every scroll re-render) and
  // tune the materials for a matte, solid body.
  const cloned = useMemo(() => {
    const c = scene.clone(true) as THREE.Group
    c.traverse((obj: any) => {
      if (obj.isMesh) {
        obj.castShadow = true
        obj.receiveShadow = true
        if (obj.material) {
          obj.material.roughness = 0.86
          obj.material.metalness = 0.02
          // The GLB ships with metalness 1 / envMapIntensity 1, which — combined
          // with a bright environment — is the source of the glowy look.
          obj.material.envMapIntensity = 0.3
        }
      }
    })
    return c
  }, [scene])

  useFrame((state, delta) => {
    if (!firstFrame.current) {
      firstFrame.current = true
      onFirstFrame?.()
    }
    const g = groupRef.current
    if (!g) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.getElapsedTime()
    const breathe = Math.sin(t * 0.85) * 0.0022
    g.scale.y = 1 + breathe
    g.scale.x = 1 - breathe * 0.35
    g.scale.z = 1 - breathe * 0.35
    g.position.y = Math.sin(t * 0.62) * 0.006 - 0.46
    // settle into second section: same handoff ramp as the page's robot
    // journey, so the pose lands exactly when the body reaches its perch.
    // The page hands us an already-smoothed scroll value → apply it
    // directly (a ~60ms damp only guards one-frame jumps, e.g. a mid-page
    // reload). The robot stays perfectly UPRIGHT — no roll, no pitch. The
    // 45° is a horizontal turn (yaw) to the LEFT, so it faces the content
    // on the left side of the section in a three-quarter view (face still
    // visible).
    const s = smoothstep(THREE.MathUtils.clamp((scrollProgress - 0.12) / 0.33, 0, 1))
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, (-Math.PI / 4) * s, 16, dt)
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, 0, 16, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, 0, 16, dt)
  })

  return (
    <group ref={groupRef} position={[0, -0.46, 0]} scale={[1.16, 1.16, 1.16]}>
      <primitive object={cloned} />
      <Face3D scrollProgress={scrollProgress} />
    </group>
  )
}

function Face3D({ scrollProgress }: { scrollProgress: number }) {
  const pointer = usePointer()
  const leftWhiteRef = useRef<THREE.Mesh>(null)
  const rightWhiteRef = useRef<THREE.Mesh>(null)
  const leftPupilRef = useRef<THREE.Group>(null)
  const rightPupilRef = useRef<THREE.Group>(null)

  const blinkRef = useRef({ v: 0, start: -1, nextAt: performance.now() + 2400 })
  const smooth = useRef({ px: 0, py: 0, lookX: 0, lookY: 0, wanderX: 0, wanderY: 0, nextWander: performance.now() + 2000 })

  useFrame((_, delta) => {
    if (prefersReducedMotion()) return
    const dt = Math.min(delta, 0.05)
    const coarse = typeof window !== 'undefined' && window.matchMedia('(hover: none), (pointer: coarse)').matches
    const s = smooth.current
    const b = blinkRef.current
    const now = performance.now()

    const { x, y, active } = pointer.current
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800
    // gaze anchor follows the robot's journey (same handoff ramp + perch
    // formula as SimplePage), so eye tracking stays correct while it moves
    const desk = vw >= 1024
    const rs = smoothstep(clamp((scrollProgress - 0.12) / 0.33, 0, 1))
    let faceCX: number
    let faceCY: number
    if (desk) {
      const heroH = vh // hero is 100svh
      const secH = vh * 0.92
      const perchX = vw / 2 + 0.52 * Math.min(640, Math.min(1240, vw - 48) / 2)
      const perchFaceY = heroH + 0.2 * secH - 42 // face sits just above perch centre
      faceCX = vw * 0.5 + (perchX - vw * 0.5) * rs
      faceCY = vh * 0.405 + (perchFaceY - window.scrollY - vh * 0.405) * rs
    } else {
      faceCX = vw * 0.5 + (vw * 0.62 - vw * 0.5) * rs
      faceCY = vh * 0.44 + (vh * 0.28 - vh * 0.44) * rs
    }

    let tx: number, ty: number
    if (active && !coarse) {
      tx = clamp((x - faceCX) / (vw * 0.52), -1, 1)
      ty = clamp((y - faceCY) / (vh * 0.58), -1, 1)
      tx += scrollProgress * -0.18
    } else {
      if (now >= s.nextWander) {
        const recentre = Math.random() < 0.55
        s.wanderX = recentre ? scrollProgress * -0.12 : (Math.random() * 2 - 1) * 0.32 + scrollProgress * -0.12
        s.wanderY = recentre ? 0 : (Math.random() * 2 - 1) * 0.16
        s.nextWander = now + 2600 + Math.random() * 2800
      }
      tx = s.wanderX
      ty = s.wanderY
    }
    s.lookX = damp(s.lookX, tx, 3.0, dt)
    s.lookY = damp(s.lookY, ty, 3.0, dt)

    const pupilRangeX = 0.011
    const pupilRangeY = 0.009
    const targetPx = clamp(s.lookX, -1, 1) * pupilRangeX
    const targetPy = clamp(s.lookY, -1, 1) * pupilRangeY
    s.px = damp(s.px, targetPx, 9, dt)
    s.py = damp(s.py, targetPy, 9, dt)

    if (leftPupilRef.current) {
      leftPupilRef.current.position.x = s.px
      leftPupilRef.current.position.y = s.py
    }
    if (rightPupilRef.current) {
      rightPupilRef.current.position.x = s.px
      rightPupilRef.current.position.y = s.py
    }

    if (b.start < 0 && now >= b.nextAt) {
      b.start = now
      b.nextAt = now + (Math.random() < 0.16 ? 380 : 2800 + Math.random() * 3600)
    }
    if (b.start >= 0) {
      const t = (now - b.start) / 135
      if (t >= 1) {
        b.v = 0
        b.start = -1
      } else b.v = Math.sin(t * Math.PI)
    }
    // keep oval y 1.34 * blink
    const blinkScale = 1 - b.v * 0.92
    if (leftWhiteRef.current) leftWhiteRef.current.scale.y = 1.34 * blinkScale
    if (rightWhiteRef.current) rightWhiteRef.current.scale.y = 1.34 * blinkScale
  })

  // oval yellow eyes like HeroRobot (white was wrong) — yellow + vertical oval 1.32
  const mouthCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.032, MOUTH_Y, MOUTH_Z + 0.003),
    new THREE.Vector3(0, MOUTH_Y - 0.012, MOUTH_Z + 0.004),
    new THREE.Vector3(0.032, MOUTH_Y, MOUTH_Z + 0.003),
  ])

  return (
    <group>
      {/* left eye — yellow oval */}
      <mesh ref={leftWhiteRef} position={[-EYE_DX, EYE_Y, EYE_Z]} scale={[1, 1.34, 1]}>
        <sphereGeometry args={[0.021, 28, 28]} />
        <meshStandardMaterial color="#EAC24A" roughness={0.55} metalness={0.02} emissive="#E1AD34" emissiveIntensity={0.18} />
      </mesh>
      <group ref={leftPupilRef} position={[-EYE_DX, EYE_Y, EYE_Z]}>
        <mesh position={[0, 0, 0.014]}>
          <sphereGeometry args={[0.0092, 20, 20]} />
          <meshStandardMaterial color="#1A1816" roughness={0.9} />
        </mesh>
        <mesh position={[-0.0026, 0.0032, 0.018]}>
          <sphereGeometry args={[0.0024, 10, 10]} />
          <meshStandardMaterial color="#FFFEF7" emissive="#FFFEF7" emissiveIntensity={0.85} />
        </mesh>
      </group>

      {/* right eye — a bit lower (head tiny tilt right) */}
      <mesh ref={rightWhiteRef} position={[EYE_DX, EYE_Y - EYE_RIGHT_Y_DROP, EYE_Z]} scale={[1, 1.34, 1]}>
        <sphereGeometry args={[0.021, 28, 28]} />
        <meshStandardMaterial color="#EAC24A" roughness={0.55} metalness={0.02} emissive="#E1AD34" emissiveIntensity={0.18} />
      </mesh>
      <group ref={rightPupilRef} position={[EYE_DX, EYE_Y - EYE_RIGHT_Y_DROP, EYE_Z]}>
        <mesh position={[0, 0, 0.014]}>
          <sphereGeometry args={[0.0092, 20, 20]} />
          <meshStandardMaterial color="#1A1816" roughness={0.9} />
        </mesh>
        <mesh position={[-0.0026, 0.0032, 0.018]}>
          <sphereGeometry args={[0.0024, 10, 10]} />
          <meshStandardMaterial color="#FFFEF7" emissive="#FFFEF7" emissiveIntensity={0.85} />
        </mesh>
      </group>

      {/* smile — yellow like other robot */}
      <mesh>
        <tubeGeometry args={[mouthCurve, 18, 0.0024, 8, false]} />
        <meshStandardMaterial color="#E1AD34" roughness={0.65} />
      </mesh>
    </group>
  )
}

function FallbackBox() {
  return null
}

export default function Robot3D({
  scrollProgress,
  onReady,
  className = '',
}: {
  scrollProgress: number
  onReady?: () => void
  className?: string
}) {
  const notified = useRef(false)
  const notify = () => {
    if (!notified.current) {
      notified.current = true
      onReady?.()
    }
  }
  // Safety: never hold the loading screen hostage if the GLB/WebGL misbehaves.
  useEffect(() => {
    const t = window.setTimeout(notify, 9000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`relative h-full w-full ${className}`}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, toneMappingExposure: 0.92 }}
        camera={{ position: [0, 0.62, 2.88], fov: 33 }}
        shadows
        style={{ background: 'transparent' }}
      >
        {/*
          Lighting tuned for a DARK, SOLID, GROUNDED body:
          low ambient, one soft key, a faint cool rim, a whisper of warm fill.
          The environment is a small local studio (Lightformers, rendered into
          the env map offline) at low envMapIntensity — controlled highlights,
          no bloom, no glow.
        */}
        <ambientLight intensity={0.26} />
        <directionalLight position={[2.4, 3.2, 2.2]} intensity={1.35} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-1.8, 1.1, -1.5]} intensity={0.32} color="#BFD4E2" />
        <pointLight position={[0, 1.05, 1.5]} intensity={0.16} color="#FFE8A3" distance={2.6} />
        <Suspense fallback={<FallbackBox />}>
          <RobotModel scrollProgress={scrollProgress} onFirstFrame={notify} />
          <Environment resolution={256} frames={1}>
            {/* soft key panel, upper-left-front */}
            <EnvPanel position={[-3, 2.6, 2.4]} scale={[4, 3.2, 1]} intensity={1.05} color="#FFFFFF" />
            {/* faint cool fill, right */}
            <EnvPanel position={[3.4, 0.6, 1.6]} scale={[3, 4, 1]} intensity={0.22} color="#9FB6C6" />
            {/* warm rim from behind — keeps form readable on the dark section */}
            <EnvPanel position={[1.1, 1.5, -3]} scale={[2.6, 1.4, 1]} intensity={0.42} color="#FFE3B0" />
            {/* dark floor — grounds the lower body */}
            <EnvPanel position={[0, -2.6, 0]} scale={[5, 5, 1]} intensity={0.12} color="#6B6B6B" form="circle" />
          </Environment>
        </Suspense>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.46, 0]}>
          <circleGeometry args={[0.42, 64]} />
          <meshStandardMaterial color="#1B1A17" transparent opacity={0.1} />
        </mesh>
      </Canvas>
    </div>
  )
}
