// Il cibo della cucina e la roba in dispensa, modellati nella creta (docs/fattoria3d/creta.md) e, dove servono
// tanti fili, a tubi. Ogni modello si fa una volta (`G`) e poi si clona. Vedi docs/bancarella/cucina.md.
import { Group, Mesh, MeshStandardMaterial, BufferGeometry, BufferAttribute, CatmullRomCurve3, TubeGeometry, CylinderGeometry, SphereGeometry,
         LatheGeometry, Vector2, Vector3, Color } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { palla, osso, unione, meno, dentro, sopra, sotto, girata, arruffata, pelle, scatolaDi, fra, verso, mosso } from '../../giochi/fattoria3d/scena3d/creta.js'

/* ── gli attrezzi del modellare ── */
const opaco = (lucido = 0.72) => new MeshStandardMaterial({ vertexColors: true, roughness: lucido, metalness: 0 })
export const pieno = (color, roughness = 0.7, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness })
// le maglie: qui ogni pezzo si fa sul telefono mentre si apre la cucina, e sta a un metro dalla telecamera
const MAGLIA = 1.75
const pezzo = (forma, passo, colore, lucido) => new Mesh(pelle(forma, { ...scatolaDi(forma, 0.04), passo: passo * MAGLIA, colore }), opaco(lucido))
const tutto = (...pezzi) => { const g = new Group(); g.add(...pezzi); return g }
const su = (o, x = 0, y = 0, z = 0, gira = 0) => { o.position.set(x, y, z); o.rotation.y = gira; return o }

/** Un disco dai bordi tondi: raggio `r`, alto `h`, centrato a quota `y`, spigolo `b`. */
function disco(y, r, h, b = 0.03) {
  const f = (px, py, pz) => {
    const qx = Math.hypot(px, pz) - r + b, qy = Math.abs(py - y) - h / 2 + b
    return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - b
  }
  return { f, c: [0, y, 0], r: Math.hypot(r, h / 2) }
}
/** Un anello: il cerchio di raggio `R` a quota `y`, grosso `r`. */
const ciambella = (y, R, r, sy = 1) => ({
  f: (px, py, pz) => Math.hypot(Math.hypot(px, pz) - R, (py - y) / sy) - r, c: [0, y, 0], r: R + r * Math.max(1, sy),
})
/** Un foglio sottile che segue `quota(x, z)`, dentro il cerchio di raggio `R` o il quadrato di mezzo lato `L`. */
function foglio(quota, { R = 0, L = 0, t = 0.02, y = 0 }) {
  const f = (px, py, pz) => {
    const bordo = R ? Math.hypot(px, pz) - R : Math.max(Math.abs(px), Math.abs(pz)) - L
    return Math.max((Math.abs(py - quota(px, pz)) - t) * 0.6, bordo)
  }
  return { f, c: [0, y, 0], r: (R || L * 1.45) + 0.1 }
}
const sposta = (forma, dx, dy, dz) => ({ f: (x, y, z) => forma.f(x - dx, y - dy, z - dz), c: [forma.c[0] + dx, forma.c[1] + dy, forma.c[2] + dz], r: forma.r })

/* ── i pezzi ── */
const SPAGO = 0xf0cc6a

// un filo che gira attorno al mucchio, e tanti fili fanno il nido
function filo(seme, largo, alto, giri) {
  const punti = []
  for (let i = 0; i <= 26; i++) {
    const t = i / 26, a = seme * 2.4 + t * giri * Math.PI * 2
    const r = largo * (0.18 + 0.82 * Math.abs(Math.sin(t * Math.PI * 1.5 + seme))) * (0.88 + 0.12 * Math.sin(a * 2.3 + seme))
    punti.push(new Vector3(Math.cos(a) * r, 0.03 + alto * (1 - (r / largo) ** 2) * (0.7 + 0.3 * Math.sin(t * 9 + seme)), Math.sin(a) * r))
  }
  return new TubeGeometry(new CatmullRomCurve3(punti), 58, 0.026, 5, false)
}
function nido(colore = SPAGO, largo = 0.62, alto = 0.3) {
  const g = mergeGeometries(Array.from({ length: 16 }, (_, i) => filo(i * 1.37 + 0.4, largo, alto, 1.5 + (i % 3) * 0.5)))
  return new Mesh(g, pieno(colore, 0.42))
}

function foglia(lungo = 0.2, largo = 0.1, colore = 0x3f8a3a) {
  const forma = unione([palla([0, 0, 0], [largo, 0.018, lungo]), osso([0, 0.012, -lungo * 0.9], [0, 0.012, lungo * 0.9], 0.009, 0.004)], 0.01)
  return pezzo(forma, 0.012, (x, y, z, c) => {
    c.setHex(colore)
    verso(c, 0x77b955, fra(0.05, 0, Math.abs(x)) * 0.55)
    verso(c, 0x77b955, fra(0.55, 0.9, Math.abs(Math.sin(z * 34 + Math.abs(x) * 26))) * 0.22)
  }, 0.42)
}

function sugo() {
  const pezzi = [palla([0, 0.05, 0], [0.42, 0.075, 0.4]), palla([0.2, 0.05, 0.16], [0.2, 0.06, 0.18]), palla([-0.22, 0.05, 0.1], [0.2, 0.06, 0.22]), palla([0.06, 0.05, -0.24], [0.24, 0.06, 0.18])]
  const forma = arruffata(unione(pezzi, 0.09), 0.009, 24)
  const g = tutto(pezzo(forma, 0.021, (x, y, z, c) => {
    c.setHex(0xc22a18)
    verso(c, 0xe2502c, fra(-0.4, 0.5, mosso(x, y, z, 12)) * 0.55)
    verso(c, 0x8e1a0e, fra(0.4, 0.8, mosso(z, x, y, 22)) * 0.6)
  }, 0.24))
  for (const [x, z, a] of [[0.03, -0.03, 0.6], [0.13, 0.03, -0.9]]) { const f = foglia(0.15, 0.08); f.rotation.y = a; f.position.set(x, 0.13, z); f.rotation.z = 0.12; g.add(f) }
  return g
}

function fondoPanino() {
  const forma = dentro(dentro(palla([0, 0.13, 0], [0.58, 0.2, 0.58]), sotto(0.17), 0.012), sopra(0), 0.03)
  return pezzo(forma, 0.021, (x, y, z, c, nx, ny) => {
    c.setHex(0xc98438)
    verso(c, 0x96591f, fra(0.1, 0, y) * 0.65)
    if (ny > 0.75) {
      c.setHex(0xf3deb0)
      verso(c, 0xdcbb7f, fra(0.25, 0.55, mosso(x, 3, z, 38)) * 0.7)
      verso(c, 0xc98438, fra(0.47, 0.56, Math.hypot(x, z)))
    }
  }, 0.72)
}

function semi() {
  const pezzi = []
  for (let i = 0; i < 46; i++) {
    const a = i * 2.4, r = 0.46 * Math.sqrt((i + 1) / 47)
    const g = new SphereGeometry(0.024, 6, 5)
    g.scale(1, 0.5, 1.6); g.rotateY(a * 1.7)
    g.translate(Math.cos(a) * r, 0.33 * Math.sqrt(Math.max(0, 1 - (r / 0.57) ** 2)) + 0.012, Math.sin(a) * r)
    pezzi.push(g)
  }
  return new Mesh(mergeGeometries(pezzi), pieno(0xf6e7bd, 0.5))
}
function sopraPanino() {
  const forma = dentro(palla([0, 0, 0], [0.57, 0.33, 0.57]), sopra(0), 0.03)
  return tutto(pezzo(forma, 0.021, (x, y, z, c) => {
    c.setHex(0xcf8834)
    verso(c, 0xe7ad58, fra(0.3, 0.05, y) * 0.8)
    verso(c, 0xa35f1e, fra(0.12, 0.33, y) * 0.5 * (0.7 + mosso(x, y, z, 8)))
  }, 0.42), semi())
}

function fetta() {
  const quota = (x, z) => 0.03 - 0.5 * Math.max(0, Math.hypot(x, z) - 0.4) ** 2 - 0.25 * Math.max(0, Math.max(Math.abs(x), Math.abs(z)) - 0.3) ** 1.5
  return pezzo(foglio(quota, { L: 0.5, t: 0.022, y: 0.02 }), 0.018, (x, y, z, c) => {
    c.setHex(0xf6c334); verso(c, 0xffe07e, fra(-0.2, 0.5, mosso(x, 1, z, 10)) * 0.45)
  }, 0.3)
}

function cubetti() {
  const g = new Group()
  for (const [x, z, a] of [[0.18, 0.05, 0.4], [-0.16, 0.14, 1.1], [0.02, -0.2, 0.2], [-0.22, -0.12, 0.8], [0.26, -0.16, 1.4], [0.06, 0.24, 0.6]]) {
    const b = pezzo(unione([palla([0, 0, 0], [0.085, 0.07, 0.085])], 0), 0.016, (px, py, pz, c) => { c.setHex(0xf6c334); verso(c, 0xffe98f, fra(0, 0.07, py) * 0.6) }, 0.35)
    b.position.set(x, 0.14, z); b.rotation.y = a
    g.add(b)
  }
  return g
}

const coloreCarne = crudo => (x, y, z, c) => {
  if (crudo) {
    c.setHex(0xb8403f); verso(c, 0xd2645f, fra(0, 0.6, mosso(x, y, z, 26)) * 0.7); verso(c, 0x8e2c2e, fra(0.3, 0.7, mosso(z, x, y, 34)) * 0.5)
  } else {
    c.setHex(0x6e3a1f); verso(c, 0x9a5a30, fra(-0.2, 0.5, mosso(x, y, z, 20)) * 0.5)
    verso(c, 0x2a160c, fra(0.86, 0.97, Math.abs(Math.sin((x + z * 0.35) * 11))) * 0.85)
  }
}
const polpetta = crudo => {
  const forma = arruffata(disco(0.075, 0.47, 0.15, 0.06), 0.012, 26)
  return pezzo(forma, 0.021, coloreCarne(crudo), crudo ? 0.5 : 0.6)
}

function uovoFritto() {
  const lobi = [[0, 0, 0.42], [0.26, 0.1, 0.24], [-0.26, -0.06, 0.26], [0.04, 0.3, 0.22], [-0.08, -0.3, 0.24], [0.28, -0.22, 0.17]]
  const forma = unione(lobi.map(([x, z, r]) => palla([x, 0.03, z], [r, 0.045, r])), 0.13)
  const g = tutto(pezzo(forma, 0.02, (x, y, z, c) => {
    c.setHex(0xfffaf0); verso(c, 0xd9a760, fra(0.5, 0.68, Math.hypot(x, z) + mosso(x, 0, z, 16) * 0.06) * 0.8)
  }, 0.32))
  const tuorlo = new Mesh(new SphereGeometry(0.19, 22, 16), pieno(0xf6a511, 0.16))
  tuorlo.scale.set(1, 0.62, 1); tuorlo.position.set(0.02, 0.09, 0)
  g.add(tuorlo)
  return g
}

function foglie(quante = 7, largo = 0.46) {
  const pezzi = []
  for (let i = 0; i < quante; i++) {
    const a = i * 2.4, r = largo * Math.sqrt(i / quante)
    const f = arruffata(palla([0, 0, 0], [0.24, 0.035, 0.3]), 0.022, 24)
    pezzi.push(sposta(girata(f, [0.35 * Math.sin(i * 1.3), a, 0.35 * Math.cos(i * 1.7)], [0, 0, 0]), Math.cos(a) * r, 0.12 + (quante - i) * 0.018, Math.sin(a) * r))
  }
  return pezzo(unione(pezzi, 0.012), 0.019, (x, y, z, c) => {
    c.setHex(0x6db247)
    verso(c, 0xb6dc6e, fra(0.1, 0.34, y) * 0.75)
    verso(c, 0x3d8a35, fra(0.1, 0.55, mosso(x, y, z, 15)) * 0.65)
    verso(c, 0xd6eda0, fra(0.82, 0.97, Math.abs(Math.sin(x * 22 + z * 15))) * 0.42)
  }, 0.5)
}

/* La pizza: una pelle sola, quattro colori. */
const PIZZA_FORMA = () => arruffata(unione([disco(0.05, 0.6, 0.06, 0.02), ciambella(0.075, 0.6, 0.075, 0.95)], 0.05), 0.01, 16)
const macchia = (x, z, fitto) => mosso(x, 2, z, fitto)
const COLORI_PIZZA = {
  impasto: (x, y, z, c) => { c.setHex(0xf0dcae); verso(c, 0xf9efd2, fra(-0.2, 0.5, macchia(x, z, 16)) * 0.65) },
  sugo: (x, y, z, c) => {
    COLORI_PIZZA.impasto(x, y, z, c)
    if (Math.hypot(x, z) + macchia(x, z, 18) * 0.03 < 0.53 && y > 0.05) { c.setHex(0xc22a18); verso(c, 0xe2502c, fra(-0.3, 0.5, macchia(z, x, 14)) * 0.5) }
  },
  formaggio: (x, y, z, c) => {
    COLORI_PIZZA.sugo(x, y, z, c)
    if (Math.hypot(x, z) < 0.5 && y > 0.05 && macchia(x, z, 9) + macchia(z, x, 13) * 0.5 > -0.12) { c.setHex(0xfbf3dc); verso(c, 0xf3e0a4, fra(0, 0.5, macchia(x, z, 21)) * 0.5) }
  },
  cotta: (x, y, z, c) => {
    const r = Math.hypot(x, z)
    if (r >= 0.54) {
      c.setHex(0xd59a4c); verso(c, 0x8d4a1a, fra(0.1, 0.6, macchia(x, z, 11)) * 0.75); verso(c, 0x34200f, fra(0.62, 0.8, macchia(z, x, 17)) * 0.9)
      return
    }
    c.setHex(0xc4301c); verso(c, 0xe0623a, fra(-0.2, 0.4, macchia(z, x, 12)) * 0.45)
    if (r < 0.5 && macchia(x, z, 9) + macchia(z, x, 13) * 0.5 > -0.12) {
      c.setHex(0xf9e4a4); verso(c, 0xd99a3c, fra(0.42, 0.72, macchia(x, z, 21)) * 0.85)
    }
  },
}
function pizza(fase) {
  G.formaPizza ||= pelle(PIZZA_FORMA(), { ...scatolaDi(PIZZA_FORMA(), 0.04), passo: 0.034 })
  const geo = G.formaPizza.clone(), p = geo.attributes.position, n = p.count
  const col = new Float32Array(n * 3), c = new Color()
  for (let i = 0; i < n; i++) { COLORI_PIZZA[fase](p.getX(i), p.getY(i), p.getZ(i), c); col.set([c.r, c.g, c.b], i * 3) }
  geo.setAttribute('color', new BufferAttribute(col, 3))
  const g = tutto(new Mesh(geo, opaco(fase === 'cotta' ? 0.5 : 0.62)))
  if (fase === 'cotta') for (const [x, z, a] of [[0.16, 0.1, 0.5], [-0.2, 0.02, 2], [0.02, -0.24, 1.2]]) {
    const f = foglia(0.12, 0.07, 0x2f7a33); f.position.set(x, 0.1, z); f.rotation.y = a; g.add(f)
  }
  return g
}

/* ── la dispensa ── */
function mazzoSpaghetti() {
  const fili = []
  for (let i = 0; i < 64; i++) {
    const a = i * 2.4, r = 0.17 * Math.sqrt((i + 1) / 64)
    const g = new CylinderGeometry(0.0125, 0.0125, 1.62 + Math.sin(i * 3.1) * 0.07, 5, 1)
    g.rotateZ(Math.PI / 2 + Math.cos(a) * r * 0.26)
    g.rotateY(Math.sin(a) * r * 0.3)
    g.translate(0, 0.19 + Math.sin(a) * r, Math.cos(a) * r)
    fili.push(g)
  }
  const fascia = new Mesh(new CylinderGeometry(0.195, 0.195, 0.46, 24, 1, false), pieno(0x2f6fb5, 0.5))
  fascia.rotation.z = Math.PI / 2; fascia.position.y = 0.19
  const bordo = [-0.2, 0.2].map(x => { const m = new Mesh(new CylinderGeometry(0.198, 0.198, 0.05, 24), pieno(0xf4e7c4, 0.5)); m.rotation.z = Math.PI / 2; m.position.set(x, 0.19, 0); return m })
  const g = tutto(new Mesh(mergeGeometries(fili), pieno(SPAGO, 0.4)), fascia, ...bordo)
  g.rotation.y = 0.5
  return tutto(g)
}

const giro = punti => new LatheGeometry(punti.map(([x, y]) => new Vector2(x, y)), 34)
function ciotolaSugo() {
  const terra = new Mesh(giro([[0, 0.01], [0.3, 0.01], [0.42, 0.06], [0.6, 0.3], [0.64, 0.34], [0.6, 0.35], [0.54, 0.3], [0.38, 0.1], [0, 0.08]]), pieno(0xbf6a3a, 0.5))
  const dentroSugo = pezzo(arruffata(disco(0.25, 0.53, 0.05, 0.02), 0.008, 16), 0.022, (x, y, z, c) => {
    c.setHex(0xc22a18); verso(c, 0xe0462a, fra(-0.3, 0.5, mosso(x, 1, z, 11)) * 0.6)
  }, 0.2)
  const manico = new Mesh(new CylinderGeometry(0.035, 0.05, 1, 10), pieno(0xb98a55, 0.6))
  manico.rotation.z = 1.1; manico.rotation.y = -0.5; manico.position.set(0.42, 0.5, 0.1)
  const cucchiaio = new Mesh(new SphereGeometry(0.1, 14, 10), pieno(0xb98a55, 0.6)); cucchiaio.scale.set(1.3, 0.35, 1); cucchiaio.position.set(0.02, 0.28, -0.08)
  const f = foglia(0.15, 0.08); f.position.set(-0.2, 0.3, 0.12); f.rotation.y = 0.8
  return tutto(terra, dentroSugo, manico, cucchiaio, f)
}

function pagnotta() {
  const corpo = palla([0, 0.27, 0], [0.68, 0.29, 0.44])
  const tagli = [-0.3, 0, 0.3].map(x => osso([x - 0.1, 0.57, -0.26], [x + 0.1, 0.57, 0.26], 0.05, 0.05))
  const forma = dentro(meno(corpo, unione(tagli, 0), 0.05), sopra(0.01), 0.04)
  return pezzo(forma, 0.021, (x, y, z, c) => {
    c.setHex(0xc47f33)
    verso(c, 0x8e4f1a, fra(0.2, 0.5, y) * 0.55 * (1 + mosso(x, y, z, 9)))
    const solco = Math.min(...[-0.3, 0, 0.3].map(t => Math.abs(x - t - z * 0.38)))
    verso(c, 0xf1dcaa, fra(0.075, 0.03, solco) * (y > 0.4 ? 1 : 0))
    verso(c, 0xfbf3df, fra(0.42, 0.62, mosso(x, 2, z, 24)) * 0.5 * fra(0.34, 0.5, y))
  }, 0.74)
}

function formaFormaggio() {
  const R = 0.72, a = 0.62
  const piano = (nx, nz) => ({ f: (x, y, z) => nx * x + nz * z, c: [0, 0, 0], r: 1e9 })
  let forma = dentro(dentro(disco(0.25, R, 0.5, 0.03), piano(-Math.cos(a), -Math.sin(a) * 1), 0.03), piano(-Math.cos(a), Math.sin(a)), 0.03)
  forma = { ...forma, c: [0.38, 0.25, 0], r: 0.55 }
  const buchi = [[0.3, 0.5, 0.1, 0.08], [0.48, 0.3, -0.12, 0.09], [0.24, 0.24, 0.02, 0.06], [0.54, 0.47, 0.16, 0.06], [0.42, 0.14, 0.17, 0.07], [0.38, 0.52, -0.18, 0.06]]
  for (const [x, y, z, r] of buchi) forma = meno(forma, palla([x, y, z], r), 0.015)
  const m = pezzo(forma, 0.019, (x, y, z, c) => {
    c.setHex(0xf6cb46); verso(c, 0xffe48c, fra(-0.1, 0.5, mosso(x, y, z, 9)) * 0.4)
    verso(c, 0xc98a1c, fra(0.67, 0.71, Math.hypot(x, z)) * 0.9)
    verso(c, 0xd9a22e, buchi.reduce((v, [bx, by, bz, r]) => Math.max(v, fra(r + 0.015, r - 0.01, Math.hypot(x - bx, y - by, z - bz))), 0) * 0.6)
  }, 0.42)
  m.position.x = -0.38
  return tutto(m)
}

function cespo() {
  const pezzi = [palla([0, 0.3, 0], [0.34, 0.3, 0.34])]
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, alto = 0.18 + (i % 3) * 0.1
    const f = arruffata(palla([0.36, alto + 0.12, 0], [0.09, 0.32, 0.31]), 0.03, 19)
    pezzi.push(girata(girata(f, [0, 0, -0.35 - (i % 3) * 0.14], [0.3, alto, 0]), [0, a, 0], [0, 0, 0]))
  }
  return pezzo(unione(pezzi, 0.02), 0.021, (x, y, z, c) => {
    const r = Math.hypot(x, z)
    c.setHex(0xa8d65e)
    verso(c, 0x54a13f, fra(0.2, 0.62, r) * 0.85)
    verso(c, 0x37812f, fra(0.2, 0.7, mosso(x, y, z, 12)) * 0.6)
    verso(c, 0xe0f2a8, fra(0.86, 0.98, Math.abs(Math.sin(Math.atan2(z, x) * 7))) * 0.5)
  }, 0.5)
}

function cartaCarne() {
  const carta = new Mesh(new CylinderGeometry(0.66, 0.68, 0.05, 30), pieno(0x9a6a40, 0.62))
  carta.position.y = 0.025
  const una = clona('carne-cruda', () => polpetta(true)), due = una.clone()
  una.position.set(-0.04, 0.05, 0.03); due.position.set(0.07, 0.19, -0.05); due.rotation.z = 0.07
  return tutto(carta, una, due)
}

function uova() {
  const cesto = new Mesh(giro([[0, 0.02], [0.36, 0.02], [0.56, 0.1], [0.68, 0.3], [0.7, 0.34], [0.64, 0.33], [0.5, 0.16], [0, 0.1]]), pieno(0xb78b57, 0.75))
  const orlo = new Mesh(pelle(ciambella(0.33, 0.67, 0.045), { min: [-0.8, 0.2, -0.8], max: [0.8, 0.5, 0.8], passo: 0.04, colore: (x, y, z, c) => {
    c.setHex(0xc79b63); verso(c, 0x8c6232, fra(0.2, 0.9, Math.abs(Math.sin(Math.atan2(z, x) * 26))))
  } }), opaco(0.75))
  const guscio = (x, y, z, c) => { c.setHex(0xe3b98c); verso(c, 0xc7915f, fra(0.1, 0.6, mosso(x, y, z, 14)) * 0.55); verso(c, 0x8a6442, fra(0.74, 0.82, mosso(z, x, y, 40)) * 0.8) }
  const uovo = pezzo(palla([0, 0, 0], [0.2, 0.26, 0.2]), 0.016, guscio, 0.36)
  const g = tutto(cesto, orlo)
  for (const [x, y, z, a, b] of [[-0.2, 0.28, -0.08, 0.5, 0.2], [0.2, 0.28, -0.12, -0.4, 0.3], [0.02, 0.28, 0.22, 0.2, -0.5]]) {
    const u = uovo.clone(); u.position.set(x, y, z); u.rotation.set(1 + b, 0, a); g.add(u)
  }
  return g
}

function pallaImpasto() {
  const tavola = new Mesh(giro([[0, 0], [0.68, 0], [0.72, 0.03], [0.7, 0.07], [0, 0.07]]), pieno(0xc49a64, 0.7))
  const farina = new Mesh(new CylinderGeometry(0.58, 0.6, 0.012, 26), pieno(0xfbf6e8, 0.95))
  farina.position.y = 0.075
  const pasta = pezzo(arruffata(unione([palla([0, 0.3, 0], [0.45, 0.26, 0.45]), palla([0.14, 0.34, 0.1], [0.26, 0.2, 0.26]), palla([-0.14, 0.3, -0.1], [0.26, 0.21, 0.26])], 0.16), 0.01, 7), 0.022, (x, y, z, c) => {
    c.setHex(0xf0dcae); verso(c, 0xfbf3df, fra(-0.3, 0.5, mosso(x, y, z, 12)) * 0.75)
  }, 0.68)
  tavola.material.side = 2
  return tutto(tavola, farina, pasta)
}

/* ── i modelli si fanno una volta ── */
const G = {}
const FATTI = {
  'pasta': () => tutto(nido()), 'pasta-pentola': () => tutto(nido(SPAGO, 0.56, 0.1)), 'pasta-bruciata': () => tutto(nido(0x3a2715, 0.56, 0.12)),
  'sugo': sugo, 'pane': fondoPanino, 'pane-sopra': sopraPanino, 'formaggio': fetta, 'formaggio-cubetti': cubetti,
  'insalata': () => foglie(), 'carne-cruda': () => polpetta(true), 'carne': () => polpetta(false), 'uovo': uovoFritto,
  'pizza-impasto': () => pizza('impasto'), 'pizza-sugo': () => pizza('sugo'), 'pizza-cruda': () => pizza('formaggio'), 'pizza': () => pizza('cotta'),
  'c:pasta': mazzoSpaghetti, 'c:sugo': ciotolaSugo, 'c:pane': pagnotta, 'c:formaggio': formaFormaggio, 'c:insalata': cespo,
  'c:carne': cartaCarne, 'c:uovo': uova, 'c:impasto': pallaImpasto,
}
function clona(chiave, fai) {
  G[chiave] ||= fai()
  return G[chiave].clone()
}
const modello = k => clona(k, FATTI[k])
const annerito = o => { o.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.vertexColors = false; m.material.color.setHex(0x241812) } }); return o }

const ALTO = { pasta: 0.3, sugo: 0.12, pane: 0.17, formaggio: 0.06, insalata: 0.2, carne: 0.15, uovo: 0.12, impasto: 0.1 }
export const confezione = cosa => modello('c:' + cosa)

/** Il pezzo sul fuoco o nelle mani. */
export function cibo(cosa, { bruciato = false, crudo = false } = {}) {
  if (cosa === 'pasta') return modello(bruciato ? 'pasta-bruciata' : 'pasta-pentola')
  if (cosa === 'carne') return bruciato ? annerito(modello('carne')) : modello(crudo ? 'carne-cruda' : 'carne')
  if (cosa === 'uovo') return bruciato ? annerito(modello('uovo')) : modello('uovo')
  if (cosa === 'pizza') return bruciato ? annerito(modello('pizza')) : modello(crudo ? 'pizza-cruda' : 'pizza')
  return modello(cosa)
}

/** Il piatto come lo si è messo insieme: i pezzi si appoggiano l'uno sull'altro, come nel piatto vero. */
export function impiatta(p) {
  const g = new Group()
  if (!p) return g
  const { cose, pronto } = p
  const metti = (k, x = 0, y = 0, z = 0, gira = 0) => g.add(su(modello(k), x, y, z, gira))
  if (cose[0] === 'pizza') metti('pizza', 0, 0.02)
  else if (cose[0] === 'impasto') metti(cose.includes('formaggio') ? 'pizza-cruda' : cose.includes('sugo') ? 'pizza-sugo' : 'pizza-impasto', 0, 0.02)
  else if (cose[0] === 'uovo') {
    metti('uovo', -0.2, 0.02, -0.06)
    if (cose[1] === 'pane') { metti('pane', 0.42, 0.02, 0.26, 0.3); g.children.at(-1).scale.setScalar(0.62) }
  }
  else if (cose[0] === 'insalata') { metti('insalata'); if (cose[1] === 'formaggio') metti('formaggio-cubetti', 0, 0.1) }
  else if (cose[0] === 'pasta') { metti('pasta'); if (cose[1] === 'sugo') metti('sugo', 0, 0.21) }
  else {
    let y = 0
    for (const k of cose) { metti(k, 0, y, 0, k === 'formaggio' ? 0.7 : 0); y += ALTO[k] }
    if (pronto) metti('pane-sopra', 0, y + 0.02, 0, 0.4)
  }
  return g
}

/** Si modella prima di aprire: una cosa per volta, senza fermare lo schermo. */
export async function prepara(cose, ricette) {
  const chiavi = cose.map(k => 'c:' + k)
  const usa = new Set(ricette.flatMap(r => r.passi))
  if (usa.has('pasta')) chiavi.push('pasta', 'pasta-pentola', 'pasta-bruciata')
  if (usa.has('sugo')) chiavi.push('sugo')
  if (usa.has('pane')) chiavi.push('pane', 'pane-sopra')
  if (usa.has('formaggio')) chiavi.push('formaggio', 'formaggio-cubetti')
  if (usa.has('insalata')) chiavi.push('insalata')
  if (usa.has('carne')) chiavi.push('carne-cruda', 'carne')
  if (usa.has('uovo')) chiavi.push('uovo')
  if (usa.has('impasto')) chiavi.push('pizza-impasto', 'pizza-sugo', 'pizza-cruda', 'pizza')
  const passo = async k => { if (!G[k]) { modello(k); await new Promise(r => setTimeout(r)) } }
  // la dispensa si vede subito; il cibo si fa mentre cala il cartello, e chi arriva prima se lo fa da sé
  for (const k of chiavi.slice(0, cose.length)) await passo(k)
  ;(async () => { for (const k of chiavi.slice(cose.length)) await passo(k) })()
}
