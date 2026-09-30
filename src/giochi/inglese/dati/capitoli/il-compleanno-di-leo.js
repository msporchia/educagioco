// In terza, dopo «Oggi è lunedì»: il compleanno di Leo. Tre pagine,
// quattro domande; perché la torta sta in cucina o in giardino il testo
// non lo dice, si capisce dal tempo. Formato in docs/lingue/libro.md.
export default {
  id: 'il-compleanno-di-leo',
  mondo: 'terza',
  dopo: 'terza-oggi',
  titolo: 'Il compleanno di Leo',
  variabili: {
    giorno: { da: 'giorni', fra: ['Tuesday', 'Friday', 'Saturday', 'Sunday'] },
    mese: { fra: [{ en: 'May' }, { en: 'June' }, { en: 'October' }, { en: 'December' }] },
    anni: { da: 'numeri', fra: ['seven', 'eight', 'nine'] },
    sole: { fra: [true, false] },
    regalo: { da: 'giocattoli', fra: ['kite', 'train', 'plane', 'ball', 'boat'] },
    colore: { da: 'colori', fra: ['red', 'blue', 'green', 'yellow'] },
  },
  pagine: [
    [
      { en: 'Hello! I am Leo.', forma: 'saluti' },
      { en: 'Today is {giorno}, and it is {mese}.', forma: 'oggi' },
      { en: 'Today is my birthday, and I am {anni}!', forma: 'oggi' },
    ],
    [
      { se: v => v.sole, en: 'There are no clouds in the sky, and it is hot.', forma: 'there-is' },
      { se: v => !v.sole, en: 'There is a storm, and it is cold.', forma: 'there-is' },
      { se: v => v.sole, en: 'There is a big cake on the table in the garden.', forma: 'there-is' },
      { se: v => !v.sole, en: 'There is a big cake on the table in the kitchen.', forma: 'there-is' },
      { en: 'On the cake there are {anni} strawberries.', forma: 'there-is' },
    ],
    [
      { en: 'This is my friend Tom. He has got {a:colore} {regalo}.', forma: 'has-got' },
      { en: 'Thank you, Tom! I like my birthday!', forma: 'i-like' },
    ],
  ],
  domande: [
    { testo: 'Che giorno è oggi?', risposta: v => v.giorno.it },
    { testo: 'Quanti anni compie Leo?', risposta: v => v.anni.it },
    { testo: 'Perché la torta è in cucina?', se: v => !v.sole, risposta: () => 'Perché c’è un temporale',
      anche: ['Perché fa caldo', 'Perché è lunedì', 'Perché Leo ha nove anni'] },
    { testo: 'Perché la torta è in giardino?', se: v => v.sole, risposta: () => 'Perché c’è il sole e fa caldo',
      anche: ['Perché c’è un temporale', 'Perché fa freddo', 'Perché Tom ha un regalo'] },
    { testo: 'Che cosa ha Tom per Leo?', risposta: v => v.regalo.un },
  ],
}
