/* ═════ IL CORTILE ═════
   La stanza all'aperto: erba, sole, mura di castello intorno. È
   l'unica senza buio e senza torce — e serve come metro di paragone
   per tutte le altre: se una stanza chiusa sembra cupa come questa,
   non è ancora abbastanza chiusa. */
export const CORTILE = {
  nome: 'Il cortile',
  posa: 'erba', muratura: 'pietra',
  fondo: ['#7ec066', '#5b9c50'],
  chiazze: ['#93cf74', '#4a8a45'],
  lastra: ['#7ec066', '#5b9c50'],
  terra: '#a8814f', sasso: '#a49a86', muschio: '#4f8f3f',
  erbaC: '#a8e08a', erbaS: '#48924a',
  muro: ['#d3c7ad', '#9c8e73'], giunto: '#6f6553',
  luce: '#fff3c4', buio: 0,
  varianti: ['liscio', 'liscio', 'usura', 'licheni', 'detriti'],
  dettagli: [['ciuffi', 0.65], ['fiori', 2.3], ['ciottoli', 2.9], ['foglie', 3.6]],
}
