// In quinta, dopo «Gira a sinistra»: in piazza una signora cerca un posto
// con una mappa, ma la mappa è vecchia e il posto si è spostato. Laura e Tom
// le danno la strada e la accompagnano; il lunedì la signora è la maestra
// nuova. Formato in docs/lingue/libro.md.
const lato = (es, it) => ({ id: es, es, it })
const vicino = (id, de, it) => ({ id, es: id, de, it })
const dove = (id, es) => ({ id, es })

export default {
  id: 'la-mappa-vecchia',
  mondo: 'quinta',
  dopo: 'quinta-gira',
  titolo: 'La mappa vecchia',
  variabili: {
    posto: { da: 'luoghi', fra: ['museo', 'biblioteca', 'cine'] },
    nuevo: { fra: ['nuevo'] },                       // si accorda col posto: el museo nuevo, la biblioteca nueva
    lato: { fra: [lato('izquierda', 'a sinistra'), lato('derecha', 'a destra')] },
    svolta: { fra: [dove('semaforo', 'en el semáforo'), dove('esquina', 'en la esquina')] },
    vicino: { fra: [vicino('banco', 'del banco', 'Accanto alla banca'),
                    vicino('hospital', 'del hospital', 'Accanto all’ospedale'),
                    vicino('tienda', 'de la tienda', 'Accanto al negozio')] },
  },
  pagine: [
    [
      { es: 'Es domingo por la mañana. Laura y Tom están en la plaza con Pip.', forma: 'esta-en' },
      { es: 'En la plaza hay una mujer con un mapa muy grande.', forma: 'hay' },
      { chi: 'signora', es: 'Hola, niños. ¿Dónde está {el:posto}?', forma: 'esta-en' },
      { chi: 'signora', es: 'En mi mapa, {el:posto} está aquí, en la plaza.', forma: 'esta-en' },
      { es: 'En la plaza no hay {un:posto}: hay un estacionamiento.', forma: 'hay' },
    ],
    [
      { es: 'Tom mira el mapa.', forma: 'presente-ar' },
      { id: 'viejo', chi: 'Tom', es: '¡Este mapa es muy viejo! Ahora aquí hay un estacionamiento.', forma: 'este-esta' },
      { chi: 'Laura', es: '{El:posto} {nuevo~posto} no está en la plaza.', forma: 'esta-en' },
      { chi: 'Laura', es: 'Cruza la calle y sigue recto. Luego gira a la {lato} {svolta}.', forma: 'direcciones' },
      { chi: 'Laura', es: '{El:posto} está al lado {vicino.de}.', forma: 'direcciones' },
      { chi: 'signora', es: '¿Recto y luego a la {lato}?', forma: 'direcciones' },
      { es: 'Laura, Tom y Pip van con la mujer.', forma: 'voy-al' },
    ],
    [
      { es: 'Al lado {vicino.de} hay {un:posto} {nuevo~posto} y muy grande.', forma: 'hay' },
      { chi: 'signora', es: '¡Muchas gracias, niños!', forma: 'saludos' },
      { es: 'El lunes, en la escuela, hay una maestra nueva.', forma: 'hay' },
      { id: 'maestra', chi: 'Tom', es: '¡Laura, mira! ¡La maestra nueva es la mujer del mapa!', forma: 'de' },
      { chi: 'maestra', es: 'Hola, Laura. Hola, Tom. Hoy no tengo mi mapa viejo.', forma: 'tener' },
      { es: 'La maestra dibuja un mapa nuevo en la pizarra, con la plaza y {el:posto}.', forma: 'presente-ar' },
    ],
  ],
  domande: [
    { testo: v => `Perché la signora non trova ${v.posto.il}?`, risposta: () => 'Perché la sua mappa è vecchia',
      anche: ['Perché è domenica', 'Perché gira a destra invece che a sinistra', 'Perché Pip le prende la mappa'] },
    { tipo: 'frase', testo: 'Tocca la frase che dice chi è davvero la signora.', frase: 'maestra' },
    { tipo: 'ordine', fatti: [v => `Una signora cerca ${v.posto.il} in piazza`, 'Tom guarda la mappa: è vecchia',
      'Laura e Tom accompagnano la signora', 'A scuola arriva una maestra nuova'] },
    { tipo: 'chi', frase: 'viejo' },
    { testo: 'La signora ha una mappa nuova?', tipo: 'vf', etichette: ['Sì', 'No'], vero: () => false },
  ],
}
