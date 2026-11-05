// La cucina in 3D (three.js, WebGL 2): camera fissa, come il banco delle pozioni. Vedi docs/bancarella/cucina.md.
// Chi gioca non disegna: la scena legge lo stato che riceve con `imposta`, e ogni gesto del dito torna su
// con `azione(mossa)`, che dice se è riuscita. Qui non entrano regole né prezzi.
import { WebGLRenderer, Scene, PerspectiveCamera, HemisphereLight, DirectionalLight, Raycaster, Plane, Vector2, Vector3,
         ACESFilmicToneMapping, SRGBColorSpace, Color, Mesh, SphereGeometry, MeshBasicMaterial, Group } from 'three'
import { segui, rilascia as rilasciaRenderer } from '../rilascio3d.js'
import { creaStanza, creaPentola, creaPadella, creaTagliere, creaColtello, creaForno, creaBidone, creaPiatto, riempiPiatto,
         creaBarra, creaEtichetta, confezione, cibo, ombra } from './modelli.js'

const FOV = 34
const SOGLIA = 16                // sotto, un dito è ancora fermo (docs/core/il-dito.md)
const LARGO = 8.6
const VERSO = new Vector3(0, 0.88, 0.48).normalize()
const MIRA = new Vector3(0, 0.3, 2.4)
const FILA = -2.5, PIATTI = 0.15, DISPENSA = [2.45, 4.05]
const X_STAZIONI = { 1: [0], 2: [-1.5, 1.5], 3: [-2.5, 0, 2.5], 4: [-3, -1, 1, 3] }
const X_PIATTI = { 2: [-1.9, 0.05], 3: [-2.6, -0.8, 1] }
const X_DISPENSA = [-2.7, -0.9, 0.9, 2.7]
const SCALA_DISPENSA = 1.35
const COSTRUISCI = { pentola: creaPentola, padella: creaPadella, tagliere: creaTagliere, forno: creaForno }
const RAGGIO = { pentola: 1, padella: 1, tagliere: 1.05, forno: 1.15 }
const ACQUA = { vuota: 0xa9d6ee, cuoce: 0x9fd0ea, pronta: 0xf1dd9a, scotta: 0xa9743c }

export function creaCucina3d(canvas, { azione, aiuto, presa, perso, dpr } = {}) {
  let gl = null, renderer
  try {
    gl = canvas.getContext('webgl2', { alpha: false, antialias: true, depth: true, stencil: false, powerPreference: 'high-performance' })
  } catch (e) { gl = null }
  if (!gl || gl.isContextLost()) return null
  try { renderer = segui(new WebGLRenderer({ canvas, context: gl, antialias: true })) } catch (e) { return null }
  let tutto
  try { tutto = costruisci(renderer, canvas, { azione, aiuto, presa, dpr }) } catch (e) {
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

function costruisci(renderer, canvas, { azione, aiuto, presa: avvisaPresa, dpr: fisso }) {
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  const scena = new Scene()
  scena.background = new Color(0xe9dfc9)
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 80)
  scena.add(new HemisphereLight(0xfff6e6, 0x8a6f52, 1.7))
  const chiave = new DirectionalLight(0xfff0d8, 2); chiave.position.set(3, 9, 5); scena.add(chiave)
  creaStanza(scena)

  /* ── le animazioni: col tempo, mai coi fotogrammi (docs/core/interfaccia.md) ── */
  let attive = []
  const anima = (durata, passo) => new Promise(fine => attive.push({ t: 0, durata, passo, fine }))
  const liscio = x => x * x * (3 - 2 * x)

  /* ── la telecamera: tutto il banco dentro, in piedi o coricato ── */
  let W = 1, H = 1
  const dpr = fisso || Math.min(2, window.devicePixelRatio || 1)
  function misura() {
    const r = canvas.getBoundingClientRect()
    W = Math.max(1, r.width); H = Math.max(1, r.height)
    renderer.setPixelRatio(dpr)
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    const t = Math.tan(FOV * Math.PI / 360)
    camera.position.copy(MIRA).addScaledVector(VERSO, Math.max(LARGO / 2 / (t * camera.aspect), 7.4 / 2 / t))
    camera.lookAt(MIRA)
    camera.updateMatrixWorld()
    camera.updateProjectionMatrix()
  }
  const osserva = new ResizeObserver(misura)
  osserva.observe(canvas)
  misura()

  /* ── le cose in scena: si mettono al primo `imposta`, secondo la cucina ── */
  let q = null
  const stazioni = {}, piatti = [], dispensa = {}
  let coltello = null, bidone = null
  const fumi = []
  function monta(s) {
    const nomi = Object.keys(s.stazioni), xs = X_STAZIONI[nomi.length]
    nomi.forEach((nome, k) => {
      const g = COSTRUISCI[nome]()
      g.position.set(xs[k], 0, FILA)
      const barra = creaBarra(); barra.position.set(xs[k], nome === 'forno' ? 1.75 : 1.2, FILA + 1.05)
      const fumo = new Group(); fumo.position.set(xs[k], nome === 'forno' ? 1.6 : 0.9, FILA)
      for (let i = 0; i < 5; i++) {
        const p = new Mesh(new SphereGeometry(0.16, 8, 6), new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }))
        fumo.add(p)
      }
      scena.add(g, barra, fumo)
      stazioni[nome] = { g, barra, fumo, casa: g.position.clone(), nome }
      fumi.push(fumo)
    })
    if (stazioni.tagliere) {
      coltello = creaColtello()
      coltello.userData.casa = stazioni.tagliere.casa.clone().add(new Vector3(0.68, 0.17, 0.05))
      coltello.position.copy(coltello.userData.casa)
      scena.add(coltello)
    }
    const xp = X_PIATTI[s.piatti.length]
    s.piatti.forEach((p, i) => {
      const g = creaPiatto(); g.position.set(xp[i], 0, PIATTI); g.userData.casa = g.position.clone()
      scena.add(g); piatti.push(g)
    })
    bidone = creaBidone(); bidone.position.set(2.85, 0, PIATTI)
    const scritta = creaEtichetta('bidone'); scritta.position.set(0, 0.03, 0.75); bidone.add(scritta)
    scena.add(bidone)
    const cose = s.dispensa, una = cose.length <= 4
    cose.forEach((d, i) => {
      const g = new Group()
      const figura = confezione(d.k); figura.scale.setScalar(SCALA_DISPENSA)
      g.add(ombra(0.8), figura)
      g.position.set(X_DISPENSA[i % 4], 0, una ? 3 : DISPENSA[Math.floor(i / 4)])
      const e = creaEtichetta(d.nome); e.position.set(0, 0.03, 0.72); g.add(e)
      scena.add(g)
      dispensa[d.k] = g
    })
  }

  /* ── il dito ── */
  const raggio = new Raycaster(), punto = new Vector2(), qui = new Vector3()
  const inAria = new Plane(new Vector3(0, 1, 0), -1.15)
  const schermo = v => {
    const r = canvas.getBoundingClientRect(), p = v.clone().project(camera)
    return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height }
  }
  const lato = (c, largo) => { const a = schermo(c), b = schermo(c.clone().setX(c.x + largo)); return Math.hypot(b.x - a.x, b.y - a.y) }
  const sulTavolo = (x, y) => {
    const r = canvas.getBoundingClientRect()
    punto.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1)
    raggio.setFromCamera(punto, camera)
    return raggio.ray.intersectPlane(inAria, qui) ? qui : null
  }

  const cosaPresa = id => {
    const [tipo, nome] = id.split(':')
    if (tipo === 'cosa') return dispensa[nome]
    if (tipo === 'piatto') return piatti[+nome]
    if (id === 'coltello') return coltello
    if (id === 'bidone') return bidone
    return stazioni[id]?.g
  }
  const centro = id => {
    const g = cosaPresa(id)
    if (!g) return null
    return g.position.clone().setY(id.startsWith('cosa') ? 0.3 : 0.25)
  }

  // quello che si può prendere adesso
  function prendibili() {
    const out = Object.keys(dispensa).map(k => ({ id: 'cosa:' + k, r: 0.78 }))
    q.piatti.forEach((p, i) => { if (p) out.push({ id: 'piatto:' + i, r: 0.85 }) })
    for (const n of Object.keys(stazioni)) {
      const f = q.stazioni[n].fase
      if (f === 'pronta' || f === 'scotta') out.push({ id: n, r: RAGGIO[n] })
    }
    if (coltello && q.stazioni.tagliere.fase === 'taglia') out.push({ id: 'coltello', r: 0.7 })
    return out
  }
  function piuVicino(lista, x, y) {
    let meglio = null, vicino = Infinity
    for (const v of lista) {
      const c = v.id === 'coltello' ? coltello.position : centro(v.id)
      if (!c) continue
      const a = schermo(c), d = Math.hypot(x - a.x, y - a.y) / lato(c, v.r)
      if (d < 1 && d < vicino) { vicino = d; meglio = v.id }
    }
    return meglio
  }
  // dove si può lasciare: si guarda sullo schermo, con un po' di largo
  function bersaglio(x, y) {
    if (y < canvas.getBoundingClientRect().top + 8) return 'cliente'
    return piuVicino([...piatti.map((_, i) => ({ id: 'piatto:' + i, r: 1 })), ...Object.keys(stazioni).map(n => ({ id: n, r: RAGGIO[n] * 1.1 })),
                      { id: 'bidone', r: 0.85 }], x, y)
  }

  let giu = null, tenuto = null
  function prendi(id, e) {
    const [tipo, nome] = id.split(':')
    tenuto = { id, tipo, nome }
    if (tipo === 'cosa') {
      tenuto.obj = confezione(nome); tenuto.obj.scale.setScalar(SCALA_DISPENSA); scena.add(tenuto.obj); tenuto.copia = true
    } else if (tipo === 'piatto') {
      tenuto.obj = piatti[+nome]
      tenuto.pronto = q.piatti[+nome]?.pronto
    } else if (id === 'coltello') {
      tenuto.obj = coltello; tenuto.sopra = null
    } else if (id === 'forno') {
      const s = q.stazioni.forno
      tenuto.obj = cibo('pizza', { bruciato: s.fase === 'scotta' }); scena.add(tenuto.obj); tenuto.copia = true
      stazioni.forno.g.userData.dentro.visible = false
    } else if (id === 'tagliere') {
      tenuto.obj = cibo('insalata'); scena.add(tenuto.obj); tenuto.copia = true
      stazioni.tagliere.g.userData.dentro.visible = false
    } else {
      // pentola e padella si prendono per il manico: vanno in mano intere
      const g = stazioni[id].g.userData.tiene
      tenuto.obj = g; tenuto.base = stazioni[id].casa; tenuto.locale = true
    }
    avvisaPresa?.(!!tenuto.pronto)
    canvas.setPointerCapture?.(e.pointerId)
  }
  function posiziona(x, y) {
    const p = sulTavolo(x, y)
    if (!p || !tenuto) return
    const o = tenuto.obj
    if (tenuto.locale) o.position.copy(p).sub(tenuto.base)
    else if (tenuto.id === 'coltello') o.position.set(p.x, 0.75, p.z)
    else o.position.copy(p)
  }

  const premi = e => {
    giu = { x: e.clientX, y: e.clientY, id: e.pointerId, mosso: false }
    if (!q || tenuto) return
    const id = piuVicino(prendibili(), e.clientX, e.clientY)
    if (id) prendi(id, e)
  }
  const muovi = e => {
    if (!giu || giu.id !== e.pointerId) return
    if (Math.hypot(e.clientX - giu.x, e.clientY - giu.y) > SOGLIA) giu.mosso = true
    if (!tenuto || !giu.mosso) return
    posiziona(e.clientX, e.clientY)
    // il coltello: ogni volta che passa da dietro a davanti del tagliere è un taglio
    if (tenuto.id === 'coltello') {
      const c = stazioni.tagliere.casa, dx = Math.abs(coltello.position.x - c.x), dz = coltello.position.z - c.z
      if (dx < 1.1 && Math.abs(dz) < 1.6) {
        const davanti = dz > 0
        if (tenuto.sopra === false && davanti) azione?.({ che: 'taglia' })
        tenuto.sopra = davanti
      }
    }
  }

  const aCasaPentola = (o, da) => anima(0.2, t => { o.position.lerpVectors(da, o.userData.vera, liscio(t)) })
  async function rimetti(t) {
    if (t.copia) {
      const o = t.obj
      await anima(0.15, x => o.scale.setScalar(1 - x * 0.7))
      scena.remove(o)
      return
    }
    const o = t.obj, da = o.position.clone()
    const casa = t.tipo === 'piatto' ? o.userData.casa : t.id === 'coltello' ? o.userData.casa : o.userData.vera
    o.rotation.set(0, 0, 0)
    await anima(0.2, x => o.position.lerpVectors(da, casa, liscio(x)))
  }
  // rovesciare: la pentola si inclina sul piatto e poi torna
  async function rovescia(t) {
    const o = t.obj
    await anima(0.3, x => { o.rotation.z = -liscio(x) * 1.5 })
    await anima(0.14, x => { o.rotation.z = -1.5 + liscio(x) * 1.5 })
  }

  const alza = e => {
    const g = giu; giu = null
    const t = tenuto
    tenuto = null
    avvisaPresa?.(false)
    for (const n of ['forno', 'tagliere']) if (stazioni[n]) stazioni[n].g.userData.dentro.visible = true
    if (!t) {
      if (g && !g.mosso) aiuto?.(piuVicino(prendibili().concat(Object.keys(stazioni).map(n => ({ id: n, r: RAGGIO[n] }))), e.clientX, e.clientY))
      return
    }
    if (!g || !g.mosso) { aiuto?.(t.id); rimetti(t); return }
    if (t.id === 'coltello') { rimetti(t); return }
    const su = bersaglio(e.clientX, e.clientY)
    const [tipo, n] = (su || '').split(':')
    const i = tipo === 'piatto' ? +n : null
    let mossa = null
    if (t.tipo === 'cosa' && su && su !== 'bidone' && su !== 'cliente') mossa = { che: 'metti', cosa: t.nome, dove: i ?? su }
    else if (t.tipo === 'piatto') {
      if (su === 'cliente') mossa = { che: 'servi', i: +t.nome }
      else if (su === 'bidone') mossa = { che: 'buttaPiatto', i: +t.nome }
      else if (su === 'forno') mossa = { che: 'inforna', i: +t.nome }
    } else if (t.tipo !== 'cosa') {
      if (su === 'bidone') mossa = { che: 'butta', nome: t.id }
      else if (i !== null) mossa = { che: 'svuota', nome: t.id, i }
    }
    const fatta = mossa ? azione?.(mossa) : false
    if (!fatta && su) aiuto?.('no')
    if (fatta && mossa.che === 'svuota' && t.locale) { rovescia(t).then(() => rimetti(t)); return }
    rimetti(t)
  }
  const annulla = () => {
    giu = null
    const t = tenuto; tenuto = null
    avvisaPresa?.(false)
    if (t) rimetti(t)
  }
  canvas.addEventListener('pointerdown', premi)
  canvas.addEventListener('pointermove', muovi)
  canvas.addEventListener('pointerup', alza)
  canvas.addEventListener('pointercancel', annulla)

  /* ── ogni fotogramma si guarda lo stato ── */
  function aggiornaStazione(nome, t) {
    const s = q.stazioni[nome], x = stazioni[nome], u = x.g.userData, tenutaQui = tenuto?.id === nome
    const acceso = s.fase === 'cuoce' || s.fase === 'pronta'
    if (u.fiamme) {
      u.fiamme.visible = acceso
      u.fiamme.children.forEach((f, i) => { f.scale.y = 0.8 + 0.35 * Math.sin(t * 16 + i * 1.7) })
    }
    if (u.acqua) u.acqua.material.color.setHex(ACQUA[s.fase])
    if (u.brace) u.brace.material.color.setHex(acceso ? 0xff8a2b : s.fase === 'scotta' ? 0x2b1a12 : 0x3a3029)
    const firma = `${s.fase === 'scotta'}|${s.cosa}|${s.colpi}|${s.fase === 'taglia'}|${s.fase === 'cuoce'}`
    if (u.firma !== firma) {
      u.firma = firma
      u.dentro.clear()
      if (s.cosa) {
        if (nome === 'tagliere') {
          if (s.fase === 'taglia') {
            const testa = confezione('insalata'); testa.scale.setScalar(1 - s.colpi * 0.24); u.dentro.add(testa)
            if (s.colpi) { const f = cibo('insalata'); f.position.set(0.3, 0, 0); f.scale.setScalar(0.45 + s.colpi * 0.15); u.dentro.add(f) }
          } else u.dentro.add(cibo('insalata'))
        } else u.dentro.add(cibo(s.cosa, { bruciato: s.fase === 'scotta', crudo: s.fase === 'cuoce' }))
      }
    }
    // la barra
    const q01 = Math.max(0, Math.min(1, q.quanto(s)))
    const mostra = s.fase === 'cuoce' || s.fase === 'pronta' || s.fase === 'taglia'
    x.barra.visible = mostra && !tenutaQui
    if (mostra) {
      x.barra.quaternion.copy(camera.quaternion)
      const p = x.barra.userData.pieno
      p.scale.x = Math.max(0.001, q01)
      p.position.x = -0.57 * (1 - q01)
      p.material.color.setHex(s.fase === 'pronta' ? 0xffa62b : 0x4fb36b)
    }
    // pronta chiama: sussulta. Bruciata fuma nero, sul fuoco fuma bianco
    if (u.tiene && !tenutaQui) { const b = s.fase === 'pronta' ? 1 + 0.035 * Math.sin(t * 10) : 1; u.tiene.scale.setScalar(b) }
    const colore = s.fase === 'scotta' ? 0x2c2a28 : 0xffffff, vivo = s.fase === 'scotta' ? 0.75 : (nome === 'pentola' && acceso) ? 0.4 : 0
    x.fumo.children.forEach((p, i) => {
      const f = (t * 0.5 + i / 5) % 1
      p.position.set(Math.sin(i * 2.4 + t) * 0.28, f * 1.1, Math.cos(i * 1.3) * 0.25)
      p.scale.setScalar(0.6 + f * 1.3)
      p.material.color.setHex(colore)
      p.material.opacity = vivo * (1 - f)
    })
  }

  let ultimo = performance.now(), giro = 0, vivo = true, fotogrammi = 0
  function ciclo(ora) {
    if (!vivo) return
    giro = requestAnimationFrame(ciclo)
    const dt = Math.min(0.05, (ora - ultimo) / 1000)
    ultimo = ora
    const t = ora / 1000
    attive = attive.filter(a => {
      a.t = Math.min(a.durata, a.t + dt)
      a.passo(a.durata ? a.t / a.durata : 1, dt)
      if (a.t >= a.durata) { a.fine(); return false }
      return true
    })
    if (q) {
      for (const n of Object.keys(stazioni)) aggiornaStazione(n, t)
      q.piatti.forEach((p, i) => riempiPiatto(piatti[i], p))
      if (coltello) coltello.visible = q.stazioni.tagliere.fase === 'taglia'
    }
    renderer.render(scena, camera)
    fotogrammi++
  }
  giro = requestAnimationFrame(ciclo)

  function imposta(stato) {
    if (!q) {
      monta(stato)
      for (const x of Object.values(stazioni)) { const v = x.g.userData.tiene; if (v) v.userData.vera = v.position.clone() }
    }
    q = stato
  }

  function rilascia() {
    vivo = false
    cancelAnimationFrame(giro)
    osserva.disconnect()
    canvas.removeEventListener('pointerdown', premi)
    canvas.removeEventListener('pointermove', muovi)
    canvas.removeEventListener('pointerup', alza)
    canvas.removeEventListener('pointercancel', annulla)
    scena.traverse(o => {
      o.geometry?.dispose()
      for (const m of [o.material].flat()) { m?.map?.dispose(); m?.dispose() }
    })
    rilasciaRenderer(renderer)
  }

  return { imposta, rilascia,
           grafica: () => ({ fotogrammi, chiamate: renderer.info.render.calls, triangoli: renderer.info.render.triangles }),
           // dove sta sullo schermo, per i test e per chi trascina da fuori
           dove(id) {
             if (id === 'cliente') { const r = canvas.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top - 20 } }
             const c = id === 'coltello' ? coltello?.position : centro(id)
             return c ? schermo(c) : null
           } }
}
