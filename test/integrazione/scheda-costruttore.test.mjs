/* La scheda del robot, col dito vero: il tocco su un led apre il fumetto e
   non parte niente, fuori lo chiude, un led spento dice cosa fare prima, il
   cantiere libero dice quando si apre; il livello lasciato a metà ha il suo
   segno; i livelli vinti hanno le loro stelline, i altri no. Toccato un led
   aperto il robot ci va (avanti o indietro) col fumetto già aperto, un altro
   tocco cambia meta, un led spento non lo muove. Vinto un livello, la
   corrente corre al led dopo e il robot la segue, anche attraverso un chip;
   un tocco durante quel viaggio lo chiude senza aprire niente. Il dito passa
   da CDP (docs/core/il-dito.md).
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

/* le stelline: sui vinti, con le stelle prese; sugli altri niente */
uguale('le stelline stanno sui quattro vinti, e solo lì',
       (await page.locator('[data-stelle-tappa]').evaluateAll(l => l.map(e => e.dataset.stelleTappa))).join(), '0,1,2,3')
uguale('con le stelle prese: 2, 2, 1, 2',
       (await page.locator('[data-stelle-tappa]').evaluateAll(l => l.map(e => `${e.dataset.piene}/${e.dataset.di}`))).join(), '2/2,2/2,1/2,2/2')
uguale('piene e vuote si vedono: tre piene e una vuota in tutto, sulle stelline del 3',
       await page.locator('[data-stelle-tappa="2"] .cst-stella-piena, [data-stelle-tappa="2"] .cst-stella-vuota').evaluateAll(l => l.map(e => e.getAttribute('class').includes('piena') ? 'P' : 'v').join('')), 'Pv')
{
  const guasti = await page.evaluate(() => {
    const dentro = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
    const out = []
    const robot = document.querySelector('[data-robot]').getBoundingClientRect()
    const stelle = [...document.querySelectorAll('[data-stelle-tappa]')].map(e => ({ i: e.dataset.stelleTappa, r: e.getBoundingClientRect() }))
    const led = [...document.querySelectorAll('[data-livello]')].map(e => ({ i: e.dataset.livello, r: e.getBoundingClientRect() }))
    for (const a of stelle) {
      if (a.r.width < 10 || a.r.left < 0 || a.r.right > innerWidth) out.push(`le stelline del ${a.i} sono fuori o troppo piccole`)
      if (dentro(a.r, robot)) out.push(`le stelline del ${a.i} sono sul robot`)
      for (const l of led) if (dentro(a.r, l.r)) out.push(`le stelline del ${a.i} sono sul tasto del led ${l.i}`)
      for (const b of stelle) if (a.i < b.i && dentro(a.r, b.r)) out.push(`le stelline del ${a.i} e del ${b.i} si toccano`)
    }
    return out
  })
  uguale('le stelline non coprono né il robot né i led', guasti.join(' · '), '')
}
await scatto(page, 'scheda-costruttore-stelline')

/* ══════════ 2b. toccato un led aperto il robot ci va, col fumetto già aperto ══════════ */
uguale('prima del tocco il robot sta accanto al led 5', (await robot()).al, '4')
await toccaSu('[data-livello="0"]')
uguale('il fumetto è già aperto sul led toccato', await fumetto().getAttribute('data-fumetto-per'), '0')
uguale('e il robot è in viaggio', (await robot()).inViaggio, '1')
uguale('senza il velo del viaggio dopo una vittoria', await page.locator('[data-viaggio]').count(), 0)
uguale('mentre viaggia il robot è ancora «al» led da cui è partito', (await robot()).al, '4')
const fu1 = await fumetto().boundingBox()
const ro1 = await page.locator('[data-robot]').getAttribute('transform')
await attendi(page, 500)
const fu2 = await fumetto().boundingBox()
controlla('il robot si muove', ro1 !== await page.locator('[data-robot]').getAttribute('transform'))
controlla('e il fumetto sta fermo', Math.abs(fu1.x - fu2.x) < 1 && Math.abs(fu1.y - fu2.y) < 1, `${JSON.stringify(fu1)} ${JSON.stringify(fu2)}`)
uguale('il rame resta com\'era: i led vinti restano accesi mentre il robot viaggia', await page.locator('[data-livello][data-stato="vinto"]').count(), 4)
uguale('e il led da fare resta da fare', await statoDi(4), 'adesso')
await scatto(page, 'scheda-costruttore-meta-viaggio')

// un tocco in viaggio cambia meta, anche tornando indietro: il robot riparte da dov'è
await toccaSu('[data-livello="3"]')
uguale('il fumetto segue l\'ultimo tocco', await fumetto().getAttribute('data-fumetto-per'), '3')
uguale('e il robot viaggia ancora', (await robot()).inViaggio, '1')
await page.waitForSelector('[data-robot][data-in-viaggio="0"]', { timeout: 6000 })
const rEnd = await robot()
uguale('arriva al nuovo led, non al primo', `${rEnd.al}/${rEnd.visibile}`, '3/1')
uguale('e il fumetto è ancora lì', await fumetto().getAttribute('data-fumetto-per'), '3')

// un tocco fuori, durante il viaggio, non chiude il fumetto
await toccaSu('[data-livello="2"]')
await tocco(6, 480)
uguale('un tocco fuori durante il viaggio non chiude il fumetto', await fumetto().getAttribute('data-fumetto-per'), '2')
await page.waitForSelector('[data-robot][data-in-viaggio="0"]', { timeout: 6000 })
uguale('il robot arriva comunque', (await robot()).al, '2')
uguale('un vinto con la soluzione vista ha una stella su due', (await page.locator('[data-fumetto] [data-stelle]').innerText()).trim(), '⭐☆')
await tocco(6, 480)
uguale('fermo, il tocco fuori lo chiude', await fumetto().count(), 0)

// un led spento apre il suo fumetto e non muove il robot
await toccaSu('[data-livello="7"]')
await attendi(page, 400)
uguale('un led spento non muove il robot', `${(await robot()).al}/${(await robot()).inViaggio}`, '2/0')
// il robot che viaggia verso un led aperto e un tocco su uno spento: il viaggio continua
await toccaSu('[data-livello="4"]')
await toccaSu('[data-livello="8"]')
uguale('un led spento, in viaggio, apre il suo fumetto', await fumetto().getAttribute('data-fumetto-per'), '8')
await page.waitForSelector('[data-robot][data-in-viaggio="0"]', { timeout: 6000 })
uguale('e il robot arriva dov\'era diretto', (await robot()).al, '4')
// il cantiere libero non muove il robot
await toccaSu('[data-libero]')
await attendi(page, 300)
uguale('nemmeno il cantiere libero', `${(await robot()).al}/${(await robot()).inViaggio}`, '4/0')
await tocco(6, 480)

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
