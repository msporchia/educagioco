// La cucina (three.js, WebGL 2): camera fissa dall'alto, la stanza intera dentro. Vedi docs/bancarella/cucina.md.
// Chi gioca non disegna: la scena legge a ogni fotogramma lo stato che riceve con `imposta`, e `cosaCe` dice cosa c'è sotto
// il dito. Qui non entrano regole né prezzi.
import { WebGLRenderer, Scene, PerspectiveCamera, HemisphereLight, DirectionalLight, Vector3, ACESFilmicToneMapping, SRGBColorSpace, Color,
         Mesh, SphereGeometry, MeshBasicMaterial, Group, PMREMGenerator, PCFSoftShadowMap, Raycaster, Plane, Vector2, Box3 } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { segui, rilascia as rilasciaRenderer } from '../rilascio3d.js'
import { creaPentola, creaPadella, creaTagliere, creaColtello, creaForno, creaPiatto, riempiPiatto, creaBarra } from './pezzi.js'
import { confezione, cibo } from './cibo.js'
import { creaSala, creaCassetta, creaPila, creaCestino, creaConsegna, creaLavello, creaMira, ALTO } from './sala.js'
import { creaCuoco } from './omino.js'

const FOV = 20     // stretto: da vicino la fila davanti si allargava fuori dallo schermo
const VERSO = new Vector3(0, 0.9, 0.46).normalize()
const SCALA_ROBA = 0.5      // i pezzi di cucina sono fatti per il banco col dito: qui stanno in una cella
const COSTRUISCI = { pentola: creaPentola, padella: creaPadella, tagliere: creaTagliere, forno: creaForno }
// quanto sporge dal piano quello che si tocca: il forno e la finestra si toccano anche in alto
const SOPRA = { lavello: 0.45, forno: 0.8, cassetta: 0.3, consegna: 1.4, bidone: 0.15, pentola: 0.5, padella: 0.25 }
const TAGLIATO = { insalata: 'insalata', formaggio: 'formaggio-cubetti', pesce: 'pesce-fette', pomodoro: 'pomodoro-tagliato' }
const ACQUA = { vuota: 0xa9d6ee, cuoce: 0x9fd0ea, pronta: 0xf1dd9a, scotta: 0xa9743c }

export function creaCucina3d(canvas, { quanto, quantoLavato, tipoDi, perso, dpr } = {}) {
  let gl = null, renderer
  try {
    gl = canvas.getContext('webgl2', { alpha: false, antialias: true, depth: true, stencil: false, powerPreference: 'high-performance' })
  } catch (e) { gl = null }
  if (!gl || gl.isContextLost()) return null
  try { renderer = segui(new WebGLRenderer({ canvas, context: gl, antialias: true })) } catch (e) { return null }
  let tutto
  try { tutto = costruisci(renderer, canvas, { quanto, quantoLavato, tipoDi, dpr }) } catch (e) {
    console.warn('cucina 3D: niente disegno', e)
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
    // senza piatto si vede solo quello che c'è sopra
    piatto.children.forEach(x => { x.visible = !o?.nudo || x === piatto.userData.sopra })
    if (o?.piatto) riempiPiatto(piatto, o)
    if (o?.nudo) piatto.userData.anello.visible = false
    cosa.clear()
    if (o && !o.piatto) cosa.add(figura(o))
    g.traverse(x => { if (x.isMesh && !x.material.transparent && !x.material.isMeshBasicMaterial) x.castShadow = true })
    return true
  } }
}
const figura = o => {
  if (o.bruciata) return cibo(o.cosa === 'impasto' ? 'pizza' : o.cosa, { bruciato: true })
  // in mano la roba è nuda: la tavola dell'impasto e la carta della carne sembrerebbero un piatto
  if (o.cosa === 'impasto') return cibo('impasto-palla')
  if (o.cosa === 'pane') return cibo('toast')
  if (o.cosa === 'carne') return cibo('carne', { crudo: !o.fatta })
  if (o.cosa === 'riso') return cibo('riso')
  if (TAGLIATO[o.cosa] && o.fatta) return tagliato(o.cosa)
  return (o.cosa === 'pasta' || o.cosa === 'uovo') && o.fatta ? cibo(o.cosa) : inCassetta(o.cosa)
}
// il pane qui è già tagliato: una pagnotta intera chiederebbe il tagliere
const inCassetta = cosa => (cosa === 'pane' ? cibo('pane-fette') : confezione(cosa))
function tagliato(cosa) {
  const f = cibo(TAGLIATO[cosa])
  if (cosa === 'formaggio') f.scale.setScalar(1.7)     // i cubetti sono fatti per stare sull'insalata: da soli non si vedono
  return f
}

function costruisci(renderer, canvas, { quanto, quantoLavato, tipoDi, dpr: fisso }) {
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
  const chiave = new DirectionalLight(0xfff0d8, 1.9); chiave.position.set(1, 11, 8); chiave.target.position.set(2.5, 0, 5)
  chiave.castShadow = true
  chiave.shadow.mapSize.set(1024, 1024)
  chiave.shadow.camera.left = -6; chiave.shadow.camera.right = 6; chiave.shadow.camera.top = 9; chiave.shadow.camera.bottom = -9
  chiave.shadow.camera.far = 22; chiave.shadow.bias = -0.0006; chiave.shadow.normalBias = 0.02
  scena.add(chiave, chiave.target)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap
  renderer.shadowMap.autoUpdate = false    // il cuoco ha un'ombra finta: quelle vere si rifanno solo se cambia cosa c'è sui banchi

  /* ── la telecamera: tutta la stanza dentro, in piedi o coricato ── */
  let W = 1, H = 1, q = null, largo = 5, fondo = 10
  const MIRA = new Vector3()
  const dpr = fisso || Math.min(2, window.devicePixelRatio || 1)
  function misura() {
    const r = canvas.getBoundingClientRect()
    W = Math.max(1, r.width); H = Math.max(1, r.height)
    renderer.setPixelRatio(dpr)
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    const t = Math.tan(FOV * Math.PI / 360)
    // la stanza cambia da una cucina all'altra: si inquadra quella che c'è
    MIRA.set(largo / 2, 0.2, fondo * 0.46)
    camera.position.copy(MIRA).addScaledVector(VERSO, Math.max((largo + 0.3) / 2 / (t * camera.aspect), (fondo + 0.9) / 2 / t))
    camera.lookAt(MIRA)
    camera.clearViewOffset()
    camera.updateMatrixWorld()
    camera.updateProjectionMatrix()
    // sullo schermo lungo avanza spazio: la stanza scende in fondo, e sopra resta il muro
    const giu = new Vector3(largo / 2, 0, fondo).project(camera), avanza = H * (0.5 + giu.y / 2) - 6
    if (avanza > 0) camera.setViewOffset(W, H, 0, -avanza, W, H)
    camera.updateProjectionMatrix()
  }
  const osserva = new ResizeObserver(misura)
  osserva.observe(canvas)
  misura()

  /* ── le cose in scena: si mettono al primo `imposta`, secondo la cucina ── */
  const stazioni = {}, posti = {}
  let omino = null, inMano = null, pila = null, lavello = null, barraLavello = null, mira = null
  const scatole = [], coltelli = {}
  let tagliereInUso = ''
  function monta(s) {
    largo = s.largo; fondo = s.fondo
    creaSala(scena, s.celle, largo, fondo)
    for (const c of s.celle) {
      const cx = c.x + 0.5, cz = c.z + 0.5
      scatole.push({ id: c.id, b: new Box3(new Vector3(c.x, 0, c.z), new Vector3(c.x + 1, ALTO + (SOPRA[c.tipo === 'stazione' ? tipoDi(c.nome) : c.tipo] || 0.1), c.z + 1)) })
      if (c.tipo === 'stazione') {
        const tipo = tipoDi(c.nome)
        const g = COSTRUISCI[tipo]()
        g.scale.setScalar(SCALA_ROBA)
        g.position.set(cx, ALTO, cz)
        if (tipo === 'padella') g.rotation.y = Math.PI                        // il manico verso chi cucina, non sul vicino
        if (tipo === 'forno') g.rotation.y = -Math.PI / 2        // la bocca verso la stanza
        const barra = creaBarra(); barra.scale.setScalar(0.62); barra.position.set(cx, ALTO + (tipo === 'forno' ? 1.05 : 0.8), cz)
        const fumo = new Group(); fumo.position.set(cx, ALTO + (tipo === 'forno' ? 0.85 : 0.55), cz)
        for (let i = 0; i < 5; i++) fumo.add(new Mesh(new SphereGeometry(0.1, 8, 6), new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })))
        scena.add(g, barra, fumo)
        stazioni[c.nome] = { g, barra, fumo, tipo }
        if (tipo === 'tagliere') {
          const k = creaColtello(); k.scale.setScalar(SCALA_ROBA); k.position.set(c.x + 0.8, ALTO + 0.1, c.z + 0.62)
          scena.add(k); coltelli[c.nome] = k
        }
      } else if (c.tipo === 'cassetta') {
        const g = creaCassetta(); g.position.set(cx, ALTO, cz)
        const dentro = inCassetta(c.cosa); dentro.scale.setScalar(c.cosa === 'pesce' ? 0.42 : 0.48); dentro.position.y = 0.1
        g.add(dentro)
        scena.add(g)
      } else if (c.tipo === 'piatti') {
        pila = creaPila(); pila.position.set(cx, ALTO, cz); scena.add(pila)
      } else if (c.tipo === 'bidone') {
        const g = creaCestino(); g.position.set(cx, 0, cz); scena.add(g)
      } else if (c.tipo === 'consegna') {
        const g = creaConsegna(); g.position.set(cx, 0, cz); scena.add(g)
      } else if (c.tipo === 'lavello') {
        lavello = creaLavello(); lavello.position.set(cx, 0, cz); scena.add(lavello)
        barraLavello = creaBarra(); barraLavello.scale.setScalar(0.62); barraLavello.position.set(cx, ALTO + 0.8, cz); scena.add(barraLavello)
      }
      if (c.tipo === 'banco') {
        const p = creaPosto(); p.g.position.set(cx, ALTO, cz); scena.add(p.g)
        posti[c.id] = p
      }
    }
    scena.traverse(o => { if (o.isMesh && !o.material.transparent && !o.material.isMeshBasicMaterial) o.castShadow = true })
    omino = creaCuoco()
    scena.add(omino.g)
    inMano = creaPosto()
    omino.mano.add(inMano.g)
    mira = creaMira(); mira.visible = false; scena.add(mira)
    renderer.shadowMap.needsUpdate = true
    misura()
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
        if (x.tipo === 'tagliere') {
          if (s.fase === 'taglia') {
            const testa = confezione(s.cosa); testa.scale.setScalar(0.74 - s.colpi * 0.1); u.dentro.add(testa)
            if (s.colpi) { const f = cibo(TAGLIATO[s.cosa]); f.position.set(0.32, 0, 0); f.scale.setScalar(0.4 + s.colpi * 0.09); u.dentro.add(f) }
          } else u.dentro.add(tagliato(s.cosa))
        } else u.dentro.add(cibo(s.cosa, { bruciato: s.fase === 'scotta', crudo: s.fase === 'cuoce' }))
        u.dentro.traverse(o => { if (o.isMesh) o.castShadow = true })
      }
      renderer.shadowMap.needsUpdate = true
    }
    const q01 = Math.max(0, Math.min(1, quanto(s)))
    const mostra = s.fase === 'cuoce' || s.fase === 'taglia' || (s.fase === 'pronta' && x.tipo !== 'tagliere')
    x.barra.visible = mostra
    if (mostra) {
      x.barra.quaternion.copy(camera.quaternion)
      const p = x.barra.userData.pieno
      p.scale.x = Math.max(0.001, q01)
      p.position.x = -0.57 * (1 - q01)
      p.material.color.setHex(s.fase === 'pronta' ? 0xffa62b : 0x4fb36b)
    }
    // pronta chiama: sussulta. Bruciata fuma nero, sul fuoco fuma bianco
    if (u.tiene && x.tipo !== 'tagliere') { const b = s.fase === 'pronta' ? 1 + 0.05 * Math.sin(t * 10) : 1; u.tiene.scale.setScalar(b) }
    const colore = s.fase === 'scotta' ? 0x2c2a28 : 0xffffff, vivo = s.fase === 'scotta' ? 0.75 : (x.tipo === 'pentola' && acceso) ? 0.4 : 0
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
      const c = Object.values(q.stazioni).reduce((n, s) => n + s.colpi, 0)
      if (c > colpi) omino.taglia()
      colpi = c
      // il coltello in mano al cuoco è quello del tagliere dove sta lavorando: gli altri restano al loro posto
      tagliereInUso = q.tagliando || tagliereInUso
      for (const [nome, k] of Object.entries(coltelli)) k.visible = !(omino.tagliando() && nome === tagliereInUso)
      pila?.userData.mostra(q.puliti)
      if (lavello) {
        const u = lavello.userData
        u.sporchi.forEach((p, i) => { p.visible = i < q.sporchi })
        u.schiuma.visible = q.lavando
        barraLavello.visible = q.lavando
        if (q.lavando) {
          u.schiuma.children.forEach((b, i) => {
            const a = i * 2.4 + t * 1.6
            b.position.set(Math.cos(a) * 0.24, 0.05 * Math.sin(t * 5 + i), Math.sin(a) * 0.2)
          })
          barraLavello.quaternion.copy(camera.quaternion)
          const p = barraLavello.userData.pieno, f = Math.max(0.001, Math.min(1, quantoLavato(q)))
          p.scale.x = f; p.position.x = -0.57 * (1 - f); p.material.color.setHex(0x4fa8e0)
        }
      }
      // dove sta andando: il posto toccato, o il punto del pavimento
      const meta = q.celle.find(c => c.id === q.fila[0]), pav = meta ? null : q.strada.at(-1)
      mira.visible = !!(meta || pav)
      if (meta) mira.position.set(meta.x + 0.5, (meta.tipo === 'bidone' ? 0.72 : ALTO) + 0.02, meta.z + 0.5)
      else if (pav) mira.position.set(pav.x, 0.02, pav.z)
      mira.material.opacity = 0.72 + 0.28 * Math.sin(t * 7)
      mira.scale.setScalar(pav ? 0.6 : 0.96 + 0.02 * Math.sin(t * 7))
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
