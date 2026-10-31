/* Gli amici nel mondo di sopra del Sotterraneo, dalla loro bacheca (docs/core/amici-nei-giochi.md): ai piedi dell'ingresso di ogni
   discesa il pallino di chi è arrivato lì e il suo nome nel fumetto, sull'abisso chi ha finito le sette; in cima chi è da raggiungere.
   Il gioco non ha una sfida senza fine: niente record. Gli amici sono già salvati sul telefono e il servizio non risponde: niente
   deve rompersi. I pallini stanno nel DOM anche dove la nebbia copre ancora l'ingresso (si vedono quando è trovato): per guardarli
   a schermo l'eroe salta davanti col salto delle prove (`__mondo3d.vai`).
   `node test/esegui.mjs amici-sotterraneo --niente-build`
   tempo: 150 */
import { apriBrowser, apriGioco, azzera, semina, seminaAmici, amicoDiProva, attendi, scegli, mondoPronto, toccaNelMondo, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { CAMPAGNA, QUANTE_TAPPE } from '../../src/giochi/sotterraneo/dati/campagna.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await page.addInitScript(() => { globalThis.__SERVIZIO_SFIDE__ = 'http://127.0.0.1:9' })
const veri = () => errori.filter(e => !/WebSocket connection|Failed to load resource|net::ERR|ERR_/.test(e))
const amico = (lettera, id, nome, fa, tappa) => amicoDiProva(lettera, id, nome, { fa, giochi: { sotterraneo: { posti: tappa ? { '': tappa } : {}, primati: {} } } })
const testo = sel => page.locator(sel).first().textContent().then(t => t.replace(/\s+/g, ' ').trim())
const stelle = n => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 3]))
const campagna = (tappa, libera = false) => ({ sotterraneo: { tappa, libera, stelle: stelle(tappa),
  cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa, libera, stelle: stelle(tappa), missioni: {} } } } } })
async function alMondo(tappa, libera, amici) {
  await azzera(page)
  await semina(page, { coins: 300, campagne: campagna(tappa, libera) })
  await seminaAmici(page, amici)
  await scegli(page, 'sotterraneo')
  await mondoPronto(page)
  await page.evaluate(() => window.__mondo3d.senzaMostri())   // qui non si combatte: un mostro che attacca toglie i bersagli dallo schermo
  await attendi(page, 800)
}
const chiaveDi = al => (al === QUANTE_TAPPE ? 'abisso' : CAMPAGNA[al].chiave)
// l'eroe salta davanti all'ingresso (il salto delle prove, che ne carica la zona e lo scopre) e la scena lo mette a schermo
async function davantiA(al) {
  const k = chiaveDi(al)
  await page.evaluate(c => window.__mondo3d.vai('ingresso:' + c), k)
  await attendi(page, 1500)
  await page.waitForFunction(() => window.__sotterraneo3d.pronto, null, { timeout: 30000 })
  await page.waitForSelector(`[data-posto="${k}"][data-vis="1"]`, { timeout: 30000 })
  return k
}
// il fumetto dell'ingresso, aperto toccandolo (aperto o chiuso che sia: il nome degli amici c'è comunque)
async function apriIlFumetto(al) {
  const k = await davantiA(al)
  await toccaNelMondo(page, `[data-posto="${k}"]`)
  await page.waitForSelector(`[data-fumetto-di="${k}"]`, { timeout: 30000 })
  await attendi(page, 300)
}
const pallini = al => page.locator(`[data-amici-posto][data-al="${al}"] [data-pallino-amico]`).count()
// i pallini stanno ai piedi dell'ingresso (sotto il suo rettangolo), non altrove sul mondo
async function aiPiedi(al) {
  const k = await davantiA(al)
  await attendi(page, 1500)   // la telecamera segue l'eroe morbida: si misura a scena ferma
  const d = await page.locator(`[data-amici-posto][data-al="${al}"]`).boundingBox(), p = await page.locator(`[data-posto="${k}"]`).boundingBox()
  controlla(`i pallini della discesa ${al} stanno ai piedi del suo ingresso`,
    !!d && !!p && d.x + d.width / 2 > p.x && d.x + d.width / 2 < p.x + p.width && d.y >= p.y + p.height - 1 && d.y < p.y + p.height + 12,
    JSON.stringify({ d, p }))
  controlla(`e si vedono (l'ingresso ${k} è trovato)`, await page.locator(`[data-amici-posto][data-al="${al}"]`).isVisible())
}

/* ══════════ 1. a metà delle discese ══════════ */
await alMondo(2, false, [
  amico('a', 'leonardo1', 'Leonardo', 0, 4),
  amico('b', 'melody001', 'Melody', 3, 1),
  amico('d', 'ugo000001', 'Ugo', 1, 4),
  amico('e', 'dario0001', 'Dario', 2, QUANTE_TAPPE),
  amico('c', null, '', 0, 3),                               // mai incontrato online: senza nome non si vede
])
uguale('in cima chi è da raggiungere', await testo('[data-amico-davanti]'), 'Leonardo è 2 tappe più avanti di te.')
uguale('la riga in cima sta fuori dal mondo, con le carte di sopra', await page.locator('.sot-terra-sopra [data-amico-davanti]').count(), 1)
uguale('sulla discesa 4 due pallini', await pallini(4), 2)
uguale('sulla discesa che si è già fatta, Melody', await pallini(1), 1)
uguale('sull\'abisso, Dario', await pallini(QUANTE_TAPPE), 1)
uguale('quattro pallini in tutto, non quello senza nome', await page.locator('[data-amici-posto] [data-pallino-amico]').count(), 4)
uguale('le altre discese non ne hanno', await page.locator('[data-amici-posto]').count(), 3)
uguale('i pallini stanno dentro il bersaglio del loro ingresso', await page.locator(`[data-posto="${chiaveDi(4)}"] [data-amici-posto][data-al="4"]`).count(), 1)
uguale('nessun record: il gioco non ha una sfida senza fine', await page.locator('[data-record-amico], [data-record-amici]').count(), 0)
await aiPiedi(1)
await scatto(page, 'amici-sotterraneo-mondo')
await apriIlFumetto(1)
uguale('nel fumetto della discesa, il nome', await testo('[data-fumetto] [data-amici-qui][data-al="1"]'), 'MMelody è qui')
await apriIlFumetto(4)
uguale('anche su una discesa ancora chiusa', await testo('[data-fumetto] [data-amici-qui][data-al="4"]'), 'LULeonardo e Ugo sono qui')
await apriIlFumetto(0)
uguale('un ingresso senza amici non ha la riga', await page.locator('[data-fumetto] [data-amici-qui]').count(), 0)

/* ══════════ 2. finite le sette discese: l'abisso ══════════ */
await alMondo(QUANTE_TAPPE, true, [
  amico('a', 'leonardo1', 'Leonardo', 0, QUANTE_TAPPE),
  amico('b', 'melody001', 'Melody', 1, QUANTE_TAPPE - 1),
])
uguale('nessuno è più avanti di chi ha finito', await page.locator('[data-amico-davanti]').count(), 0)
uguale('Melody è sulla sua discesa', await pallini(QUANTE_TAPPE - 1), 1)
uguale('Leonardo è sull\'abisso', await pallini(QUANTE_TAPPE), 1)
await aiPiedi(QUANTE_TAPPE)
await apriIlFumetto(QUANTE_TAPPE)
uguale('nel fumetto dell\'abisso, il nome', await testo(`[data-fumetto] [data-amici-qui][data-al="${QUANTE_TAPPE}"]`), 'LLeonardo è qui')
await scatto(page, 'amici-sotterraneo-abisso')

/* ══════════ 3. uno è già all'abisso, e chi guarda no ══════════ */
await alMondo(2, false, [amico('a', 'leonardo1', 'Leonardo', 0, QUANTE_TAPPE)])
uguale('in cima chi è all\'abisso', await testo('[data-amico-davanti]'), 'Leonardo è già all\'abisso.')

controlla('nessun errore, anche col servizio irraggiungibile', veri().length === 0, veri().join(' | '))
await browser.close()
riassunto('amici: la bacheca nel mondo di sopra del sotterraneo')
