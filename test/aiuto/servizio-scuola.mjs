/* ═══════════════════════════════════════════════════════════════════
   IL SERVIZIO DELLA SCUOLA, IN LOCALE, COLLA LOGICA VERA

   Le richieste di docs/scuola/protocollo.md su una porta a caso di
   127.0.0.1, risposte con `servizio/inoltro/src/lezione.js` come fa il
   Durable Object `Lezione` di `index.js` (rete-finta.mjs fa lo stesso
   col tavolo, ma in memoria e per Node): `POST /scuola/lezione`,
   `GET /scuola/<CODICE>` e i due WebSocket. Così le due pagine nel
   browser parlano con un servizio vero senza wrangler né internet.
   Mancano apposta i tetti per indirizzo (`Limite`, `Errori`) e l'allarme
   delle tre ore: sono di Cloudflare, e li prova `unita/scuola-servizio`.

   Il WebSocket è scritto a mano (l'handshake e le cornici di RFC 6455,
   il minimo che parla un browser): nessuna dipendenza in più.

     const s = await servizioScuola()
     page.addInitScript(u => { globalThis.__SERVIZIO_SFIDE__ = u }, s.indirizzo)
     s.lezioni.get(codice).stato     lo stato come lo tiene il servizio
     await s.chiudi()
   ═══════════════════════════════════════════════════════════════════ */
import http from 'node:http'
import { createHash } from 'node:crypto'
import * as L from '../../servizio/inoltro/src/lezione.js'
import { nuovoCodice } from '../../servizio/inoltro/src/codici.js'

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type' }
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'

/* ── un WebSocket dal lato del server: `send`, `close`, e `suTesto` / `suChiuso` ── */
function cornice(op, dati) {
  const n = dati.length
  let testa
  if (n < 126) testa = Buffer.from([0x80 | op, n])
  else if (n < 65536) { testa = Buffer.alloc(4); testa[0] = 0x80 | op; testa[1] = 126; testa.writeUInt16BE(n, 2) }
  else { testa = Buffer.alloc(10); testa[0] = 0x80 | op; testa[1] = 127; testa.writeBigUInt64BE(BigInt(n), 2) }
  return Buffer.concat([testa, dati])
}

class Filo {
  constructor(socket) {
    this.socket = socket
    this.buf = Buffer.alloc(0)
    this.pezzi = []
    this.op = 0
    this.chiuso = false
    this.suTesto = () => {}
    this.suChiuso = () => {}
    socket.on('data', d => this.leggi(d))
    socket.on('close', () => this.fine())
    socket.on('error', () => this.fine())
  }
  send(testo) { if (!this.chiuso) this.socket.write(cornice(1, Buffer.from(testo, 'utf8'))) }
  close(codice = 1000, ragione = '') {
    if (this.chiuso) return
    const r = Buffer.from(ragione, 'utf8'), d = Buffer.alloc(2 + r.length)
    d.writeUInt16BE(codice, 0); r.copy(d, 2)
    this.socket.write(cornice(8, d))
    this.socket.end()
    this.fine()
  }
  fine() { if (this.chiuso) return; this.chiuso = true; this.suChiuso() }
  leggi(pezzo) {
    this.buf = Buffer.concat([this.buf, pezzo])
    for (;;) {
      const b = this.buf
      if (b.length < 2) return
      let n = b[1] & 127, i = 2
      if (n === 126) { if (b.length < 4) return; n = b.readUInt16BE(2); i = 4 }
      else if (n === 127) { if (b.length < 10) return; n = Number(b.readBigUInt64BE(2)); i = 10 }
      const maschera = b[1] & 128 ? b.subarray(i, (i += 4)) : null
      if (b.length < i + n) return
      const dati = Buffer.from(b.subarray(i, i + n))
      if (maschera) for (let k = 0; k < dati.length; k++) dati[k] ^= maschera[k & 3]
      this.buf = b.subarray(i + n)
      const op = b[0] & 15, ultimo = !!(b[0] & 128)
      if (op === 8) { this.close(dati.length >= 2 ? dati.readUInt16BE(0) : 1000); return }
      if (op === 9) { if (!this.chiuso) this.socket.write(cornice(10, dati)); continue }
      if (op === 10) continue
      if (op !== 0) this.op = op
      this.pezzi.push(dati)
      if (ultimo) {
        const tutto = Buffer.concat(this.pezzi)
        this.pezzi = []
        if (this.op === 1 && !this.chiuso) this.suTesto(tutto.toString('utf8'))
      }
    }
  }
}

function accetta(richiesta, socket) {
  const chiave = richiesta.headers['sec-websocket-key']
  const accetto = createHash('sha1').update(chiave + GUID).digest('base64')
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n'
               + `Sec-WebSocket-Accept: ${accetto}\r\n\r\n`)
  return new Filo(socket)
}

/* ── il servizio ── */
export function servizioScuola({ host = '127.0.0.1' } = {}) {
  const lezioni = new Map()          // codice → { stato, fili: [{ ws, ruolo, posto, sostituito, recenti }] }
  const socket = new Set()
  const richieste = []               // `${metodo} ${percorso}` di ogni richiesta, per chi vuole guardare

  const json = (r, dato, stato = 200) => { r.writeHead(stato, { 'content-type': 'application/json', ...CORS }); r.end(JSON.stringify(dato)) }
  const collegati = (l, tranne = null) => l.fili.filter(f => f.ws !== tranne && !f.sostituito && !f.ws.chiuso).map(({ ws, ruolo, posto }) => ({ ws, ruolo, posto }))
  const manda = invii => { for (const { a, msg } of invii || []) a.send(JSON.stringify(msg)) }

  async function crea(req, res) {
    let testo = ''
    for await (const pezzo of req) testo += pezzo
    if (testo.length > L.MAX_BYTE_LEZIONE) return json(res, { errore: 'lezione troppo grande' }, 413)
    let corpo
    try { corpo = JSON.parse(testo) } catch { return json(res, { errore: 'richiesta storta' }, 400) }
    const l = L.leggiCreazione(corpo)
    if (!l.ok) return json(res, { errore: l.errore }, 400)
    const chiave = L.nuovaChiave(globalThis.crypto.getRandomValues(new Uint8Array(32)))
    const stato = L.nuovaLezione(l, Date.now(), await L.hashChiave(chiave))
    let codice
    do codice = nuovoCodice(globalThis.crypto.getRandomValues(new Uint8Array(5))); while (lezioni.has(codice))
    lezioni.set(codice, { stato, fili: [] })
    json(res, { codice, chiave, scade: stato.scade })
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x')
    richieste.push(`${req.method} ${url.pathname}`)
    if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end() }
    if (url.pathname === '/scuola/lezione' && req.method === 'POST') return void crea(req, res).catch(() => json(res, { errore: 'riprova' }, 503))
    const m = url.pathname.match(/^\/scuola\/([A-Z]{5})$/)
    if (m && req.method === 'GET') {
      const l = lezioni.get(m[1])
      return l ? json(res, { fase: l.stato.fase }) : json(res, { errore: 'non c\'è' }, 404)
    }
    if (url.pathname === '/') return json(res, { ok: true })
    json(res, { errore: 'non c\'è' }, 404)
  })

  server.on('connection', s => { socket.add(s); s.on('close', () => socket.delete(s)) })

  server.on('upgrade', async (req, sock) => {
    const url = new URL(req.url, 'http://x')
    richieste.push(`WS ${url.pathname}`)
    const m = url.pathname.match(/^\/scuola\/([A-Z]{5})\/(bambino|maestra)$/)
    if (!m) { sock.destroy(); return }
    const l = lezioni.get(m[1])
    const maestra = m[2] === 'maestra'
    const posto = url.searchParams.get('posto') || ''
    // la chiave si controlla prima di accettare: da lì in poi tutto è sincrono, e nessun messaggio arriva senza chi lo ascolta
    const giusto = l && (maestra ? L.chiaveGiusta(l.stato, await L.hashChiave(url.searchParams.get('chiave') || '')) : L.POSTO.test(posto))
    const ws = accetta(req, sock)
    if (!l) return ws.close(4404, 'nessuna lezione')
    if (!giusto) return ws.close(4403, 'chiave')
    const filo = { ws, ruolo: maestra ? 'maestra' : 'bambino', posto: maestra ? undefined : posto, sostituito: false, recenti: [] }
    let r
    if (maestra) r = L.entraMaestra(l.stato, collegati(l), ws)
    else {
      r = L.entraBambino(l.stato, collegati(l), ws, posto)
      for (const f of l.fili) if (r.sostituiti.includes(f.ws)) { f.sostituito = true; f.ws.close(4000, 'sostituito') }
    }
    l.fili.push(filo)
    manda(r.invii)

    ws.suTesto = testo => {
      if (filo.sostituito) return
      if (testo === '{"t":"ping"}') return ws.send('{"t":"pong"}')
      const c = L.leggiMessaggio(testo, filo.recenti, Date.now(), maestra ? L.MAX_BYTE_MAESTRA : L.MAX_BYTE)
      if (!c.ok) return ws.close(c.codice, c.ragione)
      filo.recenti = c.recenti
      const tutti = collegati(l)
      manda((maestra ? L.daMaestra(l.stato, tutti, c.dato) : L.daBambino(l.stato, tutti, ws, posto, c.dato)).invii)
    }
    ws.suChiuso = () => {
      l.fili = l.fili.filter(f => f !== filo)
      if (maestra || filo.sostituito) return
      filo.sostituito = true
      manda(L.esceBambino(l.stato, collegati(l, ws), posto).invii)
    }
  })

  return new Promise(ok => server.listen(0, host, () => {
    const porta = server.address().port
    ok({
      porta,
      indirizzo: `http://${host}:${porta}`,
      lezioni,
      richieste,
      chiudi: () => new Promise(fatto => {
        for (const l of lezioni.values()) for (const f of l.fili) f.ws.close(1001, 'spento')
        for (const s of socket) s.destroy()
        server.close(() => fatto())
      }),
    })
  }))
}
