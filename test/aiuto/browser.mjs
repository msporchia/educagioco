/* ═══════════════════════════════════════════════════════════════════
   IL BROWSER, UNA VOLTA SOLA

   Ogni test del browser aveva la sua copia di: trova Chrome, apri il
   file, aspetta la home, raccogli gli errori di console, metti dentro
   un profilo finto. Sono cinque righe che sbagliate rendono il test
   bugiardo, quindi stanno qui e basta.

   Il percorso di Chrome si può forzare con la variabile CHROME, perché
   cambia da macchina a macchina e un percorso scritto a mano dentro un
   test lo rende eseguibile su un computer solo.
   ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright'
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { CITTA } from '../../src/data/bancarella-mondo.js'

export const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
/* Di regola si prova `dist/index.html`, che è quello che esce dal build.
   `DIST=…` lo sposta altrove, ed è la stessa ragione di `CHROME=`: la
   copia in `dist/` è anche quella che finisce sul server di casa, dove
   ci gioca un bambino, quindi capita di dover provare una build fatta da
   un'altra parte senza sovrascrivergliela sotto le mani. */
export const COSTRUITO = process.env.DIST
  ? resolve(process.env.DIST)
  : resolve(RADICE, 'dist/index.html')
export const GIOCO = 'file://' + COSTRUITO
export const SCATTI = resolve(RADICE, 'test/scatti')

export const TELEFONO = { width: 390, height: 844 }
export const TABLET   = { width: 820, height: 1180 }
export const SCRIVANIA = { width: 1280, height: 800 }

function trovaChrome() {
  const forzato = process.env.CHROME
  if (forzato) return forzato                       // se lo dici tu, si usa quello
  for (const p of ['/usr/bin/google-chrome', '/usr/bin/chromium',
                   '/usr/bin/chromium-browser', '/opt/pw-browsers/chromium'])
    if (existsSync(p)) return p
  return undefined                                  // quello di playwright, se c'è
}

export async function apriBrowser() {
  if (!existsSync(COSTRUITO))
    throw new Error('manca dist/index.html — lancia prima `npm run build`')
  const exe = trovaChrome()
  return chromium.launch(exe ? { executablePath: exe } : {})
}

/* ── UN TELEFONO, CON LA SUA CACHE SU DISCO ──
   `apriBrowser()` apre ogni pagina in un contesto in incognito, e
   l'incognito tiene la cache in memoria: lì dentro un file da otto
   megabyte non ci sta, quindi la pagina non si tiene mai e ogni apertura
   va in rete. Per quasi tutti i test è meglio così. Per l'aggiornamento
   no: il guasto da rifare è proprio **la pagina vecchia che il telefono
   si tiene da parte**, e un banco che non se la tiene lo nasconde.

   Qui il profilo è vero, su disco in una cartella temporanea che se ne
   va con `close()`. Si passa ad `apriGioco` al posto del browser — il
   contesto sa fare `newPage()` come lui — ma misura e tocco li decide
   lui, una volta per tutte le pagine. */
export async function apriTelefono({ viewport = TELEFONO } = {}) {
  if (!existsSync(COSTRUITO))
    throw new Error('manca dist/index.html — lancia prima `npm run build`')
  const cartella = mkdtempSync(join(tmpdir(), 'educagioco-telefono-'))
  const exe = trovaChrome()
  const contesto = await chromium.launchPersistentContext(cartella, {
    ...(exe ? { executablePath: exe } : {}), viewport, deviceScaleFactor: 2, hasTouch: true })
  const chiudi = contesto.close.bind(contesto)
  contesto.close = async () => {
    await chiudi()
    rmSync(cartella, { recursive: true, force: true })
  }
  return contesto
}

/* Apre il gioco e restituisce la pagina insieme all'elenco degli errori,
   che continua a riempirsi da solo mentre il test va avanti. */
export async function apriGioco(browser, { viewport = TELEFONO, hash = '', attesa = '.carte',
                                           giocatori = [GIOCATORE], userAgent,
                                           spiegazioni = false, indirizzo = GIOCO } = {}) {
  /* `userAgent` serve a una cosa sola, ma non c'è altro modo di provarla:
     alcune schermate cambiano a seconda del telefono che si ha in mano —
     il nastro «installalo» compare su Android e iPhone e non sul
     computer, e i passi da seguire sono diversi. Senza, il banco è sempre
     un computer e quella roba non la vede nessun test. */
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2, hasTouch: true,
                                       ...(userAgent ? { userAgent } : {}) })
  const errori = []
  page.on('pageerror', e => errori.push('errore JS: ' + e.message))
  page.on('console', m => m.type() === 'error' && errori.push('console: ' + m.text()))
  /* Un browser appena aperto ha l'archivio vuoto, e da quando i giocatori
     non stanno più nel codice questo vuol dire «nessun giocatore»: senza
     una riga qui, ogni test del browser si troverebbe davanti l'onboarding
     e aspetterebbe una home che non arriva.

     Il roster si mette in localStorage e non in IndexedDB perché
     localStorage è sincrono: `addInitScript` gira prima del bundle, quindi
     è già lì quando l'app lo cerca, e non serve caricare la pagina due
     volte. L'app legge IndexedDB per prima, non lo trova e ripiega qui —
     poi salva l'elenco al posto giusto da sé.

     `giocatori: null` non mette niente: è il primo avvio vero, quello di
     un telefono appena installato. */
  if (giocatori) {
    await page.addInitScript(([elenco, attivo]) => {
      try {
        if (!localStorage.getItem('giocatori'))
          localStorage.setItem('giocatori', JSON.stringify(elenco.map(id => ({ id, nome: id }))))
        if (!localStorage.getItem('ultimo-giocatore'))
          localStorage.setItem('ultimo-giocatore', JSON.stringify(attivo))
      } catch (e) { /* senza localStorage il test lo dirà da solo */ }
    }, [giocatori, giocatori[0]])
  }
  /* ── LE SPIEGAZIONI CHE COMPAIONO DA SOLE ──
     Dentro una partita ci sono righe che si presentano la prima volta e
     poi mai più (i primi passi del tower defense). Per un bambino sono
     giuste; per un test sono rumore, perché la stessa prima volta la
     rigioca a ogni giro. Quindi il banco parte come se le avesse già
     viste tutte; `spiegazioni: true` le rimette, ed è quello che fa il
     test che le prova (`integrazione/guide`). */
  if (!spiegazioni) {
    await page.addInitScript(() => {
      try { localStorage.setItem('guide-viste', '1') } catch (e) { /* niente */ }
    })
  }

  /* `indirizzo` è per l'unica cosa che da `file://` non esiste: il
     service worker. Lo apre `aiuto/sito.mjs`, che serve `dist/` come lo
     serve GitHub Pages. */
  await page.goto(indirizzo + (hash ? '#' + hash : ''))
  if (attesa) await page.waitForSelector(attesa, { timeout: 10000 })
  return { page, errori }
}

/* Chi gioca, nei test. Sono id finti apposta: il gioco non ha più nessun
   nome scritto nel codice, e non deve riaverne uno qui di rimbalzo. */
export const GIOCATORE = 'uno'
export const ALTRO = 'due'

/* Il roster va scritto insieme al profilo, e prima del reload: senza,
   l'app si trova l'archivio senza giocatori, mostra «come ti chiami?» e
   il test resta ad aspettare una home che non arriva mai. Sta qui e non
   nei singoli test perché è una riga che, sbagliata, li fa fallire tutti
   insieme in un punto che non c'entra niente. */
function scriviRoster(page, ids, chi) {
  return page.evaluate(([elenco, attivo]) => new Promise((ok, ko) => {
    const r = indexedDB.open('giochi-bambini', 1)
    r.onerror = () => ko(new Error('IndexedDB non si apre'))
    r.onsuccess = () => {
      const tx = r.result.transaction('kv', 'readwrite'), s = tx.objectStore('kv')
      const g = s.get('giocatori')
      g.onsuccess = () => {
        const avanti = Array.isArray(g.result) ? g.result : []
        for (const id of elenco)
          if (!avanti.some(v => v && v.id === id)) avanti.push({ id, nome: id })
        s.put(avanti, 'giocatori')
        if (attivo) s.put(attivo, 'ultimo-giocatore')
      }
      tx.oncomplete = ok
      tx.onerror = () => ko(new Error('scrittura del roster fallita'))
    }
  }), [ids, chi])
}

/* Scrive un profilo già pronto e ricarica: provare la fame di domani
   senza aspettare domani è metà del lavoro di questi test. */
export async function semina(page, profilo, giocatore = GIOCATORE) {
  /* Prima si lascia finire quello che l'app ha in coda: l'archivio rimanda
     le scritture di 350 ms (`store/storage.js`), e al `pagehide` della
     ricarica qui sotto le scrive tutte. Un gioco appena usato col profilo
     cambiato un attimo prima scriveva così il suo profilo **dopo** quello
     seminato, e se lo mangiava: nel costruttore la gru si apriva chiusa,
     perché la tappa era rimasta quella del bosco — una volta sì e una no,
     a seconda di quanto era durato il passo prima. */
  await attendi(page, 400)
  await page.evaluate(([p, chi]) => new Promise((ok, ko) => {
    const r = indexedDB.open('giochi-bambini', 1)
    r.onerror = () => ko(new Error('IndexedDB non si apre'))
    r.onsuccess = () => {
      const db = r.result, tx = db.transaction('kv', 'readwrite'), s = tx.objectStore('kv')
      const g = s.get('profilo:' + chi)
      // l'archivio salva il valore nudo (store/storage.js): una busta { __v, __t } rimasta da un giro vecchio si apre
      g.onsuccess = () => {
        const x = g.result
        const busta = x && typeof x === 'object' && '__v' in x && typeof x.__t === 'number'
        s.put({ ...((busta ? x.__v : x) || {}), ...p }, 'profilo:' + chi)
      }
      tx.oncomplete = ok
      tx.onerror = () => ko(new Error('scrittura fallita'))
    }
  }), [profilo, giocatore])
  // chi viene seminato entra nel roster: seminare è dire «questo esiste»
  await scriviRoster(page, [giocatore], giocatore)
  await page.reload()
  await page.waitForSelector('.carte', { timeout: 10000 })
}

/* Rilegge il profilo com'è adesso su disco. Serve quando la cosa da
   controllare non si vede dallo schermo — quale contatore è salito,
   quale campagna si è mossa — e guardarla dal DOM vorrebbe dire
   fidarsi di quello che il gioco ha deciso di scrivere. */
export function leggiProfilo(page, giocatore = GIOCATORE) {
  return page.evaluate(chi => new Promise((ok, ko) => {
    const r = indexedDB.open('giochi-bambini', 1)
    r.onerror = () => ko(new Error('IndexedDB non si apre'))
    r.onsuccess = () => {
      const g = r.result.transaction('kv', 'readonly').objectStore('kv').get('profilo:' + chi)
      g.onsuccess = () => {
        const x = g.result
        ok((x && typeof x === 'object' && '__v' in x && typeof x.__t === 'number' ? x.__v : x) || null)
      }
      g.onerror = () => ko(new Error('lettura fallita'))
    }
  }), giocatore)
}

/* Riporta il gioco a nuovo: senza, un test eredita le monete di quello
   di prima e i numeri smettono di voler dire qualcosa.

   Cancella davvero tutto, roster compreso: è il ricaricamento che
   rimette in piedi il minimo indispensabile, perché lo script di
   partenza di `apriGioco` gira a ogni navigazione. Su una pagina aperta
   con `giocatori: null` questo non succede — e infatti lì serve proprio
   che non succeda. */
export async function azzera(page, { attesa = '.carte' } = {}) {
  await page.evaluate(() => new Promise(ok => {
    const r = indexedDB.deleteDatabase('giochi-bambini')
    r.onsuccess = r.onerror = r.onblocked = ok
    try { localStorage.clear() } catch (e) { /* niente */ }
  }))
  await page.reload()
  if (attesa) await page.waitForSelector(attesa, { timeout: 10000 })
}

/* ── Le foto sono spente, se non le chiedi ──
   Uno scatto non verifica niente: nessun test guarda i pixel, le
   immagini servono a un umano che vuole vedere com'è venuta una
   schermata. Farle a ogni giro di `test/integrazione/` costa secondi e
   sporca la cartella di file che cambiano da soli (il gioco è pieno di
   caso), e quelli che finivano in radice arrivavano perfino nei commit.
   Quindi: `SCATTI=1` nell'ambiente, o `--scatti` al lanciatore, e
   sempre e solo dentro `test/scatti/`, che git non guarda. */
export const SCATTI_ACCESI = !!process.env.SCATTI && process.env.SCATTI !== '0'

export async function scatto(page, nome) {
  if (!SCATTI_ACCESI) return null
  mkdirSync(SCATTI, { recursive: true })
  const file = resolve(SCATTI, nome.endsWith('.png') ? nome : nome + '.png')
  await page.screenshot({ path: file })
  return file
}

/* le monete scritte nella fascia in alto della home */
export const moneteInHome = page =>
  page.evaluate(() => {
    const t = document.body.innerText.match(/🪙\s*(\d+)/)
    return t ? Number(t[1]) : null
  })

export const attendi = (page, ms) => page.waitForTimeout(ms)

/* Apre un gioco dalla home: la copertina si porta in mezzo dall'indice, e
   solo quella in mezzo apre (docs/core/home.md). */
export async function scegli(page, chiave) {
  await page.click(`[data-indice="${chiave}"]`)
  await page.click(`.carta.gioco.davanti[data-gioco="${chiave}"]`)
}

/* Apre un livello del costruttore dalla scheda: il tocco sul led apre il
   fumetto e «▶ costruisci» lo apre (docs/costruttore/scheda.md). `quale` è
   l'indice del livello, o 'libero' per il cantiere libero. */
export async function costruisci(page, quale) {
  await page.waitForSelector('[data-scheda-robot] [data-livello]', { timeout: 5000 })
  await page.locator(quale === 'libero' ? '[data-libero]' : `[data-livello="${quale}"]`).click()
  await page.click(`[data-fumetto-per="${quale}"] [data-azione="costruisci"]`)
}

/* Parte una tappa degli asteroidi dalla rotta: il tocco apre il fumetto e
   «▶ parti» la comincia (docs/asteroidi/mappa.md). `quale` è un selettore
   o un locator del nodo; di un selettore si prende il primo. */
export async function parti(page, quale) {
  const nodo = typeof quale === 'string' ? page.locator(quale).first() : quale
  await nodo.click()
  await page.click('[data-fumetto] [data-azione="parti"]')
}

/* Apre una giornata della bancarella dal giro del mondo
   (docs/bancarella/mappa.md): il tocco su una città apre il fumetto e
   «▶ entra» porta nella sua piazza; lì il tocco su un banco apre il suo e
   «▶ gioca» comincia la giornata. Dalla piazza giusta si parte da lì, da
   un'altra si passa dal cartello del mondo; con una giornata a metà la carta
   chiede, e qui si risponde «comincio». `id` è l'id della giornata
   (`banchetto`, `resto-copie`, `libera`…). */
export async function giocaGiornata(page, id) {
  const citta = CITTA.find(c => c.giornate.includes(id)).id
  const piazza = `[data-piazza][data-citta-di="${citta}"]`
  await page.waitForSelector('[data-mondo], [data-piazza]', { timeout: 8000 })
  if (!(await page.locator(piazza).count())) {
    if (!(await page.locator('[data-mondo]').count())) await page.click('[data-azione="al-mondo"]')
    await page.waitForSelector('[data-mondo]', { timeout: 5000 })
    await page.locator(`[data-citta="${citta}"]`).click()
    await page.click(`[data-fumetto-per="${citta}"] [data-azione="entra"]`)
    await page.waitForSelector(piazza, { timeout: 5000 })
  }
  await page.locator(`[data-camp="${id}"]`).click()
  await page.click(`[data-fumetto-per="${id}"] [data-azione="gioca"]`)
  if (await page.locator('[data-chiede]').count())
    await page.click('[data-chiede] [data-azione="comincia"]')
  await page.waitForSelector('.banco', { timeout: 5000 })
}

/* La mappa di Passo passo ha due valli dipinte, quella dei piccoli e lo
   zaino (docs/passo-passo/mappa.md): una casella che non c'è sta nell'altra,
   e ci si passa dalla tana come farebbe un bambino (ognuna ha la sua).
   Torna false se la tana è chiusa: allora di là è chiuso tutto. */
async function diLaSeServe(page, sel) {
  await page.waitForSelector('[data-mappa] [data-tappa]', { timeout: 8000 })
  if (await page.locator(sel).count()) return true
  const tana = page.locator('[data-mappa] [data-passaggio]')
  if ((await tana.getAttribute('data-aperta')) === '0') return false
  await page.waitForSelector('[data-segnalino][data-in-viaggio="0"]', { timeout: 8000 })
  await tana.click()
  await page.waitForSelector(sel, { timeout: 15000 })
  return true
}

/* Parte una tappa di Passo passo dalla mappa delle isole: il tocco apre
   subito il fumetto sulla tappa (il segnalino ci va intanto) e «gioca» la
   comincia anche a viaggio in corso (docs/passo-passo/mappa.md). Qui si
   aspetta comunque il segnalino fermo: la vista che lo segue sposterebbe
   la casella sotto il click. `quale` è l'indice della tappa, 'senza-fine',
   o un selettore; se sta nell'altro mondo ci si passa dalla tana. */
export async function giocaSullIsola(page, quale) {
  const sel = typeof quale === 'string' && /[\[.#]/.test(quale) ? quale : `[data-mappa] [data-tappa="${quale}"]`
  await diLaSeServe(page, sel)
  await page.waitForSelector('[data-segnalino][data-in-viaggio="0"]', { timeout: 8000 })
  await parti(page, sel)
}

/* lo stato di una casella della mappa di Passo passo: fatta, ora, aperta o
   chiusa; se sta nell'altro mondo ci si passa, e se la tana è chiusa è chiusa */
export async function statoSullIsola(page, quale) {
  const sel = `[data-mappa] [data-tappa="${quale}"]`
  if (!(await diLaSeServe(page, sel))) return 'chiusa'
  return page.locator(sel).getAttribute('data-stato')
}

/* Porta l'eroe del sotterraneo fino a una cella della terra di sopra (`meta`, [x, y] della maschera) come un
   bambino che sa la strada: la strada la calcola lo stesso motore del gioco (motore/terra.js), e si tocca il
   punto più avanti di quella strada che sta sullo schermo, finché non ci si arriva. Toccare «verso» una cosa
   lontana non basta: dal villaggio la strada per l'arco gira dietro al bosco. `tocca(x, y)`: il dito (CDP) o,
   di difetto, il mouse. Torna la cella dove si è fermato */
export async function camminaVerso(page, meta, { tocca = null, giri = 30 } = {}) {
  const { MASCHERA, CELLA, MINATORE, MERCANTI, PERSONAGGI } = await import('../../src/giochi/sotterraneo/dati/terra-mappa.js')
  const { creaTerra } = await import('../../src/giochi/sotterraneo/motore/terra.js')
  const { SCALA_TERRA: S } = await import('../../src/giochi/sotterraneo/dati/terra.js')
  const terra = creaTerra(MASCHERA, { ostacoli: [MINATORE.piede, ...Object.values(MERCANTI).map(m => m.piede),
                                                 ...Object.values(PERSONAGGI || {}).map(m => m.piede)] })
  const premi = tocca || ((x, y) => page.mouse.click(x, y))
  const cella = async () => (await page.locator('[data-eroe-terra]').getAttribute('data-cella')).split(',').map(Number)
  const fermo = async () => {
    await page.waitForFunction(() => document.querySelector('[data-eroe-terra]')?.dataset.cammina === '0',
                               null, { timeout: 15000 })
    await attendi(page, 150)
  }
  for (let giro = 0; giro < giri; giro++) {
    const [x, y] = await cella()
    if (x === meta[0] && y === meta[1]) break
    const via = terra.strada({ x, y }, { x: meta[0], y: meta[1] })
    if (!via || !via.length) break
    const v = await page.locator('[data-terra]').boundingBox()
    const su = (await page.locator('.sot-terra-sopra').boundingBox())?.height || 0
    const giu = (await page.locator('.sot-terra-sotto').boundingBox())?.height || 0
    const [cx, cy] = (await page.locator('[data-terra]').getAttribute('data-camera')).split(',').map(Number)
    const schermo = c => [v.x + ((c.x + 0.5) * CELLA - cx) * S, v.y + ((c.y + 0.5) * CELLA - cy) * S]
    const dentro = ([sx, sy]) => sx > v.x + 24 && sx < v.x + v.width - 24 && sy > v.y + su + 30 && sy < v.y + v.height - giu - 30
    const passo = [...via].reverse().find(c => dentro(schermo(c)))
    if (!passo) break
    await premi(...schermo(passo))
    await fermo()
  }
  return cella()
}

/* Scende in una discesa del sotterraneo dalla terra di sopra
   (docs/sotterraneo/terra-di-sopra.md). L'eroe ci va a piedi, come farebbe
   un bambino che sa dove andare: si tocca il punto dello schermo più vicino
   alla discesa, si aspetta che si fermi, si ripete finché la discesa è
   trovata e sta sullo schermo; poi la si tocca e si preme «scendo» nel
   fumetto. Coi tocchi del mouse: quelli del dito vero li prova
   `integrazione/sotterraneo-terra`. `quale` è l'indice della discesa o
   'abisso'; con `scendi: false` si ferma al fumetto aperto. */
export async function scendiNelSotterraneo(page, quale, { scendi = true } = {}) {
  const posto = page.locator(quale === 'abisso' ? '[data-posto][data-abisso]' : `[data-discesa="${quale}"]`)
  await page.waitForSelector('[data-terra]', { timeout: 5000 })
  const fermo = async () => {
    await page.waitForFunction(() => document.querySelector('[data-eroe-terra]')?.dataset.cammina === '0',
                               null, { timeout: 15000 })
    await attendi(page, 150)
  }
  const fumettoGiusto = () => page.locator(`[data-fumetto] [data-azione="scendi"]`).count()
  // prima per strada fin sotto la discesa (la strada vera, non «verso»), poi la si tocca
  {
    const { POSTI } = await import('../../src/giochi/sotterraneo/dati/terra-mappa.js')
    const { POSTO_DI } = await import('../../src/giochi/sotterraneo/dati/terra.js')
    const { CAMPAGNA } = await import('../../src/giochi/sotterraneo/dati/campagna.js')
    const chiave = quale === 'abisso' ? 'abisso' : CAMPAGNA[quale].chiave
    await camminaVerso(page, POSTI[POSTO_DI[chiave]].piede)
  }
  for (let giro = 0; giro < 16; giro++) {
    const v = await page.locator('[data-terra]').boundingBox()
    const su = (await page.locator('.sot-terra-sopra').boundingBox())?.height || 0
    const giu = (await page.locator('.sot-terra-sotto').boundingBox())?.height || 0
    const b = await posto.boundingBox()
    const x = b.x + b.width / 2, y = b.y + b.height / 2
    const lim = [v.x + 30, v.x + v.width - 30, v.y + su + 40, v.y + v.height - giu - 40]
    const visibile = x > lim[0] && x < lim[1] && y > lim[2] && y < lim[3]
    if (visibile && await posto.getAttribute('data-trovato') === '1') {
      await page.mouse.click(x, y)
      await fermo()
      if (await fumettoGiusto()) break
      continue
    }
    await page.mouse.click(Math.max(lim[0], Math.min(lim[1], x)), Math.max(lim[2], Math.min(lim[3], y)))
    await fermo()
  }
  await page.waitForSelector('[data-fumetto] [data-azione="scendi"]', { timeout: 5000 })
  if (scendi) await page.click('[data-fumetto] [data-azione="scendi"]')
}

/* Apre l'avventura di un eroe del sotterraneo (docs/sotterraneo/avventure.md):
   la prima volta la scelta c'è già, poi la si apre dal «cambio» della carta
   in fondo alla terra di sopra. Aspetta la terra dell'eroe scelto. Col
   mouse: il dito vero lo prova `integrazione/sotterraneo-avventure`. */
export async function scegliAvventura(page, eroe) {
  await page.waitForSelector('[data-terra], .sot-eroe[data-eroe]', { timeout: 5000 })
  if (!(await page.locator('.sot-eroe[data-eroe]').count())) await page.click('[data-azione="eroe"]')
  await page.click(`.sot-eroe[data-eroe="${eroe}"]`)
  await page.waitForSelector('.sot-eroe[data-eroe]', { state: 'detached', timeout: 3000 })
  await page.waitForSelector('[data-terra]', { timeout: 5000 })
}
