/* ═══════════════════════════════════════════════════════════════════
   LA PROVA DEL COMPUTER DELLA CLASSE (docs/scuola/prova-computer.md)
   perché: la prova del computer dal link della maestra: i dieci giochi veri si giocano uno dopo l'altro con la loro regia, nessuno resta fermo, e il PC si ricorda quali vanno sgranati
   a parte perché: un minuto di giochi giocati, dal link e senza lezione; in `scuola` allungherebbero il giro della maestra e del bambino, che parte dal servizio

   La pagina della maestra ha il link; la pagina dei bambini (`dist-scuola/`,
   dal file) non mostra la prova, e col link (`#prova-computer`) si apre su
   di lei: «Avvia la prova», e i dieci giochi veri si giocano uno dopo
   l'altro, ognuno con la sua regia, coi tempi corti (`__benchmarkCorto`); la
   soglia di B è altissima, così ogni gioco si rifà anche sgranato.
   Alla fine: dieci righe, nessun gioco che non parte, il modulo già
   compilato con quale computer è, e il PC che si ricorda i giochi in B. Le
   immagini al secondo di Chrome senza schermo si stampano (`nota`).
   `node test/esegui.mjs scuola-prova-pc`
   tempo: 260
   ═══════════════════════════════════════════════════════════════════ */
import { resolve } from 'node:path'
import { apriBrowser, scatto, RADICE, SCRIVANIA } from '../aiuto/browser.mjs'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'
import { seminaQuaderno } from '../aiuto/quaderno-scuola.mjs'

const CARTELLA = resolve(RADICE, 'dist-scuola')
const browser = await apriBrowser({ file: resolve(CARTELLA, 'index.html') })
const page = await browser.newPage({ viewport: SCRIVANIA })
const errori = []
page.on('pageerror', e => errori.push('errore JS: ' + e.message))
page.on('console', m => m.type() === 'error' && errori.push('console: ' + m.text()))
await page.addInitScript(() => { window.__benchmarkCorto = true; window.__provaSogliaB = 1000 })
await seminaQuaderno(page)        // il link della prova sta nella pagina intera, dopo i primi passi
await page.goto('file://' + resolve(CARTELLA, 'maestra.html'))
const link = await page.getAttribute('[data-azione="prova-computer"]', 'href').catch(() => null)
controlla('la pagina della maestra ha il link della prova', /#prova-computer$/.test(link || ''), link)
await page.goto('file://' + resolve(CARTELLA, 'index.html'))
await page.waitForSelector('[data-codice]')
uguale('ai bambini la prova non si mostra', await page.locator('[data-prova-pc]').count(), 0)
await page.goto('file://' + resolve(CARTELLA, 'index.html') + '#prova-computer')
await page.reload()
await page.click('[data-azione="prova-pc-avvia"]')
await page.waitForSelector('[data-prova-pc-corre]', { timeout: 5000 })
controlla('in cima: non toccare niente, e quanto manca', /non toccare niente/.test(await page.locator('[data-prova-pc-corre]').innerText()) &&
          /mancano circa \d+:\d\d|quasi finito/.test(await page.locator('[data-prova-pc-manca]').innerText()))
await page.waitForSelector('[data-prova-pc-palco] [data-gioco]', { timeout: 20000 })
controlla('i giochi veri girano a tutto schermo', await page.locator('[data-prova-pc-palco] [data-gioco]').count() === 1)
// ogni gioco in foto mentre la regia lo gioca (`--scatti`): si guarda che faccia davvero qualcosa
for (const g of ['English', 'Passo passo', 'Robot', 'Il castello', 'Castle Battle', 'Survivors', 'Asteroidi', 'Pozioni', 'Cucina', 'Sotterraneo']) {
  await page.waitForFunction(n => (document.querySelector('[data-prova-pc-corre]')?.innerText || '').includes(': ' + n), g, { timeout: 60000 }).catch(() => {})
  await page.waitForTimeout(900)
  await scatto(page, `scuola-prova-pc-${g.toLowerCase().replace(/\W+/g, '-')}`)
}
await page.waitForSelector('[data-prova-pc-fine]', { timeout: 240000 })

const d = await page.evaluate(() => window.__provaComputer)
const mis = x => (x ? x.errore || x.fps + ' fps' : '-')
nota(d.giochi.map(g => `${g.id} ${mis(g.a)}${g.a.risposta ? ` tocco ${g.a.risposta.mediana} ms` : ''} → B ${mis(g.b)}`).join(' | '))
uguale('dieci giochi provati, una scena ciascuno', d.giochi.length, 10)
uguale('nessuno che non parte', d.giochi.filter(g => g.a.errore).map(g => `${g.id}: ${g.a.errore}`).join(', '), '')
controlla('ognuno rifatto con la grafica sgranata', d.giochi.every(g => g.b && !g.b.errore), JSON.stringify(d.giochi.filter(g => !g.b || g.b.errore)))
// la regia gioca: nei giochi coi tocchi la risposta è misurata
stessaLista('giocati davvero: i tocchi misurati', ['inglese', 'passo-passo', 'robot', 'castello', 'survivors', 'asteroidi'].filter(id => !d.giochi.find(g => g.id === id).a.risposta), [])
uguale('il verdetto: una riga per gioco', await page.locator('[data-gioco-provato]').count(), 10)
controlla('la scheda video è detta', /Scheda video: \S/.test(await page.locator('[data-prova-pc-fine] .scheda').innerText()))

// il modulo già compilato: quale computer è, la scheda, una riga per gioco
await page.fill('[data-prova-pc-dove]', 'aula 3, vicino alla finestra')
const href = await page.getAttribute('[data-azione="prova-pc-invia"]', 'href')
const testo = new URLSearchParams(href.split('?')[1]).get('giudizi')
controlla('l\'invio porta il resoconto con quale computer è', /^PROVA DEL COMPUTER DELLA SCUOLA/.test(testo) && /^Quale: aula 3, vicino alla finestra$/m.test(testo) && /^Sotterraneo: /m.test(testo), testo)
controlla('in un invio solo', testo.length <= 3400)
controlla('e si vede cosa parte: il modulo sembra vuoto', /è normale/.test(await page.locator('[data-prova-pc-spiega-invio]').innerText()) &&
          /^PROVA DEL COMPUTER DELLA SCUOLA/.test(await page.locator('[data-prova-pc-cosa-parte] pre').textContent()))

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
