/* La guida di Castle Battle, quella del primo giro e del `?` (docs/core/come-si-gioca.md): una caserma costruita e una
   potenziata, fatte davvero nella battaglia di adesso. Pura: dal quadro dice il passo `{ testo, dove, aspetta?, fine? }`, o
   null quando tace. Si legge lo schermo, non un copione: un conto sbagliato riporta al passo di prima da sé. */

export const BERSAGLI = {
  piazzola: posto => `[data-piazzola="${posto}"]`,
  costruisci: id => `[data-costruisci="${id}"]`,
  monete: '[data-monete]',
  potenzia: '[data-anello="potenzia"]',
}

/**
 * Il quadro (numeri e sì/no, niente motore):
 *  - `domanda`, `dettagli`: il calcolo o la scheda dei numeri aperti (la guida tace: hanno già la loro schermata)
 *  - `scelta`: le truppe che si possono pagare nella nuvoletta aperta, dalla meno cara (`['scheletri', …]`), o null se è chiusa
 *  - `anello`: la piazzola dell'edificio toccato, o null (anche se l'anello è sul castello)
 *  - `libera`: una piazzola libera dove i 💎 bastano per costruire, o null; `vuote`: quante piazzole sono libere
 *  - `caserme`: le caserme di chi gioca, `[{ posto, puoi, riposa, attesa }]` (`puoi`: potenziabile adesso; `attesa`: al
 *    livello 1 e mancano solo i 💎)
 *  - `costruita`, `potenziata`: fatte da quando la guida è accesa
 *  - `infinita`: la battaglia senza timer
 */
export function guidaDiArena(q = {}) {
  if (q.domanda || q.dettagli) return null
  const caserme = q.caserme || []
  if (!q.costruita) {
    if (q.scelta && q.scelta.length) return { testo: 'Scegli chi costruire: il numero è quanto costa in 💎', dove: BERSAGLI.costruisci(q.scelta[0]) }
    if (q.libera !== null && q.libera !== undefined) return { testo: 'Tocca una piazzola vuota: lì si costruisce una caserma', dove: BERSAGLI.piazzola(q.libera) }
    if (q.vuote > 0) return { testo: 'I 💎 arrivano da soli: aspetta che bastino per una caserma', dove: BERSAGLI.monete, aspetta: true }
  }
  if (!q.potenziata) {
    const pronta = caserme.find(c => c.puoi)
    if (pronta) {
      if (caserme.some(c => c.puoi && c.posto === q.anello)) return { testo: '⬆️ fa salire la caserma: truppe più forti e più numerose', dove: BERSAGLI.potenzia }
      return { testo: 'Tocca la tua caserma', dove: BERSAGLI.piazzola(pronta.posto) }
    }
    // un conto sbagliato al potenziamento: la caserma riposa, e per riprovare il tempo deve scorrere
    const riposa = caserme.find(c => c.riposa)
    if (riposa) return { testo: 'Dopo un conto sbagliato la caserma riposa un attimo: aspetta e riprova', dove: BERSAGLI.piazzola(riposa.posto), aspetta: true }
    if (caserme.some(c => c.attesa)) return { testo: 'I 💎 arrivano da soli: aspetta che bastino per far salire la caserma', dove: BERSAGLI.monete, aspetta: true }
  }
  // l'ultima riga dice come si va avanti da soli (l'utente: «non gli ha spiegato come devono proseguire»): il giro si ripete
  const testo = 'Ora continua tu: costruisci altre caserme e falle salire, fino al castello rosso!'
  return { testo, dove: null, fine: true }
}
