/* ═════ IL CORRIDOIO ═════
   La stanza di riferimento del dungeon: pietra fredda, buio a metà,
   torce arancioni ogni sei colonne. È qui che si è tarato tutto il
   resto — la scala della muratura, la distanza fra le torce, quanto
   può essere scuro il buio prima che un personaggio sparisca. */
export const CORRIDOIO = {
  nome: 'Il corridoio',
  posa: 'lastre', muratura: 'pietra',
  fondo: ['#212129', '#17171d'],
  chiazze: ['#4e4e5c', '#131318'],
  lastra: ['#5c5c6b', '#43434f'],
  terra: '#3a3a44', sasso: '#6a6a74', muschio: '#3f6b3a',
  erbaC: '#5f8a4a', erbaS: '#3f6b3a',
  muro: ['#726c62', '#4a4640'], giunto: '#25231f',
  luce: '#ffb45a', fiamma: '#ff8a2c', buio: 0.4, torce: true,
  varianti: ['liscio', 'liscio', 'usura', 'ombra', 'detriti', 'screpolato'],
  dettagli: [['pozze', 2.4], ['crepe', 2.9], ['ciottoli', 3.6], ['muschio', 4.3]],
}
