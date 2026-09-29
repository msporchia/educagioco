// La sala del tesoro: mosaico e marmo, il motivo in una cornice lungo i muri e il
// resto vuoto apposta — è il vuoto che fa sembrare prezioso il disegno.
import { marmo, pietra, roccia, mosaico, lastre } from '../materiali/pattern.js'

export const TESORO = {
  nome: 'La sala del tesoro',

  mura: [
    marmo('#efe6d2', '#bdae90'),
    marmo('#e6dbc0', '#b0a081', { seme: 3, quanto: 0.24 }),
    marmo('#f2ead6', '#c7b899', { seme: 8, quanto: 0.15, dove: 'lustro' }),
    pietra('#cdbfa0', '#9c8e73', { dove: 'crollo', quanto: 0.14, seme: 4 }),
    roccia('#a8987c', '#665c4a', { dove: 'crollo', quanto: 0.08, sporco: 0.18, seme: 2 }),
  ],

  suolo: [
    // il fondo del mosaico è marmo, non oro: l'oro come base si mangiava la stanza
    mosaico('#e4d8bd', '#bfae8e'),
    lastre('#b8a37e', '#8f7d5e', { dove: 'crollo', quanto: 0.14, seme: 3 }),
    lastre('#a89572', '#7f6d50', { modo: 'consumato', dove: 'crollo', quanto: 0.08, seme: 6 }),
  ],

  campi: { lustro: 6, crollo: 8 },

  fondo: ['#6b5136', '#4f3c28'],
  chiazze: ['#c9a86a', '#5a4229'],
  tessere: ['#e2d5b8', '#b06a54', '#dcb75e', '#8e9db4'],
  terra: '#8a6a45', sasso: '#b0a084', muschio: '#6f9a4a',
  erbaC: '#a8e08a', erbaS: '#5f9c53',
  giunto: '#8a7a5e',
  oro: '#e8c569',
  luce: '#ffe9a8', buio: 0.12,

  varianti: ['liscio', 'liscio', 'liscio', 'polvere', 'usura'],

  dettagli: [['monete', 3, 'lustro'], ['crepe', 6.4, 'crollo']],
}
