import { useEffect, useImperativeHandle, useRef } from 'react'

// Landmarks placed by hand on portrait.webp (1200×1800), named after the
// MediaPipe BlazePose points the thesis tracks. If the portrait changes,
// these coordinates need re-placing.
const POINTS = {
  nose: [644, 662],
  eyeL: [594, 612],
  eyeR: [690, 612],
  earL: [502, 642],
  earR: [752, 642],
  mouthL: [618, 714],
  mouthR: [676, 714],
  shoulderL: [432, 942],
  shoulderR: [930, 926],
  elbowL: [330, 1362],
  elbowR: [992, 1286],
  wristL: [318, 1745],
  wristR: [936, 1690],
}

// Drawn in this order: torso, arms, then the face.
const BONES = [
  ['shoulderL', 'shoulderR'],
  ['shoulderL', 'elbowL'],
  ['shoulderR', 'elbowR'],
  ['elbowL', 'wristL'],
  ['elbowR', 'wristR'],
  ['earL', 'eyeL'],
  ['eyeL', 'nose'],
  ['nose', 'eyeR'],
  ['eyeR', 'earR'],
  ['mouthL', 'mouthR'],
]

const HEAD = ['nose', 'eyeL', 'eyeR', 'earL', 'earR', 'mouthL', 'mouthR']
const TAU = Math.PI * 2

export const LANDMARK_COUNT = Object.keys(POINTS).length

function rotate([x, y], [cx, cy], angle) {
  const dx = x - cx
  const dy = y - cy
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return [cx + dx * c - dy * s, cy + dx * s + dy * c]
}

const add = ([x, y], [dx, dy]) => [x + dx, y + dy]

// A little 120 bpm routine: bounce on the beat, sway every two beats,
// arms pumping in alternation. `env` (0–1) eases the moves in and out.
function choreography(t, env) {
  const bounce = Math.abs(Math.sin(TAU * t)) * 22 * env
  const sway = Math.sin(Math.PI * t) * 34 * env
  const tilt = Math.sin(Math.PI * t) * 18 * env
  const pos = {}

  const headShift = [sway * 1.25, -bounce * 1.1]
  const headTilt = Math.sin(Math.PI * t + 0.6) * 0.16 * env
  const neck = add([644, 800], headShift)
  for (const name of HEAD) pos[name] = rotate(add(POINTS[name], headShift), neck, headTilt)

  pos.shoulderL = add(POINTS.shoulderL, [sway, -bounce * 0.7 + tilt])
  pos.shoulderR = add(POINTS.shoulderR, [sway, -bounce * 0.7 - tilt])

  const arm = (side, phase, dir) => {
    const s = `shoulder${side}`
    const delta = [pos[s][0] - POINTS[s][0], pos[s][1] - POINTS[s][1]]
    const raise = dir * env * 1.9 * (0.5 + 0.5 * Math.sin(TAU * t + phase))
    const flick = dir * env * 0.9 * Math.sin(TAU * 2 * t + phase)
    const elbow = rotate(add(POINTS[`elbow${side}`], delta), pos[s], raise)
    const wrist = rotate(rotate(add(POINTS[`wrist${side}`], delta), pos[s], raise), elbow, raise * 0.35 + flick)
    pos[`elbow${side}`] = elbow
    pos[`wrist${side}`] = wrist
  }
  arm('L', 0, 1)
  arm('R', Math.PI, -1)
  return pos
}

/**
 * `height` crops the 1200-wide portrait from the top (e.g. 1600 for a 3:4
 * frame). Once `active`, the bones draw in, then the landmarks keep flickering
 * and a scan line sweeps down, like live tracking. `ref.current.dance()`
 * plays the routine and resolves when the skeleton is back in place.
 */
export default function PoseTrace({ active, height = 1800, ref }) {
  const lineRefs = useRef([])
  const pointRefs = useRef({})
  const rafRef = useRef(0)

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  useImperativeHandle(ref, () => {
    const apply = (pos) => {
      BONES.forEach(([a, b], i) => {
        const line = lineRefs.current[i]
        if (!line) return
        line.setAttribute('x1', pos[a][0])
        line.setAttribute('y1', pos[a][1])
        line.setAttribute('x2', pos[b][0])
        line.setAttribute('y2', pos[b][1])
      })
      for (const [name, [x, y]] of Object.entries(pos)) {
        for (const circle of pointRefs.current[name]?.children || []) {
          circle.setAttribute('cx', x)
          circle.setAttribute('cy', y)
        }
      }
    }

    return {
      dance(duration = 4800) {
        cancelAnimationFrame(rafRef.current)
        return new Promise((resolve) => {
          const start = performance.now()
          const total = duration / 1000
          const frame = (now) => {
            const t = (now - start) / 1000
            if (t >= total) {
              apply(POINTS)
              resolve()
              return
            }
            const env = Math.min(1, t / 0.5, (total - t) / 0.6)
            apply(choreography(t, env))
            rafRef.current = requestAnimationFrame(frame)
          }
          rafRef.current = requestAnimationFrame(frame)
        })
      },
    }
  }, [])

  return (
    <svg
      className={`pose-trace${active ? ' is-active' : ''}`}
      viewBox={`0 0 1200 ${height}`}
      preserveAspectRatio="xMidYMin slice"
      aria-hidden="true"
    >
      <rect className="pose-scan" x="0" y="0" width="1200" height="3" />
      {BONES.map(([a, b], i) => (
        <line
          key={`${a}-${b}`}
          ref={(el) => { lineRefs.current[i] = el }}
          x1={POINTS[a][0]}
          y1={POINTS[a][1]}
          x2={POINTS[b][0]}
          y2={POINTS[b][1]}
          pathLength="1"
          style={{ '--i': i }}
        />
      ))}
      {Object.entries(POINTS).map(([name, [x, y]], i) => (
        <g
          key={name}
          ref={(el) => { pointRefs.current[name] = el }}
          className="pose-point"
          style={{ '--i': i, '--jitter': `${1.6 + (i % 5) * 0.37}s` }}
        >
          <circle className="pose-ring" cx={x} cy={y} r="22" />
          <circle className="pose-dot" cx={x} cy={y} r="9" />
        </g>
      ))}
    </svg>
  )
}
