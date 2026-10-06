/* La mappa delle isole di Passo passo, col dito vero: il tocco su una
   casella apre il fumetto subito e non parte niente, trascinare scorre e
   basta, fuori si chiude; una chiusa dice cosa manca e non fa partire
   niente; il segnalino salta fino alla casella toccata mentre il fumetto
   è già lì, un altro tocco cambia fumetto e meta, e «gioca» parte anche a
   viaggio in corso; «gioca» comincia, e il ▶ a
   fine partita resta sulla strada maestra; al bivio si va sull'isola del
   cane e il segnalino diventa il cane (e torna coniglio); la strada del
   coniglio va avanti senza fare il cane. Il dito passa da CDP
   (docs/core/il-dito.md). Vedi docs/passo-passo/mappa.md.
   `DIST=… node test/esegui.mjs passo-passo-mappa --niente-build` */
import { apriBrowser, apriGioco, azzera, semina, attendi, scegli, scatto, statoSullIsola, leggiProfilo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA, TAPPE_PRIME, TAPPE_PICCOLE, FILA_ATTUALE } from '../../src/giochi/passo-passo/dati/campagna.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { risolvi } from '../../src/giochi/passo-passo/motore/risolutore.js'

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
const centro = async sel => {
  const nodo = page.locator(sel).first()
  await nodo.scrollIntoViewIfNeeded()
  const b = await nodo.boundingBox()
  return [Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2)]
}
const toccaSu = async sel => { const [x, y] = await centro(sel); await tocco(x, y) }
// un tocco che non aspetta: chi guarda il viaggio lo guarda mentre dura
const toccoVivo = async sel => {
  const [x, y] = await centro(sel)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 40)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
// dove sta il fumetto sulla mappa (non sullo schermo: lo scorrimento non c'entra)
const postoFumetto = () => page.evaluate(() => {
  const f = document.querySelector('[data-fumetto]')
  return f ? `${f.style.left}/${f.style.top}` : null
})
const casella = i => `[data-mappa] [data-tappa="${i}"]`
const segnalino = () => page.evaluate(() => ({ ...document.querySelector('[data-segnalino]').dataset }))
const fermo = () => page.waitForSelector('[data-segnalino][data-in-viaggio="0"]', { timeout: 8000 })
const fumettoPer = async () => (await page.locator('[data-fumetto]').count()
  ? page.locator('[data-fumetto]').getAttribute('data-fumetto-per') : null)
const inGioco = async () => (await page.locator('.pp-campo').count()) > 0
// gli animali che il segnalino è stato, dal tocco in poi
const spia = () => page.evaluate(() => {
  const s = document.querySelector('[data-segnalino]')
  window.__animali = [s.dataset.animale]
  window.__spia?.disconnect()
  window.__spia = new MutationObserver(() => {
    if (window.__animali.at(-1) !== s.dataset.animale) window.__animali.push(s.dataset.animale)
  })
  window.__spia.observe(s, { attributes: true, attributeFilter: ['data-animale'] })
})
const animali = () => page.evaluate(() => window.__animali.join(' '))
// un punto della mappa dove non c'è niente da toccare: il mare o la terra di un'isola
const vuoto = () => page.evaluate(() => {
  for (let y = 780; y > 150; y -= 23)
    for (let x = 12; x < 380; x += 17) {
      const e = document.elementFromPoint(x, y)
      if (e && e.closest('[data-isole]') && !e.closest('button, [data-fumetto], [data-bivio], [data-insegna]')) return [x, y]
    }
  return null
})
const toccaFuori = async () => { const [x, y] = await vuoto(); await tocco(x, y) }
const stelleFino = n => Object.fromEntries([...Array(n)].map((_, i) => [i, 3]))
const TUTTO = CAMPAGNA.findIndex(t => t.chiave === 'tutto')
const STALLE = CAMPAGNA.findIndex(t => t.chiave === 'stalle')

/* ══════════ 1. si apre sulla casella di adesso, col coniglio ══════════ */
await semina(page, { settings: { eta: 8 },
                     campagne: { passo: { tappa: TUTTO, stelle: stelleFino(TUTTO), cfg: { fila: FILA_ATTUALE, ultima: TUTTO - 1 } } } })
await scegli(page, 'passo')
await page.waitForSelector('[data-mappa] [data-tappa]')
await fermo()
const s0 = await segnalino()
uguale('il segnalino sta sulla tappa di adesso', s0.al, String(TUTTO))
uguale('ed è il coniglio', s0.animale, 'coniglio')
uguale('una sola casella è quella di adesso', await page.locator('[data-mappa] [data-stato="ora"]').count(), 1)
{
  const b = await page.locator('[data-segnalino]').boundingBox()
  controlla('la mappa si apre sul segnalino', b && b.y > 0 && b.y + b.height < 844, JSON.stringify(b))
}
await scatto(page, 'passo-mappa-apertura')

/* ══════════ 2. il dito apre il fumetto, e non parte niente ══════════ */
await toccaSu(casella(TUTTO))
uguale('il tocco apre il fumetto della casella', await fumettoPer(), String(TUTTO))
{
  const testo = await page.locator('[data-fumetto]').innerText()
  controlla('col nome, il racconto e il tasto', testo.includes(CAMPAGNA[TUTTO].nome) &&
            testo.includes(CAMPAGNA[TUTTO].racconto.slice(0, 20)) &&
            await page.locator('[data-fumetto] [data-azione="parti"]').count() === 1, testo)
  uguale('quattro stelle da prendere', await page.locator('[data-fumetto] .pp-fumetto-stelle svg').count(), 4)
}
controlla('il click che il dito lascia dietro non fa partire la tappa', !(await inGioco()))
await scatto(page, 'passo-mappa-fumetto')
await toccaFuori()
uguale('un tocco fuori lo chiude', await page.locator('[data-fumetto]').count(), 0)

/* trascinare scorre la mappa e basta */
{
  const [x, y] = await centro(casella(TUTTO - 1))
  const prima = await page.evaluate(() => document.querySelector('[data-isole]').scrollTop)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  for (let k = 1; k <= 6; k++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - k * 12 }] })
    await attendi(page, 16)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await attendi(page, 400)
  uguale('trascinare su una casella non apre il fumetto', await page.locator('[data-fumetto]').count(), 0)
  uguale('né muove il segnalino', (await segnalino()).al, String(TUTTO))
  controlla('ma scorre la mappa', await page.evaluate(() => document.querySelector('[data-isole]').scrollTop) !== prima)
}

/* ══════════ 3. una chiusa dice cosa manca, e non parte ══════════ */
await toccaSu(casella(TAPPE_PRIME))
{
  const serve = await page.locator('[data-fumetto] [data-serve]').innerText()
  controlla('il primo gregge chiuso: si apre quando il coniglio finisce le buche', /finisce «Le buche»/.test(serve), serve)
  uguale('e non si parte', await page.locator('[data-fumetto] [data-azione="parti"]').count(), 0)
  uguale('il segnalino non ci va', (await segnalino()).al, String(TUTTO))
}
await toccaSu(casella(STALLE))
{
  const serve = await page.locator('[data-fumetto] [data-serve]').innerText()
  controlla('le stalle aspettano il coniglio che impara 🔁', /impara 🔁/.test(serve), serve)
  controlla('su un\'isola del cane ancora velata',
            await page.locator('[data-isola="ripeti-cane"][data-velata="1"][data-animale="cane"]').count() === 1)
  await scatto(page, 'passo-mappa-cane-chiusa')
}
await toccaFuori()

/* ══════════ 4. il fumetto è subito sulla meta, e il segnalino ci va ══════════ */
await toccoVivo(casella(TUTTO - 4))
uguale('il fumetto della meta c\'è subito', await fumettoPer(), String(TUTTO - 4))
{
  const s = await segnalino()
  uguale('mentre il segnalino sta ancora saltando', s.inViaggio, '1')
  controlla('e non è ancora arrivato', s.al !== String(TUTTO - 4), s.al)
  const posto = await postoFumetto()
  const prima = await page.locator('[data-segnalino]').evaluate(e => e.style.transform)
  await attendi(page, 120)
  await scatto(page, 'passo-mappa-salto')
  const durante = await page.locator('[data-segnalino]').evaluate(e => e.style.transform)
  controlla('il coniglio salta', prima !== durante, `${prima} → ${durante}`)
  uguale('il fumetto resta fermo dov\'è', await postoFumetto(), posto)
  controlla('e sta sopra il segnalino, mai dietro', await page.evaluate(() => {
    const z = sel => Number(getComputedStyle(document.querySelector(sel)).zIndex)
    return z('[data-fumetto]') > z('[data-segnalino]')
  }))
  controlla('si può già premere «gioca»', await page.locator('[data-fumetto] [data-azione="parti"]').count() === 1)
}

/* un altro tocco durante il viaggio: il fumetto passa subito alla nuova tappa e
   il segnalino cambia meta da dove si trova */
await toccoVivo(casella(TUTTO - 6))
uguale('un tocco durante il salto cambia il fumetto subito', await fumettoPer(), String(TUTTO - 6))
uguale('e il segnalino sta ancora viaggiando', (await segnalino()).inViaggio, '1')
await fermo()
uguale('arriva alla nuova meta, non alla prima', (await segnalino()).al, String(TUTTO - 6))
uguale('il fumetto è ancora quello della meta', await fumettoPer(), String(TUTTO - 6))

/* un tocco fuori chiude il fumetto, ma il viaggio finisce */
await toccoVivo(casella(TUTTO - 2))
uguale('di nuovo il fumetto subito', await fumettoPer(), String(TUTTO - 2))
{
  const [x, y] = await vuoto()
  await tocco(x, y)
  uguale('un tocco fuori chiude il fumetto', await page.locator('[data-fumetto]').count(), 0)
}
await fermo()
uguale('e il segnalino arriva lo stesso', (await segnalino()).al, String(TUTTO - 2))
uguale('senza riaprire il fumetto', await page.locator('[data-fumetto]').count(), 0)

/* una chiusa: il fumetto subito, e il segnalino non si muove */
await toccoVivo(casella(TAPPE_PRIME))
controlla('una chiusa dà il suo fumetto subito', (await page.locator('[data-fumetto] [data-serve]').count()) === 1)
await attendi(page, 300)
uguale('e il segnalino non parte', (await segnalino()).inViaggio, '0')
uguale('resta dov\'era', (await segnalino()).al, String(TUTTO - 2))
await toccaFuori()

/* ══════════ 5. «gioca» comincia; vinta, il ▶ resta sulla strada maestra ══════════ */
// il segnalino è lontano e sta ancora saltando: «gioca» parte lo stesso
await toccoVivo(casella(TUTTO))
{
  const s = await segnalino()
  uguale('il segnalino è in viaggio', s.inViaggio, '1')
  await page.evaluate(() => document.querySelector('[data-fumetto] [data-azione="parti"]').click())
}
await page.waitForSelector('.pp-campo', { timeout: 5000 })
controlla('«gioca» comincia la tappa', (await page.locator('.barra-app .dove').innerText()).includes(CAMPAGNA[TUTTO].nome))
await attendi(page, 450)
{
  const tasto = m => m.startsWith('salto-') ? `[data-salto="${m.slice(6)}"]` : `[data-freccia="${m}"]`
  for (const m of risolvi(Livello.da(CAMPAGNA[TUTTO]))) { await page.locator(tasto(m)).click(); await attendi(page, 50) }
  await page.locator('[data-azione="via"]').click()
  await page.waitForSelector('[data-fine="tappa"]', { timeout: 20000 })
  await attendi(page, 600)
  await page.evaluate(() => document.querySelectorAll('.velo').forEach(v => v.querySelector('.occhiello') && v.click()))
  await page.locator('[data-azione="avanti"]').click()
  await page.waitForSelector('.pp-campo')
  const titolo = await page.locator('.barra-app .dove').innerText()
  controlla('finite le buche, ▶ va avanti sulla strada del coniglio: il viale', titolo.includes(CAMPAGNA[TAPPE_PICCOLE].nome), titolo)
}
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('[data-mappa]')
await fermo()
{
  const s = await segnalino()
  uguale('tornati alla mappa il coniglio è sul viale', `${s.al}/${s.animale}`, `${TAPPE_PICCOLE}/coniglio`)
  uguale('il viale è la tappa di adesso', await statoSullIsola(page, TAPPE_PICCOLE), 'ora')
  uguale('e il primo gregge è aperto', await statoSullIsola(page, TAPPE_PRIME), 'aperta')
  const p = ((await leggiProfilo(page)).campagne || {}).passo || {}
  uguale('il profilo si ricorda l\'ultima tappa giocata', p.cfg && p.cfg.ultima, TAPPE_PICCOLE)
}

/* ══════════ 6. al bivio: la tana, e il segnalino diventa il cane ══════════ */
controlla('il bivio si vede, col cartello a due frecce',
          await page.locator('[data-bivio][data-ramo="pecore-cane"] [data-verso="coniglio"]').count() === 1 &&
          await page.locator('[data-bivio][data-ramo="pecore-cane"] [data-verso="cane"]').count() === 1)
await page.locator('[data-bivio][data-ramo="pecore-cane"]').scrollIntoViewIfNeeded()
await attendi(page, 200)
await scatto(page, 'passo-mappa-bivio')
await spia()
{
  const [x, y] = await centro(casella(TAPPE_PRIME))
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
// il coniglio che sparisce nella tana, poi il cane che sbuca dall'altra
await page.waitForFunction(() => {
  const s = document.querySelector('[data-segnalino]')
  return s.dataset.animale === 'coniglio' && Number(s.style.opacity || 1) < 0.7
}, null, { timeout: 6000 })
await scatto(page, 'passo-mappa-tana-entra')
await page.waitForFunction(() => {
  const s = document.querySelector('[data-segnalino]')
  return s.dataset.animale === 'cane' && Number(s.style.opacity || 1) < 0.95
}, null, { timeout: 6000 })
await scatto(page, 'passo-mappa-tana-esce')
await fermo()
await attendi(page, 300)
{
  const s = await segnalino()
  uguale('sull\'isola del cane il segnalino è il cane', `${s.al}/${s.animale}`, `${TAPPE_PRIME}/cane`)
  uguale('passando dalla tana: prima coniglio, poi cane', await animali(), 'coniglio cane')
  uguale('e si apre il fumetto del primo gregge', await fumettoPer(), String(TAPPE_PRIME))
  controlla('che si può giocare', await page.locator('[data-fumetto] [data-azione="parti"]').count() === 1)
}
await scatto(page, 'passo-mappa-isola-cane')
await toccaFuori()

/* e torna coniglio, sulla strada maestra */
await spia()
await toccaSu(casella(TAPPE_PICCOLE))
await fermo()
{
  const s = await segnalino()
  uguale('tornando sulla strada maestra torna il coniglio', `${s.al}/${s.animale}`, `${TAPPE_PICCOLE}/coniglio`)
  uguale('passando dalla stessa tana', await animali(), 'cane coniglio')
}

/* ══════════ 7. la strada del coniglio va avanti senza il cane ══════════ */
await page.locator('button[aria-label="indietro"]').click()
await semina(page, { settings: { eta: 8 }, campagne: { passo: {
  tappa: TAPPE_PICCOLE + 1, stelle: { ...stelleFino(TAPPE_PRIME), [TAPPE_PICCOLE]: 3 },
  cfg: { fila: FILA_ATTUALE, eredita: TAPPE_PRIME, ultima: TAPPE_PICCOLE } } } })
await scegli(page, 'passo')
await page.waitForSelector('[data-mappa] [data-tappa]')
await fermo()
{
  const dopo = STALLE + 1
  const s = await segnalino()
  uguale('fatto il viale senza il cane, il coniglio è alla tappa dopo', `${s.al}/${s.animale}`, `${dopo}/coniglio`)
  uguale('che è quella di adesso', await statoSullIsola(page, dopo), 'ora')
  uguale('le stalle restano chiuse', await statoSullIsola(page, STALLE), 'chiusa')
  await toccaSu(casella(STALLE))
  const serve = await page.locator('[data-fumetto] [data-serve]').innerText()
  controlla('e dicono di finire prima il pascolo', /Prima tocca a «Il primo gregge»/.test(serve), serve)
  uguale('il primo gregge aspetta, aperto', await statoSullIsola(page, TAPPE_PRIME), 'aperta')
  controlla('l\'isola del pascolo non è velata',
            await page.locator('[data-isola="pecore-cane"][data-velata="0"]').count() === 1)
  controlla('quelle più avanti sì', await page.locator('[data-isola="fino"][data-velata="1"]').count() === 1)
  await page.locator('[data-isola="fino"]').scrollIntoViewIfNeeded()
  await attendi(page, 200)
  await scatto(page, 'passo-mappa-velata')
}

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('passo passo — la mappa delle isole, col dito')
