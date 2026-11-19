// Il castello a scuola (docs/castello/scuola.md): la tappa del limite e il racconto di un conto per la maestra. Puro.
import { TAPPE, chiaveTappa } from '../../data/castello.js'

export const LUNGO = 40

// `{ tappa: 'bosco/Il sentiero' }` → l'indice in TAPPE; null senza limite o con una tappa che non c'è (a casa)
export function tappaDelLimite(limite) {
  if (!limite || typeof limite !== 'object' || typeof limite.tappa !== 'string') return null
  const i = TAPPE.findIndex(t => chiaveTappa(t) === limite.tappa)
  return i < 0 ? null : i
}

const taglia = s => (s.length <= LUNGO ? s : s.slice(0, LUNGO - 1) + '…')

// un conto finito: giusto se scritto senza errori, e chiude sempre la domanda (la colonna finisce comunque)
export function raccontaConto(op, chiave, { errori = 0, ms = 0 } = {}) {
  const giusto = op.tipo === 'div' && op.resto ? `${op.risultato} resto ${op.resto}` : String(op.risultato)
  return {
    chiave, giusta: errori === 0, ms: Math.round(ms), ultima: true,
    fatto: taglia((op.numeri || [op.a, op.b]).join(op.segno)),
    data: taglia(errori ? `${giusto} · ${errori} ${errori === 1 ? 'errore' : 'errori'}` : giusto),
    attesa: taglia(giusto),
  }
}
