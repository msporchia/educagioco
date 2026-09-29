// La cripta: lastroni freddi, mattoni caldi (distinguibili anche al buio),
// luce verde-menta. Vedi docs/core/grafica.md per lo schema di un ambiente.
import { mattoni, roccia, lastre, mattonelle } from '../materiali/pattern.js'

export const CRIPTA = {
  nome: 'La cripta',

  mura: [
    mattoni('#8f6146', '#5c3a29'),                                        // cotto rosso
    mattoni('#7e6350', '#4e3b2e', { seme: 2, quanto: 0.26 }),             // cotto bruno
    mattoni('#6f6157', '#443a33', { seme: 9, quanto: 0.2, dove: 'freddo' }),  // cotto grigio
    mattoni('#7a5340', '#4a3020', { modo: 'vecchio', dove: 'usura', quanto: 0.18, seme: 5 }),
    mattoni('#6a4736', '#40281c', { modo: 'rotto', dove: 'umido', quanto: 0.12, seme: 7 }),
    roccia('#5f5148', '#332a25', { modo: 'stratificata', dove: 'umido',
                                   quanto: 0.09, sporco: 0.2 }),
  ],

  suolo: [
    lastre('#5e6169', '#474a52'),
    lastre('#5a5d63', '#43464d', { seme: 3, quanto: 0.28 }),
    lastre('#565962', '#3f4249', { modo: 'consumato', dove: 'usura', quanto: 0.2, seme: 4 }),
    mattonelle('#5a5750', '#403e3a', { dove: 'umido', quanto: 0.12 }),
  ],

  campi: { umido: 5, usura: 6.5, freddo: 8 },

  fondo: ['#22242a', '#16171c'],
  chiazze: ['#53565e', '#141519'],
  terra: '#4a3c33', sasso: '#7a6a5c', muschio: '#4a6b4a',
  erbaC: '#5f8a4a', erbaS: '#3f6b3a',
  giunto: '#2b1b13',
  luce: '#7fe0c0', fiamma: '#35c79a', buio: 0.42, torce: true,

  varianti: ['liscio', 'liscio', 'usura', 'screpolato', 'licheni', 'detriti'],

  // `rotto` non è un campo: sono i pezzi caduti dove il lastricato è saltato
  dettagli: [['crepe', 2.3], ['ossa', 3.3, 'aperto'], ['muschio', 4, 'umido'],
             ['pozze', 3.4, 'umido'], ['ciottoli', 5.2, 'controMuro'],
             ['ciottoli', 3, 'rotto'], ['ragnatele', 4.6, 'angolo']],
}
