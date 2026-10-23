// Chi pesa negli Asteroidi 3D, il gioco che sul telefono va (docs/core/vecchio-telefono-elementi.md): la scena di grafica/spazio3d con
// una partita finta (8 sassi che girano, la nave, la nave madre, un po' di fuoco e un anello), e gli elementi accesi o spenti come
// chiede la scena (`spenti` del pittore; `post` spento disegna dritto sullo schermo).
import { creaSpazio3d } from '../../spazio3d/indice.js'
import { nuovaTela } from './tela.js'
import { SCENE_ELEMENTI } from './elementi-dati.js'

const SPECIE = ['roccia', 'roccia', 'ghiaccio', 'roccia', 'lava', 'roccia', 'roccia', 'ghiaccio']

export async function prepara({ contenitore }) {
  const tela = nuovaTela(contenitore)
  const p = creaSpazio3d(tela.canvas, {})
  if (!p) { tela.via(); throw new Error('gli Asteroidi 3D non partono') }
  const W = tela.W, H = tela.H, S = Math.max(0.6, Math.min(1.6, Math.min(W, H) / 700)), r = Math.min(W, H) * 0.07
  p.ridimensiona(W, H); p.prepara('cintura')
  const sassi = SPECIE.map((specie, i) => ({ x: W * (0.15 + 0.7 * ((i * 37) % 8) / 7), y: H * (0.1 + 0.07 * i), r, v: `${i + 2}×${i + 3}`, specie, seme: i, ph: i * 0.7 }))
  const q = { t: 0, W, H, S, cielo: 'cintura', salto: 0, scossa: 0, lampo: 0, gelo: false,
              nave: { x: W / 2, y: H * 0.85, r: r * 1.2, lv: 2, danno: 0, t: 0, spinta: 0.4, mira: -Math.PI / 2, livrea: null },
              asteroidi: sassi, madre: { x: W / 2, y: H * 0.18, r: r * 2.2, sx: true, dx: true, cupola: true, inclina: 0 }, pezzi: [], frammenti: [],
              particelle: [], anelli: [], raggi: [] }
  let prima = 0
  return {
    dpr: window.devicePixelRatio || 1,
    gl: () => p.gl(),
    tela: tela.canvas,
    scena3d: () => p.scena,
    conti() { const i = p.info(); return { ch: i.chiamate, tri: i.triangoli, programmi: 0 } },
    passo(t, dt) {
      q.t = t; q.nave.t = t
      for (const [i, a] of sassi.entries()) a.y = (H * (0.1 + 0.07 * i) + t * 20) % (H * 0.75)
      // un po' di fuoco che sale e un anello che si allarga, a giro
      q.particelle = Array.from({ length: 30 }, (_, k) => ({ x: W / 2 + Math.sin(t * 3 + k) * 40, y: H * 0.5 - ((t * 60 + k * 9) % 120), r: 4, c: '#ffa050', vita: 1 - ((t + k * 0.1) % 1) }))
      q.anelli = [{ x: W * 0.3, y: H * 0.4, r: ((t * 80) % 160) + 1, max: 160, vita: 1 - ((t * 0.5) % 1), c: '#ffc070' }]
      p.disegna(q, prima ? dt : 0); prima = t
    },
    async scena(s) {
      const su = new Set(s.accesi)
      p.spenti.clear()
      for (const k of SCENE_ELEMENTI.ast.elementi) if (!su.has(k)) p.spenti.add(k)
    },
    via() { try { p.distruggi() } finally { tela.via() } },
  }
}
