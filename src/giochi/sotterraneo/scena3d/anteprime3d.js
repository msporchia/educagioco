// Le anteprime 3D (docs/sotterraneo/anteprime-3d.md): la roba, l'eroe vestito e i mostri fotografati coi modelli veri, per le
// caselle dello zaino e delle botteghe, il ritratto dell'eroe e la fila dei turni. Un solo renderer piccolo, suo (la scena di sotto
// può non esserci: la bottega sta sopra), creato alla prima richiesta e chiuso quando non serve; una coda che ne fa poche per
// fotogramma; una cache per chiave. Un modello che manca o si rompe vale null: la vista tiene lo sprite.
import * as THREE from 'three'
import { inquadra } from '../../fattoria3d/scena3d/anteprime-pura.js'
import { creaCoda, leggiChiave, MISURE, RIPROVA } from './anteprime3d-pura.js'
import { creaEroe, posaGuardia } from './eroi3d/eroi.js'
import { equipaggia } from './eroi3d/armi.js'
import { vesti, TIPI } from './eroi3d/armature.js'
import { vestiDotazione } from './eroe3d.js'
import { creaPezzo, vestiFigura } from './roba3d.js'
import { copri } from './eroi3d/copricapi.js'
import { aggiungiAlone } from './roba3d/aloni.js'
import { idDi, costruisci } from './mostri3d/registro.js'
import { creaPersona } from './persone3d/persone.js'
import { elencaProgrammi } from './programmi.js'
import { segui, rilascia } from '../../../grafica/rilascio3d.js'

const FOV = 24
const ATTESA_PROGRAMMA = 60   // ms lasciati alla compilazione di un programma nuovo, senza KHR_parallel_shader_compile (l'Adreno 512: 50-300)
const _b = new THREE.Box3()

/** La scatola delle sole mesh visibili (Box3.setFromObject conta anche quello che è spento). */
function scatolaDi(radice) {
  radice.updateMatrixWorld(true)
  const b = new THREE.Box3()
  radice.traverseVisible(o => {
    if (o.isMesh && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); _b.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); b.union(_b) }
  })
  return b.isEmpty() ? null : b
}

// ogni pezzo che si anima (le fiamme e le braci di un'arma, il respiro) va messo in un istante: prima della prima `anima` certe
// particelle sono grandi quanto l'arma intera
function animaTutto(radice, t) {
  radice.traverse(o => {
    for (const a of [o.userData && o.userData.anima, o.userData && o.userData.animaAlone]) {
      if (typeof a === 'function') { try { a(t) } catch (e) { /* resta com'è */ } }
    }
  })
}

// ── i modelli in posa: ognuno torna { obj, scatola, verso } ──
// l'istante delle anteprime: a 1,3 s l'aura del leggendario è gonfia e i luccichii del raro accesi (un fotogramma bello, fermo)
const ISTANTE = 1.3
function inPosaArma(pezzo, modo) {
  const a = creaPezzo(pezzo)
  if (!a) return null
  const perno = new THREE.Group()
  perno.add(a); animaTutto(a, ISTANTE)
  if (modo === 'scudo' || modo === 'gioiello' || modo === 'consumabile') { perno.rotation.y = -0.35; return { obj: perno, verso: [0.15, 0.22, 1] } }
  // l'arco è disegnato col pancione verso +z: girato di lato si vede la curva; tutto in diagonale, la punta in alto a destra
  if (a.userData.famiglia === 'arco') a.rotation.y = -Math.PI / 2
  else a.rotation.y = 0.45
  perno.rotation.z = -Math.PI / 4
  return { obj: perno, verso: [0, 0.1, 1] }
}

// l'eroe nella guardia di battaglia, come lo vede il giocatore, girato un poco verso chi guarda
function inPosaEroe(c, busto) {
  const g = creaEroe(c.eroe)
  vestiDotazione(g, c)                   // come l'eroe in scena (eroe3d.js): la chiave porta la dotazione già decisa
  posaGuardia(g, 0.6)
  animaTutto(g, 0.6)
  for (const w of g.userData.armiAnima || []) animaTutto(w, ISTANTE)
  if (g.userData.animaArmatura) g.userData.animaArmatura(0.6)
  g.rotation.y = 0.35
  if (!busto) return { obj: g, verso: [0.1, 0.16, 1] }
  // a mezzo busto: attorno alla faccia, uguale per tutti (la testa dei chibi è metà dell'eroe, e il cappello del mago o la barba del
  // nano la allungherebbero); prima il tutto, perché la faccia eredita la rotazione
  g.updateMatrixWorld(true)
  const f = scatolaDi(g.userData.faccia || g.userData.testa)
  if (!f) return { obj: g, verso: [0.1, 0.16, 1] }
  const m = f.getCenter(new THREE.Vector3()), r = Math.max(f.max.x - f.min.x, f.max.y - f.min.y) / 2
  const t = new THREE.Box3(new THREE.Vector3(m.x - r * 2, m.y - r * 2.3, m.z - r), new THREE.Vector3(m.x + r * 2, m.y + r * 1.9, m.z + r))
  return { obj: g, scatola: t, verso: [0.1, 0.1, 1] }
}

// l'armatura indossata da un manichino: l'eroe che la porterebbe, senza testa e senza armi
function inPosaArmatura(c) {
  const g = creaEroe(c.eroe)
  equipaggia(g, {})
  if (!(c.corpo.figura && vestiFigura(g, c.corpo.figura)) && TIPI.includes(c.armatura)) vesti(g, c.armatura, c.pregio)
  if (g.userData.animaArmatura) g.userData.animaArmatura(0)
  g.userData.testa.visible = false
  g.rotation.y = 0.4
  return { obj: g, verso: [0.1, 0.2, 1] }
}

// il copricapo da solo (docs/sotterraneo/elmo.md): montato su una testa finta, senza eroe sotto (`copri` vuole il perno `testa`, il suo
// centro e il raggio), di tre quarti e appena dall'alto; l'alone della rarità come le altre caselle
function inPosaCopricapo(c) {
  const finto = new THREE.Group(), testa = new THREE.Group()
  finto.add(testa)
  finto.userData = { testa, cy: 0, R: 0.3, chiave: 'cavaliere' }
  copri(finto, c.id)
  const g = finto.userData.copricapoMontato && finto.userData.copricapoMontato.gruppo
  if (!g) return null
  if (finto.userData.animaCopricapo) finto.userData.animaCopricapo(ISTANTE)
  if (c.rarita !== 'comune') aggiungiAlone(g, { rarita: c.rarita, elemento: 'nessuno' })
  animaTutto(g, ISTANTE)
  finto.rotation.set(0.25, -0.5, 0)
  return { obj: finto, verso: [0.15, 0.3, 1] }
}

// il mostro di tre quarti, girato verso sinistra (dove sta l'eroe), dalla testa a metà corpo
function inPosaMostro(r) {
  const id = idDi(r)
  const g = id && costruisci(id)
  if (!g) return null
  animaTutto(g, 0.4)
  const perno = new THREE.Group(); perno.add(g); perno.rotation.y = -0.55
  const s = scatolaDi(perno)
  if (!s) return null
  const alto = s.max.y - s.min.y, largo = Math.max(s.max.x - s.min.x, s.max.z - s.min.z)
  s.min.y = Math.max(s.min.y, s.max.y - Math.max(alto * 0.62, Math.min(alto, largo * 0.7)))
  return { obj: perno, scatola: s, verso: [0, 0.18, 1] }
}

// una persona del mondo di sopra a mezzo busto, appena girata: la faccia e le spalle, come il ritratto dell'eroe (il cappello del
// pescatore e lo zaino del rigattiere restano dentro a metà)
function inPosaPersona(chi) {
  const g = creaPersona(chi)
  g.userData.anima(0.6)
  g.rotation.y = 0.3
  g.updateMatrixWorld(true)
  const f = scatolaDi(g.userData.faccia || g.userData.testa)
  if (!f) return { obj: g, verso: [0.1, 0.16, 1] }
  const m = f.getCenter(new THREE.Vector3()), r = Math.max(f.max.x - f.min.x, f.max.y - f.min.y) / 2
  return { obj: g, scatola: new THREE.Box3(new THREE.Vector3(m.x - r * 2, m.y - r * 2.4, m.z - r), new THREE.Vector3(m.x + r * 2, m.y + r * 1.8, m.z + r)), verso: [0.1, 0.1, 1] }
}

function inPosa(c) {
  switch (c.tipo) {
    case 'arma': case 'scudo': case 'gioiello': case 'consumabile': return inPosaArma(c.pezzo, c.tipo)
    case 'armatura': return inPosaArmatura(c)
    case 'copricapo': return inPosaCopricapo(c)
    case 'eroe': return inPosaEroe(c, false)
    case 'busto': return inPosaEroe(c, true)
    case 'mostro': return inPosaMostro(c.r)
    case 'persona': return inPosaPersona(c.chi)
    default: return null
  }
}

/**
 * → { chiedi(chiave) → Promise<HTMLCanvasElement|null>, leggi(chiave), pronta(chiave), stato(), via() }. `ozio`: ms senza richieste dopo i
 * quali il renderer si chiude (si riapre alla prossima). Senza WebGL, o col contesto perso, ogni chiave vale null.
 */
export function creaAnteprime3d({ ozio = 30000, budget = 16, perdite = 3 } = {}) {
  let renderer = null, scena = null, camera = null, rotto = false, timer = 0
  const misure = { prima: 0, codaVuota: 0, ultima: 0, disegnate: 0, ms: 0, renderer: 0, perdite: 0, msModelli: 0, msDisegno: 0, msCopia: 0, programmi: 0, msCompila: 0, fettaMax: 0 }

  function apri() {
    if (renderer || rotto) return renderer
    try {
      const canvas = document.createElement('canvas')
      // l'evento arriva DOPO forceContextLoss (un compito più in là): conta solo se la tela è ancora quella aperta; un contesto
      // tolto dal browser si lascia e si riapre alla prossima richiesta, rotto per sempre solo dopo `perdite` volte
      canvas.addEventListener('webglcontextlost', () => {
        if (!renderer || renderer.domElement !== canvas) return
        misure.perdite++
        rilascia(renderer)
        renderer = null
        if (misure.perdite >= perdite) rotto = true
      })
      renderer = segui(new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power' }))
      renderer.setPixelRatio(1)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15
      renderer.setClearColor(0x000000, 0)
      misure.renderer++
    } catch (e) { rotto = true; renderer = null; return null }
    if (!scena) {
      // la luce calda delle torce di sotto: davanti a sinistra, un'emisferica bruna e un filo freddo da dietro che stacca il contorno
      scena = new THREE.Scene()
      scena.add(new THREE.HemisphereLight(0xffe6c4, 0x3b2a1e, 1.25))
      const fuoco = new THREE.DirectionalLight(0xffd29a, 2.7); fuoco.position.set(-3, 5, 6); scena.add(fuoco)
      const taglio = new THREE.DirectionalLight(0xa9c4ff, 1.3); taglio.position.set(4, 3, -5); scena.add(taglio)
      camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 100)
    }
    return renderer
  }

  function chiudi() {
    if (!renderer) return
    const r = renderer
    renderer = null                       // prima: il webglcontextlost che segue trova la tela già chiusa
    rilascia(r)   // anche gli ascoltatori sulle cose che i moduli tengono in cache (grafica/rilascio3d.js)
  }

  // L'anteprima a fette (docs/sotterraneo/anteprime-3d.md, «Quanto costa»), ognuna in un compito suo: il renderer se non c'è; il modello
  // in posa e gli shader che mancano (`compile`: il telefono li compila mentre il filo fa altro); il disegno e la copia, che arriva
  // da sé (`createImageBitmap`: niente attesa della GPU sul filo); la tela 2D dalla copia. Senza `createImageBitmap` si copia subito.
  const dopo = (ms = 0) => new Promise(r => setTimeout(r, ms))
  const fetta = ms => { misure.fettaMax = Math.max(misure.fettaMax, ms) }   // il pezzo più lungo sul filo, per le misure
  async function disegna(chiave) {
    const c = leggiChiave(chiave)
    if (!c || rotto) return null
    if (!renderer) { const ta = performance.now(); if (!apri()) return null; fetta(performance.now() - ta); await dopo() }
    if (!renderer) return RIPROVA
    const t0 = performance.now()
    const p = inPosa(c)
    if (!p) return null
    const t1 = performance.now()
    const [w, h] = MISURE[c.tipo] || [128, 128]
    scena.add(p.obj)
    try {
      const s = p.scatola || scatolaDi(p.obj)
      if (!s) return null
      // un quadro non quadrato: si inquadra nel lato corto, e la scatola si allarga perché stia anche nell'altro
      const q = inquadra({ min: s.min.toArray(), max: s.max.toArray() }, { fov: FOV, verso: p.verso, margine: 0.06 })
      camera.fov = w >= h ? FOV : FOV * h / w
      camera.aspect = w / h
      camera.position.set(...q.posizione); camera.near = Math.max(0.005, q.distanza / 50); camera.far = q.distanza * 4
      camera.lookAt(...q.bersaglio); camera.updateProjectionMatrix()
      // gli shader nuovi si chiedono adesso e si usano al compito dopo: il primo uso aspetterebbe la compilazione sul filo
      const prima = renderer.info.programs.length
      renderer.compile(scena, camera)
      const nuovi = renderer.info.programs.length - prima
      misure.programmi += nuovi
      const tc = performance.now()
      fetta(tc - t0)
      if (nuovi) await pronti(nuovi)
      misure.msCompila += performance.now() - tc
      if (!renderer || renderer.getContext().isContextLost()) return RIPROVA
      const t2 = performance.now()
      renderer.setSize(w, h, false)
      renderer.clear()
      renderer.render(scena, camera)
      if (renderer.getContext().isContextLost()) return RIPROVA   // perso a metà: niente riquadro vuoto in cache
      const t3 = performance.now()
      fetta(t3 - t2)
      // l'immagine è una tela 2D piccola, copiata dal renderer: niente PNG (toDataURL costava tre quarti del tempo sul filo
      // principale, e toBlob arrivava un secondo dopo); la vista la copia nella sua tela (viste/Quadro3d.vue)
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h
      let msCopia = 0
      if (typeof createImageBitmap === 'function') {
        let bmp = null
        try { bmp = await createImageBitmap(renderer.domElement) } catch (e) { return RIPROVA }   // la fotografia si prende adesso, la copia arriva dopo
        const t4 = performance.now()
        cv.getContext('2d').drawImage(bmp, 0, 0); bmp.close()
        msCopia = performance.now() - t4
        fetta(msCopia)
      } else {
        cv.getContext('2d').drawImage(renderer.domElement, 0, 0)
        msCopia = performance.now() - t3
        fetta(t3 - t2 + msCopia)
      }
      misure.disegnate++; misure.msModelli += t1 - t0; misure.msDisegno += t3 - t2; misure.msCopia += msCopia
      misure.ms += (t1 - t0) + (t3 - t2) + msCopia
      return cv
    } finally {
      scena.remove(p.obj)
    }
  }
  // finché gli shader appena chiesti non sono pronti: con KHR_parallel_shader_compile lo si chiede senza aspettare; senza, si lascia
  // al telefono un tempo per programma (il primo uso aspetterebbe il resto sul filo, ma il fotogramma intanto è passato)
  function pronti(nuovi) {
    const gl = renderer.getContext()
    if (!renderer.extensions.has('KHR_parallel_shader_compile')) return dopo(Math.min(400, nuovi * ATTESA_PROGRAMMA))
    const fino = performance.now() + 2000
    return new Promise(r => {
      const guarda = () => {
        if (!renderer || gl.isContextLost() || performance.now() > fino || renderer.info.programs.every(x => x.isReady())) return r()
        setTimeout(guarda, 16)
      }
      guarda()
    })
  }

  const coda = creaCoda(disegna, {
    // fra un giro e l'altro si cede il filo (un messaggio, non un fotogramma: il tocco e il disegno della pagina passano prima);
    // provato un'anteprima per fotogramma: dietro la scena 3D in SwiftShader trenta caselle ci mettevano tre secondi
    pianifica: fn => { const c = new MessageChannel(); c.port1.onmessage = () => fn(); c.port2.postMessage(0) },
    ora: () => performance.now(),
    budget,
    vuota: () => { misure.codaVuota = performance.now(); clearTimeout(timer); timer = setTimeout(chiudi, ozio) },
  })

  return {
    chiedi(k) {
      clearTimeout(timer)
      if (rotto) return Promise.resolve(null)
      if (!misure.prima) misure.prima = performance.now()
      return coda.chiedi(k).then(u => { misure.ultima = performance.now(); return u })
    },
    leggi: coda.leggi,
    pronta: coda.pronta,
    /** Per le prove: `prima` e `ultima` (performance.now() della prima richiesta e dell'ultima pronta), quante disegnate, i ms in tutto, quante volte s'è aperto il renderer, quanti contesti persi dal browser, se è aperto, quante in coda. */
    stato: () => ({ ...misure, aperto: !!renderer, inCoda: coda.inCoda, rotto }),
    /** Per le misure: i programmi di shader del renderer aperto (scena3d/programmi.js), o null se è chiuso. */
    programmi: () => (renderer ? elencaProgrammi(renderer, [scena]) : null),
    via() { clearTimeout(timer); coda.via(); chiudi() },
  }
}
