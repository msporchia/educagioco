// Castle Battle a scuola (docs/arena/scuola.md): la tappa del limite, il livello del nemico e il racconto di un calcolo per la
// maestra. Puro.
import { CAMPAGNA } from '../dati/campagna.js'

export const LUNGO = 40

// `{ tappa: 'ponte' }` → l'indice in CAMPAGNA; null senza limite o con una tappa che non c'è (a casa)
export function tappaDelLimite(limite) {
  if (!limite || typeof limite !== 'object' || typeof limite.tappa !== 'string') return null
  const i = CAMPAGNA.findIndex(t => t.chiave === limite.tappa)
  return i < 0 ? null : i
}

// la difficoltà della scuola è il livello del nemico, già tarato per ogni tappa (dati/taratura.js); a casa la campagna è il Medio
const LIVELLO = { facile: 'facile', normale: 'medio', difficile: 'difficile' }
export const livelloDelLimite = limite => LIVELLO[limite?.difficolta] || 'medio'

const taglia = s => (s.length <= LUNGO ? s : s.slice(0, LUNGO - 1) + '…')
const detta = (d, i) => {
  const r = Number.isInteger(i) ? d?.risposte?.[i] : null
  if (!r) return '—'
  return taglia(String(r.testo ?? r.nome ?? r.emoji ?? '—'))
}

// un calcolo risposto (l'evento `risposto` di quiz/Domanda.vue): «7 + 5», detto e atteso; ognuno chiude la sua domanda
export function raccontaCalcolo(d, { giusto, indice, tempo = 0 } = {}) {
  const testo = String(d?.testo ?? '').trim()
  const conto = /^(.+?)\s*=\s*\?$/.exec(testo)
  return {
    chiave: String(d?.chiave ?? 'arena:calcolo'), giusta: !!giusto, ms: Math.round(Math.max(0, tempo) * 1000), ultima: true,
    fatto: taglia(conto ? conto[1] : testo), data: detta(d, indice), attesa: detta(d, d?.giusta),
  }
}
