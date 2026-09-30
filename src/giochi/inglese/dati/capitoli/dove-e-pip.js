// In terza, alla 🏁: dov'è finito Pip. Tre pagine e quattro domande — una
// a cui il testo a volte non risponde, una che vuole due frasi insieme (la
// stanza e il mobile). Formato in docs/lingue/libro.md.
export default {
  id: 'dove-e-pip',
  mondo: 'terza',
  titolo: 'Dov’è Pip?',
  variabili: {
    giorno: { da: 'giorni', fra: ['Monday', 'Wednesday', 'Saturday', 'Sunday'] },
    tempo: { da: 'aggettivi', fra: ['hot', 'cold'] },
    stanza: { da: 'stanze', fra: ['kitchen', 'bedroom', 'bathroom'] },
    mobile: { da: 'mobili' },
    sotto: { fra: [true, false] },
    gatto: { fra: [true, false] },
  },
  // un mobile che sta in quella stanza: niente letto in cucina
  vincoli: [v => ({ kitchen: ['table', 'chair'], bedroom: ['bed', 'chair', 'sofa'], bathroom: ['chair'] })[v.stanza.en]
    .includes(v.mobile.en)],
  pagine: [
    [
      { en: 'Today is {giorno}. It is {tempo} in the house.', forma: 'oggi' },
      { en: 'Laura is in the garden. Where is Pip?', forma: 'dove' },
      { se: v => v.gatto, en: 'There is a cat in the garden, and Pip is not there!', forma: 'there-is' },
    ],
    [
      { en: 'Is Pip in the {stanza}? Yes, he is!', forma: 'dove' },
      { se: v => v.sotto, en: 'He is under the {mobile}.', forma: 'dove' },
      { se: v => !v.sotto, en: 'He is on the {mobile}.', forma: 'dove' },
    ],
    [
      { en: 'Pip can run and he can jump. He cannot fly!', forma: 'can' },
      { en: 'Laura is happy. Good dog, Pip!', forma: 'saluti' },
    ],
  ],
  domande: [
    { testo: 'Che giorno è?', risposta: v => v.giorno.it },
    { testo: 'In che stanza è Pip?', risposta: v => v.stanza.it },
    { testo: v => `Pip è sopra o sotto ${v.mobile.il}?`, risposta: v => (v.sotto ? 'Sotto' : 'Sopra') },
    { testo: 'C’è un gatto in giardino?', tipo: 'vf', etichette: ['Sì', 'No'], vero: v => (v.gatto ? true : null) },
  ],
}
