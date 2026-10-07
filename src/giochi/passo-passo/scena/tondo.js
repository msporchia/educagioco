// Le misure del tondo di una casella che servono a chi deve far posto (i test):
// le stelline prese stanno a cavallo del bordo di sotto, in una riga larga
// quanto quattro stelle, e sporgono di poco dal bottone. Tenute uguali a
// `.pp-casella-stelle` di stile.css. Vedi docs/passo-passo/mappa.md.
export const STELLE = { n: 4, lato: 12, fuori: 2 }
export const LARGO_STELLE = STELLE.n * STELLE.lato
