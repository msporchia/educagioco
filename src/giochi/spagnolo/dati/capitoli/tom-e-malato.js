// In terza, alla 🏁: Tom è malato, Laura e Leo vanno a trovarlo e Pip li
// segue di nascosto. Ser per com'è Tom, estar per come sta. Formato in docs/lingue/libro.md.
const posto = (es, it) => ({ es, it })

export default {
  id: 'tom-e-malato',
  mondo: 'terza',
  titolo: 'Tom è malato',
  variabili: {
    giorno: { da: 'giorni', fra: ['lunes', 'martes', 'miércoles', 'jueves'] },
    tempo: { fra: [{ es: 'hace frío', freddo: true }, { es: 'llueve' }, { es: 'hace viento' }] },
    regalo: { da: 'giocattoli', fra: ['pelota', 'cometa', 'rompecabezas', 'auto'] },
    colore: { da: 'colori', fra: ['rojo', 'azul', 'verde', 'amarillo'] },
    posto: { fra: [posto('debajo de la cama', 'sotto il letto'), posto('detrás de la puerta', 'dietro la porta'),
                   posto('detrás de la silla', 'dietro la sedia')] },
  },
  pagine: [
    [
      { es: 'Hoy es {giorno} y {tempo.es}.', forma: 'hoy-es' },
      { es: 'Laura y Leo están en la casa de Tom.', forma: 'esta-en' },
      { chi: 'Laura', es: '¡Hola, Tom! ¿Cómo estás?', forma: 'ser-estar' },
      { chi: 'Tom', es: 'Hola. Estoy enfermo.', forma: 'ser-estar' },
      { se: v => v.tempo.freddo, chi: 'Laura', es: '¿Tienes frío, Tom?', forma: 'tener' },
      { se: v => v.tempo.freddo, chi: 'Tom', es: 'Sí, tengo mucho frío.', forma: 'tener' },
    ],
    [
      { es: 'Tom es alto y fuerte, y hoy está en la cama.', forma: 'ser-estar' },
      { es: 'Está triste y está muy cansado.', forma: 'ser-estar' },
      { chi: 'Leo', es: 'Tom, este es un regalo. ¡Es {un:regalo} {colore~regalo}!', forma: 'este-esta' },
      { chi: 'Tom', es: '¡Gracias, amigos! Me gusta mucho.', forma: 'me-gusta' },
      { id: 'pip', chi: 'Tom', es: '¿Y Pip? ¿Dónde está Pip?', forma: 'esta-en' },
      { chi: 'Laura', es: 'Pip está en casa.', forma: 'esta-en' },
    ],
    [
      { es: '¡Pip no está en casa! Está aquí, {posto.es}.', forma: 'esta-en' },
      { es: 'Pip está sobre la cama, y Tom no está triste.', forma: 'ser-estar' },
      { chi: 'Tom', es: '¡Hola, Pip! ¡Estoy muy contento!', forma: 'ser-estar' },
    ],
  ],
  domande: [
    { testo: 'Perché Tom è a letto?', risposta: () => 'Perché è malato',
      anche: ['Perché ha sonno', 'Perché è notte', 'Perché è sabato'] },
    { tipo: 'chi', frase: 'pip' },
    { testo: 'Laura sa che Pip è venuto con loro?', tipo: 'vf', etichette: ['Sì', 'No'], vero: () => false },
    { tipo: 'ordine', fatti: [
      'Laura chiede a Tom come sta',
      'Leo dà un regalo a Tom',
      v => `Pip salta fuori da ${v.posto.it}`,
      'Tom è contento',
    ] },
    { testo: 'Perché alla fine Tom è contento?', risposta: () => 'Perché c’è anche Pip',
      anche: ['Perché non è più malato', 'Perché fa caldo', 'Perché è sabato'] },
  ],
}
