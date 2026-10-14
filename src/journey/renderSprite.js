const cache = new WeakMap()

/**
 * Turns a { rows, colours } pixel sprite into a canvas (cached), at 1 pixel
 * per character. Draw it with imageSmoothingEnabled = false at integer
 * positions so it stays crisp.
 */
export function spriteCanvas(sprite) {
  const hit = cache.get(sprite)
  if (hit) return hit
  const h = sprite.rows.length
  const w = Math.max(...sprite.rows.map((r) => r.length))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  sprite.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const colour = sprite.colours[row[x]]
      if (!colour) continue
      ctx.fillStyle = colour
      ctx.fillRect(x, y, 1, 1)
    }
  })
  cache.set(sprite, canvas)
  return canvas
}

// Draw a sprite at whole-pixel coordinates, optionally mirrored.
export function drawSprite(ctx, sprite, x, y, { flip = false } = {}) {
  const img = spriteCanvas(sprite)
  const px = Math.round(x)
  const py = Math.round(y)
  if (!flip) {
    ctx.drawImage(img, px, py)
    return
  }
  ctx.save()
  ctx.translate(px + img.width, py)
  ctx.scale(-1, 1)
  ctx.drawImage(img, 0, 0)
  ctx.restore()
}

// A sprite as a PNG data URL, for DOM use (HUD coin, favicon-like bits).
export function spriteDataUrl(sprite) {
  return spriteCanvas(sprite).toDataURL('image/png')
}
