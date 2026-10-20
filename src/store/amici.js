// Gli amici di un bambino (docs/core/amici.md): chi sono, la chiave di ogni amicizia, e se le funzioni online sono accese.
// Sta fuori dal profilo, una chiave per bambino (`amici:<id>`), e non entra nei backup: le chiavi sono dei due telefoni.
import { reactive } from 'vue'
import { load, save, flush } from './storage.js'

// Di partenza le funzioni online sono SPENTE e si chiedono ai genitori (nel modulo del bambino nuovo). Quando si vorrà che di
// base siano accese si cambia questa riga sola.
export const AMICI_DI_BASE = false
export const MAX_AMICI = 6
export const NOME_MAX = 20
const PREFISSO = 'amici:'
const SIGLA = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function casuale(n) {
  const b = new Uint8Array(n)
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(b)
  else for (let i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256)
  return Array.from(b, x => SIGLA[x % SIGLA.length]).join('')
}

/* lo stato del bambino di turno; `deciso` è falso finché un grande non ha risposto alla domanda (serve all'avviso nella posta) */
export const dati = reactive({ giocatore: null, id: '', deciso: false, attivo: false, online: true, amici: [] })

const pulisci = a => (Array.isArray(a) ? a : []).filter(x => x && /^[a-z0-9]{32}$/.test(x.chiave || ''))
  .map(x => ({ chiave: x.chiave, id: /^[a-z0-9]{8,32}$/.test(x.id || '') ? x.id : null, nome: String(x.nome || '').slice(0, NOME_MAX), visto: Number(x.visto) || 0 }))
  .slice(0, MAX_AMICI)

export async function carica(giocatore) {
  dati.giocatore = giocatore
  const d = giocatore ? await load(PREFISSO + giocatore) : null
  dati.id = /^[a-z0-9]{8,32}$/.test(d?.id || '') ? d.id : casuale(16)
  dati.deciso = d?.deciso === true
  dati.attivo = d?.attivo === true
  dati.online = d?.online !== false
  dati.amici = pulisci(d?.amici)
  if (giocatore && !d) scrivi()
}

// mai il booleano nudo: storage.js scarta un `true` salvato da solo (docs/core/archivio.md)
function scrivi() {
  if (!dati.giocatore) return
  save(PREFISSO + dati.giocatore, { id: dati.id, deciso: dati.deciso, attivo: dati.attivo, online: dati.online, amici: dati.amici.map(a => ({ ...a })) })
  return flush()
}

/* un grande risponde alla domanda «amici online?» (nel modulo del bambino nuovo o dalla carta nei grandi) */
export function accendi(si) { dati.attivo = !!si; dati.deciso = true; return scrivi() }
export function mettiOnline(si) { dati.online = !!si; return scrivi() }

/* una amicizia nuova (la chiave è l'unica cosa che c'è: nome e id si imparano quando ci si incontra) */
export function aggiungi(chiave) {
  if (dati.amici.some(a => a.chiave === chiave) || dati.amici.length >= MAX_AMICI) return false
  dati.amici.push({ chiave, id: null, nome: '', visto: 0 })
  scrivi()
  return true
}

/* l'altro si presenta: si tiene il nome (e si aggiorna se lo cambia) */
export function impara(chiave, id, nome) {
  const a = dati.amici.find(x => x.chiave === chiave)
  if (!a) return false
  const n = String(nome || '').trim().slice(0, NOME_MAX)
  if (a.id === id && a.nome === n) { a.visto = Date.now(); return true }
  a.id = id; a.nome = n; a.visto = Date.now()
  scrivi()
  return true
}

export function togli(chiave) {
  const n = dati.amici.length
  dati.amici = dati.amici.filter(a => a.chiave !== chiave)
  if (dati.amici.length !== n) scrivi()
  return dati.amici.length !== n
}
