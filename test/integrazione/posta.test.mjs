/* ═══════════════════════════════════════════════════════════════════
   LA POSTA DEI GRANDI, IL CODICE DIMENTICATO, IL CESTINO

   Tre cose nate insieme per un problema solo: questo gioco si regala a
   delle famiglie e dopo non c'è più nessun canale — niente server,
   niente indirizzo di posta, e chi lo riceve da un'altra famiglia non lo
   conosce nessuno. Sono tutte e tre interfaccia, e nessuna delle tre si
   può provare senza aprire lo schermo: il nastro che chiede al bambino
   di chiamare un grande, la domanda che rimette il codice, il tasto che
   riporta indietro dei progressi cancellati.

   Il filo che il test segue è quello vero, dall'inizio alla fine: un
   bambino vede il nastro → chiama un grande → il grande non ricorda il
   codice → risponde alla domanda → sceglie un codice nuovo → legge la
   posta → e più tardi cancella per sbaglio, e rimette.
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, semina, azzera, scatto,
         leggiProfilo, moneteInHome } from '../aiuto/browser.mjs'
import { NOTE } from '../../src/guide/novita.js'
import { DOMANDA } from '../../src/store/pin.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { coins: 500 })

/* ── la casa che giocava già ──
   Un telefono appena installato non riceve le note vecchie, ed è
   voluto (`store/posta.js`): per vedere la posta bisogna essere una
   casa che c'era prima, cioè avere un profilo e nessun segno di
   lettura. Si toglie il segno e si ricarica — è esattamente lo stato
   di chi aggiorna il gioco. */
async function dimenticaLaPosta() {
  await page.evaluate(() => new Promise(ok => {
    const r = indexedDB.open('giochi-bambini', 1)
    r.onsuccess = () => {
      const tx = r.result.transaction('kv', 'readwrite')
      tx.objectStore('kv').delete('note-lette')
      tx.oncomplete = ok
    }
    r.onerror = ok
  }))
  try { await page.evaluate(() => localStorage.removeItem('note-lette')) } catch (e) { /* niente */ }
  await page.reload()
  await page.waitForSelector('.carte', { timeout: 10000 })
}
await dimenticaLaPosta()

const digita = async cifre => { for (const c of cifre) await page.click(`.tasto >> text="${c}"`) }

/* ── QUANDO NON C'È NIENTE DA DIRE ──
   L'elenco delle note è vuoto per la maggior parte dell'anno (`guide/
   novita.js`: ne escono tre o quattro), e senza note il nastro in home
   non compare — giustamente, perché il richiamo nasce da loro. Il resto
   del filo si prova lo stesso: l'altro modo di accendere la posta è un
   **avviso**, e l'avviso lo genera proprio il codice rimesso a 0000, che
   è il pezzo di mezzo di questo test. Si entra dal tasto dei grandi
   invece che dal nastro, e le due righe che parlano di una nota si
   tacciono da sé quando la nota non c'è. */
const CON_NOTE = NOTE.length > 0
if (!CON_NOTE) nota('nessuna nota in `guide/novita.js`: il nastro non ha di che accendersi, '
                    + 'si prova il resto passando dall\'avviso')

/* ── 1. il richiamo, in home ──
   Fuori dal codice non si può distinguere un grande da un bambino,
   quindi qui fuori c'è solo il segnale: un nastro che chiede di
   chiamare un grande e un pallino sul tasto delle impostazioni. */
if (CON_NOTE) {
  controlla('in home c\'è il nastro per un grande', await page.isVisible('[data-nastro="posta"]'))
  controlla('e il tasto delle impostazioni ha il pallino',
            await page.isVisible('[data-posta-pallino]'))
  controlla('il nastro non si può chiudere: nessuna ✕ addosso',
    await page.evaluate(() =>
      !document.querySelector('[data-nastro="posta"]').querySelector('.chiudi')))
} else {
  controlla('senza note in home non c\'è nessun nastro',
            !(await page.isVisible('[data-nastro="posta"]')))
  controlla('e nessun pallino sul tasto dei grandi',
            !(await page.isVisible('[data-posta-pallino]')))
}
await scatto(page, 'posta-home')

/* ── 2. il bambino chiama un grande ── */
await page.click(CON_NOTE ? '[data-nastro="posta"]' : '[data-azione="grandi"]')
await page.waitForSelector('.tastierino', { timeout: 5000 })
controlla('il nastro porta al codice, non al contenuto',
  !(await page.isVisible('[data-posta]')))

/* ── 3. il codice dimenticato ──
   Non è sicurezza e non prova a esserlo (`store/pin.js`): è la sola
   strada che un grande poco pratico percorre da solo, dal telefono,
   dentro l'app installata. */
controlla('c\'è la via per il codice dimenticato',
  await page.isVisible('[data-azione="codice-dimenticato"]'))
await page.click('[data-azione="codice-dimenticato"]')
await page.waitForTimeout(200)
controlla('la domanda si legge a schermo',
  await page.evaluate(t => document.body.innerText.includes(t), DOMANDA.testo))

await digita('1800')
await page.waitForTimeout(200)
controlla('una risposta sbagliata non apre', await page.isVisible('.tastierino'))
controlla('e costa la stessa attesa di un codice sbagliato',
          await page.isVisible('.fermo'))

/* l'attesa del primo sbaglio dura tre secondi: si aspetta invece di
   forzarla, perché è proprio quella che deve funzionare */
await page.waitForTimeout(3300)
await digita(DOMANDA.risposta)
/* la risposta giusta passa da tre scritture in archivio — il codice
   rimesso, l'avviso in posta, la posta riletta — e solo dopo la
   schermata cambia: si aspetta il titolo, non il tastierino, che c'è in
   tutti e due i momenti */
await page.waitForFunction(
  () => document.body.innerText.includes('Il codice nuovo'), null, { timeout: 5000 })
controlla('rispondendo si entra, e chiede subito il codice nuovo',
  await page.evaluate(() => document.body.innerText.includes('Il codice nuovo')))
await scatto(page, 'posta-codice-nuovo')

await digita('2468')
await page.waitForTimeout(150)
await digita('2468')
await page.waitForSelector('[data-posta]', { timeout: 5000 })

/* ── 4. la posta ── */
if (CON_NOTE)
  controlla('dentro c\'è quello che c\'era da dire',
    await page.evaluate(t => document.body.innerText.includes(t), NOTE[0].titolo))
controlla('e l\'avviso che il codice è stato rimesso',
  await page.evaluate(() => document.body.innerText.includes('era stato dimenticato')))
await scatto(page, 'posta-dentro')

await page.click('[data-azione="ho-letto"]')
await page.waitForTimeout(300)
controlla('«ho letto» la chiude', !(await page.isVisible('[data-posta]')))

await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carte', { timeout: 5000 })
controlla('e in home il nastro non c\'è più', !(await page.isVisible('[data-nastro="posta"]')))
controlla('nemmeno il pallino', !(await page.isVisible('[data-posta-pallino]')))

/* ── 5. il codice nuovo è quello scelto ── */
await page.click('[data-azione="grandi"]')
await page.waitForSelector('.tastierino', { timeout: 5000 })
await digita('2468')
await page.waitForTimeout(300)
controlla('si entra col codice scelto durante il recupero',
  !(await page.isVisible('.tastierino')))

/* ── 6. il cestino ──
   L'unico danno irreversibile che l'applicazione sapesse fare. Chi
   cancella per sbaglio non è il bambino entrato di nascosto: è il
   grande stanco che tocca la carta rossa e conferma. */
const primaDi = (await leggiProfilo(page))?.coins
uguale('il bambino ha le sue monete', primaDi, 500)

await page.click('.carta.pericolo')
await page.waitForTimeout(150)
await page.click('.bottone.rosso')
await page.waitForTimeout(400)
uguale('cancellate, non ce ne sono più', (await leggiProfilo(page))?.coins, 0)

await page.waitForSelector('[data-azione="rimetti-cestino"]', { timeout: 5000 })
controlla('ma la copia è lì', await page.isVisible('[data-azione="rimetti-cestino"]'))
await scatto(page, 'posta-cestino')

await page.click('[data-azione="rimetti-cestino"]')
await page.waitForTimeout(150)
await page.click('[data-azione="conferma-rimetti"]')
await page.waitForTimeout(500)
uguale('rimessa, le monete tornano', (await leggiProfilo(page))?.coins, primaDi)
controlla('e la copia resta, per un ripristino sbagliato',
  await page.isVisible('[data-azione="rimetti-cestino"]'))

await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carte', { timeout: 5000 })
uguale('e in home si rivedono', await moneteInHome(page), primaDi)

controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
nota('il nastro parla al bambino: è l\'unico che guardi la home tutti i giorni')
riassunto('La posta, il codice dimenticato e il cestino')
await browser.close()
