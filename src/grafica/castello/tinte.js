/* ═══════════════════════════════════════════════════════════════════
   LE TINTE DELLE TORRI

   L'unica cosa che il disegno del castello prende in prestito dal
   gioco: il bottone nel banco e la torre sul campo devono essere dello
   stesso colore, e quel colore è scritto una volta sola in
   `data/ops.js`.

   Lo scuro non è scelto a mano: è lo stesso colore con un terzo di luce
   in meno, così aggiungere una torre nuova non chiede anche di
   inventarsi la sua ombra.
   ═══════════════════════════════════════════════════════════════════ */
import { TORRI } from '../../data/ops.js'

const scuro = c => '#' + [1, 3, 5].map(i =>
  Math.round(parseInt(c.slice(i, i + 2), 16) * 0.62).toString(16).padStart(2, '0')).join('')

export const TINTA = {}
for (const k in TORRI) TINTA[k] = { chiaro: TORRI[k].colore, scuro: scuro(TORRI[k].colore) }
