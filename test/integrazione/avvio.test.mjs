/* ═══════════════════════════════════════════════════════════════════
   L'APP SI APRE

   Il test più corto e il più importante: il gioco parte, la home compare,
   nessun errore in console. Nient'altro.

   Esiste perché è già successo di distribuire un `giochi.html` che si
   fermava su "Un attimo…" con un ReferenceError: tutti gli altri test
   guardavano dentro ai giochi, e nessuno guardava la porta d'ingresso.
   Se questo è rosso, gli altri non vanno nemmeno letti.
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, scatto, TELEFONO, TABLET, SCRIVANIA } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()

/* ── 1. parte, e parte in fretta ── */
const inizio = Date.now()
const { page, errori } = await apriGioco(browser, { attesa: null })

let apparsa = true
try {
  await page.waitForSelector('.carte', { timeout: 10000 })
} catch (e) {
  apparsa = false
  const fermo = await page.evaluate(() => document.body.innerText.slice(0, 120).trim())
  controlla('la home compare', false, `è rimasto su "${fermo}"`)
}
const ms = Date.now() - inizio

if (apparsa) {
  controlla('la home compare', true)
  controlla('ci mette meno di 5 secondi', ms < 5000, `ci ha messo ${ms} ms`)
  nota(`aperto in ${ms} ms`)
}

/* ── 2. nessun errore, di nessun tipo ──
   Un ReferenceError qui dentro non blocca il rendering di Vue in modo
   ovvio: si vede solo che manca un pezzo. Perciò si guarda la console. */
uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.slice(0, 5).forEach(e => nota('·', e))

/* ── 3. ci sono tutti i giochi ──
   Non i nomi esatti, che cambiano: che ce ne sia più di uno e che ognuno
   abbia un titolo scritto. Una carta vuota è un componente rotto. */
const carte = await page.$$eval('.carta b', e => e.map(x => x.textContent.trim()))
controlla('ci sono almeno quattro giochi', carte.length >= 4, `ne vedo ${carte.length}`)
controlla('nessun titolo vuoto', carte.every(Boolean), JSON.stringify(carte))
nota('giochi in home:', carte.join(' · '))

/* ── 4. l'archivio funziona ──
   Aperto da file:// deve trovare IndexedDB. Se ripiega sulla memoria in
   un browser vero, monete e progressi si perdono a ogni chiusura. */
const archivio = await page.evaluate(() =>
  document.querySelector('.schermo[data-archivio]')?.dataset.archivio || 'nessuno')
controlla('salva su IndexedDB', archivio === 'IndexedDB', `salva su "${archivio}"`)

/* ── 5. sta dentro lo schermo, su tre misure ──
   La pagina non deve scorrere in orizzontale: su un telefono vuol dire
   che qualcosa sborda e il dito lo trova per sbaglio. */
for (const [nome, viewport] of [['telefono', TELEFONO], ['tablet', TABLET], ['scrivania', SCRIVANIA]]) {
  const { page: p, errori: err } = await apriGioco(browser, { viewport })
  const sborda = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
  controlla(`niente scorrimento laterale su ${nome}`, !sborda)
  uguale(`nessun errore su ${nome}`, err.length, 0)
  await scatto(p, 'avvio-' + nome)
  await p.close()
}

/* ── 6. il primo avvio assoluto ──
   Un telefono che apre i giochi appena installati: archivio vuoto,
   nessun giocatore. Da quando i nomi non stanno più nel codice questo
   non è più un caso di scuola — è quello che vede chiunque scarichi
   l'app — e senza una schermata che chieda il nome resterebbe fuori
   dalla porta. Si scrive il nome, si entra, e da lì è un gioco normale. */
const { page: nuovo, errori: erroriNuovo } =
  await apriGioco(browser, { giocatori: null, attesa: '.benvenuto' })
controlla('a mani vuote chiede come ti chiami', await nuovo.isVisible('.benvenuto'))
controlla('e non mostra la home di nessuno', !(await nuovo.isVisible('.carte')))
uguale('il tasto è spento finché non si scrive niente',
  await nuovo.isDisabled('.via'), true)

await nuovo.fill('.nome', 'Pippo')
await nuovo.click('.via')

/* ── il secondo passo: quanti anni ha ──
   Non è una domanda per il bambino ma per il grande che gli sta
   installando il gioco, ed è quella che prima non si faceva a nessuno:
   il primo profilo nasceva con tutto acceso, divisioni in colonna
   comprese, anche a cinque anni. Si controlla che non si possa saltare —
   la manopola nasce senza valore e il tasto è spento finché non si
   muove — e soprattutto che la scelta MORDA: un'età che non spegne
   niente è indistinguibile da nessuna scelta, e non se ne accorgerebbe
   nessuno fino al primo bambino davanti alla carta sbagliata.

   E che la manopola **dica cosa fa**: il riassunto compare solo dopo
   averla mossa, ed è tutto il motivo per cui ha preso il posto delle
   quattro carte. Un riassunto che non arriva è la manopola muta di
   prima, senza che niente sembri rotto. */
await nuovo.waitForSelector('[data-manopola]', { timeout: 8000 })
controlla('poi chiede quanti anni ha', await nuovo.isVisible('[data-manopola]'))
/* ── SI PARTE DA QUATTRO ANNI ──
   Non da vuoto e non da un valore in mezzo: chi apre questa schermata
   sta quasi sempre aggiungendo il più piccolo di casa. Premere «Si
   gioca!» senza toccare niente sbaglia così **dalla parte giusta** —
   la casa più piccola e la taratura più prudente — mentre un valore in
   mezzo darebbe a un bambino di quattro anni la home di una terza. */
uguale('la manopola nasce sui quattro anni',
  await nuovo.evaluate(() => document.querySelector('[data-eta-ora]').textContent.trim()),
  '4 anni')
controlla('e il quadro di quell\'età si vede già',
  await nuovo.isVisible('[data-manopola] .quadro'))
uguale('più in giù non si va', await nuovo.isDisabled('[data-eta="giu"]'), true)

/* ── IL ▶ DI UN PEZZO DI SCUOLA RESTA NEL SUO FILONE ──
   Un blocco si apre sui pezzi di scuola, un pezzo sulle sue domande, e
   il ▶ del pezzo le scorre **tutte e sole quelle** — il contatore «1 di
   4» è la prova che si sta scorrendo un giro e non pescando a caso.

   Serve un test di browser perché il difetto che ripara non si vedeva
   da nessun'altra parte: `Benvenuto.vue` non inoltrava `giro` a
   `Prova.vue`, e il pannello ripiegava sul modo «pesca come in
   partita». Nessun errore, nessuna riga in console: si partiva da «i
   numeri e le quantità» e la domanda dopo era di logica. Un ripiego che
   funziona è il modo più caro di rompersi. */
for (let i = 0; i < 8; i++) await nuovo.click('[data-eta="su"]')
await nuovo.click('[data-apri="medie"]')
await nuovo.waitForSelector('[data-prova]', { timeout: 5000 })
const pezzo = await nuovo.evaluate(() =>
  document.querySelector('[data-apri="medie"] [data-prova]')?.dataset.prova)
controlla('un blocco di domande si apre sui pezzi di scuola', !!pezzo, String(pezzo))
await nuovo.click(`[data-prova="${pezzo}"]`)
await nuovo.waitForSelector('.prova-palco', { timeout: 5000 })
const conta = await nuovo.evaluate(() =>
  document.querySelector('[data-conta]')?.textContent.trim() || '')
controlla('il ▶ di un pezzo scorre le sue domande, col contatore',
          /^\d+ di \d+$/.test(conta), conta || 'nessun contatore: sta pescando a caso')
/* e scorrendo si resta dentro: il modulo in testa non cambia */
const dove = async () => (await nuovo.evaluate(() =>
  document.querySelector('.prova-testa')?.innerText || '')).split('\n')[1] || ''
const primo = (await dove()).split('·')[0]
await nuovo.click('.prova-altra')
await nuovo.waitForTimeout(300)
uguale('e la domanda dopo è dello stesso filone',
       (await dove()).split('·')[0], primo)
await nuovo.click('.prova-x')
await nuovo.waitForTimeout(200)

/* Si torna a 6,5, cioè «prima o seconda». */
for (let i = 0; i < 3; i++) await nuovo.click('[data-eta="giu"]')
uguale('la manopola dice gli anni a parole',
  await nuovo.evaluate(() => document.querySelector('[data-eta-ora]').textContent.trim()),
  '6 anni e mezzo')
await nuovo.click('.via')
await nuovo.waitForSelector('.carte', { timeout: 8000 })
controlla('scritto il nome si entra nel gioco', await nuovo.isVisible('.carte'))

/* La prova che la fascia ha morso davvero: il castello chiede operazioni
   in colonna e si dichiara `grandi`, quindi a chi entra in prima non deve
   comparire; il gioco per i piccoli sì. Se un giorno le eccezioni non
   arrivassero più al profilo — è successo, ed è invisibile — qui si
   vedrebbero tutte e due le carte. */
const carteNuovo = await nuovo.evaluate(() =>
  [...document.querySelectorAll('.carta.gioco[data-gioco]')].map(c => c.dataset.gioco))
controlla('l\'età scelta spegne i giochi da grandi',
  !carteNuovo.includes('torri'), carteNuovo.join(','))
controlla('e lascia quelli per i piccoli',
  carteNuovo.includes('conta'), carteNuovo.join(','))
controlla('e l\'onboarding non torna più', !(await nuovo.isVisible('.benvenuto')))
controlla('con un giocatore solo non c\'è niente da scegliere',
  !(await nuovo.isVisible('.gioc')))

/* Il nome, non l'id. Chi si iscrive da oggi ha un id opaco (`g1`), e
   dove il gioco lo nomina deve dire come si chiama: fino a ieri id e nome
   erano la stessa stringa, quindi uno scambio non si sarebbe visto né a
   schermo né in un test scritto sui profili di casa. In home il nome non
   c'è più — non serviva a niente e rubava il posto ai giochi — quindi il
   posto dove si controlla è l'albo. */
await nuovo.click('.fascia')
await nuovo.waitForSelector('.testata', { timeout: 8000 })
uguale('nell\'albo si legge il nome, non l\'id',
  await nuovo.evaluate(() => document.querySelector('.chi h2').textContent.trim()), 'Pippo')
await nuovo.click('button[aria-label="indietro"]')
await nuovo.waitForSelector('.carte', { timeout: 8000 })

await nuovo.reload()
await nuovo.waitForSelector('.carte', { timeout: 8000 })
controlla('e riaprendo è ancora suo', !(await nuovo.isVisible('.benvenuto')))
await nuovo.click('.fascia')
await nuovo.waitForSelector('.testata', { timeout: 8000 })
uguale('con il suo nome', await nuovo.evaluate(
  () => document.querySelector('.chi h2').textContent.trim()), 'Pippo')
await nuovo.click('button[aria-label="indietro"]')
await nuovo.waitForSelector('.carte', { timeout: 8000 })
uguale('nessun errore durante il primo avvio', erroriNuovo.length, 0)
await scatto(nuovo, 'primo-avvio')
await nuovo.close()

await page.close()
await browser.close()
riassunto("l'app si apre")
