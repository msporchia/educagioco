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
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto, leggiProfilo } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* ---------- si arriva a una domanda vera ---------- */
await page.click('[data-azione="grandi"]')
await page.waitForSelector('.tastierino', { timeout: 5000 })
for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
await page.waitForSelector('.carte', { timeout: 5000 })

/* Il ▶ sta su ogni riga del **quadro** dell'età, sotto la manopola
   (`components/eta/Riga.vue`). Le schede «Cosa sa» e «Le domande» —
   che mostravano le stesse cose in due altri modi — sono sparite col
   riassetto: si guarda e si tara in un posto solo. */
await page.click('[data-scheda="giochi"]')
await page.waitForSelector('[data-manopola] .quadro', { timeout: 5000 })
const apriQuadro = async k => {
  const sel = `[data-manopola] [data-apri="${k}"]`
  if ((await page.locator(sel).count()) === 0) return
  if (!(await page.locator(sel).evaluate(el => el.classList.contains('aperta'))))
    await page.click(sel)
  await page.waitForTimeout(150)
}
await apriQuadro('medie')
const prova = page.locator('[data-manopola] [data-apri="medie"] .prova').first()
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

/* ---------- 3b. la palestra dei grandi non conta come esercizio ----------
   Da qui in poi ogni risposta finisce nel ripasso (`quiz/memoria.js`):
   la chiave del concetto entra in `items` come per le tabelline, e il
   giro dopo quella tipologia esce un po' più spesso. Tranne qui: la
   domanda appena risposta è quella del banco di prova, dove un GENITORE
   guarda che domande arrivano. Se contasse, chi apre la schermata e
   scorre trenta esempi riscriverebbe il ripasso di suo figlio con le
   proprie risposte — e per giunta sbagliandone apposta qualcuna, che è
   il modo normale di guardare una domanda. */
const CHIAVI_QUIZ = /^(ana|cal|coniug|geo|gram|gri|indizi|less|log|mis|num|ora|orto|prob|seq|sil):/
const chiaviDiQuiz = async () => Object.keys((await leggiProfilo(page))?.items || {})
  .filter(k => CHIAVI_QUIZ.test(k))
uguale('rispondere dal banco dei grandi non tocca il ripasso',
       (await chiaviDiQuiz()).length, 0)

/* ---------- 3c. IL DISEGNO SI GUARDA GRANDE ----------
   Riferito da chi ci giocava: «ogni tanto è difficile leggere bene
   l'immagine di una domanda, quelle tipo E5». Sono le coordinate della
   griglia: sei colonne e sei righe dentro un riquadro largo al massimo
   148 pixel fanno celle da venti pixel, con dentro una lettera, un
   numero e un'emoji — e la domanda smette di essere sulle coordinate e
   diventa sulla vista. Il disegno del soggetto si tocca e si apre
   grande quanto il velo; si chiude toccando ovunque.
   Si va a prendere proprio quella domanda dal catalogo, per classe,
   invece di sperare che la pesca ne dia una disegnata. */
await page.click('.prova-x')
await page.waitForSelector('.prova-velo', { state: 'hidden', timeout: 5000 })
await page.click('[data-scheda="giochi"]')
await page.waitForSelector('[data-manopola] .quadro', { timeout: 5000 })
/* Il quadro si apre a due livelli — blocco, pezzo di scuola, domande —
   e in quale blocco cada questa classe dipende dall'età del profilo di
   prova. Si aprono tutti, e poi i pezzi uno per uno finché la riga non
   compare: dare per scontata la fascia vorrebbe dire riscrivere questo
   test ogni volta che si sposta una taratura. */
const BERSAGLIO = '[data-prova="griglia:1:gri:coordinate"]'
for (const k of ['facili', 'medie', 'toste', 'sotto']) {
  if (await page.locator(BERSAGLIO).count()) break
  await apriQuadro(k)
  for (const riga of await page.locator(`[data-manopola] [data-apri="${k}"] .voce-riga.apribile:not(.aperta)`).all()) {
    if (await page.locator(BERSAGLIO).count()) break
    await riga.click()
    await page.waitForTimeout(60)
  }
}
controlla('la classe della griglia si trova nel quadro',
          await page.locator(BERSAGLIO).count() === 1)
await page.click(BERSAGLIO)
await page.waitForSelector('.qz-guarda', { timeout: 5000 })
controlla('il disegno della domanda si può toccare', await page.locator('.qz-guarda').count() === 1)

const piccolo = (await page.locator('.qz-telo-grande').boundingBox()).width
await attendi(page, 400)              // la finestra cieca vale anche per la lente
await page.click('.qz-guarda')
await page.waitForSelector('.qz-zoom', { timeout: 2000 })
await attendi(page, 200)              // la dissolvenza, per non fotografarla a metà
const grande = (await page.locator('.qz-telo-zoom').boundingBox()).width
nota(`il disegno passa da ${Math.round(piccolo)} px a ${Math.round(grande)}`)
controlla('toccandolo si guarda molto più grande', grande > piccolo * 1.8,
          `${Math.round(piccolo)} px → ${Math.round(grande)} px`)
/* un canvas ridipinto a misura sbagliata resta sgranato: qui si
   controlla che i pixel veri siano quelli della lente, non quelli del
   riquadro piccolo stirati */
const pixel = await page.evaluate(() => {
  const c = document.querySelector('.qz-telo-zoom')
  return c ? c.width / (window.devicePixelRatio || 1) : 0
})
controlla('ed è ridipinto, non stirato', Math.abs(pixel - grande) < 2,
          `${Math.round(pixel)} px dipinti su ${Math.round(grande)} di riquadro`)
/* ── e la lente COPRE quello che c'era sotto ──
   La misura del disegno non basta: quello che si rompe da solo è il
   **posto**. `.qz-zoom` è `position: fixed`, e dove si ferma non lo
   decide lei — lo decide il primo antenato che si sia dichiarato
   riferimento (una `transform`, un `filter`, il `backdrop-filter` del
   velo). Basta che un gioco ne aggiunga uno, o ne tolga uno, perché la
   lente si apra dentro un francobollo e quello che stava sotto — nel
   Dungeon un mostro grande mezzo schermo — resti a vista proprio
   mentre si è chiesto di guardare meglio il disegno.

   Non si guardano i pixel: si chiede al punto. Al centro del velo,
   dove atterrerebbe il dito, ci dev'essere la lente e non la carta
   rimasta dietro. */
const copertura = await page.evaluate(() => {
  const z = document.querySelector('.qz-zoom').getBoundingClientRect()
  const v = document.querySelector('.qz-velo').getBoundingClientRect()
  const chi = document.elementFromPoint(v.x + v.width / 2, v.y + v.height / 2)
  return { larga: z.width >= v.width - 1, alta: z.height >= v.height - 1,
           lente: !!chi && !!chi.closest('.qz-zoom'),
           misure: `lente ${Math.round(z.width)}×${Math.round(z.height)}, `
                 + `velo ${Math.round(v.width)}×${Math.round(v.height)}` }
})
controlla('la lente copre tutto il velo', copertura.larga && copertura.alta,
          copertura.misure)
controlla('e sotto il dito, in mezzo, c\'è lei e non la carta', copertura.lente)
await scatto(page, 'domanda-lente')

await page.click('.qz-zoom')
await page.waitForSelector('.qz-zoom', { state: 'detached', timeout: 2000 })
uguale('e si chiude toccando', await page.locator('.qz-zoom').count(), 0)
/* la lente copre le risposte: chiudendola non se ne deve essere data
   nessuna — è il fantasma del tocco, la stessa storia dei punti 1 e 2 */
uguale('senza rispondere per sbaglio', await risposto(), 0)

/* ---------- 3d. SBAGLIANDO SI LEGGONO TUTTE E DUE LE RIGHE ----------
   Il difetto che questo controlla non si notava giocando, ed è per
   questo che è vissuto per mesi: la scheda mostrava `perche || aiuto`,
   cioè il primo dei due che ci fosse. A schermo compariva sempre
   qualcosa e non c'era nessun errore da nessuna parte — solo che
   l'unica delle due righe che **insegna** era proprio quella che non
   arrivava mai, visto che i moduli scritti bene danno un `perche` a
   ogni risposta falsa.

   Si va a prendere l'arrotondamento apposta: è la classe da cui nasce
   tutto questo (un bambino di terza a cui a scuola non l'avevano
   ancora spiegato), ha un `perche` su ogni falso e un `aiuto` che
   insegna il metodo. La regola pura sta in `unita/spiegazione`; qui si
   guarda che a schermo ci finiscano tutte e due, su due righe che si
   distinguono a occhio.

   Sbagliare apposta non si può — quale sia la giusta si sa solo dopo
   averla toccata — quindi si tocca, e se si è azzeccato si lascia
   arrivare la domanda dopo e si riprova. Con quattro risposte, otto
   tiri tutti azzeccati capitano una volta su sessantacinquemila. */
await page.click('.prova-x')
await page.waitForSelector('.prova-velo', { state: 'hidden', timeout: 5000 })
await page.click('[data-scheda="giochi"]')
await page.waitForSelector('[data-manopola] .quadro', { timeout: 5000 })
const ARROTONDA = '[data-prova="numero:6:num:arrotonda"]'
/* Al profilo di prova (nove anni) l'arrotondamento cade fra le
   **difficili**, che è esattamente il caso da cui nasce questo lavoro:
   una cosa che a scuola non hanno ancora spiegato. Gli altri blocchi si
   guardano lo stesso, per non dover riscrivere il test il giorno che si
   sposta una taratura. */
for (const k of ['toste', 'medie', 'facili', 'sotto']) {
  if (await page.locator(ARROTONDA).count()) break
  await apriQuadro(k)
  for (const riga of await page.locator(`[data-manopola] [data-apri="${k}"] .voce-riga.apribile:not(.aperta)`).all()) {
    if (await page.locator(ARROTONDA).count()) break
    await riga.click()
    await page.waitForTimeout(60)
  }
}
controlla("la classe dell'arrotondamento si trova nel quadro",
          await page.locator(ARROTONDA).count() === 1)
await page.click(ARROTONDA)
await page.waitForSelector('.qz-tasto', { timeout: 5000 })

let sbagliata = false
for (let tiro = 0; tiro < 8 && !sbagliata; tiro++) {
  await attendi(page, 400)                       // la finestra cieca
  await tocca(await page.locator('.qz-tasto').first().boundingBox())
  await attendi(page, 250)
  sbagliata = await page.locator('.qz-tasto.sbagliata').count() > 0
  /* azzeccata: si lascia arrivare la prossima invece di chiederla col
     tasto del piede. Chiedendola si lascerebbe indietro il timer della
     domanda appena risposta, che scatterebbe dopo e ne farebbe passare
     una **mentre la si sta guardando** — un test ballerino che dà la
     colpa al codice sbagliato. */
  if (!sbagliata) await page.waitForFunction(
    () => !document.querySelector('.qz-tasto.giusta, .qz-tasto.sbagliata, .qz-tasto.spenta'),
    null, { timeout: 8000 }).catch(() => {})
}
controlla('in otto tiri una risposta sbagliata capita', sbagliata)
if (sbagliata) {
  const righe = await page.evaluate(() => {
    const e = document.querySelector('.qz-esito')
    if (!e) return null
    const come = e.querySelector('.qz-come')
    /* il perché è il testo **nudo** dell'esito: quello che non sta
       dentro nessuno dei riquadri. Si prendono i soli nodi di testo,
       perché lì dentro ci sono anche «Era questa», il riquadro azzurro
       e — visto che qui si risponde in mezzo secondo — la riga della
       fretta, e sottrarre stringhe da `textContent` le prenderebbe
       tutte. */
    const perche = [...e.childNodes].filter(n => n.nodeType === 3)
      .map(n => n.textContent).join(' ').replace(/\s+/g, ' ').trim()
    return { perche, comeSiFa: (come?.textContent || '').replace(/\s+/g, ' ').trim(),
             staccati: !!come }
  })
  controlla('sbagliando si legge il perché di quella scelta',
            righe && righe.perche.length > 3, righe?.perche)
  controlla('E ANCHE come si fa, che è la riga che insegna',
            righe && righe.comeSiFa.length > 10,
            righe?.comeSiFa || 'non c\'è: l\'insegnamento non arriva a nessuno')
  controlla('e le due cose stanno su due righe diverse, non in un paragrafo solo',
            !!righe?.staccati)
  nota(`perché: «${righe?.perche}»`)
  nota(`come si fa: «${righe?.comeSiFa}»`)
  /* e c'è il tempo di leggerle: l'attesa cresce con le parole da
     leggere, e con due righe passa il pavimento dei quattro secondi.
     Il tetto è dieci: oltre, una pausa smette di sembrare una pausa. */
  const attesaVera = await page.evaluate(() => {
    const i = document.querySelector('.qz-avanti i')
    return i ? parseFloat(getComputedStyle(i).animationDuration) : 0
  })
  controlla("e l'attesa dà il tempo di leggerle tutte e due", attesaVera >= 4,
            `${attesaVera.toFixed(1)} s`)
  controlla('senza diventare un castigo', attesaVera <= 10, `${attesaVera.toFixed(1)} s`)
  nota(`l'attesa dopo lo sbaglio è di ${attesaVera.toFixed(1)} s`)
}
await scatto(page, 'domanda-spiegazione')
await page.click('.prova-x')
await page.waitForSelector('.prova-velo', { state: 'hidden', timeout: 5000 })

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

   Il seme è fissato (`#seme=96`): con quello il primo goblin sta sette
   celle a est della stanza di partenza, in linea retta, e fra i due non
   c'è nessuna porta né niente da raccogliere. Conta perché da
   aa2f628 «Si chiude la stanza, non il battente» una porta non si
   aggira più camminando intorno — tutti i varchi di una stanza sono
   chiusi e portano allo stesso gruppo, quindi o la si apre rispondendo
   alla sua domanda, o di là non si passa. Un seme che mettesse una
   porta sulla strada del test la lascerebbe chiusa per sempre, perché
   qui si cammina e basta. Il seme si legge quando parte la discesa,
   quindi si scrive nell'indirizzo un attimo prima di toccare la tappa. */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carte', { timeout: 5000 })
await semina(page, { coins: 300, settings: { sperimentali: true } })
await page.waitForSelector('.carta.gioco[data-gioco="sotterraneo"]', { timeout: 5000 })
await page.click('.carta.gioco[data-gioco="sotterraneo"]')
await page.waitForSelector('.sot-tappe', { timeout: 5000 })
/* ── prima si sceglie chi scende ──
   Alla prima apertura il sotterraneo mette davanti i quattro eroi
   (`viste/Eroi.vue`), e il velo si mangia il tocco sulla tappa. Il
   velo è arrivato dopo questo test, e per un pomeriggio l'ha lasciato
   rosso senza che nessuno se ne accorgesse: la CI le prove col browser
   non le lancia. */
await page.waitForSelector('.sot-velo .sot-eroe', { timeout: 5000 })
await page.click('.sot-eroe[data-eroe="cavaliere"]')
await page.waitForSelector('.sot-velo', { state: 'hidden', timeout: 5000 })
await page.evaluate(() => { location.hash = 'seme=96' })
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
/* Col seme scelto la strada fino al goblin è vuota — nessuna porta,
   niente da raccogliere — quindi il foglio non dovrebbe mai comparire.
   Il ramo che lo chiude resta come rete di sicurezza: se cambiasse la
   generazione della stanza (o un domani si cambiasse seme) e spuntasse
   comunque un foglio, meglio chiuderlo e proseguire che restare fermi a
   toccare un campo che, foglio aperto, non risponde più ai tocchi — col
   rischio, questo sì noto da aa2f628, che sia proprio una porta e quindi
   non si riesca comunque ad aggirarla. */
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
let diFretta = 0
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
  /* ── e qui si aspetta l'attesa VERA, non un numero ──
     Il tocco arriva mezzo secondo dopo che la domanda è comparsa: è
     esattamente il tiro a caso, quindi quando la risposta è sbagliata
     scatta la penalità di fretta (`nucleo/domanda.js`) e l'attesa si
     allunga di un secondo e mezzo. Con un `attendi(2400)` fisso il
     giro dopo trovava ancora la domanda di prima con una risposta già
     colorata — e il guasto sembrava quello del `v-if` che non rimonta,
     cioè tutt'altra cosa. Si aspetta finché i tasti tornano nudi. */
  if (await page.locator('.qz-fretta').count()) diFretta++
  await page.waitForFunction(
    () => !document.querySelector('.qz-tasto.giusta, .qz-tasto.sbagliata, .qz-tasto.spenta'),
    null, { timeout: 12000 }).catch(() => {})
}
nota(diFretta
  ? `${diFretta} risposta/e su ${risposteDate} sono arrivate prima di poterla leggere, `
    + 'e l\'attesa si è allungata: è la penalità del tiro a caso'
  : 'nessuna risposta di fretta in questo giro (il primo tasto era quello giusto)')
controlla('due domande di fila si sono potute rispondere', risposteDate >= 2,
          `ne ho risposte ${risposteDate}`)
await scatto(page, 'domanda-incatenata')

/* ---------- 5. e stavolta il ripasso se le è segnate ----------
   L'altra metà del controllo di sopra, ed è quella che dice se la
   catena è davvero attaccata: dentro un gioco la chiave del concetto
   deve arrivare in `items`, dove sta la storia delle tabelline e delle
   parole inglesi. Si legge dall'archivio e non dallo schermo perché a
   schermo il ripasso non si vede affatto — sposta la frequenza delle
   domande di domani, non la partita di adesso.

   Nessun gioco chiama `annota`: lo fa `quiz/Domanda.vue`, una volta per
   tutti e cinque. È il motivo per cui questo controllo sta qui e non in
   un test del sotterraneo. */
const segnate = await chiaviDiQuiz()
controlla('rispondere in partita scrive il ripasso', segnate.length > 0,
          `nessuna chiave di quiz in items dopo ${risposteDate} risposte`)
nota(`il ripasso si è segnato: ${segnate.join(', ') || 'niente'}`)

uguale('nessun errore in console', errori.length, 0, errori.join('\n'))
nota('la finestra cieca dura 320 ms: meno di quanto ci mette chiunque a '
   + 'leggere una domanda nuova, più di quanto ce ne mette un fantasma ad arrivare')

await browser.close()
riassunto('la domanda col dito')
