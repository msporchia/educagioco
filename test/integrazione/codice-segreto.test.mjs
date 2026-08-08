/* ═══════════════════════════════════════════════════════════════════
   CODICE SEGRETO, NEL BROWSER

   La prova unitaria dice che il motore è giusto; questa dice che il
   gioco che il bambino tocca è quel motore lì. Il codice qui non si
   conosce — è nascosto nella pagina come lo è per chi gioca — quindi la
   tappa si vince **ragionando sui pallini letti a schermo**: si legge la
   riga appena giocata, si scartano i codici che non spiegherebbero
   quegli indizi, e si prova il primo che resta. Se il gioco disegnasse
   pallini diversi da quelli che il motore calcola, questo test non
   riuscirebbe mai a vincere.

   Alla fine si guarda quello che conta davvero: la tappa dopo si apre, le
   stelle e le monete arrivano, e tutto finisce nel profilo salvato.
   `node test/esegui.mjs codice-segreto`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, scatto, leggiProfilo, attendi } from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/codice-segreto/dati/campagna.js'
import { Regole } from '../../src/giochi/codice-segreto/motore/partita.js'
import { tuttiICodici, compatibili } from '../../src/giochi/codice-segreto/motore/banco.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* ---------- 1. si entra dalla home ---------- */
const carta = page.locator('.carta.gioco[data-gioco="codice"]')
controlla('la carta del gioco è in home', await carta.count() === 1)
await carta.click()
await page.waitForSelector('.cs-mappa', { timeout: 5000 })

uguale('la mappa elenca tutte le tappe', await page.locator('.cs-tappa').count(), CAMPAGNA.length)
uguale('a profilo vuoto è aperta solo la prima',
       await page.locator('.cs-tappa:not(.cs-chiusa)').count(), 1)
controlla('il gioco libero è chiuso finché la campagna non è finita',
          await page.locator('.cs-libero.cs-chiusa').count() === 1)
await scatto(page, 'codice-mappa')

/* ---------- 2. la spiegazione si apre da sola la prima volta ---------- */
await page.locator('.cs-tappa[data-tappa="0"]').click()
await page.waitForSelector('[data-velo="spiegazione"]', { timeout: 5000 })
controlla('la spiegazione si apre da sola alla prima partita', true)
await attendi(page, 2200)      // il giro dell'esempio: il pallino deve volare
uguale('la spiegazione mostra il pallino pieno che ha calcolato il motore',
       await page.locator('.cs-dindizi .cs-pallino.cs-pieno').count(), 1)
await scatto(page, 'codice-spiegazione')
await page.locator('[data-velo="spiegazione"] .cs-grosso').click()
await attendi(page, 200)

/* ---------- 3. il tavolo è quello che la tappa promette ---------- */
const regole = Regole.perTappa(CAMPAGNA[0])
uguale('in tastiera ci sono i disegni dello scaglione',
       await page.locator('.cs-tasto').count(), regole.pool.length)
uguale('le caselle sono quelle dello scaglione',
       await page.locator('.cs-riga.cs-attiva .cs-casella').count(), regole.caselle)
uguale('le righe sono le prove concesse',
       await page.locator('.cs-riga').count(), regole.prove)
uguale('i disegni sono quelli del tema', await page.locator('.cs-tasto').first().innerText(),
       regole.pool[0])

/* si posa e si toglie: il gesto che un bambino sbaglia per primo */
await page.locator('.cs-tasto').first().click()
await attendi(page, 120)
uguale('posando si riempie la prima buca',
       await page.locator('.cs-riga.cs-attiva .cs-casella.cs-piena').count(), 1)
controlla('con la riga a metà non si consegna',
          await page.locator('.cs-conferma').isDisabled())
await page.locator('.cs-riga.cs-attiva .cs-casella.cs-piena').first().click()
await attendi(page, 120)
uguale('toccando una casella piena si toglie',
       await page.locator('.cs-riga.cs-attiva .cs-casella.cs-piena').count(), 0)

/* ---------- 4. si gioca la tappa ragionando sugli indizi ---------- */
const TUTTI = tuttiICodici(regole)

/* Posa un codice e consegna, poi legge dallo schermo i due numeri: sono
   il solo canale da cui il giocatore sa qualcosa, qui come nella vita. */
async function provaCodice(codice) {
  for (const s of codice) await page.locator(`.cs-tasto[data-simbolo="${s}"]`).click()
  await attendi(page, 80)
  await page.locator('.cs-conferma').click()
  await attendi(page, 260)
  const ultima = page.locator('.cs-riga.cs-fatta').last()
  return {
    simboli: codice,
    pieni: await ultima.locator('.cs-pallino.cs-pieno').count(),
    vuoti: await ultima.locator('.cs-pallino.cs-vuoto').count(),
  }
}

async function vinciUnCodice() {
  let candidati = TUTTI
  for (let giro = 0; giro < regole.prove; giro++) {
    const prova = await provaCodice(candidati[0])
    if (prova.pieni === regole.caselle) return giro + 1
    candidati = compatibili(candidati, prova)
    if (!candidati.length) return 0        // il gioco ha risposto qualcosa di impossibile
  }
  return 0
}

const quanti = CAMPAGNA[0].partite
let proveInTutto = 0
for (let n = 1; n <= quanti; n++) {
  const prove = await vinciUnCodice()
  controlla(`codice ${n} di ${quanti}: trovato ragionando sui pallini a schermo`,
            prove > 0, 'gli indizi a schermo non portano da nessuna parte')
  proveInTutto += prove
  await attendi(page, 900)                 // il respiro prima del cartello
  const fine = await page.locator('.cs-velo').getAttribute('data-fine')
  uguale(`codice ${n}: il cartello di fine si apre`, fine, n < quanti ? 'partita' : 'tappa')
  if (n === quanti) break
  await page.locator('.cs-velo .cs-grosso').first().click()
  await attendi(page, 250)
}
nota(`tappa vinta in ${proveInTutto} prove per ${quanti} codici`)
await scatto(page, 'codice-tappa-finita')

/* ---------- 5. quello che resta dopo ---------- */
const stelleASchermo = await page.locator('.cs-velo .cs-punteggio').innerText()
dentro('la tappa vale da una a tre stelle', stelleASchermo.length, 1, 3)

await page.locator('.cs-velo .cs-grosso').first().click()
await page.waitForSelector('.cs-mappa', { timeout: 5000 })
uguale('finita la prima tappa, la seconda si apre',
       await page.locator('.cs-tappa:not(.cs-chiusa)').count(), 2)
controlla('la tappa fatta mostra le sue stelle',
          (await page.locator('.cs-tappa[data-tappa="0"] .cs-stelle').innerText()).includes('⭐'))

const profilo = await leggiProfilo(page)
const av = profilo?.campagne?.codice
controlla('l\'avanzamento è finito nel profilo salvato', !!av, JSON.stringify(profilo?.campagne))
uguale('e dice che una tappa è stata superata', av?.tappa, 1)
dentro('con le stelle di quella tappa', av?.stelle?.['0'] || 0, 1, 3)
controlla('le monete sono arrivate', (profilo?.coins || 0) > 0, String(profilo?.coins))
uguale('e i codici indovinati sono contati', profilo?.totals?.codici, quanti)

/* ---------- 6. l'albo ha la sua famiglia, e un traguardo è scattato ----------
   I traguardi del gioco non stanno in `data/traguardi.js`: li dichiara il
   manifesto. Qui si prova che quel giro arrivi fino in fondo — famiglia
   in pagina, badge preso, esperienza contata — perché è la parte che si
   romperebbe in silenzio. */
await page.goto(page.url().replace(/#.*$/, '') + '#albo')
await page.waitForSelector('.area[data-area="codice"]', { timeout: 5000 })
const famiglia = page.locator('.area[data-area="codice"]')
controlla('l\'albo ha la famiglia del Codice Segreto', await famiglia.count() === 1)
uguale('con i cinque traguardi del manifesto',
       await famiglia.locator('.badge').count(), 5)
controlla('e la prima tappa ne ha già acceso almeno uno',
          await famiglia.locator('.badge:not(.spento)').count() >= 1)
controlla('la famiglia mostra anche il livello guadagnato',
          await famiglia.locator('.liv').count() === 1)
await scatto(page, 'codice-albo')
await page.goto(page.url().replace(/#.*$/, '') + '#codice')
await page.waitForSelector('.cs-mappa', { timeout: 5000 })

/* ---------- 7. la spiegazione non torna a ogni partita ---------- */
await page.locator('.cs-tappa[data-tappa="0"]').click()
await attendi(page, 500)
uguale('vista una volta, la spiegazione non si rimette in mezzo',
       await page.locator('[data-velo="spiegazione"]').count(), 0)
controlla('e si può richiamare dal punto interrogativo in barra',
          await page.locator('button[aria-label="come si gioca"]').count() === 1)

controlla('nessun errore JS', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('codice segreto nel browser')
