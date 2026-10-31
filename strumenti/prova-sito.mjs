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
const GIOCHI = giochi.length ? giochi : ['sotterraneo', 'fattoria3d', 'torri', 'inglese']
const radice = resolve(opz('dist', 'dist-sito'))
const rete = Number(opz('rete', 0)), lento = Number(opz('lento', 1))
if (!existsSync(join(radice, 'sw.js'))) { console.error(`manca ${radice}/sw.js: prima npm run build:sito`); process.exit(1) }

const TIPI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png',
  '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' }
const richieste = []
// la rete lenta è QUI, sul server, e vale per tutti (anche per i download del service worker, che la limitazione di
// Chrome sulla pagina non tocca): una banda sola, spartita a pezzi da 16 KB fra tutte le richieste
let libera = 0
function invia(r, buf) {
  if (!rete) return r.end(buf)
  const PEZZO = 16 * 1024
  const manda = da => {
    if (da >= buf.length) return r.end()
    const adesso = Date.now()
    libera = Math.max(libera, adesso) + (PEZZO / (rete * 1024)) * 1000
    setTimeout(() => { if (!r.destroyed) { r.write(buf.subarray(da, da + PEZZO)); manda(da + PEZZO) } }, libera - adesso)
  }
  manda(0)
}
const server = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'
  const f = join(radice, p)
  if (!existsSync(f) || !statSync(f).isFile()) { r.writeHead(404); return r.end() }
  richieste.push(p)
  setTimeout(() => {
    r.writeHead(200, { 'content-type': TIPI[extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' })
    invia(r, readFileSync(f))
  }, rete ? 80 : 0)
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

// la rete cade a metà: la base c'è, un gioco o due sì e gli altri no. Poi torna e deve riprendere da dove era
const CHIAVE_DI = { 'codice-segreto': 'codice', 'prima-dopo': 'prima', 'passo-passo': 'passo', castello: 'torri' }
async function interrompi() {
  const tutti = JSON.parse(/const FILE = (\[.*\])\s+\/\//.exec(readFileSync(join(radice, 'sw.js'), 'utf8'))[1])
  const percorsi = Object.fromEntries(['', ...new Set(tutti.map(f => f[2]).filter(Boolean))].map(g => [g, tutti.filter(f => f[2] === g).map(f => '/' + f[0].slice(2))]))
  const gruppi = Object.keys(percorsi).filter(Boolean)
  const stato = () => page.evaluate(async percorsi => {
    const k = await caches.keys(); if (!k.length) return null
    const avute = new Set((await (await caches.open(k[0])).keys()).map(r => new URL(r.url).pathname))
    return Object.fromEntries(Object.entries(percorsi).map(([g, l]) => [g, l.every(u => avute.has(u))]))
  }, percorsi)
  const t = Date.now()
  let st
  do { await page.waitForTimeout(250); st = await stato() } while (!st || !st[''] || !gruppi.some(g => st[g]))
  console.log(`base pronta e ${gruppi.filter(g => st[g]).length} giochi su ${gruppi.length} dopo ${Date.now() - t} ms dalla home`)
  await ctx.setOffline(true)       // da qui il server non risponde più: la rete è caduta
  await page.waitForTimeout(1500)
  st = await stato()
  const finiti = gruppi.filter(g => st[g]), mancanti = gruppi.filter(g => !st[g])
  console.log(`  caduta la rete: finiti ${finiti.join(', ')}; mancano ${mancanti.join(', ')}`)
  await page.goto(BASE); await page.waitForSelector('.carte', { timeout: 30000 })
  console.log('  offline la home si apre')
  const apri = async g => {
    await page.goto(BASE + '#' + (CHIAVE_DI[g] || g)); await page.reload()
    await page.waitForTimeout(2500)
    return page.evaluate(() => document.body.innerText.includes('non è ancora sul telefono'))
  }
  const primo = finiti[0], ultimo = mancanti[mancanti.length - 1]
  console.log(`  offline ${primo} (finito): ${await apri(primo) ? 'NON SI APRE' : 'si apre'}`)
  if (ultimo) console.log(`  offline ${ultimo} (mancante): ${await apri(ultimo) ? 'dice «non è ancora sul telefono»' : 'si apre (?)'}`)
  await ctx.setOffline(false)
  await page.goto(BASE); await page.waitForSelector('.carte', { timeout: 30000 })
  const r = Date.now()
  do { await page.waitForTimeout(500); st = await stato() } while (gruppi.some(g => !st[g]) && Date.now() - r < 240000)
  console.log(`  tornata la rete: ${gruppi.every(g => st[g]) ? 'ha ripreso e finito' : 'NON ha finito'} in ${Date.now() - r} ms`)
  await chiudiTutto(); process.exit(0)
}

const mb = b => (b / 1048576).toFixed(1)
let t0 = Date.now()
await page.goto(BASE)
await page.waitForSelector('.carte', { timeout: 300000 })
console.log(`\nprima visita: la home dopo ${Date.now() - t0} ms (${richieste.length} richieste al server)`)
await page.waitForTimeout(rete ? 1500 : 0)
const striscia = await page.evaluate(() => (document.querySelector('[data-scarico]') || {}).innerText || null)
console.log(`la striscia del download: ${striscia ? '«' + striscia.replace(/\n/g, ' · ') + '»' : '(già finito o non comparsa)'}`)
if (argv.includes('--solo-prima')) { await chiudiTutto(); process.exit(0) }
if (argv.includes('--interrompi')) await interrompi()
t0 = Date.now()
const attesi = JSON.parse(/const FILE = (\[.*\])\s+\/\//.exec(readFileSync(join(radice, 'sw.js'), 'utf8'))[1]).map(f => '/' + f[0].slice(2))
// (non waitForFunction: una funzione asincrona restituisce una promessa, e per Playwright una promessa è sempre «vera»)
for (const fine = Date.now() + 600000; Date.now() < fine;) {
  const mancano = await page.evaluate(async attesi => {
    const k = await caches.keys(); if (!k.length) return attesi.length
    const avute = new Set((await (await caches.open(k[0])).keys()).map(r => new URL(r.url).pathname))
    return attesi.filter(u => !avute.has(u)).length
  }, attesi)
  if (!mancano) break
  await page.waitForTimeout(500)
}
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
