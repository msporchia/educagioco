// Il telefono collegato col cavo, visto dal computer: le schede di Chrome, un'espressione nella pagina, e l'ascolto di quello che
// succede (console, errori, WebSocket, richieste fallite, schermo acceso/spento, rete). Vedi docs/core/guasti.md.
//
//   node strumenti/telefono.mjs                          le schede aperte sul telefono
//   node strumenti/telefono.mjs esegui '<espressione>'   il valore (anche una promessa) nella scheda del gioco
//   node strumenti/telefono.mjs inciampi                 il libretto dei guasti dell'archivio
//   node strumenti/telefono.mjs ascolta [--minuti 10] [--log file] [--battiti]
//        --scheda <pezzo>  la scheda il cui indirizzo o titolo contiene il pezzo (di base «Educagioco»)
//        --battiti         scrive anche ping/pong e battiti dei fili (di base si contano soltanto)
//
// Vuole adb (il telefono con il debug USB acceso e il computer autorizzato) e Chrome aperto sul telefono.
import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'

const PORTA = 9222
const argomenti = process.argv.slice(2)
const opzione = (nome, base) => { const i = argomenti.indexOf('--' + nome); return i >= 0 ? (argomenti[i + 1] ?? true) : base }
const bandiera = nome => argomenti.includes('--' + nome)
const comando = argomenti[0] && !argomenti[0].startsWith('--') ? argomenti[0] : 'schede'

function inoltra () {
  try { execFileSync('adb', ['forward', `tcp:${PORTA}`, 'localabstract:chrome_devtools_remote'], { stdio: 'pipe' }) } catch (e) {
    console.error('adb non trova il telefono: cavo, debug USB acceso, «consenti» sul telefono?\n' + String(e.stderr || e.message))
    process.exit(1)
  }
}

async function schede () {
  inoltra()
  const r = await fetch(`http://localhost:${PORTA}/json/list`)
  return (await r.json()).filter(s => s.type === 'page' && !s.url.startsWith('content://'))
}

async function scheda () {
  const pezzo = String(opzione('scheda', 'Educagioco')).toLowerCase()
  const tutte = await schede()
  const s = tutte.find(s => (s.title + ' ' + s.url).toLowerCase().includes(pezzo))
  if (!s) { console.error(`nessuna scheda con «${pezzo}»; aperte:\n` + tutte.map(s => `  ${s.title} · ${s.url}`).join('\n')); process.exit(1) }
  return s
}

// un collegamento CDP minimo: manda(metodo, parametri) → promessa del risultato; su(evento, fn)
function collega (url) {
  const ws = new WebSocket(url)
  let n = 0
  const attese = new Map(), ascolti = new Map()
  ws.onmessage = e => {
    const m = JSON.parse(e.data)
    if (m.id && attese.has(m.id)) { const [ok, no] = attese.get(m.id); attese.delete(m.id); m.error ? no(new Error(m.error.message)) : ok(m.result) }
    else if (m.method) ascolti.get(m.method)?.(m.params)
  }
  const pronto = new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error('la scheda non si lascia collegare (DevTools aperti?)')) })
  return {
    pronto,
    chiuso: new Promise(ok => { ws.onclose = ok }),
    manda: (method, params = {}) => new Promise((ok, no) => { const id = ++n; attese.set(id, [ok, no]); ws.send(JSON.stringify({ id, method, params })) }),
    su: (evento, fn) => ascolti.set(evento, fn),
    chiudi: () => ws.close(),
  }
}

async function valuta (c, espressione) {
  const r = await c.manda('Runtime.evaluate', { expression: espressione, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result.value
}

const LEGGI_INCIAMPI = `new Promise((ok, no) => { const q = indexedDB.open('giochi-bambini'); q.onerror = () => no(q.error)
  q.onsuccess = () => { const g = q.result.transaction('kv').objectStore('kv').get('incidenti'); g.onsuccess = () => ok(g.result || []) } })`

// dentro la pagina: quello che i DevTools non dicono da soli (schermo, rete, pagina congelata), detto con un legame
const SPIA = `(() => { if (window.__spiaTelefono) return; window.__spiaTelefono = 1
  const di = (cosa) => { try { __telefono(cosa) } catch (e) {} }
  document.addEventListener('visibilitychange', () => di('schermo ' + document.visibilityState))
  addEventListener('online', () => di('rete online')); addEventListener('offline', () => di('rete offline'))
  document.addEventListener('freeze', () => di('pagina congelata')); document.addEventListener('resume', () => di('pagina ripresa'))
  addEventListener('pagehide', e => di('pagina nascosta' + (e.persisted ? ' (in cache)' : '')))
  addEventListener('pageshow', e => di('pagina mostrata' + (e.persisted ? ' (dalla cache)' : '')))
  const c = navigator.connection; if (c) c.addEventListener('change', () => di('connessione ' + c.effectiveType + ' ' + c.downlink + ' Mb/s rtt ' + c.rtt))
})()`

const ora = () => { const d = new Date(); return d.toTimeString().slice(0, 8) + '.' + String(d.getMilliseconds()).padStart(3, '0') }

async function ascolta () {
  const s = await scheda()
  const c = collega(s.webSocketDebuggerUrl)
  await c.pronto
  const log = opzione('log', null)
  const battiti = bandiera('battiti')
  const scrivi = riga => { const r = `${ora()} ${riga}`; console.log(r); if (log) appendFileSync(log, r + '\n') }
  const fili = new Map()                 // requestId → { url, aperto, mandati, ricevuti, zitti }
  const corto = u => u.replace(/^wss?:\/\/[^/]+/, '').slice(0, 60)
  const zitto = d => /^\{"t":"(ping|pong|b)"/.test(d)

  c.su('Runtime.consoleAPICalled', p => scrivi(`console.${p.type} ${p.args.map(a => a.value ?? a.description ?? a.type).join(' ').slice(0, 400)}`))
  c.su('Runtime.exceptionThrown', p => scrivi(`ERRORE ${p.exceptionDetails.exception?.description || p.exceptionDetails.text}`.slice(0, 600)))
  c.su('Log.entryAdded', p => scrivi(`log.${p.entry.level} ${p.entry.source} ${p.entry.text} ${p.entry.url || ''}`.slice(0, 400)))
  c.su('Runtime.bindingCalled', p => p.name === '__telefono' && scrivi(`— ${p.payload}`))
  c.su('Network.webSocketCreated', p => { fili.set(p.requestId, { url: p.url, nato: Date.now(), mandati: 0, ricevuti: 0, zitti: 0 }); scrivi(`filo + ${corto(p.url)} [${p.requestId}]`) })
  c.su('Network.webSocketHandshakeResponseReceived', p => { const f = fili.get(p.requestId); if (f) f.aperto = Date.now(); scrivi(`filo aperto ${p.response.status} [${p.requestId}]`) })
  c.su('Network.webSocketFrameError', p => scrivi(`filo ERRORE ${p.errorMessage} [${p.requestId}]`))
  c.su('Network.webSocketClosed', p => {
    const f = fili.get(p.requestId)
    const durata = f ? Math.round((Date.now() - (f.aperto || f.nato)) / 1000) : '?'
    scrivi(`filo × ${f ? corto(f.url) : ''} dopo ${durata} s, ${f?.mandati ?? 0} mandati, ${f?.ricevuti ?? 0} ricevuti (${f?.zitti ?? 0} battiti) [${p.requestId}]`)
    fili.delete(p.requestId)
  })
  const fotogramma = verso => p => {
    const f = fili.get(p.requestId), d = String(p.response.payloadData)
    if (f) f[verso === '→' ? 'mandati' : 'ricevuti']++
    if (zitto(d)) { if (f) f.zitti++; if (!battiti) return }
    scrivi(`filo ${verso} ${d.slice(0, 200)} [${p.requestId}]`)
  }
  c.su('Network.webSocketFrameSent', fotogramma('→'))
  c.su('Network.webSocketFrameReceived', fotogramma('←'))
  c.su('Network.loadingFailed', p => scrivi(`richiesta fallita ${p.type} ${p.errorText}${p.canceled ? ' (annullata)' : ''} [${p.requestId}]`))
  c.su('Page.lifecycleEvent', p => /^(load|DOMContentLoaded)$/.test(p.name) && scrivi(`pagina ${p.name}`))
  c.su('Page.frameNavigated', p => !p.frame.parentId && scrivi(`pagina va a ${p.frame.url}`))

  await Promise.all(['Runtime.enable', 'Log.enable', 'Network.enable', 'Page.enable'].map(m => c.manda(m)))
  await c.manda('Page.setLifecycleEventsEnabled', { enabled: true })
  await c.manda('Runtime.addBinding', { name: '__telefono' })
  await c.manda('Page.addScriptToEvaluateOnNewDocument', { source: SPIA })
  await valuta(c, SPIA)
  scrivi(`ascolto «${s.title}» ${s.url} (Ctrl+C per finire)`)
  const minuti = Number(opzione('minuti', 0))
  if (minuti) setTimeout(() => { scrivi('fine'); c.chiudi() }, minuti * 60000)
  await c.chiuso
  scrivi('la scheda si è scollegata (chiusa, o il cavo)')
  process.exit(0)
}

if (comando === 'schede') {
  for (const s of await schede()) console.log(`${s.title.slice(0, 40).padEnd(40)} ${s.url.slice(0, 100)}`)
} else if (comando === 'esegui' || comando === 'inciampi') {
  const c = collega((await scheda()).webSocketDebuggerUrl)
  await c.pronto
  const v = await valuta(c, comando === 'inciampi' ? LEGGI_INCIAMPI : argomenti[1])
  console.log(typeof v === 'string' ? v : JSON.stringify(v, null, 2))
  c.chiudi()
} else if (comando === 'ascolta') {
  await ascolta()
} else {
  console.error('comandi: schede, esegui, inciampi, ascolta'); process.exit(1)
}
