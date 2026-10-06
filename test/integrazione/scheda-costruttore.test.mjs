/* La scheda del robot, col dito vero: il tocco su un led apre il fumetto e
   non parte niente, fuori lo chiude, un led spento dice cosa fare prima, il
   cantiere libero dice quando si apre; il livello lasciato a metà ha il suo
   segno. Vinto un livello, la corrente corre al led dopo e il robot la
   segue, anche attraverso un chip; un tocco durante il viaggio lo chiude
   senza aprire niente. Il dito passa da CDP (docs/core/il-dito.md).
   Vedi docs/costruttore/scheda.md.
   `node test/esegui.mjs scheda-costruttore --niente-build` */
import { apriBrowser, apriGioco, azzera, semina, attendi, scegli, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { LIVELLI } from '../../src/giochi/costruttore/dati/livelli.js'
import { FILA_ATTUALE } from '../../src/giochi/costruttore/dati/campagna.js'

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
const robot = () => page.evaluate(() => ({ ...document.querySelector('[data-robot]').dataset }))
const statoDi = i => page.locator(`[data-livello="${i}"]`).getAttribute('data-stato')
const fumetto = () => page.locator('[data-fumetto]')

/* i programmi stanno in archivio, fuori dal profilo: le soluzioni del 5 e del 6 */
const scriviArchivio = dato => page.evaluate(d => new Promise((ok, ko) => {
  const r = indexedDB.open('giochi-bambini', 1)
  r.onerror = () => ko(new Error('IndexedDB non si apre'))
  r.onsuccess = () => {
    const tx = r.result.transaction('kv', 'readwrite')
    tx.objectStore('kv').put(d, 'costruttore:uno')
    tx.oncomplete = ok
    tx.onerror = () => ko(new Error('scrittura fallita'))
  }
}), dato)
const muro = LIVELLI.findIndex(l => l.chiave === 'muro-alto'), torta = LIVELLI.findIndex(l => l.chiave === 'torta')
uguale('il muro alto e la torta sono il 5 e il 6, gli ultimi del primo capitolo', [muro, torta].join(), '4,5')
await scriviArchivio({ v: 2, programmi: JSON.parse(JSON.stringify({ 'muro-alto': LIVELLI[muro].soluzione,
                                                                    torta: LIVELLI[torta].soluzione })) })
await semina(page, { settings: { eta: 10 }, campagne: { costruttore: { tappa: 4, libera: false,
  stelle: { 0: 2, 1: 2, 2: 1, 3: 2 }, cfg: { velocita: 'veloce', fila: FILA_ATTUALE } } } })

/* ══════════ 1. si apre sul robot, accanto al led da fare ══════════ */
await scegli(page, 'costruttore')
await page.waitForSelector('[data-scheda-robot] [data-livello]')
await attendi(page, 300)
const r0 = await robot()
uguale('il robot è accanto al led da fare', `${r0.al}/${r0.inViaggio}`, '4/0')
const vista = await page.locator('[data-robot]').boundingBox()
controlla('la scheda si apre sul robot', vista && vista.y > 60 && vista.y + vista.height < 844, JSON.stringify(vista))
uguale('un led solo da fare adesso', await page.locator('[data-livello][data-stato="adesso"]').getAttribute('data-livello'), '4')
uguale('i vinti sono accesi', await page.locator('[data-livello][data-stato="vinto"]').count(), 4)
uguale('lasciato a metà: il led da fare ha il suo segno', await page.locator('[data-livello="4"][data-a-meta]').count(), 1)
uguale('il segno non va su un led spento', await page.locator('[data-livello="5"][data-a-meta]').count(), 0)
uguale('il secondo capitolo è un chip spento', await page.locator('[data-capitolo="guardare"][data-acceso]').count(), 0)
await scatto(page, 'scheda-costruttore-apertura')

/* ══════════ 2. il dito apre il fumetto, e non parte niente ══════════ */
await toccaSu('[data-livello="4"]')
uguale('il tocco apre il fumetto del led', await fumetto().getAttribute('data-fumetto-per'), '4')
{
  const t = await fumetto().innerText()
  controlla('col numero, il nome e cosa si impara', /5 · Il muro alto/.test(t) && /Impari: ripeti dentro ripeti/.test(t), t)
  controlla('e dice che è lasciato a metà', /lasciato a metà/.test(t), t)
  const fb = await fumetto().boundingBox(), lb = await page.locator('[data-livello="4"]').boundingBox()
  controlla('il fumetto sta sopra il led', fb.y + fb.height <= lb.y + 4, `${JSON.stringify(fb)} ${JSON.stringify(lb)}`)
}
uguale('il click che il dito lascia dietro non apre il cantiere', await page.locator('[data-editor]').count(), 0)
await scatto(page, 'scheda-costruttore-fumetto')
await tocco(6, 480)
uguale('un tocco fuori lo chiude', await fumetto().count(), 0)

await toccaSu('[data-livello="2"]')
uguale('un vinto con la soluzione vista ha una stella su due', (await page.locator('[data-fumetto] [data-stelle]').innerText()).trim(), '⭐☆')

await toccaSu('[data-livello="9"]')
uguale('un altro led sposta il fumetto', await fumetto().getAttribute('data-fumetto-per'), '9')
{
  const t = await page.locator('[data-fumetto] [data-serve]').innerText()
  controlla('un led spento dice cosa fare prima', /prima il livello 5/.test(t), t)
  controlla('e il suo nome', /«Il tendone a strisce»/.test(await fumetto().innerText()))
  uguale('senza tasto', await page.locator('[data-fumetto] [data-azione="costruisci"]').count(), 0)
}

await toccaSu('[data-libero]')
controlla('il cantiere libero chiuso dice quando si apre', /Si apre finito il livello 6/.test(await fumetto().innerText()),
          await fumetto().innerText())
uguale('e non si entra', await page.locator('[data-fumetto] [data-azione="costruisci"]').count(), 0)

/* ══════════ 3. «▶ costruisci», si vince, la corrente corre al led dopo ══════════ */
async function vinciIl(i) {
  await toccaSu(`[data-livello="${i}"]`)
  await toccaSu(`[data-fumetto-per="${i}"] [data-azione="costruisci"]`)
  await page.waitForSelector('[data-editor]', { timeout: 5000 })
  await page.click('[data-azione="via"]')
  await page.waitForSelector('[data-fine="livello"]', { timeout: 20000 })
  await attendi(page, 400)
  await page.click('[data-azione="resta"]')
  await page.click('button[aria-label="indietro"]')
  await page.waitForSelector('[data-scheda-robot] [data-livello]')
}
await vinciIl(4)
uguale('tornati alla scheda il robot parte da dov\'era', (await robot()).al, '4')
await page.waitForSelector('[data-robot][data-in-viaggio="1"]')
const prima = await page.locator('[data-robot]').getAttribute('transform')
await attendi(page, 1200)      // ferma un attimo, poi la scintilla, e il robot dietro
controlla('e si muove lungo la pista', prima !== await page.locator('[data-robot]').getAttribute('transform'))
await page.waitForSelector('[data-robot][data-in-viaggio="0"]', { timeout: 5000 })
uguale('e arriva accanto al led dopo', (await robot()).al, '5')
uguale('che è quello da fare', await statoDi(5), 'adesso')
uguale('il vinto è acceso', await statoDi(4), 'vinto')
uguale('vinto, non è più a metà', await page.locator('[data-livello="4"][data-a-meta]').count(), 0)
uguale('e adesso il programma a metà è quello del 6', await page.locator('[data-livello="5"][data-a-meta]').count(), 1)
await scatto(page, 'scheda-costruttore-arrivato')

/* ══════════ 4. attraverso un chip, e un tocco chiude il viaggio ══════════ */
await vinciIl(5)
await page.waitForSelector('[data-robot][data-in-viaggio="1"]')
await tocco(200, 500)
const chiuso = await robot()
uguale('il tocco fa arrivare il robot subito, oltre il chip', `${chiuso.al}/${chiuso.inViaggio}/${chiuso.visibile}`, '6/0/1')
uguale('senza aprire un fumetto', await fumetto().count(), 0)
uguale('e senza entrare in un cantiere', await page.locator('[data-editor]').count(), 0)
uguale('la corrente ha acceso il chip del secondo capitolo', await page.locator('[data-capitolo="guardare"][data-acceso]').count(), 1)
uguale('e il cantiere libero si è aperto', await page.locator('[data-libero][data-stato="aperto"]').count(), 1)

/* tornare senza un livello nuovo non fa viaggiare nessuno */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carte')
await scegli(page, 'costruttore')
await page.waitForSelector('[data-scheda-robot] [data-livello]')
await attendi(page, 700)
uguale('senza livelli nuovi il robot resta dov\'era', `${(await robot()).al}/${(await robot()).inViaggio}`, '6/0')

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('costruttore — la scheda del robot, col dito')
