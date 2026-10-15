// La vetrina (?vetrina=1): cose di scena modellate in codice, in fila in una sala, per misurare fin dove
// arrivano forme non squadrate fatte senza modellatore. Ogni famiglia è una funzione che riceve un
// punto e torna un gruppo; le geometrie si fanno una volta e si riusano, i materiali sono pochi e
// condivisi, niente si alloca a fotogramma. Il conto (righe, triangoli, draw call) lo fa `misura`.
// Cosa regge e cosa no: poc/sotterraneo-luce-pezzi.md
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { daCanvas, frattale, casoTrame as caso } from './trame.js'
import { OGGETTO } from './mappa.js'

// ── utensili ──
const V = (x, y) => new THREE.Vector2(x, y)
const tornio = (punti, lati = 24, inizio = 0, arco = Math.PI * 2) => new THREE.LatheGeometry(punti.map(([r, y]) => V(r, y)), lati, inizio, arco)
// rumore 3D a valori, deterministico: la stessa posizione dà lo stesso spostamento (le cuciture combaciano)
function hash3 (x, y, z) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1274126177); h = Math.imul(h ^ (h >>> 13), 1103515245); return ((h ^ (h >>> 16)) >>> 0) / 4294967296 }
function rumore3 (x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi
  const s = t => t * t * (3 - 2 * t), u = s(xf), v = s(yf), w = s(zf)
  const l = (a, b, t) => a + (b - a) * t
  const c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz)
  return l(l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v), l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v), w)
}
// ammacca: sposta ogni vertice lungo la sua normale di un rumore della sua posizione
function ammacca (geo, ampiezza, frequenza = 6, seme = 0) {
  geo.computeVertexNormals()
  const p = geo.attributes.position, n = geo.attributes.normal
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    const d = (rumore3(x * frequenza + seme, y * frequenza, z * frequenza) - 0.5) * 2 * ampiezza
    p.setXYZ(i, x + n.getX(i) * d, y + n.getY(i) * d, z + n.getZ(i) * d)
  }
  geo.computeVertexNormals()
  return geo
}
const unisci = (...geos) => mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g))

// ── le trame dipinte a codice ──
function tela (w, h, dipingi) { const c = document.createElement('canvas'); c.width = w; c.height = h; dipingi(c.getContext('2d'), w, h); return c }
export function legno () {   // anche per le botti dell'esplorazione (botti.js)
  const f = frattale(256, 21, 4, 4), r = caso(5)
  const alt = new Float32Array(256 * 256)
  const c = tela(256, 256, (g) => {
    const im = g.createImageData(256, 256)
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const vena = Math.sin((x + f(x, y) * 60) * 0.35) * 0.5 + 0.5, nodo = f(x * 2 % 256, y) > 0.72 ? 0.25 : 0
      const asse = (x % 64) < 2 ? 0.25 : 1   // le fughe fra le assi
      const v = (0.32 + vena * 0.12 - nodo) * asse
      const i = y * 256 + x; alt[i] = v
      im.data[i * 4] = 255 * v * 1.0; im.data[i * 4 + 1] = 255 * v * 0.74; im.data[i * 4 + 2] = 255 * v * 0.5; im.data[i * 4 + 3] = 255
    }
    g.putImageData(im, 0, 0)
  })
  void r
  return daCanvas(c, { altezza: alt, forza: 3 })
}
function grana (seme, tinta) {   // una superficie generica (coccio, osso, stoffa): rumore fine per il rilievo
  const f = frattale(128, seme, 4, 8)
  return daCanvas(tela(128, 128, (g) => {
    const im = g.createImageData(128, 128)
    for (let i = 0; i < 128 * 128; i++) { const v = 0.75 + f(i % 128, (i / 128) | 0) * 0.4; im.data[i * 4] = tinta[0] * v; im.data[i * 4 + 1] = tinta[1] * v; im.data[i * 4 + 2] = tinta[2] * v; im.data[i * 4 + 3] = 255 }
    g.putImageData(im, 0, 0)
  }), { forza: 2.5 })
}
// una macchia: forma irregolare da un rumore tagliato con un bordo radiale; `dipingi(v, x, y)` → [r,g,b,a]
function macchia (seme, dipingi, lato = 256) {
  const f = frattale(lato, seme, 5, 4), alt = new Float32Array(lato * lato)
  const c = tela(lato, lato, (g) => {
    const im = g.createImageData(lato, lato)
    for (let y = 0; y < lato; y++) for (let x = 0; x < lato; x++) {
      const dx = x / lato - 0.5, dy = y / lato - 0.5, d = Math.hypot(dx, dy) * 2
      const v = f(x, y) - d * 0.55
      const i = y * lato + x, [r, gg, b, a] = dipingi(v, x / lato, y / lato, f)
      im.data[i * 4] = r; im.data[i * 4 + 1] = gg; im.data[i * 4 + 2] = b; im.data[i * 4 + 3] = a
      alt[i] = a / 255 * (0.5 + v)
    }
    g.putImageData(im, 0, 0)
  })
  return daCanvas(c, { altezza: alt, forza: 2, ripete: false })
}

export function creaVetrina ({ scena, m, conMaschera, maschera, trame, materialeFiamma }) {
  const radice = new THREE.Group(); scena.add(radice)
  const famiglie = {}   // nome → { gruppo, righe (contate a mano), note }
  const pezzi = []      // { nome, x, y, z, tocca? }
  const animati = []    // funzioni (dt, t) => void
  const occupa = (x, z) => { const cx = Math.floor(x), cy = Math.floor(z); if (m.pav(cx, cy)) m.celle[m.id(cx, cy)] = OGGETTO }
  const famiglia = (nome) => (famiglie[nome] ||= { gruppo: new THREE.Group() }) && (radice.add(famiglie[nome].gruppo), famiglie[nome].gruppo)
  const mesh = (geo, mat, { ombra = true } = {}) => { const me = new THREE.Mesh(geo, mat); me.castShadow = ombra; me.receiveShadow = true; return me }
  const std = (o, mask = {}) => conMaschera(new THREE.MeshStandardMaterial(o), maschera, mask)

  // i materiali, pochi e condivisi
  const tRoccia = grana(71, [120, 114, 106]), tLegno = legno(), tCoccio = grana(31, [190, 110, 70]), tOsso = grana(41, [225, 214, 190]), tStoffa = grana(51, [140, 30, 30])
  const M = {
    pietra: std({ map: trame.pav.map, normalMap: trame.pav.normalMap, roughnessMap: trame.pav.roughnessMap, color: 0xb0a698, roughness: 1, normalScale: V(1.3, 1.3) }),
    legno: std({ map: tLegno.map, normalMap: tLegno.normalMap, roughness: 0.8, normalScale: V(1.2, 1.2) }),
    roccia: std({ map: tRoccia.map, normalMap: tRoccia.normalMap, roughness: 0.95, normalScale: V(2, 2) }),
    ferro: std({ color: 0x4a4848, metalness: 0.85, roughness: 0.45 }),
    ruggine: std({ color: 0x5a3a2a, metalness: 0.5, roughness: 0.75 }),
    coccio: std({ map: tCoccio.map, normalMap: tCoccio.normalMap, roughness: 0.75, side: THREE.DoubleSide }),
    osso: std({ map: tOsso.map, normalMap: tOsso.normalMap, roughness: 0.6 }),
    buio: std({ color: 0x0a0807, roughness: 1 }),
    stoffaSacco: std({ map: tOsso.map, normalMap: tOsso.normalMap, color: 0x9a8058, roughness: 0.95 }),
    oro: std({ color: 0xffc040, metalness: 1, roughness: 0.3, emissive: 0x442200 }),
    cera: std({ color: 0xeee2c4, roughness: 0.5, emissive: 0x2a1a08 }),
  }

  // ════ 1. MACCHIE: dipinte su piani appoggiati al pavimento e ai muri ════
  {
    const g = famiglia('macchie')
    const tipi = {
      'muffa': macchia(3, (v, x, y, f) => { const a = v > 0.18 ? Math.min(1, (v - 0.18) * 6) : 0; return [40 + 30 * f(x * 512 % 256, y * 256), 60, 30, a * 220] }),
      'sangue secco': macchia(7, (v) => { const a = v > 0.22 ? Math.min(1, (v - 0.22) * 9) : 0; return [70 + v * 60, 8, 6, a * 230] }),
      'bruciatura': macchia(11, (v) => { const a = v > 0.05 ? Math.min(1, (v - 0.05) * 3) : 0; return [12, 10, 9, a * 240] }),
      'pozza d\'acqua': macchia(17, (v) => { const a = v > 0.25 ? 1 : 0; return [30, 40, 48, a * 200] }),
      'crepa': macchia(23, (v, x, y, f) => { const k = Math.abs(f(x * 256, y * 256) - 0.5) < 0.025 && v > -0.1 ? 1 : 0; return [5, 5, 5, k * 255] }),
      'muschio': macchia(29, (v, x, y, f) => { const a = v > 0.15 ? Math.min(1, (v - 0.15) * 4) * (0.6 + f(x * 256 * 3 % 256, y * 256) * 0.6) : 0; return [50, 90, 30, Math.min(255, a * 255)] }),
    }
    const mats = Object.fromEntries(Object.entries(tipi).map(([k, t]) => [k, std({
      map: t.map, normalMap: t.normalMap, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
      roughness: k === 'pozza d\'acqua' ? 0.05 : k === 'sangue secco' ? 0.35 : 0.95, metalness: k === 'pozza d\'acqua' ? 0.3 : 0,
    })]))
    const piano = new THREE.PlaneGeometry(1, 1)
    const aTerra = (tipo, x, z, s, rot) => { const me = mesh(piano, mats[tipo], { ombra: false }); me.rotation.set(-Math.PI / 2, 0, rot); me.scale.setScalar(s); me.position.set(x, 0.004, z); g.add(me); pezzi.push({ nome: tipo + ' (pavimento)', x, y: 0.1, z }) }
    const aMuro = (tipo, x, y, s) => { const me = mesh(piano, mats[tipo], { ombra: false }); me.scale.setScalar(s); me.position.set(x, y, m.stanze[0].y + 0.006); g.add(me); pezzi.push({ nome: tipo + ' (muro)', x, y: y + s / 2, z: m.stanze[0].y + 0.2 }) }
    const s0 = m.stanze[0], zS = s0.y + 9.5
    aTerra('sangue secco', 6.5, zS, 1.3, 0.4); aTerra('bruciatura', 9.5, zS, 1.6, 1); aTerra('pozza d\'acqua', 12.5, zS, 1.4, 2)
    aTerra('muffa', 15.5, zS, 1.4, 0.2); aTerra('crepa', 18.5, zS, 1.8, 0.8); aTerra('muschio', 21.5, zS, 1.4, 2.4)
    aMuro('muffa', 27.5, 0.45, 0.9); aMuro('crepa', 30.5, 0.6, 1.1); aMuro('muschio', 33.5, 0.3, 0.8); aMuro('sangue secco', 36.5, 0.5, 0.7)
    famiglie.macchie.righe = 45
  }

  // ════ 2. PORTE: arco di pietra non squadrato, porta d'assi con ferramenta, grata ════
  {
    const g = famiglia('porte')
    const zMuro = m.stanze[0].y
    // l'arco: una forma col buco ad arco, estrusa, poi ammaccata perché le pietre non siano a filo
    const forma = new THREE.Shape(); forma.moveTo(-0.62, 0); forma.lineTo(0.62, 0); forma.lineTo(0.62, 1.2); forma.lineTo(-0.62, 1.2); forma.lineTo(-0.62, 0)
    const buco = new THREE.Path(); buco.moveTo(-0.4, 0); buco.lineTo(0.4, 0); buco.lineTo(0.4, 0.7); buco.absarc(0, 0.7, 0.4, 0, Math.PI, false); buco.lineTo(-0.4, 0)
    forma.holes.push(buco)
    const geoArco = ammacca(new THREE.ExtrudeGeometry(forma, { depth: 0.22, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 14 }).toNonIndexed(), 0.025, 7)
    const buioPorta = new THREE.PlaneGeometry(0.8, 1.1)
    // la porta d'assi: cinque assi un poco diverse, due bandelle, l'anello
    const assi = []
    for (let i = 0; i < 5; i++) assi.push(new THREE.BoxGeometry(0.155, 1.08 - (i % 2) * 0.02, 0.05).translate(0.08 + i * 0.16, 0.54, 0))
    const geoAssi = unisci(...assi)
    const geoBandelle = unisci(new THREE.BoxGeometry(0.82, 0.05, 0.02).translate(0.4, 0.25, 0.035), new THREE.BoxGeometry(0.82, 0.05, 0.02).translate(0.4, 0.8, 0.035),
      new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8).translate(0, 0.25, 0.03), new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8).translate(0, 0.8, 0.03),
      new THREE.TorusGeometry(0.05, 0.012, 6, 16).translate(0.66, 0.5, 0.05))
    const porta = (x, stato) => {
      const p = new THREE.Group(); p.position.set(x, 0, zMuro + 0.02)
      const arco = mesh(geoArco, M.pietra); arco.position.z = -0.12; p.add(arco)
      const fondo = mesh(buioPorta, M.buio, { ombra: false }); fondo.position.set(0, 0.55, -0.012); p.add(fondo)   // davanti alla faccia del muro
      const anta = new THREE.Group(); anta.position.set(-0.4, 0, 0)   // il cardine a sinistra
      const corpo = mesh(geoAssi, M.legno), ferro = mesh(geoBandelle, M.ferro)
      anta.add(corpo, ferro); p.add(anta); g.add(p)
      // forzata: un'asse scardinata, la bandella storta, l'anta socchiusa
      const scheggia = mesh(new THREE.BoxGeometry(0.155, 0.7, 0.05), M.legno); scheggia.visible = false; p.add(scheggia)
      const st = { stato, ang: 0 }
      const metti = (s) => {
        st.stato = s
        scheggia.visible = s === 'forzata'
        if (s === 'forzata') { scheggia.position.set(0.15, 0.12, 0.35); scheggia.rotation.set(-1.4, 0.3, 0.5) }
      }
      metti(stato)
      animati.push((dt) => {
        const meta = st.stato === 'aperta' ? -1.75 : st.stato === 'forzata' ? -0.32 : 0
        st.ang += (meta - st.ang) * Math.min(1, dt * 4); anta.rotation.y = st.ang
        anta.rotation.z = st.stato === 'forzata' ? -0.05 : 0
      })
      occupa(x, zMuro + 0.3)
      const ordine = ['chiusa', 'aperta', 'forzata']
      pezzi.push({ nome: 'porta ' + stato, x, y: 1.35, z: zMuro + 0.2, oggetto: p, tocca () { metti(ordine[(ordine.indexOf(st.stato) + 1) % 3]); this.nome = 'porta ' + st.stato } })
    }
    porta(5.5, 'chiusa'); porta(8.5, 'aperta'); porta(11.5, 'forzata')
    // la grata: sbarre istanziate in un telaio, sale e scende
    const sbarra = new THREE.CylinderGeometry(0.018, 0.018, 1.1, 6)
    const p = new THREE.Group(); p.position.set(14.5, 0, zMuro + 0.05)
    const arco = mesh(geoArco, M.pietra); arco.position.z = -0.12; p.add(arco)
    const fondo = mesh(buioPorta, M.buio, { ombra: false }); fondo.position.set(0, 0.55, -0.04); p.add(fondo)
    const grata = new THREE.Group()
    const sb = new THREE.InstancedMesh(sbarra, M.ruggine, 9 + 3); sb.castShadow = true
    const mt = new THREE.Matrix4()
    for (let i = 0; i < 9; i++) { mt.makeTranslation(-0.36 + i * 0.09, 0.55, 0); sb.setMatrixAt(i, mt) }
    for (let i = 0; i < 3; i++) { mt.makeRotationZ(Math.PI / 2).setPosition(0, 0.2 + i * 0.35, 0.02); sb.setMatrixAt(9 + i, mt) }
    grata.add(sb); p.add(grata); g.add(p)
    const st = { su: false, h: 0 }
    animati.push((dt) => { st.h += ((st.su ? 0.85 : 0) - st.h) * Math.min(1, dt * 2.5); grata.position.y = st.h })
    occupa(14.5, zMuro + 0.3)
    pezzi.push({ nome: 'grata', x: 14.5, y: 1.35, z: zMuro + 0.2, oggetto: p, tocca () { st.su = !st.su } })
    famiglie.porte.righe = 61
  }

  // ════ 3. VASI E ANFORE (si rompono), barile, cassa, forziere, sacco ════
  {
    const g = famiglia('contenitori')
    const zR = m.stanze[0].y + 4.5
    const profili = [
      [[0, 0], [0.12, 0], [0.16, 0.05], [0.22, 0.2], [0.21, 0.32], [0.12, 0.42], [0.09, 0.48], [0.11, 0.52], [0.1, 0.53]],                // giara
      [[0, 0], [0.06, 0], [0.09, 0.04], [0.17, 0.28], [0.16, 0.45], [0.07, 0.6], [0.05, 0.72], [0.08, 0.76], [0.07, 0.77]],             // anfora
      [[0, 0], [0.1, 0], [0.13, 0.03], [0.14, 0.12], [0.18, 0.2], [0.18, 0.24], [0.16, 0.25]],                                         // ciotolone
    ]
    const vaso = (x, k, nome) => {
      const prof = profili[k]
      const intero = ammacca(tornio(prof, 22).toNonIndexed(), 0.008, 9, k * 3)
      const me = mesh(intero, M.coccio); me.position.set(x, 0, zR); g.add(me)
      // i cocci si preparano subito: spicchi × fasce dello stesso tornio, ammaccati con lo stesso rumore
      // (la posizione è la stessa, quindi combaciano con l'intero)
      const cocci = []
      const fasce = [[0, 3], [2, 5], [4, prof.length - 1]]
      for (let s = 0; s < 5; s++) for (const [a, b] of fasce) {
        const geo = ammacca(tornio(prof.slice(a, b + 1), 5, s * Math.PI * 2 / 5, Math.PI * 2 / 5).toNonIndexed(), 0.008, 9, k * 3)
        geo.computeBoundingSphere()
        const c = geo.boundingSphere.center.clone(); geo.translate(-c.x, -c.y, -c.z)
        const cm = mesh(geo, M.coccio); cm.visible = false; cm.position.set(x + c.x, c.y, zR + c.z); g.add(cm)
        cocci.push({ me: cm, v: new THREE.Vector3(), w: new THREE.Vector3(), fermo: false })
      }
      occupa(x, zR)
      const p = {
        nome, x, y: prof[prof.length - 1][1] + 0.2, z: zR, oggetto: me,
        tocca () {
          if (!me.visible) return
          me.visible = false; p.nome = nome + ' (rotta)'
          for (const c of cocci) {
            c.me.visible = true
            const dx = c.me.position.x - x, dz = c.me.position.z - zR
            c.v.set(dx * 6 + (Math.random() - 0.5), 1 + Math.random() * 1.5, dz * 6 + (Math.random() - 0.5) + 0.4)
            c.w.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5)
          }
          // la fisica è da poco: gravità, rimbalzo sul pavimento, attrito; fermi, restano dove sono
          animati.push((dt) => {
            for (const c of cocci) {
              if (c.fermo) continue
              c.v.y -= 9.8 * dt
              c.me.position.addScaledVector(c.v, dt)
              c.me.rotation.x += c.w.x * dt; c.me.rotation.y += c.w.y * dt; c.me.rotation.z += c.w.z * dt
              if (c.me.position.y < 0.025) {
                c.me.position.y = 0.025; c.v.y *= -0.3; c.v.x *= 0.6; c.v.z *= 0.6; c.w.multiplyScalar(0.5)
                if (c.v.lengthSq() < 0.05) { c.fermo = true; c.me.rotation.x = Math.round(c.me.rotation.x / Math.PI) * Math.PI + (c.me.rotation.x % 0.4) }
              }
            }
          })
        },
      }
      pezzi.push(p)
    }
    vaso(5.5, 0, 'giara'); vaso(7, 1, 'anfora'); vaso(8.5, 2, 'ciotolone')
    // il barile: un tornio panciuto di legno e tre cerchi di ferro
    {
      const prof = []; for (let i = 0; i <= 8; i++) { const t = i / 8; prof.push([0.22 + Math.sin(t * Math.PI) * 0.05, t * 0.62]) }
      const corpo = mesh(tornio([[0, 0], ...prof, [0, 0.62]], 20), M.legno)
      const cerchi = mesh(unisci(...[0.08, 0.31, 0.54].map(y => new THREE.TorusGeometry(0.22 + Math.sin(y / 0.62 * Math.PI) * 0.05 + 0.006, 0.012, 5, 24).rotateX(Math.PI / 2).translate(0, y, 0))), M.ferro)
      const b = new THREE.Group(); b.add(corpo, cerchi); b.position.set(11, 0, zR); g.add(b); occupa(11, zR)
      pezzi.push({ nome: 'barile', x: 11, y: 0.85, z: zR })
    }
    // la cassa: assi, spigoli rinforzati
    {
      const b = new THREE.Group()
      b.add(mesh(new THREE.BoxGeometry(0.6, 0.5, 0.5).translate(0, 0.25, 0), M.legno))
      const spigoli = []
      for (const [x, z] of [[-0.3, -0.25], [0.3, -0.25], [-0.3, 0.25], [0.3, 0.25]]) spigoli.push(new THREE.BoxGeometry(0.06, 0.52, 0.06).translate(x, 0.26, z))
      b.add(mesh(unisci(...spigoli), M.ferro))
      b.position.set(13, 0, zR); b.rotation.y = 0.25; g.add(b); occupa(13, zR)
      pezzi.push({ nome: 'cassa', x: 13, y: 0.75, z: zR })
    }
    // il forziere: il coperchio è mezzo cilindro col cardine dietro; dentro, l'oro
    {
      const b = new THREE.Group()
      b.add(mesh(new THREE.BoxGeometry(0.62, 0.32, 0.4).translate(0, 0.16, 0), M.legno))
      const coperchio = new THREE.Group(); coperchio.position.set(0, 0.32, -0.2)
      const cop = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.62, 16, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI / 2).translate(0, 0, 0.2), M.legno)
      const bande = mesh(unisci(...[-0.22, 0, 0.22].map(x => new THREE.CylinderGeometry(0.21, 0.21, 0.04, 16, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI / 2).translate(x, 0, 0.2))), M.ferro)
      coperchio.add(cop, bande)
      const oro = mesh(ammacca(new THREE.SphereGeometry(0.26, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.1, 0.35, 0.7).toNonIndexed(), 0.02, 14), M.oro)
      oro.position.y = 0.24
      b.add(coperchio, oro, mesh(new THREE.BoxGeometry(0.08, 0.1, 0.03).translate(0, 0.27, 0.205), M.oro))
      b.position.set(15, 0, zR); g.add(b); occupa(15, zR)
      const st = { aperto: false, a: 0 }
      animati.push((dt) => { st.a += ((st.aperto ? -1.9 : 0) - st.a) * Math.min(1, dt * 5); coperchio.rotation.x = st.a })
      pezzi.push({ nome: 'forziere', x: 15, y: 0.85, z: zR, oggetto: b, tocca () { st.aperto = !st.aperto } })
    }
    // il sacco: una sfera schiacciata e ammaccata, il collo legato
    {
      const geo = ammacca(new THREE.SphereGeometry(0.24, 18, 12).scale(1, 1.15, 0.9).translate(0, 0.25, 0).toNonIndexed(), 0.04, 5)
      const collo = tornio([[0.06, 0.5], [0.04, 0.56], [0.07, 0.64], [0.03, 0.66]], 10)
      const b = new THREE.Group(); b.add(mesh(geo, M.stoffaSacco), mesh(collo, M.stoffaSacco), mesh(new THREE.TorusGeometry(0.045, 0.012, 5, 12).rotateX(Math.PI / 2).translate(0, 0.555, 0), M.legno))
      b.position.set(17, 0, zR); b.rotation.z = 0.08; g.add(b); occupa(17, zR)
      pezzi.push({ nome: 'sacco', x: 17, y: 0.9, z: zR })
    }
    famiglie.contenitori.righe = 99
  }

  // ════ 4. PIETRE E OSSA: sassi, macerie, stalagmiti e stalattiti, ossa e teschio ════
  {
    const g = famiglia('pietre e ossa')
    const zR = m.stanze[0].y + 4.5, zS = m.stanze[0].y + 9.5
    const sasso = ammacca(new THREE.IcosahedronGeometry(0.12, 1).toNonIndexed(), 0.035, 8)
    const r = caso(77)
    const sassi = (x, z, n, scala, nome) => {
      const im = new THREE.InstancedMesh(sasso, M.roccia, n); im.castShadow = true; im.receiveShadow = true
      const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3()
      for (let i = 0; i < n; i++) {
        const k = scala * (0.4 + r() * 1.2), a = r() * Math.PI * 2, d = r() * 0.45 * Math.sqrt(scala)
        p.set(x + Math.cos(a) * d, k * 0.06 + (n > 12 ? r() * 0.15 * scala : 0), z + Math.sin(a) * d)
        mt.compose(p, q.setFromEuler(e.set(r() * 6, r() * 6, r() * 6)), s.set(k, k * (0.6 + r() * 0.5), k)); im.setMatrixAt(i, mt)
      }
      g.add(im); pezzi.push({ nome, x, y: 0.5, z })
    }
    sassi(25.5, zS, 7, 1, 'sassi'); sassi(28.5, zR, 26, 1.8, 'crollo')
    // il crollo ha anche un pezzo di colonna caduto
    const moncone = mesh(ammacca(new THREE.CylinderGeometry(0.22, 0.24, 0.9, 12, 3).toNonIndexed(), 0.02, 6), M.roccia)
    moncone.rotation.set(0.1, 0.4, Math.PI / 2 - 0.15); moncone.position.set(28.2, 0.24, zR + 0.3); g.add(moncone); occupa(28.5, zR)
    // stalagmiti: coni ammaccati, istanziati; stalattiti: gli stessi, a testa in giù da una sporgenza del muro
    const cono = ammacca(new THREE.ConeGeometry(0.12, 0.8, 9, 6).translate(0, 0.4, 0).toNonIndexed(), 0.02, 9)
    const punte = (x, z, giu, nome) => {
      const im = new THREE.InstancedMesh(cono, M.roccia, 4); im.castShadow = true; im.receiveShadow = true
      const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3()
      ;[[0, 0, 1.6], [0.25, 0.1, 1.05], [-0.22, 0.14, 0.8], [0.06, -0.22, 0.6]].forEach(([dx, dz, k], i) => {
        p.set(x + dx, giu ? 1.25 : 0, z + dz); q.setFromEuler(new THREE.Euler(giu ? Math.PI : 0, i, 0)); s.set(k, k, k)
        mt.compose(p, q, s); im.setMatrixAt(i, mt)
      })
      g.add(im); pezzi.push({ nome, x, y: giu ? 1.4 : 0.95, z })
    }
    punte(31.5, zR, false, 'stalagmiti'); occupa(31.5, zR)
    const sporgenza = mesh(ammacca(new THREE.BoxGeometry(1.1, 0.2, 0.45, 4, 1, 2).toNonIndexed(), 0.05, 4), M.roccia)
    sporgenza.position.set(39.5, 1.3, m.stanze[0].y + 0.2); g.add(sporgenza)
    punte(39.5, m.stanze[0].y + 0.25, true, 'stalattiti')
    // le ossa: un fuso e quattro palline, fuse in una geometria, istanziate; il teschio a parte
    const osso = unisci(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6).rotateZ(Math.PI / 2),
      ...[[-0.15, 0.02], [-0.15, -0.02], [0.15, 0.02], [0.15, -0.02]].map(([x, z]) => new THREE.SphereGeometry(0.032, 6, 4).translate(x, 0, z)))
    const ossa = new THREE.InstancedMesh(osso, M.osso, 6); ossa.castShadow = true
    const mt = new THREE.Matrix4(), q = new THREE.Quaternion()
    for (let i = 0; i < 6; i++) { mt.compose(new THREE.Vector3(27.5 + (r() - 0.5) * 0.8, 0.03 + i * 0.012, zS + (r() - 0.5) * 0.6), q.setFromEuler(new THREE.Euler(0, r() * 6, 0)), new THREE.Vector3(1, 1, 1)); ossa.setMatrixAt(i, mt) }
    g.add(ossa)
    const teschio = new THREE.Group()
    teschio.add(mesh(ammacca(new THREE.SphereGeometry(0.11, 14, 10).scale(1, 0.95, 1.15).toNonIndexed(), 0.006, 12), M.osso))
    teschio.add(mesh(new THREE.BoxGeometry(0.12, 0.05, 0.1).translate(0, -0.08, 0.05), M.osso))
    teschio.add(mesh(unisci(new THREE.SphereGeometry(0.03, 8, 6).translate(-0.04, 0, 0.1), new THREE.SphereGeometry(0.03, 8, 6).translate(0.04, 0, 0.1), new THREE.ConeGeometry(0.015, 0.03, 4).rotateX(Math.PI).translate(0, -0.035, 0.12)), M.buio, { ombra: false }))
    teschio.position.set(28.1, 0.1, zS + 0.1); teschio.rotation.y = -0.4
    g.add(teschio); pezzi.push({ nome: 'ossa e teschio', x: 27.8, y: 0.5, z: zS })
    famiglie["pietre e ossa"].righe = 51
  }

  // ════ 5. ALTARE, STATUA, LUCI (torcia, lanterna, candelabro), STOFFE (arazzo, bandiera) ════
  {
    const g = famiglia('arredi')
    const zR = m.stanze[0].y + 4.5, zS = m.stanze[0].y + 9.5, zMuro = m.stanze[0].y
    const fiamme = []
    const fiamma = (x, y, z, s) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(0.34 * s, 0.55 * s).translate(0, 0.2 * s, 0), materialeFiamma); q.geometry.setAttribute('semeF', new THREE.Float32BufferAttribute([1, 1, 1, 1].map(() => x * 7.3), 1)); q.position.set(x, y, z); q.renderOrder = 13; g.add(q); fiamme.push(q) }
    // l'altare: gradini ammaccati, la lastra, il drappo e due candele
    {
      const a = new THREE.Group()
      a.add(mesh(ammacca(new THREE.BoxGeometry(1.1, 0.15, 0.7, 4, 1, 3).translate(0, 0.075, 0).toNonIndexed(), 0.012, 5), M.pietra))
      a.add(mesh(ammacca(new THREE.BoxGeometry(0.8, 0.45, 0.5, 4, 2, 3).translate(0, 0.37, 0).toNonIndexed(), 0.015, 5), M.pietra))
      a.add(mesh(ammacca(new THREE.BoxGeometry(0.95, 0.08, 0.6, 4, 1, 3).translate(0, 0.63, 0).toNonIndexed(), 0.01, 5), M.pietra))
      const drappo = new THREE.PlaneGeometry(0.4, 0.55, 4, 8)
      const pp = drappo.attributes.position; for (let i = 0; i < pp.count; i++) pp.setZ(i, Math.sin(pp.getX(i) * 30) * 0.012)
      drappo.computeVertexNormals()
      const d = mesh(drappo, std({ map: tStoffa.map, normalMap: tStoffa.normalMap, roughness: 0.9, side: THREE.DoubleSide })); d.position.set(0, 0.42, 0.305); a.add(d)
      for (const x of [-0.3, 0.3]) { a.add(mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.18, 8).translate(x, 0.76, -0.1), M.cera)); fiamma(19 + x, 0.85, zR - 0.1, 0.35) }
      a.position.set(19, 0, zR); g.add(a); occupa(19, zR)
      pezzi.push({ nome: 'altare', x: 19, y: 1.2, z: zR })
    }
    // la statua stilizzata: piedistallo, veste a tornio con le pieghe nel rumore, cappuccio, braccia, spada
    {
      const s = new THREE.Group()
      s.add(mesh(ammacca(new THREE.BoxGeometry(0.5, 0.25, 0.5, 2, 1, 2).translate(0, 0.125, 0).toNonIndexed(), 0.012, 5), M.pietra))
      const veste = tornio([[0.2, 0.25], [0.21, 0.3], [0.17, 0.6], [0.13, 0.95], [0.1, 1.05], [0.0, 1.07]], 18)
      const pv = veste.attributes.position
      for (let i = 0; i < pv.count; i++) { const x = pv.getX(i), z = pv.getZ(i), a = Math.atan2(z, x), k = 1 + Math.sin(a * 7) * 0.06 * (1.1 - pv.getY(i)); pv.setX(i, x * k); pv.setZ(i, z * k) }
      veste.computeVertexNormals()
      s.add(mesh(veste, M.pietra))
      s.add(mesh(ammacca(new THREE.SphereGeometry(0.1, 12, 8).scale(1, 1.15, 1).translate(0, 1.15, 0).toNonIndexed(), 0.006, 10), M.pietra))
      s.add(mesh(new THREE.SphereGeometry(0.125, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6).translate(0, 1.16, -0.015), M.pietra))
      const braccio = new THREE.CapsuleGeometry(0.04, 0.32, 4, 8)
      s.add(mesh(braccio.clone().rotateZ(0.9).rotateY(0.6).translate(-0.12, 0.83, 0.08), M.pietra), mesh(braccio.clone().rotateZ(-0.9).rotateY(-0.6).translate(0.12, 0.83, 0.08), M.pietra))
      s.add(mesh(unisci(new THREE.BoxGeometry(0.03, 0.7, 0.008).translate(0, 0.55, 0.2), new THREE.BoxGeometry(0.16, 0.03, 0.03).translate(0, 0.8, 0.2)), M.ferro))
      s.position.set(22, 0, zR); g.add(s); occupa(22, zR)
      pezzi.push({ nome: 'statua', x: 22, y: 1.55, z: zR })
    }
    // le luci: la torcia a muro, la lanterna, il candelabro (fiamme con lo shader delle torce; luci vere no:
    // il numero di luci del renderer è fisso, queste si accendono solo nel bagliore e nelle torce vicine)
    {
      const torcia = new THREE.Group()
      torcia.add(mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.35, 8).rotateX(-0.5).translate(0, 0.75, 0.12), M.legno))
      torcia.add(mesh(tornio([[0.02, 0], [0.06, 0.04], [0.065, 0.1], [0.06, 0.1]], 8).rotateX(-0.5).translate(0, 0.9, 0.2), M.ferro))
      torcia.add(mesh(new THREE.BoxGeometry(0.06, 0.12, 0.03).translate(0, 0.68, 0.015), M.ferro))
      torcia.position.set(25.5, 0, zMuro); g.add(torcia); fiamma(25.5, 0.98, zMuro + 0.27, 0.6)
      pezzi.push({ nome: 'torcia a muro', x: 25.5, y: 1.4, z: zMuro + 0.2 })
      const lant = new THREE.Group()
      const spig = []; for (const [x, z] of [[-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08], [0.08, 0.08]]) spig.push(new THREE.BoxGeometry(0.015, 0.26, 0.015).translate(x, 0.15, z))
      spig.push(new THREE.BoxGeometry(0.2, 0.03, 0.2).translate(0, 0.015, 0), new THREE.ConeGeometry(0.15, 0.1, 4).rotateY(Math.PI / 4).translate(0, 0.33, 0), new THREE.TorusGeometry(0.04, 0.008, 4, 10).translate(0, 0.4, 0))
      lant.add(mesh(unisci(...spig), M.ferro))
      lant.add(mesh(new THREE.BoxGeometry(0.15, 0.22, 0.15).translate(0, 0.14, 0), std({ color: 0xffd090, emissive: 0xff9a40, emissiveIntensity: 1.6, transparent: true, opacity: 0.55, roughness: 0.2 }), { ombra: false }))
      lant.position.set(31.5, 0, zS); g.add(lant); occupa(31.5, zS)
      pezzi.push({ nome: 'lanterna', x: 31.5, y: 0.7, z: zS })
      const cand = new THREE.Group()
      cand.add(mesh(tornio([[0, 0], [0.14, 0], [0.13, 0.03], [0.04, 0.06], [0.03, 0.5], [0.05, 0.52], [0, 0.53]], 14), M.oro))
      const braccia = []; for (const a of [0, 2.1, 4.2]) braccia.push(new THREE.TorusGeometry(0.12, 0.012, 5, 10, Math.PI / 2).rotateY(a).translate(Math.cos(a) * 0.0, 0.5, 0))
      cand.add(mesh(unisci(...braccia), M.oro))
      for (const a of [0, 2.1, 4.2]) { const x = Math.cos(-a) * 0.12, z = Math.sin(-a) * 0.12; cand.add(mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.1, 6).translate(x, 0.67, z), M.cera)); fiamma(34.5 + x, 0.72, zS + z, 0.25) }
      cand.add(mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.12, 6).translate(0, 0.59, 0), M.cera)); fiamma(34.5, 0.65, zS, 0.28)
      cand.position.set(34.5, 0, zS); g.add(cand); occupa(34.5, zS)
      pezzi.push({ nome: 'candelabro', x: 34.5, y: 1, z: zS })
    }
    // l'arazzo e la bandiera stracciati: un piano fitto con l'alfa dipinto (strappi, buchi), che ondeggia
    // nel vertex shader (iniettato nel materiale standard, così la luce lo prende come il resto)
    {
      const f = frattale(256, 61, 4, 6)
      const dipinto = (ricco) => daCanvas(tela(256, 320, (g2, w, h) => {
        g2.fillStyle = ricco ? '#6a1418' : '#2a3a6a'; g2.fillRect(0, 0, w, h)
        g2.strokeStyle = '#c89a3a'; g2.lineWidth = 10; g2.strokeRect(14, 14, w - 28, h - 70)
        g2.fillStyle = '#c89a3a'; g2.beginPath(); g2.moveTo(w / 2, 70); g2.lineTo(w / 2 + 50, 150); g2.lineTo(w / 2, 230); g2.lineTo(w / 2 - 50, 150); g2.fill()
        const im = g2.getImageData(0, 0, w, h)
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const n = f(x, y % 256), bordo = h - 40 - n * 90 - (ricco ? 0 : Math.abs(x - w / 2) * -0.5)
          const buco = n > 0.7 && y > h * 0.4
          const sfilato = ricco ? y > bordo : (y > bordo || y > h - 10 - Math.abs(x - w / 2) * 1.6 + 120)
          if (sfilato || buco) im.data[(y * w + x) * 4 + 3] = 0
          else { const k = 0.75 + n * 0.4; im.data[(y * w + x) * 4] *= k; im.data[(y * w + x) * 4 + 1] *= k; im.data[(y * w + x) * 4 + 2] *= k }
        }
        g2.putImageData(im, 0, 0)
      }), { forza: 1.5, ripete: false })
      const stoffa = (x, larg, alto, ricco, nome) => {
        const t = dipinto(ricco)
        const mat = std({ map: t.map, normalMap: t.normalMap, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.95 })
        const unif = { uT: { value: 0 } }
        const prima = mat.onBeforeCompile
        mat.onBeforeCompile = (sh) => {
          prima(sh); sh.uniforms.uT = unif.uT
          sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
            float giu = clamp(-position.y / ${alto.toFixed(2)}, 0.0, 1.0);
            transformed.z += sin(uT * 1.7 + position.x * 4.0 + position.y * 3.0) * 0.05 * giu + sin(uT * 3.1 + position.y * 7.0) * 0.015 * giu;
            transformed.x += sin(uT * 1.3 + position.y * 2.0) * 0.03 * giu * giu;`)
        }
        mat.customProgramCacheKey = () => 'stoffa'
        const piano = new THREE.PlaneGeometry(larg, alto, 10, 16).translate(0, -alto / 2, 0)
        const me = mesh(piano, mat); me.position.set(x, 1.15, zMuro + 0.06); g.add(me)
        g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, larg + 0.15, 6).rotateZ(Math.PI / 2).translate(x, 1.17, zMuro + 0.06), M.legno))
        animati.push((dt, tt) => { unif.uT.value = tt })
        pezzi.push({ nome, x, y: 1.4, z: zMuro + 0.2 })
      }
      stoffa(43.5, 0.8, 1.0, true, 'arazzo'); stoffa(45.5, 0.5, 0.95, false, 'bandiera')
    }
    // le fiamme vivono solo dove si vede adesso (la maschera): nel ricordo e nel buio non ci sono
    animati.push((dt, t, camera, visto) => { for (const q of fiamme) { q.quaternion.copy(camera.quaternion); q.visible = visto(q.position.x, q.position.z) > 0.25 } })
    famiglie.arredi.righe = 105
  }

  // ════ 6. FORME ORGANICHE: radici, funghi giganti, tela di ragno ════
  {
    const g = famiglia('organiche')
    const zR = m.stanze[0].y + 4.5, zMuro = m.stanze[0].y
    // le radici: tubi lungo curve a caso che si assottigliano (il tubo di three ha il raggio fisso:
    // si stringe dopo, anello per anello)
    const r = caso(91)
    const radice = (da, dir, lung, raggio) => {
      const punti = [da.clone()]
      const d = dir.clone()
      for (let i = 0; i < 5; i++) { d.add(new THREE.Vector3((r() - 0.5) * 0.8, (r() - 0.6) * 0.6, (r() - 0.5) * 0.8)).normalize(); punti.push(punti[i].clone().addScaledVector(d, lung / 5)) }
      for (const p of punti) p.y = Math.max(0.02, p.y)
      const seg = 24, lati = 7
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(punti), seg, raggio, lati, false)
      const p = geo.attributes.position, cen = new THREE.CatmullRomCurve3(punti)
      for (let i = 0; i <= seg; i++) {
        const c = cen.getPointAt(i / seg), k = Math.max(0.08, 1 - i / seg)
        for (let j = 0; j <= lati; j++) { const v = i * (lati + 1) + j; p.setXYZ(v, c.x + (p.getX(v) - c.x) * k, c.y + (p.getY(v) - c.y) * k, c.z + (p.getZ(v) - c.z) * k) }
      }
      geo.computeVertexNormals()
      return geo
    }
    const geos = []
    for (let i = 0; i < 6; i++) geos.push(radice(new THREE.Vector3(36.5 + (r() - 0.5) * 0.8, 0.9 + r() * 0.3, zMuro + 0.02), new THREE.Vector3((r() - 0.5), -0.8, 0.6), 1.2 + r() * 0.6, 0.04 + r() * 0.03))
    g.add(mesh(unisci(...geos), M.legno))
    pezzi.push({ nome: 'radici', x: 36.5, y: 1.3, z: zMuro + 0.3 })
    // i funghi: gambo e cappello a tornio, il cappello con le macchie dipinte e un filo di luce propria
    const tFungo = daCanvas(tela(128, 128, (g2) => {
      g2.fillStyle = '#7a3a6a'; g2.fillRect(0, 0, 128, 128)
      const rr = caso(13); g2.fillStyle = '#e8d8b8'
      for (let i = 0; i < 14; i++) { g2.beginPath(); g2.ellipse(rr() * 128, rr() * 70, 3 + rr() * 6, 2 + rr() * 4, 0, 0, 7); g2.fill() }
      g2.fillStyle = '#c8b090'; g2.fillRect(0, 96, 128, 32)
    }), { forza: 1.5 })
    const matCappello = std({ map: tFungo.map, normalMap: tFungo.normalMap, roughness: 0.6, emissive: 0x30ffd0, emissiveIntensity: 0.0, side: THREE.DoubleSide })
    const fungo = (x, z, k, piega) => {
      const f = new THREE.Group()
      const gambo = tornio([[0.07, 0], [0.06, 0.1], [0.045, 0.4], [0.05, 0.5]], 10)
      const pv = gambo.attributes.position; for (let i = 0; i < pv.count; i++) pv.setX(i, pv.getX(i) + Math.sin(pv.getY(i) * 5) * 0.02 * piega)
      gambo.computeVertexNormals()
      f.add(mesh(gambo, M.osso))
      f.add(mesh(ammacca(tornio([[0.04, 0.48], [0.22, 0.47], [0.26, 0.5], [0.22, 0.58], [0.12, 0.64], [0, 0.66]], 18).toNonIndexed(), 0.012, 8), matCappello))
      f.position.set(x, 0, z); f.scale.setScalar(k); f.rotation.z = piega * 0.15; g.add(f)
    }
    fungo(40, zR, 1.5, 1); fungo(40.4, zR + 0.3, 0.9, -1); fungo(39.7, zR + 0.35, 0.6, 0.5); occupa(40, zR)
    pezzi.push({ nome: 'funghi giganti', x: 40, y: 1.3, z: zR })
    // la tela di ragno nell'angolo fra il muro nord e quello ovest: fili radiali e una spirale, in linee
    const s0 = m.stanze[0], ox = s0.x + 0.01, oz = s0.y + 0.01, oy = 1.2
    const fili = []
    const raggi = 7
    const punto = (a, d) => new THREE.Vector3(ox + Math.cos(a) * d * 0.7, oy - Math.sin(a) * d * 0.0 - d * 0.55, oz + Math.sin(a) * d * 0.7)
    for (let i = 0; i < raggi; i++) { const a = (i / (raggi - 1)) * Math.PI / 2; fili.push(new THREE.Vector3(ox, oy, oz), punto(a, 1)) }
    for (let giro = 1; giro < 9; giro++) for (let i = 0; i < raggi - 1; i++) {
      const d1 = giro / 9 + i * 0.012, d2 = giro / 9 + (i + 1) * 0.012
      fili.push(punto(i / (raggi - 1) * Math.PI / 2, d1), punto((i + 1) / (raggi - 1) * Math.PI / 2, d2))
    }
    const tela2 = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(fili), new THREE.LineBasicMaterial({ color: 0xd8d0c0, transparent: true, opacity: 0.55 }))
    g.add(tela2)
    pezzi.push({ nome: 'tela di ragno', x: ox + 0.4, y: 1.4, z: oz + 0.4 })
    famiglie.organiche.righe = 55
  }

  // ── il conto: triangoli e draw call per famiglia (un InstancedMesh è una chiamata per gruppo di materiale) ──
  const misura = {}
  for (const [nome, f] of Object.entries(famiglie)) {
    let tri = 0, draw = 0, byte = 0
    f.gruppo.traverse(o => {
      if (!o.geometry) return
      const g = o.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / (o.isLineSegments ? 2 : 3)
      tri += n * (o.isInstancedMesh ? o.count : 1); draw += 1
      for (const a of Object.values(g.attributes)) byte += a.array.byteLength
    })
    misura[nome] = { righe: f.righe, triangoli: Math.round(tri), draw, kbGeometria: Math.round(byte / 1024) }
  }

  // le etichette: un <div> per pezzo, sopra la cosa, solo quando la si vede
  const strato = document.getElementById('segni')
  for (const p of pezzi) { p.div = document.createElement('div'); p.div.className = 'etichetta'; p.div.textContent = p.nome; strato.appendChild(p.div) }
  const v3 = new THREE.Vector3()
  return {
    misura, pezzi,
    oggetti: pezzi.filter(p => p.tocca).map(p => p.oggetto),
    tocca (ogg) { const p = pezzi.find(p => p.oggetto === ogg || (p.oggetto && ogg && p.oggetto.getObjectById(ogg.id))); if (p) { p.tocca(); p.div.textContent = p.nome; return true } return false },
    aggiorna (dt, t, camera, visto) {
      for (const f of animati) f(dt, t, camera, visto)
      for (const p of pezzi) {
        v3.set(p.x, p.y, p.z).project(camera)
        const ok = visto(p.x, p.z) > 0.4 && v3.z < 1
        p.div.style.display = ok ? '' : 'none'
        if (ok) { p.div.style.left = ((v3.x + 1) / 2 * innerWidth) + 'px'; p.div.style.top = ((1 - v3.y) / 2 * innerHeight) + 'px' }
      }
    },
  }
}
