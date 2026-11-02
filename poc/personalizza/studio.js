/* Lo studio di posa del mock: per ogni posa di scenari.js costruisce il modello vero del gioco (il contadino e gli eroi dal ramo
   develop, `@sviluppo`; il beagle e gli addobbi da main, `@principale`: vedi fai.mjs), lo gira di 45° alla volta e lo fotografa su
   fondo trasparente. Esito in `window.__studio = { pronto, foto: { idPosa: [8 data-URL] }, errori }`.
   La telecamera è ferma per scenario (presa sulla posa di serie, con spazio sopra per i cappelli alti): cambiando cappello la
   figura non salta di misura, e i gettoni possono ritagliare la stessa zona da ogni foto. */
import * as THREE from 'three'
import './scenari.js'
import { creaContadino } from '@sviluppo/giochi/fattoria3d/scena3d/modelli-compagni.js'
import { CACHE_MODELLI } from '@sviluppo/giochi/fattoria3d/scena3d/cache-modelli.js'
import { opzione } from '@sviluppo/giochi/fattoria3d/dati/abiti.js'
import { creaEroeDa } from '@sviluppo/giochi/sotterraneo/scena3d/eroe-aspetto.js'
import { spriteConAspetto } from '@sviluppo/giochi/sotterraneo/dati/eroi.js'
import { vestiEroe, posa as posaEroe } from '@sviluppo/giochi/sotterraneo/scena3d/eroe3d.js'
import { copri } from '@sviluppo/giochi/sotterraneo/scena3d/eroi3d/copricapi.js'
import { tingiAggiunte } from '@sviluppo/giochi/sotterraneo/scena3d/tinge3d.js'
import { creaBestia, posaBeagle } from '@principale/giochi/fattoria3d/scena3d/modelli-bestie.js'
import { vestiBestia } from '@principale/giochi/fattoria3d/scena3d/modelli-addobbi.js'
import { comeCompagno } from '@principale/giochi/fattoria3d/dati/bestie.js'
import { CACHE_MODELLI as CACHE_PRINCIPALE } from '@principale/giochi/fattoria3d/scena3d/cache-modelli.js'

const parametri = new URLSearchParams(location.search)
const LATO = Number(parametri.get('lato')) || 240
const QUALITA = Number(parametri.get('qualita')) || 0.72
const SOLO = parametri.get('solo') || ''              // `?solo=fattoria`: un solo scenario (per provare)
const { SCENARI, ANGOLI } = globalThis
CACHE_MODELLI.acceso = false; CACHE_PRINCIPALE.acceso = false   // i colori dei cappelli si cambiano sul catalogo: ogni modello si rifà

// ── dallo stato del mock al modello del gioco ──
const parti = v => { const [o, f, c] = String(v || '-/-/-').split('/'); return { o, f, c } }
const statoDi = (s, p) => ({ ...s.base[p.chi], ...p.diff })
const COLLO = { fazzoletto: c => 'fazzoletto-' + c, sciarpa: c => (c === 'verde' ? 'sciarpa' : 'sciarpa-' + c) }

function contadino(s, p) {
  const st = statoDi(s, p), P = k => parti(st[k])
  const cap = P('capelli'), testa = P('testa'), abito = {
    persona: p.chi, pelle: P('pelle').c, taglio: cap.f, capelli: cap.c, barba: P('barba').f,
    maglia: P('busto').f, pantalone: P('gambe').c, stivali: P('piedi').c, collo: COLLO[P('collo').o](P('collo').c),
    cappello: { cappello: testa.f, berretto: testa.f, cilindro: 'cilindro', corona: 'corona', 'niente-testa': 'niente' }[testa.o],
  }
  // il colore del cappello: nel gioco ce n'è uno solo, qui si cambia sul catalogo per il tempo della foto
  const o = opzione('cappello', abito.cappello), prima = o && o.c
  const css = testa.c && testa.c !== '-' && s.oggetti[testa.o].colori?.find(c => c.id === testa.c)?.css
  if (o && css && testa.c !== 'naturale') o.c = parseInt(css.slice(1), 16)
  try { return creaContadino(abito) } finally { if (o) o.c = prima }
}

const TINTA = { rosso: 'rosso', blu: 'blu', verde: 'verde', oro: 'oro', viola: 'viola', nero: 'nero' }
function eroe(s, p) {
  const st = statoDi(s, p), P = k => parti(st[k]), n = x => (x && x !== '-' ? x : null)
  const cap = P('capelli')
  const sprite = spriteConAspetto(p.chi, { pelle: n(P('pelle').c), capelli: n(cap.c), taglio: n(cap.f), barba: n(P('barba').f) })
  const g = creaEroeDa(sprite)
  vestiEroe(g, { mano: P('mano').f })
  const t = P('testa')
  if (t.o !== 'serie') {
    const id = n(t.f) || t.o
    tingiAggiunte(g, TINTA[t.c] || null, () => copri(g, id))
  }
  posaEroe(g, 0, false, null)
  return g
}

function beagle(s, p) {
  const st = statoDi(s, p), addosso = {}
  for (const posto of s.posti) { const { o, f, c } = parti(st[posto]); if (!o.startsWith('niente')) addosso[posto] = `${f}:${c}` }
  const g = creaBestia(comeCompagno('beagle'))
  posaBeagle(g, { stato: 'sta', t: 0.4 })
  vestiBestia(g, addosso)
  return g
}
const COSTRUTTORE = { fattoria: contadino, sotterraneo: eroe, animali: beagle }

// ── la scena ──
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(1); renderer.setSize(LATO, LATO, false); renderer.setClearColor(0x000000, 0)
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1
document.body.append(renderer.domElement)
const scena = new THREE.Scene()
scena.add(new THREE.HemisphereLight(0xfff6e8, 0x8a8478, 1.5))
const sole = new THREE.DirectionalLight(0xfff0d8, 2.2); sole.position.set(1.5, 3, 2.5); scena.add(sole)
const contro = new THREE.DirectionalLight(0xd8e8ff, 0.7); contro.position.set(-2, 1.5, -2); scena.add(contro)
const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 100)

/** La telecamera per lo scenario, dalla posa di serie: di fronte, un poco dall'alto, con spazio sopra (`sopra`) per i cappelli alti. */
function inquadra(obj, { sopra = 0.3, alto = 8 } = {}) {
  obj.updateMatrixWorld(true)
  // solo le mesh visibili: il contadino porta con sé la falce e l'ascia spente, che allargavano la scatola
  const b = new THREE.Box3()
  obj.traverseVisible(o => { if (o.isMesh) { o.geometry.computeBoundingBox(); b.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)) } })
  const dim = b.getSize(new THREE.Vector3())
  b.max.y += dim.y * sopra; b.min.y -= dim.y * 0.04
  const c = b.getCenter(new THREE.Vector3())
  // il lato che serve: l'altezza, o la lunghezza quando lo si gira di fianco (il cane)
  const lato = Math.max(b.max.y - b.min.y, dim.x, dim.z) * 1.04
  const dist = lato / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) + Math.max(dim.x, dim.z) / 2
  const a = THREE.MathUtils.degToRad(alto)
  camera.position.set(c.x, c.y + Math.sin(a) * dist, c.z + Math.cos(a) * dist)
  camera.lookAt(c); camera.updateProjectionMatrix()
}

async function fotografa(obj) {
  const fuori = []
  const perno = new THREE.Group(); perno.add(obj); scena.add(perno)
  for (const ang of ANGOLI) {
    perno.rotation.y = -THREE.MathUtils.degToRad(ang)      // angolo 90: lo si vede dal suo fianco sinistro, come girandolo verso destra
    renderer.render(scena, camera)
    fuori.push(renderer.domElement.toDataURL('image/webp', QUALITA))
  }
  scena.remove(perno)
  return fuori
}

const stato = (window.__studio = { pronto: false, foto: {}, errori: [], fatte: 0 })
const INQUADRA = { fattoria: { sopra: 0.32 }, sotterraneo: { sopra: 0.22 }, animali: { sopra: 0.25, alto: 14 } }
for (const s of Object.values(SCENARI)) {
  if (SOLO && s.id !== SOLO) continue
  const crea = COSTRUTTORE[s.id]
  try { inquadra(crea(s, { chi: s.chiDiSerie, diff: {} }), INQUADRA[s.id]) } catch (e) { stato.errori.push(`${s.id}: la posa di serie non si crea: ${e.message}`); continue }
  for (const p of s.pose) {
    try { stato.foto[p.id] = await fotografa(crea(s, p)) } catch (e) { stato.errori.push(`${p.id}: ${e.message}`) }
    stato.fatte++
    document.getElementById('esito').textContent = `${stato.fatte} pose`
    await new Promise(r => setTimeout(r))
  }
}
stato.pronto = true
document.getElementById('esito').textContent = `fatto: ${stato.fatte} pose, ${stato.errori.length} errori`
