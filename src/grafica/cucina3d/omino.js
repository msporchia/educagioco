// Il cuoco, nella creta (docs/fattoria3d/creta.md): corpo, due gambe e due braccia a parte, che si muovono coi perni.
// Guarda verso +z, i piedi a quota zero. Vedi docs/bancarella/cuoco.md.
import { Group, Mesh, MeshStandardMaterial, SphereGeometry } from 'three'
import { palla, osso, unione, dentro, sopra, pelle, scatolaDi, fra, verso, mosso } from '../../giochi/fattoria3d/scena3d/creta.js'
import { ombra, creaColtello } from './pezzi.js'

const SCALA = 0.72
const PELLE = 0xf2c6a0, GIACCA = 0xfbf7ee, GREMBIULE = 0x2f6f8f, FAZZOLETTO = 0xd2402e, CAPELLI = 0x5a3a22, SCARPE = 0x3a2a22
const opaco = lucido => new MeshStandardMaterial({ vertexColors: true, roughness: lucido, metalness: 0 })
const pezzo = (forma, passo, colore, lucido = 0.62) => new Mesh(pelle(forma, { ...scatolaDi(forma, 0.04), passo, colore }), opaco(lucido))

function busto() {
  const forma = unione([
    palla([0, 0.57, 0], [0.28, 0.31, 0.25]),
    palla([0, 0.45, 0.03], [0.27, 0.2, 0.25]),
    palla([0, 0.84, 0], [0.2, 0.075, 0.19]),                     // il fazzoletto al collo
    osso([0.07, 0.8, 0.19], [0.13, 0.68, 0.25], 0.04, 0.02),     // il nodo
  ], 0.05)
  return pezzo(forma, 0.024, (x, y, z, c) => {
    c.setHex(GIACCA)
    verso(c, 0xd9d3c6, fra(-0.04, -0.24, z) * 0.35)
    // il grembiule: davanti, dalla pancia in giù, con le due bretelle
    const davanti = z > 0.02
    if (davanti && y < 0.6 && Math.abs(x) < 0.27) { c.setHex(GREMBIULE); verso(c, 0x234f69, fra(0.3, 0.6, mosso(x, y, z, 14)) * 0.35) }
    if (davanti && y >= 0.6 && y < 0.78 && Math.abs(Math.abs(x) - 0.12) < 0.035) c.setHex(GREMBIULE)
    if (y > 0.765) { c.setHex(FAZZOLETTO); verso(c, 0x9d2a1f, fra(0.4, 0.8, mosso(x, y, z, 26)) * 0.5) }
    if (y > 0.67 && y <= 0.8 && x > 0.04 && z > 0.17) c.setHex(FAZZOLETTO)
  })
}

function testa() {
  const forma = unione([
    palla([0, 1.1, 0.02], [0.3, 0.28, 0.28]),
    palla([0, 1.05, 0.29], [0.06, 0.05, 0.06]),                  // il naso
    palla([0.3, 1.08, 0], [0.05, 0.075, 0.05]), palla([-0.3, 1.08, 0], [0.05, 0.075, 0.05]),
  ], 0.03)
  return pezzo(forma, 0.02, (x, y, z, c) => {
    c.setHex(PELLE)
    verso(c, 0xee8f78, fra(0.14, 0.04, Math.hypot(Math.abs(x) - 0.17, y - 1.02)) * 0.55)   // le guance
    if (z < 0.1 - Math.max(0, 1.03 - y) * 2.2 && Math.abs(x) < 0.29) c.setHex(CAPELLI)
    if (y > 1.23 && z < 0.24) c.setHex(CAPELLI)
  }, 0.5)
}

function cappello() {
  // basso e stretto: la telecamera sta in alto, e un cappello largo copre la faccia
  const puff = [[0, 0], [0.11, 0.03], [-0.11, 0.02], [0.03, 0.11], [-0.03, -0.11]]
  const forma = unione([
    osso([0, 1.31, -0.02], [0, 1.42, -0.03], 0.24, 0.25),
    ...puff.map(([x, z], i) => palla([x, 1.55 + (i ? -0.02 : 0.03), z - 0.03], [0.2, 0.15, 0.2])),
  ], 0.06)
  return pezzo(forma, 0.024, (x, y, z, c) => {
    c.setHex(0xfffdf8)
    const a = Math.atan2(z, x)
    if (y > 1.45) verso(c, 0xcfc9bd, fra(0.55, 1, Math.abs(Math.sin(a * 7))) * fra(1.45, 1.56, y) * 0.5)
    if (y < 1.42) verso(c, 0xe7e1d4, 0.5)
  }, 0.75)
}

function occhio(x) {
  const g = new Group()
  const nero = new Mesh(new SphereGeometry(0.05, 14, 10), new MeshStandardMaterial({ color: 0x1d1612, roughness: 0.18 }))
  nero.scale.set(0.82, 1.1, 0.5)
  const luce = new Mesh(new SphereGeometry(0.012, 8, 6), new MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6 }))
  luce.position.set(0.012, 0.02, 0.022)
  g.add(nero, luce)
  g.position.set(x, 1.13, 0.271)
  g.rotation.y = x * 1.6
  return g
}

function sorriso() {
  const forma = osso([-0.07, 0.975, 0.272], [0, 0.955, 0.292], 0.012, 0.012)
  const altra = osso([0.07, 0.975, 0.272], [0, 0.955, 0.292], 0.012, 0.012)
  return pezzo(unione([forma, altra], 0.008), 0.009, (x, y, z, c) => c.setHex(0x8e3b2c), 0.5)
}

function gamba() {
  const forma = unione([
    osso([0, 0, 0], [0, -0.27, 0], 0.095, 0.08),
    dentro(palla([0, -0.31, 0.06], [0.1, 0.08, 0.17]), sopra(-0.38), 0.01),
  ], 0.03)
  const g = new Group()
  g.add(pezzo(forma, 0.022, (x, y, z, c) => {
    c.setHex(0x3f4a5a)
    verso(c, 0x56647a, fra(0.3, 0.7, Math.abs(Math.sin(x * 60))) * 0.3)   // i pantaloni a quadretti
    if (y < -0.235) c.setHex(SCARPE)
  }))
  return g
}

function braccio(s) {
  const forma = unione([
    osso([0, 0, 0], [s * 0.04, -0.27, 0], 0.09, 0.075),
    palla([s * 0.045, -0.35, 0], 0.075),
  ], 0.02)
  const g = new Group()
  g.add(pezzo(forma, 0.02, (x, y, z, c) => {
    c.setHex(GIACCA)
    if (y < -0.25) verso(c, 0xd9d3c6, 0.5)
    if (y < -0.285) c.setHex(PELLE)
  }))
  return g
}

let stampo = null
function modella() {
  stampo = { busto: busto(), testa: testa(), cappello: cappello(), sorriso: sorriso(), gamba: gamba(), braccioD: braccio(1), braccioS: braccio(-1) }
}

/** Il cuoco: `g` si mette in scena, `anima(dt, stato)` lo fa muovere, `mano` è dove sta quello che porta. */
export function creaCuoco() {
  if (!stampo) modella()
  const figura = new Group()
  const sopraVita = new Group()
  // la testa guarda un po' in su, verso la telecamera: da sopra se no si vede solo il cappello
  const capo = new Group(), viso = new Group()
  viso.add(stampo.testa.clone(), stampo.cappello.clone(), stampo.sorriso.clone(), occhio(0.115), occhio(-0.115))
  viso.position.y = -0.85
  capo.add(viso); capo.position.y = 0.85; capo.rotation.x = -0.38
  sopraVita.add(stampo.busto.clone(), capo)
  const gambe = [0.13, -0.13].map(x => { const o = stampo.gamba.clone(); o.position.set(x, 0.39, 0); return o })
  const braccia = [[0.31, stampo.braccioD], [-0.31, stampo.braccioS]].map(([x, b]) => { const o = b.clone(); o.position.set(x, 0.74, 0); return o })
  const coltello = creaColtello()
  coltello.scale.setScalar(0.5); coltello.position.set(0.04, -0.37, 0.02); coltello.rotation.set(0, Math.PI, 0)
  coltello.visible = false
  braccia[0].add(coltello)
  figura.add(sopraVita, ...gambe, ...braccia)
  figura.scale.setScalar(SCALA)
  const mano = new Group(); mano.position.set(0, 0.5, 0.5); mano.scale.setScalar(0.8)

  const g = new Group()
  g.add(ombra(0.5), figura, mano)

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
    mano.position.y = 0.5 + sopraVita.position.y * SCALA
    colpo = Math.max(0, colpo - dt / 0.22)
    const su = porta ? -1.45 : passo * 0.6
    braccia[0].rotation.x = colpo ? -1.9 + Math.sin(colpo * Math.PI) * 1.1 : su
    braccia[1].rotation.x = porta ? -1.45 : -passo * 0.6
    braccia[0].rotation.z = porta ? 0.28 : 0.08
    braccia[1].rotation.z = porta ? -0.28 : -0.08
    coltello.visible = colpo > 0
  }
  return { g, anima, mano, taglia() { colpo = 1 }, tagliando: () => colpo > 0 }
}

/** Si modella prima di aprire: non si ferma lo schermo a metà partita. */
export const preparaCuoco = () => { if (!stampo) modella() }
