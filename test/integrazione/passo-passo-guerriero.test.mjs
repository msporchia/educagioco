/* Il guerriero di Passo passo col browser vero: il selettore a tre, la sua
   strada sull'isola delle carte, una tappa vinta dalla principessa, una caduta
   contro il nemico che si riprova. Vedi docs/passo-passo/guerriero.md.
   `node test/esegui.mjs passo-passo-guerriero` */
import { apriBrowser, apriGioco, azzera, attendi, semina, scegli, parti, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA, FILA_ATTUALE } from '../../src/giochi/passo-passo/dati/campagna.js'
import { STRADE } from '../../src/giochi/passo-passo/motore/strade.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

const stelleFino = n => Object.fromEntries([...Array(n)].map((_, i) => [i, 3]))
const apri = async (tappa, stelle = stelleFino(tappa)) => {
  await semina(page, { settings: { eta: 8 }, campagne: { passo: { tappa, stelle, cfg: { fila: FILA_ATTUALE } } } })
  await scegli(page, 'passo')
  await page.waitForSelector('[data-mappa] [data-tappa]')
}
const componi = async mosse => {
  for (const m of mosse) { await page.locator(`[data-freccia="${m}"]`).click(); await attendi(page, 60) }
}

/* ── chiuso: il lucchetto dice cosa manca ── */
await apri(3)
await page.locator('[data-scegli="guerriero"]').click()
controlla('il guerriero chiuso dice chi deve finire prima',
          /Il guerriero comincia quando il coniglio finisce/.test(await page.locator('[data-serve-guerriero]').innerText()))
uguale('e la mappa resta al coniglio', await page.locator('[data-mappa]').getAttribute('data-protagonista'), 'coniglio')

/* ── aperto: la sua strada ── */
await apri(CAMPAGNA.findIndex(t => t.chiave === 'tutto') + 1)
await page.locator('[data-scegli="guerriero"]').click()
await page.waitForSelector('[data-mappa][data-protagonista="guerriero"] [data-tappa]', { timeout: 8000 })
const larga = await page.evaluate(() => { const b = document.querySelector('.pp-protagonisti').getBoundingClientRect(); return b.right <= innerWidth && b.left >= 0 })
controlla('i tre protagonisti stanno nello schermo del telefono', larga)
const prima = STRADE.guerriero[0]
uguale('il segnalino è il guerriero, sulla prima tappa',
       await page.locator('[data-segnalino]').getAttribute('data-animale'), 'guerriero')
uguale('che è la tappa di adesso', await page.locator(`[data-tappa="${prima}"]`).getAttribute('data-stato'), 'ora')
uguale('ci sono solo le sue', await page.locator('[data-mappa] [data-strada="coniglio"]').count(), 0)
uguale('di sentieri senza fine non ne ha', await page.locator('[data-sentiero-di]').count(), 0)
await scatto(page, 'passo-guerriero-mappa')

/* ── una tappa vinta ── */
await page.waitForSelector('[data-segnalino][data-in-viaggio="0"]', { timeout: 8000 })
await parti(page, `[data-tappa="${prima}"]`)
await page.waitForSelector('.pp-campo', { timeout: 5000 })
await attendi(page, 450)
await componi(['destra', 'destra', 'destra', 'destra'])
await page.locator('[data-azione="via"]').click()
await attendi(page, 4500)
uguale('senza il pulsante la grata ferma, e si riprova', await page.locator('[data-fine]').count(), 0)
await page.locator('[data-azione="cancella"]').click()
await page.locator('[data-azione="cancella"]').click()
await componi(['su', 'giu', 'giu', 'su', 'destra', 'destra', 'destra'])
await page.locator('[data-azione="via"]').click()
await page.waitForSelector('[data-fine="tappa"]', { timeout: 15000 })
uguale('dalla principessa, con la corona', await page.locator('[data-stelle-prese]').getAttribute('data-quante'), '4')
controlla('il cartello ha la principessa', (await page.locator('[data-fine]').innerText()).includes('👸'))
await scatto(page, 'passo-guerriero-vittoria')
controlla('e ▶ porta avanti sulla sua strada', await page.locator('[data-azione="avanti"]').count() === 1)

/* ── una caduta: senza spada il nemico ferma la fila, e si torna alla partenza ── */
await page.evaluate(() => { location.hash = 'passo=la-spada'; location.reload() })
await page.waitForSelector('.pp-campo', { timeout: 8000 })
await attendi(page, 450)
await componi(['destra', 'destra', 'destra', 'destra'])
await page.locator('[data-azione="via"]').click()
await attendi(page, 2200)
await scatto(page, 'passo-guerriero-caduto')
await attendi(page, 2500)
uguale('la fila si ferma sulla freccia colpevole', await page.locator('[data-tessera="3"][data-guasto]').count(), 1)
uguale('e la partita non è finita', await page.locator('[data-fine]').count(), 0)

controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('passo passo — il guerriero nel browser')
