// In quinta, alla 🏁: la prima puntata di «La vecchia mappa». In garage dal
// nonno (o dalla nonna) Laura e Leo trovano una mappa fatta da lui a dieci
// anni, con un tesoro sotto una stella. Il nonno, il mezzo e il posto del
// tesoro restano quelli per tutta la serie. Tre pagine, cinque domande.
// Formato in docs/lingue/libro.md.
import { NONNI, MEZZI } from './serie/la-vecchia-mappa.js'

export default {
  id: 'la-vecchia-mappa',
  serie: 'la-vecchia-mappa',
  puntata: 1,
  mondo: 'quinta',
  titolo: 'La vecchia mappa',
  // old, open, river, tree e star stanno nei cassetti
  nuove: ['treasure'],
  variabili: {
    nonno: { fra: NONNI },
    mezzo: { da: 'mezzi', fra: MEZZI },
    scatola: { da: 'colori', fra: ['brown', 'blue', 'green'] },
  },
  pagine: [
    [
      { en: 'Last Saturday there was a big storm.', forma: 'was-were' },
      { en: 'Laura and Leo went to see {nonno} with Pip, by {mezzo}.', forma: 'passato' },
      { en: 'They did not play in the garden: they played in {nonno.pos} garage.', forma: 'passato-ed' },
      { en: 'In the garage there were old bikes, old boxes and a very old car.', forma: 'was-were' },
    ],
    [
      { en: 'Leo opened a small {scatola} box.', forma: 'passato-ed' },
      { en: 'In the box there was a map.', forma: 'was-were' },
      { chi: 'Leo', en: 'Look, Laura! A map!', forma: 'presente' },
      { en: 'On the map there was a river, a bridge and a big tree.', forma: 'was-were' },
      { id: 'stella', en: 'Near the tree there was a red star.', forma: 'was-were' },
    ],
    [
      { en: 'They took the map to {nonno}.', forma: 'passato' },
      { chi: 'Laura', en: 'What is this map, {nonno}?', forma: 'presente' },
      { en: '{nonno} looked at the map, and then {nonno.p} was very happy.', forma: 'passato-ed' },
      { id: 'mia', chi: v => v.nonno.id, en: 'It is my map! I made it, and I was ten.', forma: 'passato' },
      { chi: v => v.nonno.id, en: 'Under the star there is my treasure.', forma: 'there-is' },
      { chi: 'Leo', en: 'Your treasure? Can we look for it?', forma: 'can' },
      { id: 'domani', chi: v => v.nonno.id, en: 'Yes! We are going to look for it tomorrow.', forma: 'ing' },
      { en: 'In the night Leo did not sleep: he looked at the map in his bed.', forma: 'passato-ed' },
    ],
  ],
  domande: [
    { testo: 'Perché Laura e Leo giocavano in garage?', risposta: () => 'C’era un temporale',
      anche: ['In garage c’era Pip', 'Cercavano una mappa', 'In giardino c’era il nonno'] },
    { testo: 'Di che colore era la scatola?', risposta: v => v.scatola.it, anche: ['Nera'] },
    { tipo: 'frase', testo: 'Dove c’era la stella rossa, sulla mappa?', frase: 'stella' },
    { tipo: 'chi', frase: 'mia' },
    { testo: 'Quando vanno a cercare il tesoro?', risposta: () => 'Domani',
      anche: ['Subito', 'Fra un anno', 'Il sabato dopo'] },
  ],
}
