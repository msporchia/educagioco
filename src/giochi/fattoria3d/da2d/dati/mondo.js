/* Le misure della fattoria (dato puro). Il mondo si misura in celle, mai in pixel (lo zoom cambia
   mentre si gioca); chi disegna moltiplica per la scala all'ultimo momento. */

export const T = 16                    // la tessera dell'atlante, in pixel
export const CELLE = 6                 // celle per lato di una piazzola

export const SCALA_MIN = 1
export const SCALA_MAX = 5
export const SCALA_INIZIALE = 2

// Le piazzole del primo giorno: un quadrato in mezzo, così il bosco è intorno e si cresce in ogni direzione.
export const PRIMA = 2
export const ULTIMA = 4
export const PIAZZOLE_INIZIALI = (ULTIMA - PRIMA + 1) ** 2

// Il mondo non è un numero fisso: attorno alla terra posseduta ci sono sempre almeno due piazzole da
// comprare (MARGINE), e non si stringe mai. Le coordinate non si rinumerano mai (Math.floor, mai |0).
export const MARGINE = 2

// Il mondo di una fattoria appena nata: le tre piazzole di partenza più il margine (7×7, come prima).
export const LIMITI_NUOVI = {
  x0: PRIMA - MARGINE, y0: PRIMA - MARGINE,
  x1: ULTIMA + MARGINE, y1: ULTIMA + MARGINE,
}

// Un salvataggio di ieri: il mondo era 7×7 fisso, per sapere fin dove il bosco esiste già.
export const LIMITI_VECCHI = { x0: 0, y0: 0, x1: 6, y1: 6 }

// In quale piazzola cade una cella.
export const piazzolaDi = cella => Math.floor(cella / CELLE)

// Il mondo che tiene dentro queste piazzole col margine giusto, senza mai stringere quello che c'era già.
export function limitiPer(chiavi, base = null) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const k of chiavi) {
    const [x, y] = String(k).split(',').map(Number)
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    x0 = Math.min(x0, x); y0 = Math.min(y0, y)
    x1 = Math.max(x1, x); y1 = Math.max(y1, y)
  }
  const l = Number.isFinite(x0)
    ? { x0: x0 - MARGINE, y0: y0 - MARGINE, x1: x1 + MARGINE, y1: y1 + MARGINE }
    : { ...LIMITI_NUOVI }
  if (!base) return l
  return { x0: Math.min(l.x0, base.x0), y0: Math.min(l.y0, base.y0),
           x1: Math.max(l.x1, base.x1), y1: Math.max(l.y1, base.y1) }
}

// Le celle di un mondo, con la fine esclusa.
export function celleDi(l) {
  return { cx0: l.x0 * CELLE, cy0: l.y0 * CELLE,
           cx1: (l.x1 + 1) * CELLE, cy1: (l.y1 + 1) * CELLE }
}

export const dentroI = (l, px, py) =>
  px >= l.x0 && px <= l.x1 && py >= l.y0 && py <= l.y1

// Il pezzo di terra rincara a ogni acquisto: senza, la mappa si riempie in un pomeriggio.
export const PREZZO_PIAZZOLA = 45
export const RINCARO = 1.38

export function prezzoPiazzola(quante) {
  const oltre = Math.max(0, quante - PIAZZOLE_INIZIALI)
  return Math.round(PREZZO_PIAZZOLA * Math.pow(RINCARO, oltre))
}

// Una monetina, come mettere via nel baule (stesso gesto, stesso prezzo): rimetterla dov'era è gratis.
export const COSTO_SPOSTARE = 1

// Il bosco si ricava dalle coordinate, non a caso: la stessa fattoria riaperta ha gli stessi alberi.
export function caso(x, y, sale) {
  let n = (x * 73856093) ^ (y * 19349663) ^ (sale * 83492791)
  n = (n ^ (n >>> 13)) * 1274126177
  n ^= n >>> 16
  return ((n >>> 0) % 100000) / 100000
}

// Quanto è fitto il bosco: più alto, più monete da sgombrare.
export const DENSITA_BOSCO = 0.24

export const chiave = (x, y) => x + ',' + y

export function guastiDelMondo() {
  const g = []
  if (PRIMA > ULTIMA) g.push('PRIMA viene dopo ULTIMA')
  if (MARGINE < 1) g.push('senza margine si arriva subito al bordo del mondo')
  // il mondo di partenza deve tenere dentro le piazzole di partenza col loro margine
  const l0 = limitiPer([chiave(PRIMA, PRIMA), chiave(ULTIMA, ULTIMA)])
  if (l0.x0 !== LIMITI_NUOVI.x0 || l0.x1 !== LIMITI_NUOVI.x1)
    g.push('LIMITI_NUOVI non è il mondo che la regola del margine darebbe')
  if (!dentroI(LIMITI_NUOVI, PRIMA - 1, PRIMA - 1) || !dentroI(LIMITI_NUOVI, ULTIMA + 1, ULTIMA + 1))
    g.push('le piazzole iniziali non hanno margine attorno')
  if (SCALA_INIZIALE < SCALA_MIN || SCALA_INIZIALE > SCALA_MAX)
    g.push('la scala iniziale sta fuori dai limiti dello zoom')
  if (RINCARO <= 1) g.push('senza rincaro la mappa si compra tutta in un pomeriggio')
  if (DENSITA_BOSCO <= 0 || DENSITA_BOSCO >= 1) g.push('densità del bosco impossibile')
  // il caso deve essere stabile: è tutta la ragione per cui esiste
  if (caso(3, 4, 1) !== caso(3, 4, 1)) g.push('caso() non è stabile')
  if (caso(3, 4, 1) === caso(4, 3, 1)) g.push('caso() non distingue x da y')
  return g
}
