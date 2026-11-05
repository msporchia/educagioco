/* LE CUCINE, COL CUOCO
     node test/integrazione/bancarella-cuoco.test.mjs   (dopo `npm run build`)

   Quello che `unita/bancarella-cuoco` non vede: un tocco vero sulla stanza trova
   il posto giusto, il cuoco ci cammina e fa la mossa, e il piatto alla consegna
   apre il foglio del resto, che sta sotto il dito e non deve prendersi il suo
   click. Vedi docs/bancarella/cuoco.md. */
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
const dove = id => page.evaluate(id => window.__cucina3d.dove(id), id)
async function tocco(p) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [p] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
const fermo = () => page.waitForFunction(() => {
  const c = window.__shop.cucina.value
  return !c.fila.length && !c.strada.length && !c.arrivato
}, undefined, { timeout: 30000 })

// il tocco è vero; la camminata no, se non si prova quella: senza scheda grafica i fotogrammi sono pochi
const PAVIMENTO = { '2,6': [2, 5], '0,1': [1, 1], '6,1': [5, 1], '6,2': [5, 2], '6,3': [5, 3], '6,4': [5, 4], '1,0': [1, 1], '5,6': [5, 5], '3,0': [3, 1], '3,3': [3, 4] }
async function premi(id) {
  const [x, z] = PAVIMENTO[id]
  await page.evaluate(([x, z]) => Object.assign(window.__shop.cucina.value.cuoco, { x: x + 0.5, z: z + 0.5 }), [x, z])
  await tocco(await dove(id))
  await fermo()
  await attendi(page, 40)
}
const PASTA = '0,1', SUGO = '6,1', FORMAGGIO = '6,2', PANE = '6,3', INSALATA = '6,4', PIATTI = '2,6', PENTOLA = '1,0', TAGLIERE = '5,6', CONSEGNA = '3,0', ISOLA = '3,3'
const finisci = (k, f) => page.evaluate(k => {
  const s = window.__shop.cucina.value.stazioni[k]
  s.t = 7 - 0.02
}, k).then(() => page.waitForFunction(([k, f]) => window.__shop.cucina.value.stazioni[k].fase === f, [k, f], { timeout: 20000 }))

async function fai(piatto) {
  await premi(PIATTI)
  if (piatto === '🥪') { await premi(PANE); await premi(FORMAGGIO); return }
  await premi(ISOLA)
  await premi(PASTA); await premi(PENTOLA)
  await finisci('pentola', 'pronta')
  await premi(ISOLA)                // prende il piatto
  await premi(PENTOLA)              // ci versa la pasta
  await premi(SUGO)
}

/* ---------- 1. si tocca dove si vuole andare ---------- */
await apri(1)
nota(`la scena: ${JSON.stringify(await page.evaluate(() => window.__cucina3d.grafica()))}`)
uguale('niente levetta né tasti', await page.locator('[data-leva], [data-usa], [data-taglia]').count(), 0)
{
  await tocco(await dove('5,5'))
  await fermo()
  const k = (await stato()).cuoco
  uguale('toccando il pavimento il cuoco va lì', `${k.x},${k.z}`, '5.5,5.5')
  await tocco(await dove(PASTA))
  await tocco(await dove(PENTOLA))
  uguale('due tocchi in fila', (await stato()).fila.join(' '), `${PASTA} ${PENTOLA}`)
  await scatto(page, 'cuoco-cammina')
  await fermo()
  uguale('prende la pasta e la mette sul fuoco da solo', (await stato()).stazioni.pentola.fase, 'cuoce')
  await premi(SUGO)
  await premi(FORMAGGIO)
  await page.waitForSelector('[data-detto]', { timeout: 1500 })
  uguale('quello che non si unisce lo dice', await page.locator('[data-detto]').innerText(), 'Questi due non vanno insieme')
  await page.evaluate(() => {
    const c = window.__shop.cucina.value
    c.stazioni.pentola = { fase: 'vuota', t: 0, cosa: '', colpi: 0 }
    c.cuoco.mano = null
  })
}

/* ---------- 2. il piatto si porta alla consegna ---------- */
const primo = await page.evaluate(() => window.__shop.cliente.value.articoli[0].emoji)
const altro = primo === '🍝' ? '🥪' : '🍝'
await fai(altro)
uguale('il piatto è pronto', (await stato()).cuoco.mano?.pronto, altro)
const prima = await page.evaluate(() => window.__shop.cliente.value.restaPazienza)
await premi(CONSEGNA)
controlla('il piatto che non ha chiesto costa due secondi', await page.evaluate(() => window.__shop.cliente.value.restaPazienza) <= prima - 2)
uguale('e resta in mano', (await stato()).cuoco.mano?.pronto, altro)
await page.evaluate(() => { window.__shop.cucina.value.cuoco.mano = null })
await fai(primo)
await premi(CONSEGNA)
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

/* ---------- 4. l'insalata: un tocco la posa e il cuoco taglia da sé, poi si prende ---------- */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('[data-cucine]', { timeout: 3000 })
await apri(2)
await premi(INSALATA); await premi(TAGLIERE)
controlla('l\'insalata va sul tagliere e il cuoco taglia', (await stato()).tagliando)
await page.waitForFunction(() => window.__shop.cucina.value.stazioni.tagliere.fase === 'pronta', undefined, { timeout: 30000 })
uguale('senza altri tocchi', (await stato()).stazioni.tagliere.colpi, TAGLI)
await premi(TAGLIERE)
uguale('e il tocco dopo la prende', (await stato()).cuoco.mano?.cosa, 'insalata')

uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))
await browser.close()
riassunto('Le cucine col cuoco')
