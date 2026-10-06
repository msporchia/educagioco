/* La fattoria si salva anche se la pagina sparisce: a scheda nascosta il
   ciclo dei fotogrammi si ferma e il salvataggio pigro (1,2 s) non scatta
   più, quindi l'ultimo gesto va scritto sul momento. Un pezzo di terra
   comprato col dito, `visibilitychange` o `pagehide` prima dei ritardi,
   ricarica: il pezzo c'è. Niente `#fattoria-tipo=`: butterebbe la fattoria.
   Vedi docs/fattoria/regole.md.
   `node test/esegui.mjs fattoria-salvataggio` */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, attendi, scegli } from '../aiuto/browser.mjs'
import { controlla, riassunto } from '../aiuto/verifica.mjs'
import { Fattoria, borsaInfinita } from '../../src/giochi/fattoria/motore/fattoria.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { coins: 3000, settings: { eta: 10, sperimentali: true } })

const nuove = () => Object.keys(new Fattoria({ borsa: borsaInfinita() }).serializza().piazzole).length
const quante = async () => {
  const p = await leggiProfilo(page)
  const s = p?.campagne?.fattoria?.cfg?.stato
  return s ? Object.keys(s.piazzole || {}).length : 0
}
const nascondi = () => page.evaluate(() => {
  for (const k of ['hidden', 'visibilityState'])
    Object.defineProperty(document, k, { configurable: true, get: () => k === 'hidden' ? true : 'hidden' })
  document.dispatchEvent(new Event('visibilitychange'))
})
const chiudiLaPagina = () => page.evaluate(() => dispatchEvent(new Event('pagehide')))

async function entra() {
  await scegli(page, 'fattoria')
  await page.waitForSelector('.fa-tela', { timeout: 5000 })
  await attendi(page, 500)
}
async function esci() {
  await page.reload()
  await page.waitForSelector('.carte', { timeout: 10000 })
}

const cdp = await page.context().newCDPSession(page)
async function dito(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await attendi(page, 260)
}
const cartello = async () => ((await page.evaluate(
  () => (document.querySelector('.fa-foglio h2') || {}).innerText || '')).trim()) === 'Un altro pezzo di terra'
async function chiudi() {
  if (await page.locator('.fa-velo').count()) {
    await page.locator('.fa-velo').click({ position: { x: 5, y: 5 } })
    await attendi(page, 200)
  }
}
/* compra un pezzo di terra: lo cerca col dito, non sa dov'è */
async function compra() {
  const box = await page.locator('.fa-tela').boundingBox()
  for (let y = box.y + 16; y < box.y + box.height - 16; y += 30)
    for (let x = box.x + 20; x < box.x + box.width - 20; x += 60) {
      await dito(Math.round(x), Math.round(y))
      if (await cartello()) {
        await page.locator('.fa-foglio button', { hasText: 'Compra' }).click()
        await attendi(page, 150)
        return true
      }
      await chiudi()
    }
  return false
}

await entra()
const n0 = Math.max(nuove(), await quante())

/* si compra, la pagina si nasconde, si ricarica prima dei ritardi */
controlla('si compra un pezzo di terra', await compra())
await nascondi()
await attendi(page, 120)
await esci()
const n1 = await quante()
controlla(`nascosta la pagina, il pezzo c'è dopo la ricarica (${n0} -> ${n1})`, n1 > n0)

/* un altro, e la pagina si chiude */
await entra()
controlla('si compra un altro pezzo', await compra())
await chiudiLaPagina()
await attendi(page, 120)
await esci()
const n2 = await quante()
controlla(`chiusa la pagina, anche il secondo c'è (${n1} -> ${n2})`, n2 > n1)

controlla('nessun errore in console', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('fattoria: la fattoria si salva se la pagina sparisce')
