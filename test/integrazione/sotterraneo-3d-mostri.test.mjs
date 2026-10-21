/* ═══════════════════════════════════════════════════════════════════
   I MOSTRI E GLI EFFETTI 3D NELLA DISCESA (docs/sotterraneo/mostri-3d.md)

   Nello scontro i mostri col modello sono modelli 3D (`grafica().mostri3d`),
   un'abilità dell'eroe accende il suo effetto 3D, un mostro attacca con la
   sua posa senza errori; con `#sprite` tornano tutti sprite. Gli scatti
   (`--scatti`) per guardarli: lo scontro, la palla di fuoco, la cura.
   `node test/esegui.mjs sotterraneo-3d-mostri`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi } from '../aiuto/browser.mjs'
import { uguale, controlla, nota, riassunto } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const roba = { v: 1, gemme: 0, zaino: [], mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }
async function entra(hash) {
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await azzera(page)
  await page.setViewportSize({ width: 390, height: 844 })
  const a = { tappa: 1, libera: false, stelle: { 0: 3 }, missioni: {}, roba, terra: { nebbia: 'f'.repeat(768), dove: [55, 11], parlato: true } }
  await semina(page, { coins: 300, settings: { sperimentali: true },
    campagne: { sotterraneo: { tappa: 1, libera: false, stelle: { 0: 3 }, cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: a } } } } })
  await page.evaluate(h => { location.hash = h }, hash)
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 30000 })
  await page.waitForSelector('[data-pannello3d]', { timeout: 15000 })
  await attendi(page, 3000)
}
const grafica = () => page.evaluate(() => window.__sotterraneo3d.grafica())

await entra('sotterraneo3d=0&seme=7&stanza=sala&dpr=1&luce=stanza&sotterraneo=branco&mostri=3&tipo=goblin,scheletro,lupo')
{
  const g = await grafica()
  nota(`scontro con tre mostri: ${g.mostri3d} modelli 3D, ${g.chiamate} chiamate, ${g.triangoli} triangoli`)
  controlla('i mostri dello scontro sono modelli 3D', g.mostri3d >= 3, String(g.mostri3d))
  await scatto(page, 'sotterraneo-3d-mostri')
  const parte = await page.evaluate(() => window.__sotterraneo3d.prova('palla', 0))
  controlla('la palla di fuoco è un effetto 3D', parte)
  await attendi(page, 150)
  controlla('e in scena c\'è', (await grafica()).effetti3d > 0)
  await scatto(page, 'sotterraneo-3d-mostri-palla')
  // il tempo della scena va a fotogrammi (al più 50 ms l'uno): SwiftShader carico ne fa pochi, si aspetta che finisca
  const libero = await page.waitForFunction(() => window.__sotterraneo3d.grafica().effetti3d === 0, null, { timeout: 15000 }).then(() => true, () => false)
  controlla('finito, si libera', libero, String((await grafica()).effetti3d))
  await page.evaluate(() => window.__sotterraneo3d.prova('cura', 0, '#7dffa0'))
  await attendi(page, 300)
  await scatto(page, 'sotterraneo-3d-mostri-cura')
  for (const i of [0, 1, 2]) { await page.evaluate(i => window.__sotterraneo3d.prova('mostro', i), i); await attendi(page, 900) }
  const s = await page.evaluate(() => window.__sotterraneo3d.palco.stati.map(s => !!s.in3d))
  controlla('dopo gli attacchi restano modelli', s.every(Boolean), s.join())
}

await entra('sotterraneo3d=0&seme=7&stanza=sala&dpr=1&luce=stanza&sotterraneo=branco&mostri=3&tipo=goblin&sprite')
uguale('con #sprite nessun modello', (await grafica()).mostri3d, 0)

uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('i mostri e gli effetti 3d')
