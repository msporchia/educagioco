/* ═══════════════════════════════════════════════════════════════════
   LE MONETE DI SCORTA (il cheat dell'indirizzo)

   `giochi.html#monete=500` regala monete a chi sta giocando. Quello che
   può andare storto non è il regalare, è tutto quello che c'è intorno:

   · l'indirizzo deve ripulirsi, o un F5 raddoppia il regalo
   · deve funzionare anche scritto a pagina già aperta, dove cambia solo
     il frammento e il browser non ricarica niente
   · chi lo usa chiude spesso la scheda subito dopo, e il salvataggio è
     ritardato di un terzo di secondo: va forzato o le monete svaniscono
   · un valore scritto male non deve rompere niente

   ATTENZIONE a come sono scritti i controlli: il cheat NON è l'unica cosa
   che muove il salvadanaio. Anche i traguardi assegnano monete quando si
   apre il gioco, quindi qui si guardano le differenze e non i totali, e
   dove il rumore è possibile si chiede "almeno tanto" invece di "esatto".
   Un test scritto sui totali passa oggi e diventa bugiardo domani, appena
   qualcuno aggiunge un altro modo di guadagnare.
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, attendi, scatto, GIOCO } from '../aiuto/browser.mjs'
import { uguale, controlla, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

const monete = () => page.evaluate(() =>
  Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1] ?? -1))

/* riapre il gioco per davvero: una goto che cambia solo il frammento è una
   navigazione dentro lo stesso documento e non fa ripartire l'applicazione */
async function riapri(hash = '') {
  await page.goto('about:blank')
  await page.goto(GIOCO + (hash ? '#' + hash : ''))
  await page.waitForSelector('.carte', { timeout: 10000 })
  await attendi(page, 300)
}

/* Un giro a vuoto prima di cominciare: alla primissima apertura i
   traguardi già meritati vengono registrati e pagati tutti insieme.
   Passata quella, il salvadanaio si muove solo per quello che facciamo noi. */
await riapri()
await riapri()
const partenza = await monete()
nota('si parte da', partenza, '🪙')

/* ── 1. il regalo arriva ── */
await riapri('monete=500')
const dopoRegalo = await monete()
controlla('#monete=500 dà almeno 500 monete', dopoRegalo - partenza >= 500,
          `ne ha date ${dopoRegalo - partenza}`)
await scatto(page, 'monete-regalo')

/* ── 2. l'indirizzo si ripulisce e un aggiornamento non raddoppia ──
   È il controllo più importante del file: senza, chi tiene la pagina
   aperta con l'indirizzo dentro diventa milionario premendo F5. */
uguale("l'indirizzo si ripulisce", await page.evaluate(() => location.hash), '')
await page.reload(); await page.waitForSelector('.carte'); await attendi(page, 300)
const dopoF5 = await monete()
controlla('un aggiornamento non ridà il regalo', dopoF5 - dopoRegalo < 500,
          `l'aggiornamento ha aggiunto ${dopoF5 - dopoRegalo}`)

/* ── 3. funziona a pagina già aperta ──
   È il modo in cui lo userà davvero un grande: gioco aperto, si scrive in
   fondo all'indirizzo e si preme invio. Qui non ricarica niente, quindi
   nessun traguardo può intromettersi: la differenza dev'essere esatta. */
await page.evaluate(() => { location.hash = 'monete=250' })
await attendi(page, 600)
uguale('scritto a pagina aperta dà esattamente 250', await monete() - dopoF5, 250)
const dopoLive = await monete()

/* ── 4. sopravvive alla chiusura immediata ──
   Si riscuote e si lascia la pagina senza aspettare: il salvataggio
   ordinario parte dopo 350 ms e non farebbe in tempo ad arrivare. */
await page.goto('about:blank')
await page.goto(GIOCO + '#monete=1000')
await page.waitForSelector('.carte', { timeout: 10000 })
await page.goto('about:blank')            // via subito, nessuna attesa
await riapri()
const dopoFuga = await monete()
controlla('le monete non si perdono chiudendo subito', dopoFuga - dopoLive >= 1000,
          `ne sono rimaste ${dopoFuga - dopoLive} su 1000`)

/* ── 5. si possono togliere, ma il salvadanaio non va in rosso ── */
await riapri('monete=-99999')
const dopoTolte = await monete()
controlla('togliendo troppo non si va sotto zero', dopoTolte >= 0, `ho ${dopoTolte}`)
controlla('e le monete se ne vanno per davvero', dopoTolte < dopoFuga,
          `da ${dopoFuga} a ${dopoTolte}`)

/* ── 6. spazzatura nell'indirizzo ── */
for (const brutto of ['monete=pippo', 'monete=', 'monete', 'ciao', 'monete=1e9']) {
  const prima = await monete()
  await riapri(brutto)
  const dopo = await monete()
  controlla(`"#${brutto}" non regala niente`, dopo - prima <= 0,
            `ha aggiunto ${dopo - prima}`)
}
const primaDei42 = await monete()
await riapri('monete=42')
controlla('dopo la spazzatura il cheat funziona ancora', await monete() - primaDei42 >= 42)

uguale('nessun errore in console', errori.length, 0)
errori.slice(0, 4).forEach(e => nota('·', e))

await page.close()
await browser.close()
riassunto('le monete di scorta')
