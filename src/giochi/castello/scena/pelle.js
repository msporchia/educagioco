// La pelle a sprite: il gioco `castello` è `views/TowerDefense.vue` con le
// stesse tappe/conti/salvataggio di `torri`, e cambia solo la pelle passata
// al campo (CampoDiBattaglia, prop `pelle`). Il verso delle dipendenze è
// voluto: il gioco nuovo sa del vecchio, non viceversa. Vedi
// docs/castello/da-fare.md per il conto ancora aperto sulla taratura.
import { sullaCarta } from '../../../motore/castello/carta.js'
import { PITTORI_SPRITE, caricaFigure, usaVestito } from './pittori.js'
import { figuraDi, NOMI } from './bestiario.js'
import { componi, carica, vestitoDi, TINTA_DI } from './vestito.js'

export const PELLE = {
  pittori: PITTORI_SPRITE,

  prepara() { caricaFigure().catch(() => {}) },

  // la strada e le piazzole il motore le prende già dalla carta
  // (`sullaCarta`): alla pelle resta da sapere che vestito mettere
  tappa(t) {
    usaVestito(vestitoDi(t))
    return t
  },

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
