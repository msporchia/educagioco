// Nella sesta isola, dopo «Ha detto ciao»: «Il mercato della nonna»,
// l'anello. Lo ha la signora della frutta: un bambino glielo ha portato, e
// ha capito di chi era dal cappello grande della nonna (non è scritto che
// l'abbia capito così: lo dice quello che ha detto). Formato in docs/lingue/libro.md.
import { FRUTTE, COLORI } from './serie/il-mercato-della-nonna.js'

export default {
  id: 'il-mercato-della-nonna-2',
  serie: 'il-mercato-della-nonna',
  puntata: 2,
  mondo: 'sesta',
  dopo: 'sesta-dijo',
  titolo: 'Il mercato della nonna: l’anello',
  variabili: {
    frutta: { da: 'cibi', fra: FRUTTE },
    colore: { da: 'colori', fra: COLORI },
  },
  pagine: [
    [
      { riassunto: true, es: 'Ayer la abuela, Laura y Leo compraron {frutta.pl} en el mercado. En casa, la abuela ' +
        'no encontró su anillo.', forma: 'pasado-reg' },
      { id: 'triste', es: 'Hoy es el cumpleaños de mamá, pero la abuela está triste.', forma: 'hoy-es' },
      { chi: 'nonna', es: 'Es el anillo del abuelo.', forma: 'de' },
      { es: 'Mientras mamá duerme, la abuela, Laura y Leo van al mercado.', forma: 'cuando' },
    ],
    [
      { es: 'En el mercado, Laura habla con la mujer de {los:frutta}.', forma: 'presente-ar' },
      { chi: 'Laura', es: 'Ayer mi abuela compró {frutta.pl} aquí. ¿Vio un anillo con una piedra {colore.f}?',
        forma: 'pasado-reg' },
      { chi: 'signora', es: '¡Sí! Ayer un niño me dio un anillo.', forma: 'pasado-irr' },
      { id: 'dijo', chi: 'signora', es: 'El niño me dijo: «Es de la abuela del sombrero grande».', forma: 'decir' },
      { chi: 'signora', es: '¡Aquí está!', forma: 'esta-en' },
      { es: 'La mujer le da el anillo a la abuela.', forma: 'presente-ar' },
    ],
    [
      { es: 'Es el anillo viejo, con su piedra {colore.f}.', forma: 'color-despues' },
      { chi: 'nonna', es: '¡Muchas gracias! ¿Quién es el niño?', forma: 'preguntas' },
      { id: 'vive', chi: 'signora', es: 'Vive al lado del mercado. ¡Allí está, con su perro!',
        forma: 'presente-er-ir' },
      { es: 'El niño es pequeño, y su perro es más grande que él.', forma: 'comparativos' },
      { chi: 'nonna', es: 'Gracias, niño. Esta tarde hay una fiesta en mi casa. ¿Quieres venir?',
        forma: 'quiero-puedo' },
      { chi: 'bambino', es: '¡Sí! Voy a ir con mi mamá.', forma: 'voy-a' },
      { es: 'La abuela ríe, y Laura y Leo también.', forma: 'presente-er-ir' },
    ],
  ],
  domande: [
    { testo: 'Nella puntata prima, che cosa ha perso la nonna?', risposta: () => 'Un anello',
      anche: ['Il cappello', 'Il portafoglio', 'Le chiavi di casa'] },
    { tipo: 'chi', frase: 'dijo' },
    { testo: 'Come ha capito il bambino di chi era l’anello?', risposta: () => 'Dal cappello grande della nonna',
      anche: ['Dal nome scritto nell’anello', 'Glielo ha detto Laura', 'Glielo ha detto il suo cane'] },
    { tipo: 'frase', testo: 'Dove vive il bambino?', frase: 'vive' },
    { testo: 'Perché per la nonna l’anello è così importante?', risposta: () => 'È un regalo del nonno',
      anche: ['Costa molto', 'È nuovo', 'È un regalo della mamma'] },
  ],
}
