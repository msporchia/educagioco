/* Il servizio di inoltro delle sfide di Castle Battle: due telefoni, una stanza con un codice, e il servizio gira a
   ciascuno i messaggi dell'altro. Non capisce il gioco e non ricorda niente di personale: solo un segno «la stanza esiste»
   che scade da solo. Vedi docs/arena/multigiocatore.md.

   GET  /tavolo/nuovo?posto=<p>      → { codice }   un tavolo nuovo, col posto dell'host prenotato (limite di creazioni per indirizzo)
   GET  /tavolo/<codice>?posto=<p>   → WebSocket    ci si siede; chi rientra con lo stesso posto riprende il suo
   Il tavolo sopporta le cadute: docs/core/insieme.md (la logica in tavolo.js). `/crea` ed `/entra/<codice>` sono la stanza di
   prima, che a una caduta finiva: resta per i telefoni col gioco vecchio, finché non si aggiornano (docs/arena/multigiocatore.md). */

import { CHIAVE, ID, MAX_CHIAVI, MAX_COLLEGAMENTI, dichiara, chiudi, inoltra, controllaMessaggio } from './presenza.js'
import * as tavolo from './tavolo.js'
import { CODICE, DURATA as DURATA_CODICE, CODICI_ORA, nuovoCodice as codiceBreve, contaErrore, bloccato } from './codici.js'
import * as bacheca from './bacheca.js'

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ'      // senza la I e la O: si confondono con 1 e 0 a voce
const LUNGHEZZA = 5
const MAX_BYTE = 512                             // una mossa sono poche decine di byte
const MAX_AL_SECONDO = 30                        // messaggi per connessione
const ATTESA = 5 * 60 * 1000                     // una stanza in cui non entra nessuno muore dopo cinque minuti
const DURATA = 60 * 60 * 1000                    // e comunque dopo un'ora
const CREAZIONI_ORA = 30                         // stanze create all'ora da uno stesso indirizzo

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type' }
const json = (dato, stato = 200) => new Response(JSON.stringify(dato), { status: stato, headers: { 'content-type': 'application/json', ...CORS } })

function nuovoCodice() {
  const r = crypto.getRandomValues(new Uint8Array(LUNGHEZZA))
  return Array.from(r, n => ALFABETO[n % ALFABETO.length]).join('')
}

export default {
  async fetch(richiesta, env) {
    const url = new URL(richiesta.url)
    if (richiesta.method === 'OPTIONS') return new Response(null, { headers: CORS })

    if (url.pathname === '/crea') {
      const ip = richiesta.headers.get('cf-connecting-ip') || 'sconosciuto'
      const limite = env.LIMITE.get(env.LIMITE.idFromName(ip))
      if (!(await (await limite.fetch('https://limite/conta')).json()).ok) return json({ errore: 'troppe stanze, riprova fra un po\'' }, 429)
      for (let tentativo = 0; tentativo < 5; tentativo++) {           // un codice già in uso si cambia
        const codice = nuovoCodice()
        const stanza = env.STANZE.get(env.STANZE.idFromName(codice))
        const r = await stanza.fetch('https://stanza/apri')
        if (r.ok) return json({ codice })
      }
      return json({ errore: 'riprova' }, 503)
    }

    if (url.pathname.startsWith('/amici/')) return amici(richiesta, url, env)

    if (url.pathname === '/tavolo/nuovo') {
      const posto = url.searchParams.get('posto') || ''
      if (!tavolo.POSTO.test(posto)) return json({ errore: 'posto storto' }, 400)
      const ip = richiesta.headers.get('cf-connecting-ip') || 'sconosciuto'
      const limite = env.LIMITE.get(env.LIMITE.idFromName(ip))
      if (!(await (await limite.fetch('https://limite/conta')).json()).ok) return json({ errore: 'troppi tavoli, riprova fra un po\'' }, 429)
      for (let tentativo = 0; tentativo < 5; tentativo++) {           // un codice già in uso si cambia
        const codice = nuovoCodice()
        const r = await env.TAVOLI.get(env.TAVOLI.idFromName(codice)).fetch(`https://tavolo/apri?posto=${posto}`)
        if (r.ok) return json({ codice })
      }
      return json({ errore: 'riprova' }, 503)
    }
    const t = url.pathname.match(/^\/tavolo\/([A-Z]{5})$/)
    if (t) {
      if (richiesta.headers.get('upgrade') !== 'websocket') return json({ errore: 'serve un WebSocket' }, 426)
      return env.TAVOLI.get(env.TAVOLI.idFromName(t[1])).fetch(`https://tavolo/siedi?posto=${encodeURIComponent(url.searchParams.get('posto') || '')}`, richiesta)
    }

    const m = url.pathname.match(/^\/entra\/([A-Z]{5})$/)
    if (m) {
      if (richiesta.headers.get('upgrade') !== 'websocket') return json({ errore: 'serve un WebSocket' }, 426)
      const stanza = env.STANZE.get(env.STANZE.idFromName(m[1]))
      return stanza.fetch('https://stanza/entra', richiesta)
    }

    return json({ servizio: 'sfida', ok: true })
  },
}

/* Gli amici (docs/core/amici.md): due richieste per abbinarsi (un codice breve che scade), la presenza e la bacheca di ogni
   amicizia (docs/core/amici-bacheca.md). */
async function amici(richiesta, url, env) {
  const ip = richiesta.headers.get('cf-connecting-ip') || 'sconosciuto'
  if (url.pathname === '/amici/codice' && richiesta.method === 'POST') {
    let corpo
    try { corpo = await richiesta.json() } catch { return json({ errore: 'richiesta storta' }, 400) }
    if (!CHIAVE.test(corpo?.chiave || '')) return json({ errore: 'chiave storta' }, 400)
    const limite = env.LIMITE.get(env.LIMITE.idFromName('amici:' + ip))
    if (!(await (await limite.fetch('https://limite/conta')).json()).ok) return json({ errore: 'troppi codici, riprova fra un po\'' }, 429)
    for (let tentativo = 0; tentativo < 5; tentativo++) {          // un codice già in uso si cambia
      const codice = codiceBreve(crypto.getRandomValues(new Uint8Array(LUNGHEZZA)))
      const r = await env.CODICI.get(env.CODICI.idFromName(codice)).fetch('https://codice/metti', { method: 'POST', body: corpo.chiave })
      if (r.ok) return json({ codice, scade: Date.now() + DURATA_CODICE })
    }
    return json({ errore: 'riprova' }, 503)
  }
  if (url.pathname === '/amici/riscatta' && richiesta.method === 'POST') {
    let corpo
    try { corpo = await richiesta.json() } catch { return json({ errore: 'richiesta storta' }, 400) }
    const errori = env.ERRORI.get(env.ERRORI.idFromName(ip))
    if ((await (await errori.fetch('https://errori/stato')).json()).bloccato) return json({ errore: 'troppi tentativi, riprova fra un minuto' }, 429)
    const codice = String(corpo?.codice || '').toUpperCase()
    const r = CODICE.test(codice) ? await env.CODICI.get(env.CODICI.idFromName(codice)).fetch('https://codice/prendi', { method: 'POST' }) : null
    if (!r || !r.ok) { await errori.fetch('https://errori/sbaglio'); return json({ errore: 'codice non valido o scaduto' }, 404) }
    return json({ chiave: await r.text() })
  }
  if (url.pathname === '/amici/bacheca' && richiesta.method === 'POST') {
    let corpo
    try { corpo = await richiesta.json() } catch { return json({ errore: 'richiesta storta' }, 400) }
    const r = bacheca.leggiRichiesta(corpo)
    if (!r.ok) return json({ errore: r.errore }, 400)
    const limite = env.LIMITE.get(env.LIMITE.idFromName('bacheca:' + ip))
    if (!(await (await limite.fetch(`https://limite/conta?tetto=${bacheca.BACHECHE_ORA}`)).json()).ok) return json({ errore: 'troppe richieste, riprova fra un po\'' }, 429)
    const b = await env.BACHECHE.get(env.BACHECHE.idFromName(r.chiave)).fetch('https://bacheca/usa', { method: 'POST', body: JSON.stringify({ id: r.id, testo: r.testo }) })
    if (b.status === 409) return json({ errore: 'questa amicizia è già di due' }, 409)
    return json({ altro: JSON.parse((await b.json()).altro || 'null') })
  }
  if (url.pathname === '/amici/presenza') {
    if (richiesta.headers.get('upgrade') !== 'websocket') return json({ errore: 'serve un WebSocket' }, 426)
    return env.PRESENZA.get(env.PRESENZA.idFromName('sala')).fetch('https://presenza/entra', richiesta)
  }
  return json({ errore: 'non c\'è' }, 404)
}

/* Una stanza. Usa l'API di ibernazione: a stanza ferma non si paga il tempo di calcolo. Il segno «aperta» sta
   nella memoria del Durable Object perché sopravviva al sonno, e sparisce con `deleteAll()` all'allarme. */
export class Stanza {
  constructor(stato) {
    this.stato = stato
    this.recenti = new Map()          // chi ha mandato quanto, nell'ultimo secondo (si azzera col sonno: va bene)
  }

  async fetch(richiesta) {
    const percorso = new URL(richiesta.url).pathname
    if (percorso === '/apri') {
      if (await this.stato.storage.get('aperta')) return new Response('occupata', { status: 409 })
      await this.stato.storage.put('aperta', true)
      await this.stato.storage.setAlarm(Date.now() + ATTESA)
      return new Response('ok')
    }
    if (percorso !== '/entra') return new Response('?', { status: 404 })
    if (!(await this.stato.storage.get('aperta'))) return new Response('nessuna stanza con questo codice', { status: 404 })
    const dentro = this.stato.getWebSockets()
    if (dentro.length >= 2) return new Response('stanza piena', { status: 409 })

    const { 0: cliente, 1: server } = new WebSocketPair()
    this.stato.acceptWebSocket(server)
    const ruolo = dentro.length === 0 ? 'host' : 'ospite'
    server.serializeAttachment({ ruolo })
    server.send(JSON.stringify({ t: 'ciao', ruolo }))
    if (ruolo === 'ospite') {
      await this.stato.storage.setAlarm(Date.now() + DURATA)       // si gioca: un'ora al massimo
      for (const ws of this.stato.getWebSockets()) ws.send(JSON.stringify({ t: 'pronti' }))
    }
    return new Response(null, { status: 101, webSocket: cliente })
  }

  webSocketMessage(ws, messaggio) {
    if (typeof messaggio !== 'string' || messaggio.length > MAX_BYTE) return ws.close(1009, 'messaggio troppo grande')
    const ora = Date.now()
    const r = (this.recenti.get(ws) || []).filter(t => ora - t < 1000)
    r.push(ora)
    this.recenti.set(ws, r)
    if (r.length > MAX_AL_SECONDO) return ws.close(1008, 'troppi messaggi')
    let dato
    try { dato = JSON.parse(messaggio) } catch { return ws.close(1003, 'non è una mossa') }
    if (!dato || typeof dato !== 'object' || typeof dato.t !== 'string') return ws.close(1003, 'non è una mossa')
    for (const altro of this.stato.getWebSockets()) if (altro !== ws) altro.send(messaggio)
  }

  webSocketClose(ws) { this.finito(ws) }
  webSocketError(ws) { this.finito(ws) }

  finito(ws) {
    this.recenti.delete(ws)
    for (const altro of this.stato.getWebSockets()) if (altro !== ws) { try { altro.send(JSON.stringify({ t: 'via' })) } catch { /* se n'è già andato */ } }
  }

  /* l'allarme chiude la stanza: nessuno è entrato in tempo, o è passata un'ora */
  async alarm() {
    for (const ws of this.stato.getWebSockets()) { try { ws.close(1000, 'stanza chiusa') } catch { /* già chiuso */ } }
    await this.stato.storage.deleteAll()
  }
}

/* Un tavolo da due (docs/core/insieme.md): la logica sta in tavolo.js, qui solo Cloudflare. Il suo stato (chi siede, chi manca da
   quando) sta nella memoria del Durable Object perché sopravviva al sonno; il «ping» lo risponde Cloudflare senza svegliarlo. */
export class Tavolo {
  constructor(stato) {
    this.stato = stato
    this.secchi = new Map()           // il ritmo di ogni collegamento (si azzera col sonno: va bene)
    // il battito dei telefoni: risponde Cloudflare da solo, senza svegliare l'oggetto e senza contarlo
    stato.setWebSocketAutoResponse(new WebSocketRequestResponsePair('{"t":"ping"}', '{"t":"pong"}'))
  }

  /* i collegamenti seduti, senza quelli sostituiti da un rientro e senza `tranne` (quello che si sta chiudendo) */
  collegati(tranne = null) {
    const r = []
    for (const ws of this.stato.getWebSockets()) {
      if (ws === tranne) continue
      const a = ws.deserializeAttachment()
      if (a?.posto && !a.sostituito) r.push({ ws, posto: a.posto })
    }
    return r
  }

  manda(invii) { for (const { a, msg } of invii) { try { a.send(JSON.stringify(msg)) } catch { /* se n'è andato */ } } }

  async salva(dato) {
    await this.stato.storage.put('tavolo', dato)
    await this.stato.storage.setAlarm(tavolo.prossimo(dato))
  }

  /* un no detto per bene: si apre, si dice perché, si chiude (il telefono non deve indovinarlo da una caduta) */
  rifiuta(perche) {
    const { 0: cliente, 1: server } = new WebSocketPair()
    server.accept()
    server.send(JSON.stringify({ t: 'no', perche }))
    server.close(4001, perche)
    return new Response(null, { status: 101, webSocket: cliente })
  }

  async fetch(richiesta) {
    const url = new URL(richiesta.url)
    const dato = await this.stato.storage.get('tavolo')
    if (url.pathname === '/apri') {
      if (dato) return new Response('occupato', { status: 409 })
      await this.salva(tavolo.nuovoTavolo(Date.now(), url.searchParams.get('posto')))
      return new Response('ok')
    }
    if (url.pathname !== '/siedi') return new Response('?', { status: 404 })
    if (!dato) return this.rifiuta('nessuno')
    const posto = url.searchParams.get('posto') || ''
    if (!tavolo.POSTO.test(posto)) return this.rifiuta('nessuno')
    const r = tavolo.entra(dato, this.collegati(), posto, Date.now())
    if (r.esito !== 'ok') return this.rifiuta(r.esito)
    for (const vecchio of r.sostituiti) {                           // un rientro: il filo vecchio (forse morto) non conta più
      try { vecchio.serializeAttachment({ posto, sostituito: true }); vecchio.close(4000, 'sostituito') } catch { /* già chiuso */ }
    }
    const { 0: cliente, 1: server } = new WebSocketPair()
    this.stato.acceptWebSocket(server)
    server.serializeAttachment({ posto })
    server.send(JSON.stringify(r.ciao))
    this.manda(r.invii)
    await this.salva(dato)
    return new Response(null, { status: 101, webSocket: cliente })
  }

  async webSocketMessage(ws, testo) {
    const a = ws.deserializeAttachment()
    if (!a?.posto || a.sostituito) return
    const ora = Date.now()
    const s = tavolo.secchio(this.secchi.get(ws), ora)
    this.secchi.set(ws, s.s)
    if (!s.ok) return ws.close(1008, 'troppi messaggi')
    const l = tavolo.leggiMessaggio(testo)
    if (!l.ok) return ws.close(l.codice, l.ragione)
    if (l.dato.t === 'ping') return ws.send('{"t":"pong"}')         // se la risposta da sola non c'è (in locale)
    if (l.dato.t === 'addio') return this.chiuso(ws, { addio: true })
    for (const c of this.collegati(ws)) if (c.posto !== a.posto) { try { c.ws.send(testo) } catch { /* se n'è andato */ } }
  }

  async webSocketClose(ws) { await this.chiuso(ws) }
  async webSocketError(ws) { await this.chiuso(ws) }

  async chiuso(ws, { addio = false } = {}) {
    this.secchi.delete(ws)
    const a = ws.deserializeAttachment()
    if (!a?.posto || a.sostituito) return
    ws.serializeAttachment({ posto: a.posto, sostituito: true })     // non conta più, anche se l'evento arriva due volte
    const dato = await this.stato.storage.get('tavolo')
    if (!dato) return
    const r = tavolo.esce(dato, this.collegati(ws), a.posto, Date.now(), { addio })
    this.manda(r.invii)
    if (addio) { try { ws.close(1000, 'addio') } catch { /* già chiuso */ } }
    if (r.fine) { await this.stato.storage.deleteAlarm(); await this.stato.storage.deleteAll() }
    else await this.salva(dato)
  }

  async alarm() {
    const dato = await this.stato.storage.get('tavolo')
    if (!dato) return
    const r = tavolo.allarme(dato, this.collegati(), Date.now())
    this.manda(r.invii)
    for (const ws of r.chiudi) { try { ws.serializeAttachment({ sostituito: true }); ws.close(4001, 'chiuso') } catch { /* già chiuso */ } }
    if (r.fine) { await this.stato.storage.deleteAlarm(); await this.stato.storage.deleteAll() }
    else await this.salva(dato)
  }
}

/* Quante stanze crea un indirizzo all'ora: un contatore per indirizzo, che si azzera da solo. `?tetto=` per un conto con un
   altro tetto (la bacheca). */
export class Limite {
  constructor(stato) { this.stato = stato }

  async fetch(richiesta) {
    const tetto = Number(new URL(richiesta.url).searchParams.get('tetto')) || CREAZIONI_ORA
    const ora = Date.now()
    let { n = 0, da = ora } = (await this.stato.storage.get('conto')) || {}
    if (ora - da > 60 * 60 * 1000) { n = 0; da = ora }
    n++
    await this.stato.storage.put('conto', { n, da })
    await this.stato.storage.setAlarm(da + 60 * 60 * 1000)
    return new Response(JSON.stringify({ ok: n <= tetto }))
  }

  async alarm() { await this.stato.storage.deleteAll() }
}

/* Un codice breve: tiene la chiave per due ore e la consegna una volta sola. */
export class Codice {
  constructor(stato) { this.stato = stato }

  async fetch(richiesta) {
    const percorso = new URL(richiesta.url).pathname
    if (percorso === '/metti') {
      if (await this.stato.storage.get('chiave')) return new Response('occupato', { status: 409 })
      await this.stato.storage.put('chiave', await richiesta.text())
      await this.stato.storage.setAlarm(Date.now() + DURATA_CODICE)
      return new Response('ok')
    }
    if (percorso === '/prendi') {
      const chiave = await this.stato.storage.get('chiave')
      if (!chiave) return new Response('non c\'è', { status: 404 })
      await this.stato.storage.deleteAll()                          // uso singolo
      return new Response(chiave)
    }
    return new Response('?', { status: 404 })
  }

  async alarm() { await this.stato.storage.deleteAll() }
}

/* La bacheca di un'amicizia (docs/core/amici-bacheca.md): l'ultima istantanea di ciascuno dei due. Ogni scrittura sposta la
   sveglia a una settimana da adesso; alla sveglia non resta niente. Leggere non la sposta. */
export class Bacheca {
  constructor(stato) { this.stato = stato }

  async fetch(richiesta) {
    const { id, testo } = await richiesta.json()
    const r = bacheca.usa(await this.stato.storage.get('posti'), id, testo)
    if (r.rifiutato) return new Response('di due', { status: 409 })
    if (r.scritto) {
      await this.stato.storage.put('posti', r.posti)
      await this.stato.storage.setAlarm(Date.now() + bacheca.SCADENZA)
    }
    return new Response(JSON.stringify({ altro: r.altro }))
  }

  async alarm() { await this.stato.storage.deleteAll() }
}

/* I codici sbagliati di un indirizzo nell'ultimo minuto: troppi e per un minuto non si prova più. */
export class Errori {
  constructor(stato) { this.stato = stato }

  async fetch(richiesta) {
    const ora = Date.now()
    const stato = await this.stato.storage.get('errori')
    if (new URL(richiesta.url).pathname === '/sbaglio') {
      const nuovo = contaErrore(stato, ora)
      await this.stato.storage.put('errori', nuovo)
      await this.stato.storage.setAlarm(nuovo.da + 2 * 60 * 1000)
      return new Response('ok')
    }
    return new Response(JSON.stringify({ bloccato: bloccato(stato, ora) }))
  }

  async alarm() { await this.stato.storage.deleteAll() }
}

/* Lo smistamento degli amici: UN oggetto per tutti i telefoni, ognuno con un solo collegamento. Dice a chi ha una chiave quando
   l'altro c'è o se ne va, e gira i messaggi di quella chiave. Come la stanza, con l'API di ibernazione; la logica sta in
   presenza.js. Non salva niente: finché non c'è nessuno, non esiste. Il traffico delle battaglie NON passa di qui (stanze a parte). */
export class Presenza {
  constructor(stato) {
    this.stato = stato
    this.recenti = new Map()
    // il battito dei telefoni (src/amici/rete.js): risponde Cloudflare da solo, come al tavolo
    stato.setWebSocketAutoResponse(new WebSocketRequestResponsePair('{"t":"ping"}', '{"t":"pong"}'))
  }

  /* i collegamenti presentati; quelli ancora anonimi non contano */
  soci() {
    const r = []
    for (const ws of this.stato.getWebSockets()) {
      const a = ws.deserializeAttachment()
      if (a?.id) r.push({ ws, id: a.id, chiavi: a.chiavi || [] })
    }
    return r
  }

  async fetch() {
    if (this.stato.getWebSockets().length >= MAX_COLLEGAMENTI) return new Response('pieno', { status: 503 })
    const { 0: cliente, 1: server } = new WebSocketPair()
    this.stato.acceptWebSocket(server)
    server.serializeAttachment({ id: null, chiavi: [] })
    return new Response(null, { status: 101, webSocket: cliente })
  }

  manda(invii) { for (const { a, msg } of invii) { try { a.send(JSON.stringify(msg)) } catch { /* se n'è andato */ } } }

  webSocketMessage(ws, messaggio) {
    if (messaggio === '{"t":"ping"}') return ws.send('{"t":"pong"}')       // se la risposta da sola non c'è (in locale)
    const c = controllaMessaggio(messaggio, this.recenti.get(ws) || [], Date.now())
    if (!c.ok) return ws.close(c.codice, c.ragione)
    this.recenti.set(ws, c.recenti)
    const d = c.dato
    const soci = this.soci()
    if (d.k === 'dichiaro') {
      if (!ID.test(d.id || '') || !Array.isArray(d.chiavi) || d.chiavi.length > MAX_CHIAVI || !d.chiavi.every(x => CHIAVE.test(x))) return ws.close(1003, 'non è un messaggio')
      const r = dichiara(soci, ws, d.id, d.chiavi)
      for (const vecchio of r.sostituiti) { try { vecchio.serializeAttachment({ id: null, chiavi: [] }); vecchio.close(1000, 'sostituito') } catch { /* già chiuso */ } }
      ws.serializeAttachment({ id: d.id, chiavi: r.chiavi })
      this.manda(r.invii)
    } else if (d.k === 'a') {
      this.manda(inoltra(soci, ws, d.chiave, d.m))
    }
  }

  webSocketClose(ws) { this.finito(ws) }
  webSocketError(ws) { this.finito(ws) }

  finito(ws) {
    this.recenti.delete(ws)
    this.manda(chiudi(this.soci(), ws))
  }
}
