/* ═══════════════════════════════════════════════════════════════════
   IL BANCO TUO, COL DITO
     node test/integrazione/bancarella-banco.test.mjs   (dopo `npm run build`)

   Quello che i conti di `unita/bancarella-banco` non vedono: si compra
   davvero e resta, si comincia con poche ceste, il cliente mostra i soldi
   senza dirli, e «tutte quelle che riesce» si gioca fino al resto. Vedi
   docs/bancarella/banco.md.
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, attendi,
         TELEFONO, scegli, giocaGiornata } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { TENDE, MERCE_NUOVA } from '../../src/data/bancarella-banco.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)

const entra = async profilo => {
  await semina(page, profilo)
  await scegli(page, 'bancarella')
  await page.waitForSelector('[data-mondo]', { timeout: 5000 })
}
const cassa = () => page.locator('[data-in-cassa]').first().textContent()

/* ---------- 1. si compra ---------- */
await entra({ campagne: { bancarella: { banco: { cassa: 5000 } } } })
uguale('il tasto del banco dice la cassa', await cassa(), '50,00 €')
uguale('e il pallino dice che si può comprare', await page.locator('[data-si-compra]').count(), 1)
await page.click('[data-azione="il-banco"]')
await page.waitForSelector('[data-mio-banco]', { timeout: 3000 })
await page.click('[data-compra="tenda"]')
uguale('la tenda si paga', await cassa(), '35,00 €')
const nuovo = MERCE_NUOVA.frutta[0]
await page.click(`[data-merce="${nuovo.emoji}"]`)
await page.click('[data-compra="merce"]')
uguale('e il prodotto nuovo pure', await cassa(), `${((3500 - nuovo.costa) / 100).toFixed(2).replace('.', ',')} €`)
uguale('adesso è tuo', await page.getAttribute(`[data-merce="${nuovo.emoji}"]`, 'data-mia'), '1')
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('[data-mondo]', { timeout: 3000 })
await attendi(page, 500)
const p = await leggiProfilo(page)
uguale('il profilo tiene la tenda', p.campagne.bancarella.banco.tenda, 1)
uguale('e la merce', p.campagne.bancarella.banco.merce.join(), nuovo.emoji)

/* ---------- 2. poche ceste, e i soldi si guardano ---------- */
await giocaGiornata(page, 'banchetto')
await page.waitForFunction(() => !window.__shop.cambio.value && window.__shop.cliente.value, { timeout: 5000 })
uguale('si comincia con quattro ceste', await page.locator('.cesta').count(), 4)
uguale('la tenda comprata si vede', await page.getAttribute('[data-tenda]', 'data-tenda'), '1')
const pazienza = await page.evaluate(() => window.__shop.cliente.value.pazienza)
controlla('e fa aspettare di più', pazienza >= 92 + TENDE[1].pazienza - 8, String(pazienza))
await page.evaluate(() => {
  const S = window.__shop
  for (const a of S.cliente.value.articoli) for (let i = 0; i < a.quanti; i++) S.prendi(a)
})
await page.waitForSelector('[data-porge] .soldo', { timeout: 3000 })
const fumetto = await page.locator('.fumetto').textContent()
controlla('il cliente non dice quanto paga', !/\d,\d\d/.test(fumetto), fumetto)

/* ---------- 3. tutte quelle che riesce ---------- */
await entra({ mercato: { tappa: 15, libera: false, v: 3 } })
await giocaGiornata(page, 'tutte')
await page.waitForFunction(() => !window.__shop.cambio.value && window.__shop.cliente.value, { timeout: 5000 })
const chi = await page.evaluate(() => {
  const c = window.__shop.cliente.value
  return { riesce: c.riesce, emoji: c.articoli[0].emoji, quanti: c.articoli[0].quanti, resto: c.resto, totale: c.totale }
})
uguale('il primo della giornata vuole tutte quelle che riesce', chi.riesce, true)
const inCassa = (await leggiProfilo(page)).campagne.bancarella.banco.cassa
const cesta = `.cesta[data-em="${chi.emoji}"]`
for (let i = 0; i < chi.quanti - 1; i++) await page.click(cesta)
await page.click('[data-azione="basta"]')
await page.waitForFunction(() => /ancora/.test(window.__shop.battuta.value), { timeout: 2000 })
uguale('con una di meno resta alla raccolta', await page.evaluate(() => window.__shop.momento.value), 'raccolta')
await page.click(cesta); await page.click(cesta)
await page.click('[data-azione="basta"]')
await page.waitForFunction(() => /bastano/.test(window.__shop.battuta.value), { timeout: 2000 })
await page.click('[data-azione="una-di-meno"]')
await page.click('[data-azione="basta"]')
await page.waitForFunction(() => window.__shop.momento.value === 'cassa', { timeout: 2000 })
await page.evaluate(() => {
  const S = window.__shop
  for (const v of S.scomponi(S.cliente.value.resto, S.cliente.value.monete)) S.metti(v)
  S.proponi()
})
await page.waitForFunction(() => window.__shop.hud.serviti === 1, { timeout: 3000 })
uguale('con quante giuste si serve, e costa un intoppo per gli sbagli', await page.evaluate(() => window.__shop.hud.intoppi), 1)
await attendi(page, 500)
uguale('e la spesa va in cassa', (await leggiProfilo(page)).campagne.bancarella.banco.cassa, inCassa + chi.totale)

/* ---------- 4. il mercato senza fine tiene il record ---------- */
await entra({ mercato: { tappa: 17, libera: true, v: 3 } })
await giocaGiornata(page, 'libera')
await page.waitForFunction(() => !window.__shop.cambio.value && window.__shop.cliente.value, { timeout: 5000 })
await page.evaluate(() => { const S = window.__shop; S.hud.serviti = 7; S.chiudi('persa') })
await page.waitForSelector('[data-primato]', { timeout: 3000 })
nota(await page.locator('[data-primato]').textContent())
await attendi(page, 300)
await page.click('[data-azione="le-giornate"]')
await page.waitForSelector('[data-piazza]', { timeout: 3000 })
await page.click('[data-camp="libera"]')
controlla('il fumetto del Cairo dice il record', /7 clienti/.test(await page.locator('[data-record]').textContent()))

uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))
await browser.close()
riassunto('Il banco della bancarella')
