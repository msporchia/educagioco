// Nella sesta isola, dopo «Sono andato al castello»: la prima puntata di «Il
// mercato della nonna». A luglio Laura, Leo e la mamma volano nella città
// alta della nonna; per il compleanno della mamma si fa una torta, e dopo il
// mercato l'anello del nonno non c'è più. Formato in docs/lingue/libro.md.
import { FRUTTE, COLORI, PIETRA, MEZZI } from './serie/il-mercato-della-nonna.js'

export default {
  id: 'il-mercato-della-nonna',
  serie: 'il-mercato-della-nonna',
  puntata: 1,
  mondo: 'sesta',
  dopo: 'sesta-fui',
  titolo: 'Il mercato della nonna',
  variabili: {
    frutta: { da: 'cibi', fra: FRUTTE },
    colore: { da: 'colori', fra: COLORI },
    mezzo: { da: 'mezzi', fra: MEZZI },
  },
  pagine: [
    [
      { es: 'En julio Laura, Leo y mamá fueron en avión a la ciudad de la abuela.', forma: 'pasado-irr' },
      { es: 'Es una ciudad muy alta, cerca de las nubes.', forma: 'ser' },
      { es: 'En julio allí hace frío: es invierno.', forma: 'hace' },
      { es: 'La abuela estuvo en el aeropuerto con su sombrero grande, y fueron a su casa en {mezzo}.',
        forma: 'ayer' },
      { chi: 'nonna', es: '¡Hola, Laura! ¡Hola, Leo!', forma: 'saludos' },
      { es: 'La abuela tiene un anillo viejo con una piedra {colore.f}: es un regalo del abuelo.', forma: 'tiene' },
    ],
    [
      { es: 'Mamá está muy cansada, y duerme.', forma: 'ser-estar' },
      { chi: 'nonna', es: 'Mañana es el cumpleaños de su mamá.', forma: 'de' },
      { id: 'torta', chi: 'nonna', es: '¡Vamos a hacer una torta de {frutta}!', forma: 'voy-a' },
      { es: 'Por la tarde la abuela, Laura y Leo fueron al mercado.', forma: 'pasado-irr' },
      { es: 'En el mercado hay mucha gente.', forma: 'hay' },
      { es: 'La abuela compró seis {frutta.pl}, leche y huevos.', forma: 'pasado-reg' },
      { chi: 'signora', es: 'Son quince bolivianos.', forma: 'cuanto' },
      { id: 'visto', es: 'Cuando la abuela tomó el dinero, Laura vio su anillo.', forma: 'cuando' },
      { es: 'Leo llevó {los:frutta}, y Laura llevó la leche.', forma: 'pasado-reg' },
    ],
    [
      { es: 'En casa, la abuela no encontró su anillo.', forma: 'pasado-reg' },
      { chi: 'nonna', es: '¿Dónde está mi anillo?', forma: 'esta-en' },
      { es: 'Laura miró en la cocina, y Leo miró debajo del sofá.', forma: 'pasado-reg' },
      { es: 'Pero no encontraron el anillo.', forma: 'pasado-reg' },
      { id: 'mercado', chi: 'Laura', es: 'Abuela, ¡tu anillo está en el mercado!', forma: 'esta-en' },
      { chi: 'nonna', es: 'Ahora es de noche. Mañana vamos a ir al mercado.', forma: 'voy-a' },
      { es: 'En la noche la abuela no durmió mucho.', forma: 'pasado-irr' },
    ],
  ],
  domande: [
    { testo: 'Come sono andati dall’aeroporto a casa della nonna?', risposta: v => v.mezzo.in,
      anche: ['A piedi', 'In bici'] },
    { testo: 'Perché la nonna vuole fare una torta?', risposta: () => 'Domani è il compleanno della mamma',
      anche: ['Domani è il compleanno di Leo', 'Laura ha fame', 'Al mercato c’è molta gente'] },
    { tipo: 'ordine', fatti: ['Sono arrivati in aereo', 'Sono andati al mercato',
                              v => `La nonna ha comprato ${v.frutta.ilPl}`,
                              'La nonna non ha trovato l’anello'] },
    { tipo: 'frase', testo: 'Perché Laura pensa che l’anello sia al mercato?', frase: 'visto' },
    { testo: 'Di che colore è la pietra dell’anello?', risposta: v => PIETRA[v.colore.es] },
  ],
}
