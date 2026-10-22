/* I compagni da lontano (modelli-compagni.js `impostaDettaglio`): cane e gatti hanno una versione con poche facce e poche ciocche, per quando la
   camera è lontana (più di ~12 m): meno triangoli, stesso aspetto da piccolo, e si torna indietro senza perdere niente. Senza browser.
   `node test/esegui.mjs fattoria3d-compagni-lod`
   tempo: 1 */
import { controlla, riassunto } from '../aiuto/verifica.mjs'

const ctx = new Proxy({}, { get: (_, k) => k === 'canvas' ? {} : () => {}, set: () => true })
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
const THREE = await import('three')
const C = await import('../../src/giochi/fattoria3d/scena3d/modelli-compagni.js')

const box = g => { g.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(g); return b.getSize(new THREE.Vector3()) }
for (const [nome, crea, massimo] of [['cane', () => C.creaCane(), 0.35], ['gatto bianconero', () => C.creaGatto('bianconero'), 0.4], ['gatto calico', () => C.creaGatto('calico'), 0.4]]) {
  const g = crea(), alto = C.triangoliDi(g), alte = []
  g.traverse(o => { if (o.userData.lod) alte.push([o, o.geometry]) })
  C.impostaDettaglio(g, true)
  const basso = C.triangoliDi(g), b = box(g)
  C.impostaDettaglio(g, false)
  controlla(`${nome}: da lontano ha ≤ ${massimo * 100}% dei triangoli (${alto} → ${basso})`, basso < alto * massimo && basso > alto * 0.05, `${alto} → ${basso}`)
  controlla(`${nome}: tornando vicino ritrova le sue geometrie, tutte`, alte.length > 3 && alte.every(([o, geo]) => o.geometry === geo) && C.triangoliDi(g) === alto)
  C.impostaDettaglio(g, true); C.impostaDettaglio(g, true)
  controlla(`${nome}: da lontano ingombra come da vicino (±12%)`, ['x', 'y', 'z'].every(k => Math.abs(b[k] - box(g)[k]) < 0.01) && (() => { C.impostaDettaglio(g, false); const v = box(g); C.impostaDettaglio(g, true); return ['x', 'y', 'z'].every(k => Math.abs(v[k] - b[k]) / v[k] < 0.12) })())
  // un secondo esemplare condivide le geometrie povere (si fanno una volta sola)
  const h = crea(); C.impostaDettaglio(h, true)
  const geoBasse = o => { const a = []; o.traverse(x => { if (x.userData.lod) a.push(x.geometry) }); return a }
  controlla(`${nome}: le geometrie povere sono in comune fra gli esemplari`, geoBasse(g).every((geo, i) => geo === geoBasse(h)[i]))
}
riassunto('Fattoria 3D — i compagni da lontano')
