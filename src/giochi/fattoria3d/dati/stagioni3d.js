/* Le stagioni della fattoria 3D (dato puro): QUANDO è festa lo dice `dati/stagioni.js` della fattoria di sempre (importato così com'è,
   con le sue finestre e il suo `addobbiStagionali`); qui COME si vede in 3D. Niente three, niente disegno: la scena (scena3d/stagione.js)
   legge questi numeri. Vedi docs/fattoria3d/stagioni.md. */
import { stagioneDi, FINESTRE, semeDelGiorno, addobbiStagionali } from '../../fattoria/dati/stagioni.js'
import { caso } from '../../fattoria/dati/mondo.js'

export { stagioneDi, FINESTRE, semeDelGiorno }

/** `#stagione=natale|halloween` nell'indirizzo accende una festa fuori periodo (come nella 2D); altro → null. */
export function stagioneDaIndirizzo(frammento = '') {
  const m = /(?:^#?|&)stagione=(\w+)(?=&|$)/i.exec(frammento || '')
  const nome = m && m[1].toLowerCase()
  return nome && FINESTRE[nome] ? nome : null
}
/** La stagione che si vede ora: quella forzata dall'indirizzo, se c'è, altrimenti quella del calendario (o null). */
export function stagioneAttiva(data = new Date(), frammento = '') {
  return stagioneDaIndirizzo(frammento) || stagioneDi(data) || null
}

/** Com'è fatto il cielo e la luce in ogni festa (colori 0xRRGGBB). Il giorno qualunque non c'è: la scena tiene i suoi. */
export const ASPETTI = {
  natale:    { cielo: 0xdbe6f0, nebbia: [30, 80], emisfero: [0xe6f0ff, 0xa9b6c4, 1.1], sole: [0xf2f6ff, 2.1] },
  halloween: { cielo: 0xd9a070, nebbia: [24, 70], emisfero: [0xffd2a0, 0x6a5a7a, 0.95], sole: [0xffb070, 1.8] },
}

/** Quanti fiocchi / lucciole (un solo disegno ciascuno): pochi, si muovono nel vertex shader. */
export const PARTICELLE = { natale: { n: 420, alto: 14 }, halloween: { n: 70, alto: 5 } }

/** Le zucche da comprare a Halloween: due voci del catalogo (`stagione: 'halloween'`). */
export const ZUCCHE = ['zucca_intagliata', 'zucche_mucchio']

const lati = e => {
  const celle = []
  for (let a = -1; a <= e.w; a++) for (let b = -1; b <= e.d; b++) if (a < 0 || b < 0 || a >= e.w || b >= e.d) celle.push([e.i + a, e.j + b])
  return celle
}

/**
 * Gli addobbi di Natale in celle del mondo. `edifici`: [{ i, j, w, d, alto }] (le cose alte; `alto` è l'altezza del tetto in metri);
 * `libera(i, j)`: la cella è vuota e propria. Torna { stelle: [{ x, y, z, campana }], alberelli: [{ x, z }], luci: [{ x, y, z, rosso }] }.
 * La scelta fra ⭐ e 🔔, e se c'è l'alberello, è quella di `addobbiStagionali` della 2D (stesso seme: stessa giornata, stesse cose).
 */
export function addobbiNatale(edifici, libera, seme = 0) {
  const visto = new Set(), libere = []
  for (const e of edifici) for (const [i, j] of lati(e)) if (libera(i, j) && !visto.has(i + ',' + j)) { visto.add(i + ',' + j); libere.push([i, j]) }
  const dati = addobbiStagionali('natale', { libere, edifici: edifici.map(e => ({ x: e.i, y: e.j, w: e.w, h: e.d, alto: 3 })), seme })
  const stelle = [], alberelli = [], luci = []
  edifici.forEach((e, n) => {
    // la 2D mette ⭐ o 🔔 in (centro, cima + 0,35): lo si riconosce da lì
    const campana = dati.some(a => a.testo === '🔔' && Math.abs(a.x - (e.i + e.w / 2)) < 1e-6 && Math.abs(a.y - (e.j + e.d - 3 + 0.35)) < 1e-6)
    stelle.push({ x: e.i + e.w / 2, y: Math.max(1.2, e.alto - 0.3), z: e.j + e.d / 2, campana })
    // una fila di lucine sotto la gronda, sul davanti (+z) e sui due fianchi: rosse e gialle a turno
    const y = Math.min(1.5, e.alto * 0.45)
    for (let a = 0; a < e.w * 2; a++) luci.push({ x: e.i + (a + 0.5) / 2, y, z: e.j + e.d + 0.06, rosso: (a + n) % 2 === 0 })
    for (let b = 0; b < e.d * 2; b++) {
      luci.push({ x: e.i - 0.06, y, z: e.j + (b + 0.5) / 2, rosso: (b + n) % 2 === 1 })
      luci.push({ x: e.i + e.w + 0.06, y, z: e.j + (b + 0.5) / 2, rosso: (b + n) % 2 === 0 })
    }
  })
  for (const a of dati) if (a.testo === '🎄') alberelli.push({ x: a.x, z: a.y })
  return { stelle, alberelli, luci }
}

/** Le chiazze di neve sul prato: una cella su `ogni` fra [i0, i1) × [j0, j1), scelta dal caso del giorno, mai dove c'è altro. */
export const CHIAZZE = { ogni: 7, massimo: 160 }
export function chiazzeDiNeve(i0, j0, i1, j1, vuota, seme = 0) {
  const out = []
  for (let i = i0; i < i1; i++) for (let j = j0; j < j1; j++) {
    if (caso(i, j, seme + 7) * CHIAZZE.ogni >= 1 || !vuota(i, j)) continue
    out.push({ x: i + 0.2 + caso(i, j, seme + 8) * 0.6, z: j + 0.2 + caso(i, j, seme + 9) * 0.6, r: 0.2 + caso(i, j, seme + 10) * 0.26 })
    if (out.length >= CHIAZZE.massimo) return out
  }
  return out
}

export function guastiDelleStagioni3d() {
  const g = []
  for (const nome of Object.keys(FINESTRE)) {
    if (!ASPETTI[nome]) g.push(`${nome}: manca l'aspetto 3D`)
    if (!PARTICELLE[nome]) g.push(`${nome}: mancano le particelle`)
  }
  for (const nome of Object.keys(ASPETTI)) if (!FINESTRE[nome]) g.push(`${nome}: un aspetto per una festa che non c'è`)
  return g
}
