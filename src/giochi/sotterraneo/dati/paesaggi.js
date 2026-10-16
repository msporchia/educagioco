// I paesaggi del Sotterraneo 3D: per ognuno lo scenario del motore di cui usa i pezzi (porte, forzieri, l'arredo da toccare:
// dati/tessere.js), la famiglia di piante che gli sta bene e se vuole l'acqua. I quattro del motore sono base di se stessi. Il
// disegno di ognuno sta in scena3d/aspetti.js; qui solo quello che serve PRIMA di scendere (il cheat `#scenario=`, Gioco.vue),
// così il 2D non si porta dietro il 3D. Dato puro. Vedi docs/sotterraneo/paesaggi-3d.md.
export const PAESAGGI = {
  cantine: { base: 'cantine', pianta: 'costruita' },
  cripta: { base: 'cripta', pianta: 'costruita' },
  fornace: { base: 'fornace', pianta: 'costruita' },
  inferno: { base: 'inferno', pianta: 'costruita' },
  grotta: { base: 'cantine', pianta: 'caverna' },
  neve: { base: 'cantine', pianta: 'caverna' },
  ghiaccio: { base: 'cripta', pianta: 'caverna' },
  palude: { base: 'cantine', pianta: 'caverna', acqua: true },
  tempio: { base: 'cripta', pianta: 'costruita', acqua: true },
  miniera: { base: 'fornace', pianta: 'caverna' },
}

// la discesa vestita da quel paesaggio, per guardarlo (il cheat): stesso motore e stessi numeri, cambiano lo scenario dei
// pezzi, la famiglia del piano e l'acqua
export function inPaesaggio(tappa, chiave) {
  const p = PAESAGGI[chiave]
  if (!p || !tappa) return tappa
  return { ...tappa, scenario: p.base, pianta: p.pianta, acqua: !!p.acqua, paesaggio: chiave }
}
