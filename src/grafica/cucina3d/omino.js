// Il cuoco, nella creta (docs/fattoria3d/creta.md): corpo, due gambe e due braccia a parte, che si muovono coi perni.
// Guarda verso +z, i piedi a quota zero. Com'è fatto lo sceglie il bambino (`data/bancarella-cuochi.js`, docs/bancarella/cuoco.md):
// le forme si modellano una volta e si ritingono, così cambiare un colore non rifà la creta.
import { Group, Mesh, MeshStandardMaterial, MeshBasicMaterial, SphereGeometry, CylinderGeometry, RingGeometry, BufferGeometry, BufferAttribute, Color } from 'three'
import { palla, osso, unione, dentro, sopra, girata, arruffata, pelle, scatolaDi, fra, verso, mosso } from '../../giochi/fattoria3d/scena3d/creta.js'
import { ombra, creaColtello } from './pezzi.js'
import { vesteInForma, chiaveVeste, coloriDellaVeste } from '../../data/bancarella-cuochi.js'

const SCALA = 0.72
const ALTO_MANI = 0.78      // sopra il piano dei banconi: passando accanto, quello che porta non ci entra dentro
const TESTONA = 1.14        // la testa un po' più grande del vero: è un cuoco da cartone, e da lassù si vede il viso
const GIACCA = 0xfbf7ee, SCARPE = 0x3a2a22, NERO = 0x1d1612
const opaco = lucido => new MeshStandardMaterial({ vertexColors: true, roughness: lucido, metalness: 0 })

/* ── le forme si fanno una volta; il colore si ridà a ogni veste ── */
const FORME = new Map()
function forma(chiave, fai, passo) {
  if (!FORME.has(chiave)) { const f = fai(); FORME.set(chiave, pelle(f, { ...scatolaDi(f, 0.04), passo })) }
  return FORME.get(chiave)
}
const _c = new Color()
function tinto(geo, colore, lucido = 0.62) {
  const p = geo.attributes.position, n = geo.attributes.normal, col = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) {
    _c.setRGB(1, 1, 1)
    colore(p.getX(i), p.getY(i), p.getZ(i), _c, n.getX(i), n.getY(i), n.getZ(i))
    col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b
  }
  const g = new BufferGeometry()
  g.setAttribute('position', p); g.setAttribute('normal', n); g.setAttribute('color', new BufferAttribute(col, 3)); g.setIndex(geo.index)
  g.boundingSphere = geo.boundingSphere; g.boundingBox = geo.boundingBox
  return new Mesh(g, opaco(lucido))
}
const scuro = (c, k = 0.72) => _c.setHex(c).multiplyScalar(k).getHex()
const chiaro = c => (((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11) > 150

/* ── il busto: la giacca, il grembiule col suo disegno, il fazzoletto ── */
const formaBusto = fazzoletto => () => unione([
  palla([0, 0.57, 0], [0.28, 0.31, 0.25]),
  palla([0, 0.45, 0.03], [0.27, 0.2, 0.25]),
  ...(fazzoletto ? [palla([0, 0.84, 0], [0.2, 0.075, 0.19]), osso([0.07, 0.8, 0.19], [0.13, 0.68, 0.25], 0.04, 0.02)]   // il fazzoletto e il nodo
    : [palla([0, 0.82, 0], [0.16, 0.06, 0.15])]),                                                                         // il colletto
], 0.05)
function disegno(tipo, x, y, c) {
  if (tipo === 'righe' && Math.sin(x * 34) > 0.3) verso(c, 0xffffff, 0.8)
  if (tipo === 'quadri') verso(c, 0xffffff, (Math.sin(x * 30) > 0 ? 0.42 : 0) + (Math.sin(y * 30) > 0 ? 0.42 : 0))
  if (tipo === 'pois') {
    const gy = y / 0.085, r = Math.round(gy), gx = x / 0.085 + (r % 2 ? 0.5 : 0)
    if (Math.hypot(gx - Math.round(gx), gy - r) < 0.27) c.setHex(0xffffff)
  }
}
function busto(v, col) {
  const g = forma('busto:' + (v.collo === 'fazzoletto'), formaBusto(v.collo === 'fazzoletto'), 0.013)
  return tinto(g, (x, y, z, c) => {
    c.setHex(GIACCA)
    verso(c, 0xd9d3c6, fra(-0.04, -0.24, z) * 0.35)
    // il grembiule: davanti, dalla pancia in giù, con le due bretelle
    const davanti = z > 0.02
    if (davanti && y < 0.6 && Math.abs(x) < 0.27) { c.setHex(col.grembiule); disegno(v.grembiule, x, y, c); verso(c, 0x000000, fra(0.3, 0.6, mosso(x, y, z, 14)) * 0.12) }
    if (davanti && y >= 0.6 && y < 0.78 && Math.abs(Math.abs(x) - 0.12) < 0.035) c.setHex(col.grembiule)
    if (v.collo !== 'fazzoletto') return
    if (y > 0.765) { c.setHex(col.collo); verso(c, scuro(col.collo), fra(0.4, 0.8, mosso(x, y, z, 26)) * 0.5) }
    if (y > 0.67 && y <= 0.8 && x > 0.04 && z > 0.17) c.setHex(col.collo)
  })
}
function papillon(col) {
  const g = forma('papillon', () => unione([palla([-0.08, 0.79, 0.215], [0.075, 0.05, 0.03]), palla([0.08, 0.79, 0.215], [0.075, 0.05, 0.03]),
    palla([0, 0.79, 0.235], [0.032, 0.035, 0.028])], 0.02), 0.009)
  return tinto(g, (x, y, z, c) => { c.setHex(col.collo); if (Math.abs(x) < 0.03) verso(c, scuro(col.collo), 0.5) }, 0.5)
}

/* ── la testa: una persona, o un animale col muso e le orecchie ── */
const formaTesta = () => unione([
  palla([0, 1.1, 0.02], [0.3, 0.28, 0.28]),
  palla([0, 1.05, 0.29], [0.06, 0.05, 0.06]),                  // il naso
  palla([0.3, 1.08, 0], [0.05, 0.075, 0.05]), palla([-0.3, 1.08, 0], [0.05, 0.075, 0.05]),
], 0.03)
const ORECCHIE = {
  gatto: s => osso([s * 0.16, 1.26, -0.01], [s * 0.29, 1.52, -0.03], 0.09, 0.012),
  orsetto: s => palla([s * 0.26, 1.31, -0.03], [0.1, 0.1, 0.06]),
  coniglio: s => girata(palla([s * 0.17, 1.6, -0.05], [0.075, 0.25, 0.04]), [0, 0, -s * 0.35], [s * 0.17, 1.36, -0.05]),
}
const formaMuso = specie => () => unione([
  palla([0, 1.1, 0.02], [0.31, 0.28, 0.29]),
  palla([0, 1.0, 0.22], [0.14, 0.095, 0.11]),                   // il muso
  ORECCHIE[specie](1), ORECCHIE[specie](-1),
], 0.04)
function testa(v, col) {
  if (!col.manto) return tinto(forma('testa', formaTesta, 0.02), (x, y, z, c) => {
    c.setHex(col.pelle)
    verso(c, 0xee8f78, fra(0.14, 0.04, Math.hypot(Math.abs(x) - 0.17, y - 1.02)) * 0.55)    // le guance
  }, 0.5)
  const m = col.manto
  return tinto(forma('muso:' + v.chi, formaMuso(v.chi), 0.02), (x, y, z, c, nx, ny, nz) => {
    c.setHex(m.pelo)
    if (m.macchie) { const n = mosso(x, y, z, 6); if (n > 0.2) c.setHex(m.macchie[0]); else if (m.macchie[1] && n < -0.32) c.setHex(m.macchie[1]) }
    if (m.righe && z < 0.16 && Math.sin(y * 42 + Math.sin(x * 9) * 2) > 0.45) verso(c, m.righe, 0.75)
    if (m.fronte && z > 0.12 && y < 1.3 && Math.abs(x) < 0.04 + (1.3 - y) * 0.45) c.setHex(m.fronte)          // la fiammata bianca del gatto
    if (Math.hypot(x / 0.17, (y - 0.99) / 0.12, (z - 0.2) / 0.14) < 1) c.setHex(m.muso)
    if (m.occhiaie && z > 0.12 && Math.hypot(Math.abs(x) - 0.13, (y - 1.13) * 1.2) < 0.085) c.setHex(m.occhiaie)
    const orecchio = y > 1.25 && Math.abs(x) > 0.11
    if (orecchio && m.orecchie) c.setHex(m.orecchie)
    else if (orecchio && nz > 0.35 && y > 1.3) c.setHex(m.dentro)
    verso(c, 0xf09a8a, fra(0.1, 0.03, Math.hypot(Math.abs(x) - 0.2, y - 1.03)) * 0.35 * (z > 0.1))    // le guance
  }, 0.75)
}
function nasino(col) {
  const o = new Mesh(new SphereGeometry(0.045, 14, 10), new MeshStandardMaterial({ color: col.manto.naso, roughness: 0.3 }))
  o.scale.set(1.2, 0.8, 0.8); o.position.set(0, 1.05, 0.33)
  return o
}
function baffi(col) {
  const g = new Group(), mat = new MeshBasicMaterial({ color: chiaro(col.manto.pelo) ? 0x4a4048 : 0xf4f0e8 })
  for (const s of [1, -1]) for (const [y, a] of [[1.02, 0.15], [0.99, 0], [0.96, -0.15]]) {
    const b = new Mesh(new CylinderGeometry(0.005, 0.005, 0.2, 4), mat)
    b.rotation.z = Math.PI / 2 + s * a; b.position.set(s * 0.2, y, 0.3)
    g.add(b)
  }
  return g
}

/* ── i capelli: sopra la testa, sotto il cappello. La calotta copre dietro e in cima, il viso resta libero ── */
const calotta = (grande = 1) => dentro(dentro(palla([0, 1.12, -0.01], [0.318 * grande, 0.3 * grande, 0.3 * grande]),
  { f: (x, y, z) => (z - 0.1 - (y - 1.02) * 1.1) * 0.67, c: [0, 1, 0], r: 1e9 }, 0.02), sopra(0.9), 0.02)
const TAGLI3D = {
  corti: () => calotta(),
  coda: () => unione([calotta(), palla([0, 1.2, -0.3], [0.09, 0.08, 0.08]), osso([0, 1.17, -0.33], [0, 0.86, -0.42], 0.085, 0.045)], 0.04),
  trecce: () => unione([calotta(), ...[1, -1].flatMap(s => [0, 1, 2, 3].map(i => palla([s * (0.27 + i * 0.012), 1.0 - i * 0.085, -0.06 + i * 0.02], 0.065 - i * 0.006)))], 0.02),
  caschetto: () => dentro(dentro(palla([0, 1.1, -0.02], [0.36, 0.34, 0.34]),
    { f: (x, y, z) => Math.min((z - 0.12 - (y - 1.04) * 1.1) * 0.67, Math.max(0.23 - Math.abs(x), z - 0.24)), c: [0, 1, 0], r: 1e9 }, 0.02), sopra(0.88), 0.03),
  lunghi: () => unione([calotta(), dentro(palla([0, 0.92, -0.2], [0.31, 0.36, 0.13]), sopra(0.6), 0.03),
    osso([0.27, 1.05, 0.06], [0.3, 0.83, 0.09], 0.06, 0.05), osso([-0.27, 1.05, 0.06], [-0.3, 0.83, 0.09], 0.06, 0.05)], 0.05),
  ricci: () => arruffata(unione([calotta(1.04), ...Array.from({ length: 9 }, (_, i) => {
    const a = -Math.PI * 0.9 + i * Math.PI * 0.225
    return palla([Math.cos(a) * 0.3, 1.08 + Math.sin(i * 1.7) * 0.06, Math.min(0.05, Math.sin(a) * 0.3)], 0.1)
  })], 0.04), 0.022, 24),
}
function capelli(col) {
  if (col.taglio === 'calvo' || !TAGLI3D[col.taglio]) return null
  return tinto(forma('capelli:' + col.taglio, TAGLI3D[col.taglio], 0.018), (x, y, z, c) => {
    c.setHex(col.capelli); verso(c, scuro(col.capelli, 0.62), fra(0.2, 0.7, mosso(x, y, z, 30)) * 0.5)
  }, 0.55)
}

/* ── il cappello: alto, basso o la bandana; in due la fascia ha il colore di chi gioca ── */
const PUFF = [[0, 0], [0.11, 0.03], [-0.11, 0.02], [0.03, 0.11], [-0.03, -0.11]]
const CAPPELLI3D = {
  // basso e stretto: la telecamera sta in alto, e un cappello largo copre la faccia
  alto: { fascia: 1.42, f: () => unione([osso([0, 1.31, -0.02], [0, 1.42, -0.03], 0.24, 0.25),
    ...PUFF.map(([x, z], i) => palla([x, 1.55 + (i ? -0.02 : 0.03), z - 0.03], [0.2, 0.15, 0.2]))], 0.06) },
  basso: { fascia: 1.37, f: () => unione([osso([0, 1.31, -0.02], [0, 1.37, -0.03], 0.245, 0.25), palla([0, 1.44, -0.03], [0.28, 0.1, 0.28])], 0.05) },
  bandana: { fascia: 1.24, f: () => unione([dentro(palla([0, 1.13, -0.01], [0.33, 0.31, 0.31]), sopra(1.17), 0.02),
    palla([0, 1.22, -0.31], [0.07, 0.055, 0.05]), osso([0, 1.2, -0.33], [0.07, 1.06, -0.36], 0.04, 0.02), osso([0, 1.2, -0.33], [-0.06, 1.08, -0.37], 0.04, 0.02)], 0.03) },
}
function cappello(v, col, fascia) {
  const tipo = CAPPELLI3D[v.cappello]
  return tinto(forma('cappello:' + v.cappello, tipo.f, 0.022), (x, y, z, c) => {
    c.setHex(col.cappello)
    const a = Math.atan2(z, x)
    if (v.cappello === 'alto' && y > 1.45) verso(c, scuro(col.cappello, 0.82), fra(0.55, 1, Math.abs(Math.sin(a * 7))) * fra(1.45, 1.56, y) * 0.5)
    if (v.cappello === 'bandana') disegno('pois', x + z, y, c)
    else if (y < tipo.fascia) verso(c, scuro(col.cappello, 0.92), 0.5)
    if (fascia && y < tipo.fascia) c.setHex(fascia)      // in due: da sopra si vede il cappello
  }, 0.75)
}

/* ── gli occhi, la bocca, le ciglia ── */
function occhio(x) {
  const g = new Group()
  const nero = new Mesh(new SphereGeometry(0.058, 16, 12), new MeshStandardMaterial({ color: NERO, roughness: 0.16 }))
  nero.scale.set(0.82, 1.12, 0.5)
  const luce = new MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.7 })
  const grande = new Mesh(new SphereGeometry(0.016, 8, 6), luce); grande.position.set(0.014, 0.024, 0.026)
  const piccola = new Mesh(new SphereGeometry(0.008, 6, 5), luce); piccola.position.set(-0.012, -0.018, 0.026)
  g.add(nero, grande, piccola)
  g.position.set(x, 1.13, 0.272)
  g.rotation.y = x * 1.6
  return g
}
const formaSorriso = z => () => unione([osso([-0.07, 0.975, z], [0, 0.955, z + 0.02], 0.012, 0.012), osso([0.07, 0.975, z], [0, 0.955, z + 0.02], 0.012, 0.012)], 0.008)
const sorriso = bestia => tinto(forma('sorriso:' + bestia, formaSorriso(bestia ? 0.318 : 0.272), 0.009), (x, y, z, c) => c.setHex(0x8e3b2c), 0.5)
// la cuoca ha le ciglia: due trattini all'angolo di fuori di ogni occhio
const ciglia = () => tinto(forma('ciglia', () => unione([1, -1].flatMap(s => [
  osso([s * 0.155, 1.17, 0.245], [s * 0.19, 1.2, 0.235], 0.009, 0.006), osso([s * 0.16, 1.15, 0.25], [s * 0.2, 1.165, 0.235], 0.009, 0.006)]), 0.004), 0.006),
(x, y, z, c) => c.setHex(NERO), 0.5)

/* ── gambe e braccia ── */
function gamba() {
  return tinto(forma('gamba', () => unione([osso([0, 0, 0], [0, -0.27, 0], 0.095, 0.08), dentro(palla([0, -0.31, 0.06], [0.1, 0.08, 0.17]), sopra(-0.38), 0.01)], 0.03), 0.022),
    (x, y, z, c) => {
      c.setHex(0x3f4a5a)
      verso(c, 0x56647a, fra(0.3, 0.7, Math.abs(Math.sin(x * 60))) * 0.3)   // i pantaloni a quadretti
      if (y < -0.235) c.setHex(SCARPE)
    })
}
function braccio(s, mano) {
  return tinto(forma('braccio:' + s, () => unione([osso([0, 0, 0], [s * 0.04, -0.27, 0], 0.09, 0.075), palla([s * 0.045, -0.35, 0], 0.075)], 0.02), 0.02),
    (x, y, z, c) => {
      c.setHex(GIACCA)
      if (y < -0.25) verso(c, 0xd9d3c6, 0.5)
      if (y < -0.285) c.setHex(mano)
    })
}

/* In due chi è chi si dice col colore, e le ordinazioni prenotate prendono lo stesso (`Ordini.vue`): la fascia del cappello e
   l'anello per terra. */
export const COLORI_IN_DUE = { host: [0xd2402e, 0x9d2a1f], ospite: [0x2f7fd6, 0x1f5a9e] }
const STAMPI = new Map()
function stampoDi(veste, ruolo) {
  const v = vesteInForma(veste), chiave = chiaveVeste(v) + '|' + (ruolo || '')
  if (STAMPI.has(chiave)) return STAMPI.get(chiave)
  const col = coloriDellaVeste(v), bestia = !!col.manto, mano = bestia ? (col.manto.zampe ?? col.manto.pelo) : col.pelle
  const s = {
    busto: busto(v, col), testa: testa(v, col), cappello: cappello(v, col, ruolo ? COLORI_IN_DUE[ruolo][0] : 0), sorriso: sorriso(bestia),
    capelli: bestia ? null : capelli(col), ciglia: v.chi === 'cuoca' ? ciglia() : null, papillon: v.collo === 'papillon' ? papillon(col) : null,
    naso: bestia ? nasino(col) : null, baffi: v.chi === 'gatto' ? baffi(col) : null,
    gamba: gamba(), braccioD: braccio(1, mano), braccioS: braccio(-1, mano),
  }
  STAMPI.set(chiave, s)
  return s
}

/** Il cuoco: `g` si mette in scena, `anima(dt, stato)` lo fa muovere, `mano` è dove sta quello che porta.
    `veste`: com'è fatto (una veste o la sua riga); `ruolo`: quale dei due, in due. */
export function creaCuoco({ veste = null, ruolo = '' } = {}) {
  const stampo = stampoDi(veste, ruolo)
  const figura = new Group()
  const sopraVita = new Group()
  // la testa guarda un po' in su, verso la telecamera: da sopra se no si vede solo il cappello
  const capo = new Group(), viso = new Group()
  viso.add(...[stampo.testa, stampo.cappello, stampo.sorriso, stampo.capelli, stampo.ciglia, stampo.naso, stampo.baffi].filter(Boolean).map(o => o.clone()),
    occhio(0.115), occhio(-0.115))
  viso.position.y = -0.85
  capo.add(viso); capo.position.y = 0.85; capo.rotation.x = -0.38; capo.scale.setScalar(TESTONA)
  sopraVita.add(stampo.busto.clone(), capo, ...(stampo.papillon ? [stampo.papillon.clone()] : []))
  const gambe = [0.13, -0.13].map(x => { const o = new Group(); o.add(stampo.gamba.clone()); o.position.set(x, 0.39, 0); return o })
  const braccia = [[0.31, stampo.braccioD], [-0.31, stampo.braccioS]].map(([x, b]) => { const o = new Group(); o.add(b.clone()); o.position.set(x, 0.74, 0); return o })
  const coltello = creaColtello()
  coltello.scale.setScalar(0.5); coltello.position.set(0.04, -0.37, 0.02); coltello.rotation.set(0, Math.PI, 0)
  coltello.visible = false
  braccia[0].add(coltello)
  figura.add(sopraVita, ...gambe, ...braccia)
  figura.scale.setScalar(SCALA)
  const mano = new Group(); mano.position.set(0, ALTO_MANI, 0.46); mano.scale.setScalar(0.8)

  const g = new Group()
  g.add(ombra(0.5), figura, mano)
  if (ruolo) {
    const anello = new Mesh(new RingGeometry(0.4, 0.48, 36), new MeshBasicMaterial({ color: COLORI_IN_DUE[ruolo][0], transparent: true, opacity: 0.85, depthWrite: false }))
    anello.rotation.x = -Math.PI / 2; anello.position.y = 0.02
    g.add(anello)
  }

  let fase = 0, giro = 0, colpo = 0
  // `cammina`: si muove; `porta`: ha qualcosa in mano; un `colpo` è un taglio
  function anima(dt, { cammina, porta, verso: dove }) {
    if (cammina) fase += dt * 13
    const passo = cammina ? Math.sin(fase) : 0
    const piega = 1 - Math.exp(-dt * 16)
    // l'angolo più corto, se no a cavallo del mezzo giro fa una piroetta
    const d = Math.atan2(Math.sin(dove - giro), Math.cos(dove - giro))
    giro += d * piega
    g.rotation.y = giro
    gambe[0].rotation.x = passo * 0.75
    gambe[1].rotation.x = -passo * 0.75
    sopraVita.position.y = cammina ? Math.abs(Math.cos(fase)) * 0.035 : 0
    sopraVita.rotation.z = passo * 0.05
    mano.position.y = ALTO_MANI + sopraVita.position.y * SCALA
    colpo = Math.max(0, colpo - dt / 0.22)
    const su = porta ? -1.8 : passo * 0.6
    braccia[0].rotation.x = colpo ? -1.9 + Math.sin(colpo * Math.PI) * 1.1 : su
    braccia[1].rotation.x = porta ? -1.8 : -passo * 0.6
    braccia[0].rotation.z = porta ? 0.28 : 0.08
    braccia[1].rotation.z = porta ? -0.28 : -0.08
    coltello.visible = colpo > 0
  }
  return { g, figura, anima, mano, taglia() { colpo = 1 }, tagliando: () => colpo > 0 }
}

/** Si modella prima di aprire: non si ferma lo schermo a metà partita. `cuochi`: [{ veste, ruolo }]. */
export const preparaCuoco = (...cuochi) => { for (const c of cuochi) stampoDi(c.veste, c.ruolo) }
