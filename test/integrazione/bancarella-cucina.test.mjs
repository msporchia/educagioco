/* LE CUCINE, COL DITO
     node test/integrazione/bancarella-cucina.test.mjs   (dopo `npm run build`)

   Quello che `unita/bancarella-cucina` non vede: nella scena 3D si lavora
   trascinando, il fuoco scorre da solo, il piatto va portato al cliente, e il
   resto è un foglio che lascia in vista le stazioni. Vedi docs/bancarella/cucina.md. */
import { apriBrowser, apriGioco, azzera, leggiProfilo, attendi, scatto, TELEFONO } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { COLPI } from '../../src/motore/bancarella/cucina.js'
import { CUCINE } from '../../src/data/bancarella.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)
await page.evaluate(() => { location.hash = 'bancarella=cucina&dpr=1' })
await page.waitForSelector('[data-cucine]', { timeout: 8000 })
uguale('si sceglie fra tutte le cucine', await page.locator('[data-cucina-n]').count(), CUCINE.length)

const stato = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__shop.cucina.value)))
const dove = id => page.evaluate(id => window.__cucina3d.dove(id), id)
const apri = async n => {
  await page.click(`[data-cucina-n="${n}"]`)
  await page.waitForFunction(() => window.__cucina3d?.dove('bidone') && !window.__shop.cambio.value && window.__shop.cliente.value, { timeout: 10000 })
}
async function trascina(da, a) {
  const p = await dove(da), q = await dove(a)
  await page.mouse.move(p.x, p.y); await page.mouse.down()
  await page.mouse.move((p.x + q.x) / 2, (p.y + q.y) / 2, { steps: 4 }); await page.mouse.move(q.x, q.y, { steps: 3 })
  await page.mouse.up()
  await attendi(page, 80)
}
const fase = async k => (await stato()).stazioni[k].fase
// il tempo del gioco va a fotogrammi, e senza scheda grafica sono pochi: si porta la pentola a un soffio, e il resto lo fa lei
const aspetta = (k, f) => page.evaluate(([k, f]) => {
  const s = window.__shop.cucina.value.stazioni[k]
  s.fase = f === 'pronta' ? 'cuoce' : 'pronta'
  s.t = (f === 'pronta' ? 7 : 6) - 0.02
}, [k, f]).then(() => page.waitForFunction(([k, f]) => window.__shop.cucina.value.stazioni[k].fase === f, [k, f], { timeout: 20000 }))

async function fai(piatto, i) {
  if (piatto === '🥪') { await trascina('cosa:pane', `piatto:${i}`); await trascina('cosa:formaggio', `piatto:${i}`); return }
  await trascina('cosa:pasta', 'pentola')
  await aspetta('pentola', 'pronta')
  await trascina('pentola', `piatto:${i}`)
  await attendi(page, 600)
  await trascina('cosa:sugo', `piatto:${i}`)
}

/* ---------- 1. si trascina, e il fuoco scorre da solo ---------- */
await apri(1)
await page.waitForFunction(() => window.__cucina3d.grafica().fotogrammi > 3, { timeout: 15000 })
nota(`la scena: ${JSON.stringify(await page.evaluate(() => window.__cucina3d.grafica()))}`)
await trascina('cosa:sugo', 'piatto:0')
uguale('il sugo su un piatto vuoto torna indietro', (await stato()).piatti[0], null)
await trascina('cosa:pasta', 'pentola')
uguale('la pasta va sul fuoco', await fase('pentola'), 'cuoce')
await aspetta('pentola', 'pronta')
{ // la pentola in mano, sul piatto
  const p = await dove('pentola'), q = await dove('piatto:0')
  await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(q.x, q.y - 30, { steps: 5 })
  await attendi(page, 120)
  await scatto(page, 'cucina-pentola-in-mano')
  await page.mouse.move(p.x, p.y, { steps: 5 }); await page.mouse.up()
}
await aspetta('pentola', 'scotta')
await trascina('pentola', 'bidone')
await attendi(page, 300)
uguale('la pasta scotta va nel bidone', await fase('pentola'), 'vuota')

/* ---------- 2. il piatto si porta al cliente ---------- */
const primo = await page.evaluate(() => window.__shop.cliente.value.articoli[0].emoji)
const altro = primo === '🍝' ? '🥪' : '🍝'
await fai(altro, 0)
uguale('il piatto è pronto', (await stato()).piatti[0].pronto, altro)
const prima = await page.evaluate(() => window.__shop.cliente.value.restaPazienza)
await trascina('piatto:0', 'cliente')
await attendi(page, 300)
controlla('il piatto che non ha chiesto costa due secondi', await page.evaluate(() => window.__shop.cliente.value.restaPazienza) <= prima - 2)
uguale('e torna sul banco', (await stato()).piatti[0].pronto, altro)
await fai(primo, 1)
await attendi(page, 300)
await trascina('piatto:1', 'cliente')
await page.waitForSelector('.cassa.foglio', { timeout: 2000 })
uguale('il piatto giusto apre il foglio del resto', await page.evaluate(() => window.__shop.momento.value), 'cassa')
const pentola = await dove('pentola'), foglio = await page.locator('.cassa.foglio').boundingBox()
controlla('e le stazioni restano in vista', pentola.y + 30 <= foglio.y, `${pentola.y} contro ${foglio.y}`)

/* ---------- 3. il foglio si mette da parte ---------- */
await page.evaluate(() => { window.__shop.cucina.value.stazioni.pentola = { fase: 'cuoce', t: 1, cosa: 'pasta', colpi: 0 } })
await attendi(page, 900)
uguale('col foglio aperto il fuoco è fermo', (await stato()).stazioni.pentola.t, 1)
await page.click('[data-chiudi]')
await attendi(page, 700)
controlla('col foglio chiuso cuoce', (await stato()).stazioni.pentola.t > 1)
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

/* ---------- 4. l'ultima: il coltello, il forno, il fuoco che non si ferma ---------- */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('[data-cucine]', { timeout: 3000 })
await apri(CUCINE.length)
await trascina('cosa:insalata', 'tagliere')
uguale('l\'insalata va sul tagliere', await fase('tagliere'), 'taglia')
await attendi(page, 200)
const c = await dove('coltello'), t = await dove('tagliere')
await page.mouse.move(c.x, c.y); await page.mouse.down()
await page.mouse.move(t.x, t.y - 34, { steps: 3 })
for (let i = 0; i < COLPI; i++) { await page.mouse.move(t.x, t.y + 34, { steps: 3 }); await page.mouse.move(t.x, t.y - 34, { steps: 3 }) }
await page.mouse.up()
await attendi(page, 300)
uguale('tre passate di coltello e l\'insalata è tagliata', await fase('tagliere'), 'pronta')
await trascina('tagliere', 'bidone')
await attendi(page, 300)
uguale('il tagliere si libera nel bidone', await fase('tagliere'), 'vuota')
await trascina('cosa:impasto', 'piatto:0'); await trascina('cosa:sugo', 'piatto:0'); await trascina('cosa:formaggio', 'piatto:0')
uguale('la pizza condita è cruda', (await stato()).piatti[0].daInfornare, true)
await trascina('piatto:0', 'forno')
await attendi(page, 300)
uguale('il piatto va nel forno', await fase('forno'), 'cuoce')
await page.evaluate(() => {
  const S = window.__shop
  S.cucina.value.stazioni.pentola = { fase: 'cuoce', t: 1, cosa: 'pasta', colpi: 0 }
  S.cucina.value.piatti = [...S.cliente.value.articoli.map(a => ({ cose: [], pronto: a.emoji, daInfornare: false })), null, null].slice(0, 3)
})
for (let i = 0; i < 2; i++) if ((await stato()).piatti[i]) { await trascina(`piatto:${i}`, 'cliente'); await attendi(page, 300) }
await page.waitForSelector('.tastierone', { timeout: 2000 })
nota('il cliente servito: si batte il totale nel foglio')
const t0 = (await stato()).stazioni.pentola.t
await attendi(page, 700)
controlla('e mentre si conta il fuoco va avanti', (await stato()).stazioni.pentola.t > t0)

uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))
await browser.close()
riassunto('Le cucine della bancarella')
