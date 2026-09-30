// In quarta, alla 🏁: alle sei di sera, stanza per stanza, che cosa sta
// facendo ognuno (-ing). Quattro pagine, cinque domande — perché Pip non ha
// fame si capisce senza che sia scritto. Formato in docs/lingue/libro.md.
const FACCENDE = [
  { en: 'reading a book', it: 'Legge un libro' },
  { en: 'writing in her notebook', it: 'Scrive sul quaderno' },
  { en: 'singing and dancing', it: 'Canta e balla' },
  { en: 'playing with her doll', it: 'Gioca con la bambola' },
]

const MAMMA = { en: 'Mother', it: 'La mamma', P: 'She' }
const PAPA = { en: 'Father', it: 'Il papà', P: 'He' }

export default {
  id: 'alle-sei-di-sera',
  mondo: 'quarta',
  titolo: 'Alle sei di sera',
  variabili: {
    cuoco: { fra: [MAMMA, PAPA] },
    altro: { fra: [MAMMA, PAPA] },
    mezzo: { fra: [{ en: 'bike', it: 'la bici' }, { en: 'motorbike', it: 'la moto' },
                   { en: 'scooter', it: 'il monopattino' }] },
    cena: { da: 'cibi', fra: ['pasta', 'soup', 'rice', 'pizza'] },
    ora: { da: 'numeri', fra: ['seven', 'eight'] },
    laura: { fra: FACCENDE },
    // niente torta: è il giallo di «Chi ha mangiato la torta?», qui toglierebbe la sorpresa
    dolce: { da: 'cibi', fra: ['cookie', 'apple', 'banana', 'strawberry'] },
  },
  vincoli: [v => v.cuoco !== v.altro],
  pagine: [
    [
      { en: 'What time is it? It is six o’clock in the evening.', forma: 'ora' },
      { en: 'Where are they, and what are they doing?', forma: 'ing' },
      { en: '{cuoco} is in the kitchen. {cuoco.P} is cooking {cena} for dinner.', forma: 'ing' },
    ],
    [
      { en: '{altro} is in the garage. {altro.P} is washing the {mezzo}.', forma: 'ing' },
      { id: 'mani', en: 'Leo is in the bathroom. He is washing his hands, because dinner is at {ora} o’clock.',
        forma: 'ing' },
    ],
    [
      { en: 'Laura is in her bedroom. She is not sleeping: she is {laura}.', forma: 'ing' },
      { en: 'And Pip? Where is Pip?', forma: 'dove' },
      { en: 'Pip is under the table in the kitchen. He is eating {a:dolce}!', forma: 'ing' },
    ],
    [
      { en: 'At {ora} o’clock they eat dinner in the kitchen.', forma: 'ora' },
      { chi: 'Leo', en: 'The {cena} is very good!', forma: 'presente' },
      { en: 'Laura, Leo, Mother and Father are hungry, but Pip is not.', forma: 'presente' },
      { en: 'He is sleeping under the table.', forma: 'ing' },
      { chi: 'Laura', en: 'Good night, Pip!', forma: 'saluti' },
    ],
  ],
  domande: [
    { testo: 'A che ora si cena?', risposta: v => `Alle ${v.ora.it}`, anche: ['Alle sei', 'Alle nove'] },
    { testo: 'Chi cucina la cena?', risposta: v => v.cuoco.it, anche: ['Laura', 'Leo'] },
    { testo: 'Che cosa sta facendo Laura, alle sei?', risposta: v => v.laura.it },
    { tipo: 'frase', testo: 'Perché Leo si lava le mani?', frase: 'mani' },
    { testo: 'Perché Pip non ha fame, a cena?', risposta: v => `Ha mangiato ${v.dolce.un}`,
      anche: ['Sta male', 'Non gli piace la cena'] },
    { testo: v => `Il papà sta lavando ${v.mezzo.it}.`, tipo: 'vf', vero: v => v.altro === PAPA },
  ],
}
