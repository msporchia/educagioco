/* ═══════════════════════════════════════════════════════════════════
   I CAMPI DELLA FATTORIA, TOCCATI COL DITO

   L'unità (`unita/coltivazioni`) prova che il grano cresce e che il
   granaio tiene il conto. Qui si prova la cosa che l'unità non può
   vedere: che **il dito ci arrivi**, e che il giro completo — compro il
   campo, lo tocco, semino, chiudo il gioco, torno e raccolgo — passi
   davvero da uno schermo.

   ── PERCHÉ SI CHIUDE E SI RIAPRE ──────────────────────────────────
   Perché la promessa del gioco è quella: «cresce anche a gioco chiuso, e
   non si secca mai». Un test che aspetta dieci minuti veri non lo si
   lancia mai; un test che chiama il motore non prova la promessa, perché
   il pezzo fragile è **il salvataggio** — se `seminato` non finisse in
   archivio, o se `deserializza` lo buttasse via, a schermo il campo
   ripartirebbe da zero a ogni apertura e nessun test unitario se ne
   accorgerebbe. Quindi l'orologio si sposta dove va spostato: nel
   profilo su disco, indietro di venti minuti, esattamente come farebbe
   una notte passata.
   `node test/esegui.mjs campi`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, scatto, attendi }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

const vecchio = await leggiProfilo(page)
await semina(page, { coins: 3000, settings: { ...((vecchio || {}).settings || {}) } })

async function entra() {
  await page.locator('.carta.gioco[data-gioco="fattoria"]').click()
  await page.waitForSelector('.fa-tela', { timeout: 5000 })
  await attendi(page, 600)
}

/* Uscire dal gioco **è** il modo di salvare subito: la fattoria scrive a
   ritardo (trascinando una panchina si muovono venti celle al secondo, e
   persistere a ogni fotogramma sarebbe assurdo) ma `onBeforeUnmount`
   scrive senza aspettare. Leggere il profilo restando dentro il gioco
   dava un test che passava o no a seconda di quanto era stato lento il
   browser: la prima stesura di questo file lo faceva, e infatti era
   verde con gli scatti accesi e rosso senza. */
async function esci() {
  await page.locator('button[aria-label="indietro"]').click()
  await page.waitForSelector('.carte', { timeout: 5000 })
  await attendi(page, 400)
}
/* La fattoria apre le cose a poco a poco (`dati/livelli.js`): il mulino
   arriva al 2, il pollaio al 4, la stalla al 7. Qui si prova la
   coltivazione, non gli sblocchi — che hanno il loro file
   (`unita/livelli-fattoria`) — quindi si entra da grandi col cheat
   dell'indirizzo, il fratello di `#monete=`. Serve anche a un'altra
   cosa: senza, a metà prova si salirebbe di livello e il foglio della
   festa comparirebbe sopra quello che il test sta guardando. */
await page.evaluate(() => { location.hash = 'fattoria=65' })
await entra()

/* Il dito vero, come in `integrazione/fattoria`: un `page.click()` non
   porta con sé il click fantasma e non proverebbe niente di quello che
   succede su un telefono. */
const cdp = await page.context().newCDPSession(page)
const giu = (x, y) => cdp.send('Input.dispatchTouchEvent',
                               { type: 'touchStart', touchPoints: [{ x, y }] })
const su = () => cdp.send('Input.dispatchTouchEvent',
                          { type: 'touchEnd', touchPoints: [] })

async function dito(x, y, tieni = 60) {
  await giu(x, y)
  await attendi(page, tieni)
  await su()
  await attendi(page, 260)          // il click fantasma arriva qui dentro
}

const titolo = () => page.evaluate(
  () => ((document.querySelector('.fa-foglio') || {}).innerText || '').split('\n')[0])
const testoFoglio = () => page.evaluate(
  () => (document.querySelector('.fa-foglio') || {}).innerText || '')
const monete = () => page.evaluate(
  () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))

async function chiudi() {
  if (await page.locator('.fa-velo').count()) {
    await page.locator('.fa-velo').click({ position: { x: 5, y: 5 } })
    await attendi(page, 250)
  }
}

const box = await page.locator('.fa-tela').boundingBox()
const mezzo = { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) }

/* ---------- 1. il campo si compra dal baule ----------
   Premere una voce del baule **è** cominciare a posarla, e il tocco dopo
   la posa: è lo stesso gesto di ogni altra cosa, e il campo non fa
   eccezione. */
await page.locator('.fa-tondo').click()
await page.waitForSelector('.fa-voce', { timeout: 3000 })
/* Il baule si apre già su «la fattoria», e lì la linguetta è **una
   sola** — campi, macchine, silos e recinti sono la stessa catena — e
   quando è una sola non si mostra affatto: un tasto senza alternative
   non è una scelta. */
uguale('sotto «la fattoria» non ci sono linguette da scegliere',
       await page.locator('.fa-scheda').count(), 0)
/* Il granaio **non è mai stato rimesso lì**: si guarda toccando un silo
   (vedi `viste/Granaio.vue`). Il controllo è al negativo perché è il
   modo in cui una linguetta rimessa per comodità si farebbe riprendere
   — e con lei tornerebbe l'unica scheda del baule che si guarda e
   basta. */
uguale('e il granaio non è una metà del baule',
       await page.locator('.fa-zona', { hasText: 'Granaio' }).count(), 0)

for (const che of ['Campo', 'Mulino', 'Silo'])
  controlla(`fra i campi si vende «${che}»`,
            await page.locator('.fa-voce', { hasText: che }).count() > 0)
await scatto(page, 'campi-baule')

const vCampo = await page.locator('.fa-voce', { hasText: 'Campo' }).first().boundingBox()
const primaDelCampo = await monete()
await dito(Math.round(vCampo.x + vCampo.width / 2), Math.round(vCampo.y + vCampo.height / 2))
/* posato in basso a destra del centro: lontano dal bosco e da quello che
   il gioco potrebbe aver messo in mezzo */
const dove = { x: mezzo.x + 24, y: mezzo.y + 48 }
await dito(dove.x, dove.y)
await attendi(page, 500)
const dopoIlCampo = await monete()
controlla('il campo si compra posandolo', dopoIlCampo < primaDelCampo)
nota(`campo pagato ${primaDelCampo - dopoIlCampo} monete`)

/* ---------- 1b. e il silo del raccolto, che adesso serve davvero ----------
   *Ribalta l'ordine di prima*, che comprava il silo dopo aver raccolto
   («raccolgo, non so dove è finito, metto un silo»). Adesso senza silo
   il raccolto **non si raccoglie**: la capienza di un silo che non c'è
   è zero, non piccola, e il campo resta pronto ad aspettare. Quindi si
   compra prima, che è anche l'ordine in cui il gioco lo chiede — la
   scheda del campo vuoto lo dice prima di seminare. */
/* Posare chiude il baule — premere è già mettere giù — quindi per la
   cosa dopo lo si riapre. */
await page.locator('.fa-tondo').click()
await page.waitForSelector('.fa-voce', { timeout: 3000 })
const vSilo = await page.locator('.fa-voce', { hasText: 'Silo' }).first().boundingBox()
await dito(Math.round(vSilo.x + vSilo.width / 2), Math.round(vSilo.y + vSilo.height / 2))
/* lontano dal campo e da dove finirà il recinto, che è largo quattro
   celle: due cose che si sovrappongono non si posano, e il test
   fallirebbe dicendo una cosa che non c'entra */
const doveSilo = { x: mezzo.x + 130, y: mezzo.y + 110 }
await dito(doveSilo.x, doveSilo.y)
await attendi(page, 500)
controlla('il silo si compra posandolo', await monete() < dopoIlCampo)
await chiudi()

/* ---------- 2. toccarlo apre la sua scheda ----------
   Lo stesso gesto con cui si tocca un cane: è la ragione per cui non c'è
   niente di nuovo da imparare. */
await dito(dove.x, dove.y)
await attendi(page, 400)
uguale('toccando il campo si apre la sua scheda', await titolo(), 'Un campo da seminare')
await scatto(page, 'campi-scheda-vuoto')
controlla('e dentro ci sono le colture da scegliere',
          await page.locator('.fa-cibo', { hasText: 'Grano' }).count() > 0)
controlla('e dice che ci vuole del tempo vero',
          /tempo vero/i.test(await testoFoglio()))

/* ---------- 3. si semina ---------- */
const primaDiSeminare = await monete()
await page.locator('.fa-cibo', { hasText: 'Grano' }).first().click()
await attendi(page, 500)
uguale('seminato, il foglio si chiude', await page.locator('.fa-velo').count(), 0)
controlla('e la semina si paga', await monete() < primaDiSeminare)

await dito(dove.x, dove.y)
await attendi(page, 400)
const cresce = await testoFoglio()
uguale('toccandolo di nuovo dice cos\'ha dentro', await titolo(), 'Grano')
controlla('e che sta crescendo', /sta crescendo/i.test(cresce), cresce.slice(0, 90))
controlla('e non si può raccogliere adesso',
          await page.locator('.fa-foglio button', { hasText: 'Raccogli' }).count() === 0)
await scatto(page, 'campi-cresce')
await chiudi()
await attendi(page, 400)
/* il campo scoperto, per guardare i germogli con un occhio umano */
await scatto(page, 'campi-cresce-sul-campo')

/* ---------- 4. il seminato è in archivio ----------
   Se non ci fosse, il campo ripartirebbe da zero a ogni apertura e a
   schermo sembrerebbe soltanto «lento». */
await esci()
const salvato = await leggiProfilo(page)
const stato = (((salvato.campagne || {}).fattoria || {}).cfg || {}).stato
const campoSalvato = (stato.cose || []).find(c => c.coltura)
controlla('il campo seminato è nel profilo', !!campoSalvato)
uguale('con la sua coltura', campoSalvato && campoSalvato.coltura, 'grano')
controlla('e con l\'ora in cui è stato seminato', campoSalvato && campoSalvato.seminato > 0)

/* ---------- 5. passa il tempo: si chiude e si riapre ----------
   Venti minuti indietro nel profilo sono una notte passata. Si riapre e
   il grano deve essere pronto — non ripartito, non secco. */
campoSalvato.seminato -= 20 * 60000
await semina(page, { coins: 3000, campagne: salvato.campagne })
await entra()

await dito(dove.x, dove.y)
await attendi(page, 400)
const pronto = await testoFoglio()
controlla('riaperto il gioco, il grano è pronto', /pronto/i.test(pronto), pronto.slice(0, 90))
await scatto(page, 'campi-pronto')
/* Il campo da solo, senza il foglio davanti: è l'unico modo di guardare
   con un occhio umano com'è venuto il grano maturo e il cestino sopra —
   nessun controllo automatico guarda i pixel. Si richiude e si ritocca
   nello stesso punto, senza toccare lo zoom: zoomando la vista si sposta
   e il campo non sarebbe più dove il dito sa che è. */
await chiudi()
await attendi(page, 400)
await scatto(page, 'campi-maturo-sul-campo')
await dito(dove.x, dove.y)
await attendi(page, 400)

/* ---------- 6. si raccoglie, e finisce in granaio ---------- */
const tasto = page.locator('.fa-foglio button', { hasText: 'Raccogli' })
controlla('c\'è il tasto per raccogliere', await tasto.count() === 1)
await tasto.click()
await attendi(page, 600)
uguale('raccolto, il foglio si chiude', await page.locator('.fa-velo').count(), 0)

/* ---------- 6b. il silo si guarda toccandolo, e si ingrandisce ----------
   Il gesto è quello di tutto il resto — tocca una cosa tua e vedi cosa
   ci si può fare. Dentro c'è **uno scomparto per merce**, con la sua
   barretta, e il tasto che è la sola cosa da fare qui: ingrandirli
   tutti insieme. */
await dito(doveSilo.x, doveSilo.y)
await attendi(page, 450)
uguale('toccando il silo si apre il suo foglio', await titolo(), 'Silo del raccolto')
const granaio = await page.evaluate(
  () => (document.querySelector('.fa-granaio') || {}).innerText || '')
/* `innerText` rende il testo **come si vede**, e le etichette degli
   scomparti sono in maiuscoletto: cercare «Grano» com'è scritto nel
   dato fallisce su una schermata giusta. */
controlla('e il grano è lì dentro, col suo conto', /grano[\s\S]*?\d+\/\d+/i.test(granaio),
          granaio.replace(/\n+/g, ' · ').slice(0, 200))
controlla('e dice quanto ci sta di ogni cosa',
          /\d+ di ogni cosa/.test(granaio),
          granaio.replace(/\n+/g, ' · ').slice(0, 200))

/* Gli scomparti sono **cinque, uno per merce dei campi**, e ci sono
   anche quelli vuoti: uno scomparto a zero è il posto dove potrebbe
   andare qualcosa, cioè il modo di far scoprire che si può coltivare
   altro. Se un giorno tornassero i posti condivisi, questa riga cade. */
uguale('c\'è uno scomparto per ogni merce dei campi',
       await page.locator('.fa-scomparto').count(), 5)
controlla('e il mangime non è fra questi: sta con gli animali',
          !/mangime/i.test(granaio), granaio.replace(/\n+/g, ' · ').slice(0, 200))
await scatto(page, 'campi-granaio')

/* Premere una roba dice **chi la usa**: è la sola cosa utile che una
   riga di magazzino possa dire, e l'unico motivo per cui è premibile. Il
   grano ha due usi veri (mulino e pollaio), quindi si controlla che ne
   compaia almeno uno col nome della macchina. */
await page.locator('.fa-scomparto', { hasText: 'Grano' }).first().click()
await attendi(page, 250)
const usi = await page.evaluate(
  () => (document.querySelector('.fa-usi') || {}).innerText || '')
controlla('premendo il grano si legge chi lo usa', /mulino|pollaio/i.test(usi),
          usi.replace(/\n+/g, ' · ').slice(0, 140))
await scatto(page, 'campi-granaio-usi')

/* Ingrandire: il foglio non si chiude e i posti diventano di più — in
   **ogni** scomparto, che è la differenza fra questo magazzino e quello
   di prima. Che il foglio resti aperto è una scelta (chi ne vuole altri
   due è già lì), quindi si controlla: se no la prossima riscrittura lo
   chiude e nessuno se ne accorge. */
const postiPrima = Number((granaio.match(/(\d+) di ogni cosa/) || [])[1])
const primaDiIngrandire = await monete()
await page.locator('.fa-foglio button', { hasText: 'Ingrandisci' }).click()
await attendi(page, 450)
const dopoIngrandito = await page.evaluate(
  () => (document.querySelector('.fa-granaio') || {}).innerText || '')
const postiDopo = Number((dopoIngrandito.match(/(\d+) di ogni cosa/) || [])[1])
controlla('ingrandire il silo aggiunge posti a ogni scomparto', postiDopo > postiPrima,
          `${postiPrima} → ${postiDopo}`)
controlla('e si paga', await monete() < primaDiIngrandire)
nota(`scomparti ingranditi: ${postiPrima} → ${postiDopo} posti a testa, ` +
     `${primaDiIngrandire - await monete()} monete`)
await chiudi()

/* ---------- 7. il recinto: la seconda macchina ----------
   Un recinto è una macchina come il mulino, e questa parte esiste per
   provare la cosa che l'unità non può vedere: che il dito ci arrivi, che
   il piede 4×3 ci stia, e soprattutto che il **ritratto giusto** compaia
   in mappa. Un ritratto sbagliato è muto (`drawImage` con un argomento
   non finito torna senza disegnare e senza lanciare), quindi da qui si
   guarda l'unica cosa che si può guardare da fuori: che il pannello si
   apra col suo nome e dica cosa gli manca. */
await page.locator('.fa-tondo').click()
await page.waitForSelector('.fa-voce', { timeout: 3000 })
/* I recinti stanno **nella stessa linguetta dei campi**: sono i passi
   successivi della stessa catena, e in due scaffali diversi quella fila
   non si vede. Sotto «la fattoria» la linguetta è una sola, e quando è
   una sola non si mostra affatto — quindi qui non si clicca niente: il
   baule si apre già lì. */
controlla('sotto «la fattoria» non c\'è nessuna linguetta da scegliere',
          await page.locator('.fa-scheda').count() === 0)
for (const che of ['Campo', 'Fienile', 'Conigliera', 'Pollaio', 'Stalla'])
  controlla(`la catena si vende tutta in fila: «${che}»`,
            await page.locator('.fa-voce', { hasText: che }).count() > 0)
await scatto(page, 'campi-cortile')

const vRecinto = await page.locator('.fa-voce', { hasText: 'Conigliera' }).first().boundingBox()
const primaDelRecinto = await monete()
await dito(Math.round(vRecinto.x + vRecinto.width / 2),
           Math.round(vRecinto.y + vRecinto.height / 2))
const dovePen = { x: mezzo.x - 30, y: mezzo.y - 70 }
await dito(dovePen.x, dovePen.y)
await attendi(page, 500)
controlla('la conigliera si paga posandola', await monete() < primaDelRecinto)
await scatto(page, 'campi-recinto')

await dito(dovePen.x, dovePen.y)
await attendi(page, 450)
uguale('e toccandola si apre col suo nome', await titolo(), 'Conigliera')
const foglioRecinto = await testoFoglio()
controlla('che dice cosa le manca, col numero',
          /serve ancora\s*2/.test(foglioRecinto),
          foglioRecinto.replace(/\n+/g, ' · ').slice(0, 160))
controlla('e non parla di mulini', !/mulino/i.test(foglioRecinto))
await chiudi()

await esci()
const dopoTutto = await leggiProfilo(page)
controlla('il raccolto è finito nei contatori',
          (dopoTutto.totals || {}).fattoriaRaccolti > 0)
const statoFinale = (((dopoTutto.campagne || {}).fattoria || {}).cfg || {}).stato
controlla('e il granaio è in archivio',
          Object.values(statoFinale.granaio || {}).some(n => n > 0))
uguale('e il campo è tornato vuoto',
       (statoFinale.cose || []).some(c => c.coltura), false)

controlla('la conigliera è in archivio',
          (statoFinale.cose || []).some(c => c.id === 'conigliera'))

uguale('nessun errore in console', errori.join(' · '), '')
nota(`il campo si tocca a ${dove.x},${dove.y}`)

riassunto('I campi col dito')
await browser.close()
