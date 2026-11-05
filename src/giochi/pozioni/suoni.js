// I suoni del laboratorio, sintetizzati come tutti gli altri (src/audio.js):
// il liquido, la polvere, la spugna, il mortaio, il fuoco. Non dicono niente
// che non si veda: a volume spento il gioco è intero. Vedi docs/pozioni/procedimento.md.
import { suono } from '../../audio.js'

const { nota, rumore } = suono
const fra = (a, b) => a + Math.random() * (b - a)
const dopo = (ms, fai) => setTimeout(fai, ms)
const ripeti = (n, ogni, fai) => { for (let i = 0; i < n; i++) dopo(i * ogni, () => fai(i)) }

// una bollicina: sale in fretta, come dentro un liquido
const blop = (forte = 1) => nota(fra(150, 260), fra(480, 820), 0.09, 'sine', 0.06 * forte)

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
  // il tappo salta, il panno si sfila
  stappa(panno) { if (panno) rumore(0.12, 0.05, 2600, 900); else { nota(520, 1400, 0.05, 'sine', 0.13); rumore(0.04, 0.05, 4000, 1500) } },
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
  // un colpo di pestello: pietra su pietra
  colpo() { nota(fra(190, 230), 90, 0.09, 'square', 0.1); rumore(0.07, 0.09, 3200, 700) },
  tonfo() { nota(300, 150, 0.08, 'triangle', 0.09); rumore(0.05, 0.04, 1800, 600) },
  // un giro di mestolo nel brodo
  sciacquo() { rumore(0.16, 0.05, 1100, 500); blop(0.7) },
  // la lama sul legno
  taglio() { nota(fra(900, 1100), 420, 0.04, 'triangle', 0.07); nota(180, 110, 0.06, 'square', 0.07); rumore(0.04, 0.05, 3800, 1500) },
  // il pizzico che cade, e il tappo che entra nella fiala
  pizzico() { rumore(0.08, 0.03, 8000, 3000); ripeti(3, 35, () => { const f = fra(3200, 5600); nota(f, f, 0.02, 'triangle', 0.02) }) },
  tappo() { nota(1150, 620, 0.06, 'sine', 0.12); rumore(0.03, 0.04, 3000, 1200) },
  gratta() { rumore(0.13, 0.05, 7000, 2600); nota(fra(1500, 1900), fra(1100, 1300), 0.08, 'sawtooth', 0.012) },
  sfrega() { rumore(0.09, 0.07, 6000, 2000) },
  soffio() { rumore(0.34, 0.08, 700, 2000) },
  incanto: n => { const f = [660, 784, 880, 988, 1175, 1319][n % 6]; nota(f, f * 1.01, 0.22, 'sine', 0.05); nota(f * 2, f * 2, 0.12, 'triangle', 0.015, 40) },
  mescola: () => ripeti(5, 230, () => { rumore(0.2, 0.05, 1100, 500); blop(0.8) }),
  scalda() { rumore(1.1, 0.07, 500, 2600); ripeti(6, 170, () => rumore(0.05, 0.04, 5000, 2000)) },
  pasticcio() { nota(160, 60, 0.5, 'sawtooth', 0.12); rumore(0.5, 0.12, 900, 150); ripeti(3, 130, () => blop(1.5)) },
}
