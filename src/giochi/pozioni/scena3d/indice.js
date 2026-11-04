// La bottega in 3D (three.js, WebGL 2). Vedi docs/pozioni/bottega.md.
// Chi gioca non disegna: la view passa a `imposta(q)` la scena già decisa
// (i misurini col loro livello, le macchie, i colori nel calderone) e
// chiede le animazioni (`ordine`, `pulisci`, `festa`), che tornano una
// promessa quando sono finite. Il tocco del dito torna su con
// `tocca({ che, i })`. Qui non entrano gettoni né regole: la targhetta è
// un testo già scritto, e com'è andata ogni ampolla lo dice la voce.
import { WebGLRenderer, Scene, PerspectiveCamera, HemisphereLight, DirectionalLight, Raycaster, Vector2, Vector3,
         ACESFilmicToneMapping, SRGBColorSpace, Color, Fog } from 'three'
import { segui, rilascia as rilasciaRenderer } from '../../../grafica/rilascio3d.js'
import { creaBanco, POSTI } from './banco.js'
import { creaVasi, ALTEZZA_VASO, TACCA } from './vasi.js'
import { creaAmpolle } from './ampolle.js'
import { creaEffetti } from './effetti.js'
import * as T from './trame.js'

const FOV = 46
const SOGLIA = 16               // sotto, un dito è ancora fermo (docs/core/il-dito.md)
const LARGO = 6.9, PROFONDO = 7.4
const DAVANTI = 3.2            // il bordo del bancone: in fondo allo schermo, mai più su
const VERSO = new Vector3(0, 0.6, 0.8).normalize()

export function creaBottega3d(canvas, { tocca, perso, dpr } = {}) {
  let gl = null, renderer
  try {
    gl = canvas.getContext('webgl2', { alpha: false, antialias: true, depth: true, stencil: false, powerPreference: 'high-performance' })
  } catch (e) { gl = null }
  if (!gl || gl.isContextLost()) return null
  try { renderer = segui(new WebGLRenderer({ canvas, context: gl, antialias: true })) } catch (e) { return null }
  let tutto
  try { tutto = costruisci(renderer, canvas, { tocca, dpr }) } catch (e) {
    console.warn('pozioni 3D: niente disegno', e)
    try { renderer.dispose() } catch (x) { /* pazienza */ }
    return null
  }
  const perdi = e => { e.preventDefault(); perso?.() }
  canvas.addEventListener('webglcontextlost', perdi)
  const via = tutto.rilascia
  tutto.rilascia = () => { canvas.removeEventListener('webglcontextlost', perdi); via() }
  return tutto
}

function costruisci(renderer, canvas, { tocca, dpr: fisso }) {
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  const scena = new Scene()
  scena.background = new Color(0x150f22)
  scena.fog = new Fog(0x150f22, 12, 22)
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 60)
  scena.add(new HemisphereLight(0xb6a6ff, 0x3a2414, 1.1))
  const chiave = new DirectionalLight(0xffe2b8, 2.2); chiave.position.set(3, 8, 6); scena.add(chiave)
  const dietro = new DirectionalLight(0x7f8cff, 0.9); dietro.position.set(-4, 5, -6); scena.add(dietro)

  const trame = { legno: T.legno(), mattoni: T.mattoni(), polvere: T.grana('polvere'), radice: T.grana('radice'),
                  morbido: T.morbido(), macchia: T.macchia() }
  const banco = creaBanco(scena, trame)
  const vasi = creaVasi(scena, trame)
  const ampolle = creaAmpolle(scena, trame)
  const eff = creaEffetti(scena, trame)

  /* ── le animazioni: col tempo, mai coi fotogrammi (docs/core/interfaccia.md) ── */
  let attive = []
  const anima = (durata, passo) => new Promise(fine => attive.push({ t: 0, durata, passo, fine }))
  const aspetta = s => anima(s, () => {})
  const liscio = x => x * x * (3 - 2 * x)

  /* ── la telecamera: tutto il banco dentro, in piedi o coricato ── */
  let W = 1, H = 1, dpr = fisso || Math.min(2, window.devicePixelRatio || 1)
  function misura() {
    const r = canvas.getBoundingClientRect()
    W = Math.max(1, r.width); H = Math.max(1, r.height)
    renderer.setPixelRatio(dpr)
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    const t = Math.tan(FOV * Math.PI / 360)
    const d = Math.max(LARGO / 2 / (t * camera.aspect), PROFONDO / 2 / t)
    // si sposta la mira finché il bordo basso dello schermo cade sul bordo del bancone:
    // in piedi avanza muro sopra (lì c'è la pergamena), mai tavolo vuoto sotto
    const mira = new Vector3(0, 0.55, 0.25), giu = new Vector3()
    for (let n = 0; n < 6; n++) {
      camera.position.copy(mira).addScaledVector(VERSO, d)
      camera.lookAt(mira)
      camera.updateMatrixWorld()
      camera.updateProjectionMatrix()
      giu.set(0, -1, 0.5).unproject(camera).sub(camera.position).normalize()
      const z = camera.position.z + giu.z * (-camera.position.y / giu.y)
      mira.z += (DAVANTI - z) * 0.9
    }
    eff.scala(H * dpr / (2 * t))
  }
  const osserva = new ResizeObserver(misura)
  osserva.observe(canvas)
  misura()

  /* ── il dito: un tocco fermo (sotto la soglia) chiede cosa c'è sotto ── */
  const raggio = new Raycaster(), punto = new Vector2()
  let giu = null
  const premi = e => { giu = { x: e.clientX, y: e.clientY, id: e.pointerId } }
  const alza = e => {
    const g = giu; giu = null
    if (!g || g.id !== e.pointerId || Math.hypot(e.clientX - g.x, e.clientY - g.y) > SOGLIA) return
    const r = canvas.getBoundingClientRect()
    punto.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    raggio.setFromCamera(punto, camera)
    const bersagli = [...vasi.colpibili(), ...eff.macchieVisibili()]
    const colpito = raggio.intersectObjects(bersagli, false)[0]
    if (colpito) tocca?.(colpito.object.userData.tocca)
  }
  const lascia = () => { giu = null }
  canvas.addEventListener('pointerdown', premi)
  canvas.addEventListener('pointerup', alza)
  canvas.addEventListener('pointercancel', lascia)

  /* ── il ciclo ── */
  let ultimo = performance.now(), giro = 0, vivo = true, fotogrammi = 0
  function ciclo(ora) {
    if (!vivo) return
    giro = requestAnimationFrame(ciclo)
    const dt = Math.min(0.05, (ora - ultimo) / 1000)   // un telefono posato non fa saltare le animazioni
    ultimo = ora
    const t = ora / 1000
    attive = attive.filter(a => {
      a.t = Math.min(a.durata, a.t + dt)
      a.passo(a.durata ? a.t / a.durata : 1, dt)
      if (a.t >= a.durata) { a.fine(); return false }
      return true
    })
    banco.aggiorna(dt, t)
    vasi.aggiorna(dt, t)
    ampolle.aggiorna(dt, t)
    eff.aggiorna(dt)
    renderer.render(scena, camera)
    fotogrammi++
  }
  giro = requestAnimationFrame(ciclo)

  /* ── la scena decisa dalla view ──
     Mentre un'animazione gira la scena nuova si tiene da parte, e si mette
     alla fine: niente salta sotto un'ampolla in volo. */
  let ultima = null, occupata = 0
  function imposta(q) {
    ultima = q
    if (occupata) return
    vasi.imposta(q.vasi)
    banco.colore(q.calderone)
    const sporchi = new Set(q.macchie.map(m => m.i))
    for (const m of q.macchie) if (!eff.macchia(m.i).visible) mettiMacchia(m, 1)
    for (const [i, m] of eff.macchie) if (!sporchi.has(i)) m.visible = false
  }
  const occupa = fai => async (...a) => {
    occupata++
    try { return await fai(...a) } finally { if (!--occupata && ultima) imposta(ultima) }
  }

  // attorno alla base del misurino: davanti la coprirebbero le targhette
  const grande = i => 1.5 * vasi.vaso(i).gruppo.scale.x
  function mettiMacchia({ i, colore }, quanto) {
    const v = vasi.vaso(i), m = eff.macchia(i)
    m.visible = true
    m.material.color.set(colore).offsetHSL(0, 0.1, -0.08)
    m.position.set(v.casa.x, 0.015 + i * 0.002, v.casa.z + 0.1)
    m.scale.setScalar(Math.max(0.001, quanto * grande(i)))
  }

  /* L'ordine: le ampolle arrivano sul bancone con la loro targhetta, e il
     mercante le versa una alla volta nell'ordine scritto. Ogni voce dice
     già com'è andata (`trabocca`, il livello e i pezzi dopo). I misurini
     arrivati alla tacca si versano nel calderone alla fine, così
     un'ampolla di troppo trabocca da un misurino ancora pieno. */
  async function ordine(voci, dopoOgni) {
    const toccati = [...new Set(voci.map(v => v.i))]
    for (const i of toccati) vasi.trattieni(i, true)
    ampolle.consegna(voci)
    await aspetta(0.6 + voci.length * 0.25)
    for (let k = 0; k < voci.length; k++) {
      await versaUna(k, voci[k])
      dopoOgni?.(k)
      await aspetta(0.15)
    }
    ampolle.sgombra()
    for (const i of toccati) {
      const ultimaVoce = voci.filter(v => v.i === i).at(-1)
      if (voci.some(v => v.i === i && v.pieno)) await nelCalderone(i, ultimaVoce.colore)
    }
    for (const i of toccati) vasi.trattieni(i, false)
  }

  async function versaUna(k, { i, trabocca, colore, famiglia, livello, pezzi }) {
    const v = vasi.vaso(i)
    const a = ampolle.stacca(k)
    const da = a.gruppo.position.clone()
    const bocca = vasi.bocca(i)
    const radice = famiglia === 'lunghezza', polvere = famiglia === 'massa'
    const sopra = new Vector3(bocca.x - (radice ? 0 : 0.42), bocca.y + 0.85, bocca.z + 0.05)
    // il volo, ad arco; la targhetta si legge fino all'ultimo
    await anima(0.5, f => {
      const e = liscio(f)
      a.gruppo.position.lerpVectors(da, sopra, e)
      a.gruppo.position.y += Math.sin(e * Math.PI) * 0.8
      a.cartello.material.opacity = 1 - Math.max(0, e - 0.6) / 0.4
      if (radice) a.corpo.rotation.z = e * Math.PI / 2
    })
    const prima = v.livello
    if (radice) {
      // la radice si mette in piedi e scivola giù nel vetro
      const giuY = vasi.fondo(i).y + a.corpo.userData.lungo / 2 - 0.2
      await anima(trabocca ? 0.35 : 0.5, f => { a.gruppo.position.y = sopra.y + (giuY - sopra.y) * f * f })
      if (trabocca) {
        // sporge dal bordo: si rovescia e cade sul tavolo
        const fermo = a.gruppo.position.clone()
        eff.gocce.emetti(18, { da: bocca, sparpaglia: 0.3, verso: [0.6, 1.4, 0.6], caso: 1.2, colore, vita: 0.9, misura: 0.09, gravita: 6 })
        await anima(0.5, f => {
          a.gruppo.position.set(fermo.x + f * 0.6, fermo.y + Math.sin(f * Math.PI) * 0.4 - f * (fermo.y - 0.1), fermo.z + f * 0.5)
          a.corpo.rotation.z = Math.PI / 2 - f * Math.PI / 2
        })
        const m = eff.macchia(i), era = m.visible ? m.scale.x : 0.001
        mettiMacchia({ i, colore }, era / grande(i))
        await anima(0.35, f => { m.scale.setScalar(Math.max(era, liscio(f) * grande(i))); a.gruppo.scale.setScalar(Math.max(0.001, 1 - f)) })
      } else {
        a.gruppo.visible = false
        vasi.impila(v, pezzi)
        v.pezzi = pezzi.length
        v.livello = livello
        eff.gocce.emetti(10, { da: bocca, sparpaglia: 0.25, verso: [0, 0.8, 0], caso: 0.6, colore: '#d8c8a8', vita: 0.5, misura: 0.06, gravita: 5 })
      }
    } else {
      // si piega e versa: il getto cade fino al livello, che sale
      await anima(0.18, f => { a.gruppo.rotation.z = -liscio(f) * 2.0 })
      const fino = trabocca ? (ALTEZZA_VASO - 0.1) / TACCA : livello   // traboccando, fino all'orlo
      await anima(0.6, f => {
        v.livello = prima + (fino - prima) * liscio(f)
        eff.versa(a.gruppo.localToWorld(a.bocca.clone()), vasi.fondo(i), colore, polvere)
        if (Math.random() < 0.5) eff.gocce.emetti(1, { da: vasi.fondo(i), sparpaglia: 0.2, verso: [0, 0.6, 0], caso: 0.5, colore, vita: 0.35, misura: 0.06, gravita: 4 })
      })
      eff.smetti()
      if (trabocca) {
        // la schiuma esce dal bordo e cola sul tavolo, poi il misurino torna dov'era
        const m = eff.macchia(i), era = m.visible ? m.scale.x : 0.001
        mettiMacchia({ i, colore }, era / grande(i))
        const schiuma = new Color(colore).lerp(new Color(1, 1, 1), 0.5)
        await anima(0.9, f => {
          v.onda = Math.sin(Math.min(1, f * 2) * Math.PI / 2) * 0.15
          if (f < 0.6) eff.gocce.emetti(6, { da: bocca, sparpaglia: 0.5, verso: [0.3, 1.2, 0.5], caso: 1.4, colore: schiuma, vita: 1.1, misura: 0.16, gravita: 5, allarga: 0.6 })
          m.scale.setScalar(Math.max(era, liscio(f) * grande(i)))
          a.gruppo.rotation.z = -2.0 * (1 - f)
          a.gruppo.scale.setScalar(Math.max(0.001, 1 - f))
        })
        await anima(0.4, f => { v.livello = fino + (prima - fino) * liscio(f); v.onda = 0.15 * (1 - f) })
        v.onda = 0
      } else {
        await anima(0.25, f => { a.gruppo.rotation.z = -2.0 * (1 - f); a.gruppo.scale.setScalar(Math.max(0.001, 1 - f)) })
      }
    }
    ampolle.via(k)
  }

  // il misurino pieno si alza, si piega sul calderone e si svuota
  async function nelCalderone(i, colore) {
    const v = vasi.vaso(i)
    await aspetta(0.15)
    eff.luci.emetti(16, { da: vasi.bocca(i).setY(1.3), sparpaglia: 0.5, verso: [0, 1, 0], caso: 1, colore: '#ffe08a', vita: 0.6, misura: 0.12, gravita: 0 })
    const casa = v.casa.clone()
    const C = POSTI.calderone
    const sopra = new Vector3(C.x + (casa.x > C.x ? 0.75 : -0.75), 1.9, C.z + 0.6)
    const lato = casa.x > C.x ? 1 : -1
    await anima(0.5, f => {
      const e = liscio(f)
      v.gruppo.position.lerpVectors(casa, sopra, e)
      v.gruppo.position.y += Math.sin(e * Math.PI) * 0.6
    })
    await anima(0.2, f => { v.gruppo.rotation.z = lato * liscio(f) * 1.9 })
    banco.ribolli(4)
    banco.colore(new Color(banco.coloreOra()).lerp(new Color(colore), 0.5).getStyle())
    const livello = v.livello
    await anima(0.55, f => {
      const b = v.gruppo.localToWorld(new Vector3(0, ALTEZZA_VASO, 0))
      eff.versa(b, new Vector3(b.x, POSTI.brodo + 0.22, b.z), colore, v.famiglia === 'massa')
      if (v.famiglia === 'lunghezza') v.pila.scale.y = Math.max(0.001, 1 - f)
      else v.livello = livello * (1 - f)
      if (Math.random() < 0.6) eff.gocce.emetti(2, { da: new Vector3(C.x + lato * 0.3, POSTI.brodo + 0.25, C.z + 0.3), sparpaglia: 0.4, verso: [0, 1.6, 0], caso: 1, colore, vita: 0.6, misura: 0.1, gravita: 6 })
    })
    eff.smetti()
    v.livello = 0
    await anima(0.2, f => { v.gruppo.rotation.z = lato * 1.9 * (1 - liscio(f)) })
    await anima(0.45, f => { v.gruppo.position.lerpVectors(sopra, casa, liscio(f)) })
    v.pila.scale.y = 1
  }

  // la spugna arriva e gira su ogni macchia, una dopo l'altra
  async function pulisci() {
    const sporche = eff.macchieVisibili()
    if (!sporche.length) return
    const s = eff.spugna
    s.visible = true
    let da = new Vector3(sporche[0].position.x + 2.5, 1.5, sporche[0].position.z + 1.5)
    const fuori = da.clone()
    for (const m of sporche) {
      const qui = m.position.clone(), g0 = m.scale.x
      await anima(0.3, f => { s.position.lerpVectors(da, qui, liscio(f)) })
      await anima(0.8, f => {
        const a = f * Math.PI * 6
        s.position.set(qui.x + Math.cos(a) * 0.6 * (1 - f * 0.4), 0.02, qui.z + 0.35 + Math.sin(a) * 0.25)
        s.rotation.y = Math.sin(a) * 0.4
        m.scale.setScalar(Math.max(0.001, (1 - liscio(f)) * g0))
        if (Math.random() < 0.3) eff.luci.emetti(1, { da: s.position, sparpaglia: 0.3, verso: [0, 0.8, 0], caso: 0.4, colore: '#cfe9ff', vita: 0.5, misura: 0.08, gravita: 0 })
      })
      m.visible = false
      da = s.position.clone()
    }
    await anima(0.3, f => { s.position.lerpVectors(da, fuori, liscio(f)) })
    s.visible = false
  }

  // la pozione è pronta: il calderone sbuffa del suo colore, con le scintille
  async function festa(colore) {
    banco.ribolli(6)
    const C = POSTI.calderone
    const su = new Vector3(C.x, POSTI.brodo + 0.3, C.z)
    await anima(1.4, f => {
      if (f < 0.7) {
        eff.gocce.emetti(5, { da: su, sparpaglia: 1.2, verso: [0, 2.2, 0], caso: 1.2, colore: new Color(colore).lerp(new Color(1, 1, 1), 0.3), vita: 1.6, misura: 0.5, gravita: -0.4, allarga: 2 })
        eff.luci.emetti(4, { da: su, sparpaglia: 1, verso: [0, 3, 0], caso: 2.5, colore: '#fff2b0', vita: 1, misura: 0.12, gravita: 2 })
      }
    })
  }

  function rilascia() {
    vivo = false
    cancelAnimationFrame(giro)
    osserva.disconnect()
    canvas.removeEventListener('pointerdown', premi)
    canvas.removeEventListener('pointerup', alza)
    canvas.removeEventListener('pointercancel', lascia)
    for (const a of attive) a.fine()
    attive = []
    vasi.rilascia(); ampolle.rilascia(); eff.rilascia()
    for (const t of Object.values(trame)) t.dispose()
    rilasciaRenderer(renderer)
  }

  return { imposta, ordine: occupa(ordine), pulisci: occupa(pulisci), festa: occupa(festa), rilascia, misura,
           grafica: () => ({ fotogrammi, chiamate: renderer.info.render.calls, triangoli: renderer.info.render.triangles }) }
}
