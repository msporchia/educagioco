/* Il Codice Segreto lasciato a metà, nel browser: si esce con ←, si
   rientra, la mappa offre in cima «torno da dove ero» e il tavolo è
   com'era (righe, pallini, codice segreto). Anche dopo aver ricaricato la
   pagina, e mai in silenzio: una tappa nuova chiede prima. Nel libero la
   serie sopravvive all'uscita e il record si scrive solo con «lascio
   perdere». Vedi docs/codice-segreto/sosta.md.
   `node test/esegui.mjs codice-segreto-sosta` */
import { apriBrowser, apriGioco, attendi, azzera, semina, leggiProfilo, scatto, GIOCATORE }
  from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/codice-segreto/dati/campagna.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

const aMappa = async () => {
  await page.goto(page.url().replace(/#.*$/, '') + '#codice')
  await page.waitForSelector('.cs-mappa', { timeout: 5000 })
}
const sostaScritta = async () => {
  await attendi(page, 500)                 // l'archivio scrive con un po' di ritardo
  return (await leggiProfilo(page))?.campagne?.codice?.sosta || null
}
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
const consegna = async () => { await page.locator('.cs-conferma').click(); await attendi(page, 300) }

/* ── una tappa a metà: tre tappe aperte, la spiegazione già vista ── */
await semina(page, { campagne: { codice: { tappa: 2, stelle: {}, cfg: { spiegata: true } } } })
await aMappa()
controlla('a profilo pulito la mappa non offre nessuna ripresa',
          await page.locator('[data-ripresa]').count() === 0)

await page.locator('.cs-tappa[data-tappa="0"]').click()
await page.waitForSelector('.cs-tabellone')
const pool = await page.locator('.cs-tasto').evaluateAll(t => t.map(x => x.dataset.simbolo))
// due righe sbagliate di certo non servono: si gioca quello che capita e si guarda com'è
await posaCodice(pool.slice(0, 3)); await consegna()
if (!await page.locator('.cs-riga.cs-fatta').count() || await page.locator('.cs-velo').count())
  throw new Error('la prova ha indovinato al primo colpo: si rilancia')
await posaCodice(pool.slice(0, 2))                    // e una riga a metà

const lasciato = await tavolo()
const sostaPrima = await sostaScritta()
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
const ripreso = await tavolo()
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
const dopoDueUscite = await sostaScritta()
uguale('il codice segreto non è cambiato', dopoDueUscite.partita.codice.join(''), codicePrima)
uguale('e la riga tolta resta tolta',
       dopoDueUscite.partita.corrente.filter(s => s).length, 1)

/* la pagina che sparisce (il telefono in tasca): si ricarica e la carta c'è ancora */
await page.click('[data-ripresa] [data-azione="riprendi"]')
await page.waitForSelector('.cs-tabellone')
await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
await attendi(page, 500)
await page.reload()
await page.waitForSelector('.cs-mappa')
uguale('anche dopo aver ricaricato la pagina la carta c\'è',
       await page.locator('[data-ripresa]').count(), 1)

/* un codice vinto fa avanzare la sosta: la tappa riprende al secondo */
await page.click('[data-ripresa] [data-azione="riprendi"]')
await page.waitForSelector('.cs-tabellone')
await page.locator('.cs-riga.cs-attiva .cs-casella.cs-piena').first().click().catch(() => {})
await page.evaluate(() => document.querySelectorAll('.cs-riga.cs-attiva .cs-casella.cs-piena')
  .forEach(c => c.click()))                          // si svuota la riga
await posaCodice(dopoDueUscite.partita.codice)
await consegna()
await attendi(page, 900)
uguale('il cartello dice che si è trovato', await page.locator('.cs-velo').getAttribute('data-fine'), 'partita')
const monetePreso = (await leggiProfilo(page)).coins || 0
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
await posaCodice(pool.slice(0, 3)); await consegna()
await indietro()
await page.waitForSelector('[data-ripresa]')
await page.click('.cs-tappa[data-tappa="1"]')
uguale('una tappa nuova chiede prima', await page.locator('[data-chiede]').count(), 1)
await page.click('[data-chiede] [data-azione="riprendi-invece"]')
await page.waitForSelector('.cs-tabellone')
uguale('«torno a quella di prima» riprende la tappa a metà',
       (await tavolo()).fatte.length, 1)
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
uguale('e la sosta dal profilo', await sostaScritta(), null)

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
  await page.locator('.cs-tasto').first().click()
  const s = await sostaScritta()
  await page.locator('.cs-riga.cs-attiva .cs-casella.cs-piena').first().click()
  await posaCodice(s.partita.codice)
  await consegna()
  await attendi(page, 900)
}
await vinciIlLibero()
await page.locator('.cs-velo .cs-grosso').first().click()   // «un altro»
await attendi(page, 200)
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
await attendi(page, 200)
await indietro()
await page.waitForSelector('[data-ripresa]')
controlla('ripresa, la serie continua: tre di fila', /3 di fila/.test(await page.locator('[data-ripresa]').textContent()))
await page.click('[data-ripresa] [data-azione="scorda"]')
const profilo2 = await leggiProfilo(page)
uguale('«lascio perdere» scrive il record della serie', profilo2.campagne.codice.primato?.best, 3)
uguale('e toglie la sosta', profilo2.campagne.codice.sosta, undefined)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('codice segreto — la partita lasciata a metà, nel browser')
