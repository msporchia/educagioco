/* ═══════════════════════════════════════════════════════════════════
   SPENTO, E APPOSTA — questo file non finisce in `.test.mjs`, quindi il
   lanciatore non lo raccoglie.

   «Come va» non si mostra più in nessuna scheda: il pezzo funziona (e
   questo test lo provava), ma il modo di presentarlo è da rivedere
   insieme. Il componente sta ancora in `src/quiz/ComeVa.vue` e le
   soglie in `quiz/consiglio.js`; per riaccendere tutto servono tre
   cose: il bottone della scheda e il suo ramo in `GenitoriView.vue`
   (ci sono i commenti che dicono dove), e rinominare questo file
   `come-va.test.mjs`.
   ═══════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════
   COME VA — il riassunto in cima alla scheda dei bambini

   Le manopole per ritarare le domande c'erano da un pezzo, e non le
   toccava nessuno: un genitore non va a cercare un problema che non sa
   di avere. Questo blocco gira il verso — il gioco dice cosa ha notato —
   e quindi le cose da non rompere sono due:

     · **deve comparire quando c'è qualcosa da dire**, cioè quando il
       conto di una tipologia esce dalle bande di `quiz/consiglio.js`;
     · **il tasto deve ritoccare davvero**, e la riga sparire — un
       consiglio che resta lì dopo essere stato seguito fa premere due
       volte, e due gradini invece di uno.

   E una che si vede solo con dati veri: una tipologia con più gradi è
   più righe nel catalogo ma **un conto solo**, quindi qui va detta una
   volta sola.
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, leggiProfilo } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* Due tipologie vere, una per verso. `ora:intere` ha più di un grado nel
   catalogo, ed è apposta: è quella che senza il raggruppamento compare
   due volte. */
const MURO = 'num:confronto'      // ne sbaglia 8 su 10
const PEDAGGIO = 'ora:intere'     // le indovina tutte
await semina(page, {
  coins: 100,
  settings: { eta: 8 },
  items: {
    [MURO]: { n: 10, ok: 2, err: 8, ef: 2, i: 1, due: Date.now(), r: 2, w: 8 },
    [PEDAGGIO]: { n: 12, ok: 12, err: 0, ef: 2.6, i: 6, due: Date.now(), r: 12, w: 0 },
  },
})

const entra = async () => {
  await page.click('[data-azione="grandi"]')
  await page.waitForSelector('.tastierino', { timeout: 5000 })
  for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
  await page.waitForSelector('.carte', { timeout: 5000 })
  await page.waitForTimeout(300)
}
await entra()

/* ── UNA SCHEDA SUA, E APERTA ──
   Stava in coda alla prima scheda, sotto la carta di chi gioca: lo
   leggeva chi era sceso fin laggiù per un altro motivo. Il punto di
   questo blocco è che il verso si gira — non è il grande che va a
   cercare un problema che non sa di avere, è il gioco che dice cosa ha
   notato — e per farlo deve stare dove si guarda. */
await page.click('.schede button[data-scheda="comeva"]')
await page.waitForTimeout(300)
controlla('il riassunto ha una scheda sua, e si apre già aperto',
  await page.isVisible('[data-blocco="come-va"]'))

const righe = () => page.evaluate(() =>
  [...document.querySelectorAll('[data-segnale]')].map(r => r.dataset.segnale))

/* la chiave di una riga è `modulo:grado:tipologia`: la tipologia sta in
   fondo, ed è quella su cui si tiene il conto */
const prime = await righe()
controlla('dice quello che va male', prime.some(k => k.endsWith(MURO)), prime.join(','))
controlla('e anche quello che è diventato troppo facile',
  prime.some(k => k.endsWith(PEDAGGIO)), prime.join(','))
uguale('una tipologia si dice una volta sola, anche se ha più gradi',
  prime.filter(k => k.endsWith(PEDAGGIO)).length, 1)

const testo = await page.evaluate(() =>
  document.querySelector('[data-blocco="come-va"]').innerText)
controlla('col conto, non con un giudizio', testo.includes('8 su 10'), testo.slice(0, 120))
await scatto(page, 'come-va')

/* ── il tasto fa quello che dice ── */
const bersaglio = prime.find(k => k.endsWith(MURO))
await page.click(`[data-sistema="${bersaglio}"]`)
await page.waitForTimeout(300)

const dopo = await righe()
controlla('seguito il consiglio, la riga se ne va', !dopo.includes(bersaglio), dopo.join(','))

/* `save()` scrive dopo un attimo (350 ms di raggruppamento in
   `store/storage.js`): letto troppo presto l'archivio direbbe ancora
   quello di prima, e il guasto sembrerebbe del tasto */
await page.waitForTimeout(700)
const prof = await leggiProfilo(page)
const ritocchi = prof.settings?.ritocchi || {}
uguale('e il ritocco è scritto nel profilo, di un gradino solo', ritocchi[MURO], 1)

/* ── il rimando alla scheda intera ── */
await page.click('[data-azione="tutte-le-domande"]')
await page.waitForTimeout(300)
controlla('il link porta all\'elenco completo',
  await page.isVisible('.schede button[data-scheda="giochi"].ora'))

uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))

await browser.close()
riassunto('come va')
