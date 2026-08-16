/* ═══════════════════════════════════════════════════════════════════
   LA FATTORIA, TOCCATA COL DITO

   Il test unitario dice che comprare un pezzo di terra funziona; questo
   dice che **il dito ci arriva**. È la differenza che ha fatto sembrare
   il gioco a posto sul computer e rotto sul telefono, e la ragione per
   cui esiste questo file: alzato il dito il browser manda anche un
   `click`, e lo manda a chi sta sotto il dito *in quel momento* — cioè
   al velo del pannello appena aperto, che si chiudeva da sé. Col mouse
   non succede, perché lì il bersaglio del click si decide alla
   pressione.

   Per vederlo, i tocchi si mandano davvero come tocchi
   (`Input.dispatchTouchEvent` via CDP): un `page.click()` non avrebbe
   mai mostrato niente, perché non porta con sé nessun fantasma e non
   deriva di un pixel.
   `node test/esegui.mjs fattoria`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, scatto, attendi }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* ---------- 1. si entra dalla home ---------- */
const vecchio = await leggiProfilo(page)
await semina(page, {
  coins: 3000,
  settings: { ...((vecchio || {}).settings || {}), sperimentali: true },
})

const carta = page.locator('.carta.gioco[data-gioco="fattoria"]')
controlla('la carta della fattoria è in home coi giochi in prova accesi',
          await carta.count() === 1)
await carta.click()
await page.waitForSelector('.fa-tela', { timeout: 5000 })
await attendi(page, 500)

/* ---------- il dito ----------
   Un tocco vero: appoggia, striscia di quel poco che striscia sempre un
   dito appoggiato, alza. `scarto` è in pixel **per lato**: 0 è il dito
   di un robot, 7 è quello di un bambino che preme forte. */
const cdp = await page.context().newCDPSession(page)

async function dito(x, y, scarto = 0, tieni = 60) {
  await cdp.send('Input.dispatchTouchEvent',
                 { type: 'touchStart', touchPoints: [{ x, y }] })
  for (const q of scarto ? [0.35, 0.7, 1] : []) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x + scarto * q, y: y + scarto * q }],
    })
  }
  await attendi(page, tieni)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await attendi(page, 220)      // il click fantasma arriva qui dentro
}

const foglio = () => page.evaluate(
  () => ((document.querySelector('.fa-foglio') || {}).innerText || '').split('\n')[0])
const cartelloAperto = async () => (await foglio()) === 'Un altro pezzo di terra'

async function chiudi() {
  if (await page.locator('.fa-velo').count()) {
    await page.locator('.fa-velo').click({ position: { x: 5, y: 5 } })
    await attendi(page, 200)
  }
}

/* ---------- 2. dove sta un pezzo di terra da comprare ----------
   Non si calcola: si cerca. La vista dipende da quanto è grande lo
   schermo, e un numero scritto a mano qui dentro sarebbe vero su un
   telefono solo. */
const box = await page.locator('.fa-tela').boundingBox()
let punto = null
for (let y = box.y + 16; y < box.y + box.height - 16 && !punto; y += 30)
  for (let x = box.x + 20; x < box.x + box.width - 20 && !punto; x += 60) {
    await dito(Math.round(x), Math.round(y))
    if (await cartelloAperto()) punto = { x: Math.round(x), y: Math.round(y) }
    await chiudi()
  }

controlla('col dito si arriva a un pezzo di terra da comprare', !!punto)
if (!punto) {
  nota('senza un punto buono il resto non si può provare')
  await scatto(page, 'fattoria-niente-terra')
  riassunto('La fattoria col dito')
  await browser.close()
  process.exit(1)
}
nota(`il pezzo di terra si tocca a ${punto.x},${punto.y}`)

/* ---------- 3. il cartello resta aperto ----------
   Il guasto vero non era che il cartello non si aprisse: era che si
   apriva e si richiudeva nello stesso istante, mangiato dal click che
   il dito si lascia dietro. Mezzo secondo dopo deve essere ancora lì. */
await dito(punto.x, punto.y)
await attendi(page, 500)
controlla('il cartello della terra resta aperto dopo che il dito si è alzato',
          await cartelloAperto())
await scatto(page, 'fattoria-cartello')
await chiudi()

/* ---------- 4. e resta aperto anche se il dito deriva ----------
   Un dito appoggiato non sta fermo come un mouse. Sette pixel per lato
   sono ancora «fermo» per Android e per iOS: il gioco non può essere
   più severo del telefono su cui gira. */
for (const scarto of [2, 4, 7]) {
  await dito(punto.x, punto.y, scarto)
  const ok = await cartelloAperto()
  controlla(`il tocco che deriva di ${scarto}px per lato apre il cartello lo stesso`, ok)
  if (!ok) await scatto(page, `fattoria-deriva-${scarto}`)
  await chiudi()
}

/* ---------- 5. si compra davvero ---------- */
const primaDelleMonete = await page.evaluate(
  () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
await dito(punto.x, punto.y)
controlla('il cartello è aperto e si può comprare', await cartelloAperto())
await page.locator('.fa-foglio button', { hasText: 'Compra' }).click()
await attendi(page, 400)
const dopoLeMonete = await page.evaluate(
  () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
controlla('comprando la terra le monete calano', dopoLeMonete < primaDelleMonete)
nota(`terra pagata ${primaDelleMonete - dopoLeMonete} monete`)
uguale('il pezzo comprato non è più in vendita', await cartelloAperto(), false)

/* ---------- 6. il baule, e il fantasma che non deve premere niente ----------
   Tenendo premuto in mezzo al prato si apre il baule, e il foglio del
   baule compare **proprio sotto il dito**: se il click fantasma
   arrivasse fin lì, comprerebbe da solo la prima cosa che trova. */
const mezzo = { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) }
const primaDelBaule = await page.evaluate(
  () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
await dito(mezzo.x, mezzo.y, 0, 700)      // 700 ms: la pressione lunga
await attendi(page, 400)
controlla('tenendo premuto sul prato si apre il baule',
          await page.locator('.fa-voce').count() > 0)
await scatto(page, 'fattoria-baule')
const dopoIlBaule = await page.evaluate(
  () => Number((document.body.innerText.match(/🪙\s*(\d+)/) || [])[1]))
uguale('aprire il baule non compra niente da solo', dopoIlBaule, primaDelBaule)
await chiudi()

uguale('nessun errore in console', errori.length ? errori.join(' | ') : '', '')
riassunto('La fattoria col dito')
await browser.close()
