/* ═══════════════════════════════════════════════════════════════════
   LA PROVA DEL COMPUTER DELLA CLASSE (docs/scuola/prova-computer.md)
   perché: «Prova questo computer» nella pagina dei bambini: i dieci giochi veri girano uno dopo l'altro, nessuno resta fermo, e il PC si ricorda quali vanno sgranati
   a parte perché: due minuti e mezzo di giochi che girano, dalla schermata del codice e senza lezione; in `scuola` allungherebbero il giro della maestra e del bambino, che parte dal servizio

   La pagina della maestra ha il link; la pagina dei bambini (`dist-scuola/`,
   dal file) non mostra la prova, e col link (`#prova-computer`) si apre su
   di lei: «Avvia la prova», e i dieci giochi veri girano uno dopo l'altro
   coi tempi corti (`__benchmarkCorto`), cinque anche al massimo; la soglia
   di B è altissima, così ogni scena si rifà anche con la grafica sgranata.
   Alla fine: dieci righe, nessun gioco che non parte, il modulo già
   compilato con quale computer è, e il PC che si ricorda i giochi in B. Le
   immagini al secondo di Chrome senza schermo si stampano (`nota`).
   `node test/esegui.mjs scuola-prova-pc`
   tempo: 260
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
// le scene al massimo in foto (`--scatti`): si guarda che siano davvero piene
for (const [nome, foto] of [['Il castello, al massimo', 'castello'], ['Castle Battle, al massimo', 'castle-battle'], ['Survivors, al massimo', 'survivors'],
                            ['Asteroidi, al massimo', 'asteroidi'], ['Sotterraneo, al massimo', 'sotterraneo']]) {
  await page.waitForFunction(n => (document.querySelector('[data-prova-pc-corre]')?.innerText || '').includes(n), nome, { timeout: 120000 }).catch(() => {})
  await page.waitForTimeout(1200)
  await scatto(page, `scuola-prova-pc-massimo-${foto}`)
}
await page.waitForSelector('[data-prova-pc-fine]', { timeout: 240000 })

const d = await page.evaluate(() => window.__provaComputer)
const mis = x => (x ? x.errore || x.fps + ' fps' : '-')
nota(d.giochi.map(g => `${g.id} ${g.scene.map(s => `${s.tipo} ${mis(s.a)} → B ${mis(s.b)}`).join(', ')}`).join(' | '))
uguale('dieci giochi provati', d.giochi.length, 10)
uguale('cinque anche al massimo', d.giochi.filter(g => g.scene.some(s => s.tipo === 'massimo')).map(g => g.id).join(','), 'castello,castle-battle,survivors,asteroidi,sotterraneo')
const scene = d.giochi.flatMap(g => g.scene.map(s => ({ id: `${g.id} ${s.tipo}`, ...s })))
uguale('nessuna scena che non parte', scene.filter(s => s.a.errore).map(s => `${s.id}: ${s.a.errore}`).join(', '), '')
controlla('ognuna rifatta con la grafica sgranata', scene.every(s => s.b && !s.b.errore), JSON.stringify(scene.filter(s => !s.b || s.b.errore)))
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
const peggiore = g => g.scene.reduce((x, y) => (y.a.fps < x.a.fps ? y : x))
const attesi = d.giochi.filter(g => { const p = peggiore(g); return p.b && !p.b.errore && p.b.fps >= p.a.fps + 5 }).map(g => g.id).sort()
uguale('il PC si ricorda i giochi in B', Object.keys(ricordo?.giochi || {}).sort().join(','), attesi.join(','))
await scatto(page, 'scuola-prova-pc')
await page.click('[data-azione="prova-pc-chiudi"]')
controlla('chiusa, si torna al codice coi pixel veri', await page.isVisible('[data-codice]') && await page.evaluate(() => window.devicePixelRatio === 1))

uguale('nessun errore nella pagina', errori.filter(e => !/WebSocket|ERR_|Failed to load resource/.test(e)).join(' | '), '')
await browser.close()
riassunto('la prova del computer della classe')
