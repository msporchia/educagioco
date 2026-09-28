// Il cantiere libero: non è una tappa, non sta in `LIVELLI` e non conta
// nelle stelle. Vedi docs/costruttore/linguaggio.md.
import { CHIAVI_COLORI } from './colori.js'

export const APRE_DOPO = 6

export const LIBERO = {
  chiave: 'libero', nome: 'Il cantiere libero', icona: '🏗️', libero: true,
  chi: { emoji: '👷', nome: 'Il capomastro' },
  racconto: 'Qui non ordina nessuno: costruisci quello che vuoi. I progetti che hai scritto nei livelli li riprendi dalla cassetta.',
  prova: 'libero',
  ordini: [{ nome: 'il cantiere', robot: [1, 10], mappa: [
    '..................',
    '..................',
    '..................',
    '..................',
    '..................',
    '..................',
    '..................',
    '..................',
    '..................',
    '..................',
    '..................',
    '##################',
    '##################',
  ] }],
  cassetta: ['vai', 'metti', 'ripeti', 'finche', 'se', 'assegna', 'progetti'],
  posti: ['sotto', 'giu-destra', 'giu-sinistra'],
  colori: CHIAVI_COLORI,
  misure: true,
  ragiona: [
    'Qui non si vince e non si perde: scegli tu cosa costruire — una casa, un castello, una piramide a colori — e pensa prima a quali pezzi si ripetono.',
    'Nella cassetta, sotto «Dai tuoi altri cantieri», ci sono i progetti che hai scritto nei livelli: riprendili, e cambiali come vuoi.',
    'Un progetto può chiamare un altro progetto: una casa fatta di muri, un villaggio fatto di case.',
  ],
}
