// Il fotografo delle sagome (docs/sotterraneo/sagome-3d.md): ogni mostro e ogni persona di sopra fotografato col suo modello, come sta
// in scena (saldato, alla sua scala), dalle otto direzioni e in ogni posa di sagome-pura.js, visto da 52° con una telecamera ortogonale;
// le foto ritagliate e messe in un atlante solo. Gira nel file costruito, chiamato da `npm run anteprime sotterraneo`
// (strumenti/sagome-sotterraneo3d.mjs) attraverso il fornitore delle anteprime: nel gioco non parte mai.
// Due foto per posa: il colore (una luce piatta, niente tono: il colore del modello col suo emissivo) e le normali, nel verso del
// cartello in piedi (x a destra, y in su, z verso la telecamera): la luce gliela dà la scena come al modello (sagome.js).
import * as THREE from 'three'
import { preparaModello } from './mostro3d.js'
import { creaPersona } from './persone3d/persone.js'
import { DIREZIONI, QUANTI_RESPIRO, PASSO_RESPIRO, COLPO, CADUTA, COS, SIN, RAPPORTO, yawDi, puntoDelColpo, scalaDelModello } from './sagome-pura.js'

const MARGINE = 2         // pixel vuoti attorno a ogni ritaglio nell'atlante: il filtro lineare non prende il vicino
// due foto dello stesso modello che non si distinguono (un respiro fermo, chi non ha il colpo, la metà specchiata di chi è simmetrico)
// si tengono una volta: differenza media sotto UGUALE (su 255, per canale) e meno di STACCATI pixel su cento che cambiano davvero
const UGUALE = 1.5, STACCATI = 0.5

/** Quanto differiscono due ritagli della stessa misura (`specchio`: il secondo girato): vero se non si distinguono. */
function uguali(a, b, w, h, specchio) {
  let somma = 0, forti = 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, j = (y * w + (specchio ? w - 1 - x : x)) * 4
    let d = 0
    for (let c = 0; c < 4; c++) d += Math.abs(a[i + c] - b[j + c])
    somma += d
    if (d > 160) forti++
  }
  return somma / (w * h * 4) < UGUALE && forti * 100 / (w * h) < STACCATI
}
const LARGO_ATLANTE = 2048
const PIATTA = [128, Math.round(127.5 + 127.5 * SIN), Math.round(127.5 + 127.5 * COS)]   // la normale di chi guarda la telecamera

// Il colore delle normali: la normale della telecamera (vista da 52°) girata nel mondo, cioè nel verso del cartello. Le mesh coi loro
// materiali prendono un MeshNormalMaterial; quello che non è una superficie (punti, linee, shader suoi) si spegne, e lì resta PIATTA.
// a faccette, dalle derivate: le mesh saldate (salda3d.js) non hanno sempre le normali nei vertici
const NORMALE = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide, flatShading: true })
function inNormali(radice) {
  const tolti = []
  radice.traverse(o => {
    if (!o.visible) return
    if (o.isMesh && !(o.material && (o.material.isShaderMaterial || o.material.isRawShaderMaterial || o.material.isPointsMaterial))) { tolti.push([o, 'material', o.material]); o.material = NORMALE }
    else if (o.isPoints || o.isLine || o.isSprite || o.isMesh) { tolti.push([o, 'visible', true]); o.visible = false }
  })
  return () => { for (const [o, k, v] of tolti) o[k] = v }
}
function normaliNelMondo(dati, colore) {
  for (let i = 0; i < dati.length; i += 4) {
    if (!colore[i + 3]) { dati[i] = PIATTA[0]; dati[i + 1] = PIATTA[1]; dati[i + 2] = PIATTA[2]; dati[i + 3] = 255; continue }
    if (!dati[i + 3]) { dati[i] = PIATTA[0]; dati[i + 1] = PIATTA[1]; dati[i + 2] = PIATTA[2]; dati[i + 3] = 255; continue }
    const x = dati[i] / 127.5 - 1, y = dati[i + 1] / 127.5 - 1, z = dati[i + 2] / 127.5 - 1
    dati[i + 1] = Math.round(127.5 + 127.5 * (y * COS + z * SIN))
    dati[i + 2] = Math.round(127.5 + 127.5 * (-y * SIN + z * COS))
    dati[i] = Math.round(127.5 + 127.5 * x); dati[i + 3] = 255
  }
}

/** Le pose di un modello, una funzione ciascuna che lo mette in posa (perno: il giro; piega: la caduta; g: il modello). */
function pose(g, alto, persona) {
  const u = g.userData
  const riposo = (piega) => { piega.rotation.x = 0; piega.position.y = 0 }
  const l = []
  for (let j = 0; j < QUANTI_RESPIRO; j++) l.push(piega => { riposo(piega); u.anima(j * PASSO_RESPIRO) })
  if (persona) return l
  const att = typeof u.attacca === 'function' && u.attacco
  for (let i = 0; i < COLPO.length; i++) l.push(piega => { riposo(piega); u.anima(0); if (att) u.attacca(puntoDelColpo(i, att.arrivo)) })
  // come mostro3d.js: ferma all'istante della caduta, si rovescia all'indietro e sprofonda un poco (il pavimento taglia il resto)
  for (const c of CADUTA) l.push(piega => { u.anima(0); piega.rotation.x = -1.35 * c; piega.position.y = -0.12 * alto * c })
  return l
}

/**
 * `voci`: [{ id, persona, posti, fattore }] (`posti`: quanto sono alti in celle, già allungati, i posti dove il modello va in scena;
 * la foto ha la risoluzione del più grande), `R`: pixel per cella in scena.
 * → { immagine, normali (data: WebP, le normali a metà misura), largo, alto, sagome: { id: { alto, largo, px, f: [[x, y, w, h, ax, ab], …], att } }, senza: [id] }
 */
export async function fotografaSagome(voci, { R = 32, qualita = 0.9, avanza = null } = {}) {
  const canvas = document.createElement('canvas')
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NoToneMapping
  renderer.setClearColor(0x000000, 0)
  renderer.localClippingEnabled = true
  renderer.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)]   // sotto il pavimento non si vede
  const scena = new THREE.Scene()
  // l'irradianza di three va divisa per π: con π il colore resta il suo, da ogni parte
  scena.add(new THREE.AmbientLight(0xffffff, Math.PI))
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 200)
  // da 52° sotto l'orizzonte, dal lato +z: lo schermo ha x a destra e in su (0, cos, −sin)
  camera.position.set(0, SIN * 50, COS * 50); camera.up.set(0, 1, 0); camera.lookAt(0, 0, 0)
  const tela = document.createElement('canvas'), ctx = tela.getContext('2d', { willReadFrequently: true })
  const telaN = document.createElement('canvas'), ctxN = telaN.getContext('2d', { willReadFrequently: true })

  const pezzi = [], sagome = {}, senza = []
  let n = 0
  for (const v of voci) {
    let g, alto, largo
    try {
      if (v.persona) {
        g = creaPersona(v.id)
        g.traverse(o => { if (o.isMesh) o.castShadow = false })
        g.userData.anima(0)
        const b = new THREE.Box3().setFromObject(g), s = b.getSize(new THREE.Vector3())
        alto = g.userData.altezza || s.y; largo = Math.max(s.x, s.z)
      } else {
        const m = preparaModello(v.id)
        if (!m) { senza.push(v.id); continue }
        ;({ g, alto, largo } = m)
      }
    } catch (e) { console.warn(`sagome: ${v.id} non si costruisce`, e); senza.push(v.id); continue }
    const perno = new THREE.Group(), piega = new THREE.Group()
    piega.add(g); perno.add(piega); scena.add(perno)
    const k = Math.max(...v.posti.map(a => (v.persona ? a * RAPPORTO / alto : scalaDelModello(alto, largo, a, v.fattore || 1))))
    const px = R * k   // pixel per unità del modello
    // la tela: grande abbastanza per ogni posa e ogni giro (chi cade va lungo per terra, chi colpisce si sporge); poi si ritaglia
    const H = Math.max(alto, (g.userData.altezza ? new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3()).y : alto))
    const r = Math.max(largo, H) * 1.35
    const u0 = -r, u1 = r, v0 = -r * SIN, v1 = H * COS + r * SIN + r * 0.2
    const W = Math.ceil((u1 - u0) * px), A = Math.ceil((v1 - v0) * px)
    camera.left = u0; camera.right = u1; camera.bottom = v0; camera.top = v1; camera.updateProjectionMatrix()
    renderer.setSize(W, A, false)
    tela.width = W; tela.height = A; telaN.width = W; telaN.height = A
    const ax0 = -u0 * px, ay0 = v1 * px   // dove stanno i piedi nella tela (dall'alto)
    const elenco = pose(g, alto, v.persona), f = [], tenute = []
    for (let d = 0; d < DIREZIONI; d++) {
      perno.rotation.y = yawDi(d)
      for (const metti of elenco) {
        try { metti(piega) } catch (e) { /* una posa che si rompe resta quella di prima */ }
        perno.updateMatrixWorld(true)
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.clear(); renderer.render(scena, camera)
        ctx.clearRect(0, 0, W, A); ctx.drawImage(canvas, 0, 0)
        const dati = ctx.getImageData(0, 0, W, A).data
        const rimetti = inNormali(perno)
        renderer.outputColorSpace = THREE.LinearSRGBColorSpace
        renderer.clear(); renderer.render(scena, camera)
        rimetti()
        ctxN.clearRect(0, 0, W, A); ctxN.drawImage(canvas, 0, 0)
        let x0 = W, y0 = A, x1 = -1, y1 = -1
        for (let y = 0; y < A; y++) for (let x = 0; x < W; x++) if (dati[(y * W + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
        if (x1 < 0) { x0 = Math.floor(ax0); y0 = Math.floor(ay0) - 1; x1 = x0; y1 = y0 }
        const w = x1 - x0 + 1, h = y1 - y0 + 1, ax = ax0 - x0, ab = y1 + 1 - ay0
        const pixel = ctx.getImageData(x0, y0, w, h).data
        // [x, y, w, h] si scrivono dopo l'impaginazione; ax: dal bordo sinistro ai piedi; ab: dal fondo del ritaglio giù fino ai piedi;
        // una foto uguale a una già tenuta (anche specchiata) la riusa
        const stessa = tenute.find(t => t.w === w && t.h === h && Math.abs(t.ab - ab) < 0.6 &&
          ((Math.abs(t.ax - ax) < 0.6 && uguali(t.pixel, pixel, w, h, false) && (t.sp = 0, true)) ||
           (Math.abs(t.ax - (w - ax)) < 0.6 && uguali(t.pixel, pixel, w, h, true) && (t.sp = 1, true))))
        if (stessa) { f.push(stessa.i, +ax.toFixed(1), +ab.toFixed(1), stessa.sp); continue }
        const ritaglio = document.createElement('canvas'); ritaglio.width = w; ritaglio.height = h
        ritaglio.getContext('2d').drawImage(tela, x0, y0, w, h, 0, 0, w, h)
        const nd = ctxN.getImageData(x0, y0, w, h)
        normaliNelMondo(nd.data, pixel)
        const ritaglioN = document.createElement('canvas'); ritaglioN.width = w; ritaglioN.height = h
        ritaglioN.getContext('2d').putImageData(nd, 0, 0)
        pezzi.push({ ritaglio, ritaglioN, w, h, i: n })
        tenute.push({ i: n, w, h, ax, ab, pixel })
        f.push(n++, +ax.toFixed(1), +ab.toFixed(1), 0)
      }
    }
    scena.remove(perno)
    sagome[v.id] = { alto: +alto.toFixed(4), largo: +largo.toFixed(4), px: +px.toFixed(3), f }
    // l'attacco del modello (il racconto lo usa per la posa, anche della sagoma): [arrivo, durata, tipo, proiettile]
    const att = !v.persona && typeof g.userData.attacca === 'function' && g.userData.attacco
    if (att) sagome[v.id].att = [att.arrivo, att.durata, att.tipo, att.proiettile ? att.proiettile.tipo : null]
    if (avanza) avanza(v.id)
    await new Promise(r => setTimeout(r, 0))
  }
  renderer.dispose()

  // l'impaginazione: a scaffali, i più alti prima, larga LARGO_ATLANTE
  const ordine = [...pezzi].sort((a, b) => b.h - a.h || b.w - a.w)
  let x = 0, y = 0, riga = 0
  const dove = new Array(pezzi.length)
  for (const p of ordine) {
    if (x + p.w + MARGINE > LARGO_ATLANTE) { x = 0; y += riga + MARGINE; riga = 0 }
    dove[p.i] = [x + MARGINE, y + MARGINE]
    x += p.w + MARGINE; riga = Math.max(riga, p.h)
  }
  const alto = y + riga + 2 * MARGINE
  const atlante = document.createElement('canvas'); atlante.width = LARGO_ATLANTE; atlante.height = alto
  const ca = atlante.getContext('2d')
  for (const p of pezzi) ca.drawImage(p.ritaglio, dove[p.i][0], dove[p.i][1])
  // le normali nello stesso posto, poi a metà misura: la luce non vuole il dettaglio del colore, e le coordinate restano quelle
  const normali = document.createElement('canvas'); normali.width = LARGO_ATLANTE; normali.height = alto
  const cn = normali.getContext('2d')
  cn.fillStyle = `rgb(${PIATTA.join(',')})`; cn.fillRect(0, 0, LARGO_ATLANTE, alto)
  for (const p of pezzi) cn.drawImage(p.ritaglioN, dove[p.i][0], dove[p.i][1])
  const meta = document.createElement('canvas'); meta.width = LARGO_ATLANTE / 2; meta.height = Math.ceil(alto / 2)
  const cm = meta.getContext('2d'); cm.imageSmoothingEnabled = true; cm.imageSmoothingQuality = 'high'
  cm.drawImage(normali, 0, 0, LARGO_ATLANTE, alto, 0, 0, meta.width, alto / 2)
  for (const s of Object.values(sagome)) {
    const piatti = []
    // specchiata: la larghezza negativa (scena3d/sagome.js la gira come figure.js `specchio`)
    for (let j = 0; j < s.f.length; j += 4) { const i = s.f[j], p = pezzi[i]; piatti.push([dove[i][0], dove[i][1], s.f[j + 3] ? -p.w : p.w, p.h, s.f[j + 1], s.f[j + 2]]) }
    s.f = piatti
  }
  return { immagine: atlante.toDataURL('image/webp', qualita), normali: meta.toDataURL('image/webp', qualita), largo: LARGO_ATLANTE, alto, sagome, senza }
}
