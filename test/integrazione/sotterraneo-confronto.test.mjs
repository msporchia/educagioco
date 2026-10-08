/* ═══════════════════════════════════════════════════════════════════
   IL CONFRONTO AFFIANCATO NELLA BOTTEGA, CON PIÙ ABILITÀ

   Il pannello di un pezzo che si può indossare mette «Addosso» a sinistra
   e «Questo» a destra, una riga per ogni abilità che almeno uno dei due
   ha (docs/sotterraneo/bottega.md, «La bottega e lo zaino»). Il caso con una
   riga sola lo copre `sotterraneo-mercanti`; qui un eroe vestito (spada e
   scudo, un amuleto al dito) davanti al banco dell'armaiolo: lo spadone
   prende il posto di arma e scudo insieme, e uno scudo con più abilità
   sta contro quello che si ha. Sul telefono (390 px) le colonne stanno.
   I tocchi sono tocchi, via CDP (docs/core/il-dito.md).
   `node test/esegui.mjs sotterraneo-confronto`
   tempo: 40
   ═══════════════════════════════════════════════════════════════════ */
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, allaLinguettaDi, nelDialogo } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { MERCANTI } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
/* sei discese finite: l'armaiolo porta lo spadone e, in vetrina, lo scudo del teschio (dati/storia.js). L'eroe sta già
   accanto a lui, vestito di spada e scudo borchiato (braccio 2, difesa 1, vita 3) */
const roba = { v: 1, gemme: 99, zaino: [], mano: 'spada', mancina: 'scudo-borchiato', corpo: null, dito: null,
               torcia: 0, torce: 0 }
const stelle = { 0: 3, 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 }
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 6, libera: false, stelle,
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: 6, libera: false, stelle, missioni: {},
      roba, terra: { nebbia: 'f'.repeat(768), dove: MERCANTI.armaiolo.accanto, parlato: true } } } } } },
})
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await attendi(page, 500)

const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
async function toccaIl(sel) {
  const b = await page.locator(sel).first().boundingBox()
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}
const testo = async sel => (await page.locator(sel).innerText()).replace(/\s+/g, '')

await toccaIl('[data-mercante="armaiolo"]')
await nelDialogo(page, '[data-scelta="bottega"]', { tocca: toccaIl })   // si parla, e «fammi vedere» apre il banco
await page.waitForSelector('[data-bottega]', { timeout: 5000 })
await attendi(page, 500)   // la bottega è cieca per un attimo (Bottega.vue, CIECO)

/* ---------- lo spadone: arma e scudo insieme contro un pezzo a due mani ---------- */
uguale('lo spadone sta al banco', await allaLinguettaDi(page, 'spadone', { tocca }), true)
await toccaIl('[data-casella-pezzo="spadone"]')
await page.waitForSelector('[data-pannello][data-cosa="spadone"] [data-affianca]', { timeout: 3000 })
await attendi(page, 200)
const pezziAddosso = await page.locator('[data-colonna="addosso"] [data-pezzo]').evaluateAll(els => els.map(e => e.dataset.pezzo))
uguale('a sinistra due pezzi: la spada e lo scudo', pezziAddosso.join(), 'spada,scudo-borchiato')
uguale('a destra lo spadone', await page.locator('[data-colonna="questo"] [data-pezzo]').getAttribute('data-pezzo'), 'spadone')
controlla('e lo dice chiaro: a due mani lo scudo torna nello zaino', /due mani.*scudo borchiato torna nello zaino/i.test(await page.locator('[data-due-mani]').innerText()),
          await testo('[data-due-mani]'))
const n = async sel => page.locator(sel).getAttribute('data-n')
uguale('due cartellini: a sinistra il braccio delle due mani, +2', await n('[data-valore="att-addosso"]'), '+2')
uguale('a destra lo spadone, +4', await n('[data-valore="att-questo"]'), '+4')
uguale('la difesa e la vita dello scudo stanno solo a sinistra', await page.locator('[data-valore="dif-questo"], [data-valore="vita-questo"]').count(), 0)
uguale('ogni cartellino dice livello e rarità', (await page.locator('[data-colonna="questo"]').innerText()).includes('liv. 1 · comune'), true)
uguale('il netto sull\'eroe: il braccio sale', await page.locator('[data-confronto="att"]').getAttribute('data-verso'), 'su')
uguale('e la difesa scende', await page.locator('[data-confronto="dif"]').getAttribute('data-verso'), 'giu')
uguale('e la vita scende', await page.locator('[data-confronto="vita"]').getAttribute('data-verso'), 'giu')
{
  const pannello = await page.locator('[data-pannello]').boundingBox()
  const destra = await page.locator('[data-colonna="questo"]').boundingBox()
  const larghezza = await page.evaluate(() => document.documentElement.clientWidth)
  controlla('a 390 px le due colonne stanno nel pannello', larghezza <= 390 &&
            destra.x + destra.width <= pannello.x + pannello.width + 1 && pannello.x + pannello.width <= larghezza + 1,
            JSON.stringify({ pannello, destra, larghezza }))
  const fuori = await page.locator('[data-affianca] *').evaluateAll(els =>
    els.filter(e => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).display !== 'inline').map(e => e.className))
  uguale('e niente testo che esce dal suo riquadro', fuori.join(), '')
}
await scatto(page, 'confronto-spadone')

/* ---------- lo scudo del teschio in vetrina, contro lo scudo borchiato ---------- */
uguale('gli scudi stanno sotto un\'altra linguetta', await allaLinguettaDi(page, 'scudo-teschio', { tocca }), true)
await toccaIl('[data-casella-pezzo="scudo-teschio"]')
await page.waitForSelector('[data-pannello][data-cosa="scudo-teschio"] [data-affianca]', { timeout: 3000 })
await attendi(page, 200)
uguale('a sinistra lo scudo borchiato', await page.locator('[data-colonna="addosso"] [data-pezzo]').getAttribute('data-pezzo'), 'scudo-borchiato')
uguale('la difesa: +1 a sinistra, +3 a destra', `${await n('[data-valore="dif-addosso"]')} ${await n('[data-valore="dif-questo"]')}`, '+1 +3')
uguale('la vita dello scudo borchiato sta solo a sinistra', `${await n('[data-valore="vita-addosso"]')} ${await page.locator('[data-valore="vita-questo"]').count()}`, '+3 0')
uguale('le mani non cambiano: niente da dire', await page.locator('[data-due-mani]').count(), 0)
uguale('il netto: la difesa sale, la vita scende', `${await page.locator('[data-confronto="dif"]').getAttribute('data-verso')} ${await page.locator('[data-confronto="vita"]').getAttribute('data-verso')}`, 'su giu')
await scatto(page, 'confronto-scudo')

controlla('nessun errore nella pagina', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('il confronto affiancato, con più abilità')
