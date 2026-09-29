// Il bosco: il muro è chioma, non muro; l'unica luce è a chiazze (chiazzeLuce,
// disegnata da luce.js dopo il buio). Vedi docs/core/grafica.md.
import { alberi, roccia, erba, pietraia } from '../materiali/pattern.js'

export const BOSCO = {
  nome: 'Il bosco',

  mura: [
    // due verdi distanti fra loro, se no i ciuffi si impastano in un rettangolo verde scuro
    alberi('#4a7a45', '#1d3a24'),
    alberi('#5a8a4f', '#2a4a2c', { seme: 4, quanto: 0.3 }),
    alberi('#4a7a45', '#1d3a24', { modo: 'secco', dove: 'radura', quanto: 0.16 }),
    roccia('#6b6153', '#443c34', { dove: 'radura', quanto: 0.14, sporco: 0.18, seme: 3 }),
    roccia('#5c5346', '#372f27', { modo: 'frantumata', dove: 'radura', quanto: 0.08, seme: 6 }),
  ],

  suolo: [
    erba('#4c7644', '#325633'),
    erba('#537f47', '#375c36', { modo: 'secca', dove: 'radura', quanto: 0.22, seme: 5 }),
    pietraia('#4a4436', '#332e24', { dove: 'radura', quanto: 0.14, seme: 4 }),
    pietraia('#423c30', '#2c281f', { dove: 'radura', quanto: 0.08, seme: 7 }),
  ],

  campi: { radura: 5, ombra: 6 },

  fondo: ['#4c7644', '#325633'],
  chiazze: ['#6b9550', '#26482c'],
  terra: '#6b5334', sasso: '#8a8474', muschio: '#3f7a3a',
  erbaC: '#8fc96a', erbaS: '#3f7a3a',
  giunto: '#14251a',
  fungo: '#c9a04a',
  luce: '#fff6dc', buio: 0.2, chiazzeLuce: 0.3,   // più forte diventa terra, non sole

  varianti: ['liscio', 'liscio', 'usura', 'licheni', 'detriti'],

  dettagli: [['ciuffi', 0.8, '!radura'], ['cespugli', 2.3, '!radura'],
             ['fiori', 3, 'radura'], ['foglie', 2.2], ['funghi', 4.3, 'ombra']],
}
