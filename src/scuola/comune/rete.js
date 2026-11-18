// Il filo della scuola (docs/scuola/protocollo.md): la creazione e il controllo del codice via HTTP, e i collegamenti dei bambini
// e della maestra. Un collegamento si rifà da solo; le risposte dei bambini stanno in una coda che sopravvive a tutto.
// Orologio, WebSocket, fetch e localStorage si possono passare da fuori (le prove); di difetto sono quelli veri.
import { indirizzo } from '../../insieme/rete.js'

const TRE_ORE = 3 * 60 * 60 * 1000
export const TEMPI = { ritardoMin: 1000, ritardoMax: 10000, ping: 15000, morto: 40000, passoCoda: 100, tentativi: 3, attesaHttp: 3500 }
const PING = '{"t":"ping"}'

/* in sviluppo `#servizio=<url>` nell'indirizzo della pagina cambia il servizio; altrimenti quello di tutti */
export function indirizzoScuola() {
  if (import.meta.env?.DEV) {
    const v = new URLSearchParams(String(globalThis.location?.hash || '').replace(/^#/, '')).get('servizio')
    if (v) return v.replace(/\/+$/, '')
  }
  return indirizzo()
}

export const orologioVero = {
  ora: () => Date.now(),
  dopo: (ms, f) => setTimeout(f, ms),
  ogni: (ms, f) => setInterval(f, ms),
  ferma: id => { clearTimeout(id); clearInterval(id) },
}

async function chiedi(url, { metodo = 'GET', corpo, fetchImpl, tentativi, attesa }) {
  for (let i = 0; i < tentativi; i++) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), attesa)
    try {
      const r = await fetchImpl(url, { method: metodo, signal: ctl.signal, ...(corpo ? { body: JSON.stringify(corpo), headers: { 'content-type': 'application/json' } } : {}) })
      return { stato: r.status, dato: await r.json().catch(() => null) }
    } catch { /* la richiesta si è persa: si rifà */ } finally { clearTimeout(t) }
  }
  return null
}

/* la lezione nasce: torna { codice, chiave, scade } o un errore con la frase da dire alla maestra */
export async function creaLezione(lezione, alunni, { servizio = indirizzoScuola(), fetchImpl = globalThis.fetch, tentativi = TEMPI.tentativi, attesa = TEMPI.attesaHttp } = {}) {
  const r = await chiedi(`${servizio}/scuola/lezione`, { metodo: 'POST', corpo: { lezione, alunni }, fetchImpl, tentativi, attesa })
  if (!r) throw new Error('non riesco a collegarmi: serve internet')
  if (r.stato === 429) throw new Error('hai creato troppe lezioni, aspetta un po\'')
  if (r.stato !== 200 || !/^[A-Z]{5}$/.test(r.dato?.codice || '')) throw new Error('il servizio della scuola non risponde ora')
  return { codice: r.dato.codice, chiave: r.dato.chiave, scade: r.dato.scade }
}

/* il codice scritto da un bambino: 'ok' (con la fase), 'no' (non c'è) o 'rete' (non si sa) */
export async function controllaCodice(codice, { servizio = indirizzoScuola(), fetchImpl = globalThis.fetch, tentativi = 2, attesa = TEMPI.attesaHttp } = {}) {
  const c = String(codice || '').trim().toUpperCase()
  if (!/^[A-Z]{5}$/.test(c)) return { esito: 'no' }
  const r = await chiedi(`${servizio}/scuola/${c}`, { fetchImpl, tentativi, attesa })
  if (r?.stato === 200 && r.dato?.fase) return { esito: 'ok', fase: r.dato.fase }
  return { esito: r?.stato === 404 ? 'no' : 'rete' }
}

/* Un collegamento che si rifà da solo. `suMessaggio(dato)` per ogni messaggio, `suChiuso(codice)` per una chiusura
   senza ritorno (4403, 4404), `suLinea('su'|'giu')`, `suApri()` a ogni apertura. `manda(oggetto)` torna se è partito. */
function collegamento({ url, orologio, WebSocketImpl, suMessaggio, suChiuso, suLinea, suApri }) {
  let ws = null, aperto = false, voluto = true, ritardo = TEMPI.ritardoMin, ultimoSegno = 0, riprova = null
  const ping = orologio.ogni(TEMPI.ping, () => {
    if (!ws) return
    if (orologio.ora() - ultimoSegno > TEMPI.morto) return cade(ws)       // il filo è morto senza dirlo: se ne apre un altro
    if (aperto) try { ws.send(PING) } catch { /* si sta chiudendo */ }
  })

  function cade(filo) {
    if (filo !== ws) return
    ws = null
    try { filo.close() } catch { /* già chiuso */ }
    if (aperto) { aperto = false; suLinea?.('giu') }
    if (voluto && !riprova) { riprova = orologio.dopo(ritardo, () => { riprova = null; apri() }); ritardo = Math.min(TEMPI.ritardoMax, ritardo * 2) }
  }

  function apri() {
    if (!voluto || ws) return
    const filo = new WebSocketImpl(url())
    ws = filo
    ultimoSegno = orologio.ora()
    filo.addEventListener('open', () => {
      if (filo !== ws) return
      aperto = true; ritardo = TEMPI.ritardoMin; ultimoSegno = orologio.ora()
      suLinea?.('su'); suApri?.()
    })
    filo.addEventListener('message', e => {
      if (filo !== ws) return
      ultimoSegno = orologio.ora()
      let d
      try { d = JSON.parse(e.data) } catch { return }
      if (d && d.t !== 'pong') suMessaggio(d)
    })
    filo.addEventListener('close', e => {
      if (filo !== ws) return
      if (e.code === 4403 || e.code === 4404) { voluto = false; cade(filo); suChiuso?.(e.code); return }
      cade(filo)
    })
  }

  return {
    via: apri,
    manda(o) { if (!aperto || !ws) return false; try { ws.send(JSON.stringify(o)); return true } catch { return false } },
    chiudi() { voluto = false; orologio.ferma(ping); if (riprova) orologio.ferma(riprova); riprova = null; if (ws) { aperto = false; cade(ws) } },
  }
}

const aWs = servizio => servizio.replace(/^http/, 'ws')
const casuale = () => { const r = globalThis.crypto.getRandomValues(new Uint8Array(16)); return Array.from(r, n => 'abcdefghijklmnopqrstuvwxyz0123456789'[n % 36]).join('') }

function magazzino(storage) {
  const m = new Map()
  const dentro = storage ?? (() => { try { return globalThis.localStorage } catch { return null } })()
  return {
    leggi(k) { try { const v = dentro?.getItem(k); if (v != null) return JSON.parse(v) } catch { /* guasto: si va avanti */ } return m.get(k) ?? null },
    scrivi(k, v) { m.set(k, v); try { dentro?.setItem(k, JSON.stringify(v)) } catch { /* pieno o vietato */ } },
    togli(k) { m.delete(k); try { dentro?.removeItem(k) } catch { /* idem */ } },
    chiavi() { const r = new Set(m.keys()); try { for (let i = 0; i < (dentro?.length || 0); i++) r.add(dentro.key(i)) } catch { /* idem */ } return [...r] },
  }
}

/* Un PC di bambini. Il posto (casuale), l'alunno, la numerazione `n` e la coda delle risposte non confermate stanno in
   localStorage sotto `scuola:<CODICE>`: sopravvivono al browser chiuso (le voci più vecchie di tre ore si buttano all'avvio). */
export function apriBambino(codice, { suStato, suNo, suLinea, servizio = indirizzoScuola(), orologio = orologioVero, WebSocketImpl = globalThis.WebSocket, storage, posto: postoDato } = {}) {
  codice = String(codice).toUpperCase()
  const m = magazzino(storage), chiaveM = 'scuola:' + codice
  // solo le code dei codici: le altre chiavi `scuola:` (il quaderno della maestra, il ricordo del bambino) sono di altri
  for (const k of m.chiavi()) if (/^scuola:[A-Z]{5}$/.test(k) && !(orologio.ora() - (m.leggi(k)?.nato ?? 0) < TRE_ORE)) m.togli(k)
  const mio = m.leggi(chiaveM) || { nato: orologio.ora(), posto: postoDato || casuale(), alunno: null, ultimaN: 0, coda: [] }
  mio.coda = (mio.coda || []).filter(v => orologio.ora() - v.t < TRE_ORE)
  const salva = () => m.scrivi(chiaveM, mio)
  salva()
  let io = null, vuole = null, ultimoDove = null, pronto = false, giro = null

  const c = collegamento({
    url: () => `${aWs(servizio)}/scuola/${codice}/bambino?posto=${mio.posto}`, orologio, WebSocketImpl, suLinea,
    suApri: () => { pronto = false },
    suChiuso: () => suNo?.('codice'),
    suMessaggio(d) {
      if (d.t === 'stato') {
        io = d.io; pronto = true
        if (io) { mio.alunno = io.id; vuole = null; salva() }    // se no, liberato dalla maestra, richiederebbe lo stesso nome
        togliFinoA(d.preso)
        if (!io && vuole) c.manda({ k: 'sono', ...vuole })
        if (ultimoDove) c.manda({ k: 'dove', dove: ultimoDove })
        suStato?.(d)
        if (d.fase === 'chiusa') { mio.coda = []; salva() } else rimanda()
      } else if (d.t === 'preso') { mio.coda = mio.coda.filter(v => v.n !== d.n); salva() }
      else if (d.t === 'no') {
        if (d.perche === 'chiusa') { mio.coda = []; salva() }
        else if (d.n !== undefined) { mio.coda = mio.coda.filter(v => v.n !== d.n); salva() }       // storta: non sarà mai accettata
        if (d.perche === 'preso' || d.perche === 'storto') vuole = null
        suNo?.(d.perche)
      }
    },
  })

  function togliFinoA(n) { mio.coda = mio.coda.filter(v => v.n > n); salva() }
  /* a ogni rientro la coda riparte, un messaggio ogni `passoCoda` ms (il servizio ne accetta venti al secondo) */
  function rimanda() {
    if (giro) orologio.ferma(giro)
    const inviare = mio.coda.slice()
    const passo = () => {
      giro = null
      const v = inviare.shift()
      if (!v || !pronto) return
      if (mio.coda.some(x => x.n === v.n)) c.manda({ k: 'risposta', n: v.n, ...v.r })
      if (inviare.length) giro = orologio.dopo(TEMPI.passoCoda, passo)
    }
    passo()
  }

  c.via()
  return {
    sono(chi) {
      vuole = typeof chi === 'string' ? { alunno: chi } : { nome: chi?.nome }
      if (pronto && !io) c.manda({ k: 'sono', ...vuole })
    },
    rispondi(r) {
      const n = ++mio.ultimaN
      mio.coda.push({ n, t: orologio.ora(), r: { parte: r.parte, chiave: r.chiave, fatto: r.fatto, data: r.data, attesa: r.attesa, giusta: r.giusta, ms: r.ms, ...(r.ultima === false ? { ultima: false } : {}) } })
      salva()
      if (pronto && io) c.manda({ k: 'risposta', n, ...mio.coda.at(-1).r })
      return n
    },
    dove(d) { ultimoDove = d; c.manda({ k: 'dove', dove: d }) },
    inCoda: () => mio.coda.length,
    chiudi() { if (giro) orologio.ferma(giro); c.chiudi() },
  }
}

/* La maestra: si collega subito. `via()` fa partire la lezione, `smetti()` la chiude, `chiudi()` chiude il collegamento. `suTutto` all'ingresso (tutto quello che il servizio sa), poi `suAlunni`, `suRisposta(alunno, r)`, `suFase`.
   `suRifiuto('chiave' | 'codice')` quando il servizio non la accetta, e non ci riprova. */
export function apriMaestra(codice, chiave, { suTutto, suAlunni, suRisposta, suFase, suLinea, suRifiuto, servizio = indirizzoScuola(), orologio = orologioVero, WebSocketImpl = globalThis.WebSocket } = {}) {
  codice = String(codice).toUpperCase()
  const c = collegamento({
    url: () => `${aWs(servizio)}/scuola/${codice}/maestra?chiave=${encodeURIComponent(chiave)}`, orologio, WebSocketImpl, suLinea,
    suChiuso: cod => suRifiuto?.(cod === 4403 ? 'chiave' : 'codice'),
    suMessaggio(d) {
      if (d.t === 'tutto') suTutto?.(d)
      else if (d.t === 'alunni') suAlunni?.(d.alunni)
      else if (d.t === 'risposta') suRisposta?.(d.alunno, d.r)
      else if (d.t === 'fase') suFase?.(d.fase)
    },
  })
  c.via()
  return {
    via: () => c.manda({ k: 'via' }),
    chiudi: c.chiudi,
    libera: id => c.manda({ k: 'libera', alunno: id }),
    togli: id => c.manda({ k: 'togli', alunno: id }),
    smetti: () => c.manda({ k: 'chiudi' }),
  }
}
