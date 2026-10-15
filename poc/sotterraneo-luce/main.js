// Il sotterraneo con la GPU: three.js, luci vere, ombre, normal map, nebbia, polvere, scintille. È un altro renderer
// del gioco vero: la discesa, i mostri, lo scontro a turni, le domande e la barra sono quelli di src/ (vero.js, Sopra.vue);
// qui si disegna e si racconta. Le scelte di prova stanno nell'indirizzo, per chi sviluppa (?tappa= ?eroe= ?seme=
// ?vetrina=1 ?fontana=vuota ?celle= ?inc= ?fov= ?bloom=1 ?pr=); di difetto la prima discesa col cavaliere. Cosa è: poc/sotterraneo-luce.md
import * as THREE from 'three'
import { createApp } from 'vue'
import Sopra from './Sopra.vue'
import { corsaDiProva, nuovoPonte, mappaDaCorsa, figuraDelMostro } from './vero.js'
import { percorso, raggiungibili } from '../../src/motore/passi.js'
import { figuraDelGrosso } from '../../src/giochi/sotterraneo/dati/grossi.js'
import { ATLANTE, PEZZI, VOCI } from '../../src/giochi/sotterraneo/dati/atlante.js'
import { generaVetrina, strada, campoVisivo, PAVIMENTO, COLONNA, OGGETTO } from './mappa.js'
import { pavimentoHD, muroHD, daPezzo, normaliAtlante } from './trame.js'
import { creaFontana } from './fontana.js'
import { creaVetrina, legno } from './vetrina.js'
import { creaBotti } from './botti.js'
import { creaPortale } from './portale3d.js'
import { luciCondivise, creaMaschera, conMaschera, creaNebbia, creaPolvere, creaScintille, materialeFiamma, creaPost, MAX_LUCI } from './effetti.js'

// le scelte di prova, dall'indirizzo
const Q = new URLSearchParams(location.search)
export const OPZ = {
  scena: Q.get('vetrina') === '1' ? 'vetrina' : 'esplora',
  tappa: Number(Q.get('tappa') || 0), eroe: Q.get('eroe') || 'cavaliere', seme: Number(Q.get('seme') || 7),
  fontanaVuota: Q.get('fontana') === 'vuota', bloom: Q.get('bloom') === '1',
}
const TRAME = Q.get('trame') === 'pixel' ? 'pixel' : 'hd'
const PR_FISSO = Q.get('pr') ? Number(Q.get('pr')) : null

// ── la telecamera: tutto qui. Si provano dall'indirizzo: ?inc=55&fov=34&celle=15
// Non si dà la distanza ma quanto si vuole vedere: almeno `celle` di largo e `celle` di profondo
// attorno all'eroe; la distanza viene da sé, così un telefono in verticale (stretto) si allontana
// di più e vede le stesse stanze di uno schermo largo.
// Storia dei valori: 55°/34°/~6 celle (troppo addosso, «una piantina con gli sprite schiacciati»),
// 43°/32°/~8 celle (più di fronte, ancora «troppo avanti»). Ora una vista da mappa di gioco:
// 52° dall'orizzonte, 15 celle — si vedono le stanze e i corridoi attorno.
export const CAMERA = {
  inclinazione: Number(Q.get('inc') || 52),   // gradi sotto l'orizzonte: 90 = dall'alto a piombo
  fov: Number(Q.get('fov') || 34),            // apertura verticale, gradi
  celle: Number(Q.get('celle') || 15),        // quante celle si vedono almeno, in largo e in profondo
  celleScontro: Number(Q.get('celleScontro') || 9.5),   // nello scontro la telecamera si avvicina
  zoom: 1,                                    // la rotella e il cursore del pannello
  guarda: 0.35,                               // il punto guardato: poco sopra il pavimento
}
// la luce: l'esposizione e il minimo che non lascia mai il nero dentro la vista
const ESPOSIZIONE = Number(Q.get('esp') || 1.4)
const AMBIENTE = 2.6          // la luce d'ambiente (emisferica), solo dentro quello che si vede
const MINIMO_FIGURE = 0.32     // le figure non scendono mai sotto questa frazione del loro colore
const RIM = 0.55               // il contorno caldo che stacca le figure dal fondo
const ALTO_MURO = 1.25
const PR_MAX = Math.min(devicePixelRatio || 1, 1.5)
const N_TORCE = 5, FETTE = 5, POLVERE = 450

function avvia (img) {
  const BLOOM = OPZ.bloom
  const via = []   // quello da disfare quando si ricostruisce la scena (ascoltatori, la sovrimpressione, il renderer)
  const ascolta = (bersaglio, ev, f, o) => { bersaglio.addEventListener(ev, f, o); via.push(() => bersaglio.removeEventListener(ev, f, o)) }
  // ── l'atlante ──
  const AW = img.width, AH = img.height
  const texAtlante = new THREE.Texture(img)
  texAtlante.colorSpace = THREE.SRGBColorSpace
  texAtlante.magFilter = THREE.NearestFilter; texAtlante.minFilter = THREE.NearestFilter; texAtlante.generateMipmaps = false
  texAtlante.needsUpdate = true
  const texNormAtlante = normaliAtlante(img)
  const voce = Object.fromEntries(VOCI.map(v => [v.id, v]))

  // ── renderer, scena, telecamera ──
  // una tela nuova a ogni scena: il renderer di prima si butta col suo contesto
  const vecchia = document.getElementById('tela')
  const tela = document.createElement('canvas'); tela.id = 'tela'
  vecchia.replaceWith(tela)
  const renderer = new THREE.WebGLRenderer({ canvas: tela, antialias: false, powerPreference: 'high-performance' })
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = ESPOSIZIONE
  renderer.info.autoReset = false   // il composer fa più passate: si azzera a mano, una volta per fotogramma
  let pr = PR_FISSO || PR_MAX
  renderer.setPixelRatio(pr)
  const scena = new THREE.Scene()
  scena.background = new THREE.Color(0x000000)
  const camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, 0.5, 200)
  scena.add(new THREE.HemisphereLight(0xb8a894, 0x3a3430, AMBIENTE))

  const VETRINA = OPZ.scena === 'vetrina'
  // la discesa vera (vero.js): il motore genera il piano, il renderer lo traduce; la vetrina è una sala sua
  const corsa = VETRINA ? null : corsaDiProva(OPZ)
  const ponte = corsa ? nuovoPonte(corsa) : null
  const m = VETRINA ? generaVetrina() : mappaDaCorsa(corsa)
  const maschera = creaMaschera(m.W, m.H)
  const luci = luciCondivise()

  // ── pavimento: un quadrato per cella (anche sotto le colonne) ──
  const tPav = TRAME === 'hd' ? pavimentoHD() : daPezzo(img, PEZZI['cripta-pav-stanze'])
  {
    const pos = [], uv = [], nor = [], idx = []
    const cu = tPav.celle || tPav.celleX, cv = tPav.celle || tPav.celleY
    for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) {
      const c = m.celle[m.id(x, y)]
      if (c !== PAVIMENTO && c !== COLONNA && c !== OGGETTO) continue
      const b = pos.length / 3
      for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { pos.push(x + dx, 0, y + dz); uv.push((x + dx) / cu, -(y + dz) / cv); nor.push(0, 1, 0) }
      idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
    g.setIndex(idx)
    const mat = conMaschera(new THREE.MeshStandardMaterial({ map: tPav.map, normalMap: tPav.normalMap, roughnessMap: tPav.roughnessMap, roughness: 1, metalness: 0, normalScale: new THREE.Vector2(1.2, 1.2) }), maschera, { spinta: 0 })
    const pav = new THREE.Mesh(g, mat)
    pav.receiveShadow = true
    scena.add(pav)
  }

  // ── muri: un parallelepipedo per cella di roccia che tocca il pavimento ──
  const tMuro = TRAME === 'hd' ? muroHD(ALTO_MURO) : daPezzo(img, PEZZI['cripta-faccia-liscia'], 8, 2.5)
  if (TRAME === 'pixel') for (const k of ['map', 'normalMap', 'roughnessMap']) tMuro[k].repeat.set(1, ALTO_MURO)
  const matLato = conMaschera(new THREE.MeshStandardMaterial({ map: tMuro.map, normalMap: tMuro.normalMap, roughnessMap: tMuro.roughnessMap, roughness: 1, metalness: 0, normalScale: new THREE.Vector2(1.4, 1.4) }), maschera, { buco: true })
  const matCima = conMaschera(new THREE.MeshStandardMaterial({ color: 0x2c2723, roughness: 1 }), maschera, { spinta: 0, buco: true })
  // I muri che hanno il pavimento a nord stanno fra la telecamera e una stanza o un corridoio: sono
  // parapetti bassi (PARAPETTO), così l'eroe si vede sempre, anche in un corridoio largo una cella.
  // Quel che resta di alto e gli copre i piedi (colonne, spigoli) si sfalda nel buco (conMaschera, `buco`).
  // Provato prima solo il buco retinato: l'eroe si vedeva, ma il corridoio restava una striscia nera con un foro.
  const PARAPETTO = 0.32
  const basso = c => m.pav(c.x, c.y - 1) || m.celle[m.id(c.x, Math.max(0, c.y - 1))] === COLONNA
  const matCimaParapetto = conMaschera(new THREE.MeshStandardMaterial({ color: 0x6a5f55, roughness: 0.9, normalMap: tMuro.normalMap }), maschera, { spinta: 0 })
  const matLatoBasso = conMaschera(matLato.clone(), maschera)   // il parapetto non si sfalda: è già basso
  // nello scontro i muri alti alle spalle dei combattenti si abbassano a parapetto (si rialzano dopo):
  // le teste non si leggono mai dentro la parete. `abbassa(celle)` dice quali; il resto lo fa `passo`
  const muriAlti = { mesh: null, celle: [], indice: new Map(), alto: null, meta: null, mt: new THREE.Matrix4() }
  {
    const alti = m.muri.filter(c => !basso(c)), bassi = m.muri.filter(basso)
    muriAlti.celle = alti; alti.forEach((c, i) => muriAlti.indice.set(m.id(c.x, c.y), i))
    muriAlti.alto = new Float32Array(alti.length).fill(1); muriAlti.meta = new Float32Array(alti.length).fill(1)
    const geo = new THREE.BoxGeometry(1, ALTO_MURO, 1)
    const muri = new THREE.InstancedMesh(geo, [matLato, matLato, matCima, matCima, matLato, matLato], alti.length)
    const mt = new THREE.Matrix4()
    alti.forEach((c, i) => { mt.makeTranslation(c.x + 0.5, ALTO_MURO / 2, c.y + 0.5); muri.setMatrixAt(i, mt) })
    const parapetti = new THREE.InstancedMesh(new THREE.BoxGeometry(1, PARAPETTO, 1), [matLatoBasso, matLatoBasso, matCimaParapetto, matCima, matLatoBasso, matLatoBasso], bassi.length)
    bassi.forEach((c, i) => { mt.makeTranslation(c.x + 0.5, PARAPETTO / 2, c.y + 0.5); parapetti.setMatrixAt(i, mt) })
    parapetti.castShadow = true; parapetti.receiveShadow = true
    scena.add(parapetti)
    muri.castShadow = true; muri.receiveShadow = true
    scena.add(muri); muriAlti.mesh = muri
  }

  // ── colonne: vere, cilindri con base e capitello, perché facciano ombra ──
  {
    const fusto = new THREE.CylinderGeometry(0.27, 0.3, ALTO_MURO, 14, 1, true)
    const base = new THREE.BoxGeometry(0.72, 0.16, 0.72)
    const matPietra = conMaschera(new THREE.MeshStandardMaterial({ color: 0x7a7068, roughness: 0.85 }), maschera, { buco: true })
    for (const c of m.colonne) {
      const g = new THREE.Group()
      const f = new THREE.Mesh(fusto, matLato); f.position.y = ALTO_MURO / 2
      const b = new THREE.Mesh(base, matPietra); b.position.y = 0.08
      const k = new THREE.Mesh(base, matPietra); k.position.y = ALTO_MURO - 0.08
      for (const o of [f, b, k]) { o.castShadow = true; o.receiveShadow = true; g.add(o) }
      g.position.set(c.x + 0.5, 0, c.y + 0.5)
      scena.add(g)
    }
  }

  // ── figure dell'atlante come cartelli in piedi ──
  // Le figure stanno ritte (non piegate all'indietro verso la telecamera): piegate, la testa finiva
  // dentro il muro alle loro spalle. Lo schiacciamento della vista dall'alto lo ripaga ALLUNGA.
  const INCLINA = 0, ALLUNGA = 1.3
  const geoFigura = () => { const g = new THREE.PlaneGeometry(1, 1); g.translate(0, 0.5, 0); return g }
  function figura (id, { ricordo = true, ombra = true } = {}) {
    const v = voce[id] || voce['cripta-' + id]
    if (!v) throw new Error('manca nell\'atlante: ' + id)
    const mat = conMaschera(new THREE.MeshStandardMaterial({
      map: texAtlante, normalMap: texNormAtlante, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.75, metalness: 0,
      emissiveMap: texAtlante, emissive: new THREE.Color(0, 0, 0),
    // spinta 0: la luce si legge nella cella dei piedi, non in quella davanti (può essere di là da un muro)
    }), maschera, { ricordo, spinta: 0, prima: `
        // né troppo buie né bruciate: fra il minimo e 1,3 volte il loro colore (il lampo del colpo, emissivo, resta sopra)
      outgoingLight = clamp(outgoingLight - totalEmissiveRadiance, diffuseColor.rgb * ${MINIMO_FIGURE.toFixed(2)}, diffuseColor.rgb * 1.3) + totalEmissiveRadiance;
        outgoingLight += vec3(1.0, 0.82, 0.6) * pow(1.0 - clamp(abs(normal.z), 0.0, 1.0), 1.5) * ${RIM.toFixed(2)} * (0.4 + diffuseColor.rgb);` })
    const mesh = new THREE.Mesh(geoFigura(), mat)
    mesh.castShadow = ombra
    mesh.rotation.x = INCLINA
    const f = { v, mesh, mat, posa: Object.keys(v.pose).includes('fermo') ? 'fermo' : Object.keys(v.pose)[0], t: 0, specchio: false, quadro: null }
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
      mesh.scale.set(w / 16, h / 16 * ALLUNGA, 1)
    }
    f.metti(f.posa)
    scena.add(mesh)
    return f
  }

  for (const a of m.arredi) { if (!voce[a.pezzo] && !voce['cripta-' + a.pezzo]) continue; const f = figura(a.pezzo); f.mesh.position.set(a.x + 0.5, 0, a.y + 0.35) }

  // ── torce a muro e bracieri: una fiamma disegnata, una luce che trema ──
  const matFiamma = materialeFiamma()
  const fiamme = []
  function fiamma (x, y, z, s) {
    const g = new THREE.PlaneGeometry(0.34 * s, 0.55 * s); g.translate(0, 0.2 * s, 0)
    g.setAttribute('semeF', new THREE.Float32BufferAttribute(new Array(4).fill(Math.random() * 10), 1))
    const q = new THREE.Mesh(g, matFiamma); q.position.set(x, y, z); q.renderOrder = 13
    q.userData.cella = m.id(Math.floor(x), Math.floor(z))   // si vede solo se quella cella è stata vista
    scena.add(q); fiamme.push(q)
    return q
  }
  const fuochi = []   // { pos, seme, forza }
  const staffe = []
  const matStaffa = conMaschera(new THREE.MeshStandardMaterial({ color: 0x3a2c22, roughness: 0.6, metalness: 0.6 }), maschera, { buco: true })
  for (const t of m.torce) {
    if (m.pav(t.x, t.y - 1)) continue   // su un parapetto non si appende niente
    const z = t.y + 1
    const staffa = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.14), matStaffa)
    staffa.position.set(t.x + 0.5, 0.72, z + 0.06); staffa.rotation.x = -0.35; staffa.castShadow = true
    scena.add(staffa)
    const q = fiamma(t.x + 0.5, 0.84, z + 0.14, 1.4)
    q.userData.muro = staffa.userData.muro = muriAlti.indice.get(m.id(t.x, t.y)); staffe.push(staffa)   // col muro abbassato spariscono
    fuochi.push({ pos: new THREE.Vector3(t.x + 0.5, 1.0, z + 0.3), seme: Math.random() * 100, forza: 4.5, cella: m.id(t.x, t.y + 1) })
  }
  for (const b of m.bracieri) {
    const f = figura(b.pezzo && voce[b.pezzo] ? b.pezzo : 'braciere'); f.mesh.position.set(b.x + 0.5, 0, b.y + 0.5)
    fiamma(b.x + 0.5, 0.5, b.y + 0.55, 1.5)
    fuochi.push({ pos: new THREE.Vector3(b.x + 0.5, 0.95, b.y + 0.6), seme: Math.random() * 100, forza: 6, cella: m.id(b.x, b.y) })
  }
  const luciTorce = Array.from({ length: N_TORCE }, () => {
    const l = new THREE.PointLight(0xff8a3c, 0, 7, 1.7); scena.add(l); return l
  })

  // ── l'eroe, con la sua torcia: un alone corto (con ombre tutt'attorno) e un cono lungo davanti ──
  const eroe = { x: corsa ? corsa.eroe.x : m.partenza.x + 0.5, z: corsa ? corsa.eroe.y : m.partenza.y + 0.5, via: [], verso: new THREE.Vector2(0, -1),
    versoLuce: new THREE.Vector2(0, -1), t: 0, colpito: 0, cura: 0, cella: -1, meta: null, assalto: null, gira: 0 }
  const figEroe = figura(corsa && voce[corsa.io.sprite] ? corsa.io.sprite : 'cavaliere', { ombra: false })
  const alone = new THREE.PointLight(0xffb070, 9, 10, 1.0)
  alone.castShadow = true; alone.shadow.intensity = 0.7; alone.shadow.radius = 4; alone.shadow.mapSize.set(512, 512); alone.shadow.bias = -0.004; alone.shadow.normalBias = 0.03; alone.shadow.camera.near = 0.1
  const cono = new THREE.SpotLight(0xffc488, 40, 17, 1.12, 0.8, 1.3)
  cono.castShadow = true; cono.shadow.intensity = 0.75; cono.shadow.radius = 3; cono.shadow.mapSize.set(1024, 1024); cono.shadow.bias = -0.0015; cono.shadow.normalBias = 0.03; cono.shadow.camera.near = 0.1
  scena.add(alone, cono, cono.target)
  const lampo = new THREE.PointLight(0xfff0d0, 0, 5, 1.5); scena.add(lampo)
  // la luce delle magie: segue il proiettile di un'abilità (una sola, dalla riserva fissa delle luci)
  const magia = new THREE.PointLight(0xffffff, 0, 4, 1.5); scena.add(magia)
  // la luce del palco: nello scontro una luce calda dalla parte della telecamera schiarisce i combattenti
  const palco = new THREE.PointLight(0xffe0bc, 0, 14, 1.0); scena.add(palco)

  // ── la vetrina: le cose di scena modellate, in fila ──
  const vetrina = VETRINA ? creaVetrina({ scena, m, conMaschera, maschera, trame: { pav: tPav }, materialeFiamma: matFiamma }) : null
  if (vetrina) console.table(vetrina.misura)

  // ── la fontana: un oggetto di scena modellato, con due stati. Nel gioco vero è la fonte del piano ──
  const fontana = m.fontana ? creaFontana({ scena, cella: m.fontana, luci, trama: tPav, conMaschera, maschera, vuota: OPZ.fontanaVuota || !!(m.fontana.roba && m.fontana.roba.morto) }) : null

  // ── il portale: dove il motore lo mette, modellato (portale3d.js). Prima non si vedeva: per `portale` il renderer
  // non sceglieva nessuna figura (figuraDellaRoba tornava null), e l'atlante non ne ha una: il gioco lo dipinge in codice ──
  const roPortale = corsa ? corsa.livello.robe.find(r => r.che === 'portale') : null
  const portale = roPortale ? creaPortale({ scena, cella: roPortale, conMaschera, maschera, trama: tPav }) : null
  // l'attraversamento (il bottone del foglio del portale): il velo lampeggia e l'eroe ci si stringe dentro
  if (ponte) ponte.attraversa = fatto => { if (!portale) return fatto && fatto(); portale.attraversa(); eroe.passaggio = { t: 0, fatto } }

  // ── le botti da rompere (botti.js): decoro di prova, il motore non ne sa niente ──
  const botti = corsa ? creaBotti({ scena, m, robe: corsa.livello.robe, conMaschera, maschera, legno: legno(), figura, seme: OPZ.seme }) : null
  if (botti) via.push(() => botti.via())
  // i forzieri e le curiosità nel prototipo si aprono senza domanda (Sopra.vue risponde per il bambino): qui l'animazione
  const aperti = new Map()   // roba → quando si è aperta
  if (ponte) ponte.aperto = r => { aperti.set(r, tempo); scintille.emetti(r.x + 0.5, 0.4, r.y + 0.5, 50, { forza: 1.6, su: 2.4, vita: 0.8, caldo: 0.2, taglia: 0.07, tinta: new THREE.Color('#ffd76a') }); lampo.color.set(0xffd27a); lampo.position.set(r.x + 0.5, 0.8, r.y + 0.8); lampo.intensity = 12 }

  // ── effetti ──
  const nebbia = creaNebbia(scena, m.W, m.H, FETTE, luci, maschera, 0.05)
  const polvere = creaPolvere(scena, POLVERE, luci, maschera)
  const scintille = creaScintille(scena, 1500)
  const post = creaPost(renderer, scena, camera, { bloom: BLOOM })
  if (post.bloom) { post.bloom.strength = 0.5; post.bloom.threshold = 0.95 }

  // la distanza che serve a vedere `celle` in largo e in profondo, con l'apertura e la forma dello schermo
  function scostamento (celle = CAMERA.celle) {
    const v = THREE.MathUtils.degToRad(camera.fov) / 2
    const o = Math.atan(Math.tan(v) * camera.aspect)
    const inc = THREE.MathUtils.degToRad(CAMERA.inclinazione)
    const d = Math.max((celle / 2) / Math.tan(o), (celle / 2) * Math.sin(inc) / Math.tan(v))
    return new THREE.Vector3(0, d * Math.sin(inc), d * Math.cos(inc))
  }

  // ── misure ──
  function misura () {
    const w = innerWidth, h = innerHeight
    renderer.setPixelRatio(pr); renderer.setSize(w, h, false)
    post.composer.setPixelRatio(pr); post.composer.setSize(w, h)
    post.finale.uRis.value.set(w * pr, h * pr)
    camera.fov = CAMERA.fov; camera.aspect = w / h; camera.updateProjectionMatrix()
  }
  ascolta(window, 'resize', misura); misura()

  // ── la sovrimpressione vera (Sopra.vue): domanda, caselle, fila dei turni, la barra in basso ──
  let app = null
  if (ponte) { app = createApp(Sopra, { ponte }); app.mount('#sopra'); via.push(() => app.unmount()) }

  // ═══════════ le cose del piano vero: i mostri e la roba del motore, ognuna con la sua figura ═══════════
  const scen = corsa ? (corsa.livello.scenario || 'cripta') : 'cripta'
  const primo = (...ids) => ids.find(id => id && voce[id])
  const gemmaId = primo('gemma-blu', 'gemma-rossa')
  function figuraDellaRoba (r) {
    switch (r.che) {
      case 'mostro': {
        if (r.grosso) { const g = figuraDelGrosso(r.grosso); return primo(g && g.sprite, figuraDelMostro(r), 'orco') }
        return primo(figuraDelMostro(r), r.tipo, 'scheletro')
      }
      case 'porta': return r.aperta ? null : primo(`${scen}-porta-${r.pelle}`, `${scen}-porta-semplice`, 'cantine-porta-semplice')
      case 'forziere': if (r.aperto) return aperti.has(r) && tempo - aperti.get(r) < 1.6 ? primo('forziere-aperto') : null
        return primo(`${scen}-forziere`, `${scen}-forziere-a`, `${scen}-forziere-b`, 'cantine-forziere-a')
      case 'scala': return primo(`${scen}-scala-${corsa.chiaveDelPiano ? 'aperta' : 'chiusa'}`, 'cantine-scala-aperta')
      case 'scala-su': return primo(`${scen}-scala-a-pioli`, 'cantine-scala-a-pioli')
      case 'gemme': return gemmaId
      case 'curiosita': return r.visto ? null : primo(r.pezzo)
      case 'fonte': return fontana && fontana.cella.roba === r ? null : primo(`${scen}-fontana-${r.morto ? 'asciutta' : 'piena'}`)
      default: return null
    }
  }
  const viste = new Map()   // roba → { f, id, x, z, meta, assalto, flash, t, morente }
  function vistaDi (r) {
    let v = viste.get(r)
    const id = figuraDellaRoba(r)
    if (v && v.id !== id) { scena.remove(v.f.mesh); v.f.mesh.geometry.dispose(); viste.delete(r); v = null }
    if (!v && id) {
      const f = figura(id, { ricordo: r.che !== 'mostro' })
      v = { f, id, x: r.fx ?? r.x + 0.5, z: r.fy ?? r.y + 0.5, meta: null, assalto: null, flash: 0, t: Math.random() * 4, morente: 0 }
      viste.set(r, v)
    }
    return v
  }
  const L = corsa ? corsa.livello.largo : m.W
  const cellaDi = (x, z) => Math.floor(z) * L + Math.floor(x)

  // ═══════════ il dito ═══════════
  const ray = new THREE.Raycaster(), pt = new THREE.Vector2(), piano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  let premuto = null, ultimoRipiano = 0
  const doveTocca = e => {
    pt.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1)
    ray.setFromCamera(pt, camera)
  }
  const cellaAlDito = () => { const p = new THREE.Vector3(); return ray.ray.intersectPlane(piano, p) ? { x: Math.floor(p.x), y: Math.floor(p.z) } : null }
  ascolta(tela, 'pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    tela.setPointerCapture(e.pointerId)
    doveTocca(e)
    if (corsa) {
      const f = corsa.foglio
      if (f && f.che === 'scontro') {
        // nello scontro si tocca un mostro per farlo bersaglio (la vista vera fa lo stesso sul palco)
        const vivi = f.campo.map(r => viste.get(r)).filter(v => v)
        const hit = ray.intersectObjects(vivi.map(v => v.f.mesh))[0]
        if (hit) { const i = f.campo.findIndex(r => viste.get(r) && viste.get(r).f.mesh === hit.object); if (i >= 0) ponte.scegliBersaglio(i) }
        else ponte.racconto.accorcia()
        return
      }
      if (f) return
      azione = null
      const r = scegliRoba(e)
      if (r) { mira(r); return }
      const bo = botti && sceltaBotte(e)
      if (bo) {
        azione = { botte: bo }
        segnaBersaglio(bo.x, bo.z)
        const meta = vicinoA(bo.x, bo.z, corsa.buona())
        if (meta) corsa.vaiVerso(meta, false)
        return
      }
      const c = cellaAlDito()
      if (!c) return
      segnaArrivo(c.x + 0.5, c.y + 0.5)
      // oltre una porta chiusa: si va alla porta e si prova ad aprirla (il foglio della porta lo apre il motore)
      const porta = portaSullaStrada(c)
      if (porta) { mira(porta); return }
      corsa.vaiVerso(c, true)
      premuto = e.pointerId
      return
    }
    // nella vetrina: si va accanto alla cosa toccata, e arrivati la si usa
    const v = sceltaVetrina(e)
    if (v) {
      azione = { vetrina: v }
      segnaBersaglio(v.x, v.z)
      const meta = vicinoA(v.x, v.z, (x, y) => m.pav(x, y))
      if (meta) vaiA(meta.x, meta.y)
      return
    }
    azione = null
    if (fontana && fontana.stato === 'piena' && ray.intersectObject(fontana.gruppo, true).length) { eroe.allaFontana = true; vaiA(fontana.cella.x, fontana.cella.y + 1); return }
    premuto = e.pointerId
    const c = cellaAlDito(); if (c) vaiA(c.x, c.y)
  })
  ascolta(tela, 'pointermove', e => {
    if (premuto !== e.pointerId || (e.pointerType === 'mouse' && !e.buttons)) return
    const t = performance.now()
    if (t - ultimoRipiano < 90) return
    ultimoRipiano = t
    doveTocca(e)
    const c = cellaAlDito(); if (!c) return
    if (corsa) { if (!corsa.foglio) corsa.vaiVerso(c, false) } else vaiA(c.x, c.y)
  })
  const lascia = e => { if (premuto === e.pointerId) premuto = null }
  ascolta(tela, 'pointerup', lascia)
  ascolta(tela, 'pointercancel', lascia)
  ascolta(tela, 'contextmenu', e => e.preventDefault())
  ascolta(window, 'wheel', e => { CAMERA.zoom = Math.min(2, Math.max(0.5, CAMERA.zoom * (e.deltaY > 0 ? 1.08 : 0.93))) }, { passive: true })

  // ═══════════ il tocco come in un punta-e-clicca: si sceglie una cosa (con un margine per il dito), l'eroe ci va per la
  // strada vera, e arrivato la usa. Usarla è il motore (`vaiVerso`/`interagisci`): porte, forzieri, fonti fanno quello che
  // fanno nel gioco. Un altro tocco annulla l'azione in sospeso ═══════════
  let azione = null   // { roba } nel piano vero, { vetrina: pezzo } nella vetrina
  const MARGINE_DITO = 44   // px: una cosa si prende anche toccandole vicino
  const sullaSchermo = (x, y, z) => { tmp.set(x, y, z).project(camera); return [(tmp.x + 1) / 2 * innerWidth, (1 - tmp.y) / 2 * innerHeight] }
  // le cose che si possono usare: come `toccabile` del motore, ma basta averle viste (si va verso di loro anche al buio);
  // i mostri solo nella luce di adesso, come nel gioco
  const usabile = r => {
    if (r.presa || r.morto) return false
    const k = r.y * L + r.x
    if (r.che === 'mostro') return corsa.inLuce(cellaDi(r.fx ?? r.x + 0.5, r.fy ?? r.y + 0.5))
    if (!corsa.visto[k]) return false
    if (r.che === 'porta') return !r.aperta
    if (r.che === 'forziere') return !r.aperto
    if (r.che === 'curiosita') return !r.visto
    return ['fonte', 'scala', 'scala-su', 'cosa', 'gemme', 'portale'].includes(r.che)
  }
  function scegliRoba (e) {
    const cand = corsa.livello.robe.filter(usabile)
    const forme = []
    for (const r of cand) {
      if (r.che === 'fonte' && fontana && fontana.cella.roba === r) forme.push([r, fontana.gruppo])
      else if (r.che === 'portale' && portale) forme.push([r, portale.gruppo])
      else { const v = viste.get(r); if (v && v.f.mesh.visible) forme.push([r, v.f.mesh]) }
    }
    // prima le forme 3D colpite dal raggio (hanno la precedenza sul pavimento dietro), poi la più vicina entro il margine
    const hit = ray.intersectObjects(forme.map(f => f[1]), true)[0]
    if (hit) { const f = forme.find(([, o]) => o === hit.object || o.getObjectById(hit.object.id)); if (f) return f[0] }
    let mig = null, dm = MARGINE_DITO
    for (const r of cand) {
      const x = r.fx ?? r.x + 0.5, z = r.fy ?? r.y + 0.5
      for (const y of [0.15, 0.5]) {
        const [sx, sy] = sullaSchermo(x, y, z)
        const d = Math.hypot(sx - e.clientX, sy - e.clientY)
        if (d < dm) { dm = d; mig = r }
      }
    }
    return mig
  }
  function sceltaVetrina (e) {
    const cose = [...vetrina.pezzi.filter(p => p.tocca && p.oggetto).map(p => ({ p, o: p.oggetto, x: p.x, z: p.z }))]
    if (fontana && fontana.stato === 'piena') cose.push({ fontana: true, o: fontana.gruppo, x: fontana.cella.x + 0.5, z: fontana.cella.y + 0.5 })
    const hit = ray.intersectObjects(cose.map(c => c.o), true)[0]
    if (hit) { const c = cose.find(c => c.o === hit.object || c.o.getObjectById(hit.object.id)); if (c) return c }
    let mig = null, dm = MARGINE_DITO
    for (const c of cose) { const [sx, sy] = sullaSchermo(c.x, 0.4, c.z); const d = Math.hypot(sx - e.clientX, sy - e.clientY); if (d < dm) { dm = d; mig = c } }
    return mig
  }
  // la cella libera più vicina a (x, z) a cui si arriva davvero: prima le otto attorno, poi tutto il raggiungibile
  function vicinoA (x, z, buona) {
    const da = { x: Math.floor(eroe.x), y: Math.floor(eroe.z) }
    const raggiunte = raggiungibili(buona, da)
    let mig = null, dm = Infinity
    for (const k of raggiunte) {   // le chiavi sono «x,y» (motore/passi.js)
      const [cx, cy] = k.split(',').map(Number)
      const d = Math.hypot(cx + 0.5 - x, cy + 0.5 - z)
      if (d < dm) { dm = d; mig = { x: cx, y: cy } }
    }
    return mig
  }
  function sceltaBotte (e) {
    const hit = ray.intersectObjects(botti.forme(), true)[0]
    if (hit) return botti.diForma(hit.object)
    let mig = null, dm = MARGINE_DITO
    for (const b of botti.botti) {
      if (b.rotta || (maschera.ric[m.id(b.cella.x, b.cella.y)] || 0) < 0.5) continue
      const [sx, sy] = sullaSchermo(b.x, 0.3, b.z); const d = Math.hypot(sx - e.clientX, sy - e.clientY)
      if (d < dm) { dm = d; mig = b }
    }
    return mig
  }
  function mira (r) {
    azione = { roba: r }
    segnaBersaglio(r.fx ?? r.x + 0.5, r.fy ?? r.y + 0.5)
    if (corsa.toccabile(r)) { corsa.vaiVerso({ x: r.x, y: r.y }, true); return }
    // non ancora nella luce (o di là da qualcosa): si va alla cella raggiungibile più vicina, e lì si riprova
    const meta = vicinoA(r.x + 0.5, r.y + 0.5, corsa.buona())
    if (meta) corsa.vaiVerso(meta, false)
  }
  // ogni fotogramma: arrivati (fermi) accanto alla cosa, ci si gira e la si usa col tocco del motore
  function portaAvanti () {
    if (!azione) return
    if (azione.vetrina) {
      if (eroe.via.length) return
      const a = azione.vetrina; azione = null
      if (Math.hypot(a.x - eroe.x, a.z - eroe.z) > 2.2) return
      girati(a.x - eroe.x, a.z - eroe.z)
      if (a.fontana) { if (fontana.usa(eroe)) eroe.cura = 1.2 } else { a.p.tocca(); if (a.p.div) a.p.div.textContent = a.p.nome }
      return
    }
    if (corsa.foglio) { azione = null; return }
    if (corsa.strada && corsa.strada.length) return
    if (azione.botte) {
      const b = azione.botte; azione = null
      if (Math.hypot(b.x - corsa.eroe.x, b.z - corsa.eroe.y) > 1.8) return
      corsa.giraVerso(b.x - corsa.eroe.x, b.z - corsa.eroe.y)
      assalto(eroe, b, 0.36, 0.16, 0.6)
      setTimeout(() => { botti.rompi(b, scintille.emetti); scossa = Math.min(1, scossa + 0.3); fermo = 0.05 }, 160)
      return
    }
    const r = azione.roba
    if (r.presa || r.morto) { azione = null; return }
    const x = r.fx ?? r.x + 0.5, z = r.fy ?? r.y + 0.5
    if (Math.hypot(x - corsa.eroe.x, z - corsa.eroe.y) > 1.6) { azione = null; corsa.dillo('di là non si arriva'); return }
    corsa.giraVerso(x - corsa.eroe.x, z - corsa.eroe.y)
    corsa.aggiornaLuce()
    azione = null
    if (corsa.toccabile(r)) corsa.vaiVerso({ x: r.x, y: r.y }, true)
    else corsa.dillo('di qui non si vede')
  }
  // il punto toccato oltre una porta chiusa: la strada che ci arriverebbe passando dalle porte, e la prima porta chiusa su di essa
  function portaSullaStrada (c) {
    const da = { x: Math.floor(corsa.eroe.x), y: Math.floor(corsa.eroe.y) }
    if (percorso(corsa.buona(), da, c)) return null
    const liv = corsa.livello
    const strada = percorso((x, y) => liv.calpestabile(x, y), da, c)
    if (!strada) return null
    for (const p of strada) { const r = liv.robe.find(q => q.che === 'porta' && !q.aperta && q.x === p.x && q.y === p.y); if (r) return r }
    return null
  }
  // il riscontro del tocco: un anello sulla cosa presa, uno più piccolo sul punto d'arrivo
  const anelloTocco = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.46, 40), new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0, depthWrite: false }))
  anelloTocco.rotation.x = -Math.PI / 2; anelloTocco.renderOrder = 6; scena.add(anelloTocco)
  const puntoTocco = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.2, 24), anelloTocco.material.clone())
  puntoTocco.rotation.x = -Math.PI / 2; puntoTocco.renderOrder = 6; scena.add(puntoTocco)
  let tTocco = 9, tPunto = 9
  const segnaBersaglio = (x, z) => { anelloTocco.position.set(x, 0.04, z); tTocco = 0 }
  const segnaArrivo = (x, z) => { puntoTocco.position.set(x, 0.04, z); tPunto = 0 }

  // nella vetrina l'eroe cammina col cammino del prototipo (lì non c'è motore)
  function vaiA (cx, cy) {
    const v = strada(m, { x: Math.floor(eroe.x), y: Math.floor(eroe.z) }, { x: cx, y: cy })
    if (v) eroe.via = v
  }
  function girati (dx, dz) { const l = Math.hypot(dx, dz); if (l > 0.01) eroe.verso.set(dx / l, dz / l) }
  const luceA = (x, z) => maschera.ora[m.id(Math.floor(x), Math.floor(z))] || 0

  // ═══════════ gli effetti dei colpi: scoppio, scossa, lampo, fermo-immagine ═══════════
  let fermo = 0, scossa = 0, aberr = 0, rosso = 0
  const torciaTinta = new THREE.Color(0xffc488), torciaBase = new THREE.Color(0xffc488)
  let tTinta = 0
  // la bolla attorno all'eroe: scudi e cure (il colore dell'abilità), si gonfia e svanisce
  const bolla = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 16), new THREE.MeshBasicMaterial({ color: 0x8ac8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))
  bolla.renderOrder = 12; scena.add(bolla)
  let tBolla = 9
  const colore = new THREE.Color()
  // un colpo che arriva su `v` (forte: lo teme; debole: resiste), nel colore dell'abilità
  function impatto (v, forza = 1, tinta = '#e6ebf6') {
    v.flash = 1
    const dx = v.x - eroe.x, dz = v.z - eroe.z, l = Math.hypot(dx, dz) || 1
    colore.set(tinta)
    scintille.emetti(v.x - dx / l * 0.2, 0.6, v.z + 0.1, Math.round(50 * forza), { forza: 3.4 * forza, su: 2, vita: 0.5, taglia: 0.1, tinta: colore })
    lampo.color.copy(colore); lampo.position.set(v.x - dx / l * 0.3, 0.8, v.z + 0.2); lampo.intensity = 18 * forza
    fermo = Math.max(fermo, 0.07 * forza)
    scossa = Math.min(1, scossa + 0.35 * forza); aberr = 0.014 * forza
  }
  function ferito () {
    eroe.colpito = 0.35; scossa = Math.min(1, scossa + 0.45); rosso = 1; fermo = Math.max(fermo, 0.07); aberr = 0.012
    lampo.color.set(0xff6040); lampo.position.set(eroe.x, 0.8, eroe.z + 0.3); lampo.intensity = 14
    scintille.emetti(eroe.x, 0.6, eroe.z + 0.1, 30, { forza: 2.4, su: 1.6, vita: 0.45, taglia: 0.07 })
  }
  // un affondo in tre tempi: un passo indietro per caricare, lo scatto fin quasi a toccarlo (arriva al `picco`, il momento
  // in cui il racconto fa arrivare il colpo), il ritorno al suo posto. I tempi li dà il racconto (dati/effetti.js, `arrivo`)
  function assalto (chi, contro, dur, picco = dur * 0.5, quanto = 1) {
    const dx = contro.x - chi.x, dz = contro.z - chi.z, l = Math.hypot(dx, dz) || 1
    const k = Math.max(0.15, l - 0.7) / l * quanto
    chi.assalto = { t: 0, dur: Math.max(dur, picco + 0.12), picco: Math.max(0.06, picco), dx: dx * k, dz: dz * k }
  }
  function spostaAssalto (chi, dt) {
    const a = chi.assalto
    if (!a) return [0, 0]
    a.t += dt
    if (a.t >= a.dur) { chi.assalto = null; return [0, 0] }
    const carica = a.picco * 0.3
    let k
    if (a.t < carica) k = -0.18 * Math.sin(Math.PI * a.t / carica)                        // indietro, a caricare
    else if (a.t < a.picco) { const u = (a.t - carica) / (a.picco - carica); k = u * u * (3 - 2 * u) }   // lo scatto
    else { const u = (a.t - a.picco) / (a.dur - a.picco); k = 1 - u * u * (3 - 2 * u) }           // e indietro
    return [a.dx * k, a.dz * k]
  }

  // ═══════════ il palco: lo scontro del motore messo in scena sul pavimento vero ═══════════
  // I posti: eroe a sinistra e mostri a colonne a destra come nel palco del gioco, dove il pavimento lo lascia, con
  // 1,2 celle d'agio dai muri; i muri alti alle spalle si abbassano. Solo disegno: il motore non sa dove stanno.
  const POSTI = [[1.0, 0], [1.7, -0.85], [1.8, 0.85], [2.6, 0.05], [2.4, -1.4], [2.5, 1.5], [3.3, 0]]
  let palcoAperto = null
  const anello = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.4, 40), new THREE.MeshBasicMaterial({ color: 0xffc850, transparent: true, opacity: 0.9, depthWrite: false }))
  anello.rotation.x = -Math.PI / 2; anello.visible = false; anello.renderOrder = 5; scena.add(anello)
  const segni = document.getElementById('segni')
  segni.innerHTML = ''
  function apriPalco (campo) {
    const vis = campo.map(r => vistaDi(r)).filter(Boolean)
    const o = vis[0] || { x: eroe.x + 1, z: eroe.z }
    const cx0 = (eroe.x + o.x) / 2, cz0 = (eroe.z + o.z) / 2
    const libera = (x, z) => m.pav(Math.floor(x), Math.floor(z))
    const ingombri = new Set([...m.arredi, ...m.bracieri].map(c => m.id(c.x, c.y)))
    const agio = (x, z) => {
      let d = 3
      for (let y = Math.floor(z) - 3; y <= Math.floor(z) + 3; y++) for (let k = Math.floor(x) - 3; k <= Math.floor(x) + 3; k++) {
        if (m.pav(k, y) && !ingombri.has(m.id(k, y))) continue
        d = Math.min(d, Math.hypot(Math.max(k - x, 0, x - k - 1), Math.max(y - z, 0, z - y - 1)))
      }
      return d
    }
    const passi = new Map([[m.id(Math.floor(eroe.x), Math.floor(eroe.z)), 0]]), coda = [[Math.floor(eroe.x), Math.floor(eroe.z)]]
    while (coda.length) {
      const [x, y] = coda.shift(), d = passi.get(m.id(x, y))
      if (d >= 9) continue
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (m.pav(x + dx, y + dy) && !passi.has(m.id(x + dx, y + dy))) { passi.set(m.id(x + dx, y + dy), d + 1); coda.push([x + dx, y + dy]) }
    }
    const prova = (cx, cz, l, verticale) => {
      const p = (u, v) => verticale ? [cx + v * 0.8, cz + u * l] : [cx + u * l, cz + v]
      const posti = [p(-1.25, 0), ...vis.map((_, i) => p(POSTI[i % POSTI.length][0] - 0.25, POSTI[i % POSTI.length][1]))]
      let voto = -(verticale ? 1.5 : 0) - Math.hypot(cx - cx0, cz - cz0) * 0.05 - (l < 0 ? 0.05 : 0)
      for (const [x, z] of posti) {
        if (!libera(x, z) || ingombri.has(m.id(Math.floor(x), Math.floor(z))) || !passi.has(m.id(Math.floor(x), Math.floor(z)))) { voto -= 2; continue }
        voto += Math.min(agio(x, z), 1.2) / 1.2
      }
      return { l, posti, voto }
    }
    let sc = null
    for (let dz = -4; dz <= 4; dz += 0.5) for (let dx = -4; dx <= 4; dx += 0.5) for (const [l, v] of [[1, false], [-1, false], [-1, true], [1, true]]) {
      const t = prova(cx0 + dx, cz0 + dz, l, v)
      if (!sc || t.voto > sc.voto) sc = t
    }
    const presi = []
    const tieni = (p, [x, z]) => {
      let mig = null, dm = Infinity
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const qx = Math.floor(x) + dx + 0.5, qz = Math.floor(z) + dy + 0.5
        if (!libera(qx, qz) || ingombri.has(m.id(Math.floor(qx), Math.floor(qz))) || presi.some(q => Math.hypot(q.x - qx, q.z - qz) < 0.7)) continue
        const d = Math.hypot(qx - x, qz - z); if (d < dm) { dm = d; mig = { x: qx, z: qz } }
      }
      const r = libera(x, z) && !presi.some(q => Math.hypot(q.x - x, q.z - z) < 0.7) ? { x, z } : (mig || { x: p.x, z: p.z })
      presi.push(r); return r
    }
    eroe.meta = tieni(eroe, sc.posti[0])
    vis.forEach((v, i) => { v.meta = tieni(v, sc.posti[i + 1]) })
    const tutti = [eroe.meta, ...vis.map(v => v.meta)]
    const x0 = Math.min(...tutti.map(p => p.x)) - 1.6, x1 = Math.max(...tutti.map(p => p.x)) + 1.6, z0 = Math.min(...tutti.map(p => p.z))
    muriAlti.celle.forEach((c, i) => { muriAlti.meta[i] = c.x + 1 > x0 && c.x < x1 && c.y + 1 <= z0 + 0.05 && c.y + 1 > z0 - 1.8 ? PARAPETTO / ALTO_MURO : 1 })
    segni.innerHTML = ''
    for (const v of vis) { v.segno = document.createElement('div'); v.segno.className = 'segno'; segni.appendChild(v.segno) }
    palcoAperto = { campo, vis }
  }
  function chiudiPalco () {
    for (const v of palcoAperto.vis) { v.meta = null; v.segno?.remove(); v.segno = null }
    eroe.meta = null; palcoAperto = null; muriAlti.meta.fill(1); anello.visible = false
  }

  // ── il racconto del turno messo in scena: lo stesso `fx` che la vista vera legge (viste/racconto.js) ──
  const visti = {}
  let ultimoNumero = 0, ultimaScena = 0, ultimoScuote = 0, tintaOra = '#e6ebf6'
  const numeri = []     // { el, chi, t }
  const proiettili = [] // { da, a, t, dur, tinta }
  const posizioneDi = chi => {
    if (chi === 'eroe' || chi == null) return { x: eroe.x, z: eroe.z, alto: figEroe.mesh.scale.y }
    const r = palcoAperto && palcoAperto.campo[chi], v = r && viste.get(r)
    return v ? { x: v.x, z: v.z, alto: v.f.mesh.scale.y, v } : { x: eroe.x + 1, z: eroe.z, alto: 1 }
  }
  function effetto (chi, tipo) {
    if (chi === 'eroe') {
      const c = ponte.colpoEroe || {}
      const b = c.bersaglio && viste.get(c.bersaglio)
      const arrivo = (c.arrivo || 190) / 1000, dura = Math.min(0.86, (c.dura || 480) / 1000)
      // la torcia prende il colore del colpo finché dura (rossa col fuoco, azzurra col gelo, bianca l'acciaio)
      if (c.luce) { torciaTinta.set(c.luce); tTinta = dura }
      if (tipo === 'scatta' && b) assalto(eroe, b, dura, arrivo)
      else if (tipo === 'tira' && b) { assalto(eroe, b, Math.min(dura, 0.45), Math.max(0.1, arrivo * 0.5), 0.22); scintille.emetti(eroe.x, 0.9, eroe.z + 0.1, 16, { forza: 0.8, su: 0.6, vita: 0.4, caldo: 0.2, taglia: 0.06, tinta: colore.set(c.luce || '#ffffff') }) }
      else if (tipo === 'gira') { eroe.gira = 0.5; scintille.emetti(eroe.x, 0.5, eroe.z, 40, { forza: 3, su: 0.3, vita: 0.4, caldo: 0.2, taglia: 0.06, tinta: colore.set(c.luce || '#e6ebf6') }) }
      else if (tipo === 'vuoto' && b) { assalto(eroe, b, 0.34); scintille.emetti(b.x, 0.5, b.z, 8, { forza: 1, su: 0.5, vita: 0.3, caldo: 0.2, taglia: 0.05, tinta: colore.set('#9a9a9a') }) }
      else if (tipo === 'colpito') ferito()
      else if (tipo === 'cura') { eroe.cura = 1.2; bolla.material.color.set('#7dffa0'); tBolla = 0; scintille.emetti(eroe.x, 0.3, eroe.z, 40, { forza: 0.6, su: 2.2, vita: 0.9, caldo: 0.2, taglia: 0.06, tinta: colore.set('#7dffa0') }) }
      else if (tipo === 'protegge') bolla.material.color.set(c.luce || '#8ac8ff'), tBolla = 0, scintille.emetti(eroe.x, 0.6, eroe.z, 40, { forza: 1.6, su: 0.4, vita: 0.6, caldo: 0.2, taglia: 0.06, tinta: colore.set('#8ac8ff') })
      return
    }
    const p = posizioneDi(Number(chi))
    if (!p.v) return
    if (tipo === 'scatta') assalto(p.v, eroe, 0.45, 0.17)   // TEMPI.mostro e TEMPI.passo di viste/racconto.js
    else if (tipo === 'colpito') impatto(p.v, 1, tintaOra)
    else if (tipo === 'colpito-forte') impatto(p.v, 1.6, tintaOra)
    else if (tipo === 'colpito-debole') impatto(p.v, 0.5, tintaOra)
    else if (tipo === 'stordito') scintille.emetti(p.v.x, p.alto + 0.2, p.v.z, 14, { forza: 0.8, su: 0.6, vita: 0.6, caldo: 0.2, taglia: 0.05, tinta: colore.set('#ffe36a') })
  }
  function scena3d (s) {
    const tinta = s.tinta || '#e6ebf6'
    tintaOra = tinta
    setTimeout(() => {
      const a = posizioneDi(s.a === 'eroe' ? 'eroe' : s.a)
      if (s.modo === 'volo') {
        const d = posizioneDi(s.da === 'eroe' ? 'eroe' : s.da)
        proiettili.push({ da: d, a, t: 0, dur: Math.max(0.12, s.durata / 1000 * 0.6), tinta: new THREE.Color(tinta) })
      } else if (s.modo === 'alto') {
        proiettili.push({ da: { x: a.x, z: a.z, y0: 3.2 }, a, t: 0, dur: Math.max(0.12, s.durata / 1000 * 0.5), tinta: new THREE.Color(tinta) })
      } else {
        colore.set(tinta)
        scintille.emetti(a.x, 0.5, a.z, s.piu ? 60 : 30, { forza: s.piu ? 3 : 1.8, su: 1.6, vita: 0.6, caldo: 0.3, taglia: 0.08, tinta: colore })
        magia.color.copy(colore); magia.position.set(a.x, 1, a.z + 0.3); magia.intensity = 10
      }
    }, s.ritardo || 0)
  }
  function leggiIlRacconto () {
    const fx = ponte.racconto.fx
    for (const [chi, e] of Object.entries(fx.effetto)) { if (!e || visti[chi] === e.n) continue; visti[chi] = e.n; effetto(chi, e.tipo) }
    for (const s of fx.scene) if (s.id > ultimaScena) { ultimaScena = s.id; scena3d(s) }
    for (const n of fx.numeri) if (n.id > ultimoNumero) {
      ultimoNumero = n.id
      const el = document.createElement('div'); el.className = 'numero numero-' + n.tipo; el.textContent = n.testo
      segni.appendChild(el); numeri.push({ el, chi: n.su, t: 0, riga: n.riga || 0 })
    }
    if (fx.scuote && fx.scuote !== ultimoScuote) { ultimoScuote = fx.scuote; scossa = Math.min(1, scossa + 0.8) }
  }

  // ═══════════ la maschera: dal motore (la luce che vede il gioco), o nella vetrina dal campo visivo del prototipo ═══════════
  const vistoOra = new Uint8Array(m.W * m.H)
  function aggiornaMaschera (dt) {
    const { ora, ric, dati } = maschera
    const k = Math.min(1, dt * 7)
    if (corsa) {
      const fl = corsa.forzaLuce || new Map(), vis = corsa.visto
      // il palco: i combattenti stanno dove il disegno li mette (fino a quattro celle dall'eroe del motore), e lì la
      // scena si accende. È luce di scena, non del gioco: il motore non ne sa niente
      const palcoLuce = palcoAperto ? [eroe.meta || eroe, ...palcoAperto.vis.map(v => v.meta || v)] : null
      for (let i = 0; i < ora.length; i++) {
        let t = fl.get(i) || 0
        if (palcoLuce) {
          const x = i % m.W + 0.5, z = Math.floor(i / m.W) + 0.5
          for (const p of palcoLuce) { const d = Math.hypot(p.x - x, p.z - z); if (d < 3) t = Math.max(t, Math.min(1, (3 - d) / 1.2)) }
        }
        ora[i] += (Math.min(1, t * 1.3) - ora[i]) * k
        ric[i] = vis[i] ? 1 : 0
      }
    } else {
      const c = m.id(Math.floor(eroe.x), Math.floor(eroe.z))
      if (c !== eroe.cella) { eroe.cella = c; campoVisivo(m, eroe.x, eroe.z, 16, vistoOra) }
      for (let i = 0; i < ora.length; i++) { ora[i] += (vistoOra[i] - ora[i]) * k; if (ora[i] > ric[i]) ric[i] = ora[i] }
    }
    for (let i = 0; i < ora.length; i++) { dati[i * 4] = ora[i] * 255; dati[i * 4 + 1] = ric[i] * 255; dati[i * 4 + 2] = m.celle[i] === PAVIMENTO ? 255 : 0; dati[i * 4 + 3] = 255 }
    maschera.t.needsUpdate = true
  }

  // ═══════════ il giro ═══════════
  const orologio = new THREE.Clock()
  let celleOra = CAMERA.celle, spostaY = 0, vivo = true, firma = ''
  let tempo = 0, tVero = 0, tAdatta = 0, sommaDt = 0, nDt = 0
  const hud = document.getElementById('hud')
  const tmp = new THREE.Vector3(), centro = new THREE.Vector3()
  let eroePrima = { x: eroe.x, z: eroe.z }

  function passo () {
    if (!vivo) return
    const dtVero = Math.min(0.05, orologio.getDelta())
    tVero += dtVero
    let dt = dtVero
    if (fermo > 0) { fermo -= dtVero; dt = 0 }
    tempo += dt
    let cammina = false

    if (corsa) {
      // il motore cammina, i mostri lo inseguono, e se qualcosa si apre si ferma da sé
      corsa.passo(dtVero)
      const f = `${corsa.vita}|${corsa.energia}|${corsa.foglio ? corsa.foglio.che : '-'}|${corsa.chiesta ? corsa.chiesta.id : 0}|${corsa.livello.robe.length}|${corsa.gemme}|${corsa.pozioni}|${corsa.crescita.esp}|${corsa.pronta}`
      if (f !== firma) { firma = f; ponte.tic++ }
      const sc = corsa.foglio && corsa.foglio.che === 'scontro' ? corsa.foglio : null
      if (sc && !palcoAperto) apriPalco(sc.campo)
      if (!sc && palcoAperto && !ponte.racconto.fx.attivo) chiudiPalco()
      leggiIlRacconto()
      portaAvanti()
      if (!eroe.meta) { eroe.x = corsa.eroe.x; eroe.z = corsa.eroe.y }
      cammina = Math.hypot(eroe.x - eroePrima.x, eroe.z - eroePrima.z) > 0.001
      if (!palcoAperto && corsa.versoEroe) girati(corsa.versoEroe.dx, corsa.versoEroe.dy)
      // la fonte bevuta: la fontana dà l'acqua all'eroe e si svuota (una volta sola)
      if (fontana && fontana.cella.roba && fontana.cella.roba.morto && fontana.stato === 'piena') { fontana.usa(eroe); eroe.cura = 1.2 }
    } else if (eroe.via.length && dt > 0) {
      const VEL = 4.2, n = eroe.via[0], tx = n.x + 0.5, tz = n.y + 0.5
      const dx = tx - eroe.x, dz = tz - eroe.z, d = Math.hypot(dx, dz)
      girati(dx, dz)
      if (d <= VEL * dt) { eroe.x = tx; eroe.z = tz; eroe.via.shift() } else { eroe.x += dx / d * VEL * dt; eroe.z += dz / d * VEL * dt }
      cammina = true
      if (!eroe.via.length && eroe.allaFontana && fontana) { eroe.allaFontana = false; girati(0, -1); if (fontana.usa(eroe)) eroe.cura = 1.2 }
    }
    if (!corsa) portaAvanti()
    // gli anelli del tocco: si accendono e svaniscono in mezzo secondo; quello della cosa resta finché l'azione è in sospeso
    tTocco += dtVero; tPunto += dtVero
    anelloTocco.material.opacity = azione ? 0.55 + 0.35 * Math.sin(tVero * 8) : Math.max(0, 0.9 - tTocco * 1.8)
    anelloTocco.scale.setScalar(1 + Math.max(0, 0.4 - tTocco) * 1.5)
    puntoTocco.material.opacity = Math.max(0, 0.8 - tPunto * 1.6)
    if (eroe.meta && dt > 0) {
      eroe.x += (eroe.meta.x - eroe.x) * Math.min(1, dt * 6); eroe.z += (eroe.meta.z - eroe.z) * Math.min(1, dt * 6)
      if (Math.hypot(eroe.meta.x - eroe.x, eroe.meta.z - eroe.z) > 0.08) cammina = true
    }
    eroePrima = { x: eroe.x, z: eroe.z }
    if (palcoAperto && !eroe.assalto) {
      const b = corsa.foglio && corsa.foglio.chi && viste.get(corsa.foglio.chi)
      if (b) girati(b.x - eroe.x, (b.z - eroe.z) * 0.4)
    }
    eroe.colpito = Math.max(0, eroe.colpito - dtVero); eroe.cura = Math.max(0, eroe.cura - dtVero); eroe.gira = Math.max(0, eroe.gira - dtVero)
    eroe.t += dt * (cammina ? 10 : 5)
    eroe.versoLuce.lerp(eroe.verso, Math.min(1, dtVero * 9)).normalize()
    const [ax, az] = spostaAssalto(eroe, dt)
    const ex = eroe.x + ax, ez = eroe.z + az
    figEroe.mesh.position.set(ex, 0, ez + 0.1)
    // nel portale: la figura va verso il centro dell'ovale e si stringe, poi torna (il villaggio di sopra qui non c'è)
    if (eroe.passaggio && portale) {
      const ps = eroe.passaggio; ps.t += dtVero
      const u = Math.min(1, ps.t / 0.9)
      figEroe.mesh.position.lerp(tmp.copy(portale.gruppo.position).setY(0.3), u)
      figEroe.mesh.material.opacity = 1 - u; figEroe.mesh.material.transparent = true
      if (ps.t > 1.6) { eroe.passaggio = null; figEroe.mesh.material.opacity = 1; figEroe.mesh.material.transparent = false; if (ps.fatto) ps.fatto() }
    }
    figEroe.mesh.rotation.y = eroe.gira > 0 ? (0.5 - eroe.gira) * Math.PI * 4 : 0
    figEroe.metti(eroe.colpito > 0 ? 'colpito' : cammina ? 'corsa' : 'fermo', eroe.t, eroe.verso.x < -0.1 || (Math.abs(eroe.verso.x) <= 0.1 && figEroe.specchio))
    figEroe.mat.emissive.setRGB(eroe.colpito * 2, eroe.cura * 0.9, eroe.cura * 1.3)

    alone.position.set(ex + eroe.versoLuce.x * 0.3, 1.45, ez + eroe.versoLuce.y * 0.3 - 0.1)
    const tremo = 1 + Math.sin(tVero * 23) * 0.03 + Math.sin(tVero * 37.1) * 0.03
    alone.intensity = 9 * tremo
    cono.position.set(ex, 1.15, ez)
    cono.target.position.set(ex + eroe.versoLuce.x * 4, 0, ez + eroe.versoLuce.y * 4)
    cono.intensity = 40 * tremo
    tTinta = Math.max(0, tTinta - dtVero)
    tBolla += dtVero
    bolla.position.set(ex, 0.75, ez + 0.1); bolla.scale.setScalar(0.7 + Math.min(1, tBolla * 4) * 0.5)
    bolla.material.opacity = tBolla < 0.9 ? 0.32 * Math.sin(Math.min(1, tBolla / 0.9) * Math.PI) : 0
    cono.color.copy(torciaBase).lerp(torciaTinta, Math.min(1, tTinta * 3)); alone.color.copy(cono.color)

    aggiornaMaschera(dtVero)

    // i mostri e la roba del motore
    if (corsa) {
      const fx = ponte.racconto.fx
      for (const r of corsa.livello.robe) {
        if (r.che === 'arredo') continue
        const inCampo = palcoAperto ? palcoAperto.campo.indexOf(r) : -1
        const v = vistaDi(r)
        if (!v) continue
        const mesh = v.f.mesh
        if (r.presa || (r.morto && r.che !== 'mostro')) { mesh.visible = false; continue }
        if (r.che !== 'mostro') { mesh.position.set(r.x + 0.5, 0, r.y + 0.45); mesh.visible = true; continue }
        // un mostro: si vede solo nella luce di adesso (la regola del gioco), o in campo
        const morto = inCampo >= 0 && fx.attivo ? !!fx.morti[inCampo] : r.morto
        if (morto) {
          v.morente += dtVero
          v.f.metti(v.f.v.pose.morto ? 'morto' : 'fermo', v.morente > 0.3 ? 1 : 0, v.f.specchio)
          v.f.mat.transparent = true; v.f.mat.opacity = Math.max(0, 1 - Math.max(0, v.morente - 1.1) / 0.8)
          mesh.visible = v.f.mat.opacity > 0 && (inCampo >= 0 || corsa.inLuce(cellaDi(v.x, v.z)))
          if (mesh.visible && Math.random() < dtVero * 6) scintille.emetti(v.x, 0.15, v.z, 1, { forza: 0.4, su: 0.6, vita: 1.2, caldo: 0.2, taglia: 0.04 })
          if (v.segno) v.segno.style.opacity = 0
          continue
        }
        let corre = false
        if (v.meta && dt > 0) {
          v.x += (v.meta.x - v.x) * Math.min(1, dt * 5); v.z += (v.meta.z - v.z) * Math.min(1, dt * 5)
          corre = Math.hypot(v.meta.x - v.x, v.meta.z - v.z) > 0.08
        } else if (!v.meta) {
          const nx = r.fx ?? r.x + 0.5, nz = r.fy ?? r.y + 0.5
          corre = Math.hypot(nx - v.x, nz - v.z) > 0.002
          v.x = nx; v.z = nz
        }
        v.t += dt * 6; v.flash = Math.max(0, v.flash - dtVero * 7)
        const posa = v.f.v.pose.corsa && corre ? 'corsa' : 'fermo'
        v.f.metti(posa, v.t * (posa === 'corsa' ? 1.6 : 0.8), eroe.x < v.x)
        const [mx, mz] = spostaAssalto(v, dt)
        mesh.position.set(v.x + mx + (v.flash > 0 ? (Math.random() - 0.5) * 0.08 : 0), 0, v.z + mz + 0.1)
        v.f.mat.emissive.setScalar(v.flash * 2.5)
        mesh.visible = inCampo >= 0 || corsa.inLuce(cellaDi(v.x, v.z))
      }
    }

    // le torce: solo quelle che si vedono adesso hanno luce, fiamma e scintille (nel ricordo restano spente e ferme)
    luci.uLn.value = 0
    const aggiungi = (p, c, i) => { const k = luci.uLn.value; if (k >= MAX_LUCI) return; luci.uLp.value[k].copy(p); luci.uLc.value[k].set(c.r * i, c.g * i, c.b * i); luci.uLn.value++ }
    for (const f of fuochi) { f.vis = maschera.ora[f.cella] || 0; f.d = f.pos.distanceToSquared(tmp.set(eroe.x, 0.5, eroe.z)) }
    const accese = fuochi.filter(f => f.vis > 0.2).sort((a, b) => a.d - b.d).slice(0, N_TORCE)
    luciTorce.forEach((l, i) => {
      const f = accese[i]
      if (!f) { l.intensity = 0; return }
      const s = f.seme, t = tVero
      const tr = 0.82 + 0.1 * Math.sin(t * 9.3 + s) + 0.06 * Math.sin(t * 23.7 + s * 2) + 0.05 * Math.sin(t * 41 + s * 3)
      l.position.copy(f.pos); l.position.x += Math.sin(t * 13 + s) * 0.03; l.position.y += Math.sin(t * 17 + s) * 0.03
      l.intensity = f.forza * tr * Math.min(1, f.vis * 1.5)
      aggiungi(l.position, l.color, 0.22 * tr * (f.forza / 4.5) * f.vis)
      if (Math.random() < dt * 3) scintille.emetti(f.pos.x, f.pos.y - 0.05, f.pos.z - 0.15, 1, { forza: 0.3, su: 1.4, vita: 0.9, caldo: 0.3, taglia: 0.035 })
    })
    aggiungi(alone.position, alone.color, 0.3 * tremo)
    lampo.intensity *= Math.exp(-14 * dtVero); magia.intensity *= Math.exp(-6 * dtVero)
    if (lampo.intensity > 0.3) aggiungi(lampo.position, lampo.color, lampo.intensity * 0.02)
    luci.uConoP.value.copy(cono.position)
    luci.uConoD.value.copy(tmp.copy(cono.target.position).sub(cono.position).normalize())
    luci.uConoC.value.set(1.0, 0.72, 0.42).multiplyScalar(0.5 * tremo)

    // i proiettili delle abilità: una scia di scintille nel colore dell'elemento, con la sua luce
    for (let i = proiettili.length - 1; i >= 0; i--) {
      const p = proiettili[i]
      p.t += dt
      const k = Math.min(1, p.t / p.dur)
      const x = p.da.x + (p.a.x - p.da.x) * k, z = p.da.z + (p.a.z - p.da.z) * k
      const y = p.da.y0 != null ? p.da.y0 + (0.6 - p.da.y0) * k : 0.7 + Math.sin(k * Math.PI) * 0.4
      scintille.emetti(x, y, z, 3, { forza: 0.4, su: 0.2, vita: 0.35, caldo: 0.2, taglia: 0.09, tinta: p.tinta })
      magia.color.copy(p.tinta); magia.position.set(x, y + 0.2, z + 0.2); magia.intensity = 8
      if (k >= 1) { scintille.emetti(x, y, z, 30, { forza: 2.2, su: 1.2, vita: 0.5, caldo: 0.2, taglia: 0.08, tinta: p.tinta }); proiettili.splice(i, 1) }
    }

    // telecamera: segue morbida, inquadra lo scontro sopra il pannello, con la scossa (trauma al quadrato)
    if (palcoAperto) {
      const tutti = [eroe, ...palcoAperto.vis.filter(v => !v.morente || v.morente < 1.5)]
      centro.set(0, 0, 0); for (const p of tutti) { centro.x += (p.meta || p).x; centro.z += (p.meta || p).z }
      centro.divideScalar(tutti.length)
    } else centro.set(eroe.x, 0, eroe.z)
    celleOra += ((palcoAperto ? CAMERA.celleScontro : CAMERA.celle) - celleOra) * Math.min(1, dtVero * 3)
    // la barra in basso c'è sempre: la scena si alza di metà di quello che il pannello copre
    const coperto = ponte ? ponte.sotto : 0
    spostaY += (coperto * 0.5 - spostaY) * Math.min(1, dtVero * 5)
    if (camera.fov !== CAMERA.fov) { camera.fov = CAMERA.fov; camera.updateProjectionMatrix() }
    if (Math.abs(spostaY) > 0.5) camera.setViewOffset(innerWidth, innerHeight, 0, spostaY, innerWidth, innerHeight)
    else if (camera.view) camera.clearViewOffset()
    const off = scostamento(celleOra).multiplyScalar(CAMERA.zoom)
    palco.intensity += ((palcoAperto ? 5 : 0) - palco.intensity) * Math.min(1, dtVero * 4)
    palco.position.set(centro.x, 2.6, centro.z + 2.8)
    camera.position.lerp(tmp.copy(centro).add(off), Math.min(1, dtVero * 6))
    scossa = Math.max(0, scossa - dtVero * 2.2)
    const s2 = scossa * scossa
    camera.lookAt(camera.position.x, camera.position.y - off.y + CAMERA.guarda, camera.position.z - off.z)
    camera.position.x += s2 * 0.35 * Math.sin(tVero * 71.3); camera.position.y += s2 * 0.25 * Math.sin(tVero * 53.1 + 1)
    camera.rotation.z += s2 * 0.04 * Math.sin(tVero * 61.7 + 2)
    camera.updateMatrixWorld()
    // il buco nei muri: attorno all'eroe, o attorno a tutto lo scontro
    {
      const u = maschera.uniforms
      const bz = palcoAperto ? Math.min(eroe.z, ...palcoAperto.vis.map(v => v.z)) - 0.5 : eroe.z
      tmp.set(centro.x, 0.7, centro.z).project(camera)
      const ux = (tmp.x + 1) / 2, uy = (tmp.y + 1) / 2
      tmp.set(centro.x + (palcoAperto ? 2.8 : 1.5), 0.7, centro.z).project(camera)
      renderer.getDrawingBufferSize(u.uRisB.value)
      u.uBucoUV.value.set(ux, uy)
      u.uBucoR.value = Math.abs((tmp.x + 1) / 2 - ux) * u.uRisB.value.x / u.uRisB.value.y
      u.uBucoZ.value = bz + 0.15
    }
    // le barre della vita sopra i mostri in campo (senza numeri, come nella vista vera), l'anello sotto il bersaglio
    if (palcoAperto) {
      const fx = ponte.racconto.fx
      palcoAperto.campo.forEach((r, k) => {
        const v = viste.get(r)
        if (!v || !v.segno || v.morente) return
        tmp.set(v.f.mesh.position.x, v.f.mesh.scale.y + 0.12, v.f.mesh.position.z).project(camera)
        v.segno.style.left = ((tmp.x + 1) / 2 * innerWidth) + 'px'
        v.segno.style.top = ((1 - tmp.y) / 2 * innerHeight) + 'px'
        const ossa = fx.attivo && fx.ossa[k] != null ? fx.ossa[k] : Math.max(0, r.ossa)
        const q = Math.max(0, Math.min(1, ossa / (r.ossaMax || 1)))
        v.segno.className = 'segno' + (r === corsa.foglio?.chi ? ' bersaglio' : '')
        v.segno.innerHTML = `<b>${r === corsa.foglio?.chi ? r.nome.replace(/^(Un|Una|Uno|Il|La|Lo) /, '') : ''}</b><i style="--q:${q}"></i>`
      })
      const b = corsa.foglio && corsa.foglio.chi && viste.get(corsa.foglio.chi)
      anello.visible = !!(b && !b.morente)
      if (b) anello.position.set(b.f.mesh.position.x, 0.03, b.f.mesh.position.z - 0.05)
      anello.material.opacity = 0.6 + 0.3 * Math.sin(tVero * 6)
    }
    // i numeri che salgono (dal racconto)
    for (let i = numeri.length - 1; i >= 0; i--) {
      const n = numeri[i]
      n.t += dtVero
      const p = posizioneDi(n.chi)
      tmp.set(p.x, p.alto + 0.3 + n.t * 0.6, p.z).project(camera)
      n.el.style.left = ((tmp.x + 1) / 2 * innerWidth) + 'px'
      n.el.style.top = ((1 - tmp.y) / 2 * innerHeight + n.riga * 16) + 'px'
      n.el.style.opacity = Math.min(1, 2.2 - n.t * 2)
      if (n.t > 1.1) { n.el.remove(); numeri.splice(i, 1) }
    }
    // i muri che si abbassano o si rialzano (solo quelli che si muovono)
    {
      let mosso = false
      for (let i = 0; i < muriAlti.alto.length; i++) {
        const d = muriAlti.meta[i] - muriAlti.alto[i]
        if (Math.abs(d) < 0.002) continue
        muriAlti.alto[i] += d * Math.min(1, dtVero * 5); mosso = true
        const c = muriAlti.celle[i], h = ALTO_MURO * muriAlti.alto[i]
        muriAlti.mt.makeScale(1, muriAlti.alto[i], 1).setPosition(c.x + 0.5, h / 2, c.y + 0.5)
        muriAlti.mesh.setMatrixAt(i, muriAlti.mt)
      }
      if (mosso) muriAlti.mesh.instanceMatrix.needsUpdate = true
      for (const st of staffe) st.visible = muriAlti.alto[st.userData.muro] > 0.95
    }
    // le fiamme: vive solo dove si vede adesso; nel ricordo e nel mai visto non ci sono
    for (const q of fiamme) {
      q.quaternion.copy(camera.quaternion)
      q.visible = (maschera.ora[q.userData.cella] || 0) > 0.25 && (q.userData.muro === undefined || muriAlti.alto[q.userData.muro] > 0.95)
    }

    const scalaPunti = innerHeight * pr * 1.5
    matFiamma.uniforms.uT.value = tVero
    nebbia.aggiorna(tempo)
    polvere.aggiorna(tempo, centro, scalaPunti)
    scintille.aggiorna(dt, scalaPunti)
    if (fontana) fontana.aggiorna(dt, tempo, scalaPunti, maschera.ora[m.id(fontana.cella.x, fontana.cella.y)] || 0)
    if (botti) botti.aggiorna(dt, tempo, eroe, scintille.emetti)
    if (portale) portale.aggiorna(dt, tempo, scalaPunti, maschera.ora[m.id(roPortale.x, roPortale.y)] || 0)
    if (vetrina) vetrina.aggiorna(dt, tempo, camera, luceA)

    aberr *= Math.exp(-6 * dtVero); rosso *= Math.exp(-5 * dtVero)
    post.finale.uT.value = tVero; post.finale.uAberr.value = aberr; post.finale.uRosso.value = rosso * 0.6
    post.finale.uLampo.value = Math.max(0, lampo.intensity - 15) * 0.004

    renderer.info.reset()
    post.composer.render()

    // fps e pixel ratio che si adatta (sotto i 45 fps scende, sopra i 58 risale)
    sommaDt += dtVero; nDt++
    tAdatta += dtVero
    if (tAdatta > 0.75) {
      const fps = nDt / sommaDt
      if (!PR_FISSO) {
        if (fps < 45 && pr > 0.5) { pr = Math.max(0.5, pr - 0.1); misura() } else if (fps > 58 && pr < PR_MAX) { pr = Math.min(PR_MAX, pr + 0.05); misura() }
      }
      const i = renderer.info.render
      hud.textContent = `${fps.toFixed(0)} fps · pr ${pr.toFixed(2)} · ${i.calls} draw · ${(i.triangles / 1000).toFixed(1)}k tri`
      tAdatta = 0; sommaDt = 0; nDt = 0
    }
    requestAnimationFrame(passo)
  }
  camera.position.copy(scostamento()).add(new THREE.Vector3(eroe.x, 0, eroe.z))
  // per le prove dalla console: dove sta a schermo una cosa del mondo, e il motore
  const aSchermo = (x, y, z) => { const v = new THREE.Vector3(x, y, z).project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight] }
  window.__sotterraneo = { eroe, corsa, ponte, camera, aSchermo, maschera, m, fontana, vetrina, viste, botti, portale, get palco () { return palcoAperto } }
  requestAnimationFrame(passo)

  // disfa tutto: si ricostruisce la scena (pannello di prova) senza ricaricare la pagina
  return () => {
    vivo = false
    for (const f of via) f()
    for (const n of numeri) n.el.remove()
    segni.innerHTML = ''
    if (ponte) ponte.racconto.ferma()
    scena.traverse(o => { if (o.geometry) o.geometry.dispose() })
    post.composer.dispose?.()
    renderer.dispose(); renderer.forceContextLoss()
  }
}

// ── l'avvio (le scelte di prova stanno nell'indirizzo, `OPZ`) ──
const img = new Image()
img.onload = () => avvia(img)
img.src = ATLANTE
