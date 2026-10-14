import { sortByOrder } from '../lib/projects'

// World units are base-resolution pixels; the character walks 1 unit per scroll step.
export const SCROLL_PER_UNIT = 4 // page px of scroll per world px
export const REACH = 46 // how close the character must be for a checkpoint to open

const FIRST = 230
const SECTION_GAP = 250
const JOB_GAP = 170
const PROJECT_GAP = 150

export const SECTIONS = [
  { id: 'about', world: 'WORLD 1-1', label: 'ABOUT ME' },
  { id: 'skills', world: 'WORLD 1-2', label: 'SKILLS' },
  { id: 'experience', world: 'WORLD 1-3', label: 'EXPERIENCE' },
  { id: 'projects', world: 'WORLD 1-4', label: 'PROJECTS' },
  { id: 'contact', world: 'FINAL', label: 'CONTACT' },
]

/**
 * Lays the portfolio out along the level. Each checkpoint has a world x, the
 * object drawn there (sign, flag, block, chest, castle) and the content its
 * dialog shows. Adding a section = add it to SECTIONS and push checkpoints here.
 */
export function buildWorld({ about, skillsPage, projects, experience, contact, home }) {
  const checkpoints = []
  let x = FIRST

  checkpoints.push({ id: 'about', section: 'about', kind: 'sign', x, data: about })
  x += SECTION_GAP
  checkpoints.push({ id: 'skills', section: 'skills', kind: 'sign', x, data: skillsPage })
  x += SECTION_GAP

  const jobs = sortByOrder(experience)
  jobs.forEach((job, i) => {
    checkpoints.push({ id: `job-${job.id}`, section: 'experience', kind: 'flag', x, data: job, index: i, total: jobs.length })
    x += JOB_GAP
  })
  x += SECTION_GAP - JOB_GAP

  const list = sortByOrder(projects)
  list.forEach((project, i) => {
    const isPrivate = /\(classified\)\s*$/i.test(project.title || '')
    checkpoints.push({
      id: `project-${project.id}`, section: 'projects', kind: isPrivate ? 'chest' : 'block',
      x, data: project, index: i, total: list.length,
    })
    x += PROJECT_GAP
  })
  x += SECTION_GAP - PROJECT_GAP

  checkpoints.push({ id: 'contact', section: 'contact', kind: 'castle', x, data: { contact, home } })

  return { checkpoints, length: x + 40 }
}

export const sectionOf = (id) => SECTIONS.find((s) => s.id === id)

// The checkpoint the character is standing at, if any.
export function activeCheckpoint(checkpoints, worldX) {
  let best = null
  for (const cp of checkpoints) {
    const d = Math.abs(cp.x - worldX)
    const reach = cp.kind === 'castle' ? REACH * 2 : REACH
    if (d < reach && (!best || d < Math.abs(best.x - worldX))) best = cp
  }
  return best
}
