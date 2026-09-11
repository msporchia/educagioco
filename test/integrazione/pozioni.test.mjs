/* ═══════════════════════════════════════════════════════════════════
   IL LABORATORIO DELLE POZIONI, NEL BROWSER

   La prova unitaria dice che il motore è giusto; questa dice che il
   gioco che il bambino tocca è quel motore lì. La prima tappa si gioca
   **dallo schermo**: si legge la dose sulla pergamena, si tocca
   l'ingrediente, si tocca la bilancia, si premono i pesi che servono e
   si conferma. Poi un trascinamento vero col dito — `touchStart`,
   `touchMove`, `touchEnd` via CDP, che è l'unico modo di provare che
   il click fantasma non tocca l'attrezzo una seconda volta — uno
   sbaglio letto a schermo, e quello che resta nel profilo.
   `node test/esegui.mjs pozioni`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, scatto, attendi }
  from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/pozioni/dati/campagna.js'
import { STRUMENTO } from '../../src/giochi/pozioni/dati/misure.js'
import { scomponi } from '../../src/giochi/pozioni/motore/misura.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
/* un bambino di nove anni: il laboratorio è in home, e le prime tappe
   dei pesi gli sono già passate — quindi aperte */
await semina(page, { settings: { eta: 9 } })

/* ---------- 1. si entra dalla home ---------- */
const carta = page.locator('.carta.gioco[data-gioco="pozioni"]')
controlla('la carta del gioco è in home', await carta.count() === 1)
await carta.click()
await page.waitForSelector('.pz-mappa', { timeout: 5000 })
uguale('la mappa elenca tutte le tappe', await page.locator('.pz-tappa').count(), CAMPAGNA.length)
uguale('quattro blocchi: tre famiglie e il calderone', await page.locator('.pz-blocco').count(), 4)
const aperte = await page.locator('.pz-tappa:not(.pz-chiusa)').count()
dentro('a nove anni sono aperte le prime tappe dei pesi', aperte, 1, 9)
nota(`${aperte} tappe aperte a nove anni`)
await scatto(page, 'pozioni-mappa')

/* ---------- 2. la prima tappa, dallo schermo ---------- */
await page.locator('.pz-tappa[data-tappa="0"]').click()
await page.waitForSelector('.pz-banco', { timeout: 5000 })
uguale('la prima tappa comincia davanti allo scaffale',
       await page.locator('.pz-banco').getAttribute('data-fase'), 'scaffale')
controlla('e dice come si gioca', await page.locator('[data-aiuto][data-livello="gioco"]').count() === 1)
uguale('sullo scaffale ci sono due ingredienti', await page.locator('.pz-ingrediente').count(), CAMPAGNA[0].scelta)
uguale('e un attrezzo solo', await page.locator('[data-strumento]').count(), 1)

/* la dose e l'ingrediente si leggono dalla pergamena, come farebbe un
   bambino: il test non guarda dentro al gioco */
async function ricetta() {
  return page.evaluate(() => [...document.querySelectorAll('.pz-voce:not(.pz-fatto)')].map(v => ({
    nome: v.getAttribute('data-voce'),
    dose: v.querySelector('[data-dose]').innerText.trim(),
  })))
}
const grammi = testo => Number(testo.replace(' g', ''))

async function dosaDalloSchermo() {
  const [voce] = await ricetta()
  await attendi(page, 350)                    // la finestra cieca
  await page.locator(`.pz-ingrediente[data-ingrediente="${voce.nome}"]`).click()
  await attendi(page, 120)
  uguale(`${voce.dose} di ${voce.nome}: toccato, è in mano`,
         await page.locator('.pz-banco').getAttribute('data-fase'), 'inMano')
  await page.locator('[data-strumento="cucina"]').click()
  await attendi(page, 120)
  uguale('toccata la bilancia, si dosa', await page.locator('.pz-banco').getAttribute('data-fase'), 'dosa')
  for (const pz of scomponi(grammi(voce.dose), STRUMENTO.cucina.pezzi)) {
    await page.locator(`[data-pezzo="${pz}"]`).click()
    await attendi(page, 60)
  }
  uguale('la lettura fa la dose', await page.locator('[data-lettura]').innerText(), voce.dose)
  await page.locator('[data-azione="conferma"]').click()
  await attendi(page, 150)
  uguale('nel calderone: giusto', await page.locator('[data-esito]').getAttribute('data-codice'), 'giusto')
  await attendi(page, 1000)                    // il tuffo
}

/* la prima dose la si fa con uno sbaglio apposta, per leggere il cartello */
{
  const [voce] = await ricetta()
  const altro = await page.evaluate(nome =>
    [...document.querySelectorAll('.pz-ingrediente')].map(b => b.getAttribute('data-ingrediente'))
      .find(n => n !== nome), voce.nome)
  await attendi(page, 350)
  await page.locator(`.pz-ingrediente[data-ingrediente="${altro}"]`).click()
  await attendi(page, 150)
  uguale('l\'ingrediente sbagliato è uno sbaglio detto',
         await page.locator('[data-esito]').getAttribute('data-codice'), 'ingrediente')
  controlla('con la barra che dice quanto manca', await page.locator('.pz-attesa').count() === 1)
  await scatto(page, 'pozioni-sbaglio')
  await page.waitForSelector('[data-esito]', { state: 'detached', timeout: 12000 })
  controlla('poi si riparte', await page.locator('[data-esito]').count() === 0)
}

let fatte = 0
for (let n = 0; n < 12 && await page.locator('[data-fine]').count() === 0; n++) {
  await dosaDalloSchermo()
  fatte++
  await attendi(page, 300)
}
uguale('la prima tappa si finisce dallo schermo', await page.locator('[data-fine="tappa"]').count(), 1)
nota(`${fatte} dosi giocate`)
const stelle = (await page.locator('[data-stelle]').innerText()).trim()
uguale('con uno sbaglio solo, due stelle', stelle, '⭐⭐')
controlla('e le monete arrivano', (await page.locator('[data-monete]').innerText()).includes('🪙'))
await scatto(page, 'pozioni-fine')

/* ---------- 3. quello che resta ---------- */
const profilo = await leggiProfilo(page)
uguale('la campagna è avanzata di una tappa', profilo.campagne.pozioni.tappa, 1)
uguale('con le sue stelle', profilo.campagne.pozioni.stelle[0], 2)
uguale('le dosi giuste sono contate', profilo.totals.misure, fatte)
uguale('e le pozioni pure', profilo.totals.pozioni, CAMPAGNA[0].clienti)
controlla('la prima tappa non chiede conversioni, quindi niente al motore di apprendimento',
          !Object.keys(profilo.items || {}).some(k => k.startsWith('pozioni:')))

/* ---------- 4. la tappa dopo, col dito vero ---------- */
await page.locator('[data-azione="avanti"]').click()
await page.waitForSelector('.pz-banco', { timeout: 5000 })
uguale('la seconda tappa porta il conto svolto',
       await page.locator('[data-aiuto][data-livello="svolto"]').count(), 1)
await attendi(page, 400)

const cdp = await page.context().newCDPSession(page)
const dito = async (da, a) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: da.x, y: da.y }] })
  for (const q of [0.2, 0.5, 0.8, 1])
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove',
      touchPoints: [{ x: da.x + (a.x - da.x) * q, y: da.y + (a.y - da.y) * q }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await attendi(page, 250)                    // il click fantasma arriva qui dentro
}
const centro = async sel => {
  const r = await page.locator(sel).boundingBox()
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
}
{
  const [voce] = await ricetta()
  await dito(await centro(`.pz-ingrediente[data-ingrediente="${voce.nome}"]`),
             await centro('[data-strumento="cucina"]'))
  uguale('trascinato col dito sulla bilancia, si dosa',
         await page.locator('.pz-banco').getAttribute('data-fase'), 'dosa')
  controlla('e il click fantasma non ha fatto danni: nessuno sbaglio a schermo',
            await page.locator('[data-esito]').count() === 0)
  controlla('il cartello svolto dice il risultato in grammi',
            (await page.locator('[data-procedimento]').innerText()).includes('scalini'))
  await scatto(page, 'pozioni-gioco')
}

uguale('nessun errore JS', errori.length, 0, errori.join(' | '))
await browser.close()
riassunto('il laboratorio delle pozioni nel browser')
