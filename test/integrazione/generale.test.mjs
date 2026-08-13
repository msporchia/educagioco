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
/* da dove si entra dipende da un dato, non da com'è fatta la vista: se
   le avventure sono spente non c'è nessuna scelta da fare e si cade
   dritti nelle prove. Il test legge lo stesso flag del gioco, così il
   giorno che si riaccendono non c'è niente da riscrivere qui. */
import { AVVENTURE_APERTE } from '../../src/data/storie-generale.js'
/* quante prove ci sono lo dicono i dati. Era cablato («almeno dieci») e
   diventava rosso ogni volta che l'elenco cambiava — cioè diceva una
   cosa sui livelli mentre voleva dirne una sulla schermata. */
import { QUANTI } from '../../src/data/generale.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)

/* ---------- 1. il generale è in casa ----------
   È stato dietro il cancello dei giochi in prova finché il tutorial non
   ha retto: adesso le sette prove si giocano tutte, il formato dei
   livelli è quello nuovo, e la carta sta in home come le altre. */
const carte = await page.$$eval('.carta b', e => e.map(x => x.textContent.trim()))
controlla('la carta del generale è in home', carte.some(c => /generale/i.test(c)),
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

  /* ---------- 3. da dove si entra ----------
     Con le avventure accese si sceglie una STORIA, e le prove stanno
     sotto in una voce loro. Con le avventure spente quella schermata
     non esiste: una scelta con una voce sola è una porta girevole. */
  if (AVVENTURE_APERTE) {
    uguale('entrando si sceglie l\'avventura', await page.locator('.scelta-avv').count(), 1)
    controlla('le storie sono in elenco', await page.locator('.avventura:not(.prove)').count() >= 4,
              String(await page.locator('.avventura:not(.prove)').count()))
    await scatto(page, 'generale-avventure')
    await page.locator('.avventura.prove').click()
  } else {
    uguale('senza avventure non c\'è niente da scegliere',
           await page.locator('.scelta-avv').count(), 0)
    uguale('e nessuna storia si affaccia da nessuna parte',
           await page.locator('.avventura').count(), 0)
  }
  await page.waitForSelector('.tappa', { timeout: 5000 })

  /* ---------- 3b. la sala delle mappe ----------
     Il primo livello è aperto dal primo giorno, gli altri no: una
     campagna che si apre tutta insieme non è una campagna. */
  /* quante siano lo dicono i dati, non questo file: qui interessa che la
     schermata le elenchi TUTTE, non che siano un certo numero. */
  const quante = await page.locator('.tappa').count()
  uguale('la sala delle mappe elenca tutte le prove', quante, QUANTI)
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
     poi si sceglie il bersaglio: sono i gesti del gioco, e non ce ne
     sono altri. Nessuna conferma — quello che hai scelto è scritto
     nella riga, e se hai sbagliato tocchi la casella e la cambi.

     ── IL BERSAGLIO SI SCEGLIE PER NOME, NON SULLA MAPPA ──
     Questo pezzo toccava la casella del tesoro. Non lo fa più, e non è
     un dettaglio di comodo: una cosa che si SPOSTA fra una battaglia e
     l'altra non si può indicare col dito, perché il piano si firma
     prima di sapere quale battaglia tocca — indicare il forziere che si
     vede adesso insegna il contrario di quello che il gioco insegna.
     Restano sulla mappa le cose immobili (porte, posti, celle). */
  await page.locator('.posto').first().click()
  await page.waitForTimeout(200)
  uguale('dal posto vuoto si apre il foglio delle scelte',
         await page.locator('.foglio-scelta').count(), 1)
  /* IL VERBO È «APRI», non il primo che capita: al primo livello si
     vince **aprendo** il forziere, non calpestandolo né portandoselo
     via — un forziere in tasca non ci sta — e `vai` è lì apposta come
     la strada sbagliata. Il test sceglie come sceglierebbe un bambino
     che ha letto la dritta: dal nome del verbo. */
  await page.locator('.foglio-scelta .pezzo', { hasText: 'apri' }).first().click()
  await page.waitForTimeout(200)
  /* ── E IL BERSAGLIO SI TOCCA DOVE STA ──
     Il foglio si chiude e passa la parola alla mappa: `apri`, qui, ha
     un solo bersaglio possibile e **è fermo** — un forziere non si
     sposta fra una battaglia e l'altra. Le cose ferme si indicano col
     dito dove stanno, che è il gesto più corto che ci sia; l'elenco dei
     nomi resta per quello che il dito non può raggiungere (un segnale,
     una schiera, una cosa in tasca a qualcuno).
     Il test tocca come tocca un bambino: chiede al gioco dove sta il
     forziere sullo schermo (`__gen.dove`) e ci mette il dito sopra. */
  uguale('scelto il verbo, il foglio lascia il posto alla mappa',
         await page.locator('.foglio-scelta').count(), 0)
  const punto = await page.evaluate(() => {
    const t = window.__gen.mondo().cose.tesoro
    return window.__gen.dove(t.x, t.y)
  })
  await page.mouse.click(punto.x, punto.y)
  await page.waitForTimeout(300)
  uguale('è nato un ordine', await page.locator('.lista .riga').count(), 1)
  const testo = await page.evaluate(() => document.querySelector('.lista .riga').innerText)
  controlla('e l\'ordine dice il verbo e la cosa', /apri/.test(testo) && /tesoro/.test(testo),
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
  /* e da lì fuori: con le avventure accese c'è la scelta in mezzo, con
     le avventure spente si esce dritti in home — una schermata in meno,
     non un passo saltato */
  await page.locator('button[aria-label="indietro"]').click()
  if (AVVENTURE_APERTE) {
    let allaScelta = true
    try { await page.waitForSelector('.scelta-avv', { timeout: 5000 }) } catch (e) { allaScelta = false }
    controlla('dalla sala delle mappe si torna alla scelta', allaScelta)
    await page.locator('button[aria-label="indietro"]').click()
  }
  let tornato = true
  try { await page.waitForSelector('.carte', { timeout: 5000 }) } catch (e) { tornato = false }
  controlla('e si torna alla home', tornato)
}

/* ---------- 10. niente errori per strada ---------- */
uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))

await browser.close()
riassunto('Il generale')
