/* ═════ IL CORRIDOIO ═════
   La stanza di riferimento del dungeon: pietra fredda, buio a metà,
   torce arancioni ogni sei colonne. È qui che si è tarato tutto il
   resto — la scala della muratura, la distanza fra le torce, quanto
   può essere scuro il buio prima che un personaggio sparisca.

   Tre partite di pietra più una fascia più fredda in ombra, e dove il
   muro cede — l'umido — sotto ci sono i mattoni della vecchia
   muratura e poi la roccia viva. Il pavimento ha una fascia consumata
   al centro e i mattoni del sottofondo dove il lastricato è saltato,
   la stessa ricetta della cripta. */
import { pietra, mattoni, roccia, lastre, mattonelle } from '../materiali/pattern.js'

export const CORRIDOIO = {
  nome: 'Il corridoio',

  mura: [
    pietra('#726c62', '#4a4640'),
    pietra('#6c665c', '#454138', { seme: 2, quanto: 0.26 }),
    pietra('#7c766a', '#524d43', { seme: 9, quanto: 0.18, dove: 'ombra' }),
    mattoni('#655c4e', '#3c352c', { dove: 'umido', quanto: 0.14, seme: 5 }),
    roccia('#5c5346', '#39322a', { dove: 'umido', quanto: 0.08, sporco: 0.2, seme: 2 }),
  ],

  suolo: [
    lastre('#5c5c6b', '#43434f'),
    lastre('#57576a', '#3f3f4c', { seme: 3, quanto: 0.28 }),
    lastre('#535262', '#3a3a47', { modo: 'consumato', dove: 'usura', quanto: 0.2, seme: 5 }),
    mattonelle('#544f45', '#3a362e', { dove: 'umido', quanto: 0.12 }),
  ],

  campi: { umido: 5, usura: 6.5, ombra: 7.5 },

  fondo: ['#212129', '#17171d'],
  chiazze: ['#4e4e5c', '#131318'],
  terra: '#3a3a44', sasso: '#6a6a74', muschio: '#3f6b3a',
  erbaC: '#5f8a4a', erbaS: '#3f6b3a',
  giunto: '#25231f',
  luce: '#ffb45a', fiamma: '#ff8a2c', buio: 0.4, torce: true,

  varianti: ['liscio', 'liscio', 'usura', 'ombra', 'detriti', 'screpolato'],

  dettagli: [['pozze', 2.4, 'umido'], ['crepe', 2.9, 'rotto'],
             ['ciottoli', 3.6, 'usura'], ['muschio', 4.3, 'umido']],
}
