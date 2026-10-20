// Il mondo lontano, a dettaglio basso: tutto il terreno a un vertice ogni due celle, gli alberi a cono, le case, le botteghe e i
// posti a scatola col tetto, i ponti a tavola, il bosco fuori mappa. È quello che si vede dove i pezzi vicini (pezzi.js) non sono
// costruiti, e tutta la veduta d'insieme (veduta.js): pochi draw call, niente ombra. Viene dallo scheletro del mondo a percorso e
// dalla base delle celle (suolo.js): non vuole nessuna zona caricata. Quando una zona si carica la prima volta (`zonaScritta`) si
// rifanno i suoi pezzi di terreno e gli alberi, che allora vedono il lago e le rocce. Dove un pezzo è costruito, il lontano sparisce
// da solo (`uPezzi`, vesti.js).
import { InstancedMesh, BoxGeometry, ConeGeometry, BufferGeometry, Float32BufferAttribute, MeshStandardMaterial,
         Matrix4, Quaternion, Euler, Vector3, Color } from 'three'
import { terrenoDelPezzo } from './terreno.js'
import { grigliaDi, rettangoloDi } from './pezzi.js'
import { quotaTerreno, cellaDaDisegnare, caso, fbm, pontiDi, ERBA } from './suolo.js'
import { zonaDi } from '../../motore/mondo-percorso.js'
import { vesti } from './vesti.js'

const ALBERI = { tondo: [0.38, 0.62, 0.27], frutto: [0.44, 0.66, 0.28], pino: [0.2, 0.44, 0.24], abete: [0.17, 0.37, 0.31], salice: [0.52, 0.72, 0.34], secco: [0.42, 0.36, 0.32] }
// gli alberi da lontano, per habitat: quanti ogni quattro celle e quale
const BOSCHI = { bosco: [0.34, 'pino'], foresta: [0.42, 'abete'], secco: [0.3, 'secco'], prato: [0.05, 'tondo'], campi: [0.04, 'frutto'],
  frutteto: [0.22, 'frutto'], lago: [0.04, 'salice'], palude: [0.05, 'salice'], monte: [0.12, 'abete'], roccia: [0.05, 'pino'],
  brughiera: [0.04, 'pino'], cimitero: [0.06, 'secco'], rovine: [0.06, 'secco'], landa: [0.05, 'secco'], ceneri: [0.03, 'secco'] }
const TETTI = [[0.80, 0.42, 0.30], [0.66, 0.36, 0.28], [0.85, 0.52, 0.34], [0.50, 0.54, 0.62]]
const COLORE = { mercante: [0.7, 0.4, 0.32], ingresso: [0.62, 0.6, 0.58], pietra: [0.66, 0.68, 0.72], mulino: [0.72, 0.6, 0.45], minatore: [0.8, 0.72, 0.56],
  bacheca: [0.6, 0.45, 0.3], terre: [0.7, 0.68, 0.66], pozzo: [0.78, 0.76, 0.72] }
const ALTO = { torre: 4.4, botola: 0.3, menhir: 2.2, palafitta: 1.6, fumarola: 0.8, tomba: 1.6 }
const BLOCCO = 4
const hash = (a, b, c) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296 }

const bianca = g => { g.setAttribute('color', new Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3)); return g }
// l'albero da lontano: un cono a cinque lati, senza fondo (dieci triangoli)
function albero() {
  const c = new ConeGeometry(0.62, 2.0, 5, 1, true); c.translate(0, 1.0, 0); c.deleteAttribute('uv')
  return bianca(c.toNonIndexed())
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

// gli alberi lontani di un rettangolo di celle (a passi di due), dall'habitat e dal terreno (scritto o di base)
function alberiDi(m, x0, z0, x1, z1, fuori) {
  const c = {}
  for (let y = z0 - (z0 & 1); y < z1; y += 2) for (let x = x0 - (x0 & 1); x < x1; x += 2) {
    const k = y * m.W + x
    cellaDaDisegnare(m, k, c)
    const b = BOSCHI[c.habitat]
    if (!b || c.terreno !== ERBA || c.strada || c.campo || c.ponte >= 0) continue
    if (m.zona[k] >= 0 && (m.blocco[k] === 1 || m.zonaCitta[k] || m.riservato[k])) continue
    const macchia = 0.4 + 1.2 * fbm(x, y, 9931, 11)
    if (hash(x, y, 9932) > b[0] * macchia) continue
    const px = x + 0.5 + hash(x, y, 9933) * 1.2, pz = y + 0.5 + hash(x, y, 9934) * 1.2, s = 0.9 + hash(x, y, 9935) * 0.5, t = b[1]
    fuori.push([px, quotaTerreno(m, px, pz) - 0.05, pz, s, s * (t === 'abete' ? 1.3 : t === 'secco' ? 0.8 : 1), s, 0, ALBERI[t].map(v => v * (0.85 + hash(x, y, 9936) * 0.3))])
  }
}

export function creaLontano(m, scena, mats, { quotaFuori = null, M = 0 } = {}) {
  // il terreno lontano due volte: a pezzi (`terreni`, uno per pezzo, spento dove il pezzo vicino è costruito: niente frammenti
  // disegnati due volte) per la vista vicina, e a blocchi di 4×4 pezzi (`blocchi`, dodici) per la veduta, che vede quasi tutto il
  // mondo: un pezzo per chiamata erano più di cento chiamate. Provato: i soli blocchi con lo scarto per pixel sotto i pezzi vicini
  // (`uPezzi`): lo scarto spegne il test di profondità anticipato, e il disegno costava il doppio (SwiftShader, CPU ×5)
  const { n, nx, nz } = grigliaDi(m)
  const rettangoli = []
  for (let j = 0; j < nz; j += BLOCCO) for (let i = 0; i < nx; i += BLOCCO) {
    const a = rettangoloDi(m, j * nx + i), b = rettangoloDi(m, Math.min(nz - 1, j + BLOCCO - 1) * nx + Math.min(nx - 1, i + BLOCCO - 1))
    rettangoli.push({ x0: a.x0, z0: a.z0, x1: b.x1, z1: b.z1 })
  }
  const fai = (r, vis) => { const t = terrenoDelPezzo(m, r, mats.lontano, 0.5); t.receiveShadow = false; t.visible = vis; scena.add(t); return t }
  const terreni = Array.from({ length: n }, (_, p) => fai(p, true))
  const blocchi = rettangoli.map(r => fai(r, false))
  const matL = vesti(new MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true }), { oggetto: 'istanza', lontano: true })
  matL.name = 'lontano'
  const M4 = new Matrix4(), Q = new Quaternion(), E = new Euler(), P = new Vector3(), S = new Vector3(), C = new Color()
  const riempi = (im, geo, lista) => {
    if (!im || im.instanceMatrix.count < lista.length) {
      if (im) { scena.remove(im); im.dispose() }
      im = new InstancedMesh(geo, matL, Math.max(1, Math.ceil(lista.length * 1.2)))
      im.frustumCulled = false
      scena.add(im)
    }
    lista.forEach(([x, y, z, sx, sy, sz, ry, col], i) => {
      im.setMatrixAt(i, M4.compose(P.set(x, y, z), Q.setFromEuler(E.set(0, ry, 0)), S.set(sx, sy, sz)))
      im.setColorAt(i, C.setRGB(col[0], col[1], col[2]))
    })
    im.count = lista.length
    im.instanceMatrix.needsUpdate = true
    if (im.instanceColor) im.instanceColor.needsUpdate = true
    return im
  }
  // il bosco fuori mappa, che c'è sempre
  const boscoFuori = []
  if (quotaFuori) {
    const r = caso(m.seme * 31 + 9)
    for (let i = 0; i < 1500; i++) {
      const x = -M + r() * (m.W + 2 * M), z = -M + r() * (m.H + 2 * M), e = Math.max(-x, x - m.W, -z, z - m.H)
      if (e < 2 || e > 45) continue
      const y = quotaFuori(x, z), nn = fbm(x, z, 990, 12)
      if (y > 9 || nn < 0.42) continue
      const s = 1.1 + r() * 0.7
      boscoFuori.push([x, y - 0.1, z, s, s * (nn > 0.6 ? 1.4 : 1), s, 0, (nn > 0.6 ? ALBERI.abete : ALBERI.tondo).map(v => v * (0.85 + r() * 0.3))])
    }
  }
  // gli alberi del mondo, per zona (si rifanno quando la zona si scrive)
  const perZona = m.zone.map(() => [])
  const alberiDellaZona = k => {
    const l = [], R = m.zone[k].rettangolo, tutti = []
    alberiDi(m, R.x0, R.y0, R.x1 + 1, R.y1 + 1, tutti)
    for (const a of tutti) if (zonaDi(m, Math.floor(a[0]), Math.floor(a[2])) === k) l.push(a)
    return l
  }
  for (let k = 0; k < m.zone.length; k++) perZona[k] = alberiDellaZona(k)
  const geoAlbero = albero(), geoScatola = bianca(new BoxGeometry(1, 1, 1)), geoTetto = prisma()
  let imAlberi = riempi(null, geoAlbero, [...boscoFuori, ...perZona.flat()])

  // le case, le botteghe e i posti: una scatola (e il tetto), del colore che hanno da vicino
  function scatoleETetti() {
    const scatole = [], tetti = []
    const case_ = [...m.villaggio.case]
    for (const c of m.carico) if (c) for (const q of c.case) if (!case_.includes(q) && !m.villaggio.case.some(v => v.x === q.x && v.y === q.y)) case_.push(q)
    for (const c of case_) {
      const r = caso(c.seme + 1), cx = c.x + c.w / 2, cz = c.y + c.h / 2, y = quotaTerreno(m, cx, cz), w = c.w - 0.5, d = c.h - 0.5
      scatole.push([cx, y + 1.1, cz, w, 2.2, d, 0, [0.94, 0.88, 0.76]])
      const lungoX = w >= d
      tetti.push([cx, y + 2.2, cz, lungoX ? w + 0.4 : d + 0.4, 1.0, lungoX ? d + 0.4 : w + 0.4, lungoX ? 0 : Math.PI / 2, TETTI[Math.floor(r() * TETTI.length)]])
    }
    for (const p of m.posti) {
      if (!COLORE[p.tipo]) continue
      const cx = p.x + p.w / 2, cz = p.y + p.h / 2, y = quotaTerreno(m, cx, cz)
      const alto = p.tipo === 'ingresso' ? ALTO[p.monumento] || 2.4 : p.tipo === 'pietra' ? 1.2 : p.tipo === 'terre' ? 3.2 : p.tipo === 'pozzo' ? 1.4 : 2
      scatole.push([cx, y + alto / 2, cz, p.w - 0.4, alto, p.h - 0.4, 0, COLORE[p.tipo]])
    }
    for (const p of pontiDi(m).values()) {
      const L = p.lungoX ? p.x1 - p.x0 : p.y1 - p.y0, cx = (p.x0 + p.x1) / 2, cz = (p.y0 + p.y1) / 2
      scatole.push([cx, p.quota + p.arco * 0.6, cz, p.lungoX ? L : 2.1, 0.25, p.lungoX ? 2.1 : L, 0, p.modello === 'arco' ? [0.82, 0.8, 0.75] : [0.66, 0.5, 0.36]])
    }
    return { scatole, tetti }
  }
  let st = scatoleETetti()
  let imScatole = riempi(null, geoScatola, st.scatole), imTetti = riempi(null, geoTetto, st.tetti)

  const scritte = m.zone.map((_, k) => !!m.zonaCaricata[k])
  return {
    terreni, blocchi,
    get mesh() { return [...terreni, ...blocchi, imAlberi, imScatole, imTetti] },
    // una zona si è caricata: se era la prima volta, le sue celle sono scritte e il lontano lì si rifà (terreno, alberi, case)
    zonaScritta(k) {
      if (scritte[k]) return false
      scritte[k] = true
      const R = m.zone[k].rettangolo
      const tocca = r => !(r.x1 < R.x0 || r.x0 > R.x1 + 1 || r.z1 < R.y0 || r.z0 > R.y1 + 1)
      const rifai = (lista, i, r) => { const vis = lista[i].visible; scena.remove(lista[i]); lista[i].geometry.dispose(); lista[i] = fai(r, vis) }
      terreni.forEach((_, p) => { if (tocca(rettangoloDi(m, p))) rifai(terreni, p, p) })
      rettangoli.forEach((r, b) => { if (tocca(r)) rifai(blocchi, b, r) })
      perZona[k] = alberiDellaZona(k)
      imAlberi = riempi(imAlberi, geoAlbero, [...boscoFuori, ...perZona.flat()])
      st = scatoleETetti()
      imScatole = riempi(imScatole, geoScatola, st.scatole); imTetti = riempi(imTetti, geoTetto, st.tetti)
      return true
    },
    via() {
      for (const me of [...terreni, ...blocchi]) { scena.remove(me); me.geometry.dispose() }
      for (const me of [imAlberi, imScatole, imTetti]) { scena.remove(me); me.dispose() }
      for (const g of [geoAlbero, geoScatola, geoTetto]) g.dispose()
      matL.dispose()
    },
  }
}
