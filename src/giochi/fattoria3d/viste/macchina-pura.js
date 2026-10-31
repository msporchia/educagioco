// Il conto puro del foglio di una macchina (Macchina.vue), senza DOM: quante ricette si possono fare, in che ordine stanno le carte,
// com'è fatto un posto della fila, dove cade il dito e che gesto è. Vedi docs/fattoria3d/file.md («Il foglio della macchina»).
import { SCARTO_DITO, SCARTO_MOUSE } from './dito-soglie.js'

/** Da quanto un dito fermo, che poi si muove, vuole trascinare in qualunque verso (ms). Sotto, un gesto verticale è uno scorrimento. */
export const TENUTO_MS = 160

/** Quante volte si può fare una ricetta con le scorte: il minimo di `ha / serve` sugli ingredienti `[{ ha, serve }]` (0 se manca qualcosa). */
export function quanteNePuoiFare(ing) {
  if (!ing || !ing.length) return 0
  let n = Infinity
  for (const i of ing) n = Math.min(n, i.serve > 0 ? Math.floor(i.ha / i.serve) : 0)
  return Number.isFinite(n) ? n : 0
}

/** L'ordine delle carte: prima le aperte (nell'ordine dei dati, che il gioco non cambia al variare delle scorte: le carte non ballano),
 *  poi quelle ancora chiuse, dalla più vicina alla più lontana. */
export function ordinaRicette(ricette) {
  const a = ricette.filter(r => r.sbloccata), c = ricette.filter(r => !r.sbloccata).sort((x, y) => x.liv - y.liv)
  return [...a, ...c]
}

/** Lo stato di un posto della fila: `libero`, `cuoce` (ha un tempo) o `aspetta` (in coda, il forno non l'ha ancora preso). */
export const statoDelPosto = p => (!p ? 'libero' : p.testo === 'in coda' ? 'aspetta' : 'cuoce')

/** Il primo posto libero (o -1): dove va la ricetta lasciata sulla fila. */
export const primoLibero = forno => forno.findIndex(p => !p)

const dentro = (x, y, r, m = 0) => !!r && x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m

/** Cosa c'è sotto il dito: un posto (`{ tipo: 'posto', i }`), la zona della macchina e della fila (`{ tipo: 'fila' }`) o niente (`null`).
 *  `posti` e `zone` sono rettangoli `{ left, top, right, bottom }`; i posti vincono sulla zona. */
export function bersaglioSotto(x, y, posti, zone, margine = 8) {
  for (let i = 0; i < posti.length; i++) if (dentro(x, y, posti[i], margine)) return { tipo: 'posto', i }
  return zone.some(z => dentro(x, y, z)) ? { tipo: 'fila' } : null
}

/** Che gesto è un dito che dal punto di pressione è andato di `dx`, `dy` in `ms` millisecondi: `fermo`, `scorri` o `trascina`.
 *  Il mouse trascina subito. Il dito trascina di lato, o in qualunque verso se la carta è stata tenuta (TENUTO_MS), o se il foglio non
 *  scorre; altrimenti su e giù è lo scorrimento del foglio. */
export function gestoDelDito({ dx, dy, ms = 0, mouse = false, puoScorrere = true }) {
  if (Math.hypot(dx, dy) <= (mouse ? SCARTO_MOUSE : SCARTO_DITO)) return 'fermo'
  if (mouse || !puoScorrere || ms >= TENUTO_MS || Math.abs(dx) > Math.abs(dy)) return 'trascina'
  return 'scorri'
}
