// Il terreno di un piano: il pavimento (una geometria sola, anche sotto i muri, così una parete che rientra non apre il vuoto),
// le pareti scolpite nello stile del paesaggio (scena3d/pareti.js: una geometria sola, quattro chiamate — facce e cime dei
// muri alti, facce e cime dei parapetti), le colonne nella forma del paesaggio e le staffe delle torce. Le colonne e gli
// spigoli alti che coprono l'eroe si sfaldano nel buco (scena3d/maschera.js). Nello scontro i muri alti alle spalle dei
// combattenti si abbassano a parapetto (`abbassa`): l'altezza di ogni cella sta in una trama che lo shader legge (anche
// quello dell'ombra), così la geometria resta una.
import { BufferGeometry, Float32BufferAttribute, BoxGeometry, CylinderGeometry, LatheGeometry, TorusGeometry, Mesh, InstancedMesh,
         MeshStandardMaterial, MeshDepthMaterial, RGBADepthPacking, DataTexture, RGBAFormat, NearestFilter, Matrix4, Vector2, Vector3,
         Color } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { conMaschera } from './maschera.js'
import { GLSL_RUMORE } from './luci.js'
import { scolpisciPareti } from './pareti.js'
import { fbm3d, rumore3d } from './rumore.js'
import { ALTO_MURO, PARAPETTO, ACCESI, SUDDIVIDI } from './costanti.js'
import { dividi } from './luce-vertice.js'
import { creaRitaglio } from './ritaglio.js'
import { colorMedio } from './trame.js'
import { verso } from './tempo.js'

// le altezze dei muri nello shader: la cella di ogni vertice, e quanto è alta adesso (0..1 nella trama)
const GLSL_ALTO_V = 'attribute float aCella; uniform sampler2D uAltoMuri; uniform vec2 uDimAlto;\n'
const ABBASSA = `#include <begin_vertex>
  transformed.y *= texture2D(uAltoMuri, (vec2(mod(aCella, uDimAlto.x), floor(aCella / uDimAlto.x)) + 0.5) / uDimAlto).r;`

// una geometria ammaccata dal rumore (le colonne di roccia, ghiaccio, radici): niente è a filo
function ammacca(g, a, fr, seme, soloLati = true) {
  const f = fbm3d(seme), p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    const r = Math.hypot(x, z)
    if (soloLati && r < 1e-3) continue
    const k = 1 + f(x * fr, y * fr, z * fr) * 2 * a / Math.max(0.1, r)
    p.setXYZ(i, x * k, y, z * k)
  }
  g.computeVertexNormals()
  return g
}
const lat = (pts, n = 10) => new LatheGeometry(pts.map(([r, y]) => new Vector2(r, y)), n)

// le colonne: [fusto, basi], due materiali (il fusto ha la trama della parete)
const H = ALTO_MURO
const COLONNE = {
  tonda: () => [new CylinderGeometry(0.27, 0.3, H, 14, 1, true).translate(0, H / 2, 0),
    mergeGeometries([new BoxGeometry(0.72, 0.16, 0.72).translate(0, 0.08, 0), new BoxGeometry(0.72, 0.16, 0.72).translate(0, H - 0.08, 0)])],
  quadra: () => [new BoxGeometry(0.5, H, 0.5, 1, 2, 1).translate(0, H / 2, 0),
    mergeGeometries([new BoxGeometry(0.74, 0.22, 0.74).translate(0, 0.11, 0), new BoxGeometry(0.66, 0.1, 0.66).translate(0, 0.27, 0),
      new BoxGeometry(0.74, 0.18, 0.74).translate(0, H - 0.09, 0)])],
  ferro: () => [new CylinderGeometry(0.2, 0.2, H, 10, 1, true).translate(0, H / 2, 0),
    mergeGeometries([0.12, 0.45, 0.8, 1.15].map(y => new TorusGeometry(0.21, 0.04, 5, 14).rotateX(Math.PI / 2).translate(0, y, 0)).concat([new CylinderGeometry(0.34, 0.38, 0.12, 8).translate(0, 0.06, 0)]))],
  spina: () => [ammacca(new CylinderGeometry(0.06, 0.4, H * 1.35, 7, 5).translate(0, H * 0.67, 0), 0.08, 3, 5),
    mergeGeometries([0, 2.1, 4.2].map(a => new CylinderGeometry(0.01, 0.12, 0.5, 5).rotateZ(0.5).rotateY(a).translate(Math.cos(a) * 0.3, 0.2, -Math.sin(a) * 0.3)))],
  stalattite: () => [ammacca(lat([[0.001, 0], [0.42, 0], [0.3, 0.2], [0.17, 0.5], [0.12, 0.7], [0.2, 0.95], [0.36, 1.2], [0.5, H + 0.05], [0.001, H + 0.05]], 12), 0.07, 2.2, 7),
    ammacca(lat([[0.001, 0], [0.55, 0], [0.4, 0.06], [0.001, 0.12]], 9), 0.06, 3, 8)],
  cristallo: () => [mergeGeometries([new CylinderGeometry(0.2, 0.28, H * 1.15, 6).translate(0, H * 0.57, 0),
    new CylinderGeometry(0.08, 0.16, 0.8, 6).rotateZ(0.45).translate(0.25, 0.35, 0.08), new CylinderGeometry(0.06, 0.12, 0.6, 6).rotateZ(-0.5).translate(-0.22, 0.28, -0.05)]).toNonIndexed(),
    mergeGeometries([new CylinderGeometry(0.0, 0.2, 0.18, 6).translate(0, H * 1.15 + 0.09, 0)]).toNonIndexed()],
  tronco: () => [ammacca(lat([[0.001, 0], [0.55, 0], [0.34, 0.14], [0.25, 0.4], [0.24, 0.9], [0.28, H], [0.001, H]], 10), 0.06, 2.5, 9),
    mergeGeometries([0, 1.3, 2.6, 3.9, 5.2].map(a => new CylinderGeometry(0.03, 0.08, 0.7, 5).rotateZ(1.1).translate(0.3, 0.12, 0).rotateY(a)))],
  scanalata: () => {
    const g = new CylinderGeometry(0.26, 0.29, H - 0.3, 32, 1, true).translate(0, H / 2, 0), p = g.attributes.position
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 - 0.07 * Math.max(0, Math.cos(a * 16)); p.setXYZ(i, x * k, p.getY(i), z * k) }
    g.computeVertexNormals()
    return [g, mergeGeometries([new BoxGeometry(0.76, 0.12, 0.76).translate(0, 0.06, 0), new TorusGeometry(0.3, 0.06, 6, 18).rotateX(Math.PI / 2).translate(0, 0.17, 0),
      new TorusGeometry(0.3, 0.06, 6, 18).rotateX(Math.PI / 2).translate(0, H - 0.17, 0), new BoxGeometry(0.76, 0.12, 0.76).translate(0, H - 0.06, 0)])]
  },
  puntello: () => [mergeGeometries([new BoxGeometry(0.24, H, 0.24).translate(0, H / 2, 0), new BoxGeometry(1.0, 0.2, 0.26).translate(0, H - 0.1, 0),
    new BoxGeometry(0.1, 0.62, 0.12).rotateZ(0.8).translate(0.24, H - 0.38, 0), new BoxGeometry(0.1, 0.62, 0.12).rotateZ(-0.8).translate(-0.24, H - 0.38, 0)]),
    mergeGeometries([new BoxGeometry(0.34, 0.08, 0.34).translate(0, 0.04, 0)])],
}
// uv e normali uguali per tutti, o mergeGeometries non le unisce
const pulisci = g => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k); if (!n.attributes.uv) n.setAttribute('uv', new Float32BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2)); return n }

export function creaTerreno(scena, opz) {
  const g = creaTerrenoAPassi(scena, opz)
  for (;;) { const r = g.next(); if (r.done) return r.value }
}
// lo stesso a pezzi (il pavimento, le pareti, le colonne): l'entrata a passi, piano.js
export function* creaTerrenoAPassi(scena, { pianta, aspetto, trame, maschera, seme = 1 }) {
  const p = pianta
  const via = []
  const aggiungi = o => { scena.add(o); via.push(() => { scena.remove(o) }) }

  // ── il pavimento: un quadrato per cella (anche sotto le colonne e i muri), la trama ogni `celle`×`celle` celle; con la luce per
  // vertice n×n quadrati per cella ──
  // semplice (`terrenoSemplice`, la fascia bassa): niente trama; nei vertici il suo colore medio, una tinta per cella (le lastre) e le
  // macchie larghe che lo shader faceva a ogni pixel (0,88: senza le fughe scure della trama veniva più chiaro di un decimo)
  const semplice = ACCESI.terrenoSemplice
  const pos = [], uv = [], nor = [], idx = [], col = []
  const cu = trame.pav.celle, n = ACCESI.lucePerVertice ? SUDDIVIDI.pavimento : 1
  const medio = semplice ? colorMedio(trame.pav.map) : null, macchie = rumore3d(seme), cc = new Color()
  for (const { x, y } of [...p.pavimento, ...p.muri]) {
    const b = pos.length / 3
    const lastra = 0.9 + 0.2 * ((((x * 73856093) ^ (y * 19349663) ^ seme) >>> 0) % 1000) / 1000
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const px = x + i / n, pz = y + j / n
      pos.push(px, 0, pz); uv.push(px / cu, -pz / cu); nor.push(0, 1, 0)
      if (semplice) { cc.copy(medio).multiplyScalar(0.88 * lastra * (0.78 + 0.44 * macchie(px * 0.21, 4, pz * 0.21))); col.push(cc.r, cc.g, cc.b) }
    }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = b + j * (n + 1) + i, c = a + n + 1; idx.push(a, c, a + 1, a + 1, c, c + 1) }
  }
  const gPav = new BufferGeometry()
  gPav.setAttribute('position', new Float32BufferAttribute(pos, 3))
  gPav.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  gPav.setAttribute('normal', new Float32BufferAttribute(nor, 3))
  if (semplice) gPav.setAttribute('color', new Float32BufferAttribute(col, 3))
  gPav.setIndex(idx)
  const t = trame.pav
  // le macchie larghe nel mondo (la trama si ripete, il mondo no) e le pozzanghere lucide dove il paesaggio le vuole (`pozze`)
  const pozze = semplice ? null : aspetto.pozze || null
  const matPav = conMaschera(new MeshStandardMaterial(semplice ? { vertexColors: true, roughness: aspetto.lucido || 1, metalness: aspetto.metallo || 0 } : {
    // senza `rilievo` (la fascia bassa) il pavimento è piatto: la trama del colore e basta
    map: t.map, normalMap: ACCESI.rilievo ? t.normalMap : null, roughnessMap: ACCESI.rilievo ? t.roughnessMap : null, roughness: aspetto.lucido || 1, metalness: aspetto.metallo || 0,
    normalScale: new Vector2(1.2, 1.2),
    ...(t.emissiveMap ? { emissiveMap: t.emissiveMap, emissive: new Color(1, 1, 1), emissiveIntensity: 1 } : {}),
  }), maschera, semplice ? { spinta: 0, arredo: false } : { arredo: false,
    spinta: 0, chiave: 'pav' + (t.emissiveMap ? '-braci' : '') + (pozze ? '-pozze' + pozze.quanto : ''),   // `quanto` sta nel codice
    // le braci si accendono a chiazze larghe nel mondo, non a ogni ripetizione della trama (si vedeva il disegno ripetuto)
    prima: t.emissiveMap ? 'outgoingLight -= totalEmissiveRadiance * 0.75 * (1.0 - smoothstep(0.42, 0.62, rumore3(vec3(vMondoM.xz * 0.3, 0.0))));' : '',
    poi(sh) {
      sh.uniforms.uPozza = { value: new Color().setRGB(...(pozze ? pozze.colore : [0, 0, 0])) }
      sh.fragmentShader = GLSL_RUMORE + 'uniform vec3 uPozza;\n' + sh.fragmentShader
        .replace('#include <color_fragment>', `#include <color_fragment>
          diffuseColor.rgb *= 0.78 + 0.44 * rumore3(vec3(vMondoM.xz * 0.21, 4.0));
          float pozza = ${pozze ? `smoothstep(0.6, 0.66, rumore3(vec3(vMondoM.xz * 0.42, 7.0)) * 0.75 + rumore3(vec3(vMondoM.xz * 1.7, 3.0)) * 0.25) * ${pozze.quanto.toFixed(2)}` : '0.0'};
          diffuseColor.rgb = mix(diffuseColor.rgb, uPozza, pozza);`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, 0.03, pozza);')
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n  normal = normalize(mix(normal, nonPerturbedNormal, pozza));')
    },
  })
  const pav = new Mesh(gPav, matPav)
  pav.receiveShadow = true; pav.userData.elemento3d = 'pavimento'
  aggiungi(pav)
  const ritPav = creaRitaglio(gPav, p.W, p.H, 0)
  yield 'pavimento'

  // ── le pareti scolpite ──
  const par = aspetto.parete || { stile: 'blocchi' }
  const sc = scolpisciPareti(p, { stile: par.stile, seme, colore: par })
  let gMuri = new BufferGeometry()
  gMuri.setAttribute('position', new Float32BufferAttribute(sc.posizioni, 3))
  gMuri.setAttribute('normal', new Float32BufferAttribute(sc.normali, 3))
  gMuri.setAttribute('uv', new Float32BufferAttribute(sc.uv, 2))
  gMuri.setAttribute('color', new Float32BufferAttribute(sc.colori, 3))
  gMuri.setAttribute('aCoperta', new Float32BufferAttribute(sc.coperta, 1))
  gMuri.setAttribute('aCella', new Float32BufferAttribute(sc.celle, 1))
  gMuri.setIndex(sc.indici)
  sc.gruppi.forEach((g, i) => gMuri.addGroup(g.start, g.count, i))
  if (ACCESI.lucePerVertice) { const d = dividi(gMuri, SUDDIVIDI.muri); gMuri.dispose(); gMuri = d }
  // quanto è alta adesso ogni cella di muro alto (1 di difetto; nello scontro scende a parapetto)
  const datiAlto = new Uint8Array(p.W * p.H * 4).fill(255)
  const tAlto = new DataTexture(datiAlto, p.W, p.H, RGBAFormat)
  tAlto.magFilter = tAlto.minFilter = NearestFilter; tAlto.needsUpdate = true
  const uAlto = { uAltoMuri: { value: tAlto }, uDimAlto: { value: new Vector2(p.W, p.H) } }
  const coperta = new Color().setRGB(...(aspetto.copre || [1, 1, 1]))
  const bagliore = new Color().setRGB(...(aspetto.bagliore || [0, 0, 0]))
  const m = trame.muro
  // semplice: le facce col colore medio della trama per la tinta di ogni vertice, senza il bagliore a ogni pixel
  const tratto = semplice ? { map: null, color: colorMedio(m.map) } : { map: m.map, normalMap: ACCESI.rilievo ? m.normalMap : null, roughnessMap: ACCESI.rilievo ? m.roughnessMap : null }
  const parete = (cima, basso, chiave) => {
    const mat = new MeshStandardMaterial({
      ...tratto, roughness: aspetto.lucido ? Math.min(1, aspetto.lucido * 1.4) : 1,
      metalness: aspetto.metallo || 0, normalScale: new Vector2(1.4, 1.4), vertexColors: true, flatShading: sc.faccette,
      ...(m.emissiveMap && !semplice ? { emissiveMap: m.emissiveMap, emissive: new Color(1, 1, 1), emissiveIntensity: 1 } : {}),
      // la cima ha il suo colore pieno (senza la trama della faccia): da sopra è la cosa che si vede di più del muro
      ...(cima ? { map: null, roughnessMap: null, color: new Color(basso ? aspetto.parapetto : aspetto.cima) } : {}),
    })
    return conMaschera(mat, maschera, {
      spinta: cima ? 0 : 0.45, buco: !basso, arredo: false, chiave: 'parete-' + chiave + (sc.faccette ? 'f' : '') + (semplice ? 's' : ''),
      poi(sh) {
        Object.assign(sh.uniforms, uAlto, { uCoperta: { value: coperta }, uBagliore: { value: bagliore } })
        sh.vertexShader = GLSL_ALTO_V + 'attribute float aCoperta; varying float vCoperta;\n' +
          sh.vertexShader.replace('#include <begin_vertex>', ABBASSA + '\n  vCoperta = aCoperta;')
        sh.fragmentShader = 'uniform vec3 uCoperta; uniform vec3 uBagliore; varying float vCoperta;\n' + sh.fragmentShader
          .replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb = mix(diffuseColor.rgb, uCoperta, clamp(vCoperta, 0.0, 1.0));')
          .replace('#include <emissivemap_fragment>', semplice ? '#include <emissivemap_fragment>' : '#include <emissivemap_fragment>\n  totalEmissiveRadiance += uBagliore * (0.3 + 1.6 * pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.0));')
      },
    })
  }
  const matPareti = [parete(false, false, 'lato'), parete(true, false, 'cima'), parete(false, true, 'latobasso'), parete(true, true, 'cimabassa')]
  const muri = new Mesh(gMuri, matPareti)
  muri.castShadow = true; muri.receiveShadow = true
  // l'ombra sa dei muri abbassati
  const prof = new MeshDepthMaterial({ depthPacking: RGBADepthPacking })
  prof.onBeforeCompile = sh => { Object.assign(sh.uniforms, uAlto); sh.vertexShader = GLSL_ALTO_V + sh.vertexShader.replace('#include <begin_vertex>', ABBASSA) }
  muri.customDepthMaterial = prof
  muri.userData.elementiMateriali = ['pareteLontana', 'pareteLontana', 'pareteVicina', 'pareteVicina']   // i muri alti e i parapetti davanti
  aggiungi(muri)
  const ritMuri = creaRitaglio(gMuri, p.W, p.H, ALTO_MURO)
  const alti = p.muri.filter(c => !c.basso)
  const indice = new Map(alti.map((c, i) => [p.id(c.x, c.y), i]))
  const alto = new Float32Array(alti.length).fill(1), meta = new Float32Array(alti.length).fill(1)
  yield 'pareti'

  // ── le colonne, nella forma del paesaggio ──
  const [g0, g1] = (COLONNE[aspetto.fusto] || COLONNE.tonda)()
  const fusto = pulisci(g0), basi = pulisci(g1)
  let gCol = mergeGeometries([fusto, basi], true)
  if (ACCESI.lucePerVertice) { const d = dividi(gCol, SUDDIVIDI.colonne); gCol.dispose(); gCol = d }
  for (const g of [g0, g1, fusto, basi]) g.dispose()
  const matPietra = conMaschera(new MeshStandardMaterial({ color: aspetto.fusto === 'ferro' ? '#3a3634' : aspetto.fusto === 'tronco' ? '#2a3a18' : new Color(aspetto.colonna).multiplyScalar(0.8),
    roughness: 0.8, metalness: aspetto.metallo || 0, flatShading: aspetto.fusto === 'cristallo' }), maschera, { buco: true, chiave: 'pietra' })
  const matFusto = conMaschera(new MeshStandardMaterial({ color: aspetto.colonna, map: aspetto.fusto === 'cristallo' ? null : m.map, normalMap: ACCESI.rilievo ? m.normalMap : null,
    roughness: aspetto.fusto === 'cristallo' ? 0.15 : 0.9, metalness: aspetto.fusto === 'ferro' ? 0.6 : 0, normalScale: new Vector2(0.8, 0.8),
    flatShading: aspetto.fusto === 'cristallo', ...(aspetto.bagliore ? { emissive: bagliore.clone().multiplyScalar(1.5) } : {}) }), maschera, { buco: true, chiave: 'fusto' + aspetto.fusto })
  const mt = new Matrix4()
  const colonne = new InstancedMesh(gCol, [matFusto, matPietra], Math.max(1, p.colonne.length))
  p.colonne.forEach((c, i) => colonne.setMatrixAt(i, mt.makeRotationY(((c.x * 7 + c.y * 13) % 6) * 1.05).setPosition(c.x + 0.5, 0, c.y + 0.5)))
  colonne.count = p.colonne.length
  colonne.castShadow = true; colonne.receiveShadow = true; colonne.computeBoundingSphere(); colonne.userData.elemento3d = 'colonne'
  aggiungi(colonne)

  // ── le staffe delle torce, posate sulla faccia vera del muro (le fiamme e le luci le mette chi accende i fuochi) ──
  const matStaffa = conMaschera(new MeshStandardMaterial({ color: 0x3a2c22, roughness: 0.6, metalness: 0.6 }), maschera, { buco: true, chiave: 'staffa' })
  const gStaffa = new BoxGeometry(0.08, 0.32, 0.14)
  const staffe = new InstancedMesh(gStaffa, matStaffa, Math.max(1, p.torce.length))
  const rotStaffa = new Matrix4().makeRotationX(-0.35)
  const facciaDi = c => { const q = sc.sposta(c.x + 0.5, 0.72, c.y + 1); return new Vector3(q[0], 0.72, q[2]) }
  const facce = p.torce.map(facciaDi)
  const posaStaffa = (i, su) => {
    const f = facce[i]
    mt.copy(rotStaffa).setPosition(f.x, 0.72, f.z + 0.06)
    if (!su) mt.makeScale(0, 0, 0)
    staffe.setMatrixAt(i, mt)
  }
  p.torce.forEach((_, i) => posaStaffa(i, true))
  staffe.count = p.torce.length
  staffe.castShadow = true; staffe.computeBoundingSphere(); staffe.userData.elemento3d = 'colonne'
  aggiungi(staffe)

  const materiali = [matPav, ...matPareti, prof, matPietra, matFusto, matStaffa]
  const geometrie = [gPav, gMuri, gCol, gStaffa]
  return {
    muri, colonne, triangoliPareti: sc.triangoli,
    // prima di ogni disegno: pavimento e pareti solo dove guarda la telecamera; `ritagliati`: i blocchi disegnati e quelli che ci sono
    ritaglia(camera) { ritPav.aggiorna(camera); ritMuri.aggiorna(camera) },
    get ritagliati() { return [ritPav.blocchi + ritMuri.blocchi, ritPav.tutti + ritMuri.tutti] },
    // dove sta la faccia vera di un muro (le torce, l'arredo che ci si appoggia)
    sposta: sc.sposta, altezzaMuro: sc.altezza, facce,
    // il muro alto di quella cella: il suo indice (per sapere se una torcia ci sta sopra), o -1
    muroDi: (x, y) => (indice.has(p.id(x, y)) ? indice.get(p.id(x, y)) : -1),
    altezza: i => alto[i],
    // nello scontro: `fn(cella)` dice se quel muro alto va abbassato (true) o no; null li rialza tutti
    abbassa(fn) { alti.forEach((c, i) => { meta[i] = fn && fn(c) ? PARAPETTO / ALTO_MURO : 1 }) },
    // i muri che si abbassano o si rialzano (solo quelli che si muovono); torna true se qualcosa si è mosso
    aggiorna(dt, torceDi = null) {
      let mosso = false
      for (let i = 0; i < alto.length; i++) {
        const d = meta[i] - alto[i]
        if (d === 0) continue
        alto[i] = Math.abs(d) < 0.002 ? meta[i] : alto[i] + d * verso(dt, 5)
        mosso = true
        const c = alti[i]
        datiAlto[p.id(c.x, c.y) * 4] = Math.round(alto[i] * 255)
      }
      if (mosso) {
        tAlto.needsUpdate = true
        p.torce.forEach((c, i) => { const k = indice.get(p.id(c.x, c.y)); const su = k == null || alto[k] > 0.95; posaStaffa(i, su); if (torceDi) torceDi(i, su) })
        staffe.instanceMatrix.needsUpdate = true
      }
      return mosso
    },
    via() { for (const f of via) f(); for (const g of geometrie) g.dispose(); for (const x of materiali) x.dispose(); tAlto.dispose() },
  }
}
