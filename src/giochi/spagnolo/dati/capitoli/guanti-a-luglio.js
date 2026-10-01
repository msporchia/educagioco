// In terza, dopo «Fa freddo, piove»: per il compleanno di luglio la nonna,
// che vive dall'altra parte del mondo (in Bolivia), manda dei guanti.
// Che lì sia inverno lo dice lei; perché Laura ha caldo no. Formato in docs/lingue/libro.md.
export default {
  id: 'guanti-a-luglio',
  mondo: 'terza',
  dopo: 'terza-hace',
  titolo: 'Guanti a luglio',
  variabili: {
    giorno: { da: 'giorni', fra: ['miércoles', 'sábado', 'domingo'] },
    anni: { da: 'numeri', fra: ['siete', 'ocho', 'nueve'] },
    colore: { da: 'colori', fra: ['rojo', 'azul', 'verde', 'amarillo'] },
    nieve: { fra: [true, false] },
  },
  pagine: [
    [
      { chi: 'Laura', es: '¡Hola! Soy Laura. Hoy es {giorno} y es mi cumpleaños.', forma: 'hoy-es' },
      { chi: 'Laura', es: 'Tengo {anni} años.', forma: 'tener' },
      { es: 'Es julio. Hace mucho calor y no hay nubes en el cielo.', forma: 'hace' },
    ],
    [
      { es: 'En la mesa hay una caja y una carta. Son de la abuela.', forma: 'hay' },
      { chi: 'Leo', es: '¿Qué hay en la caja?', forma: 'preguntas' },
      { es: '¡En la caja hay unos guantes {colore.pl}!', forma: 'hay' },
      { chi: 'Leo', es: '¿Guantes en julio? ¡Hace mucho calor!', forma: 'hace' },
    ],
    [
      { es: 'La mamá tiene la carta de la abuela.', forma: 'tiene' },
      { chi: 'nonna', es: '¡Hola, Laura! ¡Feliz cumpleaños!', forma: 'saludos' },
      { id: 'inverno', chi: 'nonna', es: 'Aquí, en julio, es invierno.', forma: 'hoy-es' },
      { se: v => v.nieve, chi: 'nonna', es: 'Hace mucho frío y hay nieve en la montaña.', forma: 'hace' },
      { se: v => !v.nieve, chi: 'nonna', es: 'Hace mucho frío y hace viento.', forma: 'hace' },
      { chi: 'Laura', es: '¡Gracias, abuela!', forma: 'saludos' },
      { es: 'Laura tiene los guantes, y tiene mucho calor.', forma: 'tiene' },
    ],
  ],
  domande: [
    { testo: 'Chi manda il regalo a Laura?', risposta: () => 'La nonna', anche: ['La mamma', 'Tom', 'Leo'] },
    { tipo: 'frase', testo: 'Perché dalla nonna a luglio fa freddo?', frase: 'inverno' },
    { testo: 'Perché Leo si stupisce del regalo?', risposta: () => 'Perché a luglio fa caldo',
      anche: ['Perché i guanti sono piccoli', 'Perché la scatola è vuota', 'Perché è il compleanno di Leo'] },
    { testo: 'Che tempo fa dalla nonna?',
      risposta: v => (v.nieve ? 'Freddo, e c’è la neve sulla montagna' : 'Freddo, e tira vento'),
      anche: ['Caldo, e c’è il sole'] },
    { testo: 'Perché alla fine Laura ha caldo?', risposta: () => 'Perché ha i guanti e fa caldo',
      anche: ['Perché è malata', 'Perché c’è la neve', 'Perché è inverno'] },
  ],
}
