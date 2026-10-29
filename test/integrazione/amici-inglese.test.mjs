/* Gli amici sulla mappa del tesoro di English, dalla loro bacheca (docs/core/amici-nei-giochi.md): accanto alla tappa di ognuno il
   pallino e il nome, in cima chi è da raggiungere. La tappa è la prima non vinta nella fila dei mondi (le vinte stanno sotto l'id),
   cioè dove la nave del bambino si ferma la prima volta. Il gioco non ha una sfida senza fine: niente record. Finite tutte le
   tappe la mappa non ha un posto per la fine: solo la riga in cima. Gli amici sono già salvati sul telefono e il servizio non
   risponde: niente deve rompersi.
   `node test/esegui.mjs amici-inglese --niente-build` */
import { apriBrowser, apriGioco, semina, seminaAmici, amicoDiProva, attendi, scegli, scatto, TELEFONO } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { TAPPE } from '../../src/giochi/inglese/dati/mondi.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await page.addInitScript(() => { globalThis.__SERVIZIO_SFIDE__ = 'http://127.0.0.1:9' })
const veri = () => errori.filter(e => !/WebSocket connection|Failed to load resource|net::ERR|ERR_/.test(e))
const amico = (lettera, id, nome, fa, tappa) => amicoDiProva(lettera, id, nome, { fa, giochi: { inglese: { posti: tappa ? { '': tappa } : {}, primati: {} } } })
const testo = sel => page.locator(sel).first().textContent().then(t => t.replace(/\s+/g, ' ').trim())
const vinte = n => ({ vinte: Object.fromEntries(TAPPE.slice(0, n).map(t => [t.id, 1])), tappa: n, libera: false, stelle: {}, cfg: {} })
async function allaMappa() {
  await scegli(page, 'inglese')
  await page.waitForSelector('[data-mappa-inglese] [data-tappa]')
  await page.waitForSelector('[data-nave][data-porto]:not([data-porto=""])')
  await attendi(page, 300)
}
async function esci() {
  await page.click('button[aria-label="indietro"]')
  await page.waitForSelector('.carte')
}
const pallini = al => page.locator(`[data-amici-qui][data-al="${al}"] [data-pallino-amico]`).count()
// il centro (orizzontale) di una cosa sulla mappa
const centro = sel => page.locator(sel).first().evaluate(e => { const r = e.getBoundingClientRect(); return r.left + r.width / 2 })

/* ══════════ 1. a metà della mappa ══════════ */
await semina(page, { settings: { eta: 6.5 }, campagne: { inglese: vinte(3) } })
await seminaAmici(page, [
  amico('a', 'leonardo1', 'Leonardo', 0, 7),
  amico('b', 'melody001', 'Melody', 3, 3),
  amico('d', 'ugo000001', 'Ugo', 1, 7),
  amico('c', null, '', 0, 9),                               // mai incontrato online: senza nome non si vede
])
await allaMappa()
uguale('la nave del bambino è sulla tappa da fare', await page.locator('[data-nave]').getAttribute('data-porto'), 'tappa:' + TAPPE[3].id)
uguale('in cima chi è da raggiungere', await testo('[data-amico-davanti]'), 'Leonardo è 4 tappe più avanti di te.')
uguale('la riga in cima sta fuori da quello che scorre', await page.locator('[data-mappa-inglese] [data-amico-davanti]').count(), 0)
uguale('sulla tappa 7 due pallini', await pallini(7), 2)
uguale('e i nomi: Leonardo e Ugo', await testo('[data-amici-qui][data-al="7"]'), 'LULeonardo e Ugo sono qui')
uguale('sulla tappa del bambino, Melody', await testo('[data-amici-qui][data-al="3"]'), 'MMelody è qui')
uguale('tre pallini in tutto, non quello senza nome', await page.locator('[data-amici-qui] [data-pallino-amico]').count(), 3)
uguale('le altre tappe non hanno la riga', await page.locator('[data-amici-qui]').count(), 2)
uguale('nessun record: il gioco non ha una sfida senza fine', await page.locator('[data-record-amico], [data-record-amici]').count(), 0)
// lo stesso nodo del segno del bambino: il pallino di Melody sta sotto il tasto della tappa su cui è ferma la nave
const nodo = `[data-tappa="${TAPPE[3].id}"]`
controlla('il pallino di Melody è sotto la tappa della nave', Math.abs(await centro('[data-amici-qui][data-al="3"]') - await centro(nodo)) < 4)
await page.locator('[data-amici-qui][data-al="7"]').scrollIntoViewIfNeeded()
await scatto(page, 'amici-inglese-mappa')

/* ══════════ 2. uno è già in fondo, e la mappa non ha un posto per la fine ══════════ */
await esci()
await seminaAmici(page, [amico('a', 'leonardo1', 'Leonardo', 0, TAPPE.length)])
await allaMappa()
uguale('in cima chi è in fondo', await testo('[data-amico-davanti]'), 'Leonardo è già in fondo alla mappa.')
uguale('ma sulla mappa non ha un pallino', await page.locator('[data-amici-qui]').count(), 0)

/* ══════════ 3. mappa finita ══════════ */
await esci()
await semina(page, { settings: { eta: 6.5 }, campagne: { inglese: vinte(TAPPE.length) } })
await seminaAmici(page, [
  amico('a', 'leonardo1', 'Leonardo', 1, TAPPE.length),
  amico('b', 'melody001', 'Melody', 0, TAPPE.length - 1),
  amico('d', 'ugo000001', 'Ugo', 2, 0),                     // non ha fatto niente: non c'è
])
await allaMappa()
uguale('nessuno è più avanti di chi ha finito', await page.locator('[data-amico-davanti]').count(), 0)
uguale('Melody è sulla sua tappa', await pallini(TAPPE.length - 1), 1)
uguale('un pallino in tutto', await page.locator('[data-amici-qui] [data-pallino-amico]').count(), 1)

controlla('nessun errore, anche col servizio irraggiungibile', veri().length === 0, veri().join(' | '))
await browser.close()
riassunto('amici: la bacheca sulla mappa del tesoro di English')
