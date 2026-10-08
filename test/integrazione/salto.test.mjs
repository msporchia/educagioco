/* ═══════════════════════════════════════════════════════════════════
   IL TASTO «SALTA»: LA LEVA DI #admin E LA DOMANDA COMUNE

   Serve a chi sviluppa, per passare le domande senza pensare alle
   risposte. La leva sta in `#admin` (spenta di partenza, del telefono e
   non di un bambino); accesa, ogni domanda ha un «⏭️ salta» che la dà
   per giusta. Qui la leva, e la Domanda comune (`quiz/Domanda.vue`)
   raggiunta dal banco di prova dei grandi: spenta il tasto non c'è,
   accesa c'è e fa passare alla domanda dopo. Che non lasci traccia
   (ripasso, monete, contatori) lo prova `salto-giochi`, dentro i giochi.
   Vedi docs/core/comandi.md.
   `node test/esegui.mjs salto --niente-build`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, attendi } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { hash: 'admin', attesa: '[data-admin]' })
await azzera(page, { attesa: '[data-admin]' })

/* ---------- 1. la leva: in #admin, e spenta di partenza ---------- */
const leva = page.locator('[data-azione="tasto-salta"]')
controlla('la leva c\'è in #admin', await leva.count() === 1)
controlla('di partenza è spenta', await page.locator('[data-azione="tasto-salta"].acceso').count() === 0)

/* ---------- 2. spenta, la domanda non ha il tasto ---------- */
async function apriProva() {
  // dalla pagina dei trucchi alla home: senza il #admin nell'indirizzo, si ricarica
  await page.evaluate(() => history.replaceState(null, '', location.pathname))
  await page.reload()
  await page.waitForSelector('.carte', { timeout: 5000 })
  await page.click('[data-azione="grandi"]')
  await page.waitForSelector('.tastierino', { timeout: 5000 })
  for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
  await page.waitForSelector('.carte', { timeout: 5000 })
  await page.click('[data-scheda="giochi"]')
  await page.waitForSelector('[data-manopola] .quadro', { timeout: 5000 })
  const sel = '[data-manopola] [data-apri="medie"]'
  if (await page.locator(sel).count() === 0) return false
  if (!(await page.locator(sel).evaluate(el => el.classList.contains('aperta')))) await page.click(sel)
  await attendi(page, 150)
  await page.locator(`${sel} .prova`).first().click()
  await page.waitForSelector('.qz-tasto', { timeout: 5000 })
  await attendi(page, 450)                           // la finestra cieca del montaggio
  return true
}
controlla('si arriva a una domanda dal banco dei grandi', await apriProva())
uguale('spenta, la domanda non ha nessun «salta»', await page.locator('[data-azione="salta"]').count(), 0)

/* ---------- 3. si accende da #admin, e si ricorda ---------- */
await page.evaluate(() => { location.hash = 'admin' })
await page.waitForSelector('[data-admin]', { timeout: 5000 })
await leva.click()
controlla('toccata si accende', await page.locator('[data-azione="tasto-salta"].acceso').count() === 1)
await attendi(page, 600)
await page.reload()
await page.waitForSelector('[data-admin]', { timeout: 10000 })
controlla('ricaricando resta accesa: è del telefono',
          await page.locator('[data-azione="tasto-salta"].acceso').count() === 1)

/* ---------- 4. accesa, il tasto c'è e passa alla domanda dopo ---------- */
controlla('si arriva di nuovo a una domanda', await apriProva())
const salta = page.locator('.qz-carta [data-azione="salta"]')
controlla('accesa, la domanda ha il suo «salta»', await salta.isVisible())
await salta.click()
await page.waitForSelector('[data-saltata]', { timeout: 2000 })
controlla('la risposta si accende come giusta', await page.locator('.qz-tasto.giusta').count() > 0)
uguale('e non si salta due volte: il tasto sparisce', await page.locator('.qz-carta [data-azione="salta"]').count(), 0)
await page.waitForFunction(() => !document.querySelector('[data-saltata]'), null, { timeout: 5000 })
await page.waitForSelector('.qz-carta [data-azione="salta"]', { timeout: 3000 })
controlla('si passa a una domanda nuova, che ha di nuovo il suo tasto', true)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
nota('la leva di #admin e la Domanda comune')
riassunto('il tasto salta — la leva e la domanda comune')
