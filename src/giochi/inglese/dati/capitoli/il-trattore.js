// In quarta, dopo «I mezzi»: Tom e il nonno aspettano l'autobus per andare
// dal dottore, e l'autobus non arriva. Li porta un trattore. Quattro
// pagine, sei domande (chi l'ha detto, i fatti in ordine, una frase da
// toccare). Formato in docs/lingue/libro.md.
const chi = (id, P, p, it) => ({ id, en: 'farmer', P, p, it })

export default {
  id: 'il-trattore',
  mondo: 'quarta',
  dopo: 'quarta-mezzi',
  titolo: 'Il trattore',
  // road arriva in quinta; bad, late e laugh stanno nei cassetti
  nuove: ['wait', 'drive', 'come', 'suddenly', 'road'],
  variabili: {
    freddo: { fra: [true, false] },
    bus: { da: 'numeri', fra: ['seven', 'eight'] },
    visita: { da: 'numeri', fra: ['nine', 'ten'] },
    passa: { da: 'mezzi', fra: ['taxi', 'motorbike', 'scooter'] },
    colore: { da: 'colori', fra: ['red', 'green', 'blue', 'yellow'] },
    contadino: { fra: [chi('contadino', 'He', 'he', 'Il contadino'), chi('contadina', 'She', 'she', 'La contadina')] },
  },
  pagine: [
    [
      { se: v => v.freddo, en: 'It is Tuesday morning, and it is very cold.', forma: 'presente' },
      { se: v => !v.freddo, en: 'It is Tuesday morning, and the sun is in the sky.', forma: 'presente' },
      { en: 'Tom and his grandfather wait for the bus near the road.', forma: 'presente' },
      { en: 'Grandfather has got a bad leg, and at {visita} o’clock he goes to the doctor.', forma: 'terza-s' },
      { chi: 'nonno', en: 'Our bus is at {bus} o’clock, Tom.', forma: 'ora' },
    ],
    [
      { en: 'But at {bus} o’clock there is no bus.', forma: 'there-is' },
      { en: '{A:passa} goes by, then a big truck, but there is no bus.', forma: 'terza-s' },
      { chi: 'Tom', en: 'Where is the bus, Grandfather?', forma: 'dove' },
      { chi: 'nonno', en: 'It is late, Tom, and my leg is very tired.', forma: 'presente' },
      { en: 'Grandfather is sad.', forma: 'presente' },
    ],
    [
      { en: 'Suddenly there is a {colore} tractor on the road!', forma: 'there-is' },
      { en: 'A farmer is driving it, and {contadino.p} looks at Tom and Grandfather.', forma: 'ing' },
      { chi: v => v.contadino.id, en: 'Hello! Where are you going?', forma: 'ing' },
      { chi: 'Tom', en: 'We are going to the doctor, but there is no bus!', forma: 'ing' },
      { id: 'vieni', chi: v => v.contadino.id, en: 'Come with me on my tractor!', forma: 'presente' },
      { en: 'Tom helps his grandfather, and they climb on the tractor.', forma: 'terza-s' },
    ],
    [
      { en: 'At {visita} o’clock Grandfather is with the doctor.', forma: 'ora' },
      { en: 'The doctor looks at his leg.', forma: 'terza-s' },
      { id: 'gamba', chi: 'dottore', en: 'Your leg is fine! Walk every day.', forma: 'presente' },
      { en: 'Then the farmer drives them home on the tractor.', forma: 'terza-s' },
      { chi: 'Tom', en: 'Grandfather, can we go on the tractor every day?', forma: 'can' },
      { en: 'Grandfather and the farmer laugh.', forma: 'presente' },
    ],
  ],
  domande: [
    { testo: 'Perché il nonno va dal dottore?', risposta: () => 'Ha male a una gamba',
      anche: ['Ha mal di testa', 'Ha fame', 'Tom sta male'] },
    { testo: 'A che ora doveva passare l’autobus?', risposta: v => `Alle ${v.bus.it}`,
      anche: ['Alle sei', 'Alle undici'] },
    { tipo: 'chi', frase: 'vieni' },
    { tipo: 'ordine', fatti: [v => `Passa ${v.passa.un}`, 'Arriva un trattore', 'Il dottore guarda la gamba del nonno',
                              v => `${v.contadino.it} li porta a casa`] },
    { tipo: 'frase', testo: 'Che cosa dice il dottore della gamba del nonno?', frase: 'gamba' },
    { testo: 'Il trattore è rosso.', tipo: 'vf', vero: v => v.colore.en === 'red' },
  ],
}
