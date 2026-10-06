/* Il programma si salva anche se la pagina sparisce: una riga appena
   scritta, la scheda nascosta (o il telefono in tasca) prima che scada
   il salvataggio pigro, e alla ricarica la riga c'è. Si prova con tutti e
   due gli eventi, `visibilitychange` e `pagehide`, ricaricando prima dei
   ritardi (500 ms del costruttore + 350 ms dell'archivio).
   Vedi docs/costruttore/campagna.md.
   `node test/esegui.mjs costruttore-salvataggio` */
import { apriBrowser, apriGioco, azzera, semina, attendi, scegli, costruisci } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { coins: 0, settings: { eta: 10 } })

const tocca = async sel => { await page.locator(sel).first().click(); await attendi(page, 60) }
const righe = () => page.locator('[data-editor] .cst-riga').count()

async function apriIlPrimo() {
  await scegli(page, 'costruttore')
  await page.waitForSelector('.cst-mappa', { timeout: 5000 })
  await costruisci(page, 0)
  await page.waitForSelector('[data-editor]', { timeout: 5000 })
}
async function aggiungiMetti() {
  await tocca('[data-aggiungi="principale"]')
  await page.waitForSelector('[data-cassetta]', { timeout: 3000 })
  await attendi(page, 350)      // la finestra cieca della cassetta
  await tocca('[data-cassetta] [data-blocco="metti"]')
}
// la pagina nasconde: `hidden` e `visibilityState` si ritoccano, l'evento lo manda il test
const nascondi = () => page.evaluate(() => {
  for (const k of ['hidden', 'visibilityState'])
    Object.defineProperty(document, k, { configurable: true, get: () => k === 'hidden' ? true : 'hidden' })
  document.dispatchEvent(new Event('visibilitychange'))
})
const chiudiLaPagina = () => page.evaluate(() => dispatchEvent(new Event('pagehide')))

await apriIlPrimo()
const inizio = await righe()
uguale('il primo muretto parte con due righe', inizio, 2)

/* una riga, la pagina si nasconde, ricarica prima dei ritardi */
await aggiungiMetti()
uguale('una riga in più', await righe(), inizio + 1)
await nascondi()
await attendi(page, 120)
await page.reload()
await page.waitForSelector('.carte', { timeout: 10000 })
await apriIlPrimo()
uguale('nascosta la pagina, la riga c\'è dopo la ricarica', await righe(), inizio + 1)

/* un'altra, e la pagina si chiude */
await aggiungiMetti()
uguale('un\'altra riga', await righe(), inizio + 2)
await chiudiLaPagina()
await attendi(page, 120)
await page.reload()
await page.waitForSelector('.carte', { timeout: 10000 })
await apriIlPrimo()
uguale('chiusa la pagina, anche questa riga c\'è', await righe(), inizio + 2)

controlla('nessun errore in console', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('costruttore: il programma si salva se la pagina sparisce')
