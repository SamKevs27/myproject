import { PALETTE } from './palette'

/*
 * The player character: 16×24, facing right, drawn as rows of characters.
 * Customize the look here — colours are plain hex, glasses is a toggle.
 */
export const CHARACTER = {
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

function colours() {
  const c = CHARACTER
  return {
    o: PALETTE.outline, h: c.hair, H: c.hairShine, s: c.skin, S: c.skinShade,
    e: PALETTE.outline, g: PALETTE.outline, t: c.shirt, T: c.shirtShade,
    p: c.pants, P: c.pantsShade, b: c.shoes,
  }
}

function head(blink) {
  if (CHARACTER.glasses) return HEAD_GLASSES
  return blink ? HEAD_BLINK : HEAD
}

// Each frame is { rows, colours }; renderSprite turns it into a canvas.
export function characterFrames() {
  const map = colours()
  const frame = (h, torso, legs) => ({ rows: [...h, ...torso, ...legs], colours: map })
  return {
    idle: frame(head(false), TORSO_IDLE, LEGS_IDLE),
    blink: frame(head(true), TORSO_IDLE, LEGS_IDLE),
    // breathing: head and torso sink one pixel onto the legs
    breathe: { rows: ['.'.repeat(16), ...head(false), ...TORSO_IDLE.slice(0, 7), ...LEGS_IDLE], colours: map },
    // arms swing on the contact frames and pass the body on the others
    walk: LEGS_WALK.map((legs, i) => frame(head(false), [TORSO_SWING_A, TORSO_IDLE, TORSO_SWING_B, TORSO_IDLE][i], legs)),
  }
}
