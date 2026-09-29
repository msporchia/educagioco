// La grotta: l'opposto del corridoio, niente corsi — la parete legge scavata,
// non costruita. Vedi docs/core/grafica.md.
import { roccia, pietra, pietraia, lastre } from '../materiali/pattern.js'

export const GROTTA = {
  nome: 'La grotta',

  mura: [
    roccia('#6f6353', '#453c31'),
    roccia('#665a4a', '#3f372c', { seme: 3, quanto: 0.24 }),
    roccia('#786c5a', '#4c4335', { modo: 'stratificata', dove: 'strati', quanto: 0.18, seme: 5 }),
    roccia('#5c5245', '#362f26', { modo: 'frantumata', dove: 'crollo', quanto: 0.14, seme: 7 }),
    pietra('#645848', '#3a332a', { dove: 'crollo', quanto: 0.08, seme: 4 }),
  ],

  suolo: [
    pietraia('#544b3f', '#413931'),
    pietraia('#4e4638', '#3a332b', { seme: 4, quanto: 0.26 }),
    pietraia('#463f34', '#332d25', { dove: 'strati', quanto: 0.14, seme: 6 }),
    lastre('#584d3e', '#3f362b', { dove: 'crollo', quanto: 0.09, seme: 3 }),
  ],

  campi: { strati: 6, crollo: 4.5 },

  fondo: ['#2a2620', '#1a1714'],
  chiazze: ['#584f42', '#141210'],
  terra: '#4a4034', sasso: '#6b6153', muschio: '#4a6b4a',
  erbaC: '#5f8a4a', erbaS: '#3f6b3a',
  giunto: '#171310',
  fungo: '#8fb8c9',
  luce: '#ffbf7a', fiamma: '#ff9a3c', buio: 0.46, torce: true,

  varianti: ['liscio', 'liscio', 'usura', 'detriti', 'licheni', 'ombra'],

  dettagli: [['ciottoli', 2.3, ['crollo', 'controMuro']], ['funghi', 3.6],
             ['crepe', 4.3, 'strati'], ['muschio', 5, 'crollo']],
}
