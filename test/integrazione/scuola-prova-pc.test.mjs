/* ═══════════════════════════════════════════════════════════════════
   LA PROVA DEL COMPUTER DELLA CLASSE (docs/scuola/prova-computer.md)
   perché: «Prova questo computer» nella pagina dei bambini: i dieci giochi veri girano uno dopo l'altro, nessuno resta fermo, e il PC si ricorda quali vanno sgranati
   a parte perché: due minuti e mezzo di giochi che girano, dalla schermata del codice e senza lezione; in `scuola` allungherebbero il giro della maestra e del bambino, che parte dal servizio

   Dalla schermata del codice della pagina dei bambini (`dist-scuola/`, dal
   file): «Prova questo computer», «Avvia la prova», e i dieci giochi veri
   girano uno dopo l'altro coi tempi corti (`__benchmarkCorto`); la soglia
   di B è altissima, così ogni gioco si rifà anche con la grafica sgranata.
   Alla fine: dieci righe, nessun gioco che non parte, il modulo già
   compilato con quale computer è, e il PC che si ricorda i giochi in B. Le
   immagini al secondo di Chrome senza schermo si stampano (`nota`).
   `node test/esegui.mjs scuola-prova-pc`
   tempo: 150
   ═══════════════════════════════════════════════════════════════════ */
import { resolve } from 'node:path'
import { apriBrowser, scatto, RADICE, SCRIVANIA } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const CARTELLA = resolve(RADICE, 'dist-scuola')
const browser = await apriBrowser({ file: resolve(CARTELLA, 'index.html') })
const page = await browser.newPage({ viewport: SCRIVANIA })
const errori = []
page.on('pageerror', e => errori.push('errore JS: ' + e.message))
page.on('console', m => m.type() === 'error' && errori.push('console: ' + m.text()))
await page.addInitScript(() => { window.__benchmarkCorto = true; window.__provaSogliaB = 1000 })
await page.goto('file://' + resolve(CARTELLA, 'index.html'))

await page.click('[data-azione="prova-pc"]')
await page.click('[data-azione="prova-pc-avvia"]')
await page.waitForSelector('[data-prova-pc-corre]', { timeout: 5000 })
await page.waitForSelector('[data-prova-pc-palco] [data-gioco]', { timeout: 20000 })
controlla('i giochi veri girano a tutto schermo', await page.locator('[data-prova-pc-palco] [data-gioco]').count() === 1)
await page.waitForSelector('[data-prova-pc-fine]', { timeout: 140000 })

const d = await page.evaluate(() => window.__provaComputer)
nota(d.giochi.map(g => `${g.id} ${g.a.errore || g.a.fps + ' fps'}${g.b ? ` → B ${g.b.errore || g.b.fps + ' fps'}` : ''}`).join(' | '))
uguale('dieci giochi provati', d.giochi.length, 10)
uguale('nessuno che non parte', d.giochi.filter(g => g.a.errore).map(g => `${g.id}: ${g.a.errore}`).join(', '), '')
controlla('ognuno rifatto con la grafica sgranata', d.giochi.every(g => g.b && !g.b.errore), JSON.stringify(d.giochi.filter(g => !g.b || g.b.errore)))
uguale('il verdetto: una riga per gioco', await page.locator('[data-gioco-provato]').count(), 10)
controlla('la scheda video è detta', /Scheda video: \S/.test(await page.locator('[data-prova-pc-fine] .scheda').innerText()))

// il modulo già compilato: quale computer è, la scheda, una riga per gioco
await page.fill('[data-prova-pc-dove]', 'aula 3, vicino alla finestra')
const href = await page.getAttribute('[data-azione="prova-pc-invia"]', 'href')
const testo = new URLSearchParams(href.split('?')[1]).get('giudizi')
controlla('l\'invio porta il resoconto con quale computer è', /^PROVA DEL COMPUTER DELLA SCUOLA/.test(testo) && /^Quale: aula 3, vicino alla finestra$/m.test(testo) && /^Sotterraneo: /m.test(testo), testo)
controlla('in un invio solo', testo.length <= 3400)

// il PC si ricorda i giochi in B (quelli dove B era meglio di 5 fps), e la pagina torna come prima
const ricordo = await page.evaluate(() => JSON.parse(localStorage.getItem('scuola:pixel') || 'null'))
const attesi = d.giochi.filter(g => g.b && !g.b.errore && g.b.fps >= g.a.fps + 5).map(g => g.id).sort()
uguale('il PC si ricorda i giochi in B', Object.keys(ricordo?.giochi || {}).sort().join(','), attesi.join(','))
await scatto(page, 'scuola-prova-pc')
await page.click('[data-azione="prova-pc-chiudi"]')
controlla('chiusa, si torna al codice coi pixel veri', await page.isVisible('[data-codice]') && await page.evaluate(() => window.devicePixelRatio === 1))

uguale('nessun errore nella pagina', errori.filter(e => !/WebSocket|ERR_|Failed to load resource/.test(e)).join(' | '), '')
await browser.close()
riassunto('la prova del computer della classe')
