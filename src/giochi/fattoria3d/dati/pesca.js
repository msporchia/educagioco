/* La pesca: i numeri e il pesce, dato puro (le regole stanno in motore/pesca.js). Si lancia la lenza da un molo o dal porticciolo in un
   pezzo d'acqua che è tuo, si aspetta `ms` (come un campo che cresce: vale anche a pagina chiusa), si ritira. Un banco (un lotto d'acqua tuo)
   dà pesce e poi si ripopola: non si esaurisce mai per sempre. Il pesce è una merce come le uova: sta in `stato.prodotti.pesce`, ha la faccia
   della 2D (`merce_pesce`) ed è l'ingrediente della friggitoria e del sushi bar. Niente si vende. Vedi docs/fattoria3d/geografia-e-pesca.md. */

import { ricetta2d, msDaMinuti } from './parita2d.js'

/* I tempi: nella 2D il pesce lo fa la peschiera in 15 minuti (ricetta `pesce`). La pesca della 3D non ha un equivalente, e prende il suo posto
   (al livello della peschiera, 57): un banco dà il suo pesce ogni 15 minuti, come la peschiera, un terzo ad aspettare che abbocchi e il resto a ripopolarsi.
   Più lotti d'acqua tuoi, più lenze in parallelo; il porticciolo e il mare danno più pesci per lancio (il premio per averli messi). */
const CICLO_MS = msDaMinuti(ricetta2d('pesce').minuti)
export const PESCA = {
  ms: CICLO_MS / 3,                  // dal lancio all'«abbocca!»: cinque minuti (come un campo di grano)
  riposoMs: CICLO_MS - CICLO_MS / 3, // dopo un pesce il banco si ripopola per dieci minuti: il ciclo intero fa quindici
  raggio: 6,          // da quante celle di distanza si lancia da un molo o dal porticciolo
  base: 1,            // pesci a lancio da un molo, in acqua dolce
  perPorticciolo: 1,  // in più se hai il porticciolo (le reti, la barca)
  perMare: 1,         // in più nel mare, dove si pesca solo col porticciolo: lo stesso pesce, ma più abbondante
}

/** Quanti pesci dà un lancio. `mare`: l'acqua è di mare; `porticciolo`: ce n'è uno in mappa. */
export const resaDellaPesca = ({ mare = false, porticciolo = false } = {}) => PESCA.base + (porticciolo ? PESCA.perPorticciolo : 0) + (mare ? PESCA.perMare : 0)

/** Il pesce della 2D (`PRODOTTI.pesce`: stesso nome, stessa faccia). `dove` è il pezzo che lo fa (come per le uova è il pollaio): da lì il livello. */
export const PESCI = {
  pesce: { nome: 'Pesce', emoji: '🐟', pezzo: 'merce_pesce', dove: 'molo', ms: CICLO_MS },        // per i conti dei tempi un pesce costa un ciclo del banco (15 minuti, come alla peschiera)
}

export function guastiDellaPesca() {
  const g = []
  for (const [k, v] of Object.entries(PESCA)) if (!(v > 0)) g.push(`PESCA.${k} non positivo`)
  if (PESCA.ms + PESCA.riposoMs !== CICLO_MS) g.push('un banco non dà un pesce ogni 15 minuti come la peschiera della 2D')
  if (!(PESCA.ms >= 3 * 60000 && PESCA.ms <= 10 * 60000)) g.push('l\'attesa della lenza sta fra 3 e 10 minuti')
  for (const [k, p] of Object.entries(PESCI)) if (!p.nome || !p.emoji || !p.pezzo || !p.dove) g.push(`${k}: nome, emoji, pezzo o luogo mancanti`)
  if (resaDellaPesca({ mare: true, porticciolo: true }) <= resaDellaPesca({ mare: false, porticciolo: false })) g.push('il mare e il porticciolo devono rendere di più')
  return g
}
