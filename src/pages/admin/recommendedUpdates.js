// One-off content updates from the portfolio audit + CV (Oct 2026). Each entry
// knows how to detect whether it's already applied, so the admin banner
// disappears once everything is done. Safe to delete this file afterwards.

const GITHUB_URL = 'https://github.com/SamKevs27'
const LINKEDIN_URL = 'https://www.linkedin.com/in/samuel-kevin-laluyan/'
const CV_URL = '/Samuel_Kevin_Laluyan_CV.pdf'
const HERO_ROLE = 'Software Engineer · Mobile & Web'

const SKILL_GROUPS = [
  { title: 'Languages & Frameworks', items: ['Flutter', 'JavaScript', 'Next.js', 'React', 'Python', 'Java', 'Go', 'Laravel', 'HTML', 'CSS'] },
  { title: 'Data & Databases', items: ['SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Firebase', 'Power BI'] },
  { title: 'Cloud & DevOps', items: ['Docker', 'AWS', 'Linux (RedHat, Ubuntu)'] },
  { title: 'Tools', items: ['Git / GitHub', 'Android Studio', 'Figma', 'Jira', 'Trello'] },
  { title: 'Technical Domains', items: ['REST APIs', 'Object-Oriented Programming', 'Data Structures & Algorithms', 'Cross-Platform Mobile Development', 'UI/UX & Responsive Design', 'SDLC', 'Computer Vision (MediaPipe, OpenCV)', 'Machine Learning Fundamentals'] },
  { title: 'Certifications', items: ['Network Defense Essentials (NDE)', 'Ethical Hacking Essentials (EHE)'] },
  { title: 'Spoken Languages', items: ['English (Advanced)', 'Bahasa Indonesia (Fluent)', 'German (Basic)'] },
]

const PROJECT_TECH = {
  '34DVRgXuzUsDpCa0fdh7': ['Mobile', 'Flutter', 'Dart'],
  TqN8sol0nLgQCV1Lpt8r: ['Web', 'JavaScript', 'Python', 'Docker'],
  jig6U4RhWyJGHyB0F9M6: ['Web', 'JavaScript', 'Marketplace'],
}
const DOGGO_ID = 'UmHN1PwBEsDEbCXyLqr4'

const NEW_PROJECTS = [
  {
    title: 'AI Dance Motion Tracking',
    desc: 'A web-based AI system that scores beginner hip-hop dance moves against expert reference videos, using MediaPipe BlazePose for pose tracking, FastDTW for movement accuracy and FFT audio cross-correlation for rhythm. Usability-tested with 5 participants across 45 videos (SUS 69).',
    role: 'Final-year thesis',
    year: '2026',
    tech: ['AI', 'Python', 'Flask', 'MediaPipe', 'SQLite'],
    link: 'https://github.com/SamKevs27/Thesis',
  },
  {
    title: 'SMARTBID',
    desc: 'A live mobile bidding application, shipped to production and launched publicly. Built in a cross-functional team — from UI implementation and API integration through release — with features iterated each sprint from user feedback.',
    role: 'Full-stack mobile developer',
    year: '2025',
    tech: ['Mobile', 'Flutter', 'REST API'],
    link: '',
  },
]

const KARYA_JOB = {
  role: 'Software Engineer',
  company: 'Karya Dreams Digital',
  period: '2026 – Present',
  type: 'work',
  desc: [
    'Maintain and develop the Web and Karya10 System, keeping production systems stable and reliable',
    'Collaborate with cross-functional teams to troubleshoot issues and ship ongoing improvements',
  ].join('\n'),
}

const ANUGERAH_JOB = {
  role: 'Full-Stack Mobile App Developer (Intern)',
  company: 'PT Anugerah Lelang Indonesia',
  period: '2024 – 2025',
  type: 'work',
  desc: [
    'Developed and deployed 3 production Flutter apps in a cross-functional team — UI, API integration and release — including SMARTBID, a live mobile bidding app',
    'Shipped iterative feature releases on schedule from user feedback, contributing to SMARTBID’s public launch',
    'Promoted to Project Manager for the mobile team: task assignment, sprint planning and progress tracking in Jira and Trello',
  ].join('\n'),
}

const sameList = (a = [], b = []) => a.length === b.length && a.every((v, i) => v === b[i])
const pad = (n) => String(n).padStart(2, '0')

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
    id: 'contact-copy',
    label: 'Contact: replace “Open to internships…” (you’re employed now) with a general invitation',
    isApplied: ({ contact }) => !/internships/i.test(contact.subtitle || ''),
    apply: (_, api) => api.updateSingleton('contact', {
      subtitle: 'Open to freelance projects, collaborations and new opportunities. Drop a message — I’d love to connect.',
    }),
  },
  {
    id: 'hero',
    label: `Hero: role → “${HERO_ROLE}”, stack tags, and a Download CV button`,
    isApplied: ({ home }) => home.barRole === HERO_ROLE && !!home.cvUrl,
    apply: (_, api) => api.updateSingleton('home', {
      barRole: HERO_ROLE,
      barTags: ['Flutter', 'Web', 'AI'],
      cvUrl: CV_URL,
    }),
  },
  {
    id: 'about',
    label: 'About: rewrite from your CV, use real stats (3 production apps, 2+ years), fix labels and CTA',
    isApplied: ({ about }) => (about.stats || []).some((s) => /production apps/i.test(s.label || '')),
    apply: (_, api) => api.updateSingleton('about', {
      sectionLabel: 'About Me',
      paragraphs: [
        'I’m Samuel Kevin Laluyan, a Software Engineer at Karya Dreams Digital and an Information Technology graduate of Swiss German University (SGU). I maintain and build production web and enterprise systems, and I’ve shipped 3 production Flutter apps end-to-end — from UI implementation through release.',
        'My work spans full-stack web, mobile and applied AI: my thesis used MediaPipe and FastDTW to score dance movements against expert references. I’ve also led a mobile team as Project Manager, running sprints in Jira and Trello.',
      ],
      stats: [
        { value: '3', label: 'Production apps' },
        { value: '2+', label: 'Years experience' },
        { value: '10+', label: 'Technologies' },
      ],
      details: [
        { key: 'Degree', value: 'B.IT, Swiss German University' },
        { key: 'Location', value: 'Tangerang, Indonesia' },
        { key: 'Role', value: 'Software Engineer' },
      ],
      cta: { label: 'Let’s Talk', to: '/contact' },
    }),
  },
  {
    id: 'skills',
    label: 'Skills: regroup to match your CV (adds Next.js, React, Go, Laravel, PostgreSQL, AWS, Docker, Jira, certifications)',
    isApplied: ({ skillsPage }) => (skillsPage.sections || []).some((s) => s.title === 'Certifications'),
    apply: (_, api) => api.updateSingleton('skillsPage', { sections: SKILL_GROUPS }),
  },
  {
    id: 'experience',
    label: 'Experience: add Karya Dreams Digital, fill in your PT Anugerah Lelang bullets, move your degree to Education',
    isApplied: ({ experience }) => experience.some((e) => /karya dreams/i.test(e.company || '')),
    apply: async ({ experience }, api) => {
      if (!(await api.createListItem('experience', { ...KARYA_JOB, order: 0 }))) return false
      for (const e of experience) {
        if (/anugerah/i.test(e.company || '')) {
          await api.updateListItem('experience', e.id, { ...ANUGERAH_JOB, order: 1 })
        } else if (/swiss german/i.test(e.company || '')) {
          await api.updateListItem('experience', e.id, { role: 'Bachelor of Information Technology', period: '2022 – 2026', type: 'education', order: 2 })
        } else if (!e.type) {
          await api.updateListItem('experience', e.id, { type: 'work' })
        }
      }
      return true
    },
  },
  {
    id: 'projects',
    label: 'Projects: add your thesis and SMARTBID at the top, real tech stacks from GitHub, remove Doggo’s broken (404) link',
    isApplied: ({ projects }) => projects.some((p) => p.title === 'SMARTBID'),
    apply: async ({ projects }, api) => {
      for (const [idx, project] of NEW_PROJECTS.entries()) {
        if (!(await api.createListItem('projects', { ...project, num: pad(idx + 1), order: idx }))) return false
      }
      const existing = [...projects].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
      for (const [idx, p] of existing.entries()) {
        const order = idx + NEW_PROJECTS.length
        const patch = { order, num: pad(order + 1) }
        if (PROJECT_TECH[p.id] && !sameList(p.tech, PROJECT_TECH[p.id])) patch.tech = PROJECT_TECH[p.id]
        if (p.id === DOGGO_ID) patch.link = ''
        await api.updateListItem('projects', p.id, patch)
      }
      return true
    },
  },
]
