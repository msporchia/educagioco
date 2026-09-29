// La miniera: terra battuta e binari, l'unico pavimento con una direzione
// insieme al tappeto del trono. Vedi docs/core/grafica.md.
import { legno, roccia, mattoni, binari, pietraia, mattonelle } from '../materiali/pattern.js'

export const MINIERA = {
  nome: 'La miniera',

  mura: [
    legno('#8a6640', '#543b24'),
    legno('#836142', '#4d3a26', { seme: 4, quanto: 0.22 }),
    legno('#6a4a2c', '#3a2a18', { modo: 'marcio', dove: 'crollo', quanto: 0.18, seme: 6 }),
    roccia('#6b6053', '#433a2f', { modo: 'frantumata', dove: 'crollo', quanto: 0.16, seme: 3 }),
    mattoni('#7a5c42', '#4a3826', { dove: 'crollo', quanto: 0.08, seme: 5 }),
  ],

  suolo: [
    binari('#5a4a38', '#43372a'),
    pietraia('#544334', '#3c3226', { dove: 'crollo', quanto: 0.14, seme: 4 }),
    mattonelle('#5c4a3a', '#40342a', { dove: 'crollo', quanto: 0.08, seme: 2 }),
  ],

  campi: { crollo: 4.5, polvere: 7 },

  // più chiara di quanto verrebbe da pensare: un fondo scuro sotto un buio alto
  // diventa un vuoto marrone in cui non si vede binario né stanza
  fondo: ['#514231', '#372c20'],
  chiazze: ['#7a6449', '#2a2119'],
  terra: '#6f5740', sasso: '#8a7f6e', muschio: '#4a6b4a',
  erbaC: '#5f8a4a', erbaS: '#3f6b3a',
  giunto: '#1e1710',
  cristallo: '#7fd8e0',
  luce: '#ffca7a', fiamma: '#ffa63c', buio: 0.3, torce: true,

  varianti: ['liscio', 'liscio', 'polvere', 'detriti', 'screpolato', 'ombra'],

  dettagli: [['ciottoli', 2.3, 'crollo'], ['assi', 3.6, 'polvere'],
             ['cristalli', 4, 'crollo'], ['crepe', 5, 'crollo']],
}
