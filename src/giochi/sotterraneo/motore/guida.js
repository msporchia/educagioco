/* La guida del sotterraneo, quella della prima discesa e del `?` (docs/core/come-si-gioca.md): camminare, aprire qualcosa con una
   domanda, colpire un mostro con ⚔️. Pura: dal quadro dice il passo `{ testo, dove, fine? }`, o null quando tace. Il pavimento e
   le cose stanno nella scena 3D: lì niente anello, solo la riga. */

export const BERSAGLI = { attacco: '[data-caselle-abilita] [data-azione="attacco"]' }

/**
 * Il quadro: `domanda` (aperta: tace), `scontro` (lo scontro è aperto), `foglio` (un altro foglio è aperto: tace),
 * `camminato`, `risposto`, `colpito` (fatti da quando la guida è accesa).
 */
export function guidaDelSotterraneo(q = {}) {
  if (q.domanda) return null
  if (q.scontro) return q.colpito ? null : { testo: 'Tocca ⚔️ e rispondi: se è giusta, colpisci il mostro', dove: BERSAGLI.attacco }
  if (q.foglio) return null
  if (q.camminato && q.risposto && q.colpito) return { testo: 'Ogni risposta giusta apre, colpisce o cura. Cerca la scala per scendere', dove: null, fine: true }
  if (!q.camminato) return { testo: 'Tocca il pavimento dove vuoi andare: l\'eroe cammina fin lì', dove: null }
  if (!q.risposto) return { testo: 'Porte, forzieri e mostri chiedono una domanda: avvicinati e toccali', dove: null }
  return { testo: 'Quando incontri un mostro, lo scontro si fa rispondendo: cercane uno', dove: null }
}
