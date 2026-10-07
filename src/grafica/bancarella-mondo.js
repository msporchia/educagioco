// I disegni del giro del mondo e delle piazze della bancarella: forme piatte,
// pulite, in stringhe SVG (niente sfumature, niente emoji). Stessi colori
// della copertina del gioco in home: la tenda #e8553f, il fondo #ffd36b.
// Quando arrivano i fondali dipinti (data/bancarella-fondali.js) prendono il
// posto del mare, delle terre e del cielo; i monumenti, le piste, i banchi,
// il carretto e l'aereo restano questi. Vedi docs/bancarella/mappa.md.
import { sorte } from '../motore/asteroidi/rotta.js'

export const TENDA = '#e8553f'
export const GIALLO = '#ffd36b'
const CREMA = '#fffaf0'
const LEGNO = '#b9844f'

const R = (x, y, w, h, f, e = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${e}/>`
const Pg = (p, f, e = '') => `<polygon points="${p}" fill="${f}"${e}/>`
const Ci = (x, y, r, f, e = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"${e}/>`
const El = (x, y, a, b, f, e = '') => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="${f}"${e}/>`
const Pa = (d, f, e = '') => `<path d="${d}" fill="${f}"${e}/>`
const Li = (d, k, w, e = '') => `<path d="${d}" fill="none" stroke="${k}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${e}/>`

/* Una curva chiusa liscia per i punti dati (una Catmull-Rom fatta Bézier). */
export function liscia(punti, chiusa = true) {
  const n = punti.length
  const P = i => punti[chiusa ? (i + n) % n : Math.max(0, Math.min(n - 1, i))]
  let d = `M${punti[0][0]} ${punti[0][1]}`
  const fine = chiusa ? n : n - 1
  for (let i = 0; i < fine; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2)
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ` +
         `${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]} ${p2[1]}`
  }
  return d + (chiusa ? 'Z' : '')
}

/* ═══════════ il mondo ═══════════ */

const MARE = '#bfe3f2', ONDA = '#a4d3e8'
const VERDE = '#c9e7a0', VERDE2 = '#b5d98a', SABBIA = '#f1e0a6', SABBIA2 = '#e6cf8c', NEVE = '#f1f7f7'

// le terre: stilizzate, non geografia — solo quanto basta a dire dove sta ogni città
const TERRE = [
  // Nord America (e la striscia dell'America centrale)
  [VERDE, [[72, 168], [104, 120], [176, 92], [262, 90], [336, 106], [388, 136], [394, 178], [366, 200], [340, 222],
           [346, 258], [326, 292], [330, 326], [304, 322], [284, 350], [248, 346], [226, 352], [242, 392], [270, 410],
           [300, 428], [330, 452], [348, 474], [322, 466], [294, 452], [262, 428], [236, 412], [206, 376], [168, 322],
           [130, 266], [102, 226], [76, 196]]],
  // Sud America
  [VERDE, [[336, 470], [392, 462], [452, 478], [500, 518], [524, 570], [510, 616], [484, 652], [458, 702], [434, 758],
           [410, 754], [402, 702], [392, 640], [372, 590], [350, 540], [334, 500]]],
  // Groenlandia
  [NEVE, [[418, 60], [470, 40], [532, 46], [548, 82], [514, 116], [470, 126], [430, 104]]],
  // Eurasia, con l'Iberia, l'India e la penisola dell'Italia
  [VERDE, [[434, 312], [428, 270], [438, 238], [466, 226], [472, 196], [482, 160], [510, 138], [552, 106], [620, 74],
           [700, 58], [792, 50], [900, 46], [1002, 56], [1090, 82], [1134, 130], [1140, 190], [1118, 236], [1086, 284],
           [1064, 334], [1032, 380], [1008, 426], [974, 470], [944, 440], [918, 410], [892, 440], [872, 482], [850, 440],
           [838, 394], [818, 360], [790, 350], [760, 338], [730, 322], [704, 332], [694, 352], [700, 382], [690, 404],
           [664, 392], [648, 360], [630, 326], [606, 308], [578, 324], [540, 334], [490, 326], [458, 322]]],
  // l'isola grande a ovest dell'Europa
  [VERDE, [[400, 182], [418, 160], [440, 168], [440, 198], [420, 214], [402, 206]]],
  // il Giappone
  [VERDE, [[1068, 214], [1092, 226], [1100, 262], [1086, 306], [1062, 330], [1048, 312], [1060, 272]]],
  // Africa
  [SABBIA, [[560, 440], [612, 424], [690, 424], [772, 418], [832, 436], [872, 470], [892, 530], [868, 590], [830, 650],
            [782, 708], [736, 734], [700, 700], [676, 628], [640, 570], [596, 530], [566, 486]]],
  // Madagascar
  [SABBIA, [[866, 612], [884, 600], [892, 640], [878, 676], [862, 660]]],
  // Australia, solo da guardare
  [SABBIA, [[900, 600], [974, 580], [1056, 588], [1100, 626], [1086, 690], [1024, 712], [950, 700], [908, 660]]],
  // il ghiaccio in fondo
  [NEVE, [[120, 770], [220, 744], [420, 752], [680, 744], [900, 750], [1100, 744], [1152, 760], [1152, 790], [100, 790]]],
]

// i colori delle chiazze sopra le terre: boschi, colline, dune
const MACCHIE = [
  [VERDE2, [[170, 150, 54, 24], [250, 190, 62, 28], [300, 270, 42, 22], [200, 300, 36, 20], [290, 120, 40, 14]]],
  [VERDE2, [[440, 560, 36, 54], [470, 640, 26, 40], [400, 520, 40, 22]]],
  [VERDE2, [[560, 150, 52, 24], [760, 110, 90, 26], [920, 150, 70, 34], [1020, 230, 46, 34], [830, 260, 60, 30]]],
  [SABBIA2, [[700, 500, 70, 30], [780, 580, 48, 38], [640, 470, 40, 20]]],
  [SABBIA2, [[1000, 640, 50, 22]]],
]

/* il mare, le terre, le onde e le nuvole: tutto quello che sta sotto le città */
export function disegnaMondo(W, H) {
  let s = R(0, 0, W, H, MARE)
  const caso = sorte(11)
  for (let i = 0; i < 34; i++) {
    const x = caso() * (W - 30), y = caso() * (H - 20)
    s += Li(`M${x.toFixed(0)} ${y.toFixed(0)}q6 -6 12 0q6 6 12 0`, ONDA, 2)
  }
  for (const [f, pts] of TERRE) s += Pa(liscia(pts), f)
  for (const [f, lista] of MACCHIE) for (const [x, y, a, b] of lista) s += El(x, y, a, b, f)
  // i monti di ogni terra, due triangoli piatti
  for (const [x, y] of [[236, 214], [850, 300], [944, 130], [710, 200], [436, 548], [700, 540]])
    s += Pg(`${x - 16},${y + 12} ${x},${y - 14} ${x + 16},${y + 12}`, '#a8c984') + Pg(`${x},${y - 14} ${x + 5},${y - 5} ${x - 5},${y - 5}`, NEVE)
  return s
}

/* le nuvole stanno sopra il mondo e sotto l'aereo: un poco trasparenti */
export function nuvole() {
  let s = ''
  for (const [x, y, k] of [[150, 60, 1], [560, 40, 0.8], [1000, 140, 1.1], [330, 420, 0.9], [940, 520, 1], [610, 690, 1.1],
                           [120, 640, 0.9], [780, 250, 0.7], [250, 160, 0.7]])
    s += `<g opacity=".72" transform="translate(${x} ${y}) scale(${k})">` + El(0, 0, 34, 9, '#fff') +
         El(20, -7, 20, 9, '#fff') + El(-18, -5, 16, 7, '#fff') + `</g>`
  return s
}

/* ═══════════ i monumenti ═══════════
   Ognuno in un riquadro 64×64, con la base a y=62. Servono due volte: piccoli
   accanto al segnaposto sul mondo, grandi nel cielo della loro piazza. */
export const MONUMENTI = {
  torri: () =>
    Pg('12,62 25,62 27,30 14,32', '#b8573f') + Pg('12,62 25,62 26,46 13,46', '#a54a35') +
    Pg('13,32 27,30 20,22', '#7a3a2c') + R(32, 8, 12, 54, '#c8553d') + R(32, 8, 12, 5, '#a54a35') +
    Pg('32,8 44,8 38,0', '#7a3a2c') + R(32, 38, 12, 24, '#b34d37') +
    [18, 26, 34, 46].map(y => R(36, y, 4, 5, '#5b2a20')).join('') + R(16, 40, 5, 6, '#5b2a20') + R(16, 52, 5, 6, '#5b2a20') +
    R(2, 60, 60, 2.5, '#8a7d6b'),
  colosseo: () =>
    Pa('M3 62V34Q3 22 32 20Q61 22 61 34V62Z', '#e2c48d') + Pa('M3 62V46H61V62Z', '#d4b27a') +
    [0, 1, 2].map(r => [0, 1, 2, 3, 4, 5].map(k =>
      Pa(`M${8 + k * 9} ${26 + r * 12 + 9}V${26 + r * 12 + 4}a3.5 3.5 0 0 1 7 0V${26 + r * 12 + 9}Z`, '#a98350')).join('')).join('') +
    Pa('M3 34Q3 22 32 20Q61 22 61 34', 'none', ' stroke="#b99159" stroke-width="2"') + R(2, 60, 60, 2.5, '#8a7d6b'),
  torre: () =>
    Pg('30,2 34,2 36,22 28,22', '#4e5a74') + Pg('28,22 36,22 40,42 24,42', '#4e5a74') + R(24, 40, 16, 4, '#39435a') +
    Pg('24,42 40,42 46,62 38,62 32,50 26,62 18,62', '#4e5a74') + R(26, 20, 12, 3, '#39435a') +
    Pa('M26 62Q32 46 38 62', 'none', ' stroke="#4e5a74" stroke-width="3"') + Li('M32 2V-4', '#4e5a74', 1.5),
  statua: () =>
    R(20, 48, 24, 14, '#cfc7b4') + R(17, 58, 30, 4, '#b4ab96') + Pg('25,50 27,26 37,26 39,50', '#6fb59f') +
    Pg('27,26 25,40 29,40', '#5aa08a') + Ci(32, 20, 5.5, '#6fb59f') +
    [-12, -6, 0, 6, 12].map(a => Pg(`${32 + a * 0.6},${18} ${32 + a * 1.6},${10 + Math.abs(a) * 0.3} ${32 + a * 0.6 + 2},${18}`, '#5aa08a')).join('') +
    Li('M36 28L44 14', '#6fb59f', 4) + Pg('41,12 47,12 44,2', '#ffc83d') + R(21, 46, 22, 3, '#a9a08a'),
  cristo: () =>
    Pa('M0 62Q32 12 64 62Z', '#8bc16a') + Pa('M10 62Q32 24 54 62Z', '#79b05a') +
    R(29.5, 14, 5, 24, '#eceae2') + R(12, 19, 40, 4.5, '#eceae2') + Ci(32, 11, 4, '#eceae2') + R(26, 36, 12, 5, '#d8d5ca'),
  torii: () =>
    Pg('2,62 32,22 62,62', '#9fb4d6') + Pg('32,22 24,34 29,31 32,36 35,31 40,34', NEVE) +
    R(14, 26, 5, 36, '#d9482f') + R(45, 26, 5, 36, '#d9482f') +
    Pg('6,22 58,22 54,28 10,28', '#c23d27') + R(8, 18, 48, 5, '#2f3340') + R(14, 34, 36, 4, '#d9482f'),
  piramidi: () =>
    Pg('2,62 28,18 54,62', '#e8c872') + Pg('28,18 54,62 28,62', '#c9a05a') +
    Pg('36,62 52,36 64,62', '#e3bf66') + Pg('52,36 64,62 52,62', '#c9a05a') +
    Pg('0,62 12,46 22,62', '#ecd080') + Pg('12,46 22,62 12,62', '#c9a05a'),
}

export const monumento = (id, x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})">${(MONUMENTI[id] || (() => ''))()}</g>`

/* la piccola pista dove si posa l'aereo, accanto al segnaposto */
export const pista = (x, y) =>
  R(x - 25, y - 11, 50, 22, '#8d96a1', ` rx="11"`) +
  Li(`M${x - 15} ${y}H${x - 7}M${x - 3} ${y}H${x + 5}M${x + 9} ${y}H${x + 17}`, '#fff', 2.5)

/* ═══════════ l'aereo ═══════════
   Visto dall'alto, col muso verso destra (angolo 0): fusoliera bianca, ali e
   coda rosse come la tenda. L'ombra è lo stesso disegno, scuro. */
const K = ' stroke="#2b3a57" stroke-width="1.5" stroke-linejoin="round"'
export const AEREO = () =>
  Pa('M-3 -3L-11 -19L-5 -19L8 -3Z', TENDA, K) + Pa('M-3 3L-11 19L-5 19L8 3Z', TENDA, K) +
  Pa('M-14 -2L-19 -9L-15 -9L-9 -2Z', TENDA, K) + Pa('M-14 2L-19 9L-15 9L-9 2Z', TENDA, K) +
  El(0, 0, 17, 4.4, '#fff', K) + Pa('M9 -2.8Q15 0 9 2.8Z', '#2f6fd0') + El(5, 0, 2.8, 1.5, '#6fb3e0')
export const OMBRA_AEREO = () =>
  Pa('M-3 -3L-11 -19L-5 -19L8 -3Z', '#000') + Pa('M-3 3L-11 19L-5 19L8 3Z', '#000') +
  Pa('M-14 -2L-19 -9L-15 -9L-9 -2Z', '#000') + Pa('M-14 2L-19 9L-15 9L-9 2Z', '#000') + El(0, 0, 17, 4.4, '#000')

/* ═══════════ la piazza ═══════════ */

// ogni città ha un cielo e un selciato suoi
export const COLORI_PIAZZA = {
  bologna: { cielo: '#f6dcc2', selciato: '#e4cfa9', case: ['#e9b490', '#d98f6f', '#f0c9a0', '#c9785a'] },
  roma: { cielo: '#fbe3b0', selciato: '#e6d2ae', case: ['#e8cf9c', '#d9b87a', '#eedcae', '#c9a468'] },
  parigi: { cielo: '#d5dff2', selciato: '#d9d6cf', case: ['#efe6d3', '#e2d6bd', '#dcd2bb', '#f2eadb'] },
  'new-york': { cielo: '#bcd3ea', selciato: '#d3d6db', case: ['#7d8da1', '#6d7d92', '#8f9eb2', '#5f7088'] },
  rio: { cielo: '#bfeaf0', selciato: '#f1e2b0', case: ['#f3c25c', '#e4795e', '#6fb59f', '#f0a0c0'] },
  tokyo: { cielo: '#f6d6e0', selciato: '#e3dfe8', case: ['#f3e7d3', '#e8d5b5', '#ead9e3', '#d8c9d4'] },
  cairo: { cielo: '#fbe3b0', selciato: '#ecd7a0', case: ['#efd9a6', '#e3c689', '#f0e0b4', '#d9b873'] },
}

/* il cielo della piazza: il sole, le nuvole, una fila di case, il monumento
   grande al centro e i festoni fra le case; sotto, il selciato, la fontana in
   fondo al viale (`fontana`: dove) e i vasi di lato. `H` è l'altezza della
   scena. */
export function disegnaPiazza(id, monu, W, H, cielo, accento = TENDA, fontana = null) {
  const c = COLORI_PIAZZA[id] || COLORI_PIAZZA.roma
  const caso = sorte(id.length * 977 + 3)
  let s = R(0, 0, W, cielo + 40, c.cielo)
  s += Ci(W * 0.16, 52, 20, '#fff4c4', ' opacity=".9"')
  for (const [x, y, k] of [[W * 0.74, 44, 1], [W * 0.38, 28, 0.7], [W * 0.9, 96, 0.8]])
    s += `<g opacity=".85" transform="translate(${x.toFixed(0)} ${y}) scale(${k})">` + El(0, 0, 30, 8, '#fff') + El(16, -6, 18, 8, '#fff') + `</g>`
  // le case dietro, tutte alla stessa base
  const base = cielo - 6
  let x = -10
  while (x < W + 10) {
    const w = 38 + caso() * 30, h = 34 + caso() * 46
    const f = c.case[Math.floor(caso() * c.case.length)]
    s += R(x.toFixed(0), (base - h).toFixed(0), w.toFixed(0), h.toFixed(0), f)
    s += Pg(`${x.toFixed(0)},${(base - h).toFixed(0)} ${(x + w).toFixed(0)},${(base - h).toFixed(0)} ${(x + w / 2).toFixed(0)},${(base - h - 12).toFixed(0)}`, '#00000022')
    for (let k = 0; k < 2; k++) s += R((x + 6 + k * (w / 2 - 2)).toFixed(0), (base - h + 10).toFixed(0), 7, 9, '#00000026')
    x += w + 2
  }
  // il monumento, grande, davanti alle case
  s += monumento(monu, W / 2 - 78, cielo - 150, 2.45)
  // i festoni: un filo che pende fra le case, con le bandierine
  const y0 = cielo - 96, giu = 26
  s += Li(`M-4 ${y0}Q${W / 2} ${y0 + giu * 2} ${W + 4} ${y0}`, '#6b5a44', 1.6)
  for (let i = 1; i < 14; i++) {
    const t = i / 14, u = 1 - t
    const px = u * u * -4 + 2 * u * t * (W / 2) + t * t * (W + 4), py = u * u * y0 + 2 * u * t * (y0 + giu * 2) + t * t * y0
    s += Pg(`${(px - 7).toFixed(1)},${(py - 1).toFixed(1)} ${(px + 7).toFixed(1)},${(py - 1).toFixed(1)} ${px.toFixed(1)},${(py + 15).toFixed(1)}`,
            i % 3 === 0 ? GIALLO : i % 3 === 1 ? accento : CREMA)
  }
  // il selciato: lastre quadre, appena appena a scacchi
  s += R(0, cielo - 6, W, H - cielo + 6, c.selciato)
  s += `<g fill="#000" fill-opacity=".035">`
  for (let y = cielo + 14, r = 0; y < H; y += 30, r++)
    for (let xx = (r % 2) * 30; xx < W; xx += 60) s += `<rect x="${xx}" y="${y}" width="30" height="30"/>`
  s += `</g><g stroke="#000" stroke-opacity=".06" stroke-width="1.5" fill="none">`
  for (let y = cielo + 14; y < H; y += 30) s += `<path d="M0 ${y}H${W}"/>`
  for (let xx = 0; xx < W; xx += 30) s += `<path d="M${xx} ${cielo + 14}V${H}"/>`
  s += `</g>` + R(0, cielo - 6, W, 4, '#00000018')
  // la fontana in fondo al viale
  if (fontana) {
    const { x: fx, y: fy } = fontana
    s += El(fx, fy + 12, 38, 14, '#00000020') + El(fx, fy + 6, 36, 14, '#d9d4c7') + El(fx, fy + 2, 32, 11, '#a9d9ec') +
         R(fx - 4, fy - 22, 8, 26, '#d9d4c7') + El(fx, fy - 24, 14, 5, '#cfc9ba') +
         Li(`M${fx} ${fy - 28}Q${fx - 20} ${fy - 38} ${fx - 24} ${fy - 4}M${fx} ${fy - 28}Q${fx + 20} ${fy - 38} ${fx + 24} ${fy - 4}`, '#d6f0fa', 2.4)
  }
  // i vasi con l'alberello, ai due lati sotto le case
  for (const vx of [18, W - 18])
    s += R(vx - 9, cielo + 22, 18, 14, '#c8754a', ' rx="2"') + Ci(vx, cielo + 12, 15, '#5f9e4d') + Ci(vx - 8, cielo + 18, 9, '#4f8f45') + Ci(vx + 8, cielo + 18, 9, '#4f8f45')
  return s
}

/* il viale: una fascia di selciato più chiara, dal cartello fino in cima ai banchi */
export const viale = (centro, da, a) =>
  R(centro - 26, a, 52, da - a, '#ffffff55', ' rx="6"') +
  Li(`M${centro} ${a + 6}V${da - 6}`, '#ffffff99', 2, ' stroke-dasharray="2 12"')

/* Un banco visto di fronte: tenda a strisce col bordo smerlato, due pali, il
   piano di legno e la merce. Largo 124 e alto 108. `stato`: fatta, ora,
   aperta, chiusa; `colori` sono quelli delle sue ceste. */
export function disegnaBanco(accento, stato, colori = []) {
  const chiuso = stato === 'chiusa'
  const a = chiuso ? '#98a1ac' : accento, b = chiuso ? '#d6dbe0' : CREMA
  let s = R(12, 30, 5, 78, chiuso ? '#8d96a0' : '#8a6a46') + R(107, 30, 5, 78, chiuso ? '#8d96a0' : '#8a6a46')
  // la merce dietro il piano
  if (!chiuso) {
    const tutti = colori.length ? colori : ['#e2523e', '#5fae4a', '#f2c14e']
    for (let i = 0; i < 6; i++) {
      const c = tutti[i % tutti.length]
      s += Ci(26 + i * 14.4, 66, 7, c) + Ci(24 + i * 14.4, 64, 2, '#ffffff66')
    }
  }
  s += R(14, 74, 96, 34, chiuso ? '#a3acb6' : LEGNO) + R(8, 70, 108, 7, chiuso ? '#b7bfc8' : '#d7a56b')
  s += Li('M40 77V108M62 77V108M84 77V108', chiuso ? '#8c95a0' : '#9c6b3a', 1.5)
  if (chiuso) s += R(14, 50, 96, 58, '#8b95a1') + Li('M14 62H110M14 74H110M14 86H110M14 98H110', '#737d89', 2) + R(54, 100, 16, 5, '#5e6772', ' rx="2"')
  // la tenda: sette strisce che si allargano, e il bordo smerlato
  for (let j = 0; j < 7; j++) {
    const t0 = 12 + 14.3 * j, b0 = 4 + 116 / 7 * j, b1 = b0 + 116 / 7
    const f = j % 2 ? b : a
    s += Pg(`${t0.toFixed(1)},4 ${(t0 + 14.3).toFixed(1)},4 ${b1.toFixed(1)},36 ${b0.toFixed(1)},36`, f)
    s += Pa(`M${b0.toFixed(1)} 36A${(116 / 14).toFixed(1)} 8 0 0 0 ${b1.toFixed(1)} 36Z`, f)
  }
  s += Li('M12 4H112', '#2d3748', 2, ' stroke-opacity=".25"')
  return s
}

/* ═══════════ il carretto ═══════════
   Di fronte, simmetrico: non ha un verso, e quando si muove balla un poco
   (lo fa la vista). Largo 40, alto 38, i piedi a y=38. */
export const CARRETTO = () =>
  Li('M20 4V20', '#8a6a46', 2.5) + Pg('4,10 36,10 20,0', TENDA) + Pg('12,10 28,10 20,0', CREMA) +
  Pg('2,12 38,12 36,10 4,10', TENDA) +
  R(3, 20, 34, 12, '#b9844f', ' rx="2"') + R(3, 20, 34, 3.5, '#d7a56b', ' rx="1.5"') +
  Ci(12, 22, 3.2, '#e2523e') + Ci(19, 21, 3.2, '#5fae4a') + Ci(26, 22, 3.2, '#f2c14e') + Ci(32, 21.5, 3, '#e2523e') +
  Ci(11, 35, 4.6, '#3e3226') + Ci(11, 35, 1.6, '#c9b99a') + Ci(29, 35, 4.6, '#3e3226') + Ci(29, 35, 1.6, '#c9b99a')

/* il cartello che riporta al mondo: un palo, l'asse con un aereo e una freccia */
export const CARTELLO = () =>
  R(36, 40, 6, 52, '#8a6a46') + R(34, 86, 10, 5, '#6d5236') +
  R(2, 6, 74, 40, '#f1d9a3', ' rx="7" stroke="#7a5a3a" stroke-width="3"') +
  `<g transform="translate(26 26) scale(.9)">` + AEREO() + `</g>` +
  Pa('M50 26H66M60 19L67 26L60 33', 'none', ' stroke="#7a5a3a" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"')
