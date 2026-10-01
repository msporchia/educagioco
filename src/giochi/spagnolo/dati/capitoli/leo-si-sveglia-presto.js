// In quarta, dopo «Mi alzo alle sette»: Leo si alza, si lava, si veste e
// corre in cucina per non far tardi dalla maestra. Ma in casa dormono tutti:
// è il fine settimana. Formato in docs/lingue/libro.md.
export default {
  id: 'leo-si-sveglia-presto',
  mondo: 'quarta',
  dopo: 'quarta-me-levanto',
  titolo: 'Leo si sveglia presto',
  variabili: {
    ora: { da: 'numeri', fra: ['siete', 'ocho'] },
    giorno: { da: 'giorni', fra: ['sábado', 'domingo'] },
    cibo: { da: 'cibi', fra: ['queso', 'chocolate'] },
    // Leo fa colazione da solo, o non ha tempo
    mangia: { fra: [true, false] },
  },
  pagine: [
    [
      { es: 'Son las {ora} de la mañana.', forma: 'hora' },
      { es: 'En el dormitorio, Leo se despierta y mira el reloj.', forma: 'reflexivos' },
      { id: 'tardi', chi: 'Leo', es: '¡Las {ora}! ¡Me levanto!', forma: 'reflexivos' },
      { es: 'Se levanta, se lava la cara y las manos y se viste.', forma: 'reflexivos' },
      { es: 'Después se peina en el baño. ¡Muy bien!', forma: 'reflexivos' },
    ],
    [
      { es: 'La cocina está vacía.', forma: 'ser-estar' },
      { es: 'No hay desayuno en la mesa, y mamá y papá no están.', forma: 'hay' },
      { chi: 'Leo', es: '¿Mamá? ¿Papá? ¿Dónde están?', forma: 'esta-en' },
      { es: 'Pip está en el sofá. Mira a Leo y no se levanta.', forma: 'reflexivos' },
      { se: v => v.mangia, es: 'Leo se sienta, come un poco de pan con {cibo} y bebe leche.', forma: 'cantidad' },
      { se: v => !v.mangia, es: 'Leo no come: ¡es tarde!', forma: 'presente-er-ir' },
      { es: 'Se pone el abrigo y la gorra.', forma: 'reflexivos' },
    ],
    [
      { es: 'Laura abre la puerta de su dormitorio. Tiene sueño.', forma: 'tiene' },
      { chi: 'Laura', es: 'Leo, ¿por qué tienes el abrigo?', forma: 'tener' },
      { id: 'maestra', chi: 'Leo', es: '¡Son las {ora}! ¡La maestra!', forma: 'hora' },
      { id: 'giorno', chi: 'Laura', es: 'Leo, hoy es {giorno}.', forma: 'hoy-es' },
      { es: 'Leo mira a Laura, mira el reloj y mira a Pip.', forma: 'presente-ar' },
      { es: 'Después se acuesta en el sofá, con Pip.', forma: 'reflexivos' },
    ],
  ],
  domande: [
    { testo: 'Perché in cucina non c’è nessuno?', risposta: v => `È ${v.giorno.it}: dormono ancora tutti`,
      anche: ['La mamma e il papà sono al lavoro', 'Sono andati a scuola', 'È notte fonda'] },
    { tipo: 'frase', testo: 'Da quale frase si capisce che Leo vuole andare a scuola?', frase: 'maestra' },
    { testo: 'Leo fa colazione.', tipo: 'vf', etichette: ['Sì', 'No'], vero: v => v.mangia },
    { tipo: 'ordine', fatti: ['Leo si sveglia', 'Leo si veste', 'Leo si mette il cappotto',
                              'Laura dice a Leo che giorno è'] },
  ],
}
