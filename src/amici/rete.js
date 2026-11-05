// Il filo verso il servizio degli amici (servizio/inoltro, docs/core/amici.md): i codici brevi e il collegamento di una amicizia.
// Regola: gli amici sono un di più e non danno mai errori. Il `Ponte` riprova da solo, in silenzio, con attese crescenti, e non
// riprova a schermo spento. Il resto del gioco non sa che esiste.
import { indirizzo, orologioVero } from '../insieme/rete.js'

const ATTESA = 4000                                   // ms per fare una richiesta prima di darla per persa
const TENTATIVI = 3

// `keepalive`: la richiesta parte anche se la pagina si sta chiudendo (la bacheca scritta quando l'app va in secondo piano)
async function chiedi(percorso, corpo, { servizio = indirizzo(), fetchImpl = globalThis.fetch, tentativi = TENTATIVI, attesa = ATTESA, keepalive = false } = {}) {
  for (let i = 0; i < tentativi; i++) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), attesa)
    try {
      const r = await fetchImpl(`${servizio}${percorso}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo), signal: ctl.signal, keepalive })
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

/* La bacheca di un'amicizia (docs/core/amici-bacheca.md): si lascia la propria istantanea (`dati`, o null per leggere soltanto) e
   si ritira quella dell'amico. Torna l'oggetto dell'amico, null se non ha scritto, undefined se non si è riusciti (in silenzio). */
export async function scambiaBacheca(chiave, id, dati, opzioni) {
  const r = await chiedi('/amici/bacheca', { chiave, id, dati }, { tentativi: 1, ...opzioni })
  if (!r || !r.ok) return undefined
  return r.dato && typeof r.dato.altro === 'object' ? r.dato.altro : null
}

/* La fattoria in comune di un'amicizia (docs/fattoria3d/in-comune.md): si mandano le proprie mosse (e la fotografia, uscendo) e
   si ritirano quelle dopo `dopo`. Torna { ultimo, corsia, foto, mosse }, null se l'amicizia è già di altri due, undefined senza rete. */
export async function scambiaComune(chiave, id, { dopo = -1, mosse = [], foto = null } = {}, opzioni) {
  const r = await chiedi('/amici/comune', { chiave, id, dopo, mosse, ...(foto ? { foto } : {}) }, { tentativi: 1, ...opzioni })
  if (!r) return undefined
  if (r.stato === 409) return null
  if (!r.ok || !Number.isInteger(r.dato?.ultimo) || !Array.isArray(r.dato.mosse)) return undefined
  return r.dato
}

export const RITARDI = [2000, 4000, 8000, 16000, 32000, 60000]
// il battito: un filo morto in silenzio (il telefono crede di essere collegato) non riceve inviti; se il servizio non risponde al
// ping per tanto, il filo si lascia e se ne apre un altro (lo stesso guaio della sfida: docs/core/insieme.md)
export const BATTITO = { ogni: 15000, sordo: 40000 }
// mentre si gioca su questo filo (il contadino nella fattoria in comune) un filo morto si vede in pochi secondi, e si riapre subito:
// le mosse viaggiano a parte, e l'amico sparirebbe mentre lavora. `fermo`: quanto silenzio basta per non mettere più posizioni in
// coda (arrivando tutte insieme farebbero chiudere il filo dal servizio). Vedi docs/fattoria3d/in-comune.md, «La linea del contadino»
export const BATTITO_GIOCO = { ogni: 1000, sordo: 3500, fermo: 1800, ritardi: [1000, 2000] }

/* L'UNICO collegamento di questo telefono verso il servizio degli amici (docs/core/amici.md), che si rimette in piedi da solo.
   Dichiara chi è (`id`) e le chiavi delle sue amicizie (`chiavi()` le legge ogni volta: aggiungerne una è solo `imposta()`).
   `alMessaggio(chiave, oggetto)` per quello che manda un amico, `alCambio()` quando cambia aperto/chi c'è. */
export class Ponte {
  constructor({ id, chiavi = () => [], servizio, WebSocketImpl = globalThis.WebSocket, alMessaggio = () => {}, alCambio = () => {}, ritardi = RITARDI,
                attesaApertura = 5000, visibile = () => typeof document === 'undefined' || !document.hidden, battito = BATTITO,
                battitoGioco = BATTITO_GIOCO, tempo = orologioVero }) {
    Object.assign(this, { id, chiavi, servizio, WebSocketImpl, alMessaggio, alCambio, ritardi, attesaApertura, visibile, battito, battitoGioco, tempo })
    this.gioco = false                 // si sta giocando su questo filo: batte svelto
    this.cuore = 0
    this.sentito = 0
    this.aperto = false
    this.presenti = new Set()          // le chiavi il cui amico è collegato adesso
    this.fermo = true
    this.ws = null
    this.prova = 0
    this.timer = 0
  }

  avvia() { this.fermo = false; this.apri() }

  apri() {
    const t = this.tempo
    t.ferma(this.timer)
    if (this.fermo || this.ws || !this.visibile()) return
    let w
    try { w = new this.WebSocketImpl(`${(this.servizio || indirizzo()).replace(/^http/, 'ws')}/amici/presenza`) } catch { return this.riprova() }
    this.ws = w
    const mio = () => this.ws === w
    const lento = t.dopo(this.attesaApertura, () => { if (mio() && !this.aperto) { try { w.close() } catch { /* già chiuso */ } this.cadi() } })
    w.addEventListener('open', () => {
      if (!mio()) return
      t.ferma(lento); this.aperto = true; this.prova = 0
      this.sentito = t.ora()
      this.pulsa()
      this.dichiara()                                                    // chi sono e con chi sono in amicizia
      this.alCambio()
    })
    w.addEventListener('message', e => {
      if (!mio()) return
      this.sentito = t.ora()
      let m
      try { m = JSON.parse(e.data) } catch { return }
      if (!m || typeof m !== 'object') return
      if (m.t === 'ciao') { this.presenti = new Set(Array.isArray(m.presenti) ? m.presenti : []); this.alCambio() }
      else if (m.t === 'su' && typeof m.chiave === 'string') { this.presenti.add(m.chiave); this.alCambio() }
      else if (m.t === 'giu' && typeof m.chiave === 'string') { this.presenti.delete(m.chiave); this.alCambio() }
      else if (m.t === 'da' && typeof m.chiave === 'string' && m.m && typeof m.m === 'object') this.alMessaggio(m.chiave, m.m)
    })
    const chiuso = () => { t.ferma(lento); if (mio()) this.cadi() }
    w.addEventListener('close', chiuso)
    w.addEventListener('error', chiuso)
  }

  /* il battito del filo aperto, al ritmo di adesso */
  pulsa() {
    const { tempo: t, ws: w } = this, { ogni, sordo } = this.gioco ? this.battitoGioco : this.battito
    t.ferma(this.cuore)
    this.cuore = t.ogni(ogni, () => {
      if (this.ws !== w) return t.ferma(this.cuore)
      if (t.ora() - this.sentito > sordo) { try { w.close() } catch { /* già chiuso */ } return this.cadi() }
      this.manda('{"t":"ping"}')
    })
  }

  /* si comincia o si smette di giocare su questo filo; il silenzio di prima, a battito lento, non conta */
  inGioco(acceso) {
    this.gioco = !!acceso
    if (this.aperto) { this.sentito = this.tempo.ora(); this.pulsa() }
    else if (this.gioco) this.riprendi()
  }

  dichiara() { this.manda({ k: 'dichiaro', id: this.id, chiavi: this.chiavi() }) }

  /* le amicizie sono cambiate (una in più o in meno): si dice al servizio, a collegamento aperto */
  imposta() { if (this.aperto) this.dichiara() }

  /* il collegamento è finito: si riprova più tardi, in silenzio */
  cadi() {
    this.tempo.ferma(this.cuore)
    const c = this.aperto || this.presenti.size
    this.ws = null; this.aperto = false; this.presenti = new Set()
    if (c) this.alCambio()
    this.riprova()
  }

  riprova() {
    if (this.fermo) return
    const ritardi = this.gioco ? this.battitoGioco.ritardi : this.ritardi
    const ritardo = ritardi[Math.min(this.prova++, ritardi.length - 1)]
    this.tempo.ferma(this.timer)
    this.timer = this.tempo.dopo(ritardo, () => this.apri())
  }

  /* lo schermo torna acceso: si riprova subito invece di aspettare */
  riprendi() { this.prova = 0; this.apri() }

  manda(oggetto) {
    if (!this.aperto || !this.ws) return false
    try { this.ws.send(typeof oggetto === 'string' ? oggetto : JSON.stringify(oggetto)); return true } catch { return false }
  }

  /* un messaggio per l'amico di quella amicizia */
  invia(chiave, m) { return this.manda({ k: 'a', chiave, m }) }

  /* una cosa che invecchia (dove sta il contadino): parte solo se il filo risponde, e l'amico c'è */
  get fresco() { return this.aperto && (!this.gioco || this.tempo.ora() - this.sentito <= this.battitoGioco.fermo) }
  mandaFresco(chiave, m) { return this.presenti.has(chiave) && this.fresco && this.invia(chiave, m) }

  chiudi() {
    this.fermo = true
    this.tempo.ferma(this.timer); this.tempo.ferma(this.cuore)
    const w = this.ws
    this.ws = null; this.aperto = false; this.presenti = new Set()
    try { w?.close() } catch { /* già chiuso */ }
  }
}
