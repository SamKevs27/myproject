import { sortByOrder } from '../lib/projects'

/* World units are base-resolution pixels. Heights are measured up from the
   ground line. Player physics (in useJourneyLoop) can jump ~49px high. */

export const TALK_RANGE = 34 // how close you must be to talk to Sam / open the chest
export const BLOCK_SIZE = 16
export const BLOCK_BOTTOM = 58 // height of a "?" block's underside
export const PLATFORM_W = 48
export const PLATFORM_STEP = 32 // each parkour ledge is this much higher than the last

export const SECTIONS = [
  { id: 'about', world: 'WORLD 1-1', label: 'MEET SAM' },
  { id: 'skills', world: 'WORLD 1-2', label: 'SKILLS' },
  { id: 'projects', world: 'WORLD 1-3', label: 'PROJECTS' },
  { id: 'experience', world: 'WORLD 1-4', label: 'PARKOUR' },
  { id: 'contact', world: 'FINAL', label: 'CONTACT' },
]

export const sectionOf = (id) => SECTIONS.find((s) => s.id === id)

// Oldest first, so the parkour climbs through the career in order.
function startYear(entry) {
  const match = String(entry.period || '').match(/\d{4}/)
  return match ? Number(match[0]) : 9999
}

/**
 * Lays the portfolio out along the level:
 *   Sam (about) → 7 "?" blocks (one per skill group) → chest (projects)
 *   → rising ledges (one per job / degree) → castle (contact).
 * Each region also marks where its HUD label and coin start.
 */
export function buildWorld({ about, skillsPage, projects, experience, contact, home }) {
  const groups = (skillsPage.sections || []).filter((g) => (g.items || []).length)
  const entries = [...sortByOrder(experience)].sort((a, b) => startYear(a) - startYear(b))

  const sam = { x: 120, data: about }

  const blocksStart = 270
  const blocks = groups.map((group, i) => ({ id: `block-${i}`, x: blocksStart + i * 40, group, index: i }))
  const blocksEnd = blocksStart + Math.max(0, groups.length - 1) * 40

  const chest = { x: blocksEnd + 150, projects: sortByOrder(projects) }

  const parkourStart = chest.x + 210
  const platforms = entries.map((entry, i) => ({
    id: `ledge-${i}`,
    x1: parkourStart + i * (PLATFORM_W + 36),
    x2: parkourStart + i * (PLATFORM_W + 36) + PLATFORM_W,
    top: PLATFORM_STEP * (i + 1),
    entry,
    index: i,
  }))
  const parkourEnd = platforms.length ? platforms.at(-1).x2 : parkourStart

  const castle = { x: parkourEnd + 150, data: { contact, home } }
  const length = castle.x + 70

  const regions = [
    { id: 'about', from: -Infinity, spawn: sam.x - 40 },
    { id: 'skills', from: blocksStart - 60, spawn: blocksStart - 40 },
    { id: 'projects', from: chest.x - 80, spawn: chest.x - 40 },
    { id: 'experience', from: parkourStart - 80, spawn: parkourStart - 50 },
    { id: 'contact', from: castle.x - 90, spawn: castle.x - 50 },
  ]

  return { sam, blocks, chest, platforms, castle, length, regions, total: { groups: groups.length, entries: entries.length } }
}

export function regionAt(world, x) {
  let current = world.regions[0]
  for (const r of world.regions) if (x >= r.from) current = r
  return current
}
