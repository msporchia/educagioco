// Generato da strumenti/promuovi-3d.mjs da poc/roba-3d/aloni.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Gli aloni della rarità e dell'elemento: a QUALSIASI modello di roba (le figure di poc/roba-3d, le armi della collezione) un aspetto
// di rarità che costa una chiamata sola: un Points, col suo materiale (le uniformi sono dell'istanza), in somma di luce.
//   comune      niente
//   magico      scintille blu tenui che salgono
//   raro        luccichii gialli a stella e un bordo che brilla sulla superficie
//   leggendario un'aura arancio-oro che pulsa, scintille che le girano attorno e qualche favilla che sale
// più, se l'elemento non è «nessuno», una velatura del suo colore sulla superficie e piccoli motivi suoi (fiammelle, fiocchi, bolle…).
// Uso: `const togli = aggiungiAlone(gruppo, { rarita, elemento })`, poi `gruppo.userData.animaAlone(t)` a ogni fotogramma (t in
// secondi; un'anteprima ferma lo chiama una volta). Le posizioni si prendono dalla superficie del modello COM'È ADESSO (dopo `anima`).
// Il dettaglio: docs/sotterraneo/roba-3d.md.
import { BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial, AdditiveBlending, Vector3, Vector2, Matrix4, Color } from 'three'
import { ELEMENTI } from './palette.js'

export const RARITA_ALONE = ['comune', 'magico', 'raro', 'leggendario']

// i colori delle rarità (quelli di Diablo del gioco, dati/pezzi.js, schiariti perché sono luce)
const BLU = 0x8fb0ff, GIALLO = 0xffe27a, ORO = 0xffb347, ARANCIO = 0xff8a2e

// le forme (il frammento le disegna su gl_PointCoord): 0 punto morbido, 1 stella a 4 (luccichio), 2 stella a 6 (fiocco), 3 fiammella,
// 4 anello (bolla), 5 rombo (runa), 6 foglia, 7 saetta
// i moti: 0 sale (nel mondo, verso l'alto), 1 fermo che scintilla, 2 velo che pulsa, 3 gira attorno all'asse lungo, 4 scende piano, 5 salta qua e là
const MOTIVI = {
  fuoco:    { forma: 3, moto: 0, n: 12 },
  ghiaccio: { forma: 2, moto: 4, n: 10 },
  fulmine:  { forma: 7, moto: 5, n: 10 },
  veleno:   { forma: 4, moto: 0, n: 10 },
  luce:     { forma: 1, moto: 1, n: 12 },
  ombra:    { forma: 0, moto: 4, n: 12 },
  arcano:   { forma: 5, moto: 3, n: 10 },
  natura:   { forma: 6, moto: 4, n: 10 },
  acqua:    { forma: 4, moto: 0, n: 10 },
  oro:      { forma: 1, moto: 1, n: 12 },
  sangue:   { forma: 3, moto: 4, n: 10 },
  morte:    { forma: 0, moto: 0, n: 12 },
}

const VERTICE = /* glsl */`
  attribute vec4 aSeme;
  attribute vec3 aColore;
  attribute vec4 aPar;        // x misura (frazione della taglia), y velocità, z moto, w forma
  uniform float uT, uAlto, uTaglia, uLungo, uRaggio, uIntensita;
  uniform vec3 uCentro, uAsse, uU, uV;
  varying vec3 vColore;
  varying float vAlfa, vForma, vGiro;
  const float PI2 = 6.2831853;
  void main () {
    float moto = aPar.z, vel = aPar.y;
    float scala = length(modelMatrix[0].xyz);
    vec3 locale = position;
    vec3 spinta = vec3(0.0);                  // nel mondo, in unità della taglia
    float alfa = 1.0, misura = aPar.x;
    float fase = fract(uT * vel + aSeme.x);
    if (moto < 0.5) {                         // sale
      spinta = vec3(sin(uT * 2.3 + aSeme.y * PI2) * 0.04, fase * 0.42, cos(uT * 1.9 + aSeme.z * PI2) * 0.04);
      alfa = smoothstep(0.0, 0.18, fase) * (1.0 - smoothstep(0.55, 1.0, fase));
      misura *= 1.0 - 0.45 * fase;
    } else if (moto < 1.5) {                  // luccica sul posto
      float s = max(0.0, sin(uT * vel * 6.0 + aSeme.y * PI2));
      float lampo = pow(s, 10.0);
      alfa = 0.15 + 0.85 * lampo;
      misura *= 0.35 + 0.9 * lampo;
    } else if (moto < 2.5) {                  // velo che pulsa, appena gonfio
      float p = 0.5 + 0.5 * sin(uT * vel * PI2 + aSeme.y * 1.3);
      locale += (position - uCentro) * 0.06 * p;
      alfa = 0.55 + 0.45 * p;
      misura *= 0.85 + 0.3 * p;
    } else if (moto < 3.5) {                  // gira attorno all'asse lungo
      float ang = uT * vel * (0.8 + 0.5 * aSeme.z) * PI2 + aSeme.y * PI2;
      float h = (aSeme.x * 2.0 - 1.0) * uLungo * 0.9 + sin(uT * 0.9 + aSeme.w * PI2) * uLungo * 0.15;
      float r = uRaggio * (0.85 + 0.35 * aSeme.z);
      locale = uCentro + uAsse * h + (uU * cos(ang) + uV * sin(ang)) * r;
      alfa = 0.6 + 0.4 * sin(uT * 3.0 + aSeme.w * PI2);
    } else if (moto < 4.5) {                  // scende piano, ondeggiando
      spinta = vec3(sin(uT * 1.4 + aSeme.y * PI2) * 0.08, -fase * 0.3, cos(uT * 1.1 + aSeme.z * PI2) * 0.06);
      alfa = smoothstep(0.0, 0.2, fase) * (1.0 - smoothstep(0.6, 1.0, fase));
    } else {                                  // salta qua e là (la scintilla del fulmine)
      float passo = floor(uT * vel * 7.0 + aSeme.x * 13.0);
      float c = fract(sin(passo * 12.9898 + aSeme.y * 78.233) * 43758.5453);
      vec3 d = vec3(fract(c * 7.13) - 0.5, fract(c * 3.71) - 0.5, fract(c * 5.17) - 0.5);
      locale += d * uTaglia * 0.12;
      alfa = step(0.35, c);
    }
    vec4 mondo = modelMatrix * vec4(locale, 1.0);
    mondo.xyz += spinta * uTaglia * scala;
    vec4 mv = viewMatrix * mondo;
    gl_Position = projectionMatrix * mv;
    float px = misura * uTaglia * scala * uAlto * projectionMatrix[1][1] * 0.5 / max(0.001, -mv.z);
    gl_PointSize = clamp(px, 0.0, 96.0);
    vColore = aColore;
    vAlfa = alfa * uIntensita * step(0.5, px);
    vForma = aPar.w;
    vGiro = aSeme.w * PI2 + uT * 0.6;
  }
`

const FRAMMENTO = /* glsl */`
  varying vec3 vColore;
  varying float vAlfa, vForma, vGiro;
  float stella (vec2 p, float punte, float acuta) {
    float a = atan(p.y, p.x), r = length(p);
    float raggi = pow(abs(cos(a * punte * 0.5)), acuta);
    return max(0.0, 1.0 - r / (0.12 + 0.88 * raggi));
  }
  void main () {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    p.y = -p.y;
    float r = length(p), a = 0.0;
    if (vForma < 0.5) a = pow(max(0.0, 1.0 - r), 1.6);                                   // punto morbido
    else if (vForma < 1.5) { a = pow(stella(p, 4.0, 18.0), 1.6) + pow(max(0.0, 1.0 - r * 2.2), 2.0); }    // luccichio
    else if (vForma < 2.5) { vec2 q = mat2(cos(vGiro), -sin(vGiro), sin(vGiro), cos(vGiro)) * p;
                             a = pow(stella(q, 6.0, 30.0), 1.3) + pow(max(0.0, 1.0 - r * 3.0), 2.0); }   // fiocco
    else if (vForma < 3.5) { vec2 q = vec2(p.x * (1.6 + p.y * 0.9), p.y + 0.15);                     // fiammella: goccia a punta in su
                             a = pow(max(0.0, 1.0 - length(q) * 1.05), 1.4) * smoothstep(1.0, 0.2, p.y); }
    else if (vForma < 4.5) a = smoothstep(0.22, 0.0, abs(r - 0.62)) * 0.9 + pow(max(0.0, 1.0 - length(p - vec2(-0.25, 0.28)) * 4.0), 2.0);   // bolla
    else if (vForma < 5.5) { vec2 q = mat2(cos(vGiro), -sin(vGiro), sin(vGiro), cos(vGiro)) * p;
                             float d = abs(q.x) + abs(q.y); a = smoothstep(0.95, 0.7, d) * (0.45 + 0.55 * smoothstep(0.55, 0.3, abs(d - 0.5) + 0.2)); }   // runa
    else if (vForma < 6.5) { vec2 q = mat2(cos(vGiro), -sin(vGiro), sin(vGiro), cos(vGiro)) * p;
                             a = smoothstep(1.0, 0.75, length(vec2(q.x * 2.2, q.y))) * (1.0 - 0.5 * smoothstep(0.08, 0.0, abs(q.x))); }   // foglia
    else { vec2 q = p; float zig = abs(q.x - (fract(q.y * 1.5 + 0.5) - 0.5) * 0.9 * sign(sin(q.y * 4.7)));                          // saetta
           a = smoothstep(0.24, 0.05, zig) * smoothstep(1.0, 0.7, abs(q.y)); }
    a *= vAlfa;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColore * a, a);
  }
`

// un generatore pseudo-casuale col suo seme: lo stesso modello ha sempre lo stesso alone (le anteprime non cambiano a ogni giro)
function casuale (seme) {
  let s = seme >>> 0 || 1
  return () => { s = Math.imul(s ^ (s >>> 15), 0x2c1b3c6d); s = Math.imul(s ^ (s >>> 12), 0x297a2d39); s ^= s >>> 15; return (s >>> 0) / 4294967296 }
}

const _a = new Vector3(), _b = new Vector3(), _c = new Vector3(), _m = new Matrix4(), _inv = new Matrix4()

/** I triangoli del modello nello spazio del gruppo, con l'area: per pescare punti sulla superficie in proporzione. */
function superficie (gruppo) {
  gruppo.updateMatrixWorld(true)
  _inv.copy(gruppo.matrixWorld).invert()
  const tri = [], aree = []
  let tot = 0
  gruppo.traverseVisible(o => {
    if (!o.isMesh || !o.geometry || o.isPoints || o.userData.alone) return
    const pos = o.geometry.attributes.position
    if (!pos) return
    _m.multiplyMatrices(_inv, o.matrixWorld)
    const idx = o.geometry.index
    const n = idx ? idx.count : pos.count
    // un modello molto fitto si campiona a passi (un alone non vuole la precisione, vuole la forma)
    const salto = Math.max(1, Math.floor(n / 3 / 1500)) * 3
    for (let i = 0; i + 2 < n; i += salto) {
      const ia = idx ? idx.getX(i) : i, ib = idx ? idx.getX(i + 1) : i + 1, ic = idx ? idx.getX(i + 2) : i + 2
      _a.fromBufferAttribute(pos, ia).applyMatrix4(_m)
      _b.fromBufferAttribute(pos, ib).applyMatrix4(_m)
      _c.fromBufferAttribute(pos, ic).applyMatrix4(_m)
      const area = _b.clone().sub(_a).cross(_c.clone().sub(_a)).length() / 2
      if (!(area > 0)) continue
      tri.push(_a.clone(), _b.clone(), _c.clone())
      tot += area; aree.push(tot)
    }
  })
  return { tri, aree, tot }
}

function pescaSullaSuperficie (s, rnd) {
  const x = rnd() * s.tot
  let lo = 0, hi = s.aree.length - 1
  while (lo < hi) { const m = (lo + hi) >> 1; if (s.aree[m] < x) lo = m + 1; else hi = m }
  let u = rnd(), v = rnd()
  if (u + v > 1) { u = 1 - u; v = 1 - v }
  const a = s.tri[lo * 3], b = s.tri[lo * 3 + 1], c = s.tri[lo * 3 + 2]
  return new Vector3().copy(a).addScaledVector(_b.copy(b).sub(a), u).addScaledVector(_c.copy(c).sub(a), v)
}

/**
 * Mette l'alone a `gruppo`. `rarita` 'comune'|'magico'|'raro'|'leggendario', `elemento` una chiave di ELEMENTI (palette.js);
 * `scala` moltiplica la misura dei punti (1 di difetto), `intensita` la loro luce (1), `seme` per un alone diverso dello stesso modello.
 * → `togli()`. Un modello comune senza elemento non ha alone: `togli` non fa niente. `gruppo.userData.animaAlone(t)` lo muove.
 */
export function aggiungiAlone (gruppo, { rarita = 'comune', elemento = 'nessuno', scala = 1, intensita = 1, seme = 7 } = {}) {
  const nulla = () => {}
  if (!gruppo) return nulla
  const el = ELEMENTI[elemento] && elemento !== 'nessuno' ? elemento : null
  if (rarita !== 'magico' && rarita !== 'raro' && rarita !== 'leggendario' && !el) return nulla
  const s = superficie(gruppo)
  if (!s.tri.length) return nulla

  // la scatola, l'asse lungo e il centro, dai punti della superficie
  const min = new Vector3(Infinity, Infinity, Infinity), max = new Vector3(-Infinity, -Infinity, -Infinity)
  for (const p of s.tri) { min.min(p); max.max(p) }
  const dim = max.clone().sub(min), centro = min.clone().add(max).multiplyScalar(0.5)
  const taglia = Math.max(dim.x, dim.y, dim.z) || 1
  const asse = dim.y >= dim.x && dim.y >= dim.z ? new Vector3(0, 1, 0) : dim.x >= dim.z ? new Vector3(1, 0, 0) : new Vector3(0, 0, 1)
  const u = Math.abs(asse.y) > 0.9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0)
  const v = new Vector3().crossVectors(asse, u)
  const lato = [dim.x, dim.y, dim.z].sort((a, b) => b - a)[1]

  const rnd = casuale(seme * 2654435761 + s.tri.length)
  const pos = [], semi = [], colori = [], par = []
  const col = new Color(), _tinta = new Color()
  function metti (quanti, { colore, colore2 = null, misura, vel, moto, forma, dove = 'superficie', luce = 1 }) {
    for (let i = 0; i < quanti; i++) {
      const p = dove === 'centro' ? centro : pescaSullaSuperficie(s, rnd)
      pos.push(p.x, p.y, p.z)
      semi.push(rnd(), rnd(), rnd(), rnd())
      col.set(colore); if (colore2 != null) col.lerp(_tinta.set(colore2), rnd())
      col.multiplyScalar(luce * 1.5)
      colori.push(col.r, col.g, col.b)
      par.push(misura * scala * (0.75 + 0.5 * rnd()), vel * (0.8 + 0.4 * rnd()), moto, forma)
    }
  }

  if (rarita === 'magico') metti(28, { colore: BLU, colore2: 0xd8e4ff, misura: 0.085, vel: 0.45, moto: 0, forma: 0 })
    metti(30, { colore: 0x5a7dff, misura: 0.06, vel: 0.3, moto: 2, forma: 0, luce: 0.45 })   // un velo azzurro appena
  if (rarita === 'raro') {
    metti(90, { colore: GIALLO, misura: 0.09, vel: 0.35, moto: 2, forma: 0, luce: 1.1 })                     // il bordo che brilla
    metti(26, { colore: 0xfff4c0, colore2: GIALLO, misura: 0.24, vel: 0.22, moto: 1, forma: 1 })   // i luccichii
  }
  if (rarita === 'leggendario') {
    metti(110, { colore: ORO, colore2: el ? ELEMENTI[el].colore : ARANCIO, misura: 0.26, vel: 0.45, moto: 2, forma: 0, luce: 0.55 })        // l'aura
    metti(16, { colore: 0xffe7a0, colore2: ORO, misura: 0.14, vel: 0.32, moto: 3, forma: 1, dove: 'centro' })   // in orbita
    metti(18, { colore: 0xffd27a, colore2: ARANCIO, misura: 0.08, vel: 0.5, moto: 0, forma: 0 })    // le faville
  }
  if (el) {
    const e = ELEMENTI[el], m = MOTIVI[el] || { forma: 0, moto: 0, n: 10 }
    metti(50, { colore: e.colore, misura: 0.09, vel: 0.3, moto: 2, forma: 0, luce: 0.85 })                      // la velatura
    metti(m.n, { colore: e.colore2, colore2: e.colore, misura: 0.15, vel: m.moto === 5 ? 0.35 : 0.4, moto: m.moto, forma: m.forma })
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3))
  geo.setAttribute('aSeme', new Float32BufferAttribute(semi, 4))
  geo.setAttribute('aColore', new Float32BufferAttribute(colori, 3))
  geo.setAttribute('aPar', new Float32BufferAttribute(par, 4))
  const uniformi = {
    uT: { value: 0 }, uAlto: { value: 800 }, uTaglia: { value: taglia }, uLungo: { value: taglia / 2 }, uRaggio: { value: Math.max(lato * 0.75, taglia * 0.16) },
    uIntensita: { value: intensita }, uCentro: { value: centro }, uAsse: { value: asse }, uU: { value: u }, uV: { value: v },
  }
  const mat = new ShaderMaterial({ uniforms: uniformi, vertexShader: VERTICE, fragmentShader: FRAMMENTO, transparent: true, depthWrite: false, blending: AdditiveBlending })
  const punti = new Points(geo, mat)
  punti.frustumCulled = false
  punti.renderOrder = 5
  punti.raycast = () => {}                                  // il dito non lo prende
  punti.userData.alone = true
  const _px = new Vector2()
  punti.onBeforeRender = r => { r.getDrawingBufferSize(_px); uniformi.uAlto.value = _px.y }
  gruppo.add(punti)

  const prima = gruppo.userData.animaAlone
  gruppo.userData.animaAlone = t => { uniformi.uT.value = t; if (prima) prima(t) }
  gruppo.userData.aloneUniformi = uniformi
  let tolto = false
  return () => {
    if (tolto) return
    tolto = true
    gruppo.remove(punti)
    geo.dispose(); mat.dispose()
    gruppo.userData.animaAlone = prima
    if (!prima) delete gruppo.userData.animaAlone
  }
}

/** Quanti punti avrà l'alone (per le misure): 0 per un comune senza elemento. */
export function puntiDellAlone ({ rarita = 'comune', elemento = 'nessuno' } = {}) {
  const el = ELEMENTI[elemento] && elemento !== 'nessuno' ? elemento : null
  return ({ magico: 58, raro: 116, leggendario: 144 }[rarita] || 0) + (el ? 50 + ((MOTIVI[el] || {}).n || 10) : 0)
}
