/* ═══════════════════════════════════════════════════════════════════
   LA BOTTEGA SENZA BLOCCHI DI STORIA, COL DITO VERO

   Un pezzo delle righe dopo della storia si compra se hai le gemme, a un
   prezzo più alto quanto più è avanti (docs/sotterraneo/roba.md, «I
   mercanti di sopra»). E la bottega non mostra mai roba che l'eroe non
   porta: il mago non vede la spada corta, l'ascia né la corazza.
   Il mago, quattro discese finite, il bastone magico in mano: lo scettro
   è nella riga dopo, quindi una riga avanti e costa il doppio.
   `node test/esegui.mjs sotterraneo-bottega-avanti`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { apriBrowser, apriGioco, azzera, semina, attendi, scegli, allaLinguettaDi } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { MERCANTI } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { prezzoAvanti } from '../../src/giochi/sotterraneo/dati/mercanti.js'

const mago = EROI.find(e => e.chiave === 'mago')
const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
const roba = { v: 1, gemme: 99, zaino: [], mano: 'bastone-magico', mancina: null, corpo: 'saio', dito: 'amuleto-azzurro',
               torcia: 0, torce: 0 }
const stelle = { 0: 3, 1: 3, 2: 3, 3: 3 }
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 4, libera: false, stelle,
    cfg: { mondo: MONDO, eroe: 'mago', avventure: { mago: { tappa: 4, libera: false, stelle, missioni: {},
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
const gemmeBottega = async () => Number((await page.locator('[data-gemme-bottega]').innerText()).match(/\d+/)[0])

await toccaIl('[data-mercante="armaiolo"]')
await page.waitForSelector('[data-bottega]', { timeout: 5000 })
await attendi(page, 500)   // la bottega è cieca per un attimo (Bottega.vue, CIECO)

/* ---------- niente roba che non fa per lui, in nessuna linguetta ---------- */
const mostrati = []
for (const s of await page.locator('[data-bottega] [data-scheda]').evaluateAll(els => els.map(e => e.dataset.scheda))) {
  await toccaIl(`[data-bottega] [data-scheda="${s}"]`)
  await attendi(page, 150)
  mostrati.push(...await page.locator('[data-casella-pezzo]').evaluateAll(els => els.map(e => e.dataset.casellaPezzo)))
}
const altrui = mostrati.filter(k => COSE[k].famiglia && !mago.porta.includes(COSE[k].famiglia))
uguale('il mago non vede armi o armature che non porta', altrui.join(), '')
uguale('né la ✋ di quello che non fa per lui', await page.locator('[data-non-puoi]').count(), 0)

/* ---------- lo scettro è una riga avanti: si vede col prezzo doppio, e si compra ---------- */
const prezzo = prezzoAvanti(COSE.scettro.prezzo, 1)
uguale('lo scettro sta al banco', await allaLinguettaDi(page, 'scettro', { tocca }), true)
uguale('segnato come una riga avanti', await page.locator('[data-casella-pezzo="scettro"]').getAttribute('data-avanti'), '1')
uguale('ma acceso: niente lucchetto', await page.locator('[data-casella-pezzo="scettro"]').getAttribute('data-posso'), '1')
controlla('col prezzo del doppio sotto', (await page.locator('[data-casella-pezzo="scettro"]').innerText()).includes(String(prezzo)),
          await page.locator('[data-casella-pezzo="scettro"]').innerText())
controlla('più del prezzo pieno', prezzo > COSE.scettro.prezzo)
uguale('nessun «quando avrai finito»', await page.locator('[data-quando]').count(), 0)
await toccaIl('[data-casella-pezzo="scettro"]')
await page.waitForSelector('[data-pannello][data-cosa="scettro"]', { timeout: 3000 })
await attendi(page, 200)
uguale('dice che costa di più', await page.locator('[data-avanti-costa]').count(), 1)
uguale('il tasto compra', (await page.locator('[data-azione="compra"]').innerText()).replace(/\s+/g, ' ').trim(), `Compra 💎 ${prezzo}`)
uguale('ed è acceso', await page.locator('[data-azione="compra"]').isDisabled(), false)
await toccaIl('[data-azione="compra"]')
await attendi(page, 300)
uguale('si paga il prezzo alto', await gemmeBottega(), 99 - prezzo)
uguale('e se ne va dalla vetrina', await page.locator('[data-casella-pezzo="scettro"]').count(), 0)

controlla('nessun errore nella pagina', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('la bottega senza blocchi di storia')
