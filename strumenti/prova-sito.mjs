// Il sito spezzato (dist-sito/, `npm run build:sito`) servito da http locale, come lo vedrebbe un telefono:
// prima visita con il download in cassa, poi SENZA rete (il service worker deve bastare), poi un gioco aperto.
//
//   node strumenti/prova-sito.mjs                      # rete libera
//   node strumenti/prova-sito.mjs --rete 1500          # rete a 1500 KB/s (un 4G buono ~ 1000-3000), + ritardo 80 ms
//   node strumenti/prova-sito.mjs --lento 4            # e la CPU 4 volte più lenta
//   node strumenti/prova-sito.mjs --dist dist --solo-prima   # il file unico servito allo stesso modo, per confronto
//   node strumenti/prova-sito.mjs sotterraneo inglese  # quali giochi aprire offline (di partenza alcuni)
//
// Dice: quanto ci mette la home alla prima visita, quanto scarica il service worker (file e MB), la home e i giochi
// offline, gli errori di console. Vedi docs/core/avvio-e-memoria.md.
import http from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname, resolve } from 'node:path'

const argv = process.argv.slice(2)
const opz = (n, d = null) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d }
const usati = new Set(['rete', 'lento', 'dist'].map(n => opz(n)).filter(Boolean))
const giochi = argv.filter(a => !a.startsWith('--') && !usati.has(a))
const GIOCHI = giochi.length ? giochi : ['sotterraneo', 'fattoria', 'torri', 'inglese']
const radice = resolve(opz('dist', 'dist-sito'))
const rete = Number(opz('rete', 0)), lento = Number(opz('lento', 1))
if (!existsSync(join(radice, 'sw.js'))) { console.error(`manca ${radice}/sw.js: prima npm run build:sito`); process.exit(1) }

const TIPI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png',
  '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' }
const richieste = []
const server = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'
  const f = join(radice, p)
  if (!existsSync(f) || !statSync(f).isFile()) { r.writeHead(404); return r.end() }
  richieste.push(p)
  r.writeHead(200, { 'content-type': TIPI[extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' })
  r.end(readFileSync(f))
}).listen(0)
const porta = server.address().port
const BASE = `http://localhost:${porta}/`

process.env.DIST = process.env.DIST || resolve('dist/index.html')
const { apriTelefono, apriGioco } = await import('../test/aiuto/browser.mjs')
const ctx = await apriTelefono()
// il profilo di Chrome è su disco e se ne va con close(): anche se la prova cade a metà
const chiudiTutto = async () => { await ctx.close().catch(() => {}); server.close() }
for (const sg of ['SIGINT', 'SIGTERM']) process.on(sg, () => chiudiTutto().finally(() => process.exit(1)))
process.on('uncaughtException', e => { console.error(e); chiudiTutto().finally(() => process.exit(1)) })
process.on('unhandledRejection', e => { console.error(e); chiudiTutto().finally(() => process.exit(1)) })
const { page, errori } = await apriGioco(ctx, { attesa: null, indirizzo: 'about:blank' })
const fallite = new Map()
page.on('requestfailed', q => { const k = q.url().replace(BASE, './'); fallite.set(k, (fallite.get(k) || 0) + 1) })
const s = await page.context().newCDPSession(page)
if (lento > 1) await s.send('Emulation.setCPUThrottlingRate', { rate: lento })
if (rete) await s.send('Network.emulateNetworkConditions', { offline: false, latency: 80, downloadThroughput: rete * 1024, uploadThroughput: rete * 1024 })

const mb = b => (b / 1048576).toFixed(1)
let t0 = Date.now()
await page.goto(BASE)
await page.waitForSelector('.carte', { timeout: 300000 })
console.log(`\nprima visita: la home dopo ${Date.now() - t0} ms (${richieste.length} richieste al server)`)
await page.waitForTimeout(rete ? 1500 : 0)
const striscia = await page.evaluate(() => (document.querySelector('[data-scarico]') || {}).innerText || null)
console.log(`la striscia del download: ${striscia ? '«' + striscia.replace(/\n/g, ' · ') + '»' : '(già finito o non comparsa)'}`)
if (argv.includes('--solo-prima')) { await chiudiTutto(); process.exit(0) }
t0 = Date.now()
const attesi = JSON.parse(/const FILE = (\[.*\])\s+\/\//.exec(readFileSync(join(radice, 'sw.js'), 'utf8'))[1]).length
await page.waitForFunction(async attesi => {
  const k = await caches.keys(); if (!k.length) return false
  return (await (await caches.open(k[0])).keys()).length >= attesi
}, attesi, { timeout: 600000, polling: 500 })
const cassa = await page.evaluate(async () => {
  const k = await caches.keys(); const c = await caches.open(k[0]); const voci = await c.keys(); let byte = 0
  for (const v of voci) byte += (await (await c.match(v)).arrayBuffer()).byteLength
  return { cache: k[0], file: voci.length, byte }
})
console.log(`download completo ${Math.round((Date.now() - t0) / 100) / 10} s dopo la home: ${cassa.file} file, ${mb(cassa.byte)} MB in cassa (${cassa.cache})`)

await s.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 })
await ctx.setOffline(true)
const prima = richieste.length
t0 = Date.now()
await page.goto(BASE)
await page.waitForSelector('.carte', { timeout: 60000 })
console.log(`SENZA RETE: la home dopo ${Date.now() - t0} ms, richieste al server ${richieste.length - prima}`)
for (const g of GIOCHI) {
  const t = Date.now()
  await page.goto(BASE + '#' + g); await page.reload()
  await page.waitForFunction(() => !document.querySelector('.carte'), null, { timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(2500)
  const rotte = await page.evaluate(() => [...document.images].filter(i => i.complete && !i.naturalWidth).length)
  const manca = await page.evaluate(() => document.body.innerText.includes('non è ancora sul telefono'))
  console.log(`  offline ${g.padEnd(12)} aperto in ${Date.now() - t} ms, immagini rotte ${rotte}${manca ? '  ← MANCA IL FILE DEL GIOCO' : ''}`)
}
for (const [u, n] of [...fallite].slice(0, 8)) console.log(`  richiesta fallita ×${n}: ${u.slice(0, 120)}`)
// le mappe di inglese e spagnolo: la prima apertura calcola la geografia, le altre la trovano da parte (src/calcoli-in-cassa.js)
for (const g of ['inglese', 'spagnolo']) {
  const tempi = []
  for (let volta = 0; volta < 2; volta++) {
    const t = Date.now()
    await page.goto(BASE + '#' + g); await page.reload()
    await page.waitForSelector('.ing-nodo', { timeout: 120000 })
    tempi.push(Date.now() - t)
  }
  console.log(`  mappa ${g.padEnd(9)} la prima volta ${tempi[0]} ms, riaperta ${tempi[1]} ms`)
}
console.log(`errori in console: ${errori.length}`); errori.slice(0, 6).forEach(e => console.log('  ' + e.slice(0, 160)))
await chiudiTutto()
