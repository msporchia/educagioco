/* Gli amici sulla scheda del Robot, dalla loro bacheca (docs/core/amici-nei-giochi.md): sotto il led di ognuno il pallino, il nome
   nel fumetto quando si tocca il led, in cima chi è da raggiungere. Il gioco non ha una sfida senza fine: niente record. Gli amici
   sono già salvati sul telefono e il servizio non risponde: niente deve rompersi.
   `node test/esegui.mjs amici-costruttore --niente-build` */
import { apriBrowser, apriGioco, semina, seminaAmici, amicoDiProva, attendi, scegli, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { QUANTE_TAPPE, FILA_ATTUALE } from '../../src/giochi/costruttore/dati/campagna.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await page.addInitScript(() => { globalThis.__SERVIZIO_SFIDE__ = 'http://127.0.0.1:9' })
const veri = () => errori.filter(e => !/WebSocket connection|Failed to load resource|net::ERR|ERR_/.test(e))
const amico = (lettera, id, nome, fa, tappa) => amicoDiProva(lettera, id, nome, { fa, giochi: { costruttore: { posti: tappa ? { '': tappa } : {}, primati: {} } } })
const testo = sel => page.locator(sel).first().textContent().then(t => t.replace(/\s+/g, ' ').trim())
async function allaScheda() {
  await scegli(page, 'costruttore')
  await page.waitForSelector('[data-scheda-robot] [data-livello]', { timeout: 8000 })
  await attendi(page, 400)
}
async function nomeSu(livello) {
  await page.locator(`[data-livello="${livello}"]`).scrollIntoViewIfNeeded()
  await page.locator(`[data-livello="${livello}"]`).click()
  await page.waitForSelector('[data-fumetto]')
  await attendi(page, 300)
  return testo('[data-fumetto] [data-amici-qui]')
}

/* ══════════ 1. a metà della campagna ══════════ */
await semina(page, { settings: { eta: 10 }, campagne: { costruttore: { tappa: 4, libera: false,
  stelle: { 0: 2, 1: 2, 2: 1, 3: 2 }, cfg: { fila: FILA_ATTUALE } } } })
await seminaAmici(page, [
  amico('a', 'leonardo1', 'Leonardo', 0, 7),
  amico('b', 'melody001', 'Melody', 3, 4),
  amico('d', 'ugo000001', 'Ugo', 1, 7),
  amico('c', null, '', 0, 9),                               // mai incontrato online: senza nome non si vede
])
await allaScheda()
uguale('il robot sta sul livello da fare', await page.locator('[data-robot]').getAttribute('data-al'), '4')
uguale('in cima chi è da raggiungere', await testo('[data-amico-davanti]'), 'Leonardo è 3 tappe più avanti di te.')
uguale('sotto il led 7 due pallini', await page.locator('[data-amici-led][data-al="7"] [data-pallino-amico]').count(), 2)
uguale('sotto il mio, Melody', await page.locator('[data-amici-led][data-al="4"] [data-pallino-amico]').count(), 1)
uguale('un pallino per amico col nome, non per quello senza', await page.locator('[data-amici-led] [data-pallino-amico]').count(), 3)
uguale('nessun record: il gioco non ha una sfida senza fine', await page.locator('[data-record-amico]').count(), 0)
uguale('il nome nel fumetto del led 7', await nomeSu(7), 'LULeonardo e Ugo sono qui')
await scatto(page, 'amici-costruttore-led')
uguale('e su quello dove c\'è Melody', await nomeSu(4), 'MMelody è qui')
uguale('un led senza amici non ha la riga', await (async () => { await page.locator('[data-livello="2"]').click(); await attendi(page, 300); return page.locator('[data-fumetto] [data-amici-qui]').count() })(), 0)

/* ══════════ 2. campagna finita: gli amici al cantiere libero ══════════ */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carte')
await semina(page, { settings: { eta: 10 }, campagne: { costruttore: { tappa: QUANTE_TAPPE, libera: true,
  stelle: Object.fromEntries(Array.from({ length: QUANTE_TAPPE }, (_, i) => [i, 1])), cfg: { fila: FILA_ATTUALE } } } })
await seminaAmici(page, [
  amico('a', 'leonardo1', 'Leonardo', 1, QUANTE_TAPPE),
  amico('b', 'melody001', 'Melody', 0, QUANTE_TAPPE - 1),
  amico('d', 'ugo000001', 'Ugo', 2, 0),                     // non ha fatto niente: non c'è
])
await allaScheda()
uguale('nessuno è più avanti di chi ha finito', await page.locator('[data-amico-davanti]').count(), 0)
uguale('Leonardo è sotto il connettore', await page.locator('[data-amici-led][data-al="libero"] [data-pallino-amico]').count(), 1)
uguale('e Melody sotto il suo led', await page.locator(`[data-amici-led][data-al="${QUANTE_TAPPE - 1}"] [data-pallino-amico]`).count(), 1)
uguale('due pallini in tutto', await page.locator('[data-amici-led] [data-pallino-amico]').count(), 2)
await page.locator('[data-libero]').scrollIntoViewIfNeeded()
await page.locator('[data-libero]').click()
await page.waitForSelector('[data-fumetto]')
await attendi(page, 300)
uguale('il nome nel fumetto del cantiere libero', await testo('[data-fumetto] [data-amici-qui]'), 'LLeonardo è qui')
await scatto(page, 'amici-costruttore-libero')

controlla('nessun errore, anche col servizio irraggiungibile', veri().length === 0, veri().join(' | '))
await browser.close()
riassunto('amici: la bacheca sulla scheda del Robot')
