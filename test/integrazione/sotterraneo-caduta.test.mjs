/* ═══════════════════════════════════════════════════════════════════
   COME CADE UN MOSTRO

   (docs/sotterraneo/scontro-interfaccia.md, «La caduta»; docs/sotterraneo/mostri-3d.md; scena3d/cose.js)
   Chi cade nello scontro non svanisce in piedi: il modello si rovescia all'indietro (o la sua sagoma prende la foto a terra:
   docs/sotterraneo/sagome-3d.md), e l'altezza che `cose.js` scrive nello stato del mostro scende; solo dopo svanisce. Lo stesso col
   modello e con la sagoma (`&spegni=mostri3d`). Un campionatore dentro la pagina legge lo stato a ogni giro, perché il racconto dura
   poco e le foto sotto carico sono lente.
   `node test/esegui.mjs sotterraneo-caduta`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto } from '../aiuto/browser.mjs'
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
    mondo: { parlato: true } }
  await semina(page, {
    coins: 300,
    campagne: { sotterraneo: { tappa: TAPPA, libera: false, stelle: { 0: 3 },
      cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: avventura } } } },
  })
  await page.evaluate(h => { location.hash = h }, 'sotterraneo=' + TAPPA + '&seme=11&sotterraneo=branco&' + hash)
  await page.waitForSelector('[data-duello]', { timeout: 30000 })
  await page.waitForFunction(() => { const g = window.__sotterraneo3d && window.__sotterraneo3d.grafica(); return g && !g.entrando && g.chiamate > 0 }, null, { timeout: 30000 })
}

// attacca finché il mostro cade, e dice cosa si è visto a terra
async function abbatti(tipo, altro = '') {
  await entra(`mostri=1&tipo=${tipo}${altro}`)
  await page.evaluate(() => {
    window.__lui = null
    const v = window.__caduta = { cade: false, alto: 0, basso: 99, sagoma: false, modello: false }
    const guarda = () => {
      const S = window.__sotterraneo3d
      // il mostro dello scontro lo dice il palco; finito lo scontro il palco non c'è più, ma il mostro caduto resta in scena
      if (S && S.palco && S.palco.campo[0]) window.__lui = S.palco.campo[0]
      const st = S && window.__lui && S.statoDi(window.__lui)
      if (!st) return
      if (!st.morente) v.alto = Math.max(v.alto, st.alto || 0)
      else if (st.morente < 1) { v.cade = true; v.basso = Math.min(v.basso, st.alto || 0); if (st.in3d) v.modello = true; if (st.inSagoma) v.sagoma = true }
    }
    window.__cadutaGiro = setInterval(guarda, 25)
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
  await attendi(page, 1500)
  return page.evaluate(() => { clearInterval(window.__cadutaGiro); return window.__caduta })
}

{
  const z = await abbatti('zombie')
  controlla('lo zombie che cade si rovescia: col modello, e la sua altezza scende', z.cade && z.modello && z.basso < z.alto * 0.6, JSON.stringify(z))
  await scatto(page, 'caduta-zombie')
}
{
  const m = await abbatti('mummia', '&spegni=mostri3d')
  controlla('la mummia senza modello cade con la sua sagoma, a terra', m.cade && m.sagoma && m.basso < m.alto * 0.6, JSON.stringify(m))
}

uguale('nessun errore in pagina', errori.length, 0)
if (errori.length) console.log(errori)
await browser.close()
riassunto('come cade un mostro')
