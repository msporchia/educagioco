// Gli amici di un bambino (docs/core/amici.md): chi sono, la chiave di ogni amicizia, e se le funzioni online sono accese.
// Sta fuori dal profilo, una chiave per bambino (`amici:<id>`), e non entra nei backup: le chiavi sono dei due telefoni.
import { reactive, toRaw } from 'vue'
import { load, save, flush } from './storage.js'
import { leggiIstantanea } from '../amici/istantanea.js'

// Di partenza le funzioni online sono SPENTE e si chiedono ai genitori (nel modulo del bambino nuovo). Quando si vorrà che di
// base siano accese si cambia questa riga sola.
export const AMICI_DI_BASE = false
export const MAX_AMICI = 6
export const NOME_MAX = 20
export const SORPASSI_MAX = 12
const PREFISSO = 'amici:'
const SIGLA = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function casuale(n) {
  const b = new Uint8Array(n)
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(b)
  else for (let i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256)
  return Array.from(b, x => SIGLA[x % SIGLA.length]).join('')
}

/* lo stato del bambino di turno; `deciso` è falso finché un grande non ha risposto alla domanda (serve all'avviso nella posta) */
export const dati = reactive({ giocatore: null, id: '', deciso: false, attivo: false, online: true, amici: [], sorpassi: [] })

const pulisci = a => (Array.isArray(a) ? a : []).filter(x => x && /^[a-z0-9]{32}$/.test(x.chiave || ''))
  .map(x => ({ chiave: x.chiave, id: /^[a-z0-9]{8,32}$/.test(x.id || '') ? x.id : null, nome: String(x.nome || '').slice(0, NOME_MAX), visto: Number(x.visto) || 0,
               bacheca: leggiIstantanea(x.bacheca) }))
  .slice(0, MAX_AMICI)
// i sorpassi da dire in home: chi, in quale gioco, se una tappa o un record; uno per amico e gioco
const pulisciSorpassi = (s, amici) => (Array.isArray(s) ? s : [])
  .filter(x => x && amici.some(a => a.chiave === x.chiave) && /^[a-z0-9-]{1,32}$/.test(x.gioco || '') && ['tappa', 'record'].includes(x.tipo))
  .map(x => ({ chiave: x.chiave, gioco: x.gioco, tipo: x.tipo })).slice(-SORPASSI_MAX)

// La risposta data nel modulo del bambino nuovo, prima che il suo profilo esista: la prende il primo `carica` di quel profilo
let sceltaPendente = null
export const ricordaScelta = si => { sceltaPendente = si === null ? null : !!si }

export async function carica(giocatore) {
  dati.giocatore = giocatore
  const d = giocatore ? await load(PREFISSO + giocatore) : null
  dati.id = /^[a-z0-9]{8,32}$/.test(d?.id || '') ? d.id : casuale(16)
  dati.deciso = d?.deciso === true
  dati.attivo = d?.attivo === true
  dati.online = d?.online !== false
  dati.amici = pulisci(d?.amici)
  dati.sorpassi = pulisciSorpassi(d?.sorpassi, dati.amici)
  if (giocatore && !d) {
    if (sceltaPendente !== null) { dati.attivo = sceltaPendente; dati.deciso = true; sceltaPendente = null }
    scrivi()
  }
}

// mai il booleano nudo: storage.js scarta un `true` salvato da solo (docs/core/archivio.md)
function scrivi() {
  if (!dati.giocatore) return
  // toRaw: la bacheca dentro l'amico è un oggetto reattivo, e IndexedDB non lo copia (si finirebbe nel ripiego, docs/core/archivio.md)
  save(PREFISSO + dati.giocatore, { id: dati.id, deciso: dati.deciso, attivo: dati.attivo, online: dati.online, amici: dati.amici.map(a => ({ ...toRaw(a) })),
    sorpassi: dati.sorpassi.map(x => ({ ...x })) })
  return flush()
}

/* un grande risponde alla domanda «amici online?» (nel modulo del bambino nuovo o dalla carta nei grandi) */
export function accendi(si) { dati.attivo = !!si; dati.deciso = true; return scrivi() }
export function mettiOnline(si) { dati.online = !!si; return scrivi() }

/* una amicizia nuova (la chiave è l'unica cosa che c'è: nome e id si imparano quando ci si incontra) */
export function aggiungi(chiave) {
  if (dati.amici.some(a => a.chiave === chiave) || dati.amici.length >= MAX_AMICI) return false
  dati.amici.push({ chiave, id: null, nome: '', visto: 0, bacheca: null })
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

/* l'ultima istantanea dell'amico letta dalla sua bacheca (docs/core/amici-bacheca.md): si tiene qui, anche quando sul servizio
   è scaduta, finché l'amicizia c'è. Si scrive solo se dice qualcosa di nuovo. */
export function ricorda(chiave, istantanea) {
  const a = dati.amici.find(x => x.chiave === chiave)
  const ist = leggiIstantanea(istantanea)
  if (!a || !ist || JSON.stringify(ist) === JSON.stringify(a.bacheca)) return false
  a.bacheca = ist
  scrivi()
  return true
}

/* un amico ci è passato davanti (`lista` da `sorpassi` in amici/istantanea.js): l'ultimo per amico e gioco va in fondo */
export function segnaSorpassi(chiave, lista) {
  if (!lista?.length) return false
  const nuovi = lista.map(x => ({ chiave, gioco: x.gioco, tipo: x.tipo }))
  dati.sorpassi = pulisciSorpassi([...dati.sorpassi.filter(x => !(x.chiave === chiave && nuovi.some(n => n.gioco === x.gioco))), ...nuovi], dati.amici)
  scrivi()
  return true
}

/* aperto il gioco (o toccata la riga), i suoi sorpassi sono detti */
export function levaSorpassi(gioco) {
  const n = dati.sorpassi.length
  dati.sorpassi = dati.sorpassi.filter(x => x.gioco !== gioco)
  if (dati.sorpassi.length !== n) scrivi()
}

export function togli(chiave) {
  const n = dati.amici.length
  dati.amici = dati.amici.filter(a => a.chiave !== chiave)
  dati.sorpassi = dati.sorpassi.filter(x => x.chiave !== chiave)
  if (dati.amici.length !== n) scrivi()
  return dati.amici.length !== n
}
