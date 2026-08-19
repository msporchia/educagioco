/* ═══════════════════════════════════════════════════════════════════
   LA FATTORIA, TOCCATA COL DITO

   Il test unitario dice che comprare un pezzo di terra funziona; questo
   dice che **il dito ci arriva**. È la differenza che ha fatto sembrare
   il gioco a posto sul computer e rotto sul telefono, e la ragione per
   cui esiste questo file: alzato il dito il browser manda anche un
   `click`, e lo manda a chi sta sotto il dito *in quel momento* — cioè
   al velo del pannello appena aperto, che si chiudeva da sé. Col mouse
   non succede, perché lì il bersaglio del click si decide alla
   pressione.

   Per vederlo, i tocchi si mandano davvero come tocchi
   (`Input.dispatchTouchEvent` via CDP): un `page.click()` non avrebbe
   mai mostrato niente, perché non porta con sé nessun fantasma e non
   deriva di un pixel.
   `node test/esegui.mjs fattoria`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, scatto, attendi }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* ---------- 1. si entra dalla home ---------- */
const vecchio = await leggiProfilo(page)
await semina(page, {
  coins: 3000,
  settings: { ...((vecchio || {}).settings || {}), sperimentali: true },
})

const carta = page.locator('.carta.gioco[data-gioco="fattoria"]')
controlla('la carta della fattoria è in home coi giochi in prova accesi',
          await carta.count() === 1)
await carta.click()
await page.waitForSelector('.fa-tela', { timeout: 5000 })
await attendi(page, 500)

/* ---------- il dito ----------
   Un tocco vero: appoggia, striscia di quel poco che striscia sempre un
   dito appoggiato, alza. `scarto` è in pixel **per lato**: 0 è il dito
   di un robot, 7 è quello di un bambino che preme forte. */
const cdp = await page.context().newCDPSession(page)

const giu = (x, y) => cdp.send('Input.dispatchTouchEvent',
                               { type: 'touchStart', touchPoints: [{ x, y }] })
const trascina = (x, y) => cdp.send('Input.dispatchTouchEvent',
                                    { type: 'touchMove', touchPoints: [{ x, y }] })
const su = () => cdp.send('Input.dispatchTouchEvent',
                          { type: 'touchEnd', touchPoints: [] })

async function dito(x, y, scarto = 0, tieni = 60) {
  await giu(x, y)
  for (const q of scarto ? [0.35, 0.7, 1] : [])
    await trascina(x + scarto * q, y + scarto * q)
  await attendi(page, tieni)
  await su()
  await attendi(page, 220)      // il click fantasma arriva qui dentro
}

const foglio = () => page.evaluate(
  () => ((document.querySelector('.fa-foglio') || {}).innerText || '').split('\n')[0])
const cartelloAperto = async () => (await foglio()) === 'Un altro pezzo di terra'

async function chiudi() {
  if (await page.locator('.fa-velo').count()) {
    await page.locator('.fa-velo').click({ position: { x: 5, y: 5 } })
    await attendi(page, 200)
  }
}

/* ---------- 1b. i livelli: cosa c'è, e cosa non c'è ancora ----------
   Una fattoria appena nata è al livello 1, e il baule mostra una fetta
   del catalogo: è tutto il senso dei livelli (`dati/livelli.js`), e il
   modo di accorgersi che si sono spenti è che qui ricompare tutto. */
{
  const gettone = page.locator('.fa-liv')
  controlla('in alto c\'è il gettone del livello', await gettone.count() === 1)
  uguale('e una fattoria nuova è al livello 1',
         (await gettone.innerText()).replace(/\D/g, ''), '1')

  await page.locator('.fa-tondo').click()
  await page.waitForSelector('.fa-voce', { timeout: 3000 })
  uguale('al livello 1 il baule non vende ancora le case',
         await page.locator('.fa-scheda', { hasText: 'Case' }).count(), 0)
  /* Gli animali sono **una delle tre metà** in cima, non una linguetta:
     al livello 1 non ce n'è ancora nessuno in vendita, quindi quella
     metà non compare affatto. */
  uguale('né gli animali', await page.locator('.fa-zona', { hasText: 'Animali' }).count(), 0)
  controlla('ma la catena c\'è',
            await page.locator('.fa-voce', { hasText: 'Campo' }).count() > 0)
  /* La metà delle decorazioni non c'è proprio finché non arriva la
     prima: una linguetta che si apre su niente è un tasto rotto. */
  uguale('e la metà del bello non c\'è ancora',
         await page.locator('.fa-zona').count(), 0)
  const quante = await page.locator('.fa-voce').count()
  controlla(`al primo livello lo scaffale ha poche cose (${quante})`, quante <= 4)
  await chiudi()

  await gettone.click()
  await attendi(page, 300)
  const foglioLiv = await page.evaluate(
    () => (document.querySelector('.fa-livelli') || {}).innerText || '')
  controlla('il gettone apre la pagina dei livelli', /livello 1/i.test(foglioLiv),
            foglioLiv.replace(/\n+/g, ' · ').slice(0, 120))
  controlla('che dice cosa arriva al livello dopo', /al livello 2 arriva/i.test(foglioLiv))
  controlla('e nomina il mulino, che è quello che arriva', /mulino/i.test(foglioLiv))
  await scatto(page, 'fattoria-livelli')
  await chiudi()
}

/* ---------- 1c. da qui in poi si gioca da grandi ----------
   Il resto del file compra case, panchine e animali, che arrivano ai
   livelli alti: si usa il cheat dell'indirizzo (`#fattoria=10`, il
   fratello di `#monete=`) invece di spendere tremila monete a colpi di
   dito. Il cheat si legge quando il gioco nasce, quindi si esce e si
   rientra. */
await page.evaluate(() => { location.hash = 'fattoria=65' })
await page.reload()
await page.waitForSelector('.carta.gioco[data-gioco="fattoria"]', { timeout: 5000 })
await page.locator('.carta.gioco[data-gioco="fattoria"]').click()
await page.waitForSelector('.fa-tela', { timeout: 5000 })
await attendi(page, 600)
controlla('col cheat la fattoria è cresciuta',
          Number((await page.locator('.fa-liv').innerText()).replace(/\D/g, '')) >= 60)

/* ---------- 2. dove sta un pezzo di terra da comprare ----------
   Non si calcola: si cerca. La vista dipende da quanto è grande lo
   schermo, e un numero scritto a mano qui dentro sarebbe vero su un
   telefono solo. */
const box = await page.locator('.fa-tela').boundingBox()
let punto = null
for (let y = box.y + 16; y < box.y + box.height - 16 && !punto; y += 30)
  for (let x = box.x + 20; x < box.x + box.width - 20 && !punto; x += 60) {
    await dito(Math.round(x), Math.round(y))
    if (await cartelloAperto()) punto = { x: Math.round(x), y: Math.round(y) }
    await chiudi()
  }

controlla('col dito si arriva a un pezzo di terra da comprare', !!punto)
if (!punto) {
  nota('senza un punto buono il resto non si può provare')
  await scatto(page, 'fattoria-niente-terra')
  riassunto('La fattoria col dito')
  await browser.close()
  process.exit(1)
}
nota(`il pezzo di terra si tocca a ${punto.x},${punto.y}`)

/* ---------- 3. il cartello resta aperto ----------
   Il guasto vero non era che il cartello non si aprisse: era che si
   apriva e si richiudeva nello stesso istante, mangiato dal click che
   il dito si lascia dietro. Mezzo secondo dopo deve essere ancora lì. */
await dito(punto.x, punto.y)
await attendi(page, 500)
controlla('il cartello della terra resta aperto dopo che il dito si è alzato',
          await cartelloAperto())
await scatto(page, 'fattoria-cartello')
await chiudi()

/* ---------- 4. e resta aperto anche se il dito deriva ----------
   Un dito appoggiato non sta fermo come un mouse. Sette pixel per lato
   sono ancora «fermo» per Android e per iOS: il gioco non può essere
   più severo del telefono su cui gira.

   Undici per lato fanno 15,6 pixel di **distanza**, cioè ancora dentro i
   sedici dichiarati. Sono qui apposta: la soglia sommava i due lati, e
   in diagonale buttava via tocchi molto prima di quanto dicesse il
   numero scritto nel codice — cioè proprio i tocchi storti, che sono
   quelli dei bambini. */
for (const scarto of [2, 4, 7, 9, 11]) {
  await dito(punto.x, punto.y, scarto)
  const ok = await cartelloAperto()
  controlla(`il tocco che deriva di ${scarto}px per lato apre il cartello lo stesso`, ok)
  if (!ok) await scatto(page, `fattoria-deriva-${scarto}`)
  await chiudi()
}
await dito(punto.x, punto.y, 20)
uguale('e a 20px per lato è uno scorrimento, non un tocco', await cartelloAperto(), false)
await chiudi()

/* ---------- 4b. il fantasma non si mangia i click veri ----------
   Il rimedio di prima restava in ascolto di UN click qualunque per 350
   ms. Se il fantasma arrivava se lo mangiava lui; ma dopo uno
   scorrimento, un pizzico o un tocco annullato **il fantasma non arriva
   affatto**, e quell'ascolto si mangiava il primo click vero: il tasto
   premuto subito dopo aver trascinato la mappa. A schermo è «a volte non
   mi fa toccare le cose, sembra un doppio click», perché il secondo
   tocco funziona. */
{
  const mezzo = { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) }
  await giu(mezzo.x, mezzo.y)
  for (let i = 1; i <= 6; i++) await trascina(mezzo.x - i * 12, mezzo.y - i * 6)
  await su()
  await attendi(page, 60)                 // dentro i 350 ms del rimedio vecchio
  await page.locator('.fa-tondo').click()
  await attendi(page, 250)
  controlla('subito dopo aver trascinato la mappa, il tasto del baule risponde',
            await page.locator('.fa-voce').count() > 0)
  await chiudi()
}

/* ---------- 5. si compra davvero ---------- */
const primaDelleMonete = await page.evaluate(
  () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
await dito(punto.x, punto.y)
controlla('il cartello è aperto e si può comprare', await cartelloAperto())
await page.locator('.fa-foglio button', { hasText: 'Compra' }).click()
await attendi(page, 400)
const dopoLeMonete = await page.evaluate(
  () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
controlla('comprando la terra le monete calano', dopoLeMonete < primaDelleMonete)
nota(`terra pagata ${primaDelleMonete - dopoLeMonete} monete`)
uguale('il pezzo comprato non è più in vendita', await cartelloAperto(), false)

/* ---------- 6. il baule, e il fantasma che non deve premere niente ----------
   Tenendo premuto in mezzo al prato si apre il baule, e il foglio del
   baule compare **proprio sotto il dito**: se il click fantasma
   arrivasse fin lì, comprerebbe da solo la prima cosa che trova. */
const mezzo = { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) }
const primaDelBaule = await page.evaluate(
  () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
await dito(mezzo.x, mezzo.y, 0, 700)      // 700 ms: la pressione lunga
await attendi(page, 400)
controlla('tenendo premuto sul prato si apre il baule',
          await page.locator('.fa-voce').count() > 0)
await scatto(page, 'fattoria-baule')
const dopoIlBaule = await page.evaluate(
  () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
uguale('aprire il baule non compra niente da solo', dopoIlBaule, primaDelBaule)
await chiudi()

/* ---------- 7. premere nel baule è già posare ----------
   Un gesto solo: si preme una cosa, il foglio si toglie di mezzo e
   l'anteprima resta appesa al dito; il tocco dopo la posa. Chi non ce
   l'ha la compra posandola, e paga quando ha già visto dove va. */
{
  await page.locator('.fa-tondo').click()
  await page.waitForSelector('.fa-voce', { timeout: 3000 })
  /* Il baule ha tre metà (`viste/Roba.vue`): «La fattoria» è quella che
     si apre, le case stanno in «Decorazioni» e le bestie in «Animali».
     Erano due, con gli animali dentro «la fattoria»: le bestie non
     producono niente, e sotto «la fattoria» restava una linguetta
     sola. */
  controlla('il baule ha le tre metà', await page.locator('.fa-zona').count() === 3)
  await page.locator('.fa-zona', { hasText: 'Decorazioni' }).click()
  await attendi(page, 200)
  await page.locator('.fa-scheda', { hasText: 'Case' }).click()
  await attendi(page, 200)
  const b = await page.locator('.fa-voce', { hasText: 'Casetta' }).first().boundingBox()
  const primaDiPosare = await page.evaluate(
    () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
  await dito(Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2))
  uguale('premendo una cosa nel baule il foglio si toglie di mezzo',
         await page.locator('.fa-velo').count(), 0)
  await dito(mezzo.x, mezzo.y + 60)
  await attendi(page, 400)
  const dopoAverPosato = await page.evaluate(
    () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
  controlla('e il tocco dopo la posa, pagandola', dopoAverPosato < primaDiPosare,
            `${primaDiPosare} → ${dopoAverPosato}`)
  await scatto(page, 'fattoria-posa')
}

/* ---------- 7a. il baule si porta dietro dove l'hai aperto ----------
   Tenere premuto in mezzo al prato vuol dire «voglio metterci qualcosa
   **qui**»: quella scelta è già stata fatta, e farsela chiedere di nuovo
   col tocco dopo è chiedere due volte la stessa cosa. Adesso si sceglie
   e si posa lì.

   Il modo di vederlo da fuori è **il momento in cui si paga**: aprendo
   il baule dal tasto in alto le monete calano al secondo tocco (quello
   che posa), aprendolo tenendo premuto calano subito. */
{
  const dove = { x: mezzo.x - 60, y: mezzo.y + 130 }
  await dito(dove.x, dove.y, 0, 700)          // il tocco lungo: apre il baule
  await attendi(page, 400)
  controlla('tenendo premuto sul prato si apre il baule',
            await page.locator('.fa-voce').count() > 0)
  await page.locator('.fa-zona', { hasText: 'Decorazioni' }).click()
  await attendi(page, 200)
  await page.locator('.fa-scheda', { hasText: 'Verde' }).click()
  await attendi(page, 200)
  /* `scrollIntoViewIfNeeded` non è pignoleria: lo scaffale scorre, e il
     riquadro di una voce fuori dalla vista cade **sotto lo schermo** —
     il tocco arriva alla pagina e non alla carta, e il test fallisce
     dicendo una cosa che col baule non c'entra. */
  const voce = page.locator('.fa-voce', { hasText: 'Sasso' }).first()
  await voce.scrollIntoViewIfNeeded()
  const b = await voce.boundingBox()
  const prima = await page.evaluate(
    () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
  await dito(Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2))
  await attendi(page, 400)
  const dopo = await page.evaluate(
    () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
  controlla('e la cosa scelta si posa lì, senza un secondo tocco',
            dopo < prima, `${prima} → ${dopo}`)
  uguale('il baule si è chiuso da sé', await page.locator('.fa-velo').count(), 0)
  /* E la cella non resta appiccicata: il baule aperto dal tasto in alto
     non ha nessun posto da ricordare, e la cosa dopo va dove la si
     mette. Senza questa riga la prima cosa presa dal tasto finirebbe
     dove si era tenuto premuto la volta prima — un posto che chi gioca
     non sta nemmeno guardando. */
  await page.locator('.fa-tondo').click()
  await page.waitForSelector('.fa-voce', { timeout: 3000 })
  await page.locator('.fa-zona', { hasText: 'Decorazioni' }).click()
  await attendi(page, 200)
  await page.locator('.fa-scheda', { hasText: 'Verde' }).click()
  await attendi(page, 200)
  const voce2 = page.locator('.fa-voce', { hasText: 'Sasso' }).first()
  await voce2.scrollIntoViewIfNeeded()
  const b2 = await voce2.boundingBox()
  const prima2 = await page.evaluate(
    () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
  await dito(Math.round(b2.x + b2.width / 2), Math.round(b2.y + b2.height / 2))
  await attendi(page, 300)
  const dopo2 = await page.evaluate(
    () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
  uguale('dal tasto in alto invece resta appesa al dito, come sempre',
         dopo2, prima2)
  await dito(dove.x + 70, dove.y)
  await attendi(page, 300)

  /* ── E UNA BESTIA POSATA COSÌ CHIEDE IL NOME, E RESTA LÌ A CHIEDERLO ──
     Il caso che si è rotto per primo, ed è la trappola scritta in
     CLAUDE.md: posare subito fa comparire un foglio **sotto il dito** —
     una bestia comprata chiede come si chiama — e il click fantasma di
     quello stesso tocco cade sul velo appena nato, che si chiude da sé.
     Da fuori: «tocco l'animale, mi si chiude la schermata e non riesco a
     metterlo». Il rimedio è `zittisciIlFantasma`, e quello che si può
     guardare da qui è che il foglio **ci sia ancora** un attimo dopo. */
  await dito(dove.x, dove.y + 40, 0, 700)
  await attendi(page, 400)
  await page.locator('.fa-zona', { hasText: 'Animali' }).click()
  await attendi(page, 250)
  const bestia = page.locator('.fa-voce').first()
  await bestia.scrollIntoViewIfNeeded()
  const bb = await bestia.boundingBox()
  await dito(Math.round(bb.x + bb.width / 2), Math.round(bb.y + bb.height / 2))
  await attendi(page, 900)          // il fantasma arriva dentro questo mezzo secondo
  controlla('una bestia posata subito chiede il nome, e il foglio resta',
            (await foglio()).includes('chiami'), await foglio())
  await chiudi()
}

/* ---------- 7b. una cosa unica, posata, esce dal baule ----------
   I due silos sono `unico`: il secondo non si può posare, e il motore
   risponde «ne-hai-gia». Ma un tasto che si preme e non fa niente è un
   tasto rotto — chi lo vede riprova, e la risposta non arriva mai.
   Quindi la voce sparisce dallo scaffale, come sparisce quello che il
   livello non ha ancora aperto. Solo se è in mappa: uno comprato e non
   ancora messo giù deve restare prendibile, o non uscirebbe più dal
   baule. */
{
  const apriIlBaule = async () => {
    await page.locator('.fa-tondo').click()
    await page.waitForSelector('.fa-voce', { timeout: 3000 })
    await page.locator('.fa-zona', { hasText: 'La fattoria' }).click()
    /* Nessuna linguetta da premere: sotto «la fattoria» ce n'è una
       sola — campi, macchine, silos e recinti sono la stessa catena — e
       quando è una sola non si mostra affatto. */
    await attendi(page, 200)
  }
  const quantiSili = () => page.locator('.fa-voce', { hasText: 'Silo del raccolto' }).count()

  await apriIlBaule()
  uguale('il silo del raccolto è nel baule finché non ce l\'hai', await quantiSili(), 1)
  const b = await page.locator('.fa-voce', { hasText: 'Silo del raccolto' }).first().boundingBox()
  await dito(Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2))
  await dito(mezzo.x + 80, mezzo.y + 60)
  await attendi(page, 400)

  await apriIlBaule()
  uguale('e una volta posato non lo propone più', await quantiSili(), 0)
  await scatto(page, 'fattoria-silo-posato')
  await chiudi()

  /* ── IL SILO SI TOCCA DOVE SI VEDE ──────────────────────────────
     Uno sprite si appoggia col fondo sul suo piede e tutto il resto
     sporge in su: il silo occupa due celle per una ed è alto quasi
     quattro, quindi si vedeva grande e si toccava solo nella striscia in
     basso — un quarto di quello che c'è a schermo. Sopra quella striscia
     il dito cadeva sul prato dietro, e il bambino ci andava a camminare.

     Settanta pixel sopra il punto in cui è stato posato sono
     certamente fuori dal piede (una cella alla scala di partenza ne
     misura 32) e certamente dentro il disegno (che ne è alto 116). */
  await dito(mezzo.x + 80, mezzo.y + 60 - 70)
  await attendi(page, 250)
  uguale('il silo si tocca anche in alto, dove si vede e non dove appoggia',
         await foglio(), 'Silo del raccolto')

  /* E chiudendolo non resta niente addosso. Il tocco secco su una cosa
     che ha una scheda apre **solo** quella: prima selezionava anche, e
     gli attrezzi riemergevano da soli alla chiusura del foglio. */
  await chiudi()
  uguale('e chiuso il suo foglio non resta nessun menù appeso',
         await page.locator('.fa-attrezzi').count(), 0)

  /* Gli attrezzi ci sono ancora, ma li chiede il tocco lungo: è lo
     stesso gesto con cui lo si sposta, meno il trascinamento. */
  await dito(mezzo.x + 80, mezzo.y + 60 - 70, 0, 900)
  await attendi(page, 250)
  controlla('tenendolo premuto invece compaiono i suoi attrezzi',
            await page.locator('.fa-attrezzi').count() > 0)
  uguale('e il tocco lungo non apre nessun foglio', await page.locator('.fa-velo').count(), 0)
  await dito(mezzo.x + 80, mezzo.y - 90)      // via, su un pezzo di prato
  await attendi(page, 200)
}

/* ---------- 8. una bestia si sceglie dove farla arrivare ----------
   E dove sta si salva: se rinascesse in mezzo al prato, quello che la
   bambina aveva chiuso nel recinto se ne sarebbe uscito da solo. */
{
  await page.locator('.fa-tondo').click()
  await page.waitForSelector('.fa-voce', { timeout: 3000 })
  await page.locator('.fa-zona', { hasText: 'Animali' }).click()
  await attendi(page, 200)
  const b = await page.locator('.fa-voce').first().boundingBox()
  await dito(Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2))
  uguale('premendo un animale il baule si chiude e comincia la posa',
         await page.locator('.fa-velo').count(), 0)
  await dito(mezzo.x + 40, mezzo.y - 40)
  await attendi(page, 300)
  uguale('posato dove si vuole, chiede il nome', await foglio(), 'Come lo chiami?')
  await page.locator('.fa-foglio button.forte').click()
  await attendi(page, 250)

  /* Appena arrivata si sa **dove** è, ed è l'unico momento in cui lo si
     sa: da lì in poi gira per il prato per conto suo, e **anche fra una
     prova e l'altra**. Chiudere la sua scheda la libera (`chiudi()` in
     `Gioco.vue` lascia il prato pulito), quindi il punto trovato al
     primo tocco non vale più al secondo: ogni prova si cerca il suo, con
     lo stesso giro di tentativi. Prima il test si appoggiava al fatto
     che una bestia guardata restasse selezionata — cioè **ferma per
     sempre** — che era un difetto, non una comodità: una capra che non
     riparte più dopo che le hai letto la scheda sembra incantata.

     Il bersaglio è `.fa-blocco`, i tre riquadri per bisogno: la scheda
     era tre barrette in cima (`.fa-bisogni`) e i tasti sparsi sotto, e
     adesso ogni bisogno è un blocco con dentro quello che lo riempie
     (`viste/Bestia.vue`). */
  const cercaLaBestia = async tieni => {
    for (const dy of [-8, 0, -20, -32]) {
      await dito(mezzo.x + 40, mezzo.y - 40 + dy, 0, tieni)
      if (await page.locator('.fa-blocco').count()) return { x: mezzo.x + 40, y: mezzo.y - 40 + dy }
      await chiudi()
    }
    return null
  }
  let dove = await cercaLaBestia(60)
  controlla('toccando la bestia si apre la sua scheda', !!dove)
  await chiudi()
  /* La stessa pressione, ma lunga e ferma: su una bestia il tocco lungo
     apre la scheda come quello secco — è il **movimento** che apre il
     trascinamento, non il tempo. (Su una cosa posata invece il tocco
     lungo fa un'altra cosa: mostra i suoi attrezzi. Si prova più giù.) */
  if (dove) {
    dove = await cercaLaBestia(900)
    controlla('e tenendola premuta ferma si apre la scheda lo stesso, non il trascinamento',
              !!dove)
    uguale('e i blocchi sono tre, uno per bisogno',
           await page.locator('.fa-blocco').count(), 3)
    await scatto(page, 'fattoria-bestia')

    /* Un cibo che non hai dice **come si fa**, e solo lì dentro offre di
       comprarne uno adesso. Quel tasto è già caduto una volta: azzerava
       lo stato prima di leggere il cibo (`viste/Bestia.vue`), passava un
       `null` a chi nutre e mandava a schermo il cartello di guasto — che
       da fuori è «premo e non succede niente». */
    const senza = page.locator('.fa-cibo', { hasText: 'Mangime' }).first()
    if (await senza.count()) {
      await senza.click()
      await attendi(page, 250)
      controlla('un cibo che non hai dice come si fa',
                await page.locator('.fa-usi').count() > 0)
      const offerta = page.locator('.fa-cibo.dentro')
      if (await offerta.count()) {
        const prima = await page.evaluate(
          () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
        await offerta.click()
        await attendi(page, 350)
        const dopo = await page.evaluate(
          () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
        controlla('e «oppure comprane uno adesso» lo compra davvero', dopo < prima,
                  `${prima} → ${dopo}`)
      }
    }
    await chiudi()
  }

  await attendi(page, 1800)               // il salvataggio è a ritardo
  const salvato = await leggiProfilo(page)
  const bestie = (((((salvato || {}).campagne || {}).fattoria || {}).cfg || {}).stato || {}).bestie
  controlla('l\'animale è nel salvataggio con la sua posizione',
            !!(bestie && bestie[0] && typeof bestie[0].x === 'number'),
            JSON.stringify(bestie))
}

/* ---------- 9. tenere premuto non è ancora trascinare ----------
   Il guasto: passati i 420 ms la cosa era in mano, e al rilascio si
   poteva solo posarla — «mi parte secco in drag e non mi dà le altre
   opzioni». Il confine fra i due gesti era il tempo, che non si vede e
   che un bambino non dosa. Adesso l'attesa **aggancia** e a decidere è
   il movimento: fermo è un tocco (e apre le opzioni), mosso è un
   trascinamento. Si prova solo col dito vero, perché è un gesto. */
{
  const casetta = { x: mezzo.x, y: mezzo.y + 60 }      // posata al punto 7

  /* ── E IL CANE CHE PASSA DI LÌ ──
     Al punto 8 si è comprato un beagle, e un beagle non sta fermo: gira
     per il prato anche fra una prova e l'altra, e prima o poi passa
     sopra la casetta. Quando capita il tocco prende **lui** — il
     bersaglio si decide quando il dito si appoggia, e sotto il dito
     c'era il cane — e si apre la sua scheda, che col suo velo si mangia
     anche i tocchi della prova dopo. Da fuori si vedeva un
     trascinamento rotto una volta su tre, e non era rotto niente: era
     un cane che passava.

     Non è una prova sulle bestie: qui si guarda il confine fra il tocco
     e il trascinamento su una **cosa posata**, quindi una prova che
     inciampa nel cane non è fallita, è da rifare. Si ritenta con lo
     stesso giro del punto 8 — si chiude quello che si è aperto, gli si
     dà il tempo di allontanarsi, si riprova — e solo dopo sei tentativi
     si dichiara il guasto. */
  const senzaIlCane = async prova => {
    for (let i = 0; i < 6; i++) {
      if (await prova()) return true
      await chiudi()
      await attendi(page, 900)
    }
    return false
  }

  /* fermo: un tocco lungo quanto si vuole resta un tocco */
  const primaDiTenerePremuto = await page.evaluate(
    () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
  controlla('tenendo premuto fermo su una cosa compaiono i suoi attrezzi',
            await senzaIlCane(async () => {
              await dito(casetta.x, casetta.y, 0, 900)
              await attendi(page, 250)
              return await page.locator('.fa-attrezzi').count() > 0
            }))
  uguale('e non è costato niente, perché non si è spostato niente',
         await page.evaluate(
           () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1])),
         primaDiTenerePremuto)
  await scatto(page, 'fattoria-attrezzi')

  /* ── ↻ e ⇄: quello che c'è e quello che non c'è ──
     Su una casetta il tasto che gira **non deve esserci**: una casa in
     vista tre quarti girata di novanta gradi non gira, cade. Quello che
     rovescia sì, perché quasi tutto si può rovesciare ed è il gesto che
     serve davvero — la porta dall'altra parte. È la regola «meglio
     niente che un tasto che fa una cosa storta», e da nessun'altra
     parte si vede: un tasto in più nella barretta non è un errore che
     lancia, è solo un tasto che si preme e non cambia niente.

     Rovesciare non tocca l'ingombro, quindi non può costare e non può
     spostare: le due monete contate qui sono la prova che il gesto è
     gratis come dev'essere. */
  uguale('su una casetta il tasto che gira non c\'è',
         await page.locator('.fa-attrezzi button[title="giralo"]').count(), 0)
  uguale('quello che rovescia invece sì',
         await page.locator('.fa-attrezzi button[title="rovescialo"]').count(), 1)
  await page.locator('.fa-attrezzi button[title="rovescialo"]').click()
  await attendi(page, 200)
  uguale('rovesciarla non costa niente',
         await page.evaluate(
           () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1])),
         primaDiTenerePremuto)
  controlla('e disegnarla rovesciata non rompe niente',
            !await page.evaluate(
              () => document.body.innerText.includes('Qui si è rotto qualcosa')))
  controlla('gli attrezzi restano aperti, si può rimetterla come prima',
            await page.locator('.fa-attrezzi button[title="rovescialo"]').count() === 1)
  await page.locator('.fa-attrezzi button[title="rovescialo"]').click()
  await attendi(page, 200)

  /* La stessa prova **fuori dalla cella d'appoggio**, ed è quella che
     inchioda il guasto vecchio. La casetta occupa due celle: tenendo
     premuto sulla seconda, il codice di prima l'aveva già in mano allo
     scadere del tempo e al rilascio la riposava agganciata al dito —
     cioè la spostava di una cella e si prendeva la monetina, senza che
     nessuno avesse chiesto niente. Fermo vuol dire fermo: la cosa resta
     dov'è e si aprono le sue opzioni. */
  controlla('tenendo premuto sull\'altra cella della stessa cosa, gli attrezzi lo stesso',
            await senzaIlCane(async () => {
              // una cella a destra, alla scala di partenza
              await dito(casetta.x + 32, casetta.y, 0, 900)
              await attendi(page, 250)
              return await page.locator('.fa-attrezzi').count() > 0
            }))
  uguale('e nemmeno lì si è spostato niente, né si è pagato niente',
         await page.evaluate(
           () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1])),
         primaDiTenerePremuto)

  /* mosso: la stessa pressione, ma il dito parte — e allora si sposta.
     Spostare costa una monetina, ed è il modo di vedere da fuori che si
     è trascinato davvero. */
  const primaDiSpostare = await page.evaluate(
    () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
  let dopoAverSpostato = primaDiSpostare
  /* Anche qui il cane: se è lui quello sotto il dito si trascina lui, e
     spostare una bestia è gratis — la monetina non si spende e la prova
     direbbe «non l'ha spostata» di una casetta che nessuno ha toccato.
     Un tentativo andato a vuoto per giunta il cane lo porta via, quindi
     il giro dopo la strada è più libera di prima. */
  await senzaIlCane(async () => {
    await giu(casetta.x, casetta.y)
    await attendi(page, 700)                          // l'attesa: adesso è agganciata
    for (let i = 1; i <= 4; i++) await trascina(casetta.x + i * 14, casetta.y - i * 6)
    await su()
    await attendi(page, 500)
    dopoAverSpostato = await page.evaluate(
      () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
    return dopoAverSpostato < primaDiSpostare
  })
  controlla('la stessa pressione, ma col dito che parte, la sposta',
            dopoAverSpostato < primaDiSpostare, `${primaDiSpostare} → ${dopoAverSpostato}`)

  /* Lo stesso criterio vale sul prato vuoto: l'attesa arma il baule, ma
     se il dito parte si sta spostando la vista, e il foglio non deve
     comparire in faccia a chi stava guardando altrove. */
  await giu(mezzo.x - 60, mezzo.y - 90)
  await attendi(page, 700)
  for (let i = 1; i <= 5; i++) await trascina(mezzo.x - 60 + i * 16, mezzo.y - 90 + i * 8)
  await su()
  await attendi(page, 350)
  uguale('tenuto premuto sul prato ma poi trascinato, il baule non si apre',
         await page.locator('.fa-voce').count(), 0)

  /* Per le bestie la stessa prova sta al punto 8: appena arrivate si sa
     dove sono, e dopo il primo tocco stanno ferme perché sono
     selezionate — cercarle qui vorrebbe dire tastare mezzo prato. */
}

uguale('nessun errore in console', errori.length ? errori.join(' | ') : '', '')
riassunto('La fattoria col dito')
await browser.close()
