// Il capitolo del mondo «Che cos'è»: quattro frasi e una domanda. Solo le
// strutture di quel mondo (it is, is it, this is, i colori). Formato in
// docs/lingue/mondi.md («Il libro a capitoli»).
export default {
  id: 'la-scatola-di-leo',
  mondo: 'che-cose',
  titolo: 'La scatola di Leo',
  variabili: {
    colore: { da: 'colori', fra: ['red', 'blue', 'green', 'yellow', 'black', 'white', 'brown', 'pink'] },
    animale: { da: 'animali', fra: ['cat', 'dog', 'rabbit', 'mouse', 'frog', 'duck'] },
    taglia: { da: 'aggettivi', fra: ['big', 'small'] },
  },
  frasi: [
    { en: 'This is Leo. This is {a:colore} box.', forma: 'this-is' },
    { en: 'Is it a cat?', forma: 'is-it' },
    { se: v => v.animale.en === 'cat', en: 'Yes! It is a cat.', forma: 'it-is' },
    { se: v => v.animale.en !== 'cat', en: 'No, it is not a cat. It is {a:animale}!', forma: 'it-is' },
    { en: 'It is {taglia}.', forma: 'it-is' },
  ],
  domande: [
    { testo: 'Che animale c’è nella scatola?', risposta: v => v.animale.un },
  ],
}
