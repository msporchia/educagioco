/* ═══════════════════════════════════════════════════════════════════
   L'ENGLISH DI PRIMA, NEL BROWSER
     node test/esegui.mjs inglese          (la build la fa il lanciatore)

   La carta English adesso apre l'inglese a mondi (integrazione/inglese-mondi).
   Qui resta quello che il gioco di prima deve ancora fare:
     · chi aveva finito la campagna vecchia trova il suo gioco libero in
       fondo alla mappa del tesoro, e ci gioca davvero
     · uscendo torna alla mappa, non alla campagna vecchia
     · chi non l'aveva finita non lo vede
     · la voce non passa mai da speechSynthesis
   Lo spagnolo, che sta ancora tutto su quel gioco, lo prova integrazione/spagnolo.
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, TELEFONO, scegli } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await page.addInitScript(() => {
  Object.defineProperty(window, 'speechSynthesis', {
    value: { getVoices: () => { window.__sintesi = true; return [] }, cancel() {},
             speak() { window.__sintesi = true } },
    configurable: true,
  })
})
await azzera(page)

/* ---------- 1. senza la campagna vecchia finita, niente ---------- */
await semina(page, { eng: { tappa: 4, libera: false } })
await scegli(page, 'inglese')
await page.waitForSelector('[data-mappa-inglese] [data-tappa]', { timeout: 5000 })
uguale('a campagna vecchia a metà il gioco di prima non c’è', await page.locator('[data-prima]').count(), 0)

/* ---------- 2. chi l'aveva finita ce l'ha in fondo alla mappa ---------- */
await semina(page, { eng: { tappa: 13, libera: true } })
await scegli(page, 'inglese')
await page.waitForSelector('[data-prima]', { timeout: 5000 })
await page.locator('[data-prima]').click()
await page.waitForSelector('.scelte .scelta', { timeout: 5000 })
const partita = await page.evaluate(async () => {
  const g = window.__eng
  const inizio = { fase: g.fase.value, libero: g.tappaIdx.value }
  let giuste = 0
  for (let i = 0; i < 12 && g.fase.value === 'gioco'; i++) {
    const t = g.turno.value
    g.rispondi(g.giusta()); giuste++
    for (let j = 0; j < 40 && g.turno.value === t; j++) await new Promise(r => setTimeout(r, 50))
  }
  return { ...inizio, giuste, dopo: g.hud.giuste }
})
uguale('si entra dritti nel gioco', partita.fase, 'gioco')
uguale('ed è il gioco libero, non una tappa', partita.libero, -1)
uguale('e si gioca davvero', partita.dopo, partita.giuste)
nota(`${partita.giuste} risposte nel gioco di prima`)
await page.waitForTimeout(500)
const p = await leggiProfilo(page)
controlla('le risposte finiscono nel contatore inglese di sempre', (p.totals.en || 0) + (p.totals.verbi || 0) + (p.totals.frasi || 0) >= partita.giuste)
uguale('la campagna vecchia resta finita', p.eng.libera, true)

/* ---------- 3. indietro si torna alla mappa del tesoro ---------- */
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('[data-mappa-inglese]', { timeout: 5000 })
controlla('la mappa del tesoro c’è di nuovo', await page.locator('[data-prima]').count() === 1)

controlla('non si usa speechSynthesis', !(await page.evaluate(() => !!window.__sintesi)))
controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('English di prima nel browser')
