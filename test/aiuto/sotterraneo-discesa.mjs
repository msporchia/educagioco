/* La discesa del sotterraneo nei test del browser (integrazione/sotterraneo-discesa, -porte-scale, -portale, -rotta, -barra):
   come ci si entra senza camminare (una sosta scritta in Node, o il cheat dell'indirizzo) e come si tocca una cella della scena
   3D. Dov'è una cella sullo schermo lo dice `__sotterraneo3d.aSchermo`, dov'è l'eroe la tela (`data-eroe`). */
import { semina, scegli, attendi } from './browser.mjs'
import { viaLaFesta } from './sotterraneo-sopra.mjs'
import { pronto } from './browser.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'

export const ROBA_NUDA = { v: 1, gemme: 0, zaino: [], mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }

// il profilo con l'avventura del cavaliere alla discesa `tappa` (le precedenti a tre stelle); `avventura` aggiunge o cambia
// (roba, crescita, missioni, sosta, mondo, terra)
export function profiloDelSotterraneo({ tappa = 1, avventura = {}, coins = 300, settings } = {}) {
  const stelle = Object.fromEntries(Array.from({ length: tappa }, (_, i) => [i, 3]))
  const a = { tappa, libera: false, stelle, missioni: {}, roba: ROBA_NUDA, mondo: { parlato: true }, ...avventura }
  return { coins, ...(settings ? { settings } : {}),
           campagne: { sotterraneo: { tappa, libera: false, stelle, cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: a } } } } }
}

// la discesa 3D è pronta: la tela, e la scena giù (non quella del mondo di sopra) con le sue figure
export async function giuPronto(page, timeout = 30000) {
  await page.waitForSelector('[data-tela="3d"]', { timeout })
  await page.waitForFunction(() => { const s = window.__sotterraneo3d; return s && s.corsa && s.grafica().figure > 0 && !s.grafica().mondo }, null, { timeout })
}

/* Il motore non ha più strada da fare e la telecamera, che lo segue morbida, si è fermata: tre letture uguali (al pixel) del punto
   dell'eroe sullo schermo, a 100 ms. Al posto di un'attesa fissa dopo ogni passo */
export async function fermoGiu(page, timeout = 20000) {
  await page.evaluate(() => { window.__puntoFermo = null; window.__voltiFermo = 0 })
  await page.waitForFunction(() => {
    const s = window.__sotterraneo3d, c = s && s.corsa
    if (!c || (c.strada && c.strada.length)) { window.__voltiFermo = 0; return false }
    const k = s.aSchermo(c.eroe.x, 0, c.eroe.y).map(Math.round).join()
    window.__voltiFermo = k === window.__puntoFermo ? window.__voltiFermo + 1 : 0
    window.__puntoFermo = k
    return window.__voltiFermo >= 2
  }, null, { timeout, polling: 100 })
}

export const cellaGiu = async page => (await page.locator('[data-tela="3d"]').getAttribute('data-eroe'))

// dove cade sulla pagina il punto del mondo (x, y in celle, a quota `su`)
export async function schermoDi(page, x, y, su = 0.05) {
  const [sx, sy] = await page.evaluate(([a, b, c]) => window.__sotterraneo3d.aSchermo(a, c, b), [x, y, su])
  const b = await page.locator('[data-tela="3d"]').boundingBox()
  return { x: b.x + sx, y: b.y + sy, b }
}
// tocca il centro della cella (x, y) col dito `tocca`
export async function toccaLaCella(page, tocca, x, y, su = 0.05) {
  const p = await schermoDi(page, x + 0.5, y + 0.5, su)
  await tocca(p.x, p.y)
}
// il punto `p` (di `schermoDi`) sta nel campo: dentro la tela, lontano dai bordi e dalla mappina, che la scena disegna in alto a
// destra (la sua tela copre tutto il campo e non prende i tocchi: il suo riquadro non dice niente)
export const nelCampo = ({ x, y, b }) =>
  x > b.x + 20 && x < b.x + b.width - 20 && y > b.y + 30 && y < b.y + b.height - 60 && !(x > b.x + b.width - 150 && y < b.y + 150)

// aspetta che la tela dica l'eroe nella cella `k` («x,y»): la fascia in basso cambia piano un fotogramma prima di lei
export const eroeIn = (page, k, timeout = 8000) =>
  page.waitForFunction(k => document.querySelector('[data-tela="3d"]')?.dataset.eroe === k, k, { timeout }).catch(() => {})

/* Si rientra in una discesa lasciata a metà: il profilo con la sosta, la carta, il velo della pausa che si tocca. Si nasce già giù */
export async function riprendiLaSosta(page, profilo) {
  await aCasa(page)
  await semina(page, profilo)
  await viaLaFesta(page)
  await scegli(page, 'sotterraneo')
  await page.waitForSelector('[data-pausa] [data-azione="riprendi"]', { timeout: 20000 })
  await pronto(page, '[data-pausa]')   // il velo è cieco per un attimo (CIECA)
  await page.locator('[data-pausa] [data-azione="riprendi"]').click()
  await page.waitForSelector('[data-pausa]', { state: 'detached', timeout: 5000 })
  await giuPronto(page)
}

/* In home con la ✕, se si è nel sotterraneo (giù o sopra), e senza il cheat dell'indirizzo, che ricaricando riscenderebbe. Prima di
   `semina`: un gioco aperto scriverebbe il suo profilo al `pagehide` della ricarica, sopra quello seminato */
export async function aCasa(page) {
  if (await page.locator('[data-tela="3d"], [data-mondo3d], [data-senza-3d]').count()) {
    await page.locator('button[aria-label="indietro"]').first().click()
    await page.waitForSelector('.carte', { timeout: 10000 })
  }
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
}

/* Una discesa col cheat dell'indirizzo (`sotterraneo=1&seme=11&…`, docs/core/comandi.md) dal profilo che c'è, passando dalla home */
export async function scendiColCheat(page, hash, { pronto = true } = {}) {
  await aCasa(page)
  await page.evaluate(h => { location.hash = h }, hash)
  if (pronto) await giuPronto(page)
}

// la vita scritta su un globo della barra (`dove`: 'giu' o 'sopra'), [quanta, su quanta]
export const vitaInBarra = async (page, dove) =>
  (await page.locator(`[data-barra="${dove}"] [data-azione="vita"]`).getAttribute('aria-label')).match(/vita (\d+) su (\d+)/).slice(1).map(Number)

// conta i programmi WebGL compilati da adesso (`window.__compilati`): un effetto che butta i suoi materiali li ricompila
export const contaICompilati = page => page.evaluate(() => {
  const P = WebGL2RenderingContext.prototype
  if (!P.__linkVero) P.__linkVero = P.linkProgram
  window.__compilati = 0
  P.linkProgram = function (x) { window.__compilati++; return P.__linkVero.call(this, x) }
})
