// Tiny chiptune blips via Web Audio. Silent until the visitor turns sound on.
let audio = null
let enabled = false

export function setSoundEnabled(on) {
  enabled = on
  if (on && !audio) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (Ctx) audio = new Ctx()
  }
  if (on && audio?.state === 'suspended') audio.resume()
}

function tone(freq, start, duration, type = 'square', volume = 0.06) {
  const t = audio.currentTime + start
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  gain.gain.setValueAtTime(volume, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(gain).connect(audio.destination)
  osc.start(t)
  osc.stop(t + duration)
}

const play = (fn) => () => {
  if (enabled && audio) fn()
}

export const sfx = {
  start: play(() => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.12))),
  coin: play(() => {
    tone(988, 0, 0.08)
    tone(1319, 0.08, 0.3)
  }),
  open: play(() => [392, 523, 659].forEach((f, i) => tone(f, i * 0.05, 0.1, 'triangle', 0.08))),
  jump: play(() => tone(330, 0, 0.12, 'square', 0.04)),
}
