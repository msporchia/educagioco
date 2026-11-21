/* La guida della cucina, quella della prima partita e del `?` (docs/core/come-si-gioca.md): leggere una ricetta, muovere il cuoco,
   servire un piatto e dare il resto. Pura: dal quadro dice il passo `{ testo, dove, fine? }`, o null quando tace. La stanza è in 3D:
   lì niente anello, solo la riga; l'anello va sui piatti delle ordinazioni. */

export const BERSAGLI = { ordinato: '[data-ordinato]' }

/** Il quadro: `cassa` (il cliente paga), `ricetta` (aperta), e fatti da quando la guida è accesa: `letta`, `mosso`, `servito`. */
export function guidaDellaCucina(q = {}) {
  if (q.servito) return { testo: 'Così si lavora: cucina, servi e dai il resto giusto. Le ordinazioni scadono!', dove: null, fine: true }
  if (q.cassa) return { testo: 'Il cliente paga: guarda quanto ti dà e dai il resto giusto', dove: null }
  if (q.ricetta) return { testo: 'La ricetta dice cosa va nel piatto: guardala, poi chiudila e cucina', dove: null }
  if (!q.letta) return { testo: 'In cima ci sono le ordinazioni: tocca un piatto per vedere la ricetta', dove: BERSAGLI.ordinato }
  if (!q.mosso) return { testo: 'Tocca un posto della cucina: il cuoco ci va e fa quello che serve', dove: null }
  return { testo: 'Prendi un piatto dalla pila, mettici quello della ricetta e portalo alla consegna', dove: null }
}
