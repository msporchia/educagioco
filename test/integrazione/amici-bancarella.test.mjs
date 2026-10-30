/* Gli amici sul giro del mondo della bancarella, dalla loro bacheca (docs/core/amici-nei-giochi.md): sulla città e sul banco della
   giornata di ognuno il pallino, il nome nel fumetto, in cima chi è da raggiungere; il Cairo è il posto di chi ha finito le sedici
   giornate. Niente record: il gioco non ha una sfida senza fine. Gli amici sono già salvati sul telefono e il servizio non
   risponde: niente deve rompersi.
   `node test/esegui.mjs amici-bancarella --niente-build` */
import { apriBrowser, apriGioco, semina, seminaAmici, amicoDiProva, attendi, scegli, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNE } from '../../src/data/bancarella.js'

const N = CAMPAGNE.length
const id = i => CAMPAGNE[i].id
const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await page.addInitScript(() => { globalThis.__SERVIZIO_SFIDE__ = 'http://127.0.0.1:9' })
const veri = () => errori.filter(e => !/WebSocket connection|Failed to load resource|net::ERR|ERR_/.test(e))
const amico = (lettera, chiave, nome, fa, tappa) =>
  amicoDiProva(lettera, chiave, nome, { fa, giochi: { bancarella: { posti: tappa ? { '': tappa } : {}, primati: {} } } })
const testo = sel => page.locator(sel).first().textContent().then(t => t.replace(/\s+/g, ' ').trim())
const mercato = (tappa, libera = false) => ({ tappa, libera, v: 2, stelle: {} })
async function alMondo() {
  await scegli(page, 'bancarella')
  await page.waitForSelector('[data-mondo] [data-citta]')
  await attendi(page, 400)
}
async function inCitta(c) {
  await page.locator(`[data-citta="${c}"]`).click()
  await page.waitForSelector(`[data-fumetto-per="${c}"]`)
  await attendi(page, 200)
}
async function entra(c) {
  await inCitta(c)
  await page.locator('[data-fumetto] [data-azione="entra"]').click()
  await page.waitForSelector(`[data-piazza][data-citta-di="${c}"]`)
  await attendi(page, 600)
}
async function apriBanco(g) {
  await page.locator(`[data-camp="${g}"]`).click()
  await page.waitForSelector(`[data-fumetto-per="${g}"]`)
  await attendi(page, 200)
}
async function esci() {
  if (await page.locator('[data-piazza]').count()) { await page.click('[data-azione="al-mondo"]'); await attendi(page, 300) }
  await page.click('button[aria-label="indietro"]')
  await page.waitForSelector('.carte')
}
const pallini = (sel, al) => page.locator(`${sel}[data-al="${al}"] [data-pallino-amico]`).count()
const centro = async sel => { const b = await page.locator(sel).first().boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } }

/* ══════════ 1. a metà del giro: il bambino è a Parigi (la 8ª giornata) ══════════ */
await semina(page, { mercato: mercato(7) })
await seminaAmici(page, [
  amico('a', 'leonardo1', 'Leonardo', 0, 8),                // l'ultimo banco di Parigi, ancora chiuso
  amico('b', 'melody001', 'Melody', 3, 7),                  // dov'è il bambino
  amico('d', 'ugo000001', 'Ugo', 1, 8),
  amico('e', 'zeno00001', 'Zeno', 2, 10),                   // la fiera, a New York: una città chiusa, si vede solo sul mondo
  amico('c', null, '', 0, 14),                              // mai incontrato online: senza nome non si vede
])
await alMondo()
uguale('l\'aereo è alla città da fare', await page.locator('[data-aereo]').getAttribute('data-al'), 'parigi')
uguale('in cima chi è da raggiungere', await testo('[data-amico-davanti]'), 'Leonardo è una tappa più avanti di te.')
controlla('la riga sta fuori dal mondo che scorre', await page.locator('[data-mondo] [data-amico-davanti]').count() === 0)
uguale('a Parigi i tre pallini, anche quello del bambino', await pallini('[data-amici-citta]', 'parigi'), 3)
uguale('a New York, chiusa, Zeno', await pallini('[data-amici-citta]', 'new-york'), 1)
uguale('quattro pallini in tutto, non quello senza nome', await page.locator('[data-amici-citta] [data-pallino-amico]').count(), 4)
uguale('e due città', await page.locator('[data-amici-citta]').count(), 2)
const tondo = await centro('[data-citta="new-york"]'), sotto = await centro('[data-amici-citta][data-al="new-york"]')
controlla('i pallini stanno sotto il nome della città', Math.abs(sotto.x - tondo.x) < 40 && sotto.y > tondo.y + 40 && sotto.y < tondo.y + 90, JSON.stringify({ tondo, sotto }))
await inCitta('new-york')
uguale('il nome nel fumetto della città chiusa', await testo('[data-fumetto] [data-amici-qui]'), 'ZZeno è qui')
await page.mouse.click(8, 760)
await attendi(page, 200)
await inCitta('parigi')
uguale('il nome nel fumetto di Parigi', await testo('[data-fumetto] [data-amici-qui]'), 'MLUMelody, Leonardo e Ugo sono qui')
await scatto(page, 'amici-bancarella-mondo')
await page.locator('[data-fumetto] [data-azione="entra"]').click()
await page.waitForSelector('[data-piazza][data-citta-di="parigi"]')
await attendi(page, 600)

/* il banco del bambino e il pallino di Melody: lo stesso nodo (la giornata «ora») */
uguale('il banco da fare è l\'ottavo giorno', await page.locator('[data-camp][data-stato="ora"]').getAttribute('data-camp'), id(7))
uguale('Melody è sul banco da fare', await pallini('[data-amici-banco]', id(7)), 1)
await page.waitForSelector('[data-carretto][data-in-viaggio="0"]', { timeout: 6000 })
uguale('il carretto è lì', await page.locator('[data-carretto]').getAttribute('data-al'), '1')
const posto = await page.locator(`[data-amici-banco][data-al="${id(7)}"]`).evaluate(e => e.parentElement.querySelector('[data-stato]').dataset.camp)
uguale('e il suo pallino sta nel posto del banco da fare', posto, id(7))
uguale('Leonardo e Ugo sull\'ultimo banco, chiuso', await pallini('[data-amici-banco]', id(8)), 2)
uguale('e nessun altro banco ne ha', await page.locator('[data-amici-banco]').count(), 2)
const banco = await centro(`[data-camp="${id(8)}"]`), pal = await centro(`[data-amici-banco][data-al="${id(8)}"]`)
controlla('sotto il suo banco', Math.abs(pal.x - banco.x) < 30 && pal.y > banco.y, JSON.stringify({ banco, pal }))
await apriBanco(id(7))
uguale('Melody nel fumetto', await testo('[data-fumetto] [data-amici-qui]'), 'MMelody è qui')
await apriBanco(id(8))
uguale('Leonardo e Ugo nel fumetto del banco chiuso', await testo('[data-fumetto] [data-amici-qui]'), 'LULeonardo e Ugo sono qui')
await scatto(page, 'amici-bancarella-banco')
await apriBanco(id(6))
uguale('un banco senza amici non ha la riga', await page.locator('[data-fumetto] [data-amici-qui]').count(), 0)

/* ══════════ 2. uno è già al Cairo ══════════ */
await esci()
await seminaAmici(page, [amico('a', 'leonardo1', 'Leonardo', 0, N)])
await alMondo()
uguale('in cima chi ha finito', await testo('[data-amico-davanti]'), 'Leonardo è già al mercato del Cairo.')
uguale('il pallino è al Cairo', await pallini('[data-amici-citta]', 'cairo'), 1)

/* ══════════ 3. giro finito ══════════ */
await esci()
await semina(page, { mercato: mercato(N, true) })
await seminaAmici(page, [
  amico('a', 'leonardo1', 'Leonardo', 1, N),
  amico('b', 'melody001', 'Melody', 0, N - 1),              // l'ultima giornata, a Tokyo
  amico('d', 'ugo000001', 'Ugo', 2, 0),                     // non ha fatto niente: non c'è
])
await alMondo()
uguale('nessuno è più avanti di chi ha finito', await page.locator('[data-amico-davanti]').count(), 0)
uguale('Melody è a Tokyo', await pallini('[data-amici-citta]', 'tokyo'), 1)
uguale('Leonardo al Cairo, dove si è anche il bambino', await pallini('[data-amici-citta]', 'cairo'), 1)
uguale('due pallini in tutto', await page.locator('[data-amici-citta] [data-pallino-amico]').count(), 2)
await entra('cairo')
uguale('Leonardo è sul banco libero, il posto dopo l\'ultima giornata', await pallini('[data-amici-banco]', 'libera'), 1)
uguale('e il bambino, che ha finito, è su quel banco: nessun segno da fare', await page.locator('[data-camp="libera"]').getAttribute('data-stato'), 'aperta')
await scatto(page, 'amici-bancarella-cairo')
uguale('nessun record: il gioco non ha una sfida senza fine', await page.locator('[data-record-amico], [data-record-amici]').count(), 0)

controlla('nessun errore, anche col servizio irraggiungibile', veri().length === 0, veri().join(' | '))
await browser.close()
riassunto('amici: la bacheca sul giro del mondo della bancarella')
