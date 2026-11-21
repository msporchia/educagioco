/* La guida delle pozioni, quella della prima pozione e del `?` (docs/core/come-si-gioca.md): un ordine fatto dal mercante, fino
   alla ricetta. Pura: dal quadro dice il passo `{ testo, dove, fine? }`, o null quando tace. Le targhette ci sono solo col rotolo
   aperto: un selettore che non trova niente non accende niente, quindi «le targhette o Dal mercante» indica quello che c'è. */

export const BERSAGLI = {
  ampolle: '[data-targhetta], [data-azione="mercante"]',
  ordina: '[data-azione="ordina"]',
  pulisci: '[data-azione="pulisci"]',
}

/** Il quadro: `occupato` (il mercante versa: tace), `finita`, `pronta` (le dosi sono tutte giuste), `sporco`, `bozza` (quante
 *  ampolle nell'ordine), `ordinato` (fatto da quando la guida è accesa). */
export function guidaDellePozioni(q = {}) {
  if (q.occupato || q.finita) return null
  if (q.pronta) return q.ordinato ? { testo: 'Ora la ricetta: fai col dito quello che dice la riga accesa', dove: null, fine: true } : null
  if (q.sporco) return { testo: 'È traboccato: pulisci, poi ordina di nuovo', dove: BERSAGLI.pulisci }
  if (q.bozza) return { testo: 'Quando le ampolle fanno la dose della pergamena, tocca «Ordina»', dove: BERSAGLI.ordina }
  return { testo: 'Leggi sulla pergamena quanto serve, poi tocca le ampolle del mercante', dove: BERSAGLI.ampolle }
}
