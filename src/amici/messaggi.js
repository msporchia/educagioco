// I messaggi che due amici si scambiano (docs/core/amici.md). Il servizio non li legge: la forma la controllano i telefoni.
// Niente testo libero: un nome (≤ 20), un gioco della lista, i dati di un invito. Mai una chat.
import { NOME_MAX } from '../store/amici.js'

const ID = /^[a-z0-9]{8,32}$/
const GIOCO = /^[a-z0-9-]{1,24}$/

export const presento = (id, nome, gioco = null) => ({ k: 'presento', id, nome: String(nome || '').slice(0, NOME_MAX), gioco })
export const invito = (gioco, dati) => ({ k: 'invito', gioco, dati })
export const risposta = ok => ({ k: 'risposta', ok: !!ok })

/* un messaggio arrivato dall'amico: torna la forma pulita, o null se non è una cosa che sappiamo leggere */
export function leggi(m) {
  if (!m || typeof m !== 'object') return null
  if (m.k === 'presento') {
    if (!ID.test(m.id || '') || typeof m.nome !== 'string') return null
    return { k: 'presento', id: m.id, nome: m.nome.trim().slice(0, NOME_MAX), gioco: GIOCO.test(m.gioco || '') ? m.gioco : null }
  }
  if (m.k === 'invito') {
    if (!GIOCO.test(m.gioco || '') || !m.dati || typeof m.dati !== 'object' || Array.isArray(m.dati)) return null
    return { k: 'invito', gioco: m.gioco, dati: m.dati }
  }
  if (m.k === 'risposta') return typeof m.ok === 'boolean' ? { k: 'risposta', ok: m.ok } : null
  return null
}
