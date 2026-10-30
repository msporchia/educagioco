/* Gli amici sulle mappe di Passo passo, dalla loro bacheca (docs/core/amici-nei-giochi.md): una mappa per protagonista, il coniglio e
   il cane, ognuna coi suoi amici. In cima chi è da raggiungere, sotto la casella il pallino e nel fumetto il nome, sotto il
   sentiero senza fine i record di quella sfida e chi c'è senza. Gli amici sono già salvati sul telefono e il servizio non risponde:
   niente deve rompersi. La frase di fine serie la prova `unita/amici-bacheca`.
   `node test/esegui.mjs amici-passo --niente-build` */
import { apriBrowser, apriGioco, semina, seminaAmici, amicoDiProva, attendi, scegli, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { STRADE } from '../../src/giochi/passo-passo/motore/strade.js'
import { FILA_ATTUALE } from '../../src/giochi/passo-passo/dati/campagna.js'

const { coniglio, cane } = STRADE
const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await page.addInitScript(() => { globalThis.__SERVIZIO_SFIDE__ = 'http://127.0.0.1:9' })
const veri = () => errori.filter(e => !/WebSocket connection|Failed to load resource|net::ERR|ERR_/.test(e))
const amico = (lettera, id, nome, fa, posti, primati) => amicoDiProva(lettera, id, nome, { fa, giochi: { passo: { posti, primati } } })
const testo = sel => page.locator(sel).first().textContent().then(t => t.replace(/\s+/g, ' ').trim())
const testi = sel => page.$$eval(sel, l => l.map(e => e.textContent.replace(/\s+/g, ' ').trim()))
const casellaDi = (strada, posto) => `[data-mappa] [data-tappa="${strada[posto]}"]`
async function allaMappa() {
  await scegli(page, 'passo')
  await page.waitForSelector('[data-mappa] [data-tappa]', { timeout: 8000 })
  await attendi(page, 400)
}
const segnalinoAl = () => page.locator('[data-segnalino]').getAttribute('data-al')

/* ══════════ 1. il coniglio a metà della strada ══════════ */
await semina(page, { settings: { eta: 9 }, campagne: { passo: { tappa: 4, stelle: {}, cfg: { fila: FILA_ATTUALE } } } })
await seminaAmici(page, [
  amico('a', 'leonardo1', 'Leonardo', 0, { coniglio: 7 }, {}),
  amico('b', 'melody001', 'Melody', 3, { coniglio: 4 }, {}),
  amico('d', 'ugo000001', 'Ugo', 1, { coniglio: 7 }, {}),
  amico('c', null, '', 0, { coniglio: 9 }, {}),                // mai incontrato online: senza nome non si vede
])
await allaMappa()
uguale('il segnalino del coniglio sta sul suo posto 4', await segnalinoAl(), String(coniglio[4]))
uguale('in cima chi è da raggiungere', await testo('[data-amico-davanti]'), 'Leonardo è 3 tappe più avanti di te.')
uguale('sulla tappa 7 due pallini', await page.locator('[data-amici-casella][data-al="7"] [data-pallino-amico]').count(), 2)
uguale('sulla mia, Melody', await page.locator('[data-amici-casella][data-al="4"] [data-pallino-amico]').count(), 1)
uguale('un pallino per amico col nome, non per quello senza', await page.locator('[data-amici-casella] [data-pallino-amico]').count(), 3)
await page.locator(casellaDi(coniglio, 7)).click()
await page.waitForSelector('[data-fumetto]')
uguale('toccando la tappa il nome nel fumetto', await testo('[data-fumetto] [data-amici-qui]'), 'LULeonardo e Ugo sono qui')
await page.locator('[data-fumetto]').scrollIntoViewIfNeeded()
await scatto(page, 'amici-passo-coniglio')

/* ══════════ 2. il cane a due tappe, coi suoi record; il coniglio ai passi dopo i piccoli ══════════ */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carte')
const piccoli = coniglio.filter(i => i < cane[0])          // le tappe del coniglio fatte, prima che cominci il cane
const stelle = Object.fromEntries([...piccoli, ...cane.slice(0, 2)].map(i => [i, 1]))
await semina(page, { settings: { eta: 9 }, campagne: { passo: { tappa: 0, stelle, cfg: { fila: FILA_ATTUALE, ultima: cane[1] } } } })
await seminaAmici(page, [
  amico('a', 'leonardo1', 'Leonardo', 0, { cane: 5, coniglio: piccoli.length + 2 }, {}),
  amico('b', 'melody001', 'Melody', 3, { coniglio: coniglio.length }, { coniglio: 12 }),
  amico('d', 'ugo000001', 'Ugo', 1, { cane: cane.length }, { cane: 8 }),
  amico('e', 'sara000001', 'Sara', 1, { cane: cane.length, coniglio: coniglio.length }, {}),
  amico('f', 'dario00001', 'Dario', 2, {}, { cane: 4 }),    // un record e nessun posto
])
await allaMappa()
uguale('si apre sul cane, che ha giocato per ultimo', await page.locator('[data-mappa]').getAttribute('data-protagonista'), 'cane')
uguale('il segnalino del cane sta sul suo posto 2', await segnalinoAl(), String(cane[2]))
uguale('in cima chi è da raggiungere sulla sua strada', await testo('[data-amico-davanti]'), 'Leonardo è 3 tappe più avanti di te.')
uguale('un pallino solo: gli altri sono al sentiero o sull\'altra strada', await page.locator('[data-amici-casella] [data-pallino-amico]').count(), 1)
uguale('sulla tappa 5 del cane', await page.locator('[data-amici-casella][data-al="5"] [data-pallino-amico]').count(), 1)
uguale('i record del sentiero del cane, dal più alto', (await testi('.pp-sentiero-nome [data-record-amico]')).join(' | '), 'UUgo: 8 di fila | DDario: 4 di fila')
uguale('e chi c\'è senza record', await testo('.pp-sentiero-nome [data-amici-qui]'), 'SSara è qui')
await page.locator('.pp-sentiero-nome').scrollIntoViewIfNeeded()
await scatto(page, 'amici-passo-cane-sentiero')

// cambiando protagonista, la mappa e gli amici sono quelli giusti
await page.click('[data-scegli="coniglio"]')
await page.waitForSelector('[data-mappa][data-protagonista="coniglio"] [data-tappa]', { timeout: 8000 })
await attendi(page, 500)
uguale('il segnalino del coniglio sta sulla prima tappa dopo i piccoli', await segnalinoAl(), String(coniglio[piccoli.length]))
uguale('in cima chi è da raggiungere sulla strada del coniglio', await testo('[data-amico-davanti]'), 'Leonardo è 2 tappe più avanti di te.')
uguale('un pallino sulla sua tappa', await page.locator(`[data-amici-casella][data-al="${piccoli.length + 2}"] [data-pallino-amico]`).count(), 1)
uguale('i record del sentiero del coniglio', (await testi('.pp-sentiero-nome [data-record-amico]')).join(' | '), 'MMelody: 12 di fila')
uguale('e chi c\'è senza record', await testo('.pp-sentiero-nome [data-amici-qui]'), 'SSara è qui')
await page.locator('.pp-sentiero-nome').scrollIntoViewIfNeeded()
await scatto(page, 'amici-passo-coniglio-sentiero')

controlla('nessun errore, anche col servizio irraggiungibile', veri().length === 0, veri().join(' | '))
await browser.close()
riassunto('amici: la bacheca sulle mappe di Passo passo')
