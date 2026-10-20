// Il filo verso il servizio degli amici (servizio/inoltro, docs/core/amici.md): i codici brevi e il collegamento di una amicizia.
// Regola: gli amici sono un di più e non danno mai errori. Il `Ponte` riprova da solo, in silenzio, con attese crescenti, e non
// riprova a schermo spento. Il resto del gioco non sa che esiste.
import { indirizzo } from '../giochi/arena/sfida/rete.js'

const ATTESA = 4000                                   // ms per fare una richiesta prima di darla per persa
const TENTATIVI = 3

async function chiedi(percorso, corpo, { servizio = indirizzo(), fetchImpl = globalThis.fetch, tentativi = TENTATIVI, attesa = ATTESA } = {}) {
  for (let i = 0; i < tentativi; i++) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), attesa)
    try {
      const r = await fetchImpl(`${servizio}${percorso}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo), signal: ctl.signal })
      const dato = await r.json().catch(() => ({}))
      clearTimeout(t)
      return { stato: r.status, ok: r.ok, dato }
    } catch { clearTimeout(t) }
  }
  return null                                          // senza rete: chi chiama lo dice solo se il bambino l'ha chiesto
}

/* un codice di 5 lettere per l'amicizia con questa chiave: { codice, scade } o un errore con la frase da dire */
export async function creaCodice(chiave, opzioni) {
  const r = await chiedi('/amici/codice', { chiave }, opzioni)
  if (!r) throw new Error('non riesco a collegarmi: serve internet')
  if (r.stato === 429) throw new Error('troppi codici, riprova fra un po\'')
  if (!r.ok || !/^[A-Z]{5}$/.test(r.dato.codice || '')) throw new Error('il servizio degli amici non risponde ora')
  return r.dato
}

/* il codice dell'amico: torna la chiave dell'amicizia, o un errore con la frase da dire */
export async function riscattaCodice(codice, opzioni) {
  const r = await chiedi('/amici/riscatta', { codice: String(codice || '').toUpperCase() }, opzioni)
  if (!r) throw new Error('non riesco a collegarmi: serve internet')
  if (r.stato === 429) throw new Error('troppi tentativi, riprova fra un minuto')
  if (r.stato === 404) throw new Error('questo codice non c\'è o è scaduto')
  if (!r.ok || !/^[a-z0-9]{32}$/.test(r.dato.chiave || '')) throw new Error('il servizio degli amici non risponde ora')
  return r.dato.chiave
}

export const RITARDI = [2000, 4000, 8000, 16000, 32000, 60000]

/* L'UNICO collegamento di questo telefono verso il servizio degli amici (docs/core/amici.md), che si rimette in piedi da solo.
   Dichiara chi è (`id`) e le chiavi delle sue amicizie (`chiavi()` le legge ogni volta: aggiungerne una è solo `imposta()`).
   `alMessaggio(chiave, oggetto)` per quello che manda un amico, `alCambio()` quando cambia aperto/chi c'è. */
export class Ponte {
  constructor({ id, chiavi = () => [], servizio, WebSocketImpl = globalThis.WebSocket, alMessaggio = () => {}, alCambio = () => {}, ritardi = RITARDI,
                attesaApertura = 5000, visibile = () => typeof document === 'undefined' || !document.hidden }) {
    Object.assign(this, { id, chiavi, servizio, WebSocketImpl, alMessaggio, alCambio, ritardi, attesaApertura, visibile })
    this.aperto = false
    this.presenti = new Set()          // le chiavi il cui amico è collegato adesso
    this.fermo = true
    this.ws = null
    this.prova = 0
    this.timer = 0
  }

  avvia() { this.fermo = false; this.apri() }

  apri() {
    clearTimeout(this.timer)
    if (this.fermo || this.ws || !this.visibile()) return
    let w
    try { w = new this.WebSocketImpl(`${(this.servizio || indirizzo()).replace(/^http/, 'ws')}/amici/presenza`) } catch { return this.riprova() }
    this.ws = w
    const mio = () => this.ws === w
    const lento = setTimeout(() => { if (mio() && !this.aperto) { try { w.close() } catch { /* già chiuso */ } this.cadi() } }, this.attesaApertura)
    w.addEventListener('open', () => {
      if (!mio()) return
      clearTimeout(lento); this.aperto = true; this.prova = 0
      this.dichiara()                                                    // chi sono e con chi sono in amicizia
      this.alCambio()
    })
    w.addEventListener('message', e => {
      if (!mio()) return
      let m
      try { m = JSON.parse(e.data) } catch { return }
      if (!m || typeof m !== 'object') return
      if (m.t === 'ciao') { this.presenti = new Set(Array.isArray(m.presenti) ? m.presenti : []); this.alCambio() }
      else if (m.t === 'su' && typeof m.chiave === 'string') { this.presenti.add(m.chiave); this.alCambio() }
      else if (m.t === 'giu' && typeof m.chiave === 'string') { this.presenti.delete(m.chiave); this.alCambio() }
      else if (m.t === 'da' && typeof m.chiave === 'string' && m.m && typeof m.m === 'object') this.alMessaggio(m.chiave, m.m)
    })
    const chiuso = () => { clearTimeout(lento); if (mio()) this.cadi() }
    w.addEventListener('close', chiuso)
    w.addEventListener('error', chiuso)
  }

  dichiara() { this.manda({ k: 'dichiaro', id: this.id, chiavi: this.chiavi() }) }

  /* le amicizie sono cambiate (una in più o in meno): si dice al servizio, a collegamento aperto */
  imposta() { if (this.aperto) this.dichiara() }

  /* il collegamento è finito: si riprova più tardi, in silenzio */
  cadi() {
    const c = this.aperto || this.presenti.size
    this.ws = null; this.aperto = false; this.presenti = new Set()
    if (c) this.alCambio()
    this.riprova()
  }

  riprova() {
    if (this.fermo) return
    const ritardo = this.ritardi[Math.min(this.prova++, this.ritardi.length - 1)]
    clearTimeout(this.timer)
    this.timer = setTimeout(() => this.apri(), ritardo)
  }

  /* lo schermo torna acceso: si riprova subito invece di aspettare */
  riprendi() { this.prova = 0; this.apri() }

  manda(oggetto) {
    if (!this.aperto || !this.ws) return false
    try { this.ws.send(JSON.stringify(oggetto)); return true } catch { return false }
  }

  /* un messaggio per l'amico di quella amicizia */
  invia(chiave, m) { return this.manda({ k: 'a', chiave, m }) }

  chiudi() {
    this.fermo = true
    clearTimeout(this.timer)
    const w = this.ws
    this.ws = null; this.aperto = false; this.presenti = new Set()
    try { w?.close() } catch { /* già chiuso */ }
  }
}
