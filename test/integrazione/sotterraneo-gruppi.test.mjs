/* ═══════════════════════════════════════════════════════════════════
   LO SCONTRO A GRUPPI, COL DITO

   (docs/sotterraneo/scontro.md, «La vista»; docs/sotterraneo/scontro-interfaccia.md)
   Uno scontro con più mostri a schermo, aperto da `#sotterraneo=branco`
   (`&mostri=6`, `&grosso=grumo`, `&agguato=1`, `&sorpresa=1`: docs/core/comandi.md):
   - sei mostri a 390 px: tutti dentro il palco, in due file, ognuno con la
     sua barra e il suo «ti colpisce N»; un bersaglio solo; la fila dei turni
     di sette figurine con l'eroe in cima;
   - toccare un mostro lo fa bersaglio (non nei primi 320 ms);
   - un'abilità su tutti (il Grido di guerra) accende tutti col contorno e,
     rispondendo giusto, colpisce tutti; il racconto è un'azione alla volta,
     i mostri colpiscono nell'ordine della fila, la scelta torna solo a
     racconto finito, e un tocco lo accorcia;
   - il mostro grosso sta grande al centro, con gli altri intorno;
   - l'agguato e la sorpresa dicono la loro riga e la fila li racconta;
   - a 320 px il palco non esce dalla finestra (scorre al più la scelta).
   Si tocca come un bambino (`Input.dispatchTouchEvent` via CDP).
   `node test/esegui.mjs sotterraneo-gruppi`
   tempo: 150
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, scendiNelSotterraneo } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'

const TAPPA = 1
const roba = { v: 1, gemme: 0, zaino: ['pozione-piccola', 'pozione'], mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }
// un cavaliere di livello 12 col Grido di guerra: abbastanza vita per un giro contro sei mostri
const crescita = { esp: sogliaDi(12), albero: { grido: 1 }, caselle: ['grido', null, null] }

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
async function toccaIl(sel) {
  const b = await page.locator(sel).first().boundingBox()
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}

// scende nella cripta con lo scontro già aperto (il gioco lo apre da `hash`)
async function entra(hash) {
  await azzera(page)
  await page.setViewportSize({ width: 390, height: 844 })
  const avventura = { tappa: TAPPA, libera: false, stelle: { 0: 3 }, missioni: {}, roba, crescita,
    terra: { nebbia: 'f'.repeat(768), dove: [55, 11], parlato: true } }
  await semina(page, {
    coins: 300, settings: { sperimentali: true },
    campagne: { sotterraneo: { tappa: TAPPA, libera: false, stelle: { 0: 3 },
      cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: avventura } } } },
  })
  await scegli(page, 'sotterraneo')
  await page.waitForSelector('[data-terra]', { timeout: 5000 })
  await page.evaluate(h => { location.hash = h }, 'seme=11&sotterraneo=branco&' + hash)
  await scendiNelSotterraneo(page, TAPPA)
  await page.waitForSelector('[data-duello]', { timeout: 10000 })
}
const finitoIlRacconto = () => page.waitForSelector('[data-duello]:not([data-racconto])', { timeout: 20000 })
const scelta = () => page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 })
const caselle = sel => page.locator(sel).evaluateAll(es => es.map(e => {
  const r = e.getBoundingClientRect()
  return { i: e.dataset.i, x: r.x, y: r.y, w: r.width, h: r.height, b: r.bottom, r: r.right }
}))
const palco = () => page.locator('[data-duello]').boundingBox()
const bersagli = () => page.locator('[data-mostro][data-bersaglio]').evaluateAll(es => es.map(e => e.dataset.i))

/* ---------- 1. sei mostri a 390 px ---------- */
await entra('mostri=6')
await scelta()
{
  const ms = await caselle('[data-mostro]')
  uguale('sei mostri in campo', ms.length, 6)
  const p = await palco()
  controlla('tutti dentro il palco, a destra e in alto e in basso',
            ms.every(m => m.x >= p.x - 1 && m.r <= p.x + p.width + 1 && m.y >= p.y - 1 && m.b <= p.y + p.height + 1),
            JSON.stringify(p))
  const file = new Set(ms.map(m => Math.round(m.b / 10)))
  uguale('in due file', file.size, 2)
  uguale('sotto ognuno la sua barra, senza numeri', await page.locator('[data-mostro] [data-vita]').count(), 6)
  controlla('e nessun numero di vita sul palco', !/\d+ ?\/ ?\d+/.test(await page.locator('[data-duello]').innerText()))
  const minacce = await page.locator('[data-minaccia]').evaluateAll(es => es.map(e => e.textContent.replace(/\s+/g, ' ').trim()))
  controlla('sopra ognuno «ti colpisce N»', minacce.length === 6 && minacce.every(t => /^ti colpisce \d+$/.test(t)), minacce.join(' | '))
  uguale('un bersaglio solo', (await bersagli()).length, 1)
  uguale('ed è il primo, chi ha aperto lo scontro', (await bersagli())[0], '0')
  const fila = await page.locator('[data-fila] [data-turno]').evaluateAll(es => es.map(e => e.dataset.chi))
  uguale('la fila mostra sette turni', fila.length, 7)
  uguale('e comincia dall\'eroe', fila[0], 'eroe')
  const col = await page.locator('[data-fila]').boundingBox()
  controlla('in una colonna sul bordo destro del palco, in sovrimpressione', col.x > p.x + p.width * 0.8 && col.y >= p.y && col.width < 60,
            JSON.stringify(col))
  uguale('l\'eroe a sinistra con il posto del compagno sotto', await page.locator('[data-posto-compagno]').count(), 1)
  controlla('la scelta in basso c\'è: attacco e scappa',
            (await page.locator('[data-caselle-abilita] [data-azione]').evaluateAll(es => es.map(e => e.dataset.azione))).join().includes('attacco'))
  await scatto(page, 'gruppi-sei')
}

/* ---------- 2. toccare un mostro lo fa bersaglio ---------- */
{
  await toccaIl('[data-mostro][data-i="3"]')
  await attendi(page, 200)
  uguale('toccato il quarto è lui il bersaglio', (await bersagli()).join(), '3')
  await toccaIl('[data-mostro][data-i="5"]')
  await attendi(page, 200)
  uguale('e poi il sesto', (await bersagli()).join(), '5')
}

/* ---------- 3. un colpo su tutti, raccontato un'azione alla volta ---------- */
{
  await toccaIl('[data-abilita="grido"]')
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 })
  uguale('il Grido di guerra prepara tutti: tutti col contorno', await page.locator('[data-mostro][data-colpito]').count(), 6)
  const prima = await page.locator('[data-mostro] [data-vita]').evaluateAll(es => es.map(e => Number(e.dataset.ossa)))
  const fila = await page.locator('[data-fila] [data-turno]').evaluateAll(es => es.map(e => e.dataset.chi))
  const attesi = []
  for (const c of fila.slice(1)) { if (c === 'eroe') break; attesi.push(c) }
  nota(`fila ${fila.join(' ')}: dopo di lui colpiscono ${attesi.join(', ') || 'nessuno'}`)
  // chi scatta, nell'ordine in cui compare
  await page.evaluate(() => {
    window.__scatti = []
    new MutationObserver(ms => {
      for (const m of ms) for (const n of m.addedNodes) {
        const f = n.nodeType === 1 && (n.matches('.sot-m-fig.sot-fx-scatta') ? n : n.querySelector && n.querySelector('.sot-m-fig.sot-fx-scatta'))
        if (f) window.__scatti.push(f.closest('[data-mostro]').dataset.i)
      }
    }).observe(document.querySelector('[data-duello]'), { childList: true, subtree: true })
  })
  await attendi(page, 500)
  await page.locator('.sot-domanda .qz-tasto[data-giusta]').first().click()
  await page.waitForSelector('[data-duello][data-racconto]', { timeout: 8000 })
  uguale('a racconto in corso non c\'è la domanda', await page.locator('.sot-domanda').count(), 0)
  uguale('né la scelta è accesa', await page.locator('[data-caselle-abilita][data-pronto]').count(), 0)
  await attendi(page, 350)
  const numeri = await page.locator('[data-cifra]').evaluateAll(es => es.map(e => e.closest('[data-mostro]') ? e.closest('[data-mostro]').dataset.i : 'eroe'))
  controlla('i numeri salgono sui mostri colpiti', numeri.filter(x => x !== 'eroe').length >= 2, numeri.join())
  await scatto(page, 'gruppi-racconto')
  await finitoIlRacconto()
  const dopo = await page.locator('[data-mostro] [data-vita]').evaluateAll(es => es.map(e => Number(e.dataset.ossa)))
  controlla('il Grido ha colpito tutti: la vita di ognuno è scesa (o è caduto)',
            dopo.every((o, i) => o < prima[i]), `${prima.join()} → ${dopo.join()}`)
  const scattati = await page.evaluate(() => window.__scatti)
  const vivi = await page.locator('[data-mostro]:not([data-morto])').count()
  controlla('i mostri hanno colpito uno alla volta', scattati.length >= Math.min(2, attesi.length), scattati.join())
  const distinti = scattati.filter((x, i) => scattati.indexOf(x) === i)
  uguale('nell\'ordine della fila', distinti.join(), attesi.filter(x => distinti.includes(x)).join())
  await scelta()
  uguale('a racconto finito torna la scelta', await page.locator('[data-caselle-abilita][data-pronto]').count(), 1)
  uguale('con lo stesso numero di mostri in piedi di quelli che si vedono', vivi, await page.locator('[data-mostro]:not([data-morto])').count())
  controlla('i colpiti restano al loro posto (niente salti)', (await caselle('[data-mostro]')).length === 6)
}

/* ---------- 4. un tocco accorcia il racconto ---------- */
{
  await toccaIl('[data-azione="attacco"]')
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 })
  await attendi(page, 500)
  await page.locator('.sot-domanda .qz-tasto[data-giusta]').first().click()
  await page.waitForSelector('[data-duello][data-racconto]', { timeout: 8000 })
  const t0 = Date.now()
  await toccaIl('[data-duello]')
  await finitoIlRacconto()
  const ms = Date.now() - t0
  controlla('dopo un tocco il racconto finisce in fretta', ms < 1200, ms + ' ms')
}

/* ---------- 5. il mostro grosso al centro ---------- */
await entra('mostri=5&grosso=grumo')
await scelta()
{
  const ms = await caselle('[data-mostro]')
  const g = (await caselle('[data-mostro][data-grande]'))[0]
  const altri = ms.filter(m => m.i !== g.i)
  uguale('con il grosso, cinque in campo', ms.length, 5)
  controlla('il grosso è più alto di tutti gli altri', altri.every(m => g.h > m.h), `${g.h} contro ${altri.map(m => Math.round(m.h))}`)
  const p = await palco()
  controlla('e sta al centro del palco dei mostri, con gli altri ai lati',
            altri.some(m => m.r <= g.x + g.w / 2) && altri.some(m => m.x >= g.x + g.w / 2),
            `${Math.round(g.x)}..${Math.round(g.r)}`)
  controlla('tutti dentro il palco', ms.every(m => m.x >= p.x - 1 && m.r <= p.x + p.width + 1 && m.y >= p.y - 1 && m.b <= p.y + p.height + 1))
  uguale('con la sua figura', await page.locator('[data-mostro][data-grande] [data-figura-grosso]').count(), 1)
  await scatto(page, 'gruppi-grosso')
}

/* ---------- 6. tre mostri, a 390 e a 320 ---------- */
await entra('mostri=3')
await scelta()
{
  uguale('tre mostri', await page.locator('[data-mostro]').count(), 3)
  uguale('in una fila sola', new Set((await caselle('[data-mostro]')).map(m => Math.round(m.b / 10))).size, 1)
  await scatto(page, 'gruppi-tre')
}
await entra('mostri=6')
await scelta()
{
  await page.setViewportSize({ width: 320, height: 640 })
  await attendi(page, 400)
  const p = await palco()
  const ms = await caselle('[data-mostro]')
  controlla('a 320 px il palco sta nella finestra', p.x >= 0 && p.x + p.width <= 320, JSON.stringify(p))
  controlla('e i sei mostri nel palco', ms.every(m => m.x >= p.x - 1 && m.r <= p.x + p.width + 1), JSON.stringify(ms.map(m => [Math.round(m.x), Math.round(m.r)])))
  uguale('la pagina non scorre di lato', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  // scorre al più la scelta: il palco resta dov'è
  const prima = (await palco()).y
  await page.evaluate(() => { const m = document.querySelector('.sot-modale-cornice'); if (m) m.scrollTop = 500 })
  await attendi(page, 150)
  controlla('il palco non scorre via con la scelta', Math.abs((await palco()).y - prima) < 3, `${prima} → ${(await palco()).y}`)
  await scatto(page, 'gruppi-sei-320')
}

/* ---------- 7. l'agguato e la sorpresa ---------- */
await entra('mostri=3&agguato=1')
{
  await page.waitForSelector('[data-apertura]', { timeout: 3000 })
  uguale('l\'agguato lo dice', (await page.locator('[data-apertura]').innerText()).trim(), 'Alle spalle!')
  await page.waitForSelector('.sot-attore-eroe .sot-numero-preso', { timeout: 3000 })   // chi arriva alle spalle colpisce per primo
  await scatto(page, 'gruppi-agguato')
  await finitoIlRacconto()
  uguale('la riga poi sparisce', await page.locator('[data-apertura]').count(), 0)
}
await entra('mostri=2&sorpresa=1')
{
  await page.waitForSelector('[data-apertura]', { timeout: 3000 })
  controlla('la sorpresa lo dice', /sorpres/i.test(await page.locator('[data-apertura]').innerText()))
  const fila = await page.locator('[data-fila] [data-turno]').evaluateAll(es => es.map(e => e.dataset.chi))
  uguale('e il suo primo turno arriva prima di tutto: l\'eroe due volte di fila', fila.slice(0, 2).join(), 'eroe,eroe')
  await finitoIlRacconto()
}

uguale('nessun errore in pagina', errori.length, 0)
if (errori.length) console.log(errori)
await browser.close()
riassunto('lo scontro a gruppi, col dito')
