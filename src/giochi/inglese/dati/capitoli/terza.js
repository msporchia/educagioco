// Il capitolo del mondo «In terza»: dov'è finito Pip. Sette frasi e quattro
// domande — una a cui il testo a volte non risponde, una che vuole due
// frasi insieme (la stanza e il mobile). Solo le strutture dei mondi fatti
// (today is, there is, where is, in / on / under, can). Formato in
// docs/lingue/mondi.md.
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
  frasi: [
    { en: 'Today is {giorno}. It is {tempo} in the house.', forma: 'oggi' },
    { en: 'Laura is in the garden. Where is Pip?', forma: 'dove' },
    { se: v => v.gatto, en: 'There is a cat in the garden, and Pip is not there!', forma: 'there-is' },
    { en: 'Is Pip in the {stanza}? Yes, he is!', forma: 'dove' },
    { se: v => v.sotto, en: 'He is under the {mobile}.', forma: 'dove' },
    { se: v => !v.sotto, en: 'He is on the {mobile}.', forma: 'dove' },
    { en: 'Pip can run and he can jump. He cannot fly!', forma: 'can' },
  ],
  domande: [
    { testo: 'Che giorno è?', risposta: v => v.giorno.it },
    { testo: 'In che stanza è Pip?', risposta: v => v.stanza.it },
    { testo: v => `Pip è sopra o sotto ${v.mobile.il}?`, risposta: v => (v.sotto ? 'Sotto' : 'Sopra') },
    { testo: 'C’è un gatto in giardino?', tipo: 'vf', etichette: ['Sì', 'No'], vero: v => (v.gatto ? true : null) },
  ],
}
