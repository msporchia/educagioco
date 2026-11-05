/* LE CUCINE, COL CUOCO
     node test/integrazione/bancarella-cuoco.test.mjs   (dopo `npm run build`)

   Quello che `unita/bancarella-cuoco` non vede: la levetta muove il cuoco, il
   tasto risponde anche col pollice già giù sulla levetta (due dita: il click
   non parte), e il piatto alla consegna apre il foglio del resto, che si può
   mettere da parte per tornare a camminare. Vedi docs/bancarella/cuoco.md. */
import { apriBrowser, apriGioco, azzera, leggiProfilo, attendi, scatto, TELEFONO } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { TAGLI } from '../../src/motore/bancarella/cuoco.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)
await page.evaluate(() => { location.hash = 'bancarella=cucina&dpr=1' })
await page.waitForSelector('[data-cucine]', { timeout: 8000 })
await page.click('[data-stile="cuoco"]')

const cdp = await page.context().newCDPSession(page)
await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 })
const stato = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__shop.cucina.value)))
const apri = async n => {
  await page.click(`[data-cucina-n="${n}"]`)
  await page.waitForFunction(() => window.__cucina3d?.grafica()?.fotogrammi > 3 && !window.__shop.cambio.value && window.__shop.cliente.value, undefined, { timeout: 20000 })
}
const centro = async s => { const b = await page.locator(s).boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } }
const leva = async () => { const b = await page.locator('.leva').boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } }

// mette il cuoco davanti a una cella: la levetta si prova una volta sola, qui conta il tasto
const davanti = (x, z, verso) => page.evaluate(([x, z, verso]) => Object.assign(window.__shop.cucina.value.cuoco, { x, z, verso }), [x, z, verso])
const SU = Math.PI, GIU = 0, SINISTRA = -Math.PI / 2, DESTRA = Math.PI / 2
const POSTI = {
  piatti: [2.5, 4.6, GIU], pasta: [1.4, 1.5, SINISTRA], sugo: [5.6, 1.5, DESTRA], formaggio: [5.6, 2.5, DESTRA], pane: [5.6, 3.5, DESTRA],
  insalata: [5.6, 4.5, DESTRA], pentola: [1.5, 1.4, SU], tagliere: [5.5, 4.6, GIU], consegna: [3.5, 1.4, SU], isola: [3.5, 3.4, SU],
}
async function premi(posto) {
  await davanti(...POSTI[posto])
  await attendi(page, 60)
  const p = await centro('[data-usa]')
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [p] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await attendi(page, 60)
}
const finisci = (k, f) => page.evaluate(k => {
  const s = window.__shop.cucina.value.stazioni[k]
  s.t = 7 - 0.02
}, k).then(() => page.waitForFunction(([k, f]) => window.__shop.cucina.value.stazioni[k].fase === f, [k, f], { timeout: 20000 }))

async function fai(piatto) {
  await premi('piatti')
  if (piatto === '🥪') { await premi('pane'); await premi('formaggio'); return }
  await premi('isola')
  await premi('pasta'); await premi('pentola')
  await finisci('pentola', 'pronta')
  await premi('isola')              // prende il piatto
  await premi('pentola')            // ci versa la pasta
  await premi('sugo')
}

/* ---------- 1. la levetta muove, e il tasto va col pollice giù ---------- */
await apri(1)
nota(`la scena: ${JSON.stringify(await page.evaluate(() => window.__cucina3d.grafica()))}`)
{
  const p = await leva(), usa = await centro('[data-usa]'), x0 = (await stato()).cuoco.x
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...p, id: 0 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p.x - 40, y: p.y, id: 0 }] })
  await page.waitForFunction(x => window.__shop.cucina.value.cuoco.x < x - 0.5, x0, { timeout: 20000 })
  controlla('la levetta a sinistra porta il cuoco a sinistra', (await stato()).cuoco.cammina)
  await davanti(...POSTI.pasta)
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x - 40, y: p.y, id: 0 }, { ...usa, id: 1 }] })
  await attendi(page, 60)
  uguale('col pollice giù il tasto prende la pasta', (await stato()).cuoco.mano?.cosa, 'pasta')
  await scatto(page, 'cuoco-in-mano')
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await attendi(page, 120)
  controlla('lasciata la levetta si ferma', !(await stato()).cuoco.cammina)
  await premi('sugo')
  await page.waitForSelector('[data-detto]', { timeout: 1500 })
  uguale('con le mani piene lo dice', await page.locator('[data-detto]').innerText(), 'Le mani sono piene')
  await premi('pentola')
  uguale('la pasta va sul fuoco', (await stato()).stazioni.pentola.fase, 'cuoce')
  await page.evaluate(() => { window.__shop.cucina.value.stazioni.pentola = { fase: 'vuota', t: 0, cosa: '', colpi: 0 } })
}

/* ---------- 2. il piatto si porta alla consegna ---------- */
const primo = await page.evaluate(() => window.__shop.cliente.value.articoli[0].emoji)
const altro = primo === '🍝' ? '🥪' : '🍝'
await fai(altro)
uguale('il piatto è pronto', (await stato()).cuoco.mano?.pronto, altro)
const prima = await page.evaluate(() => window.__shop.cliente.value.restaPazienza)
await premi('consegna')
controlla('il piatto che non ha chiesto costa due secondi', await page.evaluate(() => window.__shop.cliente.value.restaPazienza) <= prima - 2)
uguale('e resta in mano', (await stato()).cuoco.mano?.pronto, altro)
await page.evaluate(() => { window.__shop.cucina.value.cuoco.mano = null })
await fai(primo)
await premi('consegna')
await page.waitForSelector('.cassa.foglio', { timeout: 2000 })
uguale('il piatto giusto apre il foglio del resto', await page.evaluate(() => window.__shop.momento.value), 'cassa')
await attendi(page, 500)
uguale('e il dito che si alza non preme una moneta', await page.evaluate(() => window.__shop.dato.value), 0)
await scatto(page, 'cuoco-il-resto')

/* ---------- 3. il foglio si mette da parte, e si cammina ---------- */
await page.evaluate(() => { window.__shop.cucina.value.stazioni.pentola = { fase: 'cuoce', t: 1, cosa: 'pasta', colpi: 0 } })
await attendi(page, 900)
uguale('col foglio aperto il fuoco è fermo', (await stato()).stazioni.pentola.t, 1)
await page.click('[data-chiudi]')
await attendi(page, 700)
controlla('col foglio chiuso cuoce', (await stato()).stazioni.pentola.t > 1)
const tasti = await page.locator('[data-usa]').boundingBox(), resto = await page.locator('[data-azione="al-resto"]').boundingBox()
controlla('«dai il resto» non copre i tasti', resto.y + resto.height <= tasti.y, `${resto.y + resto.height} contro ${tasti.y}`)
await page.click('[data-azione="al-resto"]')
await page.waitForSelector('.cassa.foglio', { timeout: 2000 })
await page.evaluate(() => {
  const S = window.__shop
  for (const v of S.scomponi(S.cliente.value.resto, S.cliente.value.monete)) S.metti(v)
  S.proponi()
})
await page.waitForFunction(() => window.__shop.hud.serviti === 1, undefined, { timeout: 4000 })
await attendi(page, 500)
const p = await leggiProfilo(page)
controlla('l\'incasso va nel banco', p.campagne.bancarella.banco.cassa > 0)
uguale('la prova non muove la fila delle giornate', p.mercato.tappa, 0)

/* ---------- 4. l'insalata si taglia col tasto ---------- */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('[data-cucine]', { timeout: 3000 })
await apri(2)
await premi('insalata'); await premi('tagliere')
uguale('l\'insalata va sul tagliere', (await stato()).stazioni.tagliere.fase, 'taglia')
await page.waitForSelector('[data-taglia].acceso', { timeout: 2000 })
{
  const t = await centro('[data-taglia]')
  for (let i = 0; i < TAGLI; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [t] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await attendi(page, 40)
  }
}
uguale('cinque colpi e l\'insalata è tagliata', (await stato()).stazioni.tagliere.fase, 'pronta')

uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))
await browser.close()
riassunto('Le cucine col cuoco')
