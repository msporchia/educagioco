// La roba 3D una famiglia alla volta nella misura del telefono (docs/core/vecchio-telefono-veri.md): 24 pezzi veri
// (scena3d/roba3d.js e i moduli di roba3d/) in una griglia, leggendari con l'alone e animati come addosso all'eroe, sotto la luce
// calda delle anteprime. Le vesti si portano: stanno addosso a 24 eroi (il peso dell'eroe è dentro). Le pozioni hanno l'alone del raro.
import { Scene, HemisphereLight, DirectionalLight, PerspectiveCamera, Group, Box3, Vector3 } from 'three'
import { creaContesto } from '../../../giochi/sotterraneo/scena3d/contesto.js'
import { creaPezzo, vestiFigura } from '../../../giochi/sotterraneo/scena3d/roba3d.js'
import { creaEroe, posaGuardia } from '../../../giochi/sotterraneo/scena3d/eroi3d/eroi.js'
import { FIGURE3D } from '../../../giochi/sotterraneo/dati/figure3d.js'
import { CHIAVI as POZIONI } from '../../../giochi/sotterraneo/scena3d/roba3d/pozioni.js'
import { dprDelGioco } from './discese.js'
import { nuovaTela } from './tela.js'

export const QUANTI = 24

// i pezzi di una famiglia sparsi su tutta la lista (elementi e forme diverse)
function figureDi(fam, n) {
  const l = Object.keys(FIGURE3D).filter(f => FIGURE3D[f].famiglia === fam)
  return Array.from({ length: n }, (_, k) => l[Math.floor(k * l.length / n) % l.length])
}

function crea(fam, k, f) {
  if (fam === 'pozioni') return creaPezzo({ consumabile: POZIONI[k % POZIONI.length], rarita: 'raro', elemento: 'nessuno' })
  if (fam === 'vesti') { const g = creaEroe('cavaliere'); vestiFigura(g, f); posaGuardia(g, 0.6); return g }
  return creaPezzo({ figura: f, id: null, rarita: 'leggendario', elemento: FIGURE3D[f].elemento || 'nessuno' })
}

export async function prepara({ contenitore }) {
  const tela = nuovaTela(contenitore)
  const ctx = creaContesto(tela.canvas, { fisso: dprDelGioco() })
  if (!ctx) { tela.via(); throw new Error('WebGL 2 non c\'è') }
  const { renderer } = ctx
  renderer.info.autoReset = true
  renderer.shadowMap.enabled = false
  ctx.misura(tela.W, tela.H)
  const scena = new Scene()
  scena.add(new HemisphereLight(0xffe6c4, 0x3b2a1e, 1.25))
  const fuoco = new DirectionalLight(0xffd29a, 2.7); fuoco.position.set(-3, 5, 6); scena.add(fuoco)
  const taglio = new DirectionalLight(0xa9c4ff, 1.3); taglio.position.set(4, 3, -5); scena.add(taglio)
  // la griglia: più righe che colonne su un telefono in piedi
  const col = tela.W < tela.H ? 4 : 6, righe = Math.ceil(QUANTI / col)
  const camera = new PerspectiveCamera(34, tela.W / tela.H, 0.1, 100)
  const altezza = Math.max(righe, col / camera.aspect) * 1.1
  camera.position.set(0, 0, altezza / 2 / Math.tan(17 * Math.PI / 180)); camera.lookAt(0, 0, 0)
  let gruppo = null, animati = []

  return {
    dpr: ctx.dpr,
    gl: () => ctx.gl,
    tela: tela.canvas,
    scena3d: () => scena,
    conti() { const i = renderer.info; return { ch: i.render.calls, tri: i.render.triangles, programmi: (i.programs || []).length, geo: i.memory.geometries, tex: i.memory.textures } },
    async scena(s) {
      // la famiglia di prima via, geometrie comprese (24 pezzi a famiglia: sul telefono la memoria della GPU conta)
      if (gruppo) { scena.remove(gruppo); gruppo.traverse(o => { if (o.geometry) o.geometry.dispose() }) }
      gruppo = new Group(); animati = []
      const figure = figureDi(s.roba, QUANTI)
      let fatti = 0
      for (let k = 0; k < QUANTI; k++) {
        let g = null
        try { g = crea(s.roba, k, figure[k]) } catch (e) { g = null }
        if (!g) continue
        fatti++
        // ognuno nella sua casella, grande quanto la casella
        const b = new Box3().setFromObject(g), dim = b.getSize(new Vector3()), c = b.getCenter(new Vector3())
        const perno = new Group(); perno.add(g); g.position.sub(c)
        perno.scale.setScalar(0.85 / Math.max(0.01, dim.x, dim.y, dim.z))
        perno.position.set((k % col - (col - 1) / 2) * 1.1, ((righe - 1) / 2 - Math.floor(k / col)) * 1.1, 0)
        gruppo.add(perno)
        g.traverse(o => { if (o.userData && (o.userData.anima || o.userData.animaAlone || o.userData.animaArmatura)) animati.push(o) })
      }
      scena.add(gruppo)
      if (!fatti) throw new Error(`nessun pezzo di ${s.roba} si costruisce`)
    },
    passo(t) {
      for (const o of animati) {
        const u = o.userData
        try { if (u.anima) u.anima(t * 0.12); if (u.animaArmatura) u.animaArmatura(t * 0.12); if (u.animaAlone) u.animaAlone(t) } catch (e) { /* resta fermo */ }
      }
      if (gruppo) gruppo.rotation.y = Math.sin(t * 0.5) * 0.35
      renderer.render(scena, camera)
    },
    via() { try { ctx.via() } finally { tela.via() } },
  }
}
