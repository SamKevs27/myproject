// Word-wrap text to `maxChars` per line (monospace), then pair the lines so
// every speech bubble holds at most two.
export function toBubbles(paragraphs, maxChars) {
  const bubbles = []
  for (const paragraph of paragraphs) {
    const lines = []
    let line = ''
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word
      if (next.length > maxChars && line) {
        lines.push(line)
        line = word
      } else {
        line = next
      }
    }
    if (line) lines.push(line)
    for (let i = 0; i < lines.length; i += 2) bubbles.push(lines.slice(i, i + 2))
  }
  return bubbles
}
