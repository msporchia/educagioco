/* ═══════════════════════════════════════════════════════════════════
   LA SCUOLA SENZA INTERNET — LE PAGINE SI RIAPRONO, LA MAESTRA FA PARTIRE UN GIOCO

   perché: le pagine della scuola si riaprono dalla copia del service worker col sito spento e la cache vuota, e la lezione va avanti
   a parte perché: parte dal sito servito e poi spento; scuola apre le pagine dal file con due contesti e il servizio in locale, e non prova mai la rete caduta

   Le due pagine di `dist-scuola/` servite da un sito vero (`aiuto/sito.mjs`,
   come GitHub Pages: dal file il service worker non c'è), aperte una
   volta con la rete. Poi il sito si spegne e la cache del browser si
   svuota: le pagine si riaprono lo stesso, dalla copia del service worker.
   Sulla pagina della maestra «Codice per i PC» dà le quattro cifre; sul
   PC del bambino «Senza lezione», un codice sbagliato no, quello giusto
   sì; le domande a schede, le tabelline, «Via», e si
   risponde. Il tasto «Maestra» (lo stesso codice) salta al blocco dopo,
   e la lezione, che è di un blocco, finisce; a pagina riaperta si è ancora lì; «Torna all'inizio» riporta al codice.
   Docs: docs/scuola/ripieghi.md. `node test/esegui.mjs scuola-senza-rete`
   ═══════════════════════════════════════════════════════════════════ */
import { resolve } from 'node:path'
import { apriBrowser, attendi, scatto, RADICE, SCRIVANIA } from '../aiuto/browser.mjs'
import { apriSito } from '../aiuto/sito.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const CARTELLA = resolve(RADICE, 'dist-scuola')
const sito = await apriSito({ cartella: CARTELLA })
const browser = await apriBrowser({ file: resolve(CARTELLA, 'index.html') })
const contesto = await browser.newContext({ viewport: SCRIVANIA, hasTouch: true })
const errori = []
const veri = () => errori.filter(e => !/WebSocket|ERR_|Failed to load resource/.test(e))
const testo = (page, sel) => page.locator(sel).first().innerText()
const schermata = (page, nome, timeout = 8000) => page.waitForSelector(`[data-schermata="${nome}"]`, { timeout })

async function apri(file) {
  const page = await contesto.newPage()
  page.on('pageerror', e => errori.push(`${file}: errore JS: ${e.message}`))
  page.on('console', m => m.type() === 'error' && errori.push(`${file}: console: ${m.text()}`))
  const cdp = await contesto.newCDPSession(page)
  async function tocca(sel) {
    const el = page.locator(sel).first()
    await el.waitFor({ state: 'visible', timeout: 8000 })
    await el.scrollIntoViewIfNeeded()
    const b = await el.boundingBox()
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }] })
    await attendi(page, 40)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await attendi(page, 60)
  }
  await page.goto(sito.indirizzo + file)
  return { page, cdp, tocca }
}
// la pagina aperta con la rete: il service worker si installa, e alla seconda apertura passa da lui e se la tiene
const inCassetto = (page, file) => page.evaluate(async f => (await (await caches.open('scuola-pagine')).keys()).some(r => r.url.endsWith('/' + f)), file)
async function tieni(p, file) {
  await p.page.evaluate(() => navigator.serviceWorker.ready)
  await p.page.reload()
  await p.page.waitForFunction(f => caches.open('scuola-pagine').then(c => c.keys()).then(k => k.some(r => r.url.endsWith('/' + f))), file, { timeout: 30000 })
}

const M = await apri('maestra.html'), B = await apri('index.html')
const m = M.page, b = B.page
await tieni(M, 'maestra.html')
await tieni(B, 'index.html')
controlla('le due pagine sono nella copia del service worker', await inCassetto(b, 'index.html') && await inCassetto(b, 'maestra.html'))

/* ── niente più rete: il sito spento, la cache del browser vuota ── */
await sito.chiudi()
await B.cdp.send('Network.clearBrowserCache')
await m.reload()
await schermata(m, 'inizio', 15000)
await b.reload()
await schermata(b, 'codice', 15000)
controlla('senza rete le due pagine si riaprono', true)

/* ── la maestra legge il codice per i PC ── */
await M.tocca('[data-pagina-bambini] [data-azione="mostra-codice-pc"]')
const cifre = (await testo(m, '[data-codice-pc]')).trim()
controlla('il codice per i PC sono quattro cifre', /^\d{4}$/.test(cifre), cifre)
await scatto(m, 'scuola-codice-per-i-pc')

/* ── «Senza lezione» sul PC del bambino ── */
await B.tocca('[data-azione="senza-lezione"]')
await schermata(b, 'senza')
const sbagliato = String((Number(cifre) + 5000) % 10000).padStart(4, '0')
await b.fill('[data-campo="codice-maestra"]', sbagliato)
await B.tocca('[data-azione="codice-maestra"]')
await b.waitForSelector('[data-codice-maestra-errore]', { timeout: 3000 })
controlla('un codice sbagliato non apre', /non è giusto/.test(await testo(b, '[data-codice-maestra-errore]')))
await b.fill('[data-campo="codice-maestra"]', cifre)
await B.tocca('[data-azione="codice-maestra"]')
await B.tocca('[data-senza-lezione] [data-gioco="schede"]')
await B.tocca('[data-materia-elenco="matematica"] .testa-materia')
await B.tocca('[data-voce="tabelline"]')
await scatto(b, 'scuola-senza-lezione')
await B.tocca('[data-azione="via-senza"]')
await schermata(b, 'blocco')
await b.waitForSelector('[data-domanda][data-blocco="0"] .qz-tasto[data-giusta]', { timeout: 8000 })
await attendi(b, 450)
await B.tocca('.qz-tasto[data-giusta]')
await b.waitForSelector('.qz-tasto.giusta', { timeout: 3000 })
controlla('la lezione parte senza servizio, e si risponde', true)

/* ── il tasto «Maestra»: il blocco dopo, che resta a pagina riaperta ── */
await B.tocca('[data-azione="maestra"]')
await b.fill('[data-menu-maestra] [data-campo="codice-maestra"]', cifre)
await B.tocca('[data-menu-maestra] [data-azione="codice-maestra"]')
await B.tocca('[data-menu-maestra] [data-azione="salta"]')
await schermata(b, 'finito', 5000)
controlla('senza lezione è un blocco solo: «Salta al blocco dopo» la fa finire', true)
await b.reload()
await schermata(b, 'finito', 15000)
controlla('a pagina riaperta, senza rete, si è ancora lì', true)
await B.tocca('[data-azione="maestra"]')
await b.fill('[data-menu-maestra] [data-campo="codice-maestra"]', cifre)
await B.tocca('[data-menu-maestra] [data-azione="codice-maestra"]')
uguale('senza lezione non c\'è un nome da cambiare', await b.locator('[data-menu-maestra] [data-azione="cambia-nome"]').count(), 0)
await B.tocca('[data-menu-maestra] [data-azione="esci"]')
await schermata(b, 'codice')
controlla('«Torna all\'inizio» riporta al codice della lezione', true)

controlla('nessun errore nelle pagine', veri().length === 0, veri().join(' | '))
nota('il codice di oggi: ' + cifre)
await browser.close()
riassunto('la scuola senza internet')
