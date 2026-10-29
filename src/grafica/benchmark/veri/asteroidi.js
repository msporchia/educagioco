// Gli Asteroidi negli fps veri (docs/core/vecchio-telefono-veri.md): la scena di grafica/spazio3d, con la fascia del telefono, su
// una partita finta (8 sassi che scendono, la nave, la nave madre). `boom`: a ogni secondo un sasso esplode (scintille, fumo, un anello,
// la scossa), il momento più caro del gioco; le scintille stanno sotto il tetto della fascia come quelle del gioco.
import { creaSpazio3d } from '../../spazio3d/indice.js'
import { profilo } from '../../../store/qualita.js'
import { nuovaTela } from './tela.js'

const SPECIE = ['roccia', 'roccia', 'ghiaccio', 'roccia', 'lava', 'roccia', 'roccia', 'ghiaccio']

export async function prepara({ contenitore }) {
  const tela = nuovaTela(contenitore)
  const p = creaSpazio3d(tela.canvas, {})
  if (!p) { tela.via(); throw new Error('gli Asteroidi non partono') }
  const W = tela.W, H = tela.H, S = Math.max(0.6, Math.min(1.6, Math.min(W, H) / 700)), r = Math.min(W, H) * 0.07
  p.ridimensiona(W, H); p.prepara('cintura')
  const sassi = SPECIE.map((specie, i) => ({ x: W * (0.15 + 0.7 * ((i * 37) % 8) / 7), y: H * (0.1 + 0.07 * i), r, v: `${i + 2}×${i + 3}`, specie, seme: i, ph: i * 0.7 }))
  const q = { t: 0, W, H, S, cielo: 'cintura', salto: 0, scossa: 0, lampo: 0, gelo: false,
              nave: { x: W / 2, y: H * 0.85, r: r * 1.2, lv: 3, danno: 0, t: 0, spinta: 0.4, mira: -Math.PI / 2, livrea: null },
              asteroidi: sassi, madre: { x: W / 2, y: H * 0.18, r: r * 2.2, sx: true, dx: true, cupola: true, inclina: 0 }, pezzi: [], frammenti: [],
              particelle: [], anelli: [], raggi: [] }
  // l'esplosione: le scintille di un sasso colpito, sotto il tetto della fascia (un terzo: nel gioco ne stanno in aria più d'una)
  const quante = Math.min(160, Math.round(profilo('asteroidi').scintille / 3))
  const scintille = Array.from({ length: quante }, (_, k) => ({ a: k * 2.39996, v: 60 + (k * 53) % 140 }))
  // l'anello è lo stesso oggetto per tutta l'esplosione: il pittore fa la palla di fuoco la prima volta che lo vede
  let boom = false, prima = 0, anello = null, colpo = -1
  return {
    dpr: window.devicePixelRatio || 1,
    gl: () => p.gl(),
    tela: tela.canvas,
    scena3d: () => p.scena,
    avvia() {},
    conti() { const i = p.info(); return { ch: i.chiamate, tri: i.triangoli, programmi: 0 } },
    passo(t, dt) {
      q.t = t; q.nave.t = t; q.nave.x = W / 2 + Math.sin(t * 0.8) * W * 0.25
      for (const [i, a] of sassi.entries()) a.y = (H * (0.1 + 0.07 * i) + t * 20) % (H * 0.75)
      q.particelle.length = 0; q.anelli.length = 0; q.scossa = 0
      if (boom) {
        const f = t % 1, cx = W * (0.3 + 0.4 * ((Math.floor(t) * 7) % 5) / 4), cy = H * 0.35
        for (const s of scintille) q.particelle.push({ x: cx + Math.cos(s.a) * s.v * f, y: cy + Math.sin(s.a) * s.v * f, r: 3 + 3 * (1 - f), c: '#ffb060', vita: 1 - f })
        if (Math.floor(t) !== colpo) { colpo = Math.floor(t); anello = { x: cx, y: cy, r: 1, max: 140, vita: 1, c: '#ffc070' } }
        anello.r = 1 + f * 140; anello.vita = 1 - f
        q.anelli.push(anello)
        q.scossa = Math.max(0, 0.6 - f) * 0.5
      }
      p.disegna(q, prima ? dt : 0); prima = t
    },
    async scena(s) { boom = !!s.boom },
    via() { try { p.distruggi() } finally { tela.via() } },
  }
}
