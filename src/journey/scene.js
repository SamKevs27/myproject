import { PALETTE as C } from './sprites/palette'
import { HERO, SAM, characterFrames } from './sprites/character'
import {
  BUSH, CHEST_CLOSED, CHEST_OPEN, CLOUD, COIN, DIRT_TILE, DUST, FLAG, GROUND_TILE,
  PALM_FRONDS, QUESTION_BLOCK, USED_BLOCK,
} from './sprites/scenery'
import { drawSprite, spriteCanvas } from './renderSprite'
import { BLOCK_BOTTOM, BLOCK_SIZE } from './world'

const mod = (n, m) => ((n % m) + m) % m

// Seeded pseudo-random so the scenery is the same on every visit.
function rng(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

/* ---------- prerendered, seamlessly tiling parallax strips ---------- */

// Stepped mountain range: heights snap to 4px stairs for the 8-bit look.
function mountainStrip(width, height, peaks, body, edge, seed) {
  const c = makeCanvas(width, height)
  const ctx = c.getContext('2d')
  const rand = rng(seed)
  const list = Array.from({ length: peaks }, (_, i) => ({
    x: ((i + 0.3 + rand() * 0.4) / peaks) * width,
    h: height * (0.45 + rand() * 0.55),
  }))
  for (let x = 0; x < width; x++) {
    let h = 0
    for (const p of list) {
      for (const shift of [-width, 0, width]) h = Math.max(h, p.h - Math.abs(x - (p.x + shift)) * 0.9)
    }
    h = Math.floor(h / 4) * 4
    if (h <= 0) continue
    ctx.fillStyle = body
    ctx.fillRect(x, height - h, 1, h)
    ctx.fillStyle = edge
    ctx.fillRect(x, height - h, 1, 2)
  }
  return c
}

// Blocky jungle canopy behind the palms.
function treeStrip(width, height, seed) {
  const c = makeCanvas(width, height)
  const ctx = c.getContext('2d')
  const rand = rng(seed)
  for (let x = -12; x < width + 12; x += 18 + Math.floor(rand() * 10)) {
    const h = Math.floor(height * (0.55 + rand() * 0.4))
    const top = height - h
    ctx.fillStyle = C.brown1
    ctx.fillRect(x + 7, top + 12, 4, h - 12)
    const blobs = [[0, 6, 18, 10], [3, 0, 12, 8], [-3, 10, 24, 8]]
    for (const [bx, by, bw, bh] of blobs) {
      for (const xx of [x, x + width, x - width]) {
        ctx.fillStyle = C.green1
        ctx.fillRect(xx + bx - 1, top + by - 1, bw + 2, bh + 2)
        ctx.fillStyle = C.green2
        ctx.fillRect(xx + bx, top + by, bw, bh)
        ctx.fillStyle = C.green3
        ctx.fillRect(xx + bx + 2, top + by + 1, Math.max(2, bw - 8), 2)
      }
    }
  }
  return c
}

// Palms and bushes standing on the ground line.
function palmStrip(width, height, seed) {
  const c = makeCanvas(width, height)
  const ctx = c.getContext('2d')
  const rand = rng(seed)
  const fronds = spriteCanvas(PALM_FRONDS)
  const bush = spriteCanvas(BUSH)
  for (let x = 20; x < width; x += 90 + Math.floor(rand() * 70)) {
    const trunk = Math.floor(height * (0.5 + rand() * 0.3))
    const lean = rand() < 0.5 ? -1 : 1
    for (let y = 0; y < trunk; y += 3) {
      const tx = x + Math.floor((y / trunk) ** 2 * 6) * lean
      ctx.fillStyle = C.outline
      ctx.fillRect(tx - 1, height - y - 3, 6, 3)
      ctx.fillStyle = (y / 3) % 2 ? C.brown2 : C.brown1
      ctx.fillRect(tx, height - y - 3, 4, 3)
    }
    const topX = x + 6 * lean
    ctx.drawImage(fronds, topX - 14, height - trunk - 8)
    if (rand() < 0.8) ctx.drawImage(bush, x + 20 + Math.floor(rand() * 30), height - bush.height)
  }
  return c
}

/* ---------- checkpoint props ---------- */

function drawFlagpole(ctx, x, groundY, raise, height = 60) {
  ctx.fillStyle = C.outline
  ctx.fillRect(x - 1, groundY - height - 4, 4, height + 4)
  ctx.fillStyle = C.white
  ctx.fillRect(x, groundY - height, 2, height)
  ctx.fillStyle = C.yellow
  ctx.fillRect(x - 1, groundY - height - 5, 4, 4)
  const flagY = groundY - 12 - Math.round(raise * (height - 16))
  drawSprite(ctx, FLAG, x + 2, flagY)
}

// floating grass ledge (one-way platform) with a little hanging dirt
function drawLedge(ctx, x1, x2, topY) {
  const w = x2 - x1
  ctx.fillStyle = C.outline
  ctx.fillRect(x1 - 1, topY - 1, w + 2, 14)
  ctx.fillStyle = C.brown2
  ctx.fillRect(x1, topY + 4, w, 8)
  ctx.fillStyle = C.brown1
  for (let x = x1 + 3; x < x2 - 2; x += 7) ctx.fillRect(x, topY + 7, 2, 2)
  ctx.fillStyle = C.green3
  ctx.fillRect(x1, topY, w, 4)
  ctx.fillStyle = C.green4
  for (let x = x1 + 1; x < x2; x += 4) ctx.fillRect(x, topY, 2, 1)
  ctx.fillStyle = C.outline
  ctx.fillRect(x1 + 6, topY + 13, w - 12, 2)
  ctx.fillStyle = C.brown1
  ctx.fillRect(x1 + 7, topY + 13, w - 14, 1)
}

function drawCastle(ctx, x, groundY) {
  const w = 64
  const h = 52
  const top = groundY - h
  ctx.fillStyle = C.outline
  ctx.fillRect(x - 1, top - 1, w + 2, h + 1)
  ctx.fillStyle = C.stone2
  ctx.fillRect(x, top, w, h)
  ctx.fillStyle = C.stone1
  for (let row = 0; row < h; row += 6) {
    ctx.fillRect(x, top + row, w, 1)
    for (let col = (row / 6) % 2 ? 4 : 0; col < w; col += 8) ctx.fillRect(x + col, top + row, 1, 6)
  }
  // battlements
  for (let col = 0; col < w; col += 12) {
    ctx.fillStyle = C.outline
    ctx.fillRect(x + col - 1, top - 9, 8, 9)
    ctx.fillStyle = C.stone2
    ctx.fillRect(x + col, top - 8, 6, 8)
  }
  // door + window
  ctx.fillStyle = C.outline
  ctx.fillRect(x + w / 2 - 8, groundY - 22, 16, 22)
  ctx.fillRect(x + w / 2 - 4, top + 10, 8, 10)
  ctx.fillStyle = C.yellow
  ctx.fillRect(x + w / 2 - 3, top + 11, 6, 8)
}

/**
 * The jungle level, drawn to a small canvas at base resolution. `resize(W, H,
 * groundH)` rebuilds the strips; `draw(state)` renders one frame.
 */
/**
 * The jungle level, drawn to a small canvas at base resolution. `resize(W, H,
 * groundH)` rebuilds the strips; `draw(state, world)` renders one frame with
 * the camera centred on `state.camX`.
 */
export function createScene(ctx) {
  const hero = characterFrames(HERO)
  const sam = characterFrames(SAM)
  let W = 0
  let H = 0
  let groundY = 0
  let strips = null

  const tile = (img, offset, y) => {
    const start = -mod(Math.round(offset), img.width)
    for (let x = start; x < W; x += img.width) ctx.drawImage(img, x, Math.round(y))
  }

  const pickFrame = (frames, c) => {
    if (c.airborne) return frames.jump
    if (c.walking) return frames.walk[c.walkFrame % 4]
    if (c.blink) return frames.blink
    if (c.breathe) return frames.breathe
    return frames.idle
  }

  return {
    resize(width, height, groundHeight) {
      W = width
      H = height
      groundY = H - groundHeight
      const back = Math.round(groundY * 0.55)
      strips = {
        far: mountainStrip(512, back, 5, C.mountainFar, '#a8d0dc', 7),
        near: mountainStrip(448, Math.round(back * 0.75), 4, C.mountain1, C.mountain2, 19),
        trees: treeStrip(320, Math.round(groundY * 0.22), 31),
        palms: palmStrip(560, Math.round(groundY * 0.62), 53),
      }
    },

    get groundY() { return groundY },
    get width() { return W },

    // world x → screen x at base resolution
    toScreen(x, camX) { return Math.round(x - camX + W / 2) },

    draw(s, world) {
      ctx.imageSmoothingEnabled = false
      const cam = s.camX
      const sx = (x) => Math.round(x - cam + W / 2)

      // sky: two flat bands, no gradients
      ctx.fillStyle = C.sky
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = C.skyLow
      ctx.fillRect(0, Math.round(groundY * 0.62), W, H)

      // clouds drift on their own and creep past with the camera
      const cloud = spriteCanvas(CLOUD)
      const cloudBand = 420
      const cloudOffset = cam * 0.1 + s.time * 3
      for (const [cxw, cy] of [[30, 0.08], [190, 0.2], [320, 0.04]]) {
        for (let k = -1; k <= Math.ceil(W / cloudBand); k++) {
          const x = Math.round(cxw + k * cloudBand - mod(cloudOffset, cloudBand))
          ctx.drawImage(cloud, x, Math.round(groundY * cy) + 6)
        }
      }

      tile(strips.far, cam * 0.15, groundY - strips.far.height)
      tile(strips.near, cam * 0.3, groundY - strips.near.height)
      tile(strips.trees, cam * 0.55, groundY - strips.trees.height)
      tile(strips.palms, cam * 0.8, groundY - strips.palms.height)

      // ground: grass row, then dirt to the bottom
      const groundTile = spriteCanvas(GROUND_TILE)
      const dirt = spriteCanvas(DIRT_TILE)
      tile(groundTile, cam, groundY)
      for (let y = groundY + 16; y < H; y += 16) tile(dirt, cam, y)

      // skill blocks
      world.blocks.forEach((b) => {
        const st = s.blocks[b.id] || {}
        const bump = st.bump > 0 ? -Math.round(Math.sin(st.bump * Math.PI) * 5) : 0
        const top = groundY - BLOCK_BOTTOM - BLOCK_SIZE + bump
        drawSprite(ctx, st.used ? USED_BLOCK : QUESTION_BLOCK, sx(b.x) - 8, top)
        if (st.coin > 0) drawSprite(ctx, COIN, sx(b.x) - 4, top - 10 - Math.round((1 - st.coin) * 24))
      })

      // treasure chest
      const chestX = sx(world.chest.x) - 8
      drawSprite(ctx, s.chestOpen ? CHEST_OPEN : CHEST_CLOSED, chestX, groundY - 12)
      if (s.chestGlow > 0) {
        ctx.fillStyle = C.yellow
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + s.time * 3
          const r = 10 + (1 - s.chestGlow) * 18
          ctx.fillRect(chestX + 8 + Math.round(Math.cos(a) * r), groundY - 14 + Math.round(Math.sin(a) * r * 0.6), 2, 2)
        }
      }

      // parkour ledges, each with a flag that raises once you land on it
      world.platforms.forEach((p, i) => {
        const topY = groundY - p.top
        drawLedge(ctx, sx(p.x1), sx(p.x2), topY)
        drawFlagpole(ctx, sx(p.x2) - 10, topY, s.flags[i] || 0, 30)
      })

      // castle
      drawFlagpole(ctx, sx(world.castle.x) - 34, groundY, s.castleRaise || 0, 80)
      drawCastle(ctx, sx(world.castle.x) + 30, groundY)

      // Sam, the NPC: idles and turns to face you
      drawSprite(ctx, pickFrame(sam, s.sam), sx(world.sam.x) - 8, groundY - 24, { flip: s.sam.facing < 0 })

      // dust puffs stay where they were kicked up
      for (const p of s.dust) {
        drawSprite(ctx, DUST[p.age > 0.5 ? 1 : 0], sx(p.x) - 2, groundY - p.h - 3 - Math.round(p.age * 3))
      }

      // the player
      const pl = s.player
      drawSprite(ctx, pickFrame(hero, pl), sx(pl.x) - 8, groundY - 24 - Math.round(pl.h), { flip: pl.facing < 0 })
    },
  }
}
