// Colpi ed esplosioni. Il volo e quello che resta dopo l'impatto stanno in
// effetti-volo.js e effetti-impatto.js, uno per ogni tiro e ogni ramo
// (docs/castello/effetti.md); qui si sceglie quale, e si tengono i due
// effetto semplice che non è di nessuna torre (lo sbuffo di chi si divide).
import { TORRI } from '../../data/ops.js'
import { chiaveEffetto, VEL_EFFETTI } from '../../motore/castello/schizzo.js'
import { TINTA } from './tinte.js'
import { clamp, locale } from './effetti-base.js'
import { VOLI } from './effetti-volo.js'
import { IMPATTI } from './effetti-impatto.js'

// la tinta è quella del ramo, se c'è: è lì che si riconosce chi ha sparato
const tintaDi = (tipo, ramo) => (ramo && TORRI[tipo].rami?.[ramo]?.colore) || TINTA[tipo].chiaro
// quanto sale l'arco, in parti della distanza (zero: dritto)
const ALTO = { div: 0.3, mortaio: 0.55, napalm: 0.38 }
// la scala di frecce, sfere e scintille
const PICCOLO = 0.6
// quanto è grande l'effetto: una scelta estetica, con un tetto, non la zona colpita (che può essere
// molto più larga): con più torri insieme i cerchi grandi coprivano il campo. Si calibra dopo.
const AREA = 0.5, TETTO_AREA = 26
const GELO = 0.38
const TETTO_GELO = { bufera: 42, brina: 20 }, TETTO_GELO_BASE = 24   // il gelo: decorazioni vicino alla torre, e un cerchio sottile fin dove arriva

export function colpo(p, c) {
  // la seconda salva parte con un po' di ritardo: fino ad allora è ancora
  // dentro la bocca da fuoco, e non si disegna niente
  if (c.t < 0) return
  const S = p.S * PICCOLO, chiave = c.ramo || c.tipo
  const E = { x: (c.tx - c.x) / S, y: (c.ty - c.y) / S }
  const u = clamp(c.t)
  const k = { E, u, an: Math.atan2(E.y, E.x), col: tintaDi(c.tipo, c.ramo), volo: c.volo,
              tt: u / c.volo, alto: Math.hypot(E.x, E.y) * (ALTO[chiave] || 0) }
  locale(p, c.x, c.y, g => VOLI[chiave](g, k), 0, PICCOLO)
}

// `s.parte` dice a che strato si disegna: 'suolo' sotto i mostri, 'aria' sopra
function impatto(p, s) {
  const f = IMPATTI[chiaveEffetto(s.tipo, s.ramo)]?.[s.parte]
  if (!f) return
  const S = p.S * PICCOLO
  const D = s.da ? { x: (s.da.x - s.x) / S, y: (s.da.y - s.y) / S } : { x: 0, y: 0 }
  const mondo = s.gelo ? Math.min(s.max * GELO, (TETTO_GELO[s.ramo] || TETTO_GELO_BASE) * p.S) : Math.min(s.max * AREA, TETTO_AREA * p.S)
  const R = mondo / S
  const Rvero = s.gelo ? s.max / S : 0
  const P = s.punti ? s.punti.map(q => ({ x: (q.x - s.x) / S, y: (q.y - s.y) / S })) : []
  locale(p, s.x, s.y, g => f(g, { eta: s.eta * VEL_EFFETTI, R, an: Math.atan2(-D.y, -D.x), col: tintaDi(s.tipo, s.ramo), D, P, Rv: Rvero, t: p.tempo }), 0, PICCOLO)
}

// Lo sbuffo di chi si è appena diviso; tutto il resto è un impatto.
export function schizzo(p, s) {
  if (s.stile) return impatto(p, s)
  const q = Math.max(0, Math.min(1, s.vita))
  /* chi si è appena diviso: uno sbuffo bianco con due palline che
     schizzano via ai lati — «non è morto, adesso sono due» */
  if (s.dividi) {
    p.velo(q * 0.6, () => p.cerchio(s.x, s.y, s.r, '#ffffff'))
    const via = (1 - q) * 10 * p.S
    p.velo(q, () => {
      p.cerchio(s.x - via, s.y - 2 * p.S, 2.2 * p.S, '#e9f7d8')
      p.cerchio(s.x + via, s.y - 2 * p.S, 2.2 * p.S, '#e9f7d8')
    })
    return
  }
}
