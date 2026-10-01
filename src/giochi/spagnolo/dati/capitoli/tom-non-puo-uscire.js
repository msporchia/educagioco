// In quinta, dopo «Voglio, posso»: Leo vuole giocare a basket con Tom, ma
// Tom è malato e non può uscire. Leo fa di una scatola il canestro, e si
// gioca a letto. Alla fine vuole giocare anche il dottore, o scappa Pip con
// la palla. Formato in docs/lingue/libro.md.
const fine = (id, it) => ({ id, it })

export default {
  id: 'tom-non-puo-uscire',
  mondo: 'quinta',
  dopo: 'quinta-quiero',
  titolo: 'Tom non può uscire',
  variabili: {
    colore: { da: 'colori', fra: ['rojo', 'amarillo', 'azul'] },
    fine: { fra: [fine('dottore', 'Anche il dottore vuole giocare'), fine('pip', 'Pip scappa con la palla')] },
  },
  pagine: [
    [
      { es: 'Es sábado y hace sol.', forma: 'hace' },
      { chi: 'Leo', es: 'Mamá, ¿puedo ir al parque? Quiero jugar al básquet con Tom.', forma: 'quiero-puedo' },
      { chi: 'mamma', es: 'Sí, puedes ir con Laura y Pip.', forma: 'quiero-puedo' },
      { es: 'Laura, Leo y Pip van a la casa de Tom.', forma: 'de' },
      { es: 'En la puerta está el doctor.', forma: 'esta-en' },
      { id: 'enfermo', chi: 'dottore', es: 'Hola, niños. Tom está enfermo: hoy no puede salir.', forma: 'quiero-puedo' },
    ],
    [
      { es: 'Tom está en su dormitorio, en la cama.', forma: 'esta-en' },
      { es: 'Tom mira por la ventana y está muy triste.', forma: 'ser-estar' },
      { chi: 'Tom', es: 'Quiero jugar al básquet. ¡No puedo salir!', forma: 'quiero-puedo' },
      { chi: 'Leo', es: 'Laura, ¿dónde hay una caja grande?', forma: 'hay' },
      { chi: 'Laura', es: '¿Una caja? ¿Qué quieres hacer?', forma: 'quiero-puedo' },
      { chi: 'Leo', es: '¡Es un juego nuevo!', forma: 'es-un' },
    ],
    [
      { es: 'En la cocina de Tom hay una caja {colore.f} muy grande.', forma: 'hay' },
      { es: 'La caja está sobre una silla, al lado de la cama.', forma: 'esta-en' },
      { id: 'canasta', chi: 'Leo', es: 'Tom, ¡esta caja es la canasta!', forma: 'este-esta' },
      { es: 'Tom juega al básquet en la cama con la pelota de Leo.', forma: 'de' },
      { chi: 'Tom', es: '¡Ahora sí puedo jugar!', forma: 'quiero-puedo' },
      { se: v => v.fine.id === 'dottore', chi: 'dottore', es: '¿Y yo? ¿Puedo jugar también?', forma: 'quiero-puedo' },
      { se: v => v.fine.id === 'pip', es: 'Pip quiere jugar también: ¡sale por la puerta con la pelota!',
        forma: 'quiero-puedo' },
    ],
  ],
  domande: [
    { testo: 'Perché Tom non va al parco?', risposta: () => 'Perché è malato',
      anche: ['Perché piove', 'Perché non ha la palla', 'Perché è arrabbiato con Leo'] },
    { tipo: 'frase', testo: 'Tocca la frase che dice a che cosa serve la scatola.', frase: 'canasta' },
    { tipo: 'ordine', fatti: ['Leo vuole giocare a basket al parco', 'Il dottore dice che Tom non può uscire',
      'Leo cerca una scatola grande', v => v.fine.it] },
    { tipo: 'chi', frase: 'enfermo' },
    { testo: 'Tom gioca a basket al parco?', tipo: 'vf', etichette: ['Sì', 'No'], vero: () => false },
  ],
}
