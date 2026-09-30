// In quinta, alla 🏁: un giallo in cinque pagine, al passato con i verbi
// che cambiano. Chi ha mangiato la torta non è mai scritto: lo dice chi è
// rimasto a casa, e la cioccolata. Sei domande. Formato in
// docs/lingue/libro.md.
const grande = s => s[0].toUpperCase() + s.slice(1)
const SPESA = [
  { en: 'apples and bread', it: 'Mele e pane' },
  { en: 'milk and eggs', it: 'Latte e uova' },
  { en: 'bananas and cheese', it: 'Banane e formaggio' },
]

export default {
  id: 'chi-ha-mangiato-la-torta',
  mondo: 'quinta',
  titolo: 'Chi ha mangiato la torta?',
  variabili: {
    chi: { fra: ['Pip', 'Leo'] },
    laura: { da: 'luoghi', fra: ['library', 'cinema', 'museum'] },
    papa: { da: 'luoghi', fra: ['park', 'zoo'] },
    spesa: { fra: SPESA },
    ora: { da: 'numeri', fra: ['six', 'seven'] },
  },
  pagine: [
    [
      { en: 'Last Sunday Grandmother had a birthday.', forma: 'passato' },
      { en: 'In the morning Mother made a big cake with chocolate for her.', forma: 'passato' },
      { en: 'The cake was on the kitchen table.', forma: 'was-were' },
    ],
    [
      { en: 'At two o’clock Laura went to the {laura} with a friend.', forma: 'passato' },
      { se: v => v.chi === 'Pip', en: 'Father took Leo to the {papa}.', forma: 'passato' },
      { se: v => v.chi === 'Leo', en: 'Father took Pip to the {papa}.', forma: 'passato' },
      { en: 'Then Mother went to the market, and she bought {spesa}.', forma: 'passato' },
    ],
    [
      { en: 'At four o’clock she came home.', forma: 'passato' },
      { en: 'She looked at the kitchen table, and she was very sad: the cake was not there!',
        forma: 'passato-ed' },
      { en: 'Where was the cake? Who took it?', forma: 'passato' },
    ],
    [
      { se: v => v.chi === 'Pip', en: 'Then she found Pip under the sofa. He had chocolate on his nose!',
        forma: 'passato' },
      { se: v => v.chi === 'Leo', en: 'Then she found Leo in his bedroom. He had chocolate on his hands!',
        forma: 'passato' },
      { en: 'Mother looked at {chi}, and {chi} looked at Mother.', forma: 'passato-ed' },
    ],
    [
      { en: 'In the afternoon Mother and Father made a small cake.', forma: 'passato' },
      { en: 'Grandmother came at {ora} o’clock, and she ate the cake with Laura and Leo.', forma: 'passato' },
      { en: 'She was very happy. But {chi} was not hungry!', forma: 'was-were' },
    ],
  ],
  domande: [
    { testo: 'Perché la mamma ha fatto una torta?', risposta: () => 'Per il compleanno della nonna',
      anche: ['Per la cena', 'Per il compleanno di Leo', 'Per Pip'] },
    { testo: 'Dov’è andata Laura, alle due?', risposta: v => grande(v.laura.al) },
    { testo: 'Il papà è andato al parco.', tipo: 'vf', vero: v => v.papa.en === 'park' },
    { testo: 'Che cosa ha comprato la mamma?', risposta: v => v.spesa.it },
    { testo: 'Che cosa è successo prima?', risposta: () => 'La mamma è andata al mercato',
      anche: ['La mamma ha trovato la cioccolata', 'La nonna ha mangiato la torta',
              'La mamma e il papà hanno fatto una torta piccola'] },
    { testo: 'Chi ha mangiato la torta?', risposta: v => v.chi, anche: ['Laura', 'La nonna'] },
  ],
}
