/* ═══════════════════════════════════════════════════════════════════
   IL GENERALE — si gioca davvero
     node test/integrazione/generale.test.mjs   (dopo `npm run build`)

   Le regole le prova `unita/generale` senza browser, e le prova tutte:
   qui si controlla l'altra metà — che dalla home ci si arrivi, che un
   livello si possa **comporre e vincere col dito**, e che quello che si
   è fatto resti scritto nel profilo.

     · dalla carta in home si apre la sala delle mappe
     · c'è la barra comune, con un solo tasto per tornare indietro
     · dentro un livello ci sono campo, ordini, cassetta e registro
     · si sceglie un verbo, si tocca il bersaglio sulla mappa, si
       conferma: nasce un ordine
     · ▶ e il piano cammina da solo fino alla vittoria
     · il livello superato finisce nel profilo, con le sue stelle
     · niente sborda dallo schermo e niente errori in console
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, leggiProfilo, TELEFONO }
       from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)

/* ---------- 1. è un gioco in prova ----------
   Finché è taggato `sperimentale` sta dietro un cancello: in home non
   c'è, e non c'è nemmeno l'interruttore per accenderlo. Ci arriva solo
   chi accende il flag dei giochi in prova nella schermata dei genitori
   — che è quello che qui si fa scrivendolo nel profilo. */
const prima = await page.$$eval('.carta b', e => e.map(x => x.textContent.trim()))
controlla('finché è in prova, in home non compare', !prima.some(c => /generale/i.test(c)),
          prima.join(' · '))
await semina(page, { settings: { sperimentali: true } })

const carte = await page.$$eval('.carta b', e => e.map(x => x.textContent.trim()))
controlla('acceso il flag, la carta del generale c\'è', carte.some(c => /generale/i.test(c)),
          carte.join(' · '))
await page.locator('.carta.gen').click()

let entrata = true
try {
  await page.waitForSelector('.generale', { timeout: 5000 })
} catch (e) {
  entrata = false
  controlla('dalla carta si apre la schermata', false,
            'sono rimasto su: ' + (await page.evaluate(() => document.body.innerText.slice(0, 80).trim())))
}

if (entrata) {
  controlla('dalla carta si apre la schermata', true)

  /* ---------- 2. la barra è quella comune ---------- */
  uguale('c\'è un solo tasto per tornare indietro',
         await page.locator('button[aria-label="indietro"]').count(), 1)
  controlla('il tasto indietro è il primo della barra',
            await page.evaluate(() =>
              document.querySelector('.barra-app')?.firstElementChild?.getAttribute('aria-label') === 'indietro'))
  const titolo = await page.evaluate(() => document.querySelector('.barra-app .dove')?.textContent.trim())
  controlla('la barra dice dove si è', !!titolo, JSON.stringify(titolo))

  /* ---------- 3. la scelta dell'avventura ----------
     Entrando non si cade più in una fila di quattordici numeri: si
     sceglie una STORIA. Le prove restano, ma sotto, in una voce loro. */
  uguale('entrando si sceglie l\'avventura', await page.locator('.scelta-avv').count(), 1)
  controlla('le storie sono in elenco', await page.locator('.avventura:not(.prove)').count() >= 4,
            String(await page.locator('.avventura:not(.prove)').count()))
  await scatto(page, 'generale-avventure')
  await page.locator('.avventura.prove').click()
  await page.waitForSelector('.tappa', { timeout: 5000 })

  /* ---------- 3b. la sala delle mappe ----------
     Il primo livello è aperto dal primo giorno, gli altri no: una
     campagna che si apre tutta insieme non è una campagna. */
  const quante = await page.locator('.tappa').count()
  controlla('la sala delle mappe elenca i livelli', quante >= 14, String(quante))
  uguale('a profilo vuoto è aperto solo il primo',
         await page.locator('.tappa:not(.chiusa)').count(), 1)
  await scatto(page, 'generale-mappe')

  /* ---------- 4. dentro un livello ---------- */
  await page.locator('.tappa').first().click()
  await page.waitForSelector('.campo', { timeout: 5000 })
  await page.waitForTimeout(400)        // il campo si misura e sceglie il lato della cella
  /* la prima cosa che si apre è la spiegazione del livello, e leggerla
     non costa niente: si chiude e si gioca */
  controlla('il cartello con la spiegazione si apre da solo',
            await page.locator('.foglio.cartello').count() === 1)
  await page.locator('.foglio .capo button').click()

  for (const [cosa, sel] of [['il campo', '.campo'], ['la lista degli ordini', '.lista'],
                             ['il registro', '.registro']])
    uguale(`c'è ${cosa}`, await page.locator(sel).count(), 1)
  /* la cassetta fissa in fondo non c'è più: al suo posto ci sono i
     POSTI VUOTI, uno in fondo a ogni fila. Sono il modo di aggiungere
     un ordine, e sono anche il modo di sapere dove finirà. */
  controlla('ci sono i posti vuoti da riempire', await page.locator('.posto').count() >= 1,
            String(await page.locator('.posto').count()))
  uguale('e nessuna cassetta fissa in fondo allo schermo',
         await page.locator('.cassetta').count(), 0)

  /* gli indicatori nella barra: livello, ordini e par, le scene, le stelle.
     Il primo livello si gioca su UNA scena sola — è il primo ordine, non
     c'è ancora niente da dimostrare su tre mappe — e le pastiglie delle
     scene non compaiono: sono l'indicatore di una cosa che qui non
     succede, e un indicatore che dice sempre «1 di 1» è rumore. */
  uguale('sul livello a scena unica non ci sono pastiglie',
         await page.locator('.prove i').count(), 0)
  const barra = await page.evaluate(() => document.querySelector('.barra-app').innerText)
  controlla('la barra mostra ordini e par', /par/.test(barra), JSON.stringify(barra))

  /* ---------- 5. comporre un ordine col dito ----------
     Si tocca il POSTO VUOTO, si sceglie l'azione dal foglio che si apre,
     poi si tocca il bersaglio SULLA MAPPA: sono i gesti del gioco, e non
     ce ne sono altri. Nessuna conferma — quello che hai scelto è scritto
     nella riga, e se hai sbagliato tocchi la casella e la cambi. */
  await page.locator('.posto').first().click()
  await page.waitForTimeout(200)
  uguale('dal posto vuoto si apre il foglio delle scelte',
         await page.locator('.foglio-scelta').count(), 1)
  await page.locator('.foglio-scelta .pezzo').first().click()
  await page.waitForTimeout(200)
  uguale('scelta l\'azione, il foglio si richiude da solo',
         await page.locator('.foglio-scelta').count(), 0)
  controlla('scelto il verbo, la mappa chiede il bersaglio',
            await page.locator('.scelta').count() === 1)
  const p = await page.evaluate(() => window.__gen.dove(10, 5))   // il tesoro
  await page.mouse.click(p.x, p.y)
  await page.waitForTimeout(300)
  controlla('toccato il bersaglio, la scelta si chiude da sola',
            await page.locator('.scelta').count() === 0)
  uguale('è nato un ordine', await page.locator('.lista .riga').count(), 1)
  const testo = await page.evaluate(() => document.querySelector('.lista .riga').innerText)
  controlla('e l\'ordine dice il verbo e la cosa', /vai/.test(testo) && /tesoro/.test(testo),
            JSON.stringify(testo))
  await scatto(page, 'generale-ordine')

  /* ---------- 6. ▶ e il piano cammina ---------- */
  await page.locator('.tasto.via').click()
  let vinto = false
  for (let i = 0; i < 30 && !vinto; i++) {
    await page.waitForTimeout(500)
    vinto = await page.evaluate(() => !!window.__gen.finito.value)
  }
  controlla('il piano vince il primo livello', vinto,
            await page.evaluate(() => window.__gen.mondo().motivo))
  if (vinto) {
    const velo = await page.evaluate(() => document.querySelector('.velo').innerText)
    controlla('e il velo di fine dice quanti ordini e qual era il par',
              /par/.test(velo) && /ordine|ordini/.test(velo), JSON.stringify(velo))
    await scatto(page, 'generale-vinto')
  }

  /* ---------- 7. quello che si è fatto resta scritto ---------- */
  const profilo = await leggiProfilo(page)
  controlla('il livello superato è nel profilo', (profilo.gen || {}).tappa >= 1,
            JSON.stringify(profilo.gen))
  controlla('e con le sue stelle', ((profilo.gen || {}).stelle || {})['0'] >= 1,
            JSON.stringify((profilo.gen || {}).stelle))
  controlla('il contatore delle missioni è salito', (profilo.totals || {}).missioni >= 1,
            JSON.stringify((profilo.totals || {}).missioni))

  /* ---------- 8. ci sta in verticale, senza scorrere ---------- */
  await page.locator('.velo .grigio').click()          // via il velo
  const misure = await page.evaluate(() => ({
    largo: document.documentElement.scrollWidth,
    finestra: window.innerWidth,
    alto: document.documentElement.scrollHeight,
    altezza: window.innerHeight,
  }))
  uguale('non scorre in orizzontale', misure.largo, misure.finestra)
  controlla('e nemmeno in verticale', misure.alto <= misure.altezza + 1,
            `${misure.alto}px in ${misure.altezza}px`)

  /* ---------- 9. il tasto indietro riporta indietro di un passo ---------- */
  await page.locator('button[aria-label="indietro"]').click()
  controlla('dal livello si torna alla sala delle mappe',
            await page.locator('.tappa').count() > 0)
  /* e adesso il secondo è aperto: la campagna è avanzata */
  controlla('il livello dopo si è aperto',
            await page.locator('.tappa:not(.chiusa)').count() >= 2,
            String(await page.locator('.tappa:not(.chiusa)').count()))
  await page.locator('button[aria-label="indietro"]').click()
  let allaScelta = true
  try { await page.waitForSelector('.scelta-avv', { timeout: 5000 }) } catch (e) { allaScelta = false }
  controlla('dalla sala delle mappe si torna alla scelta', allaScelta)
  await page.locator('button[aria-label="indietro"]').click()
  let tornato = true
  try { await page.waitForSelector('.carte', { timeout: 5000 }) } catch (e) { tornato = false }
  controlla('e dalla scelta si torna alla home', tornato)
}

/* ---------- 10. niente errori per strada ---------- */
uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))

await browser.close()
riassunto('Il generale')
