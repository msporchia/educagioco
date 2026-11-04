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

/* ── il secondo passo: mese e anno di nascita ──
   Non è una domanda per il bambino ma per il grande che gli sta
   installando il gioco, e non si salta: l'età esce da lì. Si controlla
   che la scelta MORDA: un'età che non spegne niente è indistinguibile da
   nessuna scelta, e non se ne accorgerebbe nessuno fino al primo bambino
   davanti alla carta sbagliata. */
await nuovo.waitForSelector('[data-nascita-domanda]', { timeout: 8000 })
uguale('il modulo non mostra più la manopola', await nuovo.locator('[data-manopola]').count(), 0)
uguale('senza la data non si entra', await nuovo.isDisabled('[data-azione="si-gioca"]'), true)

const adesso = new Date()
/* una data che deve ancora arrivare non fa partire nessuno, e lo dice */
if (adesso.getMonth() < 11) {
  await nuovo.selectOption('[data-nascita-mese]', '11')
  await nuovo.selectOption('[data-nascita-anno]', String(adesso.getFullYear()))
  await nuovo.waitForSelector('[data-nascita-futura]', { timeout: 3000 })
  uguale('una data nel futuro non vale', await nuovo.isDisabled('[data-azione="si-gioca"]'), true)
}
/* sei anni di classe: si passa a settembre, quindi conta l'anno scolastico */
const annoScolastico = adesso.getMonth() >= 8 ? adesso.getFullYear() : adesso.getFullYear() - 1
await nuovo.selectOption('[data-nascita-mese]', String(adesso.getMonth()))
await nuovo.selectOption('[data-nascita-anno]', String(annoScolastico - 6))
await nuovo.waitForSelector('[data-nascita-eta]', { timeout: 3000 })
controlla('con la data dice in che classe è', /prima elementare/.test(await nuovo.locator('[data-nascita-eta]').innerText()))
await scatto(nuovo, 'benvenuto-data')
await nuovo.click('[data-azione="si-gioca"]')
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
controlla('e lo spagnolo c\'è, come gli altri',
  carteNuovo.includes('spagnolo'), carteNuovo.join(','))
controlla('e l\'onboarding non torna più', !(await nuovo.isVisible('.benvenuto')))

/* Il nome, non l'id. Chi si iscrive da oggi ha un id opaco (`g1`), e
   dove il gioco lo nomina deve dire come si chiama: fino a ieri id e nome
   erano la stessa stringa, quindi uno scambio non si sarebbe visto né a
   schermo né in un test scritto sui profili di casa. Si legge nella riga
   in cima alla home e nel profilo che apre. */
uguale('in cima alla home si legge il nome, non l\'id',
  await nuovo.evaluate(() => document.querySelector('.fascia [data-nome]').textContent.trim()), 'Pippo')
await nuovo.click('.fascia')
await nuovo.waitForSelector('[data-profilo]', { timeout: 8000 })
uguale('e nel profilo pure', await nuovo.evaluate(() => document.querySelector('[data-profilo] .nome').textContent.trim()), 'Pippo')
uguale('con un giocatore solo non c\'è nessun altro da scegliere', await nuovo.locator('[data-giocatore]').count(), 0)
await nuovo.click('button[aria-label="indietro"]')
await nuovo.waitForSelector('.carte', { timeout: 8000 })

await nuovo.reload()
await nuovo.waitForSelector('.carte', { timeout: 8000 })
controlla('e riaprendo è ancora suo', !(await nuovo.isVisible('.benvenuto')))
await nuovo.click('.fascia')
await nuovo.waitForSelector('[data-profilo]', { timeout: 8000 })
uguale('con il suo nome', await nuovo.evaluate(
  () => document.querySelector('[data-profilo] .nome').textContent.trim()), 'Pippo')
await nuovo.click('button[aria-label="indietro"]')
await nuovo.waitForSelector('.carte', { timeout: 8000 })
uguale('nessun errore durante il primo avvio', erroriNuovo.length, 0)
await scatto(nuovo, 'primo-avvio')
await nuovo.close()

await page.close()
await browser.close()
riassunto("l'app si apre")
