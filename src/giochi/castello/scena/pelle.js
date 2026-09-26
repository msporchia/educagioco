/* ═══════════════════════════════════════════════════════════════════
   LA PELLE A SPRITE — quello che il tower defense vero si fa dare per
   vestirsi da castello a celle

   Il gioco `castello` non ha un motore suo né una schermata sua: è
   `views/TowerDefense.vue`, con le stesse tappe, gli stessi conti e lo
   stesso salvataggio di `torri`. Cambia solo la pelle, e la pelle è
   questo oggetto, che la schermata passa al campo
   (`components/castello/CampoDiBattaglia.vue`, prop `pelle`). Il campo
   ne usa tre cose, e senza pelle è il campo di sempre:

     pittori      chi dipinge cosa (`pittori.js`)
     tappa(t)     la tappa come la vede il motore: strada a squadra e
                  piazzole dalla carta (`motore/carta.js`), il resto
                  uguale — ondate, vite, prezzi non si toccano
     fondale(t, poi)  la funzione che dipinge il fondale di quella tappa.
                  Se la scena non è ancora decodificata dipinge il suo
                  colore e chiama `poi` quando è pronta, e il campo ridipinge.

   Il verso delle dipendenze è voluto: il gioco nuovo sa del vecchio, il
   vecchio non sa niente del nuovo. `torri` non si porta dietro una riga
   di questa cartella, e il giorno che `castello` prende il suo posto la
   pelle diventa il campo e basta.

   ⚠ La strada a squadra è più lunga di quella smussata (un sesto circa
   sul sentiero): i mostri ci mettono di più ad arrivare, e le tappe
   sono tarate sulla strada smussata. Qui va bene, è una prova; quando
   il gioco si rifà sulle carte, `npm run tara` va rifatto su di loro.
   ═══════════════════════════════════════════════════════════════════ */
import { cartaDi, percorsoDi } from '../motore/carta.js'
import { PITTORI_SPRITE, caricaFigure } from './pittori.js'
import { componi, carica, vestitoDi, TINTA_DI } from './vestito.js'

/* la carta di una tappa si calcola una volta: la chiedono sia il motore
   sia il fondale, e a ogni rientro nella stessa tappa */
const carte = new WeakMap()
const cartaPer = t => {
  if (!carte.has(t)) carte.set(t, cartaDi(t))
  return carte.get(t)
}

export const PELLE = {
  pittori: PITTORI_SPRITE,

  /* il foglio delle figure si comincia a decodificare quando il campo
     nasce: alla prima torre è già pronto */
  prepara() { caricaFigure().catch(() => {}) },

  tappa(t) { return { ...t, ...percorsoDi(cartaPer(t)) } },

  fondale(t, poi) {
    const nome = vestitoDi(t)
    const cv = componi(cartaPer(t).righe, nome)
    if (!cv) {
      carica(nome).then(poi, () => {})
      return p => p.rett(0, 0, p.W, p.H, TINTA_DI[nome])
    }
    /* la carta è 768×1408, il mondo 420×760: si stira di un filo in
       altezza (1,6%), che a occhio non si vede */
    return p => {
      p.ctx.imageSmoothingQuality = 'high'
      p.ctx.drawImage(cv, 0, 0, p.W, p.H)
    }
  },
}
