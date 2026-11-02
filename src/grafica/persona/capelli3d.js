// I tagli di capelli e le barbe in 3D, in comune fra gli eroi del sotterraneo e il contadino della fattoria (docs/sotterraneo/personaggio.md).
// Gli id sono in `aspetto.js` (TAGLI, BARBE). Si monta su una testa tonda: `{ testa, R, cy }` (il perno della testa, il raggio e l'altezza del
// suo centro, come li tengono i due modelli), e le parti che ondeggiano si aggiungono a `sway` nella forma che i due modelli già usano
// (`{ o, ax, az, f, p, bx, bz }`). Low-poly a facce piatte, come il resto: solo sfere, coni e tubi, pochi pezzi per taglio.
//
// Contratto del modello: `userData.crini` e `userData.barbe` (liste degli oggetti di serie, che si nascondono se si sceglie un taglio o
// una barba), `userData.capelli` (il gruppo dei capelli che sta sotto un elmo: si nasconde con lui), `userData.coloreCapelli` (il colore
// di serie, numero). Cosa sta in `capelli` si nasconde sotto un elmo, le code e le trecce restano fuori.
import * as THREE from 'three'
import { sfuma } from './aspetto.js'

const mats = new Map()
const M = c => { if (!mats.has(c)) mats.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0, flatShading: true })); return mats.get(c) }
const geos = new Map()
const G = (k, f) => { if (!geos.has(k)) geos.set(k, f()); return geos.get(k) }
const pezzo = (padre, g, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = o.receiveShadow = true; padre.add(o); return o }
const sfera = (p, r, m, x, y, z, sx = 1, sy = 1, sz = 1, seg = 8) => pezzo(p, G(`s${r},${seg}`, () => new THREE.SphereGeometry(r, seg, Math.max(5, seg * 0.7 | 0))), m, x, y, z, sx, sy, sz)
const cono = (p, r, h, m, x, y, z, seg = 6) => pezzo(p, G(`n${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg)), m, x, y, z)
const cil = (p, rs, ri, h, m, x, y, z, seg = 9) => pezzo(p, G(`c${rs},${ri},${h},${seg}`, () => new THREE.CylinderGeometry(rs, ri, h, seg)), m, x, y, z)
const perno = (p, x, y, z) => { const o = new THREE.Group(); o.position.set(x, y, z); p.add(o); return o }
const oscilla = (u, o, ax, az, f, p = 0) => { if (u.sway) u.sway.push({ o, ax, az, f, p, bx: o.rotation.x, bz: o.rotation.z }); return o }

// la calotta dei capelli sopra la testa (sta in `alto`, sotto l'elmo sparisce)
function calotta(alto, R, cy, m, grande = 1.05, dietro = 0.1) { return sfera(alto, R * grande, m, 0, cy + R * 0.12, -R * dietro, 1.06, 0.98, 1.0, 12) }

const TAGLI3D = {
  corti({ alto, R, cy, c }) {
    calotta(alto, R, cy, M(c))
    for (const s of [-1, 1]) cono(alto, R * 0.2, R * 0.55, M(c), s * R * 0.35, cy + R * 0.98, R * 0.5, 5).rotation.x = 1.2   // il ciuffo sulla fronte
  },
  lunghi({ u, testa, alto, R, cy, c }) {
    calotta(alto, R, cy, M(c))
    const m = M(c), ms = M(sfuma(c, 0.84)), cadono = oscilla(u, perno(testa, 0, cy + R * 0.1, -R * 0.78), 0.08, 0.05, 1.4, 2)
    cil(cadono, R * 0.85, R * 0.75, 0.24, m, 0, -0.1, -0.04, 10); cil(cadono, R * 0.75, R * 0.55, 0.3, ms, 0, -0.38, -0.05, 9); cono(cadono, R * 0.55, 0.22, m, 0, -0.64, -0.05, 8).rotation.x = Math.PI
    for (const s of [-1, 1]) cono(alto, R * 0.18, R * 1.1, m, s * R * 0.92, cy - R * 0.1, R * 0.35, 5).rotation.x = Math.PI   // le ciocche ai lati del viso
  },
  coda({ u, testa, alto, R, cy, c }) {
    calotta(alto, R, cy, M(c))
    const m = M(c), ms = M(sfuma(c, 0.84)), coda = oscilla(u, perno(testa, 0, cy + R * 0.3, -R * 0.95), 0.14, 0.06, 1.7)
    cil(coda, R * 0.28, R * 0.2, 0.18, m, 0, -0.07, -0.03, 8); cil(coda, R * 0.22, R * 0.14, 0.2, ms, 0, -0.25, -0.04, 8); cono(coda, R * 0.14, 0.18, m, 0, -0.44, -0.04, 6).rotation.x = Math.PI
    cil(coda, R * 0.2, R * 0.2, 0.03, M(0xd9b25a), 0, 0.01, -0.02, 8)
  },
  trecce({ u, testa, alto, R, cy, c }) {
    calotta(alto, R, cy, M(c))
    for (const s of [-1, 1]) {
      const t = oscilla(u, perno(testa, s * R * 0.86, cy - R * 0.15, R * 0.15), 0.1, 0.08, 1.9, s)
      for (let i = 0; i < 4; i++) sfera(t, 0.055 - i * 0.006, M(i % 2 ? sfuma(c, 1.15) : c), s * 0.004, -i * 0.08, 0.004 * i, 1, 1.1, 1, 7)
      sfera(t, 0.03, M(0xe86f9a), 0, -0.34, 0, 1, 1, 1, 6)
    }
  },
  caschetto({ alto, R, cy, c }) {
    calotta(alto, R, cy, M(c), 1.1, 0.12)
    const m = M(c)
    cil(alto, R * 1.12, R * 1.18, R * 0.85, m, 0, cy - R * 0.28, -R * 0.1, 14).scale.z = 0.95
    for (const s of [-1, 1]) sfera(alto, R * 0.3, m, s * R * 0.9, cy - R * 0.55, R * 0.3, 0.8, 1.3, 1.0)
  },
  ricci({ alto, R, cy, c }) {
    const m = M(c), ms = M(sfuma(c, 0.85))
    calotta(alto, R, cy, ms, 1.0)
    for (let i = 0; i < 14; i++) {
      const a = i * 2.399, k = Math.sqrt((i + 0.5) / 14), x = Math.cos(a) * k * R * 1.0, z = Math.sin(a) * k * R * 1.0 - R * 0.1
      sfera(alto, R * 0.26, i % 2 ? m : ms, x, cy + R * (0.35 + 0.65 * (1 - k * k)) , z, 1, 1, 1, 6)
    }
    for (const s of [-1, 1]) for (const y of [0, -0.4]) sfera(alto, R * 0.24, m, s * R * 0.98, cy + R * y, -R * 0.05, 1, 1, 1, 6)
  },
  calvo() {},
}

const BARBE3D = {
  nessuna() {},
  corta({ testa, R, cy, c }) {
    const m = M(c), b = perno(testa, 0, cy - R * 0.45, R * 0.62)
    sfera(b, 0.14, m, 0, -0.03, 0.01, 1.2, 0.75, 0.6, 9)
    for (const s of [-1, 1]) sfera(b, 0.07, m, s * R * 0.78, 0.12, -0.12, 0.8, 1.7, 0.8)
  },
  folta({ u, testa, R, cy, c }) {
    const m = M(c), ms = M(sfuma(c, 0.86)), b = oscilla(u, perno(testa, 0, cy - R * 0.5, R * 0.6), 0.05, 0.03, 1.2)
    sfera(b, 0.2, m, 0, -0.04, 0.02, 1.15, 0.9, 0.62, 10); sfera(b, 0.16, ms, 0, -0.17, 0.05, 1.05, 1.1, 0.6)
    for (const s of [-1, 1]) sfera(b, 0.09, ms, s * 0.15, -0.08, -0.02, 0.8, 1.6, 0.7)
  },
  lunga({ u, testa, R, cy, c }) {
    const m = M(c), ms = M(sfuma(c, 0.86)), b = oscilla(u, perno(testa, 0, cy - R * 0.5, R * 0.62), 0.05, 0.03, 1.2)
    sfera(b, 0.17, m, 0, -0.02, 0.01, 1.05, 0.9, 0.62, 10); sfera(b, 0.14, m, 0, -0.18, 0.045, 1.0, 1.5, 0.55)
    cono(b, 0.13, 0.46, ms, 0, -0.38, 0.05, 6).rotation.x = Math.PI
    for (const s of [-1, 1]) sfera(b, 0.1, ms, s * 0.11, -0.14, 0.03, 0.8, 1.6, 0.6)
  },
  baffi({ testa, R, cy, c }) {
    const m = M(c), b = perno(testa, 0, cy - R * 0.32, R * 0.98)
    for (const s of [-1, 1]) {
      sfera(b, 0.055, m, s * 0.06, 0, 0.0, 1.3, 0.7, 0.8, 7); sfera(b, 0.04, m, s * 0.13, -0.02, -0.01, 1.2, 0.8, 0.8, 6); sfera(b, 0.03, m, s * 0.19, 0.02, -0.02, 1, 1, 1, 6)
    }
  },
  pizzetto({ testa, R, cy, c }) {
    const m = M(c), b = perno(testa, 0, cy - R * 0.62, R * 0.8)
    cono(b, 0.07, 0.2, m, 0, -0.08, 0.04, 6).rotation.x = Math.PI
    sfera(b, 0.045, m, 0, 0.05, 0.03, 1.4, 0.7, 0.8, 7)
  },
}

/**
 * Applica a un modello (`g`, col contratto qui sopra) il taglio e la barba scelti: `{ taglio, barba, colore }`. Un campo assente o `null`
 * lascia quello di serie; `colore` è un numero 0xRRGGBB (se manca, quello di serie del modello). Si chiama una volta, appena costruito il modello.
 */
export function applicaAspetto(g, { taglio = null, barba = null, colore = null } = {}) {
  const u = g.userData
  if (!u || !u.testa) return
  const c = colore != null ? colore : (u.coloreCapelli != null ? u.coloreCapelli : 0x5a3a1e)
  const base = { u, testa: u.testa, R: u.R, cy: u.cy, c }
  if (taglio && TAGLI3D[taglio]) {
    for (const o of u.crini || []) o.visible = false
    const alto = u.capelli || perno(u.testa, 0, 0, 0)
    if (!u.capelli) u.capelli = alto
    for (const o of [...alto.children]) o.visible = false
    TAGLI3D[taglio]({ ...base, alto })
  }
  if (barba && BARBE3D[barba]) {
    for (const o of u.barbe || []) o.visible = false
    if (u.barba) u.barba = null   // l'animazione della barba di serie (il gesto del nano) non ha più niente da muovere
    BARBE3D[barba](base)
  }
}
