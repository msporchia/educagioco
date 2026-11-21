/* La guida di Survivors, quella della prima partita e del `?` (docs/core/come-si-gioca.md): muoversi, salire di livello prendendo
   le gemme, pagare una carta con una domanda. Pura: dal quadro dice il passo `{ testo, dove, fine? }`, o null quando tace. Qui il
   campo non si ferma mai per la guida: muoversi e prendere gemme vogliono il tempo che scorre. */

export const BERSAGLI = { carta: '[data-carta]' }

/** Il quadro: `domanda` (aperta: tace), `carte` (l'offerta aperta), `mosso`, `carta` (fatti da quando la guida è accesa). */
export function guidaDiSurvivors(q = {}) {
  if (q.domanda) return null
  if (q.carta) return { testo: 'Scansa i mostri e prendi le gemme: con le carte diventi più forte', dove: null, fine: true }
  if (q.carte) return { testo: 'Scegli una carta e rispondi: se è giusta, la prendi', dove: BERSAGLI.carta }
  if (!q.mosso) return { testo: 'Tieni premuto e trascina: l\'eroe va da quella parte, e tira da solo', dove: null }
  return { testo: 'Passa sopra le gemme che lasciano i mostri: a ogni livello scegli una carta', dove: null }
}
