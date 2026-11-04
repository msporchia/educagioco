// I pezzi della cura sul prato: la ciotola col nome dell'animale e la tinozza. Vedi docs/fattoria3d/cura-sul-prato.md.
import * as THREE from 'three'
import { mat } from './modelli.js'

const TINTE = [0xd9534f, 0x4a90d9, 0x57a85b, 0xe8a33d, 0x9b6fc4, 0xe07aa8, 0x3fb3a8, 0xc96b3c]
/** Ogni animale ha il suo colore: stesso id, stesso colore. */
const tintaDi = id => TINTE[[...String(id)].reduce((n, c) => n * 31 + c.charCodeAt(0), 7) % TINTE.length]
const liscio = o => ({ flatShading: false, ...o })
const pronto = (o, y = 0) => { o.castShadow = true; o.receiveShadow = true; o.position.y = y; return o }

const profilo = pp => pp.map(([x, y]) => new THREE.Vector2(x, y))
const geo = {}
const G = (k, f) => (geo[k] ||= f())

export function creaCiotolaBestia (c) {
  const g = new THREE.Group()
  const fuori = G('scodella', () => new THREE.LatheGeometry(profilo([[0.27, 0.01], [0.33, 0.1], [0.385, 0.2], [0.4, 0.235], [0.375, 0.25], [0.335, 0.245]]), 28))
  g.add(pronto(new THREE.Mesh(fuori, mat(tintaDi(c && c.bestia), liscio({ roughness: 0.45, side: THREE.DoubleSide })))))
  // dentro è chiara, così si vede che è vuota
  const fondo = new THREE.Mesh(G('fondo', () => new THREE.LatheGeometry(profilo([[0, 0.08], [0.22, 0.08], [0.3, 0.16], [0.34, 0.245]]), 24)), mat(0xf1ece0, liscio({ roughness: 0.5, side: THREE.DoubleSide })))
  fondo.receiveShadow = true; g.add(fondo)
  const cibo = pronto(new THREE.Mesh(G('cibo', () => new THREE.SphereGeometry(0.27, 16, 8)), mat(0xa8703a, liscio())), 0.15)
  cibo.scale.y = 0.42; cibo.visible = false; g.add(cibo)
  // il cartellino col nome: un paletto dietro la ciotola, piegato verso la telecamera
  const palo = pronto(new THREE.Mesh(G('palo', () => new THREE.CylinderGeometry(0.025, 0.03, 0.5, 6)), mat(0x8a6238)), 0.25); palo.position.z = -0.4; g.add(palo)
  const asse = new THREE.Mesh(G('asse', () => new THREE.BoxGeometry(0.82, 0.3, 0.035)), mat(0xc79a5c)); asse.position.set(0, 0.56, -0.38); asse.rotation.x = -0.55; asse.castShadow = true; g.add(asse)
  const scritta = new THREE.Mesh(G('scritta', () => new THREE.PlaneGeometry(0.78, 0.26)), new THREE.MeshBasicMaterial({ transparent: true, visible: false }))
  scritta.position.z = 0.02; asse.add(scritta)
  g.userData.cibo = cibo; g.userData.scritta = scritta; g.userData.altezza = 0.95
  return g
}
/** Il nome sul cartellino. Fuori dal browser niente tela: resta l'asse vuota. */
export function scriviNome (g, nome) {
  const s = g.userData.scritta
  if (!s || typeof document === 'undefined') return
  const t = document.createElement('canvas'); t.width = 256; t.height = 84
  const x = t.getContext('2d'); if (!x) return
  let px = 56
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#4a2c10'
  do { x.font = `bold ${px}px "Emoji Gioco", sans-serif`; px -= 4 } while (x.measureText(nome).width > 240 && px > 18)
  x.fillText(nome, 128, 44)
  s.material.map?.dispose()
  s.material.map = new THREE.CanvasTexture(t); s.material.map.colorSpace = THREE.SRGBColorSpace; s.material.visible = true; s.material.needsUpdate = true
}
/** Il cibo nella ciotola, finché lo mangia. */
export function mostraCibo (g, si) { if (g.userData.cibo) g.userData.cibo.visible = !!si }

export function creaTinozza () {
  const g = new THREE.Group()
  const doghe = G('doghe', () => new THREE.LatheGeometry(profilo([[0, 0.03], [0.66, 0.03], [0.78, 0.3], [0.84, 0.56], [0.78, 0.58], [0.72, 0.3], [0.6, 0.12], [0, 0.12]]), 16))
  g.add(pronto(new THREE.Mesh(doghe, mat(0xa9743f, { side: THREE.DoubleSide }))))
  for (const [y, r] of [[0.2, 0.75], [0.46, 0.83]]) { const c = new THREE.Mesh(G('cerchio' + y, () => new THREE.TorusGeometry(r, 0.028, 6, 24)), mat(0x5d6168, { metalness: 0.4 })); c.rotation.x = Math.PI / 2; c.position.y = y; g.add(c) }
  const acqua = new THREE.Mesh(G('acqua', () => new THREE.CircleGeometry(0.76, 24)), mat(0x7cc4e8, liscio({ roughness: 0.2 }))); acqua.rotation.x = -Math.PI / 2; acqua.position.y = 0.42; g.add(acqua)
  const schiuma = new THREE.Group(); schiuma.visible = false; g.add(schiuma)
  const palla = G('schiuma', () => new THREE.SphereGeometry(0.17, 8, 6)), bianco = mat(0xffffff, liscio({ roughness: 0.6 }))
  for (let k = 0; k < 14; k++) { const a = k * 2.4, r = 0.2 + (k % 5) * 0.12, b = new THREE.Mesh(palla, bianco); b.position.set(Math.cos(a) * r, 0.47 + (k % 3) * 0.05, Math.sin(a) * r); b.scale.setScalar(0.7 + (k % 4) * 0.22); schiuma.add(b) }
  g.userData.schiuma = schiuma; g.userData.altezza = 1
  return g
}
/** Quanta schiuma, da 0 a 1. */
export function schiumaTinozza (g, k) { const s = g.userData.schiuma; if (s) { s.visible = k > 0; s.scale.setScalar(0.5 + k * 0.6) } }
export const QUOTA_TINOZZA = 0.3                  // dove sta seduto chi fa il bagno
