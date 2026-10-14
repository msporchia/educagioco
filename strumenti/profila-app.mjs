// Dove va il tempo della CPU in una schermata, come la vede un telefono: apre il file costruito coi cheat dell'indirizzo
// (lo stesso giocatore di prova dei test), registra il profilo della CPU per qualche secondo e stampa quanto è stata
// ferma e le funzioni che pesano di più. Per i nomi veri si costruisce senza compressione:
//
//   npx vite build --minify false --outDir tmp/dist-chiaro
//   node strumenti/profila-app.mjs 'sotterraneo' --dist tmp/dist-chiaro/index.html
//   node strumenti/profila-app.mjs 'sotterraneo=1&eroe=elfa&giu=1&seme=11' --dist --tocca 210,300 --secondi 12
//   node strumenti/profila-app.mjs 'sotterraneo' --dist --contro tmp/vecchio/dist/index.html   # due file a confronto
//
// `--tocca x,y` tocca lì dopo l'apertura e poi ogni due secondi un po' più in là (l'eroe cammina); `--lento N`
// rallenta la CPU di N volte. Un telefono non si imita davvero (la GPU, la memoria, il calore restano del computer):
// per quello c'è chrome://inspect col telefono collegato (docs/core/comandi.md). Trovato così, il 14 ottobre 2026, lo
// stile da due megabyte che la terra di sopra rimetteva a ogni elemento rifatto.
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const argv = process.argv.slice(2)
const opz = (nome, difetto = null) => { const i = argv.indexOf('--' + nome); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : difetto }
const schermata = argv[0]
if (!schermata || schermata.startsWith('--')) { console.error("uso: node strumenti/profila-app.mjs '<cheat>' [--dist file] [--contro file] [--tocca x,y] [--secondi 12] [--lento 4]"); process.exit(1) }
const file = resolve(opz('dist', 'dist/index.html'))
const contro = opz('contro')
const tocca = opz('tocca') ? opz('tocca').split(',').map(Number) : null
const secondi = Number(opz('secondi', 12)), lento = Number(opz('lento', 1))

async function profila(dist) {
  if (!existsSync(dist)) { console.error(`manca ${dist}: prima npm run build`); process.exit(1) }
  process.env.DIST = dist
  const { apriBrowser, apriGioco } = await import('../test/aiuto/browser.mjs?' + encodeURIComponent(dist))
  const b = await apriBrowser()
  const { page } = await apriGioco(b, { hash: schermata, attesa: null, indirizzo: 'file://' + dist })
  await page.waitForTimeout(3500)
  const s = await page.context().newCDPSession(page)
  if (lento > 1) await s.send('Emulation.setCPUThrottlingRate', { rate: lento })
  await s.send('Profiler.enable'); await s.send('Profiler.start')
  if (tocca) await page.mouse.click(tocca[0], tocca[1])
  for (let t = 0; t < secondi; t += 2) {
    await page.waitForTimeout(2000)
    if (tocca) await page.mouse.click(tocca[0] + (t % 4 ? 120 : -120), tocca[1] + (t % 6) * 40)
  }
  const { profile } = await s.send('Profiler.stop')
  await b.close()
  const per = new Map()
  profile.samples.forEach((id, i) => per.set(id, (per.get(id) || 0) + (profile.timeDeltas[i] || 0) / 1000))
  let tot = 0, fermo = 0
  const pesi = new Map()
  for (const n of profile.nodes) {
    const t = per.get(n.id) || 0, f = n.callFrame
    tot += t
    if (f.functionName === '(idle)') { fermo += t; continue }
    if (f.functionName === '(program)' || f.functionName === '(root)') continue
    const k = `${f.functionName || '(anonima)'} ${f.url.split('/').pop()}:${f.lineNumber}`
    pesi.set(k, (pesi.get(k) || 0) + t)
  }
  console.log(`\n${dist}\n  ${Math.round(tot)} ms registrati, CPU ferma il ${Math.round(100 * fermo / tot)}%`)
  for (const [k, v] of [...pesi].sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`  ${v.toFixed(1).padStart(8)} ms  ${k.slice(0, 100)}`)
}

await profila(file)
if (contro) await profila(resolve(contro))
