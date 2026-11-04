// I cani di razza (beagle, labrador, border collie, dalmata) modellati nella creta (`creta.js`): un corpo che scende morbido nel collo e nelle cosce,
// una testa con lo stop, il muso, le guance, le sopracciglia e la bocca, il naso con le narici, gli occhi lucidi nelle orbite, orecchie che sono foglie
// sottili, zampe col gomito e il garretto e i piedini con le dita. Lo scheletro è quello del beagle (gli stessi perni di Watson, quindi `posaCane`
// e `posaBeagle` li muovono senza saperlo); cambiano la carne, il mantello e la scala. Vedi docs/fattoria3d/creta.md e docs/fattoria3d/adozioni.md.
import * as THREE from 'three'
import { mat } from './modelli.js'
import { G, perno, zonaTocco } from './modelli-compagni.js'
import { palla, osso, fila, girata, arruffata, unione, meno, dentro, sopra, pelle, fra, verso, mosso, macchie, PARTENZA } from './creta.js'

// i perni (nel sistema del cane fermo, come il beagle di prima: davanti verso +z, piedi a y = 0)
const O_CORPO = [0, 0.38, -0.2], O_TESTA = [0, 0.62, 0.3]
const ZAMPE = [[-0.1, 0.32, 0.2], [0.1, 0.32, 0.2], [-0.11, 0.34, -0.29], [0.11, 0.34, -0.29]]
const PASSO = { corpo: 0.024, testa: 0.012, zampa: 0.019, orecchio: 0.012, coda: 0.015, naso: 0.0065, lingua: 0.007 }
const LOD = 2.6                                   // da lontano il passo è questo tanto più grande (circa un sesto dei triangoli)

const BIANCO = 0xf6f3ee, NERO = 0x231f1d
const somma = (a, b) => a.map((v, i) => v + b[i])

// ══════════ le razze ══════════
// `w` quanto è largo, `zampa` lo spessore delle zampe, `muso` [lungo, raggio alla base, raggio in punta, quanto scende], `cranio` i raggi,
// `orecchie` e `coda` la forma, `arruffo` il pelo lungo (gorgiera, coda a pennacchio, pantaloni), `manto` i colori. `scala` in scena;
// `alzo` quanto la razza è più alta (o più bassa) di zampe: il corpo sale di tanto con tutto quello che porta, le zampe si allungano col piede a terra
// (`allunga`); `fitto` stringe la rete del corpo e delle zampe (le macchie del dalmata sono colori nei vertici: a maglie larghe diventano stelle).
export const RAZZE_CANE = {
  beagle:   { nome: 'beagle', scala: 0.72, alzo: -0.035, w: 1, petto: 1, zampa: 1, cranio: [0.118, 0.112, 0.128], muso: [0.15, 0.074, 0.058, 0.03], labbra: 1, orecchie: 'lunghe', coda: 'su', arruffo: 0, manto: 'beagle', naso: 0x1a1414, occhi: 0x3a2312 },
  labrador: { nome: 'labrador', scala: 0.96, alzo: 0, w: 1.12, petto: 1.08, zampa: 1.15, cranio: [0.128, 0.115, 0.13], muso: [0.15, 0.08, 0.064, 0.02], labbra: 0.8, orecchie: 'piegate', coda: 'lontra', arruffo: 0, manto: 'labrador', naso: 0x2a1c18, occhi: 0x4a2a14 },
  collie:   { nome: 'border collie', scala: 0.84, alzo: 0, w: 0.95, petto: 1, zampa: 0.92, cranio: [0.112, 0.108, 0.125], muso: [0.155, 0.066, 0.042, 0.035], labbra: 0.4, orecchie: 'semi', coda: 'pennacchio', arruffo: 1, manto: 'collie', naso: 0x151213, occhi: 0x4a2c16 },
  dalmata:  { nome: 'dalmata', scala: 0.9, alzo: 0.05, fitto: 0.8, w: 0.95, petto: 1.06, zampa: 0.88, cranio: [0.112, 0.11, 0.128], muso: [0.16, 0.068, 0.05, 0.025], labbra: 0.7, orecchie: 'medie', coda: 'sciabola', arruffo: 0, manto: 'dalmata', naso: 0x161313, occhi: 0x3a2214 },
}

// ══════════ le forme ══════════
function formaCorpo (R) {
  const w = R.w, d = R.petto
  const pezzi = [
    palla([0, 0.47, 0.155], [0.142 * w, 0.165 * d, 0.152]),                                     // il petto, profondo
    osso([0, 0.49, 0.1], [0, 0.522, -0.2], 0.14 * w, 0.122 * w),                               // il tronco che si stringe ai fianchi
    palla([0, 0.52, -0.285], [0.132 * w, 0.138, 0.13]),                                        // la groppa
    osso([0, 0.555, 0.2], [0, 0.69, 0.345], 0.098 * w, 0.078 * w),                             // il collo, che va su e avanti
    ...[-1, 1].map(s => palla([s * 0.088 * w, 0.43, 0.19], [0.06 * w, 0.105, 0.072])),          // le spalle
    ...[-1, 1].map(s => palla([s * 0.095 * w, 0.445, -0.275], [0.072 * w, 0.12, 0.1])),        // le cosce
  ]
  if (R.arruffo) {
    pezzi.push({ ...arruffata(palla([0, 0.59, 0.27], [0.13 * w, 0.14, 0.115]), 0.006, 48), k: 0.05 })      // la gorgiera
    pezzi.push({ ...arruffata(palla([0, 0.4, 0.0], [0.11 * w, 0.06, 0.2]), 0.005, 50), k: 0.05 })          // le frange sotto la pancia
  }
  return unione(pezzi, 0.075)
}

/** La testa: il cranio, la nuca che entra nel collo, lo stop, il muso, le guance, le labbra, il mento, le sopracciglia, le orbite e la bocca. */
function formaTesta (R) {
  const [cx, cy, cz] = [0, 0.772, 0.43], cr = R.cranio
  const [lungo, r0, r1, giu] = R.muso
  const mA = [0, 0.736, 0.505], mB = [0, 0.736 - giu, 0.505 + lungo]
  const pezzi = [
    palla([cx, cy, cz], cr),                                                                   // il cranio
    palla([0, 0.72, 0.36], [0.085, 0.09, 0.09]),                                               // la nuca
    { ...osso(mA, mB, r0, r1), k: 0.055 },                                                     // il muso
    ...[-1, 1].map(s => ({ ...palla([s * 0.058, 0.712, 0.51], [0.052, 0.05, 0.058]), k: 0.045 })),                       // le guance
    ...[-1, 1].map(s => ({ ...palla([s * 0.03, mB[1] - 0.025, mB[2] - 0.035], [0.034 * R.labbra + 0.012, 0.03, 0.05]), k: 0.03 })),   // le labbra che scendono
    { ...osso([0, 0.676, 0.5], [0, mB[1] - 0.045, mB[2] - 0.03], 0.042, 0.03), k: 0.03 },      // il mento
    ...[-1, 1].map(s => ({ ...palla([s * 0.047, 0.806, 0.522], [0.036, 0.024, 0.03]), k: 0.03 })),   // le sopracciglia
  ]
  let t = unione(pezzi, 0.06)
  for (const s of [-1, 1]) t = meno(t, palla(OCCHIO(s), 0.029), 0.012)                      // le orbite
  t = meno(t, BOCCA(R), 0.01)
  if (R.arruffo) t = unione([t, { ...arruffata(palla([0, 0.73, 0.37], [0.1, 0.09, 0.08]), 0.004, 60), k: 0.04 }])      // il pelo sulle guance e sulla nuca
  return t
}
const OCCHIO = s => [s * 0.057, 0.779, 0.532]
const BOCCA = R => { const [lungo, , r1, giu] = R.muso; return palla([0, 0.736 - giu - r1 * 0.72, 0.505 + lungo - 0.01], [0.034, 0.011, 0.05]) }

/** Il naso: un cuscinetto largo con le narici, un filo all'ingiù. */
function formaNaso (R) {
  const [lungo, , r1, giu] = R.muso, c = [0, 0.736 - giu + r1 * 0.32, 0.505 + lungo + r1 * 0.7]
  let n = unione([palla(c, [0.033, 0.024, 0.026]), palla(somma(c, [0, -0.012, -0.004]), [0.02, 0.02, 0.02])], 0.015)
  for (const s of [-1, 1]) n = meno(n, palla(somma(c, [s * 0.012, -0.005, 0.024]), [0.0075, 0.006, 0.01]), 0.004)
  return { forma: n, c }
}

/** Un orecchio (`s` = -1 sinistra, 1 destra), attaccato in `ATTACCO(s)`: foglie sottili, che ricadono a modo della razza. */
const ATTACCO = s => [s * 0.098, 0.832, 0.41]
function formaOrecchio (R, s) {
  const a = ATTACCO(s)
  switch (R.orecchie) {
    case 'piegate': return unione([                                                            // labrador: un triangolo morbido che ricade vicino alla guancia
      { ...girata(palla(somma(a, [s * 0.034, -0.05, 0.005]), [0.017, 0.074, 0.062]), [0.05, 0, s * 0.22]) },
      palla(somma(a, [s * 0.016, -0.004, 0.0]), [0.03, 0.026, 0.055]),
    ], 0.03)
    case 'semi': return unione([                                                               // collie: dritte alla base, la punta che si piega in avanti
      girata(palla(somma(a, [s * 0.008, 0.045, -0.005]), [0.042, 0.062, 0.014]), [-0.15, 0, -s * 0.18]),
      girata(palla(somma(a, [s * 0.016, 0.098, 0.022]), [0.026, 0.03, 0.011]), [1.05, 0, -s * 0.2]),
    ], 0.025)
    case 'medie': return unione([                                                              // dalmata: alte, tonde in punta, vicine alla testa
      girata(palla(somma(a, [s * 0.036, -0.046, 0.002]), [0.015, 0.078, 0.058]), [0.04, 0, s * 0.16]),
      palla(somma(a, [s * 0.014, -0.002, 0]), [0.028, 0.024, 0.05]),
    ], 0.028)
    default: return unione([                                                                   // beagle: lunghe, larghe, tonde, sotto la mascella
      girata(palla(somma(a, [s * 0.05, -0.1, 0.012]), [0.017, 0.118, 0.072]), [0.06, 0, s * 0.12]),
      girata(palla(somma(a, [s * 0.06, -0.18, 0.02]), [0.018, 0.06, 0.068]), [0.1, 0, s * 0.1]),
      palla(somma(a, [s * 0.018, -0.004, 0.004]), [0.03, 0.028, 0.06]),
    ], 0.035)
  }
}

/** Una zampa (`i`: 0-1 davanti, 2-3 dietro): dalla spalla o dalla coscia fino al piede con le tre dita, tagliata piatta a terra. */
function formaZampa (R, i) {
  const [px] = ZAMPE[i], z = R.zampa, dietro = i > 1, x = px * R.w
  const piede = dietro ? [x, 0.032, -0.282] : [x, 0.032, 0.222]
  const dita = [-1, 0, 1].map(k => ({ ...palla([x + k * 0.021, 0.024, piede[2] + 0.04 - Math.abs(k) * 0.006], [0.017, 0.022, 0.02]), k: 0.014 }))
  const gamba = dietro
    ? fila([[x, 0.44, -0.28], [x, 0.26, -0.215], [x, 0.12, -0.322], [x, 0.05, -0.3]], [0.055 * z, 0.046 * z, 0.03 * z, 0.028 * z], 0.03)
    : fila([[x, 0.44, 0.195], [x, 0.27, 0.178], [x, 0.1, 0.196], [x, 0.048, 0.212]], [0.05 * z, 0.04 * z, 0.031 * z, 0.029 * z], 0.03)
  const pezzi = [gamba, { ...palla(piede, [0.041 * z, 0.032, 0.052]), k: 0.025 }, ...dita]
  if (dietro) pezzi.push({ ...palla([x, 0.35, -0.262], [0.056 * z, 0.1, 0.082]), k: 0.04 })          // la coscia
  else pezzi.push({ ...palla([x, 0.33, 0.19], [0.05 * z, 0.08, 0.055]), k: 0.04 })                    // il braccio
  if (R.arruffo && dietro) pezzi.push({ ...arruffata(palla([x, 0.33, -0.315], [0.045, 0.085, 0.05]), 0.004, 60), k: 0.03 })   // i pantaloni
  if (R.arruffo && !dietro) pezzi.push({ ...arruffata(palla([x, 0.27, 0.16], [0.032, 0.07, 0.03]), 0.004, 60), k: 0.03 })     // le frange dietro le zampe
  return dentro(unione(pezzi, 0.02), sopra(0.001), 0.006)
}

/** La coda, dal sedere (`BASE_CODA`) in giù o in su, a modo della razza. */
const BASE_CODA = [0, 0.6, -0.39]
function formaCoda (R) {
  const b = BASE_CODA
  switch (R.coda) {
    case 'lontra': return fila([b, [0, 0.57, -0.49], [0, 0.5, -0.58], [0, 0.42, -0.63]], [0.045, 0.04, 0.03, 0.016], 0.02)                     // grossa alla base, giù dritta
    case 'pennacchio': return arruffata(fila([b, [0, 0.53, -0.49], [0, 0.44, -0.57], [0, 0.36, -0.61], [0, 0.32, -0.585]], [0.036, 0.044, 0.042, 0.032, 0.018], 0.03), 0.006, 55)      // bassa, piena, la punta appena all'insù
    case 'sciabola': return fila([b, [0, 0.6, -0.5], [0, 0.62, -0.6], [0, 0.68, -0.68]], [0.03, 0.025, 0.018, 0.009], 0.02)                      // lunga, un po' all'insù
    default: return fila([b, [0, 0.7, -0.45], [0, 0.82, -0.46], [0, 0.9, -0.43]], [0.032, 0.026, 0.02, 0.012], 0.02)                             // beagle: dritta in su
  }
}

/** La lingua: piatta, col solco in mezzo, che esce dalla bocca (il perno è sulla bocca: `posaCane` la allunga in z e la piega in giù). */
function formaLingua (R) {
  const b = BOCCA(R).c, c = [0, b[1] - 0.004, b[2] + 0.02]
  return { forma: meno(palla(c, [0.026, 0.0075, 0.042]), osso(somma(c, [0, 0.008, -0.03]), somma(c, [0, 0.008, 0.03]), 0.003), 0.004), c: b }
}

// ══════════ i mantelli (colori nei vertici, dalla posizione nel cane fermo) ══════════
const zonaZampa = (x, y, z) => Math.abs(x) > 0.04 && y < 0.36 && (z > 0.12 || z < -0.2)          // grosso modo: sulle zampe
const zonaOrecchio = (x, y, z) => Math.abs(x) > 0.1 && y > 0.56 && y < 0.95 && z > 0.33 && z < 0.5
const zonaCoda = (x, y, z) => z < -0.4 && y > 0.25
const pancia = (x, y, z) => fra(0.41, 0.36, y) * fra(-0.32, -0.25, z) * fra(0.33, 0.26, z) * fra(0.13, 0.09, Math.abs(x))
const petto = (x, y, z) => fra(0.23, 0.28, z) * fra(0.63, 0.55, y) * fra(0.1, 0.06, Math.abs(x) - 0.02 * Math.max(0, 0.5 - y) * 10)
const muso = (R, x, y, z) => fra(0.545, 0.575, z) * fra(0.76, 0.735, y)
const fiamma = (x, y, z) => fra(0.5, 0.53, z) * fra(0.88, 0.84, y) * fra(0.022 + 0.035 * fra(0.8, 0.74, y), 0.012 + 0.03 * fra(0.8, 0.74, y), Math.abs(x))

/** Dove sta il punto lungo il collo (0 all'attacco sul petto, 1 sotto la testa): il collare bianco del collie è un anello fra 0,2 e 0,8. */
const COLLO = (x, y, z) => { const ax = 0, ay = 0.555, az = 0.2, bx = 0, by = 0.135, bz = 0.145, t = ((y - ay) * by + (z - az) * bz) / (by * by + bz * bz)
  return fra(0.12, 0.24, t) * fra(0.86, 0.74, t) * fra(0.16, 0.12, Math.hypot(x - ax, (y - ay) - t * by, (z - az) - t * bz)) }
const MANTELLI = {
  beagle (R, x, y, z, c) {
    const NOCCIOLA = 0xc98a45, CASTANO = 0x8e5427
    c.setHex(NOCCIOLA)
    if (zonaOrecchio(x, y, z)) return verso(c, CASTANO, 0.85 * fra(0.82, 0.74, y) + 0.4)
    const sella = fra(0.53, 0.575, y + 0.012 * mosso(x, y, z, 45)) * fra(0.17, 0.1, z) * fra(-0.44, -0.36, z)
    verso(c, NERO, sella * (zonaZampa(x, y, z) ? 0 : 1))
    let b = Math.max(pancia(x, y, z), petto(x, y, z), muso(R, x, y, z), fiamma(x, y, z))
    if (zonaZampa(x, y, z)) b = Math.max(b, z > 0 ? fra(0.36, 0.3, y) : fra(0.22, 0.17, y))
    if (zonaCoda(x, y, z)) b = fra(0.8, 0.84, y)
    return verso(c, BIANCO, b)
  },
  labrador (R, x, y, z, c) {
    c.setHex(0xe1b46a)
    if (zonaOrecchio(x, y, z)) return verso(c, 0xc4924a, 0.6)
    verso(c, 0xf1d9a2, Math.max(pancia(x, y, z), petto(x, y, z) * 0.8, muso(R, x, y, z) * 0.55))
    verso(c, 0xd09a52, fra(0.6, 0.66, y) * fra(0.1, 0.0, z) * 0.35)                                 // un filo più scuro sul dorso
    return c
  },
  collie (R, x, y, z, c) {
    c.setHex(NERO)
    if (zonaOrecchio(x, y, z) && y > 0.82) return c
    const collare = COLLO(x, y, z)
    let b = Math.max(pancia(x, y, z), petto(x, y, z), muso(R, x, y, z), fiamma(x, y, z) * 1.2, collare * fra(0.03, -0.01, mosso(x, y, z, 30)) + collare * 0.7)
    if (zonaZampa(x, y, z)) b = Math.max(b, z > 0 ? fra(0.3, 0.24, y) : fra(0.2, 0.15, y))
    if (zonaCoda(x, y, z)) b = fra(0.33, 0.29, y)
    verso(c, BIANCO, Math.min(1, b))
    return verso(c, 0x6b6466, (1 - b) * 0.12 * fra(0.0, 1.0, mosso(x, y, z, 70)))                    // qualche pelo grigio nel nero
  },
  dalmata (R, x, y, z, c) {
    c.setHex(0xf3f0ea)
    if (zonaOrecchio(x, y, z)) return verso(c, NERO, 0.7 + 0.3 * macchie(x, y, z, { lato: 0.03, rMin: 0.012, rMax: 0.02, seme: 7, quante: 0.9 }))
    const fitte = muso(R, x, y, z) > 0.5 || zonaZampa(x, y, z) && y < 0.2
    const m = macchie(x, y, z, fitte ? { lato: 0.045, rMin: 0.009, rMax: 0.015, seme: 3, quante: 0.6 } : { lato: 0.075, rMin: 0.017, rMax: 0.03, seme: 2, quante: 0.8 })
    verso(c, NERO, m)
    const occhio = Math.hypot(x + 0.06, y - 0.79, z - 0.52)                                          // una macchia attorno a un occhio: gli dà un carattere
    return verso(c, NERO, fra(0.035, 0.028, occhio))
  },
}
const coloreDi = R => (x, y, z, c) => {
  MANTELLI[R.manto](R, x, y, z, c)
  return c.multiplyScalar(0.86 + 0.14 * fra(0.3, 0.6, y))                                          // un filo più scuro sotto: dà volume senza luci
}

// ══════════ il modello ══════════
function carne (pernoDi, chiave, forma, { min, max, passo, colore, centro, ruvido = 0.82 }) {
  const fai = k => pelle(forma, { min, max, passo: passo * k, colore, centro })
  const alta = () => G(chiave, () => fai(1)), bassa = () => G(chiave + ':lod', () => fai(LOD))
  const m = new THREE.Mesh(PARTENZA.lontano ? bassa() : alta(), mat(0xffffff, { vertexColors: true, flatShading: false, roughness: ruvido }))
  m.castShadow = m.receiveShadow = true; m.userData.lod = { alta, bassa }; pernoDi.add(m)
  return m
}
const da = (p, o) => [p[0] - o[0], p[1] - o[1], p[2] - o[2]]
const CIMA_ZAMPA = 0.44
/** La zampa allungata di `a` in cima e ferma a terra: la forma e i colori si leggono nel cane di base. */
function allunga (forma, colore, a) {
  if (!a) return { forma, colore }
  const k = 1 + a / CIMA_ZAMPA, base = y => (y <= CIMA_ZAMPA + a ? y / k : y - a)
  return { forma: { ...forma, f: (x, y, z) => forma.f(x, base(y), z) }, colore: (x, y, z, c) => colore(x, base(y), z, c) }
}

/** Un cane di razza (`RAZZE_CANE`): i perni del beagle (corpo, posteriore, testa, frangia, lingua, orecchie, zampe, occhi), la carne nella creta. */
export function creaCaneDiRazza (razza = 'beagle') {
  const R = RAZZE_CANE[razza] || RAZZE_CANE.beagle, k = 'cane:' + R.manto, colore = coloreDi(R)
  const g = new THREE.Group()
  const a = R.alzo || 0
  const corpo = perno(g, O_CORPO[0], O_CORPO[1] + a, O_CORPO[2])                                  // tutto quello che sta sul corpo sale con lui
  carne(corpo, k + ':corpo', formaCorpo(R), { min: [-0.2, 0.28, -0.44], max: [0.2, 0.8, 0.42], passo: PASSO.corpo * (R.fitto || 1), colore, centro: O_CORPO })
  const posteriore = perno(corpo, ...da(BASE_CODA, O_CORPO))
  carne(posteriore, k + ':coda', formaCoda(R), { min: [-0.07, 0.2, -0.74], max: [0.07, 0.96, -0.34], passo: PASSO.coda, colore, centro: BASE_CODA })
  const testa = perno(corpo, ...da(O_TESTA, O_CORPO))
  carne(testa, k + ':testa', formaTesta(R), { min: [-0.15, 0.6, 0.27], max: [0.15, 0.92, 0.72], passo: PASSO.testa, colore, centro: O_TESTA, ruvido: 0.78 })
  const nn = formaNaso(R)
  const naso = carne(testa, k + ':naso', nn.forma, { min: somma(nn.c, [-0.05, -0.05, -0.05]), max: somma(nn.c, [0.05, 0.04, 0.05]), passo: PASSO.naso, colore: (x, y, z, c) => c.setHex(R.naso), centro: O_TESTA, ruvido: 0.3 })
  const occhi = [-1, 1].map(s => {
    const o = new THREE.Mesh(G('cane-occhio', () => new THREE.SphereGeometry(0.029, 20, 16)), mat(R.occhi, { roughness: 0.12, flatShading: false }))
    o.position.set(...da(somma(OCCHIO(s), [0, 0, -0.004]), O_TESTA)); o.castShadow = false; testa.add(o)
    const luce = new THREE.Mesh(G('cane-luce', () => new THREE.SphereGeometry(0.008, 10, 8)), mat(0xffffff, { roughness: 0.2, flatShading: false, emissive: 0x666666 }))
    luce.position.set(s * 0.003 + 0.007, 0.011, 0.023); luce.castShadow = false; o.add(luce)
    return o
  })
  const frangia = perno(testa, 0, 0.3, 0.05)                                                     // senza pelo lungo sugli occhi: un perno fermo (la posa lo cerca)
  const lg = formaLingua(R)
  const lingua = perno(testa, ...da(lg.c, O_TESTA))
  carne(lingua, k + ':lingua', lg.forma, { min: somma(lg.c, [-0.04, -0.03, -0.03]), max: somma(lg.c, [0.04, 0.02, 0.08]), passo: PASSO.lingua, colore: (x, y, z, c) => c.setHex(0xe86f86), centro: lg.c, ruvido: 0.45 })
  const orecchie = [-1, 1].map(s => {
    const a = ATTACCO(s), p = perno(testa, ...da(a, O_TESTA))
    carne(p, `${k}:orecchio${s}`, formaOrecchio(R, s), { min: somma(a, [-0.09, -0.3, -0.1]), max: somma(a, [0.09, 0.16, 0.1]), passo: PASSO.orecchio, colore, centro: a })
    p.userData.giro = s * (R.orecchie === 'semi' ? 0.04 : 0.1); return p
  })
  const zampe = ZAMPE.map((z, i) => {
    const su = [z[0], z[1] * (1 + a / CIMA_ZAMPA), z[2]], p = perno(g, ...su), x = z[0] * R.w, lunga = allunga(formaZampa(R, i), colore, a)
    carne(p, `${k}:zampa${i}`, lunga.forma, { min: [x - 0.08, 0, i > 1 ? -0.42 : 0.1], max: [x + 0.08, 0.52 + a, i > 1 ? -0.15 : 0.3], passo: PASSO.zampa * (R.fitto || 1), colore: lunga.colore, centro: su })
    return p
  })
  const bastone = new THREE.Mesh(G('beagle-bastone', () => new THREE.CylinderGeometry(0.014, 0.018, 0.4, 6)), mat(0x8a5a2b))
  bastone.position.set(...da([0, 0.665, 0.64], O_TESTA)); bastone.rotation.z = Math.PI / 2; bastone.visible = false; bastone.castShadow = false; testa.add(bastone)
  bastone.userData.base = { p: bastone.position.clone(), r: bastone.rotation.clone() }
  for (const p of [corpo, posteriore, testa, frangia, lingua, ...orecchie, ...zampe]) p.userData.base = p.position.clone()
  orecchie.forEach(o => { o.rotation.z = o.userData.giro })
  zonaTocco(g, 0.5, 0.42)
  g.userData = { ...g.userData, corpo, posteriore, testa, frangia, orecchie, lingua, naso, occhi, zampe, bastone, tipo: 'cane', scheletro: 'beagle', razza: razza in RAZZE_CANE ? razza : 'beagle', scala: R.scala, alzo: a }
  return g
}
