// Le foto del cuoco per il foglio dove lo si sceglie (docs/bancarella/cuoco.md): il modello vero, fotografato adesso con quella
// veste, un tipo per volta fra un fotogramma e l'altro, e tenuto finché il foglio serve. Un renderer suo, piccolo: nella scelta delle
// cucine la stanza non c'è. Senza WebGL non c'è niente da fotografare, e le carte restano col riquadro vuoto.
import { WebGLRenderer, Scene, PerspectiveCamera, HemisphereLight, DirectionalLight, PMREMGenerator, SRGBColorSpace, ACESFilmicToneMapping } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { inquadra, creaCache } from '../../giochi/fattoria3d/scena3d/anteprime-pura.js'
import { segui, rilascia as rilasciaRenderer } from '../rilascio3d.js'
import { creaCuoco } from './omino.js'

const LATO = 256
const FOV = 24
// cosa si inquadra, nelle misure del cuoco (alto 1,25 coi piedi a terra): tutto, la testa, il busto
const QUADRI = {
  tutto: { min: [-0.42, 0, -0.3], max: [0.42, 1.32, 0.3] },
  testa: { min: [-0.36, 0.66, -0.25], max: [0.36, 1.32, 0.3] },
  busto: { min: [-0.3, 0.14, -0.2], max: [0.3, 0.64, 0.25] },
}
const VERSO = [0, 0.32, 1]

/** → { chiedi(veste, { quadro, giro }) → Promise<dataURL|null>, leggi(...), via() } */
export function creaRitratti() {
  let renderer = null, scena, camera
  try {
    const tela = document.createElement('canvas'); tela.width = tela.height = LATO
    renderer = segui(new WebGLRenderer({ canvas: tela, antialias: true, alpha: true, preserveDrawingBuffer: true }))
    renderer.setPixelRatio(1); renderer.setSize(LATO, LATO, false); renderer.setClearColor(0, 0)
    renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08
    scena = new Scene()
    const finta = new PMREMGenerator(renderer)
    scena.environment = finta.fromScene(new RoomEnvironment(), 0.04).texture
    scena.environmentIntensity = 0.5
    finta.dispose()
    scena.add(new HemisphereLight(0xfff4e0, 0x8a7a70, 1.25))
    const sole = new DirectionalLight(0xfff0d8, 2); sole.position.set(1.5, 4, 3); scena.add(sole)
    camera = new PerspectiveCamera(FOV, 1, 0.05, 50)
  } catch (e) { renderer = null }

  const tipo = (veste, quadro, giro) => `${veste}|${quadro}|${giro}`
  function disegna(t) {
    if (!renderer) return null
    const [veste, quadro, giro] = t.split('|')
    const cuoco = creaCuoco({ veste })
    cuoco.anima(0, { cammina: false, porta: false, verso: 0 })
    cuoco.g.children.filter(o => o.material?.transparent).forEach(o => o.removeFromParent())     // l'ombra finta allarga il quadro
    cuoco.g.rotation.y = -Number(giro) * Math.PI / 4
    scena.add(cuoco.g)
    try {
      const q = inquadra(QUADRI[quadro] || QUADRI.tutto, { fov: FOV, verso: VERSO, margine: 0.06 })
      camera.position.set(...q.posizione); camera.lookAt(...q.bersaglio); camera.updateProjectionMatrix()
      renderer.render(scena, camera)
      return renderer.domElement.toDataURL('image/webp', 0.86)
    } finally { scena.remove(cuoco.g) }
  }
  const cache = creaCache(disegna, fn => requestAnimationFrame(() => fn()))
  return {
    chiedi: (veste, { quadro = 'tutto', giro = 0 } = {}) => cache.chiedi(tipo(veste, quadro, giro)),
    leggi: (veste, { quadro = 'tutto', giro = 0 } = {}) => cache.leggi(tipo(veste, quadro, giro)),
    via() {
      cache.via()
      if (renderer) rilasciaRenderer(renderer)
      renderer = null
    },
  }
}
