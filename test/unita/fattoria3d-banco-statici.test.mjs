/* Il banco dei pezzi fermi (scena3d/statici-istanze.js): aiuole, panchine, ponti… una InstancedMesh per (geometria, materiale), con le mesh
   originali tenute invisibili nel gruppo (per il dito). Prova che il banco disegna dove disegnerebbe il pezzo da solo (anche girato, ingrandito,
   sollevato), che nascosto sparisce, che i pezzi che si muovono o sono trasparenti non si adottano e che la capienza cresce. Senza browser.
   `node test/esegui.mjs fattoria3d-banco-statici`
   tempo: 1 */
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const ctx = new Proxy({}, { get: (_, k) => k === 'canvas' ? {} : () => {}, set: () => true })
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
const THREE = await import('three')
const M = await import('../../src/giochi/fattoria3d/scena3d/modelli.js')
const { creaStagno } = await import('../../src/giochi/fattoria3d/scena3d/modelli-acqua.js')
const { BancoStatici, STATICI } = await import('../../src/giochi/fattoria3d/scena3d/statici-istanze.js')

const crea = { aiuola: M.creaAiuola, panchina: M.creaPanchina, pozzo: M.creaPozzo }
const metti = (g, x, z, rot = 0, s = 1) => { g.position.set(x, 0, z); g.rotation.y = rot; g.scale.setScalar(s); g.updateMatrixWorld(true) }
const righe = (m, da = 0, n = m.count) => { const a = []; const t = new THREE.Matrix4(); for (let i = da; i < da + n; i++) { m.getMatrixAt(i, t); a.push(t.elements.map(x => String(Math.round(x * 1000) / 1000 + 0)).join()) } return a }
/** Dove disegnerebbero le mesh del pezzo da solo (matrici nel mondo, in ordine di traverse). */
const mondoDi = g => { const a = []; g.traverse(o => { if (o.isMesh) a.push(o.matrixWorld.elements.map(x => String(Math.round(x * 1000) / 1000 + 0)).join()) }); return a }

{
  const scena = new THREE.Scene(), banco = new BancoStatici(scena)
  const pezzi = [['aiuola', 2, 3, 0, 1], ['aiuola', 8, 3, 1, 1], ['aiuola', 14, 9, 3, 1], ['panchina', 5, 5, 2, 1], ['panchina', 6, 1, 0, 1], ['pozzo', 1, 12, 1, 1]]
  const gr = pezzi.map(([t, x, z, r, s]) => { const g = crea[t](); scena.add(g); metti(g, x, z, r * Math.PI / 2, s); return { t, g, x, z } })
  controlla('i tipi fermi sono nella lista, quelli che si muovono no', STATICI.has('aiuola') && STATICI.has('ponte') && !STATICI.has('fontana') && !STATICI.has('spaventapasseri') && !STATICI.has('stagno'))
  controlla('si adottano tutti', gr.every(({ g }) => banco.adotta(g)))
  banco.aggiorna()
  const ist = scena.children.filter(o => o.isInstancedMesh)
  // 3 aiuole (1 mesh), 2 panchine (1 mesh), 1 pozzo (2 mesh): 4 draw call invece di 3 + 2 + 2
  uguale('una mesh per (geometria, materiale): 4 draw call per 6 pezzi (erano 7)', ist.filter(o => o.visible).length, 4)
  controlla('le mesh originali restano nel gruppo, invisibili (le prende il dito)', gr.every(({ g }) => { let n = 0, v = 0; g.traverse(o => { if (o.isMesh) { n++; if (o.visible) v++ } }); return n > 0 && v === 0 }))
  const conta = ist.reduce((s, m) => s + m.count, 0)
  uguale('le istanze sono tante quante le mesh dei pezzi', conta, gr.reduce((s, { g }) => { let n = 0; g.traverse(o => { if (o.isMesh) n++ }); return s + n }, 0))
  // identico: ogni mesh originale sta dove il banco la disegna
  const tutteLe = ist.flatMap(m => righe(m)), attese = gr.flatMap(({ g }) => mondoDi(g))
  uguale('ogni istanza sta dove sarebbe stata la mesh del pezzo (girato)', [...tutteLe].sort().join('|'), [...attese].sort().join('|'))

  // si muove, si ingrandisce (il rimbalzo di quando nasce)
  gr[0].g.scale.setScalar(0.5); gr[0].g.position.y = 0.18; banco.aggiorna()
  gr[0].g.updateMatrixWorld(true)
  const dopo = ist.flatMap(m => righe(m)).sort().join('|'), attese2 = gr.flatMap(({ g }) => mondoDi(g)).sort().join('|')
  uguale('rimpicciolito e sollevato, il banco segue', dopo, attese2)
  gr[0].g.scale.setScalar(1); gr[0].g.position.y = 0; banco.aggiorna()

  // nascosto
  gr[1].g.visible = false; banco.aggiorna()
  uguale('un pezzo nascosto non si disegna', ist.reduce((s, m) => s + m.count, 0), conta - 1)
  gr[1].g.visible = true; banco.aggiorna(); uguale('…e torna', ist.reduce((s, m) => s + m.count, 0), conta)

  // tolto
  banco.lascia(gr[5].g); banco.aggiorna()
  uguale('un pezzo tolto sparisce (il pozzo ha due mesh)', ist.reduce((s, m) => s + m.count, 0), conta - 2)

  // non si adottano: animato, trasparente
  const fontana = M.creaFontana(), stagno = creaStagno(2, 2)
  controlla('una fontana (anima) non si adotta, e resta com\'era', banco.adotta(fontana) === false && (() => { let v = 0; fontana.traverse(o => { if (o.isMesh && o.visible) v++ }); return v > 0 })())
  controlla('uno stagno (trasparente) non si adotta', banco.adotta(stagno) === false)

  // la capienza cresce
  const prima = ist.find(m => m.geometry === gr[0].g.children[0]?.geometry)
  for (let i = 0; i < 30; i++) { const g = M.creaAiuola(); scena.add(g); metti(g, i * 4, 30); banco.adotta(g) }
  banco.aggiorna()
  const aiuole = scena.children.filter(o => o.isInstancedMesh && o.count > 20)
  controlla('con 30 aiuole in più la mesh si rifà più grande e le tiene tutte', aiuole.length === 1 && aiuole[0].count === 33 && aiuole[0].instanceMatrix.count >= 33, `${aiuole.map(m => m.count)} ${prima ? '' : ''}`)
  controlla('…senza mesh doppie in scena', scena.children.filter(o => o.isInstancedMesh).length === banco.meshes().length)
  banco.via(); controlla('via() toglie tutto', scena.children.filter(o => o.isInstancedMesh).length === 0)
}
riassunto('Fattoria 3D — il banco dei pezzi fermi')
