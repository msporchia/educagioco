/* ═══════════════════════════════════════════════════════════════════
   GLI ASTEROIDI IN 3D, COL DITO — docs/asteroidi/grafica-3d.md

   Il cielo si disegna in WebGL (in Chrome senza schermo lo fa SwiftShader,
   lento ma vero) e i comandi sono quelli del telefono: premere sopra un
   sasso, o appena fuori dal bordo, è la risposta; premere altrove porta la
   nave lì, e trascinare la guida; un falso che tocca la nave rimbalza sullo
   scudo e non costa niente. Il dito è vero (`Input.dispatchTouchEvent`):
   un `page.click()` non trascina e non porta i pointer del tocco.

   Poi il disegno di riserva: con `#tela=2d`, e con un browser che il
   WebGL 2 non ce l'ha, il gioco resta sul 2D e si gioca lo stesso.

   `node test/esegui.mjs asteroidi-3d --niente-build`
   tempo: 120
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, attendi, scatto, scegli, parti } from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()

// entra nella prima tappa e aspetta che il cielo scenda (il primo traguardo lo ferma tre secondi)
async function entra(page) {
  await scegli(page, 'mate')
  await page.waitForSelector('[data-rotta]', { timeout: 8000 })
  await parti(page, '[data-rotta] [data-tipo="pianeta"]')
  await page.waitForSelector('button[aria-label="pausa"]', { timeout: 8000 })
  const quote = () => page.evaluate(() => window.__mate.asteroidi().map(a => Math.round(a.y)).join())
  const prima = await quote()
  for (let i = 0; i < 30 && (await quote()) === prima; i++) await attendi(page, 300)
}

// aspetta un sasso (giusto o no) tutto in scena, lontano dai bordi
const unSasso = (page, giusto) => page.waitForFunction(g => {
  const m = window.__mate
  const a = m.asteroidi().find(x => !x.morto && x.ok === g && x.y > 140 && x.y < m.nave.y - 160)
  return a ? { x: a.x, y: a.y, r: a.r } : null
}, giusto, { timeout: 15000, polling: 50 }).then(h => h.jsonValue())

const conto = page => page.evaluate(() => {
  const m = window.__mate
  return { giuste: m.hud.giuste, sbagliate: m.hud.sbagliate, vite: m.hud.vite, serie: m.hud.serie }
})

/* ---------- 1. il 3D c'è, e costa poco ---------- */
const { page, errori } = await apriGioco(browser)
await azzera(page)
await entra(page)
const cdp = await page.context().newCDPSession(page)
const giu = (x, y) => cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
const muovi = (x, y) => cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] })
const su = () => cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
const tocco = async (x, y) => { await giu(x, y); await attendi(page, 40); await su(); await attendi(page, 120) }

const g = await page.evaluate(() => window.__mate.grafica())
uguale('il cielo si disegna in 3D', g.tre, true)
controlla('la tela 3D si vede, quella 2D no',
          await page.locator('[data-tela="3d"]').isVisible() && !(await page.locator('[data-tela="2d"]').isVisible()))
dentro('pochi disegni per fotogramma', g.chiamate, 10, 140)
nota(`un fotogramma: ${g.chiamate} disegni, ${Math.round(g.triangoli / 1000)}k triangoli, pixel ratio ${g.dpr}, ${g.ms} ms (SwiftShader)`)
await scatto(page, 'asteroidi-3d-cielo')

/* ---------- 2. sopra il sasso giusto è la risposta ---------- */
let prima = await conto(page)
let s = await unSasso(page, true)
await tocco(s.x, s.y)
await scatto(page, 'asteroidi-3d-centro')
let dopo = await conto(page)
uguale('il tocco sul sasso giusto è un centro', dopo.giuste, prima.giuste + 1)
uguale('e non uno sbaglio', dopo.sbagliate, prima.sbagliate)

/* ---------- 3. premere altrove porta la nave, e basta ---------- */
prima = await conto(page)
const vuoto = await page.evaluate(() => {
  const m = window.__mate, W = innerWidth, y = m.nave.y - 30
  for (const x of [W * 0.15, W * 0.85, W * 0.5]) {
    if (m.asteroidi().every(a => a.morto || Math.hypot(a.x - x, a.y - y) > a.r * 1.6)) return { x, y }
  }
  return { x: W * 0.15, y }
})
await tocco(vuoto.x, vuoto.y)
await attendi(page, 600)
dopo = await conto(page)
uguale('premere nel vuoto non è una risposta', dopo.sbagliate + dopo.giuste, prima.sbagliate + prima.giuste)
dentro('e la nave ci va', Math.round(await page.evaluate(() => window.__mate.nave.x)), Math.round(vuoto.x) - 25, Math.round(vuoto.x) + 25)

/* ---------- 4. trascinare guida la nave ---------- */
const y = await page.evaluate(() => window.__mate.nave.y + 20)
await giu(80, y)
for (const x of [120, 170, 220, 270, 310]) { await muovi(x, y); await attendi(page, 40) }
await attendi(page, 500)
dentro('trascinando la nave segue il dito', Math.round(await page.evaluate(() => window.__mate.nave.x)), 290, 330)
await su()
await attendi(page, 150)

/* ---------- 5. appena fuori dal bordo di un falso: è la risposta (sbagliata) ---------- */
prima = await conto(page)
s = await unSasso(page, false)
await tocco(s.x + s.r * 1.08, s.y)
dopo = await conto(page)
uguale('il tocco appena fuori dal bordo prende il sasso', dopo.sbagliate, prima.sbagliate + 1)
const respinto = await page.evaluate(() => window.__mate.asteroidi().some(a => a.morto && !a.ok && a.respinto > 0 && a.rosso > 0))
controlla('lo sbagliato non esplode: diventa rosso e vola via', respinto)
await scatto(page, 'asteroidi-3d-sbaglio')

/* ---------- 6. un falso che tocca la nave rimbalza sullo scudo ---------- */
s = await unSasso(page, false)
prima = await conto(page)
const urti = await page.evaluate(() => window.__mate.nave.urti)
await page.evaluate(() => {
  const m = window.__mate, a = m.asteroidi().find(x => !x.morto && !x.ok)
  a.x = m.nave.x; a.y = m.nave.y - m.nave.r * 1.2
})
await attendi(page, 120)
await scatto(page, 'asteroidi-3d-scudo')
await attendi(page, 130)
const dopoUrto = await page.evaluate(() => ({
  urti: window.__mate.nave.urti,
  sasso: window.__mate.asteroidi().filter(a => a.urtato).map(a => ({ su: a.spy < 0, vivo: !a.morto }))[0],
}))
uguale('lo scudo lo respinge', dopoUrto.urti, urti + 1)
controlla('verso l\'alto, e resta in cielo', dopoUrto.sasso && dopoUrto.sasso.su && dopoUrto.sasso.vivo, JSON.stringify(dopoUrto.sasso))
dopo = await conto(page)
uguale('non è una risposta', dopo.sbagliate, prima.sbagliate)
uguale('e non costa una vita', dopo.vite, prima.vite)
uguale('né il filotto', dopo.serie, prima.serie)

controlla('nessun errore in console', errori.length === 0, errori.join(' | '))
await page.close()

/* ---------- 7. il disegno di riserva: chiesto con #tela=2d ---------- */
{
  const { page, errori } = await apriGioco(browser, { hash: 'tela=2d' })
  await azzera(page)
  await page.evaluate(() => { location.hash = 'tela=2d' })
  await entra(page)
  uguale('con #tela=2d si resta sul 2D', (await page.evaluate(() => window.__mate.grafica())).tre, false)
  controlla('e la tela 2D si vede', await page.locator('[data-tela="2d"]').isVisible())
  const prima = await conto(page)
  const s = await unSasso(page, true)
  await page.touchscreen.tap(s.x, s.y)
  await attendi(page, 150)
  uguale('si gioca lo stesso', (await conto(page)).giuste, prima.giuste + 1)
  controlla('nessun errore in console (2D)', errori.length === 0, errori.join(' | '))
  await page.close()
}

/* ---------- 8. un browser senza WebGL 2: il 2D, senza errori ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true })
  await ctx.addInitScript(() => {
    const vero = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (tipo, ...resto) {
      return /webgl/.test(tipo) ? null : vero.call(this, tipo, ...resto)
    }
  })
  const fittizio = { newPage: opz => ctx.newPage(opz) }
  const { page, errori } = await apriGioco(fittizio)
  await azzera(page)
  await entra(page)
  uguale('senza WebGL il cielo è quello 2D', (await page.evaluate(() => window.__mate.grafica())).tre, false)
  const s = await unSasso(page, true)
  const prima = await conto(page)
  await page.touchscreen.tap(s.x, s.y)
  await attendi(page, 150)
  uguale('e si gioca', (await conto(page)).giuste, prima.giuste + 1)
  controlla('nessun errore in console (senza WebGL)', errori.length === 0, errori.join(' | '))
  await ctx.close()
}

await browser.close()
riassunto('asteroidi in 3D, col dito')
