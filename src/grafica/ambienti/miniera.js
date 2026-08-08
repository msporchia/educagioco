/* ═════ LA MINIERA ═════
   Terra battuta, binari che attraversano la stanza, muri tenuti su
   dalle travi. Insieme al tappeto del trono è l'unico pavimento con
   una **direzione**: i binari dicono da dove si viene e dove si va.

   I cristalli sono rari apposta — se ce n'è uno ogni due celle non
   sono più un tesoro, sono un motivo decorativo. */
export const MINIERA = {
  nome: 'La miniera',
  posa: 'binari', muratura: 'legno',
  /* più chiara di quanto verrebbe da pensare: una miniera è buia, ma
     un pavimento di terra scuro sotto un `buio` alto diventa un vuoto
     marrone in cui non si vede né il binario né dove finisce la
     stanza. La luce la fanno le torce, il pavimento deve solo
     restituirla. */
  fondo: ['#514231', '#372c20'],
  chiazze: ['#7a6449', '#2a2119'],
  lastra: ['#5a4a38', '#43372a'],
  terra: '#6f5740', sasso: '#8a7f6e', muschio: '#4a6b4a',
  erbaC: '#5f8a4a', erbaS: '#3f6b3a',
  muro: ['#8a6640', '#543b24'], giunto: '#1e1710',
  cristallo: '#7fd8e0',
  luce: '#ffca7a', fiamma: '#ffa63c', buio: 0.3, torce: true,
  varianti: ['liscio', 'liscio', 'polvere', 'detriti', 'screpolato', 'ombra'],
  dettagli: [['ciottoli', 2.3], ['assi', 3.6], ['cristalli', 4], ['crepe', 5]],
}
