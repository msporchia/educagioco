/* Le parti di una bestia si toccano: ogni bestia della Fattoria 3D (pecora, gallina, mucca, anatra, maiale, capra, coniglio, alpaca, asino), in tutti e tre gli
   stadi e in vari momenti dell'animazione, è UN corpo solo: le mesh (non fuse, `FONDI` spento) formano una catena connessa per ingombro (corpo–collo–testa,
   testa–orecchie/occhi/muso/corna, corpo–zampe/coda). Una parte che galleggia (collo staccato, orecchio sospeso, zampa che non arriva al corpo) fa
   fallire il test e viene nominata. Il prodotto accanto (dono, uovo, mucchio, goccia, alone, scintillio, scia) è fuori dal conto: sta vicino, non attaccato.
   Chi scrive una bestia nuova la aggiunge a BESTIE. Docs: docs/fattoria3d/animali.md, «Le parti si toccano».
   `node test/esegui.mjs fattoria3d-bestie-connesse`
   tempo: 1 */
import { controlla, riassunto } from '../aiuto/verifica.mjs'

const ctx = new Proxy({}, { get: (_, k) => k === 'canvas' ? {} : () => {}, set: () => true })
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
const THREE = await import('three')
const { FONDI } = await import('../../src/giochi/fattoria3d/scena3d/fondi.js')
FONDI.acceso = false                                     // le mesh sciolte: la fusione unirebbe tutto in una scatola sola e nasconderebbe i pezzi che galleggiano
const M = await import('../../src/giochi/fattoria3d/scena3d/modelli.js')
const T = await import('../../src/giochi/fattoria3d/scena3d/modelli-cortile.js')
const C = await import('../../src/giochi/fattoria3d/scena3d/modelli-cortile2.js')
const { ANIMALI } = await import('../../src/giochi/fattoria3d/dati/animali.js')
const { PECORE } = await import('../../src/giochi/fattoria3d/dati/regole.js')

const BESTIE = [
  ['gallina', M.creaGallina, ANIMALI.pollaio.ms], ['mucca', M.creaMucca, ANIMALI.stalla.ms], ['anatra', T.creaAnatra, ANIMALI.anatre.ms],
  ['maiale', T.creaMaiale, ANIMALI.porcile.ms], ['capra', T.creaCapra, ANIMALI.capre.ms],
  ['coniglio', C.creaConiglio, ANIMALI.conigliera.ms], ['alpaca', C.creaAlpaca, ANIMALI.alpaca.ms], ['asino', C.creaAsino, ANIMALI.asini.ms],
]
const FUORI = ['dono', 'uovo', 'mucchio', 'goccia', 'alone', 'scintilla', 'scintillo', 'sbuffo', 'scia']      // i nomi in userData di ciò che sta accanto, non attaccato
const TOLLERANZA = 0.004

/** Le mesh che fanno il corpo: visibili, escluso il prodotto accanto e i segni di «pronta». */
function partiDel (b) {
  const fuori = new Set()
  for (const k of FUORI) if (b.userData[k]) b.userData[k].traverse(o => fuori.add(o))
  const lista = []
  b.updateMatrixWorld(true)
  b.traverse(o => {
    if (!o.isMesh || fuori.has(o)) return
    for (let p = o; p; p = p.parent) if (p.visible === false) return
    lista.push(o)
  })
  return lista
}
const nomeDi = (o, i) => {
  const c = o.material && o.material.color ? '#' + o.material.color.getHexString() : '?'
  const g = o.geometry.type.replace('Geometry', '').toLowerCase()
  const p = new THREE.Vector3(); o.getWorldPosition(p)
  return `${i}:${g} ${c} @(${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)})`
}
const _v = new THREE.Vector3(), _inv = new THREE.Matrix4()
/** Un vertice di `da` sta dentro la scatola (orientata come la mesh) di `a`? Meglio del solo ingombro: un collo inclinato non riempie la sua scatola. */
function vertexDentro (da, a) {
  a.geometry.boundingBox || a.geometry.computeBoundingBox()
  const bb = a.geometry.boundingBox, pos = da.geometry.attributes.position
  _inv.copy(a.matrixWorld).invert()
  const m = new THREE.Matrix4().multiplyMatrices(_inv, da.matrixWorld), e = TOLLERANZA
  for (let i = 0; i < pos.count; i++) {
    _v.fromBufferAttribute(pos, i).applyMatrix4(m)
    if (_v.x >= bb.min.x - e && _v.x <= bb.max.x + e && _v.y >= bb.min.y - e && _v.y <= bb.max.y + e && _v.z >= bb.min.z - e && _v.z <= bb.max.z + e) return true
  }
  return false
}
const tocca = (a, b, A, B) => a.min.x <= b.max.x && b.min.x <= a.max.x && a.min.y <= b.max.y && b.min.y <= a.max.y && a.min.z <= b.max.z && b.min.z <= a.max.z && (vertexDentro(A, B) || vertexDentro(B, A))

/** Le mesh che non sono nel pezzo grande: vuota se la bestia è un corpo solo. */
export function galleggianti (b) {
  const parti = partiDel(b), box = parti.map(o => new THREE.Box3().setFromObject(o, true).expandByScalar(TOLLERANZA)), n = parti.length
  const gruppo = Array.from({ length: n }, (_, i) => i)
  const radice = i => { while (gruppo[i] !== i) i = gruppo[i] = gruppo[gruppo[i]]; return i }
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (tocca(box[i], box[j], parti[i], parti[j])) gruppo[radice(i)] = radice(j)
  const conta = new Map(); for (let i = 0; i < n; i++) conta.set(radice(i), (conta.get(radice(i)) || 0) + 1)
  let grande = -1, max = 0; for (const [r, c] of conta) if (c > max) { max = c; grande = r }
  return parti.map((o, i) => [o, i]).filter(([, i]) => radice(i) !== grande).map(([o, i]) => nomeDi(o, i))
}

const adesso = 1_000_000
for (const [specie, crea, ms] of BESTIE) {
  const stati = { 'ha fame': { fine: null }, 'a un quarto': { fine: adesso + ms * 0.75 }, 'a metà': { fine: adesso + ms * 0.5 }, 'quasi pronta': { fine: adesso + ms * 0.1 }, pronta: { fine: adesso - 1 } }
  for (const k of [0, 1]) for (const [nome, st] of Object.entries(stati)) {
    const b = crea(k), tenitore = { userData: { bestie: [b] } }
    let t = 0, male = null
    for (let f = 0; f < 150 && !male; f++) {                       // cinque secondi: tutte le fasi dei movimenti (masticare, orecchie, coda, salto)
      M.muoviBestie(tenitore, 1 / 30, t += 1 / 30, [st], adesso)
      if (f > 40 && f % 7 === 0) { const g = galleggianti(b); if (g.length) male = `a ${t.toFixed(1)} s: ${g.join('; ')}` }
    }
    controlla(`${specie} (${k ? 'seconda' : 'prima'} versione), ${nome}: le parti si toccano`, !male, 'galleggiano ' + male)
  }
}

/* la pecora ha il suo movimento (`muoviPecore`) e gli stati dal momento della tosatura */
for (const [nome, t0] of [['ha fame', null], ['al lavoro', adesso - PECORE.laneMs / 2], ['pronta', adesso - PECORE.laneMs]]) {
  const p = M.creaPecora(), tenitore = { userData: { pecore: [p] } }
  p.userData.k = 1; p.userData.meta.copy(p.position); p.userData.attesa = 99
  let t = 0, male = null
  for (let f = 0; f < 150 && !male; f++) {
    M.muoviPecore(tenitore, 1 / 30, t += 1 / 30, null, [{ eta: 'adulta', t0 }], adesso)
    if (f > 40 && f % 7 === 0) { const g = galleggianti(p); if (g.length) male = `a ${t.toFixed(1)} s: ${g.join('; ')}` }
  }
  controlla(`pecora, ${nome}: le parti si toccano`, !male, 'galleggiano ' + male)
}

riassunto('Fattoria 3D — le parti delle bestie si toccano')
