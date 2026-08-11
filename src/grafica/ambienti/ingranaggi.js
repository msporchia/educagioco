/* ═════ LA SALA DEGLI INGRANAGGI ═════
   Piastre di metallo e lastre imbullonate, ottone e ferro brunito. È
   la stanza più «costruita» di tutte: nessuna crepa fra le pietre,
   solo bulloni e macchie d'olio.

   Tre partite di ferro — sano, unto d'olio, consumato — e dove il
   rivestimento è del tutto scomparso, la roccia della fondazione. Il
   pavimento a piastre ha le stesse macchie d'olio del muro (lo stesso
   campo, la stessa causa) e la ghiaia sotto dove le piastre sono
   saltate. */
import { ferro, roccia, metallo, pietraia } from '../materiali/pattern.js'

export const INGRANAGGI = {
  nome: 'La sala degli ingranaggi',

  mura: [
    ferro('#8a7a63', '#4e463a'),
    ferro('#8f7f68', '#544c3e', { seme: 3, quanto: 0.24 }),
    ferro('#7f7057', '#463e32', { seme: 9, quanto: 0.15, dove: 'olio' }),
    ferro('#6e6150', '#3d372c', { seme: 6, quanto: 0.14, dove: 'usura' }),
    roccia('#6b6156', '#443c34', { dove: 'usura', quanto: 0.08, sporco: 0.2, seme: 2 }),
  ],

  suolo: [
    metallo('#6f7886', '#545c69'),
    metallo('#748090', '#5a6270', { seme: 4, quanto: 0.24 }),
    metallo('#647080', '#4a5260', { seme: 8, quanto: 0.14, dove: 'olio' }),
    pietraia('#665c50', '#463e34', { dove: 'usura', quanto: 0.1, seme: 3 }),
  ],

  campi: { olio: 5, usura: 7 },

  fondo: ['#2b2f36', '#1f2228'],
  chiazze: ['#7a8390', '#1b1e23'],
  terra: '#3f444d', sasso: '#79818d', muschio: '#4a6b5a',
  erbaC: '#5f8a4a', erbaS: '#3f6b3a',
  giunto: '#26282e',
  luce: '#ffca6a', fiamma: '#ffa63c', buio: 0.32, torce: true,

  varianti: ['liscio', 'liscio', 'ombra', 'polvere', 'detriti'],

  dettagli: [['bulloni', 2.9, '!usura'], ['crepe', 5.7, 'usura']],
}
