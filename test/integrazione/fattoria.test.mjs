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

/* ---------- 8. una bestia si sceglie dove farla arrivare ----------
   E dove sta si salva: se rinascesse in mezzo al prato, quello che la
   bambina aveva chiuso nel recinto se ne sarebbe uscito da solo. */
{
  await page.locator('.fa-tondo').click()
  await page.waitForSelector('.fa-voce', { timeout: 3000 })
  await page.locator('.fa-scheda', { hasText: 'Animali' }).click()
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
     sa: da lì in poi gira per il prato per conto suo. Quindi le due
     prove del gesto sulle bestie si fanno adesso. Il primo tocco apre la
     scheda e insieme la **seleziona**, e una bestia selezionata sta
     ferma: da qui in poi non scappa più, e la prova che segue non
     dipende da dove è andata. */
  let dove = null
  for (const dy of [-8, 0, -20, -32]) {
    await dito(mezzo.x + 40, mezzo.y - 40 + dy)
    if (await page.locator('.fa-bisogni').count()) { dove = { x: mezzo.x + 40, y: mezzo.y - 40 + dy } }
    await chiudi()
    if (dove) break
  }
  controlla('toccando la bestia si apre la sua scheda', !!dove)
  if (dove) {
    await dito(dove.x, dove.y, 0, 900)    // la stessa pressione, ma lunga e ferma
    await attendi(page, 250)
    controlla('e tenendola premuta ferma si apre la scheda lo stesso, non il trascinamento',
              await page.locator('.fa-bisogni').count() > 0)
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

  /* fermo: un tocco lungo quanto si vuole resta un tocco */
  const primaDiTenerePremuto = await page.evaluate(
    () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
  await dito(casetta.x, casetta.y, 0, 900)
  await attendi(page, 250)
  controlla('tenendo premuto fermo su una cosa compaiono i suoi attrezzi',
            await page.locator('.fa-attrezzi').count() > 0)
  uguale('e non è costato niente, perché non si è spostato niente',
         await page.evaluate(
           () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1])),
         primaDiTenerePremuto)
  await scatto(page, 'fattoria-attrezzi')

  /* La stessa prova **fuori dalla cella d'appoggio**, ed è quella che
     inchioda il guasto vecchio. La casetta occupa due celle: tenendo
     premuto sulla seconda, il codice di prima l'aveva già in mano allo
     scadere del tempo e al rilascio la riposava agganciata al dito —
     cioè la spostava di una cella e si prendeva la monetina, senza che
     nessuno avesse chiesto niente. Fermo vuol dire fermo: la cosa resta
     dov'è e si aprono le sue opzioni. */
  await dito(casetta.x + 32, casetta.y, 0, 900)       // una cella a destra, alla scala di partenza
  await attendi(page, 250)
  controlla('tenendo premuto sull\'altra cella della stessa cosa, gli attrezzi lo stesso',
            await page.locator('.fa-attrezzi').count() > 0)
  uguale('e nemmeno lì si è spostato niente, né si è pagato niente',
         await page.evaluate(
           () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1])),
         primaDiTenerePremuto)

  /* mosso: la stessa pressione, ma il dito parte — e allora si sposta.
     Spostare costa una monetina, ed è il modo di vedere da fuori che si
     è trascinato davvero. */
  const primaDiSpostare = await page.evaluate(
    () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
  await giu(casetta.x, casetta.y)
  await attendi(page, 700)                            // l'attesa: adesso è agganciata
  for (let i = 1; i <= 4; i++) await trascina(casetta.x + i * 14, casetta.y - i * 6)
  await su()
  await attendi(page, 500)
  const dopoAverSpostato = await page.evaluate(
    () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
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
