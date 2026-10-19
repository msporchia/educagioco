/* Cosa si può avere: i pezzi che il bambino costruisce dove vuole nel terreno suo, e i due edifici unici che hanno un
   posto fisso. Dato puro: nessun disegno qui (i modelli stanno in scena3d/modelli.js). Vedi docs/fattoria3d/regole.md. */

// `rincaro`: ogni copia (anche nel magazzino) costa di più, come i campi della fattoria di sempre
export const PEZZI = {
  campo:      { nome: 'Campo',      emoji: '🌾', w: 2, d: 2, prezzo: 20, rincaro: 8 },
  recinto:    { nome: 'Recinto',    emoji: '🐑', w: 3, d: 3, prezzo: 45, rincaro: 0 },
  bancarella: { nome: 'Bancarella', emoji: '🍎', w: 2, d: 1, prezzo: 15, rincaro: 0 },
  fontana:    { nome: 'Fontana',    emoji: '⛲', w: 2, d: 2, prezzo: 30, rincaro: 0 },
}
export const TIPI_DI_PEZZO = Object.keys(PEZZI)

// Unici: uno per tipo, nel posto che dice `slot` (angolo in alto a sinistra, davanti verso +z). Si vedono come
// fantasmi finché non si comprano. Stanno dentro il quadrato di partenza.
export const EDIFICI = {
  pasticceria: { nome: 'Pasticceria', emoji: '🥧', w: 4, d: 3, prezzo: 80,  slot: { i: -6, j: -4 } },
  mongolfiera: { nome: 'Mongolfiera', emoji: '🎈', w: 3, d: 3, prezzo: 100, slot: { i: 2,  j: -4 } },
}
export const TIPI_DI_EDIFICIO = Object.keys(EDIFICI)

export const eEdificio = tipo => !!EDIFICI[tipo]
export const misureDi = tipo => PEZZI[tipo] || EDIFICI[tipo] || null

export function guastiDelCatalogo() {
  const g = []
  for (const [tipo, d] of [...Object.entries(PEZZI), ...Object.entries(EDIFICI)]) {
    if (!d.nome || !d.emoji) g.push(`${tipo}: manca nome o emoji`)
    if (!(d.w >= 1 && d.d >= 1)) g.push(`${tipo}: misure impossibili`)
    if (!(d.prezzo > 0)) g.push(`${tipo}: prezzo non positivo`)
  }
  for (const t of TIPI_DI_PEZZO) if (EDIFICI[t]) g.push(`${t}: sia pezzo sia edificio`)
  return g
}
