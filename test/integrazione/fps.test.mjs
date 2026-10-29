/* ═══════════════════════════════════════════════════════════════════
   IL CONTAFOTOGRAMMI

   Spento di partenza (nessuna pastiglia in giro), si accende dagli
   interruttori dei grandi, fa una misura con due tocchi, la tiene e
   la ritrova dopo una ricarica: la ragione per cui esiste è guardare
   il telefono vecchio senza cavi (docs/core/vecchio-telefono.md).
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, apriTendine, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

uguale('spento: nessuna pastiglia', await page.locator('[data-fps]').count(), 0)

await page.click('[data-azione="grandi"]')
await page.waitForSelector('.tastierino', { timeout: 5000 })
for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
await page.waitForSelector('[data-scheda="impostazioni"]', { timeout: 5000 })
await page.click('[data-scheda="impostazioni"]')
await apriTendine(page)      // «Per chi sviluppa» nasce chiusa
await page.waitForSelector('.carta[data-flag="fps"]', { timeout: 5000 })
controlla('l\'interruttore parte spento',
  await page.evaluate(() => document.querySelector('.carta[data-flag="fps"]').className.includes('spento')))
await page.click('.carta[data-flag="fps"]')
await page.waitForSelector('[data-fps]', { timeout: 3000 })

await page.click('[data-azione="fps-misura"]')
await page.waitForTimeout(1500)
await page.click('[data-azione="fps-misura"]')
await page.waitForSelector('[data-fps-elenco]', { timeout: 3000 })
const testo = await page.textContent('[data-fps-elenco]')
controlla('la misura è nell\'elenco, con gli fps', /ultima/.test(testo) && /\d+ fps/.test(testo))

await page.reload()
await page.waitForSelector('[data-fps]', { timeout: 8000 })
await page.click('[data-azione="fps-elenco"]')
controlla('dopo la ricarica la misura c\'è ancora', /ultima/.test(await page.textContent('[data-fps-elenco]')))

/* ── LA MISURA DEL TELEFONO: si apre, dice la fascia e le due prove (girano in integrazione/benchmark-veri) ── */
await page.click('[data-azione="grandi"]')
await page.waitForSelector('.tastierino', { timeout: 5000 })
for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
await page.waitForSelector('[data-scheda="impostazioni"]', { timeout: 5000 })
await page.click('[data-scheda="impostazioni"]')
await apriTendine(page)      // «Avanzate» nasce chiusa
await page.click('[data-azione="benchmark"]')
controlla('la misura dice la fascia del telefono', /fascia \w+/.test(await page.textContent('[data-benchmark-fascia]')))
controlla('e le due prove', await page.isVisible('[data-azione="benchmark-veri"]') && await page.isVisible('[data-azione="benchmark-scale"]'))
await page.click('[data-azione="benchmark-chiudi"]')
uguale('chiusa la misura', await page.locator('[data-benchmark]').count(), 0)

/* ── LA FASCIA ── */
await page.click('[data-azione="benchmark-chiudi"]').catch(() => {})
controlla('la carta della fascia c\'è', await page.isVisible('[data-fascia]'))
await page.click('[data-azione="rimisura-fascia"]')
await page.waitForFunction(() => /punti/.test(document.querySelector('[data-fascia]').textContent), null, { timeout: 30000 })
controlla('misurata: dice i punti', /punti, JS/.test(await page.textContent('[data-fascia]')))
await page.click('[data-fascia-scelta="bassa"]')
controlla('scelta a mano: bassa', /Qualità della grafica 3D: bassa/.test(await page.textContent('[data-fascia]')))
// le scelte stanno sotto il testo, a tutta larghezza: non spingono il testo di lato
const box = await page.evaluate(() => { const r = s => document.querySelector(s).getBoundingClientRect(); return { testo: r('[data-fascia] b').left, scelte: r('[data-fascia] .scelte').left, carta: r('[data-fascia]').left } })
controlla('le scelte non spingono il testo a destra', box.scelte - box.carta < 30 && box.testo - box.carta < 70, JSON.stringify(box))
await page.locator('[data-fascia]').scrollIntoViewIfNeeded()
await scatto(page, 'fascia')
await page.reload()
await page.click('[data-azione="grandi"]'); await page.waitForSelector('.tastierino')
for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
await page.click('[data-scheda="impostazioni"]')
await apriTendine(page)
controlla('la scelta resta dopo la ricarica', /Qualità della grafica 3D: bassa/.test(await page.textContent('[data-fascia]')))

controlla('niente errori', errori.length === 0)
await browser.close()
riassunto('il contafotogrammi')
