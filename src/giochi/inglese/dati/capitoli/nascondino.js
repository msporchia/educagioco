// In terza, a metà isola (dopo «Dov’è?»): Laura cerca Leo per la casa.
// Tre pagine, quattro domande — dove conta, l'ordine in cui cerca, e se
// Pip l'aiuta, che il testo non dice ma lascia capire. Formato in
// docs/lingue/libro.md.
const posto = (en, it, stanza, itStanza) => ({ en, it, stanza, itStanza })
const POSTI = [
  posto('under the bed', 'Sotto il letto', 'bedroom', 'In camera'),
  posto('in the bath', 'Nella vasca', 'bathroom', 'In bagno'),
  posto('under the table', 'Sotto il tavolo', 'kitchen', 'In cucina'),
  posto('behind the door', 'Dietro la porta', 'garage', 'In garage'),
]

export default {
  id: 'nascondino',
  mondo: 'terza',
  dopo: 'terza-dove',
  titolo: 'Nascondino',
  variabili: {
    primo: { fra: POSTI },
    posto: { fra: POSTI },
    pip: { fra: [true, false] },
  },
  vincoli: [v => v.primo !== v.posto],
  pagine: [
    [
      { en: 'Laura, Leo and Pip are in the house.', forma: 'dove' },
      { en: 'Laura is in the garden.', forma: 'dove' },
      { chi: 'Laura', en: 'One, two, three, four, five, six, seven, eight, nine, ten! Where is Leo?', forma: 'dove' },
    ],
    [
      { chi: 'Laura', en: 'Is Leo in the {primo.stanza}? Is he {primo.en}?', forma: 'dove' },
      { en: 'No! Leo is not in the {primo.stanza}.', forma: 'dove' },
      { se: v => v.pip, en: 'Where is Pip? Pip is near the {posto.stanza} door.', forma: 'dove' },
    ],
    [
      { chi: 'Laura', en: 'Is Leo in the {posto.stanza}?', forma: 'dove' },
      { chi: 'Leo', en: 'Yes! I am {posto.en}!', forma: 'dove' },
      { se: v => v.pip, chi: 'Laura', en: 'Good dog, Pip!', forma: 'saluti' },
      { se: v => !v.pip, chi: 'Laura', en: 'Hello, Leo!', forma: 'saluti' },
    ],
  ],
  domande: [
    { testo: 'Dove conta fino a dieci Laura?', risposta: () => 'In giardino',
      anche: ['In cucina', 'In camera', 'In bagno'] },
    { testo: 'Dove cerca Laura, prima di tutto?', risposta: v => v.primo.itStanza },
    { testo: 'Dov’è nascosto Leo?', risposta: v => v.posto.it },
    { testo: 'Pip aiuta Laura a trovare Leo?', tipo: 'vf', etichette: ['Sì', 'No'],
      vero: v => (v.pip ? true : null) },
  ],
}
