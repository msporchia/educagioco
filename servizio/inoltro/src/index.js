/* Il servizio di inoltro delle sfide di Castle Battle: due telefoni, una stanza con un codice, e il servizio gira a
   ciascuno i messaggi dell'altro. Non capisce il gioco e non ricorda niente di personale: solo un segno «la stanza esiste»
   che scade da solo. Vedi docs/arena/multigiocatore.md.

   GET  /crea            → { codice }          una stanza nuova (con un limite di creazioni per indirizzo)
   GET  /entra/<codice>  → WebSocket           si entra nella stanza: il primo è `host`, il secondo `ospite`
   I messaggi sono testo JSON `{ t: '…', … }`, al massimo MAX_BYTE, e arrivano all'altro così come sono. Il servizio ne
   manda di suoi: `{ t: 'ciao', ruolo }` a chi entra, `{ t: 'pronti' }` a tutti e due quando ci sono, `{ t: 'via' }`
   quando l'altro se ne va. */

import { CHIAVE, ID, MAX_CHIAVI, MAX_COLLEGAMENTI, dichiara, chiudi, inoltra, controllaMessaggio } from './presenza.js'
import { CODICE, DURATA as DURATA_CODICE, CODICI_ORA, nuovoCodice as codiceBreve, contaErrore, bloccato } from './codici.js'

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

    const m = url.pathname.match(/^\/entra\/([A-Z]{5})$/)
    if (m) {
      if (richiesta.headers.get('upgrade') !== 'websocket') return json({ errore: 'serve un WebSocket' }, 426)
      const stanza = env.STANZE.get(env.STANZE.idFromName(m[1]))
      return stanza.fetch('https://stanza/entra', richiesta)
    }

    return json({ servizio: 'sfida', ok: true })
  },
}

/* Gli amici (docs/core/amici.md): due richieste per abbinarsi (un codice breve che scade) e una stanza per amicizia. */
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

/* Quante stanze crea un indirizzo all'ora: un contatore per indirizzo, che si azzera da solo. */
export class Limite {
  constructor(stato) { this.stato = stato }

  async fetch() {
    const ora = Date.now()
    let { n = 0, da = ora } = (await this.stato.storage.get('conto')) || {}
    if (ora - da > 60 * 60 * 1000) { n = 0; da = ora }
    n++
    await this.stato.storage.put('conto', { n, da })
    await this.stato.storage.setAlarm(da + 60 * 60 * 1000)
    return new Response(JSON.stringify({ ok: n <= CREAZIONI_ORA }))
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
