// In quarta, dopo «Lei mangia, lui vive»: la mamma lavora fino a sera, e il
// papà coi bambini le cucina la cena con quel poco che c'è. Lei però torna
// con una sorpresa sua. Formato in docs/lingue/libro.md.
const LAVORI = [
  { es: 'enfermera', it: 'Infermiera' }, { es: 'maestra', it: 'Maestra' }, { es: 'policía', it: 'Poliziotta' },
  { es: 'piloto', it: 'Pilota' }, { es: 'cantante', it: 'Cantante' },
]
// che cosa porta la mamma nella scatola
const SORPRESE = [{ es: 'pizza', it: 'la pizza' }, { es: 'torta', it: 'la torta' }]

export default {
  id: 'due-cene',
  mondo: 'quarta',
  dopo: 'quarta-come',
  titolo: 'Due cene',
  nuove: ['trabajar'],
  variabili: {
    lavoro: { fra: LAVORI },
    giorno: { da: 'giorni', fra: ['lunes', 'miércoles', 'viernes'] },
    sorpresa: { fra: SORPRESE },
    // chi apparecchia: Leo o Laura
    tavola: { fra: ['Laura', 'Leo'] },
  },
  pagine: [
    [
      { es: 'Es {giorno}. Son las seis de la tarde.', forma: 'hora' },
      { es: 'Mamá es {lavoro}. Hoy trabaja mucho y come con la familia a las ocho.', forma: 'presente-er-ir' },
      { chi: 'papa', es: 'Mamá está muy cansada. ¿Cocinamos la cena nosotros?', forma: 'presente-ar' },
      { chi: 'Leo', es: '¡Sí! ¡Una torta de chocolate!', forma: 'es-un' },
      { id: 'cena', chi: 'Laura', es: 'No, Leo. Mamá tiene hambre, y una torta no es una cena.', forma: 'tiene' },
    ],
    [
      { es: 'En la cocina hay un poco de arroz, algunos huevos y tres tomates.', forma: 'cantidad' },
      { es: 'No hay leche y no hay pan.', forma: 'hay' },
      { chi: 'Laura', es: '¡Arroz con huevo y tomate!', forma: 'cantidad' },
      { es: 'Papá cocina el arroz y Laura lava los tomates.', forma: 'presente-ar' },
      { se: v => v.tavola === 'Leo', es: 'Leo limpia la mesa y Pip mira los huevos.', forma: 'presente-ar' },
      { se: v => v.tavola === 'Laura', es: 'Después Laura limpia la mesa. Leo y Pip miran los huevos.',
        forma: 'presente-ar' },
    ],
    [
      { es: 'Mamá abre la puerta a las ocho.', forma: 'presente-er-ir' },
      { chi: 'mamma', es: '¡Hola! ¡En esta caja hay {un:sorpresa}!', forma: 'este-esta' },
      { es: 'Y en la mesa hay arroz con huevo y tomate.', forma: 'hay' },
      { id: 'tua', chi: 'Leo', es: '¡Es tu cena, mamá!', forma: 'mi-tu-su' },
      { id: 'due', chi: 'mamma', es: '¡Gracias! ¡Y ahora hay dos cenas!', forma: 'hay' },
      { es: 'Comen el arroz y, después, {el:sorpresa}. Pip también come un poco de arroz.', forma: 'presente-er-ir' },
    ],
  ],
  domande: [
    { testo: 'Perché il papà e i bambini cucinano la cena?', risposta: () => 'La mamma lavora tanto ed è stanca',
      anche: ['Il papà ha fame', 'È il compleanno della mamma', 'In cucina non c’è niente'] },
    { tipo: 'frase', testo: 'Perché Laura non vuole la torta di Leo?', frase: 'cena' },
    { tipo: 'chi', frase: 'due' },
    { testo: 'Che cosa mangiano, alla fine?', risposta: v => `Il riso, e poi ${v.sorpresa.it}`,
      anche: ['Solo il riso', 'Il pane con il latte'] },
  ],
}
