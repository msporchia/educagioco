// Nella sesta isola, dopo «Ieri ero al parco»: la mamma non trova l'orologio,
// e ognuno dice dov'era ieri. Era in una scarpa: ci ha giocato il bebè della
// zia, che nessuno nomina alla fine (lo si capisce da chi dice «yo no fui»).
// Formato in docs/lingue/libro.md, segnaposto in docs/lingue/spagnolo-motore.md.
const dove = (es, nel) => ({ es, nel })
const DOVE = [dove('zapato', 'In una scarpa'), dove('guante', 'In un guanto'), dove('calcetín', 'In un calzino')]

export default {
  id: 'l-orologio-della-mamma',
  mondo: 'sesta',
  dopo: 'sesta-ayer',
  titolo: 'L’orologio della mamma',
  variabili: {
    laura: { da: 'luoghi', fra: ['parque', 'cine', 'biblioteca', 'museo'] },
    leo: { da: 'luoghi', fra: ['parque', 'cine', 'zoológico', 'museo'] },
    dove: { fra: DOVE },
  },
  vincoli: [v => v.laura.es !== v.leo.es],
  pagine: [
    [
      { es: 'Es lunes por la mañana, y mamá va a salir de casa.', forma: 'voy-a' },
      { chi: 'mamma', es: '¿Dónde está mi reloj?', forma: 'esta-en' },
      { es: 'El reloj de mamá no está en la mesa, y no está en el baño.', forma: 'de' },
      { chi: 'mamma', es: 'Ayer estuvo aquí, en la mesa.', forma: 'ayer' },
      { id: 'quien', chi: 'mamma', es: '¿Quién estuvo en casa ayer por la tarde?', forma: 'ayer' },
    ],
    [
      { chi: 'Laura', es: 'Yo no: ayer por la tarde estuve en {el:laura} con Tom.', forma: 'ayer' },
      { id: 'leo', chi: 'Leo', es: 'Y yo estuve en {el:leo} con el abuelo.', forma: 'ayer' },
      { chi: 'papa', es: 'Yo estuve en casa con la tía. La tía vino con su bebé.', forma: 'pasado-irr' },
      { id: 'gioco', chi: 'papa', es: 'La tía y yo estuvimos en la cocina, y el bebé jugó en el dormitorio.',
        forma: 'pasado-reg' },
      { es: 'Mamá fue al dormitorio, pero allí no vio ningún reloj.', forma: 'pasado-irr' },
    ],
    [
      { es: 'Mamá está triste, y se pone {los:dove}.', forma: 'reflexivos' },
      { es: '¡Pero su reloj está en {un:dove}!', forma: 'esta-en' },
      { chi: 'mamma', es: '¡Mi reloj! ¿Quién puso mi reloj en mi {dove}?', forma: 'pasado-irr' },
      { id: 'papa', chi: 'papa', es: '¡Yo no fui!', forma: 'ayer' },
      { chi: 'Leo', es: '¡Y yo no fui! Yo estuve con el abuelo.', forma: 'ayer' },
      { es: 'Mamá mira el reloj, y después mira a papá.', forma: 'presente-ar' },
      { es: 'Ahora mamá está muy contenta, y sale de casa con su reloj.', forma: 'ser-estar' },
    ],
  ],
  domande: [
    { testo: 'Dov’era Laura ieri pomeriggio?', risposta: v => v.laura.al },
    { testo: 'Chi è venuto a casa ieri?', risposta: () => 'La zia con il suo bebè',
      anche: ['La nonna', 'Tom con il suo cane', 'La maestra'] },
    { tipo: 'frase', testo: 'Dove ha giocato il bebè?', frase: 'gioco' },
    { testo: 'Dov’era l’orologio?', risposta: v => v.dove.nel },
    { testo: 'Chi ha messo l’orologio lì?', risposta: () => 'Il bebè della zia',
      anche: ['Il papà', 'Leo', 'Laura'] },
  ],
}
