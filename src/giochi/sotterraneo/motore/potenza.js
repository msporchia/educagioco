// Quanto vale un mostro battuto (docs/sotterraneo/livelli.md, «Il mostro porta quello che è»): la potenza dalle sue caratteristiche
// vere (ossa, attacco, difesa, protezioni, arma, incanto, grado), da cui esperienza e gemme (dati/livelli.js). Gira in Node.
import { potenzaDi } from '../dati/livelli.js'
import { PREMIO_DEL_GRADO } from '../dati/varianti.js'
import { difeseDi } from '../dati/grossi.js'

export function potenzaDelMostro(m) {
  const d = difeseDi(m)
  return potenzaDi({ ossa: m.ossaMax != null ? m.ossaMax : m.ossa, att: m.att, dif: m.dif, protezioni: d.resiste.length + d.immune.length,
                     arma: !!m.arma, incanto: !!m.incanto, premio: PREMIO_DEL_GRADO[m.grado] || 1 })
}
