/* Gli attrezzi comuni dei test della fattoria 3D nel browser (`integrazione/fattoria3d*`): entrare sul prato, il dito vero (CDP),
   dove cade a schermo un punto del mondo, e le attese di una condizione al posto dei millisecondi fissi.
   Il gioco espone `window.__fattoria3d = { motore, mondo, q, interni, sala }` (Gioco.vue). */
import { apriGioco, azzera, semina, scegli, attendi } from './browser.mjs'

/** Apre il gioco con un profilo seminato e resta in home: chi vuole guardare la carta lo fa prima di `nelPrato`. */
export async function apriFattoria(browser, { coins = 300, hash = '', ...altro } = {}) {
  const { page, errori } = await apriGioco(browser, altro)
  await azzera(page)
  await semina(page, { coins, settings: { eta: 8, sperimentali: true } })
  if (hash) {
    await page.evaluate(h => { location.hash = h; location.reload() }, hash)
    await page.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 20000 })
    await scenaQuieta(page)
  }
  return { page, errori }
}

/** Dalla home sul prato: la tela c'è, il mondo pure, e l'eroe e la telecamera sono fermi. */
export async function nelPrato(page) {
  await scegli(page, 'fattoria3d')
  await page.waitForSelector('[data-f3="campo"] canvas', { timeout: 10000 })
  await page.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 15000 })
  await scenaQuieta(page)
}

/** L'eroe è fermo e la telecamera non si muove più fra due letture (100 ms): al posto di «fermo e poi 1200 ms». */
export const scenaQuieta = (page, ms = 15000) => page.evaluate(() => { window.__f3quieta = '' }).then(() => page.waitForFunction(() => {
  const { mondo } = window.__fattoria3d, c = mondo.camera, k = [c.x, c.z, c.d, c.p].map(v => v.toFixed(3)).join()
  const ok = mondo.eroe.fermo && !mondo.eroe.az && window.__f3quieta === k
  window.__f3quieta = k
  return ok
}, null, { polling: 100, timeout: ms }))

/** Aspetta che `fa()` (asincrona, lato Node) dica vero; restituisce l'ultimo valore. Per i controlli dopo un gesto: il gioco
    risponde al fotogramma dopo, e un controllo nell'istante passa solo finché Chrome è lento. */
export async function aspetta(fa, ms = 4000) {
  const fine = Date.now() + ms
  let v = await fa()
  while (!v && Date.now() < fine) { await new Promise(ok => setTimeout(ok, 50)); v = await fa() }
  return v
}

/** Il dito vero e le misure della scena, legati a una pagina. */
export async function attrezziDi(page) {
  const cdp = await page.context().newCDPSession(page)
  const giu = (x, y) => cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  const muovi = (x, y) => cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] })
  const su = () => cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  const tocca = async (x, y) => { await giu(x, y); await attendi(page, 60); await su() }
  const centroDi = async sel => { const r = await page.locator(sel).first().boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2] }
  // un bersaglio che si sta ancora muovendo (la nuvoletta dei cibi esce dal centro, un foglio sale) si tocca quando è fermo
  const fermoA = async sel => {
    let prima = null
    for (let k = 0; k < 30; k++) {
      const ora = await centroDi(sel)
      if (prima && Math.abs(ora[0] - prima[0]) < 0.5 && Math.abs(ora[1] - prima[1]) < 0.5) return ora
      prima = ora; await attendi(page, 40)
    }
    return prima
  }
  const toccaEl = async sel => { await page.locator(sel).first().scrollIntoViewIfNeeded().catch(() => {}); await tocca(...await fermoA(sel)) }
  async function trascina(da, a, passi = 10) {
    await giu(da[0], da[1])
    for (let k = 1; k <= passi; k++) { await muovi(da[0] + (a[0] - da[0]) * k / passi, da[1] + (a[1] - da[1]) * k / passi); await attendi(page, 30) }
    await attendi(page, 80); await su()
  }
  // dove cade sullo schermo (px della pagina) un punto del suolo
  const schermoDi = (x, z) => page.evaluate(([x, z]) => {
    const { mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), [px, py] = mondo.proietta({ x, y: 0, z })
    return [r.left + px, r.top + py]
  }, [x, z])
  const m3 = (fn, arg) => page.evaluate(fn, arg)
  const stato = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__fattoria3d.motore.s)))
  const mon = () => page.evaluate(() => window.__fattoria3d.motore.monete())
  // l'eroe ha finito di camminare e di fare il suo gesto (anche l'esultare per un livello, che fa ignorare il tocco)
  const fermo = () => page.waitForFunction(() => { const e = window.__fattoria3d.mondo.eroe; return e.fermo && !e.az }, null, { polling: 100, timeout: 15000 })
  const quieta = () => scenaQuieta(page)
  return { cdp, giu, muovi, su, tocca, toccaEl, centroDi, trascina, schermoDi, m3, stato, mon, fermo, quieta }
}
