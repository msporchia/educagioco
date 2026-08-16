/* ═══════════════════════════════════════════════════════════════════
   LA DOMANDA, TOCCATA COL DITO

   `quiz/Domanda.vue` è una schermata sola usata da cinque posti — il
   sotterraneo, il Dungeon, la Corsa, Survivors e il banco di prova dei
   grandi — quindi un suo difetto non è di un gioco: è di tutti. Questo
   file prova la cosa che nessun test unitario può vedere, perché non è
   logica ma **tempo e dito**.

   Il guasto da cui nasce, riferito da chi ci giocava: «quando rispondo a
   una domanda preme anche su quella sotto e quindi me la dà sbagliata, e
   una volta che mi dice che ho sbagliato non va avanti». Sono due cose
   sole in fila: sbagliando si resta fermi a lungo (c'è da leggere il
   perché) e quell'attesa non si vedeva — indistinguibile da un gioco
   bloccato — quindi si tocca di nuovo, e la domanda dopo compare
   **nello stesso punto** e si becca il tocco.

   Quindi si controlla che:
     · una domanda appena comparsa non si lascia toccare per un pelo
       di tempo (la finestra cieca);
     · passato quel pelo, si risponde normalmente;
     · dopo aver risposto l'attesa **si vede**, invece di essere una
       schermata ferma.

   Si arriva alla domanda dal banco di prova dei grandi
   (`[data-prova]` → `quiz/Prova.vue`) e non da un gioco: è l'unico
   posto dove una domanda vera compare **a comando**, senza dover prima
   incontrare un mostro nel punto giusto dello schermo.

   I tocchi si mandano come tocchi (`Input.dispatchTouchEvent` via CDP):
   col mouse il bersaglio si decide alla pressione, e il fantasma che
   causa il guasto non parte nemmeno.
   `node test/esegui.mjs domanda`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* ---------- si arriva a una domanda vera ---------- */
await page.click('.carta[data-azione="grandi"]')
await page.waitForSelector('.tastierino', { timeout: 5000 })
for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
await page.waitForSelector('.carte', { timeout: 5000 })

await page.click('[data-scheda="sa"]')          // «Cosa sa», dove stanno i saperi
const prova = page.locator('[data-prova]').first()
controlla('dai grandi si può provare una domanda', await prova.count() === 1)
await prova.click()
await page.waitForSelector('.qz-tasto', { timeout: 5000 })

const cdp = await page.context().newCDPSession(page)
async function tocca(box) {
  const punti = [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }]
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: punti })
  await attendi(page, 40)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
/* Ha risposto? Le classi lo dicono: finché nessuno ha scelto, i tasti
   sono tutti nudi; dal momento della scelta uno è `giusta`, uno
   `sbagliata`, gli altri `spenti`. */
const risposto = () => page.locator('.qz-tasto.giusta, .qz-tasto.sbagliata, .qz-tasto.spenta').count()

/* ---------- 1. la finestra cieca ----------
   Il tocco parte subito, cioè dentro i 320 ms in cui la domanda è
   appena comparsa. È il fantasma della domanda di prima, ed è quello
   che dava la risposta a caso. */
await page.locator('.qz-tasto').first().waitFor()
const primo = await page.locator('.qz-tasto').first().boundingBox()
await tocca(primo)
await attendi(page, 120)
uguale('un tocco appena comparsa la domanda non risponde', await risposto(), 0)

/* ---------- 2. ma un attimo dopo si risponde ----------
   La controprova che serve: se la finestra cieca non si riaprisse, il
   gioco resterebbe muto per sempre — in cinque schermate. */
await attendi(page, 400)
await tocca(await page.locator('.qz-tasto').first().boundingBox())
await page.waitForSelector('.qz-tasto.giusta', { timeout: 2000 })
controlla('passata la finestra, il tocco risponde', await risposto() > 0)

/* ---------- 3. l'attesa si vede ----------
   La riga che si riempie sotto la carta. È la metà del rimedio che
   riguarda il «non va avanti»: senza, quei due secondi sono un tasto
   rotto, e il dito torna a premere. */
controlla("dopo la risposta l'attesa si vede", await page.isVisible('.qz-avanti'))
const durata = await page.evaluate(() => {
  const i = document.querySelector('.qz-avanti i')
  return i ? getComputedStyle(i).animationDuration : 'non c\'è'
})
controlla('e dura quanto l\'attesa vera', parseFloat(durata) > 0.2, durata)
await scatto(page, 'domanda-attesa')

/* ---------- 4. DUE DOMANDE DI FILA ----------
   Questa è la parte che conta, ed è il guasto vero: nel banco di prova
   ogni domanda è un montaggio nuovo, ma **in un gioco no**. Chi
   incatena domande passa dalla A alla B senza mai spegnere il `v-if` in
   mezzo — tutto dentro lo stesso giro di aggiornamento — quindi Vue
   riusa la stessa istanza, e con lei si porta dietro la scelta di
   prima: la domanda nuova nasce con un tasto **già colorato** (quello
   nello stesso posto di quello premuto un attimo fa) e poi non si
   lascia più rispondere, perché una scelta risulta già fatta. Fuori si
   legge: «me la dà sbagliata, e poi non va avanti».

   Il banco è una battaglia del sotterraneo, e non è una scelta di
   comodo: è l'unico posto dove **la catena non dipende dall'azzeccare**
   — si risponda giusto o sbagliato, lo scontro va avanti e la domanda
   dopo arriva nella stessa istanza. Un banco dove serve indovinare
   misurerebbe la fortuna, e infatti la prima stesura di questo test era
   ballerina.

   Il seme è fissato (`#seme=49`): con quello il primo goblin sta otto
   celle a est della stanza di partenza, in linea quasi retta, e ci si
   arriva camminando sempre nella stessa direzione. Il seme si legge
   quando parte la discesa, quindi si scrive nell'indirizzo un attimo
   prima di toccare la tappa. */
await page.click('.prova-x')                    // si chiude il banco di prova
await page.waitForSelector('.prova-velo', { state: 'hidden', timeout: 5000 })
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carte', { timeout: 5000 })
await semina(page, { coins: 300, settings: { sperimentali: true } })
await page.waitForSelector('.carta.gioco[data-gioco="sotterraneo"]', { timeout: 5000 })
await page.click('.carta.gioco[data-gioco="sotterraneo"]')
await page.waitForSelector('.sot-tappe', { timeout: 5000 })
await page.evaluate(() => { location.hash = 'seme=49' })
await page.click('.sot-tappa[data-tappa="0"]')
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 700)

const campo = await page.locator('.sot-tela').boundingBox()
const versoEst = async () => {
  const p = [{ x: campo.x + campo.width / 2 + 96, y: campo.y + campo.height / 2 }]
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: p })
  await attendi(page, 45)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
/* Lungo la strada c'è una porta chiusa, che apre il suo foglio e ferma
   la camminata: col foglio aperto il campo non risponde più ai tocchi,
   quindi va chiuso o non si arriva da nessuna parte. */
let inBattaglia = false
for (let i = 0; i < 24 && !inBattaglia; i++) {
  await versoEst()
  await attendi(page, 800)
  inBattaglia = await page.locator('.sot-velo').count() > 0
  if (!inBattaglia && await page.locator('.sot-foglio').count())
    await page.locator('.sot-foglio .sot-grosso').last().click()
}
controlla('col seme 49 si arriva addosso a un mostro', inBattaglia)

/* La battaglia sta **al centro**, non in fondo: comincia mentre si
   cammina, e un pannello in fondo allo schermo compare dove chi guarda
   il proprio eroe non sta guardando. Si controlla che sia davvero in
   mezzo, con lo stesso spazio sopra e sotto. */
const posto = await page.evaluate(() => {
  const m = document.querySelector('.sot-modale')?.getBoundingClientRect()
  const t = document.querySelector('.sot-tela')?.getBoundingClientRect()
  return m && t ? { sopra: Math.round(m.top - t.top), sotto: Math.round(t.bottom - m.bottom) } : null
})
controlla('lo scontro è una modale in mezzo allo schermo',
          posto && Math.abs(posto.sopra - posto.sotto) < 60,
          posto ? `${posto.sopra} px sopra, ${posto.sotto} sotto` : 'nessuna modale')

/* Ed ecco la catena. Si conta quante volte di fila **il tocco viene
   registrato**: il componente colora la risposta appena si sceglie,
   quindi se dopo il tocco non si colora niente vuol dire che è stato
   ingoiato — cioè il gioco è fermo. Col difetto ci si arriva alla
   seconda.

   Due giri e non tre, e il numero conta: il goblin ha 4 di vita e ne
   prende 3 a colpo, quindi **due domande sono garantite** e la terza
   dipende da quante se ne sbagliano. Un giro in più avrebbe fatto
   ballare il conto dei controlli — verde tutte e due le volte, ma una
   volta con un controllo in meno, cioè non eseguito. Un verde che a
   volte prova una cosa e a volte no è il posto dove un guasto ci mette
   dei mesi a farsi notare, quindi qui dentro ogni giro esegue gli
   stessi controlli e non ce ne sono di saltabili in silenzio: dove
   prima c'era un `break` muto adesso c'è un `controlla` che dichiara
   cos'è mancato. */
let risposteDate = 0
for (let giro = 0; giro < 2; giro++) {
  const cEDaRispondere = await page.locator('.qz-tasto').count() > 0
  controlla(`la ${giro + 1}ª domanda è lì da rispondere`, cEDaRispondere)
  if (!cEDaRispondere) break
  uguale(`la ${giro + 1}ª domanda nasce senza risposte già scelte`, await risposto(), 0)
  await attendi(page, 400)
  await tocca(await page.locator('.qz-tasto').first().boundingBox())
  await attendi(page, 300)
  const arrivato = await risposto() > 0
  controlla(`e il tocco sulla ${giro + 1}ª viene registrato`, arrivato,
            arrivato ? '' : 'il gioco si è piantato qui')
  if (!arrivato) break
  risposteDate++
  await attendi(page, 2400)                       // l'esito, il respiro, la prossima
}
controlla('due domande di fila si sono potute rispondere', risposteDate >= 2,
          `ne ho risposte ${risposteDate}`)
await scatto(page, 'domanda-incatenata')

uguale('nessun errore in console', errori.length, 0, errori.join('\n'))
nota('la finestra cieca dura 320 ms: meno di quanto ci mette chiunque a '
   + 'leggere una domanda nuova, più di quanto ce ne mette un fantasma ad arrivare')

await browser.close()
riassunto('la domanda col dito')
