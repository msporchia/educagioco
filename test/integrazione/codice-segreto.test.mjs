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
import { apriBrowser, apriGioco, azzera, scatto, leggiProfilo, semina, attendi }
  from '../aiuto/browser.mjs'
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

/* la regola dei doppioni sta sotto gli occhi, non solo nel racconto della
   tappa: è la domanda che torna a ogni riga, e qui la risposta è «no» */
controlla('il promemoria dei doppioni è a schermo',
          await page.locator('.cs-regola').count() === 1)
controlla('e sulla prima tappa dice che un disegno non si ripete',
          await page.locator('.cs-regola.cs-nienteDoppioni').count() === 1,
          await page.locator('.cs-regola').innerText())

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

/* ---------- 8. il tabellone lungo scorre invece di schiacciarsi ----------
   Quante prove concede uno scaglione lo decide la taratura, non la
   diagonale del telefono: quando le righe non ci stanno tutte non si
   stringono fino a diventare illeggibili, si fermano a un'altezza minima e
   il tabellone scorre. Qui si prova sullo scaglione più lungo — il gioco
   libero «esperto», nove righe — su uno schermo piccolo, che è dove le
   righe non ci stanno di sicuro. E si prova la cosa che rende lo scroll
   usabile invece che solo possibile: dopo aver consegnato, la riga da
   scrivere deve trovarsi sotto gli occhi da sola. */
{
  const esperto = Regole.libere('esperto', 'animali')
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto(page.url().replace(/#.*$/, ''))   // semina ricarica, e ricarica in home
  await page.waitForSelector('.carte', { timeout: 5000 })
  await semina(page, {
    campagne: { codice: { tappa: CAMPAGNA.length, libera: true,
                          cfg: { spiegata: true },   // già vista: qui non è lei da provare
                          stelle: Object.fromEntries(CAMPAGNA.map((_, i) => [i, 3])) } },
  })
  await page.goto(page.url().replace(/#.*$/, '') + '#codice')
  await page.waitForSelector('.cs-mappa', { timeout: 5000 })
  controlla('finita la campagna il gioco libero si apre',
            await page.locator('.cs-libero:not(.cs-chiusa)').count() === 1)
  await page.locator('.cs-libero').click()
  await attendi(page, 300)
  await page.locator('.cs-scelte').first().locator('button')
      .nth(3).click()                       // la manopola della difficoltà, all'ultima tacca
  await attendi(page, 150)
  await page.locator('.cs-grosso').last().click()
  await page.waitForSelector('.cs-tabellone', { timeout: 5000 })

  controlla('e qui il promemoria dice il contrario: i doppioni si possono',
            await page.locator('.cs-regola').count() === 1 &&
            await page.locator('.cs-regola.cs-nienteDoppioni').count() === 0,
            await page.locator('.cs-regola').innerText())

  uguale('«esperto» mette in tavola tutte le sue righe',
         await page.locator('.cs-riga').count(), esperto.prove)
  uguale('e le sue caselle', await page.locator('.cs-riga.cs-attiva .cs-casella').count(),
         esperto.caselle)

  /* si gioca una riga, così i pallini ci sono davvero da misurare */
  for (let i = 0; i < esperto.caselle; i++)
    await page.locator('.cs-tasto').nth(i % 4).click()
  await page.locator('.cs-conferma').click()
  await attendi(page, 500)

  const riga = await page.locator('.cs-riga').first().boundingBox()
  const indizi = await page.locator('.cs-indizi').first().boundingBox()
  controlla('le righe non si schiacciano sotto il minimo leggibile',
            riga.height >= 55, `una riga alta ${riga.height.toFixed(1)}px`)
  controlla('il riquadro dei pallini sta dentro la sua riga',
            indizi.height <= riga.height + 0.5,
            `pallini ${indizi.height.toFixed(1)}px in una riga da ${riga.height.toFixed(1)}px`)
  const misure = await page.locator('.cs-tabellone').evaluate(el => ({
    dentro: el.clientHeight, tutto: el.scrollHeight, quantoScorre: el.scrollTop,
  }))
  controlla('e su uno schermo piccolo il tabellone scorre',
            misure.tutto > misure.dentro + 1,
            `${misure.tutto}px di righe in ${misure.dentro}px di tabellone`)
  const pallino = await page.locator('.cs-pallino').first().boundingBox()
  controlla('un pallino resta grosso abbastanza da vedersi',
            pallino.height >= 9, `${pallino.height.toFixed(1)}px`)
  await scatto(page, 'codice-esperto-stretto')

  /* si gioca fino in fondo al tabellone: la riga da scrivere deve restare
     sotto gli occhi, o il gioco sembra non aver reagito al dito */
  /* l'ultima riga non si consegna: chiuderebbe la partita, e una partita
     finita non ha più nessuna riga attiva da tenere in vista */
  for (let n = 2; n < esperto.prove; n++) {
    for (let i = 0; i < esperto.caselle; i++)
      await page.locator('.cs-tasto').nth((i + n) % 4).click()
    await page.locator('.cs-conferma').click()
    await attendi(page, 400)
    if (!await page.locator('.cs-riga.cs-attiva').count()) break   // indovinato per caso
    const attiva = await page.locator('.cs-riga.cs-attiva').boundingBox()
    const quadro = await page.locator('.cs-tabellone').boundingBox()
    controlla(`consegnata la riga ${n - 1}, la riga da scrivere è in vista`,
              attiva && attiva.y >= quadro.y - 1 &&
              attiva.y + attiva.height <= quadro.y + quadro.height + 1,
              `riga a ${attiva?.y.toFixed(0)}px in un tabellone da ${quadro.y.toFixed(0)}` +
              ` a ${(quadro.y + quadro.height).toFixed(0)}px`)
  }
  await scatto(page, 'codice-esperto-scorso')

  /* ...e le righe di prima non se ne vanno: si torna a guardarle col dito.
     Il trascinamento vero passa dal CDP e non da eventi finti — un
     `TouchEvent` costruito a mano non scorre niente, e un test che lo usa
     direbbe «funziona» qualunque cosa faccia il browser. */
  const quadro = await page.locator('.cs-tabellone').boundingBox()
  const scorso = await page.locator('.cs-tabellone').evaluate(el => el.scrollTop)
  controlla('giocando fin qui il tabellone si è mosso', scorso > 0, `${scorso}px`)
  const cdp = await page.context().newCDPSession(page)
  const dito = (type, y) => cdp.send('Input.dispatchTouchEvent', {
    type, touchPoints: type === 'touchEnd' ? [] : [{ x: quadro.x + quadro.width / 2, y }],
  })
  const trascina = async () => {
    await dito('touchStart', quadro.y + 40)
    for (let y = quadro.y + 40; y <= quadro.y + quadro.height - 20; y += 15)
      await dito('touchMove', y)
    await dito('touchEnd', quadro.y + quadro.height - 20)
    await attendi(page, 400)
    return page.locator('.cs-tabellone').evaluate(el => el.scrollTop)
  }
  const dopoUnaTirata = await trascina()
  controlla('una tirata di dito riporta indietro', dopoUnaTirata < scorso,
            `da ${scorso}px a ${dopoUnaTirata}px`)
  /* e insistendo si arriva in cima: la prima riga giocata è ancora lì */
  let dove = dopoUnaTirata
  for (let giro = 0; giro < 5 && dove > 0; giro++) dove = await trascina()
  uguale('e col dito si torna alla prima riga giocata', dove, 0)

  /* niente esce dalla portata del dito: sette disegni non entrano in una
     riga sola su uno schermo stretto, e un tasto mezzo fuori è un disegno
     che non si può giocare */
  const larghezza = (await page.viewportSize()).width
  let fuori = 0
  for (const t of await page.locator('.cs-tasto').all()) {
    const b = await t.boundingBox()
    if (b.x < -0.5 || b.x + b.width > larghezza + 0.5) fuori++
  }
  uguale('tutti i disegni restano dentro lo schermo', fuori, 0)
}

controlla('nessun errore JS', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('codice segreto nel browser')
