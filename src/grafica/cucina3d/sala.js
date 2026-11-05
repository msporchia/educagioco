// La stanza del cuoco: pavimento, muri, banconi, cassette, la pila dei piatti, la consegna. Vedi docs/bancarella/cucina.md.
import { Group, Mesh, MeshStandardMaterial, MeshBasicMaterial, BoxGeometry, PlaneGeometry, CylinderGeometry, SphereGeometry, LatheGeometry, TubeGeometry, CircleGeometry,
         CatmullRomCurve3, Vector2, Vector3, CanvasTexture, SRGBColorSpace, RepeatWrapping, DoubleSide } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { creaPiatto, creaBidone, creaEtichetta } from './pezzi.js'
import { pieno } from './cibo.js'

export const ALTO = 0.62    // il piano dei banconi
const MURO = 8              // alto: sullo schermo lungo riempie quello che avanza sopra la stanza

const m = (geo, materiale, x = 0, y = 0, z = 0) => { const o = new Mesh(geo, materiale); o.position.set(x, y, z); return o }
function trama(lato, disegna, ripeti = [1, 1]) {
  const c = document.createElement('canvas'); c.width = c.height = lato
  disegna(c.getContext('2d'), lato)
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(...ripeti); t.anisotropy = 4
  return t
}
const caso = s => { let x = s; return () => (x = (x * 16807) % 2147483647) / 2147483647 }

// il pavimento a scacchi: due colori che si leggono, e ogni casella è larga quanto un passo
const tramaPavimento = (lx, lz) => trama(256, (g, n) => {
  const h = n / 2, r = caso(19)
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
    g.fillStyle = (x + y) % 2 ? '#d9c6a3' : '#f1e6cf'
    g.fillRect(x * h, y * h, h, h)
    for (let i = 0; i < 26; i++) {
      g.fillStyle = (x + y) % 2 ? '#b89f7633' : '#d8c9ab33'
      g.fillRect(x * h + r() * h, y * h + r() * h, 2 + r() * 8, 1 + r() * 3)
    }
    g.strokeStyle = '#9d8a6a66'; g.lineWidth = 2; g.strokeRect(x * h + 1, y * h + 1, h - 2, h - 2)
  }
}, [lx / 2, lz / 2])

const tramaMuro = (l, h) => trama(256, (g, n) => {
  g.fillStyle = '#b8c7c2'; g.fillRect(0, 0, n, n)
  const r = caso(11)
  for (let y = 0; y < 4; y++) for (let x = -1; x < 5; x++) {
    const v = 214 + Math.floor(r() * 16)
    g.fillStyle = `rgb(${v - 8},${v + 8},${v + 2})`
    g.fillRect(x * 64 + (y % 2) * 32 + 2, y * 64 + 2, 60, 60)
    g.fillStyle = '#ffffff33'; g.fillRect(x * 64 + (y % 2) * 32 + 5, y * 64 + 4, 54, 9)
  }
}, [l / 2, h / 2])

// lo sportello del mobile, visto su ogni lato: smalto, riquadro e pomello
const tramaMobile = () => trama(256, (g, n) => {
  g.fillStyle = '#39708a'; g.fillRect(0, 0, n, n)
  g.fillStyle = '#2d5b72'; g.fillRect(0, 0, 6, n); g.fillRect(n - 6, 0, 6, n)
  g.fillStyle = '#4a86a1'; g.fillRect(26, 22, n - 52, n - 52)
  g.fillStyle = '#39708a'; g.fillRect(36, 32, n - 72, n - 72)
  g.fillStyle = '#25485b'; g.fillRect(0, n - 22, n, 22)
  g.fillStyle = '#e8c977'; g.beginPath(); g.arc(n / 2, 48, 9, 0, 7); g.fill()
})

const tramaPiano = () => trama(256, (g, n) => {
  g.fillStyle = '#d8a86e'; g.fillRect(0, 0, n, n)
  const r = caso(7)
  for (let i = 0; i < 5; i++) { g.fillStyle = '#00000018'; g.fillRect(0, i * n / 5, n, 2) }
  for (let i = 0; i < 70; i++) {
    const y = r() * n
    g.strokeStyle = '#7a4c28'; g.globalAlpha = 0.05 + r() * 0.1; g.lineWidth = 1 + r() * 2
    g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(n * 0.3, y + r() * 12 - 6, n * 0.7, y + r() * 12 - 6, n, y); g.stroke()
  }
  g.globalAlpha = 1
})

/** I banconi: due sole geometrie unite, perché sono venticinque celle e il telefono conta le chiamate. */
function creaBanconi(celle) {
  const mobili = [], piani = [], acciai = []
  for (const c of celle) {
    if (c.tipo === 'bidone') continue
    const mobile = new BoxGeometry(0.98, ALTO - 0.06, 0.98); mobile.translate(c.x + 0.5, (ALTO - 0.06) / 2, c.z + 0.5)
    mobili.push(mobile)
    const piano = new RoundedBoxGeometry(1, 0.09, 1, 2, 0.03); piano.translate(c.x + 0.5, ALTO - 0.045, c.z + 0.5)
    ;(c.tipo === 'consegna' || c.tipo === 'lavello' ? acciai : piani).push(piano)
  }
  const g = new Group()
  const a = m(mergeGeometries(mobili), new MeshStandardMaterial({ map: tramaMobile(), roughness: 0.42 }))
  const b = m(mergeGeometries(piani), new MeshStandardMaterial({ map: tramaPiano(), roughness: 0.5 }))
  a.receiveShadow = b.receiveShadow = true
  g.add(a, b)
  if (acciai.length) { const s = m(mergeGeometries(acciai), pieno(0xd4d9dd, 0.28, 0.9)); s.receiveShadow = true; g.add(s) }
  return g
}

export function creaSala(scena, celle, largo, fondo) {
  const pavimento = m(new PlaneGeometry(largo, fondo), new MeshStandardMaterial({ map: tramaPavimento(largo, fondo), roughness: 0.55 }), largo / 2, 0, fondo / 2)
  pavimento.rotation.x = -Math.PI / 2; pavimento.receiveShadow = true
  const muro = m(new PlaneGeometry(largo + 0.4, MURO), new MeshStandardMaterial({ map: tramaMuro(largo + 0.4, MURO), roughness: 0.3 }), largo / 2, MURO / 2, -0.02)
  const fianchi = [-0.02, largo + 0.02].map((x, i) => {
    const f = m(new PlaneGeometry(fondo, MURO), new MeshStandardMaterial({ map: tramaMuro(fondo, MURO), roughness: 0.3 }), x, MURO / 2, fondo / 2)
    f.rotation.y = i ? -Math.PI / 2 : Math.PI / 2
    return f
  })
  scena.add(pavimento, muro, ...fianchi, creaBanconi(celle))
}

/** La cassetta di legno: quattro sponde a doghe, il fondo buio, e la roba che sporge. */
let doghe = null
export function creaCassetta() {
  if (!doghe) {
    const parti = []
    for (const [lx, lz, x, z] of [[0.86, 0.05, 0, 0.4], [0.86, 0.05, 0, -0.4], [0.05, 0.86, 0.4, 0], [0.05, 0.86, -0.4, 0]]) {
      for (const y of [0.07, 0.19]) { const d = new RoundedBoxGeometry(lx, 0.09, lz, 1, 0.015); d.translate(x, y, z); parti.push(d) }
    }
    for (const [x, z] of [[0.4, 0.4], [-0.4, 0.4], [0.4, -0.4], [-0.4, -0.4]]) { const d = new BoxGeometry(0.07, 0.26, 0.07); d.translate(x, 0.13, z); parti.push(d) }
    doghe = mergeGeometries(parti.map(p => p.toNonIndexed()))
  }
  const g = new Group()
  const legno = new MeshStandardMaterial({ map: trama(128, (c, n) => {
    c.fillStyle = '#c99a5f'; c.fillRect(0, 0, n, n)
    const r = caso(31)
    for (let i = 0; i < 40; i++) { c.fillStyle = '#7a4c2833'; c.fillRect(0, r() * n, n, 1 + r() * 2) }
  }), roughness: 0.75 })
  g.add(m(doghe, legno), m(new BoxGeometry(0.78, 0.03, 0.78), pieno(0x4d3423, 0.9), 0, 0.03, 0))
  return g
}

/** La pila dei piatti puliti. */
export function creaPila() {
  const g = new Group()
  const piatti = Array.from({ length: 5 }, (_, i) => {
    const p = creaPiatto(); p.scale.setScalar(0.5); p.position.y = i * 0.055; p.children[0].visible = i === 0
    g.add(p)
    return p
  })
  // `null`: non finiscono, se ne vede una bella pila
  g.userData.mostra = n => piatti.forEach((p, i) => { p.visible = n === null || i < n })
  return g
}

const tramaUnto = () => trama(128, (c, n) => {
  c.clearRect(0, 0, n, n)
  const r = caso(41)
  for (let i = 0; i < 12; i++) {
    c.fillStyle = ['#b5472fcc', '#8a5a2bcc', '#c9a23fbb'][i % 3]
    c.beginPath(); c.ellipse(n / 2 + (r() - 0.5) * 70, n / 2 + (r() - 0.5) * 70, 5 + r() * 16, 4 + r() * 11, r() * 3, 0, 7); c.fill()
  }
})

/** Il lavello: la vasca d'acciaio, il rubinetto a collo di cigno, i piatti sporchi dentro e la schiuma quando si lava. */
export function creaLavello() {
  const g = new Group(), acciaio = pieno(0xc5ccd2, 0.24, 0.92)
  const fondo = m(new BoxGeometry(0.72, 0.012, 0.66), pieno(0x8f9aa3, 0.3, 0.8), 0, ALTO + 0.008, 0.06)
  const bordi = [[0.8, 0.05, 0.05, 0, 0.42], [0.8, 0.05, 0.05, 0, -0.3], [0.05, 0.05, 0.76, 0.4, 0.06], [0.05, 0.05, 0.76, -0.4, 0.06]]
    .map(([l, h, p, x, z]) => m(new RoundedBoxGeometry(l, h, p, 2, 0.015), acciaio, x, ALTO + 0.03, z))
  const curva = new CatmullRomCurve3([[0.26, 0, -0.38], [0.26, 0.32, -0.38], [0.26, 0.46, -0.28], [0.26, 0.42, -0.14], [0.26, 0.34, -0.1]].map(p => new Vector3(...p)))
  const collo = m(new TubeGeometry(curva, 24, 0.028, 10), acciaio, 0, ALTO, 0)
  const manopola = m(new CylinderGeometry(0.05, 0.06, 0.05, 14), pieno(0x2f6fb5, 0.35), 0.08, ALTO + 0.05, -0.38)
  const unto = new MeshBasicMaterial({ map: tramaUnto(), transparent: true, depthWrite: false })
  const pila = new Group(); pila.position.set(-0.06, ALTO + 0.02, 0.08)
  const sporchi = Array.from({ length: 5 }, (_, i) => {
    const p = creaPiatto(); p.scale.setScalar(0.4); p.position.y = i * 0.05; p.rotation.y = i * 1.3; p.children[0].visible = false
    const macchia = m(new CircleGeometry(0.62, 18), unto, 0, 0.2, 0); macchia.rotation.x = -Math.PI / 2
    p.add(macchia); pila.add(p)
    return p
  })
  const schiuma = new Group(); schiuma.position.set(-0.06, ALTO + 0.14, 0.08)
  for (let i = 0; i < 12; i++) schiuma.add(m(new SphereGeometry(0.05 + (i % 3) * 0.022, 10, 8), new MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, transparent: true, opacity: 0.88 })))
  schiuma.visible = false
  g.add(fondo, ...bordi, collo, manopola, pila, schiuma)
  g.userData = { sporchi, schiuma }
  return g
}

export const creaCestino = () => { const b = creaBidone(); b.scale.setScalar(0.72); return b }

/** La consegna: il campanello sul piano d'acciaio, la finestra sulla strada con la tenda a righe. */
export function creaConsegna() {
  const g = new Group()
  const profilo = [[0, 0.17], [0.05, 0.165], [0.1, 0.13], [0.13, 0.07], [0.15, 0.02], [0.17, 0]].map(([x, y]) => new Vector2(x, y))
  const ottone = pieno(0xd9a93c, 0.24, 0.95)
  const campana = m(new LatheGeometry(profilo, 28), ottone, 0.3, ALTO + 0.02, -0.26)
  campana.material.side = DoubleSide
  const base = m(new CylinderGeometry(0.2, 0.21, 0.03, 28), pieno(0x3a2a22, 0.5), 0.3, ALTO + 0.015, -0.26)
  const bottone = m(new SphereGeometry(0.03, 12, 8), ottone, 0.3, ALTO + 0.2, -0.26)
  // la finestra: una cornice di legno sul muro, il cielo dietro, la tenda sopra
  const cielo = m(new PlaneGeometry(1.5, 1.05), new MeshBasicMaterial({ map: trama(128, (c, n) => {
    const v = c.createLinearGradient(0, 0, 0, n); v.addColorStop(0, '#9fdcf3'); v.addColorStop(1, '#fff3cf'); c.fillStyle = v; c.fillRect(0, 0, n, n)
  }), toneMapped: false }), 0, 1.3, -0.47)
  const legno = pieno(0x8a5a33, 0.55)
  const cornice = [[1.66, 0.09, 0, 1.86], [1.66, 0.09, 0, 0.76], [0.09, 1.2, -0.79, 1.3], [0.09, 1.2, 0.79, 1.3]].map(([l, h, x, y]) => m(new BoxGeometry(l, h, 0.07), legno, x, y, -0.46))
  const tenda = m(new RoundedBoxGeometry(1.8, 0.05, 0.5, 2, 0.02), new MeshStandardMaterial({ map: trama(128, (c, n) => {
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#fffdf7' : '#d2402e'; c.fillRect(i * n / 8, 0, n / 8, n) }
  }), roughness: 0.6 }), 0, 1.95, -0.26)
  tenda.rotation.x = 0.42
  g.add(base, campana, bottone, cielo, ...cornice, tenda)
  const scritta = creaEtichetta('consegna'); scritta.scale.setScalar(0.62); scritta.position.set(0, ALTO + 0.012, 0.2)
  g.add(scritta)
  return g
}

/** Il riquadro sulla cella che il tasto tocca: una cornice tonda, che pulsa. */
export function creaMira() {
  const t = trama(128, (c, n) => {
    c.clearRect(0, 0, n, n)
    c.strokeStyle = '#ffffff'; c.lineWidth = 10
    c.beginPath(); c.roundRect(8, 8, n - 16, n - 16, 18); c.stroke()
  })
  const o = m(new PlaneGeometry(1.02, 1.02), new MeshBasicMaterial({ map: t, color: 0x4ee07a, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }))
  o.rotation.x = -Math.PI / 2
  o.renderOrder = 3
  return o
}

/** Un bancone solo: la foto dell'appoggio da comprare. */
export const creaBancone = () => creaBanconi([{ x: -0.5, z: -0.5, tipo: 'banco' }])
