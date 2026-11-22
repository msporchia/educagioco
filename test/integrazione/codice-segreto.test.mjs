/* ═══════════════════════════════════════════════════════════════════
   CODICE SEGRETO, NEL BROWSER

   perché: la tappa del Codice Segreto si vince ragionando sui pallini letti a schermo (il codice è nascosto come per il bambino), poi si apre la tappa dopo e stelle, monete e traguardi finiscono nel profilo e nell'albo; la partita lasciata a metà ritrova tavolo, righe e codice anche dopo una ricarica, e nel libero la serie sopravvive all'uscita; il tabellone lungo scorre col dito su uno schermo piccolo
   a parte perché: il motore e la sosta come dati stanno in `unita/codice-segreto` e `unita/codice-segreto-sosta`, che non vedono cosa disegna il gioco; qui ogni prova è un blocco dello stesso tavolo

   Stessa mappa e stesso tavolo per la tappa giocata e per quella lasciata
   a metà. La prova unitaria dice che il motore è giusto; questa
   dice che il gioco che il bambino tocca è quel motore lì. Il codice qui
   non si conosce: la tappa si vince leggendo la riga appena giocata,
   scartando i codici che non spiegherebbero quegli indizi e provando il
   primo che resta. Se il gioco disegnasse pallini diversi da quelli che
   il motore calcola, questo test non riuscirebbe mai a vincere.

   L'orologio della pagina è quello finto di playwright (scorre da sé):
   la spiegazione della prima volta è un giro di `setTimeout`, e si porta
   avanti invece di guardarlo.
   `node test/esegui.mjs integrazione/codice-segreto --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, scatto, leggiProfilo, semina, attendi, scegli } from '../aiuto/browser.mjs'
import { chiudiTraguardi, GIA_FESTEGGIATI } from '../aiuto/traguardi.mjs'
import { finche } from '../aiuto/soste.mjs'
import { controlla, uguale, dentro, nota, riassunto, blocco } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/codice-segreto/dati/campagna.js'
import { Regole } from '../../src/giochi/codice-segreto/motore/partita.js'
import { tuttiICodici, compatibili } from '../../src/giochi/codice-segreto/motore/banco.js'
import { VERSIONE } from '../../src/giochi/codice-segreto/motore/sosta.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await page.clock.install()
await azzera(page)

const aMappa = async () => {
  await page.goto(page.url().replace(/#.*$/, '') + '#codice')
  await page.waitForSelector('.cs-mappa', { timeout: 5000 })
}
// `semina` ricarica e aspetta la home: l'indirizzo non deve riaprire il gioco
const aCasa = () => page.evaluate(() => history.replaceState(null, '', location.pathname))
const indietro = async () => { await chiudiTraguardi(page); await page.click('button[aria-label="indietro"]') }
const posaCodice = async simboli => {
  for (const s of simboli) await page.locator(`.cs-tasto[data-simbolo="${s}"]`).click()
}
// consegnata, la riga è fra le fatte (o, se era il codice, arriva il cartello dopo il respiro)
const consegna = async () => {
  const prima = await page.locator('.cs-riga.cs-fatta').count()
  await page.locator('.cs-conferma').click()
  await page.waitForFunction(n => document.querySelectorAll('.cs-riga.cs-fatta').length > n, prima, { timeout: 3000 })
}

/* ═══════════ 1. la prima tappa, giocata ragionando ═══════════ */
await blocco('la prima tappa', async () => {
  controlla('la carta del gioco è in home', await page.locator('.carta.gioco[data-gioco="codice"]').count() === 1)
  await scegli(page, 'codice')
  await page.waitForSelector('.cs-mappa', { timeout: 5000 })
  uguale('la mappa elenca tutte le tappe', await page.locator('.cs-tappa').count(), CAMPAGNA.length)
  uguale('a profilo vuoto è aperta solo la prima', await page.locator('.cs-tappa:not(.cs-chiusa)').count(), 1)
  controlla('il gioco libero è chiuso finché la campagna non è finita', await page.locator('.cs-libero.cs-chiusa').count() === 1)
  await scatto(page, 'codice-mappa')

  /* la spiegazione si apre da sola la prima volta, e il giro dell'esempio posa il pallino che ha calcolato il motore */
  await page.locator('.cs-tappa[data-tappa="0"]').click()
  controlla('la spiegazione si apre da sola alla prima partita',
            await page.waitForSelector('[data-velo="spiegazione"]', { timeout: 5000 }).then(() => true, () => false))
  await page.clock.runFor(4000)
  await page.waitForSelector('.cs-dindizi .cs-pallino.cs-pieno', { timeout: 3000 }).catch(() => {})
  uguale('la spiegazione mostra il pallino pieno che ha calcolato il motore',
         await page.locator('.cs-dindizi .cs-pallino.cs-pieno').count(), 1)
  await scatto(page, 'codice-spiegazione')
  await page.locator('[data-velo="spiegazione"] .cs-grosso').click()
  await page.waitForSelector('[data-velo="spiegazione"]', { state: 'detached', timeout: 3000 })

  /* il tavolo è quello che la tappa promette */
  const regole = Regole.perTappa(CAMPAGNA[0])
  uguale('in tastiera ci sono i disegni dello scaglione', await page.locator('.cs-tasto').count(), regole.pool.length)
  uguale('le caselle sono quelle dello scaglione', await page.locator('.cs-riga.cs-attiva .cs-casella').count(), regole.caselle)
  uguale('le righe sono le prove concesse', await page.locator('.cs-riga').count(), regole.prove)
  uguale('i disegni sono quelli del tema', await page.locator('.cs-tasto').first().innerText(), regole.pool[0])
  /* la regola dei doppioni sta sotto gli occhi: è la domanda che torna a ogni riga, e qui la risposta è «no» */
  controlla('il promemoria dei doppioni è a schermo', await page.locator('.cs-regola').count() === 1)
  controlla('e sulla prima tappa dice che un disegno non si ripete',
            await page.locator('.cs-regola.cs-nienteDoppioni').count() === 1, await page.locator('.cs-regola').innerText())

  /* si posa e si toglie: il gesto che un bambino sbaglia per primo */
  await page.locator('.cs-tasto').first().click()
  await page.waitForSelector('.cs-riga.cs-attiva .cs-casella.cs-piena', { timeout: 2000 }).catch(() => {})
  uguale('posando si riempie la prima buca', await page.locator('.cs-riga.cs-attiva .cs-casella.cs-piena').count(), 1)
  controlla('con la riga a metà non si consegna', await page.locator('.cs-conferma').isDisabled())
  await page.locator('.cs-riga.cs-attiva .cs-casella.cs-piena').first().click()
  await page.waitForSelector('.cs-riga.cs-attiva .cs-casella.cs-piena', { state: 'detached', timeout: 2000 }).catch(() => {})
  uguale('toccando una casella piena si toglie', await page.locator('.cs-riga.cs-attiva .cs-casella.cs-piena').count(), 0)

  /* si gioca la tappa ragionando sugli indizi: posa un codice, consegna, legge dallo schermo i due numeri */
  const TUTTI = tuttiICodici(regole)
  const provaCodice = async codice => {
    await posaCodice(codice)
    await consegna()
    const ultima = page.locator('.cs-riga.cs-fatta').last()
    return { simboli: codice, pieni: await ultima.locator('.cs-pallino.cs-pieno').count(),
             vuoti: await ultima.locator('.cs-pallino.cs-vuoto').count() }
  }
  const vinciUnCodice = async () => {
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
    controlla(`codice ${n} di ${quanti}: trovato ragionando sui pallini a schermo`, prove > 0, 'gli indizi a schermo non portano da nessuna parte')
    proveInTutto += prove
    await page.waitForSelector('.cs-velo[data-fine]', { timeout: 5000 })   // il respiro prima del cartello
    uguale(`codice ${n}: il cartello di fine si apre`, await page.locator('.cs-velo').getAttribute('data-fine'), n < quanti ? 'partita' : 'tappa')
    if (n === quanti) break
    await chiudiTraguardi(page)
    await page.locator('.cs-velo .cs-grosso').first().click()
    await page.waitForSelector('.cs-velo', { state: 'detached', timeout: 3000 })
  }
  nota(`tappa vinta in ${proveInTutto} prove per ${quanti} codici`)
  await scatto(page, 'codice-tappa-finita')

  /* quello che resta dopo */
  dentro('la tappa vale da una a tre stelle', (await page.locator('.cs-velo .cs-punteggio').innerText()).length, 1, 3)
  await chiudiTraguardi(page)
  await page.locator('.cs-velo .cs-grosso').first().click()
  await page.waitForSelector('.cs-mappa', { timeout: 5000 })
  uguale('finita la prima tappa, la seconda si apre', await page.locator('.cs-tappa:not(.cs-chiusa)').count(), 2)
  controlla('la tappa fatta mostra le sue stelle', (await page.locator('.cs-tappa[data-tappa="0"] .cs-stelle').innerText()).includes('⭐'))
  const profilo = await leggiProfilo(page)
  const av = profilo?.campagne?.codice
  controlla('l\'avanzamento è finito nel profilo salvato', !!av, JSON.stringify(profilo?.campagne))
  uguale('e dice che una tappa è stata superata', av?.tappa, 1)
  dentro('con le stelle di quella tappa', av?.stelle?.['0'] || 0, 1, 3)
  controlla('le monete sono arrivate', (profilo?.coins || 0) > 0, String(profilo?.coins))
  uguale('e i codici indovinati sono contati', profilo?.totals?.codici, quanti)
})

/* ═══════════ 2. l'albo ha la sua famiglia, e un traguardo è scattato ═══════════
   I traguardi del gioco li dichiara il manifesto, non `data/traguardi.js`: si prova che il giro arrivi fino in fondo (famiglia
   in pagina, badge preso, esperienza contata), perché è la parte che si romperebbe in silenzio. */
await blocco('l\'albo', async () => {
  await page.goto(page.url().replace(/#.*$/, '') + '#albo')
  await page.waitForSelector('.area[data-area="codice"]', { timeout: 5000 })
  const famiglia = page.locator('.area[data-area="codice"]')
  uguale('l\'albo ha la famiglia del Codice Segreto, con i cinque traguardi del manifesto', await famiglia.locator('.badge').count(), 5)
  controlla('e la prima tappa ne ha già acceso almeno uno', await famiglia.locator('.badge:not(.spento)').count() >= 1)
  controlla('la famiglia mostra anche il livello guadagnato', await famiglia.locator('.liv').count() === 1)
  await scatto(page, 'codice-albo')

  /* la spiegazione non torna a ogni partita */
  await aMappa()
  await page.locator('.cs-tappa[data-tappa="0"]').click()
  await page.waitForSelector('.cs-tabellone', { timeout: 5000 })
  uguale('vista una volta, la spiegazione non si rimette in mezzo', await page.locator('[data-velo="spiegazione"]').count(), 0)
  controlla('e si può richiamare dal punto interrogativo in barra', await page.locator('button[aria-label="come si gioca"]').count() === 1)
})

/* ═══════════ 3. una tappa lasciata a metà ═══════════
   Si esce con ←, si rientra, la mappa offre in cima «torno da dove ero» e il tavolo è com'era (righe, pallini, codice
   segreto). Anche dopo aver ricaricato la pagina, e mai in silenzio: una tappa nuova chiede prima. Vedi docs/codice-segreto/sosta.md. */
// l'archivio scrive con un po' di ritardo, e coi test in parallelo anche di più: si aspetta la sosta attesa (al più 5 s)
const sostaScritta = (attesa = s => !!s) =>
  finche(async () => (await leggiProfilo(page))?.campagne?.codice?.sosta || null, attesa, 5000, 50)
const tavolo = () => page.evaluate(() => ({
  fatte: [...document.querySelectorAll('.cs-riga.cs-fatta')].map(r =>
    [...r.querySelectorAll('.cs-casella')].map(c => c.textContent.trim()).join('') + ':' +
    r.querySelectorAll('.cs-pallino.cs-pieno').length + '/' + r.querySelectorAll('.cs-pallino.cs-vuoto').length),
  attiva: [...document.querySelectorAll('.cs-riga.cs-attiva .cs-casella')].map(c => c.textContent.trim()).join(''),
}))
/* il codice della partita sul tavolo, dalla sosta: si posa una casella e si aspetta la sosta che ha quella casella e le righe
   del tavolo (quella di prima sul disco può essere del codice vinto un attimo fa), poi la casella si toglie */
async function codiceInGioco() {
  const fatte = await page.locator('.cs-riga.cs-fatta').count()
  await page.locator('.cs-tasto').first().click()
  const s = await sostaScritta(x => x?.partita?.corrente?.filter(c => c).length === 1 && (x.partita.prove || []).length === fatte)
  await page.evaluate(() => document.querySelectorAll('.cs-riga.cs-attiva .cs-casella.cs-piena').forEach(c => c.click()))
  return s.partita.codice
}
// il tavolo dopo una ripresa, quando ha le righe attese: la ripresa lo ridisegna un attimo dopo il tabellone
const tavoloCon = fatte => finche(tavolo, t => t.fatte.length === fatte, 3000)
/* una riga sbagliata di certo (una «a caso» ogni tanto indovinava): il codice nato si legge dalla sosta, e si posa una fila
   di simboli diversi che non è lui */
async function rigaSbagliata(pool) {
  const codice = await codiceInGioco()
  let riga = pool.slice(0, codice.length)
  for (let k = 1; riga.join() === codice.join() && k < pool.length; k++)
    riga = [...pool.slice(k), ...pool.slice(0, k)].slice(0, codice.length)
  await posaCodice(riga)
  await consegna()
}

await blocco('una tappa lasciata a metà', async () => {
  await aCasa()
  await semina(page, { campagne: { codice: { tappa: 2, stelle: {}, cfg: { spiegata: true } } }, ...GIA_FESTEGGIATI })
  await aMappa()
  controlla('a profilo pulito la mappa non offre nessuna ripresa', await page.locator('[data-ripresa]').count() === 0)
  await page.locator('.cs-tappa[data-tappa="0"]').click()
  await page.waitForSelector('.cs-tabellone')
  const pool = await page.locator('.cs-tasto').evaluateAll(t => t.map(x => x.dataset.simbolo))
  await rigaSbagliata(pool)
  await posaCodice(pool.slice(0, 2))                    // e una riga a metà
  const lasciato = await tavolo()
  const sostaPrima = await sostaScritta(s => s?.partita?.prove?.length === 1)
  controlla('mentre si gioca la sosta è già scritta (non solo uscendo)', sostaPrima?.partita?.prove?.length === 1, JSON.stringify(sostaPrima))
  const codicePrima = sostaPrima.partita.codice.join('')
  const monetePrima = (await leggiProfilo(page)).coins || 0

  /* ← : si torna alla mappa, e la carta c'è */
  await indietro()
  await page.waitForSelector('[data-ripresa]')
  const carta = await page.locator('[data-ripresa]').textContent()
  controlla('la carta dice qual era la tappa e il codice', /Il canile/.test(carta) && /codice 1 di 3/.test(carta), carta)
  controlla('e quante righe erano giocate', /1 riga giocata\b/.test(carta), carta)
  await scatto(page, 'codice-ripresa')
  await page.click('[data-ripresa] [data-azione="riprendi"]')
  await page.waitForSelector('.cs-tabellone')
  const ripreso = await tavoloCon(lasciato.fatte.length)
  uguale('il tavolo è com\'era: righe e pallini', JSON.stringify(ripreso.fatte), JSON.stringify(lasciato.fatte))
  uguale('e la riga a metà dov\'era', ripreso.attiva, lasciato.attiva)
  uguale('senza pausa che aspetta: il gioco non ha un orologio', await page.locator('[data-pausa]').count(), 0)
  uguale('uscire e rientrare non dà né toglie monete', (await leggiProfilo(page)).coins || 0, monetePrima)

  /* uscire e rientrare non cambia il codice */
  await page.locator('.cs-riga.cs-attiva .cs-casella.cs-piena').first().click()   // toglie una
  await indietro()
  await page.waitForSelector('[data-ripresa]')
  const dopoDueUscite = await sostaScritta(s => s?.partita?.corrente?.filter(x => x).length === 1)
  uguale('il codice segreto non è cambiato', dopoDueUscite.partita.codice.join(''), codicePrima)
  uguale('e la riga tolta resta tolta', dopoDueUscite.partita.corrente.filter(s => s).length, 1)

  /* la pagina che sparisce (il telefono in tasca): si ricarica e la carta c'è ancora */
  await page.click('[data-ripresa] [data-azione="riprendi"]')
  await page.waitForSelector('.cs-tabellone')
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
  await sostaScritta(s => !!s?.partita)
  await page.reload()
  await page.waitForSelector('.cs-mappa')
  uguale('anche dopo aver ricaricato la pagina la carta c\'è', await page.locator('[data-ripresa]').count(), 1)

  /* un codice vinto fa avanzare la sosta: la tappa riprende al secondo */
  await page.click('[data-ripresa] [data-azione="riprendi"]')
  await page.waitForSelector('.cs-tabellone')
  await tavoloCon(1)
  await page.evaluate(() => document.querySelectorAll('.cs-riga.cs-attiva .cs-casella.cs-piena').forEach(c => c.click()))   // si svuota la riga
  await posaCodice(dopoDueUscite.partita.codice)
  await consegna()
  await page.waitForSelector('.cs-velo[data-fine]', { timeout: 3000 })
  uguale('il cartello dice che si è trovato', await page.locator('.cs-velo').getAttribute('data-fine'), 'partita')
  const monetePreso = await finche(async () => (await leggiProfilo(page)).coins || 0, m => m > monetePrima, 3000)
  controlla('le monete del codice sono arrivate una volta sola', monetePreso > monetePrima, `${monetePrima} → ${monetePreso}`)
  await indietro()                                      // col cartello aperto
  await page.waitForSelector('[data-ripresa]')
  controlla('col cartello aperto si esce lo stesso: la carta dice che si è al secondo codice',
            /codice 2 di 3/.test(await page.locator('[data-ripresa]').textContent()))
  await page.click('[data-ripresa] [data-azione="riprendi"]')
  await page.waitForSelector('.cs-tabellone')
  uguale('il codice vinto non si rigioca: tavolo nuovo', (await tavolo()).fatte.length, 0)
  uguale('e non si ripaga', (await leggiProfilo(page)).coins || 0, monetePreso)

  /* toccare un'altra tappa non butta la sosta in silenzio */
  await rigaSbagliata(pool)
  await indietro()
  await page.waitForSelector('[data-ripresa]')
  await page.click('.cs-tappa[data-tappa="1"]')
  uguale('una tappa nuova chiede prima', await page.locator('[data-chiede]').count(), 1)
  await page.click('[data-chiede] [data-azione="riprendi-invece"]')
  await page.waitForSelector('.cs-tabellone')
  uguale('«torno a quella di prima» riprende la tappa a metà', (await tavoloCon(1)).fatte.length, 1)
  await indietro()
  await page.waitForSelector('[data-ripresa]')
  await page.click('.cs-tappa[data-tappa="1"]')
  await page.click('[data-chiede] [data-azione="comincia"]')
  await page.waitForSelector('.cs-tabellone')
  uguale('«comincio» la tappa nuova: tavolo pulito', (await tavolo()).fatte.length, 0)
  await indietro()
  await page.waitForSelector('.cs-mappa')
  uguale('la nuova tappa, ancora intatta, non lascia carta (la vecchia è buttata)', await page.locator('[data-ripresa]').count(), 0)

  /* «lascio perdere» butta la sosta */
  await page.locator('.cs-tappa[data-tappa="0"]').click()
  await page.waitForSelector('.cs-tabellone')
  await posaCodice(pool.slice(0, 1))
  await indietro()
  await page.waitForSelector('[data-ripresa]')
  await page.click('[data-ripresa] [data-azione="scorda"]')
  uguale('«lascio perdere» toglie la carta', await page.locator('[data-ripresa]').count(), 0)
  uguale('e la sosta dal profilo', await sostaScritta(s => s === null), null)

  /* una tappa che non è più aperta (i grandi l'hanno richiusa) non si offre, e la sosta aspetta: riaperta, la carta torna */
  const aMetaDellaTerza = { v: VERSIONE, chiave: CAMPAGNA[2].chiave, vinte: 1, partita: null }
  await aCasa()
  await semina(page, { campagne: { codice: { tappa: 0, stelle: {}, cfg: { spiegata: true }, sosta: aMetaDellaTerza } } })
  await aMappa()
  uguale('una tappa chiusa non offre la ripresa', await page.locator('[data-ripresa]').count(), 0)
  controlla('ma la sosta resta', !!(await sostaScritta(s => !!s)))
  await aCasa()
  await semina(page, { campagne: { codice: { tappa: 2, stelle: {}, cfg: { spiegata: true }, sosta: aMetaDellaTerza } } })
  await aMappa()
  uguale('riaperta, la carta torna', await page.locator('[data-ripresa]').count(), 1)
})

/* ═══════════ 4. il gioco libero: la serie sopravvive all'uscita ═══════════
   Nel libero la serie sopravvive all'uscita e il record si scrive solo con «lascio perdere». */
const finita = { tappa: CAMPAGNA.length, libera: true, stelle: Object.fromEntries(CAMPAGNA.map((_, i) => [i, 3])), cfg: { spiegata: true } }
await blocco('il libero lasciato a metà', async () => {
  await aCasa()
  await semina(page, { campagne: { codice: finita }, ...GIA_FESTEGGIATI })
  await aMappa()
  await page.locator('.cs-libero').click()
  await page.locator('[data-manopola="difficolta"] [data-scelta="facile"]').click()
  await page.locator('[data-azione="gioca"]').click()
  await page.waitForSelector('.cs-tabellone')
  // un codice appena nato non è nella sosta: una casella posata lo mette lì, e da lì si legge il codice per vincere
  const vinciIlLibero = async () => {
    await posaCodice(await codiceInGioco())
    await consegna()
    await page.waitForSelector('.cs-velo[data-fine]', { timeout: 3000 })
  }
  const unAltro = async () => {
    await chiudiTraguardi(page)
    await page.locator('.cs-velo .cs-grosso').first().click()   // «un altro»
    await page.waitForSelector('.cs-velo', { state: 'detached', timeout: 3000 })
  }
  await vinciIlLibero()
  await unAltro()
  await vinciIlLibero()
  await indietro()                                      // ← col cartello aperto, serie a 2
  await page.waitForSelector('[data-ripresa]')
  controlla('la carta del libero dice quanti di fila', /2 di fila/.test(await page.locator('[data-ripresa]').textContent()))
  const profilo1 = await leggiProfilo(page)
  controlla('uscendo il record non si scrive: la serie è ancora in corso', !(profilo1.campagne.codice.primato?.best),
            JSON.stringify(profilo1.campagne.codice.primato))
  await page.click('[data-ripresa] [data-azione="riprendi"]')
  await page.waitForSelector('.cs-tabellone')
  await vinciIlLibero()
  await unAltro()
  await indietro()
  await page.waitForSelector('[data-ripresa]')
  controlla('ripresa, la serie continua: tre di fila', /3 di fila/.test(await page.locator('[data-ripresa]').textContent()))
  await page.click('[data-ripresa] [data-azione="scorda"]')
  const profilo2 = await finche(() => leggiProfilo(page), p => !p.campagne.codice.sosta, 3000)
  uguale('«lascio perdere» scrive il record della serie', profilo2.campagne.codice.primato?.best, 3)
  uguale('e toglie la sosta', profilo2.campagne.codice.sosta, undefined)
})

/* ═══════════ 5. il tabellone lungo scorre invece di schiacciarsi ═══════════
   Quante prove concede uno scaglione lo decide la taratura, non il telefono: quando le righe non ci stanno si fermano a
   un'altezza minima e il tabellone scorre. Si prova sullo scaglione più lungo (il libero «esperto») su uno schermo piccolo;
   quante righe siano lo dice lo scaglione. E dopo aver consegnato la riga da scrivere deve trovarsi sotto gli occhi da sola. */
await blocco('il tabellone lungo, su uno schermo piccolo', async () => {
  const esperto = Regole.libere('esperto', 'animali')
  await page.setViewportSize({ width: 320, height: 568 })
  await aCasa()
  await semina(page, { campagne: { codice: finita }, ...GIA_FESTEGGIATI })
  await aMappa()
  controlla('finita la campagna il gioco libero si apre', await page.locator('.cs-libero:not(.cs-chiusa)').count() === 1)
  await page.locator('.cs-libero').click()
  await page.locator('[data-manopola="difficolta"] [data-scelta="esperto"]').click()   // la manopola della difficoltà, all'ultima tacca
  await page.locator('[data-azione="gioca"]').click()
  await page.waitForSelector('.cs-tabellone', { timeout: 5000 })
  controlla('e qui il promemoria dice il contrario: i doppioni si possono',
            await page.locator('.cs-regola').count() === 1 && await page.locator('.cs-regola.cs-nienteDoppioni').count() === 0,
            await page.locator('.cs-regola').innerText())
  uguale('«esperto» mette in tavola tutte le sue righe', await page.locator('.cs-riga').count(), esperto.prove)
  uguale('e le sue caselle', await page.locator('.cs-riga.cs-attiva .cs-casella').count(), esperto.caselle)

  /* si gioca una riga, così i pallini ci sono davvero da misurare */
  for (let i = 0; i < esperto.caselle; i++) await page.locator('.cs-tasto').nth(i % 4).click()
  await consegna()
  // i pallini volano al loro posto e crescono: si misurano posati
  await page.waitForFunction(() => {
    const p = document.querySelector('.cs-riga.cs-fatta .cs-pallino')?.getBoundingClientRect()
    return p && p.height >= 9 && !document.getAnimations().some(a => a.playState === 'running' && a.effect?.target?.closest?.('.cs-indizi'))
  }, null, { timeout: 3000 }).catch(() => {})
  const riga = await page.locator('.cs-riga').first().boundingBox()
  const indizi = await page.locator('.cs-indizi').first().boundingBox()
  controlla('le righe non si schiacciano sotto il minimo leggibile', riga.height >= 55, `una riga alta ${riga.height.toFixed(1)}px`)
  controlla('il riquadro dei pallini sta dentro la sua riga', indizi.height <= riga.height + 0.5,
            `pallini ${indizi.height.toFixed(1)}px in una riga da ${riga.height.toFixed(1)}px`)
  const misure = await page.locator('.cs-tabellone').evaluate(el => ({ dentro: el.clientHeight, tutto: el.scrollHeight }))
  controlla('e su uno schermo piccolo il tabellone scorre', misure.tutto > misure.dentro + 1,
            `${misure.tutto}px di righe in ${misure.dentro}px di tabellone`)
  const pallino = await page.locator('.cs-pallino').first().boundingBox()
  controlla('un pallino resta grosso abbastanza da vedersi', pallino.height >= 9, `${pallino.height.toFixed(1)}px`)
  await scatto(page, 'codice-esperto-stretto')

  /* si gioca fino in fondo al tabellone: la riga da scrivere resta sotto gli occhi. L'ultima non si consegna: chiuderebbe la
     partita, e una partita finita non ha più nessuna riga attiva. Il tabellone scorre da sé: si guarda quando ha smesso */
  for (let n = 2; n < esperto.prove; n++) {
    for (let i = 0; i < esperto.caselle; i++) await page.locator('.cs-tasto').nth((i + n) % 4).click()
    await consegna()
    if (!await page.locator('.cs-riga.cs-attiva').count()) break   // indovinato per caso
    await page.waitForFunction(() => {
      const a = document.querySelector('.cs-riga.cs-attiva')?.getBoundingClientRect(), q = document.querySelector('.cs-tabellone').getBoundingClientRect()
      return a && a.top >= q.top - 1 && a.bottom <= q.bottom + 1
    }, null, { timeout: 1500 }).catch(() => {})
    const attiva = await page.locator('.cs-riga.cs-attiva').boundingBox()
    const quadro = await page.locator('.cs-tabellone').boundingBox()
    controlla(`consegnata la riga ${n - 1}, la riga da scrivere è in vista`,
              attiva && attiva.y >= quadro.y - 1 && attiva.y + attiva.height <= quadro.y + quadro.height + 1,
              `riga a ${attiva?.y.toFixed(0)}px in un tabellone da ${quadro.y.toFixed(0)} a ${(quadro.y + quadro.height).toFixed(0)}px`)
  }
  await scatto(page, 'codice-esperto-scorso')

  /* ...e le righe di prima non se ne vanno: si torna a guardarle col dito. Il trascinamento vero passa dal CDP: un
     `TouchEvent` costruito a mano non scorre niente */
  const quadro = await page.locator('.cs-tabellone').boundingBox()
  const scorso = await page.locator('.cs-tabellone').evaluate(el => el.scrollTop)
  controlla('giocando fin qui il tabellone si è mosso', scorso > 0, `${scorso}px`)
  const cdp = await page.context().newCDPSession(page)
  const dito = (type, y) => cdp.send('Input.dispatchTouchEvent', {
    type, touchPoints: type === 'touchEnd' ? [] : [{ x: quadro.x + quadro.width / 2, y }],
  })
  const trascina = async () => {
    await dito('touchStart', quadro.y + 40)
    for (let y = quadro.y + 40; y <= quadro.y + quadro.height - 20; y += 15) await dito('touchMove', y)
    await dito('touchEnd', quadro.y + quadro.height - 20)
    await attendi(page, 250)
    return page.locator('.cs-tabellone').evaluate(el => el.scrollTop)
  }
  const dopoUnaTirata = await trascina()
  controlla('una tirata di dito riporta indietro', dopoUnaTirata < scorso, `da ${scorso}px a ${dopoUnaTirata}px`)
  let dove = dopoUnaTirata
  for (let giro = 0; giro < 5 && dove > 0; giro++) dove = await trascina()
  uguale('e col dito si torna alla prima riga giocata', dove, 0)

  /* niente esce dalla portata del dito: un tasto mezzo fuori è un disegno che non si può giocare */
  const larghezza = (await page.viewportSize()).width
  const fuori = await page.locator('.cs-tasto').evaluateAll((ts, w) => ts.filter(t => {
    const b = t.getBoundingClientRect()
    return b.left < -0.5 || b.right > w + 0.5
  }).length, larghezza)
  uguale('tutti i disegni restano dentro lo schermo', fuori, 0)
})

controlla('nessun errore JS', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('codice segreto nel browser')
