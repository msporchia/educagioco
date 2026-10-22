/* ═══════════════════════════════════════════════════════════════════
   L'ELMO COME CASELLA SUA (docs/sotterraneo/elmo.md)

   Un salvataggio di prima (la roba senza `testa`) con un elmo cornuto in
   tasca. Nel Sotterraneo 3D lo zaino ha la settima casella, vuota con
   l'ombra; «Indossa» mette l'elmo in testa, la casella ha l'anteprima
   `copricapo:` e la difesa sale. Nel Sotterraneo di sempre le caselle
   restano sei finché in testa non c'è niente, e la settima compare solo
   indossandolo (con l'emoji). Il fabbro del 3D ha la linguetta «Elmi».
   `--scatti`: lo zaino 3D con l'elmo, il fabbro.
   `node test/esegui.mjs sotterraneo-elmo`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi } from '../aiuto/browser.mjs'
import { uguale, controlla, riassunto } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
// la roba di prima: niente `testa`, e l'elmo nello zaino
const roba = { v: 1, gemme: 0, zaino: ['elmo-cornuto'], mano: 'spada-corta', mancina: null, corpo: null, collo: null, dito: null, dito2: null, torcia: 0, torce: 0 }
async function entra(hash, tre) {
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await azzera(page)
  await page.setViewportSize({ width: 390, height: 844 })
  const a = { tappa: 1, libera: false, stelle: { 0: 3 }, missioni: {}, roba, terra: { nebbia: 'f'.repeat(768), dove: [55, 11], parlato: true } }
  await semina(page, { coins: 300, settings: { sperimentali: true },
    campagne: { sotterraneo: { tappa: 1, libera: false, stelle: { 0: 3 }, cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: a } } } } })
  await page.evaluate(h => { location.hash = h }, hash)
  if (tre) await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 30000 })
  else await page.waitForSelector('[data-tela="2d"]', { timeout: 30000 })
  await attendi(page, 2000)
}
const conta = sel => page.locator(sel).count()
const cosaIn = dove => page.locator(`[data-zaino] [data-casella="${dove}"]`).getAttribute('data-cosa')
const difesa = () => page.locator('[data-zaino] .sot-intorno-numeri').innerText().then(t => Number((/🛡️\s*(\d+)/.exec(t) || [])[1]))
async function indossaLaTasca(i) {
  await page.locator(`[data-zaino] [data-tasca="${i}"]`).click()
  await page.locator('[data-zaino] [data-azione="usa"]').click()
  await attendi(page, 400)
}

/* ── nel 3D ── */
await entra('sotterraneo3d=1&eroe=cavaliere&seme=11&dpr=1', true)
await page.locator('[data-azione="zaino"]').first().click()
await page.waitForSelector('[data-zaino] [data-casella="mano"]', { timeout: 5000 })
uguale('nel 3D le caselle sono sette', await conta('[data-zaino] [data-casella]'), 7)
uguale('la testa è vuota (il salvataggio di prima non l\'aveva)', await cosaIn('testa'), null)
uguale('e mostra cosa ci va', (await page.locator('[data-zaino] [data-casella="testa"]').innerText()).trim(), '🪖')
{
  const prima = await difesa()
  await indossaLaTasca(0)
  uguale('«Indossa» mette l\'elmo in testa', await cosaIn('testa'), 'elmo-cornuto')
  uguale('la difesa sale di uno', await difesa(), prima + 1)
  uguale('e la discesa lo sa', await page.evaluate(() => window.__sotterraneo3d.corsa.testa), 'elmo-cornuto')
  await page.waitForFunction(() => document.querySelector('[data-zaino] [data-casella="testa"] [data-anteprima="3d"]'), null, { timeout: 15000 }).catch(() => {})
  const k = await page.locator('[data-zaino] [data-casella="testa"] [data-anteprima-chiave]').getAttribute('data-anteprima-chiave').catch(() => null)
  controlla('la casella ha l\'anteprima del copricapo', /^copricapo:[\w-]+:c$/.test(k || ''), k)
  const b = await page.locator('[data-zaino] [data-casella]').evaluateAll(es => es.map(e => { const r = e.getBoundingClientRect(); return { d: e.dataset.casella, x: r.x, w: r.width, h: r.height } }))
  controlla('ogni casella si tocca col dito e sta nello schermo', b.every(c => c.w >= 44 && c.h >= 44 && c.x >= 0 && c.x + c.w <= 390), JSON.stringify(b))
  await scatto(page, 'sotterraneo-elmo-zaino-3d')
}

/* ── il fabbro del 3D ── */
await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
await azzera(page)
await page.evaluate(() => { location.hash = 'sotterraneo3d=mondo&eroe=cavaliere&bottega=armaiolo&livello=6&roba=nuda&gemme=800&scheda=elmi&dpr=1' })
await page.waitForSelector('[data-bottega]', { timeout: 30000 })
await attendi(page, 1500)
uguale('il fabbro ha la linguetta degli elmi', await conta('[data-bottega] [data-scheda="elmi"]'), 1)
{
  const pezzi = await page.locator('[data-bottega] [data-casella-pezzo]').evaluateAll(es => es.map(e => e.dataset.casellaPezzo))
  controlla('e sotto ci sono elmi', pezzi.length >= 5 && pezzi.every(k => /^(elmo|elmo-cornuto|cuffia)(@|$)/.test(k)), pezzi.join())
}
uguale('l\'eroe ha la settima casella anche qui', await conta('[data-bottega] [data-casella="testa"]'), 1)
await scatto(page, 'sotterraneo-elmo-fabbro')

/* ── nel Sotterraneo di sempre ── */
await entra('sotterraneo=1&giu=1&eroe=cavaliere&seme=11', false)
await page.locator('[data-azione="zaino"]').first().click()
await page.waitForSelector('[data-zaino] [data-casella="mano"]', { timeout: 5000 })
uguale('nel 2D le caselle restano sei', await conta('[data-zaino] [data-casella]'), 6)
await indossaLaTasca(0)
uguale('indossato, compare la casella della testa', await cosaIn('testa'), 'elmo-cornuto')
uguale('con la sua emoji', await conta('[data-zaino] [data-casella="testa"] [data-anteprima="3d"]'), 0)

controlla('nessun errore nella pagina', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('l\'elmo come casella sua, col dito')
