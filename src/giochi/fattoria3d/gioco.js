/* Il manifesto della fattoria 3D (dato puro, calco codice-segreto/). Come la fattoria di sempre non è una campagna: tappe 0, è
   il posto dove si spendono le monete. In prova (`sperimentale`): sta dietro l'interruttore dei giochi in prova dei genitori.
   Usa risorse sue (raccolti, prodotti, lana) e uno stato suo, `campagne.fattoria3d.cfg.stato`: non tocca quelli della
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
  // …Raccolti (tessere tagliate), …Alberi (abbattuti), …Sassi (sassi e cespugli tolti), …Prodotti (usciti dal forno), …Ordini (consegnati al banco),
  // …Uova e …Latte (raccolti dal pollaio e dalla stalla), …Mongolfiera (casse messe sulla mongolfiera) e …Fiere (le sorprese della fiera ricevute).
  // …Varieta (primato: i tipi diversi in mappa), …Vestiti (primato: gli addobbi addosso alle bestie), …Visite (entrate in un villaggio col trattore) e …Aiuti (una cassa riempita, un baratto, un acquisto dai vicini).
  albo: {
    area: { nome: 'La fattoria 3D', emoji: '🚜' },

    // Modesto apposta, come la fattoria di sempre: non è la scorciatoia per salire di livello senza un esercizio.
    xp: m => m.tot('fattoria3dTerre') + Math.floor(m.tot('fattoria3dPezzi') / 2) + Math.floor(m.tot('fattoria3dRaccolti') / 2)
             + Math.floor(m.tot('fattoria3dAlberi') / 2) + m.tot('fattoria3dProdotti') + m.best('fattoria3dVarieta'),
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
        come: n => `Ritira ${n} cose dalle macchine`,
        soglie: [3, 15, 50], valore: m => m.tot('fattoria3dProdotti') },
      { id: 'f3d-cortile', emoji: '🥚', nome: 'Il cortile',
        come: n => `Raccogli ${n} fra uova e latte`,
        soglie: [5, 25, 80], valore: m => m.tot('fattoria3dUova') + m.tot('fattoria3dLatte') },
      // I tipi diversi in mappa (la 2D ne ha 34 di soglia alta; qui il catalogo è 174, ma molti sono variazioni dello stesso verde)
      { id: 'f3d-varieta', emoji: '🎨', nome: 'Un po\' di tutto',
        come: n => `Tieni ${n} cose diverse nella fattoria`,
        soglie: [8, 20, 32], valore: m => m.best('fattoria3dVarieta') },
      { id: 'f3d-ordini', emoji: '🧺', nome: 'Ordini al banco',
        come: n => `Consegna ${n} ordini al banco`,
        soglie: [3, 15, 50], valore: m => m.tot('fattoria3dOrdini') },
      { id: 'f3d-mongolfiera', emoji: '🎈', nome: 'Sulla mongolfiera',
        come: n => `Metti ${n} casse sulla mongolfiera`,
        soglie: [10, 40, 120], valore: m => m.tot('fattoria3dMongolfiera') },
      { id: 'f3d-vestiti', emoji: '🎩', nome: 'Che eleganza',
        come: n => `Metti ${n} addobbi alle tue bestie`,
        soglie: [1, 4, 8], valore: m => m.best('fattoria3dVestiti') },
      { id: 'f3d-vicinato', emoji: '🚜', nome: 'Buon vicinato',
        come: n => `Visita i vicini e aiutali (${n} fra visite e aiuti)`,
        soglie: [8, 30, 100], valore: m => m.tot('fattoria3dVisite') + m.tot('fattoria3dAiuti') },
    ],
  },
}
