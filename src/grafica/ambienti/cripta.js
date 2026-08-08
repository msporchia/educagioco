/* ═════ LA CRIPTA ═════
   Pavimento a lastroni freddi, muri di mattoni caldi: sono le due cose
   che devono restare distinguibili anche al buio — la prima cripta era
   mattoni sopra e sotto, e non si capiva più dove finiva il
   camminabile. La luce è verde-menta: è quella che dice «qui sotto c'è
   qualcosa che non va» senza bisogno di un teschio in mezzo. */
export const CRIPTA = {
  nome: 'La cripta',
  posa: 'lastre', muratura: 'mattoni',
  fondo: ['#22242a', '#16171c'],
  chiazze: ['#53565e', '#141519'],
  lastra: ['#5e6169', '#474a52'],
  terra: '#4a3c33', sasso: '#7a6a5c', muschio: '#4a6b4a',
  erbaC: '#5f8a4a', erbaS: '#3f6b3a',
  muro: ['#8f6146', '#5c3a29'], giunto: '#2b1b13',
  luce: '#7fe0c0', fiamma: '#35c79a', buio: 0.42, torce: true,
  varianti: ['liscio', 'liscio', 'usura', 'screpolato', 'licheni', 'detriti'],
  dettagli: [['crepe', 2.3], ['ossa', 3.3], ['muschio', 5], ['ciottoli', 4.3]],
}
