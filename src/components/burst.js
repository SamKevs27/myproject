const BURST_SPOKES = 7
const BURST_COLORS = ['#2ef2ff', '#ff2bd6', '#ffb238']

// A little splash of joints and bones wherever someone clicks.
export function spawnBurst(x, y) {
  const burst = document.createElement('div')
  burst.className = 'click-burst'
  burst.style.left = `${x}px`
  burst.style.top = `${y}px`
  for (let i = 0; i < BURST_SPOKES; i++) {
    const spoke = document.createElement('span')
    spoke.style.setProperty('--a', `${(360 / BURST_SPOKES) * i + Math.random() * 20}deg`)
    spoke.style.setProperty('--d', `${26 + Math.random() * 22}px`)
    spoke.style.setProperty('--c', BURST_COLORS[i % BURST_COLORS.length])
    burst.appendChild(spoke)
  }
  document.body.appendChild(burst)
  setTimeout(() => burst.remove(), 800)
}
