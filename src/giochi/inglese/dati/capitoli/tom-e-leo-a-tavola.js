// In seconda, a metà isola (dopo «Mi piace!»): Tom e Leo dicono che cosa
// piace a loro. Due pagine, tre domande; la risposta di Leo cambia la
// frase dopo. Formato in docs/lingue/libro.md.
export default {
  id: 'tom-e-leo-a-tavola',
  mondo: 'seconda',
  dopo: 'seconda-mi-piace',
  titolo: 'Tom e Leo a tavola',
  variabili: {
    frutto: { da: 'cibi', fra: ['apple', 'banana', 'strawberry', 'carrot', 'tomato', 'egg', 'cookie'] },
    piace: { fra: [true, false] },
    piatto: { da: 'cibi', fra: ['pasta', 'pizza', 'soup', 'rice', 'bread'] },
    dolce: { da: 'cibi', fra: ['cake', 'chocolate'] },
    bevanda: { da: 'cibi', fra: ['milk', 'juice'] },
    no: { da: 'cibi', fra: ['cheese', 'soup', 'salad', 'rice'] },
  },
  vincoli: [v => v.no !== v.piatto],
  pagine: [
    [
      { chi: 'Tom', en: 'Hello! I am Tom, and this is Leo.', forma: 'this-is' },
      { chi: 'Tom', en: 'Leo, do you like {frutto.pl}?', forma: 'i-like' },
      { se: v => v.piace, chi: 'Leo', en: 'Yes, I do. I like {frutto.pl}!', forma: 'i-like' },
      { se: v => !v.piace, chi: 'Leo', en: 'No, I do not like {frutto.pl}. I like {piatto}.', forma: 'i-like' },
    ],
    [
      { chi: 'Leo', en: 'And you, Tom? What do you like?', forma: 'i-like' },
      { chi: 'Tom', en: 'I like {dolce}, and I like {bevanda}.', forma: 'i-like' },
      { chi: 'Tom', en: 'I do not like {no}!', forma: 'i-like' },
    ],
  ],
  domande: [
    { testo: v => `A Leo piacciono ${v.frutto.ilPl}?`, tipo: 'vf', etichette: ['Sì', 'No'], vero: v => v.piace },
    { testo: 'Che cosa piace a Tom?', risposta: v => `${v.dolce.il} e ${v.bevanda.il}` },
    { testo: 'Che cosa non piace a Tom?', risposta: v => v.no.il },
  ],
}
