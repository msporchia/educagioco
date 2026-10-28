// Dove va il tempo della CPU in una schermata, come la vede un telefono: apre il file costruito coi cheat dell'indirizzo
// (lo stesso giocatore di prova dei test), registra il profilo della CPU per qualche secondo e stampa quanto è stata
// ferma, i fotogrammi e le funzioni che pesano di più. Per i nomi veri si costruisce senza compressione:
//
//   npx vite build --minify false --outDir tmp/dist-chiaro
//   node strumenti/profila-app.mjs 'sotterraneo' --dist tmp/dist-chiaro/index.html
//   node strumenti/profila-app.mjs 'sotterraneo=1&eroe=elfa&giu=1&seme=11' --dist --tocca 210,300 --secondi 12
//   node strumenti/profila-app.mjs 'sotterraneo' --dist --contro tmp/vecchio/dist/index.html   # due file a confronto
//   node strumenti/profila-app.mjs 'sotterraneo3d=1&…' --lento 1,4,6 --pronto 'window.__sotterraneo3d?.pronto' --stampa 'window.__sotterraneo3d.grafica()'
//
// `--apertura` apre la home, poi accende il profilo e solo allora apre il gioco: quello che pesa all'ingresso (la mappa
// dell'inglese) altrimenti è già passato quando il profilo parte.
// `--esegui '<espressione>'` la fa nella pagina quando il profilo parte (per scatenare qualcosa: le esplosioni degli Asteroidi 3D).
// `--tocca x,y` tocca lì dopo l'apertura e poi ogni due secondi un po' più in là (l'eroe cammina); `--lento N` (o `1,4,6`: una
// misura per valore) rallenta la CPU di N volte. `--pronto '<espressione>'` apre la home, rallenta, cambia l'indirizzo e conta i
// ms finché l'espressione è vera (il caricamento sul telefono lento), poi misura; `--prima '<espressione>'` la fa (e la aspetta)
// prima di misurare (portare l'eroe in un posto), `--stabile '<espressione>'` aspetta che resti uguale per tre secondi (le zone
// del mondo caricate); `--stampa '<espressione>'` scrive quanto vale alla fine (`grafica()` di un
// gioco 3D: chiamate, triangoli, memoria); `--funzioni 0` non elenca le funzioni. `--memoria` campiona anche quello che il JS crea
// (la spazzatura compresa: KB a fotogramma e chi li crea); il tempo del raccoglitore lo dice sempre. Ogni misura dice anche gli fps e i ms di JS e
// di compiti del filo principale a fotogramma. Un telefono non si imita davvero (la GPU, la memoria, il calore restano del computer):
// per quello c'è chrome://inspect col telefono collegato (docs/core/comandi.md). Trovato così, il 14 ottobre 2026, lo
// stile da due megabyte che la terra di sopra rimetteva a ogni elemento rifatto.
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const argv = process.argv.slice(2)
const opz = (nome, difetto = null) => { const i = argv.indexOf('--' + nome); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : difetto }
const schermata = argv[0]
if (!schermata || schermata.startsWith('--')) { console.error("uso: node strumenti/profila-app.mjs '<cheat>' [--dist file] [--contro file] [--tocca x,y] [--secondi 12] [--lento 1,4,6] [--apertura] [--pronto expr] [--prima expr] [--stabile expr] [--stampa expr] [--funzioni 12]"); process.exit(1) }
const file = resolve(opz('dist', 'dist/index.html'))
const contro = opz('contro')
const tocca = opz('tocca') ? opz('tocca').split(',').map(Number) : null
const secondi = Number(opz('secondi', 12)), lenti = String(opz('lento', 1)).split(',').map(Number)
const esegui = opz('esegui'), pronto = opz('pronto'), prima = opz('prima'), stampa = opz('stampa'), stabile = opz('stabile')
const funzioni = Number(opz('funzioni', 12))
const memoria = argv.includes('--memoria')
const apertura = argv.includes('--apertura') || !!pronto   // registra l'APERTURA: parte dalla home e cambia l'indirizzo dopo

async function profila(dist, lento) {
  if (!existsSync(dist)) { console.error(`manca ${dist}: prima npm run build`); process.exit(1) }
  process.env.DIST = dist
  const { apriBrowser, apriGioco } = await import('../test/aiuto/browser.mjs?' + encodeURIComponent(dist))
  const b = await apriBrowser()
  const { page, errori } = await apriGioco(b, { hash: apertura ? '' : schermata, attesa: null, indirizzo: 'file://' + dist })
  // i fotogrammi: un contatore di requestAnimationFrame, azzerato quando la misura parte
  await page.evaluate(() => { window.__fot = 0; (function f() { window.__fot++; requestAnimationFrame(f) })() })
  await page.waitForTimeout(3500)
  const s = await page.context().newCDPSession(page)
  if (lento > 1) await s.send('Emulation.setCPUThrottlingRate', { rate: lento })
  let msPronto = null
  if (pronto) {
    const t0 = Date.now()
    await page.evaluate(h => { location.hash = h }, schermata)
    await page.waitForFunction(pronto, null, { timeout: 120000, polling: 50 })
    msPronto = Date.now() - t0
  }
  if (prima) await page.evaluate(prima)
  if (pronto || prima) await page.waitForTimeout(2000)   // quello che resta da caricare (le anteprime, le zone vicine) non entra nella misura
  // `--stabile`: si aspetta che l'espressione resti uguale per tre secondi (le zone e i pezzi del mondo si caricano uno per fotogramma)
  if (stabile) {
    let prec = null, da = Date.now(); const fine = Date.now() + 90000
    while (Date.now() < fine) { const v = await page.evaluate(e => JSON.stringify((0, eval)(e)), stabile); if (v !== prec) { prec = v; da = Date.now() } else if (Date.now() - da > 3000) break; await page.waitForTimeout(250) }
  }
  await s.send('Performance.enable')
  const metriche = async () => Object.fromEntries((await s.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]))
  await s.send('Profiler.enable'); await s.send('Profiler.start')
  // la spazzatura: gli oggetti che il raccoglitore porta via restano nel campione (se no si vedrebbe solo quello che resta)
  if (memoria) { await s.send('HeapProfiler.enable'); await s.send('HeapProfiler.startSampling', { samplingInterval: 8192, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true }) }
  if (apertura && !pronto) await page.evaluate(h => { location.hash = h }, schermata)
  if (esegui) await page.evaluate(esegui)
  if (tocca) await page.mouse.click(tocca[0], tocca[1])
  const m0 = await metriche(), f0 = await page.evaluate(() => window.__fot), t0 = Date.now()
  for (let t = 0; t < secondi; t += 2) {
    await page.waitForTimeout(2000)
    if (tocca) await page.mouse.click(tocca[0] + (t % 4 ? 120 : -120), tocca[1] + (t % 6) * 40)
  }
  const m1 = await metriche(), fot = (await page.evaluate(() => window.__fot)) - f0, durata = Date.now() - t0
  const { profile } = await s.send('Profiler.stop')
  const mucchio = memoria ? (await s.send('HeapProfiler.stopSampling')).profile : null
  let detto = null
  if (stampa) detto = await page.evaluate(e => { try { return JSON.stringify((0, eval)(e)) } catch (x) { return 'errore: ' + x.message } }, stampa)
  await b.close()
  const per = new Map()
  profile.samples.forEach((id, i) => per.set(id, (per.get(id) || 0) + (profile.timeDeltas[i] || 0) / 1000))
  let tot = 0, fermo = 0, raccolta = 0
  const pesi = new Map()
  for (const n of profile.nodes) {
    const t = per.get(n.id) || 0, f = n.callFrame
    tot += t
    if (f.functionName === '(idle)') { fermo += t; continue }
    if (f.functionName === '(garbage collector)') raccolta += t
    if (f.functionName === '(program)' || f.functionName === '(root)') continue
    const k = `${f.functionName || '(anonima)'} ${f.url.split('/').pop()}:${f.lineNumber}`
    pesi.set(k, (pesi.get(k) || 0) + t)
  }
  const aFot = k => ((m1[k] - m0[k]) * 1000 / Math.max(1, fot)).toFixed(1)
  console.log(`\n${dist}${lento > 1 ? `  (CPU ×${lento})` : ''}\n  ${Math.round(tot)} ms registrati, CPU ferma il ${Math.round(100 * fermo / tot)}%`)
  if (msPronto != null) console.log(`  pronto in ${msPronto} ms dal cambio d'indirizzo`)
  console.log(`  ${(1000 * fot / durata).toFixed(1)} fps; a fotogramma: JS ${aFot('ScriptDuration')} ms, compiti ${aFot('TaskDuration')} ms, raccoglitore ${(raccolta / Math.max(1, fot)).toFixed(2)} ms`)
  if (mucchio) {
    const crea = new Map()
    const giu = n => { const f = n.callFrame, k = `${f.functionName || '(anonima)'} ${f.url.split('/').pop()}:${f.lineNumber}`; crea.set(k, (crea.get(k) || 0) + n.selfSize); n.children.forEach(giu) }
    giu(mucchio.head)
    const kb = [...crea.values()].reduce((a, b) => a + b, 0) / 1024
    console.log(`  memoria creata: ${(kb / Math.max(1, fot)).toFixed(1)} KB a fotogramma (${Math.round(kb)} KB in ${fot} fotogrammi), il mucchio da ${Math.round(m0.JSHeapUsedSize / 1048576)} a ${Math.round(m1.JSHeapUsedSize / 1048576)} MB`)
    for (const [k, v] of [...crea].sort((a, b) => b[1] - a[1]).slice(0, funzioni)) console.log(`  ${(v / 1024 / Math.max(1, fot)).toFixed(2).padStart(8)} KB/fot  ${k.slice(0, 100)}`)
  }
  if (detto != null) console.log('  ' + detto)
  for (const [k, v] of [...pesi].sort((a, b) => b[1] - a[1]).slice(0, funzioni)) console.log(`  ${v.toFixed(1).padStart(8)} ms  ${k.slice(0, 100)}`)
  if (errori.length) console.log('  errori: ' + errori.slice(0, 3).join(' | '))
}

for (const lento of lenti) {
  await profila(file, lento)
  if (contro) await profila(resolve(contro), lento)
}
