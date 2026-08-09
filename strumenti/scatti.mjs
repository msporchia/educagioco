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

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const GIOCO = 'file://' + resolve(RADICE, 'dist/index.html')
const FUORI = resolve(RADICE, 'docs/img')
const TELEFONO = { width: 390, height: 844 }

/* Un profilo che ha giocato: serve a far vedere i giochi come sono
   davvero, non come appaiono il primo giorno. `tuttoAperto` toglie i
   lucchetti, così si possono fotografare anche le tappe in fondo. */
const PROFILO = {
  coins: 340,
  settings: { tables: [2, 3, 4, 5], sound: true, music: true,
              giochi: {}, sa: {}, tuttoAperto: true },
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
  campagne: {
    dungeon: { tappa: 7, libera: true, stelle: {}, cfg: {} },
    survivors: { tappa: 6, libera: true, stelle: {}, cfg: {} },
    'codice-segreto': { tappa: 5, libera: true, stelle: {}, cfg: {} },
  },
  giorni: { ultimo: '', serie: 4, record: 9, totali: 30 },
}

/* le ricette. `dove` è il frammento dell'indirizzo, `passi` quello che
   si fa prima di scattare. Un passo è [selettore, attesa dopo]. */
const RICETTE = [
  { file: 'home', dove: '', attesa: '.carte' },

  { file: 'asteroidi-mappa', dove: 'mate', attesa: '.pianeti' },
  { file: 'asteroidi-gioco', dove: 'mate', attesa: '.pianeti',
    passi: [['.pianeta:not(.chiuso)', 7500]] },
  { file: 'asteroidi-stazioni', dove: 'mate', attesa: '.schede',
    passi: [['.schede button:nth-child(2)', 800]] },

  { file: 'inglese-mappa', dove: 'inglese', attesa: '.mappa' },
  { file: 'inglese-gioco', dove: 'inglese', attesa: '.mappa',
    passi: [['.tappa:not(.chiusa)', 1600]] },
  { file: 'spagnolo-gioco', dove: 'spagnolo', attesa: '.mappa',
    passi: [['.tappa:not(.chiusa)', 1600]] },

  { file: 'castello-mappa', dove: 'torri', attesa: '.tappe' },
  { file: 'castello-gioco', dove: 'torri', attesa: '.tappe',
    passi: [['.tap:not(.chiusa)', 2000]] },

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

  { file: 'codice-mappa', dove: 'codice', attesa: '.tappe, .mappa, .cs-tappe' },
  { file: 'codice-gioco', dove: 'codice', attesa: '.tappe, .mappa, .cs-tappe',
    passi: [['.tappa:not(.chiusa), .cs-tappa', 3000]] },

  { file: 'generale-mappa', dove: 'generale', attesa: '.scelta-avv' },
  { file: 'generale-gioco', dove: 'generale', attesa: '.scelta-avv',
    passi: [['.avventura', 1500]] },

  { file: 'cameretta', dove: 'cameretta', attesa: '.stanza, .posto, .porta' },
  { file: 'albo', dove: 'albo', attesa: '.testata' },
  { file: 'genitori', dove: 'genitori', attesa: '.tastierino',
    passi: [['.tasto >> text="0"', 120], ['.tasto >> text="0"', 120],
            ['.tasto >> text="0"', 120], ['.tasto >> text="0"', 900]] },
  { file: 'genitori-giochi', dove: 'genitori', attesa: '.tastierino',
    passi: [['.tasto >> text="0"', 120], ['.tasto >> text="0"', 120],
            ['.tasto >> text="0"', 120], ['.tasto >> text="0"', 900],
            ['.schede button[data-scheda="sa"]', 800]] },
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
    for (const [sel, attesa] of r.passi || []) {
      try {
        await page.click(sel, { timeout: 6000 })
        await page.waitForTimeout(attesa)
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
