// La pelle del castello: come si vede il campo del tower defense
// (`views/TowerDefense.vue`, chiave `torri`) — il fondale dipinto sulla
// carta a scacchiera, le figure del foglio, il nome di ogni mostro nel
// vestito della tappa. Dove passa la strada non lo sa: lo sa il motore
// (`sullaCarta`). La monta `components/castello/CampoDiBattaglia.vue`.
import { sullaCarta } from '../../../motore/castello/carta.js'
import { PITTORI, caricaFigure, usaVestito } from './pittori.js'
import { figuraDi, NOMI } from './bestiario.js'
import { componi, carica, vestitoDi, TINTA_DI } from './vestito.js'

export const PELLE = {
  pittori: PITTORI,

  prepara() { caricaFigure().catch(() => {}) },

  // il vestito della tappa: lo leggono il campo, il nastro e la scheda
  vesti(t) { usaVestito(vestitoDi(t)) },

  nome(t, id) { return NOMI[figuraDi(vestitoDi(t), id)] },

  fondale(t, poi) {
    const nome = vestitoDi(t)
    const cv = componi(sullaCarta(t).carta.righe, nome)
    if (!cv) {
      carica(nome).then(poi, () => {})
      return p => p.rett(0, 0, p.W, p.H, TINTA_DI[nome])
    }
    // la carta è 768×1408, il mondo 420×760: si stira di un filo in
    // altezza (1,6%), che a occhio non si vede
    return p => {
      p.ctx.imageSmoothingQuality = 'high'
      p.ctx.drawImage(cv, 0, 0, p.W, p.H)
    }
  },
}
