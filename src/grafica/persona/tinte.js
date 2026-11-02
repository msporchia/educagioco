// La tavolozza di otto tinte per ritingere un oggetto, in comune fra il sotterraneo (il tintore: docs/sotterraneo/tintore.md) e la fattoria (gli
// addobbi delle bestie): gli id stanno nei salvataggi, non si rinominano. Dato puro, i colori sono 0xRRGGBB; il disegno è in `tinge3d.js` accanto.
export const TINTE = [
  { id: 'rosso',    nome: 'Rosso',    colore: 0xd83a34 },
  { id: 'arancio',  nome: 'Arancio',  colore: 0xf08a24 },
  { id: 'giallo',   nome: 'Giallo',   colore: 0xf2c92c },
  { id: 'verde',    nome: 'Verde',    colore: 0x48b84c },
  { id: 'azzurro',  nome: 'Azzurro',  colore: 0x38b4e8 },
  { id: 'blu',      nome: 'Blu',      colore: 0x3a54d0 },
  { id: 'viola',    nome: 'Viola',    colore: 0x8c48d0 },
  { id: 'rosa',     nome: 'Rosa',     colore: 0xf070b0 },
]
// `css`: lo stesso colore per le pastiglie del foglio
for (const t of TINTE) t.css = '#' + t.colore.toString(16).padStart(6, '0')
export const TINTA_DI = Object.fromEntries(TINTE.map(t => [t.id, t]))
export const tintaValida = id => (typeof id === 'string' && TINTA_DI[id] ? id : null)
