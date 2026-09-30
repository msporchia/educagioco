// In seconda, dopo «Ho un…»: Laura e Leo dalla nonna. Tre pagine, quattro
// domande; perché Leo ha freddo si capisce solo mettendo insieme due
// frasi. Formato in docs/lingue/libro.md.
export default {
  id: 'dalla-nonna',
  mondo: 'seconda',
  dopo: 'seconda-ho',
  titolo: 'Dalla nonna',
  variabili: {
    anni: { da: 'numeri', fra: ['five', 'six'] },
    // solo cose maschili: la domanda sul colore risponde «rosso», non «rossa»
    vestito: { da: 'vestiti', fra: ['hat', 'cap', 'coat', 'dress'] },
    colore: { da: 'colori', fra: ['red', 'blue', 'green', 'yellow'] },
    caldo: { da: 'vestiti', fra: ['coat', 'scarf', 'hat'] },
    ce: { fra: [true, false] },
    quanti: { da: 'numeri', fra: ['four', 'six', 'ten'] },
    dolce: { da: 'cibi', fra: ['cookie', 'banana', 'apple', 'strawberry'] },
  },
  vincoli: [v => v.vestito !== v.caldo],
  pagine: [
    [
      { en: 'Hello! I am Laura, and I am eight.', forma: 'this-is-my' },
      { en: 'This is my brother, Leo. He is {anni}.', forma: 'this-is-my' },
      { en: 'This is my grandmother. She is happy!', forma: 'this-is-my' },
    ],
    [
      { en: 'It is cold. I have got {a:colore} {vestito}.', forma: 'have-got' },
      { en: 'Leo, have you got {a:caldo}?', forma: 'have-got' },
      { se: v => v.ce, en: 'Yes, I have got {a:caldo}.', forma: 'have-got' },
      { se: v => !v.ce, en: 'No, I have not got {a:caldo}. I am cold!', forma: 'have-got' },
    ],
    [
      { en: 'Are you hungry? I have got {quanti} {dolce.pl}!', forma: 'have-got' },
      { en: 'Yes! Thank you, grandmother!', forma: 'saluti' },
    ],
  ],
  domande: [
    { testo: 'Quanti anni ha Leo?', risposta: v => v.anni.it, anche: ['otto', 'quattro'] },
    { testo: v => `Di che colore è ${v.vestito.il} di Laura?`, risposta: v => v.colore.it },
    { testo: 'Perché Leo ha freddo?', se: v => !v.ce, risposta: v => `Non ha ${v.caldo.un}`,
      anche: ['Ha fame', 'È stanco'] },
    { testo: 'Che cosa ha la nonna per i bambini?', risposta: v => `${v.quanti.it} ${v.dolce.itPl}` },
  ],
}
