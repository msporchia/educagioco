/* ═══════════════════════════════════════════════════════════════════
   IL CATALOGO 3D — la pagina `catalogo-3d.html`

   Elenca le voci (`VOCI`) di due file di dati, uno per gioco:
   `catalogo-3d/fattoria.js` e `catalogo-3d/sotterraneo.js`. Il formato
   e come si aggiunge una voce: docs/core/catalogo-3d.md.

   Un solo WebGLRenderer per tutta la pagina: ogni voce si disegna una
   volta e si copia in un canvas 2D (così un telefono non esaurisce i
   contesti). La vista grande riusa lo stesso renderer e si prende il
   «turno» (`conRenderer`): le anteprime aspettano che si chiuda.

   Indirizzo: `?gioco=fattoria|sotterraneo|entrambi`, `&cat=prop`, `&q=testo`,
   `&angolo=`, `&alto=`, `&vicino=`, `&lato=` (la telecamera delle anteprime),
   `&scheda=1` (senza controlli, per la scheda contatto: `window.__catalogo3d.pronto`
   diventa true a fine lavoro).
   ═══════════════════════════════════════════════════════════════════ */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const GIOCHI = ['tutti', 'fattoria', 'sotterraneo', 'entrambi']
const NOME_GIOCO = { fattoria: 'Fattoria', sotterraneo: 'Sotterraneo', entrambi: 'Entrambi' }
const $ = id => document.getElementById(id)
const el = (tag, cls, testo) => { const e = document.createElement(tag); if (cls) e.className = cls; if (testo != null) e.textContent = testo; return e }
const pausa = () => new Promise(r => setTimeout(r))
const parametri = new URLSearchParams(location.search)
// da dove guarda la telecamera delle anteprime: `&angolo=` gradi attorno (0 = davanti), `&alto=` gradi sopra l'orizzonte, `&vicino=` zoom
const VERSO = parametri.has('angolo') || parametri.has('alto')
  ? new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - Number(parametri.get('alto') ?? 26)), THREE.MathUtils.degToRad(Number(parametri.get('angolo') ?? 38)))
  : new THREE.Vector3(0.78, 0.62, 1).normalize()
const VICINO = Number(parametri.get('vicino')) || 1
const LATO = Number(parametri.get('lato')) || 400     // lato dell'anteprima, in pixel veri

// ══════════ le voci ══════════
async function caricaVoci() {
  const voci = [], note = []
  // `import.meta.glob`, non due `import()` con il nome scritto: se il file di un gioco non c'è ancora, Vite non si rompe
  const trovati = import.meta.glob('./catalogo-3d/*.js')
  for (const nome of ['fattoria', 'sotterraneo']) {
    const carica = trovati[`./catalogo-3d/${nome}.js`]
    if (!carica) {
      note.push(nome === 'sotterraneo'
        ? 'Il sotterraneo non ha ancora consegnato le sue voci (manca strumenti/banco/catalogo-3d/sotterraneo.js).'
        : 'Mancano le voci della fattoria (strumenti/banco/catalogo-3d/fattoria.js).')
      continue
    }
    try {
      const m = await carica()
      if (!Array.isArray(m.VOCI)) throw new Error('il file non esporta VOCI (un array)')
      for (const v of m.VOCI) voci.push({ ...v, sorgente: nome })
    } catch (e) {
      note.push(`Le voci di «${nome}» non si sono caricate: ${e && e.message ? e.message : e}`)
    }
  }
  return { voci, note }
}

// ══════════ il renderer unico e la scena di posa ══════════
let renderer, scena, camera, sole, pavimento, ombraSole
function preparaRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(1); renderer.setSize(LATO, LATO, false)
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05
  scena = new THREE.Scene(); scena.background = new THREE.Color(0xeef1f5)
  scena.add(new THREE.HemisphereLight(0xdff1ff, 0x9aa5a0, 1.2))
  sole = new THREE.DirectionalLight(0xfff0d8, 2.4); sole.castShadow = true; sole.shadow.mapSize.set(1024, 1024); sole.shadow.bias = -0.0005
  scena.add(sole, sole.target)
  pavimento = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshStandardMaterial({ color: 0xdfe4ea, roughness: 1 }))
  pavimento.rotation.x = -Math.PI / 2; pavimento.receiveShadow = true; scena.add(pavimento)
  camera = new THREE.PerspectiveCamera(35, 1, 0.05, 500)
}

/** Mette l'oggetto in posa: pavimento sotto i piedi, sole che segue la misura, telecamera che lo inquadra tutto. */
function metti(obj) {
  scena.add(obj)
  obj.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(obj)
  if (box.isEmpty()) box.set(new THREE.Vector3(-0.5, 0, -0.5), new THREE.Vector3(0.5, 1, 0.5))
  const centro = box.getCenter(new THREE.Vector3()), sfera = box.getBoundingSphere(new THREE.Sphere())
  const r = Math.max(0.3, sfera.radius)
  pavimento.position.set(centro.x, box.min.y - 0.002, centro.z); pavimento.scale.setScalar(r * 1.6)
  sole.position.set(centro.x + r * 1.6, box.min.y + r * 3, centro.z + r * 1.2); sole.target.position.copy(centro)
  const s = sole.shadow.camera; s.left = s.bottom = -r * 1.7; s.right = s.top = r * 1.7; s.near = 0.1; s.far = r * 9; s.updateProjectionMatrix()
  const dist = r / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.08
  camera.position.copy(centro).add(VERSO.clone().multiplyScalar(dist / VICINO))
  camera.near = Math.max(0.02, dist / 200); camera.far = dist * 20; camera.lookAt(centro); camera.updateProjectionMatrix()
  return { centro, r, dist, box }
}

/** Quante Mesh e quanti triangoli: un'istanza vale il numero delle sue istanze. */
function conta(obj) {
  let mesh = 0, tri = 0
  obj.traverse(o => {
    if (!o.isMesh) return
    mesh++
    const g = o.geometry, n = g && (g.index ? g.index.count : g.attributes.position ? g.attributes.position.count : 0) / 3
    tri += (n || 0) * (o.isInstancedMesh ? o.count : 1)
  })
  return { mesh, tri: Math.round(tri) }
}

// il turno del renderer: le anteprime una alla volta, e la vista grande tiene il turno finché è aperta
let coda = Promise.resolve()
function conRenderer(fn) {
  const prossima = coda.then(fn, fn)
  coda = prossima.catch(() => {})
  return prossima
}

// ══════════ una voce ══════════
function chiudiOggetto(obj) { scena.remove(obj) }

async function anteprima(v) {
  v.copie = v.copie || []
  try {
    const obj = await v.crea()
    if (!obj || !obj.isObject3D) throw new Error('crea() non ha restituito un Object3D')
    const c = conta(obj)
    v.mesh = v.mesh != null ? v.mesh : c.mesh; v.tri = c.tri
    renderer.setPixelRatio(1); renderer.setSize(LATO, LATO, false); camera.aspect = 1
    metti(obj)
    renderer.render(scena, camera)
    v.immagine = document.createElement('canvas'); v.immagine.width = v.immagine.height = LATO
    v.immagine.getContext('2d').drawImage(renderer.domElement, 0, 0)
    for (const cv of v.copie) dipingi(cv)
    chiudiOggetto(obj)
  } catch (e) {
    v.errore = (e && e.message) || String(e)
    for (const cv of v.copie) dipingi(cv)
  }
  v.pronta = true
  aggiornaCard(v)
}
function dipingi(cv) {
  const v = cv.__voce
  cv.width = cv.height = LATO
  const x = cv.getContext('2d')
  if (v.immagine) x.drawImage(v.immagine, 0, 0)
  else { x.fillStyle = v.errore ? '#3a1a1a' : '#eef1f5'; x.fillRect(0, 0, LATO, LATO) }
}
function nuovoCanvas(v) {
  const cv = el('canvas'); cv.__voce = v; (v.copie = v.copie || []).push(cv); dipingi(cv); return cv
}

// ══════════ le schede ══════════
const badge = v => el('span', 'badge ' + v.gioco, NOME_GIOCO[v.gioco] || v.gioco)
function costruisciScheda(v) {
  const b = el('button', 'scheda'); b.type = 'button'; b.dataset.id = v.id
  b.append(nuovoCanvas(v))
  const t = el('div', 'testo')
  const r = el('div', 'riga-badge'); r.append(badge(v), el('span', 'cat', v.categoria))
  v.elConti = el('div', 'conti', v.misure ? `misura ${v.misure}` : '')
  v.elErrore = el('div', 'errore-scheda'); v.elErrore.hidden = true
  t.append(el('b', '', v.nome), r, el('div', 'dove', v.dove || ''), el('div', 'file', v.file || ''), v.elConti, v.elErrore)
  b.append(t)
  b.addEventListener('click', () => apriGrande(v))
  v.elScheda = b
  return b
}
function aggiornaCard(v) {
  if (!v.elConti) return
  const p = []
  if (v.misure) p.push(`misura ${v.misure}`)
  if (v.mesh != null) p.push(`${v.mesh} mesh`)
  if (v.tri) p.push(`${v.tri.toLocaleString('it')} triangoli`)
  v.elConti.textContent = p.join(' · ')
  if (v.errore) { v.elErrore.hidden = false; v.elErrore.textContent = 'Non si crea: ' + v.errore }
}

// ══════════ i filtri ══════════
const stato = { gioco: GIOCHI.includes(parametri.get('gioco')) ? parametri.get('gioco') : 'tutti', cat: parametri.get('cat') || '', q: parametri.get('q') || '' }
function applicaFiltri(voci) {
  const q = stato.q.trim().toLowerCase()
  let visibili = 0
  for (const v of voci) {
    const ok = (stato.gioco === 'tutti' || v.gioco === stato.gioco) && (!stato.cat || v.categoria === stato.cat)
      && (!q || [v.nome, v.dove, v.file, v.categoria, v.id].join(' ').toLowerCase().includes(q))
    v.elScheda.hidden = !ok; if (ok) visibili++
  }
  $('vuoto').hidden = visibili > 0
  const per = g => voci.filter(v => v.gioco === g).length
  $('riassunto').textContent = `${visibili} di ${voci.length} modelli · fattoria ${per('fattoria')}, sotterraneo ${per('sotterraneo')}, entrambi ${per('entrambi')}`
}
function costruisciFiltri(voci) {
  const box = $('filtri-gioco')
  for (const g of GIOCHI) {
    const b = el('button', 'chip', g === 'tutti' ? 'Tutti' : NOME_GIOCO[g]); b.type = 'button'; b.setAttribute('aria-pressed', String(stato.gioco === g))
    b.addEventListener('click', () => { stato.gioco = g; for (const x of box.children) x.setAttribute('aria-pressed', String(x === b)); applicaFiltri(voci) })
    box.append(b)
  }
  const sel = $('categoria'); sel.append(new Option('Tutte le categorie', ''))
  for (const c of [...new Set(voci.map(v => v.categoria))].sort()) sel.append(new Option(c, c))
  sel.value = stato.cat
  sel.addEventListener('change', () => { stato.cat = sel.value; applicaFiltri(voci) })
  $('cerca').value = stato.q
  $('cerca').addEventListener('input', e => { stato.q = e.target.value; applicaFiltri(voci) })
}

// ══════════ «si assomigliano» ══════════
const SCARTO = new Set(['variante', 'vecchio', 'vecchia', 'grande', 'piccolo', 'piccola', 'con', 'del', 'della', 'dei', 'delle', 'una', 'uno', 'the'])
function radici(nome) {
  return nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\(.*?\)/g, ' ').split(/[^a-z]+/)
    .filter(t => t.length >= 4 && !SCARTO.has(t)).map(t => t.slice(0, 5))
}
function trovaCoppie(voci) {
  const coppie = []
  for (let a = 0; a < voci.length; a++) for (let b = a + 1; b < voci.length; b++) {
    const x = voci[a], y = voci[b]
    if (x.categoria !== y.categoria || x.gioco === y.gioco || x.gioco === 'entrambi' || y.gioco === 'entrambi') continue
    const ra = radici(x.nome), rb = radici(y.nome)
    const comune = ra.find(t => rb.includes(t))
    if (comune) coppie.push([x, y, comune])
  }
  return coppie
}
function costruisciCoppie(voci) {
  const coppie = trovaCoppie(voci)
  $('titolo-coppie').hidden = false
  if (!coppie.length) { $('coppie').append(el('p', 'vuoto', 'Per ora nessuna coppia di giochi diversi con lo stesso genere e un nome simile.')); return }
  for (const [x, y, k] of coppie) {
    const c = el('div', 'coppia'); c.append(el('h3', '', `${x.categoria} · «${k}…»`))
    const due = el('div', 'due')
    for (const v of [x, y]) {
      const lato = el('div', 'lato'); lato.append(nuovoCanvas(v), (() => { const r = el('div', 'etichetta'); r.append(badge(v), ' ', el('b', '', v.nome), el('div', 'dove', v.dove || '')); return r })())
      lato.addEventListener('click', () => apriGrande(v)); due.append(lato)
    }
    c.append(due); $('coppie').append(c)
  }
}

// ══════════ la vista grande ══════════
let aperta = null
function apriGrande(v) {
  if (aperta) return
  aperta = true
  const velo = $('velo'), vista = $('v-vista'), info = $('v-info')
  $('v-nome').textContent = v.nome
  info.replaceChildren()
  const r = el('div', 'riga-badge'); r.append(badge(v), el('span', 'cat', v.categoria)); info.append(r)
  info.append(el('div', 'dove', v.dove || ''), el('div', 'file', v.file || ''))
  const conti = el('div', 'conti'); info.append(conti)
  velo.hidden = false
  let chiudi
  const fine = new Promise(res => { chiudi = res })
  let ferma = false
  conRenderer(async () => {
    if (ferma) return
    let obj, controlli, raf = 0
    const dimensiona = () => {
      const w = vista.clientWidth || 300, h = vista.clientHeight || 300
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(w, h, false)
      camera.aspect = w / h; camera.updateProjectionMatrix()
    }
    try {
      obj = await v.crea()
      if (!obj || !obj.isObject3D) throw new Error('crea() non ha restituito un Object3D')
      const c = conta(obj); v.tri = c.tri; v.mesh = v.mesh != null ? v.mesh : c.mesh
      conti.textContent = [v.misure && `misura ${v.misure}`, `${v.mesh} mesh`, `${c.tri.toLocaleString('it')} triangoli`].filter(Boolean).join(' · ')
      vista.prepend(renderer.domElement)
      dimensiona()
      const p = metti(obj)
      controlli = new OrbitControls(camera, renderer.domElement)
      controlli.target.copy(p.centro); controlli.enableDamping = true; controlli.autoRotate = true; controlli.autoRotateSpeed = 1.6
      controlli.minDistance = p.r * 0.6; controlli.maxDistance = p.dist * 4; controlli.maxPolarAngle = Math.PI * 0.495
      controlli.addEventListener('start', () => { controlli.autoRotate = false })
      controlli.update()
      const orologio = new THREE.Clock(); let t = 0
      const anima = typeof v.anima === 'function' ? v.anima : (g, dt, tt) => g.userData && typeof g.userData.anima === 'function' && g.userData.anima(dt, tt)
      const giro = () => {
        raf = requestAnimationFrame(giro)
        const dt = Math.min(0.1, orologio.getDelta()); t += dt
        try { anima(obj, dt, t) } catch (e) { /* un'animazione rotta non ferma la vista */ }
        controlli.update(); renderer.render(scena, camera)
      }
      giro()
    } catch (e) {
      conti.textContent = 'Non si crea: ' + ((e && e.message) || e)
    }
    const onSize = () => { dimensiona() }
    window.addEventListener('resize', onSize)
    await fine
    window.removeEventListener('resize', onSize)
    cancelAnimationFrame(raf)
    if (controlli) controlli.dispose()
    if (obj) chiudiOggetto(obj)
    renderer.domElement.remove()
    renderer.setPixelRatio(1); renderer.setSize(LATO, LATO, false); camera.aspect = 1; camera.updateProjectionMatrix()
  })
  const chiudiVista = () => {
    ferma = true; velo.hidden = true; aperta = null
    $('v-x').removeEventListener('click', chiudiVista); document.removeEventListener('keydown', tasto)
    chiudi()
  }
  const tasto = e => { if (e.key === 'Escape') chiudiVista() }
  $('v-x').addEventListener('click', chiudiVista); document.addEventListener('keydown', tasto)
}

// ══════════ l'avvio ══════════
export async function avvia() {
  if (parametri.get('scheda')) document.body.classList.add('contatto')
  const stato_ = (window.__catalogo3d = { voci: [], pronto: false, errori: [] })
  const { voci, note } = await caricaVoci()
  stato_.voci = voci
  for (const n of note) $('note').append(el('p', 'nota', n))
  // id doppi o campi mancanti: si dice, non si scarta
  const visti = new Set()
  for (const v of voci) {
    const mancano = ['id', 'nome', 'gioco', 'categoria', 'crea'].filter(k => !v[k])
    if (mancano.length) { v.id = v.id || `senza-id-${visti.size}`; v.nome = v.nome || v.id; v.gioco = v.gioco || 'entrambi'; v.categoria = v.categoria || 'altro'; v.errore = `voce incompleta: manca ${mancano.join(', ')}`; v.crea = v.crea || (() => { throw new Error(v.errore) }) }
    if (visti.has(v.id)) $('note').append(el('p', 'nota', `id doppio: ${v.id}`))
    visti.add(v.id)
  }
  try { preparaRenderer() } catch (e) {
    $('note').append(el('p', 'nota', 'WebGL non parte su questo browser: ' + ((e && e.message) || e)))
    stato_.pronto = true; return
  }
  const gr = $('griglia')
  for (const v of voci) gr.append(costruisciScheda(v))
  costruisciFiltri(voci); applicaFiltri(voci); costruisciCoppie(voci)
  for (const v of voci) { await conRenderer(() => anteprima(v)); await pausa() }
  stato_.errori = voci.filter(v => v.errore).map(v => `${v.id}: ${v.errore}`)
  if (stato_.errori.length) $('note').append(el('p', 'nota', `${stato_.errori.length} voci non si creano: ${stato_.errori.slice(0, 3).join(' · ')}${stato_.errori.length > 3 ? '…' : ''}`))
  stato_.pronto = true
}
