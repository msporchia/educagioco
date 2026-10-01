// In quinta, dopo «Il cane di Tom»: Laura e Leo trovano un portafoglio sul
// marciapiede. Di chi è? Nel negozio la nonna vuole comprare un giocattolo e
// non trova il portafoglio: era il suo, e il giocattolo è il regalo di Leo.
// Formato in docs/lingue/libro.md.
const banconota = (es, n) => ({ id: es, es, n })
const sospetto = (id, de) => ({ id, de })
const IN_LETTERE = { 12: 'dodici', 13: 'tredici', 14: 'quattordici', 22: 'ventidue', 23: 'ventitré', 24: 'ventiquattro' }
const totale = v => v.monete.n + v.billete.n

export default {
  id: 'di-chi-e-il-portafoglio',
  mondo: 'quinta',
  dopo: 'quinta-de',
  titolo: 'Di chi è il portafoglio?',
  nuove: ['comprar'],
  variabili: {
    colore: { da: 'colori', fra: ['azul', 'verde', 'rojo', 'marrón'] },
    monete: { da: 'numeri', fra: ['dos', 'tres', 'cuatro'] },
    billete: { fra: [banconota('diez', 10), banconota('veinte', 20)] },
    sospetto: { fra: [sospetto('maestra', 'de la maestra'), sospetto('Tom', 'de Tom')] },
    cosa: { da: 'giocattoli', fra: ['pelota', 'cometa', 'rompecabezas'] },
    bonito: { fra: ['bonito'] },                     // si accorda col giocattolo: una pelota bonita
    prezzo: { fra: [banconota('nueve', 9), banconota('once', 11)] },
  },
  pagine: [
    [
      { es: 'Es sábado. Laura y Leo van a la tienda con Pip.', forma: 'voy-al' },
      { es: 'En la vereda, al lado de la parada, hay una billetera {colore.f}.', forma: 'hay' },
      { chi: 'Leo', es: '¿De quién es?', forma: 'de' },
      { es: 'Laura abre la billetera.', forma: 'presente-er-ir' },
      { es: 'En la billetera hay {monete} monedas de un boliviano y un billete de {billete} bolivianos.',
        forma: 'cuanto' },
      { chi: 'Leo', es: '¡Es mucho dinero!', forma: 'cantidad' },
      { chi: 'Laura', es: '¿Es la billetera {sospetto.de}?', forma: 'de' },
      { chi: 'Leo', es: '¡Vamos a la tienda! Allí hay mucha gente.', forma: 'voy-al' },
    ],
    [
      { es: 'En la tienda está la abuela.', forma: 'esta-en' },
      { es: 'La abuela mira {un:cosa} muy {bonito~cosa}.', forma: 'presente-ar' },
      { chi: 'nonna', es: '¿Cuánto cuesta {el:cosa}?', forma: 'cuanto' },
      { chi: 'venditore', es: 'Cuesta {prezzo} bolivianos.', forma: 'cuanto' },
      { es: 'La abuela mira en su bolso.', forma: 'presente-ar' },
      { chi: 'nonna', es: '¿Dónde está mi billetera? ¡No tengo dinero!', forma: 'esta-en' },
    ],
    [
      { chi: 'Leo', es: 'Abuela, ¿es tu billetera?', forma: 'mi-tu-su' },
      { id: 'mia', chi: 'nonna', es: '¡Sí, es mi billetera! ¡Muchas gracias!', forma: 'mi-tu-su' },
      { es: 'La abuela compra {el:cosa}.', forma: 'presente-ar' },
      { chi: 'Laura', es: 'Abuela, ¿de quién es {el:cosa}?', forma: 'de' },
      { id: 'regalo', chi: 'nonna', es: 'Es de Leo: es su regalo de cumpleaños.', forma: 'de' },
      { es: 'Leo está muy contento, y Pip también.', forma: 'ser-estar' },
    ],
  ],
  domande: [
    { testo: 'Di chi è il portafoglio?', risposta: () => 'Della nonna',
      anche: ['Della maestra', 'Di Tom', 'Del venditore'] },
    { testo: 'Quanti soldi ci sono nel portafoglio?', risposta: v => `${IN_LETTERE[totale(v)]} bolivianos`,
      anche: ['Dieci bolivianos', 'Venti bolivianos'] },
    { tipo: 'frase', testo: 'Per chi è il regalo della nonna? Tocca la frase che lo dice.', frase: 'regalo' },
    { tipo: 'chi', frase: 'mia' },
    { tipo: 'ordine', fatti: ['Laura e Leo trovano un portafoglio', 'La nonna non trova il suo portafoglio',
      'Leo chiede alla nonna se è suo', v => `La nonna compra ${v.cosa.un}`] },
  ],
}
