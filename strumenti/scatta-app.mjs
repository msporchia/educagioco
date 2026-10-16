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
   `--prima '<espressione>'` la fa nella pagina (e la aspetta) dopo `--aspetta` e prima dei tocchi: per portare l'eroe del mondo
   di sopra in 3D davanti a un posto (`window.__mondo3d.vai('pietra:altare')`) o per aprire qualcosa a mano.
   `--sequenza 8 --ogni 120` fa otto scatti di fila dopo i tocchi (`<nome>-1.png`…), per guardare un'animazione.

   `--esegui '<espressione>'` la valuta nella pagina prima dei tocchi.
   `--stampa '<espressione>'` scrive, dopo i tocchi, quanto vale nella pagina
   (in JSON): `--stampa 'window.__mate.grafica()'` dice quanto costa un
   fotogramma degli asteroidi in 3D.
   `--pagina strumenti/banco/pannello.html?p=zaino&tema=pietra` fotografa una pagina del server di Vite (un banco)
   invece dell'app: niente giocatore di prova, niente `#`. `--alto 700` cambia l'altezza della finestra (844), `--pixel 1.25`
   il deviceScaleFactor (2 di difetto, un telefono; 1, 1.25, 1.5 un monitor col suo zoom).

   `--stili '.qz-velo, .qz-velo *'` scrive accanto allo scatto (e a ogni `--domanda`) `<nome>.stili.json`: per ogni elemento trovato, in
   ordine, il suo stile calcolato (e quello di ::before e ::after). Due file uguali vogliono dire due schermate
   uguali al pixel, anche quando la domanda pescata è un'altra: è la prova che un ritocco non ha toccato chi non
   doveva (docs/sotterraneo/tema-pannelli.md).
   ═══════════════════════════════════════════════════════════════════ */

import { apriBrowser, apriGioco } from '../test/aiuto/browser.mjs'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
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
const pagina = opz('pagina', null)
const dove = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1]?.startsWith('--') !== true) || (pagina ? '' : null)
if (dove == null) { console.error('uso: node strumenti/scatta-app.mjs <schermata> [--porta 5173 | --dist [index.html]] [--tocca sel,sel] [--attesa 700] [--larghezza 390] [--nome nome]'); process.exit(1) }

const porta = opz('porta', '5173')
const attesa = Number(opz('attesa', 700))
const tocchi = (opz('tocca', '') || '').split(',').map(s => s.trim()).filter(Boolean)
mkdirSync(SCATTI, { recursive: true })
const nome = opz('nome', (dove || pagina).replace(/[^\w=-]+/g, '_'))
const esce = opz('file', resolve(SCATTI, `${nome}.png`))
const conDist = args.includes('--dist')
const dist = conDist && opz('dist', '') && !opz('dist', '').startsWith('--') ? resolve(opz('dist')) : resolve(QUI, '../dist/index.html')
if (conDist && !existsSync(dist)) { console.error(`manca ${dist}: prima npm run build`); process.exit(1) }
const larghezza = Number(opz('larghezza', TELEFONO.width))
const alto = Number(opz('alto', TELEFONO.height))
const pixel = Number(opz('pixel', 2))   // il deviceScaleFactor: 1, 1.25, 1.5 per un monitor col suo zoom

// lo stesso browser e la stessa partenza dei test (un giocatore di prova, le spiegazioni già viste): senza, un
// browser nuovo si ferma su «come ti chiami?»
const browser = await apriBrowser()
const { page, errori } = pagina ? await apriPagina() : await apriGioco(browser, {
  viewport: { width: larghezza, height: alto }, hash: dove, attesa: null, pixel,
  indirizzo: conDist ? `file://${dist}` : `http://localhost:${porta}/`,
})
await page.waitForTimeout(1200)                 // l'app aspetta il profilo
// `--aspetta 4000`: prima dei tocchi e dello scatto (il 3D del sotterraneo ci mette un attimo a nascere)
await page.waitForTimeout(Number(opz('aspetta', 0)))
// `--prima '<espressione>'`: la si fa (e la si aspetta, se è una promessa) prima dei tocchi e dello scatto: `window.__mondo3d.vai('pietra:altare')`
if (opz('prima', null)) await page.evaluate(opz('prima')).catch(e => errori.push('--prima: ' + e.message))

// una pagina del server di Vite (un banco), senza il giocatore di prova dell'app
async function apriPagina() {
  const p = await browser.newPage({ viewport: { width: larghezza, height: alto }, deviceScaleFactor: pixel, hasTouch: true })
  const e = []
  p.on('pageerror', x => e.push('errore JS: ' + x.message))
  p.on('console', m => m.type() === 'error' && e.push('console: ' + m.text()))
  await p.goto(`http://localhost:${porta}/${pagina.replace(/^\//, '')}`, { waitUntil: 'load', timeout: 90000 })
  await p.waitForTimeout(2500)   // i riquadri di un banco (iframe) finiscono dopo la pagina
  return { page: p, errori: e }
}

// `--storia N`: il sotterraneo sulla terra di sopra con N discese finite (test/aiuto/sotterraneo-semina.mjs)
if (opz('storia', null) != null) {
  const { seminaIlSotterraneo } = await import('../test/aiuto/sotterraneo-semina.mjs')
  await seminaIlSotterraneo(page, {
    finite: Number(opz('storia')), eroe: opz('eroe', 'cavaliere'), parlato: !args.includes('--non-parlato'),
    missioni: Object.fromEntries((opz('missioni', '') || '').split(',').filter(Boolean).map(x => x.split(':'))),
    zaino: (opz('zaino', '') || '').split(',').filter(Boolean), punti: Number(opz('punti', 0)),
  })
  // anche dopo la semina: la terra di sopra ha le sue attese (i pensieri dell'eroe da fermo, docs/sotterraneo/pensieri.md)
  await page.waitForTimeout(Number(opz('aspetta', 0)))
}

const stili = opz('stili', null)
// lo stile calcolato di ogni elemento del selettore, in ordine: il confronto «prima/dopo» che non dipende dalla domanda pescata
async function scriviStili(png) {
  const tutto = await page.evaluate(([sel, MISURE]) => [...document.querySelectorAll(sel)].map(el => {
    const tre = [null, '::before', '::after'].map(p => {
      const c = getComputedStyle(el, p)
      // via le misure risolte (larghezza, altezza, origini): dipendono dal testo pescato, non dallo stile
      return Object.fromEntries([...c].filter(k => !MISURE.includes(k)).sort().map(k => [k, c.getPropertyValue(k)]))
    })
    return { el: el.tagName.toLowerCase() + '.' + [...el.classList].join('.'), stile: tre[0], prima: tre[1], dopo: tre[2] }
  }), [stili, ['width', 'height', 'inline-size', 'block-size', 'transform-origin', 'perspective-origin']])
  const file = png.replace(/\.png$/, '') + '.stili.json'
  writeFileSync(file, JSON.stringify(tutto, null, 1))
  console.log(`   ${tutto.length} elementi → ${file}`)
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
    if (stili) await scriviStili(resolve(SCATTI, `${nome}-${n}.png`))
    console.log(`   ${d} → ${resolve(SCATTI, `${nome}-${n}.png`)}`)
    await page.click('.prova-x')
    await page.waitForSelector('.prova-velo', { state: 'hidden', timeout: 5000 })
  }
}

// `--esegui '<espressione>'`: prima dei tocchi, nella pagina (aprire un foglio dal motore, per guardare quello che viene dopo)
const esegui = opz('esegui', null)
if (esegui) { await page.evaluate(esegui).catch(e => errori.push('esegui: ' + e.message)); await page.waitForTimeout(attesa) }

for (const sel of tocchi) {
  const el = await page.$(sel)
  if (!el) { console.log(`   (niente da toccare per «${sel}»)`); continue }
  // fuori dallo schermo (un personaggio della mappa lontano) il tocco vero non si può dare: si fa il click, e l'eroe ci va
  await el.click({ timeout: 3000 }).catch(() => el.evaluate(e => e.click()))
    .catch(e => errori.push(`tocco fallito su ${sel}: ${e.message}`))
  await page.waitForTimeout(attesa)
}

// `--sequenza 8 --ogni 120`: dopo i tocchi, otto scatti a 120 ms l'uno dall'altro (<nome>-1.png…): un'animazione fotogramma per
// fotogramma (l'affondo dello scontro, una magia). L'ultimo è anche lo scatto solito
const quanti = Number(opz('sequenza', 0)), ogni = Number(opz('ogni', 120))
for (let i = 1; i <= quanti; i++) {
  await page.screenshot({ path: esce.replace(/\.png$/, '') + `-${i}.png` })
  await page.waitForTimeout(ogni)
}
await page.screenshot({ path: esce })
const stampa = opz('stampa', null)
if (stampa) console.log('  ', stampa, '=', JSON.stringify(await page.evaluate(stampa).catch(e => 'errore: ' + e.message)))

if (stili) await scriviStili(esce)
await browser.close()

console.log(errori.length
  ? `✗ ${dove || pagina}  →  ${esce}\n  ` + errori.slice(0, 8).join('\n  ')
  : `✓ ${dove || pagina}  →  ${esce}`)
process.exit(errori.length ? 1 : 0)
