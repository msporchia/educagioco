/* La fila di Passo passo col dito vero: il + di una scatola che c'è già, il
   posto acceso, una carta trascinata dentro e fuori, una scatola intera, una
   carta lasciata fuori dalla fila che torna indietro. Il trascinamento è un
   tocco vero (CDP): un `page.click()` non porta i pointer del dito
   (docs/core/il-dito.md). Vedi docs/passo-passo/zaino.md.
   perché: la fila di Passo passo trascinata col dito vero: il + di una scatola, il posto acceso, una carta dentro e fuori, una scatola intera, la carta lasciata fuori che torna indietro
   a parte perché: POTREBBE stare dentro passo-passo (stessa tappa, stessa fila): sta a parte per il trascinamento CDP; passo-passo la compone toccando i tasti e non prova il gesto
   `node test/esegui.mjs passo-passo-fila` */
import { apriBrowser, apriGioco, attendi, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { hash: 'passo=corridoio-storto', attesa: '.pp-campo' })
await attendi(page, 500)

const cdp = await page.context().newCDPSession(page)
const centro = async sel => { const r = await page.locator(sel).first().boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } }
const trascina = async (da, a, { aMeta } = {}) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [da] })
  await attendi(page, 40)
  for (let i = 1; i <= 6; i++) {
    const p = { x: da.x + (a.x - da.x) * i / 6, y: da.y + (a.y - da.y) * i / 6 }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [p] })
    await attendi(page, 30)
    if (i === 5 && aMeta) await aMeta()
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await attendi(page, 120)
}
const programma = () => page.evaluate(() => [...document.querySelectorAll('[data-tessera],[data-testa]')]
  .map(e => e.dataset.mossa || 'testa'))
const nellaScatola = i => page.locator(`[data-scatola="${i}"] [data-tessera]`).count()

/* ── una scatola, e il suo + ── */
await page.locator('[data-carta="ripeti"]').click()
await page.locator('[data-volte-scegli="casa"]').click()
uguale('la scatola nuova ha il suo +', await page.locator('[data-bocca]').count(), 1)
controlla('acceso: la prossima carta entra lì', await page.locator('[data-bocca].pp-qui').count() === 1)
controlla('e la scatola si accende con lui', await page.locator('[data-scatola="0"].pp-qui').count() === 1)
await page.locator('[data-freccia="destra"]').click()
uguale('la freccia è entrata', await nellaScatola(0), 1)

/* fuori dalla scatola: il primo posto libero ha il suo + */
await page.locator('[data-libero]').first().click()
controlla('toccato il posto fuori, la scatola si spegne', await page.locator('[data-scatola="0"].pp-qui').count() === 0)
controlla('e il posto si accende', await page.locator('[data-libero].pp-qui').count() === 1)
await page.locator('[data-freccia="giu"]').click()
uguale('la carta sta fuori', await nellaScatola(0), 1)
await scatto(page, 'passo-fila-posti')

/* tornare in una scatola che c'è già: il suo + */
await page.locator('[data-bocca]').click()
controlla('il + riporta dentro', await page.locator('[data-bocca].pp-qui').count() === 1)
await page.locator('[data-freccia="su"]').click()
uguale('e la carta nuova entra nella scatola di prima', await nellaScatola(0), 2)

/* ── trascinare: fuori → dentro ── */
const giu = '[data-mossa="giu"]'
let visto = {}
await trascina(await centro(giu), await centro('[data-bocca]'), {
  aMeta: async () => {
    visto = await page.evaluate(() => {
      const p = document.querySelector('[data-pupazzo]')
      return { copia: p.children.length, data: p.querySelectorAll('[data-tessera]').length,
               sbiadita: !!document.querySelector('[data-mossa="giu"].pp-presa'),
               qui: !!document.querySelector('[data-bocca].pp-qui') }
    })
    await scatto(page, 'passo-fila-al-dito')
  },
})
controlla('al dito c\'è una copia, senza i suoi bersagli', visto.copia === 1 && visto.data === 0, JSON.stringify(visto))
controlla('la carta vera è sbiadita, e il + dice dove cade', visto.sbiadita && visto.qui, JSON.stringify(visto))
uguale('la carta è dentro la scatola', await nellaScatola(0), 3)
uguale('e al dito non resta niente', await page.locator('[data-pupazzo] > *').count(), 0)

/* ── dentro → fuori ── */
await trascina(await centro('[data-mossa="destra"]'), await centro('[data-libero]'))
uguale('trascinata sul posto libero esce', await nellaScatola(0), 2)
uguale('ed è l\'ultima della fila', (await programma()).at(-1), 'destra')

/* ── lasciata fuori dalla fila torna al suo posto ── */
const prima = await programma()
const su = await centro('[data-mossa="su"]')
await trascina(su, { x: su.x, y: su.y - 300 })
uguale('lasciata sulla mappa non cambia niente', JSON.stringify(await programma()), JSON.stringify(prima))

/* ── una scatola intera, presa dalla testa ── */
await trascina(await centro('[data-testa]'), await centro('[data-libero]'))
uguale('la scatola va in fondo con quello che ha dentro', (await programma()).join(), 'destra,testa,su,giu')

/* ── un tocco resta un tocco ── */
await page.locator('[data-mossa="destra"]').click()
uguale('toccare una carta sposta il cursore e non la carta', (await programma()).join(), 'destra,testa,su,giu')
const t = await centro('[data-testa]')
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [t] })
await attendi(page, 50)
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
await attendi(page, 150)
uguale('toccare la testa riapre la scelta', await page.locator('[data-scelta-volte]').count(), 1)

uguale('nessun errore', errori.join(' | '), '')
await browser.close()
riassunto('passo passo, la fila col dito')
