/* La rotta degli asteroidi, col dito vero: il tocco su una tappa apre il
   fumetto e non parte niente, fuori lo chiude, una tappa chiusa dice cosa
   fare prima, «▶ parti» comincia. Vinta una tappa il razzo vola alla nuova
   e resta girato com'è arrivato; un tocco durante quel volo lo chiude senza
   aprire niente. Toccando una tappa aperta il razzo ci va mentre il fumetto
   è già aperto, un altro tocco cambia meta, una chiusa non lo muove; le
   tappe superate hanno la loro stella, le chiuse no.
   Il dito passa da CDP (docs/core/il-dito.md).
   Vedi docs/asteroidi/mappa.md.
   `node test/esegui.mjs rotta-asteroidi --niente-build` */
import { apriBrowser, apriGioco, azzera, semina, attendi, scegli, scatto } from '../aiuto/browser.mjs'
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
uguale('una sola stella sulla rotta, della tappa 0, piena e di una',
       (await page.locator('[data-stelle-tappa]').evaluateAll(l => l.map(e => `${e.dataset.tappaDi}:${e.dataset.piene}/${e.dataset.di}`))).join(), '0:1/1')
await scatto(page, 'rotta-asteroidi-arrivato')

/* toccata la tappa superata, il razzo ci va; da lì si rifà, e tornando resta dov'era */
await toccaSu('[data-rotta] [data-tappa="0"]')
uguale('il fumetto si apre subito', await page.locator('[data-fumetto]').getAttribute('data-fumetto-per'), '0')
uguale('e il razzo parte', (await razzo()).inViaggio, '1')
await page.waitForSelector('[data-razzo][data-in-viaggio="0"]', { timeout: 5000 })
const aZero = await razzo()
uguale('arriva alla tappa toccata', aZero.al, '0')
uguale('col fumetto ancora aperto', await page.locator('[data-fumetto]').getAttribute('data-fumetto-per'), '0')
await toccaSu('[data-fumetto] [data-azione="parti"]')
uguale('anche una tappa superata si rifà', await fase(), 'gioco')
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('[data-rotta]')
await attendi(page, 700)
const fermo = await razzo()
uguale('senza tappe nuove il razzo resta dov\'era', `${fermo.al}/${fermo.inViaggio}`, '0/0')
uguale('girato com\'era arrivato', fermo.verso, aZero.verso)

/* ══════════ 4. un tocco durante il volo dopo una vittoria lo chiude, e non apre niente ══════════ */
await toccaSu('[data-rotta] [data-stato="ora"]')
await toccaSu('[data-fumetto] [data-azione="parti"]')
await vinci()
await page.waitForSelector('[data-razzo][data-in-viaggio="1"]')
await tocco(200, 420)
const chiuso = await razzo()
uguale('il tocco fa arrivare il razzo subito', `${chiuso.al}/${chiuso.inViaggio}`, '2/0')
uguale('senza aprire un fumetto', await page.locator('[data-fumetto]').count(), 0)
uguale('e senza partire', await fase(), 'mappa')

/* ══════════ 5. molte tappe fatte: il razzo va dove si tocca ══════════ */
await semina(page, { mate: { tappa: 0, fila: 8, libera: false }, settings: { eta: 10 } })
await scegli(page, 'mate')
await page.waitForSelector('[data-rotta] [data-tappa]')
await attendi(page, 400)
uguale('a otto tappe fatte il razzo è alla nona', (await razzo()).al, '8')
uguale('le stelle: una per ogni tappa fatta, e nessuna sulle altre',
       (await page.locator('[data-stelle-tappa]').evaluateAll(l => l.map(e => e.dataset.tappaDi))).join(), '0,1,2,3,4,5,6,7')
uguale('ognuna è piena e di una', await page.locator('[data-stelle-tappa][data-piene="1"][data-di="1"]').count(), 8)
uguale('le chiuse non hanno stelle', await page.locator('[data-stelle-tappa][data-tappa-di="12"]').count(), 0)
{
  // la stella sta fuori dal nome e dal razzo
  const guasti = await page.evaluate(() => {
    const dentro = (a, b, m) => a.left < b.right + m && a.right > b.left - m && a.top < b.bottom + m && a.bottom > b.top - m
    const cose = [...document.querySelectorAll('[data-rotta] .nome, [data-razzo]')].map(e => ({ nome: e.textContent.trim() || 'razzo', r: e.getBoundingClientRect() }))
    const out = []
    for (const e of document.querySelectorAll('[data-stelle-tappa]')) {
      const r = e.getBoundingClientRect()
      if (r.left < 0 || r.right > innerWidth) out.push(`stella ${e.dataset.tappaDi} fuori dallo schermo`)
      for (const c of cose) if (c.nome !== 'razzo' && dentro(r, c.r, 0)) out.push(`stella ${e.dataset.tappaDi} sul nome ${c.nome}`)
    }
    return out
  })
  uguale('le stelle non coprono i nomi', guasti.join(' · '), '')
}

await toccaSu('[data-rotta] [data-tappa="3"]')
uguale('toccata una tappa aperta lontana, il fumetto è già aperto', await page.locator('[data-fumetto]').getAttribute('data-fumetto-per'), '3')
uguale('il razzo è in viaggio', (await razzo()).inViaggio, '1')
uguale('senza il velo dopo-vittoria: la mappa risponde', await page.locator('[data-viaggio]').count(), 0)
const f1 = await page.locator('[data-fumetto]').boundingBox()
const r1 = await page.locator('[data-razzo]').evaluate(e => e.style.transform)
await attendi(page, 500)
const f2 = await page.locator('[data-fumetto]').boundingBox()
const r2 = await page.locator('[data-razzo]').evaluate(e => e.style.transform)
controlla('il razzo si muove', r1 !== r2, `${r1} → ${r2}`)
controlla('e il fumetto sta fermo', Math.abs(f1.x - f2.x) < 1 && Math.abs(f1.y - f2.y) < 1, `${JSON.stringify(f1)} ${JSON.stringify(f2)}`)
await scatto(page, 'rotta-asteroidi-meta-viaggio')

// un altro tocco, in viaggio: cambia meta, e il fumetto lo segue
await toccaSu('[data-rotta] [data-tappa="5"]')
uguale('un altro tocco sposta il fumetto', await page.locator('[data-fumetto]').getAttribute('data-fumetto-per'), '5')
uguale('e il razzo è ancora in viaggio', (await razzo()).inViaggio, '1')
await page.waitForSelector('[data-razzo][data-in-viaggio="0"]', { timeout: 6000 })
uguale('arriva alla nuova meta, non alla prima', (await razzo()).al, '5')

// una tappa chiusa apre il fumetto e non muove il razzo
await toccaSu('[data-rotta] [data-tappa][data-stato="chiusa"]')
controlla('una chiusa dice cosa fare prima', /Prima tocca a/.test(await page.locator('[data-fumetto] [data-serve]').innerText()))
await attendi(page, 500)
const dopoChiusa = await razzo()
uguale('il razzo non si muove', `${dopoChiusa.al}/${dopoChiusa.inViaggio}`, '5/0')

// e un tocco fuori, mentre il razzo viaggia, non chiude il fumetto
await toccaSu('[data-rotta] [data-tappa="7"]')
await tocco(8, 420)
uguale('un tocco fuori durante il viaggio non chiude il fumetto', await page.locator('[data-fumetto]').getAttribute('data-fumetto-per'), '7')
await page.waitForSelector('[data-razzo][data-in-viaggio="0"]', { timeout: 6000 })
uguale('il razzo arriva comunque', (await razzo()).al, '7')
await tocco(8, 420)
uguale('fermo, un tocco fuori lo chiude', await page.locator('[data-fumetto]').count(), 0)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('asteroidi — la rotta, col dito')
