/* LA CUCINA
     node test/integrazione/bancarella-cucina.test.mjs   (dopo `npm run build`)

   Quello che `unita/bancarella-cucina` non vede: un tocco vero sulla stanza trova
   il posto giusto, il cuoco ci cammina e fa la mossa; le ordinazioni si fanno in
   qualsiasi ordine, scadono, e quella finita apre il foglio del resto, che sta
   sotto il dito e non deve prendersi il suo click. La ricetta ferma il tempo,
   i livelli si aprono vincendo, gli attrezzi si comprano. Vedi docs/bancarella/cucina.md. */
import { apriBrowser, apriGioco, azzera, leggiProfilo, attendi, scatto, TELEFONO } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { TAGLI } from '../../src/motore/bancarella/cucina.js'
import { CUCINE, ATTREZZI } from '../../src/data/bancarella-cucine.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)
await page.evaluate(() => { location.hash = 'bancarella=cucina&dpr=1' })
await page.waitForSelector('[data-cucine]', { timeout: 8000 })
uguale('si vedono tutti i livelli', await page.locator('[data-cucina-n]').count(), CUCINE.length)
controlla('la prima è aperta', await page.locator('[data-cucina-n="1"]').isEnabled())
controlla('la seconda no', await page.locator('[data-cucina-n="2"]').isDisabled())
await scatto(page, 'cucina-scelta')

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
const PANE = '1,8', SUGO = '2,8', FORMAGGIO = '0,6', INSALATA = '0,5', PIATTI = '2,0', TAGLIERE = '0,1', CONSEGNA = '3,0', LAVELLO = '1,0'
const PAVIMENTO = { [PANE]: [1, 7], [SUGO]: [2, 7], [FORMAGGIO]: [1, 6], [INSALATA]: [1, 5], [PIATTI]: [2, 1], [TAGLIERE]: [1, 1], [CONSEGNA]: [3, 1], [LAVELLO]: [1, 1] }
async function premi(id) {
  const [x, z] = PAVIMENTO[id]
  await page.evaluate(([x, z]) => Object.assign(window.__shop.cucina.value.cuoco, { x: x + 0.5, z: z + 0.5 }), [x, z])
  await tocco(await dove(id))
  await fermo()
  await attendi(page, 40)
}
const tagliato = () => page.waitForFunction(() => !window.__shop.cucina.value.tagliando, undefined, { timeout: 30000 })
async function fai(piatto) {
  await premi(FORMAGGIO); await premi(TAGLIERE); await tagliato()
  await premi(PANE); await premi(TAGLIERE); await premi(PIATTI)
}
const ordini = () => page.evaluate(() => window.__shop.coda.value.map(c => c.articoli[0].emoji))
async function daiResto() {
  await page.waitForSelector('.cassa', { timeout: 2000 })
  await page.evaluate(() => {
    const S = window.__shop
    for (const v of S.scomponi(S.cliente.value.resto, S.cliente.value.monete)) S.metti(v)
    S.proponi()
  })
}

/* ---------- 1. si tocca dove si vuole andare ---------- */
await apri(1)
nota(`la scena: ${JSON.stringify(await page.evaluate(() => window.__cucina3d.grafica()))}`)
uguale('niente persone', await page.locator('[data-cliente]').count(), 0)
uguale('e niente ceste del mercato', await page.locator('.ceste').count(), 0)
uguale('tre ordinazioni in lista', await page.locator('[data-ordine]').count(), 3)
controlla('e sono foto, non icone', (await page.locator('[data-ordinato] img').first().getAttribute('src')).startsWith('data:image/webp'))
await tocco(await dove('5,7'))
await fermo()
const k = (await stato()).cuoco
uguale('toccando il pavimento il cuoco va lì', `${k.x},${k.z}`, '5.5,7.5')
await page.evaluate(() => Object.assign(window.__shop.cucina.value.cuoco, { x: 5.5, z: 7.5 }))
await tocco(await dove(PANE))
await tocco(await dove(TAGLIERE))
uguale('l\'ultimo tocco comanda', (await stato()).fila.join(' '), TAGLIERE)
await fermo()
await page.evaluate(() => { window.__shop.cucina.value.cuoco.mano = null })
await premi(PANE)
await premi(FORMAGGIO)
await page.waitForSelector('[data-detto]', { timeout: 1500 })
uguale('quello che non si unisce lo dice', await page.locator('[data-detto]').innerText(), 'Prima si taglia')
await page.evaluate(() => { window.__shop.cucina.value.cuoco.mano = null })

/* ---------- 2. toccando un piatto ordinato si legge la ricetta, e il tempo sta fermo ---------- */
{
  await page.locator('[data-ordinato]').first().click()
  await page.waitForSelector('[data-ricetta]', { timeout: 2000 })
  await scatto(page, 'cucina-ricetta')
  const prima = await page.evaluate(() => window.__shop.cliente.value.restaPazienza)
  await attendi(page, 700)
  uguale('l\'ordinazione aspetta', await page.evaluate(() => window.__shop.cliente.value.restaPazienza), prima)
  await page.click('[data-chiudi-ricetta]')
  await attendi(page, 700)
  controlla('chiusa, il tempo riparte', await page.evaluate(() => window.__shop.cliente.value.restaPazienza) < prima)
}

/* ---------- 3. si servono in qualsiasi ordine ---------- */
await page.evaluate(() => {
  const o = window.__shop.coda.value
  o[0].articoli[0] = { ...o[0].articoli[0], emoji: '🥖' }; o[1].articoli[0] = { ...o[1].articoli[0], emoji: '🥪' }; o[2].articoli[0] = { ...o[2].articoli[0], emoji: '🥖' }
})
await fai('🥪')
uguale('il piatto è pronto', (await stato()).cuoco.mano?.pronto, '🥪')
await premi(CONSEGNA)
await page.waitForSelector('.cassa', { timeout: 2000 })
uguale('la seconda ordinazione è servita per prima', (await ordini())[0], '🥪')
await attendi(page, 500)
uguale('e il dito che si alza non preme una moneta', await page.evaluate(() => window.__shop.dato.value), 0)
controlla('il foglio mostra i soldi che danno', await page.locator('[data-porge]').count() > 0)
await scatto(page, 'cucina-il-resto')

/* ---------- 4. alla cassa è tutto fermo, e si esce solo dando il resto ---------- */
{
  const prima = await page.evaluate(() => window.__shop.coda.value[1].restaPazienza)
  await attendi(page, 900)
  uguale('col foglio aperto le ordinazioni aspettano', await page.evaluate(() => window.__shop.coda.value[1].restaPazienza), prima)
  uguale('il foglio non si mette da parte', await page.locator('[data-chiudi], [data-azione="al-resto"]').count(), 0)
}
await daiResto()
await page.waitForFunction(() => window.__shop.hud.serviti === 1, undefined, { timeout: 4000 })
await attendi(page, 500)
const p = await leggiProfilo(page)
controlla('l\'incasso va nel banco', p.campagne.bancarella.banco.cassa > 0)

/* ---------- 5. un'ordinazione che scade costa un cuore e sparisce ---------- */
{
  const cuori = await page.evaluate(() => window.__shop.hud.cuori)
  await page.evaluate(() => { window.__shop.coda.value.at(-1).restaPazienza = 0.05 })
  await page.waitForFunction(c => window.__shop.hud.cuori === c - 1, cuori, { timeout: 8000 })
  uguale('resta quella che non è scaduta', await page.locator('[data-ordine]').count(), 1)
}

/* ---------- 6. vincere apre il livello dopo, e si comprano gli attrezzi ---------- */
await page.evaluate(() => { const S = window.__shop; S.hud.serviti = 8; S.tappa.value = 2; S.coda.value = S.coda.value.slice(0, 1); S.chiudi('vinta') })
await page.waitForFunction(() => window.__shop.fase.value === 'fine', undefined, { timeout: 4000 })
await page.click('[data-azione="le-cucine"]')
await page.waitForSelector('[data-cucine]', { timeout: 3000 })
controlla('il secondo livello si è aperto', await page.locator('[data-cucina-n="2"]').isEnabled())
{
  const a = ATTREZZI.find(x => x.che === 'tagliere')
  await page.evaluate(n => { const S = window.__shop; S.mioBanco.value = { ...S.mioBanco.value, cassa: n } }, a.prezzo + 50)
  await page.click('[data-attrezzo="tagliere"]')
  await attendi(page, 300)
  uguale('il tagliere in più è comprato', await page.evaluate(() => window.__shop.mioBanco.value.cucina.tagliere), 1)
  uguale('e pagato', await page.evaluate(() => window.__shop.mioBanco.value.cassa), 50)
}
await apri(2)
controlla('il secondo tagliere sta in cucina', !!(await stato()).stazioni['tagliere:2'])

/* ---------- 7. l'insalata: un tocco la posa e il cuoco taglia da sé, poi si prende ---------- */
await premi(INSALATA); await premi(TAGLIERE)
controlla('l\'insalata va sul tagliere e il cuoco taglia', (await stato()).tagliando)
await tagliato()
uguale('senza altri tocchi', (await stato()).stazioni.tagliere.colpi, TAGLI)
await premi(PIATTI)
await premi(TAGLIERE)
uguale('col piatto si prende', (await stato()).cuoco.mano?.cose?.join(), 'insalata')

/* ---------- 8. il lavello ---------- */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('[data-cucine]', { timeout: 3000 })
await page.evaluate(() => { location.hash = 'bancarella=cucina&livello=6&dpr=1' })
await page.reload()
await page.waitForFunction(() => window.__cucina3d?.grafica()?.fotogrammi > 3 && window.__shop?.cliente.value && !window.__shop.cambio.value, undefined, { timeout: 30000 })
await page.evaluate(() => { const c = window.__shop.cucina.value; c.puliti = 0; c.sporchi = 1 })
await premi(PIATTI)
await page.waitForSelector('[data-detto]', { timeout: 1500 })
uguale('senza piatti puliti lo dice', await page.locator('[data-detto]').innerText(), 'Non ci sono piatti puliti: lavali')
await premi(LAVELLO)
await page.waitForFunction(() => window.__shop.cucina.value.puliti === 1, undefined, { timeout: 30000 })
await scatto(page, 'cucina-lavello')

/* ---------- 9. uscire non butta il livello ---------- */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('[data-ripresa]', { timeout: 3000 })
await page.click('[data-azione="riprendi"]')
await page.waitForFunction(() => window.__shop.fase.value === 'gioco', undefined, { timeout: 3000 })
uguale('riprendendo la stanza è com\'era', (await stato()).puliti, 1)

uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))
await browser.close()
riassunto('La cucina della bancarella')
