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
import { STRADE } from '../../src/giochi/passo-passo/motore/strade.js'
import { SENTIERO_CANE } from '../../src/giochi/passo-passo/scena/animale.js'

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

// `args`: opzioni in più per Chrome (il banco delle perdite vuole `--js-flags=--expose-gc`)
export async function apriBrowser({ args = [] } = {}) {
  if (!existsSync(COSTRUITO))
    throw new Error('manca dist/index.html — lancia prima `npm run build`')
  const exe = trovaChrome()
  return chromium.launch({ ...(exe ? { executablePath: exe } : {}), ...(args.length ? { args } : {}) })
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
export async function apriGioco(browser, { viewport = TELEFONO, hash = '', attesa = '.carte', pixel = 2,
                                           giocatori = [GIOCATORE], userAgent,
                                           spiegazioni = false, indirizzo = GIOCO, amiciDecisi = true } = {}) {
  /* `userAgent` serve a una cosa sola, ma non c'è altro modo di provarla:
     alcune schermate cambiano a seconda del telefono che si ha in mano —
     il nastro «installalo» compare su Android e iPhone e non sul
     computer, e i passi da seguire sono diversi. Senza, il banco è sempre
     un computer e quella roba non la vede nessun test. */
  // `pixel`: il deviceScaleFactor (2 un telefono; 1, 1.25 e 1.5 un monitor con lo zoom del sistema)
  const page = await browser.newPage({ viewport, deviceScaleFactor: pixel, hasTouch: true,
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
  /* Gli amici online sono spenti di base e si chiedono ai grandi (docs/core/amici.md): un profilo che c'era già e non ha mai risposto
     fa comparire un avviso nella posta dei grandi. Il banco parte come se i grandi avessero già risposto (spento), se no ogni
     test che guarda la posta o i nastri troverebbe una nota che non cerca; `amiciDecisi: false` la rimette. */
  if (giocatori && amiciDecisi) {
    await page.addInitScript(elenco => {
      try {
        for (const id of elenco) if (!localStorage.getItem('amici:' + id))
          localStorage.setItem('amici:' + id, JSON.stringify({ id: 'banco' + id.replace(/[^a-z0-9]/g, '').padEnd(8, '0').slice(0, 10), deciso: true, attivo: false, online: true, amici: [] }))
      } catch (e) { /* senza localStorage il test lo dirà da solo */ }
    }, giocatori)
  }
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

/* Una chiave dell'archivio fuori dal profilo (`amici:<bambino>`, …), scritta così com'è in IndexedDB, poi si ricarica. Come
   `semina`, prima lascia finire le scritture in coda. */
export async function seminaArchivio(page, chiave, valore) {
  await attendi(page, 400)
  await page.evaluate(([k, v]) => new Promise((ok, ko) => {
    const r = indexedDB.open('giochi-bambini', 1)
    r.onerror = () => ko(new Error('IndexedDB non si apre'))
    r.onsuccess = () => {
      const tx = r.result.transaction('kv', 'readwrite')
      tx.objectStore('kv').put(v, k)
      tx.oncomplete = ok
      tx.onerror = () => ko(new Error('scrittura fallita'))
    }
  }), [chiave, valore])
  await page.reload()
  await page.waitForSelector('.carte', { timeout: 10000 })
}

/* Gli amici del bambino come dopo una lettura delle loro bacheche (docs/core/amici-bacheca.md): accesi dai grandi, ognuno con
   la sua istantanea. `amicoDiProva('a', 'leonardo1', 'Leonardo', { fa: 1, giochi: { mate: { posti: { '': 5 }, primati: {} } } })`; un
   nome vuoto è un amico mai incontrato online. Il servizio non serve: la prova punta `__SERVIZIO_SFIDE__` a una porta chiusa. */
export function amicoDiProva(lettera, id, nome, { fa = 0, giochi = {} } = {}) {
  const d = new Date(Date.now() - fa * 86_400_000), due = n => String(n).padStart(2, '0')
  const giorno = `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}`
  return { chiave: lettera.repeat(32), id, nome, visto: 1, bacheca: { v: 1, giorno, giochi } }
}
export const seminaAmici = (page, amici, giocatore = GIOCATORE, { sorpassi = [] } = {}) =>
  seminaArchivio(page, 'amici:' + giocatore, { id: 'banco' + giocatore.replace(/[^a-z0-9]/g, '').padEnd(8, '0').slice(0, 10),
                                               deciso: true, attivo: true, online: true, amici, sorpassi })

/* Le tendine delle impostazioni dei grandi («Zona delicata», «Per chi sviluppa») nascono chiuse: un test che deve premere lì dentro le
   apre. Un bambino non le vedrebbe nemmeno, ed è il punto. Docs: docs/genitori/riordino.md. */
export const apriTendine = page => page.evaluate(() => document.querySelectorAll('details.tendina').forEach(d => { d.open = true }))

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
    // a nuovo vuol dire anche senza il cheat di prima: un indirizzo col nome di un gioco (`#sotterraneo=branco`) lo
    // riaprirebbe al posto della home (App.vue, `dallIndirizzo`)
    history.replaceState(null, '', location.pathname + location.search)
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

/* Lo scontro è in due fasi (docs/sotterraneo/abilita.md): prima si sceglie il colpo, poi compare la domanda. Chi
   vuole rispondere sceglie l'attacco di sempre (la prima riga); dove non c'è la scelta (una porta, un forziere) non fa niente. */
export async function scegliAttacco(page) {
  await page.waitForSelector('.sot-domanda .qz-tasto, [data-caselle-abilita][data-pronto]', { timeout: 8000 }).catch(() => {})
  const b = page.locator('[data-caselle-abilita] [data-azione="attacco"]')
  if (await b.count()) await b.first().click()
}

/* Apre un gioco dalla home: la copertina si porta in mezzo dall'indice, e
   solo quella in mezzo apre (docs/core/home.md). */
export async function scegli(page, chiave) {
  await page.click(`[data-indice="${chiave}"]`)
  await page.click(`.carta.gioco.davanti[data-gioco="${chiave}"]`)
}

/* Aspetta che la finestra del sotterraneo (`.sot-cornice`: zaino, pagina dell'eroe, albero, bottega) abbia finito di
   crescere. Nasce a 0,94 e trasparente e arriva in 160 ms (`sot-cresce`): un bottone misurato in quel momento sta una
   ventina di pixel più in là di dove sarà, e un tocco lì cade a lato (a macchina carica, spesso). Un bambino non la
   tocca prima di vederla; il test sì, quindi aspetta lui. Chi misura un bottone per toccarlo la chiama prima. */
export async function finestraFerma(page) {
  await page.waitForFunction(() => {
    const c = document.querySelector('.sot-cornice')
    return !c || (getComputedStyle(c).transform === 'none' && getComputedStyle(c).opacity === '1')
  }, null, { timeout: 2000 }).catch(() => {})
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

/* Apre una tappa (o una partita libera) del castello dal regno: il tocco sul
   segnalino apre il fumetto e «Gioca ▶» la comincia (docs/castello/regno.md).
   `quale` è un selettore o un locator del segnalino; di un selettore si prende
   il primo. */
export async function difendi(page, quale) {
  const segno = typeof quale === 'string' ? page.locator(quale).first() : quale
  await segno.click()
  await page.click('[data-fumetto] [data-azione="gioca"]')
}

/* Il fumetto di un segnalino del regno, letto e richiuso: è lì che una
   partita libera dice il suo record. */
export async function fumettoDel(page, quale) {
  await page.locator(quale).first().click()
  const testo = (await page.locator('[data-fumetto]').textContent()).replace(/\s+/g, ' ').trim()
  await page.locator(quale).first().click()
  return testo
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

/* La mappa di Passo passo ha un protagonista per strada, il coniglio o il
   cane, e due valli dipinte, quella dei piccoli e le isole delle carte
   (docs/passo-passo/mappa.md): prima si sceglie chi gioca col selettore, poi
   una casella che non c'è sta nell'altra valle, e ci si passa dalla tana come
   farebbe un bambino (ognuna ha la sua; il cane sta tutto nella valle). Torna
   false se il cane è chiuso o se la tana è chiusa: allora di là è chiuso tutto. */
const protagonistaDi = sel => {
  const m = /data-tappa="([^"]+)"/.exec(sel)
  if (!m) return null
  if (m[1] === 'senza-fine') return 'coniglio'
  if (m[1] === SENTIERO_CANE) return 'cane'
  return STRADE.animale[Number(m[1])] ?? null
}
async function diLaSeServe(page, sel) {
  await page.waitForSelector('[data-mappa] [data-tappa]', { timeout: 8000 })
  const chi = protagonistaDi(sel)
  if (chi && (await page.locator('[data-mappa]').getAttribute('data-protagonista')) !== chi) {
    const scegli = page.locator(`[data-scegli="${chi}"]`)
    if (await scegli.evaluate(e => e.classList.contains('pp-chiuso'))) return false
    await scegli.click()
    await page.waitForSelector(`[data-mappa][data-protagonista="${chi}"] [data-tappa]`, { timeout: 8000 })
  }
  if (await page.locator(sel).count()) return true
  const tana = page.locator('[data-mappa] [data-passaggio]')
  if (!(await tana.count()) || (await tana.getAttribute('data-aperta')) === '0') return false
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

/* Scende in una discesa del sotterraneo dal mondo di sopra (docs/sotterraneo/mondo-3d.md): l'eroe ci va a piedi
   (scendiNelMondo, sotto). `quale` è l'indice della discesa o 'abisso'; con `scendi: false` si ferma al fumetto aperto. */
export async function scendiNelSotterraneo(page, quale, { scendi = true, tocca = null } = {}) {
  await page.waitForSelector('[data-mondo3d]', { timeout: 8000 })
  return scendiNelMondo(page, quale, { scendi, tocca })
}

/* Il mondo di sopra del Sotterraneo 3D (viste/Mondo3d.vue, docs/sotterraneo/terra-di-sopra.md «Il mondo in 3D»). Aspetta che
   sia nato e che la scena abbia costruito i pezzi attorno all'eroe */
export async function mondoPronto(page) {
  await page.waitForSelector('[data-mondo3d][data-pronto="1"]', { timeout: 30000 })
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.pronto, null, { timeout: 30000 })
}
// aspetta che l'eroe del mondo si sia fermato
export async function fermoNelMondo(page) {
  await page.waitForFunction(() => document.querySelector('[data-eroe-mondo]')?.dataset.cammina === '0', null, { timeout: 60000 })
  await attendi(page, 300)
}
// tocca il centro di un bersaglio del mondo (un elemento HTML sopra la tela): `tocca(x, y)` il dito, di difetto il mouse
export async function toccaNelMondo(page, sel, { tocca = null } = {}) {
  // fuori dalla vista (la telecamera segue l'eroe e non ha più una veduta speciale per il villaggio): la vista si porta lì, come col dito
  // `data-vis` vale anche per chi sta mezzo fuori dal bordo: il tocco va al centro, che deve stare nello schermo (la pietra del
  // villaggio, al bordo sinistro dopo la bottega, si toccava a x < 0)
  const li = await page.waitForSelector(`${sel}[data-vis="1"]`, { timeout: 1500 }).catch(() => null)
  const dentro = async () => {
    const r = await page.locator(sel).first().boundingBox(), v = page.viewportSize()
    return !!r && r.x + r.width / 2 > 8 && r.x + r.width / 2 < v.width - 8 && r.y + r.height * 0.6 > 8 && r.y + r.height * 0.6 < v.height - 8
  }
  if (!li || !(await dentro())) {
    await page.evaluate(s => {
      const el = document.querySelector(s), M = window.__mondo3d, d = el.dataset
      const b = M.bersagli().find(q => (d.personaggio && q.ruolo === 'personaggio' && q.k === d.personaggio) || (d.mercante && q.ruolo === 'mercante' && q.k === d.mercante && (!d.citta || q.citta === d.citta))
        || (d.posto && q.ruolo === 'ingresso' && q.k === d.posto) || (d.pietra && q.ruolo === 'pietra' && q.k === d.pietra) || (d.minatore !== undefined && q.ruolo === 'minatore'))
      if (b) M.scena.cam.guarda(b.accanto.x + 0.5, b.accanto.y + 0.5, M.io)
    }, sel)
    await attendi(page, 2500)   // la telecamera ci arriva morbida: il bersaglio si tocca quando ha smesso di scorrere
  }
  await page.waitForSelector(`${sel}[data-vis="1"]`, { timeout: 20000 })
  // la telecamera si muove morbida (segue l'eroe, o torna da dove l'ha portata il dito): si tocca quando il bersaglio sta fermo
  let b = await page.locator(sel).first().boundingBox()
  for (let i = 0; i < 20; i++) {
    await attendi(page, 250)
    const c = await page.locator(sel).first().boundingBox()
    const fermo = c && b && Math.abs(c.x - b.x) < 1 && Math.abs(c.y - b.y) < 1
    b = c
    if (fermo) break
  }
  await (tocca || ((x, y) => page.mouse.click(x, y)))(b.x + b.width / 2, b.y + b.height * 0.6)
}
/* Scende in una discesa dal mondo: l'eroe si porta davanti all'ingresso (`__mondo3d.vai`, il salto delle prove, che carica la sua
   zona: le pietre del mondo a percorso, `pietra:zona:<zona>`, stanno a metà zona, lontane dai dungeon; la strada a piedi la prova
   integrazione/sotterraneo-mondo), poi si tocca l'ingresso e «scendo» nel fumetto. `quale`: l'indice della storia, 'abisso', o la
   chiave di un ingresso */
export async function scendiNelMondo(page, quale, { scendi = true, tocca = null } = {}) {
  const { CAMPAGNA } = await import('../../src/giochi/sotterraneo/dati/campagna.js')
  const chiave = quale === 'abisso' ? 'abisso' : typeof quale === 'string' ? quale : CAMPAGNA[quale].chiave
  await mondoPronto(page)
  await page.evaluate(k => window.__mondo3d.vai('ingresso:' + k), chiave)
  await attendi(page, 1500)
  await page.waitForFunction(() => window.__sotterraneo3d.pronto, null, { timeout: 30000 })
  await toccaNelMondo(page, `[data-posto="${chiave}"]`, { tocca })
  await page.waitForSelector(`[data-fumetto-di="${chiave}"] [data-azione="scendi"]`, { timeout: 60000 })
  await attendi(page, 300)
  if (scendi) await page.click(`[data-fumetto-di="${chiave}"] [data-azione="scendi"]`)
}

/* Nel dialogo aperto sulla terra di sopra (docs/sotterraneo/dialoghi.md): le pagine avanti con un tocco sul testo,
   fino alle domande, poi la scelta `sel` (es. '[data-scelta="bottega"]'). Aspetta i 320 ms ciechi. `tocca(sel)`: un
   tocco vero; senza, il mouse */
export async function nelDialogo(page, sel = null, { tocca = null } = {}) {
  await page.waitForSelector('[data-dialogo]', { timeout: 15000 })
  const premi = tocca || (s => page.click(s))
  for (let n = 0; n < 12 && !(await page.locator('[data-dialogo][data-ultima]').count()); n++) {
    await attendi(page, 360)
    await premi('[data-dialogo-testo]')
  }
  await page.waitForSelector('[data-dialogo][data-ultima]', { timeout: 3000 })
  await attendi(page, 400)
  if (sel) await premi(`[data-dialogo] ${sel}`)
}

/* Lascia perdere la discesa in corso e risale sulla terra di sopra: il ⏸, «lascio perdere questa discesa» sul velo
   e «sì, risalgo» nel foglio che dice cosa resta (docs/sotterraneo/portale-e-sosta.md, «Il portale e l'uscita»). La ✕ non
   basta più: porta in home, e rientrando si è già giù. Col mouse */
export async function lasciaLaDiscesa(page) {
  await page.click('button[aria-label="pausa"]')
  await page.waitForSelector('[data-pausa] [data-azione="lascia-discesa"]', { timeout: 3000 })
  await attendi(page, 400)   // il velo è cieco per un attimo (CIECA)
  await page.click('[data-azione="lascia-discesa"]')
  await page.waitForSelector('[data-lascio-perdere]', { timeout: 3000 })
  await page.click('[data-lascio-perdere] [data-azione="scorda-si"]')
  await page.waitForSelector('[data-mondo3d]', { timeout: 5000 })
}

/* La bottega di un mercante del sotterraneo (docs/sotterraneo/bottega-finestra.md, «La bottega e lo zaino»): un tocco
   sceglie, il tasto compra o vende. `tocca(x, y)`: il dito (CDP) o, di difetto, il mouse. La bottega
   appena aperta è cieca per 320 ms: chi chiama l'ha già aspettata. */
async function toccaIlCentro(page, sel, tocca) {
  // la telecamera si muove morbida (segue l'eroe, o torna da dove l'ha portata il dito): si tocca quando il bersaglio sta fermo
  let b = await page.locator(sel).first().boundingBox()
  for (let i = 0; i < 20; i++) {
    await attendi(page, 250)
    const c = await page.locator(sel).first().boundingBox()
    const fermo = c && b && Math.abs(c.x - b.x) < 1 && Math.abs(c.y - b.y) < 1
    b = c
    if (fermo) break
  }
  await (tocca || ((x, y) => page.mouse.click(x, y)))(b.x + b.width / 2, b.y + b.height / 2)
}

/* passa alla linguetta che tiene il pezzo `chiave`; false se non c'è sotto nessuna */
export async function allaLinguettaDi(page, chiave, { tocca = null } = {}) {
  const sel = `[data-bottega] [data-casella-pezzo="${chiave}"]`
  if (await page.locator(sel).count()) return true
  const linguette = page.locator('[data-bottega] [data-scheda]')
  for (let i = 0; i < await linguette.count(); i++) {
    await toccaIlCentro(page, `[data-bottega] [data-scheda] >> nth=${i}`, tocca)
    await attendi(page, 120)
    if (await page.locator(sel).count()) return true
  }
  return false
}

export async function compraNellaBottega(page, chiave, { tocca = null } = {}) {
  if (!(await allaLinguettaDi(page, chiave, { tocca }))) throw new Error(`nella bottega non c'è ${chiave}`)
  await toccaIlCentro(page, `[data-bottega] [data-casella-pezzo="${chiave}"]`, tocca)
  await page.waitForSelector(`[data-pannello][data-cosa="${chiave}"]`, { timeout: 3000 })
  await toccaIlCentro(page, '[data-bottega] [data-azione="compra"]', tocca)
  await attendi(page, 250)
}

export async function vendiNellaBottega(page, chiave, { tocca = null } = {}) {
  await toccaIlCentro(page, '[data-bottega] [data-scheda="vendi"]', tocca)
  await attendi(page, 120)
  await toccaIlCentro(page, `[data-bottega] [data-vendo="${chiave}"]`, tocca)
  await page.waitForSelector(`[data-pannello][data-cosa="${chiave}"]`, { timeout: 3000 })
  await toccaIlCentro(page, '[data-bottega] [data-azione="vendi"]', tocca)
  await attendi(page, 250)
}

/* Dal rigattiere si riprende una cosa venduta, allo stesso prezzo: la linguetta «Riacquista», un tocco sceglie e il tasto
   riacquista (docs/sotterraneo/bottega.md, «Riacquista») */
export async function riacquistaNellaBottega(page, chiave, { tocca = null } = {}) {
  await toccaIlCentro(page, '[data-bottega] [data-scheda="riacquista"]', tocca)
  await attendi(page, 120)
  await toccaIlCentro(page, `[data-bottega] [data-riacquisto="${chiave}"]`, tocca)
  await page.waitForSelector(`[data-pannello][data-cosa="${chiave}"]`, { timeout: 3000 })
  await toccaIlCentro(page, '[data-bottega] [data-azione="riacquista"]', tocca)
  await attendi(page, 250)
}

/* Apre l'avventura di un eroe del sotterraneo (docs/sotterraneo/avventure.md):
   la prima volta la scelta c'è già, poi la si apre da «Cambia eroe» in fondo
   alla pagina dell'eroe (il globo dell'esperienza). Aspetta la terra dell'eroe scelto. Col
   mouse: il dito vero lo prova `integrazione/sotterraneo-avventure`. */
export async function scegliAvventura(page, eroe) {
  await page.waitForSelector('[data-mondo3d], .sot-eroe[data-eroe]', { state: 'attached', timeout: 30000 })
  if (!(await page.locator('.sot-eroe[data-eroe]').count())) {
    await page.click('[data-azione="eroe-pagina"]')
    await page.click('[data-pagina-eroe] [data-azione="eroe"]')
  }
  await page.click(`.sot-eroe[data-eroe="${eroe}"]`)
  await page.waitForSelector('.sot-eroe[data-eroe]', { state: 'detached', timeout: 30000 })
  await page.waitForSelector('[data-mondo3d]', { state: 'attached', timeout: 30000 })
}
