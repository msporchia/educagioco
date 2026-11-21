// La cucina attorno al cibo: la stanza, i fuochi, il forno a legna, il tagliere, i piatti. Vedi docs/bancarella/cucina.md.
import { Group, Mesh, MeshStandardMaterial, MeshBasicMaterial, BoxGeometry, CylinderGeometry, SphereGeometry, TorusGeometry, CircleGeometry,
         PlaneGeometry, RingGeometry, LatheGeometry, ExtrudeGeometry, Shape, Path, Vector2, CanvasTexture, SRGBColorSpace, RepeatWrapping, DoubleSide } from 'three'
import { impiatta, pieno } from './cibo.js'

const m = (geo, materiale, x = 0, y = 0, z = 0) => { const o = new Mesh(geo, materiale); o.position.set(x, y, z); return o }
const gruppo = (...cose) => { const g = new Group(); g.add(...cose); return g }
const giro = (punti, lati = 40) => new LatheGeometry(punti.map(([x, y]) => new Vector2(x, y)), lati)
const ACCIAIO = () => pieno(0xc9d0d6, 0.26, 0.92)
const GHISA = () => pieno(0x2d2f33, 0.55, 0.6)

function trama(lato, disegna, ripeti = 1) {
  const c = document.createElement('canvas'); c.width = c.height = lato
  disegna(c.getContext('2d'), lato)
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(ripeti, ripeti); t.anisotropy = 4
  return t
}
const caso = s => { let x = s; return () => (x = (x * 16807) % 2147483647) / 2147483647 }

function venature(g, n, base, scuro, seme) {
  const r = caso(seme)
  g.fillStyle = base; g.fillRect(0, 0, n, n)
  for (let i = 0; i < 90; i++) {
    const y = r() * n
    g.strokeStyle = scuro; g.globalAlpha = 0.05 + r() * 0.13; g.lineWidth = 1 + r() * 2.4
    g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(n * 0.3, y + r() * 16 - 8, n * 0.7, y + r() * 16 - 8, n, y); g.stroke()
  }
  g.globalAlpha = 1
}

const ombraTrama = () => trama(64, (g, n) => {
  const r = g.createRadialGradient(n / 2, n / 2, 2, n / 2, n / 2, n / 2)
  r.addColorStop(0, '#00000066'); r.addColorStop(1, '#00000000'); g.fillStyle = r; g.fillRect(0, 0, n, n)
})
let trOmbra = null
export function ombra(raggio) {
  trOmbra ||= ombraTrama()
  const o = m(new CircleGeometry(raggio, 20), new MeshBasicMaterial({ map: trOmbra, transparent: true, depthWrite: false }), 0, 0.07, 0)
  o.rotation.x = -Math.PI / 2
  return o
}

/* Il piatto: ceramica col filo blu sull'orlo. */
export function creaPiatto() {
  const coccio = pieno(0xfbf8f1, 0.2)
  const fondo = m(giro([[0, 0.02], [0.42, 0.02], [0.56, 0.06], [0.84, 0.16], [0.87, 0.19], [0.84, 0.2], [0.56, 0.1], [0.46, 0.08], [0, 0.08]], 48), coccio, 0, 0.05, 0)
  const filo = m(new RingGeometry(0.76, 0.81, 56), new MeshBasicMaterial({ color: 0x2f5fa8, side: DoubleSide }), 0, 0.235, 0)
  filo.rotation.x = -Math.PI / 2
  const filino = m(new RingGeometry(0.69, 0.705, 56), new MeshBasicMaterial({ color: 0x2f5fa8, side: DoubleSide }), 0, 0.2, 0)
  filino.rotation.x = -Math.PI / 2
  const g = gruppo(ombra(1.05), fondo, filo, filino)
  const sopra = new Group(); sopra.position.y = 0.13
  g.add(sopra)
  const anello = m(new TorusGeometry(0.9, 0.04, 8, 48), new MeshBasicMaterial({ color: 0x4fb36b, toneMapped: false }), 0, 0.11, 0)
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
  g.userData.sopra.clear()
  const c = impiatta(p)
  c.traverse(o => { if (o.isMesh) o.castShadow = true })
  g.userData.sopra.add(c)
}

function fiamma(colore, alto) {
  const o = m(giro([[0, 0], [0.05, 0.03], [0.07, 0.1], [0.04, 0.19], [0, alto]], 8), new MeshBasicMaterial({ color: colore, toneMapped: false }))
  return o
}

/* Il fornello: la piastra d'acciaio, la manopola, il bruciatore e la griglia di ghisa. */
function fornello() {
  const piastra = m(new BoxGeometry(1.68, 0.12, 1.62), pieno(0xb4bcc3, 0.34, 0.75), 0, 0.06, 0)
  const manopola = gruppo(m(new CylinderGeometry(0.09, 0.11, 0.09, 18), pieno(0x24262a, 0.4)), m(new BoxGeometry(0.02, 0.02, 0.09), pieno(0xffffff, 0.4), 0, 0.05, 0.04))
  manopola.position.set(0.68, 0.17, 0.66)
  const bruciatore = m(giro([[0, 0.12], [0.3, 0.12], [0.3, 0.16], [0.24, 0.2], [0, 0.2]], 24), pieno(0x3d4046, 0.5, 0.4))
  const griglia = new Group(), ghisa = GHISA()
  for (const a of [0, 1, 2, 3]) {
    const b = m(new BoxGeometry(0.62, 0.05, 0.06), ghisa, 0.46, 0.24, 0)
    const raggio = new Group(); raggio.add(b); raggio.rotation.y = a * Math.PI / 2 + Math.PI / 4
    griglia.add(raggio)
  }
  const anello = m(new TorusGeometry(0.76, 0.03, 8, 40), ghisa, 0, 0.24, 0); anello.rotation.x = Math.PI / 2
  griglia.add(anello)
  const fiamme = new Group()
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2
    const f = fiamma(i % 2 ? 0x6fb6ff : 0xffb13a, 0.3)
    f.position.set(Math.cos(a) * 0.28, 0.18, Math.sin(a) * 0.28)
    fiamme.add(f)
  }
  fiamme.visible = false
  const g = gruppo(piastra, manopola, bruciatore, griglia, fiamme)
  g.userData.fiamme = fiamme
  return g
}

export function creaPentola() {
  const fuoco = fornello(), base = gruppo(ombra(1.25), fuoco)
  const pentola = new Group(); pentola.position.y = 0.27
  const acciaio = ACCIAIO()
  const corpo = m(giro([[0, 0], [0.62, 0], [0.68, 0.04], [0.7, 0.1], [0.7, 0.72], [0.74, 0.76], [0.74, 0.79], [0.69, 0.79], [0.66, 0.74], [0.66, 0.1], [0.6, 0.05], [0, 0.05]], 48), acciaio)
  corpo.material.side = DoubleSide
  const fascia = m(new TorusGeometry(0.705, 0.012, 6, 48), pieno(0x8a9299, 0.3, 0.9), 0, 0.2, 0); fascia.rotation.x = Math.PI / 2
  const manici = [-1, 1].map(s => {
    const ansa = m(new TorusGeometry(0.13, 0.03, 8, 16, Math.PI), pieno(0x2d2f33, 0.45), s * 0.71, 0.62, 0)
    ansa.rotation.set(Math.PI / 2, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2)
    return ansa
  })
  const acqua = m(new CircleGeometry(0.665, 40), new MeshStandardMaterial({ color: 0x9fd0ea, roughness: 0.08, metalness: 0.2 }), 0, 0.6, 0)
  acqua.rotation.x = -Math.PI / 2
  const dentro = new Group(); dentro.position.y = 0.53
  const bolle = new Group()
  for (let i = 0; i < 12; i++) bolle.add(m(new SphereGeometry(0.04 + (i % 3) * 0.015, 8, 6), new MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.75 })))
  bolle.position.y = 0.6
  pentola.add(corpo, fascia, ...manici, acqua, dentro, bolle)
  base.add(pentola)
  base.userData = { fiamme: fuoco.userData.fiamme, tiene: pentola, acqua, dentro, bolle, firma: '' }
  return base
}

export function creaPadella() {
  const fuoco = fornello(), base = gruppo(ombra(1.25), fuoco)
  const padella = new Group(); padella.position.y = 0.27
  const nero = pieno(0x26282c, 0.3, 0.4)
  const corpo = m(giro([[0, 0], [0.62, 0], [0.72, 0.04], [0.8, 0.2], [0.82, 0.22], [0.78, 0.22], [0.68, 0.08], [0.6, 0.05], [0, 0.05]], 48), nero)
  const dentroPan = m(new CircleGeometry(0.64, 40), pieno(0x3a3d42, 0.32, 0.3), 0, 0.055, 0); dentroPan.rotation.x = -Math.PI / 2
  const attacco = m(new BoxGeometry(0.3, 0.05, 0.13), pieno(0xb4bcc3, 0.3, 0.85), 0.92, 0.2, 0)
  const manico = m(new CylinderGeometry(0.075, 0.055, 0.9, 12), pieno(0x5b3a26, 0.5), 1.46, 0.23, 0)
  manico.rotation.z = Math.PI / 2 + 0.06
  const borchie = [-0.04, 0.04].map(z => m(new SphereGeometry(0.018, 8, 6), pieno(0xd5dade, 0.25, 0.9), 0.84, 0.23, z))
  const dentro = new Group(); dentro.position.y = 0.06
  padella.add(corpo, dentroPan, attacco, manico, ...borchie, dentro)
  base.add(padella)
  base.userData = { fiamme: fuoco.userData.fiamme, tiene: padella, dentro, firma: '' }
  return base
}

/* Il tagliere col manico e il solco per il sugo. */
export function creaTagliere() {
  const s = new Shape(), w = 0.86, h = 0.62, r = 0.16
  s.moveTo(-w + r, -h); s.lineTo(w - r, -h); s.quadraticCurveTo(w, -h, w, -h + r); s.lineTo(w, h - r); s.quadraticCurveTo(w, h, w - r, h)
  s.lineTo(-w + r, h); s.quadraticCurveTo(-w, h, -w, h - r); s.lineTo(-w, -h + r); s.quadraticCurveTo(-w, -h, -w + r, -h)
  const buco = new Path(); buco.absarc(w - 0.14, h - 0.14, 0.06, 0, Math.PI * 2, true); s.holes.push(buco)
  const geo = new ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.022, bevelThickness: 0.022, bevelSegments: 3, curveSegments: 10 })
  geo.rotateX(-Math.PI / 2)
  const legno = trama(256, (g, n) => venature(g, n, '#deb582', '#8f5f30', 3))
  legno.repeat.set(0.6, 0.6)
  const asse = m(geo, new MeshStandardMaterial({ map: legno, roughness: 0.55 }), 0, 0.03, 0)
  const solco = m(new RingGeometry(0.97, 1, 48), pieno(0xbb9060, 0.7, 0), -0.02, 0.158, 0)
  solco.scale.set(0.8, 0.54, 1); solco.rotation.x = -Math.PI / 2
  const base = gruppo(ombra(1.3), asse, solco)
  const dentro = new Group(); dentro.position.set(-0.14, 0.16, 0)
  base.add(dentro)
  base.userData = { tiene: dentro, dentro, firma: '' }
  return base
}

/* Il coltello da cuoco: lama affusolata, manico con tre rivetti. */
export function creaColtello() {
  const s = new Shape()
  s.moveTo(0, 0); s.lineTo(0.09, 0); s.quadraticCurveTo(0.12, -0.42, 0, -0.86); s.quadraticCurveTo(-0.05, -0.4, 0, 0)
  const lama = new ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false, curveSegments: 12 })
  lama.rotateX(-Math.PI / 2)
  const manico = m(new BoxGeometry(0.1, 0.06, 0.42), pieno(0x3a2418, 0.45), 0.045, 0.01, 0.2)
  const rivetti = [0.08, 0.2, 0.32].map(z => m(new CylinderGeometry(0.014, 0.014, 0.07, 8), pieno(0xd5dade, 0.25, 0.9), 0.045, 0.01, z))
  return gruppo(m(lama, ACCIAIO()), manico, ...rivetti)
}

/* Il forno a legna: la cupola di mattoni, la bocca ad arco, il piano di pietra davanti. */
function mattoni(alto) {
  return trama(256, (g, n) => {
    g.fillStyle = '#8f7a68'; g.fillRect(0, 0, n, n)
    const r = caso(alto ? 17 : 23), righe = 8, h = n / righe
    for (let y = 0; y < righe; y++) for (let x = -1; x < 5; x++) {
      const c = ['#b2553a', '#c0623f', '#a54a33', '#c9724c'][Math.floor(r() * 4)]
      g.fillStyle = c; g.fillRect(x * 64 + (y % 2) * 32 + 2, y * h + 2, 60, h - 4)
    }
  })
}
export function creaForno() {
  const tr = mattoni(true); tr.repeat.set(5, 2)
  // solo la metà di dietro: davanti c'è la facciata con la bocca
  const profilo = [[1.05, 0.2], [1.04, 0.56], [0.96, 0.92], [0.74, 1.24], [0.42, 1.44], [0, 1.5]].map(([x, y]) => new Vector2(x, y))
  const cupola = m(new LatheGeometry(profilo, 24, Math.PI / 2, Math.PI), new MeshStandardMaterial({ map: tr, roughness: 0.85 }), 0, 0, -0.2)
  const pietra = pieno(0xb8b0a2, 0.8)
  const piano = m(new BoxGeometry(2.3, 0.2, 2.4), pietra, 0, 0.1, 0.05)
  const bordo = m(new BoxGeometry(2.42, 0.06, 2.5), pieno(0x958c7e, 0.8), 0, 0.2, 0.05)
  // la facciata con la bocca: un arco di mattoni, dentro è buio e c'è la brace
  const s = new Shape()
  s.moveTo(-1.05, 0); s.lineTo(1.05, 0); s.lineTo(1.05, 0.28); s.absarc(0, 0.28, 1.05, 0, Math.PI, false); s.lineTo(-1.05, 0)
  const bocca = new Path()
  bocca.moveTo(-0.76, 0); bocca.lineTo(0.76, 0); bocca.lineTo(0.76, 0.14); bocca.absarc(0, 0.14, 0.76, 0, Math.PI, false); bocca.lineTo(-0.76, 0)
  s.holes.push(bocca)
  const facciataT = mattoni(false); facciataT.repeat.set(0.5, 0.5)
  const facciata = m(new ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: false, curveSegments: 18 }), new MeshStandardMaterial({ map: facciataT, roughness: 0.85 }), 0, 0.2, -0.2)
  const buio = m(new SphereGeometry(0.92, 20, 12), new MeshBasicMaterial({ color: 0x17100c }), 0, 0.3, -0.5)
  buio.scale.set(1, 1.05, 0.72)
  const brace = m(new CircleGeometry(0.72, 24), new MeshBasicMaterial({ color: 0x3a2018, toneMapped: false }), 0, 0.235, -0.1); brace.rotation.x = -Math.PI / 2
  const legna = new Group()
  for (const [x, a] of [[-0.3, 0.3], [0.05, -0.2], [0.34, 0.5]]) {
    const c = m(new CylinderGeometry(0.075, 0.08, 0.7, 10), pieno(0x4a2d1a, 0.8), x, 0.3, -0.12); c.rotation.set(0, a, Math.PI / 2); legna.add(c)
  }
  const camino = m(new CylinderGeometry(0.15, 0.18, 0.5, 14), pieno(0x6a635b, 0.7), 0.5, 1.5, -0.65)
  const dentro = new Group(); dentro.position.set(0, 0.235, 0.42)
  const forno = gruppo(piano, bordo, buio, cupola, facciata, brace, legna, camino, dentro)
  forno.scale.setScalar(0.84)
  const base = gruppo(ombra(1.5), forno)
  base.userData = { brace, dentro, tiene: dentro, firma: '' }
  return base
}

// la barra sopra una stazione: guarda sempre la telecamera
export function creaBarra() {
  const g = new Group()
  const fondo = m(new PlaneGeometry(1.3, 0.24), new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5, depthTest: false }))
  const dentro = m(new PlaneGeometry(1.14, 0.14), new MeshBasicMaterial({ color: 0x5fd07f, depthTest: false, toneMapped: false }), 0, 0, 0.001)
  fondo.renderOrder = 5; dentro.renderOrder = 6
  g.add(fondo, dentro)
  g.userData.pieno = dentro
  g.visible = false
  return g
}

// il cartellino di ardesia: si legge da lontano
export function creaEtichetta(testo) {
  const t = trama(256, (g, n) => {
    g.clearRect(0, 0, n, n)
    g.font = '800 42px "Emoji Gioco", "Noto Sans", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
    const w = g.measureText(testo).width + 40
    g.fillStyle = '#34383be6'; g.beginPath(); g.roundRect((n - w) / 2, n / 2 - 33, w, 66, 12); g.fill()
    g.strokeStyle = '#c9a26a'; g.lineWidth = 4; g.stroke()
    g.fillStyle = '#fffdf7'; g.fillText(testo, n / 2, n / 2 + 3)
  })
  const o = m(new PlaneGeometry(1.5, 1.5), new MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }))
  o.rotation.x = -Math.PI / 2
  return o
}
