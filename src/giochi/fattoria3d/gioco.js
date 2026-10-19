/* Il manifesto della fattoria 3D (dato puro, calco codice-segreto/). Come la fattoria di sempre non è una campagna: tappe 0, è
   il posto dove si spendono le monete. In prova (`sperimentale`): sta dietro l'interruttore dei giochi in prova dei genitori.
   Usa risorse sue (raccolti, prodotti, lana, legna) e uno stato suo, `campagne.fattoria3d.cfg.stato`: non tocca quelli della
   fattoria di sempre. Le monete sono quelle vere. Vedi docs/fattoria3d/. */
import { normalizza } from './motore/stato.js'
import { LOTTI_INIZIALI } from './dati/mondo.js'

export const CHIAVE = 'fattoria3d'

export default {
  chiave: CHIAVE,
  nome: 'La fattoria 3D',
  icona: '🚜',
  che: 'una fattoria da girare, con terra da comprare',
  area: 'avventure',
  come: 'fare',
  copertina: { fondo: '#8fcf63', disegno: '#b98a4a', scena: 'colline' },
  tappe: 0,
  posto: true,           // un posto, non un'estremità: come la fattoria di sempre
  sperimentale: true,

  riassunto(av = { tappa: 0, libera: false, stelle: {}, cfg: {} }) {
    const stato = (av.cfg || {}).stato
    if (!stato) return 'un recinto di terra e un campo da seminare'
    const s = normalizza(stato)
    const lotti = Object.keys(s.lotti).length - Object.keys(LOTTI_INIZIALI).length
    const terra = lotti > 0 ? `+${lotti} di terra` : 'terra di partenza'
    return `${terra} · ${s.cose.length} cose sistemate`
  },

  // I contatori li muove Gioco.vue con segna(): fattoria3dTerre (lotti comprati), …Pezzi (pezzi e edifici messi),
  // …Raccolti (tessere tagliate), …Alberi (abbattuti), …Prodotti (usciti dal forno).
  albo: {
    area: { nome: 'La fattoria 3D', emoji: '🚜' },

    // Modesto apposta, come la fattoria di sempre: non è la scorciatoia per salire di livello senza un esercizio.
    xp: m => m.tot('fattoria3dTerre') + Math.floor(m.tot('fattoria3dPezzi') / 2) + Math.floor(m.tot('fattoria3dRaccolti') / 2)
             + Math.floor(m.tot('fattoria3dAlberi') / 2) + m.tot('fattoria3dProdotti'),
    provato: m => m.tot('fattoria3dTerre') + m.tot('fattoria3dPezzi') + m.tot('fattoria3dRaccolti') + m.tot('fattoria3dAlberi') > 0,

    traguardi: [
      { id: 'f3d-terre', emoji: '🌱', nome: 'Il recinto si allarga',
        come: n => `Compra ${n} lotti di terra`,
        soglie: [3, 10, 25], valore: m => m.tot('fattoria3dTerre') },
      { id: 'f3d-pezzi', emoji: '🧺', nome: 'Tutto a posto',
        come: n => `Metti ${n} pezzi nella fattoria`,
        soglie: [5, 20, 60], valore: m => m.tot('fattoria3dPezzi') },
      { id: 'f3d-raccolti', emoji: '🌾', nome: 'Falce in mano',
        come: n => `Raccogli ${n} volte`,
        soglie: [20, 80, 300], valore: m => m.tot('fattoria3dRaccolti') },
      { id: 'f3d-alberi', emoji: '🪓', nome: 'Taglialegna',
        come: n => `Abbatti ${n} alberi`,
        soglie: [5, 20, 50], valore: m => m.tot('fattoria3dAlberi') },
      { id: 'f3d-forno', emoji: '🥧', nome: 'Dal forno',
        come: n => `Ritira ${n} cose dalla pasticceria`,
        soglie: [3, 15, 50], valore: m => m.tot('fattoria3dProdotti') },
    ],
  },
}
