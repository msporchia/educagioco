/* ═══════════════════════════════════════════════════════════════════
   CASTLE BATTLE — LA GUIDA «COME SI GIOCA», COL DITO

   perché: la guida «Come si gioca» di Castle Battle col dito: l'anello sulla piazzola, sulla truppa, sulla caserma e sul ⬆️, il campo fermo finché parla, la ✕ e il `?` che la richiama
   a parte perché: potrebbe stare in `arena`; resta a parte perché parte con `spiegazioni: true` (il banco di prova di solito le salta) e `arena` le tiene spente
   La prima battaglia della vita accende la guida da sé (docs/core/come-si-gioca.md): l'anello va sulla piazzola, sulla truppa
   meno cara, sulla caserma nata e sul ⬆️, e intanto il campo sta fermo. Costruita e potenziata, la riga finale col ✓ lascia
   correre il campo e se ne va da sola; la guida è segnata come vista. Poi il `?` la richiama, con la ✕ che la spegne.
   La parte della scuola (parte da sé con la ✕) sta in `integrazione/scuola`.

   Quello che da fuori non somiglia a un guasto: un campo che corre mentre la guida parla (nessun errore, ma chi impara si
   ritrova la base sotto assedio), e una riga finale che non se ne va più.
   `node test/esegui.mjs arena-guida`
   tempo: 40
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto, scegli, leggiProfilo } from '../aiuto/browser.mjs'
import { controlla, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { spiegazioni: true })
await azzera(page)
await semina(page, { settings: { eta: 8, sperimentali: true } })

await scegli(page, 'arena')
await page.waitForSelector('.ar-mappa', { timeout: 8000 })
controlla('sulla mappa il ? non c\'è (la guida sta sul campo)', await page.locator('[data-azione="aiuto"]').count() === 0)
await page.locator('[data-tappa="0"]').click()
await page.waitForSelector('[data-guida-riga]', { timeout: 8000 })

// aspetta la condizione e dice se è arrivata: un'attesa scaduta è un controllo che fallisce
const arriva = (sel, timeout, state = 'visible') => page.waitForSelector(sel, { timeout, state }).then(() => true, () => false)
const orologio = () => page.locator('.ar-hud b').first().innerText()
const indicato = sel => page.locator(`${sel}[data-indicato]`).count()
async function rispondiGiusto() {
  await page.waitForSelector('.ar .qz-tasto[data-giusta]', { timeout: 6000 })
  await attendi(page, 450)                           // la finestra cieca del montaggio
  await page.locator('.ar .qz-tasto[data-giusta]').click()
  await page.waitForSelector('.ar .qz-velo', { state: 'detached', timeout: 12000 })
}

/* ── la prima battaglia: la guida parte da sé, senza ✕ ── */
controlla('la guida parte da sé alla prima battaglia', await page.locator('[data-guida-riga]').count() === 1)
controlla('il primo giro di casa non ha la ✕', await page.locator('[data-guida-spegni]').count() === 0)
controlla('la dritta del campo tace mentre parla la guida', await page.locator('.ar-dritta').count() === 0)
controlla('l\'anello è su una piazzola libera', await indicato('[data-piazzola]:not([data-variante])') === 1)
const t0 = await orologio()
await attendi(page, 1600)
controlla('mentre la guida parla il campo sta fermo', await orologio() === t0, `${t0} → ${await orologio()}`)
await scatto(page, 'arena-guida-piazzola')

await page.locator('[data-piazzola][data-indicato]').click()
await page.waitForSelector('[data-costruisci][data-indicato]', { timeout: 4000 })
controlla('nella nuvoletta l\'anello è sulla truppa meno cara', await indicato('[data-costruisci="scheletri"]') === 1)
await scatto(page, 'arena-guida-truppa')
await page.locator('[data-costruisci][data-indicato]').click()
await rispondiGiusto()

controlla('nata la caserma, l\'anello passa a lei', await arriva('[data-piazzola][data-variante][data-indicato]', 4000))
await page.locator('[data-piazzola][data-variante][data-indicato]').click()
await page.waitForSelector('[data-anello="potenzia"][data-indicato]', { timeout: 4000 })
await scatto(page, 'arena-guida-potenzia')
await page.locator('[data-anello="potenzia"]').click()
await rispondiGiusto()

/* ── la fine: il ✓, il campo corre, la riga se ne va ── */
controlla('costruita e potenziata, la riga finale', await arriva('[data-guida-riga="fine"]', 4000))
controlla('nella riga finale niente anello', await page.locator('[data-indicato]').count() === 0)
const t1 = await orologio()
await attendi(page, 1600)
controlla('con la riga finale il campo corre', await orologio() !== t1, t1)
await scatto(page, 'arena-guida-fine')
controlla('la riga finale se ne va da sola', await arriva('[data-guida-riga]', 10000, 'detached'))
await attendi(page, 600)
controlla('la guida è segnata come vista', (await leggiProfilo(page)).settings?.guideViste?.arena === true)

/* ── il `?` la richiama, con la ✕ ── */
await page.locator('[data-azione="aiuto"]').click()
await page.waitForSelector('[data-guida-riga]', { timeout: 4000 })
controlla('il ? la richiama, con la ✕', await page.locator('[data-guida-spegni]').count() === 1)
// i 💎 della partenza sono spesi: o una piazzola libera, o i 💎 da aspettare
controlla('richiamata, fa costruire di nuovo', await indicato('[data-piazzola]:not([data-variante])') + await indicato('[data-monete]') === 1)
await page.locator('[data-guida-spegni]').click()
await page.waitForSelector('[data-guida-riga]', { state: 'detached', timeout: 2000 })
controlla('la ✕ la spegne', await page.locator('[data-indicato]').count() === 0)
await page.locator('[data-azione="aiuto"]').click()
await page.waitForSelector('[data-guida-riga]', { timeout: 2000 })
await page.locator('[data-azione="aiuto"]').click()
controlla('il ? la accende e la spegne', await arriva('[data-guida-riga]', 2000, 'detached'))

controlla('nessun errore', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('Castle Battle: la guida')
