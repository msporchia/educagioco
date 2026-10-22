/* La scala dei livelli di prima del 22/10/2026 (22 livelli, ~11 ore di esercizio) e come un'esperienza salvata su quella scala si porta sulla scala
   della 2D (70 livelli, ~200 ore): così un salvataggio 3D di ieri non perde niente. Funzioni pure.

   Le soglie di prima sono congelate qui (erano calcolate dai prezzi di allora, che non esistono più): il livello `l` di prima iniziava a
   `SOGLIE_DI_PRIMA[l - 1]` monete spese. Oltre il 22 la formula continuava (`1,25 · ((n-1)² + 47·(n-1))`, più il costo di tutto ciò che c'era).
   La scelta (documentata in docs/fattoria3d/livelli.md, «I salvataggi di prima»): il livello di prima sta nello stesso punto del percorso
   (`1 + (L − 1) · 69 / 21`), con la frazione già fatta, e **non scende mai sotto quello che serve a tenere ciò che si ha**
   (un edificio, un pezzo che produce, una coltura già in scorta o seminata): la stessa regola di `statoDa2D` (motore/migra.js). */
import { sogliaDi, livelloDelPezzo, livelloDellaColtura } from '../dati/livelli.js'
import { PEZZI, EDIFICI } from '../dati/catalogo.js'
import { ULTIMO_2D } from '../dati/parita2d.js'

export const SOGLIE_DI_PRIMA = [0, 60, 160, 290, 405, 530, 680, 840, 990, 1160, 1340, 1550, 1750, 1970, 2200, 2440, 2700, 2970, 3250, 3435, 3665, 3905]
export const ULTIMO_DI_PRIMA = SOGLIE_DI_PRIMA.length                // 22
const COSTO_DI_TUTTO_DI_PRIMA = 2255                                 // quanto costava la roba dei 22 livelli: dal 23 la formula somma questo e basta

const passiDiPrima = l => Math.round(1.25 * ((l - 1) ** 2 + 47 * (l - 1)) / 10) * 10
/** Dove cominciava il livello `l` sulla scala di prima. */
export const sogliaDiPrima = l => { const n = Math.max(1, l | 0); return n <= ULTIMO_DI_PRIMA ? SOGLIE_DI_PRIMA[n - 1] : passiDiPrima(n) + COSTO_DI_TUTTO_DI_PRIMA }

/** Il livello di una vecchia esperienza sulla scala di prima. */
export function livelloDiPrima(esperienza) {
  const e = Math.max(0, Number.isFinite(esperienza) ? esperienza : 0)
  let l = 1
  while (sogliaDiPrima(l + 1) <= e && l < 1000) l++
  return l
}

/** Il livello nuovo che sta nello stesso punto del percorso: il 1 resta 1, l'ultimo di prima (22) è l'ultimo della 2D (70), oltre si va a passo di uno. */
export function livelloNuovoPer(livelloVecchio) {
  const l = Math.max(1, livelloVecchio | 0)
  if (l >= ULTIMO_DI_PRIMA) return ULTIMO_2D + (l - ULTIMO_DI_PRIMA)
  return 1 + Math.round((l - 1) * (ULTIMO_2D - 1) / (ULTIMO_DI_PRIMA - 1))
}

/** Il livello che serve a tenere ciò che c'è nello stato (letto già in forma): ogni edificio e ogni pezzo che produce, ogni coltura in scorta o seminata. */
export function livelloMinimoDi(s) {
  let l = 1
  const tipi = [...(s.cose || []).map(c => c.tipo), ...Object.keys(s.magazzino || {})]
  for (const t of tipi) if (EDIFICI[t] || (PEZZI[t] && PEZZI[t].produttivo)) l = Math.max(l, livelloDelPezzo(t))
  for (const [k, n] of Object.entries(s.merci || {})) if (n > 0) l = Math.max(l, livelloDellaColtura(k))
  for (const c of s.cose || []) if (c.tipo === 'campo' && c.coltura && (c.tile || []).some(t => t !== null)) l = Math.max(l, livelloDellaColtura(c.coltura))
  return l
}

/** L'esperienza sulla scala nuova per un'esperienza salvata su quella di prima; `minimo`: il livello sotto cui non si scende. */
export function esperienzaDaPrima(esperienza, minimo = 1) {
  const e = Math.max(0, Number.isFinite(esperienza) ? esperienza : 0)
  const vecchio = livelloDiPrima(e)
  let nuovo = livelloNuovoPer(vecchio)
  const da = sogliaDiPrima(vecchio), a = sogliaDiPrima(vecchio + 1)
  let frazione = a > da ? (e - da) / (a - da) : 0
  if (minimo > nuovo) { nuovo = minimo; frazione = 0 }
  return sogliaDi(nuovo) + Math.floor(frazione * (sogliaDi(nuovo + 1) - sogliaDi(nuovo)))
}
