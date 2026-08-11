/* ═════ IL BOSCO ═════
   Qui il muro non è un muro: sono le chiome. Il pavimento è quello del
   cortile ma più cupo e più caldo, e sopra ci cade la **luce a
   chiazze** — le pozze di sole che passano fra le foglie. Sono l'unica
   illuminazione: in un bosco non ci sono torce appese al muro, e
   sarebbe strano se ci fossero.

   La chioma resta un'unica tessitura — ogni albero è già colorato per
   conto suo — e la varietà viene dalla radura: un masso muschioso
   dove il bosco si apre, e al centro la pietra spaccata. Lo stesso
   affioramento torna sotto i piedi, ghiaia e radici dove l'erba lascia
   il posto alla roccia.

   `chiazzeLuce` è la forza di quelle pozze, da 0 a 1. Le disegna
   `luce.js` dopo il buio, se no il buio se le mangia. */
import { alberi, roccia, erba, pietraia } from '../materiali/pattern.js'

export const BOSCO = {
  nome: 'Il bosco',

  mura: [
    // le chiome: due verdi **distanti fra loro**, se no i ciuffi si
    // impastano e il bosco torna un rettangolo verde scuro
    alberi('#4a7a45', '#1d3a24'),
    /* `alberi` ora chiede il permesso per ogni ciuffo — sottobosco e
       chioma comprese — come fanno tutte le altre tessiture, quindi la
       chioma può tornare a essere più di una voce sola. Le due righe
       qui sotto sono anche la prova che il contratto è chiuso: una
       seconda specie su un campo suo, e una chioma secca sul bordo
       della radura, prima che il bosco lasci il posto alla roccia. Se
       il predicato le taglia senza lasciare buchi neri, il permesso lo
       chiedono per davvero. */
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
  // la luce a chiazze tenuta bassa: più forte diventava una macchia
  // gialla sull'erba, e sembrava terra invece che sole
  luce: '#fff6dc', buio: 0.2, chiazzeLuce: 0.3,

  varianti: ['liscio', 'liscio', 'usura', 'licheni', 'detriti'],

  /* i fiori cercano il sole della radura, i ciuffi e i cespugli il
     sottobosco intorno, i funghi l'ombra più fitta */
  dettagli: [['ciuffi', 0.8, '!radura'], ['cespugli', 2.3, '!radura'],
             ['fiori', 3, 'radura'], ['foglie', 2.2], ['funghi', 4.3, 'ombra']],
}
