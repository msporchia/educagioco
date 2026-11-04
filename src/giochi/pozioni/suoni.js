// I suoni del laboratorio, sintetizzati come tutti gli altri (src/audio.js):
// il liquido, la polvere, la spugna, chi parla e chi beve. Non dicono niente
// che non si veda: a volume spento il gioco è intero. Vedi docs/pozioni/personaggi.md.
import { suono } from '../../audio.js'

const { nota, rumore } = suono
const fra = (a, b) => a + Math.random() * (b - a)
const dopo = (ms, fai) => setTimeout(fai, ms)
const ripeti = (n, ogni, fai) => { for (let i = 0; i < n; i++) dopo(i * ogni, () => fai(i)) }

// una bollicina: sale in fretta, come dentro un liquido
const blop = (forte = 1) => nota(fra(150, 260), fra(480, 820), 0.09, 'sine', 0.06 * forte)

// voci finte: sillabe a caso intorno a un'altezza
function chiacchiera(alto, sillabe, tipo = 'triangle') {
  ripeti(sillabe, 105, () => { const f = alto * fra(0.8, 1.35); nota(f, f * fra(0.8, 1.2), 0.08, tipo, 0.09) })
}

// come saluta chi viene a bere
const VERSI = {
  maga: () => { nota(780, 1180, 0.14, 'sine', 0.09); nota(1180, 1560, 0.16, 'sine', 0.08, 130) },
  rana: () => ripeti(2, 170, () => { nota(190, 120, 0.13, 'sawtooth', 0.09); rumore(0.08, 0.03, 900, 300) }),
  gufo: () => ripeti(2, 300, i => nota(430 - i * 50, 360 - i * 50, 0.24, 'sine', 0.13)),
  gatto: () => { nota(620, 980, 0.14, 'triangle', 0.1); nota(980, 520, 0.24, 'triangle', 0.1, 130) },
  robot: () => [880, 660, 1180, 990].forEach((f, i) => nota(f, f, 0.07, 'square', 0.05, i * 85)),
  folletto: () => chiacchiera(980, 4),
}

// cosa si sente quando la pozione fa effetto: docs/pozioni/personaggi.md
const EFFETTI = {
  ruggisce: () => { nota(180, 90, 0.8, 'sawtooth', 0.14); nota(240, 120, 0.8, 'square', 0.05); rumore(0.8, 0.09, 1500, 200) },
  sparisce: () => ripeti(9, 85, i => { const f = 2100 - i * 170; nota(f, f * 0.94, 0.14, 'sine', 0.06) }),
  vola: () => { nota(260, 1500, 1.3, 'sine', 0.1); rumore(1.3, 0.05, 900, 4000) },
  ride: () => ripeti(7, 125, i => { const f = 760 + (i % 2) * 130 - i * 14; nota(f, f * 0.82, 0.09, 'triangle', 0.12) }),
  forza: () => { nota(130, 420, 0.32, 'triangle', 0.1); dopo(620, () => { nota(120, 40, 0.4, 'square', 0.16); rumore(0.4, 0.16, 1500, 120) }) },
  dorme: () => [523, 440, 392, 330].forEach((f, i) => nota(f, f, 0.42, 'sine', 0.07, i * 320)),
  corre: () => { ripeti(4, 230, i => nota(600 + i * 120, 1500 + i * 120, 0.16, 'sawtooth', 0.05)); dopo(1000, () => { nota(500, 2400, 0.3, 'triangle', 0.09); rumore(0.3, 0.07, 2000, 6000) }) },
  parla: () => chiacchiera(520, 12),
  profuma: () => [1047, 1319, 1568, 2093, 1568, 2093].forEach((f, i) => nota(f, f, 0.26, 'sine', 0.05, i * 150)),
  gigante: () => { ripeti(3, 210, i => nota(110 - i * 16, 70 - i * 10, 0.2, 'square', 0.14)); rumore(0.8, 0.1, 500, 90) },
}

export const suoni = {
  // il mercante posa le ampolle sul bancone
  ampolle: n => ripeti(n, 190, () => { const f = fra(1900, 2500); nota(f, f * 0.98, 0.07, 'sine', 0.05); nota(f * 1.5, f * 1.5, 0.05, 'sine', 0.02) }),
  // gorgoglii che salgono, come quando un recipiente si riempie
  liquido(dur = 0.6) {
    rumore(dur, 0.04, 1300, 500)
    ripeti(7, dur * 1000 / 7, i => nota(170 + i * 42 + fra(-15, 15), 400 + i * 52, 0.075, 'sine', 0.085))
  },
  polvere(dur = 0.6) {
    rumore(dur, 0.06, 9000, 3000)
    ripeti(8, dur * 1000 / 8, () => { const f = fra(2800, 5200); nota(f, f, 0.02, 'triangle', 0.018) })
  },
  radice() { nota(240, 120, 0.09, 'triangle', 0.14); nota(170, 85, 0.13, 'sine', 0.12, 80); rumore(0.06, 0.05, 1600, 500) },
  trabocca() {
    rumore(0.75, 0.13, 2400, 300)
    ripeti(6, 95, () => blop(1.6))
    dopo(520, () => nota(210, 90, 0.2, 'sine', 0.1))
  },
  // il tuffo nel calderone, e le bolle che lo seguono
  tuffo() { nota(340, 80, 0.24, 'sine', 0.15); rumore(0.26, 0.09, 2600, 400); ripeti(4, 90, () => dopo(170, () => blop(1.2))) },
  bolla: () => blop(0.42),
  spugna: () => ripeti(4, 190, i => { nota(760 + i * 40, 1220, 0.1, 'sine', 0.05); rumore(0.09, 0.025, 4200, 1800) }),
  sbuffo() { rumore(1.2, 0.11, 3200, 400); [392, 523, 659, 784, 1047].forEach((f, i) => nota(f, f * 1.02, 0.2, 'triangle', 0.07, 200 + i * 110)) },
  parla: () => chiacchiera(300, 5),
  no: () => [340, 250].forEach((f, i) => nota(f, f * 0.92, 0.16, 'triangle', 0.09, i * 170)),
  evviva: () => [523, 659, 784].forEach((f, i) => nota(f, f * 1.03, 0.1, 'triangle', 0.09, i * 90)),
  passo: () => { nota(fra(120, 150), 80, 0.07, 'sine', 0.11); rumore(0.04, 0.03, 1100, 300) },
  // il fiasco vola verso chi l'ha chiesto
  lancio: () => nota(500, 1250, 0.45, 'sine', 0.05),
  beve() { ripeti(4, 210, i => nota(230 + i * 34, 130 + i * 22, 0.13, 'sine', 0.13)); dopo(880, () => nota(620, 420, 0.2, 'triangle', 0.09)) },
  verso: chi => VERSI[chi]?.(),
  effetto: quale => EFFETTI[quale]?.(),
}

export const VERSI_DEI_CLIENTI = Object.keys(VERSI)
export const SUONI_DEGLI_EFFETTI = Object.keys(EFFETTI)
