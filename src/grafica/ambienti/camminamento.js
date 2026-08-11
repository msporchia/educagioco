/* ═════ IL CAMMINAMENTO ═════
   Il ballatoio sulle mura: calcare sbiancato dal sole, muro più scuro
   e più caldo del pavimento. Il salto di tinta fra i due non è un
   vezzo — sono di pietra tutti e due, e senza quel salto la stanza è
   un unico tessuto beige in cui non si vede dove si cammina.

   Il muro cede in due punti: dove il sole lo sbianca e dove l'umido
   lo intacca, con mattoni e roccia sotto l'intonaco. Il pavimento ha
   una fascia consumata al centro — dove si cammina — e più oltre il
   lastricato è saltato del tutto, roccia grezza sotto. */
import { pietra, mattoni, roccia, lastre, pietraia } from '../materiali/pattern.js'

export const CAMMINAMENTO = {
  nome: 'Il camminamento',

  mura: [
    pietra('#907f62', '#5c5343'),
    pietra('#8a765c', '#564c3e', { seme: 3, quanto: 0.24 }),
    pietra('#9c8968', '#665a48', { seme: 8, quanto: 0.16, dove: 'sole' }),
    mattoni('#7a6650', '#4a3d30', { dove: 'umido', quanto: 0.14, seme: 5 }),
    roccia('#6f6252', '#443a30', { dove: 'umido', quanto: 0.08, sporco: 0.2, seme: 2 }),
  ],

  suolo: [
    lastre('#e7e0cd', '#cdc4ad'),
    lastre('#e2dac4', '#c7bda3', { seme: 4, quanto: 0.26 }),
    lastre('#d8cfb4', '#b8ad92', { modo: 'consumato', dove: 'usura', quanto: 0.2, seme: 6 }),
    pietraia('#c2b89e', '#a89c80', { dove: 'usura', quanto: 0.09, seme: 3 }),
  ],

  campi: { sole: 7, umido: 5, usura: 6.5 },

  fondo: ['#94896f', '#736a58'],            // la malta fra le lastre
  chiazze: ['#efe7d4', '#8a7e66'],
  terra: '#b3a68c', sasso: '#9c927e', muschio: '#6f9a4a',
  erbaC: '#a8e08a', erbaS: '#5f9c53',
  giunto: '#4d4738',
  luce: '#fff0cf', buio: 0.06,

  varianti: ['liscio', 'liscio', 'polvere', 'usura', 'screpolato', 'detriti'],

  dettagli: [['ciottoli', 2.1, 'usura'], ['ciuffi', 3.2, 'umido'], ['crepe', 4.3, 'rotto']],
}
