/* La guida di English, quella della prima tappa e del `?` (docs/core/come-si-gioca.md): una risposta data davvero, a scelta o con
   le tessere. Pura: dal quadro dice il passo `{ testo, dove, fine? }`, o null quando tace. */

export const BERSAGLI = {
  capito: '[data-azione="capito"]',
  opzioni: '[data-opzione]',
  tessere: '[data-banco] [data-tessera]',
  fatto: '[data-azione="consegna"]',
}

/** Il quadro: `pagina` (la pagina di un concetto), `domanda`, `tessere` (si compone con le tessere), `pronto` (la fila è piena),
 *  `esito` (la correzione è a schermo: tace), `risposto` (fatto da quando la guida è accesa). */
export function guidaDiEnglish(q = {}) {
  if (q.risposto) return { testo: 'Avanti così fino in fondo alla tappa. Una parola inglese che non sai? Toccala', dove: null, fine: true }
  if (q.esito) return null
  if (q.pagina) return { testo: 'Leggi la pagina: dice come si fa. Poi tocca «Ho capito»', dove: BERSAGLI.capito }
  if (!q.domanda) return null
  if (q.tessere) return q.pronto ? { testo: 'Finita la frase, tocca «Fatto ✓»', dove: BERSAGLI.fatto }
                                 : { testo: 'Tocca le parole qui sotto, nell\'ordine giusto', dove: BERSAGLI.tessere }
  return { testo: 'Leggi la domanda e tocca la risposta giusta', dove: BERSAGLI.opzioni }
}
