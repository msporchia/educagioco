// La bottega in 3D (three.js, WebGL 2). Vedi docs/pozioni/regole.md.
// Chi gioca non disegna: la view passa a `imposta(q)` la scena già decisa
// (i misurini col loro livello, le macchie, i colori nel calderone) e
// chiede le animazioni (`ordine`, `pulisci`, `festa`), che tornano una
// promessa quando sono finite. Il tocco del dito torna su con
// `tocca({ che, i })`. Qui non entrano gettoni né regole: la targhetta è
// un testo già scritto, e com'è andata ogni ampolla lo dice la voce.
import { WebGLRenderer, Scene, PerspectiveCamera, HemisphereLight, DirectionalLight, Raycaster, Plane, Vector2, Vector3,
         ACESFilmicToneMapping, SRGBColorSpace, Color, Fog } from 'three'
import { segui, rilascia as rilasciaRenderer } from '../../../grafica/rilascio3d.js'
import { creaBanco, POSTI } from './banco.js'
import { creaVasi, ALTEZZA_VASO, TACCA } from './vasi.js'
import { creaAmpolle } from './ampolle.js'
import { creaEffetti } from './effetti.js'
import { creaAttrezzi } from './attrezzi.js'
import { suoni } from '../suoni.js'
import * as T from './trame.js'

const FOV = 46
const SOGLIA = 16               // sotto, un dito è ancora fermo (docs/core/il-dito.md)
const LARGO = 6.9, PROFONDO = 7.4
const DAVANTI = 3.2            // il bordo del bancone: in fondo allo schermo, mai più su
const VERSO = new Vector3(0, 0.6, 0.8).normalize()

export function creaBottega3d(canvas, { tocca, lascia, perso, dpr } = {}) {
  let gl = null, renderer
  try {
    gl = canvas.getContext('webgl2', { alpha: false, antialias: true, depth: true, stencil: false, powerPreference: 'high-performance' })
  } catch (e) { gl = null }
  if (!gl || gl.isContextLost()) return null
  try { renderer = segui(new WebGLRenderer({ canvas, context: gl, antialias: true })) } catch (e) { return null }
  let tutto
  try { tutto = costruisci(renderer, canvas, { tocca, lascia, dpr }) } catch (e) {
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

function costruisci(renderer, canvas, { tocca, lascia, dpr: fisso }) {
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
                  morbido: T.morbido(), macchia: T.macchia(), quadrante: T.quadrante(), metro: T.metro() }
  const banco = creaBanco(scena, trame)
  const vasi = creaVasi(scena, trame)
  const ampolle = creaAmpolle(scena, trame)
  const eff = creaEffetti(scena, trame)
  const attrezzi = creaAttrezzi(scena)

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
  const mira = (x, y) => {
    const r = canvas.getBoundingClientRect()
    punto.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1)
    raggio.setFromCamera(punto, camera)
  }
  // dove si può lasciare qualcosa: il calderone e il mortaio, con un po' di largo
  const inAria = new Plane(new Vector3(0, 1, 0), -1.1), qui = new Vector3()
  const ZONE = { calderone: [POSTI.calderone, 1.5], mortaio: [null, 0.95] }
  function bersaglio(x, y, tolto) {
    mira(x, y)
    if (!raggio.ray.intersectPlane(inAria, qui)) return null
    for (const [nome, [c, largo]] of Object.entries(ZONE)) {
      const dove = c || attrezzi.mortaio.userData.casa
      if (nome === tolto || (nome === 'mortaio' && !attrezzi.mortaio.visible)) continue
      if (Math.hypot(qui.x - dove.x, qui.z - dove.z) < largo * 1.15) return nome
    }
    return null
  }

  let giu = null, presa = null
  const premi = e => {
    giu = { x: e.clientX, y: e.clientY, id: e.pointerId }
    if (occupata) return
    mira(e.clientX, e.clientY)
    const c = raggio.intersectObjects(attrezzi.colpibili(), false)[0]
    if (c) { presa = attrezzi.cosa(c.object.userData.attrezzo); canvas.setPointerCapture?.(e.pointerId) }
  }
  const muovi = e => {
    if (!presa || !giu || giu.id !== e.pointerId) return
    mira(e.clientX, e.clientY)
    if (!raggio.ray.intersectPlane(inAria, qui)) return
    presa.position.copy(qui)
    presa.rotation.z = 0
  }
  const alza = e => {
    const g = giu; giu = null
    if (presa) {
      const p = presa; presa = null
      const su = bersaglio(e.clientX, e.clientY, p.userData.id)
      if (su) lascia?.({ attrezzo: p.userData.id, su })
      if (!occupata) aCasa(p)                  // non è successo niente: torna al suo posto
      return
    }
    if (!g || g.id !== e.pointerId || Math.hypot(e.clientX - g.x, e.clientY - g.y) > SOGLIA) return
    mira(e.clientX, e.clientY)
    const bersagli = [...vasi.colpibili(), ...eff.macchieVisibili()]
    const colpito = raggio.intersectObjects(bersagli, false)[0]
    if (colpito) tocca?.(colpito.object.userData.tocca)
  }
  const annulla = () => { giu = null; if (presa) { aCasa(presa); presa = null } }
  canvas.addEventListener('pointerdown', premi)
  canvas.addEventListener('pointermove', muovi)
  canvas.addEventListener('pointerup', alza)
  canvas.addEventListener('pointercancel', annulla)

  /* ── il ciclo ── */
  let ultimo = performance.now(), giro = 0, vivo = true, fotogrammi = 0, bolla = 2
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
    // il calderone sobbolle piano, solo se c'è dentro qualcosa
    if ((bolla -= dt) < 0) { bolla = 1.4 + Math.random() * 2.6; if (ultima?.riempito > 0) suoni.bolla() }
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
    banco.riempi(q.riempito)
    banco.fuoco(q.fuoco)
    attrezzi.imposta(q.attrezzi)
    const sporchi = new Set(q.macchie.map(m => m.i))
    for (const m of q.macchie) mettiMacchia(m, 1)
    for (const [i, m] of eff.macchie) if (!sporchi.has(i)) m.visible = false
  }
  const occupa = fai => async (...a) => {
    occupata++
    try { return await fai(...a) } finally { if (!--occupata && ultima) imposta(ultima) }
  }

  // attorno alla base dello strumento: davanti la coprirebbero le targhette
  const grande = i => 1.5 * vasi.scala(i)
  function mettiMacchia({ i, colore }, quanto) {
    const v = vasi.vaso(i), m = eff.macchia(i, v.famiglia)
    m.visible = true
    m.material.color.set(colore).offsetHSL(0, 0.1, -0.08)
    m.position.set(v.casa.x, m.userData.caduta ? 0.1 : 0.015, v.casa.z + (m.userData.caduta ? 0.75 : 0.1))
    m.scale.setScalar(Math.max(0.001, quanto * grande(i)))
  }

  /* L'ordine: le ampolle arrivano sul bancone a misura reale (la radice
     lunga quanto sarà sul metro), e il mercante le versa una alla volta
     nell'ordine scritto. Ogni voce dice già com'è andata. Nel calderone non
     va niente: quello lo fa il procedimento. */
  async function ordine(voci, dopoOgni) {
    const toccati = [...new Set(voci.map(v => v.i))]
    for (const i of toccati) vasi.trattieni(i, true)
    ampolle.consegna(voci.map(v => ({ ...v, lungo: v.misura * TACCA * vasi.scala(v.i) })))
    suoni.ampolle(voci.length)
    await aspetta(0.6 + voci.length * 0.25)
    for (let k = 0; k < voci.length; k++) {
      await versaUna(k, voci[k])
      dopoOgni?.(k)
      await aspetta(0.15)
    }
    ampolle.sgombra()
    for (const i of toccati) vasi.trattieni(i, false)
  }

  async function versaUna(k, { i: f, trabocca, colore, famiglia, livello, pezzi }) {
    const a = ampolle.stacca(k)
    const v = vasi.vaso(f)
    const da = a.gruppo.position.clone()
    const bocca = vasi.bocca(f)
    const radice = famiglia === 'lunghezza', polvere = famiglia === 'massa'
    const sopra = new Vector3(bocca.x - (radice ? 0 : 0.42), bocca.y + 0.85, bocca.z + (radice ? 0.02 : 0.05))
    // il volo, ad arco; la targhetta si legge fino all'ultimo
    await anima(0.5, t => {
      const e = liscio(t)
      a.gruppo.position.lerpVectors(da, sopra, e)
      a.gruppo.position.y += Math.sin(e * Math.PI) * 0.8
      a.cartello.material.opacity = 1 - Math.max(0, e - 0.6) / 0.4
      if (radice) a.corpo.rotation.z = e * Math.PI / 2
    })
    const prima = v.livello
    if (radice) {
      // la radice si mette in piedi e scivola giù nel vetro
      const giuY = vasi.fondo(f).y + a.corpo.userData.lungo / 2
      await anima(trabocca ? 0.35 : 0.5, t => { a.gruppo.position.y = sopra.y + (giuY - sopra.y) * t * t })
      suoni.radice()
      if (trabocca) {
        suoni.trabocca()
        // sporge dal bordo: si rovescia e cade sul tavolo
        const fermo = a.gruppo.position.clone()
        eff.gocce.emetti(18, { da: bocca, sparpaglia: 0.3, verso: [0.6, 1.4, 0.6], caso: 1.2, colore, vita: 0.9, misura: 0.09, gravita: 6 })
        await anima(0.5, t => {
          a.gruppo.position.set(fermo.x + t * 0.6, fermo.y + Math.sin(t * Math.PI) * 0.4 - t * (fermo.y - 0.1), fermo.z + t * 0.5)
          a.corpo.rotation.z = Math.PI / 2 - t * Math.PI / 2
        })
        const m = eff.macchia(f), era = m.visible ? m.scale.x : 0.001
        mettiMacchia({ i: f, colore }, era / grande(f))
        await anima(0.35, t => { m.scale.setScalar(Math.max(era, liscio(t) * grande(f))); a.gruppo.scale.setScalar(Math.max(0.001, 1 - t)) })
      } else {
        a.gruppo.visible = false
        vasi.impila(v, pezzi)
        v.livello = livello
        eff.gocce.emetti(10, { da: bocca, sparpaglia: 0.25, verso: [0, 0.8, 0], caso: 0.6, colore: '#d8c8a8', vita: 0.5, misura: 0.06, gravita: 5 })
      }
    } else {
      // via il tappo, o il panno col suo spago, e vola via di lato
      suoni.stappa(polvere)
      const da = a.chiuso.map(m => m.position.clone())
      await anima(0.3, t => a.chiuso.forEach((m, n) => {
        m.position.set(da[n].x + t * 0.5, da[n].y + Math.sin(t * Math.PI) * 0.35 + t * 0.1, da[n].z)
        m.rotation.z = -t * 2
        m.scale.setScalar(Math.max(0.001, 1 - t * t))
      }))
      for (const m of a.chiuso) m.visible = false
      // si piega e versa: il getto cade fino al livello, che sale
      await anima(0.18, t => { a.gruppo.rotation.z = -liscio(t) * 2.0 })
      const fino = trabocca ? (ALTEZZA_VASO - 0.1) / TACCA : livello   // traboccando, fino all'orlo
      if (polvere) suoni.polvere(0.6); else suoni.liquido(0.6)
      await anima(0.6, t => {
        v.livello = prima + (fino - prima) * liscio(t)
        eff.versa(a.gruppo.localToWorld(a.bocca.clone()), vasi.fondo(f), colore, polvere)
        if (Math.random() < 0.5) eff.gocce.emetti(1, { da: vasi.fondo(f), sparpaglia: 0.2, verso: [0, 0.6, 0], caso: 0.5, colore, vita: 0.35, misura: 0.06, gravita: 4 })
      })
      eff.smetti()
      if (trabocca) {
        // la schiuma esce dal bordo e cola sul tavolo, poi il misurino torna dov'era
        suoni.trabocca()
        const m = eff.macchia(f), era = m.visible ? m.scale.x : 0.001
        mettiMacchia({ i: f, colore }, era / grande(f))
        const schiuma = new Color(colore).lerp(new Color(1, 1, 1), 0.5)
        await anima(0.9, t => {
          v.onda = Math.sin(Math.min(1, t * 2) * Math.PI / 2) * 0.15
          if (t < 0.6) eff.gocce.emetti(6, { da: bocca, sparpaglia: 0.5, verso: [0.3, 1.2, 0.5], caso: 1.4, colore: schiuma, vita: 1.1, misura: 0.16, gravita: 5, allarga: 0.6 })
          m.scale.setScalar(Math.max(era, liscio(t) * grande(f)))
          a.gruppo.rotation.z = -2.0 * (1 - t)
          a.gruppo.scale.setScalar(Math.max(0.001, 1 - t))
        })
        await anima(0.4, t => { v.livello = fino + (prima - fino) * liscio(t); v.onda = 0.15 * (1 - t) })
        v.onda = 0
      } else {
        await anima(0.25, t => { a.gruppo.rotation.z = -2.0 * (1 - t); a.gruppo.scale.setScalar(Math.max(0.001, 1 - t)) })
      }
    }
    ampolle.via(k)
  }

  /* Un'azione del procedimento. `a` dice già com'è andata: giusta si vede
     farla, sbagliata il calderone sbuffa e non cambia niente. Un attrezzo lasciato
     parte da dov'è, e a fine mossa torna al suo posto (`aCasa`). */
  const sulCalderone = lato => new Vector3(POSTI.calderone.x + lato * 0.55, 2.35, POSTI.calderone.z + 0.5)
  async function versaDa(cosa, lato, colore, polvere, finire) {
    await anima(0.2, f => { cosa.rotation.z = lato * liscio(f) * 1.9 })
    if (polvere) suoni.polvere(0.55); else suoni.liquido(0.55)
    await anima(0.55, () => {
      const b = cosa.localToWorld(new Vector3(-lato * 0.45, 0.4, 0))
      eff.versa(b, new Vector3(b.x, banco.quotaBrodo(), b.z), colore, polvere)
    })
    eff.smetti()
    finire()
    banco.ribolli(4)
    suoni.tuffo()
    await anima(0.2, f => { cosa.rotation.z = lato * 1.9 * (1 - liscio(f)) })
  }
  async function vola(cosa, a) {
    const da = cosa.position.clone()
    await anima(0.35, f => { cosa.position.lerpVectors(da, a, liscio(f)) })
  }
  async function aCasa(cosa) {
    const { casa, giu } = cosa.userData, da = cosa.position.clone(), r = cosa.rotation.z
    await anima(0.3, f => { cosa.position.lerpVectors(da, casa, liscio(f)); cosa.rotation.z = r + (giu - r) * liscio(f) })
    cosa.rotation.set(0, 0, giu)
  }

  const MOSSE = {
    async metti(a) {
      const m = attrezzi.mortaio.position
      if (a.attrezzo) attrezzi.cosa(a.attrezzo).visible = false
      suoni.tonfo()
      eff.gocce.emetti(8, { da: new Vector3(m.x, 0.7, m.z), sparpaglia: 0.25, verso: [0, 1, 0], caso: 0.6, colore: a.colore, vita: 0.4, misura: 0.09, gravita: 5 })
      attrezzi.imposta({ ...ultima.attrezzi, pestato: a.colore })
      await aspetta(0.25)
    },
    async pesta(a) {
      const p = attrezzi.pestello, m = attrezzi.mortaio.position
      await vola(p, new Vector3(m.x + 0.05, 0.7, m.z))
      p.rotation.z = -0.2
      suoni.colpi(5, 260)
      await anima(1.3, f => {
        const c = Math.abs(Math.sin(f * Math.PI * 5))
        p.position.y = 0.3 + c * 0.45
        if (Math.floor(f * 10) % 2 === 0 && Math.random() < 0.3) eff.gocce.emetti(1, { da: new Vector3(m.x, 0.6, m.z), sparpaglia: 0.3, verso: [0, 1, 0], caso: 0.8, colore: a.colore, vita: 0.5, misura: 0.08, gravita: 5 })
      })
      await aCasa(p)
    },
    async versa(a) {
      const finire = () => { banco.colore(a.brodo); banco.riempi(a.riempito) }
      if (a.mortaio) {
        const m = attrezzi.mortaio
        await vola(m, sulCalderone(-1))
        await versaDa(m, -1, a.colore, a.polvere, () => { finire(); attrezzi.imposta({ ...ultima.attrezzi, pestato: null }) })
        await aCasa(m)
      } else {
        const c = attrezzi.ciotola
        if (a.attrezzo) attrezzi.cosa(a.attrezzo).visible = false
        attrezzi.tintaCiotola(a.colore)
        c.position.copy(sulCalderone(1)); c.rotation.set(0, 0, 0); c.visible = true
        await versaDa(c, 1, a.colore, a.polvere, finire)
        c.visible = false
      }
    },
    async mescola(a) {
      const m = attrezzi.mestolo, C = POSTI.calderone
      await vola(m, new Vector3(C.x + 0.5, banco.quotaBrodo(), C.z))
      suoni.mescola()
      banco.ribolli(3)
      await anima(1.3, f => {
        const g = f * Math.PI * 6
        m.position.set(C.x + Math.cos(g) * 0.5, banco.quotaBrodo() - 0.05, C.z + Math.sin(g) * 0.42)
        m.rotation.set(Math.sin(g) * 0.25, 0, -Math.cos(g) * 0.25)
      })
      m.rotation.x = 0
      banco.colore(a.brodo)
      await aCasa(m)
    },
    async scalda() {
      const f = attrezzi.fiammifero, C = POSTI.calderone
      await vola(f, new Vector3(C.x + 0.5, 0.35, C.z + 0.9))
      banco.fuoco(1)
      suoni.scalda()
      banco.ribolli(6)
      const su = new Vector3(C.x, 0.5, C.z + 0.4)
      await anima(1.2, () => { eff.luci.emetti(2, { da: su, sparpaglia: 0.6, verso: [0, 2, 0], caso: 1, colore: '#ffb34a', vita: 0.6, misura: 0.1, gravita: 0 }) })
      await aCasa(f)
    },
    async diluisci(a) {
      const b = attrezzi.brocca
      await vola(b, sulCalderone(1))
      await versaDa(b, 1, '#bfe4ff', false, () => { banco.colore(a.brodo) })
      await aCasa(b)
    },
  }

  async function passo(a) {
    if (a.giusto) return MOSSE[a.azione](a)
    // il pasticcio: il calderone rutta, e la roba resta dov'era
    if (a.attrezzo) aCasa(attrezzi.cosa(a.attrezzo))
    suoni.pasticcio()
    banco.ribolli(8)
    const su = new Vector3(POSTI.calderone.x, banco.quotaBrodo() + 0.1, POSTI.calderone.z)
    await anima(0.9, f => {
      if (f < 0.6) eff.gocce.emetti(5, { da: su, sparpaglia: 0.7, verso: [0, 2, 0], caso: 1.3, colore: '#4a4238', vita: 1.1, misura: 0.4, gravita: -0.3, allarga: 1.6 })
    })
  }

  // la spugna arriva e gira su ogni macchia, una dopo l'altra
  async function pulisci() {
    const sporche = eff.macchieVisibili()
    if (!sporche.length) return
    // quello che è caduto si porta via intero: la spugna è per chi lascia lo sporco
    for (const m of sporche.filter(x => x.userData.caduta)) {
      const g0 = m.scale.x, y0 = m.position.y
      suoni.radice()
      await anima(0.45, f => { m.position.y = y0 + f * 1.6; m.scale.setScalar(Math.max(0.001, g0 * (1 - f))) })
      m.visible = false; m.position.y = y0
    }
    const pozze = sporche.filter(x => !x.userData.caduta)
    if (!pozze.length) return
    const s = eff.spugna
    s.visible = true
    let da = new Vector3(pozze[0].position.x + 2.5, 1.5, pozze[0].position.z + 1.5)
    const fuori = da.clone()
    for (const m of pozze) {
      const qui = m.position.clone(), g0 = m.scale.x
      await anima(0.3, f => { s.position.lerpVectors(da, qui, liscio(f)) })
      suoni.spugna()
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
    suoni.sbuffo()
    const C = POSTI.calderone
    const su = new Vector3(C.x, banco.quotaBrodo() + 0.1, C.z)
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
    canvas.removeEventListener('pointermove', muovi)
    canvas.removeEventListener('pointerup', alza)
    canvas.removeEventListener('pointercancel', annulla)
    attive = []        // le promesse restano aperte: chi aspettava si ferma lì, su una scena che non c'è più
    vasi.rilascia(); ampolle.rilascia(); eff.rilascia(); attrezzi.rilascia()
    for (const t of Object.values(trame)) t.dispose()
    rilasciaRenderer(renderer)
  }

  return { imposta, ordine: occupa(ordine), passo: occupa(passo), pulisci: occupa(pulisci), festa: occupa(festa), bersaglio,
           // per i test: dove sta una cosa sullo schermo
           dove(id) {
             const c = id === 'calderone' ? POSTI.calderone.clone().setY(1.1) : attrezzi.cosa(id).position.clone().setY(id === 'mortaio' ? 0.4 : 0.3)
             const r = canvas.getBoundingClientRect(), p = c.project(camera)
             return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height }
           }, rilascia, misura,
           grafica: () => ({ fotogrammi, chiamate: renderer.info.render.calls, triangoli: renderer.info.render.triangles }) }
}
