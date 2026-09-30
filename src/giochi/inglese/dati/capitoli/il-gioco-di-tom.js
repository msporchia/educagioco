// In prima, a metà isola (dopo «Che cos’è?»): Tom indovina il giocattolo di
// Leo. Una pagina, tre domande. Formato in docs/lingue/libro.md.
export default {
  id: 'il-gioco-di-tom',
  mondo: 'prima',
  dopo: 'prima-che-cose',
  titolo: 'Che cos’ha Leo?',
  variabili: {
    cosa: { da: 'giocattoli', fra: ['ball', 'doll', 'kite', 'car', 'train', 'plane', 'boat'] },
    prova: { da: 'giocattoli', fra: ['ball', 'kite', 'car', 'boat'] },
    colore: { da: 'colori', fra: ['red', 'blue', 'green', 'yellow', 'orange', 'purple'] },
  },
  frasi: [
    { chi: 'Tom', en: 'Hello, Leo! How are you?', forma: 'saluti' },
    { chi: 'Leo', en: 'I am fine, thank you, Tom.', forma: 'saluti' },
    { chi: 'Tom', en: 'What is it, Leo? Is it {a:prova}?', forma: 'is-it' },
    { se: v => v.prova === v.cosa, chi: 'Leo', en: 'Yes, it is! It is my {cosa}.', forma: 'it-is' },
    { se: v => v.prova !== v.cosa, chi: 'Leo', en: 'No, it is not {a:prova}. It is {a:cosa}!', forma: 'it-is' },
    { chi: 'Leo', en: 'It is {colore}.', forma: 'it-is' },
  ],
  domande: [
    { testo: 'Che cos’è il giocattolo di Leo?', risposta: v => v.cosa.un },
    { testo: 'Di che colore è?', risposta: v => v.colore.it },
    { testo: 'Tom indovina subito?', tipo: 'vf', etichette: ['Sì', 'No'], vero: v => v.prova === v.cosa },
  ],
}
