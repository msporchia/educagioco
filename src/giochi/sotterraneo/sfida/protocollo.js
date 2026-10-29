// Il sotterraneo in due, cosa viaggia fra i due telefoni (docs/sotterraneo/in-due-codice.md, «Cosa dà il sotterraneo al pezzo comune»):
// la mossa, l'impronta, la proposta di chi crea e la parte di ognuno (il suo eroe). Dato puro, senza rete né schermi.
import { CHIAVI_DEI_DUNGEON } from '../motore/rigenera.js'
import { DIFFICOLTA } from '../motore/forza.js'
import { EROI } from '../dati/eroi.js'
import { CAMPAGNA } from '../dati/campagna.js'
import { DUNGEON_NUOVI } from '../dati/dungeon-del-mondo.js'
import { MOSTRI } from '../dati/mostri.js'
import { COSE } from '../dati/cose.js'

// si alza quando cambia qualcosa che le due copie devono fare uguale (il motore, le regole in due); i dati (discese, mostri, roba)
// li firma `firmaDeiDati`, così due telefoni con le tabelle diverse non partono
export const VERSIONE_SFIDA = 1
let firma = null
export function firmaDeiDati() {
  if (firma) return firma
  const testo = JSON.stringify([CAMPAGNA, DUNGEON_NUOVI, MOSTRI, COSE, EROI])
  let h = 2166136261
  for (let i = 0; i < testo.length; i++) { h ^= testo.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  return (firma = h.toString(36))
}

const intero = (n, min = 0, max = 9999) => Number.isInteger(n) && n >= min && n <= max
const bit = n => n === 0 || n === 1
const parola = s => typeof s === 'string' && s.length <= 40 && /^[a-zA-Z0-9_-]*$/.test(s)

/* le mosse: [azione, ...argomenti]. Chi la fa lo dice il ruolo (il lockstep), non la mossa */
export const MOSSE = {
  vai: [intero, intero, bit],            // x, y, 1 = tocca quello che c'è (la porta, il mostro), 0 = cammina e basta
  rispondi: [intero, bit],               // l'id della domanda (una vecchia non vale), giusta
  scendi: [], sali: [], nonAspetto: [], chiudi: [], riprendi: [], continua: [],
  bersaglio: [intero],                   // il posto del mostro nello scontro
  prepara: [parola],                     // l'abilità per la prossima risposta giusta ('' la toglie)
  bevi: [intero],                        // la pozione nello zaino
  beviEnergia: [],
  usa: [intero, parola], butta: [intero], riponi: [parola], indossa: [intero, parola], pergamena: [intero],
  // l'albero e le tasche (la pagina dell'eroe, giù): si possono toccare anche in due, ma passano dal lockstep
  impara: [parola], casella: [intero, parola], punto: [parola], tasca: [], riassegna: [], dimentica: [],
}
export function mossaValida(m) {
  if (!Array.isArray(m) || typeof m[0] !== 'string' || !Object.prototype.hasOwnProperty.call(MOSSE, m[0])) return false
  const tipi = MOSSE[m[0]]
  return m.length - 1 <= tipi.length && m.slice(1).every((v, i) => tipi[i](v))
}

/* l'impronta: quello che due copie uguali hanno uguale al bit (il motore è deterministico: niente tolleranza) */
export function improntaDi(c) {
  const vivi = c.livello.robe.filter(r => r.che === 'mostro' && !r.morto)
  const somma = f => vivi.reduce((n, m) => n + f(m), 0)
  return [c.piano, c.passi, c.finita ? 1 : 0, c.mostriBattuti, vivi.length, somma(m => Math.round((m.fx ?? m.x) * 1000)),
    somma(m => Math.round((m.fy ?? m.y) * 1000)), somma(m => m.ossa || 0), c.livello.robe.length,
    ...c.persone.flatMap(p => [p.vita, p.energia, Math.round(p.eroe.x * 1000), Math.round(p.eroe.y * 1000), p.gemme, p.zaino.length,
      p.foglio ? 1 : 0, p.domande])]
}
export const impronteSimili = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => x === b[i])

/* la proposta di chi crea: il posto, la difficoltà, il seme */
export const proponi = ({ chiave, difficolta, seme }) => ({ seme, chiave, difficolta })
export function accetta(p) {
  if (!p || !intero(p.seme, 0, 2 ** 31) || !CHIAVI_DEI_DUNGEON.includes(p.chiave) || !Object.prototype.hasOwnProperty.call(DIFFICOLTA, p.difficolta)) return 'proposta'
  return null
}

/* la parte di ognuno: il suo eroe com'è adesso nella sua avventura */
export const parteDi = ({ eroe, roba = null, crescita = null, nome = '' }) => JSON.parse(JSON.stringify({ eroe, roba, crescita, nome: String(nome).slice(0, 30) }))
export function accettaParte(p) {
  if (!p || typeof p !== 'object' || !EROI.some(e => e.chiave === p.eroe)) return 'parte'
  if (p.roba !== null && typeof p.roba !== 'object') return 'parte'
  if (p.crescita !== null && typeof p.crescita !== 'object') return 'parte'
  if (typeof p.nome !== 'string' || p.nome.length > 30) return 'parte'
  return null
}
