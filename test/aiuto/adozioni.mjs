// Per i test della fattoria 3D che vogliono Watson e i gatti di casa già in casa: nessun animale arriva più da solo col livello (docs/fattoria3d/adozioni.md),
// quindi un test che ne ha bisogno li adotta così, scrivendo il record come farebbe `cura.compra` (senza pagare).
import { CURATI, nuovo } from '../../src/giochi/fattoria3d/dati/bestie.js'

/** Mette in `casa` i compagni di `ids` (di serie: tutti) con i bisogni di un animale appena preso. Torna `f`. */
export function adottaCompagni(f, ids = Object.keys(CURATI), ora = Date.now()) {
  for (const id of ids) if (!f.s.casa[id]) f.s.casa[id] = { ...nuovo(ora), premiato: false }
  return f
}
