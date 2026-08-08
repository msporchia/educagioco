/* ═════ LA GROTTA ═════
   L'opposto del corridoio: là ogni pietra è stata tagliata da
   qualcuno, qui non c'è una linea dritta. Stessa scala di sempre (i
   massi valgono poco più di un corso di muratura), ma **niente
   corsi**: la parete legge «scavata» invece che «costruita».

   Tinte terrose e strette, e la luce delle torce è l'unica cosa calda:
   in una grotta si vede quello che il fuoco raggiunge, e il resto si
   indovina. I funghi pallidi sono l'unico dettaglio chiaro. */
export const GROTTA = {
  nome: 'La grotta',
  posa: 'roccia', muratura: 'roccia',
  fondo: ['#2a2620', '#1a1714'],
  chiazze: ['#584f42', '#141210'],
  lastra: ['#544b3f', '#413931'],           // il pavimento: due tinte vicine
  terra: '#4a4034', sasso: '#6b6153', muschio: '#4a6b4a',
  erbaC: '#5f8a4a', erbaS: '#3f6b3a',
  muro: ['#6f6353', '#453c31'], giunto: '#171310',
  fungo: '#8fb8c9',
  luce: '#ffbf7a', fiamma: '#ff9a3c', buio: 0.46, torce: true,
  varianti: ['liscio', 'liscio', 'usura', 'detriti', 'licheni', 'ombra'],
  dettagli: [['ciottoli', 2.3], ['funghi', 3.6], ['crepe', 4.3], ['muschio', 5]],
}
