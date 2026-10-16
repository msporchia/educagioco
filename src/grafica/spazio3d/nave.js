// L'astronave in 3D. Le sagome delle ali e lo strappo sono quelli del disegno 2D
// (`ali`, `strappa` di grafica/spazio.js), così il danno si legge allo stesso modo:
// intatta · l'ala sinistra strappata col bordo che arde, i cocci, la spia ambra ·
// lo strappo che si mangia l'ala, il vetro crepato, la spia rossa e l'alone d'allarme.
// La livrea si dipinge sulle ali come nel 2D (`dipingiAla`, `disegnaStemma` su una tela
// che fa da colore all'ala), e riceve solo fatti già decisi: `danno`, `lv`, `livrea`.
// Unità: 1 = il raggio della nave (`nave.r` in pixel); y verso l'alto, il muso in su.
import { Group, Mesh, LatheGeometry, BoxGeometry, CylinderGeometry, SphereGeometry, ConeGeometry, TorusGeometry,
         CircleGeometry, PlaneGeometry, Shape, ExtrudeGeometry, Vector2, Vector3, CanvasTexture, SRGBColorSpace,
         NoColorSpace, RepeatWrapping, MeshStandardMaterial, MeshPhysicalMaterial, MeshBasicMaterial,
         ShaderMaterial, AdditiveBlending, DoubleSide, Color, Quaternion } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { ali as aliDelDue, strappa, SCHEGGE, PROPULSORI, statoScafo, tinteNave, mescola } from '../spazio.js'
import { traccia, dipingiAla, disegnaStemma } from '../livrea.js'
import { seme, rgb } from './rumore.js'

// le ali del 2D si attaccano a x = 0,30, dove sopra la vita lo scafo è già più stretto: restava un vuoto con il contorno
// dipinto in vista. In 3D la radice entra nello scafo (stessi punti, solo i due attacchi più dentro)
const ali = lv => aliDelDue(lv).map(a => a.map(([x, y], i) => (i === 0 || i === a.length - 1) ? [Math.min(x, 0.12), y] : [x, y]))

// la tela delle ali: x da 0 a ±1,5, y (del 2D, in giù) da -0,5 a 1,1
const PX = 160, TELA_W = 240, TELA_H = 256, Y0 = -0.5

// ---- la pelle a pannelli: linee, placche, rivetti, graffi (anche come rilievo) ----
function pannelli() {
  // pulita: un bianco pieno con poche linee di giunzione, se no il colore della tinta si sporca di grigio
  const cv = document.createElement('canvas'); cv.width = cv.height = 256
  const c = cv.getContext('2d'), r = seme(7)
  c.fillStyle = '#f4f6fb'; c.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 10; i++) { const g = 226 + r() * 26; c.fillStyle = `rgb(${g},${g + 2},${g + 5})`; c.fillRect(r() * 256, r() * 256, 40 + r() * 70, 30 + r() * 50) }
  c.strokeStyle = 'rgba(40,52,84,.5)'; c.lineWidth = 2
  for (let x = 0; x <= 256; x += 128) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 256); c.stroke() }
  for (let y = 0; y <= 256; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke() }
  const colore = new CanvasTexture(cv); colore.colorSpace = SRGBColorSpace; colore.wrapS = colore.wrapT = RepeatWrapping
  const rilievo = new CanvasTexture(cv); rilievo.colorSpace = NoColorSpace; rilievo.wrapS = rilievo.wrapT = RepeatWrapping
  return { colore, rilievo }
}

// ---- le ali: la sagoma del 2D estrusa, con l'uv sulla tela dipinta ----
const a3 = ([x, y]) => new Vector2(x, -y)
function alaGeo(punti, verso) {
  const g = new ExtrudeGeometry(new Shape(punti.map(a3)),
    { depth: 0.05, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.018, bevelSegments: 1, steps: 1 })
  g.translate(0, 0, -0.045)
  const p = g.attributes.position, uv = g.attributes.uv, x0 = verso > 0 ? 0 : -1.5
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - x0) / 1.5, 1 - (-p.getY(i) - Y0) / (TELA_H / PX))
  return g
}
// il bordo bruciato dello strappo: cilindretti lungo i denti
function bordoGeo(punti) {
  const pezzi = []
  for (let i = 0; i < punti.length - 1; i++) {
    const a = new Vector3(punti[i][0], -punti[i][1], 0), b = new Vector3(punti[i + 1][0], -punti[i + 1][1], 0)
    const l = a.distanceTo(b), g = new CylinderGeometry(0.03, 0.03, l + 0.02, 6)
    g.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize()))
    g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, 0)
    pezzi.push(g)
  }
  return mergeGeometries(pezzi)
}

// ---- la tela di un lato: colore, pannelli, disegno e stemma come nel 2D ----
function dipingiLato(cv, lv, verso, st, L) {
  const c = cv.getContext('2d'), T = tinteNave(L, st / 2), resta = st >= 2 ? 0.34 : 0.55
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, TELA_W, TELA_H)
  c.fillStyle = T.scuroAli; c.fillRect(0, 0, TELA_W, TELA_H)
  c.translate(verso > 0 ? 0 : 1.5 * PX, -Y0 * PX)
  for (const [i, a] of ali(lv).entries()) {
    const rotta = st >= 1 && verso < 0 && i === 0
    const p = (rotta ? strappa(a, resta) : a).map(([x, y]) => [x * verso, y])
    traccia(c, p, PX)
    const g = c.createLinearGradient(0, -0.4 * PX, 0, 0.9 * PX)
    g.addColorStop(0, mescola(T.chiaroAli, '#ffffff', 0.15)); g.addColorStop(1, T.scuroAli)
    c.fillStyle = g; c.fill()
    c.save(); traccia(c, p, PX); c.clip()   // le linee dei pannelli, dentro l'ala
    c.strokeStyle = 'rgba(20,24,34,.35)'; c.lineWidth = 1.5
    for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(verso * k * 0.3 * PX, -PX); c.lineTo(verso * (k * 0.3 + 0.25) * PX, 1.2 * PX); c.stroke() }
    c.restore()
    if (L) {
      dipingiAla(c, p, PX, verso, L)
      if (L.stemma && i === 0 && !rotta) {
        const a0 = ali(lv)[0], cx = a0.reduce((q, [x]) => q + x, 0) / a0.length, cy = a0.reduce((q, [, y]) => q + y, 0) / a0.length
        c.save(); traccia(c, p, PX); c.clip()
        disegnaStemma(c, L.stemma, verso * cx * PX * 1.05, cy * PX, PX * 0.17, L.colStemma)
        c.restore()
      }
    }
    traccia(c, p, PX); c.lineWidth = 0.05 * PX; c.strokeStyle = T.accento; c.stroke()
    if (rotta) { c.strokeStyle = '#1a0f0c'; c.lineWidth = 0.1 * PX; c.stroke() }
  }
}

const FIAMMA_V = /* glsl */`varying vec2 vU; varying vec3 vN; varying vec3 vV;
  void main(){ vU = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.);
    vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`
const FIAMMA_F = /* glsl */`varying vec2 vU; varying vec3 vN; varying vec3 vV;
  uniform float uT, uK, uNucleo, uF; uniform vec3 uC;
  void main(){ float lungo = vU.y;
    float c = pow(abs(dot(normalize(vN), normalize(vV))), 1.3);
    float n = .5 + .5 * sin(lungo * 26. - uT * 38. + vU.x * 12. + uF), n2 = .5 + .5 * sin(lungo * 11. - uT * 23. + uF * 2.);
    float a = pow(1. - lungo, 1.4 / max(.2, uK)) * c * (.65 + .35 * n * n2) * smoothstep(0., .06, lungo) * min(1., uK);
    vec3 col = mix(uC * 2.2, uC * .7, lungo);
    col = mix(col, vec3(2.6, 2.7, 3.2), uNucleo * (1. - lungo) * .85 + pow(1. - lungo, 6.) * .4);
    gl_FragColor = vec4(col * a, a); }`
const SCUDO_F = /* glsl */`varying vec3 vP; varying vec3 vN; varying vec3 vV; uniform vec3 uHit; uniform float uT, uGelo;
  void main(){ float f = pow(1. - abs(dot(vN, vV)), 3.);
    float ang = acos(clamp(dot(vP, uHit), -1., 1.));
    float onda = smoothstep(.3, 0., abs(ang - uT * 3.2)) * exp(-uT * 2.2) * step(uT, 1.6);
    vec3 g = abs(fract(vP * 7.) - .5); float esa = smoothstep(.44, .5, max(max(g.x, g.y), g.z));
    float a = onda * (1. + esa * 1.4) + uGelo * (f * .55 + esa * .22 + .04);
    gl_FragColor = vec4(mix(vec3(.3, .8, 1.4), vec3(.75, .95, 1.3), uGelo) * a * 2., a); }`
const BAGLIORE_F = /* glsl */`varying vec2 vU; uniform vec3 uC; uniform float uA;
  void main(){ float r = length(vU); float a = (pow(max(0., 1. - r), 3.) + smoothstep(.25, 0., r)) * uA; gl_FragColor = vec4(uC * a, a); }`
const QUADRO_V = /* glsl */`varying vec2 vU; void main(){ vU = uv * 2. - 1.; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`

// il vetro: grigio uniforme (il bagliore di sempre) o con le crepe bianche
function dipingiVetro(cv, crepato) {
  const c = cv.getContext('2d')
  c.fillStyle = crepato ? '#3a1010' : '#555'; c.fillRect(0, 0, 128, 64)
  if (!crepato) return
  c.strokeStyle = '#fff'; c.lineWidth = 2; c.lineCap = 'round'
  const x = 32, y = 30
  c.beginPath()
  c.moveTo(x - 14, y - 12); c.lineTo(x + 2, y); c.lineTo(x + 12, y + 16); c.moveTo(x + 2, y); c.lineTo(x + 9, y - 20)
  c.moveTo(x + 2, y); c.lineTo(x - 10, y + 14); c.stroke()
}

// il bordo che prende luce: stacca la nave dal fondo scuro (la sagoma e il colore sono quello che si legge in volo)
function conBordo(m, forza = 0.5) {
  m.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance += diffuseColor.rgb * pow(1. - clamp(dot(normal, normalize(vViewPosition)), 0., 1.), 2.2) * ${forza.toFixed(2)};`)
  }
  m.customProgramCacheKey = () => 'nave-bordo' + forza
  return m
}

export function creaNave(scena) {
  const pelle = pannelli()
  const T0 = tinteNave(null, 0)
  const scafo = new MeshStandardMaterial({ color: T0.chiaro, metalness: 0.3, roughness: 0.55, map: pelle.colore,
                                           bumpMap: pelle.rilievo, bumpScale: 0.45, envMapIntensity: 0.9 })
  scafo.map = pelle.colore.clone(); scafo.map.repeat.set(2, 3); scafo.map.needsUpdate = true
  scafo.bumpMap = pelle.rilievo.clone(); scafo.bumpMap.repeat.set(2, 3); scafo.bumpMap.needsUpdate = true
  const scuro = new MeshStandardMaterial({ color: T0.scuro, metalness: 0.55, roughness: 0.5, map: pelle.colore,
                                           bumpMap: pelle.rilievo, bumpScale: 0.8, envMapIntensity: 0.6 })
  const accento = new MeshStandardMaterial({ color: T0.accento, metalness: 0.35, roughness: 0.45, envMapIntensity: 0.6 })
  const lume = c => new MeshBasicMaterial({ color: new Color(...c) })
  const bocche = lume([1.6, 3.6, 6])
  const telaDx = document.createElement('canvas'), telaSx = document.createElement('canvas')
  telaDx.width = telaSx.width = TELA_W; telaDx.height = telaSx.height = TELA_H
  const texDx = new CanvasTexture(telaDx), texSx = new CanvasTexture(telaSx)
  texDx.colorSpace = texSx.colorSpace = SRGBColorSpace; texDx.anisotropy = texSx.anisotropy = 4
  const alaDx = new MeshStandardMaterial({ map: texDx, metalness: 0.3, roughness: 0.55, envMapIntensity: 0.7 })
  const alaSx = new MeshStandardMaterial({ map: texSx, metalness: 0.3, roughness: 0.55, envMapIntensity: 0.7 })
  const brucia = new MeshStandardMaterial({ color: 0x1a0f0c, roughness: 0.9, emissive: new Color(1.6, 0.45, 0.08) })
  const vetroTela = document.createElement('canvas'); vetroTela.width = 128; vetroTela.height = 64
  dipingiVetro(vetroTela, false)
  const vetroTex = new CanvasTexture(vetroTela); vetroTex.colorSpace = SRGBColorSpace
  const vetro = new MeshPhysicalMaterial({ color: 0x07142b, metalness: 0, roughness: 0.12, clearcoat: 0.6,
    emissive: new Color(0x2a6ad0), emissiveMap: vetroTex, emissiveIntensity: 0.8, envMapIntensity: 0.9 })
  for (const m of [scafo, alaDx, alaSx]) conBordo(m, 0.55)
  const pelli = [scafo, scuro, accento, alaDx, alaSx]   // si accendono di rosso alla botta, di verde alla riparazione

  const nave = new Group()   // la posa: posizione, scala, inclinazione
  const e = (g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, dove = nave) => {
    const o = new Mesh(g, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); dove.add(o); return o
  }

  // lo scafo: un tornio sulla sagoma del 2D (muso a 1,18, il più largo a 0,36), schiacciato
  const profilo = [[0, 1.18], [0.09, 1.0], [0.21, 0.7], [0.3, 0.42], [0.35, 0], [0.36, -0.34], [0.3, -0.6], [0.24, -0.74], [0, -0.76]]
    .reverse()   // dal basso al muso: nell'altro verso le facce guardavano dentro e si vedeva l'interno dello scafo, dietro le ali
    .map(([x, y]) => new Vector2(x, y))
  e(new LatheGeometry(profilo, 36), scafo).scale.set(1, 1, 0.6)
  // un solo dettaglio scuro: l'antenna. Le scatolette sui fianchi, il vano e la dorsale facevano la nave a cubetti
  e(new CylinderGeometry(0.012, 0.012, 0.4, 6).translate(0, 1.3, 0), scuro)
  // la cabina, e il vetro che si crepa
  const cabina = e(new SphereGeometry(1, 28, 18), vetro, 0, 0.44, 0.15)
  cabina.scale.set(0.23, 0.33, 0.13)
  e(new TorusGeometry(0.24, 0.025, 8, 28), scuro, 0, 0.44, 0.13).scale.set(1, 1.42, 1)

  // la torretta: ferma, il cannone gira (la spazzata del gioco, docs/asteroidi/volo.md)
  e(new CylinderGeometry(0.15, 0.17, 0.07, 20), scuro, 0, -0.12, 0.2, Math.PI / 2)
  const cannone = new Group(); cannone.position.set(0, -0.12, 0.25); nave.add(cannone)
  e(new BoxGeometry(0.13, 0.22, 0.07), scafo, 0, 0.1, 0, 0, 0, 0, cannone)
  e(new CylinderGeometry(0.04, 0.04, 0.3, 10), scuro, 0, 0.34, 0, 0, 0, 0, cannone)
  const punta = new MeshBasicMaterial({ color: new Color(2.4, 1.9, 0.5) })
  e(new BoxGeometry(0.11, 0.06, 0.07), punta, 0, 0.5, 0, 0, 0, 0, cannone)

  // le ali e i motori di ogni stazza: uno per livello, si accende quello giusto
  const stazze = {}
  const fiamme = []
  function stazza(lv) {
    if (stazze[lv]) return stazze[lv]
    const g = new Group(); nave.add(g)
    const [destra, ...altre] = ali(lv)
    const alaD = e(alaGeo(destra, 1), [alaDx, accento], 0, 0, 0, 0, 0, 0, g)
    for (const a of altre) {   // l'incrociatore ha la seconda coppia
      e(alaGeo(a, 1), [alaDx, accento], 0, 0, -0.01, 0, 0, 0, g)
      e(alaGeo(a.map(([x, y]) => [-x, y]), -1), [alaSx, accento], 0, 0, -0.01, 0, 0, 0, g)
    }
    // l'ala sinistra principale: una geometria per ogni stato dello scafo
    const sx = [0, 1, 2].map(st => {
      const resta = st >= 2 ? 0.34 : 0.55
      const p = st >= 1 ? strappa(destra, resta) : destra
      const m = e(alaGeo(p.map(([x, y]) => [-x, y]), -1), [alaSx, accento], 0, 0, 0, 0, 0, 0, g)
      if (st >= 1) {
        const n = p.length, bordo = p.slice(1, n - 1).map(([x, y]) => [-x, y])
        e(bordoGeo(bordo), brucia, 0, 0, 0.005, 0, 0, 0, m)
      }
      m.visible = st === 0
      return m
    })
    // i pod in punta d'ala col cannone, per il caccia e l'incrociatore
    const punte = []
    if (lv >= 2) for (const s of [-1, 1]) {
      const [tx, ty] = destra[1]
      const pod = new Group(); pod.position.set(s * tx, -ty - 0.05, 0); g.add(pod)
      e(new CylinderGeometry(0.05, 0.05, 0.42, 12), scafo, 0, 0, 0, 0, 0, 0, pod)
      e(new CylinderGeometry(0.026, 0.026, 0.28, 8), scuro, 0, 0.32, 0, 0, 0, 0, pod)
      e(new SphereGeometry(0.03, 8, 6), lume([3, 1.2, 0.3]), 0, 0.47, 0, 0, 0, 0, pod)
      punte.push({ s, pod })
    }
    // le luci di posizione in punta d'ala: rossa a sinistra, verde a destra
    const luci = [-1, 1].map(s => {
      const [tx, ty] = destra[2] || destra[1]
      return e(new SphereGeometry(0.045, 10, 8), lume(s < 0 ? [6, 0.4, 0.4] : [0.4, 6, 0.6]), s * tx, -ty, 0.04, 0, 0, 0, g)
    })
    // i motori: gondola, presa, fascia, ugello, e le due fiamme
    // i pezzi fermi dei motori, uniti per materiale: quattro disegni per tutti i motori della stazza
    const fermi = new Map()
    const fermo = (geo, mat, x, y, z, rx = 0) => {
      geo.rotateX(rx); geo.translate(x, y, z)
      if (!fermi.has(mat)) fermi.set(mat, [])
      fermi.get(mat).push(geo.index ? geo.toNonIndexed() : geo)
    }
    const motori = PROPULSORI[lv].map(([px, py, pr]) => {
      const m = new Group(); m.position.set(px, -py, 0.02); g.add(m)
      const y0 = -py, z0 = 0.02
      fermo(new CylinderGeometry(pr * 0.78, pr * 0.9, 0.52, 20), scafo, px, y0 + 0.27, z0)
      fermo(new ConeGeometry(pr * 0.7, 0.16, 18), scuro, px, y0 + 0.6, z0)
      fermo(new TorusGeometry(pr * 0.83, 0.016, 8, 22), accento, px, y0 + 0.3, z0, Math.PI / 2)
      fermo(new CylinderGeometry(pr * 0.82, pr * 0.95, 0.09, 20), scuro, px, y0 - 0.03, z0)
      fermo(new CircleGeometry(pr * 0.62, 18), bocche, px, y0 - 0.08, z0, Math.PI / 2)
      const fiammeQui = [[0.95, 6, 0], [0.48, 3.6, 1]].map(([rr, ll, nucleo]) => {
        const mat = new ShaderMaterial({ vertexShader: FIAMMA_V, fragmentShader: FIAMMA_F, transparent: true, depthWrite: false,
          blending: AdditiveBlending, side: DoubleSide,
          uniforms: { uT: { value: 0 }, uK: { value: 1 }, uNucleo: { value: nucleo }, uF: { value: px * 9 + nucleo }, uC: { value: new Color(0.25, 0.55, 1) } } })
        const f = e(CONO, mat, 0, -0.08, 0, 0, 0, 0, m)
        f.scale.set(pr * rr, pr * ll, pr * rr); f.userData.lungo = pr * ll; f.renderOrder = 8
        fiamme.push({ mat, px })
        return f
      })
      return { m, fiamme: fiammeQui, px }
    })
    for (const [mat, geos] of fermi) e(mergeGeometries(geos), mat, 0, 0, 0, 0, 0, 0, g)
    stazze[lv] = { g, alaD, sx, punte, luci, motori }
    return stazze[lv]
  }
  // il cono della fiamma: la base sull'ugello, la punta in giù (uv.y = 0 alla base)
  const CONO = new ConeGeometry(1, 1, 18, 1, true)
  CONO.rotateX(Math.PI); CONO.translate(0, -0.5, 0)
  for (const lv of [1, 2, 3]) stazza(lv).g.visible = false

  // la spia d'allarme sul lato buono, e l'alone rosso dell'ultimo stato
  const spiaMat = new MeshBasicMaterial({ color: new Color(3, 1.8, 0.3) })
  const spia = e(new SphereGeometry(0.06, 10, 8), spiaMat, 0.2, 0.05, 0.22)
  const quadro = new PlaneGeometry(2, 2)
  const bagliore = col => new ShaderMaterial({ vertexShader: QUADRO_V, fragmentShader: BAGLIORE_F, transparent: true,
    depthWrite: false, blending: AdditiveBlending, uniforms: { uC: { value: new Color(...col) }, uA: { value: 0 } } })
  const alone = e(quadro, bagliore([1.6, 1.0, 0.15]), 0.2, 0.05, 0.3)
  alone.scale.setScalar(0.5); alone.renderOrder = 9
  const allarme = e(quadro, bagliore([1.4, 0.2, 0.2]), 0, 0, -0.6)
  allarme.scale.setScalar(2.2); allarme.renderOrder = -1
  // i cocci attorno allo strappo
  const coccio = new ExtrudeGeometry(new Shape([new Vector2(-1, 0.7), new Vector2(1, 0.2), new Vector2(0.2, -0.9)]),
    { depth: 0.3, bevelEnabled: false })
  coccio.translate(0, 0, -0.15)
  const cocci = SCHEGGE.map(() => e(coccio, scuro))

  // lo scudo: la brina del gelo, e l'onda dove un sasso sbagliato rimbalza
  const scudoMat = new ShaderMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
    uniforms: { uHit: { value: new Vector3(0, 1, 0) }, uT: { value: 9 }, uGelo: { value: 0 } },
    vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP = normalize(position); vN = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position, 1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: SCUDO_F })
  const scudo = e(new SphereGeometry(1.75, 40, 24), scudoMat)
  scudo.renderOrder = 10

  scena.add(nave)

  let livreaOra, lvOra = 0, stOra = -1, colpo = 9, urti = 0
  const rosso = new Color()
  const fiammaCol = new Color()

  // la nave cambia vernice o stato: si ridipingono le ali (poche volte a partita)
  function vesti(lv, st, L) {
    if (L === livreaOra && lv === lvOra && st === stOra) return   // la livrea è un oggetto nuovo solo a partita nuova
    livreaOra = L
    dipingiLato(telaDx, lv, 1, st, L); dipingiLato(telaSx, lv, -1, st, L)
    texDx.needsUpdate = true; texSx.needsUpdate = true
    const T = tinteNave(L, st / 2)
    scafo.color.set(T.chiaro); scuro.color.set(T.scuro); accento.color.set(T.accento)
    const lucida = !!L?.scafoLucida, aliLucida = !!L?.aliLucida
    // un metallo vede solo l'ambiente, che è quasi nero: meno metallo e più riflesso, se no il blu muore
    scafo.metalness = lucida ? 0.55 : 0.3; scafo.roughness = lucida ? 0.32 : 0.55; scafo.envMapIntensity = lucida ? 2.4 : 0.9
    alaDx.metalness = alaSx.metalness = aliLucida ? 0.55 : 0.3
    alaDx.envMapIntensity = alaSx.envMapIntensity = aliLucida ? 2.2 : 0.9
    alaDx.roughness = alaSx.roughness = aliLucida ? 0.28 : 0.55
    const f = rgb(T.fiamma || '#4aa3ff')
    fiammaCol.setRGB(f[0], f[1], f[2])
    for (const x of fiamme) x.mat.uniforms.uC.value.copy(fiammaCol)
    if (st !== stOra) { dipingiVetro(vetroTela, st >= 2); vetroTex.needsUpdate = true }
    vetro.color.set(st >= 2 ? 0x3a0a0a : 0x07142b)
    vetro.emissive.set(st >= 2 ? 0xff5050 : 0x2a6ad0)
    for (const lv2 of [1, 2, 3]) stazze[lv2].g.visible = lv2 === lv
    const S = stazze[lv]
    S.sx.forEach((m, i) => { m.visible = i === st })
    S.luci[0].visible = st === 0           // la luce sinistra se ne va col pezzo d'ala
    for (const p of S.punte) p.pod.visible = !(p.s < 0 && st >= 1)
    lvOra = lv; stOra = st
  }

  return {
    nave,
    // `n`: la nave della view (in pixel); `X`, `Y`, `k`: da pixel a mondo; `sciame`: le scintille del disegno
    disegna(n, X, Y, k, t, dt, sciame, S) {
      const lv = Math.max(1, Math.min(3, n.lv || 1)), st = statoScafo(Math.max(0, Math.min(1, n.danno || 0)))
      vesti(lv, st, n.livrea || null)
      const R = n.r * k
      nave.position.set(X(n.x), Y(n.y) + Math.sin(t * 1.7) * 0.04 * R, 0)
      nave.scale.setScalar(R)
      // si piega nella virata, beccheggia appena; il muso va un po' dentro lo schermo
      const vira = Math.max(-0.5, Math.min(0.5, (n.vx || 0) / Math.max(1, n.r * 8)))
      nave.rotation.set(-0.3 + Math.sin(t * 1.3) * 0.04, vira * 0.9, -vira * 0.25)
      cannone.rotation.z = -((n.mira ?? -Math.PI / 2) + Math.PI / 2)
      if (n.gelo > 0) punta.color.setRGB(0.8, 1.6, 2.4); else punta.color.setRGB(2.4, 1.9, 0.5)

      // i motori: la spinta allunga le fiamme; quello rotto va a singhiozzo
      const sp = Math.max(0.2, 0.8 + (n.spinta || 0) * 1.1 + Math.sin(t * 22) * 0.14)
      for (const m of stazze[lv].motori) {
        const rotto = st === 2 && m.px <= 0 && Math.sin(t * 9) > 0
        for (const f of m.fiamme) {
          const u = f.material.uniforms
          u.uT.value = t; u.uK.value = rotto ? 0.3 : sp
          f.scale.y = f.userData.lungo * (rotto ? 0.35 : 0.6 + sp * 0.5)
        }
      }
      // le luci di posizione lampeggiano
      const L = stazze[lv].luci
      L[0].visible = st === 0 && ((t * 1.4) % 1) < 0.18
      L[1].visible = ((t * 1.4 + 0.5) % 1) < 0.18

      // la spia: ambra lenta con l'ala strappata, rossa doppia all'ultimo
      spia.visible = alone.visible = st >= 1
      allarme.visible = st === 2
      if (st >= 1) {
        const rossa = st >= 2
        const battito = Math.abs(Math.sin(t * (rossa ? 7.5 : 3.6))), acceso = 0.22 + 0.78 * battito * battito
        spiaMat.color.setRGB(rossa ? 3 * acceso : 3 * acceso, rossa ? 0.3 * acceso : 1.8 * acceso, rossa ? 0.25 : 0.3 * acceso)
        alone.material.uniforms.uC.value.setRGB(rossa ? 1.6 : 1.6, rossa ? 0.25 : 1.0, rossa ? 0.2 : 0.15)
        alone.material.uniforms.uA.value = 0.9 * acceso
        if (rossa) allarme.material.uniforms.uA.value = 0.28 * (0.35 + 0.65 * Math.abs(Math.sin(t * 5)))
        // i cocci galleggiano accanto allo strappo, e dallo strappo escono scintille
        const resta = st >= 2 ? 0.34 : 0.55, a0 = ali(lv)[0]
        const dx = a0[0][0] + (a0[1][0] - a0[0][0]) * resta, dy = a0[0][1] + (a0[1][1] - a0[0][1]) * resta
        for (let i = 0; i < SCHEGGE.length; i++) {
          const [sx, sy, sr, giro] = SCHEGGE[i], c = cocci[i]
          c.visible = true
          c.position.set(-(dx + sx), -(dy + sy + Math.sin(t * 1.6 + sx * 9) * 0.045), 0.05)
          c.rotation.set(t * 0.7 + i, t * 0.5, giro + Math.sin(t * 1.1 + sy * 7) * 0.25)
          c.scale.setScalar(sr)
        }
        if (Math.random() < dt * (rossa ? 26 : 14)) {
          const bx = n.x - dx * n.r, by = n.y + dy * n.r
          sciame.emetti(bx, by, (Math.random() - 0.7) * 80 * S, -(40 + Math.random() * 90) * S, 0.35 + Math.random() * 0.3,
                        (1.2 + Math.random() * 1.5) * S, Math.random() < 0.5 ? '#ffd94a' : '#ff9d1c', false, 220 * S)
        }
      } else for (const c of cocci) c.visible = false

      // la botta sbianca di rosso, la riparazione di verde
      rosso.setRGB(Math.min(0.8, n.botta || 0) * 1.6, 0.15 * Math.min(0.8, n.botta || 0), 0.1 * Math.min(0.8, n.botta || 0))
      if ((n.riparata || 0) > 0) rosso.setRGB(0.3 * n.riparata, 1.4 * Math.min(0.8, n.riparata), 0.5 * n.riparata)
      for (const m of pelli) m.emissive.copy(rosso)
      brucia.emissive.setRGB(1.6 * (0.6 + 0.4 * Math.sin(t * 6)), 0.45 * (0.6 + 0.4 * Math.sin(t * 6)), 0.08)

      // lo scudo: sempre lì col gelo, un'onda quando respinge
      if ((n.urti || 0) !== urti) {   // `urti` conta i sassi respinti: uno nuovo fa partire l'onda
        urti = n.urti || 0; colpo = 0
        scudoMat.uniforms.uHit.value.set(n.scudoX || 0, -(n.scudoY ?? -1), 0).normalize()
      }
      colpo += dt
      scudoMat.uniforms.uT.value = colpo
      scudoMat.uniforms.uGelo.value = Math.min(1, n.gelo || 0) * (1 + Math.sin(t * 3) * 0.08)
      scudo.visible = colpo < 1.7 || (n.gelo || 0) > 0
    },
    // dove sono gli ugelli, per la luce dei motori
    lv: () => lvOra,
  }
}
