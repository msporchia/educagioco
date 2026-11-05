/* ═══════════════════════════════════════════════════════════════════
   DUE CONTADINI SU UNA RETE FINTA

   Due `Ponte` veri (src/amici/rete.js) e la spedizione vera del contadino
   sulla presenza finta, col seme: ognuno cammina e si ferma, e l'altro
   tiene il conto di quando il contadino c'è. Il bambino gioca sempre,
   quindi ogni assenza è un contadino sparito a torto. Lo usano
   unita/amici-contadino e strumenti/banco-contadino.mjs.
   ═══════════════════════════════════════════════════════════════════ */
import { caso } from '../../src/giochi/arena/motore/banco.js'
import { Ponte } from '../../src/amici/rete.js'
import { qui, leggi } from '../../src/amici/messaggi.js'
import { spedizione, OGNI_QUI, SPARISCE } from '../../src/giochi/fattoria3d/contadino-amico.js'
import { orologioFinto } from './rete-finta.mjs'
import { presenzaFinta } from './presenza-finta.mjs'

export const CHIAVE = 'k'.repeat(32)
const ABITO = { persona: 'contadina', cappello: 'paglia', maglia: 'pois', pantalone: 'blu', stivali: 'marroni', collo: 'fazzoletto-rosso', taglio: 'trecce', capelli: 'castani', barba: 'nessuna', pelle: 'dorata' }

/* `inGioco` falso: il filo resta al battito di quando non si gioca; con `sparisce: 6000`, com'era prima della correzione */
export function dueContadini({ seme = 1, min = 30, max = 200, inGioco = true, sparisce = SPARISCE } = {}) {
  const orologio = orologioFinto(), rete = presenzaFinta({ orologio, rnd: caso(seme), min, max }), r = caso(seme * 17)
  const nuovo = (id, altro) => {
    const t = { id, x: 0, z: 0, cammina: false, cadute: 0, assenze: [], assenteDa: null, visto: -Infinity }
    t.ponte = new Ponte({
      id, chiavi: () => [CHIAVE], servizio: 'https://finto', WebSocketImpl: rete.ws(id), tempo: orologio, visibile: () => true,
      alMessaggio: (c, m) => { if (leggi(m)?.k === 'qui') t.visto = orologio.ora() },
      alCambio: () => { if (t.eraAperto && !t.ponte.aperto) t.cadute++; t.eraAperto = t.ponte.aperto },
    })
    t.ponte.inGioco(inGioco)
    t.spedisci = spedizione(m => t.ponte.mandaFresco(CHIAVE, m), orologio.ora)
    t.altro = altro
    return t
  }
  const a = nuovo('lorenzo01', 'marta0001'), b = nuovo('marta0001', 'lorenzo01')
  a.ponte.avvia(); b.ponte.avvia()
  orologio.ogni(OGNI_QUI, () => {
    for (const t of [a, b]) {
      if (r() < 0.02) t.cammina = !t.cammina
      if (t.cammina) t.x += 0.5
      t.spedisci(qui({ x: t.x, z: t.z, d: 0 }), ABITO)
    }
  })
  /* chi guarda: il contadino dell'altro c'è finché le notizie non si fermano per `sparisce` */
  const guarda = () => {
    for (const t of [a, b]) {
      const ora = orologio.ora(), via = ora - t.visto > sparisce
      if (via && t.assenteDa === null) t.assenteDa = ora
      if (!via && t.assenteDa !== null) { t.assenze.push(ora - t.assenteDa); t.assenteDa = null }
    }
  }
  orologio.ogni(50, guarda)
  orologio.avanti(3000)                                  // si collegano e si vedono: il conto parte da qui
  for (const t of [a, b]) { t.assenze = []; t.assenteDa = null; t.cadute = 0 }
  return { orologio, rete, a, b, r }
}
