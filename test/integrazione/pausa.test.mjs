/* ═══════════════════════════════════════════════════════════════════
   LA PAUSA, COL DITO — sulla corsa, che è il primo gioco a portarla

   Il test unitario conta le condizioni e dice che il ritorno non
   riprende; qui si prova quello che da fuori si vede, e che nessuna
   funzione pura può dire: che il ⏸ c'è dove deve esserci, che **il
   motore si ferma davvero** (i metri non calano più) e che il velo non
   si toglie da solo — né col fantasma del dito che l'ha appena aperto,
   né quando il telefono torna a vedere lo schermo.

   Il telefono posato si finge con `visibilityState`: la pagina resta
   davvero visibile, quindi `requestAnimationFrame` continua a girare —
   ed è quello che serve, perché se la pausa non funzionasse i metri
   continuerebbero a scendere e il test lo vedrebbe. Con una scheda
   nascosta per davvero il gioco si fermerebbe **da sé** e il controllo
   non direbbe niente.

   `node test/esegui.mjs pausa --niente-build`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
/* la corsa è ancora un gioco in prova, e `giochi: { corsa: true }` la
   tiene in casa comunque: il test non deve dipendere da quale fascia
   d'età la offre oggi */
await semina(page, { settings: { eta: 9, sperimentali: true, giochi: { corsa: true } } })

/* quanti metri mancano al traguardo: è il numero del cruscotto, cioè la
   cosa che si muove solo se il motore avanza */
const metri = async () => Number(await page.locator('.co-gettone b').first().textContent())
const veli = () => page.locator('[data-pausa]').count()

/* ---------- 1. si entra in gara ---------- */
const carta = page.locator('.carta.gioco[data-gioco="corsa"]')
uguale('la carta è in home', await carta.count(), 1)
await carta.click()
await page.waitForSelector('.co-mappa', { timeout: 5000 })
uguale('sulla mappa non c\'è niente da fermare',
       await page.locator('button[aria-label="pausa"]').count(), 0)

await page.locator('.co-tappa[data-tappa="0"]').click()
await page.waitForSelector('.co-tela', { timeout: 5000 })
uguale('in gara il ⏸ c\'è', await page.locator('button[aria-label="pausa"]').count(), 1)

await attendi(page, 1200)
const partiti = await metri()
controlla('e intanto si corre', partiti > 0, `mancano ${partiti} m`)

/* ---------- 2. il ⏸ ferma il motore ---------- */
await page.locator('button[aria-label="pausa"]').click()
uguale('il velo compare', await veli(), 1)

/* il fantasma: il dito che ha premuto ⏸ si lascia dietro un click, che
   arriva a chi sta sotto in quel momento — cioè al velo appena nato.
   Va ingoiato, se no la pausa dura un fotogramma. */
await page.evaluate(() => document.querySelector('[data-azione="riprendi"]')?.click())
uguale('il click che il dito si lascia dietro non la toglie', await veli(), 1)

/* il numero si legge **dopo** che il cruscotto si è riallineato: quello
   si rinfresca ogni 150 ms di gioco, quindi appena premuto il ⏸ può
   ancora dire i metri di un attimo prima */
await attendi(page, 400)
const fermi = await metri()
await attendi(page, 1500)
uguale('e i metri non si muovono', await metri(), fermi)
await scatto(page, 'pausa-corsa')
controlla('la pausa dice dove si era', (await page.locator('[data-pausa]').textContent())
          .includes('mancano'))

/* ---------- 3. si riprende al tocco ---------- */
await page.locator('[data-azione="riprendi"]').click()
uguale('il velo sparisce', await veli(), 0)
await attendi(page, 1200)
const ripartiti = await metri()
controlla('e la corsa riparte', ripartiti < fermi, `${ripartiti} m contro ${fermi} m`)

/* ---------- 4. il telefono posato ferma da solo ---------- */
const posa = () => page.evaluate(() => {
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
  /* `bubbles: true` perché quello vero risale: chi ascolta sulla
     finestra (Survivors, App.vue) lo sente solo così */
  document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))
})
const riprendiIlTelefono = () => page.evaluate(() => {
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
  /* `bubbles: true` perché quello vero risale: chi ascolta sulla
     finestra (Survivors, App.vue) lo sente solo così */
  document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))
})

await posa()
uguale('posare il telefono mette in pausa', await veli(), 1)
await attendi(page, 400)
const posati = await metri()
await attendi(page, 1200)
uguale('e la corsa sta ferma', await metri(), posati)

/* LA RIGA PER CUI ESISTE TUTTO IL RESTO */
await riprendiIlTelefono()
await attendi(page, 800)
uguale('riaprendo il telefono la corsa NON riparte da sola', await veli(), 1)
uguale('e nemmeno di un metro', await metri(), posati)
await page.locator('[data-azione="riprendi"]').click()
uguale('si riparte solo toccando', await veli(), 0)
await attendi(page, 1200)
controlla('e allora sì', await metri() < posati)
nota(`fermi a ${fermi} m, ripartiti fino a ${await metri()} m`)

/* ---------- 5. il ⏸ non caccia fuori niente ----------
   La barra porta già ← titolo slot ? 🪙 🔊, e un tondo in più su uno
   schermo stretto è il modo classico di far uscire il tasto per tornare
   indietro fuori dallo schermo — è già successo, nel castello, ed è il
   motivo per cui la barra è una sola. */
await page.setViewportSize({ width: 360, height: 640 })
await attendi(page, 400)
const barra = await page.evaluate(() => {
  const b = document.querySelector('.barra-app')
  return {
    fuori: b.scrollWidth - b.clientWidth,
    tasti: [...b.querySelectorAll('button')].map(t => t.getAttribute('aria-label')),
  }
})
controlla('a 360 px la barra non sfonda', barra.fuori <= 0, `${barra.fuori} px di troppo`)
stessaLista('e i tasti ci sono tutti, nell\'ordine di sempre', barra.tasti,
            ['indietro', 'pausa', 'aiuto', 'suono'])
await scatto(page, 'pausa-barra-stretta')

/* ---------- 6. uscire non lascia niente acceso ---------- */
await page.locator('button[aria-label="pausa"]').click()
uguale('in pausa di nuovo', await veli(), 1)
await attendi(page, 400)
await page.locator('[data-azione="riprendi"]').click()
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.co-mappa', { timeout: 5000 })
await posa()
uguale('sulla mappa il velo non compare', await veli(), 0)
await riprendiIlTelefono()
await page.locator('.co-tappa[data-tappa="0"]').click()
await page.waitForSelector('.co-tela', { timeout: 5000 })
uguale('e la gara nuova non nasce in pausa', await veli(), 0)
const appena = await metri()
await attendi(page, 1200)
controlla('si corre da subito', await metri() < appena,
          `${appena} m e non si muove`)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('la pausa, col dito')
