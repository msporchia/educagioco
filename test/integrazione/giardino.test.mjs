/* ═══════════════════════════════════════════════════════════════════
   IL GIARDINO — IL GIRO COMPLETO, COL DITO

   Il test unitario prova il motore e la campagna; questo dice che **il
   gioco vero sta in piedi nel browser**: si apre dalla home (è un gioco
   sperimentale, quindi dietro l'interruttore), la mappa apre la prima
   tappa, il campo si dipinge, una carta apre il calcolo a tutto schermo e il
   campo sta fermo, rispondere giusto mette la pianta «in mano», un tocco
   sul campo la pianta davvero e spende i soli. Poi si esce a metà e la
   mappa offre la partita, che si riprende con la pianta ancora lì.

   Le tre cose che da fuori non somigliano a un guasto:
   - **il campo vuoto**: un canvas senza figure non dà nessun errore.
   - **il tempo che scorre durante il conto**: nessun errore, ma il
     bambino perde soli mentre calcola.
   - **la partita ripresa su un altro canvas** (vedi survivors-sosta).
   `node test/esegui.mjs giardino --niente-build`
   tempo: 45
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto, scegli, leggiProfilo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { settings: { eta: 8, sperimentali: true } })

/* ── dalla home alla prima tappa ── */
await scegli(page, 'giardino')
await page.waitForSelector('.gi-mappa', { timeout: 8000 })
controlla('la mappa mostra le nove tappe', await page.locator('[data-tappa]').count() === 9)
controlla('solo la prima è aperta', await page.locator('[data-tappa]:not([disabled])').count() === 1)
await scatto(page, 'giardino-mappa')

await page.locator('[data-tappa="0"]').click()
await page.waitForSelector('.gi-tela', { timeout: 8000 })

/* il campo si dipinge: nel canvas c'è più di un colore */
const colori = () => page.evaluate(() => {
  const c = document.querySelector('.gi-tela')
  if (!c || !c.width) return 0
  const x = c.getContext('2d')
  const visti = new Set()
  for (let i = 0; i < 40; i++)
    for (let j = 0; j < 20; j++) {
      const d = x.getImageData(Math.floor(c.width * (i + 0.5) / 40), Math.floor(c.height * (j + 0.5) / 20), 1, 1).data
      visti.add(`${d[0] >> 4},${d[1] >> 4},${d[2] >> 4}`)
    }
  return visti.size
})
let n = 0
for (let t = 0; t < 40 && n < 4; t++) { await attendi(page, 250); n = await colori() }
controlla('il campo è dipinto (non è un canvas vuoto)', n >= 4, `solo ${n} colori`)
await scatto(page, 'giardino-campo')

const soli = async () => Number((await page.locator('[data-soli] b').innerText()).trim())
controlla('si parte con i soli della tappa', await soli() === 150, String(await soli()))
controlla('le carte della prima tappa sono due (girasole e tiratore)', await page.locator('[data-pianta]').count() === 2)

/* dove cade un tocco sulla cella (c, r) del campo: la tela mostra il mondo per intero, centrato */
async function cella(c, r) {
  const b = await page.locator('.gi-tela').boundingBox()
  const s = Math.min(b.width / 320, b.height / 536)
  const ox = (b.width - 320 * s) / 2, oy = (b.height - 536 * s) / 2
  return { x: b.x + ox + (c * 64 + 32) * s, y: b.y + oy + (r * 64 + 32) * s }
}

/* ── una carta apre il calcolo; il campo sta fermo mentre si calcola ── */
await page.locator('[data-pianta="girasole"]').click()
await page.waitForSelector('.gi .qz-tasto', { timeout: 6000 })
const area = await page.locator('.gi').boundingBox()
const velo = await page.locator('.gi .qz-velo').boundingBox()
controlla('il calcolo prende tutto lo schermo', velo.height >= area.height * 0.95 && velo.width >= area.width * 0.95,
          `velo ${Math.round(velo.width)}×${Math.round(velo.height)} su ${Math.round(area.width)}×${Math.round(area.height)}`)
const resto0 = await page.locator('.gi-resto b').innerText()
await attendi(page, 1500)
uguale('mentre si calcola il campo sta fermo', await page.locator('.gi-hud + .gi-barra i').evaluate(e => e.style.width), '0%')
await scatto(page, 'giardino-calcolo')

/* si risponde finché la pianta è «in mano»: sbagliare non costa niente, quindi a un conto
   sbagliato si riprova col prossimo */
let inMano = false
for (let giro = 0; giro < 12 && !inMano; giro++) {
  if (!(await page.locator('.gi .qz-tasto').count())) {
    await page.locator('[data-pianta="girasole"]').click({ timeout: 4000 }).catch(() => {})
    await page.waitForSelector('.gi .qz-tasto', { timeout: 6000 }).catch(() => {})
  }
  await attendi(page, 450)                           // la finestra cieca del montaggio
  await page.locator('.gi .qz-tasto').nth(giro % 4).click().catch(() => {})
  await attendi(page, 1200)
  await page.waitForSelector('.gi .qz-velo', { state: 'detached', timeout: 12000 }).catch(() => {})
  inMano = await page.locator('.gi-avviso [data-azione="annulla"]').count() === 1
}
controlla('rispondendo giusto la pianta è in mano e chiede dove', inMano)
uguale('i soli non sono ancora stati spesi', await soli(), 150)
await scatto(page, 'giardino-in-mano')

/* ── un tocco sul campo la pianta ── */
const dove = await cella(2, 6)
await page.mouse.click(dove.x, dove.y)
await attendi(page, 500)
controlla('la pianta è in campo e il campo ha ripreso a correre', await page.locator('.gi-avviso').count() === 0)
const dopo = await soli()
controlla('e i soli sono scesi del suo prezzo', dopo <= 100, String(dopo))
controlla('la carta del girasole si ricarica (resta spenta)', await page.locator('[data-pianta="girasole"].gi-spenta').count() === 1)
await scatto(page, 'giardino-piantata')

/* ── uscire a metà non butta via la partita ── */
await attendi(page, 5500)                              // la sosta si scrive da cinque secondi di partita in su
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.gi-mappa', { timeout: 6000 })
let sosta = null
for (let t = 0; t < 20 && !sosta; t++) { await attendi(page, 250); sosta = (await leggiProfilo(page))?.campagne?.giardino?.sosta || null }
controlla('uscendo la sosta si scrive nel profilo', !!sosta)
controlla('e la mappa offre di riprendere', await page.locator('[data-ripresa]').count() === 1)
await scatto(page, 'giardino-ripresa')

await page.locator('[data-azione="riprendi"]').first().click()
await page.waitForSelector('.gi-tela', { timeout: 8000 })
n = 0
for (let t = 0; t < 40 && n < 4; t++) { await attendi(page, 250); n = await colori() }
controlla('il campo ripreso si dipinge sul canvas nuovo', n >= 4, `solo ${n} colori`)
controlla('e la pianta messa prima c\'è ancora (sosta con una pianta, soli non tornati a 150)', (await soli()) < 150)

uguale('nessun errore in console', errori.length, 0)
if (errori.length) nota(errori.slice(0, 3).join(' · '))
await browser.close()
riassunto('giardino (browser)')
