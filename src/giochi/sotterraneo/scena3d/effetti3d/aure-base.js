// Generato da strumenti/promuovi-3d.mjs da poc/effetti-3d/aure-base.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Aure: attrezzi comuni del gruppo (texture a canvas, pool di particelle, materiali additivi, easing).
// Autonomo: non importa nulla dagli altri gruppi di effetti.
import * as THREE from 'three'

export const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
export const sm = x => { x = cl(x); return x * x * (3 - 2 * x) }
export const ou = x => 1 - Math.pow(1 - cl(x), 3)
export const ob = x => { x = cl(x); const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2) }
export const seg = (t, a, b) => cl((t - a) / (b - a))
export const trap = (t, a, b, c, d) => sm(seg(t, a, b)) * (1 - sm(seg(t, c, d)))
export const lerp = (a, b, x) => a + (b - a) * x
const BIANCO = new THREE.Color(1, 1, 1)

function rnd (s) { let a = (s | 0) + 0x6D2B79F5; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

// ───────── texture procedurali (bianco su trasparente: il colore lo mette il materiale) ─────────
const DIS = {
  alone (g) { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.22, 'rgba(255,255,255,.6)'); r.addColorStop(0.55, 'rgba(255,255,255,.16)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128) },
  anello (g) { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(0.58, 'rgba(255,255,255,0)'); r.addColorStop(0.82, 'rgba(255,255,255,1)'); r.addColorStop(0.92, 'rgba(255,255,255,.25)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128) },
  stella (g) {
    g.translate(64, 64)
    for (const [an, sc, al] of [[0, 1, 1], [Math.PI / 2, 1, 1], [Math.PI / 4, 0.55, 0.5], [-Math.PI / 4, 0.55, 0.5]]) {
      g.save(); g.rotate(an); g.scale(1, 0.085); const r = g.createRadialGradient(0, 0, 0, 0, 0, 62 * sc); r.addColorStop(0, `rgba(255,255,255,${al})`); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.beginPath(); g.arc(0, 0, 62 * sc, 0, 7); g.fill(); g.restore()
    }
    const c = g.createRadialGradient(0, 0, 0, 0, 0, 20); c.addColorStop(0, 'rgba(255,255,255,1)'); c.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = c; g.beginPath(); g.arc(0, 0, 20, 0, 7); g.fill()
  },
  croce (g) { g.shadowColor = '#fff'; g.shadowBlur = 14; g.fillStyle = '#fff'; g.beginPath(); g.roundRect(47, 18, 34, 92, 8); g.roundRect(18, 47, 92, 34, 8); g.fill() },
  foglia (g) { g.shadowColor = '#fff'; g.shadowBlur = 8; g.fillStyle = '#fff'; g.beginPath(); g.moveTo(64, 118); g.quadraticCurveTo(8, 66, 64, 8); g.quadraticCurveTo(120, 66, 64, 118); g.fill(); g.shadowBlur = 0; g.globalCompositeOperation = 'destination-out'; g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 4; g.beginPath(); g.moveTo(64, 112); g.lineTo(64, 28); g.stroke() },
  zeta (g) { g.shadowColor = '#fff'; g.shadowBlur = 16; g.fillStyle = '#fff'; g.font = 'bold 104px "Emoji Gioco", "Arial Black", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.transform(1, 0, -0.18, 1, 12, 0); g.fillText('Z', 64, 68) },
  nota (g) { g.shadowColor = '#fff'; g.shadowBlur = 12; g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.beginPath(); g.ellipse(44, 96, 21, 14, -0.45, 0, 7); g.fill(); g.fillRect(60, 18, 8, 78); g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(66, 20); g.bezierCurveTo(76, 40, 104, 46, 92, 82); g.stroke() },
  fiamma (g) {
    g.shadowColor = '#fff'; g.shadowBlur = 10
    const r = g.createRadialGradient(64, 100, 0, 64, 100, 78); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.5, 'rgba(255,255,255,.85)'); r.addColorStop(1, 'rgba(255,255,255,.3)'); g.fillStyle = r
    g.beginPath(); g.moveTo(64, 5); g.bezierCurveTo(74, 38, 112, 60, 100, 94); g.bezierCurveTo(94, 120, 34, 120, 28, 94); g.bezierCurveTo(18, 60, 56, 44, 64, 5); g.fill()
  },
  goccia (g) { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(64, 8); g.bezierCurveTo(78, 44, 106, 64, 106, 88); g.arc(64, 88, 42, 0, Math.PI, false); g.bezierCurveTo(22, 64, 50, 44, 64, 8); g.fill(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(48, 92, 7, 14, 0.3, 0, 7); g.fill() },
  bolla (g) { const r = g.createRadialGradient(64, 64, 20, 64, 64, 58); r.addColorStop(0, 'rgba(255,255,255,.04)'); r.addColorStop(1, 'rgba(255,255,255,.4)'); g.fillStyle = r; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 4; g.beginPath(); g.arc(64, 64, 56, 0, 7); g.stroke(); g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.arc(64, 64, 40, Math.PI * 1.12, Math.PI * 1.42); g.stroke() },
  fumo (g) { const q = rnd(7); for (let i = 0; i < 10; i++) { const x = 64 + (q() - 0.5) * 50, y = 64 + (q() - 0.5) * 50, R = 26 + q() * 18, r = g.createRadialGradient(x, y, 0, x, y, R); r.addColorStop(0, 'rgba(255,255,255,.4)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128) } },
  brina (g) {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,.55)'); r.addColorStop(0.7, 'rgba(255,255,255,.25)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128)
    g.translate(64, 64); g.strokeStyle = '#fff'; g.lineCap = 'round'
    for (let i = 0; i < 6; i++) { g.save(); g.rotate(i * Math.PI / 3); g.lineWidth = 3.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -52); g.stroke(); g.lineWidth = 2.5; for (const y of [-20, -36]) { g.beginPath(); g.moveTo(0, y); g.lineTo(-11, y - 11); g.moveTo(0, y); g.lineTo(11, y - 11); g.stroke() } g.restore() }
    g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.lineTo(Math.cos(a) * 30, Math.sin(a) * 30) } g.closePath(); g.stroke()
  },
  circolo (g) {
    g.translate(64, 64); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 60, 0, 7); g.stroke(); g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, 52, 0, 7); g.stroke()
    for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; g.beginPath(); g.moveTo(Math.cos(a) * 52, Math.sin(a) * 52); g.lineTo(Math.cos(a) * 60, Math.sin(a) * 60); g.stroke() }
    g.lineWidth = 2; for (const o of [0, Math.PI / 3]) { g.beginPath(); for (let i = 0; i < 3; i++) { const a = o + i * Math.PI * 2 / 3 - Math.PI / 2; g.lineTo(Math.cos(a) * 44, Math.sin(a) * 44) } g.closePath(); g.stroke() }
    g.beginPath(); g.arc(0, 0, 8, 0, 7); g.stroke()
  },
  emblema (g) { g.shadowColor = '#fff'; g.shadowBlur = 10; g.strokeStyle = '#fff'; g.lineWidth = 6; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath(); g.moveTo(64, 14); g.lineTo(106, 64); g.lineTo(64, 114); g.lineTo(22, 64); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(64, 36); g.lineTo(64, 92); g.moveTo(40, 64); g.lineTo(88, 64); g.stroke(); g.beginPath(); g.arc(64, 64, 11, 0, 7); g.stroke() },
  luna (g) { g.shadowColor = '#fff'; g.shadowBlur = 14; g.fillStyle = '#fff'; g.beginPath(); g.arc(60, 64, 46, 0, 7); g.fill(); g.shadowBlur = 0; g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(80, 54, 40, 0, 7); g.fill() },
  cuore (g) { g.shadowColor = '#fff'; g.shadowBlur = 10; g.fillStyle = '#fff'; g.beginPath(); g.moveTo(64, 108); g.bezierCurveTo(8, 70, 18, 20, 64, 44); g.bezierCurveTo(110, 20, 120, 70, 64, 108); g.fill() },
}
const TEX = {}
export function tex (nome) {
  if (!TEX[nome]) { const c = document.createElement('canvas'); c.width = c.height = 128; DIS[nome](c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; TEX[nome] = t }
  return TEX[nome]
}

// ───────── pool di particelle billboard (un InstancedMesh per texture) ─────────
const VS = `attribute vec3 iPos; attribute vec2 iSize; attribute vec4 iCol; attribute float iRot; varying vec2 vUv; varying vec4 vC;
void main(){ vUv = position.xy + .5; vC = iCol; vec4 mv = modelViewMatrix * vec4(iPos, 1.); float c = cos(iRot), s = sin(iRot); vec2 q = vec2(c*position.x - s*position.y, s*position.x + c*position.y) * iSize; mv.xy += q; gl_Position = projectionMatrix * mv; }`
const FS = `uniform sampler2D map; varying vec2 vUv; varying vec4 vC;
void main(){ vec4 tx = texture2D(map, vUv); gl_FragColor = vec4(vC.rgb, tx.a * vC.a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`
const MATP = {}
function matPool (nome, normale) {
  const k = nome + (normale ? '!' : '')
  return MATP[k] ??= new THREE.ShaderMaterial({ uniforms: { map: { value: tex(nome) } }, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, blending: normale ? THREE.NormalBlending : THREE.AdditiveBlending })
}
class Pool {
  constructor (f, nome, n, normale) {
    const g = new THREE.InstancedBufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3])
    this.n = n; this.d = { iPos: new Float32Array(n * 3), iSize: new Float32Array(n * 2), iCol: new Float32Array(n * 4), iRot: new Float32Array(n) }
    for (const [nm, sz] of [['iPos', 3], ['iSize', 2], ['iCol', 4], ['iRot', 1]]) { const a = new THREE.InstancedBufferAttribute(this.d[nm], sz); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(nm, a) }
    g.instanceCount = n; this.g = g
    this.mesh = new THREE.Mesh(g, matPool(nome, normale)); this.mesh.frustumCulled = false; this.mesh.renderOrder = 3
    f.g.add(this.mesh); f.lista.push(g); f.pools.push(this)
  }
  /** Mette la particella i: posizione, larghezza e altezza (mondo), colore, alfa, rotazione. */
  pon (i, x, y, z, w, h, c, a, rot = 0) {
    const d = this.d, j = i * 3; d.iPos[j] = x; d.iPos[j + 1] = y; d.iPos[j + 2] = z
    d.iSize[i * 2] = w; d.iSize[i * 2 + 1] = h ?? w; const q = i * 4; d.iCol[q] = c.r; d.iCol[q + 1] = c.g; d.iCol[q + 2] = c.b; d.iCol[q + 3] = a; d.iRot[i] = rot
  }
  spegni (i) { this.d.iSize[i * 2] = this.d.iSize[i * 2 + 1] = 0 }
  flush () { for (const k in this.d) this.g.attributes[k].needsUpdate = true }
}

/** Il banco di lavoro di un effetto: gruppo posizionato, colori, caso, e tutto ciò che va liberato. */
export function nuovo (ctx, punto) {
  const f = { g: new THREE.Group(), k: ctx.scala ?? 1, lista: [], pools: [], rnd: rnd(ctx.seme ?? 1) }
  f.tinta = ctx.tinta.clone(); f.tinta2 = ctx.tinta2 ? ctx.tinta2.clone() : ctx.tinta.clone().lerp(BIANCO, 0.55)
  f.g.position.set(punto.x, 0, punto.z)   // l'altezza si ignora: i piedi stanno sul pavimento (y = 0)
  f.dir = new THREE.Vector3(ctx.a.x - ctx.da.x, 0, ctx.a.z - ctx.da.z); if (f.dir.lengthSq() < 1e-4) f.dir.set(1, 0, 0); f.dir.normalize()
  f.fronte = new THREE.Group(); f.fronte.rotation.y = Math.atan2(-f.dir.z, f.dir.x); f.g.add(f.fronte)   // il suo +x guarda l'avversario
  f.pool = (nome, n, normale) => new Pool(f, nome, n, normale)
  const trac = o => { f.lista.push(o); return o }
  f.add = (colore, op = 1, o = {}) => trac(new THREE.MeshBasicMaterial({ color: colore, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, ...o }))
  f.nor = (colore, op = 1, o = {}) => trac(new THREE.MeshBasicMaterial({ color: colore, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide, ...o }))
  f.sol = (colore, o = {}) => trac(new THREE.MeshStandardMaterial({ color: colore, roughness: 0.5, metalness: 0, flatShading: true, transparent: true, ...o }))
  f.mesh = (geo, mat, padre = f.g) => { trac(geo); const m = new THREE.Mesh(geo, mat); padre.add(m); return m }
  f.linee = (geo, colore, op = 1, padre = f.g) => { const e = new THREE.EdgesGeometry(geo, 20); const m = trac(new THREE.LineBasicMaterial({ color: colore, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })); trac(e); const l = new THREE.LineSegments(e, m); padre.add(l); return l }
  f.sprite = (nome, w, h, colore, op = 1, normale = false, padre = f.g) => { const m = trac(new THREE.SpriteMaterial({ map: tex(nome), color: colore, transparent: true, depthWrite: false, blending: normale ? THREE.NormalBlending : THREE.AdditiveBlending, opacity: op })); const s = new THREE.Sprite(m); s.scale.set(w, h ?? w, 1); padre.add(s); return s }
  /** Disco piatto sul pavimento con una texture (anello, cerchio magico, brina). */
  f.disco = (nome, colore, op = 1) => { const m = f.mesh(new THREE.PlaneGeometry(2, 2), f.add(colore, op, { map: tex(nome) })); m.rotation.x = -Math.PI / 2; m.position.y = 0.025; m.renderOrder = 1; return m }
  f.flush = () => { for (const p of f.pools) p.flush() }
  f.libera = () => { f.g.removeFromParent(); for (const o of f.lista) o.dispose?.() }
  return f
}
/** Avvolge il passo di un effetto a tempo nel contratto {gruppo, aggiorna, libera}. */
export function effetto (f, durata, passo) {
  return { gruppo: f.g, aggiorna (t, dt) { if (t >= durata) { f.g.visible = false; return false } f.g.visible = true; passo(t, dt); f.flush(); return true }, libera: f.libera }
}
/** Gradiente per vertice lungo l'altezza: colore * fn(y normalizzata 0..1). */
export function sfumaY (geo, colore, fn) {
  geo.computeBoundingBox(); const bb = geo.boundingBox, p = geo.attributes.position, c = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) { const v = fn((p.getY(i) - bb.min.y) / (bb.max.y - bb.min.y || 1)); c[i * 3] = colore.r * v; c[i * 3 + 1] = colore.g * v; c[i * 3 + 2] = colore.b * v }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); return geo
}
/** Una sfera/solido grumoso (le palle di fuoco non sono perfette). */
export function grumo (geo, ampiezza, f1 = 3.1, f2 = 2.3, f3 = 3.7) {
  const p = geo.attributes.position, v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).normalize(); const d = 1 + ampiezza * (Math.sin(v.x * f1 + 1.3) * Math.sin(v.y * f2 + 0.7) + 0.7 * Math.sin(v.z * f3 + 2.1)); p.setXYZ(i, v.x * d, v.y * d, v.z * d) }
  geo.computeVertexNormals(); return geo
}
/** Una palla di luce morbida (sfera con alfa che sfuma al bordo, centro caldo, un po' di rumore): fuoco, bolle, nuclei. */
export function palla (f, bordo, centro, { grumi = 0.12, rumore = 0.25, normale = false } = {}) {
  const geo = grumo(new THREE.SphereGeometry(1, 32, 20), grumi)
  const mat = new THREE.ShaderMaterial({
    uniforms: { uA: { value: 1 }, uT: { value: 0 }, uB: { value: bordo.clone() }, uC: { value: centro.clone() }, uR: { value: rumore } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vP = position; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform float uA; uniform float uT; uniform float uR; uniform vec3 uB; uniform vec3 uC; varying vec3 vN; varying vec3 vV; varying vec3 vP;
void main(){ float d = abs(dot(normalize(vN), normalize(vV))); float nz = 1. - uR + uR * (sin(vP.x*8. + uT*7.) * sin(vP.y*7. - uT*5.) * sin(vP.z*9. + uT*6.) * .5 + .5) * 2.;
vec3 c = mix(uB, uC, pow(d, 1.6)) * nz; gl_FragColor = vec4(c, pow(d, .8) * uA);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
    transparent: true, depthWrite: false, blending: normale ? THREE.NormalBlending : THREE.AdditiveBlending,
  })
  f.lista.push(geo, mat); const m = new THREE.Mesh(geo, mat); f.g.add(m); m.renderOrder = 2
  m.opacita = v => { mat.uniforms.uA.value = v }; m.tempo = v => { mat.uniforms.uT.value = v }
  return m
}
/** Il profilo di uno scudo a goccia (alto ~1.1, largo ~.7). `rotto` gli morde l'angolo in alto a destra. */
export function formaScudo (rotto = false) {
  const sh = new THREE.Shape()
  if (!rotto) { sh.moveTo(-0.34, 0.5); sh.quadraticCurveTo(0, 0.6, 0.34, 0.5); sh.lineTo(0.34, 0.1) } else { sh.moveTo(-0.34, 0.5); sh.quadraticCurveTo(-0.12, 0.57, 0.0, 0.55); sh.lineTo(0.09, 0.32); sh.lineTo(0.17, 0.4); sh.lineTo(0.2, 0.12); sh.lineTo(0.34, 0.2); sh.lineTo(0.34, 0.1) }
  sh.bezierCurveTo(0.34, -0.25, 0.12, -0.45, 0, -0.58); sh.bezierCurveTo(-0.12, -0.45, -0.34, -0.25, -0.34, 0.1); sh.closePath()
  return sh
}
export const scudoGeo = (rotto = false, sp = 0.05) => new THREE.ExtrudeGeometry(formaScudo(rotto), { depth: sp, bevelEnabled: true, bevelSize: 0.022, bevelThickness: 0.02, bevelSegments: 1, steps: 1 }).translate(0, 0, -sp / 2)
export const mescola = (a, b, x) => a.clone().lerp(b, x)
export { THREE }
