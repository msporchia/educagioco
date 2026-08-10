/* Audio sintetizzato, zero file. Condiviso da tutti i giochi. */
import { ref } from 'vue'

let AC = null
export const acceso = ref(true)

/* L'unico AudioContext dell'applicazione: lo usano sia gli effetti qui
   sotto sia le voci incise di `voce.js`. Uno solo perché i browser ne
   contano pochi per scheda, e perché va risvegliato: sul telefono nasce
   sospeso finché il dito non tocca qualcosa. */
export function contesto() {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)()
    if (AC.state === 'suspended') AC.resume()
    return AC
  } catch (e) { return null }
}

function nota(f1, f2, dur, tipo = 'triangle', vol = 0.14, ritardo = 0) {
  if (!acceso.value) return
  setTimeout(() => {
    try {
      AC = contesto()
      const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain()
      o.type = tipo
      o.frequency.setValueAtTime(f1, t)
      if (f2 !== f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t + dur)
      g.gain.setValueAtTime(0.0001, t)
      g.gain.linearRampToValueAtTime(vol, t + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur)
      o.connect(g); g.connect(AC.destination)
      o.start(t); o.stop(t + dur + 0.03)
    } catch (e) { /* audio non disponibile: non è un problema */ }
  }, ritardo)
}

function rumore(dur, vol, da, a) {
  if (!acceso.value) return
  try {
    AC = contesto()
    const n = Math.floor(AC.sampleRate * dur)
    const buf = AC.createBuffer(1, n, AC.sampleRate), d = buf.getChannelData(0)
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n)
    const src = AC.createBufferSource(); src.buffer = buf
    const f = AC.createBiquadFilter(); f.type = 'lowpass'
    const t = AC.currentTime
    f.frequency.setValueAtTime(da, t)
    f.frequency.exponentialRampToValueAtTime(a, t + dur)
    const g = AC.createGain(); g.gain.value = vol
    src.connect(f); f.connect(g); g.connect(AC.destination); src.start(t)
  } catch (e) { /* ignora */ }
}

export const suono = {
  /* `acceso` si legge da qui e si cambia da `store/profile.js`
     (`accendiSuono`), perché è una preferenza del bambino e va salvata
     con le sue: qui dentro non si sa nemmeno che esistano i profili. */
  acceso,
  nota, rumore,
  ok:     () => { nota(660, 660, 0.1); nota(990, 990, 0.14, 'triangle', 0.13, 80) },
  no:     () => { nota(300, 120, 0.26, 'sawtooth', 0.12); rumore(0.16, 0.06, 700, 180) },
  moneta: () => [880, 1175, 1568].forEach((f, i) => nota(f, f, 0.13, 'square', 0.11, i * 70)),
  compra: () => [523, 784, 1047].forEach((f, i) => nota(f, f, 0.16, 'triangle', 0.12, i * 90)),
  livello:() => [523, 659, 784, 1047, 1319].forEach((f, i) => nota(f, f, 0.2, 'triangle', 0.12, i * 80)),
  sparo:  () => nota(950, 260, 0.07, 'square', 0.10),
  boom:   () => { nota(140, 38, 0.45, 'square', 0.18); rumore(0.55, 0.2, 2200, 90) },
  boss:   () => { nota(110, 55, 0.55, 'sawtooth', 0.17); rumore(0.7, 0.22, 2600, 70) },
  vita:   () => [620, 850, 1080].forEach((f, i) => nota(f, f + 80, 0.16, 'triangle', 0.13, i * 95)),
  // il miao sale e poi ricade: due note attaccate fanno il verso meglio di una
  miao:   () => { nota(560, 880, 0.13, 'sawtooth', 0.09); nota(880, 520, 0.2, 'triangle', 0.1, 110) },
  // il bau è corto e basso, e ne servono due: uno solo sembra un rutto
  bau:    () => { nota(300, 150, 0.1, 'square', 0.12); nota(260, 130, 0.11, 'square', 0.1, 150) },
  // il pappagallo: due fischi acuti attaccati, come un cip-cip
  cip:    () => { nota(1800, 2400, 0.07, 'triangle', 0.07); nota(2400, 1700, 0.09, 'triangle', 0.07, 90) },
  // il pesce non fa rumore: fa una bollicina, e si sente appena
  blub:   () => { nota(240, 700, 0.09, 'sine', 0.09); nota(180, 520, 0.1, 'sine', 0.07, 120) },
  // il draghetto: un ruggito piccolo, che è un ruggito con la voce da cucciolo
  ruggito:() => { nota(180, 90, 0.3, 'sawtooth', 0.13); rumore(0.35, 0.1, 900, 160) },
  fusa:   () => { rumore(0.55, 0.05, 240, 70); rumore(0.5, 0.04, 200, 60) },
  ansima: () => [0, 190, 380].forEach(r => setTimeout(() => rumore(0.1, 0.05, 1100, 320), r)),
  sgranocchia: () => [0, 150, 300].forEach(r => setTimeout(() => rumore(0.09, 0.07, 1900, 350), r)),
  fine:   () => [523, 466, 392, 294].forEach((f, i) => nota(f, f * 0.98, 0.42, 'triangle', 0.14, i * 180)),
}
