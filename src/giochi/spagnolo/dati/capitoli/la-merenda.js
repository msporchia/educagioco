// In seconda, dopo «Mi piace!»: Tom a merenda da Laura e Leo. Due pagine,
// tre domande; a chi piace la frutta si capisce da tre battute (a mí
// también, a mí sí). Formato in docs/lingue/libro.md.
export default {
  id: 'la-merenda',
  mondo: 'seconda',
  dopo: 'seconda-gusta',
  titolo: 'La merenda',
  variabili: {
    quanti: { da: 'numeri', fra: ['tres', 'cuatro', 'cinco', 'seis'] },
    frutto: { da: 'cibi', fra: ['manzana', 'plátano', 'frutilla', 'zanahoria', 'tomate'] },
    piace: { fra: [true, false] },
    // `este`: il dimostrativo col genere del dolce (Esta es mi torta, Este es mi chocolate)
    dolce: { fra: [
      { es: 'chocolate', it: 'cioccolato', il: 'il cioccolato', este: 'Este' },
      { es: 'torta', it: 'torta', il: 'la torta', este: 'Esta' },
      { es: 'pizza', it: 'pizza', il: 'la pizza', este: 'Esta' },
      { es: 'queso', it: 'formaggio', il: 'il formaggio', este: 'Este' },
    ] },
  },
  pagine: [
    [
      { chi: 'mamma', es: '¡Hola, Tom! ¡Hola, Leo!', forma: 'saludos' },
      { chi: 'mamma', es: 'Son {quanti} {frutto.pl}. ¿Te gustan {los:frutto}, Tom?', forma: 'me-gusta' },
      { se: v => v.piace, chi: 'Tom', es: '¡Sí, me gustan mucho! Gracias.', forma: 'me-gusta' },
      { se: v => !v.piace, chi: 'Tom', es: 'No, gracias. No me gustan {los:frutto}.', forma: 'me-gusta' },
      { se: v => v.piace, chi: 'Leo', es: '¡A mí también me gustan!', forma: 'me-gusta' },
      { se: v => !v.piace, chi: 'Leo', es: '¡A mí sí me gustan!', forma: 'me-gusta' },
    ],
    [
      { chi: 'Laura', es: 'Y a mí también. ¡Me gustan mucho {los:frutto}!', forma: 'me-gusta' },
      { chi: 'Laura', es: 'Tom, ¿te gusta {el:dolce}?', forma: 'me-gusta' },
      { chi: 'Tom', es: '¡Sí, me gusta mucho {el:dolce}!', forma: 'me-gusta' },
      { id: 'regalo', chi: 'Laura', es: '{dolce.este} es mi {dolce}. ¡Es un regalo, Tom!', forma: 'este-esta' },
      { chi: 'Tom', es: '¡Gracias, Laura!', forma: 'saludos' },
    ],
  ],
  domande: [
    { testo: v => `A Tom piacciono ${v.frutto.ilPl}?`, tipo: 'vf', etichette: ['Sì', 'No'], vero: v => v.piace },
    { testo: v => `A chi piacciono ${v.frutto.ilPl}?`,
      risposta: v => (v.piace ? 'A Tom, a Leo e a Laura' : 'A Leo e a Laura, non a Tom'),
      anche: ['Solo a Tom', 'Solo alla mamma'] },
    { testo: 'Perché alla fine Tom dice «gracias»?',
      risposta: v => `Laura gli regala ${v.dolce.il}`,
      anche: ['Leo gli regala una palla'] },
  ],
}
