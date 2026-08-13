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
import { existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

export const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
export const COSTRUITO = resolve(RADICE, 'dist/index.html')
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

/* Apre il gioco e restituisce la pagina insieme all'elenco degli errori,
   che continua a riempirsi da solo mentre il test va avanti. */
export async function apriGioco(browser, { viewport = TELEFONO, hash = '', attesa = '.carte',
                                           giocatori = [GIOCATORE] } = {}) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2, hasTouch: true })
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
  await page.goto(GIOCO + (hash ? '#' + hash : ''))
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
  await page.evaluate(([p, chi]) => new Promise((ok, ko) => {
    const r = indexedDB.open('giochi-bambini', 1)
    r.onerror = () => ko(new Error('IndexedDB non si apre'))
    r.onsuccess = () => {
      const db = r.result, tx = db.transaction('kv', 'readwrite'), s = tx.objectStore('kv')
      const g = s.get('profilo:' + chi)
      g.onsuccess = () => { s.put({ ...(g.result || {}), ...p }, 'profilo:' + chi) }
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
      g.onsuccess = () => ok(g.result || null)
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
