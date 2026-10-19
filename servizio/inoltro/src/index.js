/* Il servizio di inoltro delle sfide di Castle Battle: due telefoni, una stanza con un codice, e il servizio gira a
   ciascuno i messaggi dell'altro. Non capisce il gioco e non ricorda niente di personale: solo un segno «la stanza esiste»
   che scade da solo. Vedi docs/arena/multigiocatore.md.

   GET  /crea            → { codice }          una stanza nuova (con un limite di creazioni per indirizzo)
   GET  /entra/<codice>  → WebSocket           si entra nella stanza: il primo è `host`, il secondo `ospite`
   I messaggi sono testo JSON `{ t: '…', … }`, al massimo MAX_BYTE, e arrivano all'altro così come sono. Il servizio ne
   manda di suoi: `{ t: 'ciao', ruolo }` a chi entra, `{ t: 'pronti' }` a tutti e due quando ci sono, `{ t: 'via' }`
   quando l'altro se ne va. */

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ'      // senza la I e la O: si confondono con 1 e 0 a voce
const LUNGHEZZA = 5
const MAX_BYTE = 512                             // una mossa sono poche decine di byte
const MAX_AL_SECONDO = 30                        // messaggi per connessione
const ATTESA = 5 * 60 * 1000                     // una stanza in cui non entra nessuno muore dopo cinque minuti
const DURATA = 60 * 60 * 1000                    // e comunque dopo un'ora
const CREAZIONI_ORA = 30                         // stanze create all'ora da uno stesso indirizzo

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS' }
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

    const m = url.pathname.match(/^\/entra\/([A-Z]{5})$/)
    if (m) {
      if (richiesta.headers.get('upgrade') !== 'websocket') return json({ errore: 'serve un WebSocket' }, 426)
      const stanza = env.STANZE.get(env.STANZE.idFromName(m[1]))
      return stanza.fetch('https://stanza/entra', richiesta)
    }

    return json({ servizio: 'sfida', ok: true })
  },
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
