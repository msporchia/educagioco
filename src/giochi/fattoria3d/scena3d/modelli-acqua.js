// Lo stagno (3×3) e il laghetto (5×4) che il bambino costruisce dove vuole: un solo disegno, due misure. L'acqua è la stessa dei laghetti
// del terreno (`materialeAcqua`: azzurra, semitrasparente, con lo scintillio nello shader) e luccica col tempo di `uTAcqua`, che il
// terreno aggiorna a ogni fotogramma; intorno una riva di terra chiara in rilievo con i sassi, le canne e qualche ninfea. Il contorno
// è arrotondato e un po' ondulato: la geometria del gioco resta il rettangolo (tutte le celle sono acqua), ma agli angoli si vede la
// terra. Origine al centro dell'impronta. Vedi docs/fattoria3d/laghi.md.
import * as THREE from 'three'
import { mat } from './modelli.js'
import { fondiPerMateriale } from './fondi.js'
import { memoModello } from './cache-modelli.js'
import { sequenza } from '../dati/semi.js'

/** Il tempo dell'acqua, condiviso: il terreno lo scrive a ogni fotogramma, lo shader lo legge (lo stesso per i laghi del terreno e gli stagni). */
export const uTAcqua = { value: 0 }

/** Lo scintillio dell'acqua nello shader (`uTAcqua`): onde che scorrono sul colore, niente riflessioni e niente luci in più. Lo stesso per tutta l'acqua del gioco. */
function conOnde (materiale, ampiezza = 1) {
  materiale.onBeforeCompile = sh => {
    sh.uniforms.uT = uTAcqua
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vWP;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
        vWP = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xz;
        #else
        vWP = (modelMatrix * vec4(position, 1.0)).xz;
        #endif`)
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vWP;\nuniform float uT;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float onda = sin(vWP.x * 2.6 + uT * 1.3) * sin(vWP.y * 2.9 - uT * 1.1) + 0.5 * sin((vWP.x + vWP.y) * 4.1 + uT * 2.0);
        diffuseColor.rgb += vec3(0.05, 0.08, 0.10) * onda * ${ampiezza.toFixed(2)};`)
  }
  return materiale
}

let ACQUA = null
/** L'unico materiale dell'acqua del gioco: i laghi del terreno lo usano a istanze, gli stagni come mesh qualunque. */
export function materialeAcqua () {
  if (ACQUA) return ACQUA
  ACQUA = conOnde(new THREE.MeshStandardMaterial({ color: 0x4ba6d6, transparent: true, opacity: 0.84, roughness: 0.3, depthWrite: false }))
  return ACQUA
}

let MARE = null
/** Il mare lontano: opaco, con il colore nei vertici (turchese in riva, blu al largo) e lo stesso scintillio dell'acqua. Un piano solo, senza istanze per lotto. */
export function materialeMare () {
  if (MARE) return MARE
  MARE = conOnde(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.32, metalness: 0 }), 0.45)
  return MARE
}

const N = 44                                           // i punti del contorno
const EXP = 3                                          // 2 = ellisse, più sale più è un rettangolo: 3 dà gli angoli smussati
/** Il contorno (x, z) di un'ovale arrotondata di semiassi `a`, `b`, con una leggera ondulazione che dipende dalla misura. */
function contorno (a, b, fase) {
  const p = []
  for (let k = 0; k < N; k++) {
    const t = (k / N) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t)
    const onda = 1 + 0.035 * Math.sin(3 * t + fase) + 0.025 * Math.sin(5 * t + fase * 2.3)
    p.push(new THREE.Vector2(a * Math.sign(c) * Math.abs(c) ** (2 / EXP) * onda, b * Math.sign(s) * Math.abs(s) ** (2 / EXP) * onda))
  }
  return p
}
/** Un punto della fascia di riva, all'angolo `t` (come il contorno) e a `f` (0 = bordo dell'acqua, 1 = bordo esterno). */
function suRiva (t, f, A, B, fase) {
  const c = Math.cos(t), s = Math.sin(t), onda = 1 + 0.035 * Math.sin(3 * t + fase) + 0.025 * Math.sin(5 * t + fase * 2.3)
  const a = A.dentro + (A.fuori - A.dentro) * f, b = B.dentro + (B.fuori - B.dentro) * f
  return [a * Math.sign(c) * Math.abs(c) ** (2 / EXP) * onda, -b * Math.sign(s) * Math.abs(s) ** (2 / EXP) * onda]       // il meno: la forma, ruotata sul suolo, ha la y in -z
}

const nodo = (m, x, y, z) => { m.position.set(x, y, z); m.castShadow = false; m.receiveShadow = true; return m }

function costruisciStagno (w, d) {
  const g = new THREE.Group(), fase = w * 1.7 + d * 0.9
  const A = { dentro: w / 2 - 0.36, fuori: w / 2 - 0.04 }, B = { dentro: d / 2 - 0.36, fuori: d / 2 - 0.04 }
  const dentro = contorno(A.dentro, B.dentro, fase), fuori = contorno(A.fuori, B.fuori, fase)
  // la riva: un anello di terra chiara alto 9 cm, con la buca dell'acqua al mezzo
  const forma = new THREE.Shape(fuori), buca = new THREE.Path(dentro.slice().reverse()); forma.holes.push(buca)
  const anello = new THREE.ExtrudeGeometry(forma, { depth: 0.09, bevelEnabled: false, curveSegments: 1 }); anello.rotateX(-Math.PI / 2)
  g.add(nodo(new THREE.Mesh(anello, mat(0xd8c490)), 0, 0, 0))
  // il fondo, scuro, sotto l'acqua: senza, trasparendo si vedrebbe il prato
  const fondo = new THREE.ShapeGeometry(new THREE.Shape(dentro)); fondo.rotateX(-Math.PI / 2)
  g.add(nodo(new THREE.Mesh(fondo, mat(0x6f8a78)), 0, 0.012, 0))
  // i sassi sulla riva, deterministici dalla misura
  const caso = sequenza(w, d, 11), sasso = new THREE.IcosahedronGeometry(1, 0), grigi = [mat(0x9a968c), mat(0xb8b2a4), mat(0x85817a)]
  const quanti = Math.round(w * d * 0.8)
  for (let k = 0; k < quanti; k++) {
    const [x, z] = suRiva(caso() * Math.PI * 2, 0.15 + caso() * 0.7, A, B, fase), r = 0.05 + caso() * 0.07
    const m = nodo(new THREE.Mesh(sasso, grigi[k % 3]), x, 0.09 + r * 0.2, z); m.scale.set(r * 1.3, r * 0.8, r); m.rotation.y = caso() * 6
    g.add(m)
  }
  // le canne: ciuffi da tre fili sulla riva, agli angoli e qua e là
  const lama = (h, ang, dx) => new THREE.ConeGeometry(0.035, h, 4).translate(0, h / 2, 0).rotateZ(0.08).rotateY(ang).translate(dx, 0, 0)
  const verde = mat(0x8aa63a, { side: THREE.DoubleSide })
  const angoli = w * d > 12 ? [0.7, 1.7, 2.4, 3.9, 4.7, 5.5] : [0.7, 2.4, 3.9, 5.5]
  for (const [n, t] of angoli.entries()) {
    const [x, z] = suRiva(t, 0.55, A, B, fase)
    for (const [h, ang, dx] of [[0.9, 0, 0], [0.7, 2.1, 0.07], [1.05, 4.2, -0.06]]) {
      const m = nodo(new THREE.Mesh(lama(h * (0.8 + 0.1 * (n % 3)), ang, dx), verde), x, 0.08, z); m.rotation.y = n * 1.3
      m.castShadow = false; g.add(m)
    }
  }
  // le ninfee sull'acqua (un disco con la tacca) e un fiore
  const foglia = new THREE.CircleGeometry(0.24, 10, 0.5, 5.4).rotateX(-Math.PI / 2), verdeNinfea = mat(0x4f9a45, { side: THREE.DoubleSide })
  const posti = w * d > 12 ? [[-0.9, 0.35], [0.5, -0.25], [1.1, 0.6]] : [[-0.3, 0.3], [0.45, -0.3]]
  for (const [n, [x, z]] of posti.entries()) {
    const m = nodo(new THREE.Mesh(foglia, verdeNinfea), x, 0.07, z); m.rotation.y = n * 2.1; m.scale.setScalar(0.9 + 0.2 * n); g.add(m)
  }
  g.add(nodo(new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), mat(0xf3a6c0)), posti[0][0] + 0.04, 0.1, posti[0][1]))
  g.userData.altezza = 0.6
  fondiPerMateriale(g)
  // l'acqua per ultima (non si fonde: è trasparente): sotto l'orlo della riva, sopra il fondo
  const lastra = new THREE.ShapeGeometry(new THREE.Shape(dentro)); lastra.rotateX(-Math.PI / 2)
  const acqua = new THREE.Mesh(lastra, materialeAcqua()); acqua.position.y = 0.055; acqua.castShadow = false; acqua.receiveShadow = false
  g.add(acqua)
  return g
}

// la cache (scena3d/cache-modelli.js): costruito e fuso una volta per misura, le istanze sono cloni che condividono geometrie e materiali
export const creaStagno = memoModello('stagno', costruisciStagno, { chiave: (w, d) => w + 'x' + d })
