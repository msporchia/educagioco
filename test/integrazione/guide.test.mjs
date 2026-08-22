/* ═══════════════════════════════════════════════════════════════════
   LE GUIDE E IL `?`

   Due strade diverse per lo stesso materiale, e quello che conta è che
   siano davvero raggiungibili — una documentazione che c'è ma non si
   trova è la ragione per cui questa roba è stata scritta.

   La cosa da non rompere mai: **«Come funziona» sta fuori dal codice di
   casa**. Le prime guide dicono cos'è questo gioco e come si installa, e
   le legge un genitore che ha appena ricevuto il link da un altro
   genitore: se un giorno finissero dietro il tastierino, le leggerebbe
   solo chi non ne ha bisogno.

   E dal **primo avvio** — dove non c'è nessuna schermata in cui andare,
   perché senza un profilo il benvenuto è montato al posto di tutto — le
   stesse guide si aprono in un velo (punto 11).
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, scatto } from '../aiuto/browser.mjs'
import { GUIDE, AIUTI } from '../../src/guide/contenuti.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* ── 1. dalla home, senza codice ── */
controlla('in home c\'è la porta delle guide', await page.isVisible('[data-azione="guide"]'))
await page.click('[data-azione="guide"]')
await page.waitForTimeout(250)

controlla('non chiede nessun codice', !(await page.isVisible('.tastierino')))
const elenco = await page.evaluate(() =>
  [...document.querySelectorAll('[data-guida]')].map(b => b.dataset.guida))
uguale('ci sono tutte le guide', elenco.length, GUIDE.length, elenco.join(','))
controlla('e la prima dice cos\'è il gioco', elenco[0] === 'cose', elenco[0])
await scatto(page, 'guide-elenco')

/* ── 2. l'indirizzo da passare è quello pubblico, non quello di casa ──
   Sta nell'elenco e non dentro una guida: chi passa il gioco a un'altra
   famiglia lo trova appena entra. */
const link = await page.evaluate(() =>
  document.querySelector('[data-azione="manda-link"]')?.innerText || '')
controlla('c\'è il tasto per passare il gioco', !!link)
controlla('e mostra un indirizzo vero, non quello da cui gira',
  link.includes('educagioco'), link.replace(/\n/g, ' '))

/* ── 3. una guida si apre e ha davvero qualcosa dentro ── */
await page.click('[data-guida="installare"]')
await page.waitForTimeout(200)
const dentro = await page.evaluate(() => document.body.innerText)
controlla('la guida dell\'installazione parla di schermata iniziale',
  /schermata (iniziale|Home)/i.test(dentro))
/* I passi veri dipendono da che telefono si ha in mano — Android, iPhone,
   computer — e qui si gira su un computer: quello che si controlla è che
   *qualcosa* di adatto sia comparso, non i passi di una piattaforma che
   il banco di prova non ha. */
controlla('e dice cosa fare, per il posto in cui gira',
  await page.isVisible('.blocco li'))

/* ── 3a. i tre modi di installare ci sono tutti ──
   Qui si gira su un computer, ed è il caso che ha fatto nascere questa
   prova: i passi di Android e iPhone erano dichiarati con `se`, che
   nasconde, quindi chi leggeva dal computer vedeva solo i passi del
   computer — gli unici che non gli servono, visto che al computer ci si
   siede per installarlo sul telefono di un figlio. */
const modi = await page.evaluate(() =>
  [...document.querySelectorAll('[data-apri]')].map(b => b.textContent.trim()))
controlla('dal computer ci sono anche gli altri due telefoni, ripiegati',
  modi.some(t => /iPhone/.test(t)) && modi.some(t => /Android/.test(t)), modi.join(' | '))
controlla('e i passi di quel telefono restano chiusi finché non si aprono',
  !dentro.includes('Aggiungi a Home'))
await page.click('[data-apri*="iPhone"]')
await page.waitForTimeout(200)
const conIos = await page.evaluate(() => document.body.innerText)
controlla('aperto iPhone, compaiono i passi di Safari',
  conIos.includes('Safari') && conIos.includes('Aggiungi a Home'), conIos.slice(0, 80))
await scatto(page, 'guide')

/* Il grassetto delle guide è `**così**`, e viene tradotto: se un giorno
   arrivasse a schermo com'è scritto, si vedrebbe qui. */
controlla('nessun asterisco a schermo', !dentro.includes('**'))

/* ── 3b. il secondo livello ──
   Le risposte restano corte perché il ragionamento lungo sta ripiegato.
   Il modo di sbagliarlo è uno solo e non lancia niente: la fisarmonica
   che si disegna già aperta (la risposta corta non c'è più) o che non si
   apre affatto (il materiale c'è nel dato e non lo legge nessuno). */
await page.click('button[aria-label="indietro"]')
await page.waitForTimeout(200)
await page.click('[data-guida="cose"]')
await page.waitForTimeout(200)
const chiusa = await page.evaluate(() => {
  const b = document.querySelector('[data-apri]')
  return { c: !!b, testo: document.body.innerText }
})
controlla('una guida ha dei blocchi da aprire', chiusa.c)
controlla('e quello che c\'è dentro non si vede finché non si apre',
  !chiusa.testo.includes('cresciuto guardandoli giocare'))
await page.click('[data-apri]')
await page.waitForTimeout(200)
const aperta = await page.evaluate(() => document.body.innerText)
controlla('aperto, il pezzo lungo compare',
  aperta.includes('cresciuto guardandoli giocare'), aperta.slice(0, 100))
await scatto(page, 'guide-due-livelli')

/* ── 3c. l'elenco dei giochi è quello vero ──
   Lo compone `data/giochi.js`, non una lista scritta a mano: se un
   giorno la componesse male — un nome vuoto, il grassetto non tradotto —
   si vedrebbe solo aprendo questa guida, che è esattamente quello che
   nessuno fa. */
await page.click('button[aria-label="indietro"]')
await page.waitForTimeout(200)
await page.click('[data-guida="giochi-elenco"]')
await page.waitForTimeout(250)
const listaGiochi = await page.evaluate(() => document.body.innerText)
controlla('l\'elenco nomina i giochi veri',
  listaGiochi.includes('La bancarella') && listaGiochi.includes('Il sotterraneo'))
controlla('e nessun asterisco è arrivato a schermo', !listaGiochi.includes('*'),
  (listaGiochi.match(/.{0,30}\*.{0,30}/) || [''])[0])

/* ── 3d. il codice dei genitori si trova dall'elenco ──
   La domanda «come entro nelle impostazioni» è una di quelle che si
   fanno col dito già sullo schermo: deve avere una riga sua fra i
   titoli, e la risposta deve essere la prima cosa che si legge dentro. */
await page.click('button[aria-label="indietro"]')
await page.waitForTimeout(200)
const titoli = await page.evaluate(() =>
  [...document.querySelectorAll('[data-guida] b')].map(b => b.textContent))
controlla('nell\'elenco c\'è una voce sul codice',
  titoli.some(t => /codice/i.test(t)), titoli.join(' | '))
await page.click('[data-guida="codice"]')
await page.waitForTimeout(200)
const suCodice = await page.evaluate(() =>
  document.querySelector('.guida-corpo')?.innerText || '')
controlla('e la prima riga dice 0000',
  suCodice.split('\n')[0].includes('0000'), suCodice.slice(0, 90))
await scatto(page, 'guide-codice')

/* ── 4. si torna indietro in due tempi: all'elenco, poi a casa ── */
await page.click('button[aria-label="indietro"]')
await page.waitForTimeout(200)
controlla('la freccia riporta all\'elenco', await page.isVisible('[data-guida="eta"]'))
await page.click('button[aria-label="indietro"]')
await page.waitForTimeout(250)
controlla('e la seconda volta alla home', await page.isVisible('[data-azione="grandi"]'))

/* ── 5. il `?` dentro un gioco ── */
await page.evaluate(() => { location.hash = '#torri' })
await page.waitForTimeout(400)
controlla('il tower defense ha il suo `?`', await page.isVisible('[data-azione="aiuto"]'))
await page.click('[data-azione="aiuto"]')
await page.waitForTimeout(250)
const foglio = await page.evaluate(() => document.body.innerText)
controlla('si apre il foglio del gioco giusto', foglio.includes(AIUTI.torri.titolo), foglio.slice(0, 80))
controlla('e si chiude da sé', await page.isVisible('[data-azione="chiudi-aiuto"]'))
await scatto(page, 'guide-aiuto')
await page.click('[data-azione="chiudi-aiuto"]')
await page.waitForTimeout(200)
controlla('chiuso il foglio, il gioco è ancora lì',
  !(await page.isVisible('[data-velo="aiuto"]')) && await page.isVisible('[data-azione="aiuto"]'))

/* ── 6. dove non c'è niente da spiegare, niente tasto ──
   Un `?` che apre un foglio vuoto è peggio di nessun `?`: promette una
   spiegazione e non la mantiene. */
await page.evaluate(() => { location.hash = '#albo' })
await page.waitForTimeout(400)
controlla('l\'albo non ha un `?` finto', !(await page.isVisible('[data-azione="aiuto"]')))

/* ── 7. il nastro «installalo», che si vede solo da un telefono ──
   È il pezzo che serve di più a chi riceve il link da un'altra famiglia,
   ed è invisibile al banco di prova finché non gli si dice che è un
   telefono: sul computer non compare apposta. */
const ANDROID = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 '
              + '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
const { page: tel, errori: erroriTel } = await apriGioco(browser, { userAgent: ANDROID })
await azzera(tel)
await tel.waitForTimeout(300)

controlla('dal telefono, chi non l\'ha installato se lo sente dire',
  await tel.isVisible('[data-nastro="installa"]'))
await scatto(tel, 'guide-nastro-home')

/* Il nastro non rimanda all'elenco: porta **dentro** la guida giusta —
   chi ha appena toccato «ti spiego come» ha già detto cosa vuole. */
await tel.click('[data-azione="nastro-installa"]')
await tel.waitForTimeout(300)
const guidaTel = await tel.evaluate(() => document.body.innerText)
controlla('e porta dentro la guida dell\'installazione, non all\'elenco',
  guidaTel.includes('Mettilo sul telefono') && !guidaTel.includes('A cosa servono le monete'))
controlla('coi passi di Android, non quelli di un altro telefono',
  guidaTel.includes('Installa app') && !guidaTel.includes('Safari'), guidaTel.slice(0, 120))
await scatto(tel, 'guide-nastro')

/* ── 8. chi dice no, l'ha detto per sempre ──
   Un consiglio ripetuto a chi l'ha già rifiutato smette di essere un
   consiglio: la scelta sta nell'archivio, fuori dai profili, e deve
   sopravvivere alla ricarica. */
await tel.click('button[aria-label="indietro"]')
await tel.waitForTimeout(200)
await tel.click('button[aria-label="indietro"]')
await tel.waitForSelector('.carte', { timeout: 5000 })
await tel.click('[data-azione="chiudi-nastro"]')
await tel.waitForTimeout(200)
controlla('il ✕ lo manda via subito', !(await tel.isVisible('[data-nastro="installa"]')))
await tel.reload()
await tel.waitForSelector('.carte', { timeout: 10000 })
await tel.waitForTimeout(400)
controlla('e non torna al riavvio', !(await tel.isVisible('[data-nastro="installa"]')))

/* ── 9. il `?` non si apre da solo ──
   Era stato provato il contrario — il foglio che si presenta al primo
   ingresso — e non regge al banco di prova vero: un velo all'apertura i
   bambini lo chiudono per riflesso, senza leggerlo, e intanto imparano
   che i cartelli si mandano via. Questo controllo esiste perché è
   esattamente il genere di cosa che qualcuno rimette «per aiutare». */
const { page: primo, errori: erroriPrimo } = await apriGioco(browser, { spiegazioni: true })
await primo.evaluate(() => { location.hash = '#torri' })
await primo.waitForTimeout(700)
controlla('entrando in un gioco non compare nessun velo',
  !(await primo.isVisible('[data-velo="aiuto"]')))
controlla('ma il `?` c\'è, per chi lo vuole',
  await primo.isVisible('[data-azione="aiuto"]'))

/* ── 10. i primi passi nel tower defense ──
   Le regole lette prima di aver visto il campo si dimenticano in tre
   secondi: quello che manca è la riga che sta lì **mentre** si guarda il
   campo. Dura finché la prima torre non è in piedi, e dice il pezzo che
   dal campo non si vede — che le torri si pagano coi conti. */
const passi = await primo.evaluate(async () => {
  const attesa = ms => new Promise(r => setTimeout(r, ms))
  const T = window.__td
  if (!T) return { errore: 'niente banco' }
  T.inizia(0)
  await attesa(500)
  const prima = document.querySelector('.primi-passi')?.textContent || ''

  /* costruisce la prima torre risolvendo il conto, come farebbe un dito */
  T.hud.energia = 500
  T.scegliTorre('add')
  await attesa(150)
  const op = T.op.value
  const tasti = [...document.querySelectorAll('.tastiera button')]
  for (const p of op.passi) {
    tasti.find(x => +x.textContent === p.atteso)?.click()
    await attesa(60)
  }
  await attesa(400)
  return { prima, dopo: document.querySelector('.primi-passi')?.textContent || '', torri: T.hud.torri }
})

controlla('alla prima partita la riga dice cosa fare',
  /piazzola/i.test(passi.prima || ''), JSON.stringify(passi).slice(0, 120))
uguale('la torre si costruisce', passi.torri, 1)
controlla('e dopo la prima torre la riga cambia, invece di ripetersi',
  !!passi.dopo && passi.dopo !== passi.prima, JSON.stringify(passi).slice(0, 160))

uguale('nessun errore in console al primo ingresso', erroriPrimo.length, 0)
if (erroriPrimo.length) erroriPrimo.forEach(e => nota(e))

uguale('nessun errore in console dal telefono', erroriTel.length, 0)
if (erroriTel.length) erroriTel.forEach(e => nota(e))

/* ── 11. «cos'è questo gioco?» al primo avvio ──
   Il caso vero di chi riceve il link: archivio vuoto, e la prima cosa a
   schermo è una casella che chiede il nome di suo figlio. Da lì si deve
   poter sapere cosa sia questa roba e chi l'abbia scritta **senza
   perdere quello che si è già digitato** — se il velo azzerasse il
   modulo, nessuno lo aprirebbe due volte. */
const { page: nuovo, errori: erroriNuovo } =
  await apriGioco(browser, { giocatori: null, attesa: '.benvenuto' })

controlla('al primo avvio si può chiedere cos\'è',
  await nuovo.isVisible('[data-azione="cos-e"]'))
await scatto(nuovo, 'guide-cos-e')
await nuovo.fill('.nome', 'Prova')
await nuovo.click('[data-azione="cos-e"]')
await nuovo.waitForTimeout(300)
controlla('si apre il foglio delle domande', await nuovo.isVisible('[data-velo="guide"]'))
await scatto(nuovo, 'guide-primo-avvio')

/* Solo le guide `subito`: le altre spiegano manopole che stanno dentro
   le impostazioni di un bambino che non esiste ancora. */
const offerte = await nuovo.evaluate(() =>
  [...document.querySelectorAll('[data-guida-velo]')].map(b => b.dataset.guidaVelo))
controlla('offre le guide che si leggono prima di cominciare',
  offerte.includes('cose') && offerte.includes('chi'), offerte.join(','))
controlla('e non quelle sulle manopole delle impostazioni',
  !offerte.includes('difficolta') && !offerte.includes('monete'), offerte.join(','))

await nuovo.click('[data-guida-velo="chi"]')
await nuovo.waitForTimeout(250)
const firmato = await nuovo.evaluate(() => ({
  testo: document.body.innerText,
  codice: [...document.querySelectorAll('.collega')].map(a => a.href).join(' '),
}))
controlla('dice chi l\'ha fatto', firmato.testo.includes('Marco Sporchia'))
controlla('e porta al codice su GitHub', /github\.com/.test(firmato.codice), firmato.codice)
await scatto(nuovo, 'guide-chi')

await nuovo.click('[data-azione="torna-guide"]')
await nuovo.waitForTimeout(200)
await nuovo.click('[data-azione="chiudi-guide"]')
await nuovo.waitForTimeout(250)
controlla('chiuso il foglio, si è ancora sul primo avvio',
  !(await nuovo.isVisible('[data-velo="guide"]')) && await nuovo.isVisible('.benvenuto'))
uguale('e il nome scritto è ancora lì',
  await nuovo.inputValue('.nome'), 'Prova')

uguale('nessun errore in console al primo avvio', erroriNuovo.length, 0)
if (erroriNuovo.length) erroriNuovo.forEach(e => nota(e))

uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))

await browser.close()
riassunto('le guide e il `?`')
