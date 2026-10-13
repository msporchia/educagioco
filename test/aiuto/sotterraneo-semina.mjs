/* Un eroe del sotterraneo in regola con la storia, sulla terra di sopra: N discese finite, la roba e il livello che la
   storia si aspetta, la mappa scoperta. Lo usano gli strumenti che guardano una schermata (strumenti/scatta-app.mjs,
   `--storia`) e i test che non vogliono ripetere il seme (docs/core/comandi.md). */
import { semina, scegli, attendi } from './browser.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { robaAttesa, crescitaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { PARTENZA } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'

export async function seminaIlSotterraneo(page, { finite = 0, eroe = 'cavaliere', missioni = {}, parlato = true, gemme = 5 } = {}) {
  const k = Math.max(0, Math.min(finite, CAMPAGNA.length))
  const stelle = Object.fromEntries(Array.from({ length: k }, (_, i) => [i, 3]))
  const avv = { tappa: k, libera: false, stelle, missioni, roba: robaAttesa(eroe, k, { gemme }),
                crescita: crescitaAttesa(eroe, k),
                terra: { nebbia: 'f'.repeat(768), dove: PARTENZA.piede, parlato } }
  await semina(page, {
    coins: 300, settings: { sperimentali: true },
    campagne: { sotterraneo: { tappa: k, libera: false, stelle, cfg: { mondo: MONDO, eroe, avventure: { [eroe]: avv } } } },
  })
  await scegli(page, 'sotterraneo')
  await page.waitForSelector('[data-terra]', { timeout: 8000 })
  await attendi(page, 600)
}
