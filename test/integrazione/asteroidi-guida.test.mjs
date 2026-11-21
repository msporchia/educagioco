/* ═══════════════════════════════════════════════════════════════════
   GLI ASTEROIDI — LA GUIDA «COME SI GIOCA», COL DITO

   La prima partita della vita accende la guida da sé (docs/core/come-si-gioca.md): l'anello sulla domanda, il segno attorno
   ai sassi nella scena, e il cielo che si ferma quando il sasso giusto è sceso in vista. Colpito il giusto col dito, la riga
   finale lascia correre il cielo e se ne va; la guida è segnata come vista; il `?` la richiama con la ✕.
   La parte della scuola (frecce e Invio, la ✕ da sé) sta in `integrazione/scuola`.
   `node test/esegui.mjs asteroidi-guida --niente-build`
   tempo: 40
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, attendi, scatto, scegli, parti, leggiProfilo } from '../aiuto/browser.mjs'
import { controlla, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { spiegazioni: true })
await azzera(page)
await scegli(page, 'mate')
await page.waitForSelector('[data-rotta]', { timeout: 8000 })
await parti(page, '[data-rotta] [data-tipo="pianeta"]')
await page.waitForSelector('[data-guida-riga]', { timeout: 8000 })

controlla('la guida parte da sé alla prima partita, senza la ✕', await page.locator('[data-guida-spegni]').count() === 0)
controlla('l\'anello è sulla domanda', await page.locator('[data-domanda-nave][data-indicato]').count() === 1)

// il cielo scende finché il giusto è in vista, poi aspetta
const giusto = () => page.evaluate(() => { const a = window.__mate.asteroidi().find(x => x.ok && !x.morto); return a && { x: a.x, y: a.y } })
await page.waitForFunction(() => window.__mate.asteroidi().some(a => a.ok && !a.morto && a.y > 150), null, { timeout: 20000, polling: 100 })
await attendi(page, 3000)                 // si ferma a un terzo dello schermo: da 150 px ci si arriva in meno di tre secondi
const g0 = await giusto()
await attendi(page, 1500)
const g1 = await giusto()
controlla('col giusto in vista il cielo aspetta il bambino', g0 && g1 && Math.abs(g1.y - g0.y) < 1, JSON.stringify([g0, g1]))
await scatto(page, 'asteroidi-guida')

const cdp = await page.context().newCDPSession(page)
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: g1.x, y: g1.y }] })
await attendi(page, 40)
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
await page.waitForSelector('[data-guida-riga="fine"]', { timeout: 4000 }).catch(() => {})
controlla('colpito il giusto, la riga finale', await page.locator('[data-guida-riga="fine"]').count() === 1)
controlla('e l\'anello se ne va', await page.locator('[data-indicato]').count() === 0)
await page.waitForSelector('[data-guida-riga]', { state: 'detached', timeout: 10000 }).catch(() => {})
controlla('la riga finale se ne va da sola', await page.locator('[data-guida-riga]').count() === 0)
await attendi(page, 600)
controlla('la guida è segnata come vista', (await leggiProfilo(page)).settings?.guideViste?.asteroidi === true)

await page.locator('[data-azione="aiuto"]').click()
await page.waitForSelector('[data-guida-riga]', { timeout: 3000 }).catch(() => {})
controlla('il ? la richiama, con la ✕', await page.locator('[data-guida-spegni]').count() === 1)
await page.locator('[data-guida-spegni]').click().catch(() => {})
await page.waitForSelector('[data-guida-riga]', { state: 'detached', timeout: 2000 }).catch(() => {})
controlla('la ✕ la spegne', await page.locator('[data-guida-riga]').count() === 0)

controlla('nessun errore', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('Asteroidi: la guida')
