/* Castle Battle per la partita finta in due (../sfida-finta.mjs) e il banco della rete: la regola, le scelte di chi crea e le mosse
   dei due bambini finti. L'host costruisce e potenzia spesso (così la partita finisce), l'ospite muove poco. */
import { regolaArena } from '../../../src/giochi/arena/sfida/regia.js'

const AZIONI = ['costruisci', 'potenzia', 'miniera', 'ripara', 'castello', 'bomba']
const mossaACaso = (r, p) => {
  const azione = AZIONI[Math.floor(r() * AZIONI.length)]
  if (azione === 'costruisci') return [azione, p.truppeAmmesse[Math.floor(r() * p.truppeAmmesse.length)], Math.floor(r() * 6)]
  if (azione === 'potenzia') return [azione, Math.floor(r() * 6)]
  return [azione]
}

export default {
  regola: ({ firma }) => regolaArena({ firma }),
  scelte: seme => ({ terreno: 'lava', secondiARisposta: 2.5, seme: seme * 13 }),
  /* un passo da 16 ms di uno dei due: `inc.scegli(mossa)` se gli va */
  muovi(ruolo, inc, r) {
    const p = inc.partita
    if (ruolo === 'host') {
      if (r() < 0.02) { const x = r(); inc.scegli(x < 0.5 ? ['costruisci', p.truppeAmmesse[0], Math.floor(r() * 6)] : x < 0.85 ? ['potenzia', Math.floor(r() * 6)] : mossaACaso(r, p)) }
    } else if (r() < 0.001) inc.scegli(mossaACaso(r, p))
  },
}
