// In terza, dopo «Dov'è?»: Leo cerca il berretto per la casa, e ce l'ha
// il nonno in giardino. Che il nonno abbia scambiato i cappelli non è
// scritto: lo dice il suo cappello in camera di Leo. Formato in docs/lingue/libro.md.
const posto = (es, it) => ({ es, it })
const POSTI = [
  posto('en la cocina', 'in cucina'),
  posto('debajo de la mesa', 'sotto il tavolo'),
  posto('en el baño', 'in bagno'),
  posto('detrás de la puerta', 'dietro la porta'),
  posto('en el garaje', 'in garage'),
  posto('sobre el sofá', 'sul divano'),
]

export default {
  id: 'il-berretto-di-leo',
  mondo: 'terza',
  dopo: 'terza-donde',
  titolo: 'Il berretto di Leo',
  variabili: {
    colore: { da: 'colori', fra: ['rojo', 'azul', 'verde', 'amarillo'] },
    primo: { fra: POSTI },
    secondo: { fra: POSTI },
  },
  vincoli: [v => v.primo !== v.secondo],
  pagine: [
    [
      { es: 'Leo y Laura están en la casa.', forma: 'esta-en' },
      { chi: 'Leo', es: '¡Mamá! ¿Dónde está mi gorra?', forma: 'esta-en' },
      { es: 'Es una gorra {colore.f}, y es muy bonita.', forma: 'color-despues' },
      { chi: 'mamma', es: '¿Está en tu dormitorio?', forma: 'esta-en' },
      { chi: 'Leo', es: 'No, no está en mi dormitorio.', forma: 'esta-en' },
    ],
    [
      { chi: 'Laura', es: '¿Está {primo.es}?', forma: 'esta-en' },
      { es: 'La gorra no está {primo.es}.', forma: 'esta-en' },
      { chi: 'mamma', es: '¿Y {secondo.es}?', forma: 'esta-en' },
      { es: 'No, la gorra no está {secondo.es}.', forma: 'esta-en' },
    ],
    [
      { es: 'Laura y Leo están en el jardín. El abuelo está en el jardín también.', forma: 'esta-en' },
      { es: '¡El abuelo tiene la gorra {colore.f} de Leo!', forma: 'tiene' },
      { chi: 'Leo', es: '¡Abuelo! ¡Es mi gorra!', forma: 'mi-tu-su' },
      { chi: 'nonno', es: '¿Tu gorra? ¡Es muy pequeña!', forma: 'mi-tu-su' },
      { chi: 'Leo', es: 'Sí, abuelo. Tu sombrero está en mi dormitorio, sobre la cama.', forma: 'esta-en' },
    ],
  ],
  domande: [
    { testo: 'Che cosa cerca Leo?', risposta: v => `Un berretto ${v.colore.it}` },
    { tipo: 'ordine', fatti: [
      'La mamma chiede se il berretto è in camera',
      v => `Laura chiede se è ${v.primo.it}`,
      v => `La mamma chiede se è ${v.secondo.it}`,
      'Leo trova il berretto in giardino',
    ] },
    { testo: 'Perché il nonno ha il berretto di Leo?', risposta: () => 'Ha sbagliato cappello',
      anche: ['Ha freddo alla testa', 'Leo gliel’ha regalato', 'Il suo cappello è in garage'] },
    { testo: 'Al nonno il berretto va bene?', tipo: 'vf', etichette: ['Sì', 'No'], vero: () => false },
  ],
}
