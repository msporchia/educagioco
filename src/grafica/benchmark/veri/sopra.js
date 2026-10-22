// Le persone e i mostri 3D del mondo di sopra nella misura del telefono (docs/core/vecchio-telefono-veri.md): i modelli veri
// (scena3d/persona3d.js, mostro3d.js, l'eroe 3D vestito di leggendari) con la luce, il sole e la foschia del mondo
// (scena3d/mondo/indice.js) e la sua telecamera, su un prato piatto: il mondo vero (zone, case, alberi) costa a parte e qui non c'è.
// Nessun tetto: si mettono tutti quelli chiesti, per vedere fin dove il telefono regge.
import { Scene, Color, Fog, HemisphereLight, DirectionalLight, Mesh, PlaneGeometry, MeshStandardMaterial, PerspectiveCamera, MathUtils } from 'three'
import { creaContesto } from '../../../giochi/sotterraneo/scena3d/contesto.js'
import { creaPersone3d } from '../../../giochi/sotterraneo/scena3d/persona3d.js'
import { CHIAVI as PERSONE } from '../../../giochi/sotterraneo/scena3d/persone3d/persone.js'
import { creaMostri3d } from '../../../giochi/sotterraneo/scena3d/mostro3d.js'
import { creaEroe3d } from '../../../giochi/sotterraneo/scena3d/eroe3d.js'
import { VISTA, SOLE } from '../../../giochi/sotterraneo/scena3d/mondo/veduta.js'
import { Corredo } from '../../../giochi/sotterraneo/motore/corredo.js'
import { vestiLeggendario } from './leggendario.js'
import { dprDelGioco } from './discese.js'
import { nuovaTela, posto } from './tela.js'

const SPECIE = ['scheletro', 'goblin', 'lupo', 'orco', 'ragno', 'zombie', 'vespa', 'cinghiale']
const CIELO = new Color(0xc9dcea)

export async function prepara({ contenitore }) {
  const tela = nuovaTela(contenitore)
  const dpr = dprDelGioco()
  const ctx = creaContesto(tela.canvas, { fisso: dpr, antialias: true })
  if (!ctx) { tela.via(); throw new Error('WebGL 2 non c\'è') }
  const { renderer } = ctx
  renderer.toneMappingExposure = 1.05
  renderer.info.autoReset = true
  const scena = new Scene()
  scena.background = CIELO.clone(); scena.fog = new Fog(CIELO, 80, 260)
  scena.add(new HemisphereLight(0xcfe4ff, 0x6a5a3a, 1.35))
  const sole = new DirectionalLight(0xfff1dc, 2.6)
  sole.castShadow = true; sole.shadow.mapSize.set(2048, 2048); sole.shadow.bias = -0.0004; sole.shadow.normalBias = 0.04
  Object.assign(sole.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 80 }); sole.shadow.camera.updateProjectionMatrix()
  sole.position.copy(SOLE).multiplyScalar(40); scena.add(sole, sole.target)
  const prato = new Mesh(new PlaneGeometry(80, 80), new MeshStandardMaterial({ color: 0x6f9a4a, roughness: 0.95 }))
  prato.rotation.x = -Math.PI / 2; prato.receiveShadow = true; scena.add(prato)
  // la telecamera del mondo da vicino: 52° dall'alto, almeno 15 celle in largo (mondo/veduta.js)
  ctx.misura(tela.W, tela.H)
  const camera = new PerspectiveCamera(VISTA.fov, tela.W / tela.H, 0.5, 400)
  const v = MathUtils.degToRad(VISTA.fov) / 2, largo = Math.tan(Math.atan(Math.tan(v) * camera.aspect))
  const d = Math.max(VISTA.largo / (2 * largo), VISTA.fondo * 0.9), inc = MathUtils.degToRad(VISTA.inclinazione)
  camera.position.set(0, d * Math.sin(inc), d * Math.cos(inc)); camera.lookAt(0, VISTA.guarda, 0)

  const persone3d = creaPersone3d(scena, { quanti: () => 64 })
  const mostri3d = creaMostri3d(scena, { quanti: () => 64 })
  const eroe3d = creaEroe3d(scena)
  const roba = vestiLeggendario(new Corredo({ eroe: 'cavaliere' }))
  const finta = { io: { sprite: 'cavaliere' }, mano: roba.mano, mancina: roba.mancina, corpo: roba.corpo, collo: roba.collo, testa: roba.testa }
  const e = { lx: 0, lz: 1, t: 0, cammina: false, assalto: null, colpito: 0, cura: 0 }
  const stP = [], stM = [], eroe = { x: 0, z: 0 }
  let nP = 0, nM = 0

  return {
    dpr,
    gl: () => ctx.gl,
    tela: tela.canvas,
    scena3d: () => scena,
    conti() {
      const i = renderer.info
      return { ch: i.render.calls, tri: i.render.triangles, programmi: (i.programs || []).length, geo: i.memory.geometries, tex: i.memory.textures,
               mostri3d: mostri3d.visibili, persone3d: persone3d.visibili }
    },
    async scena(s) { nP = s.persone || 0; nM = s.mostri || 0 },
    passo(t, dt) {
      e.t = t
      eroe3d.aggiorna(e, finta, { x: 0, z: 0, trasparenza: 1, dt, alto: 1.4 })
      persone3d.inizia()
      for (let k = 0; k < nP; k++) {
        const p = posto(k, 0.25), s = stP[k] || (stP[k] = {})
        persone3d.metti(s, PERSONE[k % PERSONE.length], { x: p.x, y: 0, z: p.z, alto: 2, eroe, t, dt, saluta: false })
      }
      persone3d.chiudi()
      mostri3d.inizia()
      for (let k = 0; k < nM; k++) {
        const p = posto(k), s = stM[k] || (stM[k] = { specchio: p.x < 0 })
        const r = { tipo: SPECIE[k % SPECIE.length], grado: 'comune' }
        if (s.id === undefined) s.id = mostri3d.idDi(r)
        if (s.id) mostri3d.metti(r, s, s.id, { x: p.x, y: 0, z: p.z, alto: 1.5, verso: eroe, t, dt, trasparenza: 1, morente: 0, bianco: 0, attacco: -1 })
      }
      mostri3d.chiudi()
      renderer.render(scena, camera)
    },
    via() {
      try { persone3d.via(); mostri3d.via(); eroe3d.toglie(); prato.geometry.dispose(); prato.material.dispose(); ctx.via() } finally { tela.via() }
    },
  }
}
