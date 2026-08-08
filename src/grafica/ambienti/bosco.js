/* ═════ IL BOSCO ═════
   Qui il muro non è un muro: sono le chiome. Il pavimento è quello del
   cortile ma più cupo e più caldo, e sopra ci cade la **luce a
   chiazze** — le pozze di sole che passano fra le foglie. Sono l'unica
   illuminazione: in un bosco non ci sono torce appese al muro, e
   sarebbe strano se ci fossero.

   `chiazzeLuce` è la forza di quelle pozze, da 0 a 1. Le disegna
   `luce.js` dopo il buio, se no il buio se le mangia. */
export const BOSCO = {
  nome: 'Il bosco',
  posa: 'erba', muratura: 'alberi',
  fondo: ['#4c7644', '#325633'],
  chiazze: ['#6b9550', '#26482c'],
  lastra: ['#4c7644', '#325633'],
  terra: '#6b5334', sasso: '#8a8474', muschio: '#3f7a3a',
  erbaC: '#8fc96a', erbaS: '#3f7a3a',
  // le chiome: due verdi **distanti fra loro**, se no i ciuffi si
  // impastano e il bosco torna un rettangolo verde scuro
  muro: ['#4a7a45', '#1d3a24'], giunto: '#14251a',
  fungo: '#c9a04a',
  // la luce a chiazze tenuta bassa: più forte diventava una macchia
  // gialla sull'erba, e sembrava terra invece che sole
  luce: '#fff6dc', buio: 0.2, chiazzeLuce: 0.3,
  varianti: ['liscio', 'liscio', 'usura', 'licheni', 'detriti'],
  dettagli: [['ciuffi', 0.8], ['cespugli', 2.3], ['fiori', 3],
             ['foglie', 2.2], ['funghi', 4.3]],
}
