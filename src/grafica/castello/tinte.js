// Le tinte delle torri: il colore, scritto una volta in `data/ops.js`, e lo
// scuro derivato (un terzo di luce in meno), non scelto a mano.
import { TORRI } from '../../data/ops.js'

const scuro = c => '#' + [1, 3, 5].map(i =>
  Math.round(parseInt(c.slice(i, i + 2), 16) * 0.62).toString(16).padStart(2, '0')).join('')

export const TINTA = {}
for (const k in TORRI) TINTA[k] = { chiaro: TORRI[k].colore, scuro: scuro(TORRI[k].colore) }
