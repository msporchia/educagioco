/* ═══════════════════════════════════════════════════════════════════
   IL TASTO «SALTA» NEL SOTTERRANEO: UNA PORTA SI APRE SENZA PAGARE

   Il sotterraneo fa le domande con la Domanda comune, ma paga e conta
   da sé: ogni giusta paga subito (`borsellino.paga`), e `giuste` paga
   l'abisso risalendo. Il salto deve aprire la porta, come una giusta,
   e non lasciare niente: né ripasso, né monete, né contatori. Si va
   alla porta come in `sotterraneo-portale` (un seme, la strada toccando
   la tela) e si guarda il profilo su disco prima e dopo.
   La leva si accende da `#admin`; qui si scrive la sua chiave in archivio.
   Vedi docs/core/comandi.md.
   `node test/esegui.mjs salto-sotterraneo --niente-build`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scegli, leggiProfilo, scendiNelSotterraneo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { T } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { percorso } from '../../src/motore/passi.js'

const roba = { v: 1, gemme: 60, zaino: [], mano: 'spada', mancina: null, corpo: 'corazza', dito: null,
               torcia: 0, torce: 0 }

/* ── il piano: la prima discesa con un portale vicino, una porta e un mostro da ferire, senza mostri sulla strada ── */
function scegliIlPiano() {
  let meglio = null
  for (let seme = 1; seme < 400; seme++) {
    const c = new Corsa(CAMPAGNA[0], { seme, eroe: 'cavaliere', roba })
    const L = c.livello
    const da = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
    const lungo = q => (percorso((x, y) => L.calpestabile(x, y), da, q) || { length: 999 }).length
    const porta = L.robe.filter(r => r.che === 'porta').sort((a, b) => lungo(a) - lungo(b))[0]
    if (!porta) continue
    const strada = percorso((x, y) => L.calpestabile(x, y), da, porta)
    if (!strada) continue
    const stanze = new Set(strada.map(q => L.stanzaDi(q.x, q.y)?.id))
    if (L.robe.some(r => r.che === 'mostro' && stanze.has(L.stanzaDi(r.x, r.y)?.id))) continue
    const costo = strada.length
    if (!meglio || costo < meglio.costo) meglio = { seme, costo, c, porta }
  }
  return meglio
}
const piano = scegliIlPiano()
controlla('c\'è un piano della prima discesa col portale, una porta e un mostro', !!piano)
const L = piano.c.livello
const indice = r => L.robe.indexOf(r)
const aperte = new Set()   // i gruppi di porte aperti, per camminare nel modello come nel gioco

let page
const browser = await apriBrowser()
const aperta = await apriGioco(browser)
page = aperta.page
const errori = aperta.errori
await azzera(page)
await accendiLaLeva()
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 0, libera: false, stelle: {},
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: 0, libera: false, stelle: {}, missioni: {},
      roba, terra: { nebbia: 'f'.repeat(768), dove: [55, 11], parlato: true } } } } } },
})
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await page.evaluate(s => { location.hash = 'seme=' + s }, piano.seme)
await scendiNelSotterraneo(page, 0)
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 700)

const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
async function toccaIl(sel) {
  const b = await page.locator(sel).first().boundingBox()
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}

/* ── giù: dov'è l'eroe lo dice la tela, e una cella si trova sullo schermo da lì ── */
const tela = page.locator('.sot-tela')
const cellaGiu = () => tela.getAttribute('data-eroe')
async function schermoDi(c) {
  const [ex, ey] = (await cellaGiu()).split(',').map(Number)
  const [sx, sy] = (await tela.getAttribute('data-eroe-schermo')).split(',').map(Number)
  const s = Number(await tela.getAttribute('data-scala')) * T
  const b = await tela.boundingBox()
  return { x: b.x + sx + (c.x - ex) * s, y: b.y + sy + (c.y - ey) * s, b }
}
// sullo schermo e lontano dalla mappina (in alto a destra), dallo zaino e dalla riga in fondo
const dentro = ({ x, y, b }) => x > b.x + 30 && x < b.x + b.width - 30 && y > b.y + 140 && y < b.y + b.height - 110
async function fermoGiu() {
  let prima = null
  for (let i = 0; i < 40; i++) {
    const ora = await cellaGiu()
    if (ora === prima) return
    prima = ora
    await attendi(page, 300)
  }
}
const apertoGiu = async () => (await page.locator('.sot-domanda, [data-azione="portale"], [data-azione="scappa"], .sot-velo-scontro').count()) > 0
// cammina verso la cosa in `a` toccando la cella più lontana della strada che sta sullo schermo, finché si è
// accanto; poi tocca la cosa, che da accanto è in luce (una cosa al buio non si tocca: si cammina lì)
async function vaiGiu(a, { toccala = true } = {}) {
  // per strada si toccano solo celle vuote: una cella con sopra una fonte o un forziere aprirebbe il suo foglio
  const buona = (x, y) => L.calpestabile(x, y) &&
    !L.robe.some(r => r.x === x && r.y === y && r.che !== 'arredo' && r.che !== 'gemme' &&
                      !(r.che === 'porta' && aperte.has(r.gruppo)))
  for (let giro = 0; giro < 30; giro++) {
    // un mostro che ci raggiunge per strada: si scappa (costa un graffio), e si va avanti
    if (a.che !== 'mostro' && await page.locator('[data-azione="scappa"]').count()) {
      await page.locator('[data-azione="scappa"]').click()
      await attendi(page, 300)
      continue
    }
    // un foglio aperto per sbaglio (una cosa toccata passando) si chiude con «dopo»
    if (await page.locator('[data-azione="dopo"]').count() && !(await page.locator('[data-azione="portale"]').count())) {
      await page.locator('[data-azione="dopo"]').first().click()
      await attendi(page, 300)
      continue
    }
    if (await apertoGiu()) break
    const [ex, ey] = (await cellaGiu()).split(',').map(Number)
    const via = percorso(buona, { x: ex, y: ey }, a, { arrivoLibero: false }) || []
    if (via.length <= 1) {
      const qui = await schermoDi(a)
      if (toccala && dentro(qui)) await tocca(qui.x, qui.y)
      await attendi(page, 300)
      await fermoGiu()
      return
    }
    let tappa = null
    for (const q of via.slice(0, -1)) { const s = await schermoDi(q); if (dentro(s)) tappa = s }
    if (!tappa) break
    await tocca(tappa.x, tappa.y)
    await attendi(page, 300)
    await fermoGiu()
  }
}
async function accendiLaLeva() {
  await page.evaluate(() => new Promise((ok, ko) => {
    const r = indexedDB.open('giochi-bambini', 1)
    r.onerror = () => ko(new Error('IndexedDB non si apre'))
    r.onsuccess = () => {
      const tx = r.result.transaction('kv', 'readwrite')
      tx.objectStore('kv').put({ acceso: true }, 'tasto-salta')
      tx.oncomplete = ok
      tx.onerror = () => ko(new Error('scrittura fallita'))
    }
  }))
}
const foto = async () => {
  await attendi(page, 800)
  const p = (await leggiProfilo(page)) || {}
  return JSON.stringify({ items: p.items || {}, coins: p.coins || 0, totals: p.totals || {}, best: p.best || {} })
}

/* ---------- la porta, saltata ---------- */
await vaiGiu(piano.porta)
await page.waitForSelector('.sot-domanda', { timeout: 8000 })
await attendi(page, 450)                              // la finestra cieca del montaggio
const salta = page.locator('.sot-domanda [data-azione="salta"]')
controlla('la domanda della porta ha il suo «salta»', await salta.isVisible())
const prima = await foto()
await salta.click()
await page.waitForSelector('.sot-domanda', { state: 'detached', timeout: 5000 })
uguale('la porta si apre', await page.locator('.sot-domanda').count(), 0)
uguale('né ripasso, né monete, né contatori, né record: il profilo è identico', await foto(), prima)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('il tasto salta — la porta del sotterraneo')
