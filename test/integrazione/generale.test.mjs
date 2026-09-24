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
/* quante prove ci sono lo dicono i dati. Era cablato («almeno dieci») e
   diventava rosso ogni volta che l'elenco cambiava — cioè diceva una
   cosa sui livelli mentre voleva dirne una sulla schermata.
   E sono quelle APPROVATE, non tutte: le altre stanno dietro il cancello
   dei giochi in prova, che qui è spento come nel profilo di un bambino
   appena creato. `fila(false)` è lo stesso conto che fa la schermata. */
import { fila } from '../../src/data/generale.js'
const QUANTI = fila(false).length

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
     Dritti nelle prove. C'era una schermata per scegliere un'avventura,
     ma le avventure non si sono mai aperte e sono state tolte: una
     scelta con una voce sola è una porta girevole. */
  uguale('non c\'è nessuna scelta da fare prima delle prove',
         await page.locator('.scelta-avv').count(), 0)
  uguale('e nessuna storia si affaccia da nessuna parte',
         await page.locator('.avventura').count(), 0)
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

  /* gli indicatori nella barra: livello, ordini, le scene, le stelle.
     Il primo livello si gioca su UNA scena sola — è il primo ordine, non
     c'è ancora niente da dimostrare su tre mappe — e le pastiglie delle
     scene non compaiono: sono l'indicatore di una cosa che qui non
     succede, e un indicatore che dice sempre «1 di 1» è rumore. */
  uguale('sul livello a scena unica non ci sono pastiglie',
         await page.locator('.prove i').count(), 0)
  const barra = await page.evaluate(() => document.querySelector('.barra-app').innerText)
  controlla('la barra conta gli ordini firmati', /📜/.test(barra), JSON.stringify(barra))
  /* ── E NON DICE PIÙ UN PAR ──
     Il tetto di ordini non c'è più in nessun posto del gioco: qui si
     controlla che non sia rimasto proprio in cima allo schermo, che è
     dove stava e dove si sarebbe notato meno togliendolo a metà. */
  controlla('e non annuncia nessun par', !/par/.test(barra), JSON.stringify(barra))

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
  /* e la cosa si chiama come quella che si vede sulla mappa: «il
     forziere», non «il tesoro» — nel primo ordine del gioco la casella
     e la dritta devono dire la stessa parola */
  controlla('e l\'ordine dice il verbo e la cosa', /apri/.test(testo) && /forziere/.test(testo),
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
    controlla('e il velo di fine dice con quanti ordini ha funzionato',
              /ordine|ordini/.test(velo), JSON.stringify(velo))
    /* due stelle senza aver chiesto niente: è il metro nuovo — non
       «quanto corto», ma «ci sei arrivato da solo» */
    controlla('e dà due stelle a chi non ha chiesto niente',
              /⭐⭐/.test(velo) && !/par/.test(velo), JSON.stringify(velo))
    await scatto(page, 'generale-vinto')
  }

  /* ---------- 7. quello che si è fatto resta scritto ---------- */
  const profilo = await leggiProfilo(page)
  controlla('il livello superato è nel profilo', (profilo.gen || {}).tappa >= 1,
            JSON.stringify(profilo.gen))
  /* sotto l'id del livello, non sotto la sua posizione nella fila: la
     fila si riordina, i voti restano di chi li ha presi */
  controlla('e con le sue stelle', ((profilo.gen || {}).stelle || {}).primo >= 1,
            JSON.stringify((profilo.gen || {}).stelle))
  controlla('il contatore delle missioni è salito', (profilo.totals || {}).missioni >= 1,
            JSON.stringify((profilo.totals || {}).missioni))

  /* ---------- 7b. la scala degli aiuti ----------
     Un tasto solo, e ogni volta che lo premi scendi di un gradino:
     prima quelli che fanno ragionare, gratis; poi gli indizi, a 🪙10;
     poi quelli che scrivono nel piano, a 🪙50 · 100 · 200. È la cosa più
     rischiosa dell'intero foglio — spende le monete e sostituisce quello
     che il bambino ha scritto — e sbagliata non si nota finché qualcuno
     non preme quel tasto: qui si preme, fino in fondo, e si conta.
     Si va sul SECONDO livello perché la sua soluzione ha tre ordini in
     fila: un piano che compare vuol dire tre righe, non una, e un solo
     ordine non distinguerebbe «ha svelato» da «era già lì». */
  const entraNelSecondo = async () => {
    await page.locator('.carta.gen').click()
    await page.waitForSelector('.tappa', { timeout: 5000 })
    await page.evaluate(() => window.__gen.apri(1))
    await page.waitForTimeout(400)
  }
  const monete = async () => (await leggiProfilo(page)).coins || 0
  const tasto = () => page.locator('.cartello .chiedi')
  const prezzo = async () => Number(await tasto().getAttribute('data-prezzo'))

  /* cinque monete: i gradini gratis si leggono, l'indizio da dieci no */
  await semina(page, { coins: 5 })
  await entraNelSecondo()
  /* il cartello si apre da sé all'inizio di ogni livello: la
     spiegazione è la prima cosa, e non costa niente */
  uguale('entrando in un livello il cartello è già aperto',
         await page.locator('.cartello').count(), 1)
  uguale('e non c\'è ancora nessun gradino sceso',
         await page.locator('.cartello .aiuto:not(.muto)').count(), 0)
  uguale('il primo gradino è gratis', await prezzo(), 0)
  let gratis = 0
  while (gratis < 6 && await prezzo() === 0) {
    await tasto().click()
    await page.waitForTimeout(150)
    gratis++
  }
  controlla('i gradini gratis fanno ragionare, e sono almeno due',
            gratis >= 2 && await page.locator('.cartello .aiuto.ragiona').count() === gratis,
            `${gratis} gratis`)
  uguale('e non hanno speso niente', await monete(), 5)
  uguale('il gradino dopo è un indizio, e costa dieci', await prezzo(), 10)
  controlla('con cinque monete il tasto è spento, e dice quanto manca',
            await tasto().isDisabled() && await page.locator('.cartello [data-mancano]').count() === 1)
  await tasto().click({ force: true })
  await page.waitForTimeout(150)
  uguale('e premerlo non spende niente e non dà niente', await monete(), 5)
  uguale('niente di nuovo nel cartello', await page.locator('.cartello .aiuto:not(.muto)').count(), gratis)

  /* le monete arrivano; i gradini già scesi restano scesi */
  await page.locator('button[aria-label="indietro"]').click()
  await page.locator('button[aria-label="indietro"]').click()
  await semina(page, { coins: 1000 })
  await entraNelSecondo()
  uguale('rientrando, i gradini letti sono ancora lì',
         await page.locator('.cartello .aiuto:not(.muto)').count(), gratis)
  uguale('e il tasto riparte da dove era', await prezzo(), 10)

  /* gli indizi: un tocco, dieci monete */
  let spese = 0
  while (await prezzo() === 10) {
    await tasto().click()
    await page.waitForTimeout(150)
    spese += 10
  }
  controlla('ogni indizio costa dieci monete', await monete() === 1000 - spese && spese >= 10,
            `${await monete()} monete dopo ${spese}`)

  /* il pezzo: cinquanta, e due tocchi — il primo arma */
  uguale('il primo gradino che scrive costa cinquanta', await prezzo(), 50)
  await tasto().click()
  await page.waitForTimeout(150)
  controlla('il primo tocco arma il tasto e non spende',
            await page.locator('.cartello .chiedi.armato').count() === 1 && await monete() === 1000 - spese)
  await tasto().click()
  await page.waitForTimeout(300)
  spese += 50
  uguale('il secondo tocco paga', await monete(), 1000 - spese)
  uguale('e il pezzo è nel piano: la prima metà della soluzione',
         await page.locator('.lista .riga').count(), 1)

  /* la forma: cento, e tiene intero il pezzo già pagato */
  await page.locator('.tasto.q[aria-label="spiegazione"]').click()
  await page.waitForTimeout(200)
  uguale('la forma costa cento', await prezzo(), 100)
  await tasto().click(); await page.waitForTimeout(120); await tasto().click()
  await page.waitForTimeout(300)
  spese += 100
  uguale('la forma scrive nel piano le righe della soluzione',
         await page.locator('.lista .riga').count(), 3)
  const vuote = await page.evaluate(() =>
    [...document.querySelectorAll('.lista .casella')].filter(c => c.classList.contains('manca')).length)
  controlla('e lascia da riempire i bersagli che il pezzo non aveva dato', vuote === 2, String(vuote))

  /* e l'ultimo: tutto, duecento, e si guarda girare */
  await page.locator('.tasto.q[aria-label="spiegazione"]').click()
  await page.waitForTimeout(200)
  uguale('la soluzione costa duecento', await prezzo(), 200)
  await tasto().click(); await page.waitForTimeout(120); await tasto().click()
  await page.waitForTimeout(300)
  spese += 200
  uguale('e alla fine la scala è costata quello che diceva', await monete(), 1000 - spese)
  const piene = await page.evaluate(() =>
    [...document.querySelectorAll('.lista .casella')].filter(c => !c.classList.contains('manca')).length)
  controlla('la soluzione riempie anche i bersagli', piene >= 3, String(piene))
  await scatto(page, 'generale-svelato')

  /* quello che si è pagato si rimette gratis */
  await page.locator('.tasto.q[aria-label="spiegazione"]').click()
  await page.waitForTimeout(200)
  uguale('finita la scala, il tasto sparisce', await tasto().count(), 0)
  uguale('e ogni gradino che ha scritto si può rimettere',
         await page.locator('.cartello [data-azione="rimetti-aiuto"]').count(), 3)
  await page.locator('.cartello [data-azione="rimetti-aiuto"]').first().click()
  await page.waitForTimeout(300)
  uguale('rimettere il pezzo riscrive il pezzo', await page.locator('.lista .riga').count(), 1)
  await page.locator('.tasto.q[aria-label="spiegazione"]').click()
  await page.waitForTimeout(200)
  await page.locator('.cartello [data-azione="rimetti-aiuto"]').last().click()
  await page.waitForTimeout(300)
  uguale('e la soluzione, la soluzione — senza pagarla due volte', await monete(), 1000 - spese)
  const profiloAiuti = await leggiProfilo(page)
  controlla('i gradini scesi stanno nel profilo, sotto l\'id del livello',
            ((profiloAiuti.gen || {}).aiuti || {}).chiave >= 5,
            JSON.stringify((profiloAiuti.gen || {}).aiuti))

  await page.locator('.tasto.via').click()
  let chiuso = false
  for (let i = 0; i < 30 && !chiuso; i++) {
    await page.waitForTimeout(500)
    chiuso = await page.evaluate(() => !!window.__gen.finito.value)
  }
  controlla('il piano svelato vince davvero', chiuso)
  if (chiuso) {
    const velo2 = await page.evaluate(() => document.querySelector('.velo').innerText)
    controlla('e vale una stella sola, perché la soluzione intera l\'ha scritta il gioco',
              /⭐/.test(velo2) && !/⭐⭐/.test(velo2), JSON.stringify(velo2))
  }

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
  /* e da lì fuori, dritti in home: non c'è nessuna schermata in mezzo */
  await page.locator('button[aria-label="indietro"]').click()
  let tornato = true
  try { await page.waitForSelector('.carte', { timeout: 5000 }) } catch (e) { tornato = false }
  controlla('e si torna alla home', tornato)
}

/* ---------- 10. niente errori per strada ---------- */
uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))

await browser.close()
riassunto('Il generale')
