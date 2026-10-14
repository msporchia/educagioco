/* ═══════════════════════════════════════════════════════════════════
   COME CADE UN MOSTRO

   (docs/sotterraneo/scontro-interfaccia.md, «La caduta»; docs/core/creature.md, `morte`)
   Chi cade nello scontro non svanisce in piedi: prende il suo pezzo a terra (`<nome>-morto-0`), un attimo dopo, se ce n'è un secondo, i
   resti (`<nome>-morto-1`), e solo dopo svanisce. Lo zombie ha un pezzo solo, la mummia due, il grosso nessuno (svanisce com'era).
   Un osservatore dentro la pagina registra quello che compare: il racconto dura poco e le foto sotto carico sono lente.
   `node test/esegui.mjs sotterraneo-caduta`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scegli, scendiNelSotterraneo, attendi, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'

const TAPPA = 0
const roba = { v: 1, gemme: 0, zaino: ['pozione-piccola', 'pozione'], mano: 'spada', mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }
const crescita = { v: 2, esp: sogliaDi(20), forza: 6, destrezza: 0, intelligenza: 0, tempra: 6, albero: {}, caselle: [null, null, null] }

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const cdp = await page.context().newCDPSession(page)
async function toccaIl(sel) {
  const b = await page.locator(sel).first().boundingBox()
  const x = b.x + b.width / 2, y = b.y + b.height / 2
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

async function entra(hash) {
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
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

// attacca finché il mostro cade, e dice cosa si è visto a terra
async function abbatti(tipo) {
  await entra(`mostri=1&tipo=${tipo}`)
  await page.evaluate(() => {
    const v = window.__caduta = { aTerra: false, resti: 0, primo: false }
    new MutationObserver(() => {
      const m = document.querySelector('[data-mostro][data-morto]')
      if (!m) return
      v.aTerra = v.aTerra || m.classList.contains('sot-a-terra')
      v.primo = v.primo || !!m.querySelector('.sot-resti-a')
      v.resti = Math.max(v.resti, m.querySelectorAll('.sot-resti-b').length)
    }).observe(document.querySelector('[data-campo]'), { childList: true, subtree: true, attributes: true })
  })
  for (let i = 0; i < 12; i++) {
    // lo scontro si chiude da sé quando l'ultimo cade: finito quello, finita la prova
    const pronto = await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 }).catch(() => null)
    if (!pronto || !(await page.locator('[data-duello]').count())) break
    await toccaIl('[data-azione="attacco"]')
    await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 })
    await attendi(page, 450)
    await page.locator('.sot-domanda .qz-tasto[data-giusta]').first().click()
    await attendi(page, 300)
  }
  await attendi(page, 600)
  return page.evaluate(() => window.__caduta)
}

{
  const z = await abbatti('zombie')
  controlla('lo zombie che cade prende il suo pezzo a terra', z.aTerra && z.primo, JSON.stringify(z))
  uguale('e non ha i resti: ha un pezzo solo', z.resti, 0)
  await scatto(page, 'caduta-zombie')
}
{
  const m = await abbatti('mummia')
  controlla('la mummia che cade prende il suo pezzo a terra', m.aTerra && m.primo, JSON.stringify(m))
  uguale('e dopo un attimo i resti', m.resti, 1)
}

uguale('nessun errore in pagina', errori.length, 0)
if (errori.length) console.log(errori)
await browser.close()
riassunto('come cade un mostro')
