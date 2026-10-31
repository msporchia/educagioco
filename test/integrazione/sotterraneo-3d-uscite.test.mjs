/* ═══════════════════════════════════════════════════════════════════
   LE USCITE DAL SOTTERRANEO 3D, SENZA ERRORI
   (docs/sotterraneo/grafica-3d.md, «Uscire dal 3D»)

   Il portale si attraversa col dito: il velo lampeggia, l'eroe ci si stringe dentro, e a fotogramma finito il gioco
   torna sopra buttando il 3D della discesa. Prima il ciclo di disegno continuava dopo aver buttato il piano
   («O is null», `piano.sorgenti`). Qui: il portale (e sopra niente carta «torno giù»: si riprende dall'ingresso), la scala che sale del primo piano («lascio perdere») e lo
   svenimento all'ultima occasione (il cartello di fine, poi «esci»); ogni volta si arriva sopra, il 3D non c'è più e la console è pulita.
   `node test/esegui.mjs sotterraneo-3d-uscite`
   tempo: 120
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, finestraFerma, scendiNelSotterraneo } from '../aiuto/browser.mjs'
import { uguale, controlla, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'

const DISCESA = 1
const roba = { v: 1, gemme: 0, zaino: [], mano: null, mancina: null, corpo: 'corazza', dito: null, torcia: 0, torce: 0 }
// un seme col portale al primo piano e nessun mostro nella sua stanza
let SEME = null
for (let s = 1; s <= 120 && SEME == null; s++) {
  const L = new Corsa(CAMPAGNA[DISCESA], { seme: s, eroe: 'cavaliere', roba }).livello
  const p = L.robe.find(r => r.che === 'portale'), sala = p && L.stanzaDi(p.x, p.y)
  if (sala && !L.robe.some(r => r.che === 'mostro' && L.stanzaDi(r.x, r.y) === sala)) SEME = s
}
controlla('c\'è un seme col portale in una stanza senza mostri', SEME != null)

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
async function entra(hash) {
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await azzera(page)
  await page.setViewportSize({ width: 390, height: 844 })
  const a = { tappa: DISCESA, libera: false, stelle: { 0: 3 }, missioni: {}, roba, terra: { nebbia: 'f'.repeat(768), dove: [55, 11], parlato: true } }
  await semina(page, { coins: 300, settings: { sperimentali: true },
    campagne: { sotterraneo: { tappa: DISCESA, libera: false, stelle: { 0: 3 }, cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: a } } } } })
  await page.evaluate(h => { location.hash = h }, hash)
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 30000 })
  await attendi(page, 2500)   // la telecamera arriva morbida
}
// sopra: il mondo di sopra (in 3D anche lui, col Sotterraneo 3D), e nessuna tela della discesa rimasta
async function sopra(chi) {
  await page.waitForSelector('[data-mondo3d], [data-terra]', { timeout: 60000 })   // l'eroe 3D del mondo compila i suoi shader al primo fotogramma: in SwiftShader sono secondi
  await attendi(page, 800)
  uguale(`${chi}: si arriva sopra, senza la discesa in 3D`, await page.locator('[data-tela="3d"]').count(), 0)
  uguale(`${chi}: nessun errore in console`, errori.splice(0).join(' | '), '')
}

/* ── il portale, toccato col dito ── */
// con la torcia il portale a tre celle è in luce, quindi si tocca (al buio il dito porterebbe sulla sua cella e basta)
await entra(`sotterraneo3d=${DISCESA}&seme=${SEME}&stanza=al-portale&torcia=accesa`)
{
  const p = await page.evaluate(() => { const c = window.__sotterraneo3d.corsa, r = c.livello.robe.find(q => q.che === 'portale'); return [r.x, r.y] })
  const [sx, sy] = await page.evaluate(([x, y]) => window.__sotterraneo3d.aSchermo(x + 0.5, 0.3, y + 0.5), p)
  const b = await page.locator('[data-tela="3d"]').boundingBox()
  await tocca(b.x + sx, b.y + sy)
  await page.waitForSelector('[data-azione="portale"]', { timeout: 15000 })
  await scatto(page, 'sotterraneo-3d-uscite-portale')
  await toccaIl('[data-azione="portale"]')
  await sopra('dal portale')
  // sopra niente carta che propone di tornare: la sosta si riprende dall'ingresso dello stesso dungeon (docs/sotterraneo/portale-e-sosta.md)
  uguale('dal portale: in cima niente carta «torno giù»', await page.locator('[data-ripresa]').count(), 0)
  await scendiNelSotterraneo(page, DISCESA, { tocca, scendi: false })
  uguale('l\'ingresso dello stesso dungeon dice «riprendo da dove ero»', await page.locator('[data-fumetto] [data-azione="scendi"][data-sosta]').count(), 1)
  await toccaIl('[data-fumetto] [data-azione="scendi"]')
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.corsa && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 30000 })
  uguale('e non chiede di lasciar perdere niente', await page.locator('[data-chiede]').count(), 0)
  const d = await page.evaluate(([x, y]) => { const e = window.__sotterraneo3d.corsa.eroe; return Math.hypot(e.x - x - 0.5, e.y - y - 0.5) }, p)
  controlla('si riprende accanto al portale di prima', d < 3, d.toFixed(2))
  uguale('ripreso dall\'ingresso: nessun errore in console', errori.splice(0).join(' | '), '')
}

/* ── la scala che sale del primo piano: «lascio perdere» ── */
await entra(`sotterraneo3d=${DISCESA}&seme=${SEME}&stanza=al-scala-su`)
{
  await page.evaluate(() => { const c = window.__sotterraneo3d.corsa; c.interagisci(c.livello.robe.find(q => q.che === 'scala-su')) })
  await page.waitForSelector('[data-azione="scorda-si"]', { timeout: 10000 })
  await toccaIl('[data-azione="scorda-si"]')
  await sopra('dalla scala che sale')
}

/* ── svenuti all'ultima occasione: si torna su ── */
await entra(`sotterraneo3d=${DISCESA}&seme=${SEME}&stanza=sala`)
{
  // le occasioni prima dell'ultima si spendono nel motore (ci si rialza all'ingresso, sempre giù); l'ultima col dito
  const prove = await page.evaluate(() => {
    const c = window.__sotterraneo3d.corsa
    let n = 0
    for (; n < 12; n++) { c.svieni(); if (c.foglio.ultimo) break; c.riprendi() }
    return n
  })
  controlla('si arriva all\'ultima occasione', prove < 12, String(prove))
  await page.waitForSelector('[data-azione="riprendi"]', { timeout: 10000 })
  await toccaIl('[data-azione="riprendi"]')
  // il cartello di fine, poi «esci»
  await page.waitForSelector('[data-fine="esci"]', { timeout: 10000 })
  await toccaIl('[data-fine="esci"]')
  await sopra('dallo svenimento')
}

await browser.close()
riassunto('le uscite dal sotterraneo 3d')
