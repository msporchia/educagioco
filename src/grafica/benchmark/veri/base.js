// Il metro del calore (docs/core/vecchio-telefono-veri.md): la scena fissa che si rifà all'inizio di ogni gruppo (100 cubi lucidi con
// quattro luci puntiformi sopra un pavimento a tutto schermo: un po' di JS, un po' di chiamate e pixel illuminati). Lo stesso
// renderer del Sotterraneo (`creaContesto`) al pixel ratio del gioco.
import { Scene, Color, PerspectiveCamera, Mesh, BoxGeometry, PlaneGeometry, MeshStandardMaterial, HemisphereLight, PointLight } from 'three'
import { creaContesto } from '../../../giochi/sotterraneo/scena3d/contesto.js'
import { dprDelGioco } from './discese.js'
import { nuovaTela } from './tela.js'

export async function prepara({ contenitore }) {
  const tela = nuovaTela(contenitore)
  const ctx = creaContesto(tela.canvas, { fisso: dprDelGioco() })
  if (!ctx) { tela.via(); throw new Error('WebGL 2 non c\'è') }
  const { renderer } = ctx
  renderer.info.autoReset = true
  renderer.shadowMap.enabled = false
  ctx.misura(tela.W, tela.H)
  const camera = new PerspectiveCamera(40, tela.W / tela.H, 0.1, 100)
  camera.position.set(0, 9, 14); camera.lookAt(0, 0, 0)
  const cubi = (n, mat) => {
    const s = new Scene(), g = new BoxGeometry(0.6, 0.6, 0.6), l = []
    s.background = new Color(0x101018)
    for (let i = 0; i < n; i++) { const m = new Mesh(g, mat); m.position.set((i % 10 - 4.5) * 1.1, 0.4, (Math.floor(i / 10) - 4.5) * 1.1); s.add(m); l.push(m) }
    return { s, l }
  }
  const rif = cubi(100, new MeshStandardMaterial({ color: 0xc0a080, roughness: 0.5 }))
  const suolo = new Mesh(new PlaneGeometry(60, 60), new MeshStandardMaterial({ color: 0x556070, roughness: 0.8 }))
  suolo.rotation.x = -Math.PI / 2; rif.s.add(suolo, new HemisphereLight(0xffffff, 0x404040, 0.5))
  for (let i = 0; i < 4; i++) { const p = new PointLight(0xffc080, 6, 12, 1.5); p.position.set(Math.cos(i * 1.57) * 4, 2, Math.sin(i * 1.57) * 4); rif.s.add(p) }
  const ora = rif.s, giranti = rif.l
  return {
    dpr: ctx.dpr,
    gl: () => ctx.gl,
    tela: tela.canvas,
    scena3d: () => ora,
    conti() { const i = renderer.info; return { ch: i.render.calls, tri: i.render.triangles, programmi: (i.programs || []).length, geo: i.memory.geometries, tex: i.memory.textures } },
    async scena() {},
    passo(t) {
      for (let i = 0; i < giranti.length; i++) giranti[i].rotation.y = t + i
      renderer.render(ora, camera)
    },
    via() { try { ctx.via() } finally { tela.via() } },
  }
}
