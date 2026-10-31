/* ═══════════════════════════════════════════════════════════════════
   LA PERGAMENA DEL PORTALE, COL DITO
   (docs/sotterraneo/portale-e-sosta.md, «La pergamena del portale»)

   Sul mondo di sopra l'incantatrice non vende pergamene finché non le si è riportato il quaderno; dopo sì, e la si
   compra dal suo banco (l'eroe ci va col salto delle prove, `__mondo3d.vai`). Giù la si apre dallo zaino: accanto
   all'eroe si accende un portale, lo si tocca e si sale nel mondo di sopra, dove c'è il gemello; dal gemello si torna
   giù nel punto di prima, col portale della pergamena ancora aperto, e da lì si risale gratis. Console pulita.
   `node test/esegui.mjs sotterraneo-pergamena`
   tempo: 480
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, finestraFerma, nelDialogo, compraNellaBottega,
         allaLinguettaDi, leggiProfilo, toccaNelMondo, mondoPronto, scendiNelSotterraneo } from '../aiuto/browser.mjs'
import { uguale, controlla, riassunto } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { PREZZO_PERGAMENA } from '../../src/giochi/sotterraneo/dati/cose.js'

const P = 'pergamena-portale'
const GEMME = 100
const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
async function toccaIl(sel) {
  await finestraFerma(page)
  const b = await page.locator(sel).first().boundingBox()
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}
const avventura = async () => (await leggiProfilo(page)).campagne.sotterraneo.cfg.avventure.cavaliere

// l'eroe va (salto delle prove) accanto all'incantatrice e la tocca: il fumetto del pensiero dell'eroe fermo può coprirla e prendere il
// tocco, e allora si riporta l'eroe lì e si riprova
async function daLei() {
  for (let giro = 0; giro < 5; giro++) {
    await page.evaluate(() => { window.__mondo3d.senzaMostri(); window.__mondo3d.vai('mercante:villaggio:incantatrice') })
    let uguali = 0, ultimo = ''   // la telecamera arriva morbida: tre letture uguali di fila, a mezzo secondo
    for (let i = 0; i < 60 && uguali < 3; i++) {
      await attendi(page, 500)
      const b = await page.locator('[data-mercante="incantatrice"]').first().boundingBox().catch(() => null)
      const ora = b ? `${Math.round(b.x)},${Math.round(b.y)}` : ''
      uguali = ora && ora === ultimo ? uguali + 1 : 0
      ultimo = ora
    }
    await page.waitForSelector('[data-pensiero]', { state: 'detached', timeout: 20000 }).catch(() => {})
    await toccaNelMondo(page, '[data-mercante="incantatrice"][data-citta="villaggio"]', { tocca })
    if (await page.waitForSelector('[data-dialogo]', { timeout: 12000 }).then(() => true).catch(() => false)) return
  }
}

// sul mondo di sopra, accanto all'incantatrice
async function sopra(missioni) {
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await azzera(page)
  await page.setViewportSize({ width: 390, height: 844 })
  // una spada e una torcia in tasca: senza, l'eroe fermo pensa al fabbro o alla guaritrice (con cento gemme)
  const roba = { v: 1, gemme: GEMME, zaino: [], mano: 'spada', mancina: null, corpo: 'corazza', dito: null, torcia: 0, torce: 3 }
  await semina(page, { coins: 300, settings: { sperimentali: true },
    campagne: { sotterraneo: { tappa: 2, libera: false, stelle: { 0: 3, 1: 3 }, cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: {
      tappa: 2, libera: false, stelle: { 0: 3, 1: 3 }, missioni, roba, mondo: { parlato: true } } } } } } })
  await scegli(page, 'sotterraneo')
  await mondoPronto(page)
  await attendi(page, 600)
  await daLei()
}

/* ── prima del quaderno: lei lo chiede, e le pergamene non le vende ── */
await sopra({})
{
  await page.waitForSelector('[data-dialogo]', { timeout: 10000 })
  controlla('l\'incantatrice ha la missione del quaderno (il segno sopra la testa)', (await page.locator('[data-mercante="incantatrice"][data-segno]').count()) === 1)
  await nelDialogo(page, '[data-scelta="bottega"]', { tocca: toccaIl })
  await page.waitForSelector('[data-chiudi]', { timeout: 10000 })
  await attendi(page, 500)
  uguale('e prima del quaderno le pergamene non si vendono', await allaLinguettaDi(page, P, { tocca }), false)
}

/* ── dopo il quaderno: si compra ── */
await sopra({ quaderno: 'consegnata' })
{
  await nelDialogo(page, '[data-scelta="bottega"]', { tocca: toccaIl })
  await page.waitForSelector('[data-chiudi]', { timeout: 10000 })
  await attendi(page, 500)
  await compraNellaBottega(page, P, { tocca })
  await scatto(page, 'sotterraneo-pergamena-bottega')
  await toccaIl('[data-chiudi]')
  await attendi(page, 800)   // la bottega chiusa scrive l'avventura
  const a = await avventura()
  uguale('comprata: è nello zaino', a.roba.zaino.filter(k => k === P).length, 1)
  uguale('e costa il suo prezzo', a.roba.gemme, GEMME - PREZZO_PERGAMENA)
}

/* ── giù, nel 3D: dallo zaino si apre il portale, e si sale ── */
await page.evaluate(() => { location.hash = 'sotterraneo&seme=11&stanza=sala&torcia=accesa&dpr=1' })
await scendiNelSotterraneo(page, 1, { tocca })
await page.waitForSelector('[data-tela="3d"]', { timeout: 20000 })
await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.corsa && window.__sotterraneo3d.grafica().figure > 0 && !window.__sotterraneo3d.grafica().mondo, null, { timeout: 30000 })
await attendi(page, 3000)
let dove = null
{
  await toccaIl('[data-azione="zaino"]')
  await toccaIl(`[data-tasca][data-cosa="${P}"]`)
  await page.waitForSelector('[data-azione="usa"]', { timeout: 5000 })
  uguale('nello zaino dice cosa fa', (await page.locator('[data-azione="usa"]').innerText()).trim(), 'Apri il portale')
  await toccaIl('[data-azione="usa"]')
  await attendi(page, 2500)   // il varco si accende dal basso
  const r = await page.evaluate(() => { const c = window.__sotterraneo3d.corsa, p = c.portaleDellaPergamena; return p ? { x: p.x, y: p.y, eroe: { ...c.eroe } } : null })
  controlla('accanto all\'eroe si è aperto un portale', !!r)
  dove = r
  await scatto(page, 'sotterraneo-pergamena-portale')
  const [sx, sy] = await page.evaluate(([x, y]) => window.__sotterraneo3d.aSchermo(x + 0.5, 0.6, y + 0.5), [r.x, r.y])
  const b = await page.locator('[data-tela="3d"]').boundingBox()
  await tocca(b.x + sx, b.y + sy)
  await page.waitForSelector('[data-azione="portale"]', { timeout: 15000 })
  await toccaIl('[data-azione="portale"]')
  await page.waitForSelector('[data-mondo3d]', { timeout: 20000 })
  uguale('la pergamena è spesa', (await avventura()).roba.zaino.filter(k => k === P).length, 0)
}

/* ── su, dal gemello si torna giù nel punto di prima, e il portale della pergamena è ancora lì ── */
{
  await toccaNelMondo(page, '[data-portale]', { tocca })
  await page.waitForSelector('[data-fumetto-di="portale"] [data-azione="portale-giu"]', { timeout: 30000 })
  await toccaIl('[data-fumetto-di="portale"] [data-azione="portale-giu"]')
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.corsa && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 30000 })
  await attendi(page, 2500)
  const r = await page.evaluate(() => { const c = window.__sotterraneo3d.corsa, p = c.portaleDellaPergamena; return { p: p ? { x: p.x, y: p.y } : null, eroe: { ...c.eroe } } })
  uguale('tornati giù dove si era', `${r.eroe.x},${r.eroe.y}`, `${dove.eroe.x},${dove.eroe.y}`)
  controlla('e il portale della pergamena è ancora aperto', r.p && r.p.x === dove.x && r.p.y === dove.y)
  // si risale da lì, senza un'altra pergamena (che non c'è)
  await page.evaluate(() => { const c = window.__sotterraneo3d.corsa; c.interagisci(c.portaleDellaPergamena) })
  await page.waitForSelector('[data-azione="portale"]', { timeout: 10000 })
  await toccaIl('[data-azione="portale"]')
  await page.waitForSelector('[data-mondo3d]', { timeout: 20000 })
  controlla('e si risale gratis', true)
}

uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('la pergamena del portale')
