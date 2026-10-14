// One-off content fixes from the portfolio audit (Oct 2026). Each entry knows
// how to detect whether it's already applied, so the admin banner disappears
// once everything is done. Safe to delete this file afterwards.

const GITHUB_URL = 'https://github.com/SamKevs27'
const LINKEDIN_URL = 'https://www.linkedin.com/in/samuel-kevin-laluyan/'

const SKILL_GROUPS = [
  { title: 'Languages', items: ['Java', 'Python', 'JavaScript', 'SQL', 'HTML', 'CSS'] },
  { title: 'Mobile', items: ['Flutter', 'Cross-platform Mobile Development', 'Android Studio'] },
  { title: 'Web & Backend', items: ['REST APIs', 'Firebase', 'MySQL', 'MongoDB', 'Responsive Design'] },
  { title: 'Design', items: ['Figma', 'UI/UX Design'] },
  { title: 'Data & AI', items: ['Computer Vision (MediaPipe, OpenCV)', 'Machine Learning Fundamentals', 'Data Visualization', 'Business Intelligence'] },
  { title: 'Tools & Practices', items: ['Git', 'Linux', 'System Administration', 'Object-Oriented Programming (OOP)', 'Data Structures & Algorithms', 'Software Development Life Cycle (SDLC)'] },
  { title: 'Spoken Languages', items: ['English (Advanced)', 'Bahasa (Fluent)', 'German (Basic)'] },
]

const PROJECT_TECH = {
  '34DVRgXuzUsDpCa0fdh7': { title: 'University Club', tech: ['Mobile', 'Flutter', 'Dart'] },
  TqN8sol0nLgQCV1Lpt8r: { title: 'Note Taking Website', tech: ['Web', 'JavaScript', 'Python', 'Docker'] },
  jig6U4RhWyJGHyB0F9M6: { title: 'Thriftify', tech: ['Web', 'JavaScript', 'Marketplace'] },
}

const DOGGO_ID = 'UmHN1PwBEsDEbCXyLqr4'

const sameList = (a = [], b = []) => a.length === b.length && a.every((v, i) => v === b[i])

export const RECOMMENDED_UPDATES = [
  {
    id: 'social-links',
    label: 'Point GitHub and LinkedIn icons at your real profiles',
    isApplied: ({ contact }) => !(contact.actions || []).some((a) => (
      /^https?:\/\/(www\.)?(github|linkedin)\.com\/?$/i.test(a.href || '')
    )),
    apply: ({ contact }, api) => api.updateSingleton('contact', {
      actions: (contact.actions || []).map((a) => {
        if (/github\.com\/?$/i.test(a.href || '')) return { ...a, href: GITHUB_URL }
        if (/linkedin\.com\/?$/i.test(a.href || '')) return { ...a, href: LINKEDIN_URL }
        return a
      }),
    }),
  },
  {
    id: 'about-copy',
    label: 'About: rename duplicate “Creative Portfolio” label, CTA → “Let’s Talk”, drop the “98% success rate” stat',
    isApplied: ({ about }) => (
      about.sectionLabel !== 'Creative Portfolio'
      && about.cta?.label !== 'Get Started'
      && !(about.stats || []).some((s) => /success rate/i.test(s.label || ''))
    ),
    apply: ({ about }, api) => api.updateSingleton('about', {
      sectionLabel: about.sectionLabel === 'Creative Portfolio' ? 'About Me' : about.sectionLabel,
      cta: about.cta?.label === 'Get Started' ? { ...about.cta, label: 'Let’s Talk' } : about.cta,
      stats: (about.stats || []).filter((s) => !/success rate/i.test(s.label || '')),
    }),
  },
  {
    id: 'hero-role',
    label: 'Hero: say what you do (“Mobile & Web Developer”) and show your stack as tags',
    isApplied: ({ home }) => !/student/i.test(home.barRole || '') && !sameList(home.barTags, ['Design', 'Build', 'Style']),
    apply: (_, api) => api.updateSingleton('home', {
      barRole: 'Mobile & Web Developer · Swiss German University',
      barTags: ['Flutter', 'Web', 'UI/UX'],
    }),
  },
  {
    id: 'skill-groups',
    label: 'Skills: regroup the chip wall into Languages, Mobile, Web, Design, Data & AI, Tools',
    isApplied: ({ skillsPage }) => (skillsPage.sections || []).length !== 3
      || (skillsPage.sections || [])[0]?.title !== 'Technical Skills',
    apply: (_, api) => api.updateSingleton('skillsPage', { sections: SKILL_GROUPS }),
  },
  {
    id: 'project-tech',
    label: 'Projects: add real tech stacks (from the GitHub repos) and remove Doggo’s broken (404) link',
    isApplied: ({ projects }) => projects.every((p) => {
      if (PROJECT_TECH[p.id]) return sameList(p.tech, PROJECT_TECH[p.id].tech)
      if (p.id === DOGGO_ID) return !p.link
      return true
    }),
    apply: async ({ projects }, api) => {
      for (const p of projects) {
        if (PROJECT_TECH[p.id] && !sameList(p.tech, PROJECT_TECH[p.id].tech)) {
          await api.updateListItem('projects', p.id, { tech: PROJECT_TECH[p.id].tech })
        }
        if (p.id === DOGGO_ID && p.link) await api.updateListItem('projects', p.id, { link: '' })
      }
      return true
    },
  },
  {
    id: 'education-type',
    label: 'Experience: separate your degree into an Education group',
    isApplied: ({ experience }) => experience.every((e) => e.type),
    apply: async ({ experience }, api) => {
      for (const e of experience) {
        if (!e.type) {
          const isEducation = /university|graduate|bachelor|school/i.test(`${e.company} ${e.role}`)
          await api.updateListItem('experience', e.id, { type: isEducation ? 'education' : 'work' })
        }
      }
      return true
    },
  },
]
