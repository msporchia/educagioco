/* ═════ LE FOGNE ═════
   Mattoni bagnati, verde di alghe, acqua ferma. La luce è verde
   perché il fuoco di una fogna, in un gioco, è verde: è una
   convenzione che i bambini conoscono già, e serve a non fare una
   seconda cripta.

   Le pozze sono fitte — è l'unico ambiente in cui un dettaglio bagnato
   può stare quasi ovunque — ma il velo verde resta basso: bagnato vuol
   dire lucido a tratti, non verde tutto. */
export const FOGNE = {
  nome: 'Le fogne',
  posa: 'umido', muratura: 'mattoni',
  fondo: ['#1b2226', '#12181b'],
  chiazze: ['#48645f', '#0f1416'],
  lastra: ['#4a5a58', '#3a4644'],
  terra: '#3a4440', sasso: '#6a7570', muschio: '#4a7a5a',
  erbaC: '#5f8a4a', erbaS: '#3f6b3a',
  muro: ['#6a6a52', '#3f4234'], giunto: '#161c18',
  luce: '#8fe8d0', fiamma: '#3fc7a0', buio: 0.44, torce: true,
  varianti: ['liscio', 'liscio', 'umidiccio', 'licheni', 'usura'],
  dettagli: [['pozze', 1.9], ['muschio', 2.9], ['crepe', 4.3], ['ciottoli', 5]],
}
