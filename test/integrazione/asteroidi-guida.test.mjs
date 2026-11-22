/* ═══════════════════════════════════════════════════════════════════
   GLI ASTEROIDI — LA GUIDA «COME SI GIOCA», COL DITO
   perché: la guida della prima partita col dito vero: l'anello sulla domanda, il cielo che si ferma col sasso giusto in vista, la guida segnata come vista e il `?` che la richiama
   a parte perché: parte da un profilo che non ha mai giocato e con le spiegazioni accese (`spiegazioni: true`); asteroidi-3d parte a guida già vista, e una guida in corso gli fermerebbe il cielo

   La prima partita della vita accende la guida da sé (docs/core/come-si-gioca.md): l'anello sulla domanda, il segno attorno
   ai sassi nella scena, e il cielo che si ferma quando il sasso giusto è sceso in vista. Colpito il giusto col dito, la riga
   finale lascia correre il cielo e se ne va; la guida è segnata come vista; il `?` la richiama con la ✕.
   La parte della scuola (frecce e Invio, la ✕ da sé) sta in `integrazione/scuola`.
   `node test/esegui.mjs asteroidi-guida --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, attendi, scatto, scegli, parti, leggiProfilo } from '../aiuto/browser.mjs'
import { controlla, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { spiegazioni: true })
// l'orologio della pagina scorre da sé, ma si porta avanti: la riga finale se ne va dopo dieci secondi (`FINE_MS`)
await page.clock.install()
await azzera(page)
await scegli(page, 'mate')
await page.waitForSelector('[data-rotta]', { timeout: 8000 })
await parti(page, '[data-rotta] [data-tipo="pianeta"]')
await page.waitForSelector('[data-guida-riga]', { timeout: 8000 })

controlla('la guida parte da sé alla prima partita, senza la ✕', await page.locator('[data-guida-spegni]').count() === 0)
controlla('l\'anello è sulla domanda', await page.locator('[data-domanda-nave][data-indicato]').count() === 1)

// il cielo scende finché il giusto è in vista, poi aspetta: si aspetta che il giusto, sceso in vista, stia fermo fra due
// letture, e lo si riguarda un secondo dopo (se il cielo non si fermasse, l'attesa scadrebbe)
const giusto = () => page.evaluate(() => { const a = window.__mate.asteroidi().find(x => x.ok && !x.morto); return a && { x: a.x, y: a.y } })
await page.waitForFunction(() => {
  const a = window.__mate.asteroidi().find(x => x.ok && !x.morto), prima = window.__yGiusto
  window.__yGiusto = a && a.y
  return !!a && a.y > 150 && prima === a.y
}, null, { timeout: 20000, polling: 300 })
const g0 = await giusto()
await attendi(page, 1000)
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
await page.clock.fastForward(10500)
await page.waitForSelector('[data-guida-riga]', { state: 'detached', timeout: 3000 }).catch(() => {})
controlla('la riga finale se ne va da sola', await page.locator('[data-guida-riga]').count() === 0)
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
