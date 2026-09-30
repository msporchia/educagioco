// In prima, dopo «Questo è…»: Laura presenta Pip, e Pip le porta una cosa
// della scuola. Due pagine, tre domande; che cosa porta Pip si capisce
// senza che sia scritto. Formato in docs/lingue/libro.md.
export default {
  id: 'il-cane-di-laura',
  mondo: 'prima',
  dopo: 'prima-questo',
  titolo: 'Il cane di Laura',
  variabili: {
    pelo: { da: 'colori', fra: ['brown', 'black', 'white'] },
    zaino: { da: 'colori', fra: ['red', 'blue', 'green', 'pink'] },
    cosa: { da: 'scuola' },
    altro: { da: 'scuola', fra: ['pen', 'pencil', 'ruler', 'book'] },
    colore: { da: 'colori', fra: ['red', 'blue', 'yellow', 'orange'] },
    giusto: { fra: [true, false] },
  },
  vincoli: [v => v.cosa !== v.altro],
  pagine: [
    [
      { chi: 'Laura', en: 'Hello! My name is Laura.', forma: 'saluti' },
      { chi: 'Laura', en: 'This is my dog, Pip. Pip is {a:pelo} dog.', forma: 'colore-prima' },
      { chi: 'Laura', en: 'This is my backpack. It is {zaino}.', forma: 'this-is' },
    ],
    [
      { chi: 'Laura', en: 'What is this, Pip? Is it {a:cosa}?', forma: 'is-it' },
      { se: v => v.giusto, chi: 'Laura', en: 'Yes, it is {a:colore} {cosa}.', forma: 'colore-prima' },
      { se: v => !v.giusto, chi: 'Laura', en: 'No, it is not {a:cosa}. It is {a:colore} {altro}!', forma: 'colore-prima' },
      { chi: 'Laura', en: 'Thank you, Pip! Good dog!', forma: 'saluti' },
    ],
  ],
  domande: [
    { testo: 'Di che colore è Pip?', risposta: v => v.pelo.it },
    { testo: 'Che cosa porta Pip a Laura?', risposta: v => (v.giusto ? v.cosa : v.altro).un },
    { testo: 'Di che colore è lo zaino di Laura?', risposta: v => v.zaino.it },
  ],
}
