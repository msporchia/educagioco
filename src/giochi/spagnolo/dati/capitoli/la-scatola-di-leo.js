// In prima, dopo «Questo è…»: Leo mostra lo zaino a Tom, e dentro c'è una
// scatola che non è sua. este/esta (e el mapa, che è maschile).
// Formato in docs/lingue/libro.md.
export default {
  id: 'la-scatola-di-leo',
  mondo: 'prima',
  dopo: 'prima-este',
  titolo: 'La scatola nello zaino',
  variabili: {
    cosa: { da: 'scuola', fra: ['libro', 'lápiz', 'bolígrafo', 'borrador'] },
    gioco: { da: 'giocattoli', fra: ['pelota', 'muñeca', 'cometa', 'auto', 'bote', 'rompecabezas'] },
    festa: { fra: [{ es: 'Navidad', it: 'Natale' }, { es: 'Pascua', it: 'Pasqua' }] },
  },
  pagine: [
    [
      { chi: 'Leo', es: 'Hola, Tom. Esta es mi mochila.', forma: 'este-esta' },
      { chi: 'Leo', es: 'Este es mi {cosa} y esta es mi regla.', forma: 'este-esta' },
      { chi: 'Leo', es: 'Y este es mi mapa.', forma: 'este-esta' },
      { chi: 'Tom', es: '¿Y esta caja?', forma: 'este-esta' },
      { chi: 'Leo', es: 'Esta no es mi caja.', forma: 'este-esta' },
    ],
    [
      { chi: 'Laura', es: '¡Es mi caja! Es un regalo.', forma: 'este-esta' },
      { chi: 'Laura', es: '¡Feliz {festa}, Leo!', forma: 'saludos' },
      { chi: 'Leo', es: '¡Es {un:gioco}! ¡Gracias, Laura!', forma: 'saludos' },
    ],
  ],
  domande: [
    { testo: 'Di chi è la scatola nello zaino?', risposta: () => 'Di Laura', anche: ['Di Leo', 'Di Tom'] },
    { testo: 'Che cosa c’è nella scatola?', risposta: v => v.gioco.un },
    { testo: 'Che festa è?', risposta: v => v.festa.it, anche: ['Carnevale'] },
  ],
}
