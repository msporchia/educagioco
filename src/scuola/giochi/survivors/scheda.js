// Survivors a scuola (docs/survivors/scuola.md): ogni carta si paga con una domanda dell'esercizio. La forma di una scheda: docs/scuola/giochi.md
export default {
  id: 'survivors',
  nome: 'Survivors',
  nei: 'in Survivors',
  spiega: 'Il bambino muove un eroe che scappa dai mostri; ogni tanto può diventare più forte, e per farlo risponde a una domanda.',
  // l'esercizio concreto, per la maestra che sceglie il gioco: lo mostra per primo, prima di com'è il gioco (`spiega`)
  allena: 'Le domande che scegli tu, a scelta multipla: quando l\'eroe può diventare più forte il gioco si ferma su una domanda (per esempio «7 × 6 = ?»), e la risposta giusta gli dà il potenziamento.',
  tred: false,
  difficolta: {
    facile: 'Cinque cuori invece di tre e mostri meno numerosi e meno resistenti: si resiste a lungo anche sbagliando qualche mossa.',
    difficile: 'Solo due cuori, più mostri e un po\' più resistenti: serve scappare bene e rispondere in fretta.',
  },
  // ogni esercizio del catalogo: le domande sono quelle delle schede
  accetta: e => e.tipo === 'tabelline' || e.tipo === 'modulo',
}
