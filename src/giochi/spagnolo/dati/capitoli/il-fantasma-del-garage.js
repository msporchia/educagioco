// In terza, dopo «Chi? Che cosa? Come?»: Leo sente un fantasma in garage,
// e in una scatola c'è un gatto coi gattini. Quanti gatti in tutto e
// perché si chiama Fantasma non è scritto. Formato in docs/lingue/libro.md.
const IN_TUTTO = ['', '', '', 'Tre', 'Quattro', 'Cinque', 'Sei']

export default {
  id: 'il-fantasma-del-garage',
  mondo: 'terza',
  dopo: 'terza-quien',
  titolo: 'Il fantasma del garage',
  variabili: {
    colore: { da: 'colori', fra: ['negro', 'blanco', 'marrón', 'naranja'] },
    numero: { da: 'numeri', fra: ['dos', 'tres', 'cuatro', 'cinco'] },
    pip: { fra: [true, false] },
  },
  pagine: [
    [
      { es: 'Leo y Tom están en la cocina.', forma: 'esta-en' },
      { chi: 'Leo', es: '¡Mamá! ¡Hay un fantasma en el garaje!', forma: 'hay' },
      { chi: 'mamma', es: '¿Un fantasma?', forma: 'hay' },
      { id: 'no-hay', chi: 'mamma', es: 'No hay fantasmas, Leo.', forma: 'hay' },
      { chi: 'Tom', es: '¿Y qué hay en el garaje?', forma: 'preguntas' },
    ],
    [
      { es: 'Leo, Tom y la mamá de Leo están en el garaje.', forma: 'esta-en' },
      { es: 'En el garaje hay un auto, una mesa vieja y una caja grande.', forma: 'hay' },
      { se: v => v.pip, es: 'Pip está detrás de la caja.', forma: 'esta-en' },
      { se: v => !v.pip, es: 'La caja está debajo de la mesa.', forma: 'esta-en' },
      { chi: 'Tom', es: '¿Quién está en la caja?', forma: 'preguntas' },
    ],
    [
      { es: '¡En la caja hay un gato {colore} y {numero} gatos pequeños!', forma: 'hay' },
      { chi: 'Leo', es: '¡Hay cien gatos!', forma: 'hay' },
      { chi: 'Tom', es: 'No hay cien, Leo. ¡Y no es un fantasma, es un gato!', forma: 'hay' },
      { chi: 'Leo', es: 'Mamá, el gato tiene hambre.', forma: 'tiene' },
      { chi: 'mamma', es: 'Aquí hay leche.', forma: 'hay' },
      { chi: 'Leo', es: 'Su nombre es Fantasma.', forma: 'mi-tu-su' },
    ],
  ],
  domande: [
    { testo: 'Che cosa crede Leo che ci sia in garage?', risposta: () => 'Un fantasma',
      anche: ['Un topo', 'Un cane', 'Una mucca'] },
    { tipo: 'chi', frase: 'no-hay' },
    { testo: 'Quanti gatti ci sono nella scatola, in tutto?', risposta: v => IN_TUTTO[v.numero.n + 1] },
    { testo: 'Pip è vicino alla scatola?', tipo: 'vf', etichette: ['Sì', 'No'],
      vero: v => (v.pip ? true : null) },
    { testo: 'Perché Leo chiama il gatto «Fantasma»?', risposta: () => 'Perché credeva che fosse un fantasma',
      anche: ['Perché è molto piccolo', 'Perché ha fame', 'Perché è in cucina'] },
  ],
}
