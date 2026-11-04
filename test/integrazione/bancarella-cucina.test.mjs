/* LA CUCINA, COL DITO
     node test/integrazione/bancarella-cucina.test.mjs   (dopo `npm run build`)

   Quello che `unita/bancarella-cucina` non vede: dall'indirizzo si arriva ai
   fornelli, il fuoco scorre da solo, il piatto servito porta alla cassa di
   sempre, e **alla cassa il fornello è fermo**. Vedi docs/bancarella/cucina.md. */
import { apriBrowser, apriGioco, azzera, leggiProfilo, attendi, TELEFONO } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { COTTURA, TIENE } from '../../src/motore/bancarella/cucina.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)
await page.evaluate(() => { location.hash = 'bancarella=cucina' })
await page.waitForSelector('.negozio', { timeout: 8000 })
await page.waitForFunction(() => window.__shop?.camp.value.cucina && !window.__shop.cambio.value && window.__shop.cliente.value, { timeout: 8000 })
await page.waitForSelector('[data-cucina]', { timeout: 3000 })

const fase = () => page.getAttribute('[data-pentola]', 'data-fase')
const vuole = () => page.evaluate(() => window.__shop.cliente.value.articoli[0].emoji)
const serviti = () => page.evaluate(() => window.__shop.hud.serviti)

/* si fa la cena del primo cliente: la pasta aspetta il fuoco, il panino no */
async function cucina(piatto) {
  if (piatto === '🥪') { await page.click('[data-cosa="pane"]'); await page.click('[data-cosa="formaggio"]'); return }
  await page.click('[data-cosa="pasta"]')
  await page.waitForFunction(() => document.querySelector('[data-pentola]').dataset.fase === 'pronta', { timeout: (COTTURA + 3) * 1000 })
  await page.click('[data-pentola]', { force: true })   // pulsa: aspettando che stia ferma scuocerebbe
  await page.click('[data-cosa="sugo"]')
}
const daiIlResto = () => page.evaluate(() => {
  const S = window.__shop
  for (const v of S.scomponi(S.cliente.value.resto, S.cliente.value.monete)) S.metti(v)
  S.proponi()
})

/* ---------- 1. il fuoco scorre da solo, e scuoce ---------- */
await page.click('[data-cosa="pasta"]')
uguale('la pasta va sul fuoco', await fase(), 'cuoce')
await page.waitForFunction(() => document.querySelector('[data-pentola]').dataset.fase === 'scotta', { timeout: (COTTURA + TIENE + 4) * 1000 })
nota('lasciata lì, la pasta scuoce')
await page.click('[data-pentola]')
uguale('la pasta scotta si butta', await fase(), 'vuota')
uguale('e non finisce su un piatto', await page.locator('[data-piatto][data-pronto="🍝"]').count(), 0)

/* ---------- 2. il piatto sbagliato costa tempo, quello giusto porta alla cassa ---------- */
const primo = await vuole()
const altro = primo === '🍝' ? '🥪' : '🍝'
await cucina(altro)
const prima = await page.evaluate(() => window.__shop.cliente.value.restaPazienza)
await page.click(`[data-piatto][data-pronto="${altro}"]`)
const dopo = await page.evaluate(() => window.__shop.cliente.value.restaPazienza)
controlla('il piatto che non ha chiesto costa due secondi', dopo <= prima - 2, `${prima} → ${dopo}`)
uguale('e resta sul banco', await page.locator(`[data-piatto][data-pronto="${altro}"]`).count(), 1)
await cucina(primo)
await page.click(`[data-piatto][data-pronto="${primo}"]`)
await page.waitForSelector('.cassetto', { timeout: 2000 })
uguale('il piatto giusto porta alla cassa', await page.evaluate(() => window.__shop.momento.value), 'cassa')

/* ---------- 3. alla cassa il fuoco è fermo ---------- */
await page.evaluate(() => { window.__shop.cucina.value.pentola = { fase: 'cuoce', t: 1 } })
await attendi(page, 1200)
uguale('mentre si conta la pentola non va avanti', await page.evaluate(() => window.__shop.cucina.value.pentola.t), 1)
await daiIlResto()
await page.waitForFunction(() => window.__shop.hud.serviti === 1, { timeout: 3000 })
await page.waitForSelector('[data-cucina]', { timeout: 3000 })
uguale('il cliente dopo trova il piatto già fatto, se era il suo', await page.locator(`[data-piatto][data-pronto="${altro}"]`).count(), 1)
await attendi(page, 500)
const p = await leggiProfilo(page)
controlla('l\'incasso va nel banco', p.campagne.bancarella.banco.cassa > 0, String(p.campagne.bancarella.banco.cassa))
uguale('la prova non muove la fila delle giornate', p.mercato.tappa, 0)
uguale('e niente sosta', p.campagne.bancarella.sosta, undefined)
uguale('i clienti serviti sono uno', await serviti(), 1)

uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))
await browser.close()
riassunto('La cucina della bancarella')
