import { useEffect, useRef } from 'react'
import { createScene } from './scene'
import { BLOCK_BOTTOM, BLOCK_SIZE, TALK_RANGE, regionAt } from './world'
import { sfx } from './sfx'

const BASE_HEIGHT = 216 // target base resolution height (≈384×216)

// Player physics, in base pixels and seconds.
const SPEED = 95
const GRAVITY = 1100
const JUMP_VELOCITY = 330 // ≈49px peak: enough for blocks and each 32px ledge
const COYOTE = 0.09 // you can still jump just after walking off a ledge
const JUMP_BUFFER = 0.12 // a jump pressed just before landing still counts
const HEIGHT = 24

/**
 * Drives the journey: one requestAnimationFrame loop reads the controls, runs
 * the platformer physics, follows the player with the camera, positions the
 * DOM overlays and redraws the canvas. React only hears about events (region
 * change, block hit, ledge landed, near Sam/chest), not every frame.
 *
 * `control` is a shared ref: { input: {left, right, jump}, started, paused,
 * chestOpen, command } — the page writes it, the loop reads it.
 */
export function useJourneyLoop({ canvasRef, stageRef, overlays, world, reduced, control, events }) {
  const callbacks = useRef(events)
  useEffect(() => {
    callbacks.current = events
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const stage = stageRef.current
    if (!canvas || !stage || !world) return undefined
    const ctx = canvas.getContext('2d')
    const scene = createScene(ctx)
    let scale = 1

    const startX = world.regions[0].spawn
    const state = {
      time: 0,
      camX: startX,
      player: { x: startX, h: 0, vx: 0, vy: 0, facing: 1, walking: false, walkFrame: 0, airborne: false, blink: false, breathe: false },
      sam: { facing: -1, blink: false, breathe: false },
      blocks: {},
      flags: world.platforms.map(() => 0),
      flagTargets: world.platforms.map(() => 0),
      castleRaise: 0,
      chestOpen: false,
      chestGlow: 0,
      dust: [],
    }
    const p = state.player
    let walkDist = 0
    let lastDust = 0
    let coyote = 0
    let jumpBuffer = 0
    let jumpHeld = false
    let standingOn = null // platform index, or null for the ground
    let nextBlink = 2
    let samNextBlink = 3.3
    let region = null
    let near = null
    let landedOn = null
    let atCastle = false
    let shownDistance = ''

    const resize = () => {
      const vw = stage.clientWidth
      const vh = stage.clientHeight
      const narrow = vw < 640
      scale = Math.max(2, Math.floor(vh / BASE_HEIGHT))
      if (narrow) scale = Math.min(scale, 3)
      const W = Math.ceil(vw / scale)
      const H = Math.ceil(vh / scale)
      const groundH = narrow ? Math.round(H * 0.4) : Math.max(36, Math.round(H * 0.17))
      canvas.width = W
      canvas.height = H
      canvas.style.width = `${W * scale}px`
      canvas.style.height = `${H * scale}px`
      scene.resize(W, H, groundH)
      stage.style.setProperty('--px', `${scale}px`)
      stage.style.setProperty('--ground-top', `${scene.groundY * scale}px`)
      if (reduced) scene.draw(state, world)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(stage)
    resize()
    if (reduced) return () => ro.disconnect()

    // Place a DOM overlay (talk button, bubble, chest button) at a world point.
    const place = (el, x, h) => {
      if (!el) return
      const left = scene.toScreen(x, state.camX) * scale
      const top = (scene.groundY - h) * scale
      el.style.transform = `translate3d(${left}px, ${top}px, 0)`
    }

    const hitBlock = (block) => {
      const st = (state.blocks[block.id] = state.blocks[block.id] || {})
      st.bump = 1
      st.coin = 1
      if (!st.used) sfx.coin()
      st.used = true
      sfx.open()
      callbacks.current.onBlock(block.index)
    }

    const teleport = (x) => {
      p.x = x
      p.h = 0
      p.vx = 0
      p.vy = 0
      standingOn = null
      state.camX = x
    }

    let raf = 0
    let last = 0
    const frame = (now) => {
      const dt = last ? Math.min(0.033, (now - last) / 1000) : 1 / 60
      last = now
      state.time += dt

      const cmd = control.current.command
      if (cmd) {
        control.current.command = null
        if (cmd.type === 'teleport') teleport(cmd.x)
      }
      state.chestOpen = control.current.chestOpen
      if (state.chestOpen && state.chestGlow === 0 && !control.current.chestGlowDone) {
        state.chestGlow = 1
        control.current.chestGlowDone = true
      }
      state.chestGlow = Math.max(0, state.chestGlow - dt / 0.8)

      // ---- input → velocity (frozen on the title screen or while a card is open) ----
      const input = control.current.input
      const canMove = control.current.started && !control.current.paused
      const dir = canMove ? (input.right ? 1 : 0) - (input.left ? 1 : 0) : 0
      p.vx += (dir * SPEED - p.vx) * Math.min(1, dt * 14)
      if (Math.abs(p.vx) < 1 && !dir) p.vx = 0
      if (dir) p.facing = dir

      if (canMove && input.jump && !jumpHeld) jumpBuffer = JUMP_BUFFER
      jumpHeld = canMove && input.jump
      jumpBuffer = Math.max(0, jumpBuffer - dt)

      const grounded = p.h === 0 || standingOn !== null
      coyote = grounded ? COYOTE : Math.max(0, coyote - dt)
      if (jumpBuffer > 0 && coyote > 0) {
        p.vy = JUMP_VELOCITY
        jumpBuffer = 0
        coyote = 0
        standingOn = null
        sfx.jump()
      }

      // ---- horizontal move ----
      const prevX = p.x
      p.x = Math.max(-40, Math.min(world.length - 8, p.x + p.vx * dt))
      if (standingOn !== null) {
        const ledge = world.platforms[standingOn]
        if (p.x < ledge.x1 - 5 || p.x > ledge.x2 + 5) standingOn = null // walked off
      }

      // ---- vertical move + collisions ----
      const prevH = p.h
      if (standingOn === null) {
        p.vy -= GRAVITY * dt
        p.h += p.vy * dt
      }
      // head bonk on a "?" block from below
      if (p.vy > 0) {
        for (const b of world.blocks) {
          const head = p.h + HEIGHT
          if (Math.abs(p.x - b.x) < BLOCK_SIZE / 2 + 4 && prevH + HEIGHT <= BLOCK_BOTTOM && head >= BLOCK_BOTTOM) {
            p.h = BLOCK_BOTTOM - HEIGHT
            p.vy = -30
            hitBlock(b)
            break
          }
        }
      }
      // land on one-way ledges (only from above)
      if (p.vy <= 0 && standingOn === null) {
        world.platforms.forEach((ledge, i) => {
          if (p.x >= ledge.x1 - 5 && p.x <= ledge.x2 + 5 && prevH >= ledge.top && p.h <= ledge.top) {
            p.h = ledge.top
            p.vy = 0
            standingOn = i
          }
        })
      }
      if (p.h <= 0 && standingOn === null) {
        if (prevH > 0) state.dust.push({ x: p.x, h: 0, age: 0 })
        p.h = 0
        p.vy = 0
      }
      p.airborne = standingOn === null && p.h > 0

      // ---- animation ----
      const moved = Math.abs(p.x - prevX)
      p.walking = !p.airborne && moved > 0.05
      walkDist += moved
      p.walkFrame = Math.floor(walkDist / 5)
      if (p.walking && walkDist - lastDust > 14) {
        lastDust = walkDist
        state.dust.push({ x: p.x - p.facing * 6, h: p.h, age: 0 })
      }
      for (const d of state.dust) d.age += dt / 0.35
      state.dust = state.dust.filter((d) => d.age < 1)
      p.breathe = !p.walking && !p.airborne && Math.floor(state.time * 1.6) % 2 === 1
      if (state.time > nextBlink) {
        p.blink = true
        if (state.time > nextBlink + 0.12) { p.blink = false; nextBlink = state.time + 2 + Math.random() * 3 }
      }
      state.sam.facing = p.x < world.sam.x ? -1 : 1
      state.sam.breathe = Math.floor(state.time * 1.3) % 2 === 1
      if (state.time > samNextBlink) {
        state.sam.blink = true
        if (state.time > samNextBlink + 0.12) { state.sam.blink = false; samNextBlink = state.time + 2.5 + Math.random() * 3 }
      }
      for (const st of Object.values(state.blocks)) {
        if (st.bump > 0) st.bump = Math.max(0, st.bump - dt / 0.25)
        if (st.coin > 0) st.coin = Math.max(0, st.coin - dt / 0.6)
      }

      // ---- events for the page ----
      if (standingOn !== landedOn) {
        landedOn = standingOn
        if (standingOn !== null) {
          if (!state.flagTargets[standingOn]) sfx.coin()
          state.flagTargets[standingOn] = 1
          callbacks.current.onLedge(standingOn)
        }
      }
      // flags stay up once you've landed on their ledge
      state.flags = state.flags.map((f, i) => f + (state.flagTargets[i] - f) * Math.min(1, dt * 4))

      const nowNear = Math.abs(p.x - world.sam.x) < TALK_RANGE && p.h < 8
        ? 'sam'
        : Math.abs(p.x - world.chest.x) < TALK_RANGE && p.h < 8 ? 'chest' : null
      if (nowNear !== near) {
        near = nowNear
        callbacks.current.onNear(near)
      }
      const r = regionAt(world, p.x)
      if (r.id !== region) {
        region = r.id
        callbacks.current.onRegion(region)
      }
      const castle = p.x > world.castle.x - 70
      if (castle !== atCastle) {
        atCastle = castle
        callbacks.current.onCastle(castle)
      }
      if (atCastle) state.castleRaise += (1 - state.castleRaise) * Math.min(1, dt * 2)

      // ---- camera follows, eased ----
      const camTarget = Math.max(0, Math.min(world.length - 40, p.x))
      state.camX += (camTarget - state.camX) * Math.min(1, dt * 6)

      // ---- DOM overlays + HUD ----
      place(overlays.sam.current, world.sam.x, HEIGHT + 2)
      place(overlays.chest.current, world.chest.x, 14)
      if (overlays.progress.current) overlays.progress.current.style.transform = `scaleX(${Math.max(0, p.x) / world.length})`
      const distance = `${String(Math.max(0, Math.round(p.x / 4))).padStart(4, '0')}M`
      if (distance !== shownDistance && overlays.distance.current) {
        shownDistance = distance
        overlays.distance.current.textContent = distance
      }

      scene.draw(state, world)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [canvasRef, stageRef, overlays, world, reduced, control])
}
