import { PALETTE as C } from './palette'

// All original pixel art. Legend per sprite in its `colours` map; '.' is transparent.

export const CLOUD = {
  colours: { o: C.cloudShade, w: C.white, c: C.cloudShade },
  rows: [
    '..........oooooo................',
    '........oowwwwwwoo..............',
    '.......owwwwwwwwwwo...ooooo.....',
    '.....oowwwwwwwwwwwwoooowwwwoo...',
    '....owwwwwwwwwwwwwwwwwwwwwwwwo..',
    '..oowwwwwwwwwwwwwwwwwwwwwwwwwwo.',
    '.owwwwwwwwwwwwwwwwwwwwwwwwwwwwwo',
    'owwwwwwwwwwwwwwwwwwwwwwwwwwwwwwo',
    'owwwccwwwwwwwwwcccwwwwwwwwwcwwwo',
    '.occcccccwwwwccccccccwwwwccccco.',
    '..oooooooccccooooooooccccoooo...',
    '.........oooo........oooo.......',
  ],
}

export const BUSH = {
  colours: { o: C.green1, d: C.green2, g: C.green3, l: C.green4 },
  rows: [
    '.......oooo.....oooo....',
    '.....oogglgoo.oogglgo...',
    '....oggllggggogglllggo..',
    '...ogglgggggggggggggggo.',
    '..oggggggddgggggggdgggo.',
    '.oggdgggggggggdgggggggdo',
    '.ogggggdggggggggggdggggo',
    'oggddgggggdddggggggdddgo',
    'odddddddddddddddddddddo.',
    '.oooooooooooooooooooooo.',
  ],
}

export const PALM_FRONDS = {
  colours: { o: C.green1, d: C.green2, g: C.green3, l: C.green4, b: C.brown1 },
  rows: [
    '..........oooo....oooo..........',
    '.......oooggllo..ollggooo.......',
    '.....ooggglllggooggllggggoo.....',
    '...oogggggggggggggggggggggggoo..',
    '..ogggllgggooogggggoooggglggggo.',
    '.ogglgggoooo..obbbbo..oooogggggo',
    'ogglggoo......obbbbo......oogggo',
    'oggggo.......obbbbbbo.......oggo',
    'ogggo........ob.bb.bo........ogo',
    'oggo..................ooo.....oo',
    'ogo..................oggo.......',
    'oo...................ogo........',
    '.....................oo.........',
  ],
}

export const GROUND_TILE = {
  colours: { o: C.green1, g: C.green3, l: C.green4, d: C.brown1, b: C.brown2 },
  rows: [
    'lllgllllgllllglg',
    'gggggggggggggggg',
    'ggoggggoggggoggg',
    'oooooooooooooooo',
    'bbbbbbbbbbbbbbbb',
    'bbdbbbbbbbbdbbbb',
    'bbbbbbbbbbbbbbbb',
    'bbbbbbdbbbbbbbbd',
    'bbbbbbbbbbbbbbbb',
    'bdbbbbbbbbdbbbbb',
    'bbbbbbbbbbbbbbbb',
    'bbbbbdbbbbbbbbbb',
    'bbbbbbbbbbbbbdbb',
    'bbbdbbbbbbbbbbbb',
    'bbbbbbbbdbbbbbbb',
    'bbbbbbbbbbbbbbbb',
  ],
}

export const DIRT_TILE = {
  colours: { d: C.brown1, b: C.brown2 },
  rows: GROUND_TILE.rows.slice(4).concat(GROUND_TILE.rows.slice(4, 8)),
}

export const QUESTION_BLOCK = {
  colours: { o: C.outline, y: C.yellow, d: C.yellowDark, w: C.white },
  rows: [
    'oooooooooooooooo',
    'oywyyyyyyyyyyywo',
    'oyyyyyoooooyyydo',
    'oyyyyoowwwooyydo',
    'oyyyyowwoowwoydo',
    'oyyyyowwoowwoydo',
    'oyyyyyoooowwoydo',
    'oyyyyyyyoowwoydo',
    'oyyyyyyowwooyydo',
    'oyyyyyyowwoyyydo',
    'oyyyyyyyooyyyydo',
    'oyyyyyyowwoyyydo',
    'oyyyyyyowwoyyydo',
    'oywyyyyyooyyyywo',
    'oddddddddddddddo',
    'oooooooooooooooo',
  ],
}

// a "?" block after it's been hit
export const USED_BLOCK = {
  colours: { o: C.outline, b: C.brown2, d: C.brown1 },
  rows: QUESTION_BLOCK.rows.map((row, i) => {
    if (i === 0 || i === 15) return row
    if (i === 14) return 'oddddddddddddddo'
    return 'obbbbbbbbbbbbbdo'
  }),
}

export const CHEST_CLOSED = {
  colours: { o: C.outline, b: C.brown2, d: C.brown1, y: C.yellow },
  rows: [
    '..oooooooooooo..',
    '.obbbbbbbbbbbbo.',
    'obbbbbbbbbbbbbbo',
    'odddddddddddddo.',
    'oyyyyyyooyyyyyyo',
    'obbbbbboyyobbbbo',
    'obbbbbboyyobbbbo',
    'obbbbbbboobbbbbo',
    'obbbbbbbbbbbbbbo',
    'oddddddddddddddo',
    'oyyyyyyyyyyyyyyo',
    'oooooooooooooooo',
  ],
}

export const CHEST_OPEN = {
  colours: { o: C.outline, b: C.brown2, d: C.brown1, y: C.yellow, w: C.white },
  rows: [
    '..oooooooooooo..',
    '.oddddddddddddo.',
    'oyyyyywyyyywyyyo',
    'oyywyyyyyyyyywyo',
    'oyyyyyyooyyyyyyo',
    'obbbbbboyyobbbbo',
    'obbbbbboyyobbbbo',
    'obbbbbbboobbbbbo',
    'obbbbbbbbbbbbbbo',
    'oddddddddddddddo',
    'oyyyyyyyyyyyyyyo',
    'oooooooooooooooo',
  ],
}

export const FLAG = {
  colours: { o: C.outline, r: C.red, w: C.white },
  rows: [
    'oooooooooooo',
    'orrrrrrrrro.',
    'orrwwwrrro..',
    'orrwrrrro...',
    'orrwwrrro...',
    'orrrrrrrro..',
    'orrrrrrrrro.',
    'oooooooooooo',
  ],
}

export const COIN = {
  colours: { o: C.outline, y: C.yellow, d: C.yellowDark, w: C.white },
  rows: [
    '..oooo..',
    '.oywyyo.',
    'oywyyydo',
    'oywyyydo',
    'oyyyyydo',
    'oyyyyydo',
    '.oyyddo.',
    '..oooo..',
  ],
}

export const DUST = [
  { colours: { w: C.white }, rows: ['.ww.', 'wwww', '.ww.'] },
  { colours: { w: C.cloudShade }, rows: ['w..w', '....', 'w..w'] },
]
