/* ═══════════════════════════════════════════════════════════════════
   LA TANA DEL MONDO DI SOPRA, COL DITO — docs/sotterraneo/mondo-3d.md, «La tana»

   Ogni luogo ha la sua tana col suo segno (il cerchio di sassi, le braci,
   le croci storte…). Davanti a una il costo resta sotto i limiti; nella
   veduta d'insieme la tana si segna con un teschio solo da quando la sua
   cella è stata vista, e si fa grigio quando il suo signore è morto.
   Nei test: `[data-nome-posto="tana:<luogo>"]` (classe `sot3d-nome-tana`,
   `sot3d-nome-morta`), `window.__mondo3d` (`porta`, `senzaMostri`, `stato()`).
   `node test/esegui.mjs sotterraneo-mondo-tana`
   tempo: 150
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, scatto, attendi, mondoPronto } from '../aiuto/browser.mjs'
import { seminaIlSotterraneo } from '../aiuto/sotterraneo-semina.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { ilMondo } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const m = ilMondo()
const R = m.regioni.find(r => r.chiave === 'cimitero')
const g3d = () => page.evaluate(() => window.__sotterraneo3d.grafica())
const nomi = () => page.locator('[data-nome-posto^="tana:"]')
async function veduta(aperta) {
  await page.evaluate(() => document.querySelector('[data-casella-barra="mappa"]').click())
  if (aperta) await page.waitForSelector('[data-veduta]', { timeout: 5000 })
  else await page.waitForSelector('[data-veduta]', { state: 'detached', timeout: 5000 })
  await attendi(page, aperta ? 2500 : 500)
}

await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
await azzera(page)
await seminaIlSotterraneo(page, { finite: 0, gioco: 'sotterraneo3d' })
await mondoPronto(page)
await attendi(page, 2000)

/* ---------- 1. alla partenza nessuna tana è stata trovata: la veduta non ne segna ---------- */
await veduta(true)
uguale('nella veduta di chi parte non c\'è nessuna tana', await nomi().count(), 0)
await veduta(false)

/* ---------- 2. davanti alla tana: il suo segno, e quanto costa ---------- */
await page.evaluate(([x, y]) => { window.__mondo3d.senzaMostri(); window.__mondo3d.porta(x + 0.5, y + 4.5) }, [R.tana.x, R.tana.y])
await attendi(page, 4500)
{
  const g = await g3d()
  controlla('la zona del cimitero è caricata', g.zone && g.zone.includes(R.zona), JSON.stringify(g.zone))
  dentro('davanti alla tana sotto le 150 chiamate', g.chiamate, 10, 150)
  dentro('e sotto i 400 mila triangoli', g.triangoli, 1000, 400000)
  nota(`davanti alla tana del cimitero: ${g.chiamate} chiamate, ${Math.round(g.triangoli / 1000)}k triangoli`)
  controlla('il cuore della tana si vede (la nebbia l\'ha aperto)', await page.evaluate(([x, y]) => window.__sotterraneo3d.visto(x + 0.5, y + 0.5), [R.tana.x, R.tana.y]))
  await scatto(page, 'sotterraneo-mondo-tana')
}

/* ---------- 3. trovata: nella veduta c'è il teschio, vivo; morto il signore, grigio ---------- */
await veduta(true)
{
  const t = page.locator('[data-nome-posto="tana:cimitero"]')
  uguale('la tana trovata è nella veduta', await t.count(), 1)
  uguale('col suo teschio', (await t.innerText()).trim(), '💀')
  controlla('acceso: il signore è vivo', !(await t.getAttribute('class')).includes('sot3d-nome-morta'), await t.getAttribute('class'))
  controlla('e le tane non trovate non ci sono', (await nomi().count()) <= 2, await nomi().count())
  await scatto(page, 'sotterraneo-mondo-tana-veduta')
}
await veduta(false)
await page.evaluate(() => { const st = window.__mondo3d.stato(); st.signoriMorti.add('cimitero') })
await attendi(page, 300)
await veduta(true)
{
  const t = page.locator('[data-nome-posto="tana:cimitero"]')
  uguale('morto il signore la tana c\'è ancora', await t.count(), 1)
  controlla('ma è spenta (grigia)', (await t.getAttribute('class')).includes('sot3d-nome-morta'), await t.getAttribute('class'))
  await scatto(page, 'sotterraneo-mondo-tana-veduta-morta')
}

uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('la tana del mondo di sopra col dito')
