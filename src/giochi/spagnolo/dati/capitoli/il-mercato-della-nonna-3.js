// Nella sesta isola, dopo «Domani andrò»: l'ultima puntata di «Il mercato
// della nonna», la festa. Il bambino del mercato non vuole i soldi, vuole la
// torta; e la mamma, che ha dormito, dell'anello non sa niente (non è
// scritto: lo dice la sua domanda). Formato in docs/lingue/libro.md.
import { FRUTTE } from './serie/il-mercato-della-nonna.js'

export default {
  id: 'il-mercato-della-nonna-3',
  serie: 'il-mercato-della-nonna',
  puntata: 3,
  mondo: 'sesta',
  dopo: 'sesta-voy-a',
  titolo: 'Il mercato della nonna: la festa',
  variabili: {
    frutta: { da: 'cibi', fra: FRUTTE },
  },
  pagine: [
    [
      { riassunto: true, es: 'Esta mañana, en el mercado, la mujer de {los:frutta} le dio su anillo a la abuela: ' +
        'ayer un niño encontró el anillo.', forma: 'pasado-reg' },
      { es: 'Por la tarde, mientras mamá lee un libro, la abuela, Laura y Leo hacen la torta de {frutta}.', forma: 'cuando' },
      { chi: 'Laura', es: '¡Es más grande que la torta de mi cumpleaños!', forma: 'comparativos' },
      { es: 'A las cinco viene el niño del mercado, con su mamá y su perro.', forma: 'hora' },
    ],
    [
      { es: 'En la casa hay globos, regalos y una torta muy grande.', forma: 'hay' },
      { chi: 'Leo', es: '¡Feliz cumpleaños, mamá!', forma: 'saludos' },
      { es: 'Mamá está muy contenta.', forma: 'ser-estar' },
      { es: 'La abuela le da diez bolivianos al niño.', forma: 'presente-ar' },
      { id: 'dinero', chi: 'bambino', es: 'No, gracias. No quiero dinero.', forma: 'quiero-puedo' },
      { chi: 'bambino', es: '¿Puedo comer un poco de torta?', forma: 'quiero-puedo' },
      { es: 'La abuela ríe, y le da un plato de torta muy grande.', forma: 'presente-ar' },
    ],
    [
      { chi: 'Leo', es: '¿Cuántos años tienes?', forma: 'tener' },
      { chi: 'bambino', es: 'Tengo siete años.', forma: 'tener' },
      { id: 'alto', chi: 'Leo', es: '¡Eres más joven que yo, pero eres más alto!', forma: 'comparativos' },
      { chi: 'mamma', es: '¡Es la mejor torta del mundo!', forma: 'comparativos' },
      { chi: 'Leo', es: '¡Y este niño encontró el anillo de la abuela!', forma: 'pasado-reg' },
      { id: 'quale', chi: 'mamma', es: '¿Qué anillo?', forma: 'preguntas' },
      { es: 'Laura, Leo y la abuela ríen, y hablan del mercado, del anillo y del niño.',
        forma: 'de' },
      { id: 'diciembre', chi: 'nonna', es: 'En diciembre voy a ir a su casa en avión.', forma: 'voy-a' },
      { chi: 'nonna', es: '¡Y vamos a hacer una torta de {frutta} muy grande!', forma: 'voy-a' },
    ],
  ],
  domande: [
    { testo: 'Nella puntata prima, a chi ha dato l’anello il bambino?', risposta: () => 'Alla signora della frutta',
      anche: ['Alla nonna', 'Alla mamma', 'A Leo'] },
    { tipo: 'chi', frase: 'dinero' },
    { testo: 'Che cosa vuole il bambino al posto dei soldi?', risposta: () => 'Un po’ di torta',
      anche: ['Un regalo', 'Dieci boliviani', 'Un palloncino'] },
    { testo: 'La mamma sapeva dell’anello perso?', tipo: 'vf', etichette: ['Sì', 'No'], vero: () => false },
    { tipo: 'frase', testo: 'Quando andrà la nonna a casa di Laura e Leo?', frase: 'diciembre' },
    { tipo: 'ordine', fatti: ['Hanno fatto la torta', 'È arrivato il bambino del mercato',
                              'Il bambino non ha voluto i soldi', 'La mamma ha chiesto: «Quale anello?»'] },
  ],
}
