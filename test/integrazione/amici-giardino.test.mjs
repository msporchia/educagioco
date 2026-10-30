/* Gli amici sulla mappa del giardino, dalla loro bacheca (docs/core/amici-nei-giochi.md): sulla tappa di ognuno il pallino e
   il nome, in cima chi è da raggiungere. Il gioco non ha una sfida senza fine: niente record. Finite le tappe la mappa non ha un
   posto per la fine: chi c'è arrivato non ha un pallino, solo la riga in cima. Gli amici sono già salvati sul telefono e il servizio
   non risponde: niente deve rompersi.
   `node test/esegui.mjs amici-giardino --niente-build` */
import { apriBrowser, apriGioco, semina, seminaAmici, amicoDiProva, attendi, scegli, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { QUANTE_TAPPE } from '../../src/giochi/giardino/dati/campagna.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await page.addInitScript(() => { globalThis.__SERVIZIO_SFIDE__ = 'http://127.0.0.1:9' })
const veri = () => errori.filter(e => !/WebSocket connection|Failed to load resource|net::ERR|ERR_/.test(e))
const amico = (lettera, id, nome, fa, tappa) => amicoDiProva(lettera, id, nome, { fa, giochi: { giardino: { posti: tappa ? { '': tappa } : {}, primati: {} } } })
const testo = sel => page.locator(sel).first().textContent().then(t => t.replace(/\s+/g, ' ').trim())
const stelle = n => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 2]))
async function allaMappa() {
  await scegli(page, 'giardino')
  await page.waitForSelector('.gi-tappa[data-tappa="0"]')
  await attendi(page, 300)
}
async function esci() {
  await page.click('button[aria-label="indietro"]')
  await page.waitForSelector('.carte')
}
const pallini = al => page.locator(`[data-amici-qui][data-al="${al}"] [data-pallino-amico]`).count()

/* ══════════ 1. a metà della campagna ══════════ */
await semina(page, { settings: { eta: 9, sperimentali: true }, campagne: { giardino: { tappa: 2, libera: false, stelle: stelle(2), cfg: {} } } })
await seminaAmici(page, [
  amico('a', 'leonardo1', 'Leonardo', 0, 6),
  amico('b', 'melody001', 'Melody', 3, 2),
  amico('d', 'ugo000001', 'Ugo', 1, 6),
  amico('c', null, '', 0, 8),                               // mai incontrato online: senza nome non si vede
])
await allaMappa()
uguale('il segno del bambino è sulla tappa da fare', await page.locator('.gi-tappa.gi-adesso').getAttribute('data-tappa'), '2')
uguale('in cima chi è da raggiungere', await testo('[data-amico-davanti]'), 'Leonardo è 4 tappe più avanti di te.')
uguale('sulla tappa 6 due pallini', await pallini(6), 2)
uguale('sul nome: Leonardo e Ugo', await testo('[data-amici-qui][data-al="6"]'), 'LULeonardo e Ugo sono qui')
uguale('sulla tappa del bambino, Melody', await testo('[data-amici-qui][data-al="2"]'), 'MMelody è qui')
uguale('tre pallini in tutto, non quello senza nome', await page.locator('[data-amici-qui] [data-pallino-amico]').count(), 3)
uguale('le altre tappe non hanno la riga', await page.locator('[data-amici-qui]').count(), 2)
uguale('nessun record: il gioco non ha una sfida senza fine', await page.locator('[data-record-amico], [data-record-amici]').count(), 0)
await page.locator('.gi-tappa[data-tappa="6"]').scrollIntoViewIfNeeded()
await scatto(page, 'amici-giardino-mappa')

/* ══════════ 2. uno è già in fondo, e la mappa non ha un posto per la fine ══════════ */
await esci()
await seminaAmici(page, [amico('a', 'leonardo1', 'Leonardo', 0, QUANTE_TAPPE)])
await allaMappa()
uguale('in cima chi è in fondo', await testo('[data-amico-davanti]'), 'Leonardo è già in fondo al giardino.')
uguale('ma sulla mappa non ha un pallino', await page.locator('[data-amici-qui]').count(), 0)

/* ══════════ 3. campagna finita ══════════ */
await esci()
await semina(page, { settings: { eta: 9, sperimentali: true }, campagne: { giardino: { tappa: QUANTE_TAPPE, libera: true, stelle: stelle(QUANTE_TAPPE), cfg: {} } } })
await seminaAmici(page, [
  amico('a', 'leonardo1', 'Leonardo', 1, QUANTE_TAPPE),
  amico('b', 'melody001', 'Melody', 0, QUANTE_TAPPE - 1),
  amico('d', 'ugo000001', 'Ugo', 2, 0),                     // non ha fatto niente: non c'è
])
await allaMappa()
uguale('nessuno è più avanti di chi ha finito', await page.locator('[data-amico-davanti]').count(), 0)
uguale('Melody è sulla sua tappa', await pallini(QUANTE_TAPPE - 1), 1)
uguale('un pallino in tutto', await page.locator('[data-amici-qui] [data-pallino-amico]').count(), 1)

controlla('nessun errore, anche col servizio irraggiungibile', veri().length === 0, veri().join(' | '))
await browser.close()
riassunto('amici: la bacheca sulla mappa del giardino')
