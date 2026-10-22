// Il ricevitore dei log del telefono: serve il sito (dist-sito/) in LAN e prende i resoconti della «Misura questo telefono»
// con un tocco, senza passare dal modulo dei giudizi. Vedi docs/core/vecchio-telefono-veri.md.
//
//   node strumenti/ricevi-log.mjs [--porta 8787] [--dist dist-sito]
//
// GET /ricevi-log -> {ok:true,v:1}; POST /ricevi-log con {testo, dati?, agente?, note?, quando?} (max 200 KB) scrive
// strumenti/vecchio-telefono/log/ricevuti/AAAA-MM-GGThhmm-<modello>.txt (cartella non versionata).
import http from 'node:http'
import os from 'node:os'
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, extname, resolve, dirname, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const QUI = dirname(fileURLToPath(import.meta.url))
export const LIMITE = 200 * 1024
const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png',
  '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' }

// un nome di host è «di casa»: localhost, indirizzi privati, la tailnet (100.64/10, *.ts.net), .local
export function ostePermesso (host) {
  host = String(host || '').toLowerCase().replace(/^\[|\]$/g, '')
  if (!host) return false
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.ts.net')) return true
  if (host === '::1' || /^f[cd][0-9a-f]{2}:/.test(host) || /^fe80:/.test(host)) return true
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(host)
  if (!m) return false
  const [a, b] = [Number(m[1]), Number(m[2])]
  return a === 127 || a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 169 && b === 254) || (a === 100 && b >= 64 && b <= 127)
}
const hostDi = h => { try { return new URL(/^https?:\/\//.test(h) ? h : 'http://' + h).hostname } catch { return '' } }

const slug = s => String(s || 'telefono').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'telefono'
// il modello sta nella testa del resoconto («K | schermo…» o il nome da userAgentData), altrimenti nell'agente
function modelloDi (p) {
  const prima = String(p.testo || '').split('\n')[0]
  const m = /modello[: ]+([^|\n]+)/i.exec(prima) || /^[^|]*\|\s*([^|]+)\|/.exec(prima)
  return slug((p.modello) || (m && m[1]) || p.agente)
}
const ora = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`

export function creaRicevitore ({ dist = 'dist-sito', cartella = join(QUI, 'vecchio-telefono/log/ricevuti'), registra = () => {} } = {}) {
  const radice = resolve(dist)
  const rifiuta = (r, codice, errore, cors) => { r.writeHead(codice, { 'content-type': 'application/json', ...cors }); r.end(JSON.stringify({ ok: false, errore })) }
  return http.createServer((q, r) => {
    const host = hostDi(q.headers.host)
    if (!ostePermesso(host)) return rifiuta(r, 403, 'host non di casa', {})
    const origin = q.headers.origin
    if (origin && !ostePermesso(hostDi(origin))) return rifiuta(r, 403, 'origine non di casa', {})
    // CORS solo per le origini di casa, mai «*»
    const cors = origin ? { 'access-control-allow-origin': origin, vary: 'Origin', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' } : {}
    const percorso = decodeURIComponent((q.url || '/').split('?')[0])
    if (percorso === '/ricevi-log') {
      if (q.method === 'OPTIONS') { r.writeHead(204, cors); return r.end() }
      if (q.method === 'GET') { r.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store', ...cors }); return r.end('{"ok":true,"v":1}') }
      if (q.method !== 'POST') return rifiuta(r, 405, 'metodo', cors)
      if (Number(q.headers['content-length'] || 0) > LIMITE) { q.resume(); return rifiuta(r, 413, 'troppo grande', cors) }
      const pezzi = []; let n = 0; let troppo = false
      q.on('data', c => { n += c.length; if (n > LIMITE) troppo = true; else pezzi.push(c) })
      q.on('end', () => {
        if (troppo) return rifiuta(r, 413, 'troppo grande', cors)
        let p
        try { p = JSON.parse(Buffer.concat(pezzi).toString('utf8')) } catch { return rifiuta(r, 400, 'json non valido', cors) }
        if (!p || typeof p.testo !== 'string' || !p.testo) return rifiuta(r, 400, 'manca testo', cors)
        let corpo = p.testo
        if (typeof p.dati === 'string' && p.dati && !corpo.includes('DATI ')) corpo += `\nDATI ${p.dati}`
        else if (p.dati && typeof p.dati === 'object' && !corpo.includes('DATI ')) corpo += `\nDATI ${JSON.stringify(p.dati)}`
        if (typeof p.note === 'string' && p.note) corpo += `\nNOTE ${p.note}`
        if (!corpo.endsWith('\n')) corpo += '\n'
        mkdirSync(cartella, { recursive: true })
        const base = `${ora(new Date())}-${modelloDi(p)}`
        let nome = `${base}.txt`
        for (let i = 2; existsSync(join(cartella, nome)); i++) nome = `${base}-${i}.txt`
        writeFileSync(join(cartella, nome), corpo)
        const file = join(cartella, nome)
        registra(`ricevuto: ${file} (${Buffer.byteLength(corpo)} byte)`)
        r.writeHead(200, { 'content-type': 'application/json', ...cors })
        r.end(JSON.stringify({ ok: true, file }))
      })
      return
    }
    if (q.method !== 'GET' && q.method !== 'HEAD') return rifiuta(r, 405, 'metodo', cors)
    let p = percorso; if (p.endsWith('/')) p += 'index.html'
    const f = normalize(join(radice, p))
    if (f !== radice && !f.startsWith(radice + sep)) { r.writeHead(403); return r.end() }
    if (!existsSync(f) || !statSync(f).isFile()) { r.writeHead(404); return r.end() }
    r.writeHead(200, { 'content-type': TIPI[extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' })
    r.end(q.method === 'HEAD' ? undefined : readFileSync(f))
  })
}

export function indirizzi (porta) {
  const url = []
  for (const lista of Object.values(os.networkInterfaces())) for (const i of lista || []) {
    if (i.family === 'IPv4' && !i.internal) url.push(`http://${i.address}:${porta}/`)
  }
  try {
    const s = JSON.parse(execFileSync('tailscale', ['status', '--json'], { encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] }))
    const nome = String(s.Self?.DNSName || '').replace(/\.$/, '')
    if (nome) url.push(`http://${nome}:${porta}/`)
    for (const ip of s.Self?.TailscaleIPs || []) if (!ip.includes(':')) url.push(`http://${ip}:${porta}/`)
  } catch { /* tailscale non c'è: pazienza */ }
  return url
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2)
  const opz = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d }
  const porta = Number(opz('porta', 8787)), dist = opz('dist', 'dist-sito')
  if (!existsSync(join(resolve(dist), 'index.html'))) { console.error(`manca ${dist}/index.html: prima npm run build:sito`); process.exit(1) }
  const server = creaRicevitore({ dist, registra: console.log })
  server.listen(porta, '0.0.0.0', () => {
    console.log(`Ricevitore dei log: il sito di ${dist} è servito qui. Sul telefono apri uno di questi indirizzi:`)
    for (const u of indirizzi(porta)) console.log('  ' + u)
    console.log('Poi Impostazioni → Avanzate → Misura questo telefono: alla fine compare «Manda al computer». Ctrl-C per chiudere.')
  })
}
