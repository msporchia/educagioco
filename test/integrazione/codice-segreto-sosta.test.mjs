/* perché: il Codice Segreto lasciato a metà: il tavolo ritrova righe, pallini e codice segreto, anche dopo una ricarica; nel libero la serie sopravvive all'uscita e il record si scrive solo con «lascio perdere»
   a parte perché: potrebbe stare in `codice-segreto` (stesso tavolo, stessa mappa); sta a parte perché non gioca la tappa fino in fondo ma esce, rientra e ricarica
   Il Codice Segreto lasciato a metà, nel browser: si esce con ←, si
   rientra, la mappa offre in cima «torno da dove ero» e il tavolo è
   com'era (righe, pallini, codice segreto). Anche dopo aver ricaricato la
   pagina, e mai in silenzio: una tappa nuova chiede prima. Nel libero la
   serie sopravvive all'uscita e il record si scrive solo con «lascio
   perdere». Vedi docs/codice-segreto/sosta.md.
   `node test/esegui.mjs codice-segreto-sosta` */
import { apriBrowser, apriGioco, semina, leggiProfilo, scatto, GIOCATORE }
  from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { finche } from '../aiuto/soste.mjs'
import { CAMPAGNA } from '../../src/giochi/codice-segreto/dati/campagna.js'
import { VERSIONE } from '../../src/giochi/codice-segreto/motore/sosta.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)

const aMappa = async () => {
  await page.goto(page.url().replace(/#.*$/, '') + '#codice')
  await page.waitForSelector('.cs-mappa', { timeout: 5000 })
}
// l'archivio scrive con un po' di ritardo, e coi test in parallelo anche di più: si aspetta finché
// la sosta è quella attesa (al più cinque secondi), poi si torna quella che c'è
const sostaScritta = (attesa = s => !!s) =>
  finche(async () => (await leggiProfilo(page))?.campagne?.codice?.sosta || null, attesa, 5000, 50)
const indietro = () => page.click('button[aria-label="indietro"]')
const tavolo = () => page.evaluate(() => ({
  fatte: [...document.querySelectorAll('.cs-riga.cs-fatta')].map(r =>
    [...r.querySelectorAll('.cs-casella')].map(c => c.textContent.trim()).join('') + ':' +
    r.querySelectorAll('.cs-pallino.cs-pieno').length + '/' +
    r.querySelectorAll('.cs-pallino.cs-vuoto').length),
  attiva: [...document.querySelectorAll('.cs-riga.cs-attiva .cs-casella')]
    .map(c => c.textContent.trim()).join(''),
}))
const posaCodice = async simboli => {
  for (const s of simboli) await page.locator(`.cs-tasto[data-simbolo="${s}"]`).click()
}
// consegnata, la riga è fra le fatte (o, se era il codice, arriva il cartello dopo il respiro)
const consegna = async () => {
  const prima = await page.locator('.cs-riga.cs-fatta').count()
  await page.locator('.cs-conferma').click()
  await page.waitForFunction(n => document.querySelectorAll('.cs-riga.cs-fatta').length > n, prima, { timeout: 3000 })
}
/* il codice della partita sul tavolo, dalla sosta: si posa una casella e si aspetta la sosta che ha quella casella e le
   righe del tavolo (quella di prima sul disco può essere del codice vinto un attimo fa), poi la casella si toglie */
async function codiceInGioco() {
  const fatte = await page.locator('.cs-riga.cs-fatta').count()
  await page.locator('.cs-tasto').first().click()
  const s = await sostaScritta(x => x?.partita?.corrente?.filter(c => c).length === 1 && (x.partita.prove || []).length === fatte)
  await page.evaluate(() => document.querySelectorAll('.cs-riga.cs-attiva .cs-casella.cs-piena').forEach(c => c.click()))
  return s.partita.codice
}
// il tavolo dopo una ripresa, quando ha le righe attese: la ripresa lo ridisegna un attimo dopo il tabellone
const tavoloCon = fatte => finche(tavolo, t => t.fatte.length === fatte, 3000)
/* Una riga sbagliata di certo: «quello che capita» indovinava, ogni tanto, e la prova andava avanti con un codice vinto
   (al primo colpo, o al secondo codice: «torno a quella di prima» trovava un tavolo nuovo). Il codice nato si legge
   dalla sosta posando una casella, la si toglie, e si posa una fila di simboli diversi che non è lui. */
async function rigaSbagliata(pool) {
  const codice = await codiceInGioco()
  let riga = pool.slice(0, codice.length)
  for (let k = 1; riga.join() === codice.join() && k < pool.length; k++)
    riga = [...pool.slice(k), ...pool.slice(0, k)].slice(0, codice.length)
  await posaCodice(riga)
  await consegna()
}

/* ── una tappa a metà: tre tappe aperte, la spiegazione già vista ── */
await semina(page, { campagne: { codice: { tappa: 2, stelle: {}, cfg: { spiegata: true } } } })
await aMappa()
controlla('a profilo pulito la mappa non offre nessuna ripresa',
          await page.locator('[data-ripresa]').count() === 0)

await page.locator('.cs-tappa[data-tappa="0"]').click()
await page.waitForSelector('.cs-tabellone')
const pool = await page.locator('.cs-tasto').evaluateAll(t => t.map(x => x.dataset.simbolo))
await rigaSbagliata(pool)
await posaCodice(pool.slice(0, 2))                    // e una riga a metà

const lasciato = await tavolo()
const sostaPrima = await sostaScritta(s => s?.partita?.prove?.length === 1)
controlla('mentre si gioca la sosta è già scritta (non solo uscendo)',
          !!sostaPrima && sostaPrima.partita?.prove?.length === 1, JSON.stringify(sostaPrima))
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
uguale('uscire e rientrare non dà né toglie monete',
       (await leggiProfilo(page)).coins || 0, monetePrima)

/* uscire e rientrare non cambia il codice: si finisce ancora la riga e lo
   stesso codice si indovina con la sosta scritta */
await page.locator('.cs-riga.cs-attiva .cs-casella.cs-piena').first().click()   // toglie una
await indietro()
await page.waitForSelector('[data-ripresa]')
const dopoDueUscite = await sostaScritta(s => s?.partita?.corrente?.filter(x => x).length === 1)
uguale('il codice segreto non è cambiato', dopoDueUscite.partita.codice.join(''), codicePrima)
uguale('e la riga tolta resta tolta',
       dopoDueUscite.partita.corrente.filter(s => s).length, 1)

/* la pagina che sparisce (il telefono in tasca): si ricarica e la carta c'è ancora */
await page.click('[data-ripresa] [data-azione="riprendi"]')
await page.waitForSelector('.cs-tabellone')
await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
await sostaScritta(s => !!s?.partita)
await page.reload()
await page.waitForSelector('.cs-mappa')
uguale('anche dopo aver ricaricato la pagina la carta c\'è',
       await page.locator('[data-ripresa]').count(), 1)

/* un codice vinto fa avanzare la sosta: la tappa riprende al secondo */
await page.click('[data-ripresa] [data-azione="riprendi"]')
await page.waitForSelector('.cs-tabellone')
await tavoloCon(1)
await page.evaluate(() => document.querySelectorAll('.cs-riga.cs-attiva .cs-casella.cs-piena')
  .forEach(c => c.click()))                          // si svuota la riga
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
uguale('«torno a quella di prima» riprende la tappa a metà',
       (await tavoloCon(1)).fatte.length, 1)
await indietro()
await page.waitForSelector('[data-ripresa]')
await page.click('.cs-tappa[data-tappa="1"]')
await page.click('[data-chiede] [data-azione="comincia"]')
await page.waitForSelector('.cs-tabellone')
uguale('«comincio» la tappa nuova: tavolo pulito', (await tavolo()).fatte.length, 0)
await indietro()
await page.waitForSelector('.cs-mappa')
uguale('la nuova tappa, ancora intatta, non lascia carta (la vecchia è buttata)',
       await page.locator('[data-ripresa]').count(), 0)

/* «lascio perdere» butta la sosta */
await page.locator('.cs-tappa[data-tappa="0"]').click()
await page.waitForSelector('.cs-tabellone')
await posaCodice(pool.slice(0, 1))
await indietro()
await page.waitForSelector('[data-ripresa]')
await page.click('[data-ripresa] [data-azione="scorda"]')
uguale('«lascio perdere» toglie la carta', await page.locator('[data-ripresa]').count(), 0)
uguale('e la sosta dal profilo', await sostaScritta(s => s === null), null)

/* ── il gioco libero: la serie sopravvive all'uscita ── */
await page.goto(page.url().replace(/#.*$/, ''))        // semina ricarica, e vuole la home
await page.waitForSelector('.carte')
await semina(page, { campagne: { codice: { tappa: CAMPAGNA.length, libera: true,
  stelle: Object.fromEntries(CAMPAGNA.map((_, i) => [i, 3])), cfg: { spiegata: true } } } })
await aMappa()
await page.locator('.cs-libero').click()
await page.locator('[data-manopola="difficolta"] [data-scelta="facile"]').click()
await page.locator('[data-azione="gioca"]').click()
await page.waitForSelector('.cs-tabellone')

const vinciIlLibero = async () => {
  // un codice appena nato non è nella sosta: una casella posata lo mette
  // lì, e da lì si legge il codice per vincere (e si toglie la casella)
  await posaCodice(await codiceInGioco())
  await consegna()
  await page.waitForSelector('.cs-velo[data-fine]', { timeout: 3000 })
}
await vinciIlLibero()
await page.locator('.cs-velo .cs-grosso').first().click()   // «un altro»
await page.waitForSelector('.cs-velo', { state: 'detached', timeout: 3000 })
await vinciIlLibero()
await indietro()                                      // ← col cartello aperto, serie a 2
await page.waitForSelector('[data-ripresa]')
controlla('la carta del libero dice quanti di fila', /2 di fila/.test(await page.locator('[data-ripresa]').textContent()))
const profilo1 = await leggiProfilo(page)
controlla('uscendo il record non si scrive: la serie è ancora in corso',
          !(profilo1.campagne.codice.primato?.best), JSON.stringify(profilo1.campagne.codice.primato))

await page.click('[data-ripresa] [data-azione="riprendi"]')
await page.waitForSelector('.cs-tabellone')
await vinciIlLibero()
await page.locator('.cs-velo .cs-grosso').first().click()
await page.waitForSelector('.cs-velo', { state: 'detached', timeout: 3000 })
await indietro()
await page.waitForSelector('[data-ripresa]')
controlla('ripresa, la serie continua: tre di fila', /3 di fila/.test(await page.locator('[data-ripresa]').textContent()))
await page.click('[data-ripresa] [data-azione="scorda"]')
const profilo2 = await finche(() => leggiProfilo(page), p => !p.campagne.codice.sosta, 3000)
uguale('«lascio perdere» scrive il record della serie', profilo2.campagne.codice.primato?.best, 3)
uguale('e toglie la sosta', profilo2.campagne.codice.sosta, undefined)

/* ── una tappa che non è più aperta (i grandi l'hanno richiusa) non si offre,
   e la sosta aspetta: riaperta, la carta torna ── */
const aMetaDellaTerza = { v: VERSIONE, chiave: CAMPAGNA[2].chiave, vinte: 1, partita: null }
// `semina` ricarica e aspetta la home: l'indirizzo non deve riaprire il gioco
const aCasa = () => page.evaluate(() => history.replaceState(null, '', location.pathname))
await aCasa()
await semina(page, { campagne: { codice: { tappa: 0, stelle: {}, cfg: { spiegata: true },
                                           sosta: aMetaDellaTerza } } })
await aMappa()
uguale('una tappa chiusa non offre la ripresa', await page.locator('[data-ripresa]').count(), 0)
controlla('ma la sosta resta', !!(await sostaScritta(s => !!s)))
await aCasa()
await semina(page, { campagne: { codice: { tappa: 2, stelle: {}, cfg: { spiegata: true },
                                           sosta: aMetaDellaTerza } } })
await aMappa()
uguale('riaperta, la carta torna', await page.locator('[data-ripresa]').count(), 1)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('codice segreto — la partita lasciata a metà, nel browser')
