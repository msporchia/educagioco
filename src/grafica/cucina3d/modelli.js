// Le cose della cucina in 3D: forme semplici, morbide e opache. Vedi docs/bancarella/cucina.md.
import { Group, Mesh, MeshStandardMaterial, MeshBasicMaterial, BoxGeometry, CylinderGeometry, SphereGeometry, TorusGeometry, ConeGeometry,
         CircleGeometry, PlaneGeometry, LatheGeometry, Vector2, CanvasTexture, SRGBColorSpace, RepeatWrapping, DoubleSide } from 'three'

export const mat = (color, roughness = 0.7, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness })
const m = (geo, materiale, x = 0, y = 0, z = 0) => { const o = new Mesh(geo, materiale); o.position.set(x, y, z); return o }
const gruppo = (...cose) => { const g = new Group(); g.add(...cose); return g }
const giro = punti => new LatheGeometry(punti.map(([x, y]) => new Vector2(x, y)), 28)
const palla = (r, colore, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => {
  const o = m(new SphereGeometry(r, 18, 14), mat(colore), x, y, z); o.scale.set(sx, sy, sz); return o
}

function trama(lato, disegna) {
  const c = document.createElement('canvas'); c.width = c.height = lato
  disegna(c.getContext('2d'), lato)
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.wrapS = t.wrapT = RepeatWrapping
  return t
}

export function creaStanza(scena) {
  const legno = trama(256, (g, n) => {
    g.fillStyle = '#c49a6c'; g.fillRect(0, 0, n, n)
    for (let i = 0; i < 4; i++) {
      g.fillStyle = ['#c9a074', '#bd9265', '#c59b6e', '#b98e60'][i]; g.fillRect(0, i * n / 4, n, n / 4 - 2)
      g.strokeStyle = '#00000014'
      for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(0, i * n / 4 + k * 9 + 4); g.bezierCurveTo(n / 3, i * n / 4 + k * 9, n * 0.6, i * n / 4 + k * 9 + 8, n, i * n / 4 + k * 9 + 3); g.stroke() }
    }
  })
  legno.repeat.set(3, 3)
  const piano = m(new BoxGeometry(14, 0.4, 13), new MeshStandardMaterial({ map: legno, roughness: 0.75 }), 0, -0.2, 3)
  const mattonelle = trama(128, (g, n) => {
    g.fillStyle = '#e9dfc9'; g.fillRect(0, 0, n, n)
    g.fillStyle = '#f6efdf'
    for (const [x, y] of [[2, 2], [66, 2], [2, 66], [66, 66]]) g.fillRect(x, y, 60, 60)
  })
  mattonelle.repeat.set(6, 3)
  const muro = m(new PlaneGeometry(14, 6), new MeshStandardMaterial({ map: mattonelle, roughness: 0.6 }), 0, 3, -3.5)
  scena.add(piano, muro)
}

// l'ombra morbida sotto una cosa: costa niente e la attacca al tavolo
const ombraTrama = () => trama(64, (g, n) => {
  const r = g.createRadialGradient(n / 2, n / 2, 2, n / 2, n / 2, n / 2)
  r.addColorStop(0, '#000000aa'); r.addColorStop(1, '#00000000'); g.fillStyle = r; g.fillRect(0, 0, n, n)
})
let trOmbra = null
export function ombra(raggio) {
  trOmbra ||= ombraTrama()
  const o = m(new CircleGeometry(raggio, 20), new MeshBasicMaterial({ map: trOmbra, transparent: true, depthWrite: false }), 0, 0.012, 0)
  o.rotation.x = -Math.PI / 2
  return o
}

/* Il cibo: lo stesso pezzo sul piatto, sul fuoco e nelle mani. `alto` è quanto occupa. */
function spaghetti(colore = 0xf2cf6b, largo = 0.5) {
  const g = new Group(), materiale = mat(colore, 0.6)
  for (let i = 0; i < 5; i++) {
    const a = m(new TorusGeometry(largo * (0.45 + (i % 3) * 0.22), 0.045, 8, 22), materiale, Math.sin(i * 2.1) * 0.13, 0.05 + i * 0.022, Math.cos(i * 1.7) * 0.13)
    a.rotation.x = Math.PI / 2 + Math.sin(i) * 0.3
    a.rotation.y = Math.cos(i * 2) * 0.3
    g.add(a)
  }
  return g
}

export function cibo(cosa, { bruciato = false, crudo = false } = {}) {
  const scuro = c => (bruciato ? 0x2b2018 : c)
  let g, alto = 0.12
  if (cosa === 'pasta') g = spaghetti(scuro(0xf2cf6b))
  else if (cosa === 'sugo') { g = gruppo(palla(0.42, 0xc8321f, 0, 0.03, 0, 1, 0.25, 1), palla(0.1, 0x4d8f3c, 0.1, 0.13, -0.05, 1, 0.4, 1.4)); alto = 0.1 }
  else if (cosa === 'pane') { g = gruppo(palla(0.5, 0xc98a45, 0, 0.1, 0, 1, 0.34, 0.86), palla(0.47, 0xf0d9a8, 0, 0.05, 0, 1, 0.24, 0.84)); alto = 0.26 }
  else if (cosa === 'formaggio') { const f = m(new BoxGeometry(0.72, 0.07, 0.72), mat(0xf4c542, 0.5), 0, 0.04, 0); f.rotation.y = 0.5; g = gruppo(f); alto = 0.08 }
  else if (cosa === 'insalata') { g = gruppo(...[[0, 0], [0.22, 0.1], [-0.22, 0.08], [0.1, -0.2], [-0.14, -0.18]].map(([x, z], i) => palla(0.2, i % 2 ? 0x6fb54b : 0x8acb5c, x, 0.08 + (i % 2) * 0.05, z, 1, 0.45, 1))); alto = 0.16 }
  else if (cosa === 'carne') { g = gruppo(m(new CylinderGeometry(0.42, 0.44, 0.13, 22), mat(scuro(crudo ? 0xc4504e : 0x6d3a22), 0.8), 0, 0.07, 0)); alto = 0.14 }
  else if (cosa === 'uovo') { g = gruppo(palla(0.46, scuro(0xfff8ea), 0, 0.03, 0, 1, 0.13, 0.86), palla(0.17, scuro(0xf5b21c), 0.02, 0.1, 0, 1, 0.62, 1)); alto = 0.14 }
  else if (cosa === 'impasto') { g = gruppo(m(new CylinderGeometry(0.62, 0.65, 0.08, 26), mat(0xeed7a8, 0.85), 0, 0.04, 0)); alto = 0.07 }
  else if (cosa === 'pizza') {
    const pezzi = [m(new CylinderGeometry(0.64, 0.66, 0.09, 26), mat(scuro(0xd9a35a), 0.85), 0, 0.05, 0), m(new CylinderGeometry(0.55, 0.55, 0.03, 26), mat(scuro(0xc8321f)), 0, 0.1, 0),
                   m(new CylinderGeometry(0.5, 0.5, 0.02, 24), mat(scuro(0xf6dc7c), 0.5), 0, 0.12, 0)]
    if (!bruciato) for (let i = 0; i < 6; i++) pezzi.push(palla(0.07, 0xa83226, Math.cos(i) * 0.3, 0.14, Math.sin(i * 1.7) * 0.32, 1, 0.3, 1))
    g = gruppo(...pezzi); alto = 0.14
  } else g = new Group()
  g.userData.alto = alto
  return g
}

/* I pezzi in dispensa: si riconoscono da fermi, e nelle mani sono gli stessi. */
export function confezione(cosa) {
  if (cosa === 'pasta') {
    const scatola = m(new BoxGeometry(0.62, 0.8, 0.26), mat(0x2f6fb5), 0, 0.4, 0)
    const finestra = m(new PlaneGeometry(0.42, 0.34), mat(0xf2d27a, 0.5), 0, 0.46, 0.135)
    return gruppo(scatola, finestra)
  }
  if (cosa === 'sugo') {
    const vaso = m(giro([[0, 0], [0.28, 0], [0.32, 0.08], [0.32, 0.58], [0.22, 0.68], [0, 0.68]]), mat(0xc8321f, 0.35))
    const tappo = m(new CylinderGeometry(0.24, 0.24, 0.1, 20), mat(0xf1e6cc, 0.4), 0, 0.73, 0)
    return gruppo(vaso, tappo)
  }
  if (cosa === 'pane') return gruppo(palla(0.42, 0xc98a45, 0, 0.26, 0, 1.15, 0.68, 0.8))
  if (cosa === 'formaggio') {
    const f = m(new CylinderGeometry(0.46, 0.46, 0.36, 22, 1, false, 0, Math.PI * 1.45), mat(0xf4c542, 0.5), 0, 0.19, 0)
    return gruppo(f)
  }
  if (cosa === 'insalata') return gruppo(...[[0, 0.26, 0, 0.36], [0.2, 0.2, 0.1, 0.24], [-0.2, 0.2, 0.08, 0.24], [0, 0.22, -0.2, 0.24], [0.05, 0.42, 0.05, 0.2]].map(([x, y, z, r], i) =>
    palla(r, i % 2 ? 0x6fb54b : 0x8acb5c, x, y, z)))
  if (cosa === 'carne') return gruppo(m(new CylinderGeometry(0.5, 0.5, 0.06, 22), mat(0xf4f1ea), 0, 0.03, 0), ...[0, 1].map(i => { const c = cibo('carne', { crudo: true }); c.position.y = 0.06 + i * 0.12; return c }))
  if (cosa === 'uovo') return gruppo(palla(0.24, 0xf4e6d2, 0, 0.3, 0, 1, 1.28, 1), m(new CylinderGeometry(0.22, 0.14, 0.16, 18), mat(0xdcd2bf), 0, 0.08, 0))
  if (cosa === 'impasto') return gruppo(palla(0.4, 0xeed7a8, 0, 0.26, 0, 1.1, 0.66, 1.1))
  return new Group()
}

const PIATTO = () => m(giro([[0, 0.03], [0.5, 0.03], [0.72, 0.1], [0.82, 0.14], [0.8, 0.16], [0.5, 0.07], [0, 0.07]]), mat(0xfffdf7, 0.35))
export function creaPiatto() {
  const g = gruppo(ombra(1.05), PIATTO())
  const sopra = new Group(); sopra.position.y = 0.07
  g.add(sopra)
  // l'anello che dice che è pronto o che va in forno
  const anello = m(new TorusGeometry(0.88, 0.05, 8, 40), new MeshBasicMaterial({ color: 0x4fb36b }), 0, 0.03, 0)
  anello.rotation.x = Math.PI / 2; anello.visible = false
  g.add(anello)
  g.userData = { sopra, anello, firma: '' }
  return g
}
export function riempiPiatto(g, p) {
  const firma = p ? p.cose.join() + (p.pronto ? '!' : '') : ''
  g.userData.anello.visible = !!p && (!!p.pronto || p.daInfornare)
  if (p) g.userData.anello.material.color.setHex(p.pronto ? 0x4fb36b : 0xff9f1c)
  if (firma === g.userData.firma) return
  g.userData.firma = firma
  const s = g.userData.sopra
  s.clear()
  let y = 0
  for (const cosa of p ? p.cose : []) {
    const c = cibo(cosa); c.position.y = y; s.add(c); y += c.userData.alto
  }
}

function fornello() {
  const g = gruppo(m(new BoxGeometry(1.5, 0.14, 1.5), mat(0x4c5056, 0.5), 0, 0.07, 0), m(new TorusGeometry(0.46, 0.05, 8, 28), mat(0x24262a, 0.5), 0, 0.15, 0))
  g.children[1].rotation.x = Math.PI / 2
  const fiamme = new Group()
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2
    const f = m(new ConeGeometry(0.075, 0.24, 7), new MeshBasicMaterial({ color: i % 2 ? 0xffa12b : 0xffd257 }), Math.cos(a) * 0.46, 0.25, Math.sin(a) * 0.46)
    fiamme.add(f)
  }
  fiamme.visible = false
  g.add(fiamme)
  g.userData.fiamme = fiamme
  return g
}

export function creaPentola() {
  const base = gruppo(ombra(1.1), fornello())
  const pentola = new Group(); pentola.position.y = 0.16
  const metallo = mat(0xb5bdc4, 0.32, 0.65)
  const corpo = m(giro([[0, 0], [0.66, 0], [0.7, 0.04], [0.72, 0.72], [0.76, 0.76], [0.68, 0.76], [0.64, 0.06], [0, 0.06]]), metallo)
  corpo.material.side = DoubleSide
  const manici = [-1, 1].map(s => m(new BoxGeometry(0.26, 0.07, 0.2), mat(0x3a3d41, 0.5), s * 0.86, 0.6, 0))
  const acqua = m(new CircleGeometry(0.66, 28), mat(0x9fd0ea, 0.2), 0, 0.6, 0)
  acqua.rotation.x = -Math.PI / 2
  const dentro = new Group(); dentro.position.y = 0.58
  pentola.add(corpo, ...manici, acqua, dentro)
  base.add(pentola)
  base.userData = { ...base.userData, fiamme: base.children[1].userData.fiamme, tiene: pentola, acqua, dentro, firma: '' }
  return base
}

export function creaPadella() {
  const base = gruppo(ombra(1.1), fornello())
  const padella = new Group(); padella.position.y = 0.2
  const corpo = m(giro([[0, 0], [0.7, 0], [0.76, 0.16], [0.72, 0.16], [0.66, 0.05], [0, 0.05]]), mat(0x33363a, 0.45, 0.3))
  const manico = m(new BoxGeometry(0.8, 0.07, 0.14), mat(0x5b3a26, 0.6), 1.1, 0.16, 0)
  const dentro = new Group(); dentro.position.y = 0.06
  padella.add(corpo, manico, dentro)
  base.add(padella)
  base.userData = { ...base.userData, fiamme: base.children[1].userData.fiamme, tiene: padella, dentro, firma: '' }
  return base
}

export function creaTagliere() {
  const base = gruppo(ombra(1.25), m(new BoxGeometry(1.75, 0.12, 1.3), mat(0xdcb27f, 0.75), 0, 0.06, 0))
  const dentro = new Group(); dentro.position.set(-0.12, 0.12, 0)
  base.add(dentro)
  base.userData = { ...base.userData, tiene: dentro, dentro, firma: '' }
  return base
}

export function creaColtello() {
  const lama = m(new BoxGeometry(0.1, 0.03, 0.74), mat(0xd5dade, 0.25, 0.7), 0, 0, -0.34)
  const manico = m(new BoxGeometry(0.14, 0.09, 0.42), mat(0x4a2f1e, 0.6), 0, 0, 0.22)
  return gruppo(lama, manico)
}

export function creaForno() {
  const nero = mat(0x2b2e32, 0.5), corpo = mat(0x8f979e, 0.4, 0.3)
  const base = gruppo(ombra(1.5))
  base.add(m(new BoxGeometry(1.9, 0.2, 1.5), corpo, 0, 0.1, 0), m(new BoxGeometry(1.9, 0.26, 1.5), corpo, 0, 1.33, 0),
           m(new BoxGeometry(0.18, 1.1, 1.5), corpo, -0.86, 0.75, 0), m(new BoxGeometry(0.18, 1.1, 1.5), corpo, 0.86, 0.75, 0),
           m(new BoxGeometry(1.6, 1.1, 0.12), nero, 0, 0.75, -0.68))
  const brace = m(new BoxGeometry(1.54, 0.03, 1.2), new MeshBasicMaterial({ color: 0x3a3029 }), 0, 0.22, 0)
  const dentro = new Group(); dentro.position.y = 0.24
  base.add(brace, dentro)
  base.userData = { ...base.userData, brace, dentro, tiene: dentro, firma: '' }
  return base
}

export function creaBidone() {
  const g = gruppo(ombra(0.62), m(giro([[0, 0], [0.4, 0], [0.5, 0.82], [0.46, 0.82], [0.36, 0.05], [0, 0.05]]), mat(0x8a9a90, 0.55)))
  const buio = m(new CircleGeometry(0.46, 22), mat(0x3a423e, 0.9), 0, 0.76, 0)
  buio.rotation.x = -Math.PI / 2
  g.add(buio)
  return g
}

// la barra sopra una stazione: guarda sempre la telecamera
export function creaBarra() {
  const g = new Group()
  const fondo = m(new PlaneGeometry(1.3, 0.24), new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5, depthTest: false }))
  const pieno = m(new PlaneGeometry(1.14, 0.14), new MeshBasicMaterial({ color: 0x4fb36b, depthTest: false, toneMapped: false }), 0, 0, 0.001)
  fondo.renderOrder = 5; pieno.renderOrder = 6
  g.add(fondo, pieno)
  g.userData.pieno = pieno
  g.visible = false
  return g
}

export function creaEtichetta(testo) {
  const t = trama(256, (g, n) => {
    g.clearRect(0, 0, n, n)
    g.font = '800 42px "Noto Sans", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
    const w = g.measureText(testo).width + 36
    g.fillStyle = '#fffdf7e6'; g.beginPath(); g.roundRect((n - w) / 2, n / 2 - 34, w, 68, 22); g.fill()
    g.fillStyle = '#5a4632'; g.fillText(testo, n / 2, n / 2 + 3)
  })
  const o = m(new PlaneGeometry(1.5, 1.5), new MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }))
  o.rotation.x = -Math.PI / 2
  return o
}
