import { PALETTE as C } from './sprites/palette'
import { characterFrames } from './sprites/character'
import {
  BUSH, CHEST_CLOSED, CHEST_OPEN, CLOUD, COIN, DIRT_TILE, DUST, FLAG, GROUND_TILE,
  PALM_FRONDS, QUESTION_BLOCK, USED_BLOCK,
} from './sprites/scenery'
import { drawSprite, spriteCanvas } from './renderSprite'

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

function drawSign(ctx, x, groundY) {
  ctx.fillStyle = C.outline
  ctx.fillRect(x + 6, groundY - 22, 4, 22)
  ctx.fillStyle = C.brown1
  ctx.fillRect(x + 7, groundY - 22, 2, 22)
  ctx.fillStyle = C.outline
  ctx.fillRect(x - 3, groundY - 34, 22, 14)
  ctx.fillStyle = C.brown2
  ctx.fillRect(x - 2, groundY - 33, 20, 12)
  ctx.fillStyle = C.brown1
  ctx.fillRect(x, groundY - 30, 16, 2)
  ctx.fillRect(x, groundY - 26, 11, 2)
}

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
export function createScene(ctx) {
  const frames = characterFrames()
  let W = 0
  let H = 0
  let groundY = 0
  let strips = null

  const tile = (img, offset, y) => {
    const start = -mod(Math.round(offset), img.width)
    for (let x = start; x < W; x += img.width) ctx.drawImage(img, x, Math.round(y))
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

    draw(s) {
      ctx.imageSmoothingEnabled = false
      const cx = Math.round(W / 2)

      // sky: two flat bands, no gradients
      ctx.fillStyle = C.sky
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = C.skyLow
      ctx.fillRect(0, Math.round(groundY * 0.62), W, H)

      // clouds drift on their own and creep past with the world
      const cloud = spriteCanvas(CLOUD)
      const cloudBand = 420
      const cloudOffset = s.worldX * 0.1 + s.time * 3
      for (const [cxw, cy] of [[30, 0.1], [190, 0.22], [320, 0.06]]) {
        for (let k = -1; k <= Math.ceil(W / cloudBand); k++) {
          const x = Math.round(cxw + k * cloudBand - mod(cloudOffset, cloudBand))
          ctx.drawImage(cloud, x, Math.round(groundY * cy) + 6)
        }
      }

      tile(strips.far, s.worldX * 0.15, groundY - strips.far.height)
      tile(strips.near, s.worldX * 0.3, groundY - strips.near.height)
      tile(strips.trees, s.worldX * 0.55, groundY - strips.trees.height)
      tile(strips.palms, s.worldX * 0.8, groundY - strips.palms.height)

      // ground: grass row, then dirt to the bottom
      const groundTile = spriteCanvas(GROUND_TILE)
      const dirt = spriteCanvas(DIRT_TILE)
      tile(groundTile, s.worldX, groundY)
      for (let y = groundY + 16; y < H; y += 16) tile(dirt, s.worldX, y)

      // checkpoint props
      for (const cp of s.checkpoints) {
        const sx = Math.round(cp.x - s.worldX + cx)
        if (sx < -90 || sx > W + 90) continue
        const st = s.props[cp.id] || {}
        if (cp.kind === 'sign') drawSign(ctx, sx + 22, groundY)
        else if (cp.kind === 'flag') drawFlagpole(ctx, sx + 26, groundY, st.raise || 0)
        else if (cp.kind === 'block') {
          const bump = st.bump > 0 ? -Math.round(Math.sin(st.bump * Math.PI) * 5) : 0
          drawSprite(ctx, st.opened ? USED_BLOCK : QUESTION_BLOCK, sx - 8, groundY - 58 + bump)
          if (st.coin > 0) drawSprite(ctx, COIN, sx - 4, groundY - 66 - Math.round((1 - st.coin) * 22))
        } else if (cp.kind === 'chest') {
          drawSprite(ctx, st.opened ? CHEST_OPEN : CHEST_CLOSED, sx + 18, groundY - 12)
          if (st.coin > 0) drawSprite(ctx, COIN, sx + 22, groundY - 22 - Math.round((1 - st.coin) * 22))
        } else if (cp.kind === 'castle') {
          drawFlagpole(ctx, sx - 34, groundY, st.raise || 0, 80)
          drawCastle(ctx, sx + 30, groundY)
        }
      }

      // dust puffs stay where they were kicked up
      for (const p of s.dust) {
        drawSprite(ctx, DUST[p.age > 0.5 ? 1 : 0], Math.round(p.x - s.worldX + cx) - 2, groundY - 3 - Math.round(p.age * 3))
      }

      // the character
      let sprite = frames.idle
      if (s.walking) sprite = frames.walk[s.walkFrame % 4]
      else if (s.blink) sprite = frames.blink
      else if (s.breathe) sprite = frames.breathe
      drawSprite(ctx, sprite, cx - 8, groundY - 24 - Math.round(s.jump), { flip: s.facing < 0 })
    },
  }
}
