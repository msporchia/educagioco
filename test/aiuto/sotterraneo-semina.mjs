/* Un eroe del sotterraneo in regola con la storia, sulla terra di sopra: N discese finite, la roba e il livello che la
   storia si aspetta, la mappa scoperta. Lo usano gli strumenti che guardano una schermata (strumenti/scatta-app.mjs,
   `--storia`) e i test che non vogliono ripetere il seme (docs/core/comandi.md). */
import { semina, scegli, attendi } from './browser.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { robaAttesa, crescitaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { PARTENZA } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'

// `zaino`: chiavi di pezzi da mettere in tasca in più (un bastone da guardare nel pannello, un elisir da bere); `punti`: quanti
// punti delle caratteristiche tenere ancora da dare (si tolgono dalle ultime), per vedere cosa cambia sotto ogni «+»
export function campagnaSeminata({ finite = 0, eroe = 'cavaliere', missioni = {}, parlato = true, gemme = 5, zaino = [], punti = 0 } = {}) {
  const k = Math.max(0, Math.min(finite, CAMPAGNA.length))
  const stelle = Object.fromEntries(Array.from({ length: k }, (_, i) => [i, 3]))
  const roba = robaAttesa(eroe, k, { gemme })
  roba.zaino = [...roba.zaino, ...zaino]
  const crescita = crescitaAttesa(eroe, k)
  for (let da = punti; da > 0;) {
    const c = ['tempra', 'intelligenza', 'destrezza', 'forza'].find(x => crescita[x] > 0)
    if (!c) break
    crescita[c]--; da--
  }
  const avv = { tappa: k, libera: false, stelle, missioni, roba,
                crescita,
                terra: { nebbia: 'f'.repeat(768), dove: PARTENZA.piede, parlato } }
  return { tappa: k, libera: false, stelle, cfg: { mondo: MONDO, eroe, avventure: { [eroe]: avv } } }
}

export async function seminaIlSotterraneo(page, opzioni = {}) {
  const { eroe = 'cavaliere', gioco = 'sotterraneo' } = opzioni
  await semina(page, {
    coins: 300, settings: { sperimentali: true },
    campagne: { sotterraneo: campagnaSeminata({ ...opzioni, eroe }) },
  })
  await scegli(page, gioco)
  await page.waitForSelector(gioco === 'sotterraneo3d' ? '[data-mondo3d][data-pronto]' : '[data-terra]', { timeout: 20000 })
  await attendi(page, 600)
}
