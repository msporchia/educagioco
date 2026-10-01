// Nella sesta isola, dopo «Ha detto ciao»: una settimana dalla nonna, e ogni notte
// una voce in cucina. Chi parla lo dice solo l'ultima pagina: il
// pappagallo. Le battute della voce hanno per nome «Una voce», così il nome
// non svela il giallo. Cinque pagine, sei domande. Formato in
// docs/lingue/libro.md.
export default {
  id: 'una-voce-nella-notte',
  mondo: 'sesta',
  dopo: 'quinta-disse',
  titolo: 'Una voce nella notte',
  // parrot e scared stanno nei cassetti; laugh e speak sono della tappa prima
  nuove: ['suddenly', 'voice', 'hear'],
  variabili: {
    vicino: { da: 'luoghi', fra: ['church', 'farm', 'castle'] },
    colore: { da: 'colori', fra: ['green', 'red', 'blue', 'yellow'] },
    ora: { fra: ['ten', 'eleven'] },
    fame: { fra: [{ en: 'Where is my cake? I am hungry!', it: 'Che aveva fame' },
                  { en: 'Where is my dinner? I am hungry!', it: 'Che aveva fame' }] },
  },
  pagine: [
    [
      { en: 'Last summer Laura and Leo went to a small village by train, with Pip.', forma: 'passato' },
      { en: 'Grandmother had a small house there, near a {vicino}.', forma: 'passato' },
      { en: 'In her kitchen there was a big {colore} parrot.', forma: 'was-were' },
      { chi: 'nonna', en: 'Hello, Laura and Leo!', forma: 'saluti' },
    ],
    [
      { en: 'On Monday Laura and Leo went to bed at nine o’clock.', forma: 'passato' },
      { en: 'Suddenly they heard a voice in the kitchen.', forma: 'passato' },
      { chi: 'voce', en: 'Good night, good night!', forma: 'saluti' },
      { chi: 'Leo', en: 'Who is it?', forma: 'presente' },
      { id: 'a-letto', chi: 'Laura', en: 'It is not Grandmother: she is in bed.', forma: 'presente' },
      { en: 'Leo was very scared, and he did not sleep.', forma: 'was-were' },
    ],
    [
      { en: 'On Tuesday they heard the voice at {ora} o’clock.', forma: 'passato' },
      { id: 'fame', chi: 'voce', en: '{fame}', forma: 'presente' },
      { chi: 'Leo', en: 'Grandmother, who is in your kitchen at night?', forma: 'presente' },
      { chi: 'nonna', en: 'At night I sleep, Leo!', forma: 'presente' },
    ],
    [
      { en: 'On Friday Laura and Leo did not go to bed.', forma: 'passato' },
      { en: 'At {ora} o’clock they walked to the kitchen with a lamp.', forma: 'passato-ed' },
      { en: 'The voice was near the window.', forma: 'was-were' },
      { id: 'era', en: 'Laura looked, and she laughed: it was the {colore} parrot!', forma: 'passato-ed' },
    ],
    [
      { chi: 'pappagallo', en: 'Good night, Laura and Leo!', forma: 'saluti' },
      { id: 'parla', chi: 'nonna', en: 'My parrot speaks every night. He is my friend!', forma: 'terza-s' },
      { en: 'On Saturday Laura and Leo said goodbye to the parrot, and they went home by train.', forma: 'dire' },
      { chi: 'Leo', en: 'Mother, can we have a parrot?', forma: 'can' },
      { chi: 'mamma', en: 'No, Leo, we have got Pip!', forma: 'have-got' },
    ],
  ],
  domande: [
    { testo: 'Dove dormivano Laura e Leo?', risposta: () => 'A casa della nonna',
      anche: ['A casa loro', 'In albergo', 'A casa di Tom'] },
    { tipo: 'chi', frase: 'a-letto' },
    { testo: 'Che cosa ha detto la voce, martedì?', risposta: v => v.fame.it,
      anche: ['Buonanotte', 'Che era la nonna', 'Che voleva il cane'] },
    { tipo: 'frase', testo: 'Chi parlava in cucina, di notte?', frase: 'era' },
    { tipo: 'ordine', fatti: ['Hanno sentito una voce in cucina', 'Leo ha chiesto alla nonna chi c’era in cucina',
                              'Sono andati in cucina con una lampada', 'Sono tornati a casa in treno'] },
    { testo: 'Di che colore era il pappagallo?', risposta: v => v.colore.it },
  ],
}
