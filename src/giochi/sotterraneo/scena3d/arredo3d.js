// L'arredo del paesaggio, modellato in codice e fitto: ogni stanza deve raccontare il posto (contrafforti e sacchi nelle
// cantine, pilastri e nicchie coi sarcofagi nella cripta, tubi e bocche accese nella fornace, stalagmiti e funghi nella
// grotta, abeti e cumuli nella neve, ghiaccioli e cristalli nel ghiaccio, canne e radici nella palude, archi e alghe nel
// tempio, travi, binari e carrelli nella miniera). È decoro: il motore non ne sa niente, l'eroe ci passa, e non sta mai
// sulla roba del piano, sulle porte, sull'acqua. Un tipo è un InstancedMesh (una o due chiamate); chi fa luce dà una
// sorgente alla riserva fissa (scena3d/luci.js). Dove sta lo decide il seme del piano (puro: `postiDellArredo`, in Node).
// Il catalogo e come se ne aggiunge uno: docs/sotterraneo/paesaggi-3d.md.
import { BoxGeometry, CylinderGeometry, ConeGeometry, SphereGeometry, CircleGeometry, DodecahedronGeometry, TorusGeometry, LatheGeometry, PlaneGeometry,
         TubeGeometry, CatmullRomCurve3, InstancedMesh, MeshStandardMaterial, Matrix4, Vector2, Vector3, Quaternion, Euler, Color,
         Float32BufferAttribute, DoubleSide } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { caso, fbm3d } from './rumore.js'
import { ALTO_MURO } from './costanti.js'

// dove si posa ogni tipo: `faccia` sulla parete di fondo (un muro alto col pavimento a sud) ogni `passo` celle; `piede`
// sul pavimento accanto a un muro (`nord`: solo col muro alle spalle, per le cose alte); `sparso` ovunque sul pavimento
// libero (cose basse); `corridoio` fuori dalle stanze; `stanza` una per stanza grande, contro un muro; `acqua` sulle pozze
export const POSE_ARREDO = {
  contrafforti: { dove: 'faccia', passo: 3 }, mensole: { dove: 'faccia', passo: 4, sfasa: 1 }, sacchi: { dove: 'piede' },
  pilastri: { dove: 'faccia', passo: 2 }, nicchie: { dove: 'faccia', passo: 4, sfasa: 1 }, ossa: { dove: 'sparso' }, candele: { dove: 'piede' },
  tubi: { dove: 'faccia', passo: 1 }, bocche: { dove: 'faccia', passo: 5, sfasa: 2 }, incudini: { dove: 'piede', nord: true },
  spuntoni: { dove: 'piede' }, stalagmiti: { dove: 'piede' }, funghi: { dove: 'piede' }, sassi: { dove: 'sparso' },
  abeti: { dove: 'piede', nord: true }, cumuli: { dove: 'piede' }, ghiaccioli: { dove: 'faccia', passo: 1 }, cristalli: { dove: 'piede' },
  canne: { dove: 'piede' }, radici: { dove: 'faccia', passo: 1 }, archi: { dove: 'faccia', passo: 2 }, alghe: { dove: 'sparso' },
  rocchi: { dove: 'piede' }, travi: { dove: 'faccia', passo: 3 }, binari: { dove: 'corridoio' }, carrelli: { dove: 'stanza' },
  ninfee: { dove: 'acqua' },
}

// puro: per ogni tipo [{ x, z, giro, scala, cella: {x,y}, lungo }] (x, z nel mondo; `lungo` per i binari: true se corre in x)
export function postiDellArredo(pianta, liv, arredo, seme) {
  const r = caso(seme * 7 + 3)
  const occupate = new Set()
  for (const q of liv.robe || []) {
    const raggio = q.che === 'porta' ? 2 : q.che === 'fonte' || q.che === 'portale' || q.che === 'scala' ? 1 : 0
    for (let dy = -raggio; dy <= raggio; dy++) for (let dx = -raggio; dx <= raggio; dx++) occupate.add(pianta.id(q.x + dx, q.y + dy))
  }
  for (const q of liv.relitti || []) for (let dy = 0; dy < (q.h || 1); dy++) for (let dx = 0; dx < (q.w || 1); dx++) occupate.add(pianta.id(q.x + dx, q.y + dy))
  const inStanza = new Set()
  for (const s of liv.stanze || []) for (const c of s.suolo || []) inStanza.add(pianta.id(c.x, c.y))
  const libera = (x, y) => pianta.calpestabile(x, y) && !occupate.has(pianta.id(x, y)) && !pianta.colonna[pianta.id(x, y)]
  const muro = (x, y) => pianta.roccia(x, y) && !(x >= 0 && y >= 0 && x < pianta.W && y < pianta.H && pianta.colonna[pianta.id(x, y)])
  const fuori = {}
  const prese = new Set()
  for (const [tipo, quanto] of arredo || []) {
    const posa = POSE_ARREDO[tipo]
    if (!posa) continue
    const lista = fuori[tipo] = []
    const prendi = (o, x, y) => { lista.push({ ...o, cella: { x, y } }); prese.add(pianta.id(x, y)) }
    if (posa.dove === 'faccia') {
      // le celle di muro alto col pavimento libero subito a sud
      for (const m of pianta.muri) {
        if (m.basso || !libera(m.x, m.y + 1) || pianta.roccia(m.x, m.y + 1)) continue
        if (((m.x + (posa.sfasa || 0)) % posa.passo) !== 0 || r() > quanto) continue
        if (posa.passo > 1 && prese.has(pianta.id(m.x, m.y + 1)) && tipo !== 'ghiaccioli' && tipo !== 'radici') continue
        prendi({ x: m.x + 0.5, z: m.y + 1, giro: 0, scala: 0.9 + r() * 0.2, muro: { x: m.x, y: m.y } }, m.x, m.y + 1)
      }
    } else if (posa.dove === 'piede' || posa.dove === 'sparso') {
      for (const { x, y } of pianta.pavimento) {
        if (!libera(x, y) || prese.has(pianta.id(x, y))) continue
        const n = muro(x, y - 1), e = muro(x + 1, y), s = muro(x, y + 1), o = muro(x - 1, y)
        if (posa.dove === 'piede' && !(posa.nord ? n : n || e || o || s)) continue
        if (r() > quanto * (posa.dove === 'sparso' ? 0.35 : 1)) continue
        // verso il muro: le cose si stringono alla parete
        const vx = (e ? 0.25 : 0) - (o ? 0.25 : 0), vz = (s ? 0.2 : 0) - (n ? 0.28 : 0)
        prendi({ x: x + 0.5 + vx + (r() - 0.5) * 0.25, z: y + 0.5 + vz + (r() - 0.5) * 0.25, giro: r() * 6.28, scala: 0.75 + r() * 0.5 }, x, y)
      }
    } else if (posa.dove === 'corridoio') {
      for (const { x, y } of pianta.pavimento) {
        if (!libera(x, y) || inStanza.has(pianta.id(x, y)) || r() > quanto) continue
        const lungo = pianta.calpestabile(x - 1, y) || pianta.calpestabile(x + 1, y)
        prendi({ x: x + 0.5, z: y + 0.5, giro: lungo ? 0 : Math.PI / 2, scala: 1, lungo }, x, y)
      }
    } else if (posa.dove === 'acqua') {
      for (const { x, y } of pianta.acqua) if (r() < quanto) prendi({ x: x + 0.5 + (r() - 0.5) * 0.4, z: y + 0.5 + (r() - 0.5) * 0.4, giro: r() * 6.28, scala: 0.7 + r() * 0.6 }, x, y)
    } else if (posa.dove === 'stanza') {
      for (const s of liv.stanze || []) {
        if ((s.suolo || []).length < 30 || r() > quanto * 2) continue
        const c = s.suolo.find(q => libera(q.x, q.y) && muro(q.x, q.y - 1) && libera(q.x + 1, q.y) && !prese.has(pianta.id(q.x, q.y)))
        if (c) prendi({ x: c.x + 1, z: c.y + 0.6, giro: 0.1, scala: 1 }, c.x, c.y)
      }
    }
  }
  return fuori
}

// ── gli attrezzi delle forme ──
const nudo = g => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k); if (!n.attributes.uv) n.setAttribute('uv', new Float32BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2)); return n }
const unisci = (...gs) => mergeGeometries(gs.map(nudo))
const gruppi = (...parti) => mergeGeometries(parti.map(p => unisci(...p)), true)   // una parte per materiale
function ammacca(g, a, fr, seme) {
  const f = fbm3d(seme), p = g.attributes.position
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); p.setXYZ(i, x + f(x * fr, y * fr, z * fr) * a, y + f(x * fr + 5, y * fr, z * fr) * a * 0.5, z + f(x * fr, y * fr, z * fr + 9) * a) }
  g.computeVertexNormals(); return g
}
const sasso = (r, seme, d = 0) => ammacca(new DodecahedronGeometry(r, d).scale(1, 0.7, 1), r * 0.5, 3 / r, seme)
const lat = (pts, n = 10) => new LatheGeometry(pts.map(([a, b]) => new Vector2(a, b)), n)
const tubo = (punti, r, seme) => { const rn = caso(seme); return new TubeGeometry(new CatmullRomCurve3(punti.map(([x, y, z]) => new Vector3(x + (rn() - 0.5) * 0.06, y, z + (rn() - 0.5) * 0.06))), 8, r, 4, false) }

const ROCCIA = c => ({ color: c, roughness: 0.9 })
// ogni tipo: la geometria (coi gruppi), i materiali, e chi fa luce (`luce`: colore, forza, raggio, altezza, quanti su dieci)
function forma(tipo, a) {
  const pietra = new Color(a.colonna), scura = new Color(a.muro).multiplyScalar(0.45)
  switch (tipo) {
    case 'contrafforti': return { g: gruppi([new BoxGeometry(0.36, ALTO_MURO + 0.05, 0.3).translate(0, ALTO_MURO / 2, 0.15), new BoxGeometry(0.44, 0.14, 0.38).translate(0, 0.07, 0.19), new BoxGeometry(0.44, 0.1, 0.36).translate(0, ALTO_MURO - 0.1, 0.18)]), m: [{ trama: 'muro', color: '#c8b4a0' }] }
    case 'mensole': return { g: gruppi([new BoxGeometry(0.8, 0.05, 0.22).translate(0, 0.62, 0.11), new BoxGeometry(0.8, 0.05, 0.22).translate(0, 0.95, 0.11)],
      [lat([[0.001, 0], [0.07, 0.01], [0.09, 0.08], [0.05, 0.16], [0.03, 0.2], [0.001, 0.2]]).translate(-0.25, 0.645, 0.1), lat([[0.001, 0], [0.06, 0.01], [0.07, 0.1], [0.04, 0.14], [0.001, 0.14]]).translate(0.05, 0.645, 0.11),
        lat([[0.001, 0], [0.08, 0.01], [0.09, 0.12], [0.04, 0.2], [0.001, 0.2]]).translate(0.28, 0.975, 0.1), lat([[0.001, 0], [0.05, 0.01], [0.06, 0.1], [0.001, 0.1]]).translate(-0.12, 0.975, 0.1)]),
      m: [{ trama: 'legno', color: '#9a7a5a' }, { color: '#a0604a', roughness: 0.6 }] }
    case 'sacchi': return { g: gruppi([sasso(0.2, 3).scale(1, 1.25, 1).translate(0, 0.17, 0), sasso(0.17, 4).scale(1, 1.2, 1).translate(0.26, 0.14, 0.06), sasso(0.15, 5).translate(0.12, 0.38, 0.0)]), m: [{ color: '#b09a72', roughness: 1 }] }
    case 'pilastri': return { g: gruppi([new BoxGeometry(0.42, ALTO_MURO + 0.1, 0.16).translate(0, (ALTO_MURO + 0.1) / 2, 0.08), new BoxGeometry(0.56, 0.16, 0.24).translate(0, 0.08, 0.12), new BoxGeometry(0.56, 0.14, 0.24).translate(0, ALTO_MURO, 0.12)]), m: [{ trama: 'muro', color: '#d0d6e0' }] }
    case 'nicchie': return { g: gruppi(
      [new BoxGeometry(0.14, 1.0, 0.12).translate(-0.4, 0.5, 0.06), new BoxGeometry(0.14, 1.0, 0.12).translate(0.4, 0.5, 0.06), new BoxGeometry(0.94, 0.16, 0.14).translate(0, 1.04, 0.07),
        new BoxGeometry(0.78, 0.32, 0.36).translate(0, 0.16, 0.24), new BoxGeometry(0.84, 0.08, 0.42).translate(0, 0.36, 0.24), new BoxGeometry(0.1, 0.03, 0.3).translate(0, 0.41, 0.24), new BoxGeometry(0.34, 0.03, 0.08).translate(0, 0.41, 0.16)],
      [new BoxGeometry(0.66, 0.92, 0.02).translate(0, 0.5, 0.01)]), m: [{ trama: 'muro', color: '#c4ccd8' }, { color: '#050608', roughness: 1 }] }
    case 'ossa': return { g: gruppi([new CylinderGeometry(0.025, 0.025, 0.36, 5).rotateZ(Math.PI / 2).translate(0, 0.03, 0), new SphereGeometry(0.04, 6, 4).translate(-0.19, 0.03, 0), new SphereGeometry(0.04, 6, 4).translate(0.19, 0.03, 0),
      new CylinderGeometry(0.02, 0.02, 0.26, 5).rotateZ(Math.PI / 2).rotateY(1.1).translate(0.04, 0.05, 0.08), new SphereGeometry(0.1, 8, 6).scale(1, 0.9, 1.15).translate(-0.12, 0.09, -0.12)]), m: [{ color: '#d8cfb8', roughness: 0.8 }] }
    case 'candele': return { g: gruppi([new CylinderGeometry(0.035, 0.04, 0.32, 6).translate(0, 0.16, 0), new CylinderGeometry(0.03, 0.035, 0.22, 6).translate(0.1, 0.11, 0.04), new CylinderGeometry(0.03, 0.03, 0.14, 6).translate(-0.07, 0.07, 0.07)],
      [new SphereGeometry(0.03, 5, 4).scale(1, 1.8, 1).translate(0, 0.36, 0), new SphereGeometry(0.025, 5, 4).scale(1, 1.8, 1).translate(0.1, 0.25, 0.04), new SphereGeometry(0.022, 5, 4).scale(1, 1.8, 1).translate(-0.07, 0.17, 0.07)]),
      m: [{ color: '#e8dcc0', roughness: 0.7 }, { color: '#ffb050', emissive: '#ffa040', emissiveIntensity: 3 }], luce: { colore: '#ffb060', forza: 1.6, raggio: 3.5, y: 0.45, quanti: 4 } }
    case 'tubi': return { g: gruppi([new CylinderGeometry(0.085, 0.085, 1.0, 10).rotateZ(Math.PI / 2).translate(0, 0.95, 0.12), new CylinderGeometry(0.05, 0.05, 1.0, 8).rotateZ(Math.PI / 2).translate(0, 0.7, 0.08),
      new TorusGeometry(0.1, 0.025, 5, 12).rotateY(Math.PI / 2).translate(0.48, 0.95, 0.12), new CylinderGeometry(0.06, 0.06, 0.7, 8).translate(0.3, 0.35, 0.1), new CylinderGeometry(0.09, 0.09, 0.04, 8).rotateX(Math.PI / 2).translate(0.3, 0.6, 0.2)]),
      m: [{ color: '#8a5a3a', roughness: 0.45, metalness: 0.75 }] }
    case 'bocche': return { g: gruppi([new BoxGeometry(0.9, 0.12, 0.2).translate(0, 0.72, 0.1), new BoxGeometry(0.12, 0.62, 0.2).translate(-0.39, 0.36, 0.1), new BoxGeometry(0.12, 0.62, 0.2).translate(0.39, 0.36, 0.1),
      ...[-0.2, 0, 0.2].map(x => new BoxGeometry(0.04, 0.6, 0.04).translate(x, 0.36, 0.17))], [new BoxGeometry(0.66, 0.6, 0.02).translate(0, 0.36, 0.02)]),
      m: [{ color: '#2a2624', roughness: 0.5, metalness: 0.7 }, { color: '#ff6010', emissive: '#ff5a10', emissiveIntensity: 4 }], luce: { colore: '#ff6a20', forza: 5, raggio: 6, y: 0.5, quanti: 10, avanti: 0.5 } }
    case 'incudini': return { g: gruppi([new BoxGeometry(0.3, 0.3, 0.3).translate(0, 0.15, 0), new BoxGeometry(0.14, 0.14, 0.14).translate(0, 0.37, 0), new BoxGeometry(0.46, 0.12, 0.2).translate(0.03, 0.5, 0), new ConeGeometry(0.06, 0.16, 6).rotateZ(Math.PI / 2).translate(-0.27, 0.5, 0)]), m: [{ color: '#3a3a3e', roughness: 0.4, metalness: 0.8 }] }
    case 'spuntoni': return { g: gruppi([0, 1, 2, 3, 4].map(k => ammacca(new ConeGeometry(0.06 + k * 0.012, 0.35 + ((k * 37) % 5) * 0.14, 5, 3).translate(0, (0.35 + ((k * 37) % 5) * 0.14) / 2, 0), 0.03, 6, k)
      .rotateZ((k - 2) * 0.18).rotateX(((k * 3) % 5 - 2) * 0.12).translate((k - 2) * 0.1, 0, ((k * 7) % 3 - 1) * 0.1))), m: [{ color: '#151012', roughness: 0.2, metalness: 0.3, emissive: '#3a0800', flat: true }] }
    case 'stalagmiti': return { g: gruppi([ammacca(lat([[0.001, 0], [0.2, 0], [0.12, 0.3], [0.05, 0.62], [0.001, 0.78]], 8), 0.05, 4, 1), ammacca(lat([[0.001, 0], [0.13, 0], [0.07, 0.24], [0.001, 0.42]], 7), 0.04, 5, 2).translate(0.2, 0, 0.1),
      ammacca(lat([[0.001, 0], [0.1, 0], [0.04, 0.2], [0.001, 0.28]], 6), 0.03, 6, 3).translate(-0.16, 0, 0.12)]), m: [ROCCIA(pietra)] }
    case 'funghi': {
      const cappello = (r, y, x, z) => lat([[0.001, 0.02], [r, 0.0], [r * 0.85, r * 0.45], [r * 0.4, r * 0.7], [0.001, r * 0.75]], 10).translate(x, y, z)
      return { g: gruppi([new CylinderGeometry(0.03, 0.045, 0.3, 6).translate(0, 0.15, 0), new CylinderGeometry(0.02, 0.03, 0.2, 6).translate(0.13, 0.1, 0.06), new CylinderGeometry(0.018, 0.025, 0.14, 6).translate(-0.1, 0.07, 0.08)],
        [cappello(0.15, 0.29, 0, 0), cappello(0.1, 0.19, 0.13, 0.06), cappello(0.07, 0.13, -0.1, 0.08)]),
        m: [{ color: '#d8d0c0', roughness: 0.8 }, { color: a.funghi || '#40c8ff', emissive: a.funghi || '#40c8ff', emissiveIntensity: 1.6 }], luce: { colore: a.funghi || '#40c8ff', forza: 1.4, raggio: 3, y: 0.35, quanti: 4 } }
    }
    case 'sassi': return { g: gruppi([sasso(0.09, 11).translate(0, 0.04, 0), sasso(0.06, 12).translate(0.14, 0.03, 0.05), sasso(0.05, 13).translate(-0.1, 0.02, 0.1), sasso(0.04, 14).translate(0.04, 0.02, -0.13)]), m: [ROCCIA(a.colonna)] }
    case 'abeti': {
      const strato = (r, y, h) => new ConeGeometry(r, h, 8, 1).translate(0, y + h / 2, 0)
      return { g: gruppi([new CylinderGeometry(0.05, 0.07, 0.5, 6).translate(0, 0.25, 0)], [strato(0.42, 0.25, 0.6), strato(0.33, 0.62, 0.52), strato(0.23, 0.98, 0.46)],
        [strato(0.3, 0.6, 0.25).translate(0, 0.27, 0), strato(0.2, 0.98, 0.2).translate(0, 0.26, 0), strato(0.13, 1.3, 0.16).translate(0, 0.14, 0)]),
        m: [{ color: '#3a2a1e' }, { color: '#1c3a2c', roughness: 0.9 }, { color: '#eef4ff', roughness: 0.8 }] }
    }
    case 'cumuli': return { g: gruppi([ammacca(new SphereGeometry(0.42, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.2, 0.5, 0.9), 0.06, 3, 21)]), m: [{ color: '#f2f6ff', roughness: 0.85 }] }
    case 'ghiaccioli': return { g: gruppi([[-0.38, 0.32], [-0.2, 0.55], [-0.02, 0.24], [0.14, 0.46], [0.3, 0.3], [0.42, 0.18]].map(([x, h], k) => new ConeGeometry(0.035 + h * 0.06, h, 5).rotateX(Math.PI).translate(x, ALTO_MURO - 0.1 - h / 2, 0.06 + (k % 2) * 0.04))),
      m: [{ color: '#c8f0ff', roughness: 0.05, emissive: '#3aa0d0', emissiveIntensity: 0.6, flat: true }] }
    case 'cristalli': return { g: gruppi([[0, 0, 0.55, 0.09], [0.4, 0.3, 0.38, 0.07], [-0.5, -0.2, 0.34, 0.06], [0.2, -0.45, 0.28, 0.05]].map(([rz, rx, h, r]) => new CylinderGeometry(r * 0.6, r, h, 6).translate(0, h / 2, 0).rotateZ(rz).rotateX(rx))),
      m: [{ color: '#a8e8ff', roughness: 0.08, emissive: '#2a9ad8', emissiveIntensity: 1.4, flat: true }], luce: { colore: '#60c8ff', forza: 1.8, raggio: 3.5, y: 0.35, quanti: 4 } }
    case 'ninfee': return { g: gruppi([0, 1, 2].map(k => new CircleGeometry(0.16 - k * 0.03, 10, 0.4, Math.PI * 2 - 0.5).rotateX(-Math.PI / 2).translate(k * 0.22 - 0.2, 0.05, (k % 2) * 0.2 - 0.1)),
      [new SphereGeometry(0.035, 6, 4).translate(-0.2, 0.08, -0.1)]), m: [{ color: '#3a7a2a', roughness: 0.4, side: DoubleSide }, { color: '#f0d0e8', emissive: '#804060', emissiveIntensity: 0.4 }] }
    case 'canne': {
      const steli = [], teste = [], rn = caso(5)
      for (let k = 0; k < 9; k++) { const h = 0.55 + rn() * 0.6, x = (rn() - 0.5) * 0.5, z = (rn() - 0.5) * 0.4, inc = (rn() - 0.5) * 0.3; steli.push(new BoxGeometry(0.018, h, 0.018).translate(0, h / 2, 0).rotateZ(inc).translate(x, 0, z)); if (k % 2) teste.push(new CylinderGeometry(0.03, 0.03, 0.14, 4).translate(0, h - 0.04, 0).rotateZ(inc).translate(x, 0, z)) }
      for (let k = 0; k < 7; k++) steli.push(new PlaneGeometry(0.07, 0.6).translate(0, 0.25, 0).rotateY(k * 0.8).rotateZ((k - 1.5) * 0.4).translate((rn() - 0.5) * 0.3, 0, (rn() - 0.5) * 0.3))
      return { g: gruppi(steli, teste), m: [{ color: '#5a7a2a', roughness: 0.8, side: DoubleSide }, { color: '#5a3a1e', roughness: 0.9 }] }
    }
    case 'radici': return { g: gruppi([tubo([[-0.3, ALTO_MURO, 0.02], [-0.25, 0.8, 0.08], [-0.34, 0.4, 0.06], [-0.2, 0.05, 0.2], [-0.1, 0.0, 0.45]], 0.045, 1), tubo([[0.15, ALTO_MURO, 0.02], [0.22, 0.9, 0.06], [0.1, 0.5, 0.05], [0.25, 0.1, 0.15]], 0.035, 2),
      tubo([[0.4, ALTO_MURO - 0.1, 0.02], [0.35, 0.7, 0.05], [0.44, 0.3, 0.07]], 0.025, 3), tubo([[-0.05, ALTO_MURO, 0.02], [0.0, 1.0, 0.05], [-0.08, 0.75, 0.04]], 0.02, 4)]), m: [{ color: '#4a3220', roughness: 0.95 }] }
    case 'archi': return { g: gruppi([new BoxGeometry(0.16, 1.1, 0.2).translate(-0.42, 0.55, 0.1), new BoxGeometry(0.16, 1.1, 0.2).translate(0.42, 0.55, 0.1), new TorusGeometry(0.42, 0.08, 6, 12, Math.PI).scale(1, 0.8, 1.2).translate(0, 0.78, 0.1),
      new BoxGeometry(0.24, 0.1, 0.26).translate(-0.42, 0.05, 0.12), new BoxGeometry(0.24, 0.1, 0.26).translate(0.42, 0.05, 0.12)], [new BoxGeometry(0.7, 0.78, 0.02).translate(0, 0.39, 0.01), new CylinderGeometry(0.34, 0.34, 0.02, 12, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2).translate(0, 0.78, 0.01)]),
      m: [{ trama: 'muro', color: '#c8e0d8' }, { color: '#02080a', roughness: 1 }] }
    case 'alghe': {
      const nastri = [], rn = caso(9)
      for (let k = 0; k < 6; k++) { const h = 0.3 + rn() * 0.45, g = new PlaneGeometry(0.06, h, 1, 5).translate(0, h / 2, 0), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) + Math.sin(y * 7 + k) * 0.06 * y) } g.computeVertexNormals(); nastri.push(g.rotateY(rn() * 3).translate((rn() - 0.5) * 0.4, 0, (rn() - 0.5) * 0.4)) }
      return { g: gruppi(nastri), m: [{ color: '#2a8a5a', roughness: 0.6, side: DoubleSide, emissive: '#0a3a24', emissiveIntensity: 0.5 }] }
    }
    case 'rocchi': return { g: gruppi([new CylinderGeometry(0.26, 0.26, 0.5, 16).rotateZ(Math.PI / 2).translate(0, 0.26, 0), new CylinderGeometry(0.26, 0.27, 0.28, 16).translate(0.45, 0.14, 0.15)]), m: [{ trama: 'muro', color: a.colonna }] }
    case 'travi': return { g: gruppi([new BoxGeometry(0.16, ALTO_MURO + 0.1, 0.16).translate(-0.44, (ALTO_MURO + 0.1) / 2, 0.12), new BoxGeometry(0.16, ALTO_MURO + 0.1, 0.16).translate(0.44, (ALTO_MURO + 0.1) / 2, 0.12),
      new BoxGeometry(1.2, 0.18, 0.2).translate(0, ALTO_MURO + 0.05, 0.13), new BoxGeometry(0.1, 0.4, 0.08).rotateZ(0.8).translate(-0.3, ALTO_MURO - 0.15, 0.14), new BoxGeometry(0.1, 0.4, 0.08).rotateZ(-0.8).translate(0.3, ALTO_MURO - 0.15, 0.14)],
      [new BoxGeometry(0.12, 0.16, 0.12).translate(0, ALTO_MURO - 0.2, 0.3), new CylinderGeometry(0.005, 0.005, 0.16, 3).translate(0, ALTO_MURO - 0.04, 0.3)]),
      m: [{ trama: 'legno', color: '#b08a60' }, { color: '#ffd060', emissive: '#ffb030', emissiveIntensity: 3 }], luce: { colore: '#ffc050', forza: 3.5, raggio: 5, y: ALTO_MURO - 0.2, quanti: 10, avanti: 0.35 } }
    case 'binari': return { g: gruppi([-0.22, 0.22].map(z => new BoxGeometry(1.0, 0.05, 0.05).translate(0, 0.04, z)), [-0.33, 0, 0.33].map(x => new BoxGeometry(0.12, 0.03, 0.66).translate(x, 0.015, 0))),
      m: [{ color: '#5a5a60', roughness: 0.35, metalness: 0.8 }, { trama: 'legno', color: '#7a5a3a' }] }
    case 'carrelli': return { g: gruppi([new BoxGeometry(0.8, 0.36, 0.56).translate(0, 0.38, 0), new BoxGeometry(0.9, 0.05, 0.62).translate(0, 0.58, 0)],
      [...[-0.28, 0.28].flatMap(x => [-0.3, 0.3].map(z => new CylinderGeometry(0.12, 0.12, 0.05, 10).rotateX(Math.PI / 2).translate(x, 0.12, z))), sasso(0.18, 31).translate(0.05, 0.6, 0), sasso(0.14, 32).translate(-0.18, 0.58, 0.08)]),
      m: [{ trama: 'legno', color: '#8a6a4a' }, { color: '#3a3836', roughness: 0.5, metalness: 0.7 }] }
  }
  return null
}

// tutto l'arredo di un piano: un InstancedMesh per tipo, e le luci che fa (per la riserva fissa)
export function creaArredo3d(scena, { pianta, liv, aspetto, seme, trame, legno, conMaschera, maschera, sposta }) {
  const posti = postiDellArredo(pianta, liv, aspetto.arredo, seme)
  const mesh = [], geometrie = [], materiali = [], luci = []
  const m = new Matrix4(), q = new Quaternion(), e = new Euler(), p = new Vector3(), s = new Vector3()
  for (const [tipo, lista] of Object.entries(posti)) {
    if (!lista.length) continue
    const f = forma(tipo, aspetto)
    if (!f) continue
    const mats = f.m.map((o, i) => conMaschera(new MeshStandardMaterial({
      color: o.color || '#888', roughness: o.roughness ?? 0.85, metalness: o.metalness || 0, flatShading: !!o.flat, side: o.side || 0,
      ...(o.trama === 'muro' ? { map: trame.muro.map, normalMap: trame.muro.normalMap } : o.trama === 'legno' ? { map: legno.map, normalMap: legno.normalMap } : {}),
      ...(o.emissive ? { emissive: o.emissive, emissiveIntensity: o.emissiveIntensity || 1 } : {}),
    }), maschera, { chiave: 'arredo-' + tipo + i, buco: POSE_ARREDO[tipo].dove === 'faccia' }))
    const im = new InstancedMesh(f.g, mats.length > 1 ? mats : mats[0], lista.length)
    lista.forEach((o, i) => {
      let x = o.x, z = o.z
      // sulla parete: dove sta davvero la faccia (le pareti di roccia rientrano e sporgono)
      if (o.muro && sposta) { const d = sposta(o.x, 0.6, o.z); x = d[0]; z = Math.max(o.z - 0.25, d[2]) }
      im.setMatrixAt(i, m.compose(p.set(x, 0, z), q.setFromEuler(e.set(0, o.giro, 0)), s.setScalar(o.scala)))
      if (f.luce && ((i * 7 + 3) % 10) < f.luce.quanti) {
        luci.push({ pos: new Vector3(x, f.luce.y, z + (f.luce.avanti || 0.1)), colore: new Color(f.luce.colore), forza: f.luce.forza, raggio: f.luce.raggio,
                    vis: 0, seme: i * 13.7, trema: !!f.luce.trema, cella: o.cella.y * pianta.W + o.cella.x })
      }
    })
    im.castShadow = POSE_ARREDO[tipo].dove === 'faccia' || !!POSE_ARREDO[tipo].nord || tipo === 'stalagmiti';   // le cose piccole no: l'ombra raddoppia i triangoli
    im.receiveShadow = true; im.computeBoundingSphere()
    scena.add(im)
    mesh.push(im); geometrie.push(f.g); materiali.push(...mats)
  }
  return { posti, luci, mesh, via() { for (const o of mesh) scena.remove(o); geometrie.forEach(g => g.dispose()); materiali.forEach(x => x.dispose()) } }
}
