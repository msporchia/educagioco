// Survivors a scuola (docs/survivors/scuola.md): ogni carta si paga con una domanda dell'esercizio. La forma di una scheda: docs/scuola/giochi.md
export default {
  id: 'survivors',
  nome: 'Survivors',
  nei: 'in Survivors',
  spiega: 'Si scappa dai mostri e ogni potenziamento si paga con una domanda. Va con qualunque esercizio, anche a più voci.',
  tred: false,
  // ogni esercizio del catalogo: le domande sono quelle delle schede
  accetta: e => e.tipo === 'tabelline' || e.tipo === 'modulo',
}
