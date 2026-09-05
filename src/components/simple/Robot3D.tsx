import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { clamp, damp, prefersReducedMotion, usePointer } from '../../hooks/usePointer'

useGLTF.preload('/robot.glb')

// precise face anchor measured from GLB vertices (Y 0-1, Z ±0.214)
// left eye ~[-0.091,0.851,0.138] right ~[0.102,0.847,0.14] mouth ~[0.0015,0.721,0.161]
// human tweaks: a bit closer, right eye 1-2px lower, oval yellow eyes like HeroRobot
const EYE_Y = 0.848
const EYE_Z = 0.168 // just outside surface
const EYE_DX = 0.074 // closer (was 0.097 too wide)
const EYE_RIGHT_Y_DROP = 0.008 // ~1.5px lower from our view
const MOUTH_Y = 0.725
const MOUTH_Z = 0.168

function RobotModel({ scrollProgress }: { scrollProgress: number }) {
  const { scene } = useGLTF('/robot.glb')
  const groupRef = useRef<THREE.Group>(null)
  const cloned = scene.clone(true) as THREE.Group
  cloned.traverse((obj: any) => {
    if (obj.isMesh) {
      obj.castShadow = true
      obj.receiveShadow = true
      if (obj.material) {
        obj.material.roughness = 0.82
        obj.material.metalness = 0.04
      }
    }
  })

  useFrame((state, delta) => {
    const g = groupRef.current
    if (!g) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.getElapsedTime()
    const breathe = Math.sin(t * 0.85) * 0.0022
    g.scale.y = 1 + breathe
    g.scale.x = 1 - breathe * 0.35
    g.scale.z = 1 - breathe * 0.35
    g.position.y = Math.sin(t * 0.62) * 0.006 - 0.46
    // settle into second: subtle left look — keep it believable
    const targetYaw = THREE.MathUtils.lerp(0, -0.14, scrollProgress) // ~8deg
    const targetRoll = THREE.MathUtils.lerp(0, -0.045, scrollProgress)
    const targetPitch = THREE.MathUtils.lerp(0, 0.03, scrollProgress)
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetYaw, 2.8, dt)
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, targetRoll, 2.8, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetPitch, 2.8, dt)
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
    const faceCX = vw * 0.5
    const faceCY = vh * 0.405 // 3D face sits ~40% from top of viewport when robot centered

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
  return (
    <mesh>
      <boxGeometry args={[0.3, 0.5, 0.18]} />
      <meshStandardMaterial color="#eee" wireframe />
    </mesh>
  )
}

export default function Robot3D({ scrollProgress, className = '' }: { scrollProgress: number; className?: string }) {
  return (
    <div className={`relative h-full w-full ${className}`}>
      <Canvas dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }} camera={{ position: [0, 0.62, 2.88], fov: 33 }} shadows style={{ background: 'transparent' }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[2.1, 3.0, 2.0]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-1.5, 1.0, -1.1]} intensity={0.38} color="#C2D9E5" />
        <pointLight position={[0, 1.4, 1.1]} intensity={0.42} color="#FFE8A3" distance={3} />
        <Suspense fallback={<FallbackBox />}>
          <RobotModel scrollProgress={scrollProgress} />
          <Environment preset="studio" />
        </Suspense>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.46, 0]}>
          <circleGeometry args={[0.42, 64]} />
          <meshStandardMaterial color="#1B1A17" transparent opacity={0.1} />
        </mesh>
      </Canvas>
    </div>
  )
}
