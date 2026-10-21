// Il palco dell'arena: renderer unico, luci, pavimento, e una camera 3/4 alta che si orbita col dito/mouse.
import { WebGLRenderer, Scene, PerspectiveCamera, HemisphereLight, DirectionalLight, Color, CircleGeometry, MeshStandardMaterial, Mesh, ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace, Fog, GridHelper, Vector3 } from 'three'

const GRADI = Math.PI / 180

export function creaPalco (contenitore) {
  const renderer = new WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = SRGBColorSpace
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFSoftShadowMap
  contenitore.append(renderer.domElement)
  renderer.domElement.style.touchAction = 'none'

  const scena = new Scene(); scena.background = new Color(0x2a2f38); scena.fog = new Fog(0x2a2f38, 14, 38)
  scena.add(new HemisphereLight(0xcfe4ff, 0x6a5a3a, 1.2))
  const sole = new DirectionalLight(0xfff1dc, 2.4); sole.position.set(3.5, 7, 5); sole.castShadow = true
  sole.shadow.mapSize.set(2048, 2048); Object.assign(sole.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 24 }); sole.shadow.bias = -0.0006; sole.shadow.radius = 4
  scena.add(sole)
  const controluce = new DirectionalLight(0x8fb4ff, 1.1); controluce.position.set(-4, 3, -4); scena.add(controluce)
  const suolo = new Mesh(new CircleGeometry(40, 48), new MeshStandardMaterial({ color: 0x3b4048, roughness: 1 })); suolo.rotation.x = -Math.PI / 2; suolo.receiveShadow = true; scena.add(suolo)
  const griglia = new GridHelper(24, 24, 0x555c68, 0x464c57); griglia.position.y = 0.003; griglia.material.transparent = true; griglia.material.opacity = 0.55; scena.add(griglia)

  const cam = new PerspectiveCamera(32, 1, 0.1, 120)
  // la vista: azimut (0 = dal lato +z, come le pagine degli effetti), elevazione, distanza, punto guardato
  const vista = { az: 0, el: 50, dist: 8.6, mira: new Vector3(0, 0.7, 0) }
  const base = { az: 0, el: 50, dist: 8.6, mira: new Vector3(0, 0.7, 0) }
  function aggiornaCamera () {
    const a = vista.az * GRADI, e = Math.max(8, Math.min(86, vista.el)) * GRADI, d = vista.dist
    cam.position.set(vista.mira.x + d * Math.cos(e) * Math.sin(a), vista.mira.y + d * Math.sin(e), vista.mira.z + d * Math.cos(e) * Math.cos(a))
    cam.lookAt(vista.mira)
  }
  function ridimensiona () {
    const w = Math.max(200, window.innerWidth), h = Math.max(200, window.innerHeight)
    renderer.setSize(w, h, false); renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px'
    cam.aspect = w / h; cam.fov = w / h < 0.9 ? 40 : 32; cam.updateProjectionMatrix(); applicaMargine()
  }
  // col pannello aperto la scena si sposta in modo da restare al centro dello spazio libero
  let margine = { x: 0, y: 0 }
  function applicaMargine () {
    const w = renderer.domElement.clientWidth || window.innerWidth, h = renderer.domElement.clientHeight || window.innerHeight
    if (margine.x || margine.y) cam.setViewOffset(w, h, margine.x, margine.y, w, h); else cam.clearViewOffset()
    cam.updateProjectionMatrix()
  }
  function impostaMargine (aperto) {
    const w = window.innerWidth, h = window.innerHeight
    margine = !aperto ? { x: 0, y: 0 } : w > 760 ? { x: Math.min(350, w * 0.94) / 2, y: 0 } : { x: 0, y: h * 0.52 / 2 }
    applicaMargine()
  }
  /** Reimposta la vista di partenza; `larghezza` è quanto deve starci in orizzontale. */
  function inquadra (cx, larghezza, y = 0.7) {
    base.mira.set(cx, y, 0); base.dist = Math.max(6.2, larghezza * 1.1 + 1.8)
    const asp = window.innerWidth / window.innerHeight, fov = asp < 0.9 ? 40 : 32
    base.dist = Math.max(base.dist, (larghezza + 1.2) / (2 * asp * Math.tan(fov * Math.PI / 360)))
    ripristina()
  }
  function ripristina () { vista.az = base.az; vista.el = base.el; vista.dist = base.dist; vista.mira.copy(base.mira); aggiornaCamera() }

  // orbita: un dito/mouse ruota, due dita avvicinano (pizzico), la rotella zooma
  const el = renderer.domElement, punti = new Map()
  let distPizzico = 0
  el.addEventListener('pointerdown', e => { el.setPointerCapture?.(e.pointerId); punti.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (punti.size === 2) distPizzico = distanzaPunti() })
  el.addEventListener('pointermove', e => {
    const p = punti.get(e.pointerId); if (!p) return
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY
    if (punti.size === 1) { vista.az -= dx * 0.35; vista.el = Math.max(8, Math.min(86, vista.el + dy * 0.3)); aggiornaCamera() }
    else if (punti.size === 2) { const d = distanzaPunti(); if (distPizzico > 0) { vista.dist = Math.max(2.5, Math.min(40, vista.dist * distPizzico / d)); aggiornaCamera() } distPizzico = d }
  })
  const finePunto = e => { punti.delete(e.pointerId); distPizzico = 0 }
  el.addEventListener('pointerup', finePunto); el.addEventListener('pointercancel', finePunto)
  el.addEventListener('wheel', e => { e.preventDefault(); vista.dist = Math.max(2.5, Math.min(40, vista.dist * Math.exp(e.deltaY * 0.0012))); aggiornaCamera() }, { passive: false })
  el.addEventListener('dblclick', ripristina)
  function distanzaPunti () { const [a, b] = [...punti.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1 }

  window.addEventListener('resize', ridimensiona)
  ridimensiona(); aggiornaCamera()
  return { renderer, scena, cam, vista, base, aggiornaCamera, ridimensiona, inquadra, ripristina, impostaMargine }
}
