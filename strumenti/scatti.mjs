/* ═══════════════════════════════════════════════════════════════════
   LE FOTO PER LA DOCUMENTAZIONE

     npm run scatti          tutte
     npm run scatti dungeon  solo quelle che contengono "dungeon"

   Escono in `docs/img/`, che è versionata: sono le immagini del README e
   delle pagine dei singoli giochi, quindi devono stare nel repo.

   Non c'entrano niente con gli scatti dei test (`test/scatti/`, che git
   ignora): quelli servono a guardare un difetto, questi a far vedere il
   gioco a chi non ce l'ha davanti. Per questo qui il profilo è **finto e
   pieno**: monete, tutte le tappe aperte, un animale adottato. Un gioco
   fotografato appena installato è tutto grigio e non dice niente.

   Ogni foto è una ricetta: dove entrare, cosa aspettare, dove cliccare
   prima di scattare. Se un passo non riesce si scatta lo stesso e si
   segnala — meglio una foto storta che una serie interrotta a metà.
   ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright'
import { existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

/* Il motore della fattoria gira anche qui: è l'unico modo di fotografare
   una fattoria *giocata* senza scrivere a mano un salvataggio, che si
   scosterebbe dal formato vero al primo cambio di campo. */
import { Fattoria } from '../src/giochi/fattoria/motore/fattoria.js'
import { PRIMA, CELLE } from '../src/giochi/fattoria/dati/mondo.js'
import { PER_COLTURA, PER_RICETTA, MINUTO } from '../src/giochi/fattoria/dati/coltivazioni.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const GIOCO = 'file://' + resolve(RADICE, 'dist/index.html')
const FUORI = resolve(RADICE, 'docs/img')
const TELEFONO = { width: 390, height: 844 }
const ADESSO = Date.now()

/* Un profilo che ha giocato: serve a far vedere i giochi come sono
   davvero, non come appaiono il primo giorno. `tuttoAperto` toglie i
   lucchetti, così si possono fotografare anche le tappe in fondo. */
const PROFILO = {
  coins: 340,
  /* `sperimentali` acceso: i giochi ancora in prova hanno una pagina nel
     README come gli altri, e senza il cancello aperto uscirebbe uno
     scatto della home invece del gioco. */
  settings: { tables: [2, 3, 4, 5], sound: true, music: true,
              giochi: {}, sa: {}, tuttoAperto: true, sperimentali: true },
  totals: { math: 260, mente: 90, en: 140, verbi: 40, frasi: 25, es: 60,
            td: 45, pasti: 18, partiteMath: 22, torri: 30, perfette: 7,
            ondate: 40, misure: 30, pozioni: 12, clienti: 26, mercati: 4,
            missioni: 9, stelle: 14, ordini: 60, capsule: 5, monete: 900 },
  best: { math: 24, serieMath: 15, onda: 12, serieGiorni: 6, pozioni: 9, clienti: 11 },
  td: { tappa: 6, libera: true, v: 2 },
  mate: { tappa: 5, libera: true },
  calc: { tappa: 4, libera: false },
  eng: { tappa: 6, libera: false },
  esp: { tappa: 4, libera: false },
  mercato: { tappa: 3, libera: false },
  lab: { tappa: 5, libera: false },
  gen: { tappa: 8, libera: false, ordini: {}, stelle: {} },
  giorni: { ultimo: '', serie: 4, record: 9, totali: 30 },
  /* Un animale adottato e **vestito**: la cameretta fotografata vuota non
     racconta a cosa servono le monete, ed è quello il suo mestiere. Gli
     accessori sono quattro perché i posti addosso sono quattro. */
  accessori: ['🧢', '🕶️', '🧣', '🎒'],
  /* Quattro amici di quattro specie diverse: la cameretta fotografata con
     un cane solo non racconta né i quattro posti né che ognuno mangia le
     sue cose, che sono le due cose da guardare.

     `t` è quando ogni bisogno è stato soddisfatto l'ultima volta: senza,
     le barre risultano scariche da sempre e si fotografa un animale
     trascurato. Qui è adesso, così si vedono animali accuditi. */
  pets: {
    watson: { adottato: 1, nome: 'Watson', pasti: 24,
              addosso: { testa: '🧢', occhi: '🕶️', collo: '🧣', schiena: '🎒' },
              val: { fame: 82, gioco: 74, pulizia: 90, forma: 95 },
              t: { fame: ADESSO, gioco: ADESSO, pulizia: ADESSO, forma: ADESSO } },
    luna:   { adottato: 1, nome: 'Luna', pasti: 12, addosso: {},
              val: { fame: 88, gioco: 80, pulizia: 92, forma: 96 },
              t: { fame: ADESSO, gioco: ADESSO, pulizia: ADESSO, forma: ADESSO } },
    kiwi:   { adottato: 1, nome: 'Kiwi', pasti: 9, addosso: {},
              val: { fame: 76, gioco: 88, pulizia: 94, forma: 90 },
              t: { fame: ADESSO, gioco: ADESSO, pulizia: ADESSO, forma: ADESSO } },
    brace:  { adottato: 1, nome: 'Brace', pasti: 6, addosso: {},
              val: { fame: 84, gioco: 79, pulizia: 88, forma: 93 },
              t: { fame: ADESSO, gioco: ADESSO, pulizia: ADESSO, forma: ADESSO } },
  },
  casa: ['watson', 'luna', 'kiwi', 'brace'],
  /* Una fattoria già cominciata. Non si scrive a mano: la si **gioca** col
     motore vero, qui in Node, e si fotografa quello che ne esce. Una
     fattoria appena nata è un prato vuoto — è deciso così, la prima
     panchina vale perché è costata — e fotografata racconterebbe che qui
     non c'è niente da fare. */
  campagne: undefined,          // riscritto qui sotto, dopo il motore
}

/* ── la fattoria da fotografare ──
   Un campo di grano pronto, uno a metà crescita, il mulino al lavoro, un
   pollaio contento e qualche cosa attorno: sono le quattro cose che la
   fattoria ha da mostrare, e nessuna si vede in un prato appena aperto. Le celle sono dentro la terra
   di partenza (`PRIMA`…`ULTIMA` di `dati/mondo.js`), dove il bosco non
   nasce mai — quindi è sempre libera. */
function fattoriaGiocata() {
  const f = new Fattoria()
  /* Cinque celle dentro l'angolo della terra di partenza: la telecamera si
     centra sul mezzo delle terre, e partendo dall'angolo il campo di grano
     — la cosa da guardare — finiva tagliato dal bordo sinistro. */
  const c = PRIMA * CELLE + 5
  f.posa('casetta', c + 8, c + 1)
  f.posa('staccio', c + 8, c + 4)
  f.posa('staccio', c + 10, c + 4)
  f.posa('panchina', c + 1, c + 9)
  f.posa('fiori1', c, c + 8)

  const campoPronto = f.posa('orto', c, c + 1).cosa
  const campoAMeta = f.posa('orto', c + 3, c + 1).cosa
  const mulino = f.posa('mulino', c + 1, c + 5).cosa
  f.posa('silo', c + 10, c + 7)
  const pollaio = f.posa('pollaio', c + 5, c + 5).cosa

  const grano = PER_COLTURA.grano
  f.seminaCampo(campoPronto, 'grano', ADESSO - (grano.minuti + 1) * MINUTO)
  f.seminaCampo(campoAMeta, 'mais', ADESSO - 4 * MINUTO)
  f.metti('grano', 9)
  f.avvia(mulino, 'mangime', ADESSO - MINUTO)
  /* Il pollaio a metà lavoro: è lo stato «contento», col cuore, ed è il
     modo di far vedere in una foto sola che un recinto **si legge da
     lontano** senza aprire niente. */
  f.avvia(pollaio, 'uova', ADESSO - PER_RICETTA.uova.minuti * 0.5 * MINUTO)

  f.compraBestia('cane-bobtail', 0, 'Watson', { x: c + 5, y: c + 8 })
  return f.serializza()
}

PROFILO.campagne = {
  dungeon: { tappa: 7, libera: true, stelle: {}, cfg: {} },
  survivors: { tappa: 6, libera: true, stelle: {}, cfg: {} },
  'codice-segreto': { tappa: 5, libera: true, stelle: {}, cfg: {} },
  corsa: { tappa: 5, libera: false, stelle: {}, cfg: {} },
  fattoria: { tappa: 0, libera: false, stelle: {}, cfg: { stato: fattoriaGiocata() } },
}

/* ── giocare un pezzo di castello ──
   `window.__td` è la porta che il gioco apre per le prove: da lì si sceglie
   una torre, si leggono le cifre attese dell'operazione in colonna e si
   premono i tasti. Serve perché la torre si paga col conto: senza risolverlo
   non si costruisce niente, e il campo resta un prato. */
async function scegliTorre (page) {
  await page.evaluate(async () => {
    const T = window.__td
    T.inizia(0)
    await new Promise(r => setTimeout(r, 1200))
    T.scegliTorre('add')
  })
  await page.waitForTimeout(700)
}

async function costruisciEChiama (page) {
  await page.evaluate(async () => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td
    T.inizia(0)
    await attesa(1200)
    for (let i = 0; i < 3; i++) {
      T.scegliTorre('add')
      await attesa(120)
      if (!T.op.value) break                 // finita l'energia: va bene lo stesso
      const tasti = [...document.querySelectorAll('.tastiera button')]
      T.op.value.passi.forEach(p => tasti.find(x => +x.textContent === p.atteso)?.click())
      await attesa(250)
    }
    T.chiamaOnda()
    await attesa(2600)                       // i mostri entrano in campo e camminano
  })
  await page.waitForTimeout(500)
}

/* le quattro cifre del codice, che di partenza è 0000 */
const PIN = [['.tasto >> text="0"', 120], ['.tasto >> text="0"', 120],
             ['.tasto >> text="0"', 120], ['.tasto >> text="0"', 900]]

/* le ricette. `dove` è il frammento dell'indirizzo, `passi` quello che
   si fa prima di scattare. Un passo è [selettore, attesa dopo]. */
const RICETTE = [
  { file: 'home', dove: '', attesa: '.carte' },

  { file: 'asteroidi-mappa', dove: 'mate', attesa: '.scaletta' },
  { file: 'asteroidi-gioco', dove: 'mate', attesa: '.scaletta',
    passi: [['.pianeta:not(.chiuso)', 7500]] },
  /* la fila è una sola: la seconda foto è la stessa mappa più in basso,
     dove si vede che pianeti e stazioni si alternano */
  { file: 'asteroidi-stazioni', dove: 'mate', attesa: '.scaletta',
    passi: [['.stazione:not(.chiuso)', 7500]] },

  { file: 'inglese-mappa', dove: 'inglese', attesa: '.mappa' },
  { file: 'inglese-gioco', dove: 'inglese', attesa: '.mappa',
    passi: [['.tappa:not(.chiusa)', 1600]] },
  { file: 'spagnolo-gioco', dove: 'spagnolo', attesa: '.mappa',
    passi: [['.tappa:not(.chiusa)', 1600]] },

  { file: 'castello-mappa', dove: 'torri', attesa: '.tappe' },
  /* Il castello va giocato per davvero prima di fotografarlo: appena
     entrati il prato è vuoto, e un tower defense senza torri né mostri non
     fa capire niente. Si passa da `window.__td`, la stessa porta che usano
     le prove, per costruire tre torri e chiamare l'ondata. */
  { file: 'castello-gioco', dove: 'torri', attesa: '.tappe',
    passi: [['.tap:not(.chiusa)', 1500], costruisciEChiama] },
  /* la schermata che si vede a ogni torre: il conto da fare per pagarla */
  { file: 'castello-calcolo', dove: 'torri', attesa: '.tappe',
    passi: [['.tap:not(.chiusa)', 1500], scegliTorre] },

  { file: 'pozioni-mappa', dove: 'pozioni', attesa: '.tappe, .mappa' },
  { file: 'pozioni-gioco', dove: 'pozioni', attesa: '.tappe, .mappa',
    passi: [['.tappa:not(.chiusa)', 1600]] },

  { file: 'bancarella-mappa', dove: 'bancarella', attesa: '.giornata, .tappe, .mappa' },
  { file: 'bancarella-gioco', dove: 'bancarella', attesa: '.giornata, .tappe, .mappa',
    passi: [['.tappa:not(.chiusa), .giornata', 1800]] },

  { file: 'dungeon-mappa', dove: 'dungeon', attesa: '.dng-tappe' },
  { file: 'dungeon-gioco', dove: 'dungeon', attesa: '.dng-tappe',
    passi: [['.dng-tappa.dng-adesso, .dng-tappa', 2000]] },

  { file: 'survivors-mappa', dove: 'survivors', attesa: '.sv-mappa' },
  { file: 'survivors-gioco', dove: 'survivors', attesa: '.sv-mappa',
    passi: [['.sv-tappa.sv-adesso, .sv-tappa', 2200]] },

  { file: 'sotterraneo-mappa', dove: 'sotterraneo', attesa: '.sot-tappe' },
  /* il campo dopo un paio di secondi: appena entrati la luce è ancora
     tutta addosso all'eroe, e lo scatto racconterebbe una stanza sola */
  { file: 'sotterraneo-gioco', dove: 'sotterraneo', attesa: '.sot-tappe',
    passi: [['.sot-tappa:not([disabled])', 2200]] },

  { file: 'corsa-mappa', dove: 'corsa', attesa: '.co-mappa' },
  /* La corsa si fotografa **dopo qualche secondo**: al primo istante i
     cancelli sono ancora un puntino all'orizzonte, e lo scatto
     racconterebbe una strada vuota invece della scelta fra tre numeri,
     che è il gioco. */
  { file: 'corsa-gioco', dove: 'corsa', attesa: '.co-mappa',
    passi: [['.co-tappa.co-adesso, .co-tappa', 4200]] },

  { file: 'codice-mappa', dove: 'codice', attesa: '.tappe, .mappa, .cs-tappe' },
  { file: 'codice-gioco', dove: 'codice', attesa: '.tappe, .mappa, .cs-tappe',
    passi: [['.tappa:not(.chiusa), .cs-tappa', 3000]] },

  { file: 'generale-mappa', dove: 'generale', attesa: '.scelta-avv' },
  /* il Generale ha tre porte prima del gioco vero: scegli l'avventura,
     apri il capitolo, premi «gioca». Fermarsi alla prima fotografa un
     menù, che è la cosa meno interessante che ha da mostrare. */
  { file: 'generale-gioco', dove: 'generale', attesa: '.scelta-avv',
    passi: [['.avventura', 1200], ['.capitolo', 900], ['.gioca', 2200], ['button:has-text("✕")', 900]] },

  /* La fattoria si fotografa **giocata** (vedi `fattoriaGiocata()`): un
     campo di grano pronto col cestino sopra, uno che cresce, il mulino al
     lavoro. Appena aperta è un prato vuoto, e lo è per scelta. */
  { file: 'fattoria-gioco', dove: 'fattoria', attesa: '.fa-tela',
    passi: [['.fa-tela', 1500]] },

  { file: 'cameretta', dove: 'cameretta', attesa: '.stanza, .posto, .porta' },
  /* l'animale con addosso quello che è uscito dalle capsule: è la risposta
     alla domanda «a cosa servono le monete» */
  { file: 'cameretta-animale', dove: 'cameretta', attesa: '.stanza, .posto',
    passi: [['.posto:not(.libero)', 1200]] },
  { file: 'albo', dove: 'albo', attesa: '.testata' },
  { file: 'genitori', dove: 'genitori', attesa: '.tastierino', passi: [...PIN] },
  { file: 'genitori-giochi', dove: 'genitori', attesa: '.tastierino',
    passi: [...PIN, ['.schede button[data-scheda="sa"]', 800]] },
  /* Il tasto ▶ accanto a ogni voce: si vede una domanda vera di quella
     tipologia prima di decidere se spegnerla. Raccontarlo a parole non
     rende: si fotografa il tasto, e poi la domanda che ne esce. */
  { file: 'domanda-prova', dove: 'genitori', attesa: '.tastierino',
    passi: [...PIN, ['.schede button[data-scheda="sa"]', 700],
            ['button[data-prova]', 1400]] },
]

const filtro = process.argv.slice(2).filter(a => !a.startsWith('-'))
const scelte = filtro.length
  ? RICETTE.filter(r => filtro.some(f => r.file.includes(f)))
  : RICETTE

if (!existsSync(resolve(RADICE, 'dist/index.html'))) {
  console.error('manca dist/index.html — lancia prima `npm run build`')
  process.exit(1)
}
mkdirSync(FUORI, { recursive: true })

function trovaChrome () {
  if (process.env.CHROME) return process.env.CHROME
  for (const p of ['/usr/bin/google-chrome', '/usr/bin/chromium',
                   '/usr/bin/chromium-browser', '/opt/pw-browsers/chromium'])
    if (existsSync(p)) return p
  return undefined
}

const exe = trovaChrome()
const browser = await chromium.launch(exe ? { executablePath: exe } : {})
let storte = 0

for (const r of scelte) {
  const page = await browser.newPage({ viewport: TELEFONO, deviceScaleFactor: 2, hasTouch: true })
  /* il roster va scritto prima che parta l'app, come nei test: senza,
     si apre l'onboarding e si fotografa quello dieci volte */
  await page.addInitScript(p => {
    try {
      localStorage.setItem('giocatori', JSON.stringify([{ id: 'g1', nome: 'Anna' }]))
      localStorage.setItem('ultimo-giocatore', JSON.stringify('g1'))
      localStorage.setItem('profilo:g1', JSON.stringify(p))
    } catch (e) { /* lo dirà lo scatto */ }
  }, PROFILO)

  let nota = ''
  try {
    await page.goto(GIOCO + (r.dove ? '#' + r.dove : ''))
    await page.waitForSelector(r.attesa, { timeout: 12000 })
    for (const passo of r.passi || []) {
      try {
        if (typeof passo === 'function') await passo(page)
        else {
          const [sel, attesa] = passo
          await page.click(sel, { timeout: 6000 })
          await page.waitForTimeout(attesa)
        }
      } catch (e) { nota = '(un passo non è riuscito)'; storte++ }
    }
    await page.waitForTimeout(400)          // le animazioni si posano
  } catch (e) {
    nota = '(' + String(e.message).split('\n')[0].slice(0, 50) + ')'
    storte++
  }
  await page.screenshot({ path: resolve(FUORI, r.file + '.png') })
  console.log(`  ${r.file.padEnd(24)} ${nota}`)
  await page.close()
}

await browser.close()
console.log(`\n${scelte.length} foto in docs/img/${storte ? `, ${storte} con qualche intoppo` : ''}`)
