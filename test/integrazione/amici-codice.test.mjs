/* Gli amici sulla mappa del Codice Segreto, dalla loro bacheca (docs/core/amici-nei-giochi.md): sulla tappa di ognuno il pallino e
   il nome, in cima chi è da raggiungere, sotto il gioco libero i loro record dal più alto e chi c'è senza record. Gli amici sono
   già salvati sul telefono e il servizio non risponde: niente deve rompersi. La frase di fine fila la prova `unita/amici-bacheca`.
   `node test/esegui.mjs amici-codice --niente-build` */
import { apriBrowser, apriGioco, semina, seminaAmici, amicoDiProva, attendi, scegli, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { QUANTE_TAPPE } from '../../src/giochi/codice-segreto/dati/campagna.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await page.addInitScript(() => { globalThis.__SERVIZIO_SFIDE__ = 'http://127.0.0.1:9' })
const veri = () => errori.filter(e => !/WebSocket connection|Failed to load resource|net::ERR|ERR_/.test(e))
const amico = (lettera, id, nome, fa, tappa, record) => amicoDiProva(lettera, id, nome, { fa, giochi: { codice: { posti: tappa ? { '': tappa } : {}, primati: record ? { '': record } : {} } } })
const testo = sel => page.locator(sel).first().textContent().then(t => t.replace(/\s+/g, ' ').trim())
async function allaMappa() {
  await scegli(page, 'codice')
  await page.waitForSelector('.cs-mappa', { timeout: 5000 })
  await attendi(page, 200)
}

/* ══════════ 1. a metà della campagna ══════════ */
await semina(page, { settings: { eta: 9 }, campagne: { codice: { tappa: 2, libera: false, stelle: { 0: 1, 1: 1 }, cfg: {} } } })
await seminaAmici(page, [
  amico('a', 'leonardo1', 'Leonardo', 0, 5, 0),
  amico('b', 'melody001', 'Melody', 3, 2, 0),
  amico('d', 'ugo000001', 'Ugo', 1, 5, 0),
  amico('c', null, '', 0, 7, 0),                            // mai incontrato online: senza nome non si vede
])
await allaMappa()
uguale('in cima chi è da raggiungere', await testo('[data-amico-davanti]'), 'Leonardo è 3 tappe più avanti di te.')
uguale('sulla tappa 5 tutti e due, col nome', await testo('[data-amici-qui][data-al="5"]'), 'LULeonardo e Ugo sono qui')
uguale('sulla mia, Melody', await testo('[data-amici-qui][data-al="2"]'), 'MMelody è qui')
uguale('un pallino per amico col nome, non per quello senza', await page.locator('[data-amici-qui] [data-pallino-amico]').count(), 3)
uguale('e nessuno al gioco libero', await page.locator('[data-record-amico]').count(), 0)
await page.locator('[data-amici-qui][data-al="5"]').scrollIntoViewIfNeeded()
await scatto(page, 'amici-codice-tappe')

/* ══════════ 2. campagna finita: i record del gioco libero ══════════ */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carte')
await semina(page, { settings: { eta: 9 }, campagne: { codice: { tappa: QUANTE_TAPPE, libera: true, stelle: {}, cfg: {},
  primato: { best: 5, quando: 1, partite: 3, ultime: [] } } } })
await seminaAmici(page, [
  amico('a', 'leonardo1', 'Leonardo', 1, QUANTE_TAPPE, 12),
  amico('b', 'melody001', 'Melody', 0, QUANTE_TAPPE, 0),
  amico('d', 'ugo000001', 'Ugo', 2, QUANTE_TAPPE, 8),
])
await allaMappa()
uguale('nessuno è più avanti di chi è al gioco libero', await page.locator('[data-amico-davanti]').count(), 0)
const righe = await page.$$eval('[data-record-amico]', l => l.map(e => e.textContent.replace(/\s+/g, ' ').trim()))
uguale('sotto il gioco libero i record degli amici, dal più alto', righe.join(' | '), 'LLeonardo: 12 di fila | UUgo: 8 di fila')
uguale('e chi c\'è senza record', await testo('[data-amici-qui][data-al="libero"]'), 'MMelody è qui')
controlla('il mio record resta sul tasto', /record 5/.test(await testo('[data-tappa="libero"]')))
await page.locator('[data-record-amico]').first().scrollIntoViewIfNeeded()
await scatto(page, 'amici-codice-libero')

controlla('nessun errore, anche col servizio irraggiungibile', veri().length === 0, veri().join(' | '))
await browser.close()
riassunto('amici: la bacheca sulla mappa del Codice Segreto')
