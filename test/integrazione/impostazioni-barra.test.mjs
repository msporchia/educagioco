/* ═══════════════════════════════════════════════════════════════════
   LE IMPOSTAZIONI DEI GRANDI — LA BARRA IN BASSO E LE TENDINE

   Quattro schede nella barra in basso (Bambino, Giochi, Come va, Casa), ognuna «di chi è»; le cose che cancellano e gli strumenti da
   sviluppatore stanno in tendine chiuse. Docs: docs/genitori/riordino.md.
   `node test/esegui.mjs impostazioni-barra --niente-build`
   tempo: 20
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, semina, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await semina(page, { coins: 500, settings: { eta: 8 } })
await page.click('[data-azione="grandi"]')
await page.waitForSelector('.tastierino', { timeout: 5000 })
for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
await page.waitForSelector('nav.barra-giu', { timeout: 8000 })

uguale('cinque schede nella barra', await page.locator('nav.barra-giu [data-scheda]').count(), 5)
const barra = await page.locator('nav.barra-giu').boundingBox()
controlla('la barra sta in fondo allo schermo', Math.abs(barra.y + barra.height - 844) < 2, JSON.stringify(barra))
controlla('si entra dal bambino', await page.locator('[data-scheda="bambini"].ora').count() === 1 && await page.locator('.carta.chi-gioca').count() === 1)

/* ── Giochi ── */
await page.click('[data-scheda="giochi"]')
await page.waitForSelector('[data-giochi-impostazioni]', { timeout: 5000 })
controlla('i giochi: il carosello, e l\'età sta nel bambino', await page.locator('[data-giochi-impostazioni] .scaffale').count() === 1 && await page.locator('[data-manopola]').count() === 0)
controlla('gli interruttori di casa non stanno più fra i giochi', await page.locator('.carta[data-flag="sperimentali"]').count() === 0 && await page.locator('.carta[data-flag="fps"]').count() === 0)

/* ── Salvataggi: salvare e rimettere, e le cose che cancellano in una tendina chiusa ── */
await page.click('[data-scheda="salvataggi"]')
await page.waitForSelector('[data-copia-avviso]', { timeout: 5000 })
controlla('«Zona delicata» è chiusa: i tasti che cancellano non si vedono', !(await page.locator('.carta.pericolo').first().isVisible()))
await scatto(page, 'impostazioni-salvataggi')
await page.click('[data-delicata] > summary')
controlla('aperta, ci sono', await page.locator('.carta.pericolo').first().isVisible())
await page.click('[data-delicata] > summary')

/* ── Impostazioni: il telefono, e in fondo una tendina «Avanzate» ── */
await page.click('[data-scheda="impostazioni"]')
await page.waitForSelector('.carta[data-azione="cambia-codice"]', { timeout: 5000 })
controlla('impostazioni: il codice, passare il gioco, segnalare', await page.locator('.carta[data-azione="cambia-codice"]').isVisible() && await page.locator('[data-azione="condividi-gioco"]').isVisible() && await page.locator('.carta[data-azione="segnala"]').isVisible())
/* ── l'avviso sul salvataggio: mai salvato, e ci sono progressi ── */
await page.click('[data-scheda="salvataggi"]')
controlla('mai salvato: in cima a «Salvataggi» un avviso', await page.locator('[data-copia-avviso]').isVisible() && /mai stati salvati/.test(await page.locator('[data-copia-avviso]').innerText()))
const [scaricato] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }), page.click('[data-copia-avviso]')])
controlla('toccarlo salva su file', /giochi-progressi-.*\.json$/.test(scaricato.suggestedFilename()))
await page.waitForTimeout(400)
controlla('e l\'avviso sparisce', await page.locator('[data-copia-avviso]').count() === 0)
await page.click('[data-scheda="impostazioni"]')
controlla('«Avanzate» è chiusa: l\'fps non si vede', !(await page.locator('.carta[data-flag="fps"]').isVisible()))
await scatto(page, 'impostazioni-impostazioni')
await page.click('[data-sviluppo] > summary')
await page.locator('.carta[data-flag="fps"]').scrollIntoViewIfNeeded()
controlla('aperta, c\'è il contatore fps e si può premere (la barra non lo copre)', await page.locator('.carta[data-flag="fps"]').isVisible())
await page.click('.carta[data-flag="fps"]', { trial: true })

/* ── l'ultima cosa di ogni scheda si raggiunge: la barra non la copre ── */
await page.evaluate(() => { const c = document.querySelector('.centro'); c.scrollTop = c.scrollHeight })
await page.waitForTimeout(200)
const ultima = await page.evaluate(() => {
  const nav = document.querySelector('nav.barra-giu').getBoundingClientRect()
  const carte = [...document.querySelectorAll('.centro details[open] .carta, .centro > .carte .carta, .centro > details .carta')]
  const g = carte.map(e => e.getBoundingClientRect()).filter(r => r.height > 0).sort((a, b) => b.bottom - a.bottom)[0]
  return { navTop: nav.top, ultimaBottom: g ? g.bottom : 0 }
})
controlla('in fondo alla scheda l\'ultima carta sta sopra la barra', ultima.ultimaBottom <= ultima.navTop + 1, JSON.stringify(ultima))

controlla('nessun errore in console', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('la barra in basso e le tendine')
