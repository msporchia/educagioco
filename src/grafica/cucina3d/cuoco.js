// La cucina col cuoco (three.js, WebGL 2): camera fissa dall'alto, la stanza intera dentro. Vedi docs/bancarella/cuoco.md.
// Chi gioca non disegna: la scena legge a ogni fotogramma lo stato che riceve con `imposta`, e `cosaCe` dice cosa c'è sotto
// il dito. Qui non entrano regole né prezzi.
import { WebGLRenderer, Scene, PerspectiveCamera, HemisphereLight, DirectionalLight, Vector3, ACESFilmicToneMapping, SRGBColorSpace, Color,
         Mesh, SphereGeometry, MeshBasicMaterial, Group, PMREMGenerator, PCFSoftShadowMap, Raycaster, Plane, Vector2, Box3 } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { segui, rilascia as rilasciaRenderer } from '../rilascio3d.js'
import { creaPentola, creaPadella, creaTagliere, creaColtello, creaForno, creaPiatto, riempiPiatto, creaBarra } from './pezzi.js'
import { confezione, cibo } from './cibo.js'
import { creaSala, creaCassetta, creaPila, creaCestino, creaConsegna, creaMira, ALTO } from './sala.js'
import { creaCuoco } from './omino.js'

const FOV = 30
const VERSO = new Vector3(0, 0.9, 0.46).normalize()
const LARGO = 7.3, FONDO = 8
const SCALA_ROBA = 0.5      // i pezzi di cucina sono fatti per il banco col dito: qui stanno in una cella
const COSTRUISCI = { pentola: creaPentola, padella: creaPadella, tagliere: creaTagliere, forno: creaForno }
// quanto sporge dal piano quello che si tocca: il forno e la finestra si toccano anche in alto
const SOPRA = { forno: 0.8, cassetta: 0.3, consegna: 1.4, bidone: 0.15, pentola: 0.5, padella: 0.25 }
const ACQUA = { vuota: 0xa9d6ee, cuoce: 0x9fd0ea, pronta: 0xf1dd9a, scotta: 0xa9743c }

export function creaCucinaCuoco(canvas, { sente, quanto, perso, dpr } = {}) {
  let gl = null, renderer
  try {
    gl = canvas.getContext('webgl2', { alpha: false, antialias: true, depth: true, stencil: false, powerPreference: 'high-performance' })
  } catch (e) { gl = null }
  if (!gl || gl.isContextLost()) return null
  try { renderer = segui(new WebGLRenderer({ canvas, context: gl, antialias: true })) } catch (e) { return null }
  let tutto
  try { tutto = costruisci(renderer, canvas, { sente, quanto, dpr }) } catch (e) {
    console.warn('cucina col cuoco: niente disegno', e)
    try { renderer.dispose() } catch (x) { /* pazienza */ }
    return null
  }
  const perdi = e => { e.preventDefault(); perso?.() }
  canvas.addEventListener('webglcontextlost', perdi)
  const via = tutto.rilascia
  tutto.rilascia = () => { canvas.removeEventListener('webglcontextlost', perdi); via() }
  return tutto
}

/* Un posto dove può stare una cosa: il banco, o le mani. Il piatto resta lì e si riempie, il cibo si clona. */
function creaPosto() {
  const g = new Group(), piatto = creaPiatto(), cosa = new Group()
  piatto.visible = false
  piatto.scale.setScalar(SCALA_ROBA); cosa.scale.setScalar(SCALA_ROBA)
  g.add(piatto, cosa)
  let firma = ''
  return { g, metti(o) {
    const f = o ? JSON.stringify(o) : ''
    if (f === firma) return false
    firma = f
    piatto.visible = !!o?.piatto
    if (o?.piatto) riempiPiatto(piatto, o)
    cosa.clear()
    if (o && !o.piatto) cosa.add(figura(o))
    g.traverse(x => { if (x.isMesh && !x.material.transparent && !x.material.isMeshBasicMaterial) x.castShadow = true })
    return true
  } }
}
const figura = o => {
  if (o.bruciata) return cibo(o.cosa === 'impasto' ? 'pizza' : o.cosa, { bruciato: true })
  if (o.cosa === 'insalata') return o.fatta ? cibo('insalata') : confezione('insalata')
  return o.cosa === 'pasta' || o.cosa === 'carne' || o.cosa === 'uovo' ? (o.fatta ? cibo(o.cosa) : confezione(o.cosa)) : confezione(o.cosa)
}

function costruisci(renderer, canvas, { sente, quanto, dpr: fisso }) {
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.02
  const scena = new Scene()
  scena.background = new Color(0x3f3128)
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 80)
  const stanzaFinta = new PMREMGenerator(renderer)
  scena.environment = stanzaFinta.fromScene(new RoomEnvironment(), 0.04).texture
  scena.environmentIntensity = 0.5
  stanzaFinta.dispose()
  scena.add(new HemisphereLight(0xfff6e6, 0x8a6f52, 1))
  const chiave = new DirectionalLight(0xfff0d8, 1.9); chiave.position.set(1.5, 11, 6); chiave.target.position.set(3.5, 0, 3.5)
  chiave.castShadow = true
  chiave.shadow.mapSize.set(1024, 1024)
  chiave.shadow.camera.left = -6; chiave.shadow.camera.right = 6; chiave.shadow.camera.top = 6.5; chiave.shadow.camera.bottom = -6.5
  chiave.shadow.camera.far = 22; chiave.shadow.bias = -0.0006; chiave.shadow.normalBias = 0.02
  scena.add(chiave, chiave.target)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap
  renderer.shadowMap.autoUpdate = false    // il cuoco ha un'ombra finta: quelle vere si rifanno solo se cambia cosa c'è sui banchi

  /* ── la telecamera: tutta la stanza dentro, in piedi o coricato ── */
  let W = 1, H = 1
  const MIRA = new Vector3(3.5, 0.2, 3.2)
  const dpr = fisso || Math.min(2, window.devicePixelRatio || 1)
  function misura() {
    const r = canvas.getBoundingClientRect()
    W = Math.max(1, r.width); H = Math.max(1, r.height)
    renderer.setPixelRatio(dpr)
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    const t = Math.tan(FOV * Math.PI / 360)
    camera.position.copy(MIRA).addScaledVector(VERSO, Math.max(LARGO / 2 / (t * camera.aspect), FONDO / 2 / t))
    camera.lookAt(MIRA)
    camera.clearViewOffset()
    camera.updateMatrixWorld()
    camera.updateProjectionMatrix()
    // sullo schermo lungo avanza spazio: la stanza scende in fondo, e sopra resta il muro
    const giu = new Vector3(3.5, 0, 7).project(camera), avanza = H * (0.5 + giu.y / 2) - 6
    if (avanza > 0) camera.setViewOffset(W, H, 0, -avanza, W, H)
    camera.updateProjectionMatrix()
  }
  const osserva = new ResizeObserver(misura)
  osserva.observe(canvas)
  misura()

  /* ── le cose in scena: si mettono al primo `imposta`, secondo la cucina ── */
  let q = null, largo = 0, fondo = 0
  const stazioni = {}, posti = {}
  let omino = null, inMano = null, coltello = null
  const mire = [], scatole = []
  function monta(s) {
    largo = Math.max(...s.celle.map(c => c.x)) + 1; fondo = Math.max(...s.celle.map(c => c.z)) + 1
    creaSala(scena, s.celle, largo, fondo)
    for (const c of s.celle) {
      const cx = c.x + 0.5, cz = c.z + 0.5
      scatole.push({ id: c.id, b: new Box3(new Vector3(c.x, 0, c.z), new Vector3(c.x + 1, ALTO + (SOPRA[c.tipo === 'stazione' ? c.nome : c.tipo] || 0.1), c.z + 1)) })
      if (c.tipo === 'stazione') {
        const g = COSTRUISCI[c.nome]()
        g.scale.setScalar(SCALA_ROBA)
        g.position.set(cx, ALTO, cz)
        if (c.nome === 'padella') g.rotation.y = -Math.PI / 2      // il manico verso chi cucina, non sul vicino
        const barra = creaBarra(); barra.scale.setScalar(0.62); barra.position.set(cx, ALTO + (c.nome === 'forno' ? 1.05 : 0.8), cz)
        const fumo = new Group(); fumo.position.set(cx, ALTO + (c.nome === 'forno' ? 0.85 : 0.55), cz)
        for (let i = 0; i < 5; i++) fumo.add(new Mesh(new SphereGeometry(0.1, 8, 6), new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })))
        scena.add(g, barra, fumo)
        stazioni[c.nome] = { g, barra, fumo }
      } else if (c.tipo === 'cassetta') {
        const g = creaCassetta(); g.position.set(cx, ALTO, cz)
        const dentro = confezione(c.cosa); dentro.scale.setScalar(0.48); dentro.position.y = 0.1
        g.add(dentro)
        scena.add(g)
      } else if (c.tipo === 'piatti') {
        const g = creaPila(); g.position.set(cx, ALTO, cz); scena.add(g)
      } else if (c.tipo === 'bidone') {
        const g = creaCestino(); g.position.set(cx, 0, cz); scena.add(g)
      } else if (c.tipo === 'consegna') {
        const g = creaConsegna(); g.position.set(cx, 0, cz); scena.add(g)
      }
      if (c.tipo === 'banco') {
        const p = creaPosto(); p.g.position.set(cx, ALTO, cz); scena.add(p.g)
        posti[c.id] = p
      }
    }
    if (stazioni.tagliere) {
      const c = s.celle.find(x => x.nome === 'tagliere')
      coltello = creaColtello(); coltello.scale.setScalar(SCALA_ROBA)
      coltello.position.set(c.x + 0.8, ALTO + 0.1, c.z + 0.62)
      scena.add(coltello)
    }
    scena.traverse(o => { if (o.isMesh && !o.material.transparent && !o.material.isMeshBasicMaterial) o.castShadow = true })
    omino = creaCuoco()
    scena.add(omino.g)
    inMano = creaPosto()
    omino.mano.add(inMano.g)
    for (let i = 0; i < 6; i++) { const m = creaMira(); m.visible = false; scena.add(m); mire.push(m) }
    renderer.shadowMap.needsUpdate = true
  }

  /* ── il dito: i banconi sono scatole, si prende la prima che il raggio incontra; se no è pavimento ── */
  const raggio = new Raycaster(), punto = new Vector2(), qui = new Vector3(), terra = new Plane(new Vector3(0, 1, 0), 0)
  function cosaCe(x, y) {
    if (!q) return null
    const r = canvas.getBoundingClientRect()
    punto.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1)
    raggio.setFromCamera(punto, camera)
    let meglio = null, vicino = Infinity
    for (const s of scatole) {
      const p = raggio.ray.intersectBox(s.b, qui)
      if (p && p.distanceTo(raggio.ray.origin) < vicino) { vicino = p.distanceTo(raggio.ray.origin); meglio = s.id }
    }
    if (meglio) return { id: meglio }
    if (!raggio.ray.intersectPlane(terra, qui)) return null
    const cx = Math.floor(qui.x), cz = Math.floor(qui.z)
    return cx >= 0 && cz >= 0 && cx < largo && cz < fondo ? { x: cx, z: cz } : null
  }

  /* ── ogni fotogramma si guarda lo stato ── */
  function aggiornaStazione(nome, t) {
    const s = q.stazioni[nome], x = stazioni[nome], u = x.g.userData
    const acceso = s.fase === 'cuoce' || s.fase === 'pronta'
    if (u.fiamme) {
      u.fiamme.visible = acceso
      u.fiamme.children.forEach((f, i) => { f.scale.y = 0.8 + 0.35 * Math.sin(t * 16 + i * 1.7) })
    }
    if (u.acqua) u.acqua.material.color.setHex(ACQUA[s.fase])
    if (u.bolle) {
      u.bolle.visible = acceso
      if (acceso) u.bolle.children.forEach((b, i) => {
        const f = (t * (0.9 + (i % 4) * 0.25) + i * 0.37) % 1, a = i * 2.4
        b.position.set(Math.cos(a) * 0.5 * ((i * 7) % 10) / 10, 0.02, Math.sin(a) * 0.5 * ((i * 3) % 10) / 10)
        b.scale.setScalar(Math.sin(f * Math.PI))
      })
    }
    if (u.brace) u.brace.material.color.setHex(acceso ? 0xff7a1f : s.fase === 'scotta' ? 0x2b1a12 : 0x8a3a18)
    const firma = `${s.fase === 'scotta'}|${s.cosa}|${s.colpi}|${s.fase === 'taglia'}|${s.fase === 'cuoce'}`
    if (u.firma !== firma) {
      u.firma = firma
      u.dentro.clear()
      if (s.cosa) {
        if (nome === 'tagliere') {
          if (s.fase === 'taglia') {
            const testa = confezione('insalata'); testa.scale.setScalar(0.74 - s.colpi * 0.1); u.dentro.add(testa)
            if (s.colpi) { const f = cibo('insalata'); f.position.set(0.32, 0, 0); f.scale.setScalar(0.4 + s.colpi * 0.09); u.dentro.add(f) }
          } else u.dentro.add(cibo('insalata'))
        } else u.dentro.add(cibo(s.cosa, { bruciato: s.fase === 'scotta', crudo: s.fase === 'cuoce' }))
        u.dentro.traverse(o => { if (o.isMesh) o.castShadow = true })
      }
      renderer.shadowMap.needsUpdate = true
    }
    const q01 = Math.max(0, Math.min(1, quanto(s)))
    const mostra = s.fase === 'cuoce' || s.fase === 'pronta' || s.fase === 'taglia'
    x.barra.visible = mostra
    if (mostra) {
      x.barra.quaternion.copy(camera.quaternion)
      const p = x.barra.userData.pieno
      p.scale.x = Math.max(0.001, q01)
      p.position.x = -0.57 * (1 - q01)
      p.material.color.setHex(s.fase === 'pronta' ? 0xffa62b : 0x4fb36b)
    }
    // pronta chiama: sussulta. Bruciata fuma nero, sul fuoco fuma bianco
    if (u.tiene && nome !== 'tagliere') { const b = s.fase === 'pronta' ? 1 + 0.05 * Math.sin(t * 10) : 1; u.tiene.scale.setScalar(b) }
    const colore = s.fase === 'scotta' ? 0x2c2a28 : 0xffffff, vivo = s.fase === 'scotta' ? 0.75 : (nome === 'pentola' && acceso) ? 0.4 : 0
    x.fumo.children.forEach((p, i) => {
      const f = (t * 0.5 + i / 5) % 1
      p.position.set(Math.sin(i * 2.4 + t) * 0.16, f * 0.7, Math.cos(i * 1.3) * 0.14)
      p.scale.setScalar(0.6 + f * 1.3)
      p.material.color.setHex(colore)
      p.material.opacity = vivo * (1 - f)
    })
  }

  let ultimo = performance.now(), giro = 0, vivo = true, fotogrammi = 0, colpi = 0
  function ciclo(ora) {
    if (!vivo) return
    giro = requestAnimationFrame(ciclo)
    const dt = Math.min(0.05, (ora - ultimo) / 1000)
    ultimo = ora
    const t = ora / 1000
    if (q) {
      for (const n of Object.keys(stazioni)) aggiornaStazione(n, t)
      const k = q.cuoco
      omino.g.position.set(k.x, 0, k.z)
      omino.anima(dt, { cammina: k.cammina, porta: !!k.mano, verso: k.verso })
      inMano.metti(k.mano)
      for (const [id, p] of Object.entries(posti)) if (p.metti(q.sopra[id])) renderer.shadowMap.needsUpdate = true
      const c = q.stazioni.tagliere?.colpi || 0
      if (c > colpi) omino.taglia()
      colpi = c
      if (coltello) coltello.visible = !omino.tagliando()
      // dove sta andando: i posti toccati, o il punto del pavimento
      const mete = [...new Set(q.fila)].map(id => q.celle.find(c => c.id === id))
      mire.forEach((m, i) => {
        const b = mete[i]
        const pav = !mete.length && i === 0 ? q.strada.at(-1) : null
        m.visible = !!(b || pav)
        if (!m.visible) return
        if (b) m.position.set(b.x + 0.5, (b.tipo === 'bidone' ? 0.72 : ALTO) + 0.02, b.z + 0.5)
        else m.position.set(pav.x, 0.02, pav.z)
        m.material.opacity = 0.72 + 0.28 * Math.sin(t * 7)
        m.scale.setScalar(pav ? 0.6 : 0.96 + 0.02 * Math.sin(t * 7))
      })
      sente?.(!!k.mano?.pronto)
    }
    renderer.render(scena, camera)
    fotogrammi++
  }
  giro = requestAnimationFrame(ciclo)

  function imposta(stato) {
    if (!q) monta(stato)
    q = stato
  }

  function rilascia() {
    vivo = false
    cancelAnimationFrame(giro)
    osserva.disconnect()
    scena.traverse(o => {
      o.geometry?.dispose()
      for (const m of [o.material].flat()) { m?.map?.dispose(); m?.dispose() }
    })
    rilasciaRenderer(renderer)
  }

  return { imposta, rilascia, cosaCe,
           grafica: () => ({ fotogrammi, chiamate: renderer.info.render.calls, triangoli: renderer.info.render.triangles }),
           // dove sta sullo schermo una cella, o il pavimento `x,z`: per i test
           dove(id) {
             const [x, z] = id.split(',').map(Number), c = q.celle.find(k => k.id === id)
             const p = new Vector3(x + 0.5, c ? ALTO : 0, z + 0.5).project(camera), r = canvas.getBoundingClientRect()
             return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height }
           } }
}
