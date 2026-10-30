// I messaggi che due amici si scambiano (docs/core/amici.md). Il servizio non li legge: la forma la controllano i telefoni.
// Niente testo libero: un nome (≤ 20), un gioco della lista, i dati di un invito. Mai una chat.
import { NOME_MAX } from '../store/amici.js'

const ID = /^[a-z0-9]{8,32}$/
const GIOCO = /^[a-z0-9-]{1,24}$/

export const presento = (id, nome, gioco = null) => ({ k: 'presento', id, nome: String(nome || '').slice(0, NOME_MAX), gioco })
export const invito = (gioco, dati) => ({ k: 'invito', gioco, dati })
export const risposta = ok => ({ k: 'risposta', ok: !!ok })
// «ho appena scritto la mia bacheca»: l'amico online la rilegge subito, invece di aspettare (docs/core/amici-bacheca.md)
export const bacheca = () => ({ k: 'bacheca' })
// la fattoria in comune (docs/fattoria3d/in-comune.md): dove sta il mio contadino, e il gesto che fa; `via` quando esco
export const GESTI = ['semina', 'falcia', 'abbatti', 'chiama', 'pesca', 'ritira', 'esulta']
const tondo = n => Math.round(n * 100) / 100
export const qui = ({ x, z, d, r = false, g = null, a = null }) => ({ k: 'qui', x: tondo(x), z: tondo(z), d: tondo(d), ...(r ? { r: true } : {}), ...(g ? { g } : {}), ...(a ? { a } : {}) })
export const via = () => ({ k: 'via' })
const numero = (n, max) => Number.isFinite(n) && Math.abs(n) <= max

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
  if (m.k === 'bacheca') return { k: 'bacheca' }
  if (m.k === 'qui') {
    if (!numero(m.x, 1e5) || !numero(m.z, 1e5) || !numero(m.d, 100)) return null
    const l = { k: 'qui', x: m.x, z: m.z, d: m.d, r: m.r === true, g: GESTI.includes(m.g) ? m.g : null, a: null }
    // l'abito: solo nomi brevi di capi; quali esistono lo dice normalizzaAbito, dove si usa
    if (m.a && typeof m.a === 'object' && !Array.isArray(m.a)) {
      const a = Object.entries(m.a).filter(([k, v]) => /^[a-z]{1,16}$/.test(k) && typeof v === 'string' && /^[a-z0-9_-]{1,24}$/i.test(v)).slice(0, 12)
      if (a.length) l.a = Object.fromEntries(a)
    }
    return l
  }
  if (m.k === 'via') return { k: 'via' }
  return null
}
