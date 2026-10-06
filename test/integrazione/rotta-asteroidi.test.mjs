/* La rotta degli asteroidi, col dito vero: il tocco su una tappa apre il
   fumetto e non parte niente, fuori lo chiude, una tappa chiusa dice cosa
   fare prima, «▶ parti» comincia. Vinta una tappa il razzo vola alla nuova
   e resta girato com'è arrivato; un tocco durante il volo lo chiude senza
   aprire niente. Il dito passa da CDP (docs/core/il-dito.md).
   Vedi docs/asteroidi/mappa.md.
   `node test/esegui.mjs rotta-asteroidi --niente-build` */
import { apriBrowser, apriGioco, azzera, attendi, scegli, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const cdp = await page.context().newCDPSession(page)
await azzera(page)

const tocco = async (x, y) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await attendi(page, 350)
}
const toccaSu = async sel => {
  const nodo = page.locator(sel).first()
  await nodo.scrollIntoViewIfNeeded()
  const b = await nodo.boundingBox()
  await tocco(Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2))
}
const fase = () => page.evaluate(() => window.__mate.fase.value)
const razzo = () => page.evaluate(() => ({ ...document.querySelector('[data-razzo]').dataset }))
// i cartelli dei traguardi coprono tutto per tre secondi: qui si tolgono
const viaLeFeste = () => page.evaluate(() =>
  document.querySelectorAll('.velo').forEach(v => v.querySelector('.occhiello') && v.click()))
// si vince la tappa in corso colpendo sempre il sasso giusto
async function vinci() {
  await page.evaluate(async () => {
    const m = window.__mate
    for (let i = 0; i < 300 && m.fase.value === 'gioco'; i++) {
      const g = m.asteroidi().find(x => x.ok && !x.morto)
      if (g) m.colpisci(g)
      await new Promise(r => setTimeout(r, 12))
    }
  })
  uguale('la tappa è vinta', await fase(), 'vinta')
  await viaLeFeste()
  await page.click('.velo .bottone.chiaro')            // Mappa
  await page.waitForSelector('[data-rotta]')
}

/* ══════════ 1. si apre, il razzo è alla prima tappa e si vede ══════════ */
await scegli(page, 'mate')
await page.waitForSelector('[data-rotta] [data-tappa]')
await attendi(page, 300)
const r0 = await razzo()
uguale('il razzo è accanto alla prima tappa', r0.al, '0')
uguale('e sta fermo', r0.inViaggio, '0')
const vista = await page.locator('[data-razzo]').boundingBox()
controlla('la mappa si apre sul razzo', vista && vista.y > 0 && vista.y + vista.height < 844, JSON.stringify(vista))
uguale('una tappa sola da fare adesso', await page.locator('[data-rotta] [data-stato="ora"]').count(), 1)
await scatto(page, 'rotta-asteroidi-apertura')

/* ══════════ 2. il dito apre il fumetto, e non parte niente ══════════ */
await toccaSu('[data-rotta] [data-stato="ora"]')
uguale('il tocco apre il fumetto della tappa', await page.locator('[data-fumetto]').getAttribute('data-fumetto-per'), '0')
const testo = await page.locator('[data-fumetto]').innerText()
controlla('col nome, cosa chiede e lo stato', /Fino al dieci/.test(testo) && /centri/.test(testo) &&
          /Tocca a te/.test(testo), testo)
uguale('il click che il dito lascia dietro non fa partire la tappa', await fase(), 'mappa')
await scatto(page, 'rotta-asteroidi-fumetto')
await tocco(8, 420)
uguale('un tocco fuori lo chiude', await page.locator('[data-fumetto]').count(), 0)

/* una tappa chiusa: il fumetto dice cosa fare prima, e non ha il tasto */
await toccaSu('[data-rotta] [data-tappa][data-stato="chiusa"]')
const chiusa = await page.locator('[data-fumetto] [data-serve]').innerText()
controlla('una tappa chiusa dice cosa fare prima', /Prima tocca a «Fino al dieci»/.test(chiusa), chiusa)
uguale('e non si parte', await page.locator('[data-fumetto] [data-azione="parti"]').count(), 0)

/* ══════════ 3. «▶ parti», si vince, il razzo vola alla tappa nuova ══════════ */
await toccaSu('[data-rotta] [data-stato="ora"]')
await toccaSu('[data-fumetto] [data-azione="parti"]')
uguale('«▶ parti» comincia la tappa', await fase(), 'gioco')
await vinci()
const partenza = await razzo()
uguale('tornati alla mappa il razzo parte da dov\'era', partenza.al, '0')
await page.waitForSelector('[data-razzo][data-in-viaggio="1"]')
const prima = await page.locator('[data-razzo]').evaluate(e => e.style.transform)
await attendi(page, 900)
const durante = await page.locator('[data-razzo]').evaluate(e => e.style.transform)
controlla('e si muove', prima !== durante, `${prima} → ${durante}`)
await page.waitForSelector('[data-razzo][data-in-viaggio="0"]', { timeout: 5000 })
const arrivato = await razzo()
uguale('e arriva alla tappa nuova', arrivato.al, '1')
uguale('che è quella da fare', await page.locator('[data-rotta] [data-stato="ora"]').getAttribute('data-tappa'), '1')
uguale('la vinta ha la sua stella', await page.locator('[data-rotta] [data-tappa="0"]').getAttribute('data-stato'), 'fatta')
await scatto(page, 'rotta-asteroidi-arrivato')

/* tornare alla mappa senza una tappa nuova non lo fa volare, né lo rigira */
await toccaSu('[data-rotta] [data-tappa="0"]')
await toccaSu('[data-fumetto] [data-azione="parti"]')
uguale('anche una tappa superata si rifà', await fase(), 'gioco')
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('[data-rotta]')
await attendi(page, 700)
const fermo = await razzo()
uguale('senza tappe nuove il razzo resta dov\'era', `${fermo.al}/${fermo.inViaggio}`, '1/0')
uguale('girato com\'era arrivato', fermo.verso, arrivato.verso)

/* ══════════ 4. un tocco durante il volo lo chiude, e non apre niente ══════════ */
await toccaSu('[data-rotta] [data-stato="ora"]')
await toccaSu('[data-fumetto] [data-azione="parti"]')
await vinci()
await page.waitForSelector('[data-razzo][data-in-viaggio="1"]')
await tocco(200, 420)
const chiuso = await razzo()
uguale('il tocco fa arrivare il razzo subito', `${chiuso.al}/${chiuso.inViaggio}`, '2/0')
uguale('senza aprire un fumetto', await page.locator('[data-fumetto]').count(), 0)
uguale('e senza partire', await fase(), 'mappa')

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('asteroidi — la rotta, col dito')
