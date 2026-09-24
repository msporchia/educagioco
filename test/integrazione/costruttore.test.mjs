/* ═══════════════════════════════════════════════════════════════════
   IL COSTRUTTORE, NEL BROWSER

   Quello che il motore non può dire: che il programma **si scrive col
   dito** e poi gira. Si entra dalla home, si scrive la soluzione del
   primo livello toccando «＋», i blocchi e le caselle, si preme ▶ e si
   aspetta il cartello; poi un livello con tre ordini, dove la casella
   del ripeti prende la lavagnetta dell'ordine e il programma deve
   reggere tutti e tre; poi un errore apposta, che deve accendere la
   riga dove il robot si è fermato. E il programma scritto deve
   ritrovarsi dopo una ricarica.

   E le scelte non si fanno da sole: una riga nuova nasce con la N, la
   scelta del numero si apre da sola, e ▶ con una N vuota non parte ma
   apre la scelta che manca.

   Poi il porto, la seconda parte: la cassetta con le frecce, e la gru
   giocata con la sua soluzione su tutte e due le giornate — la tela
   dall'alto, i turni del mondo e il verdetto della sera.
   `node test/esegui.mjs integrazione/costruttore`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, scatto, semina, attendi, leggiProfilo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { LIVELLI } from '../../src/giochi/costruttore/dati/livelli.js'

/* L'archivio dei programmi sta fuori dal profilo (`costruttore:<id>`):
   per provarne la lettura lo si scrive a mano, come fa `semina` coi
   profili. */
const scriviArchivio = (page, dato) => page.evaluate(d => new Promise((ok, ko) => {
  const r = indexedDB.open('giochi-bambini', 1)
  r.onerror = () => ko(new Error('IndexedDB non si apre'))
  r.onsuccess = () => {
    const tx = r.result.transaction('kv', 'readwrite')
    tx.objectStore('kv').put(d, 'costruttore:uno')
    tx.oncomplete = ok
    tx.onerror = () => ko(new Error('scrittura fallita'))
  }
}), dato)

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { coins: 0, settings: { sperimentali: true, eta: 10 } })

const tocca = async sel => { await page.locator(sel).first().click(); await attendi(page, 60) }
/* aggiunge un blocco in fondo all'elenco indicato */
async function aggiungi(dove, blocco) {
  await tocca(`[data-aggiungi="${dove}"]`)
  await page.waitForSelector('[data-cassetta]', { timeout: 3000 })
  await attendi(page, 350)      // la finestra cieca della cassetta
  await tocca(`[data-cassetta] [data-blocco="${blocco}"]`)
}

/* ---------- 1. si entra dalla home ---------- */
const carta = page.locator('.carta.gioco[data-gioco="costruttore"]')
uguale('la carta del costruttore è in home, coi giochi in prova accesi', await carta.count(), 1)
await carta.click()
await page.waitForSelector('.cst-mappa', { timeout: 5000 })
uguale('la mappa elenca tutti i livelli', await page.locator('[data-livello]').count(), LIVELLI.length)
uguale('e in cima il cantiere libero, chiuso finché il primo capitolo non è finito',
       await page.locator('[data-libero][disabled]').count(), 1)
await scatto(page, 'costruttore-mappa')

/* ---------- 2. il primo livello, scritto col dito ---------- */
await tocca('[data-livello="0"]')
await page.waitForSelector('[data-editor]', { timeout: 5000 })
const canvas = await page.locator('.cst-campo canvas').boundingBox()
controlla('il cantiere si vede', canvas && canvas.width > 200 && canvas.height > 80, JSON.stringify(canvas))
for (let k = 0; k < 4; k++) {
  await aggiungi('principale', 'metti:sotto')
  if (k < 3) {
    await aggiungi('principale', 'vai:destra')
    /* la N del passo: la scelta si è aperta da sola */
    await page.waitForSelector('[data-scelta="numero"]', { timeout: 3000 })
    await tocca('[data-scelta="numero"] [data-cifra="1"]')
  }
}
uguale('sette righe scritte', await page.locator('[data-editor] .cst-riga').count(), 7)
await scatto(page, 'costruttore-programma')
await tocca('[data-velocita="veloce"]')
await tocca('[data-azione="via"]')
await page.waitForSelector('[data-fine="livello"]', { timeout: 15000 })
controlla('il primo livello si vince', true)
await scatto(page, 'costruttore-vinto')
{
  const p = await leggiProfilo(page)
  uguale('la tappa è segnata', p.campagne.costruttore.tappa, 1)
  uguale('con due stelle: fatto da solo', p.campagne.costruttore.stelle[0], 2)
  uguale('e le monete della prima volta', p.coins, LIVELLI[0].premio)
  controlla('e il contatore dei mattoni', (p.totals.coMattoni || 0) >= 4, JSON.stringify(p.totals))
}

/* ---------- 3. il programma resta dov'era ---------- */
await tocca('[data-azione="resta"]')
await attendi(page, 700)       // il salvataggio si fa un attimo dopo
await page.reload()
await page.waitForSelector('.carte', { timeout: 10000 })
await page.locator('.carta.gioco[data-gioco="costruttore"]').click()
await page.waitForSelector('.cst-mappa', { timeout: 5000 })
await tocca('[data-livello="0"]')
await page.waitForSelector('[data-editor]', { timeout: 5000 })
uguale('dopo una ricarica il programma c\'è ancora', await page.locator('[data-editor] .cst-riga').count(), 7)

/* ---------- 4. una N lasciata vuota: ▶ non parte ---------- */
await aggiungi('principale', 'vai:destra')
await page.waitForSelector('[data-scelta="numero"]', { timeout: 3000 })
await tocca('[data-scelta="numero"] [data-chiudi]')
controlla('la N non scelta si vede', await page.locator('.cst-casella.cst-manca').count() === 1)
await tocca('[data-azione="via"]')
await page.waitForSelector('[data-messaggio]', { timeout: 3000 })
{
  const msg = await page.locator('[data-messaggio]').innerText()
  controlla('▶ con una N vuota dice cosa manca', /Al posto di N/.test(msg), msg)
  uguale('e apre la scelta del numero', await page.locator('[data-scelta="numero"]').count(), 1)
}

/* ---------- 5. un errore apposta: la riga si accende ---------- */
/* nove passi a destra dopo l'ultimo mattone: si esce dal cantiere */
await tocca('[data-scelta="numero"] [data-cifra="9"]')
await tocca('[data-azione="via"]')
await page.waitForSelector('[data-guasto]', { timeout: 10000 })
{
  const msg = await page.locator('[data-messaggio]').innerText()
  controlla('il robot dice perché si è fermato', /uscire dal cantiere/.test(msg), msg)
}
await scatto(page, 'costruttore-errore')

/* ---------- 6. tre ordini, una lavagnetta ---------- */
await semina(page, { settings: { sperimentali: true, eta: 10 },
                     campagne: { costruttore: { tappa: 3, libera: false, stelle: { 0: 2, 1: 2, 2: 2 }, cfg: { velocita: 'veloce', fila: 2 } } } })
await page.locator('.carta.gioco[data-gioco="costruttore"]').click()
await page.waitForSelector('.cst-mappa', { timeout: 5000 })
await tocca('[data-livello="3"]')
await page.waitForSelector('[data-editor]', { timeout: 5000 })
uguale('tre gettoni per tre ordini', await page.locator('[data-gettone]').count(), 3)
await aggiungi('principale', 'ripeti')
const ripeti = await page.locator('[data-editor] .cst-riga').first().getAttribute('data-riga')
/* «ripeti N volte»: la scelta si apre da sola, e al posto di N va la
   lavagnetta dell'ordine */
await page.waitForSelector('[data-scelta="numero"]', { timeout: 3000 })
await tocca('[data-scelta="numero"] [data-nome="lungo"]')
await tocca('[data-scelta="numero"] [data-azione="fatto"]')
await aggiungi(`${ripeti}:corpo`, 'metti:sotto')
await aggiungi(`${ripeti}:corpo`, 'vai:destra')
await page.waitForSelector('[data-scelta="numero"]', { timeout: 3000 })
await tocca('[data-scelta="numero"] [data-cifra="1"]')
await scatto(page, 'costruttore-ripeti')
await tocca('[data-azione="via"]')
await page.waitForSelector('[data-fine="livello"]', { timeout: 20000 })
uguale('il programma regge tutti e tre gli ordini', await page.locator('[data-gettone].cst-vinto').count(), 3)

/* ---------- 7. il cantiere libero, e i progetti che restano ---------- */
/* il tempio vinto con la sua colonna: dal cantiere libero la si riprende */
await scriviArchivio(page, { v: 2, programmi: { tempio: JSON.parse(JSON.stringify(LIVELLI.find(l => l.chiave === 'tempio').soluzione)) } })
await semina(page, { settings: { sperimentali: true, eta: 10 },
                     campagne: { costruttore: { tappa: 7, libera: false, stelle: {}, cfg: { velocita: 'veloce', fila: 2 } } } })
await page.locator('.carta.gioco[data-gioco="costruttore"]').click()
await page.waitForSelector('.cst-mappa', { timeout: 5000 })
uguale('finito il primo capitolo il cantiere libero è aperto', await page.locator('[data-libero]:not([disabled])').count(), 1)
await tocca('[data-libero]')
await page.waitForSelector('[data-editor]', { timeout: 5000 })
await tocca('[data-aggiungi="principale"]')
await page.waitForSelector('[data-cassetta]', { timeout: 3000 })
await attendi(page, 350)
uguale('nella cassetta ci sono i progetti degli altri cantieri', await page.locator('[data-importa="colonna"]').count(), 1)
await tocca('[data-importa="colonna"]')
uguale('ripreso, il progetto ha la sua scheda', await page.locator('[data-scheda="colonna"]').count(), 1)
await tocca('[data-scheda="principale"]')
await tocca('[data-azione="codice"]')
await page.waitForSelector('[data-foglio-codice]', { timeout: 3000 })
{
  const codice = await page.locator('[data-foglio-codice] pre').innerText()
  controlla('e in Python è una def con la sua misura', codice.includes('def colonna(alta):'), codice)
}
await scatto(page, 'costruttore-python')
await tocca('[data-foglio-codice] [data-chiudi]')

/* ---------- 8. il porto ---------- */
/* la gru con la sua soluzione: la tela dall'alto, la regia coi turni del
   mondo, e il verdetto a sera — tutte e due le giornate */
{
  const primo = LIVELLI.findIndex(l => l.mondo === 'porto')
  const gru = LIVELLI.findIndex(l => l.chiave === 'gru')
  await scriviArchivio(page, { v: 2, programmi: { gru: JSON.parse(JSON.stringify(LIVELLI[gru].soluzione)) } })
  await semina(page, { settings: { sperimentali: true, eta: 10 },
                       campagne: { costruttore: { tappa: gru, libera: false, stelle: {}, cfg: { velocita: 'veloce', fila: 3 } } } })
  await page.locator('.carta.gioco[data-gioco="costruttore"]').click()
  await page.waitForSelector('.cst-mappa', { timeout: 5000 })
  controlla('il porto sta nella mappa, dopo le lavagnette', LIVELLI[primo - 1].capitolo === 'lavagnette' &&
            await page.locator(`[data-livello="${primo}"]`).count() === 1)
  await tocca(`[data-livello="${gru}"]`)
  await page.waitForSelector('[data-editor]', { timeout: 5000 })
  await tocca('[data-aggiungi="principale"]')
  await page.waitForSelector('[data-cassetta]', { timeout: 3000 })
  await attendi(page, 350)
  uguale('la cassetta del porto ha una riga di quattro frecce per prendere',
         await page.locator('[data-cassetta] [data-blocco^="prendi:"]').count(), 4)
  await tocca('[data-cassetta] [data-chiudi]')
  await tocca('[data-azione="via"]')
  await page.waitForSelector('[data-fine="livello"]', { timeout: 40000 })
  uguale('la gru: tutte e due le navi scaricate', await page.locator('[data-gettone].cst-vinto').count(), 2)
  await scatto(page, 'costruttore-porto')
}

/* ---------- 8-bis. le giornate del porto: i camion ---------- */
/* il primo camion con la sua soluzione: i camion che arrivano, si
   caricano e ripartono sulla strada, con la gru che lavora intorno */
{
  const camion = LIVELLI.findIndex(l => l.chiave === 'primo-camion')
  await scriviArchivio(page, { v: 2, programmi: { 'primo-camion': JSON.parse(JSON.stringify(LIVELLI[camion].soluzione)) } })
  await semina(page, { settings: { sperimentali: true, eta: 10 },
                       campagne: { costruttore: { tappa: camion, libera: false, stelle: {}, cfg: { velocita: 'veloce', fila: 3 } } } })
  await page.locator('.carta.gioco[data-gioco="costruttore"]').click()
  await page.waitForSelector('.cst-mappa', { timeout: 5000 })
  await tocca(`[data-livello="${camion}"]`)
  await page.waitForSelector('[data-editor]', { timeout: 5000 })
  await tocca('[data-azione="via"]')
  await page.waitForSelector('[data-fine="livello"]', { timeout: 40000 })
  uguale('il primo camion: tutte e due le giornate, tutti i camion pieni', await page.locator('[data-gettone].cst-vinto').count(), 2)
  await scatto(page, 'costruttore-camion')
}

/* ---------- 9. niente errori ---------- */
controlla('nessun errore in console', errori.length === 0, errori.join(' | '))
nota(`errori raccolti: ${errori.length}`)

await browser.close()
riassunto('costruttore nel browser')
