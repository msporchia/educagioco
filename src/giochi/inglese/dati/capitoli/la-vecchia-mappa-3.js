// In quinta, l'ultima puntata di «La vecchia mappa»: il tesoro. Sotto un
// sasso, nel posto della mappa piccola, c'è la scatola; la chiave la apre,
// e dentro c'è il giocattolo del nonno di quando aveva dieci anni. Il nonno
// piange perché è felice, e lo dice. Quattro pagine, sei domande.
// Formato in docs/lingue/libro.md.
import { NONNI, MEZZI, POSTI } from './serie/la-vecchia-mappa.js'

export default {
  id: 'la-vecchia-mappa-3',
  serie: 'la-vecchia-mappa',
  puntata: 3,
  mondo: 'quinta',
  titolo: 'La vecchia mappa: il tesoro',
  // key, tree, stone, push, old, open e cry stanno nei cassetti
  nuove: ['treasure'],
  variabili: {
    nonno: { fra: NONNI },
    mezzo: { da: 'mezzi', fra: MEZZI },
    dove: { fra: POSTI },
    tesoro: { da: 'giocattoli', fra: ['train', 'doll', 'kite', 'ball'] },
  },
  pagine: [
    [
      { riassunto: true, en: 'Last time Pip found the big tree on the map. Under it there was a key and a small map: ' +
        'the treasure is {dove.nel}.', forma: 'passato' },
      { en: 'On Saturday {nonno}, Laura, Leo and Pip went to the {dove} by {mezzo}.', forma: 'passato' },
      { en: 'It was hot, and the sky was blue.', forma: 'was-were' },
      { chi: 'Leo', en: 'Where is the treasure?', forma: 'dove' },
      { en: '{nonno} looked at the small map.', forma: 'passato-ed' },
      { id: 'sasso', chi: v => v.nonno.id, en: 'Look for a big stone near the door!', forma: 'presente' },
    ],
    [
      { en: 'Near the door there was a very big stone.', forma: 'was-were' },
      { en: 'Leo pushed it, but it was very big and he was very small.', forma: 'passato-ed' },
      { en: 'Then Laura, Leo and {nonno} pushed it, and Pip helped them.', forma: 'passato-ed' },
      { en: 'Under the stone there was an old brown box.', forma: 'was-were' },
    ],
    [
      { en: 'Laura took the key, and she opened the box.', forma: 'passato' },
      { en: 'In the box there was a small old {tesoro}.', forma: 'was-were' },
      { chi: 'Laura', en: 'Is this your treasure, {nonno}?', forma: 'presente' },
      { en: '{nonno} took the {tesoro} in {nonno.pos} hands, and {nonno.p} cried.', forma: 'passato' },
      { id: 'felice', chi: v => v.nonno.id, en: 'I am not sad: I am very happy!', forma: 'presente' },
      { chi: v => v.nonno.id, en: 'This is my {tesoro}! I was ten, and I played with it every day.', forma: 'passato-ed' },
    ],
    [
      { en: 'They went home by {mezzo}, and they were very happy.', forma: 'passato' },
      { en: 'At home {nonno} gave the {tesoro} to Laura and Leo.', forma: 'passato' },
      { chi: v => v.nonno.id, en: 'Now it is your treasure!', forma: 'presente' },
      { chi: 'Leo', en: 'Thank you, {nonno}!', forma: 'saluti' },
      { en: 'And Pip? Pip was very tired, and he slept on the sofa.', forma: 'passato' },
    ],
  ],
  domande: [
    { testo: 'Nella puntata prima, che cosa c’era sotto l’albero?', risposta: () => 'Una chiave e una piccola mappa',
      anche: ['Il tesoro', 'Un grande sasso', 'Una stella rossa'] },
    { testo: 'Dove sono andati a cercare il tesoro?', risposta: v => v.dove.al },
    { tipo: 'frase', testo: v => `Dove dice ${v.nonno.il} di cercare?`, frase: 'sasso' },
    { tipo: 'ordine', fatti: ['Leo ha spinto il sasso da solo', 'Hanno spinto il sasso tutti insieme',
                              'Laura ha aperto la scatola con la chiave',
                              v => `${v.nonno.it} ha regalato ${v.tesoro.il} a Laura e Leo`] },
    { tipo: 'chi', frase: 'felice' },
    { testo: 'Che cosa c’era nella scatola?', risposta: v => v.tesoro.un },
  ],
}
