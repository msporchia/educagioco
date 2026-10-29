// Il kit dei pezzi del mondo di sopra, tutti in codice e parametrici (il seme dà la variazione): case, le botteghe dei mercanti
// (bancarella, erbe, fucina, torretta), il pozzo, il mulino con la ruota. Le parti ferme si posano in un «cantiere» e diventano
// UNA mesh per materiale per pezzo di mondo (pochi draw call): il colore sta nei vertici, la trama nel materiale, la cella della
// base in `aBase` (la nebbia mostra o nasconde la casa tutta intera). Le parti che si muovono restano a parte. Dal prototipo
// poc/mondo-sopra/kit.js; ponti, grate, cartelli e il resto in ponti.js.
import { MeshBasicMaterial, DoubleSide, BoxGeometry, CylinderGeometry, BufferGeometry, Float32BufferAttribute,
         BufferAttribute, Mesh, Matrix4, Quaternion, Euler, Vector3, OctahedronGeometry, ConeGeometry, CircleGeometry, TorusGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { caso, quotaTerreno, LIVELLO_ACQUA } from './suolo.js'
import { vesti, ombraDi, materialeMondo } from './vesti.js'

// i materiali: pochi e condivisi. `fermi` per il kit unito (la base nell'attributo), `mobili` per i pezzi che si muovono (la base
// è la loro posizione)
export function materialiDelKit(trame) {
  const fai = oggetto => {
    const std = (o, nome, codice = '') => { const m = materialeMondo({ vertexColors: true, roughness: 0.88, metalness: 0, ...o }); m.name = nome; return vesti(m, { oggetto, codice }) }
    const stoffa = std({ map: trame.stoffa.map, side: DoubleSide, roughness: 0.95 }, 'stoffa', 'stoffa')   // le righe qui sotto: un codice suo
    const prima = stoffa.onBeforeCompile
    stoffa.onBeforeCompile = (sh, r) => {
      prima(sh, r)
      // le righe: dove la maschera è 1 la stoffa è chiara, dove è 0 del colore del pezzo
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <map_fragment>', 'vec4 righe = texture(map, vMapUv);')
        .replace('#include <color_fragment>', 'diffuseColor.rgb = mix(vColor.rgb, vec3(0.95, 0.93, 0.86), step(0.5, righe.r)) * (0.85 + righe.g * 0.2);')
    }
    const luce = new MeshBasicMaterial({ vertexColors: true }); luce.name = 'luce'
    return {
      pietra: std({ map: trame.pietra.map, normalMap: trame.pietra.normalMap }, 'pietra'),
      legno: std({ map: trame.legno.map, normalMap: trame.legno.normalMap, roughness: 0.8 }, 'legno'),
      intonaco: std({ map: trame.intonaco.map, normalMap: trame.intonaco.normalMap, roughness: 0.95 }, 'intonaco'),
      tegole: std({ map: trame.tegole.map, normalMap: trame.tegole.normalMap, side: DoubleSide }, 'tegole'),
      paglia: std({ map: trame.paglia.map, normalMap: trame.paglia.normalMap, side: DoubleSide, roughness: 1 }, 'paglia'),
      liscio: std({ roughness: 0.6 }, 'liscio'),
      stoffa,
      luce: vesti(luce, { nuvole: false, oggetto }),
    }
  }
  const fermi = fai('attributo'), mobili = fai('istanza')
  return { fermi, mobili, ombraFermi: ombraDi({ oggetto: 'attributo' }), ombraMobili: ombraDi({ oggetto: 'istanza' }),
           via() { for (const g of [fermi, mobili]) for (const m of Object.values(g)) m.dispose() } }
}

// ── le forme, con le coordinate di trama in unità di mondo (`ripeti`: quante unità copre una trama) ──
export function scatola(w, h, d, ripeti = 1) {
  const g = new BoxGeometry(w, h, d), uv = g.attributes.uv
  const facce = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * facce[f][0] / ripeti, uv.getY(k) * facce[f][1] / ripeti) }
  return g
}
export function cilindro(rt, rb, h, seg = 12, ripeti = 1, aperto = false) {
  const g = new CylinderGeometry(rt, rb, h, seg, 1, aperto), uv = g.attributes.uv, giro = Math.PI * (rt + rb)
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * giro / ripeti, uv.getY(i) * h / ripeti)
  return g
}
export function triangolo(a, b, c) {
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...b], 3))
  g.setAttribute('uv', new Float32BufferAttribute([a[0], a[1], b[0], b[1], c[0], c[1], a[0], a[1], c[0], c[1], b[0], b[1]], 2))
  g.computeVertexNormals()
  return g
}

// ── il cantiere: si posano pezzi in coordinate locali (`base` sposta e gira tutto il gruppo), poi si chiude ──
const _m = new Matrix4(), _q = new Quaternion(), _e = new Euler(), _v = new Vector3(), _s = new Vector3()
export class Cantiere {
  constructor() { this.liste = {}; this.conti = {}; this.segni = {}; this.b = new Matrix4(); this.tri = 0; this.qx = 0; this.qz = 0 }
  // la base del gruppo, e la cella che la nebbia guarda (la base stessa, se non si dice altro con `qui`)
  base(x = 0, y = 0, z = 0, ry = 0) { this.b.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(1, 1, 1)); this.qx = x; this.qz = z; return this }
  qui(x, z) { this.qx = x; this.qz = z; return this }
  dove(x, y, z) { return new Vector3(x, y, z).applyMatrix4(this.b) }
  // `segno`: il pezzo si ritrova dopo l'unione (`userData.segni` della mesh: { segno, da, quanti } in vertici), per ricolorarlo
  metti(nome, geo, x, y, z, colore = [1, 1, 1], { rx = 0, ry = 0, rz = 0, s = null, ordine = 'XYZ', segno = null } = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone()
    _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, ordine)), s ? _s.set(...s) : _s.set(1, 1, 1))
    g.applyMatrix4(_m.premultiply(this.b))
    const n = g.attributes.position.count
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k)
    if (!g.attributes.uv) g.setAttribute('uv', new Float32BufferAttribute(new Float32Array(n * 2), 2))
    if (!g.attributes.normal) g.computeVertexNormals()
    const c = new Float32Array(n * 3), b = new Float32Array(n * 2)
    for (let i = 0; i < n; i++) { c.set(colore, i * 3); b[i * 2] = this.qx; b[i * 2 + 1] = this.qz }
    g.setAttribute('color', new BufferAttribute(c, 3))
    g.setAttribute('aBase', new BufferAttribute(b, 2))
    ;(this.liste[nome] ||= []).push(g)
    const da = this.conti[nome] || 0
    this.conti[nome] = da + n
    if (segno != null) (this.segni[nome] ||= []).push({ segno, da, quanti: n })
    this.tri += n / 3
    if (geo !== g) geo.dispose()
    return g
  }
  // una mesh per materiale; `mats` i materiali, `ombra` quello dell'ombra (la nebbia anche lì)
  chiudi(mats, ombra) {
    const fuori = []
    for (const [nome, lista] of Object.entries(this.liste)) {
      if (!lista.length) continue
      const g = mergeGeometries(lista)
      for (const x of lista) x.dispose()
      const me = new Mesh(g, mats[nome])
      me.castShadow = nome !== 'luce'; me.receiveShadow = true
      if (ombra) me.customDepthMaterial = ombra
      if (this.segni[nome]) me.userData.segni = this.segni[nome]
      fuori.push(me)
    }
    this.liste = {}; this.conti = {}; this.segni = {}
    return fuori
  }
}

export const COLORI = {
  intonaco: [[0.96, 0.92, 0.82], [0.95, 0.86, 0.70], [0.92, 0.80, 0.72], [0.86, 0.88, 0.84], [0.98, 0.95, 0.90]],
  tegole: [[0.80, 0.42, 0.30], [0.66, 0.36, 0.28], [0.85, 0.52, 0.34], [0.50, 0.54, 0.62]],
  imposte: [[0.30, 0.50, 0.40], [0.30, 0.42, 0.62], [0.62, 0.26, 0.22], [0.42, 0.32, 0.24]],
  legnoScuro: [0.42, 0.30, 0.22], legno: [0.72, 0.56, 0.40], pietra: [0.80, 0.78, 0.74], vetro: [0.20, 0.28, 0.36], ferro: [0.25, 0.25, 0.27],
}
export const scegli = (r, l) => l[Math.floor(r() * l.length)]

// il tetto a falde: due lastre inclinate con lo sbalzo e i due timpani; `y` è la cima del muro
export function tetto(c, w, d, y, alto, sb, mat, col, colMuro, matMuro, lungoX = true) {
  const lw = lungoX ? w : d, ld = lungoX ? d : w
  const m2 = ld / 2 + sb, a2 = Math.atan2(alto, m2), L2 = Math.hypot(m2, alto), yy = y - alto * sb / m2
  for (const lato of [-1, 1]) {
    const cz = lato * m2 / 2, cy = yy + alto / 2, off = lungoX ? [0, cy, cz] : [cz, cy, 0]
    c.metti(mat, scatola(lw + sb * 2, 0.07, L2, 1.4), off[0], off[1], off[2], col, lungoX ? { rx: lato * a2 } : { ry: Math.PI / 2, rx: lato * a2, ordine: 'YXZ' })
  }
  for (const lato of [-1, 1]) {
    const x = lato * lw / 2 * 0.999, tri = triangolo([x, y, -ld / 2], [x, y, ld / 2], [x, yy + alto, 0])
    c.metti(matMuro, lungoX ? tri : tri.rotateY(Math.PI / 2), 0, 0, 0, colMuro)
  }
  return yy + alto
}

// ── la casa: zoccolo di pietra, muri d'intonaco (a volte a graticcio) o di legno, tetto di tegole o di paglia, porta verso la
// strada (nel villaggio verso la piazza, girata di `giro`), finestre con le imposte, il camino col fumo ──
export function casa(c, cant, m, cose) {
  const r = caso(c.seme + 1)
  const ang = { s: 0, e: Math.PI / 2, n: Math.PI, o: -Math.PI / 2 }[c.verso] + (c.giro || 0)
  const lw = c.verso === 's' || c.verso === 'n' ? c.w : c.h, ld = c.verso === 's' || c.verso === 'n' ? c.h : c.w
  const cx = c.x + c.w / 2, cz = c.y + c.h / 2
  cant.base(cx, quotaTerreno(m, cx, cz), cz, ang)
  const bw = lw - 0.55, bd = ld - 0.55, z0 = 0.32, alt = (lw * ld >= 16 ? 2.3 : 1.55) + r() * 0.35
  const legnosa = r() < 0.22, colMuro = legnosa ? COLORI.legno : scegli(r, COLORI.intonaco)
  cant.metti('pietra', scatola(bw + 0.08, z0, bd + 0.08, 1.4), 0, z0 / 2, 0, COLORI.pietra)
  cant.metti(legnosa ? 'legno' : 'intonaco', scatola(bw, alt, bd, legnosa ? 1.2 : 2), 0, z0 + alt / 2, 0, colMuro)
  if (!legnosa && r() < 0.55) {
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cant.metti('legno', scatola(0.12, alt, 0.12, 1), sx * bw / 2, z0 + alt / 2, sz * bd / 2, COLORI.legnoScuro)
    for (const sz of [-1, 1]) cant.metti('legno', scatola(bw + 0.04, 0.1, 0.06, 1), 0, z0 + alt * 0.5, sz * (bd / 2 + 0.02), COLORI.legnoScuro)
    for (const sx of [-1, 1]) cant.metti('legno', scatola(0.06, 0.1, bd + 0.04, 1), sx * (bw / 2 + 0.02), z0 + alt * 0.5, 0, COLORI.legnoScuro)
  }
  const paglia = !legnosa && r() < 0.25, lungoX = bw >= bd
  const cima = tetto(cant, bw, bd, z0 + alt, 0.75 + r() * 0.45 + Math.min(bw, bd) * 0.1, 0.28, paglia ? 'paglia' : 'tegole',
    paglia ? [0.9, 0.8, 0.55] : scegli(r, COLORI.tegole), colMuro, legnosa ? 'legno' : 'intonaco', lungoX)
  const px = (r() - 0.5) * (bw - 1.2)
  cant.metti('legno', scatola(0.62, 1.0, 0.08, 1), px, z0 + 0.5, bd / 2 + 0.03, COLORI.legnoScuro)
  cant.metti('pietra', scatola(0.8, 0.1, 0.12, 1), px, z0 + 1.05, bd / 2 + 0.04, COLORI.pietra)
  cant.metti('pietra', scatola(0.8, 0.08, 0.35, 1), px, 0.04, bd / 2 + 0.2, COLORI.pietra)
  const imposte = scegli(r, COLORI.imposte)
  const finestra = (x, y, z, ry) => {
    cant.metti('liscio', scatola(0.42, 0.44, 0.05), x, y, z, COLORI.vetro, { ry })
    for (const s of [-1, 1]) cant.metti('liscio', scatola(0.2, 0.48, 0.04), x + Math.cos(ry) * s * 0.33, y, z - Math.sin(ry) * s * 0.33, imposte, { ry })
  }
  const yf = z0 + Math.min(alt * 0.55, 1.05)
  if (bw > 2.3) finestra(px > 0 ? px - 1.0 : px + 1.0, yf, bd / 2 + 0.03, 0)
  finestra(0, yf, -bd / 2 - 0.03, 0)
  for (const s of [-1, 1]) if (r() < 0.8) finestra(s * (bw / 2 + 0.03), yf, 0, Math.PI / 2)
  if (alt > 2.1) { finestra(-bw / 4, z0 + alt * 0.82, bd / 2 + 0.03, 0); finestra(bw / 4, z0 + alt * 0.82, bd / 2 + 0.03, 0) }
  const sx = (lungoX ? 1 : 0) * (r() < 0.5 ? -1 : 1) * bw * 0.3, sz = (lungoX ? 0 : 1) * (r() < 0.5 ? -1 : 1) * bd * 0.3
  const hc = cima - z0 - alt + 0.55
  cant.metti('pietra', scatola(0.36, hc + 0.3, 0.36, 1.2), sx, z0 + alt + hc / 2 - 0.15, sz, [0.72, 0.68, 0.64])
  cose.camini.push(cant.dove(sx, z0 + alt + hc + 0.05, sz))
  if (r() < 0.5) cant.metti('legno', cilindro(0.2, 0.2, 0.45, 10, 1), px + 0.75, 0.22, bd / 2 + 0.4, COLORI.legno)
  if (r() < 0.4) cant.metti('legno', scatola(0.9, 0.08, 0.28, 1), -px * 0.3 - 0.6, 0.38, bd / 2 + 0.3, COLORI.legno)
}

// ── le botteghe dei mercanti: la bancarella del mercante, le erbe della guaritrice, la fucina, la torretta dell'incantatrice;
// il davanti a sud, girato di `giro` verso la piazza ──
export function bottega(me, cant, m, cose) {
  const cx = me.x + me.w / 2, cz = me.y + me.h / 2
  cant.base(cx, quotaTerreno(m, cx, cz), cz, me.giro || 0)
  const w = me.w, d = me.h, r = caso(me.chiave.length * 97 + 3 + me.x)
  if (me.bottega === 'bancarella' || me.bottega === 'erbe') {
    const tela = me.bottega === 'erbe' ? [0.32, 0.56, 0.34] : [0.78, 0.22, 0.2]
    for (const [sx, sz, h] of [[-1, 1, 1.75], [1, 1, 1.75], [-1, -1, 2.05], [1, -1, 2.05]]) cant.metti('legno', scatola(0.1, h, 0.1), sx * (w / 2 - 0.2), h / 2, sz * (d / 2 - 0.15), COLORI.legnoScuro)
    cant.metti('legno', scatola(w - 0.3, 0.8, 0.5, 1), 0, 0.4, d / 2 - 0.4, COLORI.legno)
    cant.metti('legno', scatola(w - 0.1, 0.06, 0.62, 1), 0, 0.82, d / 2 - 0.4, [0.62, 0.46, 0.32])
    const L = Math.hypot(d + 0.4, 0.35)
    cant.metti('stoffa', scatola(w + 0.3, 0.04, L, 1.2), 0, 1.92, 0.05, tela, { rx: Math.atan2(0.35, d + 0.4) })
    cant.metti('stoffa', scatola(w + 0.3, 0.28, 0.03, 1.2), 0, 1.62, d / 2 + 0.27, tela)
    if (me.bottega === 'bancarella') {
      for (let i = 0; i < 7; i++) cant.metti('liscio', new OctahedronGeometry(0.07), -w / 2 + 0.4 + i * (w - 0.8) / 6, 0.92, d / 2 - 0.4 + (r() - 0.5) * 0.25, scegli(r, [[0.9, 0.2, 0.3], [0.2, 0.5, 0.95], [0.3, 0.85, 0.4], [0.95, 0.8, 0.2], [0.75, 0.4, 0.9]]))
      cant.metti('legno', scatola(0.5, 0.32, 0.32, 1), -w / 2 + 0.55, 1.01, d / 2 - 0.45, [0.6, 0.38, 0.22])
      cant.metti('liscio', scatola(0.52, 0.05, 0.34), -w / 2 + 0.55, 1.18, d / 2 - 0.45, [0.85, 0.7, 0.25])
    } else {
      for (let i = 0; i < 6; i++) cant.metti('liscio', cilindro(0.07, 0.08, 0.2 + r() * 0.1, 8), -w / 2 + 0.4 + i * (w - 0.8) / 5, 0.97, d / 2 - 0.4, scegli(r, [[0.3, 0.6, 0.85], [0.85, 0.3, 0.3], [0.4, 0.8, 0.45], [0.9, 0.75, 0.3]]))
      for (let i = 0; i < 5; i++) cant.metti('liscio', new ConeGeometry(0.09, 0.32, 6), -w / 2 + 0.45 + i * (w - 0.9) / 4, 1.55, d / 2 - 0.35, [0.35 + r() * 0.2, 0.6, 0.3], { rx: Math.PI })
      cant.metti('paglia', cilindro(0.28, 0.22, 0.3, 10), w / 2 + 0.2, 0.15, d / 2 - 0.1, [0.85, 0.7, 0.45])
    }
    for (let i = 0; i < 2; i++) cant.metti('legno', scatola(0.45, 0.45, 0.45, 1), -w / 2 + 0.5 + i * 0.6, 0.23, -d / 2 + 0.35, COLORI.legno, { ry: r() * 0.4 })
  } else if (me.bottega === 'fucina') {
    const h = 2.0
    cant.metti('pietra', scatola(w - 0.2, h, 0.4, 1.4), 0, h / 2, -d / 2 + 0.3, [0.7, 0.66, 0.62])
    for (const s of [-1, 1]) cant.metti('pietra', scatola(0.4, h, d - 0.8, 1.4), s * (w / 2 - 0.3), h / 2, -0.1, [0.7, 0.66, 0.62])
    for (const s of [-1, 1]) cant.metti('legno', scatola(0.16, h - 0.1, 0.16), s * (w / 2 - 0.3), (h - 0.1) / 2, d / 2 - 0.35, COLORI.legnoScuro)
    cant.metti('legno', scatola(w - 0.2, 0.16, 0.16), 0, h - 0.05, d / 2 - 0.35, COLORI.legnoScuro)
    cant.metti('tegole', scatola(w + 0.3, 0.08, Math.hypot(d + 0.3, 0.6), 1.4), 0, h + 0.32, 0.05, [0.45, 0.42, 0.44], { rx: Math.atan2(0.6, d + 0.3) })
    cant.metti('pietra', scatola(1.3, 0.85, 1.0, 1.2), -w / 2 + 1.15, 0.43, -d / 2 + 0.95, [0.6, 0.56, 0.52])
    cant.metti('luce', scatola(1.0, 0.06, 0.7), -w / 2 + 1.15, 0.88, -d / 2 + 0.95, [1.0, 0.45, 0.12])
    cant.metti('pietra', scatola(0.75, 2.6, 0.7, 1.2), -w / 2 + 1.15, 1.9, -d / 2 + 0.5, [0.62, 0.58, 0.55])
    cose.camini.push(cant.dove(-w / 2 + 1.15, 3.25, -d / 2 + 0.5))
    cose.braci.push(cant.dove(-w / 2 + 1.15, 0.95, -d / 2 + 0.95))
    cant.metti('legno', cilindro(0.26, 0.3, 0.45, 10), w / 2 - 1.3, 0.22, d / 2 + 0.25, [0.5, 0.36, 0.25])
    cant.metti('liscio', scatola(0.5, 0.16, 0.22), w / 2 - 1.3, 0.53, d / 2 + 0.25, COLORI.ferro)
    cant.metti('liscio', new ConeGeometry(0.08, 0.25, 6), w / 2 - 1.0, 0.55, d / 2 + 0.25, COLORI.ferro, { rz: -Math.PI / 2 })
    cant.metti('legno', scatola(0.9, 0.08, 0.1), w / 2 - 0.9, 1.1, -d / 2 + 0.6, COLORI.legnoScuro)
    for (let i = 0; i < 4; i++) cant.metti('liscio', scatola(0.05, 0.9, 0.02), w / 2 - 1.25 + i * 0.22, 0.85, -d / 2 + 0.66, [0.75, 0.76, 0.8])
    for (let i = 0; i < 2; i++) cant.metti('legno', cilindro(0.22, 0.22, 0.5, 10), -w / 2 + 0.6 + i * 0.5, 0.25, d / 2 - 0.1, COLORI.legno)
  } else if (me.bottega === 'torretta') {
    const R = Math.min(w, d) / 2 - 0.3, h = 2.7
    cant.metti('pietra', cilindro(R + 0.1, R + 0.15, 0.4, 16, 1.4), 0, 0.2, 0, [0.62, 0.6, 0.66])
    cant.metti('intonaco', cilindro(R, R, h, 16, 2), 0, 0.4 + h / 2, 0, [0.78, 0.7, 0.9])
    cant.metti('tegole', new ConeGeometry(R + 0.35, 1.9, 16), 0, 0.4 + h + 0.95, 0, [0.42, 0.34, 0.7])
    cant.metti('legno', scatola(0.6, 1.05, 0.1), 0, 0.92, R - 0.02, [0.36, 0.24, 0.4])
    for (const a of [0.9, -0.9, 2.6]) cant.metti('liscio', scatola(0.3, 0.42, 0.06), Math.sin(a) * R, 2.1, Math.cos(a) * R, [0.55, 0.8, 1.0], { ry: a })
    cant.metti('liscio', new OctahedronGeometry(0.14), 0.75, 0.15, R + 0.45, [0.6, 0.4, 0.95])
    cose.cristalli.push(cant.dove(0, 0.4 + h + 2.4, 0))
  }
}

// ── il pozzo della piazza ──
export function pozzo(p, cant, m) {
  const cx = p.x + 1, cz = p.y + 1
  cant.base(cx, quotaTerreno(m, cx, cz), cz, 0)
  cant.metti('pietra', cilindro(0.72, 0.78, 0.7, 16, 1.2), 0, 0.35, 0, [0.82, 0.8, 0.76])
  cant.metti('liscio', new CircleGeometry(0.6, 16).rotateX(-Math.PI / 2), 0, 0.66, 0, [0.12, 0.26, 0.36])
  for (const s of [-1, 1]) cant.metti('legno', scatola(0.12, 1.5, 0.12), s * 0.62, 1.1, 0, COLORI.legnoScuro)
  cant.metti('legno', cilindro(0.05, 0.05, 1.4, 6), 0, 1.45, 0, COLORI.legno, { rz: Math.PI / 2 })
  for (const s of [-1, 1]) cant.metti('tegole', scatola(1.6, 0.06, 0.75, 1.4), 0, 1.95, s * 0.28, [0.75, 0.4, 0.3], { rx: s * 0.6 })
  cant.metti('legno', cilindro(0.13, 0.11, 0.2, 8), 0.25, 0.85, 0.32, COLORI.legno)
}

// ── il mulino: casa di pietra e legno sulla riva, la ruota nell'acqua (a parte: gira). `verso` è il lato dell'acqua con la ruota
// (o, e, n, s: motore/mondo-percorso.js); la porta guarda a sud, o a ovest se l'acqua è a sud ──
export function mulino(mu, cant, m, cose, kit) {
  const cx = mu.x + 1.5, cz = mu.y + 1.5, y = quotaTerreno(m, cx, cz)
  const verso = mu.verso || (mu.lato < 0 ? 'o' : 'e'), lungoZ = verso === 'n' || verso === 's'
  const fuori = { o: [-1, 0], e: [1, 0], n: [0, -1], s: [0, 1] }[verso]
  cant.base(cx, y, cz, verso === 's' ? -Math.PI / 2 : 0)
  cant.metti('pietra', scatola(2.6, 1.2, 2.6, 1.4), 0, 0.6, 0, [0.78, 0.75, 0.7])
  cant.metti('legno', scatola(2.5, 1.2, 2.5, 1.2), 0, 1.8, 0, COLORI.legno)
  // il colmo del tetto va di traverso all'acqua, così la ruota sta sotto una falda
  tetto(cant, 2.5, 2.5, 2.4, 1.3, 0.3, 'tegole', [0.6, 0.34, 0.26], COLORI.legno, 'legno', verso === 'n')
  cant.metti('legno', scatola(0.6, 1.0, 0.08), 0.4, 0.5, 1.33, COLORI.legnoScuro)
  cant.metti('liscio', scatola(0.45, 0.45, 0.05), -0.5, 1.8, 1.27, COLORI.vetro)
  cose.camini.push(cant.dove(0.6, 3.6, -0.6))
  cant.metti('pietra', scatola(0.32, 1.2, 0.32), 0.6, 3.1, -0.6, [0.7, 0.66, 0.62])
  // l'asse della ruota esce dal muro verso l'acqua (in coordinate del mondo: il cantiere qui torna dritto)
  cant.base(cx, y, cz, 0)
  cant.metti('legno', cilindro(0.08, 0.08, 1.2, 8), fuori[0] * 1.6, LIVELLO_ACQUA + 0.75 - y, fuori[1] * 1.6, COLORI.legnoScuro, lungoZ ? { rx: Math.PI / 2 } : { rz: Math.PI / 2 })
  const r = new Cantiere(), R = 1.15
  for (const s of [-0.22, 0.22]) r.metti('legno', new TorusGeometry(R, 0.05, 6, 24), s, 0, 0, COLORI.legnoScuro, { ry: Math.PI / 2 })
  for (let i = 0; i < 6; i++) r.metti('legno', scatola(0.06, R * 2, 0.08), 0, 0, 0, COLORI.legno, { rx: i * Math.PI / 6 })
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; r.metti('legno', scatola(0.5, 0.06, 0.32), 0, Math.cos(a) * R, Math.sin(a) * R, COLORI.legno, { rx: a }) }
  r.metti('legno', cilindro(0.12, 0.12, 0.55, 8), 0, 0, 0, COLORI.legnoScuro, { rz: Math.PI / 2 })
  const [ruota] = r.chiudi(kit.mobili, kit.ombraMobili)
  const rp = mu.ruota || { x: cx + fuori[0] * 2.1, y: cz + fuori[1] * 2.1 }
  ruota.position.set(rp.x, LIVELLO_ACQUA + 0.75, rp.y)
  // girata per l'acqua a nord o a sud: prima si orienta (y), poi gira sul suo asse (x), che indice.js fa avanzare
  ruota.rotation.order = 'YXZ'; ruota.rotation.y = lungoZ ? Math.PI / 2 : 0
  cose.ruote.push(ruota)
  cose.spruzzi.push(new Vector3(rp.x, LIVELLO_ACQUA + 0.05, rp.y))
  return ruota
}
