// Survivors a scuola (docs/survivors/scuola.md): ogni carta si paga con una domanda dell'esercizio. La forma di una scheda: docs/scuola/giochi.md
export default {
  id: 'survivors',
  nome: 'Survivors',
  nei: 'in Survivors',
  spiega: 'Il bambino muove un eroe che scappa dai mostri; ogni tanto può diventare più forte, e per farlo risponde a una domanda.',
  // per la maestra che sceglie il gioco, in un testo solo: cosa allena, un esempio fra «…», come cresce (il carosello mostra questo)
  allena: 'Il bambino guida un eroe che scappa dai mostri, e ogni tanto può potenziarlo: sceglie una carta e la paga rispondendo a una domanda, per esempio «Quale parola è scritta giusta: società, socetà o socièta?». La forza è che le domande possono venire da argomenti diversi, anche mescolati nella stessa partita: ortografia e animali, orologio e geometria, tabelline e lessico, decidendo quante di ognuno.',
  tred: false,
  difficolta: {
    facile: 'Cinque cuori invece di tre e mostri meno numerosi e meno resistenti: si resiste a lungo anche sbagliando qualche mossa.',
    difficile: 'Solo due cuori, più mostri e un po\' più resistenti: serve scappare bene e rispondere in fretta.',
  },
  // ogni esercizio del catalogo: le domande sono quelle delle schede
  accetta: e => e.tipo === 'tabelline' || e.tipo === 'modulo',
}
