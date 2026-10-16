// Il kit dei pezzi, tutti in codice e parametrici (il seme dà la variazione): case, bancarelle, la fucina, la torretta,
// il pozzo, il mulino con la ruota, i ponti (arco di pietra, travi, passerella), staccionate, lanterne, cartelli, il campo
// del minatore. Le parti ferme si posano in un «cantiere» e alla fine diventano UNA mesh per materiale (pochi draw call):
// il colore sta nei vertici, la trama nel materiale. Le parti che si muovono (la ruota, le fiamme) restano a parte.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { quotaTerreno, LIVELLO_ACQUA } from './generatore.js'
import { caso } from './caso.js'
import { vesti } from './vesti.js'

// ── i materiali del kit: pochi, condivisi ──
export function materialiDelKit (trame) {
  const std = (o, v = {}) => vesti(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0, ...o }), v)
  const stoffa = std({ map: trame.stoffa.map, side: THREE.DoubleSide, roughness: 0.95 })
  stoffa.name = 'stoffa'
  const prima = stoffa.onBeforeCompile
  stoffa.onBeforeCompile = (sh, r) => {
    prima(sh, r)
    // le righe: dove la maschera è 1 la stoffa è bianca, dove è 0 del colore del pezzo
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <map_fragment>', 'vec4 righe = texture2D(map, vMapUv);')
      .replace('#include <color_fragment>', 'diffuseColor.rgb = mix(vColor.rgb, vec3(0.95, 0.93, 0.86), step(0.5, righe.r)) * (0.85 + righe.g * 0.2);')
  }
  return {
    pietra: std({ map: trame.pietra.map, normalMap: trame.pietra.normalMap }),
    legno: std({ map: trame.legno.map, normalMap: trame.legno.normalMap, roughness: 0.8 }),
    intonaco: std({ map: trame.intonaco.map, normalMap: trame.intonaco.normalMap, roughness: 0.95 }),
    tegole: std({ map: trame.tegole.map, normalMap: trame.tegole.normalMap, side: THREE.DoubleSide }),
    paglia: std({ map: trame.paglia.map, normalMap: trame.paglia.normalMap, side: THREE.DoubleSide, roughness: 1 }),
    liscio: std({ roughness: 0.6 }),
    stoffa,
    luce: vesti(new THREE.MeshBasicMaterial({ vertexColors: true }), { nuvole: false }),
  }
}

// ── le forme, con le coordinate di trama in unità di mondo (`ripeti`: quante unità copre una trama) ──
export function scatola (w, h, d, ripeti = 1) {
  const g = new THREE.BoxGeometry(w, h, d)
  const uv = g.attributes.uv
  const facce = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * facce[f][0] / ripeti, uv.getY(k) * facce[f][1] / ripeti) }
  return g
}
export function cilindro (rt, rb, h, seg = 12, ripeti = 1, aperto = false) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, aperto)
  const uv = g.attributes.uv, giro = Math.PI * (rt + rb)
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * giro / ripeti, uv.getY(i) * h / ripeti)
  return g
}
function triangolo (a, b, c) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...b], 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute([a[0], a[1], b[0], b[1], c[0], c[1], a[0], a[1], c[0], c[1], b[0], b[1]], 2))
  g.computeVertexNormals()
  return g
}

// ── il cantiere: si posano pezzi in coordinate locali (`base` sposta e gira tutto il gruppo), poi si chiude ──
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3()
export class Cantiere {
  constructor (mat) { this.mat = mat; this.liste = {}; this.b = new THREE.Matrix4(); this.tri = 0 }
  base (x = 0, y = 0, z = 0, ry = 0) { this.b.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(1, 1, 1)); return this }
  // un punto locale in coordinate di mondo (per chi deve sapere dov'è un camino, una fiamma)
  dove (x, y, z) { return new THREE.Vector3(x, y, z).applyMatrix4(this.b) }
  metti (nome, geo, x, y, z, colore = [1, 1, 1], { rx = 0, ry = 0, rz = 0, s = null, ordine = 'XYZ' } = {}) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone()
    _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, ordine)), s ? _s.set(...s) : _s.set(1, 1, 1))
    g.applyMatrix4(_m.premultiply(this.b))
    const n = g.attributes.position.count
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k)
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2))
    if (!g.attributes.normal) g.computeVertexNormals()
    const c = new Float32Array(n * 3); for (let i = 0; i < n; i++) c.set(colore, i * 3)
    g.setAttribute('color', new THREE.BufferAttribute(c, 3))
    ;(this.liste[nome] ||= []).push(g)
    this.tri += n / 3
    return g
  }
  chiudi (scena) {
    const mesh = []
    for (const [nome, lista] of Object.entries(this.liste)) {
      const g = mergeGeometries(lista)
      const me = new THREE.Mesh(g, this.mat[nome])
      me.castShadow = nome !== 'luce'; me.receiveShadow = true
      scena.add(me); mesh.push(me)
    }
    return mesh
  }
}

const COLORI = {
  intonaco: [[0.96, 0.92, 0.82], [0.95, 0.86, 0.70], [0.92, 0.80, 0.72], [0.86, 0.88, 0.84], [0.98, 0.95, 0.90]],
  tegole: [[0.80, 0.42, 0.30], [0.66, 0.36, 0.28], [0.85, 0.52, 0.34], [0.50, 0.54, 0.62]],
  imposte: [[0.30, 0.50, 0.40], [0.30, 0.42, 0.62], [0.62, 0.26, 0.22], [0.42, 0.32, 0.24]],
  legnoScuro: [0.42, 0.30, 0.22], legno: [0.72, 0.56, 0.40], pietra: [0.80, 0.78, 0.74], vetro: [0.20, 0.28, 0.36], ferro: [0.25, 0.25, 0.27],
}
const scegli = (r, l) => l[Math.floor(r() * l.length)]

// il tetto a falde: due lastre inclinate con lo sbalzo e i due timpani; `y` è la cima del muro
function tetto (c, w, d, y, alto, sb, mat, col, colMuro, matMuro, lungoX = true) {
  const lw = lungoX ? w : d, ld = lungoX ? d : w
  const m2 = ld / 2 + sb, a2 = Math.atan2(alto, m2), L2 = Math.hypot(m2, alto), yw2 = alto * sb / m2
  const yy = y - yw2
  for (const lato of [-1, 1]) {
    const cz = lato * m2 / 2, cy = yy + alto / 2
    const g = scatola(lw + sb * 2, 0.07, L2, 1.4)
    // la lastra gira attorno all'asse lungo il colmo
    const off = lungoX ? [0, cy, cz] : [cz, cy, 0]
    c.metti(mat, g, off[0], off[1], off[2], col, lungoX ? { rx: lato * a2 } : { ry: Math.PI / 2, rx: lato * a2, ordine: 'YXZ' })
  }
  // i timpani
  for (const lato of [-1, 1]) {
    const x = lato * lw / 2 * 0.999
    const tri = triangolo([x, y, -ld / 2], [x, y, ld / 2], [x, yy + alto, 0])
    const g = lungoX ? tri : tri.rotateY(Math.PI / 2)
    c.metti(matMuro, g, 0, 0, 0, colMuro)
  }
  return yy + alto
}

// ── la casa: zoccolo di pietra, muri d'intonaco (a volte a graticcio) o di legno, tetto di tegole o di paglia, porta verso
// la strada, finestre con le imposte, il camino col fumo ──
export function casa (c, cant, m, kit) {
  const r = caso(c.seme + 1)
  const ang = { s: 0, e: Math.PI / 2, n: Math.PI, o: -Math.PI / 2 }[c.verso]
  const lw = c.verso === 's' || c.verso === 'n' ? c.w : c.h, ld = c.verso === 's' || c.verso === 'n' ? c.h : c.w
  const cx = c.x + c.w / 2, cz = c.y + c.h / 2
  cant.base(cx, quotaTerreno(m, cx, cz), cz, ang)
  const bw = lw - 0.55, bd = ld - 0.55
  const z0 = 0.32, alt = (lw * ld >= 16 ? 2.3 : 1.55) + r() * 0.35
  const legnosa = r() < 0.22
  const colMuro = legnosa ? COLORI.legno : scegli(r, COLORI.intonaco)
  cant.metti('pietra', scatola(bw + 0.08, z0, bd + 0.08, 1.4), 0, z0 / 2, 0, COLORI.pietra)
  cant.metti(legnosa ? 'legno' : 'intonaco', scatola(bw, alt, bd, legnosa ? 1.2 : 2), 0, z0 + alt / 2, 0, colMuro)
  if (!legnosa && r() < 0.55) {
    // il graticcio: i montanti agli angoli e una trave a metà
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cant.metti('legno', scatola(0.12, alt, 0.12, 1), sx * bw / 2, z0 + alt / 2, sz * bd / 2, COLORI.legnoScuro)
    for (const sz of [-1, 1]) cant.metti('legno', scatola(bw + 0.04, 0.1, 0.06, 1), 0, z0 + alt * 0.5, sz * (bd / 2 + 0.02), COLORI.legnoScuro)
    for (const sx of [-1, 1]) cant.metti('legno', scatola(0.06, 0.1, bd + 0.04, 1), sx * (bw / 2 + 0.02), z0 + alt * 0.5, 0, COLORI.legnoScuro)
  }
  const paglia = !legnosa && r() < 0.25
  const colTetto = paglia ? [0.9, 0.8, 0.55] : scegli(r, COLORI.tegole)
  const lungoX = bw >= bd
  const cima = tetto(cant, bw, bd, z0 + alt, 0.75 + r() * 0.45 + Math.min(bw, bd) * 0.1, 0.28, paglia ? 'paglia' : 'tegole', colTetto, colMuro, legnosa ? 'legno' : 'intonaco', lungoX)
  // la porta e le finestre
  const px = (r() - 0.5) * (bw - 1.2)
  cant.metti('legno', scatola(0.62, 1.0, 0.08, 1), px, z0 + 0.5, bd / 2 + 0.03, COLORI.legnoScuro)
  cant.metti('pietra', scatola(0.8, 0.1, 0.12, 1), px, z0 + 1.05, bd / 2 + 0.04, COLORI.pietra)
  cant.metti('pietra', scatola(0.8, 0.08, 0.35, 1), px, 0.04, bd / 2 + 0.2, COLORI.pietra)
  const imposte = scegli(r, COLORI.imposte)
  const finestra = (x, y, z, ry) => {
    cant.metti('liscio', scatola(0.42, 0.44, 0.05), x, y, z, COLORI.vetro, { ry })
    for (const s of [-1, 1]) {
      const dx = Math.cos(ry) * s * 0.33, dz = -Math.sin(ry) * s * 0.33
      cant.metti('liscio', scatola(0.2, 0.48, 0.04), x + dx, y, z + dz, imposte, { ry })
    }
  }
  const yf = z0 + Math.min(alt * 0.55, 1.05)
  if (bw > 2.3) finestra(px > 0 ? px - 1.0 : px + 1.0, yf, bd / 2 + 0.03, 0)
  finestra(0, yf, -bd / 2 - 0.03, 0)
  for (const s of [-1, 1]) if (r() < 0.8) finestra(s * (bw / 2 + 0.03), yf, 0, Math.PI / 2)
  if (alt > 2.1) { finestra(-bw / 4, z0 + alt * 0.82, bd / 2 + 0.03, 0); finestra(bw / 4, z0 + alt * 0.82, bd / 2 + 0.03, 0) }
  // il camino, su un lato del colmo: il fumo esce da lì
  const sx = (lungoX ? 1 : 0) * (r() < 0.5 ? -1 : 1) * bw * 0.3, sz = (lungoX ? 0 : 1) * (r() < 0.5 ? -1 : 1) * bd * 0.3
  const hc = cima - z0 - alt + 0.55
  cant.metti('pietra', scatola(0.36, hc + 0.3, 0.36, 1.2), sx, z0 + alt + hc / 2 - 0.15, sz, [0.72, 0.68, 0.64])
  kit.camini.push(cant.dove(sx, z0 + alt + hc + 0.05, sz))
  // davanti, a volte, una botte o una panca
  if (r() < 0.5) cant.metti('legno', cilindro(0.2, 0.2, 0.45, 10, 1), px + 0.75, 0.22, bd / 2 + 0.4, COLORI.legno)
  if (r() < 0.4) cant.metti('legno', scatola(0.9, 0.08, 0.28, 1), -px * 0.3 - 0.6, 0.38, bd / 2 + 0.3, COLORI.legno)
}

// ── le botteghe dei mercanti ──
export function bottega (me, cant, m, kit) {
  const cx = me.x + me.w / 2, cz = me.y + me.h / 2, y = quotaTerreno(m, cx, cz)
  cant.base(cx, y, cz, 0)
  const w = me.w, d = me.h
  const r = caso(me.chiave.length * 97 + 3)
  if (me.bottega === 'bancarella' || me.bottega === 'erbe') {
    const tela = me.bottega === 'erbe' ? [0.32, 0.56, 0.34] : [0.78, 0.22, 0.2]
    for (const [sx, sz, h] of [[-1, 1, 1.75], [1, 1, 1.75], [-1, -1, 2.05], [1, -1, 2.05]]) cant.metti('legno', scatola(0.1, h, 0.1), sx * (w / 2 - 0.2), h / 2, sz * (d / 2 - 0.15), COLORI.legnoScuro)
    cant.metti('legno', scatola(w - 0.3, 0.8, 0.5, 1), 0, 0.4, d / 2 - 0.4, COLORI.legno)
    cant.metti('legno', scatola(w - 0.1, 0.06, 0.62, 1), 0, 0.82, d / 2 - 0.4, [0.62, 0.46, 0.32])
    // il tendone, inclinato verso chi arriva, con la balza davanti
    const L = Math.hypot(d + 0.4, 0.35)
    cant.metti('stoffa', scatola(w + 0.3, 0.04, L, 1.2), 0, 1.92, 0.05, tela, { rx: Math.atan2(0.35, d + 0.4) })
    cant.metti('stoffa', scatola(w + 0.3, 0.28, 0.03, 1.2), 0, 1.62, d / 2 + 0.27, tela)
    if (me.bottega === 'bancarella') {
      // gioielli e gemme sul banco, uno scrigno
      for (let i = 0; i < 7; i++) cant.metti('liscio', new THREE.OctahedronGeometry(0.07), -w / 2 + 0.4 + i * (w - 0.8) / 6, 0.92, d / 2 - 0.4 + (r() - 0.5) * 0.25, scegli(r, [[0.9, 0.2, 0.3], [0.2, 0.5, 0.95], [0.3, 0.85, 0.4], [0.95, 0.8, 0.2], [0.75, 0.4, 0.9]]))
      cant.metti('legno', scatola(0.5, 0.32, 0.32, 1), -w / 2 + 0.55, 1.01, d / 2 - 0.45, [0.6, 0.38, 0.22])
      cant.metti('liscio', scatola(0.52, 0.05, 0.34), -w / 2 + 0.55, 1.18, d / 2 - 0.45, [0.85, 0.7, 0.25])
    } else {
      // vasetti e boccette, mazzi d'erbe appesi sotto il tendone
      for (let i = 0; i < 6; i++) cant.metti('liscio', cilindro(0.07, 0.08, 0.2 + r() * 0.1, 8), -w / 2 + 0.4 + i * (w - 0.8) / 5, 0.97, d / 2 - 0.4, scegli(r, [[0.3, 0.6, 0.85], [0.85, 0.3, 0.3], [0.4, 0.8, 0.45], [0.9, 0.75, 0.3]]))
      for (let i = 0; i < 5; i++) cant.metti('liscio', new THREE.ConeGeometry(0.09, 0.32, 6), -w / 2 + 0.45 + i * (w - 0.9) / 4, 1.55, d / 2 - 0.35, [0.35 + r() * 0.2, 0.6, 0.3], { rx: Math.PI })
      cant.metti('paglia', cilindro(0.28, 0.22, 0.3, 10), w / 2 + 0.2, 0.15, d / 2 - 0.1, [0.85, 0.7, 0.45])
    }
    for (let i = 0; i < 2; i++) cant.metti('legno', scatola(0.45, 0.45, 0.45, 1), -w / 2 + 0.5 + i * 0.6, 0.23, -d / 2 + 0.35, COLORI.legno, { ry: r() * 0.4 })
  } else if (me.bottega === 'fucina') {
    // una tettoia di pietra aperta davanti: la forgia con le braci, il camino alto, l'incudine fuori
    const h = 2.0
    cant.metti('pietra', scatola(w - 0.2, h, 0.4, 1.4), 0, h / 2, -d / 2 + 0.3, [0.7, 0.66, 0.62])
    for (const s of [-1, 1]) cant.metti('pietra', scatola(0.4, h, d - 0.8, 1.4), s * (w / 2 - 0.3), h / 2, -0.1, [0.7, 0.66, 0.62])
    for (const s of [-1, 1]) cant.metti('legno', scatola(0.16, h - 0.1, 0.16), s * (w / 2 - 0.3), (h - 0.1) / 2, d / 2 - 0.35, COLORI.legnoScuro)
    cant.metti('legno', scatola(w - 0.2, 0.16, 0.16), 0, h - 0.05, d / 2 - 0.35, COLORI.legnoScuro)
    const L = Math.hypot(d + 0.3, 0.6)
    cant.metti('tegole', scatola(w + 0.3, 0.08, L, 1.4), 0, h + 0.32, 0.05, [0.45, 0.42, 0.44], { rx: Math.atan2(0.6, d + 0.3) })
    cant.metti('pietra', scatola(1.3, 0.85, 1.0, 1.2), -w / 2 + 1.15, 0.43, -d / 2 + 0.95, [0.6, 0.56, 0.52])
    cant.metti('luce', scatola(1.0, 0.06, 0.7), -w / 2 + 1.15, 0.88, -d / 2 + 0.95, [1.0, 0.45, 0.12])
    cant.metti('pietra', scatola(0.75, 2.6, 0.7, 1.2), -w / 2 + 1.15, 1.9, -d / 2 + 0.5, [0.62, 0.58, 0.55])
    kit.camini.push(cant.dove(-w / 2 + 1.15, 3.25, -d / 2 + 0.5)); kit.camini.push(cant.dove(-w / 2 + 1.15, 3.3, -d / 2 + 0.5))
    kit.braci.push(cant.dove(-w / 2 + 1.15, 0.95, -d / 2 + 0.95))
    // l'incudine e il ceppo, davanti a destra (lì sta il fabbro)
    cant.metti('legno', cilindro(0.26, 0.3, 0.45, 10), w / 2 - 1.3, 0.22, d / 2 + 0.25, [0.5, 0.36, 0.25])
    cant.metti('liscio', scatola(0.5, 0.16, 0.22), w / 2 - 1.3, 0.53, d / 2 + 0.25, COLORI.ferro)
    cant.metti('liscio', new THREE.ConeGeometry(0.08, 0.25, 6), w / 2 - 1.0, 0.55, d / 2 + 0.25, COLORI.ferro, { rz: -Math.PI / 2 })
    kit.incudine = cant.dove(w / 2 - 1.3, 0.62, d / 2 + 0.25)
    // la rastrelliera con le lame
    cant.metti('legno', scatola(0.9, 0.08, 0.1), w / 2 - 0.9, 1.1, -d / 2 + 0.6, COLORI.legnoScuro)
    for (let i = 0; i < 4; i++) cant.metti('liscio', scatola(0.05, 0.9, 0.02), w / 2 - 1.25 + i * 0.22, 0.85, -d / 2 + 0.66, [0.75, 0.76, 0.8])
    for (let i = 0; i < 2; i++) cant.metti('legno', cilindro(0.22, 0.22, 0.5, 10), -w / 2 + 0.6 + i * 0.5, 0.25, d / 2 - 0.1, COLORI.legno)
  } else if (me.bottega === 'torretta') {
    // la torretta dell'incantatrice: tonda, viola, col cristallo che galleggia sopra il tetto a punta
    const R = Math.min(w, d) / 2 - 0.3, h = 2.7
    cant.metti('pietra', cilindro(R + 0.1, R + 0.15, 0.4, 16, 1.4), 0, 0.2, 0, [0.62, 0.6, 0.66])
    cant.metti('intonaco', cilindro(R, R, h, 16, 2), 0, 0.4 + h / 2, 0, [0.78, 0.7, 0.9])
    cant.metti('tegole', new THREE.ConeGeometry(R + 0.35, 1.9, 16), 0, 0.4 + h + 0.95, 0, [0.42, 0.34, 0.7])
    cant.metti('legno', scatola(0.6, 1.05, 0.1), 0, 0.92, R - 0.02, [0.36, 0.24, 0.4])
    for (const a of [0.9, -0.9, 2.6]) cant.metti('liscio', scatola(0.3, 0.42, 0.06), Math.sin(a) * R, 2.1, Math.cos(a) * R, [0.55, 0.8, 1.0], { ry: a })
    cant.metti('liscio', new THREE.OctahedronGeometry(0.14), 0.75, 0.15, R + 0.45, [0.6, 0.4, 0.95])
    kit.cristallo = cant.dove(0, 0.4 + h + 2.4, 0)
  }
}

// ── il pozzo della piazza ──
export function pozzo (p, cant, m) {
  const cx = p.x + 1, cz = p.y + 1
  cant.base(cx, quotaTerreno(m, cx, cz), cz, 0)
  cant.metti('pietra', cilindro(0.72, 0.78, 0.7, 16, 1.2), 0, 0.35, 0, [0.82, 0.8, 0.76])
  cant.metti('liscio', new THREE.CircleGeometry(0.6, 16).rotateX(-Math.PI / 2), 0, 0.66, 0, [0.12, 0.26, 0.36])
  for (const s of [-1, 1]) cant.metti('legno', scatola(0.12, 1.5, 0.12), s * 0.62, 1.1, 0, COLORI.legnoScuro)
  cant.metti('legno', cilindro(0.05, 0.05, 1.4, 6), 0, 1.45, 0, COLORI.legno, { rz: Math.PI / 2 })
  for (const s of [-1, 1]) cant.metti('tegole', scatola(1.6, 0.06, 0.75, 1.4), 0, 1.95, s * 0.28, [0.75, 0.4, 0.3], { rx: s * 0.6 })
  cant.metti('legno', cilindro(0.13, 0.11, 0.2, 8), 0.25, 0.85, 0.32, COLORI.legno)
}

// ── il mulino: casa di pietra e legno sulla riva, la ruota nell'acqua (a parte: gira) ──
export function mulino (mu, cant, m, kit, scena) {
  const cx = mu.x + 1.5, cz = mu.y + 1.5
  const y = quotaTerreno(m, cx, cz)
  cant.base(cx, y, cz, 0)
  cant.metti('pietra', scatola(2.6, 1.2, 2.6, 1.4), 0, 0.6, 0, [0.78, 0.75, 0.7])
  cant.metti('legno', scatola(2.5, 1.2, 2.5, 1.2), 0, 1.8, 0, COLORI.legno)
  tetto(cant, 2.5, 2.5, 2.4, 1.3, 0.3, 'tegole', [0.6, 0.34, 0.26], COLORI.legno, 'legno', mu.lato < 0)
  cant.metti('legno', scatola(0.6, 1.0, 0.08), 0.4, 0.5, 1.33, COLORI.legnoScuro)
  cant.metti('liscio', scatola(0.45, 0.45, 0.05), -0.5, 1.8, 1.27, COLORI.vetro)
  kit.camini.push(cant.dove(0.6, 3.6, -0.6))
  cant.metti('pietra', scatola(0.32, 1.2, 0.32), 0.6, 3.1, -0.6, [0.7, 0.66, 0.62])
  // l'asse esce dal muro verso l'acqua
  cant.metti('legno', cilindro(0.08, 0.08, 1.2, 8), mu.lato * 1.6, LIVELLO_ACQUA + 0.75 - y, 0, COLORI.legnoScuro, { rz: Math.PI / 2 })
  // la ruota: due cerchi, i raggi, le pale. Una geometria sola, con l'asse lungo x
  const r = new Cantiere(kit.mat)
  const R = 1.15
  for (const s of [-0.22, 0.22]) r.metti('legno', new THREE.TorusGeometry(R, 0.05, 6, 24), s, 0, 0, COLORI.legnoScuro, { ry: Math.PI / 2 })
  for (let i = 0; i < 6; i++) r.metti('legno', scatola(0.06, R * 2, 0.08), 0, 0, 0, COLORI.legno, { rx: i * Math.PI / 6 })
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; r.metti('legno', scatola(0.5, 0.06, 0.32), 0, Math.cos(a) * R, Math.sin(a) * R, COLORI.legno, { rx: a }) }
  r.metti('legno', cilindro(0.12, 0.12, 0.55, 8), 0, 0, 0, COLORI.legnoScuro, { rz: Math.PI / 2 })
  const ruota = new THREE.Mesh(mergeGeometries(Object.values(r.liste).flat()), kit.mat.legno)
  ruota.castShadow = true; ruota.receiveShadow = true
  ruota.position.set(mu.ruota.x, LIVELLO_ACQUA + 0.75, mu.ruota.y)
  scena.add(ruota)
  kit.ruota = ruota
  kit.spruzzo = new THREE.Vector3(mu.ruota.x, LIVELLO_ACQUA + 0.05, mu.ruota.y)
  return ruota
}

// ── i ponti: arco di pietra (col parapetto), travi di legno sui pali, passerella di assi con le corde ──
export function ponte (p, cant, m) {
  const x0 = p.x0, x1 = p.x1 + 1, L = x1 - x0, zc = (p.y0 + p.y1 + 1) / 2
  const quota = t => p.quota + p.arco * Math.sin(Math.PI * t)
  cant.base(0, 0, 0, 0)
  const N = 10
  if (p.tipo === 'arco') {
    // il corpo: un profilo estruso, la cima segue il piano, sotto la volta a tutto sesto
    const sh = new THREE.Shape()
    const fondo = LIVELLO_ACQUA - 0.9
    sh.moveTo(0, fondo)
    for (let i = 0; i <= N; i++) sh.lineTo(L * i / N, quota(i / N) - 0.02)
    sh.lineTo(L, fondo)
    const buco = new THREE.Path(), rv = L / 2 - 0.9, cyv = LIVELLO_ACQUA - 0.2
    buco.moveTo(L / 2 + rv, fondo); buco.absarc(L / 2, cyv, rv, 0, Math.PI, false); buco.lineTo(L / 2 - rv, fondo)
    sh.holes.push(buco)
    const g = new THREE.ExtrudeGeometry(sh, { depth: 2.2, bevelEnabled: false, curveSegments: 10 })
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.4, uv.getY(i) / 1.4)
    cant.metti('pietra', g, x0, 0, zc - 1.1, [0.82, 0.8, 0.75])
    for (let i = 0; i < N; i++) {
      const ta = i / N, tb = (i + 1) / N, ya = quota(ta), yb = quota(tb), lx = L / N, ang = Math.atan2(yb - ya, lx)
      for (const s of [-1, 1]) cant.metti('pietra', scatola(Math.hypot(lx, yb - ya) + 0.02, 0.38, 0.2, 1.4), x0 + (ta + tb) / 2 * L, (ya + yb) / 2 + 0.19, zc + s * 1.0, [0.78, 0.76, 0.72], { rz: ang })
    }
  } else if (p.tipo === 'travi') {
    for (let i = 0; i < N; i++) {
      const ta = i / N, tb = (i + 1) / N, ya = quota(ta), yb = quota(tb), lx = L / N, ang = Math.atan2(yb - ya, lx)
      cant.metti('legno', scatola(Math.hypot(lx, yb - ya) + 0.02, 0.1, 2.0, 1), x0 + (ta + tb) / 2 * L, (ya + yb) / 2 - 0.05, zc, [0.7, 0.55, 0.4], { rz: ang })
    }
    for (const s of [-1, 1]) {
      cant.metti('legno', cilindro(0.1, 0.1, L + 0.4, 8, 1), x0 + L / 2, p.quota - 0.12, zc + s * 0.95, [0.5, 0.38, 0.28], { rz: Math.PI / 2 })
      for (let i = 0; i <= 4; i++) {
        const t = i / 4, yy = quota(t)
        cant.metti('legno', scatola(0.1, 0.75, 0.1), x0 + 0.2 + t * (L - 0.4), yy + 0.37, zc + s * 0.95, COLORI.legnoScuro)
      }
      cant.metti('legno', scatola(L - 0.3, 0.08, 0.08), x0 + L / 2, p.quota + p.arco * 0.7 + 0.7, zc + s * 0.95, COLORI.legno)
      for (const t of [0.33, 0.67]) cant.metti('legno', cilindro(0.12, 0.14, p.quota - LIVELLO_ACQUA + 0.8, 8), x0 + t * L, (p.quota + LIVELLO_ACQUA - 0.8) / 2, zc + s * 0.75, COLORI.legnoScuro)
    }
  } else {
    // la passerella: assi staccate, due corde che pendono fra i pali
    const assi = Math.round(L / 0.3)
    for (let i = 0; i < assi; i++) {
      const t = (i + 0.5) / assi
      cant.metti('legno', scatola(0.24, 0.06, 1.7), x0 + t * L, quota(t) - 0.03, zc + (Math.sin(i * 7.1) * 0.05), [0.66 + Math.sin(i) * 0.06, 0.52, 0.38], { ry: Math.sin(i * 3.3) * 0.05 })
    }
    for (const s of [-1, 1]) {
      for (const t of [0, 1]) cant.metti('legno', scatola(0.12, 1.1, 0.12), x0 + t * L, p.quota + 0.45, zc + s * 0.9, COLORI.legnoScuro)
      for (let i = 0; i < 8; i++) {
        const ta = i / 8, tb = (i + 1) / 8, ya = p.quota + 0.85 - Math.sin(Math.PI * ta) * 0.25, yb = p.quota + 0.85 - Math.sin(Math.PI * tb) * 0.25
        cant.metti('liscio', cilindro(0.025, 0.025, Math.hypot(L / 8, yb - ya), 5), x0 + (ta + tb) / 2 * L, (ya + yb) / 2, zc + s * 0.9, [0.78, 0.68, 0.5], { rz: Math.PI / 2 + Math.atan2(yb - ya, L / 8) })
      }
    }
  }
}

// ── la staccionata lungo i segmenti: pali e due traverse (istanze: tre draw call per tutte) ──
export function staccionate (m, kit, scena) {
  const pali = [], traverse = []
  for (const [xa, za, xb, zb] of m.staccionate) {
    const L = Math.hypot(xb - xa, zb - za), n = Math.max(1, Math.round(L / 1.1))
    for (let i = 0; i <= n; i++) { const t = i / n; pali.push([xa + (xb - xa) * t, za + (zb - za) * t]) }
    for (let i = 0; i < n; i++) {
      const ta = i / n, tb = (i + 1) / n
      traverse.push([xa + (xb - xa) * ta, za + (zb - za) * ta, xa + (xb - xa) * tb, za + (zb - za) * tb])
    }
  }
  const gp = scatola(0.09, 0.7, 0.09); gp.translate(0, 0.35, 0)
  const gt = scatola(1, 0.06, 0.04)
  const col = g => { g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(g.attributes.position.count * 3).fill(0).map((_, i) => [0.62, 0.48, 0.34][i % 3]), 3)); return g }
  const ip = new THREE.InstancedMesh(col(gp), kit.mat.legno, pali.length)
  const it = new THREE.InstancedMesh(col(gt), kit.mat.legno, traverse.length * 2)
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3()
  pali.forEach(([x, z], i) => { M.compose(P.set(x, quotaTerreno(m, x, z) - 0.05, z), Q.setFromEuler(E.set(0, i * 0.7, (Math.sin(i * 3.1)) * 0.04)), S.set(1, 0.9 + Math.sin(i * 1.7) * 0.1, 1)); ip.setMatrixAt(i, M) })
  traverse.forEach(([xa, za, xb, zb], i) => {
    const ya = quotaTerreno(m, xa, za), yb = quotaTerreno(m, xb, zb), L = Math.hypot(xb - xa, zb - za, yb - ya)
    for (const [k, h] of [[0, 0.32], [1, 0.58]]) {
      E.set(0, -Math.atan2(zb - za, xb - xa), Math.atan2(yb - ya, Math.hypot(xb - xa, zb - za)), 'YZX')
      M.compose(P.set((xa + xb) / 2, (ya + yb) / 2 + h, (za + zb) / 2), Q.setFromEuler(E), S.set(L + 0.08, 1, 1))
      it.setMatrixAt(i * 2 + k, M)
    }
  })
  for (const me of [ip, it]) { me.castShadow = true; me.receiveShadow = true; scena.add(me) }
  return [ip, it]
}

// ── lanterne, cartelli ──
export function lanterna (l, cant, m) {
  const x = l.x + 0.5, z = l.y + 0.5
  cant.base(x, quotaTerreno(m, x, z), z, 0)
  cant.metti('legno', scatola(0.1, 1.7, 0.1), 0, 0.85, 0, COLORI.legnoScuro)
  cant.metti('legno', scatola(0.45, 0.07, 0.07), 0.18, 1.62, 0, COLORI.legnoScuro)
  cant.metti('liscio', scatola(0.2, 0.05, 0.2), 0.36, 1.52, 0, COLORI.ferro)
  cant.metti('luce', scatola(0.15, 0.2, 0.15), 0.36, 1.4, 0, [1.0, 0.85, 0.5])
  cant.metti('liscio', new THREE.ConeGeometry(0.15, 0.14, 4), 0.36, 1.6, 0, COLORI.ferro, { ry: Math.PI / 4 })
}
export function cartello (c, cant, m) {
  const x = c.x + 0.5, z = c.y + 0.5
  cant.base(x, quotaTerreno(m, x, z), z, 0)
  cant.metti('legno', scatola(0.1, 1.5, 0.1), 0, 0.75, 0, COLORI.legnoScuro)
  for (const [k, a] of [[0, c.verso], [1, c.verso + 2.2], [2, c.verso - 1.9]]) {
    const g = new THREE.Shape(); g.moveTo(0, -0.1); g.lineTo(0.55, -0.1); g.lineTo(0.68, 0); g.lineTo(0.55, 0.1); g.lineTo(0, 0.1)
    const geo = new THREE.ExtrudeGeometry(g, { depth: 0.04, bevelEnabled: false })
    cant.metti('legno', geo, 0, 1.3 - k * 0.24, 0, [0.82, 0.66, 0.46], { ry: -a })
  }
}

// ── il campo del minatore: la tenda, il carretto col minerale, il falò (le fiamme le fa vita.js) ──
export function campoMinatore (mi, cant, m, kit) {
  const tx = mi.tenda.x + 1.5, tz = mi.tenda.y + 1
  cant.base(tx, quotaTerreno(m, tx, tz), tz, 0)
  const L = Math.hypot(1.2, 1.4), a = Math.atan2(1.4, 1.2)
  for (const s of [-1, 1]) cant.metti('stoffa', scatola(L, 0.04, 2.6, 3), s * 0.6, 0.7, 0, [0.82, 0.74, 0.58], { rz: -s * a })
  cant.metti('liscio', triangolo([-1.1, 0, 1.31], [1.1, 0, 1.31], [0, 1.4, 1.31]).scale(0.55, 0.9, 1), 0, 0.02, 0, [0.1, 0.08, 0.06])
  for (const s of [-1, 1]) cant.metti('legno', scatola(0.08, 1.6, 0.08), 0, 0.8, s * 1.3, COLORI.legnoScuro)
  // il carretto
  const cx = mi.carretto.x + 1, cz = mi.carretto.y + 0.5
  cant.base(cx, quotaTerreno(m, cx, cz), cz, 0.3)
  cant.metti('legno', scatola(1.4, 0.5, 0.8, 1), 0, 0.6, 0, [0.6, 0.45, 0.32])
  for (const s of [-1, 1]) cant.metti('legno', cilindro(0.32, 0.32, 0.1, 12), 0, 0.32, s * 0.48, COLORI.legnoScuro, { rx: Math.PI / 2 })
  for (let i = 0; i < 6; i++) cant.metti('liscio', new THREE.DodecahedronGeometry(0.18), (i % 3 - 1) * 0.35, 0.92, (i < 3 ? -0.15 : 0.15), [0.38, 0.36, 0.4])
  cant.metti('liscio', new THREE.OctahedronGeometry(0.12), 0.2, 1.05, 0, [0.4, 0.75, 0.95])
  for (const s of [-1, 1]) cant.metti('legno', scatola(0.9, 0.06, 0.06), 1.1, 0.75, s * 0.3, COLORI.legnoScuro, { rz: 0.3 })
  // il falò: un giro di sassi e la legna
  const fx = mi.falo.x + 0.5, fz = mi.falo.y + 0.5
  cant.base(fx, quotaTerreno(m, fx, fz), fz, 0)
  for (let i = 0; i < 8; i++) { const a2 = i * Math.PI / 4; cant.metti('liscio', new THREE.DodecahedronGeometry(0.12), Math.cos(a2) * 0.38, 0.06, Math.sin(a2) * 0.38, [0.55, 0.53, 0.5]) }
  for (let i = 0; i < 3; i++) cant.metti('legno', cilindro(0.06, 0.06, 0.7, 6), 0, 0.1, 0, [0.45, 0.32, 0.22], { rz: Math.PI / 2, ry: i * Math.PI / 3 })
  kit.fuochi.push(cant.dove(0, 0.1, 0))
  kit.camini.push(cant.dove(0, 0.8, 0))
  // un piccone appoggiato al carretto, due sacchi
  cant.base(cx, quotaTerreno(m, cx, cz), cz, 0)
  cant.metti('legno', cilindro(0.03, 0.03, 1.0, 5), -0.9, 0.5, 0.6, COLORI.legno, { rz: 0.4 })
  cant.metti('liscio', scatola(0.5, 0.06, 0.06), -1.1, 0.95, 0.6, COLORI.ferro, { rz: 0.4 })
  for (const s of [0, 1]) cant.metti('stoffa', new THREE.SphereGeometry(0.25, 8, 6), -0.3 + s * 0.5, 0.2, -0.75, [0.75, 0.66, 0.5], { s: [1, 0.8, 1] })
}
