// In quinta, dopo la prima puntata: «La vecchia mappa», il bosco. Con la
// mappa vanno a cercare l'albero; nel bosco ce ne sono cento, e l'albero
// giusto lo trova Pip. Sotto non c'è il tesoro ma una chiave e una mappa
// più piccola, che dice dov'è. Quattro pagine, cinque domande.
// Formato in docs/lingue/libro.md.
import { NONNI, MEZZI, POSTI } from './serie/la-vecchia-mappa.js'

export default {
  id: 'la-vecchia-mappa-2',
  serie: 'la-vecchia-mappa',
  puntata: 2,
  mondo: 'quinta',
  titolo: 'La vecchia mappa: il bosco',
  // old, tree, river, forest, sit e key stanno nei cassetti
  nuove: ['treasure', 'suddenly'],
  variabili: {
    nonno: { fra: NONNI },
    mezzo: { da: 'mezzi', fra: MEZZI },
    dove: { fra: POSTI },
  },
  pagine: [
    [
      { riassunto: true, en: 'Last time Laura and Leo found an old map in the garage. {nonno} made it, and on the map ' +
        'there is a treasure, near a big tree.', forma: 'passato' },
      { en: 'On Sunday morning {nonno}, Laura, Leo and Pip went to a small village by {mezzo}.', forma: 'passato' },
      { en: '{nonno} had the map in {nonno.pos} hand.', forma: 'passato' },
      { en: 'They walked on a long road, and then on a small bridge.', forma: 'passato-ed' },
      { en: 'Under the bridge there was a river, with ducks and fish.', forma: 'was-were' },
    ],
    [
      { en: 'After the bridge there was a big forest.', forma: 'was-were' },
      { en: 'In the forest there were a hundred trees!', forma: 'was-were' },
      { chi: 'Leo', en: 'Where is the tree on the map?', forma: 'dove' },
      { chi: 'Laura', en: 'There are very many trees!', forma: 'there-is' },
    ],
    [
      { en: 'Suddenly Pip ran to a very big tree, and he sat under it.', forma: 'passato' },
      { id: 'albero', chi: v => v.nonno.id, en: 'Look! This is the tree on my map!', forma: 'this-is' },
      { en: 'Leo looked under the tree, and he found a small old box.', forma: 'passato' },
      { en: 'In the box there was not a treasure: there was a key and a very small map, with a {dove} on it.',
        forma: 'was-were' },
    ],
    [
      { chi: 'Laura', en: 'A key? Where is the treasure, {nonno}?', forma: 'dove' },
      { id: 'dove', chi: v => v.nonno.id, en: 'Look at this small map: the treasure is {dove.nel}!', forma: 'dove' },
      { en: 'In the evening they went home by {mezzo}.', forma: 'passato' },
      { en: 'At home Pip slept on Leo’s bed, and Leo looked at the key.', forma: 'passato' },
    ],
  ],
  domande: [
    { testo: 'Nella puntata prima, dove hanno trovato la mappa Laura e Leo?', risposta: () => 'In garage',
      anche: ['In soffitta', 'In giardino', 'In cucina'] },
    { testo: 'Come sono andati al villaggio?', risposta: v => v.mezzo.in, anche: ['In bici'] },
    { tipo: 'ordine', fatti: ['Sono passati su un ponte', 'Sono entrati nel bosco',
                              'Pip si è seduto sotto un albero', 'Leo ha trovato una scatola'] },
    { tipo: 'chi', frase: 'albero' },
    { tipo: 'frase', testo: 'Dov’è il tesoro?', frase: 'dove' },
  ],
}
