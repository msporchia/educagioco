// In seconda, verso la 🏁 (dopo «Lei ha…»): Leo e Laura dalla nonna, dove
// fa freddo. Tre pagine, tre domande; anni, freddo, fame e sete si «hanno»
// (tengo frío, tengo hambre). Formato in docs/lingue/libro.md.
export default {
  id: 'la-sciarpa-della-nonna',
  mondo: 'seconda',
  dopo: 'seconda-tiene',
  titolo: 'La sciarpa della nonna',
  variabili: {
    anniLeo: { da: 'numeri', fra: ['cinco', 'seis', 'siete', 'ocho'] },
    anniLaura: { da: 'numeri', fra: ['seis', 'siete', 'ocho', 'nueve'] },
    quanti: { da: 'numeri', fra: ['tres', 'cuatro', 'cinco', 'diez'] },
    animale: { da: 'animali', fra: ['vaca', 'caballo', 'cerdo'] },
    // `este`: il dimostrativo in testa alla frase
    capo: { fra: [
      { es: 'bufanda', il: 'la sciarpa', este: 'Esta' },
      { es: 'gorra', il: 'il berretto', este: 'Esta' },
      { es: 'abrigo', il: 'il cappotto', este: 'Este' },
    ] },
    // che cosa ha Laura, e che cosa le dà la nonna
    ha: { fra: [
      { es: 'hambre', da: 'La zuppa' },
      { es: 'sed', da: 'Il latte' },
      { es: 'sueño', da: 'Niente: le dice buonanotte' },
    ] },
  },
  vincoli: [v => v.anniLeo.n !== v.anniLaura.n],
  pagine: [
    [
      { chi: 'Leo', es: 'Hola, soy Leo y tengo {anniLeo} años.', forma: 'tener' },
      { chi: 'Leo', es: 'Mi hermana Laura tiene {anniLaura} años.', forma: 'tiene' },
      { chi: 'Leo', es: 'Mi abuela tiene {quanti} {animale.pl}.', forma: 'tiene' },
      { es: 'Pip tiene miedo. ¡{Los:animale} son muy grandes!', forma: 'tiene' },
    ],
    [
      { chi: 'nonna', es: '¿Tienes frío, Leo? Tienes la nariz roja.', forma: 'tener' },
      { chi: 'Leo', es: 'Sí, abuela. Tengo mucho frío.', forma: 'tener' },
      { chi: 'nonna', es: '{capo.este} es mi {capo}. ¡Es un regalo!', forma: 'mi-tu-su' },
      { chi: 'Leo', es: '¡Gracias, abuela!', forma: 'saludos' },
    ],
    [
      { chi: 'Laura', es: 'Abuela, yo tengo {ha}.', forma: 'tener' },
      { se: v => v.ha.es === 'hambre', chi: 'nonna', es: '¿Te gusta la sopa, Laura?', forma: 'me-gusta' },
      { se: v => v.ha.es === 'sed', chi: 'nonna', es: '¿Te gusta la leche, Laura?', forma: 'me-gusta' },
      { se: v => v.ha.es !== 'sueño', chi: 'Laura', es: '¡Sí, me gusta mucho!', forma: 'me-gusta' },
      { se: v => v.ha.es === 'sueño', chi: 'nonna', es: '¡Buenas noches, Laura!', forma: 'saludos' },
      { es: 'Y Pip también tiene {ha}.', forma: 'tiene' },
    ],
  ],
  domande: [
    { testo: v => `Perché la nonna regala ${v.capo.il} a Leo?`, risposta: () => 'Perché Leo ha freddo',
      anche: ['Perché Leo ha fame', 'Perché è il compleanno di Leo', 'Perché Leo ha paura'] },
    { testo: 'Laura è più grande di Leo?', tipo: 'vf', etichette: ['Sì', 'No'],
      vero: v => v.anniLaura.n > v.anniLeo.n },
    { testo: 'Che cosa dà la nonna a Laura?', risposta: v => v.ha.da, anche: ['La sua sciarpa'] },
  ],
}
