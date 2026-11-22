/* Lo scontro del sotterraneo aperto dal cheat dell'indirizzo, per le prove del browser che partono da lì
   (integrazione/sotterraneo-scontro, sotterraneo-scontro-eroe): un eroe seminato in una discesa, e
   `#sotterraneo=<tappa>&sotterraneo=branco&mostri=N…` scende da sé con lo scontro già aperto (docs/core/comandi.md). */
import { azzera, semina, attendi } from './browser.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'

/* Semina l'eroe e scende: `hash` è l'indirizzo intero (`sotterraneo=1&seme=11&sotterraneo=branco&mostri=6`). `extra` va
   nell'avventura (`crescita`, `tesori`…). Si riparte dalla home: l'indirizzo della prova di prima riaprirebbe il gioco al
   ricaricamento. `aspetta`: il selettore che dice «arrivati» (di difetto la tela 3D). */
export async function scendiCon(page, hash, { eroe = 'cavaliere', tappa = 1, roba, extra = {}, larghezza = 390, alto = 844,
                                              aspetta = '[data-tela="3d"]' } = {}) {
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await azzera(page)
  await page.setViewportSize({ width: larghezza, height: alto })
  const stelle = Object.fromEntries(Array.from({ length: tappa }, (_, i) => [i, 3]))
  const avventura = { tappa, libera: false, stelle: { 0: 3, ...stelle }, missioni: {}, roba, mondo: { parlato: true }, ...extra }
  await semina(page, {
    coins: 300,
    campagne: { sotterraneo: { tappa, libera: false, stelle: avventura.stelle, cfg: { mondo: MONDO, eroe, avventure: { [eroe]: avventura } } } },
  })
  await page.evaluate(h => { location.hash = h }, hash)
  if (aspetta) await page.waitForSelector(aspetta, { timeout: 40000 })
}

// entrando gli shader nascono uno per fotogramma e non si disegna: il primo disegno (docs/sotterraneo/prestazioni-3d.md)
export const primoDisegno = page => page.waitForFunction(() => {
  const g = window.__sotterraneo3d && window.__sotterraneo3d.grafica()
  return g && !g.entrando && g.chiamate > 0
}, null, { timeout: 30000 })

// la scelta del turno, pronta al tocco (passati i 320 ms ciechi); il racconto del turno finito
export const scelta = page => page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 })
// (anche quando il racconto chiude lo scontro: l'ultimo mostro caduto)
export const finitoIlRacconto = page => page.waitForFunction(() => !document.querySelector('[data-duello][data-racconto]'), null, { timeout: 20000 })
export const raccontoInCorso = page => page.waitForSelector('[data-duello][data-racconto]', { timeout: 8000 })

// la domanda comparsa, passati i suoi 320 ms ciechi, e la risposta giusta col mouse (il dito sulla domanda lo provano i quiz)
export async function rispondiGiusto(page) {
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 })
  await attendi(page, 400)
  await page.locator('.sot-domanda .qz-tasto[data-giusta]').first().click()
}

/* Un osservatore dentro la pagina che ricorda quello che compare e sparisce in fretta mentre si racconta: gli effetti 3D vivi
   (`grafica().effetti3d`, sono modelli WebGL e non elementi), i numeri sopra le figure, le pastiglie degli stati. `visti()` lo ferma
   e dice cosa ha visto. */
export const osserva = page => page.evaluate(() => {
  const v = window.__visti = { numeri: [], testi: [], stati: [], effetti3d: 0 }
  const guarda = n => {
    if (n.nodeType !== 1) return
    for (const e of [n, ...n.querySelectorAll('*')]) {
      if (e.dataset && e.dataset.stato) v.stati.push(e.dataset.stato)
      if (e.classList && e.classList.contains('sot-numero')) { v.numeri.push([...e.classList].find(c => /^sot-numero-/.test(c))); v.testi.push(e.textContent.trim()) }
    }
  }
  if (window.__vistiOss) window.__vistiOss.disconnect()
  window.__vistiOss = new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(guarda)))
  window.__vistiOss.observe(document.body, { childList: true, subtree: true })
  clearInterval(window.__vistiGiro)
  window.__vistiGiro = setInterval(() => { const g = window.__sotterraneo3d && window.__sotterraneo3d.grafica(); if (g) v.effetti3d = Math.max(v.effetti3d, g.effetti3d) }, 20)
})
export const visti = page => page.evaluate(() => {
  clearInterval(window.__vistiGiro)
  if (window.__vistiOss) window.__vistiOss.disconnect()
  return window.__visti
})

// dove cade sullo schermo il corpo del mostro `i` dello scontro (a metà altezza), in px della pagina: il tocco sul palco lo prende dalla scena
export async function corpoDi(page, i) {
  const [sx, sy, alto] = await page.evaluate(i => {
    const S = window.__sotterraneo3d, s = S.palco.stati[i], q = S.aSchermo(s.x, (s.alto || 1) * 0.5, s.z)
    return [q[0], q[1], s.alto || 1]
  }, i)
  const b = await page.locator('[data-tela="3d"]').boundingBox()
  return { x: b.x + sx, y: b.y + sy, alto }
}

/* I globi della vita e dell'energia sporgono sopra la barra in basso: un pannello che ci poggia deve finire sopra la loro punta
   (docs/sotterraneo/barra.md, «Sopra la barra»). Dice quanti pixel il pannello (il primo del selettore) scende sui globi o sulla
   barra (`sopra`, ≤ 0 se non li tocca) e quanta scena resta sopra di lui (`scena`); null se il pannello non c'è */
export const sopraLaBarra = (page, sel) => page.evaluate(s => {
  const p = document.querySelector(s)
  if (!p) return null
  const r = p.getBoundingClientRect()
  const globi = [...document.querySelectorAll('[data-globo], [data-barra-giu]')].map(g => g.getBoundingClientRect())
  const sopra = Math.max(...globi.map(g => Math.min(r.bottom, g.bottom) - Math.max(r.top, g.top) > 0 &&
                                            Math.min(r.right, g.right) - Math.max(r.left, g.left) > 0 ? r.bottom - g.top : 0))
  const tela = document.querySelector('.sot-tela')
  return { sopra: Math.round(sopra * 10) / 10, scena: tela ? Math.round(r.top - tela.getBoundingClientRect().top) : 0,
           basso: Math.round(r.bottom), cima: Math.round(Math.min(...globi.map(g => g.top))) }
}, sel)

// il numero scritto su un globo della barra (`vita`, `energia`)
export const globo = (page, tipo) => page.locator(`[data-globo="${tipo}"] .sot-globo-numero`).first().textContent().then(t => Number(t || 0))
