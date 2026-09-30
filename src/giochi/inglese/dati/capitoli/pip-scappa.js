// In quinta, a metà isola (dopo «Ieri ero al parco»): Pip scappa dal parco, al
// passato. Quattro pagine, sei domande — l'ordine dei posti, il perché, e
// una che il testo a volte non dice. Formato in docs/lingue/libro.md.
const grande = s => s[0].toUpperCase() + s.slice(1)
const TROVATO = {
  shop: 'Pip was in the shop, and he ate the bread!',
  library: 'Pip was in the library. He slept under a table!',
  station: 'Pip was at the station. He looked at the trains!',
  zoo: 'Pip was at the zoo. He swam with the ducks!',
}

export default {
  id: 'pip-scappa',
  mondo: 'quinta',
  dopo: 'quinta-ieri',
  titolo: 'Pip scappa',
  variabili: {
    caldo: { fra: [true, false] },
    animale: { da: 'animali', fra: ['cat', 'duck', 'rabbit'] },
    primo: { da: 'luoghi', fra: ['museum', 'cinema', 'hospital', 'station', 'library', 'shop'] },
    dove: { da: 'luoghi', fra: Object.keys(TROVATO) },
  },
  vincoli: [v => v.primo !== v.dove],
  pagine: [
    [
      { en: 'Last Saturday Laura and Leo went to the park with Pip.', forma: 'passato' },
      { se: v => v.caldo, en: 'It was a hot day, and the sky was blue.', forma: 'was-were' },
      { se: v => !v.caldo, en: 'It was a cold day, and there were clouds in the sky.', forma: 'was-were' },
      { en: 'Laura and Leo played with a ball, and Pip ran and jumped.', forma: 'passato-ed' },
    ],
    [
      { en: 'Then {a:animale} walked near the park.', forma: 'passato-ed' },
      { en: 'Pip looked at the {animale}, and then he ran after it!', forma: 'passato' },
      { en: 'Laura and Leo looked for Pip in the park, but he was not there.', forma: 'passato-ed' },
      { chi: 'Leo', en: 'Pip! Pip! Where are you?', forma: 'dove' },
      { en: 'Leo was very sad.', forma: 'was-were' },
    ],
    [
      { en: 'They walked to the {primo}, but Pip was not there.', forma: 'passato-ed' },
      { en: 'Then they walked to the {dove}.', forma: 'passato-ed' },
      ...Object.entries(TROVATO).map(([k, en]) => ({ se: v => v.dove.en === k, en, forma: 'passato' })),
    ],
    [
      { en: 'Laura and Leo were very happy.', forma: 'was-were' },
      { en: 'At six o’clock they walked home with Pip.', forma: 'passato-ed' },
      { en: 'Pip was tired, and he slept after dinner.', forma: 'passato' },
      { chi: 'Laura', en: 'Good night, Pip!', forma: 'saluti' },
    ],
  ],
  domande: [
    { testo: 'Dove giocavano Laura e Leo?', risposta: () => 'Al parco',
      anche: ['Allo zoo', 'In biblioteca', 'Alla stazione'] },
    { testo: 'Che tempo faceva?',
      risposta: v => (v.caldo ? 'Faceva caldo e il cielo era blu' : 'Faceva freddo e c’erano nuvole'),
      anche: ['Pioveva e c’era vento', 'Nevicava'] },
    { testo: 'Perché Pip è scappato?', risposta: v => `Correva dietro a ${v.animale.un}`,
      anche: ['Aveva fame', 'Era stanco'] },
    { testo: 'Dov’era Pip?', risposta: v => grande(v.dove.al) },
    { testo: 'Pip ha mangiato il pane.', tipo: 'vf', vero: v => (v.dove.en === 'shop' ? true : null) },
    { tipo: 'ordine', fatti: ['Laura e Leo hanno giocato a palla', v => `Pip è corso dietro a ${v.animale.un}`,
                              v => `Lo hanno cercato ${v.primo.al}`, v => `Lo hanno trovato ${v.dove.al}`] },
  ],
}
