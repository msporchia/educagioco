// In prima, alla 🏁: lo zaino di Leo. Una pagina, tre domande, ognuna su
// una frase sola; tutte le strutture della prima (hello, it is, is it,
// this is, they are). Formato in docs/lingue/libro.md.
export default {
  id: 'lo-zaino-di-leo',
  mondo: 'prima',
  titolo: 'Lo zaino di Leo',
  variabili: {
    colore: { da: 'colori', fra: ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black'] },
    cosa: { da: 'scuola', fra: ['pen', 'pencil', 'ruler', 'rubber', 'crayon', 'book'] },
    quanti: { da: 'numeri', fra: ['two', 'three', 'four', 'five'] },
  },
  frasi: [
    { chi: 'Leo', en: 'Hello! I am Leo. This is my backpack.', forma: 'saluti' },
    { chi: 'Leo', en: 'It is {colore}.', forma: 'it-is' },
    { chi: 'Laura', en: 'What is this, Leo? Is it a pen?', forma: 'is-it' },
    { se: v => v.cosa.en === 'pen', chi: 'Leo', en: 'Yes, it is a pen.', forma: 'it-is' },
    { se: v => v.cosa.en !== 'pen', chi: 'Leo', en: 'No, it is not a pen. It is {a:cosa}.', forma: 'it-is' },
    { chi: 'Leo', en: 'They are {quanti} {cosa.pl}!', forma: 'plurale' },
  ],
  domande: [
    { testo: 'Di che colore è lo zaino di Leo?', risposta: v => v.colore.it },
    { testo: 'Che cosa c’è nello zaino?', risposta: v => v.cosa.itPl },
    { testo: 'Quante sono?', risposta: v => v.quanti.it },
  ],
}
