// In quinta, alla 🏁: il regalo per il compleanno della mamma, coi soldi del
// papà. La strada, i prezzi, e il genitivo in tutta la storia; il portafoglio
// «perso» di Leo sta dove la prima pagina l'aveva detto. Quattro pagine, sei
// domande. Formato in docs/lingue/libro.md.
const regalo = (en, un, il) => ({ en, un, il })

export default {
  id: 'il-compleanno-della-mamma',
  mondo: 'quinta',
  titolo: 'Il compleanno della mamma',
  nuove: ['buy', 'laugh'],
  variabili: {
    soldi: { da: 'numeri', fra: ['six', 'seven'] },
    resto: { da: 'numeri', fra: ['two', 'three'] },
    caro: { da: 'vestiti', fra: ['scarf', 'hat', 'coat', 'dress'] },
    colore: { da: 'colori', fra: ['red', 'blue', 'green', 'yellow', 'purple'] },
    regalo: { fra: [regalo('book', 'un libro', 'il libro'), regalo('umbrella', 'un ombrello', 'l’ombrello'),
                    regalo('cup', 'una tazza', 'la tazza')] },
  },
  // il regalo costa quattro sterline: resta il resto
  vincoli: [v => v.resto.n === v.soldi.n - 4],
  pagine: [
    [
      { en: 'Today is Saturday, and tomorrow is Mother’s birthday.', forma: 'genitivo' },
      { en: 'Laura, Leo and Tom go to the shop for her present, with Father’s money.', forma: 'genitivo' },
      { en: 'There are {soldi} pounds in Leo’s wallet.', forma: 'genitivo' },
      { id: 'zainetto', en: 'Laura has got a small backpack, and Leo’s wallet is in it.', forma: 'genitivo' },
      { id: 'strada', chi: 'papa', en: 'Go straight on and turn right at the corner. The shop is between the bank and the cinema.',
        forma: 'strada' },
    ],
    [
      { en: 'The shop is big, and there are hats, coats and dresses.', forma: 'there-is' },
      { chi: 'Laura', en: 'Look at this {colore} {caro}! Mother likes {colore}.', forma: 'terza-s' },
      { chi: 'Tom', en: 'How much is it?', forma: 'costa' },
      { en: 'The price is twelve pounds.', forma: 'costa' },
      { chi: 'Leo', en: 'It is very expensive, and we have got {soldi} pounds.', forma: 'costa' },
    ],
    [
      { en: 'Then Tom looks at {a:regalo} on the table.', forma: 'terza-s' },
      { en: 'The {regalo} is four pounds, and it is cheap.', forma: 'costa' },
      { chi: 'Leo', en: 'Good! But my wallet is not in my pocket!', forma: 'presente' },
      { en: 'They look on the floor, under the table and at the door, but there is no wallet.', forma: 'there-is' },
    ],
    [
      { id: 'zaino', chi: 'Tom', en: 'Leo, look! Your wallet is in Laura’s backpack!', forma: 'genitivo' },
      { en: 'Laura and Tom laugh, and Leo is red in the face.', forma: 'presente' },
      { en: 'They buy the {regalo}, and in Leo’s wallet there are {resto} pounds.', forma: 'genitivo' },
      { en: 'On Sunday Mother opens her present.', forma: 'terza-s' },
      { chi: 'mamma', en: 'Thank you, Laura and Leo! I like it very much!', forma: 'i-like' },
    ],
  ],
  domande: [
    { testo: 'Di chi è il compleanno?', risposta: () => 'Della mamma', anche: ['Di Laura', 'Di Tom', 'Del papà'] },
    { testo: v => `Perché non comprano ${v.caro.il}?`, risposta: () => 'Costa troppo',
      anche: ['Alla mamma non piace il colore', 'Il negozio è chiuso', 'Tom non vuole'] },
    { tipo: 'frase', testo: 'Quale frase diceva già dov’era il portafoglio di Leo?', frase: 'zainetto' },
    { tipo: 'chi', frase: 'zaino' },
    { testo: 'Quanti soldi restano nel portafoglio di Leo?', risposta: v => `${v.resto.it} sterline`,
      anche: ['Una sterlina', 'Dodici sterline'] },
    { tipo: 'ordine', fatti: ['Il papà dà la strada', v => `Laura guarda ${v.caro.il}`,
                              'Leo cerca il portafoglio', v => `Comprano ${v.regalo.il}`] },
  ],
}
