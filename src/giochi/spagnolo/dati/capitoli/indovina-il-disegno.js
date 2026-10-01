// In prima, dopo «È un cane, è una mucca»: Tom e Leo disegnano, gli altri
// indovinano. Solo es, un/una, no, sí: la difficoltà è il genere. Che
// Leo abbia disegnato Pip si capisce dalla risposta. Formato in docs/lingue/libro.md.
export default {
  id: 'indovina-il-disegno',
  mondo: 'prima',
  dopo: 'prima-es-un',
  titolo: 'Indovina il disegno',
  variabili: {
    animale: { da: 'animali', fra: ['gato', 'vaca', 'pato', 'conejo', 'caballo', 'cerdo', 'rana', 'oveja'] },
    prova: { da: 'animali', fra: ['perro', 'gato', 'vaca', 'pez', 'ratón', 'pájaro', 'rana'] },
    sembra: { da: 'animali', fra: ['gato', 'vaca', 'cerdo', 'ratón', 'oveja'] },
  },
  vincoli: [v => v.prova !== v.animale],
  pagine: [
    [
      { chi: 'Leo', es: '¿Es {un:prova}?', forma: 'es-un' },
      { chi: 'Tom', es: 'No, no es {un:prova}.', forma: 'es-un' },
      { chi: 'Laura', es: '¿Es {un:animale}?', forma: 'es-un' },
      { chi: 'Tom', es: '¡Sí! ¡Es {un:animale}!', forma: 'es-un' },
    ],
    [
      { chi: 'Tom', es: '¿Es {un:sembra}?', forma: 'es-un' },
      { chi: 'Leo', es: '¡No! ¡Es Pip!', forma: 'es-un' },
      { chi: 'Laura', es: '¡No es Pip! ¡Es {un:sembra}!', forma: 'es-un' },
    ],
  ],
  domande: [
    { testo: 'Che animale ha disegnato Tom?', risposta: v => v.animale.un },
    { testo: 'Chi indovina il disegno di Tom?', risposta: () => 'Laura', anche: ['Leo', 'Pip'] },
    { testo: 'Che cosa ha disegnato Leo?', risposta: () => 'Il cane Pip', anche: ['Un gatto', 'Una mucca'] },
  ],
}
