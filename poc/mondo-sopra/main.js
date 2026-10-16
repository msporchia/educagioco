// Il mondo di sopra in 3D, generato: il generatore fa la mappa (generatore.js), qui la si costruisce (terreno, acqua, kit,
// natura, monumenti, vita), si mettono l'eroe, il minatore e i mercanti (le figure dell'atlante del gioco, cartelli in piedi),
// e si gioca col dito come nella terra vera: toccare un punto = l'eroe ci va; toccare un ingresso o un mercante = ci va e,
// arrivato, l'ingresso si apre o il mercante saluta. Sempre giorno. Vedi poc/mondo-sopra.md.
import * as THREE from 'three'
import { ATLANTE, PEZZI, VOCI } from '../../src/giochi/sotterraneo/dati/atlante.js'
import { generaMondo, quotaA, quotaTerreno, LIVELLO_ACQUA } from './generatore.js'
import { cerca, liscia, raggiungibili } from './strada.js'
import { trameDelTerreno, trameDelKit } from './trame.js'
import { creaTerreno, creaFuori, creaAcqua, creaCielo, creaPiazza, creaCampi } from './terreno.js'
import { materialiDelKit, Cantiere, casa, bottega, pozzo, mulino, ponte, staccionate, lanterna, cartello, campoMinatore } from './kit.js'
import { creaMonumento } from './monumenti.js'
import { creaNatura } from './natura.js'
import { creaVita } from './vita.js'
import { U, vesti } from './vesti.js'

const CAMERA = { inclinazione: 50, fov: 36, guarda: 0.6 }
const PASSO = 4.2           // celle al secondo
const VISTA = 8.5           // il raggio della nebbia che si dirada, in celle
const SOLE = new THREE.Vector3(-0.42, 0.82, 0.38).normalize()
const CIELO_LONTANO = new THREE.Color(0xc9dcea)

function avvia (img) {
  const t0 = performance.now()
  const m = generaMondo()
  if (m.guasti.length) console.warn('guasti del mondo:', m.guasti)
  const tGenera = performance.now() - t0

  // ── renderer, scena, luce ──
  const tela = document.getElementById('tela')
  const renderer = new THREE.WebGLRenderer({ canvas: tela, antialias: true, powerPreference: 'high-performance' })
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  const PR = Math.min(devicePixelRatio || 1, 1.5)
  renderer.setPixelRatio(PR)
  const scena = new THREE.Scene()
  scena.background = CIELO_LONTANO.clone()
  scena.fog = new THREE.Fog(CIELO_LONTANO, 60, 200)
  const camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, 0.3, 1200)
  scena.add(new THREE.HemisphereLight(0xcfe4ff, 0x6a5a3a, 1.35))
  const sole = new THREE.DirectionalLight(0xfff1dc, 2.6)
  sole.castShadow = true
  sole.shadow.mapSize.set(2048, 2048)
  sole.shadow.bias = -0.0004; sole.shadow.normalBias = 0.04; sole.shadow.radius = 3
  scena.add(sole, sole.target)

  // ── la nebbia dell'esplorazione: una trama W×H che l'eroe scopre ──
  const visto = new Uint8Array(m.W * m.H)
  const tVisto = new THREE.DataTexture(visto, m.W, m.H, THREE.RedFormat)
  tVisto.magFilter = THREE.LinearFilter; tVisto.minFilter = THREE.LinearFilter; tVisto.needsUpdate = true
  U.uVisto.value = tVisto; U.uMappa.value.set(m.W, m.H)

  // ── il terreno, il fuori, l'acqua, il cielo ──
  const trameT = trameDelTerreno(), trameK = trameDelKit()
  const terreno = creaTerreno(m, trameT)
  scena.add(terreno.mesh)
  const fuori = creaFuori(m, terreno.mat)
  scena.add(fuori.mesh)
  scena.add(creaAcqua(m, SOLE))
  const cielo = creaCielo(); scena.add(cielo)

  // ── il kit: tutto quello che sta fermo in un cantiere solo ──
  const kit = { mat: materialiDelKit(trameK), trame: trameK, camini: [], braci: [], fuochi: [], ruota: null, spruzzo: null, cristallo: null }
  for (const me of creaPiazza(m, kit)) scena.add(me)
  if (m.campi.length) scena.add(creaCampi(m, kit))
  const cant = new Cantiere(kit.mat)
  for (const c of m.case) casa(c, cant, m, kit)
  for (const me of m.mercanti) bottega(me, cant, m, kit)
  pozzo(m.pozzo, cant, m)
  if (m.mulino) mulino(m.mulino, cant, m, kit, scena)
  for (const p of m.ponti) ponte(p, cant, m)
  for (const l of m.lanterne) lanterna(l, cant, m)
  for (const c of m.cartelli) cartello(c, cant, m)
  if (m.minatore) campoMinatore(m.minatore, cant, m, kit)
  const monumenti = m.posti.map(p => creaMonumento(p, cant, m, kit, scena))
  const triKit = cant.tri
  cant.chiudi(scena)
  staccionate(m, kit, scena)
  const natura = creaNatura(m, kit, scena, { quotaFuori: fuori.quotaFuori, M: fuori.M })
  const vita = creaVita(scena, kit, m)
  // il cristallo dell'incantatrice, che galleggia e gira
  let cristallo = null
  if (kit.cristallo) {
    cristallo = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), vesti(new THREE.MeshStandardMaterial({ color: 0xb78cff, emissive: 0x6a3cff, emissiveIntensity: 0.6, roughness: 0.2, metalness: 0.1 })))
    cristallo.position.copy(kit.cristallo); cristallo.castShadow = true; scena.add(cristallo)
  }

  // ── le figure dell'atlante: cartelli in piedi, un poco piegati verso chi guarda ──
  const AW = img.width, AH = img.height
  const texAtlante = new THREE.Texture(img)
  texAtlante.colorSpace = THREE.SRGBColorSpace
  texAtlante.magFilter = THREE.NearestFilter; texAtlante.minFilter = THREE.NearestFilter; texAtlante.generateMipmaps = false
  texAtlante.needsUpdate = true
  const voce = Object.fromEntries(VOCI.map(v => [v.id, v]))
  const SCALA_FIGURA = 1.45 / 16, PIEGA = -0.42
  const matFigura = vesti(new THREE.MeshStandardMaterial({ map: texAtlante, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8, emissiveMap: texAtlante, emissive: new THREE.Color(0.32, 0.32, 0.32) }))
  matFigura.name = 'figura'
  function figura (id) {
    const v = voce[id]
    if (!v) throw new Error('manca nell\'atlante: ' + id)
    const g = new THREE.PlaneGeometry(1, 1); g.translate(0, 0.5, 0)
    const mesh = new THREE.Mesh(g, matFigura)
    mesh.castShadow = true
    mesh.rotation.x = PIEGA
    const f = { v, mesh, quadro: null, specchio: false }
    f.metti = (posa, t = 0, specchio = false) => {
      const fot = v.pose[posa] || v.pose.fermo || Object.values(v.pose)[0]
      const nome = fot[Math.floor(t) % fot.length]
      if (nome === f.quadro && specchio === f.specchio) return
      f.quadro = nome; f.specchio = specchio
      const [x, y, w, h] = PEZZI[nome]
      const u0 = (x + 0.01) / AW, u1 = (x + w - 0.01) / AW, vA = 1 - (y + 0.01) / AH, vB = 1 - (y + h - 0.01) / AH
      const [a, b] = specchio ? [u1, u0] : [u0, u1]
      const uv = mesh.geometry.attributes.uv
      uv.setXY(0, a, vA); uv.setXY(1, b, vA); uv.setXY(2, a, vB); uv.setXY(3, b, vB); uv.needsUpdate = true
      mesh.scale.set(w * SCALA_FIGURA, h * SCALA_FIGURA * 1.15, 1)
    }
    f.metti('fermo')
    scena.add(mesh)
    return f
  }
  const sulTerreno = (f, x, z) => f.mesh.position.set(x, quotaA(m, x, z), z)

  // chi sta fermo: il minatore e i mercanti, ognuno nella sua bottega; ognuno è una cosa da toccare
  const cose = []
  for (const me of m.mercanti) {
    const f = figura(me.sprite); sulTerreno(f, me.piede.x + 0.5, me.piede.y + 0.5)
    cose.push({ tipo: 'mercante', nome: me.nome, sotto: `Mercante · ${me.ruolo}`, f, x: me.piede.x + 0.5, z: me.piede.y + 0.5, alto: 1.6, accanto: me.accanto, posa: 'saluta' })
  }
  if (m.minatore) {
    const mi = m.minatore, f = figura('minatore'); sulTerreno(f, mi.piede.x + 0.5, mi.piede.y + 0.5)
    cose.push({ tipo: 'minatore', nome: 'Il minatore', sotto: 'Ti dice la strada per ogni discesa', f, x: mi.piede.x + 0.5, z: mi.piede.y + 0.5, alto: 1.6, accanto: mi.accanto, posa: 'saluta' })
  }
  for (const mo of monumenti) cose.push({ tipo: 'ingresso', nome: mo.posto.discesa, sotto: 'Ingresso', mo, x: mo.x, z: mo.z, y0: mo.y, alto: mo.alto, accanto: mo.posto.accanto, k: 0, meta: 0, aperto: 0 })

  // l'eroe
  const eroe = { x: m.partenza.x + 0.5, z: m.partenza.y + 0.5, via: [], t: 0, specchio: false, intento: null, cella: -1 }
  const fEroe = figura('cavaliere')

  // ── la nebbia dell'esplorazione si dirada attorno all'eroe ──
  function scopri () {
    const cx = Math.floor(eroe.x), cz = Math.floor(eroe.z), R = Math.ceil(VISTA)
    let cambiato = false
    for (let y = cz - R; y <= cz + R; y++) for (let x = cx - R; x <= cx + R; x++) {
      if (x < 0 || y < 0 || x >= m.W || y >= m.H) continue
      const d = Math.hypot(x + 0.5 - eroe.x, y + 0.5 - eroe.z)
      const v = Math.round(Math.max(0, Math.min(1, (VISTA - d) / 3)) * 255)
      const k = y * m.W + x
      if (v > visto[k]) { visto[k] = v; cambiato = true }
    }
    if (cambiato) tVisto.needsUpdate = true
  }

  // ── la telecamera: dall'alto inclinata, lontana, segue l'eroe con morbidezza; «cielo» inquadra tutta la mappa ──
  const vista = { cielo: false, x: eroe.x, z: eroe.z, inc: CAMERA.inclinazione, d: 30, ombra: 0 }
  function distanzaPer (largo, fondo, inc) {
    const v = THREE.MathUtils.degToRad(camera.fov) / 2, o = Math.atan(Math.tan(v) * camera.aspect), i = THREE.MathUtils.degToRad(inc)
    return Math.max((largo / 2) / Math.tan(o), (fondo / 2) * Math.sin(i) / Math.tan(v))
  }
  function bersaglio () {
    if (vista.cielo) return { x: m.W / 2, z: m.H / 2 + 4, inc: 62, d: distanzaPer(m.W + 6, m.H + 4, 62) }
    const largo = Math.min(30, Math.max(15, camera.aspect * 18))
    return { x: eroe.x, z: eroe.z, inc: CAMERA.inclinazione, d: distanzaPer(largo, 18, CAMERA.inclinazione) }
  }
  function muoviCamera (dt) {
    const b = bersaglio(), k = 1 - Math.exp(-dt * (vista.cielo ? 2.6 : 3.2))
    vista.x += (b.x - vista.x) * k; vista.z += (b.z - vista.z) * k; vista.inc += (b.inc - vista.inc) * k; vista.d += (b.d - vista.d) * k
    const i = THREE.MathUtils.degToRad(vista.inc), y0 = vista.cielo ? 0 : quotaA(m, vista.x, vista.z) + CAMERA.guarda
    camera.position.set(vista.x, y0 + vista.d * Math.sin(i), vista.z + vista.d * Math.cos(i))
    camera.lookAt(vista.x, y0, vista.z)
    cielo.position.copy(camera.position)
    scena.fog.near = vista.d * 1.4; scena.fog.far = vista.d * 4.5
    // l'ombra: una mappa sola che copre quello che si vede, agganciata alla griglia dei suoi texel (non tremola)
    const s = Math.min(95, Math.max(14, vista.d * 0.85))
    if (Math.abs(s - vista.ombra) > 0.5) {
      vista.ombra = s
      Object.assign(sole.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 260 })
      sole.shadow.camera.updateProjectionMatrix()
    }
    const passo = (2 * s) / 2048
    const tx = Math.round(vista.x / passo) * passo, tz = Math.round((vista.z - s * 0.15) / passo) * passo
    sole.target.position.set(tx, 0, tz)
    sole.position.set(tx + SOLE.x * 120, SOLE.y * 120, tz + SOLE.z * 120)
  }

  // ── la misura ──
  function misura () {
    renderer.setSize(innerWidth, innerHeight, false)
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix()
    vita.scala(innerHeight * PR / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)))
  }
  addEventListener('resize', misura); misura()
  muoviCamera(10)
  vista.d = bersaglio().d; muoviCamera(10)

  // ── il cammino ──
  const libera = (x, y) => m.calpestabile(x, y)
  const costo = k => (m.calpestabile(k % m.W, (k / m.W) | 0) ? 1 : Infinity)
  function vaiA (tx, tz, intento = null) {
    const da = { x: Math.floor(eroe.x), y: Math.floor(eroe.z) }
    let meta = { x: Math.floor(tx), y: Math.floor(tz) }
    if (meta.x < 0 || meta.y < 0 || meta.x >= m.W || meta.y >= m.H) return false
    if (!libera(da.x, da.y)) { const c = vicinaLibera(eroe.x, eroe.z); if (!c) return false; eroe.x = c.x + 0.5; eroe.z = c.y + 0.5; da.x = c.x; da.y = c.y }
    let esatto = true
    if (!libera(meta.x, meta.y)) { const c = vicinaLibera(tx, tz); if (!c) return false; meta = c; esatto = false }
    const via = cerca(m.W, m.H, costo, da, meta)
    if (!via) return false
    const liscia_ = liscia(m.W, libera, via)
    eroe.via = liscia_.slice(1).map(c => ({ x: c.x + 0.5, z: c.y + 0.5 }))
    if (esatto && !intento && eroe.via.length) eroe.via[eroe.via.length - 1] = { x: tx, z: tz }
    eroe.intento = intento
    return true
  }
  // la cella raggiungibile più vicina in linea d'aria (un tocco sull'acqua, sulla roccia, su una casa)
  let raggiunte = null, raggiunteDa = -1
  function vicinaLibera (tx, tz) {
    const k0 = Math.floor(eroe.z) * m.W + Math.floor(eroe.x)
    if (raggiunteDa !== k0 || !raggiunte) {
      const da = { x: Math.floor(eroe.x), y: Math.floor(eroe.z) }
      raggiunte = libera(da.x, da.y) ? raggiungibili(m.W, m.H, libera, da) : raggiungibili(m.W, m.H, libera, m.partenza)
      raggiunteDa = k0
    }
    let meglio = null, q = Infinity
    const R = 14
    for (let y = Math.floor(tz) - R; y <= Math.floor(tz) + R; y++) for (let x = Math.floor(tx) - R; x <= Math.floor(tx) + R; x++) {
      if (x < 0 || y < 0 || x >= m.W || y >= m.H || !raggiunte[y * m.W + x]) continue
      const d = Math.hypot(x + 0.5 - tx, y + 0.5 - tz)
      if (d < q) { q = d; meglio = { x, y } }
    }
    return meglio
  }

  // ── l'etichetta che compare arrivati (e, dal cielo, i nomi di tutti i posti) ──
  const sopra = document.getElementById('sopra')
  const etichetta = document.createElement('div'); etichetta.className = 'fumetto'; etichetta.hidden = true; sopra.appendChild(etichetta)
  let fumetto = null   // { cosa, fino }
  const nomi = cose.filter(c => c.tipo !== 'mercante').map(c => { const d = document.createElement('div'); d.className = 'nome'; d.textContent = c.nome; d.hidden = true; sopra.appendChild(d); return { c, d } })
  {
    const d = document.createElement('div'); d.className = 'nome villaggio'; d.textContent = 'Il villaggio'; d.hidden = true; sopra.appendChild(d)
    nomi.push({ c: { x: m.piazza.x, z: m.piazza.y, y0: quotaTerreno(m, m.piazza.x, m.piazza.y), alto: 3 }, d })
  }
  const tmp = new THREE.Vector3()
  const aSchermo = (x, y, z) => { tmp.set(x, y, z).project(camera); return [(tmp.x + 1) / 2 * innerWidth, (1 - tmp.y) / 2 * innerHeight, tmp.z < 1] }
  function mostra (c) {
    etichetta.innerHTML = c.tipo === 'ingresso' ? `<small>Ingresso</small><b>${c.nome}</b>` : `<b>${c.nome}</b><small>${c.sotto}</small>`
    etichetta.hidden = false
    etichetta.classList.remove('pop'); void etichetta.offsetWidth; etichetta.classList.add('pop')
    fumetto = { c, fino: tempo + 6 }
  }
  function arrivato (c) {
    mostra(c)
    if (c.tipo === 'ingresso') { c.meta = 1; c.aperto = tempo; if (c.mo.fuoco) vita.accesi.push({ pos: c.mo.fuoco, c }) }
    else { c.saluta = tempo + 2.5 }
    eroe.specchio = c.x < eroe.x
  }

  // ── il dito: un tocco va (o va alla cosa toccata e la usa), trascinando l'eroe insegue, il mouse solo a tasto premuto ──
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2()
  function aTerra (sx, sy) {
    ndc.set(sx / innerWidth * 2 - 1, -sy / innerHeight * 2 + 1)
    ray.setFromCamera(ndc, camera)
    const o = ray.ray.origin, d = ray.ray.direction
    const suolo = (x, z) => Math.max(quotaA(m, x, z), LIVELLO_ACQUA)
    let a = 0, b = 0
    for (let t = 0; t < 600; t += 0.4) { const x = o.x + d.x * t, z = o.z + d.z * t; if (o.y + d.y * t < suolo(x, z)) { b = t; break } a = t }
    if (!b) return null
    for (let i = 0; i < 8; i++) { const t = (a + b) / 2, x = o.x + d.x * t, z = o.z + d.z * t; if (o.y + d.y * t < suolo(x, z)) b = t; else a = t }
    return { x: o.x + d.x * b, z: o.z + d.z * b }
  }
  function cosaToccata (sx, sy) {
    let meglio = null, q = 44
    for (const c of cose) {
      const y0 = c.y0 ?? quotaA(m, c.x, c.z)
      const [ax, ay, av] = aSchermo(c.x, y0, c.z), [bx, by] = aSchermo(c.x, y0 + c.alto, c.z)
      if (!av) continue
      const lx = bx - ax, ly = by - ay, t = Math.max(0, Math.min(1, ((sx - ax) * lx + (sy - ay) * ly) / (lx * lx + ly * ly || 1)))
      const largo = c.tipo === 'ingresso' ? Math.max(18, Math.abs(by - ay) * 0.45) : 10
      const d = Math.hypot(sx - ax - lx * t, sy - ay - ly * t) - largo
      if (d < q) { q = d; meglio = c }
    }
    return meglio
  }
  let premuto = null
  tela.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    tela.setPointerCapture(e.pointerId)
    premuto = { id: e.pointerId, x: e.clientX, y: e.clientY, trascina: false, ultimo: 0 }
  })
  tela.addEventListener('pointermove', e => {
    if (!premuto || premuto.id !== e.pointerId || (e.pointerType === 'mouse' && !e.buttons)) return
    if (!premuto.trascina && Math.hypot(e.clientX - premuto.x, e.clientY - premuto.y) > 16) premuto.trascina = true
    if (!premuto.trascina || vista.cielo) return
    const t = performance.now(); if (t - premuto.ultimo < 110) return
    premuto.ultimo = t
    const p = aTerra(e.clientX, e.clientY); if (p) vaiA(p.x, p.z)
  })
  const lascia = e => {
    if (!premuto || premuto.id !== e.pointerId) return
    const p0 = premuto; premuto = null
    if (p0.trascina || e.type === 'pointercancel') return
    // un tocco: dal cielo si scende dove si è toccato; altrove una cosa (con un margine per il dito) o un punto
    if (vista.cielo) { const p = aTerra(e.clientX, e.clientY); vista.cielo = false; aggiornaBottoni(); if (p) vaiA(p.x, p.z); return }
    const c = cosaToccata(e.clientX, e.clientY)
    if (c) { if (vaiA(c.accanto.x + 0.5, c.accanto.y + 0.5, c) && !eroe.via.length) arrivato(c); return }
    const p = aTerra(e.clientX, e.clientY); if (p) vaiA(p.x, p.z)
  }
  tela.addEventListener('pointerup', lascia)
  tela.addEventListener('pointercancel', lascia)
  tela.addEventListener('contextmenu', e => e.preventDefault())

  // ── i due bottoni di prova ──
  const bCielo = document.getElementById('cielo'), bNebbia = document.getElementById('nebbia')
  function aggiornaBottoni () {
    bCielo.textContent = vista.cielo ? 'eroe' : 'cielo'
    bNebbia.textContent = U.uNebbia.value ? 'nebbia: sì' : 'nebbia: no'
    bNebbia.classList.toggle('acceso', !!U.uNebbia.value)
  }
  bCielo.addEventListener('click', () => { vista.cielo = !vista.cielo; aggiornaBottoni() })
  bNebbia.addEventListener('click', () => { U.uNebbia.value = U.uNebbia.value ? 0 : 1; aggiornaBottoni() })
  aggiornaBottoni()

  // ── il ciclo ──
  const riga = document.getElementById('riga')
  let tempo = 0, prima = performance.now(), contaF = 0, contaT = 0, fps = 0
  renderer.info.autoReset = true
  function passo () {
    requestAnimationFrame(passo)
    const ora = performance.now(), dt = Math.min(0.05, (ora - prima) / 1000); prima = ora
    tempo += dt; U.uTempo.value = tempo
    // l'eroe cammina
    if (eroe.via.length) {
      let resta = PASSO * dt
      while (resta > 0 && eroe.via.length) {
        const w = eroe.via[0], dx = w.x - eroe.x, dz = w.z - eroe.z, d = Math.hypot(dx, dz)
        if (Math.abs(dx) > 0.05) eroe.specchio = dx < 0
        if (d <= resta) { eroe.x = w.x; eroe.z = w.z; eroe.via.shift(); resta -= d } else { eroe.x += dx / d * resta; eroe.z += dz / d * resta; resta = 0 }
      }
      eroe.t += dt * 9
      if (!eroe.via.length && eroe.intento) { arrivato(eroe.intento); eroe.intento = null }
      fEroe.metti('corsa', eroe.t, eroe.specchio)
    } else fEroe.metti('fermo', tempo * 2, eroe.specchio)
    sulTerreno(fEroe, eroe.x, eroe.z)
    const cella = Math.floor(eroe.z) * m.W + Math.floor(eroe.x)
    if (cella !== eroe.cella) { eroe.cella = cella; scopri() }
    // le cose: i monumenti si aprono (e si richiudono quando l'eroe se ne va), i mercanti salutano
    for (const c of cose) {
      if (c.tipo === 'ingresso') {
        if (c.meta && tempo - c.aperto > 4 && Math.hypot(eroe.x - c.x, eroe.z - c.z) > 6) { c.meta = 0; vita.accesi = vita.accesi.filter(a => a.c !== c) }
        c.k += (c.meta - c.k) * (1 - Math.exp(-dt * 2.5))
        c.mo.anim(c.k, tempo)
      } else c.f.metti(c.saluta > tempo ? c.posa : 'fermo', tempo * (c.saluta > tempo ? 5 : 1.5))
    }
    if (kit.ruota) kit.ruota.rotation.x -= dt * 0.9
    if (cristallo) { cristallo.position.y = kit.cristallo.y + Math.sin(tempo * 1.6) * 0.15; cristallo.rotation.y = tempo * 0.8 }
    vita.passo(dt, tempo)
    muoviCamera(dt)
    // il fumetto segue la cosa
    if (fumetto) {
      const c = fumetto.c, y0 = c.y0 ?? quotaA(m, c.x, c.z)
      const [x, y] = aSchermo(c.x, y0 + c.alto + 0.3, c.z)
      etichetta.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`
      if (tempo > fumetto.fino || eroe.intento || vista.cielo) { etichetta.hidden = true; fumetto = null }
    }
    for (const { c, d } of nomi) {
      d.hidden = !vista.cielo
      if (!vista.cielo) continue
      const [x, y] = aSchermo(c.x, (c.y0 ?? quotaA(m, c.x, c.z)) + c.alto, c.z)
      d.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`
    }
    renderer.render(scena, camera)
    contaF++; contaT += dt
    if (contaT > 0.5) { fps = Math.round(contaF / contaT); contaF = 0; contaT = 0; riga.textContent = `${fps} fps · ${renderer.info.render.calls} draw · ${Math.round(renderer.info.render.triangles / 1000)}k tri` }
  }
  requestAnimationFrame(passo)

  // per chi sviluppa, dalla console: vai al posto, accendi la nebbia, guarda dal cielo
  window.__mondo = {
    m, scena, renderer, camera, eroe, cose, natura, tGenera, triKit,
    vai (chiave) { const c = cose.find(q => q.mo?.posto.chiave === chiave || q.nome === chiave || q.f?.v.id === chiave); if (!c) return null; eroe.x = c.accanto.x + 0.5; eroe.z = c.accanto.y + 0.5 + 0.01; eroe.via = []; vista.x = eroe.x; vista.z = eroe.z; arrivato(c); return c.nome },
    porta (x, z) { eroe.x = x; eroe.z = z; eroe.via = []; vista.x = x; vista.z = z },
    cielo (s = !vista.cielo) { vista.cielo = s; aggiornaBottoni() },
    nebbia (s = !U.uNebbia.value) { U.uNebbia.value = s ? 1 : 0; aggiornaBottoni() },
  }
  console.info(`mondo generato in ${Math.round(tGenera)} ms, scena pronta in ${Math.round(performance.now() - t0)} ms`, natura.conta)
}

const img = new Image()
img.onload = () => avvia(img)
img.src = ATLANTE
