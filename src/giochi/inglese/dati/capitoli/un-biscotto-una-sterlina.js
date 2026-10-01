// In quinta, dopo «Quanto costa?»: Laura e Leo vogliono un giocattolo della
// vetrina, troppo caro, e vendono biscotti sul marciapiede. A sera manca una
// sterlina, e c'è un biscotto solo. Quattro pagine, sei domande. Formato in
// docs/lingue/libro.md.
const ultimo = (id, en, it) => ({ id, en, it })

export default {
  id: 'un-biscotto-una-sterlina',
  mondo: 'quinta',
  dopo: 'quinta-quanto',
  titolo: 'Un biscotto, una sterlina',
  nuove: ['buy'],
  variabili: {
    gioco: { da: 'giocattoli', fra: ['kite', 'ball', 'puzzle'] },
    prezzo: { da: 'numeri', fra: ['eight', 'nine', 'ten'] },
    quasi: { da: 'numeri', fra: ['seven', 'eight', 'nine'] },
    maestra: { da: 'numeri', fra: ['two', 'three', 'four'] },
    ultimo: { fra: [ultimo('nonno', 'Grandfather', 'Il nonno'), ultimo('papa', 'Father', 'Il papà')] },
  },
  // Tom ne compra due, la nonna tre, la maestra il resto: alla sera manca una sterlina
  vincoli: [v => v.quasi.n === v.prezzo.n - 1, v => v.maestra.n === v.prezzo.n - 6],
  pagine: [
    [
      { en: 'Laura and Leo are at the shop on the corner.', forma: 'presente' },
      { en: 'In the window there is a big {gioco}.', forma: 'there-is' },
      { chi: 'Leo', en: 'How much is the {gioco}, Laura?', forma: 'costa' },
      { chi: 'Laura', en: 'It is {prezzo} pounds: it is very expensive!', forma: 'costa' },
      { en: 'Leo looks in his wallet: there is one penny in it.', forma: 'there-is' },
      { id: 'idea', chi: 'Laura', en: 'We can cook cookies with Mother, and a cookie is one pound!', forma: 'can' },
    ],
    [
      { en: 'On Sunday morning Laura and Leo cook cookies with Mother.', forma: 'presente' },
      { en: 'Then they sit at a small table on the pavement, opposite the park.', forma: 'presente' },
      { en: 'Leo writes a sign with the price of the cookies.', forma: 'terza-s' },
    ],
    [
      { en: 'Tom is the first at the table.', forma: 'presente' },
      { chi: 'Tom', en: 'How much are two cookies?', forma: 'costa' },
      { chi: 'Leo', en: 'They are two pounds.', forma: 'costa' },
      { en: 'Then Grandmother buys three cookies.', forma: 'terza-s' },
      { en: 'At one o’clock the teacher is in the park, and she looks at the table.', forma: 'presente' },
      { id: 'economici', chi: 'maestra', en: 'Your cookies are very good, and they are cheap!', forma: 'costa' },
      { en: 'She buys {maestra} cookies.', forma: 'terza-s' },
    ],
    [
      { en: 'In the evening Laura and Leo count the money.', forma: 'presente' },
      { chi: 'Leo', en: 'We have got {quasi} pounds. The {gioco} is {prezzo}!', forma: 'have-got' },
      { en: 'On the table there is one cookie, and it is very small.', forma: 'there-is' },
      { en: 'Then {ultimo} is at the table.', forma: 'presente' },
      { id: 'ultimo', chi: v => v.ultimo.id, en: 'Can I have the small cookie? Look, I have got one pound!',
        forma: 'can' },
      { en: 'On Monday Laura and Leo buy the {gioco}, and they play with it in the park.', forma: 'presente' },
    ],
  ],
  domande: [
    { testo: v => `Quanto costa ${v.gioco.il} nella vetrina?`, risposta: v => `${v.prezzo.it} sterline`,
      anche: ['Una sterlina'] },
    { tipo: 'chi', frase: 'economici' },
    { testo: 'Perché Laura e Leo cucinano i biscotti?', risposta: v => `Per comprare ${v.gioco.un}`,
      anche: ['Per la festa della mamma', 'Perché Tom ha fame'] },
    { testo: 'Quanti biscotti compra la maestra?', risposta: v => v.maestra.it },
    { testo: 'Chi compra l’ultimo biscotto?', risposta: v => v.ultimo.it, anche: ['Tom', 'La nonna'] },
    { tipo: 'ordine', fatti: ['Laura e Leo guardano la vetrina', 'Cucinano i biscotti con la mamma',
                              'Contano i soldi', v => `Comprano ${v.gioco.il}`] },
  ],
}
