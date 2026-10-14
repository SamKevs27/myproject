import { useEffect, useRef } from 'react'
import { createScene } from './scene'
import { SCROLL_PER_UNIT, activeCheckpoint } from './world'
import { sfx } from './sfx'

const BASE_HEIGHT = 216 // target base resolution height (≈384×216)

/**
 * Drives the journey: one requestAnimationFrame loop reads the scroll position,
 * moves the character, updates HUD bits directly in the DOM and redraws the
 * canvas. React state only changes when the active checkpoint/section changes.
 */
export function useJourneyLoop({ canvasRef, stageRef, titleRef, progressRef, distanceRef, world, reduced, onActive, onSection }) {
  // keep the latest callbacks without restarting the loop
  const callbacks = useRef({ onActive, onSection })
  useEffect(() => {
    callbacks.current = { onActive, onSection }
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const stage = stageRef.current
    if (!canvas || !stage || !world) return undefined
    const ctx = canvas.getContext('2d')
    const scene = createScene(ctx)

    const state = {
      worldX: Math.min(world.length, window.scrollY / SCROLL_PER_UNIT),
      time: 0,
      walking: false,
      walkFrame: 0,
      facing: 1,
      blink: false,
      breathe: false,
      jump: 0,
      dust: [],
      props: {},
      checkpoints: world.checkpoints,
    }
    let walkDist = 0
    let lastDust = 0
    let movedAt = -1
    let nextBlink = 2
    let jumpStart = -1
    let active = null
    let section = null
    let shownDistance = ''
    const reached = new Set()

    const resize = () => {
      const vw = stage.clientWidth
      const vh = stage.clientHeight
      const narrow = vw < 640
      let scale = Math.max(2, Math.floor(vh / BASE_HEIGHT))
      if (narrow) scale = Math.min(scale, 3)
      const W = Math.ceil(vw / scale)
      const H = Math.ceil(vh / scale)
      const groundH = narrow ? Math.round(H * 0.46) : Math.max(36, Math.round(H * 0.17))
      canvas.width = W
      canvas.height = H
      canvas.style.width = `${W * scale}px`
      canvas.style.height = `${H * scale}px`
      scene.resize(W, H, groundH)
      stage.style.setProperty('--px', `${scale}px`)
      stage.style.setProperty('--ground-top', `${scene.groundY * scale}px`)
      stage.style.setProperty('--char-top', `${(scene.groundY - 30) * scale}px`)
      if (reduced) scene.draw(state)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(stage)
    resize()
    if (reduced) return () => ro.disconnect()

    const reach = (cp) => {
      if (reached.has(cp.id)) return
      reached.add(cp.id)
      const prop = (state.props[cp.id] = state.props[cp.id] || {})
      if (cp.kind === 'block') {
        jumpStart = state.time
        prop.hitAt = state.time + 0.18
        sfx.jump()
      } else if (cp.kind === 'chest') {
        prop.opened = true
        prop.coin = 1
        sfx.open()
      }
    }

    let raf = 0
    let last = 0
    const frame = (now) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      state.time += dt

      // scroll → world position, eased so jumps in scroll still read as walking
      const target = Math.max(0, Math.min(world.length, window.scrollY / SCROLL_PER_UNIT))
      const prev = state.worldX
      state.worldX += (target - state.worldX) * Math.min(1, dt * 12)
      if (Math.abs(target - state.worldX) < 0.05) state.worldX = target
      const dx = state.worldX - prev

      if (Math.abs(dx) > 0.05) {
        movedAt = state.time
        state.facing = dx > 0 ? 1 : -1
        walkDist += Math.abs(dx)
        if (walkDist - lastDust > 12) {
          lastDust = walkDist
          state.dust.push({ x: state.worldX - state.facing * 6, age: 0 })
        }
      }
      state.walking = state.time - movedAt < 0.1
      state.walkFrame = Math.floor(walkDist / 5)
      for (const p of state.dust) p.age += dt / 0.35
      state.dust = state.dust.filter((p) => p.age < 1)

      // idle: breathe and blink now and then
      state.breathe = !state.walking && Math.floor(state.time * 1.6) % 2 === 1
      if (state.time > nextBlink) {
        state.blink = true
        if (state.time > nextBlink + 0.12) {
          state.blink = false
          nextBlink = state.time + 2 + Math.random() * 3
        }
      }

      // jump arc when a "?" block is hit
      if (jumpStart >= 0) {
        const t = (state.time - jumpStart) / 0.4
        state.jump = t < 1 ? Math.sin(Math.PI * t) * 14 : 0
        if (t >= 1) jumpStart = -1
      }

      // prop animations: flags raise, blocks bump, coins rise
      for (const cp of world.checkpoints) {
        const prop = state.props[cp.id]
        if (!prop) continue
        if (prop.hitAt && state.time >= prop.hitAt) {
          prop.hitAt = 0
          prop.opened = true
          prop.bump = 1
          prop.coin = 1
          sfx.open()
        }
        if (prop.bump > 0) prop.bump = Math.max(0, prop.bump - dt / 0.25)
        if (prop.coin > 0) prop.coin = Math.max(0, prop.coin - dt / 0.6)
        if (prop.raiseTo !== undefined) prop.raise = (prop.raise || 0) + (prop.raiseTo - (prop.raise || 0)) * Math.min(1, dt * 3)
      }

      // which checkpoint / section are we at?
      const cp = activeCheckpoint(world.checkpoints, state.worldX)
      if (cp) {
        reach(cp)
        if (cp.kind === 'flag' || cp.kind === 'castle') {
          const prop = (state.props[cp.id] = state.props[cp.id] || {})
          prop.raiseTo = 1
        }
      }
      if ((cp?.id || null) !== active) {
        active = cp?.id || null
        callbacks.current.onActive(active)
      }
      let current = null
      for (const c of world.checkpoints) if (c.x - 46 <= state.worldX) current = c.section
      if (current !== section) {
        section = current
        callbacks.current.onSection(current)
      }

      // HUD + title, written straight to the DOM
      const title = titleRef.current
      if (title) {
        const o = Math.max(0, 1 - state.worldX / 50)
        title.style.opacity = o
        title.style.visibility = o < 0.02 ? 'hidden' : 'visible'
      }
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${state.worldX / world.length})`
      const distance = `${String(Math.round(state.worldX / 4)).padStart(4, '0')}M`
      if (distance !== shownDistance && distanceRef.current) {
        shownDistance = distance
        distanceRef.current.textContent = distance
      }

      scene.draw(state)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [canvasRef, stageRef, titleRef, progressRef, distanceRef, world, reduced])
}
