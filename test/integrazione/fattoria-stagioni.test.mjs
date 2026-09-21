/* ═══════════════════════════════════════════════════════════════════
   LA FATTORIA NELLE FESTE, A SCHERMO

   Quello che `unita/stagioni-fattoria` non può dire: che a Natale si
   **vede** nevicare, che a Halloween le zucche stanno sul prato e che
   il baule apre la linguetta delle feste. Si entra col cheat
   `#stagione=natale|halloween` (`Gioco.vue`), che accende una stagione
   fuori dal suo periodo — se no questo file girerebbe verde undici
   mesi l'anno senza provare niente.

   Le foto sono per un occhio umano (`--scatti`): un test non guarda i
   pixel, quindi qui si controlla quello che si può leggere dal DOM —
   il baule — e si lascia allo scatto la neve e le zucche.
   `node test/esegui.mjs fattoria-stagioni --scatti`
   tempo: 30
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, scatto, attendi }
  from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { Fattoria, borsaInfinita } from '../../src/giochi/fattoria/motore/fattoria.js'
import { sogliaDi, ULTIMO } from '../../src/giochi/fattoria/dati/livelli.js'
import { CELLE, PRIMA, ULTIMA } from '../../src/giochi/fattoria/dati/mondo.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* Una fattoria con delle case in mezzo, così c'è un tetto su cui
   nevicare e una parete per le ragnatele: si costruisce col motore
   vero e si semina nel profilo, come fa `integrazione/fattoria` per il
   mercato. */
const f = new Fattoria({ borsa: borsaInfinita() })
f.speso = sogliaDi(ULTIMO)      // le case arrivano tardi, e qui servono dei tetti
f.reclamaTutto()
const centro = ((PRIMA + ULTIMA + 1) / 2) * CELLE
const posa = (id, dx, dy) => {
  for (let r = 0; r <= CELLE * 2; r++)
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      if (Math.max(Math.abs(x), Math.abs(y)) !== r) continue
      if (f.posa(id, Math.round(centro + dx + x), Math.round(centro + dy + y)).ok) return true
    }
  return false
}
controlla('una casa si posa nella fattoria seminata', posa('casa', -6, -3))
posa('fienile', 3, -2); posa('albero', -2, 4); posa('silo', 5, 4)

const vecchio = await leggiProfilo(page)
await semina(page, {
  ...(vecchio || {}),
  coins: 500,
  settings: { ...((vecchio || {}).settings || {}), sperimentali: true },
  campagne: { ...((vecchio || {}).campagne || {}),
              fattoria: { tappa: 0, libera: false, stelle: {}, cfg: { stato: f.serializza() } } },
})

async function entra(stagione) {
  await page.evaluate(s => { location.hash = 'stagione=' + s }, stagione)
  await page.locator('.carta.gioco[data-gioco="fattoria"]').click()
  await page.waitForSelector('.fa-tela', { timeout: 5000 })
  await attendi(page, 1200)       // la lista stagionale si rifà nel primo battito
}
async function esci() {
  if (await page.locator('.fa-velo').count()) {
    await page.locator('.fa-velo').click({ position: { x: 5, y: 5 } })
    await attendi(page, 200)
  }
  await page.locator('button[aria-label="indietro"]').click()
  await page.waitForSelector('.carte', { timeout: 5000 })
  await attendi(page, 300)
}
const linguettaFeste = () => page.locator('.fa-scheda', { hasText: 'Feste' })
const voci = () => page.locator('.fa-voce').allInnerTexts()

/* ---------- Natale ---------- */
await entra('natale')
await scatto(page, 'fattoria-natale')
await page.locator('[data-baule="bello"]').click()
await page.waitForSelector('.fa-voce', { timeout: 3000 })
uguale('a Natale il baule ha la linguetta delle feste', await linguettaFeste().count(), 1)
await linguettaFeste().click()
await attendi(page, 200)
const natalizie = await voci()
controlla('e dentro c\'è l\'albero con le lucine', natalizie.some(t => /lucine/i.test(t)),
          natalizie.join(' · '))
controlla('ma non le zucche di Halloween', !natalizie.some(t => /halloween/i.test(t)))
await scatto(page, 'fattoria-natale-baule')
await esci()

/* ---------- Halloween ---------- */
await entra('halloween')
await scatto(page, 'fattoria-halloween')
await page.locator('[data-baule="bello"]').click()
await page.waitForSelector('.fa-voce', { timeout: 3000 })
await linguettaFeste().click()
await attendi(page, 200)
const zucche = await voci()
controlla('a Halloween ci sono le zucche', zucche.some(t => /zucche/i.test(t)), zucche.join(' · '))
controlla('e non l\'albero di Natale', !zucche.some(t => /lucine/i.test(t)))
await esci()

/* ---------- un giorno qualunque ----------
   Senza cheat oggi non è (quasi mai) festa: la linguetta non c'è. Se
   il test gira davvero a Natale, la linguetta c'è ed è giusto così. */
await page.locator('.carta.gioco[data-gioco="fattoria"]').click()
await page.waitForSelector('.fa-tela', { timeout: 5000 })
await attendi(page, 800)
await page.locator('[data-baule="bello"]').click()
await page.waitForSelector('.fa-voce', { timeout: 3000 })
const oggi = new Date(), m = oggi.getMonth() + 1, d = oggi.getDate()
const festa = (m === 10 && d >= 20) || (m === 11 && d <= 2) || (m === 12 && d >= 6) || (m === 1 && d <= 6)
uguale(festa ? 'oggi è festa e la linguetta c\'è' : 'un giorno qualunque non ha la linguetta',
       await linguettaFeste().count(), festa ? 1 : 0)

uguale('nessun errore in console', errori.length ? errori.join(' | ') : '', '')
riassunto('La fattoria nelle feste')
await browser.close()
