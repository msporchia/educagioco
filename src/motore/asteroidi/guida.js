/* La guida degli Asteroidi, quella del primo giro e del `?` (docs/core/come-si-gioca.md): un sasso giusto colpito davvero.
   Pura: dal quadro dice il passo `{ testo, dove, sassi?, fine? }`, o null quando tace. `sassi` chiede il segno nella scena 3D
   attorno a tutti i sassi (mai solo al giusto: la guida non dice la risposta). */

export const BERSAGLI = { domanda: '[data-domanda-nave]' }

/**
 * Il quadro: `giusta`, `sbagliata` (fatte da quando la guida è accesa), `tastiera` (a scuola: ← → e Invio).
 */
export function guidaDegliAsteroidi(q = {}) {
  if (q.giusta) return { testo: 'Colpisci il sasso giusto prima che cada: se arriva in fondo perdi una vita', dove: null, fine: true }
  const come = q.tastiera ? 'sceglilo con ← → e spara con Invio' : 'toccalo'
  if (q.sbagliata) return { testo: 'Quel sasso aveva un altro numero: rifai il conto e cerca il risultato', dove: BERSAGLI.domanda, sassi: true }
  return { testo: `Fai il conto, trova il sasso col risultato e ${come}`, dove: BERSAGLI.domanda, sassi: true }
}
