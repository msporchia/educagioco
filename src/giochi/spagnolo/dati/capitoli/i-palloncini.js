// In prima, alla 🏁: Laura conta i palloncini della festa e ne manca uno;
// ce l'ha Pip. I numeri fino a dieci; quanti sono si capisce dal conto
// della mamma. Formato in docs/lingue/libro.md.
export default {
  id: 'i-palloncini',
  mondo: 'prima',
  titolo: 'I palloncini',
  variabili: {
    conto: { fra: [
      { es: 'cuatro', conta: 'Uno, dos, tres, cuatro', tutti: 'Cinco', it: 'quattro', itTutti: 'cinque' },
      { es: 'cinco', conta: 'Uno, dos, tres, cuatro, cinco', tutti: 'Seis', it: 'cinque', itTutti: 'sei' },
      { es: 'seis', conta: 'Uno, dos, tres, cuatro, cinco, seis', tutti: 'Siete', it: 'sei', itTutti: 'sette' },
    ] },
    colore: { da: 'colori', fra: ['rojo', 'azul', 'verde', 'amarillo', 'naranja', 'morado'] },
  },
  pagine: [
    [
      { es: 'Es una fiesta.', forma: 'es-un' },
      { chi: 'Laura', es: '¡{conto.conta}!', forma: 'es-un' },
      { chi: 'mamma', es: '¡No, no! ¡{conto.tutti}!', forma: 'es-un' },
      { chi: 'Laura', es: '¿Y el globo {colore}?', forma: 'color-despues' },
    ],
    [
      { chi: 'Leo', es: '¡Pip! ¡Este es el globo {colore}!', forma: 'este-esta' },
      { chi: 'Laura', es: '¡{conto.tutti}!', forma: 'es-un' },
    ],
  ],
  domande: [
    { testo: 'Quanti palloncini conta Laura?', risposta: v => v.conto.it },
    { testo: 'Quanti palloncini ci sono alla festa?', risposta: v => v.conto.itTutti },
    { testo: 'Di che colore è il palloncino di Pip?', risposta: v => v.colore.it },
  ],
}
