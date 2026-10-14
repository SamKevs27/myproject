// Shared project helpers for both the formal and the fun views.
export const PRIVATE_MARK = /\s*\(classified\)\s*$/i

export function hasProjectLink(link = '') {
  const value = link.trim()
  return Boolean(value) && value !== '#'
}

// Name the link by what it opens, so visitors know what they'll get.
export function linkLabel(link) {
  if (/github\.com|gitlab\.com/i.test(link)) return 'View code'
  if (/figma\.com/i.test(link)) return 'View prototype'
  return 'Visit site'
}

export function sortByOrder(items) {
  return [...items].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
}
