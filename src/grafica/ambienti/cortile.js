/* ═════ IL CORTILE ═════
   La stanza all'aperto: erba, sole, mura di castello intorno. È
   l'unica senza buio e senza torce — e serve come metro di paragone
   per tutte le altre: se una stanza chiusa sembra cupa come questa,
   non è ancora abbastanza chiusa.

   Il muro è pietra chiara in tre partite (calda, grigia, scaldata dal
   sole), con un basamento di mattoni e roccia dove la fondazione si
   vede. Il prato ha un vialetto di lastre che spunta dall'erba, più
   consumato nel mezzo: è dove passano i piedi, non dove cresce
   l'erba. */
import { pietra, mattoni, roccia, erba, lastre } from '../materiali/pattern.js'

export const CORTILE = {
  nome: 'Il cortile',

  mura: [
    pietra('#d3c7ad', '#9c8e73'),
    pietra('#cabb9c', '#8f8169', { seme: 2, quanto: 0.24 }),
    pietra('#dcd0b4', '#a89a7c', { seme: 7, quanto: 0.15, dove: 'sole' }),
    mattoni('#b89a72', '#82613f', { dove: 'base', quanto: 0.14, seme: 3 }),
    roccia('#a89a80', '#665c4a', { dove: 'base', quanto: 0.08, sporco: 0.2, seme: 2 }),
  ],

  suolo: [
    erba('#7ec066', '#5b9c50'),
    lastre('#c8bb96', '#a99b73', { dove: 'sentiero', quanto: 0.16, seme: 2 }),
    lastre('#bcae89', '#9c8e68', { modo: 'consumato', dove: 'sentiero', quanto: 0.08, seme: 5 }),
  ],

  campi: { sole: 7, base: 6, sentiero: 6 },

  fondo: ['#7ec066', '#5b9c50'],
  chiazze: ['#93cf74', '#4a8a45'],
  terra: '#a8814f', sasso: '#a49a86', muschio: '#4f8f3f',
  erbaC: '#a8e08a', erbaS: '#48924a',
  giunto: '#6f6553',
  luce: '#fff3c4', buio: 0,

  varianti: ['liscio', 'liscio', 'usura', 'licheni', 'detriti'],

  /* i ciuffi e i fiori restano nel prato, i ciottoli sono quelli
     scivolati sul vialetto, le foglie si accumulano contro il muro */
  dettagli: [['ciuffi', 0.65, '!sentiero'], ['fiori', 2.3, '!sentiero'],
             ['ciottoli', 2.9, 'sentiero'], ['foglie', 3.6, 'base']],
}
