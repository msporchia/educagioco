/* ═══════════════════════════════════════════════════════════════════
   UNO SCATTO DELL'APPLICAZIONE — per guardare quello che si è scritto.

   Apre l'app servita da Vite su una schermata precisa (l'indirizzo
   `#torri`, `#survivors`, …), fa qualche tocco se glielo si chiede, e
   salva un PNG. Serve a chi scrive un gioco e non ha uno schermo:
   scrivere duemila righe di Vue senza mai guardarle è il modo più
   sicuro di consegnare una schermata nera.

     npx vite --port 5201 --strictPort &            # una porta tua
     node strumenti/scatta-app.mjs survivors --porta 5201
     node strumenti/scatta-app.mjs survivors --tocca ".carta.tappa" --attesa 900
     node strumenti/scatta-app.mjs 'sotterraneo=branco&mostri=6' --dist   # il file costruito, senza server
     node strumenti/scatta-app.mjs 'seme=7&stanza=sala' --dist --larghezza 320 --nome sala-stretta

   `--dist` apre dist/index.html (o il percorso dopo, se c'è) invece del
   server di Vite: è quello che provano i test, e non serve una porta.

   `--storia N` apre il sotterraneo sulla terra di sopra con N discese finite, come le avrebbe un eroe in regola
   (`--eroe mago`, `--missioni collana:consegnata,rosicchione:presa`, `--non-parlato` se il minatore non ha ancora
   detto niente): il diario e i dialoghi si guardano senza giocare la storia. `--zaino bastone-magico,elisir-toro` mette quei
   pezzi in tasca in più (una chiave composta, `spada@7.m.fuoco`, va bene), per guardarli nel pannello o berli; `--punti 3` lascia tre
   punti delle caratteristiche da dare, per vedere cosa cambia sotto ogni «+».

   `--domanda ing-parole:2:ing:figura,tabelline:3:tab:prodotto` apre quelle domande dalla palestra dei grandi (codice 0000,
   il quadro dell'età, il ▶ della riga: `modulo:grado:chiave`, come `data-prova`) e fa uno scatto per ciascuna
   (`<nome>-1.png`, …).

   `--tocca` accetta più selettori separati da virgola: si toccano in
   fila, aspettando `--attesa` fra l'uno e l'altro. Un selettore che non
   c'è viene detto e non ferma lo scatto.

   `--aspetta 4000` aspetta tanto dopo l'apertura, prima dei tocchi e dello scatto.

   `--stampa '<espressione>'` scrive, dopo i tocchi, quanto vale nella pagina
   (in JSON): `--stampa 'window.__mate.grafica()'` dice quanto costa un
   fotogramma degli asteroidi in 3D.
   ═══════════════════════════════════════════════════════════════════ */

import { apriBrowser, apriGioco } from '../test/aiuto/browser.mjs'
import { existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const QUI = dirname(fileURLToPath(import.meta.url))
const SCATTI = resolve(QUI, '../tmp/scatti')
const TELEFONO = { width: 390, height: 844 }

const args = process.argv.slice(2)
const opz = (nome, difetto) => {
  const i = args.indexOf('--' + nome)
  return i >= 0 ? args[i + 1] : difetto
}
const dove = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1]?.startsWith('--') !== true)
if (!dove) { console.error('uso: node strumenti/scatta-app.mjs <schermata> [--porta 5173 | --dist [index.html]] [--tocca sel,sel] [--attesa 700] [--larghezza 390] [--nome nome]'); process.exit(1) }

const porta = opz('porta', '5173')
const attesa = Number(opz('attesa', 700))
const tocchi = (opz('tocca', '') || '').split(',').map(s => s.trim()).filter(Boolean)
mkdirSync(SCATTI, { recursive: true })
const nome = opz('nome', dove.replace(/[^\w=-]+/g, '_'))
const esce = opz('file', resolve(SCATTI, `${nome}.png`))
const conDist = args.includes('--dist')
const dist = conDist && opz('dist', '') && !opz('dist', '').startsWith('--') ? resolve(opz('dist')) : resolve(QUI, '../dist/index.html')
if (conDist && !existsSync(dist)) { console.error(`manca ${dist}: prima npm run build`); process.exit(1) }
const larghezza = Number(opz('larghezza', TELEFONO.width))

// lo stesso browser e la stessa partenza dei test (un giocatore di prova, le spiegazioni già viste): senza, un
// browser nuovo si ferma su «come ti chiami?»
const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, {
  viewport: { ...TELEFONO, width: larghezza }, hash: dove, attesa: null,
  indirizzo: conDist ? `file://${dist}` : `http://localhost:${porta}/`,
})
await page.waitForTimeout(1200)                 // l'app aspetta il profilo
// `--aspetta 4000`: prima dei tocchi e dello scatto (il 3D del sotterraneo ci mette un attimo a nascere)
await page.waitForTimeout(Number(opz('aspetta', 0)))

// `--storia N`: il sotterraneo sulla terra di sopra con N discese finite (test/aiuto/sotterraneo-semina.mjs)
if (opz('storia', null) != null) {
  const { seminaIlSotterraneo } = await import('../test/aiuto/sotterraneo-semina.mjs')
  await seminaIlSotterraneo(page, {
    finite: Number(opz('storia')), eroe: opz('eroe', 'cavaliere'), parlato: !args.includes('--non-parlato'),
    missioni: Object.fromEntries((opz('missioni', '') || '').split(',').filter(Boolean).map(x => x.split(':'))),
    zaino: (opz('zaino', '') || '').split(',').filter(Boolean), punti: Number(opz('punti', 0)),
  })
}

// le domande dalla palestra dei grandi: lo stesso giro di test/integrazione/domanda.test.mjs
const domande = (opz('domanda', '') || '').split(',').map(x => x.trim()).filter(Boolean)
if (domande.length) {
  await page.click('[data-azione="grandi"]')
  await page.waitForSelector('.tastierino', { timeout: 5000 })
  for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
  await page.waitForSelector('.carte', { timeout: 5000 })
  await page.click('[data-scheda="giochi"]')
  await page.waitForSelector('[data-manopola] .quadro', { timeout: 5000 })
  let n = 0
  for (const d of domande) {
    const bersaglio = `[data-prova*="${d}"]`
    for (const k of ['facili', 'medie', 'toste', 'sotto', 'spenta']) {
      if (await page.locator(bersaglio).count()) break
      const sel = `[data-manopola] [data-apri="${k}"]`
      if (!(await page.locator(sel).count())) continue
      if (!(await page.locator(sel).evaluate(el => el.classList.contains('aperta')))) await page.click(sel)
      await page.waitForTimeout(150)
      const chiuse = page.locator(`${sel} .voce-riga.apribile:not(.aperta)`)
      while (!(await page.locator(bersaglio).count()) && await chiuse.count()) {
        await chiuse.first().click()
        await page.waitForTimeout(60)
      }
    }
    if (!(await page.locator(bersaglio).count())) { console.log(`   (nel quadro non c'è «${d}»)`); continue }
    await page.click(bersaglio)
    await page.waitForSelector('.qz-tasto', { timeout: 5000 })
    await page.waitForTimeout(attesa)
    n++
    await page.screenshot({ path: resolve(SCATTI, `${nome}-${n}.png`) })
    console.log(`   ${d} → ${resolve(SCATTI, `${nome}-${n}.png`)}`)
    await page.click('.prova-x')
    await page.waitForSelector('.prova-velo', { state: 'hidden', timeout: 5000 })
  }
}

for (const sel of tocchi) {
  const el = await page.$(sel)
  if (!el) { console.log(`   (niente da toccare per «${sel}»)`); continue }
  // fuori dallo schermo (un personaggio della mappa lontano) il tocco vero non si può dare: si fa il click, e l'eroe ci va
  await el.click({ timeout: 3000 }).catch(() => el.evaluate(e => e.click()))
    .catch(e => errori.push(`tocco fallito su ${sel}: ${e.message}`))
  await page.waitForTimeout(attesa)
}

await page.screenshot({ path: esce })
const stampa = opz('stampa', null)
if (stampa) console.log('  ', stampa, '=', JSON.stringify(await page.evaluate(stampa).catch(e => 'errore: ' + e.message)))
await browser.close()

console.log(errori.length
  ? `✗ ${dove}  →  ${esce}\n  ` + errori.slice(0, 8).join('\n  ')
  : `✓ ${dove}  →  ${esce}`)
process.exit(errori.length ? 1 : 0)
