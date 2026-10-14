// Shared palette for the canvas animations; mirrors the CSS tokens in App.css.
// Glitch-pop neon: electric purple brand, magenta + cyan neon pair, gold accents.
export const COLORS = {
  violet: [192, 64, 255],
  lavender: [233, 166, 255],
  cyan: [46, 242, 255],
  pink: [255, 43, 214],
  amber: [255, 178, 56],
  white: [253, 244, 255],
}

export const rgba = ([r, g, b], a) => `rgba(${r}, ${g}, ${b}, ${a})`

// Linear blend between two colours, t in 0–1.
export const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
