/* ═══════════════════════════════════════════════════════════════════
   LE ANTEPRIME 3D NEI PANNELLI (docs/sotterraneo/anteprime-3d.md)

   Nel Sotterraneo 3D lo zaino mostra la roba coi modelli 3D (la spada,
   lo scudo, l'armatura sul manichino) e il ritratto è l'eroe 3D vestito;
   anelli e collane hanno la loro figura 3D dove c'è (docs/sotterraneo/roba-3d.md), le pozioni restano sprite. Le caselle compaiono subito e
   le anteprime arrivano poco dopo, tutte; i `data-` di sempre restano.
   Nella fila dei turni l'eroe e i mostri sono 3D (anche la pianta, dal
   22 ottobre: nessuna specie resta sprite); una chiave senza modello vale
   null, e la vista tiene lo sprite. Nel Sotterraneo di sempre e con `#icone2d`
   niente cambia. `--scatti`: lo zaino e la fila.
   `node test/esegui.mjs sotterraneo-3d-anteprime`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi } from '../aiuto/browser.mjs'
import { uguale, controlla, nota, riassunto } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const roba = { v: 1, gemme: 0, zaino: [], mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }
async function entra(hash, tre = true) {
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await azzera(page)
  await page.setViewportSize({ width: 390, height: 844 })
  const a = { tappa: 1, libera: false, stelle: { 0: 3 }, missioni: {}, roba, terra: { nebbia: 'f'.repeat(768), dove: [55, 11], parlato: true } }
  await semina(page, { coins: 300, settings: { sperimentali: true },
    campagne: { sotterraneo: { tappa: 1, libera: false, stelle: { 0: 3 }, cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: a } } } } })
  await page.evaluate(h => { location.hash = h }, hash)
  if (tre) await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 30000 })
  else await page.waitForSelector('[data-tela="2d"]', { timeout: 30000 })
  await attendi(page, 2500)
}
const conta = sel => page.locator(sel).count()

/* ── lo zaino nel 3D ── */
await entra('sotterraneo3d=1&eroe=cavaliere&sotterraneo=roba&seme=11&dpr=1')
{
  const t0 = Date.now()
  await page.locator('[data-azione="zaino"]').first().click()
  await page.waitForSelector('[data-casella="mano"]', { timeout: 5000 })
  // le caselle ci sono subito, con lo sprite; poi arrivano le anteprime
  await page.waitForFunction(() => document.querySelectorAll('.sot-armato[data-anteprima="3d"]').length > 0
    && document.querySelector('[data-casella="mano"] [data-anteprima="3d"]'), null, { timeout: 15000 })
  nota(`le anteprime dello zaino in ${Date.now() - t0} ms (SwiftShader)`)
  const chiavi = await page.locator('[data-anteprima-chiave]').evaluateAll(es => es.map(e => e.dataset.anteprimaChiave))
  controlla('l\'arma in mano è il modello 3D', chiavi.some(k => k.startsWith('arma:')), chiavi.join(' '))
  controlla('lo scudo anche', chiavi.some(k => k.startsWith('scudo:')))
  controlla('e l\'armatura, su chi la porta', chiavi.some(k => /^armatura:\w+:\d:cavaliere:/.test(k)))
  const gioielli = await page.locator('[data-casella="dito"] [data-anteprima-chiave], [data-casella="collo"] [data-anteprima-chiave]').evaluateAll(es => es.map(e => e.dataset.anteprimaChiave))
  controlla('anelli e collane: la figura 3D o lo sprite', gioielli.every(k => k.startsWith('gioiello:')), gioielli.join(' '))
  controlla('il ritratto 3D lascia sotto lo sprite coi suoi segni', await conta('.sot-armato[data-anteprima="3d"] [data-in-mano]') === 1)
  const stato = await page.evaluate(() => window.__anteprime3d.stato())
  controlla('un renderer solo', stato.renderer === 1 && !stato.rotto, JSON.stringify(stato))
  await scatto(page, 'sotterraneo-3d-anteprime-zaino')
  // il ritratto della pagina dell'eroe
  await page.locator('[data-scheda="eroe"]').first().click().catch(() => {})
  await page.waitForSelector('[data-pagina-eroe]', { timeout: 5000 }).catch(() => {})
  await page.waitForFunction(() => document.querySelector('[data-pagina-eroe] .sot-armato[data-anteprima="3d"]'), null, { timeout: 10000 }).catch(() => {})
  uguale('la pagina dell\'eroe ha il ritratto 3D', await conta('[data-pagina-eroe] .sot-armato[data-anteprima="3d"]'), 1)
}

/* ── la fila dei turni ── */
await entra('sotterraneo3d=1&eroe=elfa&sotterraneo=branco&mostri=3&tipo=lupo,pianta&seme=11&dpr=1')
{
  await page.waitForSelector('[data-fila] [data-turno]', { timeout: 15000 })
  await page.waitForFunction(() => document.querySelector('[data-fila] [data-turno][data-chi="eroe"] [data-anteprima="3d"]')
    && [...document.querySelectorAll('[data-fila] [data-anteprima-chiave]')].some(e => e.dataset.anteprimaChiave.startsWith('mostro:lupo')), null, { timeout: 15000 })
  const chiavi = await page.locator('[data-fila] [data-anteprima-chiave]').evaluateAll(es => es.map(e => e.dataset.anteprimaChiave))
  controlla('l\'eroe a mezzo busto', chiavi.some(k => k.startsWith('busto:elfa:')), chiavi.join(' '))
  // la pianta ha il suo modello (poc/mostri-3d/varie.js): anche lei 3D nella fila
  await page.waitForFunction(() => [...document.querySelectorAll('[data-fila] [data-anteprima-chiave]')].some(e => e.dataset.anteprimaChiave.startsWith('mostro:pianta')), null, { timeout: 15000 })
    .then(() => controlla('la pianta ha il suo modello nella fila', true), () => controlla('la pianta ha il suo modello nella fila', false))
  // il ripiego: una specie che non c'è non ha immagine (null), e la vista terrebbe lo sprite
  uguale('una chiave senza modello vale null', await page.evaluate(() => window.__anteprime3d.chiedi('mostro:nessuno:comune').then(c => c)), null)
  await scatto(page, 'sotterraneo-3d-anteprime-fila')
}

/* ── il Sotterraneo di sempre e #icone2d: niente cambia ── */
await entra('sotterraneo=roba&giu=1&eroe=cavaliere&seme=11', false)
await page.locator('[data-azione="zaino"]').first().click()
await page.waitForSelector('[data-casella="mano"]', { timeout: 5000 })
await attendi(page, 1500)
uguale('nel 2D nessuna anteprima', await conta('[data-anteprima]'), 0)
await entra('sotterraneo3d=1&eroe=cavaliere&sotterraneo=roba&seme=11&dpr=1&icone2d')
await page.locator('[data-azione="zaino"]').first().click()
await page.waitForSelector('[data-casella="mano"]', { timeout: 5000 })
await attendi(page, 1500)
uguale('con #icone2d nessuna anteprima', await conta('[data-anteprima]'), 0)

uguale('nessun errore', errori.join(' · '), '')
await browser.close()
riassunto('le anteprime 3D nei pannelli')
