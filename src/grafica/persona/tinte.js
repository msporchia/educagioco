// La tavolozza di quindici tinte (i colori standard: bianco, nero, grigio, marrone, i colori dell'arcobaleno e qualche scuro) per ritingere un oggetto, in comune fra il sotterraneo (il tintore: docs/sotterraneo/tintore.md) e la fattoria (gli
// addobbi delle bestie): gli id stanno nei salvataggi, non si rinominano. Dato puro, i colori sono 0xRRGGBB; il disegno è in `tinge3d.js` accanto.
// `luce`: quanto schiarisce (>1) o scurisce (<1) il pezzo oltre al colore, per il bianco, il nero e i colori scuri (il metodo del colore da solo
// non li farebbe: bianco e nero non hanno una tinta da dare, solo una luce). Gli id non si rinominano: stanno nei salvataggi.
export const TINTE = [
  { id: 'bianco',   nome: 'Bianco',   colore: 0xf2f2f2, luce: 2.6 },
  { id: 'grigio',   nome: 'Grigio',   colore: 0x8c9099, luce: 1.0 },
  { id: 'nero',     nome: 'Nero',     colore: 0x1e1e22, luce: 0.22 },
  { id: 'marrone',  nome: 'Marrone',  colore: 0x7a4a26, luce: 0.78 },
  { id: 'rosso',    nome: 'Rosso',    colore: 0xd83a34 },
  { id: 'bordeaux', nome: 'Bordeaux', colore: 0x8a1c36, luce: 0.78 },
  { id: 'arancio',  nome: 'Arancio',  colore: 0xf08a24 },
  { id: 'giallo',   nome: 'Giallo',   colore: 0xf2c92c },
  { id: 'oro',      nome: 'Oro',      colore: 0xd4a62a, luce: 1.05 },
  { id: 'verde',    nome: 'Verde',    colore: 0x48b84c },
  { id: 'turchese', nome: 'Turchese', colore: 0x20b8a8 },
  { id: 'azzurro',  nome: 'Azzurro',  colore: 0x38b4e8 },
  { id: 'blu',      nome: 'Blu',      colore: 0x3a54d0 },
  { id: 'viola',    nome: 'Viola',    colore: 0x8c48d0 },
  { id: 'rosa',     nome: 'Rosa',     colore: 0xf070b0 },
]
// `css`: lo stesso colore per le pastiglie del foglio
for (const t of TINTE) t.css = '#' + t.colore.toString(16).padStart(6, '0')
export const TINTA_DI = Object.fromEntries(TINTE.map(t => [t.id, t]))
export const tintaValida = id => (typeof id === 'string' && TINTA_DI[id] ? id : null)
