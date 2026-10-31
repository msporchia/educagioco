/* ═══════════════════════════════════════════════════════════════════
   LA PAUSA NEGLI ALTRI DUE — Survivors e il sotterraneo

   Il pezzo comune (`giochi/pausa.js`) è nato sulla Corsa, che non c'è
   più. Qui si prova che **ci è arrivato davvero** in ognuno, e la
   ragione per cui non basta fidarsi è che ognuno dei due lo monta su un
   orologio diverso: Survivors su una giostra a fotogrammi, il
   sotterraneo su un `requestAnimationFrame` suo (il giro di Gioco.vue,
   che muove il motore: il testimone è l'eroe che cammina).

   Il telefono posato si finge con `visibilityState`: la pagina resta
   davvero visibile, quindi gli orologi continuano a girare — ed è
   quello che serve, perché se la pausa non funzionasse si vedrebbe
   muovere qualcosa. Con una scheda nascosta per davvero i giochi si
   fermerebbero **da sé** e il controllo non direbbe niente.

   `node test/esegui.mjs pausa-giochi --niente-build`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto, scegli,
         scendiNelSotterraneo, scegliAvventura } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
/* i due giochi si tengono in casa a mano: il test non deve dipendere da
   quale fascia d'età li offra oggi, né da quali siano ancora in prova */
await semina(page, { settings: { eta: 9, sperimentali: true,
  giochi: { survivors: true, sotterraneo: true } } })

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

await scegli(page, 'survivors')
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
   2. IL SOTTERRANEO — l'eroe che cammina è il testimone

   Il motore gira sul `requestAnimationFrame` di Gioco.vue (`giro`), e
   quello la pausa ferma. La scena 3D ha il suo giro, che disegna di
   continuo (il respiro, le torce, la roba che pulsa) anche dietro il velo:
   i suoi fotogrammi non dicono niente sulla pausa, e i suoi pixel (WebGL)
   non si rileggono. Quello che la pausa ferma davvero è il tempo di gioco:
   si manda l'eroe a camminare per qualche cella (un tocco lontano dalla
   scala che sale sotto di lui) e si guarda dov'è, a pausa e fuori.
   ═══════════════════════════════════════════════════════════════════ */
const eroePos = () => page.evaluate(() => { const e = window.__sotterraneo3d.corsa.eroe; return `${e.x.toFixed(3)},${e.y.toFixed(3)}` })

await scegli(page, 'sotterraneo')
/* la prima volta si sceglie chi scende, e finché quella carta è aperta
   non si è ancora dentro niente */
await scegliAvventura(page, 'cavaliere')
uguale('sotterraneo: sul mondo di sopra non c\'è niente da fermare', await pausaInBarra(), 0)

await scendiNelSotterraneo(page, 0)
await page.waitForSelector('[data-tela="3d"]', { timeout: 15000 })
await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 30000 })
await attendi(page, 3000)   // la telecamera morbida arriva all'eroe: il primo tocco trova la scena ferma
uguale('nella discesa il ⏸ c\'è', await pausaInBarra(), 1)

/* L'eroe va a spasso lungo una strada libera di sei celle (un tocco a caso
   può finire su una porta o addosso a un mostro, e allora si apre un
   foglio: il ⏸ sparisce, com'è giusto, e il test racconta ogni volta una
   storia diversa). Il tocco è quello del dito (CDP). */
const cdp = await page.context().newCDPSession(page)
{
  const [ex, ey] = (await page.locator('[data-tela="3d"]').getAttribute('data-eroe')).split(',').map(Number)
  const versi = await page.evaluate(([x, y]) => {
    const b = window.__sotterraneo3d.corsa.buona()
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => { let k = 0; while (k < 6 && b(x + dx * (k + 1), y + dy * (k + 1))) k++; return { dx, dy, k } }).sort((a, c) => c.k - a.k)
  }, [ex, ey])
  controlla('c\'è una strada libera di almeno quattro celle', versi[0].k >= 4, JSON.stringify(versi))
  const { dx, dy, k } = versi[0]
  const [sx, sy] = await page.evaluate(([a, b]) => window.__sotterraneo3d.aSchermo(a, 0.05, b), [ex + dx * k + 0.5, ey + dy * k + 0.5])
  const box = await page.locator('[data-tela="3d"]').boundingBox()
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + sx, y: box.y + sy }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
const sotPrima = await eroePos()
// l'eroe è partito: la pausa si preme mentre cammina, a metà strada
await page.waitForFunction(p => { const e = window.__sotterraneo3d.corsa.eroe; return `${e.x.toFixed(3)},${e.y.toFixed(3)}` !== p }, sotPrima, { timeout: 15000 })
controlla('e intanto l\'eroe cammina', await eroePos() !== sotPrima, sotPrima)

await page.locator('button[aria-label="pausa"]').click()
uguale('il velo compare', await veli(), 1)
controlla('e dice a che piano si era',
          (await page.locator('[data-pausa]').textContent()).includes('piano 1'))
await scatto(page, 'pausa-sotterraneo')
await attendi(page, 400)
const sotFermo = await eroePos()
controlla('la pausa è arrivata a metà strada: all\'eroe resta strada da fare', await page.evaluate(() => { const c = window.__sotterraneo3d.corsa; return !!(c.strada && c.strada.length) }))
await attendi(page, 1200)
uguale('e l\'eroe non si muove di un millimetro', await eroePos(), sotFermo)

await page.locator('[data-azione="riprendi"]').click()
uguale('il velo sparisce al tocco', await veli(), 0)
await attendi(page, 900)
controlla('e la discesa riparte', await eroePos() !== sotFermo, sotFermo)

await posa()
uguale('posare il telefono mette in pausa', await veli(), 1)
await riprendiIlTelefono()
await attendi(page, 900)
uguale('riaprendolo la discesa NON riparte da sola', await veli(), 1)
await page.locator('[data-azione="riprendi"]').click()
uguale('si riparte solo toccando', await veli(), 0)

await aCasa()                        // in home: la ✕ dalla discesa non passa dal mondo di sopra
uguale('uscendo dal sotterraneo si è in casa', await page.locator('.carte').count() > 0, true)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('la pausa negli altri due')
