// In quinta, dopo «Vado al parco»: un giorno alla settimana il nonno esce
// alle dieci e non dice dove va. Laura e Leo lo seguono: va all'ospedale, a
// leggere o a suonare per i bambini. Formato in docs/lingue/libro.md.
const porta = (id, es, it, perche) => ({ id, es, it, perche })

export default {
  id: 'dove-va-il-nonno',
  mondo: 'quinta',
  dopo: 'quinta-voy',
  titolo: 'Dove va il nonno?',
  variabili: {
    giorno: { da: 'giorni', fra: ['martes', 'jueves', 'sábado'] },
    porta: { fra: [porta('libro', 'libro', 'un libro', 'Per leggere una storia ai bambini'),
                   porta('guitarra', 'guitarra', 'una chitarra', 'Per suonare la chitarra ai bambini')] },
    // al + un posto maschile: «al parque» (vedi docs/lingue/spagnolo-motore.md)
    ipotesi: { da: 'luoghi', fra: ['parque', 'cine', 'museo', 'zoológico'] },
  },
  pagine: [
    [
      { es: 'Es {giorno} y son las diez de la mañana.', forma: 'hora' },
      { es: 'El abuelo está en la puerta con {un:porta} y una gorra.', forma: 'esta-en' },
      { chi: 'Leo', es: 'Abuelo, ¿adónde vas?', forma: 'voy-al' },
      { chi: 'nonno', es: '¡Adiós! ¡Hasta la una!', forma: 'saludos' },
      { chi: 'Laura', es: 'Los {giorno.pl} el abuelo nunca está en casa. ¿Adónde va?', forma: 'voy-al' },
    ],
    [
      { es: 'Laura y Leo miran por la ventana.', forma: 'presente-ar' },
      { es: 'El abuelo va por la calle y luego gira a la derecha.', forma: 'direcciones' },
      { chi: 'Leo', es: '¿Va al {ipotesi}? ¡Vamos con Pip!', forma: 'voy-al' },
      { es: 'Laura, Leo y Pip van detrás del abuelo.', forma: 'voy-al' },
      { es: 'El abuelo no va al {ipotesi}: va al hospital.', forma: 'voy-al' },
    ],
    [
      { es: 'En el hospital hay muchos niños.', forma: 'hay' },
      { se: v => v.porta.id === 'libro', es: 'El abuelo lee un cuento a los niños.', forma: 'presente-er-ir' },
      { se: v => v.porta.id === 'guitarra', es: 'El abuelo toca la guitarra y los niños cantan.',
        forma: 'presente-ar' },
      { id: 'enfermo', chi: 'Leo', es: 'Abuelo, ¿estás enfermo?', forma: 'ser-estar' },
      { id: 'bien', chi: 'nonno', es: '¡No! Estoy muy bien. Los {giorno.pl} vengo aquí con mi {porta}.',
        forma: 'voy-al' },
      { chi: 'Laura', es: '¡Abuelo, los {giorno.pl} vamos también!', forma: 'voy-al' },
      { es: 'Ahora los {giorno.pl} el abuelo, Laura y Leo van al hospital, y Pip está en casa con la mamá.',
        forma: 'voy-al' },
    ],
  ],
  domande: [
    { testo: 'Perché il nonno va all’ospedale?', risposta: v => v.porta.perche,
      anche: ['Perché è malato', 'Per vedere il dottore'] },
    { tipo: 'frase', testo: 'Tocca la frase che dice che il nonno non è malato.', frase: 'bien' },
    { tipo: 'ordine', fatti: [v => `Il nonno esce con ${v.porta.it}`, 'Laura e Leo vanno dietro al nonno',
      v => (v.porta.id === 'libro' ? 'Il nonno legge una storia ai bambini' : 'Il nonno suona la chitarra ai bambini'),
      'Laura e Leo vogliono andare anche loro'] },
    { tipo: 'chi', frase: 'enfermo' },
    { testo: 'Pip va all’ospedale con il nonno?', tipo: 'vf', etichette: ['Sì', 'No'], vero: () => false },
  ],
}
