/* La mappa delle isole di Passo passo, col dito vero. La valle sul fondale
   dipinto: si apre sul segnalino; il tocco su una casella apre il fumetto
   subito e non parte niente, trascinare sposta la vista (e non apre niente, col
   fumetto che resta sulla sua casella) e il segnalino che parte la riporta su
   di sé, fuori si chiude; una
   chiusa e un ponte col blocco dicono cosa manca e il segnalino non ci va;
   il segnalino salta fino alla casella toccata mentre il fumetto è già lì,
   un altro tocco cambia fumetto e meta, e «gioca» parte anche a viaggio in
   corso; toccando altrove il segnalino ci va e la vista gli va dietro nei
   due versi; un ponte bloccato non si passa. Vinta l'ultima dei massi, ▶
   resta sulla strada del coniglio e la mappa si apre nel mondo dello zaino;
   dalla tana si torna alla valle, nella galleria del pascolo; col selettore
   il cane ha la sua strada tutta nella valle, e la strada del coniglio va
   avanti senza fare il cane. Lo zaino è una seconda valle dipinta: ponti
   chiusi, stendardi, e dal «se» la tana dell'isoletta porta a tutto il
   mondo; il cane va dal pascolo al ghiaccio passando dal salto, senza
   cambiare animale; uscendo e rientrando si è nella stessa valle. Il dito passa da CDP
   (docs/core/il-dito.md). Vedi docs/passo-passo/mappa.md.
   `DIST=… node test/esegui.mjs passo-passo-mappa --niente-build` */
import { apriBrowser, apriGioco, azzera, semina, attendi, scegli, scatto, statoSullIsola, leggiProfilo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA, TAPPE_PRIME, TAPPE_PICCOLE, FILA_ATTUALE } from '../../src/giochi/passo-passo/dati/campagna.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { risolvi } from '../../src/giochi/passo-passo/motore/risolutore.js'
import { STRADE } from '../../src/giochi/passo-passo/motore/strade.js'
import { SENTIERO_CANE } from '../../src/giochi/passo-passo/scena/animale.js'

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
// la vista ferma: un dito tocca quello che vede, e mentre la vista scorre la cosa gli scappa da sotto
const vistaFerma = async () => {
  let prima = null
  for (let k = 0; k < 60; k++) {
    const ora = await page.evaluate(() => { const v = document.querySelector('[data-isole]'); return `${v.scrollLeft},${v.scrollTop}` })
    if (ora === prima) return
    prima = ora
    await attendi(page, 60)
  }
}
// porta la cosa sullo schermo (la vista la prende com'è) e ne dà il centro
const centro = async sel => {
  await vistaFerma()
  const nodo = page.locator(sel).first()
  await nodo.scrollIntoViewIfNeeded()
  await attendi(page, 50)
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
// dove sta il fumetto sulla mappa (non sullo schermo: la vista non c'entra)
const postoFumetto = () => page.evaluate(() => {
  const f = document.querySelector('[data-fumetto]')
  return f ? `${f.style.left}/${f.style.top}` : null
})
// trascina il dito da (x, y) di (dx, dy) in qualche passo; `rilascia: false` lo lascia premuto, `sosta` lo ferma prima di staccarlo
const trascina = async (x, y, dx, dy, { passi = 6, pausa = 16, rilascia = true, sosta = 0 } = {}) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  for (let k = 1; k <= passi; k++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove',
                   touchPoints: [{ x: x + Math.round(dx * k / passi), y: y + Math.round(dy * k / passi) }] })
    await attendi(page, pausa)
  }
  if (sosta) await attendi(page, sosta)         // il dito si ferma prima di staccarsi: niente slancio
  if (rilascia) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
// di quanto la vista può ancora scorrere, e da che parte il dito la sposta: verso dove c'è più mappa
const margini = () => page.evaluate(() => {
  const v = document.querySelector('[data-isole]')
  return { x: v.scrollLeft, y: v.scrollTop, maxX: v.scrollWidth - v.clientWidth, maxY: v.scrollHeight - v.clientHeight }
})
const versoLaMappa = async d => {
  const m = await margini()
  return { dx: m.x > m.maxX / 2 ? d : -d, dy: m.y > m.maxY / 2 ? d : -d }
}
const casella = i => `[data-mappa] [data-tappa="${i}"]`
const segnalino = () => page.evaluate(() => ({ ...document.querySelector('[data-segnalino]').dataset }))
const fermo = () => page.waitForSelector('[data-segnalino][data-in-viaggio="0"]', { timeout: 10000 })
const fumettoPer = async () => (await page.locator('[data-fumetto]').count()
  ? page.locator('[data-fumetto]').getAttribute('data-fumetto-per') : null)
const inGioco = async () => (await page.locator('.pp-campo').count()) > 0
const mondo = () => page.locator('[data-mappa]').getAttribute('data-mondo')
const vista = () => page.evaluate(() => {
  const v = document.querySelector('[data-isole]')
  return { x: v.scrollLeft, y: v.scrollTop }
})
// gli animali che il segnalino è stato, dal tocco in poi, e se è passata una nuvoletta
const spia = () => page.evaluate(() => {
  const s = document.querySelector('[data-segnalino]')
  window.__animali = [s.dataset.animale]
  window.__sbuffo = false
  const vecchia = document.querySelector('.pp-sbuffo')       // una nuvoletta di prima non conta
  window.__spia?.disconnect()
  window.__spia = new MutationObserver(() => {
    if (window.__animali.at(-1) !== s.dataset.animale) window.__animali.push(s.dataset.animale)
    const n = document.querySelector('.pp-sbuffo')
    if (n && n !== vecchia) window.__sbuffo = true
  })
  window.__spia.observe(document.querySelector('[data-isole]'), { attributes: true, childList: true, subtree: true })
})
const animali = () => page.evaluate(() => window.__animali.join(' '))
// un punto della mappa dove non c'è niente da toccare: il mare o la terra di un'isola
const vuoto = () => page.evaluate(() => {
  for (let y = 780; y > 150; y -= 23)
    for (let x = 12; x < 380; x += 17) {
      const libero = (px, py) => {
        const e = document.elementFromPoint(px, py)
        return e && e.closest('[data-isole]') && !e.closest('button, [data-fumetto], [data-insegna], .pp-sentiero-nome')
      }
      // anche attorno: Chrome porta un tocco sul bottone che gli sta vicino
      if (libero(x, y) && [[30, 0], [-30, 0], [0, 30], [0, -30]].every(([dx, dy]) => libero(x + dx, y + dy))) return [x, y]
    }
  return null
})
const toccaFuori = async () => { await vistaFerma(); const [x, y] = await vuoto(); await tocco(x, y) }
const stelleFino = n => Object.fromEntries([...Array(n)].map((_, i) => [i, 3]))
const apri = async (tappa, cfg = {}, eta = 8) => {
  await semina(page, { settings: { eta },
                       campagne: { passo: { tappa, stelle: stelleFino(tappa), cfg: { fila: FILA_ATTUALE, ...cfg } } } })
  await scegli(page, 'passo')
  await page.waitForSelector('[data-mappa] [data-tappa]')
  await fermo()
}
const TUTTO = CAMPAGNA.findIndex(t => t.chiave === 'tutto')
const STALLE = CAMPAGNA.findIndex(t => t.chiave === 'stalle')
const SALTO = CAMPAGNA.findIndex(t => t.scalino === 'salto')
const GHIACCIO = CAMPAGNA.findIndex(t => t.scalino === 'ghiaccio')
const MASSI = CAMPAGNA.findIndex(t => t.scalino === 'massi')

/* ══════════ 1. a inizio campagna: la valle, il coniglio sul prato ══════════ */
await apri(0)
{
  const s = await segnalino()
  uguale('si apre sulla valle', await mondo(), 'valle')
  uguale('il segnalino sta sulla prima tappa', s.al, '0')
  uguale('ed è il coniglio', s.animale, 'coniglio')
  uguale('una sola casella è quella di adesso', await page.locator('[data-mappa] [data-stato="ora"]').count(), 1)
  const b = await page.locator('[data-segnalino]').boundingBox()
  controlla('la vista si apre sul segnalino', b && b.x > 0 && b.x + b.width < 390 && b.y > 0 && b.y + b.height < 844, JSON.stringify(b))
  uguale('i ponti verso le isole chiuse hanno il blocco',
         (await page.locator('[data-blocco]').evaluateAll(l => l.map(e => `${e.dataset.blocco}>${e.dataset.chiude}`))).sort().join(' '),
         'prato-massi>massi prato-salto>salto salto-pascolo>salto')
  controlla('le isole chiuse hanno il cartello velato', await page.locator('[data-isola="salto"][data-velata="1"]').count() === 1 &&
            await page.locator('[data-isola="passi"][data-velata="0"]').count() === 1)
  uguale('la tana dello zaino è chiusa', await page.locator('[data-passaggio="zaino"]').getAttribute('data-aperta'), '0')
  uguale('e la sua insegna dice da che numero comincia, ferma',
         (await page.locator('[data-passaggio="zaino"] [data-sotto]').textContent()) + ' ' +
         await page.locator('[data-passaggio="zaino"] [data-chiama]').getAttribute('data-chiama'), `dal ${TAPPE_PRIME + 1} in poi 0`)
}
await scatto(page, 'passo-mappa-inizio')

/* il dito apre il fumetto, e non parte niente */
await toccaSu(casella(0))
uguale('il tocco apre il fumetto della casella', await fumettoPer(), '0')
{
  const testo = await page.locator('[data-fumetto]').innerText()
  controlla('col nome, il racconto e il tasto', testo.includes(CAMPAGNA[0].nome) &&
            testo.includes(CAMPAGNA[0].racconto.slice(0, 20)) &&
            await page.locator('[data-fumetto] [data-azione="parti"]').count() === 1, testo)
  uguale('quattro stelle da prendere', await page.locator('[data-fumetto] .pp-fumetto-stelle svg').count(), 4)
}
controlla('il click che il dito lascia dietro non fa partire la tappa', !(await inGioco()))
await toccaFuori()
uguale('un tocco fuori lo chiude', await page.locator('[data-fumetto]').count(), 0)

/* trascinare sposta la vista, e non apre niente */
{
  const [x, y] = await centro(casella(0))
  const prima = await vista()
  const { dx, dy } = await versoLaMappa(90)
  await trascina(x, y, dx, dy, { pausa: 40, sosta: 200 })       // lento: poi il dito si ferma, niente slancio
  await attendi(page, 800)
  const dopo = await vista()
  uguale('trascinare su una casella non apre il fumetto', await page.locator('[data-fumetto]').count(), 0)
  uguale('né muove il segnalino', (await segnalino()).inViaggio, '0')
  uguale('né lo manda alla casella', (await segnalino()).al, '0')
  controlla('ma la vista va dove la porta il dito, nei due versi',
            Math.abs((prima.x - dopo.x) - dx) <= 3 && Math.abs((prima.y - dopo.y) - dy) <= 3,
            `${JSON.stringify(prima)} → ${JSON.stringify(dopo)} per ${dx},${dy}`)
  await attendi(page, 600)
  uguale('e sta lì, il segnalino fermo non la richiama', JSON.stringify(await vista()), JSON.stringify(dopo))
  uguale('la partita non è partita', await inGioco(), false)
}
/* un tocco dopo il trascinamento funziona; il fumetto resta sulla sua casella mentre si trascina */
await toccaSu(casella(0))
uguale('un tocco dopo il trascinamento apre il fumetto', await fumettoPer(), '0')
{
  const posto = await postoFumetto()
  const f0 = await page.locator('[data-fumetto]').boundingBox(), c0 = await page.locator(casella(0)).boundingBox()
  const v0 = await vista()
  const { dx, dy } = await versoLaMappa(70)
  await trascina(f0.x + f0.width / 2, f0.y + f0.height / 2, dx, dy, { pausa: 40, sosta: 200 })     // il dito parte dal fumetto
  await attendi(page, 800)
  const v1 = await vista()
  const f1 = await page.locator('[data-fumetto]').boundingBox(), c1 = await page.locator(casella(0)).boundingBox()
  controlla('la vista si è spostata', v1.x !== v0.x || v1.y !== v0.y, `${JSON.stringify(v0)} → ${JSON.stringify(v1)}`)
  uguale('il fumetto non si chiude', await fumettoPer(), '0')
  uguale('e sta dov\'è sulla mappa', await postoFumetto(), posto)
  controlla('si sposta con la mappa, sopra la sua casella',
            Math.abs((f1.x - f0.x) - (c1.x - c0.x)) <= 2 && Math.abs((f1.y - f0.y) - (c1.y - c0.y)) <= 2 &&
            Math.abs((f1.x - f0.x) - (v0.x - v1.x)) <= 2 && Math.abs((f1.y - f0.y) - (v0.y - v1.y)) <= 2,
            `${JSON.stringify(f0)} → ${JSON.stringify(f1)}; casella ${JSON.stringify(c0)} → ${JSON.stringify(c1)}`)
  uguale('il segnalino è rimasto fermo', (await segnalino()).al, '0')
}
await toccaFuori()
uguale('un tocco fuori, dopo il trascinamento, chiude il fumetto', await page.locator('[data-fumetto]').count(), 0)

/* con lo slancio la vista scivola dopo il dito e si ferma morbida, dentro i bordi della mappa */
{
  const [x, y] = await centro(casella(0))
  const { dx, dy } = await versoLaMappa(150)
  await trascina(x, y, dx, dy, { passi: 6, pausa: 12, rilascia: false })
  const alRilascio = await vista()
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await attendi(page, 250)
  const dopo = await vista()
  const m = await margini()
  controlla('dopo il rilascio la vista scivola ancora', dopo.x !== alRilascio.x || dopo.y !== alRilascio.y || m.x === 0 || m.y === 0,
            `${JSON.stringify(alRilascio)} → ${JSON.stringify(dopo)}`)
  await attendi(page, 2500)
  const fine = await vista(), fine2 = await (async () => { await attendi(page, 300); return vista() })()
  uguale('poi si ferma', JSON.stringify(fine2), JSON.stringify(fine))
  const mm = await margini()
  controlla('dentro i bordi della mappa', mm.x >= 0 && mm.x <= mm.maxX && mm.y >= 0 && mm.y <= mm.maxY, JSON.stringify(mm))
  uguale('senza aprire niente', await page.locator('[data-fumetto]').count(), 0)
  // un tocco mentre scivola ferma la vista e basta
  await trascina(x, y, -dx, -dy, { passi: 6, pausa: 12 })
  await attendi(page, 150)
  const scivola = await vista()
  await tocco(200, 400)
  const fermata = await vista()
  await attendi(page, 500)
  uguale('un tocco sulla vista che scivola la ferma', JSON.stringify(await vista()), JSON.stringify(fermata))
  uguale('e non apre né manda niente', `${await page.locator('[data-fumetto]').count()}/${(await segnalino()).inViaggio}`, '0/0')
  void scivola
}
await centro(casella(0))

/* una chiusa dice cosa manca, e il segnalino non ci va */
await toccaSu(casella(1))
{
  const serve = await page.locator('[data-fumetto] [data-serve]').innerText()
  controlla('la seconda tappa aspetta la prima', /Prima tocca a «Il prato»/.test(serve), serve)
  uguale('e non si parte', await page.locator('[data-fumetto] [data-azione="parti"]').count(), 0)
  uguale('il segnalino non ci va', (await segnalino()).al, '0')
}
await toccaFuori()

/* la tana dello zaino chiusa: dice cosa manca, e non si passa */
await toccaSu('[data-passaggio="zaino"]')
uguale('la tana chiusa ha il suo fumetto', await fumettoPer(), 'zaino')
controlla('che dice cosa manca', (await page.locator('[data-fumetto] [data-serve]').count()) === 1)
await attendi(page, 300)
uguale('e non si passa allo zaino', await mondo(), 'valle')
uguale('il segnalino resta dov\'era', (await segnalino()).al, '0')
await toccaFuori()

/* un ponte col blocco: il fumetto dice cosa apre l'isola di là, e non si passa */
await toccaSu('[data-blocco="prato-salto"]')
uguale('il blocco ha il suo fumetto', await fumettoPer(), 'blocco:prato-salto')
{
  const testo = await page.locator('[data-fumetto]').innerText()
  controlla('dice che il ponte è chiuso, e verso dove', /ponte è chiuso/i.test(testo) && testo.includes('Il salto'), testo)
  controlla('e cosa manca', /Prima tocca a/.test(await page.locator('[data-fumetto] [data-serve]').innerText()))
}
await scatto(page, 'passo-mappa-blocco')
await toccaFuori()
{
  // un tocco sul ponte, oltre la sbarra: il coniglio arriva fin dove si può, sul prato
  const [x, y] = await centro('[data-blocco="prato-salto"]')
  await tocco(x + 50, y + 12)
  await fermo()
  const s = await segnalino()
  controlla('oltre il blocco non si passa', !['5', '6', '7', '8', '9'].includes(s.al) && s.animale === 'coniglio', s.al)
}

/* ══════════ 2. a metà: sul ghiaccio ══════════ */
await apri(GHIACCIO + 2, { ultima: GHIACCIO + 1 })
uguale('a metà il segnalino sta sulla tappa di adesso', (await segnalino()).al, String(GHIACCIO + 2))
controlla('i massi sono chiusi, e il loro ponte ha il blocco',
          await page.locator('[data-blocco="prato-massi"][data-chiude="massi"]').count() === 1 &&
          await statoSullIsola(page, MASSI) === 'chiusa')
await scatto(page, 'passo-mappa-meta')

/* il tondo col numero, come i led del robot: niente emoji sulla mappa, le stelle solo sulle fatte,
   l'emoji del livello solo nel fumetto; lo stendardo col nome non copre una casella */
{
  const caselle = await page.locator('[data-mappa] [data-tappa]').evaluateAll(l => l
    .filter(e => !isNaN(Number(e.dataset.tappa)))
    .map(e => ({ i: Number(e.dataset.tappa), stato: e.dataset.stato, numero: e.querySelector('.pp-tondo b')?.textContent,
                 testo: e.textContent.replace(/\s+/g, ''), stelle: e.querySelector('[data-stelle]') ? Number(e.querySelector('[data-stelle]').dataset.piene) : null })))
  controlla('ci sono le caselle della valle', caselle.length > 20, String(caselle.length))
  uguale('ogni casella dice il numero del suo livello', caselle.filter(c => c.numero !== String(c.i + 1)).map(c => c.i).join(' '), '')
  uguale('e solo quello: niente emoji', caselle.filter(c => c.testo !== String(c.i + 1)).map(c => c.i).join(' '), '')
  uguale('le stelle stanno solo sulle fatte', caselle.filter(c => (c.stato === 'fatta') !== (c.stelle !== null)).map(c => c.i).join(' '), '')
  uguale('e sono quelle prese', caselle.filter(c => c.stato === 'fatta' && c.stelle !== 3).length, 0)
  uguale('una sola è da fare adesso', caselle.filter(c => c.stato === 'ora').map(c => c.i).join(' '), String(GHIACCIO + 2))
  uguale('le chiuse hanno il lucchetto piccolo',
         await page.locator('[data-mappa] [data-stato="chiusa"] .pp-lucchetto-piccolo, [data-mappa] [data-stato="chiusa"] .pp-lucchetto').count(),
         await page.locator('[data-mappa] [data-stato="chiusa"]').count())
  // gli stendardi: il nome ci sta scritto sopra, e nessuno copre una casella
  const stendardi = await page.locator('[data-mondo="valle"] [data-insegna]').evaluateAll(l => l.map(e => {
    const r = e.querySelector('svg').getBoundingClientRect()
    return { chiave: e.dataset.insegna, testo: e.textContent.trim(), r: [r.left, r.top, r.right, r.bottom] }
  }))
  uguale('uno stendardo per isola, col nome', stendardi.map(x => `${x.chiave}:${x.testo.replace(/^\P{L}+/u, '')}`).sort().join(' | '),
         ['passi:Primi passi', 'salto:Il salto', 'ghiaccio:Il ghiaccio', 'massi:I massi', 'buche:Le buche'].sort().join(' | '))
  const coperte = await page.evaluate(sts => {
    const out = []
    for (const e of document.querySelectorAll('[data-mappa] [data-tappa]')) {
      const b = e.getBoundingClientRect()
      for (const x of sts) if (b.left < x.r[2] && b.right > x.r[0] && b.top < x.r[3] && b.bottom > x.r[1]) out.push(`${x.chiave}/${e.dataset.tappa}`)
    }
    return out
  }, stendardi)
  uguale('nessuno stendardo copre una casella', coperte.join(' '), '')
  // il fumetto della tappa di adesso ha l'emoji del livello (il segnalino è già lì: non si muove)
  await toccaSu(casella(GHIACCIO + 2))
  uguale('l\'emoji del livello sta nel fumetto', await page.locator('[data-fumetto] [data-livello-icona]').textContent(), CAMPAGNA[GHIACCIO + 2].icona)
  await toccaFuori()
  uguale('il fumetto si chiude', await page.locator('[data-fumetto]').count(), 0)
}

/* il fumetto è subito sulla meta, e il segnalino ci va */
await toccoVivo(casella(SALTO + 3))
uguale('il fumetto della meta c\'è subito', await fumettoPer(), String(SALTO + 3))
{
  await attendi(page, 60)
  const s = await segnalino()
  uguale('mentre il segnalino sta ancora saltando', s.inViaggio, '1')
  controlla('e non è ancora arrivato', s.al !== String(SALTO + 3), s.al)
  const posto = await postoFumetto()
  const prima = await page.locator('[data-segnalino]').evaluate(e => e.style.transform)
  await attendi(page, 500)
  await scatto(page, 'passo-mappa-viaggio')
  const durante = await page.locator('[data-segnalino]').evaluate(e => e.style.transform)
  controlla('il coniglio salta', prima !== durante, `${prima} → ${durante}`)
  uguale('il fumetto resta fermo dov\'è', await postoFumetto(), posto)
  controlla('e sta sopra il segnalino, mai dietro', await page.evaluate(() => {
    const z = sel => Number(getComputedStyle(document.querySelector(sel)).zIndex)
    return z('[data-fumetto]') > z('[data-segnalino]')
  }))
  controlla('si può già premere «gioca»', await page.locator('[data-fumetto] [data-azione="parti"]').count() === 1)
}
await fermo()
uguale('il segnalino arriva alla meta', (await segnalino()).al, String(SALTO + 3))
{
  const b = await page.locator('[data-segnalino]').boundingBox(), f = await page.locator('[data-fumetto]').boundingBox()
  controlla('e lo si vede, sotto il fumetto', b.y > f.y && b.y + b.height < 844 && b.x > -10 && b.x + b.width < 400,
            `${JSON.stringify(b)} / ${JSON.stringify(f)}`)
}

/* un altro tocco durante il viaggio: il fumetto passa subito alla nuova tappa e
   il segnalino cambia meta da dove si trova */
await toccoVivo(casella(GHIACCIO + 1))
await attendi(page, 150)
await toccoVivo(casella(SALTO + 1))
uguale('un tocco durante il salto cambia il fumetto subito', await fumettoPer(), String(SALTO + 1))
await fermo()
uguale('arriva alla nuova meta, non alla prima', (await segnalino()).al, String(SALTO + 1))
uguale('il fumetto è ancora quello della meta', await fumettoPer(), String(SALTO + 1))

/* un tocco fuori chiude il fumetto, ma il viaggio finisce */
await toccoVivo(casella(SALTO + 4))
uguale('di nuovo il fumetto subito', await fumettoPer(), String(SALTO + 4))
await attendi(page, 100)
await toccaFuori()
uguale('un tocco fuori chiude il fumetto', await page.locator('[data-fumetto]').count(), 0)
await fermo()
uguale('e il segnalino arriva lo stesso', (await segnalino()).al, String(SALTO + 4))
uguale('senza riaprire il fumetto', await page.locator('[data-fumetto]').count(), 0)

/* toccando altrove il segnalino ci va, e la vista gli va dietro nei due versi */
{
  const prima = await vista()
  for (let k = 0; k < 4; k++) {
    await tocco(20, 760)
    await fermo()
    await attendi(page, 900)
  }
  const dopo = await vista()
  controlla('la vista è andata a sinistra', dopo.x < prima.x - 150, `${JSON.stringify(prima)} → ${JSON.stringify(dopo)}`)
  const fondo = (await margini()).maxY
  controlla('e in giù (o fino al bordo della mappa)', dopo.y > prima.y + 60 || dopo.y >= fondo - 2,
            `${JSON.stringify(prima)} → ${JSON.stringify(dopo)}, bordo ${fondo}`)
  const b = await page.locator('[data-segnalino]').boundingBox()
  controlla('col segnalino dentro lo schermo', b && b.x > 0 && b.x + b.width < 390 && b.y > 56 && b.y + b.height < 844, JSON.stringify(b))
  controlla('arrivato su un posto della valle', (await segnalino()).al !== '', (await segnalino()).al)
}

/* il segnalino che parte riporta la vista su di sé: portata via col dito, quando lui salta la vista lo segue */
{
  // a dito si sposta la vista finché il segnalino esce dallo schermo e ce n'è un'altra casella aperta da toccare
  const altra = () => page.evaluate(() => {
    const sul = document.querySelector('[data-segnalino]').dataset.al
    const l = [...document.querySelectorAll('[data-mappa] [data-tappa]')].filter(e => e.dataset.stato !== 'chiusa' && e.dataset.tappa !== sul)
      .map(e => { const r = e.getBoundingClientRect(); return { t: e.dataset.tappa, x: r.x + r.width / 2, y: r.y + r.height / 2 } })
      .filter(c => c.x > 40 && c.x < 350 && c.y > 120 && c.y < 700)
    return l[0] || null
  })
  const fuoriSchermo = async () => {
    const b = await page.locator('[data-segnalino]').boundingBox()
    return b.x + b.width < 0 || b.x > 390 || b.y + b.height < 56 || b.y > 844
  }
  let mia = null, lontano = false
  for (let k = 0; k < 14 && !(lontano && mia); k++) {
    // solo di lato: in alto le isole sono chiuse, le tappe aperte stanno all'altezza del segnalino
    const { dx } = await versoLaMappa(k % 2 ? 140 : 220)
    await trascina(195, 420, dx, 0, { passi: 8, pausa: 40 })
    await attendi(page, 900)
    lontano = await fuoriSchermo()
    mia = lontano ? await altra() : null
  }
  controlla('portata la vista lontana, il segnalino non si vede più', lontano)
  const prima = await vista()
  controlla('in vista c\'è un\'altra casella aperta da toccare', !!mia, JSON.stringify(mia))
  await tocco(mia.x, mia.y)
  await fermo()
  await attendi(page, 1200)
  const b = await page.locator('[data-segnalino]').boundingBox()
  controlla('il segnalino è partito e la vista è tornata su di lui',
            b && b.x > 0 && b.x + b.width < 390 && b.y > 56 && b.y + b.height < 844, JSON.stringify(b))
  const dopo = await vista()
  controlla('cioè si è spostata', dopo.x !== prima.x || dopo.y !== prima.y, `${JSON.stringify(prima)} → ${JSON.stringify(dopo)}`)
  uguale('ed è arrivato alla casella toccata', (await segnalino()).al, mia.t)
  await toccaFuori()
}

/* ══════════ 3. «gioca» parte a viaggio in corso; vinta, ▶ resta sulla strada del coniglio ══════════ */
await apri(TUTTO, { ultima: TUTTO - 1 })
await toccaSu(casella(TUTTO - 3))
await fermo()
await toccaFuori()
await toccoVivo(casella(TUTTO))
{
  await attendi(page, 60)
  uguale('il segnalino è in viaggio', (await segnalino()).inViaggio, '1')
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
  controlla('finiti i massi, ▶ va avanti sulla strada del coniglio: il viale', titolo.includes(CAMPAGNA[TAPPE_PICCOLE].nome), titolo)
}
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('[data-mappa] [data-tappa]')
await fermo()
{
  const s = await segnalino()
  uguale('tornati alla mappa si è nel mondo dello zaino', await mondo(), 'zaino')
  uguale('col coniglio sul viale', `${s.al}/${s.animale}`, `${TAPPE_PICCOLE}/coniglio`)
  uguale('il viale è la tappa di adesso', await statoSullIsola(page, TAPPE_PICCOLE), 'ora')
  const p = ((await leggiProfilo(page)).campagne || {}).passo || {}
  uguale('il profilo si ricorda l\'ultima tappa giocata', p.cfg && p.cfg.ultima, TAPPE_PICCOLE)
}

/* ══════════ 4. dalle carte alla valle, e il selettore: col cane la sua mappa ══════════ */
controlla('in cima allo zaino la tana che torna alla valle', await page.locator('[data-passaggio="valle"]').count() === 1)
await scatto(page, 'passo-mappa-zaino')
await toccaSu('[data-passaggio="valle"]')
await page.waitForSelector('[data-mappa][data-mondo="valle"] [data-tappa]', { timeout: 10000 })
await fermo()
{
  const s = await segnalino()
  uguale('dalla tana si torna alla valle, e il coniglio sbuca da quella dello zaino', `${s.al}/${s.animale}`, 'tana:zaino/coniglio')
  uguale('che adesso è aperta', await page.locator('[data-passaggio="zaino"]').getAttribute('data-aperta'), '1')
  uguale('e la sua insegna ondeggia: di là c\'è il viale da fare',
         await page.locator('[data-passaggio="zaino"] [data-chiama]').getAttribute('data-chiama'), '1')
  uguale('col coniglio il pascolo non ha caselle', await page.locator('[data-mappa] [data-strada="cane"]').count(), 0)
}
await toccaSu('[data-scegli="cane"]')
await page.waitForSelector('[data-mappa][data-protagonista="cane"] [data-tappa]', { timeout: 8000 })
await fermo()
{
  const s = await segnalino()
  uguale('scelto il cane, il segnalino è il cane sul primo gregge', `${s.al}/${s.animale}`, `${TAPPE_PRIME}/cane`)
  uguale('che è la tappa di adesso', await page.locator(casella(TAPPE_PRIME)).getAttribute('data-stato'), 'ora')
  const numeri = await page.locator('[data-mappa] [data-tappa]:not([data-tappa^="senza-fine"]) .pp-tondo b').evaluateAll(l => l.map(e => Number(e.textContent)))
  uguale('le sue caselle contano da 1, tutte nella valle', numeri.sort((x, y) => x - y).join(), STRADE.cane.map((_, k) => k + 1).join())
  uguale('e del coniglio non ce n\'è', await page.locator('[data-mappa] [data-strada="coniglio"]').count(), 0)
  uguale('col cane la tana per le carte non c\'è: di là non ha niente', await page.locator('[data-passaggio]').count(), 0)
  controlla('e in fondo alla sua strada, sul prato, il suo sentiero', await page.locator(`[data-tappa="${SENTIERO_CANE}"] [data-sentiero-di="cane"]`).count() === 1)
}
await toccaSu(casella(TAPPE_PRIME))
{
  uguale('c\'è il fumetto del primo gregge', await fumettoPer(), String(TAPPE_PRIME))
  controlla('«col cane»', /col cane/i.test(await page.locator('[data-fumetto]').innerText()))
  controlla('e spiega le pecore, che vede per la prima volta', await page.locator('[data-fumetto] [data-nuovo]').count() >= 1)
  controlla('che si può giocare', await page.locator('[data-fumetto] [data-azione="parti"]').count() === 1)
}
await scatto(page, 'passo-mappa-pascolo')
await toccaFuori()
await toccaSu('[data-scegli="coniglio"]')
await page.waitForSelector('[data-mappa][data-protagonista="coniglio"] [data-tappa]', { timeout: 8000 })
await fermo()
uguale('tornati al coniglio, il segnalino è il coniglio', (await segnalino()).animale, 'coniglio')

/* ══════════ 5. le due strade vanno ognuna per conto suo ══════════ */
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
  uguale('col cane, il primo gregge aspetta', await statoSullIsola(page, TAPPE_PRIME), 'ora')
  await toccaSu('[data-blocco="salto-ghiaccio"]')
  const serve = await page.locator('[data-fumetto] [data-serve]').innerText()
  controlla('e il ponte del ghiaccio, per le carte del cane, dice di finire prima il pascolo', /Prima tocca a «Il primo gregge»/.test(serve), serve)
  await toccaFuori()
}

/* ══════════ 6. il mondo dello zaino, sul suo fondale ══════════ */
const DELLO_ZAINO = 18         // le tappe del coniglio di ripeti, fino a, se e tutto il mondo
await apri(TAPPE_PICCOLE)
{
  uguale('con la prima tappa dello zaino si apre lo zaino', await mondo(), 'zaino')
  const s = await segnalino()
  uguale('il coniglio sta sulla tappa di adesso, il viale', `${s.al}/${s.animale}`, `${TAPPE_PICCOLE}/coniglio`)
  uguale('sulla riva la tana per la valle, con la sua insegna: il nome e i numeri di là',
         (await page.locator('[data-passaggio="valle"] [data-nome]').textContent()).trim() + ' · ' +
         (await page.locator('[data-passaggio="valle"] [data-sotto]').textContent()).trim(), `I primi livelli · dall'1 al ${TAPPE_PRIME}`)
  uguale('i ponti verso le isole chiuse hanno il blocco',
         (await page.locator('[data-blocco]').evaluateAll(l => l.map(e => `${e.dataset.blocco}>${e.dataset.chiude}`))).sort().join(' '),
         'ripeti-fino>fino ripeti-mondo>mondo se-casetta>se')
  uguale('uno stendardo per isola del coniglio',
         (await page.locator('[data-mondo="zaino"] [data-insegna]').evaluateAll(l => l.map(e => e.dataset.insegna))).sort().join(' '),
         'fino mondo ripeti se')
  uguale('quelli grandi hanno il nome',
         (await page.locator('[data-mondo="zaino"] [data-insegna]').evaluateAll(l => l.map(e => `${e.dataset.insegna}:${e.textContent.trim().replace(/^\P{L}+/u, '')}`)))
           .filter(x => !x.includes('-cane')).sort().join(' | '),
         'fino:Fino a | mondo:Tutto il mondo | ripeti:Il ripeti | se:Il se')
  uguale('la tana dell\'isoletta per tutto il mondo, chiusa, ha il masso', await page.locator('[data-tana="casetta"]').getAttribute('data-aperta'), '0')
  uguale('una casella per tappa del coniglio nelle carte', await page.locator('[data-mappa] [data-tappa]:not([data-tappa^="senza-fine"])').count(), DELLO_ZAINO)
  const numeri = await page.locator('[data-mappa] [data-tappa] .pp-tondo b').evaluateAll(l => l.map(e => Number(e.textContent)))
  uguale('ognuna dice il suo numero sulla strada del coniglio, dopo quelli della valle',
         numeri.every(n => Number.isInteger(n) && n > TAPPE_PRIME && n <= TAPPE_PRIME + DELLO_ZAINO), true)
  controlla('e in fondo a «Tutto il mondo» il sentiero del coniglio', await page.locator('[data-tappa="senza-fine"] [data-sentiero-di="coniglio"]').count() === 1)
  uguale('tutte diverse', new Set(numeri).size, DELLO_ZAINO)
  await scatto(page, 'passo-mappa-zaino-chiuso')
}
// anche lo zaino si trascina, e non apre niente
{
  const [x, y] = await centro(casella(TAPPE_PICCOLE))
  const prima = await vista()
  const { dx, dy } = await versoLaMappa(80)
  await trascina(x, y, dx, dy, { pausa: 40, sosta: 200 })
  await attendi(page, 600)
  const dopo = await vista()
  controlla('nello zaino la vista va dove la porta il dito',
            Math.abs((prima.x - dopo.x) - dx) <= 3 && Math.abs((prima.y - dopo.y) - dy) <= 3,
            `${JSON.stringify(prima)} → ${JSON.stringify(dopo)} per ${dx},${dy}`)
  uguale('e non apre il fumetto', await page.locator('[data-fumetto]').count(), 0)
  uguale('né muove il segnalino', (await segnalino()).inViaggio, '0')
}
// un ponte chiuso: il fumetto dice cosa apre l'isola di là
await toccaSu('[data-blocco="ripeti-fino"]')
{
  uguale('il blocco ha il suo fumetto', await fumettoPer(), 'blocco:ripeti-fino')
  const testo = await page.locator('[data-fumetto]').innerText()
  controlla('dice che il ponte è chiuso, e verso dove', /ponte è chiuso/i.test(testo) && testo.includes('Fino a'), testo)
  controlla('e cosa manca', /Prima tocca a/.test(await page.locator('[data-fumetto] [data-serve]').innerText()))
  await scatto(page, 'passo-mappa-zaino-blocco')
}
await toccaFuori()
{
  // oltre la sbarra non si passa: un tocco sul ponte porta il coniglio fin dove si può, sul ripeti
  const [x, y] = await centro('[data-blocco="ripeti-fino"]')
  await tocco(x, y - 40)
  await fermo()
  const s = await segnalino()
  controlla('oltre il blocco non si passa: il coniglio non arriva al fino a', !['44', '46', '47', '48'].includes(s.al), s.al)
  uguale('ed è il coniglio', s.animale, 'coniglio')
}

/* dal se a tutto il mondo il coniglio va avanti: sull'isoletta della casetta, giù nella tana, e sbuca
   in una nuvoletta all'ingresso di tutto il mondo */
{
  const MONDO = CAMPAGNA.findIndex(t => t.scalino === 'mondo')
  await apri(MONDO, { ultima: STRADE.prima[MONDO] })
  uguale('finito il se si apre nello zaino', await mondo(), 'zaino')
  uguale('la tana della casetta è aperta', await page.locator('[data-tana="casetta"]').getAttribute('data-aperta'), '1')
  // prima sull'ultima del se, poi avanti
  await toccaSu(casella(STRADE.prima[MONDO]))
  await fermo()
  await toccaFuori()
  await spia()
  await toccaSu(casella(MONDO))
  await fermo()
  await attendi(page, 300)
  const s = await segnalino()
  uguale('il coniglio arriva sulla prima di tutto il mondo', `${s.al}/${s.animale}`, `${MONDO}/coniglio`)
  controlla('passando dalla tana, con la nuvoletta', await page.evaluate(() => window.__sbuffo))
  await toccaFuori()
}

/* il cane: tutta la sua strada nella valle; dal pascolo al ghiaccio passa dal salto, e resta il cane */
const RIPETI_CANE = STRADE.isole.find(s => s.chiave === 'ripeti-cane').tappe[0]
const ULTIMA_PECORA = STRADE.prima[RIPETI_CANE]
await page.locator('button[aria-label="indietro"]').click()
await semina(page, { settings: { eta: 8 }, campagne: { passo: {
  tappa: TAPPE_PICCOLE, stelle: stelleFino(ULTIMA_PECORA + 1), cfg: { fila: FILA_ATTUALE, eredita: TAPPE_PRIME, ultima: ULTIMA_PECORA } } } })
await scegli(page, 'passo')
await page.waitForSelector('[data-mappa] [data-tappa]')
await fermo()
uguale('giocato il cane per ultimo, la mappa si apre col cane', await page.locator('[data-mappa]').getAttribute('data-protagonista'), 'cane')
uguale('nella valle', await mondo(), 'valle')
uguale('gli stendardi del cane: il pascolo e le quattro carte',
       (await page.locator('[data-insegna]').evaluateAll(l => l.map(e => e.dataset.insegna))).sort().join(' '),
       'fino-cane mondo-cane pecore-cane ripeti-cane se-cane')
{
  await spia()
  await toccaSu(casella(RIPETI_CANE))
  await fermo()
  await attendi(page, 300)
  const s = await segnalino()
  uguale('dal pascolo al primo ripeti del cane, sul ghiaccio', `${s.al}/${s.animale}`, `${RIPETI_CANE}/cane`)
  uguale('e resta il cane per tutto il viaggio', (await animali()).split(' ').filter(a => a !== 'cane').length, 0)
  controlla('col fumetto della tappa, «col cane»', (await fumettoPer()) === String(RIPETI_CANE) &&
            /col cane/i.test(await page.locator('[data-fumetto]').innerText()))
  await scatto(page, 'passo-mappa-cane-ghiaccio')
  await toccaFuori()
}

/* uscendo e rientrando, il segnalino è dov'era, col suo protagonista, nella stessa valle */
await toccaSu(casella(RIPETI_CANE))
await fermo()
await page.locator('button[aria-label="indietro"]').click()
await scegli(page, 'passo')
await page.waitForSelector('[data-mappa] [data-tappa]')
await fermo()
uguale('rientrando si è col cane', await page.locator('[data-mappa]').getAttribute('data-protagonista'), 'cane')
uguale('nella stessa valle', await mondo(), 'valle')
uguale('e il segnalino sta dov\'era', (await segnalino()).al, String(RIPETI_CANE))

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('passo passo — la mappa delle isole, col dito')
