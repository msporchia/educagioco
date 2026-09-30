// In quarta, a metà isola (dopo «Ogni giorno»): il sabato di Tom, al
// presente con la s. Quattro pagine, cinque domande — l'ordine delle cose,
// il perché, e una che il testo a volte non dice. Formato in
// docs/lingue/libro.md.
export default {
  id: 'il-sabato-di-tom',
  mondo: 'quarta',
  dopo: 'quarta-ogni-giorno',
  titolo: 'Il sabato di Tom',
  variabili: {
    ora: { da: 'numeri', fra: ['eight', 'nine', 'ten'] },
    frutto: { da: 'cibi', fra: ['egg', 'banana', 'apple', 'cookie'] },
    bevanda: { da: 'cibi', fra: ['milk', 'juice'] },
    chi: { fra: [{ en: 'mother', it: 'Sua mamma' }, { en: 'father', it: 'Suo papà' }] },
    cucina: { fra: [true, false] },
    piatto: { da: 'cibi', fra: ['pasta', 'pizza', 'soup', 'rice'] },
    caldo: { fra: [true, false] },
    legge: { fra: [true, false] },
  },
  pagine: [
    [
      { en: 'This is Tom. He is nine, and he likes Saturdays.', forma: 'terza-s' },
      { en: 'His house is small, but it has got a big garden.', forma: 'has-got' },
      { en: 'On Saturday morning he eats breakfast at {ora} o’clock.', forma: 'ora' },
      { en: 'He eats {frutto.pl} and bread, and he drinks {bevanda}.', forma: 'terza-s' },
    ],
    [
      { en: 'After breakfast Tom helps his {chi}.', forma: 'terza-s' },
      { se: v => v.cucina, en: 'They cook lunch in the kitchen.', forma: 'presente' },
      { se: v => !v.cucina, en: 'They wash the car in the garden.', forma: 'presente' },
      { en: 'At one o’clock they eat {piatto}.', forma: 'ora' },
    ],
    [
      { en: 'In the afternoon Tom plays with his friend Leo.', forma: 'terza-s' },
      { se: v => v.caldo, en: 'They play in the garden, because it is hot.', forma: 'presente' },
      { se: v => !v.caldo, en: 'They play in the bedroom, because it is cold.', forma: 'presente' },
      { en: 'At five o’clock Leo goes home.', forma: 'terza-s' },
    ],
    [
      { en: 'In the evening Tom is tired.', forma: 'presente' },
      { en: 'He washes his hands and his feet.', forma: 'terza-s' },
      { se: v => v.legge, en: 'After dinner he reads a book in bed.', forma: 'terza-s' },
      { en: 'At nine o’clock he goes to bed.', forma: 'ora' },
      { chi: v => (v.chi.en === 'mother' ? 'mamma' : 'papa'), en: 'Good night, Tom!', forma: 'saluti' },
    ],
  ],
  domande: [
    { testo: 'A che ora fa colazione Tom il sabato?', risposta: v => `Alle ${v.ora.it}` },
    { testo: 'Chi aiuta Tom, dopo colazione?', risposta: v => v.chi.it, anche: ['Leo', 'Sua sorella'] },
    { testo: 'Che cosa fa Tom subito dopo colazione?',
      risposta: v => (v.cucina ? 'Cucina il pranzo' : 'Lava la macchina'),
      anche: ['Gioca con Leo', 'Va a letto'] },
    { testo: 'Dove giocano Tom e Leo, e perché?',
      risposta: v => (v.caldo ? 'In giardino, perché fa caldo' : 'In camera, perché fa freddo'),
      anche: ['In giardino, perché fa freddo', 'In camera, perché fa caldo'] },
    { testo: 'La sera Tom legge un libro.', tipo: 'vf', vero: v => (v.legge ? true : null) },
  ],
}
