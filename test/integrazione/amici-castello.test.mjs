/* Gli amici sul regno di Difendi il Castello, dalla loro bacheca (docs/core/amici-nei-giochi.md): sullo scudo di ognuno il pallino, il
   nome nel fumetto dello scudo, in cima chi è da raggiungere; a campagna finita al centro chi è alle partite libere senza record, e
   nel fumetto di ogni libera i record di quella sfida. Il servizio non risponde: gli amici sono già sul telefono e niente deve
   rompersi. `node test/esegui.mjs amici-castello --niente-build` */
import { apriBrowser, apriGioco, semina, seminaAmici, amicoDiProva, attendi, scegli, scatto, difendi } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { RACCONTO } from '../../src/data/campagne-castello.js'

const N = RACCONTO.length
const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await page.addInitScript(() => { globalThis.__SERVIZIO_SFIDE__ = 'http://127.0.0.1:9' })
const veri = () => errori.filter(e => !/WebSocket connection|Failed to load resource|net::ERR|ERR_/.test(e))
const amico = (lettera, id, nome, fa, tappa, primati = {}) =>
  amicoDiProva(lettera, id, nome, { fa, giochi: { torri: { posti: tappa ? { '': tappa } : {}, primati } } })
const testo = sel => page.locator(sel).first().textContent().then(t => t.replace(/\s+/g, ' ').trim())
async function alRegno() {
  await scegli(page, 'torri')
  await page.waitForSelector('.tappe')
  await attendi(page, 600)
}
async function apriFumetto(quale) {
  await page.locator(`[data-tappa="${quale}"]`).click()
  await page.waitForSelector('[data-fumetto]')
  await attendi(page, 300)
}
const centro = async sel => { const b = await page.locator(sel).first().boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } }

/* ══════════ 1. a metà della campagna ══════════ */
await semina(page, { settings: { eta: 10 }, td: { tappa: 5, libera: false, v: 2 } })
await seminaAmici(page, [
  amico('a', 'leonardo1', 'Leonardo', 0, 9),
  amico('b', 'melody001', 'Melody', 3, 5),
  amico('d', 'ugo000001', 'Ugo', 1, 9),
  amico('c', null, '', 0, 12),                              // mai incontrato online: senza nome non si vede
])
await alRegno()
uguale('il cavaliere sta sulla tappa da fare', await page.locator('[data-eroe]').getAttribute('data-dove'), '5')
uguale('in cima chi è da raggiungere', await testo('[data-amico-davanti]'), 'Leonardo è 4 tappe più avanti di te.')
controlla('la riga sta fuori dalla parte che si trascina', await page.locator('.banco [data-amico-davanti]').count() === 0)
uguale('sullo scudo 9 due pallini', await page.locator('[data-amici-scudo][data-al="9"] [data-pallino-amico]').count(), 2)
uguale('sotto il mio, Melody: lo stesso nodo del cavaliere', await page.locator('[data-amici-scudo][data-al="5"] [data-pallino-amico]').count(), 1)
uguale('un pallino per amico col nome, non per quello senza', await page.locator('[data-amici-scudo] [data-pallino-amico]').count(), 3)
const scudo = await centro('.tap[data-tappa="5"]'), sotto = await centro('[data-amici-scudo][data-al="5"]')
controlla('il pallino sta sotto il suo scudo', Math.abs(sotto.x - scudo.x) < 3 && sotto.y > scudo.y + 15 && sotto.y < scudo.y + 45, JSON.stringify({ scudo, sotto }))
uguale('nessuno è al centro', await page.locator('[data-amici-scudo][data-al="libere"]').count(), 0)
uguale('nessun record: le libere sono chiuse e nessuno ne ha', await page.locator('[data-record-amico]').count(), 0)
await apriFumetto('9')
uguale('il nome nel fumetto dello scudo 9', await testo('[data-fumetto] [data-amici-qui]'), 'LULeonardo e Ugo sono qui')
await scatto(page, 'amici-castello-scudo')
await page.locator('[data-tappa="5"]').click()
await attendi(page, 300)
uguale('e su quello dove c\'è Melody', await testo('[data-fumetto] [data-amici-qui]'), 'MMelody è qui')
await page.locator('[data-tappa="2"]').click()
await attendi(page, 300)
uguale('uno scudo senza amici non ha la riga', await page.locator('[data-fumetto] [data-amici-qui]').count(), 0)

/* ══════════ 2. campagna finita: i record sulle libere, gli altri al centro ══════════ */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carte')
await semina(page, { settings: { eta: 10 }, td: { tappa: N, libera: true, v: 2 } })
await seminaAmici(page, [
  amico('a', 'leonardo1', 'Leonardo', 0, N, { 'libera-bosco': 30, 'libera-mura': 12 }),
  amico('b', 'melody001', 'Melody', 0, N),                  // alle libere, ma non ha ancora un record
  amico('d', 'ugo000001', 'Ugo', 1, N - 1),                 // sull'ultimo scudo
  amico('e', 'zeno00001', 'Zeno', 2, 0),                    // non ha fatto niente: non c'è
])
await alRegno()
uguale('nessuno è più avanti di chi ha finito', await page.locator('[data-amico-davanti]').count(), 0)
uguale('Melody è al centro, una volta sola', await page.locator('[data-amici-scudo][data-al="libere"] [data-pallino-amico]').count(), 1)
uguale('Ugo è sul suo scudo', await page.locator(`[data-amici-scudo][data-al="${N - 1}"] [data-pallino-amico]`).count(), 1)
uguale('Leonardo è sui torrioni dove ha un record, non al centro', await page.locator('[data-amici-scudo][data-al^="libera-"] [data-pallino-amico]').count(), 2)
uguale('quattro gruppi in tutto: lo scudo di Ugo, i due torrioni e il centro', await page.locator('[data-amici-scudo]').count(), 4)
await page.locator('[data-amici-scudo][data-al="libere"]').scrollIntoViewIfNeeded()
await attendi(page, 300)
await scatto(page, 'amici-castello-centro')
const record = []
for (const q of ['libera-bosco', 'libera-sotterraneo', 'libera-mura', 'libera-palude']) {
  await apriFumetto(q)
  record.push({ record: await page.locator('[data-fumetto] [data-record-amico]').allTextContents(),
                qui: await page.locator('[data-fumetto] [data-amici-qui]').allTextContents() })
  await page.locator(`[data-tappa="${q}"]`).click()
  await attendi(page, 200)
}
controlla('il bosco dice il record di Leonardo', /Leonardo: 30/.test(record[0].record.join(' ')), JSON.stringify(record[0]))
controlla('e chi è alle libere senza un record lì', /Melody/.test(record[0].qui.join(' ')) && !/Leonardo/.test(record[0].qui.join(' ')), JSON.stringify(record[0]))
controlla('il sotterraneo non ha record, ma chi c\'è', record[1].record.length === 0 && /Leonardo.*Melody/.test(record[1].qui.join(' ')), JSON.stringify(record[1]))
controlla('le mura dicono il record di Leonardo', /Leonardo: 12/.test(record[2].record.join(' ')), JSON.stringify(record[2]))
uguale('Ugo, sull\'ultimo scudo, non è alle libere', record.filter(r => /Ugo/.test(r.qui.join(' '))).length, 0)
await apriFumetto('libera-bosco')
await scatto(page, 'amici-castello-libera')

/* ══════════ 3. a fine partita libera, contro i record ══════════ */
const perdi = daOnda => page.evaluate(async daOnda => {
  const attesa = ms => new Promise(r => setTimeout(r, ms))
  const T = window.__td
  T.scegliTorre('add')
  T.operazioneFinita({ errori: 0, ms: 900 })
  await attesa(100)
  T.velocita.value = 60
  if (daOnda) T.hud.onda = daOnda
  for (let giro = 0; giro < 600 && T.fase.value === 'gioco'; giro++) {
    if (T.regaloAperto.value) T.prendiRegalo('frecce')
    if (T.inAttesa.value) T.chiamaOnda()
    await attesa(25)
  }
  return T.fase.value
}, daOnda)
await page.locator('[data-tappa="libera-bosco"]').click()          // chiude il fumetto
await difendi(page, '[data-tappa="libera-mura"]')
await attendi(page, 300)
uguale('si cade', await perdi(20), 'fine')
const frase = await testo('[data-contro-amici]')
controlla('il cartello dice che Leonardo è stato superato (12 ondate)', /Hai superato Leonardo \(12 ondate\)/.test(frase), frase)
await scatto(page, 'amici-castello-fine')
controlla('e il record di prima c\'è ancora una frase sola', await page.locator('[data-contro-amici]').count() === 1)

controlla('nessun errore, anche col servizio irraggiungibile', veri().length === 0, veri().join(' | '))
await browser.close()
riassunto('amici: la bacheca sul regno di Difendi il Castello')
