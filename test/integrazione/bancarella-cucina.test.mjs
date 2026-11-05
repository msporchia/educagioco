/* LE CUCINE, COL DITO
     node test/integrazione/bancarella-cucina.test.mjs   (dopo `npm run build`)

   Quello che `unita/bancarella-cucina` non vede: dall'indirizzo si arriva alla
   scelta e ai fornelli, il fuoco scorre da solo, e il resto è un foglio che
   lascia in vista le stazioni. Vedi docs/bancarella/cucina.md. */
import { apriBrowser, apriGioco, azzera, leggiProfilo, attendi, TELEFONO } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { INGREDIENTI, COLPI } from '../../src/motore/bancarella/cucina.js'
import { CUCINE } from '../../src/data/bancarella.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)
await page.evaluate(() => { location.hash = 'bancarella=cucina' })
await page.waitForSelector('[data-cucine]', { timeout: 8000 })
uguale('si sceglie fra tutte le cucine', await page.locator('[data-cucina-n]').count(), CUCINE.length)

const pronti = () => page.waitForFunction(() => !window.__shop.cambio.value && window.__shop.cliente.value, { timeout: 8000 })
const apri = async n => { await page.click(`[data-cucina-n="${n}"]`); await page.waitForSelector('[data-cucina]', { timeout: 3000 }); await pronti() }
const fase = k => page.getAttribute(`[data-stazione="${k}"]`, 'data-fase')
const vuole = () => page.evaluate(() => window.__shop.cliente.value.articoli.map(a => a.emoji))
const aspetta = (k, f, ms) => page.waitForFunction(([k, f]) => document.querySelector(`[data-stazione="${k}"]`).dataset.fase === f, [k, f], { timeout: ms })
// pulsa: aspettando che stia ferma scuocerebbe
const tocca = k => page.click(`[data-stazione="${k}"]`, { force: true })

async function fai(piatto) {
  if (piatto === '🥪') { await page.click('[data-cosa="pane"]'); await page.click('[data-cosa="formaggio"]'); return }
  await page.click('[data-cosa="pasta"]')
  await aspetta('pentola', 'pronta', (INGREDIENTI.pasta.cuoce + 3) * 1000)
  await tocca('pentola')
  await page.click('[data-cosa="sugo"]')
}

/* ---------- 1. il fuoco scorre da solo, e scuoce ---------- */
await apri(1)
await page.click('[data-cosa="pasta"]')
uguale('la pasta va sul fuoco', await fase('pentola'), 'cuoce')
await aspetta('pentola', 'scotta', (INGREDIENTI.pasta.cuoce + INGREDIENTI.pasta.tiene + 4) * 1000)
await tocca('pentola')
uguale('la pasta scotta si butta', await fase('pentola'), 'vuota')

/* ---------- 2. il piatto giusto apre il foglio del resto ---------- */
const [primo] = await vuole()
const altro = primo === '🍝' ? '🥪' : '🍝'
await fai(altro)
const prima = await page.evaluate(() => window.__shop.cliente.value.restaPazienza)
await page.click(`[data-piatto][data-pronto="${altro}"]`)
const dopo = await page.evaluate(() => window.__shop.cliente.value.restaPazienza)
controlla('il piatto che non ha chiesto costa due secondi', dopo <= prima - 2, `${prima} → ${dopo}`)
await fai(primo)
await page.click(`[data-piatto][data-pronto="${primo}"]`)
await page.waitForSelector('.cassa.foglio', { timeout: 2000 })
uguale('la cucina resta sotto il foglio', await page.locator('[data-cucina]').count(), 1)
const scatola = s => page.locator(s).first().boundingBox()
const stazione = await scatola('[data-stazione="pentola"]'), foglio = await scatola('.cassa.foglio')
controlla('e le stazioni si vedono tutte', stazione.y + stazione.height <= foglio.y + 1, `${stazione.y + stazione.height} contro ${foglio.y}`)

/* ---------- 3. il foglio si mette da parte ---------- */
await page.evaluate(() => { window.__shop.cucina.value.stazioni.pentola = { fase: 'cuoce', t: 1, cosa: 'pasta', colpi: 0 } })
await attendi(page, 900)
uguale('qui col foglio aperto il fuoco è fermo', await page.evaluate(() => window.__shop.cucina.value.stazioni.pentola.t), 1)
await page.click('[data-chiudi]')
await attendi(page, 700)
controlla('col foglio chiuso cuoce', await page.evaluate(() => window.__shop.cucina.value.stazioni.pentola.t) > 1)
await page.click('[data-azione="al-resto"]')
await page.waitForSelector('.cassa.foglio', { timeout: 2000 })
await page.evaluate(() => {
  const S = window.__shop
  for (const v of S.scomponi(S.cliente.value.resto, S.cliente.value.monete)) S.metti(v)
  S.proponi()
})
await page.waitForFunction(() => window.__shop.hud.serviti === 1, { timeout: 3000 })
await attendi(page, 500)
const p = await leggiProfilo(page)
controlla('l\'incasso va nel banco', p.campagne.bancarella.banco.cassa > 0)
uguale('la prova non muove la fila delle giornate', p.mercato.tappa, 0)
uguale('e niente sosta', p.campagne.bancarella.sosta, undefined)

/* ---------- 4. l'ultima: stazioni, tagliere, e il fuoco che non si ferma ---------- */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('[data-cucine]', { timeout: 3000 })
await apri(CUCINE.length)
uguale('quattro stazioni', await page.locator('[data-stazione]').count(), 4)
uguale('otto cose in dispensa', await page.locator('[data-cosa]').count(), 8)
await page.click('[data-cosa="insalata"]')
for (let i = 0; i < COLPI; i++) await tocca('tagliere')
uguale('tre tocchi e il tagliere è libero', await fase('tagliere'), 'vuota')
await page.evaluate(() => {
  const S = window.__shop
  S.cucina.value.stazioni.pentola = { fase: 'cuoce', t: 1, cosa: 'pasta', colpi: 0 }
  S.cucina.value.piatti = S.cliente.value.articoli.map(a => ({ cose: [], pronto: a.emoji, daInfornare: false })).concat([null, null]).slice(0, 3)
})
for (let i = 0; i < 2; i++) { const b = page.locator('[data-piatto]:not([data-pronto=""])').first(); if (await b.count() && await page.evaluate(() => window.__shop.momento.value === 'raccolta')) await b.click() }
await page.waitForSelector('.tastierone', { timeout: 2000 })
nota('il cliente con due piatti: si batte il totale nel foglio')
const t0 = await page.evaluate(() => window.__shop.cucina.value.stazioni.pentola.t)
await attendi(page, 700)
controlla('e mentre si conta il fuoco va avanti', await page.evaluate(() => window.__shop.cucina.value.stazioni.pentola.t) > t0)

uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))
await browser.close()
riassunto('Le cucine della bancarella')
