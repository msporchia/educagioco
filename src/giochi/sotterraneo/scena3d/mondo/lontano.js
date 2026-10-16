// Il mondo lontano, a dettaglio basso: tutto il terreno a un vertice per cella, gli alberi a cono, le case e le botteghe a
// scatola col tetto, i ponti a tavola, il bosco fuori mappa. È quello che si vede dove i pezzi vicini (pezzi.js) non sono
// costruiti, e tutta la veduta d'insieme (veduta.js): pochi draw call, niente ombra. Dove un pezzo è costruito, il lontano
// sparisce da solo (`uCostruiti`, vesti.js).
import { InstancedMesh, BoxGeometry, ConeGeometry, CylinderGeometry, BufferGeometry, Float32BufferAttribute, MeshStandardMaterial,
         Matrix4, Quaternion, Euler, Vector3, Color } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { terrenoDelPezzo } from './terreno.js'
import { grigliaDi } from './pezzi.js'
import { quotaTerreno, caso, fbm, pontiDi } from './suolo.js'
import { vesti } from './vesti.js'

const ALBERI = { tondo: [0.38, 0.62, 0.27], frutto: [0.44, 0.66, 0.28], pino: [0.2, 0.44, 0.24], abete: [0.17, 0.37, 0.31], salice: [0.52, 0.72, 0.34], secco: [0.42, 0.36, 0.32] }
const TETTI = [[0.80, 0.42, 0.30], [0.66, 0.36, 0.28], [0.85, 0.52, 0.34], [0.50, 0.54, 0.62]]

const bianca = g => { g.setAttribute('color', new Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3)); return g }
function albero() {
  const t = new CylinderGeometry(0.08, 0.12, 0.6, 5); t.translate(0, 0.3, 0)
  const c = new ConeGeometry(0.62, 1.7, 6); c.translate(0, 1.35, 0)
  for (const g of [t, c]) { g.deleteAttribute('uv'); const n = g.attributes.position.count, col = new Float32Array(n * 3).fill(g === t ? 0.55 : 1); g.setAttribute('color', new Float32BufferAttribute(col, 3)) }
  return mergeGeometries([t.toNonIndexed(), c.toNonIndexed()])
}
// un prisma col colmo lungo x, alto 1, largo e profondo 1: il tetto di una casa vista dall'alto
function prisma() {
  const p = [-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 1, 0, -0.5, 1, 0, -0.5, 0, 0.5, 0.5, 0, 0.5]
  const tri = [0, 2, 1, 0, 3, 2, 4, 5, 2, 4, 2, 3, 0, 4, 3, 1, 2, 5]
  const pos = []
  for (const i of tri) pos.push(p[i * 3], p[i * 3 + 1], p[i * 3 + 2])
  const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.computeVertexNormals()
  return bianca(g)
}

export function creaLontano(m, scena, mats, { quotaFuori = null, M = 0 } = {}) {
  // il terreno lontano è a pezzi anch'esso: dove c'è il pezzo vicino si spegne, e fuori vista si taglia
  const terreni = Array.from({ length: grigliaDi(m).n }, (_, p) => {
    const t = terrenoDelPezzo(m, p, mats.lontano, 1)
    t.receiveShadow = false
    scena.add(t)
    return t
  })
  const matL = vesti(new MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true }), { oggetto: 'istanza', lontano: true })
  matL.name = 'lontano'
  const M4 = new Matrix4(), Q = new Quaternion(), E = new Euler(), P = new Vector3(), S = new Vector3(), C = new Color()
  const riempi = (geo, lista) => {
    const im = new InstancedMesh(geo, matL, Math.max(1, lista.length))
    lista.forEach(([x, y, z, sx, sy, sz, ry, col], i) => {
      im.setMatrixAt(i, M4.compose(P.set(x, y, z), Q.setFromEuler(E.set(0, ry, 0)), S.set(sx, sy, sz)))
      im.setColorAt(i, C.setRGB(col[0], col[1], col[2]))
    })
    im.count = lista.length; im.frustumCulled = false
    scena.add(im)
    return im
  }
  // gli alberi: quelli del decoro, e il bosco fuori mappa (che c'è sempre)
  const alberi = []
  for (const d of m.decoro) if (ALBERI[d.tipo]) alberi.push([d.x, quotaTerreno(m, d.x, d.y), d.y, d.s, d.s * (d.tipo === 'abete' ? 1.3 : 1), d.s, 0, ALBERI[d.tipo].map(v => v * (0.85 + d.c * 0.3))])
  if (quotaFuori) {
    const r = caso(m.seme * 31 + 9)
    for (let i = 0; i < 1500; i++) {
      const x = -M + r() * (m.W + 2 * M), z = -M + r() * (m.H + 2 * M), e = Math.max(-x, x - m.W, -z, z - m.H)
      if (e < 2 || e > 45) continue
      const y = quotaFuori(x, z), n = fbm(x, z, 990, 12)
      if (y > 9 || n < 0.42) continue
      const s = 1.1 + r() * 0.7
      alberi.push([x, y - 0.1, z, s, s * (n > 0.6 ? 1.4 : 1), s, 0, (n > 0.6 ? ALBERI.abete : ALBERI.tondo).map(v => v * (0.85 + r() * 0.3))])
    }
  }
  // le case, le botteghe e i posti: una scatola (e il tetto), del colore che hanno da vicino
  const scatole = [], tetti = []
  for (const c of m.case) {
    const r = caso(c.seme + 1), cx = c.x + c.w / 2, cz = c.y + c.h / 2, y = quotaTerreno(m, cx, cz), w = c.w - 0.5, d = c.h - 0.5
    scatole.push([cx, y + 1.1, cz, w, 2.2, d, 0, [0.94, 0.88, 0.76]])
    const lungoX = w >= d
    tetti.push([cx, y + 2.2, cz, lungoX ? w + 0.4 : d + 0.4, 1.0, lungoX ? d + 0.4 : w + 0.4, lungoX ? 0 : Math.PI / 2, TETTI[Math.floor(r() * TETTI.length)]])
  }
  const COLORE = { mercante: [0.7, 0.4, 0.32], ingresso: [0.62, 0.6, 0.58], pietra: [0.66, 0.68, 0.72], mulino: [0.72, 0.6, 0.45], minatore: [0.8, 0.72, 0.56], bacheca: [0.6, 0.45, 0.3], antro: [0.5, 0.48, 0.46] }
  for (const p of m.posti) {
    if (!COLORE[p.tipo]) continue
    const cx = p.x + p.w / 2, cz = p.y + p.h / 2, y = quotaTerreno(m, cx, cz)
    const alto = p.tipo === 'ingresso' ? (p.monumento === 'torre' ? 4.4 : p.monumento === 'botola' ? 0.3 : 2.4) : p.tipo === 'pietra' ? 1.2 : p.tipo === 'antro' ? 0.9 : 2
    scatole.push([cx, y + alto / 2, cz, p.w - 0.4, alto, p.h - 0.4, 0, COLORE[p.tipo]])
  }
  for (const p of pontiDi(m).values()) {
    const L = p.lungoX ? p.x1 - p.x0 : p.y1 - p.y0, cx = (p.x0 + p.x1) / 2, cz = (p.y0 + p.y1) / 2
    scatole.push([cx, p.quota + p.arco * 0.6, cz, p.lungoX ? L : 2.1, 0.25, p.lungoX ? 2.1 : L, 0, p.modello === 'arco' ? [0.82, 0.8, 0.75] : [0.66, 0.5, 0.36]])
  }
  const imAlberi = riempi(albero(), alberi)
  const imScatole = riempi(bianca(new BoxGeometry(1, 1, 1)), scatole)
  const imTetti = riempi(prisma(), tetti)
  return {
    terreni, mesh: [...terreni, imAlberi, imScatole, imTetti],
    via() { for (const me of [...terreni, imAlberi, imScatole, imTetti]) { scena.remove(me); me.geometry.dispose(); if (me.dispose) me.dispose() } matL.dispose() },
  }
}
