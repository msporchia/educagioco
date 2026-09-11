/* ═══════════════════════════════════════════════════════════════════
   LA PAUSA NEGLI ALTRI TRE — Survivors, il sotterraneo, il Dungeon

   `integrazione/pausa` prova il pezzo comune sulla Corsa, che è il primo
   gioco ad averlo. Qui si prova che **ci è arrivato davvero** negli
   altri, e la ragione per cui non basta fidarsi è che ognuno dei tre lo
   monta su un orologio diverso: Survivors su una giostra a fotogrammi,
   il sotterraneo su un `requestAnimationFrame` suo, il Dungeon **su
   niente** — è a turni, e l'unica cosa che scorre è il respiro prima
   che la domanda compaia.

   Per questo il Dungeon qui si prova al contrario: che il ⏸ **non ci
   sia** (un tasto di pausa dove non si muove nulla è un tasto che
   mente) e che quell'unico `setTimeout` si congeli col telefono in
   tasca, invece di far trovare la domanda già lì al ritorno.

   Il telefono posato si finge con `visibilityState`: la pagina resta
   davvero visibile, quindi gli orologi continuano a girare — ed è
   quello che serve, perché se la pausa non funzionasse si vedrebbe
   muovere qualcosa. Con una scheda nascosta per davvero i giochi si
   fermerebbero **da sé** e il controllo non direbbe niente.

   `node test/esegui.mjs pausa-giochi --niente-build`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
/* i tre giochi si tengono in casa a mano: il test non deve dipendere da
   quale fascia d'età li offra oggi, né da quali siano ancora in prova */
await semina(page, { settings: { eta: 9, sperimentali: true,
  giochi: { survivors: true, sotterraneo: true, dungeon: true } } })

const veli = () => page.locator('[data-pausa]').count()
const pausaInBarra = () => page.locator('button[aria-label="pausa"]').count()
const aCasa = async () => {
  await page.locator('button[aria-label="indietro"]').click()
  await attendi(page, 400)
}

/* Posare il telefono e riprenderlo. `bubbles: true` perché quello vero
   risale: chi ascolta sulla finestra lo sente solo così. */
const posa = () => page.evaluate(() => {
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
  document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))
})
const riprendiIlTelefono = () => page.evaluate(() => {
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
  document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))
})

/* ═══════════════════════════════════════════════════════════════════
   1. SURVIVORS — l'orologio del cruscotto è il testimone
   ═══════════════════════════════════════════════════════════════════ */
const secondi = async () => {
  const [m, s] = (await page.locator('.sv-gettone').first().textContent())
    .replace(/\D+/, '').split(':')
  return Number(m) * 60 + Number(s)
}

await page.locator('.carta.gioco[data-gioco="survivors"]').click()
await page.waitForSelector('.sv-mappa', { timeout: 5000 })
uguale('survivors: sulla mappa non c\'è niente da fermare', await pausaInBarra(), 0)

await page.locator('.sv-tappa[data-tappa="0"]').click()
await page.waitForSelector('.sv-tela', { timeout: 5000 })
uguale('in campo il ⏸ c\'è', await pausaInBarra(), 1)
const svIniziali = await secondi()
await attendi(page, 2000)
const svPartiti = await secondi()
controlla('e intanto l\'orologio scende', svPartiti > 0 && svPartiti < svIniziali,
          `mancano ${svPartiti}s, e all\'ingresso ${svIniziali}s`)

await page.locator('button[aria-label="pausa"]').click()
uguale('il velo compare', await veli(), 1)
/* il fantasma: il dito che ha premuto ⏸ si lascia dietro un click, che
   arriva a chi sta sotto in quel momento — cioè al velo appena nato */
await page.evaluate(() => document.querySelector('[data-azione="riprendi"]')?.click())
uguale('il click che il dito si lascia dietro non la toglie', await veli(), 1)
controlla('la pausa dice dove si era',
          (await page.locator('[data-pausa]').textContent()).includes('livello'))
await scatto(page, 'pausa-survivors')

/* il numero si legge **dopo** che il cruscotto si è riallineato: quello
   si rinfresca ogni 0,2 s, quindi appena premuto il ⏸ può ancora dire i
   secondi di un attimo prima */
await attendi(page, 500)
const svFermi = await secondi()
await attendi(page, 1800)
uguale('e la marea sta ferma', await secondi(), svFermi)
/* nemmeno con le frecce: sotto il velo il campo non si muove. Prima il
   cartello di una partita ripresa stava *dentro* il campo, e bastava
   una freccia a mandarlo via */
await page.keyboard.down('ArrowRight')
await attendi(page, 900)
await page.keyboard.up('ArrowRight')
uguale('nemmeno muovendosi sotto il velo', await secondi(), svFermi)

await page.locator('[data-azione="riprendi"]').click()
uguale('il velo sparisce al tocco', await veli(), 0)
await attendi(page, 1500)
const svRipartiti = await secondi()
controlla('e la partita riparte', svRipartiti < svFermi,
          `${svRipartiti}s contro ${svFermi}s`)

/* il telefono posato ferma, e il ritorno NON riprende */
await posa()
uguale('posare il telefono mette in pausa', await veli(), 1)
await riprendiIlTelefono()
await attendi(page, 900)
uguale('riaprendolo la partita NON riparte da sola', await veli(), 1)
await page.locator('[data-azione="riprendi"]').click()
uguale('si riparte solo toccando', await veli(), 0)

await aCasa()                        // alla mappa
await aCasa()                        // in home
nota(`survivors: fermo a ${svFermi}s, ripartito fino a ${svRipartiti}s`)

/* ═══════════════════════════════════════════════════════════════════
   2. IL SOTTERRANEO — la caverna è il testimone

   Qui non c'è nessun numero che scorre: l'eroe respira, le torce
   tremolano, e quando il giro si ferma la tela resta **esattamente**
   l'ultimo fotogramma. Si confronta una firma corta dei pixel, che è
   l'unico modo di chiedere «questa scena si muove ancora?».
   ═══════════════════════════════════════════════════════════════════ */
const caverna = () => page.evaluate(() => {
  const c = document.querySelector('.sot-tela')
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
  let h = 0
  for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]) | 0
  return h
})

await page.locator('.carta.gioco[data-gioco="sotterraneo"]').click()
await page.waitForSelector('.sot-tappe', { timeout: 5000 })
/* la prima volta si sceglie chi scende, e finché quella carta è aperta
   non si è ancora dentro niente */
if (await page.locator('[data-eroe="cavaliere"]').count()) {
  await page.locator('[data-eroe="cavaliere"]').click()
  await attendi(page, 300)
}
uguale('sotterraneo: sulla mappa non c\'è niente da fermare', await pausaInBarra(), 0)

await page.locator('.sot-tappa[data-tappa="0"]').click()
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 700)
uguale('nella discesa il ⏸ c\'è', await pausaInBarra(), 1)

/* L'eroe non si tocca e non si manda a spasso, ed è una scelta: un
   tocco a caso sul campo può finire su una porta o addosso a un mostro,
   e allora si apre un foglio — il ⏸ sparisce, com'è giusto, e il test
   racconta ogni volta una storia diversa. Fermo basta: l'eroe respira,
   le torce tremolano, la roba per terra pulsa, e tutto questo vive
   sull'orologio del giro (`scena/tela.js`). */
const sotPrima = await caverna()
await attendi(page, 700)
controlla('e intanto la caverna si muove', await caverna() !== sotPrima)

await page.locator('button[aria-label="pausa"]').click()
uguale('il velo compare', await veli(), 1)
controlla('e dice a che piano si era',
          (await page.locator('[data-pausa]').textContent()).includes('piano 1'))
await scatto(page, 'pausa-sotterraneo')
await attendi(page, 400)
const sotFermo = await caverna()
await attendi(page, 1200)
uguale('e la caverna non si muove di un pixel', await caverna(), sotFermo)

await page.locator('[data-azione="riprendi"]').click()
uguale('il velo sparisce al tocco', await veli(), 0)
await attendi(page, 700)
controlla('e la discesa riparte', await caverna() !== sotFermo)

await posa()
uguale('posare il telefono mette in pausa', await veli(), 1)
await riprendiIlTelefono()
await attendi(page, 900)
uguale('riaprendolo la discesa NON riparte da sola', await veli(), 1)
await page.locator('[data-azione="riprendi"]').click()
uguale('si riparte solo toccando', await veli(), 0)

await aCasa()                        // alla mappa
await aCasa()                        // in home

/* ═══════════════════════════════════════════════════════════════════
   3. IL DUNGEON — niente ⏸, e l'unico orologio che si congela

   Il Dungeon è a turni: la stanza aspetta, e un ⏸ lì non fermerebbe
   niente. Quello che c'è da fermare è il respiro prima che la domanda
   compaia — un `setTimeout`, che a schermo spento scatta uguale e fa
   trovare la domanda già lì a chi riaccende il telefono mezz'ora dopo.
   ═══════════════════════════════════════════════════════════════════ */
await page.locator('.carta.gioco[data-gioco="dungeon"]').click()
await page.waitForSelector('.dng-tappa', { timeout: 5000 })
await page.locator('.dng-tappa[data-tappa="0"]').click()
await page.waitForSelector('.dng-stanza', { timeout: 5000 })
uguale('dungeon: niente ⏸, qui non scorre niente', await pausaInBarra(), 0)

/* la prima fila è sempre un mostro (`ingresso: ['mostro']`), quindi la
   sfida — e il respiro prima della domanda — arriva di sicuro */
const porta = page.locator('.dng-stanza[data-tipo="mostro"]:not([disabled])').first()
uguale('la prima stanza è una sfida', await porta.count(), 1)
await porta.click()
/* si posa il telefono **subito**: il respiro dura 750 ms, e la domanda
   non deve arrivare mentre il telefono è in tasca */
await posa()
await attendi(page, 1600)
uguale('a telefono posato la domanda non arriva', await page.locator('.qz-velo').count(), 0)
uguale('e nessun velo di pausa: non è un gioco che si mette in pausa', await veli(), 0)

await riprendiIlTelefono()
await page.waitForSelector('.qz-velo', { timeout: 4000 })
uguale('riaprendolo arriva, e riparte da quello che le restava',
       await page.locator('.qz-velo').count(), 1)
await scatto(page, 'pausa-dungeon')

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('la pausa negli altri tre')
