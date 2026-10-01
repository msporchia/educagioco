// Nella sesta isola, dopo «Chi è più alto?»: il nonno segna sulla porta della
// cucina quanto sono alti Laura e Leo. Leo si mette un libro sotto i piedi;
// alla fine è più basso di Laura ma più veloce, e Pip ha il suo nome sotto
// tutti. Formato in docs/lingue/libro.md.
const eta = (laura, leo, itLeo) => ({ id: `${laura}-${leo}`, laura, leo, itLeo })
const ETA = [eta('diez', 'ocho', 'Otto'), eta('once', 'nueve', 'Nove'), eta('diez', 'nueve', 'Nove')]

export default {
  id: 'la-porta-del-nonno',
  mondo: 'sesta',
  dopo: 'sesta-mas',
  titolo: 'La porta del nonno',
  variabili: {
    eta: { fra: ETA },
    colore: { da: 'colori', fra: ['rojo', 'azul', 'verde', 'negro'] },
  },
  pagine: [
    [
      { es: 'Cuando Laura y Leo van a la casa de los abuelos, el abuelo escribe sus nombres en la puerta de la ' +
        'cocina.', forma: 'cuando' },
      { es: 'En la puerta hay muchos nombres.', forma: 'hay' },
      { chi: 'nonno', es: '¡Vamos a ver quién es más alto este año!', forma: 'voy-a' },
      { es: 'Laura va primero.', forma: 'voy-al' },
      { es: 'El abuelo escribe su nombre con un lápiz {colore}.', forma: 'presente-er-ir' },
      { chi: 'nonno', es: 'Laura, tienes {eta.laura} años, y eres muy alta.', forma: 'tener' },
    ],
    [
      { es: 'Ahora va Leo.', forma: 'voy-al' },
      { id: 'libro', es: 'Mientras el abuelo toma el lápiz, Leo pone un libro debajo de sus pies.', forma: 'cuando' },
      { chi: 'nonno', es: '¡Leo! ¡Eres más alto que Laura!', forma: 'comparativos' },
      { chi: 'Laura', es: '¿Más alto que yo? ¡Mira sus pies, abuelo!', forma: 'comparativos' },
      { es: 'El abuelo mira los pies de Leo, y ve el libro.', forma: 'presente-er-ir' },
      { es: 'El abuelo ríe mucho, y Leo también.', forma: 'presente-er-ir' },
    ],
    [
      { es: 'Leo pone el libro en la mesa.', forma: 'presente-er-ir' },
      { chi: 'nonno', es: 'Leo, tienes {eta.leo} años, y eres un poco más bajo que Laura.', forma: 'comparativos' },
      { chi: 'Leo', es: 'Laura siempre es más alta que yo.', forma: 'comparativos' },
      { id: 'rapido', chi: 'nonno', es: 'Sí, ella es más alta. Pero tú eres más rápido que ella.',
        forma: 'comparativos' },
      { es: '¿Y Pip? Pip está al lado de la puerta, y mira al abuelo.', forma: 'esta-en' },
      { es: 'El abuelo escribe el nombre de Pip debajo del nombre de Leo.', forma: 'de' },
      { chi: 'nonno', es: 'Pip es el más pequeño de la casa.', forma: 'comparativos' },
      { id: 'pip', chi: 'Leo', es: '¡Pero es más rápido que yo!', forma: 'comparativos' },
    ],
  ],
  domande: [
    { testo: 'Dove scrive i nomi il nonno?', risposta: () => 'Sulla porta della cucina',
      anche: ['Sul tavolo', 'In un libro', 'Sul muro del giardino'] },
    { tipo: 'frase', testo: 'Che cosa fa Leo per sembrare più alto?', frase: 'libro' },
    { testo: 'Fra Laura e Leo, chi è più alto davvero?', risposta: () => 'Laura',
      anche: ['Leo', 'Sono alti uguali'] },
    { testo: 'Quanti anni ha Leo?', risposta: v => v.eta.itLeo, anche: ['Sette', 'Dieci'] },
    { tipo: 'chi', frase: 'rapido' },
    { tipo: 'ordine', fatti: ['Il nonno ha scritto il nome di Laura', 'Leo ha messo un libro sotto i piedi',
                              'Il nonno ha visto il libro', 'Il nonno ha scritto il nome di Pip'] },
  ],
}
