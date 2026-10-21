/* Le mesh fuse per materiale (scena3d/fondi.js): la parte pura (attributi mancanti, indici, esclusioni, ombre piccole, identità del
   disegno) su geometrie vere in node, e il fumo «ogni modello ha pochi mesh dopo la fusione» sui creatori veri, col soffitto
   dalla misura del 20/10. `node test/esegui.mjs fattoria3d-fondi`
   tempo: 1 */
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const ctx = new Proxy({}, { get: (_, k) => k === 'canvas' ? {} : () => {}, set: () => true })
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
const THREE = await import('three')
const { fondiGeometrie, fondiPerMateriale, contaTri } = await import('../../src/giochi/fattoria3d/scena3d/fondi.js')
const M = await import('../../src/giochi/fattoria3d/scena3d/modelli.js')
const MM = await import('../../src/giochi/fattoria3d/scena3d/modelli-macchine.js')
const MP = await import('../../src/giochi/fattoria3d/scena3d/modelli-passaggi.js')
const MC = await import('../../src/giochi/fattoria3d/scena3d/modelli-compagni.js')

/* ══════════ 1. le geometrie ══════════ */
const sc = (w, h, d) => new THREE.BoxGeometry(w, h, d)
const nonIndicizzata = sc(1, 1, 1).toNonIndexed()
const f1 = fondiGeometrie([sc(1, 1, 1), nonIndicizzata])
uguale('indicizzata + non indicizzata: i vertici si sommano', f1.attributes.position.count, 24 + 36)
uguale('…e i triangoli pure', contaTri(f1), 12 + 12)
const c1 = sc(1, 1, 1); c1.setAttribute('color', new THREE.BufferAttribute(new Float32Array(24 * 3).fill(0.5), 3))
const f2 = fondiGeometrie([c1, sc(1, 1, 1)])
controlla('un colore che manca a una geometria si riempie di bianco', f2.attributes.color && f2.attributes.color.getX(30) === 1 && f2.attributes.color.getX(0) === 0.5)
const senzaUv = sc(1, 1, 1); senzaUv.deleteAttribute('uv')
const f3 = fondiGeometrie([senzaUv, sc(1, 1, 1)])
controlla('un attributo che manca a una sola (uv) si lascia cadere per tutte', !f3.attributes.uv && !!f3.attributes.normal)
uguale('una lista vuota non è una geometria', fondiGeometrie([]), null)

/* ══════════ 2. il gruppo ══════════ */
const mt = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true })
const mesh = (g, m, x, y, z) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o }
const A = mt(0xff0000), B = mt(0x00ff00), C = new THREE.MeshStandardMaterial({ color: 0x0000ff, roughness: 0.3, metalness: 0.6 })
{
  const g = new THREE.Group(); g.userData.altezza = 2
  const mobile = new THREE.Group(); mobile.add(mesh(sc(1, 1, 1), A, 0, 0, 0), mesh(sc(1, 1, 1), A, 1, 0, 0))
  const sotto = new THREE.Group(); sotto.position.set(5, 0, 0); sotto.add(mesh(sc(1, 1, 1), B, 0, 1, 0))      // un gruppo intermedio mosso: la matrice si porta
  g.add(mesh(sc(1, 1, 1), A, -1, 0, 0), mesh(sc(1, 1, 1), B, 0, 0, 0), mesh(sc(2, 2, 2), C, 0, 3, 0), mesh(sc(2, 2, 2), C, 0, 6, 0), mobile, sotto)
  const r = fondiPerMateriale(g, { escludi: [mobile] })
  uguale('prima: 7 mesh', r.prima.mesh, 7)
  const figli = g.children.filter(o => o.isMesh)
  uguale('dopo: colore diverso, stessa ruvidità → una mesh a vertici colorati (A+B+B), il metallo a parte (C+C), il mobile intatto', g.children.length, 3)
  uguale('i triangoli non cambiano', r.dopo.tri, r.prima.tri)
  controlla('il gruppo mobile resta com\'era (due mesh, il suo materiale)', mobile.parent === g && mobile.children.length === 2 && mobile.children[0].material === A)
  controlla('i dati del gruppo restano', g.userData.altezza === 2)
  const fusa = figli.find(o => o.material.vertexColors && o.material.metalness === 0)
  const bb = new THREE.Box3().setFromObject(fusa)
  controlla('la mesh fusa copre i posti di prima (x da −1,5 a 5,5; la matrice del gruppo intermedio è applicata)', Math.abs(bb.min.x + 1.5) < 1e-6 && Math.abs(bb.max.x - 5.5) < 1e-6)
  const col = fusa.geometry.attributes.color, rosso = new THREE.Color(0xff0000)
  controlla('i colori nei vertici sono quelli dei materiali (lineari)', Math.abs(col.getX(0) - rosso.r) < 1e-6 && col.getY(0) === 0)
  uguale('un solo materiale fuso per firma: C ne ha uno suo', new Set(figli.map(o => o.material)).size, 2)
}
{
  // quello che non si fonde: una mesh sola per materiale, i trasparenti, le trame, le invisibili, quelle con userData
  const g = new THREE.Group(), vetro = new THREE.MeshStandardMaterial({ color: 1, transparent: true, opacity: 0.5 })
  const nascosta = mesh(sc(1, 1, 1), A, 0, 0, 0); nascosta.visible = false
  const marcata = mesh(sc(1, 1, 1), A, 0, 0, 0); marcata.userData.fase = 1
  g.add(mesh(sc(1, 1, 1), vetro, 0, 0, 0), mesh(sc(1, 1, 1), vetro, 1, 0, 0), nascosta, marcata, mesh(sc(1, 1, 1), A, 2, 0, 0))
  const r = fondiPerMateriale(g)
  uguale('trasparenti, invisibili, marcate e il singolo restano com\'erano', r.dopo.mesh, 5)
  const inst = new THREE.InstancedMesh(sc(1, 1, 1), A, 3); const gi = new THREE.Group(); gi.add(inst, mesh(sc(1, 1, 1), A, 0, 0, 0), mesh(sc(1, 1, 1), A, 1, 0, 0))
  fondiPerMateriale(gi)
  controlla('un\'InstancedMesh non si fonde', gi.children.includes(inst) && gi.children.length === 2)
}
{
  // le ombre: un pezzo piccolo non proietta, se non c'è un pezzo grande dello stesso materiale che lo ospita
  const g = new THREE.Group()
  g.add(mesh(sc(0.05, 0.05, 0.05), A, 0, 0, 0), mesh(sc(0.05, 0.05, 0.05), A, 0.2, 0, 0))
  fondiPerMateriale(g)
  uguale('due pezzi minuscoli: una mesh', g.children.length, 1)
  controlla('…che non proietta ombra', g.children[0].castShadow === false && g.children[0].receiveShadow === true)
  const h = new THREE.Group()
  h.add(mesh(sc(2, 2, 2), A, 0, 0, 0), mesh(sc(0.05, 0.05, 0.05), A, 0.2, 0, 0), mesh(sc(0.05, 0.05, 0.05), A, 0.4, 0, 0))
  fondiPerMateriale(h)
  controlla('con un pezzo grande, i piccoli entrano nella sua mesh, che proietta', h.children.length === 1 && h.children[0].castShadow === true)
}
{
  // l'immagine di un pezzo specchiato (scala negativa) non si rovescia: la faccia in fuori resta in fuori
  const g = new THREE.Group(), s = mesh(sc(1, 1, 1), A, 0, 0, 0); s.scale.x = -1
  g.add(s, mesh(sc(1, 1, 1), A, 3, 0, 0)); fondiPerMateriale(g)
  const geo = g.children[0].geometry, p = geo.attributes.position, ix = geo.index, n = geo.attributes.normal
  let bene = 0
  for (let i = 0; i < 6; i++) {          // i primi triangoli (del cubo specchiato): il giro dei vertici concorda con la normale
    const a = new THREE.Vector3().fromBufferAttribute(p, ix.getX(i * 3)), b = new THREE.Vector3().fromBufferAttribute(p, ix.getX(i * 3 + 1)), c = new THREE.Vector3().fromBufferAttribute(p, ix.getX(i * 3 + 2))
    const nt = b.clone().sub(a).cross(c.clone().sub(a)), nv = new THREE.Vector3().fromBufferAttribute(n, ix.getX(i * 3))
    if (nt.dot(nv) > 0) bene++
  }
  uguale('lo specchio non rovescia i triangoli', bene, 6)
}

/* ══════════ 3. il fumo sui creatori veri: il soffitto dei mesh dopo la fusione (misura del 20/10) ══════════ */
const conta = g => { let n = 0; g.traverse(o => { if (o.isMesh) n++ }); return n }
const SOFFITTO = {
  pasticceria: [M.creaPasticceria, 6], mongolfiera: [M.creaMongolfiera, 6], mulino: [M.creaMulino, 4], panificio: [M.creaPanificio, 6],
  conserviera: [M.creaConserviera, 10], gelateria: [M.creaGelateria, 5], caseificio: [M.creaCaseificio, 6], telaio: [MM.creaTelaio, 5],
  zuccherificio: [MM.creaZuccherificio, 6], sartoria: [MM.creaSartoria, 8], tintoria: [MM.creaTintoria, 12],
  ponte: [MP.creaPonte, 3], passerella: [MP.creaPasserella, 3], tavolo: [MP.creaTavolo, 3],
  recinto: [() => M.creaRecinto([]), 3], pollaio: [() => M.creaPollaio([]), 8], stalla: [() => M.creaStalla([]), 8],
  fienile: [M.creaFienile, 3], aiuola: [M.creaAiuola, 3], panchina: [M.creaPanchina, 3], pozzo: [M.creaPozzo, 4], spaventapasseri: [M.creaSpaventapasseri, 4],
  trattore: [M.creaTrattore, 4], cassa: [M.creaCassa, 3], fontana: [M.creaFontana, 13],
}
for (const [nome, [crea, tetto]] of Object.entries(SOFFITTO)) {
  const g = crea(); controlla(`${nome}: al più ${tetto} mesh dopo la fusione (ora ${conta(g)})`, conta(g) <= tetto)
  let nan = false; g.traverse(o => { if (o.isMesh) for (const v of o.geometry.attributes.position.array) if (!Number.isFinite(v)) nan = true })
  controlla(`${nome}: nessun NaN nelle posizioni`, !nan)
}
// ciò che si muove resta raggiungibile dalle animazioni
{
  const m = M.creaMulino(); m.userData.anima(0.1); controlla('mulino: le pale girano ancora (restano un gruppo a parte)', m.userData.anima && conta(m) >= 2)
  const t = MM.creaTintoria(); controlla('tintoria: le anime funzionano, vasche e panni restano sciolti', (() => { t.userData.anima(0.1, 1); return true })() && conta(t) >= 8)
  const z = MM.creaZuccherificio(); z.userData.anima(0.1, 1); controlla('zuccherificio: ruota e sciroppo girano', true)
  const p = M.creaPasticceria(); controlla('pasticceria: il dolce che gira esiste ancora', p.userData.gira && p.userData.gira.parent === p)
  const c = MM.creaSartoria(); c.userData.anima(0.1, 1); controlla('sartoria: manichino e ago si animano', true)
  const mo = M.creaMongolfiera(); controlla('mongolfiera: volo e fiamma sono ancora nel gruppo', mo.userData.volo.parent === mo && mo.userData.fiamma.parent === mo.userData.volo)
  const pe = M.creaRecinto([{ eta: 'adulta', t0: Date.now() }, { eta: 'agnello', t0: Date.now() }]); M.muoviPecore(pe, 0.1, 1, null, [{ eta: 'adulta', t0: Date.now() }, { eta: 'agnello', t0: Date.now() }], Date.now())
  uguale('recinto: le pecore ci sono ancora', pe.userData.pecore.length, 2)
  const st = M.creaStalla([{ fine: null }, { fine: 0 }]); M.muoviBestie(st, 0.1, 1, [{ fine: null }, { fine: 0 }], Date.now()); uguale('stalla: le mucche muovono', st.userData.bestie.length, 2)
  const fo = M.creaFontana(); fo.userData.anima(1); controlla('fontana: le gocce volano', true)
  const sp = M.creaSpaventapasseri(); sp.userData.anima(1); controlla('spaventapasseri: dondola', true)
  const co = MC.creaContadino(); controlla('contadino: i perni delle pose restano', co.userData.gambe.every(x => x.parent === co) && co.userData.busto.parent === co)
}
riassunto('Fattoria 3D — mesh fuse per materiale')
