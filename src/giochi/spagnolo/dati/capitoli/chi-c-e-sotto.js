// In prima, dopo «Ciao! Come ti chiami?»: a Carnevale una maschera alla
// porta; Laura dice che è Tom, la maschera dice di no. el/la con le
// maschere (el fantasma, la bruja). Formato in docs/lingue/libro.md.
export default {
  id: 'chi-c-e-sotto',
  mondo: 'prima',
  dopo: 'prima-hola',
  titolo: 'Chi c’è sotto?',
  variabili: {
    maschera: { fra: [
      { es: 'bruja', it: 'strega', un: 'una strega' },
      { es: 'fantasma', it: 'fantasma', un: 'un fantasma' },
      { es: 'calabaza', it: 'zucca', un: 'una zucca' },
    ] },
    sotto: { fra: ['Tom', 'Leo'] },
  },
  pagine: [
    [
      { es: 'Es Carnaval.', forma: 'es-un' },
      { chi: 'Laura', es: '¡Hola! ¿Cómo te llamas?', forma: 'saludos' },
      { chi: 'voce', es: '¡Hola! ¡Soy {el:maschera}!', forma: 'el-la' },
      { chi: 'Laura', es: '¡No es {un:maschera}! ¡Es Tom!', forma: 'es-un' },
      { chi: 'voce', es: '¡No, no soy Tom!', forma: 'saludos' },
    ],
    [
      { chi: v => v.sotto, es: '¡Hola, Laura! ¡Soy {sotto}!', forma: 'saludos' },
      { chi: 'Laura', es: '¡Hola, {sotto}! ¡Feliz Carnaval!', forma: 'saludos' },
    ],
  ],
  domande: [
    { testo: 'Che maschera c’è alla porta?', risposta: v => v.maschera.un },
    { testo: 'Chi c’è sotto la maschera?', risposta: v => v.sotto, anche: ['Pip'] },
    { testo: 'Laura indovina chi c’è sotto?', tipo: 'vf', etichette: ['Sì', 'No'], vero: v => v.sotto === 'Tom' },
  ],
}
