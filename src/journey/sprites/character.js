import { PALETTE } from './palette'

/*
 * Characters are 16×24, facing right, drawn as rows of characters.
 * Two looks share the same body: SAM (the NPC you meet) and HERO (the player).
 * Customize them here: colours are plain hex, glasses is a toggle.
 */
export const SAM = {
  hair: '#2a1a14',
  hairShine: '#5a3a28',
  skin: '#e8a878',
  skinShade: '#b8704c',
  shirt: '#2a2440',
  shirtShade: '#17132a',
  pants: '#34508a',
  pantsShade: '#22345e',
  shoes: '#6a3018',
  glasses: false,
}

export const HERO = {
  cap: '#2f6fd6', // hero wears a cap; hair peeks out underneath
  capShine: '#6aa2f8',
  hair: '#7a4418',
  hairShine: '#7a4418',
  skin: '#f0b888',
  skinShade: '#c07850',
  shirt: '#d83a2c',
  shirtShade: '#8e1e16',
  pants: '#6b4a2a',
  pantsShade: '#43301a',
  shoes: '#2a1a14',
  glasses: false,
}

// Legend: . transparent  o outline  h hair  H hair shine  s skin  S skin shade
//         e eye  g glasses  t shirt  T shirt shade  p pants  P pants shade  b shoes
const HEAD = [
  '......oooo......',
  '....oohhhhoo....',
  '...ohhhhhhhho...',
  '..ohhHhhhhhhho..',
  '..ohhhhhhhhhho..',
  '..ohhhhhssshho..',
  '..ohhhsssesseo..',
  '...ohSssssssso..',
  '....oSsssssso...',
  '.....ooSsSoo....',
]

// eyes closed for the blink frame
const HEAD_BLINK = HEAD.map((row, i) => (i === 6 ? row.replace(/e/g, 'S') : row))

const HEAD_GLASSES = HEAD.map((row, i) => (i === 6 ? '..ohhhsssgggggo.' : row))

// cap with a brim pointing forward; k = hair under the cap
const HEAD_CAP = [
  '......oooo......',
  '....oohhhhoo....',
  '...ohhHHhhhho...',
  '..ohhhhhhhhhho..',
  '..oooooooooooooo',
  '..okkkssssssso..',
  '..okksssesseo...',
  '...okSssssssso..',
  '....oSsssssso...',
  '.....ooSsSoo....',
]
const HEAD_CAP_BLINK = HEAD_CAP.map((row, i) => (i === 6 ? row.replace(/e/g, 'S') : row))

const TORSO_IDLE = [
  '....otttttto....',
  '...otttttttTo...',
  '..ottttttttTTo..',
  '..otototttoTto..',
  '..osotttttoTso..',
  '..osottttttoSo..',
  '...oottttttoo...',
  '....oTTTTTTo....',
]

const TORSO_SWING_A = [
  '....otttttto....',
  '...otttttttTo...',
  '..ottttttttTo...',
  '.otttottttoTo...',
  'osso.otttttoto..',
  'oSo..ottttttoso.',
  '.o...ottttttoSo.',
  '.....oTTTTTToo..',
]

const TORSO_SWING_B = [
  '....otttttto....',
  '...otttttttTo...',
  '...ottttttttTo..',
  '...oTottttottto.',
  '..otottttto.osso',
  '.osoottttto..oSo',
  '.oSoottttto...o.',
  '..ooTTTTTTo.....',
]

const LEGS_IDLE = [
  '.....opppppo....',
  '.....oppPppo....',
  '.....oppoPpo....',
  '.....oppooPpo...',
  '.....obbo.obbo..',
  '....obbbo.obbbo.',
]

// walk cycle: contact, passing, contact (other leg), passing
const LEGS_WALK = [
  [
    '.....opppppo....',
    '....opppPpppo...',
    '...opppo.oPppo..',
    '..opppo...oPppo.',
    '.obbbo.....obbo.',
    'obbbo.......obbo',
  ],
  [
    '.....opppppo....',
    '.....oppPppo....',
    '.....opppPpo....',
    '......oppPo.....',
    '......obbbo.....',
    '.....obbbbo.....',
  ],
  [
    '.....opppppo....',
    '....oPpppPppo...',
    '...oPpo..opppo..',
    '..oPpo....opppo.',
    '.obbo......obbbo',
    'obbo........obbo',
  ],
  [
    '.....opppppo....',
    '.....oppPppo....',
    '.....oPpppo.....',
    '.....oPpPo......',
    '.....obbbo......',
    '....obbbbo......',
  ],
]

function colours(look) {
  const capped = Boolean(look.cap)
  return {
    o: PALETTE.outline,
    h: capped ? look.cap : look.hair,
    H: capped ? look.capShine : look.hairShine,
    k: look.hair,
    s: look.skin, S: look.skinShade,
    e: PALETTE.outline, g: PALETTE.outline, t: look.shirt, T: look.shirtShade,
    p: look.pants, P: look.pantsShade, b: look.shoes,
  }
}

function head(look, blink) {
  if (look.cap) return blink ? HEAD_CAP_BLINK : HEAD_CAP
  if (look.glasses) return HEAD_GLASSES
  return blink ? HEAD_BLINK : HEAD
}

const framesCache = new Map()

// Each frame is { rows, colours }; renderSprite turns it into a canvas.
export function characterFrames(look) {
  if (framesCache.has(look)) return framesCache.get(look)
  const map = colours(look)
  const frame = (h, torso, legs) => ({ rows: [...h, ...torso, ...legs], colours: map })
  const frames = {
    idle: frame(head(look, false), TORSO_IDLE, LEGS_IDLE),
    blink: frame(head(look, true), TORSO_IDLE, LEGS_IDLE),
    // breathing: head and torso sink one pixel onto the legs
    breathe: { rows: ['.'.repeat(16), ...head(look, false), ...TORSO_IDLE.slice(0, 7), ...LEGS_IDLE], colours: map },
    // mid-air: legs tucked, arms up
    jump: frame(head(look, false), TORSO_SWING_B, LEGS_WALK[0]),
    // arms swing on the contact frames and pass the body on the others
    walk: LEGS_WALK.map((legs, i) => frame(head(look, false), [TORSO_SWING_A, TORSO_IDLE, TORSO_SWING_B, TORSO_IDLE][i], legs)),
  }
  framesCache.set(look, frames)
  return frames
}
