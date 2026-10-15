// Il terreno di un piano: il pavimento (una geometria sola), i muri (un InstancedMesh, due chiamate: le facce e la cima), i
// parapetti bassi (i muri col pavimento a nord, che altrimenti nasconderebbero l'eroe), le colonne vere (fusto e basi) e le
// staffe delle torce. Le colonne e gli spigoli alti che coprono l'eroe si sfaldano nel buco (scena3d/maschera.js). Nello
// scontro i muri alti alle spalle dei combattenti si abbassano a parapetto (`abbassa`), e poi si rialzano.
import { BufferGeometry, Float32BufferAttribute, BoxGeometry, CylinderGeometry, Mesh, InstancedMesh, MeshStandardMaterial,
         Matrix4, Vector2, Color } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { conMaschera } from './maschera.js'
import { ALTO_MURO, PARAPETTO } from './costanti.js'

// un parallelepipedo con due gruppi soli (facce, cima) invece di sei: due chiamate invece di sei per tutti i muri
function scatola(w, h, d) {
  const g = new BoxGeometry(w, h, d)
  const idx = g.index.array, lati = [], cima = []
  for (const gr of g.groups) {
    if (gr.materialIndex === 3) continue   // il fondo non si vede mai
    const dove = gr.materialIndex === 2 ? cima : lati
    for (let i = gr.start; i < gr.start + gr.count; i++) dove.push(idx[i])
  }
  g.setIndex([...lati, ...cima])
  g.clearGroups(); g.addGroup(0, lati.length, 0); g.addGroup(lati.length, cima.length, 1)
  return g
}

export function creaTerreno(scena, { pianta, aspetto, trame, maschera }) {
  const p = pianta
  const via = []
  const aggiungi = o => { scena.add(o); via.push(() => { scena.remove(o) }) }

  // ── il pavimento: un quadrato per cella (anche sotto le colonne), le lastre di una trama ogni 2×2 celle ──
  const pos = [], uv = [], nor = [], idx = []
  const cu = trame.pav.celle
  for (const { x, y } of p.pavimento) {
    const b = pos.length / 3
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { pos.push(x + dx, 0, y + dz); uv.push((x + dx) / cu, -(y + dz) / cu); nor.push(0, 1, 0) }
    idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3)
  }
  const gPav = new BufferGeometry()
  gPav.setAttribute('position', new Float32BufferAttribute(pos, 3))
  gPav.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  gPav.setAttribute('normal', new Float32BufferAttribute(nor, 3))
  gPav.setIndex(idx)
  const t = trame.pav
  const matPav = conMaschera(new MeshStandardMaterial({
    map: t.map, normalMap: t.normalMap, roughnessMap: t.roughnessMap, roughness: 1, metalness: 0, normalScale: new Vector2(1.2, 1.2),
    ...(t.emissiveMap ? { emissiveMap: t.emissiveMap, emissive: new Color(1, 1, 1), emissiveIntensity: 1.1 } : {}),
  }), maschera, { spinta: 0, chiave: 'pav' + !!t.emissiveMap })
  const pav = new Mesh(gPav, matPav)
  pav.receiveShadow = true
  aggiungi(pav)

  // ── i muri e i parapetti ──
  const m = trame.muro
  const matLato = conMaschera(new MeshStandardMaterial({ map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap, roughness: 1, metalness: 0, normalScale: new Vector2(1.4, 1.4) }), maschera, { buco: true, chiave: 'lato' })
  const matCima = conMaschera(new MeshStandardMaterial({ color: aspetto.cima, roughness: 1 }), maschera, { spinta: 0, buco: true, chiave: 'cima' })
  const matLatoBasso = conMaschera(new MeshStandardMaterial({ map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap, roughness: 1, metalness: 0, normalScale: new Vector2(1.4, 1.4) }), maschera, { chiave: 'latobasso' })
  const matCimaBassa = conMaschera(new MeshStandardMaterial({ color: aspetto.parapetto, roughness: 0.9, normalMap: m.normalMap }), maschera, { spinta: 0, chiave: 'cimabassa' })
  const alti = p.muri.filter(c => !c.basso), bassi = p.muri.filter(c => c.basso)
  const mt = new Matrix4()
  const gMuro = scatola(1, ALTO_MURO, 1), gBasso = scatola(1, PARAPETTO, 1)
  const muri = new InstancedMesh(gMuro, [matLato, matCima], Math.max(1, alti.length))
  alti.forEach((c, i) => muri.setMatrixAt(i, mt.makeTranslation(c.x + 0.5, ALTO_MURO / 2, c.y + 0.5)))
  muri.count = alti.length
  const parapetti = new InstancedMesh(gBasso, [matLatoBasso, matCimaBassa], Math.max(1, bassi.length))
  bassi.forEach((c, i) => parapetti.setMatrixAt(i, mt.makeTranslation(c.x + 0.5, PARAPETTO / 2, c.y + 0.5)))
  parapetti.count = bassi.length
  for (const o of [muri, parapetti]) { o.castShadow = true; o.receiveShadow = true; o.computeBoundingSphere(); aggiungi(o) }
  const indice = new Map(alti.map((c, i) => [p.id(c.x, c.y), i]))
  const alto = new Float32Array(alti.length).fill(1), meta = new Float32Array(alti.length).fill(1)

  // ── le colonne: un fusto con base e capitello, perché facciano ombra ──
  const matPietra = conMaschera(new MeshStandardMaterial({ color: aspetto.colonna, roughness: 0.85 }), maschera, { buco: true, chiave: 'pietra' })
  // il fusto di pietra chiara col rilievo dei mattoni: con la trama scura del muro dall'alto sembrava un vaso
  const matFusto = conMaschera(new MeshStandardMaterial({ color: aspetto.colonna, normalMap: m.normalMap, roughness: 0.9, normalScale: new Vector2(0.8, 0.8) }), maschera, { buco: true, chiave: 'fusto' })
  const fusto = new CylinderGeometry(0.27, 0.3, ALTO_MURO, 14, 1, true).translate(0, ALTO_MURO / 2, 0)
  const b0 = new BoxGeometry(0.72, 0.16, 0.72).translate(0, 0.08, 0), b1 = new BoxGeometry(0.72, 0.16, 0.72).translate(0, ALTO_MURO - 0.08, 0)
  const basi = mergeGeometries([b0, b1])
  const gCol = mergeGeometries([fusto, basi], true)
  for (const g of [fusto, b0, b1, basi]) g.dispose()
  const colonne = new InstancedMesh(gCol, [matFusto, matPietra], Math.max(1, p.colonne.length))
  p.colonne.forEach((c, i) => colonne.setMatrixAt(i, mt.makeTranslation(c.x + 0.5, 0, c.y + 0.5)))
  colonne.count = p.colonne.length
  colonne.castShadow = true; colonne.receiveShadow = true; colonne.computeBoundingSphere()
  aggiungi(colonne)

  // ── le staffe delle torce (le fiamme e le luci le mette chi accende i fuochi) ──
  const matStaffa = conMaschera(new MeshStandardMaterial({ color: 0x3a2c22, roughness: 0.6, metalness: 0.6 }), maschera, { buco: true, chiave: 'staffa' })
  const gStaffa = new BoxGeometry(0.08, 0.32, 0.14)
  const staffe = new InstancedMesh(gStaffa, matStaffa, Math.max(1, p.torce.length))
  const rotStaffa = new Matrix4().makeRotationX(-0.35)
  const posaStaffa = (i, su) => {
    const c = p.torce[i]
    mt.copy(rotStaffa).setPosition(c.x + 0.5, 0.72, c.y + 1 + 0.06)
    if (!su) mt.makeScale(0, 0, 0)
    staffe.setMatrixAt(i, mt)
  }
  p.torce.forEach((_, i) => posaStaffa(i, true))
  staffe.count = p.torce.length
  staffe.castShadow = true; staffe.computeBoundingSphere()
  aggiungi(staffe)

  const materiali = [matPav, matLato, matCima, matLatoBasso, matCimaBassa, matPietra, matFusto, matStaffa]
  const geometrie = [gPav, gMuro, gBasso, gCol, gStaffa]
  return {
    muri, parapetti, colonne,
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
        alto[i] = Math.abs(d) < 0.002 ? meta[i] : alto[i] + d * Math.min(1, dt * 5)
        mosso = true
        const c = alti[i], h = ALTO_MURO * alto[i]
        muri.setMatrixAt(i, mt.makeScale(1, alto[i], 1).setPosition(c.x + 0.5, h / 2, c.y + 0.5))
      }
      if (mosso) {
        muri.instanceMatrix.needsUpdate = true
        p.torce.forEach((c, i) => { const k = indice.get(p.id(c.x, c.y)); const su = k == null || alto[k] > 0.95; posaStaffa(i, su); if (torceDi) torceDi(i, su) })
        staffe.instanceMatrix.needsUpdate = true
      }
      return mosso
    },
    via() { for (const f of via) f(); for (const g of geometrie) g.dispose(); for (const x of materiali) x.dispose() },
  }
}
