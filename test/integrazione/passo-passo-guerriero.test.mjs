/* Il guerriero di Passo passo col browser vero: il selettore a tre, la sua
   strada sull'isola delle carte, una tappa vinta dalla principessa, una caduta
   contro il nemico che si riprova, e le scatole del corridoio scritte col dito
   (che vincano lo dice l'unità). Vedi docs/passo-passo/guerriero.md.
   perché: il guerriero di Passo passo: il selettore a tre, la sua strada sull'isola delle carte, una tappa vinta dalla principessa, la caduta contro il nemico che si riprova, le scatole del corridoio scritte col dito
   a parte perché: i protagonisti 🐇 e 🐕 sono in passo-passo; qui solo il terzo, con la sua strada, il nemico e la spada: ma POTREBBE essere un blocco di passo-passo
   `node test/esegui.mjs passo-passo-guerriero` */
import { apriBrowser, apriGioco, azzera, attendi, semina, scegli, parti, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA, FILA_ATTUALE } from '../../src/giochi/passo-passo/dati/campagna.js'
import { STRADE } from '../../src/giochi/passo-passo/motore/strade.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { risolvi } from '../../src/giochi/passo-passo/motore/risolutore.js'
import { filaScritta, filaDi, chiudiIlTraguardo } from '../aiuto/passo-passo.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

const stelleFino = n => Object.fromEntries([...Array(n)].map((_, i) => [i, 3]))
const apri = async (tappa, stelle = stelleFino(tappa)) => {
  await semina(page, { settings: { eta: 8 }, campagne: { passo: { tappa, stelle, cfg: { fila: FILA_ATTUALE } } } })
  await chiudiIlTraguardo(page)
  await scegli(page, 'passo')
  await page.waitForSelector('[data-mappa] [data-tappa]')
}
// aspetta la condizione e dice se è arrivata: un'attesa scaduta è un controllo che fallisce
const arriva = (sel, timeout) => page.waitForSelector(sel, { timeout }).then(() => true, () => false)
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
const sbagliata = ['su', 'destra', 'destra', 'destra', 'destra', 'su']
await componi(sbagliata)
await page.locator('[data-azione="via"]').click()
// la grata ferma: la tessera colpevole si accende, finita la scenetta torna ▶
controlla('senza il pulsante la grata ferma la fila', await arriva('[data-tessera][data-guasto]', 10000))
controlla('e finita la scenetta si riprova', await arriva('[data-azione="via"]', 8000))
uguale('senza cartello', await page.locator('[data-fine]').count(), 0)
for (const _ of sbagliata) await page.locator('[data-azione="cancella"]').click()
await componi(risolvi(Livello.da(CAMPAGNA[prima])))
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
await componi(['su', 'destra', 'destra', 'destra', 'destra', 'destra', 'destra'])
await page.locator('[data-azione="via"]').click()
controlla('la fila si ferma sulla freccia colpevole', await arriva('[data-tessera="6"][data-guasto]', 10000))
await scatto(page, 'passo-guerriero-caduto')
controlla('e finita la caduta si torna alla partenza', await arriva('[data-azione="via"]', 8000))
uguale('e la partita non è finita', await page.locator('[data-fine]').count(), 0)

/* ── le carte: 🔁 fino a casa, e dentro i ❓ con le frecce ── */
await page.evaluate(() => { location.hash = 'passo=corridoio-storto'; location.reload() })
await page.waitForSelector('.pp-campo', { timeout: 8000 })
await attendi(page, 450)
await page.locator('[data-carta="ripeti"]').click()
await page.locator('[data-volte-scegli="casa"]').click()
await componi(['attacca'])
uguale('⚔️ sta nella fila come una freccia', await page.locator('[data-tessera][data-mossa="attacca"]').count(), 1)
await page.locator('[data-carta="se"]').click()
uguale('il ❓ offre le quattro frecce', await page.locator('[data-volte-scegli="su"], [data-volte-scegli="giu"], [data-volte-scegli="sinistra"], [data-volte-scegli="destra"]').count(), 4)
await scatto(page, 'passo-guerriero-se')
await page.locator('[data-volte-scegli="destra"]').click()
await componi(['destra'])
await page.locator('.pp-scatola[data-tipo="se"] .pp-coda').last().click()
await page.locator('[data-carta="se"]').click()
await page.locator('[data-volte-scegli="giu"]').click()
await componi(['giu'])
await scatto(page, 'passo-guerriero-programma')
// che la soluzione porti dalla principessa lo dice `unita/passo-passo-guerriero`: qui che il dito l'ha scritta tutta
uguale('col dito si scrive la soluzione del corridoio, scatole e ❓ al loro posto',
       (await filaScritta(page)).join(' '), filaDi(CAMPAGNA.find(t => t.chiave === 'corridoio-storto').soluzioni[0]).join(' '))

controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('passo passo — il guerriero nel browser')
