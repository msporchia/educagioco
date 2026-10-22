// L'eroe più pesante da disegnare, per le misure: ogni casella col leggendario che porta e il copricapo raro. È il cheat
// `&corredo=leggendario` del Sotterraneo (Gioco.vue, corredoLeggendarioDaProva) rifatto qui, perché la misura non apre il gioco.
import { COSE, COPRICAPI, chiaveDelPezzo } from '../../../giochi/sotterraneo/dati/cose.js'
import { LEGGENDARI } from '../../../giochi/sotterraneo/dati/pezzi.js'
import { pescaAbilita } from '../../../giochi/sotterraneo/motore/bottino.js'

/** Veste il corredo `c` (una Corsa o un Corredo) di leggendari, come il cheat nel 3D. */
export function vestiLeggendario(c) {
  const L = c.livelloDelBottino || 1
  const leggendario = dove => {
    const id = Object.keys(LEGGENDARI).find(id => COSE[LEGGENDARI[id].base].dove === dove && c.porta(LEGGENDARI[id].base))
    return id ? chiaveDelPezzo(LEGGENDARI[id].base, L, 'leggendario', [], id) : null
  }
  c.mano = leggendario('mano')
  c.mancina = c.mano && COSE[c.mano].mani === 2 ? null : leggendario('mancina')
  c.corpo = leggendario('corpo')
  c.collo = leggendario('collo')
  c.dito = c.dito2 = leggendario('dito')
  const t = COPRICAPI.find(k => !COSE[k].deiGrossi && c.porta(k))
  c.testa = t ? chiaveDelPezzo(t, L, 'raro', pescaAbilita(t, 2)) : null
  c.sistemaIlCorredo()
  return c
}
