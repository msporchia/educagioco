/* Cosa si può avere: i pezzi che il bambino costruisce dove vuole nel terreno suo, e gli edifici unici che hanno un posto
   fisso. Dato puro: nessun disegno qui (i modelli stanno in scena3d/modelli.js). `liv` è il livello a cui si può comprare
   (dati/livelli.js lo legge da qui, mai un elenco a parte); `produttivo` dice che il suo prezzo si somma al salto di
   livello (le decorazioni no). Vedi docs/fattoria3d/regole.md e livelli.md. */

// `rincaro`: ogni copia (anche nel magazzino) costa di più, come i campi della fattoria di sempre
export const PEZZI = {
  campo:           { nome: 'Campo',           emoji: '🌾', w: 2, d: 2, prezzo: 20, rincaro: 8, liv: 1, produttivo: true },
  recinto:         { nome: 'Recinto',         emoji: '🐑', w: 3, d: 3, prezzo: 45, rincaro: 0, liv: 4, produttivo: true },
  bancarella:      { nome: 'Bancarella',      emoji: '🍎', w: 2, d: 1, prezzo: 15, rincaro: 0, liv: 2 },
  aiuola:          { nome: 'Aiuola',          emoji: '🌷', w: 1, d: 1, prezzo: 6,  rincaro: 0, liv: 2 },
  panchina:        { nome: 'Panchina',        emoji: '🪑', w: 2, d: 1, prezzo: 10, rincaro: 0, liv: 6 },
  fontana:         { nome: 'Fontana',         emoji: '⛲', w: 2, d: 2, prezzo: 30, rincaro: 0, liv: 8 },
  pozzo:           { nome: 'Pozzo',           emoji: '🪣', w: 1, d: 1, prezzo: 18, rincaro: 0, liv: 9 },
  spaventapasseri: { nome: 'Spaventapasseri', emoji: '🧑‍🌾', w: 1, d: 1, prezzo: 12, rincaro: 0, liv: 13 },
}
export const TIPI_DI_PEZZO = Object.keys(PEZZI)

// Unici: uno per tipo, nel posto che dice `slot` (angolo in alto a sinistra, davanti verso +z). Si vedono come fantasmi
// finché non si comprano. Pasticceria e mongolfiera stanno dentro il quadrato di partenza; gli altri in lotti accanto, da
// comprare prima (motivo `lotto-non-tuo`). Sono tutti produttivi: ogni edificio è una macchina (dati/ricette.js) tranne la mongolfiera.
export const EDIFICI = {
  pasticceria: { nome: 'Pasticceria', emoji: '🥧', w: 4, d: 3, prezzo: 80,  slot: { i: -6, j: -4 }, liv: 5 },
  mongolfiera: { nome: 'Mongolfiera', emoji: '🎈', w: 3, d: 3, prezzo: 100, slot: { i: 2,  j: -4 }, liv: 10 },
  mulino:      { nome: 'Mulino',      emoji: '🌬️', w: 3, d: 3, prezzo: 60,  slot: { i: -2, j: -7 }, liv: 3 },
  panificio:   { nome: 'Panificio',   emoji: '🥖', w: 3, d: 3, prezzo: 90,  slot: { i: -5, j: -7 }, liv: 7 },
  conserviera: { nome: 'Conserviera', emoji: '🥫', w: 3, d: 3, prezzo: 110, slot: { i: 2,  j: -7 }, liv: 12 },
  gelateria:   { nome: 'Gelateria',   emoji: '🍦', w: 3, d: 3, prezzo: 140, slot: { i: -9, j: 0 },  liv: 14 },
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
    if (!(Number.isInteger(d.liv) && d.liv >= 1)) g.push(`${tipo}: manca il livello`)
  }
  for (const t of TIPI_DI_PEZZO) if (EDIFICI[t]) g.push(`${t}: sia pezzo sia edificio`)
  for (const [tipo, e] of Object.entries(EDIFICI)) {
    if (!e.slot || !Number.isInteger(e.slot.i) || !Number.isInteger(e.slot.j)) g.push(`${tipo}: manca il posto`)
  }
  // i posti non si sovrappongono
  const t = Object.entries(EDIFICI)
  for (let a = 0; a < t.length; a++) for (let b = a + 1; b < t.length; b++) {
    const [ka, x] = t[a], [kb, y] = t[b]
    if (x.slot && y.slot && x.slot.i < y.slot.i + y.w && y.slot.i < x.slot.i + x.w && x.slot.j < y.slot.j + y.d && y.slot.j < x.slot.j + x.d)
      g.push(`${ka} e ${kb}: i posti si sovrappongono`)
  }
  return g
}
