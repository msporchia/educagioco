// Quanto ci mette ad aprirsi, e quanta memoria d'immagini si tiene, il file costruito: la home e poi ogni gioco.
//
//   node strumenti/misura-avvio.mjs                         # home + tutti i giochi, CPU normale
//   node strumenti/misura-avvio.mjs --lento 4               # come un telefono di fascia media (6 = bassa)
//   node strumenti/misura-avvio.mjs sotterraneo fattoria3d    # solo quei giochi (la home c'è sempre)
//   node strumenti/misura-avvio.mjs --dist tmp/vecchio/dist/index.html   # un altro file costruito
//   node strumenti/misura-avvio.mjs --soglia 200            # MB decodificati oltre i quali esce con errore
//
// Per la home: quanto passa da quando si chiede il file a quando compare la prima cosa (FCP) e a quando le carte
// sono toccabili, il più lungo blocco del thread principale, la memoria di JavaScript. Per ogni gioco: da quando
// si cambia l'indirizzo a quando la schermata ha messo giù qualcosa, e i MB che le immagini occuperebbero
// decodificate (larghezza × altezza × 4). Quel numero conta quanto la GPU, non quanto pesa il file: vedi
// docs/core/avvio-e-memoria.md. Un telefono non si imita davvero (come in profila-app.mjs): la CPU rallenta, la GPU no.
import { existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const argv = process.argv.slice(2)
const opz = (nome, difetto = null) => { const i = argv.indexOf('--' + nome); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : difetto }
const valoriOpzioni = new Set(['dist', 'lento', 'soglia'].map(n => opz(n)).filter(Boolean))
const scelti = argv.filter(a => !a.startsWith('--') && !valoriOpzioni.has(a))
const file = resolve(opz('dist', 'dist/index.html'))
const lento = Number(opz('lento', 1)), soglia = Number(opz('soglia', 0))
const GIOCHI = ['mate', 'torri', 'bancarella', 'codice', 'survivors', 'conta', 'prima', 'fattoria3d',
  'sotterraneo', 'pozioni', 'passo', 'costruttore', 'inglese', 'spagnolo', 'arena']
const elenco = (scelti.length ? scelti : GIOCHI).filter(n => n !== 'home')

if (!existsSync(file)) { console.error(`manca ${file}: prima npm run build`); process.exit(1) }
process.env.DIST = file
const { apriBrowser, apriGioco } = await import('../test/aiuto/browser.mjs')

// gira prima del bundle: tiene d'occhio i blocchi lunghi, le immagini create e i pittori
const PRIMA = () => {
  window.__lunghi = []
  try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lunghi.push(e.duration))).observe({ type: 'longtask', buffered: true }) } catch (e) { /* senza, niente blocchi */ }
  const Orig = window.Image
  window.__img = []
  window.Image = function (...a) { const i = new Orig(...a); window.__img.push(new WeakRef(i)); return i }
  window.Image.prototype = Orig.prototype
}

// i MB decodificati: ogni immagine viva una volta sola (per indirizzo), gli sfondi in CSS, le tele
const IMMAGINI = async () => {
  const viste = new Map()   // indirizzo → w×h
  const aggiungi = (src, w, h) => { if (src && w && h && !viste.has(src)) viste.set(src, [w, h]) }
  for (const r of window.__img) { const i = r.deref(); if (i && i.complete) aggiungi(i.currentSrc || i.src, i.naturalWidth, i.naturalHeight) }
  document.querySelectorAll('img').forEach(i => i.complete && aggiungi(i.currentSrc || i.src, i.naturalWidth, i.naturalHeight))
  const sfondi = new Set()
  document.querySelectorAll('*').forEach(e => {
    for (const m of (getComputedStyle(e).backgroundImage || '').matchAll(/url\("?([^")]+)"?\)/g)) sfondi.add(m[1])
  })
  await Promise.all([...sfondi].filter(u => !viste.has(u)).map(u => new Promise(ok => {
    const i = new Image(); i.onload = () => { aggiungi(u, i.naturalWidth, i.naturalHeight); ok() }; i.onerror = ok; i.src = u
  })))
  let tele = 0
  document.querySelectorAll('canvas').forEach(c => { tele += c.width * c.height * 4 })
  const m = [...viste.values()].map(([w, h]) => w * h * 4)
  return { immagini: viste.size, immaginiMB: m.reduce((a, b) => a + b, 0) / 1048576, teleMB: tele / 1048576,
    maggiore: Math.max(0, ...m) / 1048576 }
}

const f1 = n => n.toFixed(1)
const b = await apriBrowser()
const righe = []

async function misura(nome, hash) {
  const { page, errori } = await apriGioco(b, { hash: '', attesa: null, indirizzo: 'about:blank' })
  await page.addInitScript(PRIMA)   // prima del goto: deve girare prima del bundle
  const s = await page.context().newCDPSession(page)
  if (lento > 1) await s.send('Emulation.setCPUThrottlingRate', { rate: lento })
  await s.send('Performance.enable')
  const t0 = Date.now()
  await page.goto('file://' + file + (hash ? '#' + hash : ''))
  const r = { nome }
  if (nome === 'home') {
    await page.waitForSelector('.carte', { timeout: 120000 })
    r.pronta = Date.now() - t0
    r.fcp = await page.evaluate(() => Math.round((performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0))
  } else {
    // il gioco è aperto quando la home non c'è più; poi qualche istante perché metta giù le immagini
    await page.waitForFunction(() => !document.querySelector('.carte'), null, { timeout: 120000 }).catch(() => {})
    r.pronta = Date.now() - t0
    await page.waitForTimeout(4000)
  }
  r.lungo = await page.evaluate(() => Math.round(Math.max(0, ...(window.__lunghi || []))))
  r.blocchi = await page.evaluate(() => (window.__lunghi || []).filter(d => d > 50).length)
  const metriche = Object.fromEntries((await s.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]))
  r.heapMB = metriche.JSHeapUsedSize / 1048576
  const img = await page.evaluate(IMMAGINI)
  Object.assign(r, img)
  r.errori = errori.length
  await page.close()
  return r
}

console.log(`\n${file}  ${(statSync(file).size / 1048576).toFixed(1)} MB${lento > 1 ? `  (CPU ${lento}× più lenta)` : ''}`)
console.log('schermata        pronta ms  FCP ms  blocco max  >50ms  heap JS MB  immagini  MB decod.  tele MB  maggiore MB')
for (const n of ['home', ...elenco]) {
  let r
  try { r = await misura(n, n === 'home' ? '' : n) } catch (e) { console.log(n.padEnd(16), 'ERRORE', e.message.split('\n')[0]); continue }
  righe.push(r)
  console.log(`${n.padEnd(16)} ${String(r.pronta).padStart(9)} ${String(r.fcp ?? '').padStart(7)} ${String(r.lungo).padStart(11)} ${String(r.blocchi).padStart(6)} ${f1(r.heapMB).padStart(11)} ${String(r.immagini).padStart(9)} ${f1(r.immaginiMB).padStart(10)} ${f1(r.teleMB).padStart(8)} ${f1(r.maggiore).padStart(12)}${r.errori ? `  (${r.errori} errori in console)` : ''}`)
}
await b.close()
if (soglia) {
  const fuori = righe.filter(r => r.immaginiMB + r.teleMB > soglia)
  if (fuori.length) { console.error(`\noltre ${soglia} MB: ${fuori.map(r => r.nome).join(', ')}`); process.exit(1) }
}
