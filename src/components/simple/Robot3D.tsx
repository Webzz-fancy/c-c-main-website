import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { clamp, damp, prefersReducedMotion, usePointer } from '../../hooks/usePointer'
import { handoff } from './journey'

/** the model — downloaded behind the loading screen (see preloadRobot) */
const ROBOT_URL = '/robot.glb'

type Progress = (loaded: number, total: number) => void
let robotPreload: Promise<void> | null = null
let robotSrc: string | null = null
const progressListeners: Progress[] = []

/**
 * Download the robot GLB up front, streaming, so the loading screen can show
 * the real download on its bar and hold until the model is here. The bytes
 * are handed to drei's cache under a blob URL, so the Canvas never fetches
 * the model again; parsing happens while the loading screen is still up,
 * and the loader also waits for the robot's first drawn frame. Idempotent —
 * every caller shares one download; each may add a progress listener.
 */
export function preloadRobot(onProgress?: Progress): Promise<void> {
  if (onProgress) progressListeners.push(onProgress)
  if (!robotPreload) {
    robotPreload = fetch(ROBOT_URL)
      .then(async (res) => {
        if (!res.ok || !res.body) throw new Error(String(res.status))
        const total = Number(res.headers.get('content-length')) || 0
        const reader = res.body.getReader()
        const chunks: Uint8Array[] = []
        let loaded = 0
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
          loaded += value.byteLength
          for (const l of progressListeners) l(loaded, total)
        }
        const buf = new Uint8Array(loaded)
        let off = 0
        for (const c of chunks) {
          buf.set(c, off)
          off += c.byteLength
        }
        robotSrc = URL.createObjectURL(new Blob([buf], { type: 'model/gltf-binary' }))
      })
      .catch(() => {
        // network trouble: let the Canvas load the plain path itself
        robotSrc = ROBOT_URL
      })
      .then(() => {
        for (const l of progressListeners) l(1, 1)
        useGLTF.preload(robotSrc as string)
      })
  }
  return robotPreload
}

/*
 * The face is the HeroRobot face (src/components/HeroRobot.tsx), drawn onto
 * the 3D head's screen plate. Same artwork, same colours, same proportions:
 *
 *   hero screen 442 × 359 art units — eyes at ±82 from the centre, 42 % down
 *   the screen, rx 33 / ry 44; mouth centreline 97 units under the eyes,
 *   116 wide, stroke 11, colour #E1AD34; pupil #221F1A with a #FFFDF6 glint.
 *
 * The GLB's screen plate (front face, measured from its vertices and from
 * the rendered frame at the page camera) spans model x −0.16 … 0.145 and
 * y 0.67 … 0.915. Projecting the hero layout onto that plate gives one scale
 * factor: 1 hero art unit = 0.000705 model units (the same value falls out
 * of the eye spacing and of the eye→mouth drop, so the layout is not
 * stretched). The plate is not perfectly centred on x = 0 — its visual
 * centre in the rendered frame sits at x ≈ −0.004.
 */
const ART_UNIT = 0.000705
const FACE_CX = -0.004
const EYE_Y = 0.817 // 42 % down the plate
const EYE_DX = 82 * ART_UNIT // 0.0578 — hero eye offset
const MOUTH_Y = EYE_Y - 97 * ART_UNIT // hero MOUTH_Y (top of the smile curve)
// depth of the plate under each feature, and its surface tilt there
// (measured on the mesh), so the flat decals sit flush like screen graphics
const EYE_L: [number, number, number] = [FACE_CX - EYE_DX, EYE_Y, 0.1593]
const EYE_R: [number, number, number] = [FACE_CX + EYE_DX, EYE_Y, 0.1626]
const MOUTH_C: [number, number, number] = [FACE_CX, MOUTH_Y - 18 * ART_UNIT, 0.1674]
const EYE_L_N = new THREE.Vector3(-0.256, 0.116, 0.96).normalize()
const EYE_R_N = new THREE.Vector3(0.187, 0.106, 0.977).normalize()
const MOUTH_N = new THREE.Vector3(-0.01, -0.114, 0.993).normalize()
const LIFT = 0.0012 // decal sits a hair above the plate (no z-fighting)

/** the hero's soft eye glow (feGaussianBlur 8 under the graphic), as a canvas shadow */
function glowPass(ctx: CanvasRenderingContext2D, k: number, draw: () => void) {
  ctx.save()
  ctx.shadowColor = 'rgba(225, 173, 52, 0.75)'
  ctx.shadowBlur = 16 * k // shadowBlur ≈ 2σ, in canvas pixels
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  draw()
  ctx.restore()
}

/** the hero eye, drawn 1:1 from the SVG (glow, gradient, pupil, glint) into a texture */
function paintEye(canvas: HTMLCanvasElement, pupilDx: number, pupilDy: number) {
  const S = canvas.width
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  // art units → canvas: eye ellipse rx 33, ry 44 inside a 140 × 140 box
  const k = S / 140
  const cx = S / 2
  const cy = S / 2
  ctx.clearRect(0, 0, S, S)
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(k, k)
  const eyePath = () => {
    ctx.beginPath()
    ctx.ellipse(0, 0, 33, 44, 0, 0, Math.PI * 2)
  }
  glowPass(ctx, k, () => {
    eyePath()
    ctx.fillStyle = '#E1AD34'
    ctx.fill()
  })
  // radialGradient cx 42 % cy 34 % r 78 % of the ellipse box → the three hero stops
  const gx = -33 + 66 * 0.42
  const gy = -44 + 88 * 0.34
  const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, 66 * 0.78)
  grad.addColorStop(0, '#FFE28A')
  grad.addColorStop(0.55, '#F3C24A')
  grad.addColorStop(1, '#E1AD34')
  eyePath()
  ctx.fillStyle = grad
  ctx.globalAlpha = 0.97
  ctx.fill()
  // pupil + glint (both carried by the gaze offset, as in the SVG)
  ctx.globalAlpha = 0.92
  ctx.beginPath()
  ctx.ellipse(pupilDx, pupilDy, 13, 16.5, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#221F1A'
  ctx.fill()
  ctx.globalAlpha = 0.85
  ctx.beginPath()
  ctx.arc(pupilDx - 4.4, pupilDy - 6.3, 4, 0, Math.PI * 2)
  ctx.fillStyle = '#FFFDF6'
  ctx.fill()
  ctx.restore()
}

/** the hero resting smile: M −58 5 Q 0 57 58 5, stroke #E1AD34 width 11, round caps */
function paintMouth(canvas: HTMLCanvasElement) {
  const W = canvas.width
  const H = canvas.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const k = W / 176 // 176 × 96 art units (116 wide curve + caps + glow margin)
  ctx.clearRect(0, 0, W, H)
  ctx.save()
  ctx.translate(W / 2, H / 2)
  ctx.scale(k, k)
  ctx.translate(0, -18) // curve spans y 5 … 31 → centre the stroke in the plane
  const smile = () => {
    ctx.beginPath()
    ctx.moveTo(-58, 5)
    ctx.quadraticCurveTo(0, 57, 58, 5)
    ctx.lineWidth = 11
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#E1AD34'
    ctx.stroke()
  }
  glowPass(ctx, k, smile)
  smile()
  ctx.restore()
}

/** a flat decal on the screen plate — position on the surface, facing its normal */
function FaceDecal({
  at,
  normal,
  size,
  map,
  meshRef,
}: {
  at: [number, number, number]
  normal: THREE.Vector3
  size: [number, number]
  map: THREE.Texture
  meshRef?: React.RefObject<THREE.Mesh>
}) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal), [normal])
  const pos = useMemo<[number, number, number]>(
    () => [at[0] + normal.x * LIFT, at[1] + normal.y * LIFT, at[2] + normal.z * LIFT],
    [at, normal],
  )
  return (
    <mesh ref={meshRef} position={pos} quaternion={q} renderOrder={2}>
      <planeGeometry args={size} />
      {/* unlit, like the SVG: the screen graphic is its own light source */}
      <meshBasicMaterial map={map} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

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

function RobotModel({ src, scrollProgress, onFirstFrame }: { src: string; scrollProgress: number; onFirstFrame?: () => void }) {
  const { scene } = useGLTF(src)
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
    // the robot stands turned 45° toward the type on its left (a
    // three-quarter view, face visible) and turns a touch further as the
    // page scrolls (the page hands us an already-smoothed scroll value; the
    // damp only guards one-frame jumps, e.g. a mid-page reload). It stays
    // perfectly UPRIGHT — the turn is horizontal (yaw) only.
    const s = handoff(scrollProgress)
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, -Math.PI / 4 - (Math.PI / 18) * s, 16, dt)
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
  const leftEyeRef = useRef<THREE.Mesh>(null)
  const rightEyeRef = useRef<THREE.Mesh>(null)

  const blinkRef = useRef({ v: 0, start: -1, nextAt: performance.now() + 2400 })
  const smooth = useRef({ px: 0, py: 0, lookX: 0, lookY: 0, wanderX: 0, wanderY: 0, nextWander: performance.now() + 2000 })

  // the hero eye + smile, painted once into textures (repainted only when the
  // gaze moves — the pupil is part of the eye graphic, exactly as in the SVG)
  const art = useMemo(() => {
    const eye = document.createElement('canvas')
    eye.width = eye.height = 280 // 140 art units × 2
    const mouth = document.createElement('canvas')
    mouth.width = 528 // 176 art units × 3
    mouth.height = 288 // 96 art units × 3
    paintEye(eye, 0, 0)
    paintMouth(mouth)
    const eyeTex = new THREE.CanvasTexture(eye)
    const mouthTex = new THREE.CanvasTexture(mouth)
    for (const t of [eyeTex, mouthTex]) {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 4
    }
    return { eye, eyeTex, mouthTex, lastDx: 0, lastDy: 0 }
  }, [])
  useEffect(
    () => () => {
      art.eyeTex.dispose()
      art.mouthTex.dispose()
    },
    [art],
  )

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
    // gaze anchor: where the face is on screen (the robot stands on the
    // right of the hero on desktop, under the type on phones, and rises in
    // parallax as the hero scrolls — the same formula as SimplePage)
    const desk = vw >= 1024
    const scrolled = scrollProgress * vh
    const faceCX = desk ? vw * 0.72 : vw * 0.5
    const faceCY = (desk ? vh * 0.405 : vh * 0.65) - scrolled * 0.35

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

    // hero PUPIL_RANGE = { x: 11.5, y: 10 } art units (SVG y axis points down)
    const targetPx = clamp(s.lookX, -1, 1) * 11.5
    const targetPy = clamp(s.lookY, -1, 1) * 10
    s.px = damp(s.px, targetPx, 10, dt)
    s.py = damp(s.py, targetPy, 10, dt)
    if (Math.abs(s.px - art.lastDx) > 0.05 || Math.abs(s.py - art.lastDy) > 0.05) {
      art.lastDx = s.px
      art.lastDy = s.py
      paintEye(art.eye, s.px, s.py)
      art.eyeTex.needsUpdate = true
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
    // blink: the eye graphic squashes vertically, as the hero's does
    const blinkScale = 1 - b.v * 0.88
    if (leftEyeRef.current) leftEyeRef.current.scale.y = blinkScale
    if (rightEyeRef.current) rightEyeRef.current.scale.y = blinkScale
  })

  // decal sizes in model units: the eye canvas is 140 art units square, the
  // mouth canvas 176 × 96
  const eyeSize: [number, number] = [140 * ART_UNIT, 140 * ART_UNIT]
  const mouthSize: [number, number] = [176 * ART_UNIT, 96 * ART_UNIT]

  return (
    <group>
      <FaceDecal at={EYE_L} normal={EYE_L_N} size={eyeSize} map={art.eyeTex} meshRef={leftEyeRef} />
      <FaceDecal at={EYE_R} normal={EYE_R_N} size={eyeSize} map={art.eyeTex} meshRef={rightEyeRef} />
      <FaceDecal at={MOUTH_C} normal={MOUTH_N} size={mouthSize} map={art.mouthTex} />
    </group>
  )
}

function FallbackBox() {
  return null
}

export default function Robot3D({
  scrollProgress,
  active = true,
  onReady,
  className = '',
}: {
  scrollProgress: number
  /** is the robot on screen? While it is not, the canvas does not draw at
   *  all (no WebGL frames behind the sections below the hero); the scene
   *  is kept, so it resumes instantly when it comes back */
  active?: boolean
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
  // the model mounts once its bytes are here (one shared download, started
  // by the loading screen); its first drawn frame is what `onReady` reports
  const [src, setSrc] = useState<string | null>(robotSrc)
  useEffect(() => {
    let alive = true
    let t = 0
    preloadRobot().then(() => {
      if (!alive) return
      setSrc(robotSrc)
      // Safety: never hold the loading screen hostage if WebGL misbehaves.
      t = window.setTimeout(notify, 9000)
    })
    return () => {
      alive = false
      window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`relative h-full w-full ${className}`}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, toneMappingExposure: 0.92 }}
        camera={{ position: [0, 0.62, 2.88], fov: 33 }}
        shadows
        frameloop={active ? 'always' : 'never'}
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
          {src && <RobotModel src={src} scrollProgress={scrollProgress} onFirstFrame={notify} />}
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
