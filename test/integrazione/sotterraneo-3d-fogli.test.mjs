/* ═══════════════════════════════════════════════════════════════════
   UN FOGLIO DELL'ESPLORAZIONE NON MUOVE LA SCENA
   (docs/sotterraneo/grafica-3d.md, «I fogli sono un velo»)

   Nel Sotterraneo 3D la porta, il forziere, la fonte aprono un foglio che sta sopra la scena: la telecamera non si sposta e
   non cambia zoom, né aprendolo né chiudendolo (l'utente, 16 ottobre 2026: «è più un overlay»). Si misura dove cade a
   schermo un punto del mondo (`aSchermo`) prima, durante e dopo la domanda di una porta: lo stesso, a mezzo pixel. Nello
   scontro invece la telecamera alza i combattenti sopra il pannello, come prima.
   `node test/esegui.mjs sotterraneo-3d-fogli`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi } from '../aiuto/browser.mjs'
import { uguale, controlla, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const roba = { v: 1, gemme: 0, zaino: [], mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }
async function entra(hash) {
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await azzera(page)
  await page.setViewportSize({ width: 390, height: 844 })
  const a = { tappa: 1, libera: false, stelle: { 0: 3 }, missioni: {}, roba, terra: { nebbia: 'f'.repeat(768), dove: [55, 11], parlato: true } }
  await semina(page, { coins: 300, settings: { sperimentali: true },
    campagne: { sotterraneo: { tappa: 1, libera: false, stelle: { 0: 3 }, cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: a } } } } })
  await page.evaluate(h => { location.hash = h }, hash)
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 30000 })
  await attendi(page, 4000)   // la telecamera arriva morbida e si ferma
}
// dove cade a schermo la cella dell'eroe e un punto a tre celle: se la telecamera si muove o cambia zoom, cambiano
const dove = () => page.evaluate(() => {
  const s3 = window.__sotterraneo3d, e = s3.corsa.eroe
  return [...s3.aSchermo(e.x, 0, e.y), ...s3.aSchermo(e.x + 3, 0, e.y - 2)]
})
const scarto = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])))
// SwiftShader fa pochi fotogrammi al secondo e la telecamera ci arriva morbida: si aspetta che stia ferma
async function ferma() {
  let a = await dove()
  for (let i = 0; i < 40; i++) { await attendi(page, 700); const b = await dove(); if (scarto(a, b) < 0.05) return b; a = b }
  return a
}

/* ── la porta: prima, con la domanda aperta, dopo ── */
// il pixel ratio fisso: quello che si adatta ai fotogrammi lenti di SwiftShader cambierebbe la scala da sé
await entra('sotterraneo=0&seme=11&stanza=sala&dpr=1')
{
  const prima = await ferma()
  const c = await page.evaluate(() => {
    const c = window.__sotterraneo3d.corsa, p = c.livello.robe.find(r => r.che === 'porta' && !r.aperta)
    c.interagisci(p)
    return !!c.foglio
  })
  controlla('la porta apre il suo foglio', c)
  await page.waitForSelector('.sot-foglio .sot-domanda .qz-tasto', { timeout: 10000 })
  const durante = await ferma()
  await scatto(page, 'sotterraneo-3d-fogli-domanda')
  await page.locator('.sot-domanda .qz-tasto[data-giusta]').first().click()
  await page.waitForFunction(() => !window.__sotterraneo3d.corsa.foglio, null, { timeout: 10000 })
  const dopo = await ferma()
  nota(`a schermo: prima ${prima.map(Math.round)}, con la domanda ${durante.map(Math.round)}, dopo ${dopo.map(Math.round)}`)
  dentro('con la domanda aperta la scena non si muove (px)', scarto(prima, durante), 0, 0.5)
  dentro('e chiusa nemmeno', scarto(prima, dopo), 0, 0.5)
}

/* ── lo scontro: lì la telecamera alza i combattenti sopra il pannello, come prima ── */
await entra('sotterraneo=0&seme=11&stanza=sala&sotterraneo=branco&mostri=2&tipo=ratto')
{
  await page.waitForSelector('[data-pannello3d]', { timeout: 15000 })
  await attendi(page, 4000)
  const sp = await page.evaluate(() => {
    const p = document.querySelector('[data-pannello3d]').getBoundingClientRect(), c = document.querySelector('[data-tela="3d"]').getBoundingClientRect()
    const s3 = window.__sotterraneo3d, st = s3.palco.stati[0], e = s3.aSchermo(st.x, 0, st.z)
    return { piede: c.y + e[1], pannello: p.top }
  })
  controlla('nello scontro i combattenti stanno sopra il pannello', sp.piede < sp.pannello, JSON.stringify(sp))
}

uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('i fogli del sotterraneo 3d')
