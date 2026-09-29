// Il capitolo del mondo «Io e le mie cose»: racconta Laura. Otto frasi,
// tre domande — una su una frase, una su due frasi, una a cui il testo
// a volte non risponde. Formato in docs/lingue/mondi.md.
export default {
  id: 'il-picnic',
  mondo: 'mie-cose',
  titolo: 'Il picnic',
  variabili: {
    colore: { da: 'colori', fra: ['red', 'blue', 'green', 'yellow', 'black', 'white', 'brown', 'pink'] },
    cibo: { da: 'cibi', fra: ['apple', 'banana', 'cookie', 'strawberry', 'carrot', 'egg'] },
    quanti: { da: 'numeri', fra: ['two', 'three', 'four', 'five'] },
    altro: { da: 'cibi', fra: ['pizza', 'cake', 'cheese', 'chocolate', 'bread', 'pasta'] },
    piace: { fra: [true, false] },
    cane: { fra: [true, false] },
  },
  frasi: [
    { en: 'I am Laura. This is my brother, Leo.', forma: 'this-is-my' },
    { en: 'He has got {a:colore} hat.', forma: 'has-got' },
    { en: 'I have got {quanti} {cibo.pl}. I like {cibo.pl}!', forma: 'have-got' },
    { en: 'Do you like {cibo.pl}, Leo?', forma: 'i-like' },
    { se: v => v.piace, en: 'Yes, I do!', forma: 'i-like' },
    { se: v => !v.piace, en: 'No, I do not. I like {altro}.', forma: 'i-like' },
    { se: v => v.cane, en: 'This is my dog, Pip. He has got big ears.', forma: 'this-is-my' },
  ],
  domande: [
    { testo: 'Di che colore è il cappello di Leo?', risposta: v => v.colore.it },
    { testo: 'Che cosa piace a Leo?', risposta: v => (v.piace ? v.cibo.ilPl : v.altro.il) },
    { testo: 'Laura ha un cane?', tipo: 'vf', etichette: ['Sì', 'No'], vero: v => (v.cane ? true : null) },
  ],
}
