/* ═════ LA SALA DEL TESORO ═════
   Mosaico e marmo. Le tessere sono quattro tinte, non dieci, e
   nessuna a piena gola: ci devono camminare sopra dei personaggi, non
   è una vetrata. Il motivo sta in una cornice lungo i muri e il resto
   è vuoto apposta — è il vuoto che fa sembrare prezioso il disegno. */
export const TESORO = {
  nome: 'La sala del tesoro',
  posa: 'mosaico', muratura: 'marmo',
  fondo: ['#6b5136', '#4f3c28'],
  chiazze: ['#c9a86a', '#5a4229'],
  lastra: ['#c9a03c', '#a8654a'],
  tessere: ['#e2d5b8', '#b06a54', '#dcb75e', '#8e9db4'],
  terra: '#8a6a45', sasso: '#b0a084', muschio: '#6f9a4a',
  erbaC: '#a8e08a', erbaS: '#5f9c53',
  muro: ['#efe6d2', '#bdae90'], giunto: '#8a7a5e',
  oro: '#e8c569',
  luce: '#ffe9a8', buio: 0.12,
  varianti: ['liscio', 'liscio', 'liscio', 'polvere', 'usura'],
  dettagli: [['monete', 3], ['crepe', 6.4]],
}
