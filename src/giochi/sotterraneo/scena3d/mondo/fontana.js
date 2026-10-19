// La fontana della piazza: dove in città manca chi cura (la guaritrice o l'incantatrice) c'è l'acqua, che cura gratis chi è salito dal
// portale (docs/sotterraneo/chi-cura.md). Prende il posto del pozzo (kit.js: 2×2 celle, il centro della piazza). Tutta in codice e
// parametrica come il kit: la vasca bassa di pietra con l'acqua, uno stelo, la coppa alta con quattro bocchette, e l'acqua che si
// muove (quattro cascatelle, il getto in cima, le gocce che saltano dalla coppa alla vasca, gli spruzzi di vita.js). Le parti
// ferme stanno nel cantiere del pezzo (una mesh per materiale, la cella della base per la nebbia); quelle che si muovono sono
// a parte coi materiali `mobili` del kit, che leggono la nebbia dalla loro posizione. Non decide niente: il tocco è di Mondo3d.vue.
import { Mesh, Group, InstancedMesh, Matrix4, Quaternion, Vector3, Euler, OctahedronGeometry, CylinderGeometry, BoxGeometry,
         CircleGeometry, TorusGeometry, Float32BufferAttribute } from 'three'
import { quotaTerreno } from './suolo.js'
import { scatola, cilindro } from './kit.js'

const PIETRA = [0.82, 0.8, 0.76], PIETRA_SCURA = [0.68, 0.66, 0.64]
const ACQUA = [0.28, 0.6, 0.86], SCHIUMA = [0.82, 0.93, 1.0]
export const GOCCE = 16

// l'altezza delle parti, in un posto solo: servono anche al disegno dell'acqua che cade
export const ALTEZZE = { acqua: 0.575, coppa: 1.56, bocchetta: 1.46, ugello: 1.84 }

// il colore sta nei vertici (come nel kit): un attributo `color` per i pezzi che non passano dal cantiere
function colora(g, c) {
  const n = g.attributes.position.count, a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) a.set(c, i * 3)
  g.setAttribute('color', new Float32BufferAttribute(a, 3))
  return g
}

// `f`: { x, y } l'angolo del 2×2 del pozzo. Torna { anima(t), via } e mette i suoi spruzzi in `cose.spruzzi`
export function fontana(f, cant, m, cose, kit, gruppo) {
  const cx = f.x + 1, cz = f.y + 1, y0 = quotaTerreno(m, cx, cz)
  cant.base(cx, y0, cz, 0)
  // la vasca bassa: lo zoccolo, la parete, il bordo (un anello che sporge) e l'acqua più in basso del bordo
  cant.metti('pietra', cilindro(1.06, 1.1, 0.26, 20, 1.2), 0, 0.13, 0, PIETRA_SCURA)
  cant.metti('pietra', cilindro(1.0, 1.04, 0.3, 20, 1.2), 0, 0.41, 0, PIETRA)
  cant.metti('pietra', new TorusGeometry(1.0, 0.09, 6, 24), 0, 0.6, 0, PIETRA, { rx: Math.PI / 2 })
  cant.metti('liscio', new CircleGeometry(0.96, 22).rotateX(-Math.PI / 2), 0, ALTEZZE.acqua, 0, ACQUA)
  // lo stelo, la coppa alta (si allarga verso l'alto) con l'acqua e il suo bordo
  cant.metti('pietra', cilindro(0.2, 0.28, 0.9, 12, 1.2), 0, 1.0, 0, PIETRA)
  cant.metti('pietra', cilindro(0.34, 0.3, 0.1, 12, 1.2), 0, 0.64, 0, PIETRA_SCURA)
  cant.metti('pietra', cilindro(0.68, 0.38, 0.26, 18, 1.2), 0, 1.45, 0, PIETRA)
  cant.metti('pietra', new TorusGeometry(0.67, 0.05, 6, 22), 0, 1.585, 0, PIETRA, { rx: Math.PI / 2 })
  cant.metti('liscio', new CircleGeometry(0.62, 18).rotateX(-Math.PI / 2), 0, ALTEZZE.coppa, 0, ACQUA)
  // l'ugello in cima, e le quattro bocchette sul bordo della coppa (a croce, da cui cade l'acqua)
  cant.metti('pietra', cilindro(0.06, 0.1, 0.34, 8, 1.2), 0, 1.72, 0, PIETRA)
  cant.metti('pietra', new OctahedronGeometry(0.1), 0, 1.92, 0, PIETRA_SCURA)
  const bocchette = []
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2 + Math.PI / 4, s = Math.sin(a), c = Math.cos(a)
    cant.metti('pietra', scatola(0.17, 0.12, 0.24, 1.2), s * 0.72, ALTEZZE.bocchetta, c * 0.72, PIETRA_SCURA, { ry: a })
    bocchette.push({ a })
  }

  // ── l'acqua che si muove: a parte, coi materiali mobili ──
  const mobili = new Group()
  mobili.position.set(cx, y0, cz)
  // le cascatelle: una lastra sottile dalla bocchetta alla vasca bassa, che «scorre» respirando in larghezza
  const R0 = 0.78, R1 = 0.95, YA = ALTEZZE.bocchetta - 0.02, YB = ALTEZZE.acqua + 0.02
  const cascate = bocchette.map(({ a }) => {
    const dx = R1 - R0, dy = YA - YB, L = Math.hypot(dx, dy)
    const me = new Mesh(colora(new BoxGeometry(0.1, L, 0.035), SCHIUMA), kit.mobili.luce)
    // la lastra sta in piedi lungo il raggio (la X del gruppo): in cima verso la coppa, in basso verso fuori; poi il gruppo gira
    me.rotation.z = Math.atan2(dx, dy); me.position.set((R0 + R1) / 2, (YA + YB) / 2, 0)
    const pivot = new Group()
    pivot.add(me); pivot.rotation.y = a - Math.PI / 2
    mobili.add(pivot)
    return me
  })
  // il getto: una colonna sottile che pulsa (scala in altezza dalla base)
  const getto = new Mesh(colora(new CylinderGeometry(0.035, 0.05, 0.6, 6).translate(0, 0.3, 0), SCHIUMA), kit.mobili.luce)
  getto.position.set(0, ALTEZZE.ugello, 0)
  mobili.add(getto)
  // le gocce: saltano dall'ugello e cadono in tondo sulla vasca bassa (un tiro con la gravità, ognuna con la sua fase)
  const gocce = new InstancedMesh(colora(new OctahedronGeometry(0.055), SCHIUMA), kit.mobili.luce, GOCCE)
  gocce.frustumCulled = false
  mobili.add(gocce)
  gruppo.add(mobili)
  // dove le gocce atterrano, e gli spruzzi di vita.js
  cose.spruzzi.push(new Vector3(cx, y0 + ALTEZZE.acqua + 0.05, cz))

  const M = new Matrix4(), Q = new Quaternion(), E = new Euler(), P = new Vector3(), S = new Vector3(1, 1, 1)
  const G = 9, VY = 2.1, Y0 = ALTEZZE.ugello + 0.05, T = (VY + Math.sqrt(VY * VY + 2 * G * (Y0 - ALTEZZE.acqua))) / G
  const fatto = {
    mobili,
    // t è il tempo del gioco in secondi: tutto si muove col tempo, non coi fotogrammi
    anima(t) {
      getto.scale.set(1, 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 5.3)) + 0.1 * Math.sin(t * 11), 1)
      cascate.forEach((me, i) => { me.scale.x = 0.8 + 0.35 * Math.sin(t * 6.1 + i * 1.7); me.scale.z = 1 })
      for (let i = 0; i < GOCCE; i++) {
        const p = (t * 0.9 + i / GOCCE) % 1, s = p * T, a = i * 2.399
        const r = 0.04 + (p * 0.9) * 0.92, y = Y0 + VY * s - 0.5 * G * s * s
        E.set(0, a, 0)
        gocce.setMatrixAt(i, M.compose(P.set(Math.sin(a) * r, Math.max(y, ALTEZZE.acqua), Math.cos(a) * r), Q.setFromEuler(E), S))
      }
      gocce.instanceMatrix.needsUpdate = true
    },
  }
  fatto.anima(0)
  return fatto
}
