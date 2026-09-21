/* ═══════════════════════════════════════════════════════════════════
   L'ALBERO DI UNA MERCE, COL DITO

   L'unità (`unita/albero`) prova che l'albero si compone giusto. Qui si
   prova che **si arrivi alla pagina** dal silo — si preme una merce,
   si preme 🌳 — e che le righe siano quelle, con lo stato che tornano
   dal granaio seminato; poi che il tasto di una riga ambra porti dove
   promette: la riga del telaio che manca apre il baule sul telaio.

   La fattoria si semina col motore vero, a livello 40 e con i tre
   silos, il telaio no: così la stoffa ha una strada aperta ma una
   macchina da comprare, che è la riga più utile da provare.
   `node test/esegui.mjs albero`
   tempo: 40
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, scatto, attendi }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { Fattoria, borsaInfinita } from '../../src/giochi/fattoria/motore/fattoria.js'
import { sogliaDi } from '../../src/giochi/fattoria/dati/livelli.js'
import { CELLE, PRIMA, ULTIMA } from '../../src/giochi/fattoria/dati/mondo.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* ---------- la fattoria seminata ---------- */
const f = new Fattoria({ borsa: borsaInfinita() })
f.speso = sogliaDi(40)
f.reclamaTutto()
const centro = ((PRIMA + ULTIMA + 1) / 2) * CELLE
const posa = id => {
  for (let r = 0; r <= CELLE * 2; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
        const x = Math.round(centro + dx), y = Math.round(centro + dy)
        if (f.posa(id, x, y).ok) return { x, y }
      }
  return null
}
/* la dispensa al centro: è quella che si tocca col dito */
controlla('la dispensa si posa', !!posa('dispensa'))
posa('silo'); posa('silo_bianco'); posa('ovile'); posa('orto')
f.metti('lana', 1)
f.metti('fieno', 2)

const vecchio = await leggiProfilo(page)
await semina(page, {
  ...(vecchio || {}),
  coins: 3000,
  settings: { ...((vecchio || {}).settings || {}), sperimentali: true },
  campagne: { ...((vecchio || {}).campagne || {}),
              fattoria: { tappa: 0, libera: false, stelle: {},
                          cfg: { stato: f.serializza() } } },
})
await page.locator('.carta.gioco[data-gioco="fattoria"]').click()
await page.waitForSelector('.fa-tela', { timeout: 5000 })
await attendi(page, 700)

/* ---------- il dito, e la ricerca della dispensa ---------- */
const cdp = await page.context().newCDPSession(page)
async function dito(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await attendi(page, 260)
}
async function chiudi() {
  if (await page.locator('.fa-velo').count()) {
    await page.locator('.fa-velo').click({ position: { x: 5, y: 5 } })
    await attendi(page, 200)
  }
}
const titolo = () => page.evaluate(
  () => ((document.querySelector('.fa-foglio') || {}).innerText || '').split('\n')[0])

const tela = await page.locator('.fa-tela').boundingBox()
let trovata = false
for (let y = tela.y + 16; y < tela.y + tela.height - 16 && !trovata; y += 20)
  for (let x = tela.x + 16; x < tela.x + tela.width - 16 && !trovata; x += 24) {
    await dito(Math.round(x), Math.round(y))
    if ((await titolo()) === 'Dispensa') trovata = true
    else await chiudi()
  }
controlla('col dito si apre la dispensa', trovata)

/* ---------- dal silo all'albero ---------- */
if (trovata) {
  const stoffa = page.locator('.fa-scomparto', { hasText: 'Stoffa' })
  uguale('nella dispensa c\'è lo scomparto della stoffa', await stoffa.count(), 1)
  await stoffa.click()
  await attendi(page, 200)
  const tasto = page.locator('[data-azione="albero"]')
  uguale('e sotto «chi la usa» c\'è il tasto 🌳', await tasto.count(), 1)
  await tasto.click()
  await attendi(page, 300)

  uguale('si apre l\'albero', await page.locator('[data-albero]').count(), 1)
  uguale('della stoffa', await page.locator('[data-albero]').getAttribute('data-albero-di'), 'stoffa')
  await scatto(page, 'albero-stoffa')

  const riga = id => page.locator(`[data-albero-riga="${id}"]`)
  uguale('la stoffa sta in cima', await riga('stoffa').count(), 1)
  uguale('e manca', await riga('stoffa').getAttribute('data-stato'), 'manca')
  uguale('sotto c\'è la lana', await riga('lana').count(), 1)
  controlla('con uno su due', /ne hai 1/.test(await riga('lana').innerText()))
  uguale('e sotto ancora il foraggio', await riga('foraggio').count(), 1)
  uguale('e in fondo il fieno, che è verde: ne ho due',
         await riga('fieno').getAttribute('data-stato'), 'ok')
  /* le macchine in mezzo */
  const telaio = page.locator('[data-albero-macchina="telaio"]')
  uguale('fra la stoffa e la lana c\'è il telaio', await telaio.count(), 1)
  controlla('che non ho, col prezzo', /non ce l'hai.*🪙/.test(await telaio.innerText()))
  uguale('e l\'ovile, che ho', await page.locator('[data-albero-macchina="ovile"]').count(), 1)

  /* la riga ambra della stoffa porta al baule sul telaio */
  const compra = riga('stoffa').locator('[data-albero-azione="compra"]')
  uguale('la riga della stoffa ha il tasto del baule', await compra.count(), 1)
  await compra.click()
  await attendi(page, 400)
  uguale('l\'albero si è chiuso', await page.locator('[data-albero]').count(), 0)
  const indicata = page.locator('.fa-voce.indicata')
  uguale('e il baule è aperto sulla voce indicata', await indicata.count(), 1)
  controlla('che è il telaio', /Telaio/.test(await indicata.innerText()))
  await scatto(page, 'albero-baule-telaio')
}

nota(`errori in console: ${errori.length}`)
uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('l\'albero di una merce, col dito')
