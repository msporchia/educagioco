// La pelle a sprite: il gioco `castello` è `views/TowerDefense.vue` con le
// stesse tappe/conti/salvataggio di `torri`, e cambia solo la pelle passata
// al campo (CampoDiBattaglia, prop `pelle`). Il verso delle dipendenze è
// voluto: il gioco nuovo sa del vecchio, non viceversa. Vedi
// docs/castello/da-fare.md per il conto ancora aperto sulla taratura.
import { cartaDi, percorsoDi } from '../motore/carta.js'
import { PITTORI_SPRITE, caricaFigure, usaVestito } from './pittori.js'
import { figuraDi, NOMI } from './bestiario.js'
import { componi, carica, vestitoDi, TINTA_DI } from './vestito.js'

// la carta di una tappa si calcola una volta: la chiedono sia il motore
// sia il fondale, e a ogni rientro nella stessa tappa
const carte = new WeakMap()
const cartaPer = t => {
  if (!carte.has(t)) carte.set(t, cartaDi(t))
  return carte.get(t)
}

export const PELLE = {
  pittori: PITTORI_SPRITE,

  prepara() { caricaFigure().catch(() => {}) },

  tappa(t) {
    usaVestito(vestitoDi(t))
    return { ...t, ...percorsoDi(cartaPer(t)) }
  },

  nome(t, id) { return NOMI[figuraDi(vestitoDi(t), id)] },

  fondale(t, poi) {
    const nome = vestitoDi(t)
    const cv = componi(cartaPer(t).righe, nome)
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
