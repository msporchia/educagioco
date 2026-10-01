// In quarta, alla fine dell'isola (dopo «Che cosa stai facendo?»): Laura è
// malata a letto, e Leo le racconta dalla finestra che cosa sta facendo la
// gente. L'ultimo che arriva con una scatola è Tom. Formato in docs/lingue/libro.md.
const STRADA = [
  { id: 'bombero', es: 'Un bombero está lavando su camión rojo.', it: 'Un pompiere lava il camion' },
  { id: 'policia', es: 'Una policía está ayudando a un abuelo con su perro.', it: 'Una poliziotta aiuta un nonno' },
  { id: 'agricultor', es: 'Un agricultor está limpiando su tractor verde.', it: 'Un contadino pulisce il trattore' },
]
const CIELO = [
  { es: 'avión', it: 'Un aereo' }, { es: 'helicóptero', it: 'Un elicottero' },
]
// il regalo di Tom, e che cosa ci fanno alla fine
const REGALI = [
  { id: 'libro', es: 'un libro', it: 'Un libro', fine: 'Ahora Tom está leyendo el libro con Laura.' },
  { id: 'peluche', es: 'un peluche', it: 'Un peluche', fine: 'Ahora Laura está abrazando el peluche.' },
  { id: 'guitarra', es: 'una guitarra pequeña', it: 'Una chitarra',
    fine: 'Ahora Tom está tocando la guitarra y Laura está cantando.' },
]

export default {
  id: 'dalla-finestra',
  mondo: 'quarta',
  dopo: 'quarta-gerundio',
  titolo: 'Dalla finestra',
  variabili: {
    strada: { fra: STRADA },
    cielo: { fra: CIELO },
    regalo: { fra: REGALI },
    giorno: { da: 'giorni', fra: ['lunes', 'martes', 'jueves'] },
  },
  pagine: [
    [
      { es: 'Es {giorno} y llueve.', forma: 'hace' },
      { id: 'malata', es: 'Laura está enferma: está en la cama y tiene frío.', forma: 'ser-estar' },
      { es: 'Leo está en el dormitorio, cerca de la ventana.', forma: 'esta-en' },
      { chi: 'Laura', es: 'Leo, ¿qué estás mirando?', forma: 'gerundio' },
      { chi: 'Leo', es: 'Estoy mirando por la ventana. ¡Mira, Laura!', forma: 'gerundio' },
    ],
    [
      { id: 'strada', chi: 'Leo', es: '{strada.es}', forma: 'gerundio' },
      { chi: 'Leo', es: 'Y en el cielo hay {un:cielo}.', forma: 'hay' },
      { chi: 'Laura', es: '¿Y ahora? ¿Qué estás mirando?', forma: 'gerundio' },
      { id: 'chico', chi: 'Leo', es: 'Ahora un chico está caminando con una caja grande.', forma: 'gerundio' },
      { chi: 'Leo', es: 'Está mirando la ventana. ¡Ahora está en el jardín!', forma: 'gerundio' },
    ],
    [
      { es: 'Mamá abre la puerta. Es Tom, con la caja grande.', forma: 'presente-er-ir' },
      { chi: 'Tom', es: '¡Hola, Laura! ¿Estás enferma? ¡Es un regalo!', forma: 'ser-estar' },
      { es: 'En la caja hay {regalo.es} y algunas galletas.', forma: 'cantidad' },
      { id: 'contenta', chi: 'Laura', es: '¡Gracias, Tom! ¡Ahora estoy muy contenta!', forma: 'ser-estar' },
      { es: '{regalo.fine}', forma: 'gerundio' },
      { es: 'Y Pip está comiendo las galletas debajo de la cama.', forma: 'gerundio' },
    ],
  ],
  domande: [
    { testo: 'Chi è il ragazzo con la scatola grande?', risposta: () => 'Tom',
      anche: ['Il papà', 'Un pompiere', 'Il nonno'] },
    { tipo: 'frase', testo: 'Da quale frase si capisce che Laura non può uscire a giocare?',
      frase: 'malata' },
    { tipo: 'chi', frase: 'contenta' },
    { tipo: 'ordine', fatti: [v => `${v.strada.it}`, 'Un ragazzo arriva con una scatola',
                              'La mamma apre la porta', 'Laura ringrazia Tom'] },
  ],
}
