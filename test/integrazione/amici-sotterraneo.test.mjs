/* Gli amici sulla terra di sopra del Sotterraneo, dalla loro bacheca (docs/core/amici-nei-giochi.md): su ogni discesa il pallino di
   chi è arrivato lì e il suo nome nel fumetto, sull'abisso chi ha finito le sette; in cima chi è da raggiungere. Il gioco non ha una
   sfida senza fine: niente record. Gli amici sono già salvati sul telefono e il servizio non risponde: niente deve rompersi.
   La nebbia è già tolta (si cammina nella prova `sotterraneo-terra`): i pallini si vedono dove i posti sono trovati.
   `node test/esegui.mjs amici-sotterraneo --niente-build`
   tempo: 90 */
import { apriBrowser, apriGioco, azzera, semina, seminaAmici, amicoDiProva, attendi, scegli, scendiNelSotterraneo, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { QUANTE_TAPPE } from '../../src/giochi/sotterraneo/dati/campagna.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await page.addInitScript(() => { globalThis.__SERVIZIO_SFIDE__ = 'http://127.0.0.1:9' })
await azzera(page)
const veri = () => errori.filter(e => !/WebSocket connection|Failed to load resource|net::ERR|ERR_/.test(e))
const amico = (lettera, id, nome, fa, tappa) => amicoDiProva(lettera, id, nome, { fa, giochi: { sotterraneo: { posti: tappa ? { '': tappa } : {}, primati: {} } } })
const testo = sel => page.locator(sel).first().textContent().then(t => t.replace(/\s+/g, ' ').trim())
const stelle = n => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 3]))
const NEBBIA = 'f'.repeat(768)
const campagna = (tappa, libera = false) => ({ sotterraneo: { tappa, libera, stelle: stelle(tappa),
  cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa, libera, stelle: stelle(tappa), missioni: {},
    terra: { nebbia: NEBBIA, dove: [17, 41], parlato: true } } } } } })
async function allaTerra() {
  await scegli(page, 'sotterraneo')
  await page.waitForSelector('[data-terra]', { timeout: 8000 })
  await attendi(page, 500)
}
async function esci() {
  await page.click('button[aria-label="indietro"]')
  await page.waitForSelector('.carte')
}
const pallini = al => page.locator(`[data-amici-posto][data-al="${al}"] [data-pallino-amico]`).count()

/* ══════════ 1. a metà delle discese ══════════ */
await semina(page, { coins: 300, settings: { sperimentali: true }, campagne: campagna(2) })
await seminaAmici(page, [
  amico('a', 'leonardo1', 'Leonardo', 0, 4),
  amico('b', 'melody001', 'Melody', 3, 1),
  amico('d', 'ugo000001', 'Ugo', 1, 4),
  amico('e', 'dario0001', 'Dario', 2, QUANTE_TAPPE),
  amico('c', null, '', 0, 3),                               // mai incontrato online: senza nome non si vede
])
await allaTerra()
uguale('in cima chi è da raggiungere', await testo('[data-amico-davanti]'), 'Leonardo è 2 tappe più avanti di te.')
uguale('sulla discesa 4 due pallini', await pallini(4), 2)
uguale('sulla discesa che si è già fatta, Melody', await pallini(1), 1)
uguale('sull\'abisso, Dario', await pallini(QUANTE_TAPPE), 1)
uguale('quattro pallini in tutto, non quello senza nome', await page.locator('[data-amici-posto] [data-pallino-amico]').count(), 4)
uguale('le altre discese non ne hanno', await page.locator('[data-amici-posto]').count(), 3)
uguale('nessun record: il gioco non ha una sfida senza fine', await page.locator('[data-record-amico], [data-record-amici]').count(), 0)
uguale('la riga in cima sta fuori dalla mappa che scorre', await page.locator('.sot-terra-sopra [data-amico-davanti]').count(), 1)
// i pallini stanno ai piedi del posto della discesa, non altrove sulla mappa
for (const al of [1, 4]) {
  const d = await page.locator(`[data-amici-posto][data-al="${al}"]`).boundingBox(), p = await page.locator(`[data-discesa="${al}"]`).boundingBox()
  controlla(`i pallini della discesa ${al} sono ai piedi del suo posto`,
    d.x + d.width / 2 > p.x && d.x + d.width / 2 < p.x + p.width && d.y > p.y + p.height / 2 && d.y < p.y + p.height + 12,
    JSON.stringify({ d, p }))
}
await scendiNelSotterraneo(page, 1, { scendi: false })
uguale('nel fumetto della discesa, il nome', await testo('[data-fumetto] [data-amici-qui][data-al="1"]'), 'MMelody è qui')
await scatto(page, 'amici-sotterraneo-terra')

/* ══════════ 2. finite le sette discese: l'abisso ══════════ */
await esci()
await semina(page, { coins: 300, settings: { sperimentali: true }, campagne: campagna(QUANTE_TAPPE, true) })
await seminaAmici(page, [
  amico('a', 'leonardo1', 'Leonardo', 0, QUANTE_TAPPE),
  amico('b', 'melody001', 'Melody', 1, QUANTE_TAPPE - 1),
])
await allaTerra()
uguale('nessuno è più avanti di chi ha finito', await page.locator('[data-amico-davanti]').count(), 0)
uguale('Melody è sulla sua discesa', await pallini(QUANTE_TAPPE - 1), 1)
uguale('Leonardo è sull\'abisso', await pallini(QUANTE_TAPPE), 1)
await scendiNelSotterraneo(page, 'abisso', { scendi: false })
uguale('nel fumetto dell\'abisso, il nome', await testo('[data-fumetto] [data-amici-qui][data-al="' + QUANTE_TAPPE + '"]'), 'LLeonardo è qui')
await scatto(page, 'amici-sotterraneo-abisso')

/* ══════════ 3. uno è già all'abisso, e chi guarda no ══════════ */
await esci()
await semina(page, { coins: 300, settings: { sperimentali: true }, campagne: campagna(2) })
await seminaAmici(page, [amico('a', 'leonardo1', 'Leonardo', 0, QUANTE_TAPPE)])
await allaTerra()
uguale('in cima chi è all\'abisso', await testo('[data-amico-davanti]'), 'Leonardo è già all\'abisso.')

controlla('nessun errore, anche col servizio irraggiungibile', veri().length === 0, veri().join(' | '))
await browser.close()
riassunto('amici: la bacheca sulla terra di sopra del sotterraneo')
