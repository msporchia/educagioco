/* Passo passo lasciato a metà, nel browser. Un livello: si esce con ←, si
   rientra e la fila è lì, coi gradini del 💡 già pagati (la carta comprata
   si riaccende gratis), anche dopo aver ricaricato la pagina; vinto, il
   livello non la tiene più. Il sentiero senza fine: la mappa offre in
   cima «torno da dove ero», uscire non chiude la serie, un sentiero nuovo
   chiede prima e «lascio perdere» scrive il record. Vedi docs/passo-passo/sosta.md.
   `DIST=… node test/esegui.mjs passo-passo-sosta --niente-build` */
import { apriBrowser, apriGioco, azzera, semina, attendi, leggiProfilo, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/passo-passo/dati/campagna.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { risolvi } from '../../src/giochi/passo-passo/motore/risolutore.js'
import { VERSIONE } from '../../src/giochi/passo-passo/motore/sosta.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

const tasto = m => m.startsWith('salto-') ? `[data-salto="${m.slice(6)}"]` : `[data-freccia="${m}"]`
async function componi(mosse) {
  for (const m of mosse) { await page.locator(tasto(m)).click(); await attendi(page, 60) }
}
async function allaMappaDelGioco() {
  await page.locator('.carta.gioco[data-gioco="passo"]').click()
  await page.waitForSelector('.pp-mappa', { timeout: 5000 })
}
async function entraNellaTappa(i) {
  await page.locator(`.pp-tappa[data-tappa="${i}"]`).click()
  await page.waitForSelector('.pp-campo', { timeout: 5000 })
  await attendi(page, 450)            // la finestra cieca dei 320 ms
}
async function indietro(attesa = '.pp-mappa') {
  await page.locator('button[aria-label="indietro"]').click()
  await page.waitForSelector(attesa, { timeout: 5000 })
}
const tessere = () => page.locator('[data-tessera]').count()
const monete = async () => (await leggiProfilo(page)).coins
const passo = async () => ((await leggiProfilo(page)).campagne || {}).passo || {}
// ⌫ fino in fondo: col cursore in testa, prima lo si porta in coda
async function svuota() {
  for (let k = 0; k < 20 && await tessere(); k++) {
    const c = page.locator('[data-azione="cancella"]')
    if (await c.isDisabled()) await page.locator('[data-tessera]').last().click()
    else await c.click()
    await attendi(page, 60)
  }
}
const suggerimento = async () => { await page.locator('[data-azione="suggerimento"]').click(); await attendi(page, 200) }

/* ══════════ 1. un livello: la fila e gli aiuti restano ══════════ */
await semina(page, { settings: { eta: 6 }, coins: 500,
                     campagne: { passo: { tappa: 2, stelle: { 0: 4, 1: 1 }, cfg: {} } } })
await allaMappaDelGioco()
const cespuglio = CAMPAGNA[1]
await entraNellaTappa(1)
await componi(['su', 'destra'])
const m0 = await monete()
await suggerimento(); await suggerimento(); await suggerimento()
controlla('la prova parte da una fila scritta e una carta del 💡 comprata',
          await tessere() === 2 && await monete() === m0 - 10 && await page.locator('.pp-brilla').count() === 1)

await indietro()
controlla('sulla mappa il livello lasciato a metà ha la matita',
          await page.locator(`.pp-tappa[data-tappa="1"] [data-a-meta]`).count() === 1)
uguale('e la carta in cima non c\'è: la fila si ritrova entrando', await page.locator('[data-ripresa]').count(), 0)
{
  const s = (await passo()).sosta
  controlla('la fila sta nella sosta, sotto la chiave del livello',
            s && s.v === VERSIONE && s.livelli[cespuglio.chiave] && s.livelli[cespuglio.chiave].presi === 3,
            JSON.stringify(s))
}
await scatto(page, 'passo-sosta-mappa')

await entraNellaTappa(1)
uguale('rientrando la fila è quella', await tessere(), 2)
await suggerimento()
controlla('il 💡 rimette la carta già comprata', await page.locator('.pp-brilla').count() === 1)
uguale('senza farla ripagare', await monete(), m0 - 10)
await page.locator('[data-consiglio]').click()
await attendi(page, 100)
await suggerimento()
uguale('messa la carta, il prossimo gradino è quello dopo, non di nuovo il primo', await monete(), m0 - 20)

/* la pagina che sparisce: si ricarica e la fila c'è ancora */
await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
await attendi(page, 500)
await page.reload()
await page.waitForSelector('.carte')
await allaMappaDelGioco()
await entraNellaTappa(1)
uguale('anche dopo aver ricaricato la pagina', await tessere(), 3)
uguale('e i gradini scesi restano scesi', (await passo()).sosta.livelli[cespuglio.chiave].presi, 4)

/* vinto, il livello non tiene più la fila: rigiocarlo è una partita nuova */
await svuota()
await componi(risolvi(Livello.da(cespuglio)))
await page.locator('[data-azione="via"]').click()
await page.waitForSelector('[data-fine="tappa"]', { timeout: 12000 })
uguale('vinto, la sosta non tiene più quel livello',
       ((await passo()).sosta || { livelli: {} }).livelli[cespuglio.chiave], undefined)
await attendi(page, 400)
await page.locator('[data-azione="rigioca"]').click()
await page.waitForSelector('.pp-campo')
await attendi(page, 450)
uguale('e rigiocato riparte vuoto', await tessere(), 0)
await indietro()

/* ══════════ 2. il sentiero senza fine ══════════ */
const sentieroLasciato = { seme: 4242, sentieri: 2, serie: 2, prima: 'prato', chiusa: null, posto: null, fila: null }
await semina(page, { settings: { eta: 8 }, coins: 500,
                     campagne: { passo: { tappa: CAMPAGNA.length, libera: true, stelle: {}, cfg: {},
                                          sosta: { v: VERSIONE, livelli: {}, sentiero: sentieroLasciato } } } })
await allaMappaDelGioco()
await page.waitForSelector('[data-ripresa]')
{
  const testo = await page.locator('[data-ripresa]').textContent()
  controlla('la carta in cima dice a che sentiero si era, e la serie', /sentiero 3/.test(testo) && /2 di fila/.test(testo), testo)
}
await scatto(page, 'passo-sosta-ripresa')
await page.click('[data-ripresa] [data-azione="riprendi"]')
await page.waitForSelector('.pp-campo')
await attendi(page, 450)
const titolo = await page.locator('.barra-app .dove').innerText()
controlla('si riprende dal sentiero dopo i due vinti', titolo.includes('3'), titolo)
await componi(['destra'])

await indietro()
await page.waitForSelector('[data-ripresa]')
{
  const testo = await page.locator('[data-ripresa]').textContent()
  controlla('uscire non chiude la serie', /2 di fila/.test(testo), testo)
  const p = await passo()
  uguale('e non scrive il record', (p.primato || {}).best || 0, 0)
  controlla('il posto in gioco è salvato, con la sua fila',
            p.sosta.sentiero.posto && p.sosta.sentiero.fila && p.sosta.sentiero.fila.fila.length === 1,
            JSON.stringify(p.sosta.sentiero.fila))
}

/* ripreso, è lo stesso posto con la stessa fila */
const mappaPrima = (await passo()).sosta.sentiero.posto.mappa.join('/')
await page.click('[data-ripresa] [data-azione="riprendi"]')
await page.waitForSelector('.pp-campo')
await attendi(page, 450)
uguale('ripreso, la fila è quella', await tessere(), 1)
uguale('il titolo è lo stesso', await page.locator('.barra-app .dove').innerText(), titolo)
await indietro()
uguale('e il posto non è cambiato', (await passo()).sosta.sentiero.posto.mappa.join('/'), mappaPrima)

/* un sentiero nuovo chiede prima */
await page.locator('[data-tappa="senza-fine"]').click()
uguale('il tasto del sentiero chiede prima', await page.locator('[data-chiede]').count(), 1)
await page.click('[data-chiede] [data-azione="riprendi-invece"]')
await page.waitForSelector('.pp-campo')
await attendi(page, 450)
uguale('«no, torno a quella» riprende il sentiero lasciato', await tessere(), 1)
await indietro()

/* «lascio perdere»: la serie finisce davvero, e il record si scrive una volta */
await page.click('[data-ripresa] [data-azione="scorda"]')
await attendi(page, 200)
uguale('«lascio perdere» toglie la carta', await page.locator('[data-ripresa]').count(), 0)
{
  const p = await passo()
  uguale('e scrive il record della serie', (p.primato || {}).best, 2)
  uguale('una volta sola', (p.primato || {}).partite, 1)
  uguale('la sosta non tiene più il sentiero', (p.sosta || {}).sentiero || null, null)
}
await page.locator('[data-tappa="senza-fine"]').click()
await page.waitForSelector('.pp-campo')
uguale('senza sosta il sentiero parte senza chiedere', (await page.locator('.barra-app .dove').innerText()).includes('1'), true)
await indietro()

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('Passo passo — la fila e il sentiero lasciati a metà, nel browser')
