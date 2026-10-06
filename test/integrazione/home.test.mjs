/* La home col dito vero (docs/core/home.md): una strisciata sposta il
   carosello e non apre niente, un tocco sulla copertina in mezzo apre il
   gioco, e al ritorno ci sono «riprendi da qui» e il carosello fermo dove
   era. Il dito passa da CDP: un page.click() non trascina e non lascia
   dietro il click del dito (docs/core/il-dito.md). */
import { apriBrowser, apriGioco, attendi } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const cdp = await page.context().newCDPSession(page)

const tocco = async (x, y) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await attendi(page, 400)
}
const striscia = async (x, y, dx) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  for (let i = 1; i <= 8; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * i / 8, y }] })
    await attendi(page, 30)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await attendi(page, 500)
}
const inMezzo = () => page.evaluate(() => document.querySelector('.carta.gioco.davanti')?.dataset.gioco || null)
const centroDi = async sel => {
  const b = await page.locator(sel).boundingBox()
  return [Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 3)]
}

/* ── un bambino nuovo: niente da riprendere, un'icona per ogni copertina ── */
uguale('senza partite non c’è «riprendi da qui»', await page.locator('[data-riprendi]').count(), 0)
const copertine = await page.locator('.carta.gioco').count()
controlla('in home ci sono le copertine', copertine > 3, `${copertine}`)
uguale('l’indice ha un’icona per copertina', await page.locator('[data-indice]').count(), copertine)

/* ── la strisciata sposta e non apre ── */
const primo = await inMezzo()
await page.locator('.carta.gioco.davanti').scrollIntoViewIfNeeded()
const [cx, cy] = await centroDi('.carta.gioco.davanti')
await striscia(cx + 60, cy, -170)
const dopo = await inMezzo()
controlla('strisciando a sinistra la copertina in mezzo cambia', dopo && dopo !== primo, `${primo} → ${dopo}`)
uguale('e nessun gioco si è aperto', await page.locator('.carte').count(), 1)

/* ── un tocco su una vicina la porta in mezzo, senza aprirla ── */
const posto = () => page.evaluate(() => [...document.querySelectorAll('.carta.gioco')]
  .findIndex(c => c.classList.contains('davanti')))
const prima = await posto()
const [vx, vy] = await centroDi('.carta.gioco.davanti')
await tocco(vx - 130, vy)
uguale('toccando la vicina di sinistra va in mezzo lei', await posto(), prima - 1)
uguale('e anche lei non si apre', await page.locator('.carte').count(), 1)

/* ── l'indice ── */
const ultimaIcona = page.locator('[data-indice]').last()
const chiave = await ultimaIcona.getAttribute('data-indice')
await ultimaIcona.scrollIntoViewIfNeeded()
const [ix, iy] = await centroDi('[data-indice]:last-child')
await tocco(ix, iy)
uguale('toccando un’icona dell’indice la sua copertina va in mezzo', await inMezzo(), chiave)

/* ── il tocco in mezzo apre, e al ritorno si riprende da lì ── */
await page.locator('.carta.gioco.davanti').scrollIntoViewIfNeeded()
const [ax, ay] = await centroDi('.carta.gioco.davanti')
await tocco(ax, ay)
uguale('toccando la copertina in mezzo il gioco si apre', await page.locator('.carte').count(), 0)
await attendi(page, 5600)   // sotto i cinque secondi non è una partita (store/sessioni.js)
await page.click('.barra-app button[aria-label="indietro"]')
await page.waitForSelector('.carte', { timeout: 5000 })
uguale('tornati in home, il carosello è ancora sul gioco di prima', await inMezzo(), chiave)
uguale('e in cima c’è «riprendi da qui» col gioco appena giocato',
       await page.locator('[data-riprendi]').getAttribute('data-riprendi'), chiave)
uguale('nell’indice il gioco ha il segno dell’ultimo', await page.locator('[data-indice].ultimo').getAttribute('data-indice'), chiave)
await page.click('[data-riprendi]')
uguale('e «riprendi» lo riapre', await page.locator('.carte').count(), 0)

uguale('nessun errore nella pagina', errori.join(' | '), '')
await browser.close()
riassunto('home')
