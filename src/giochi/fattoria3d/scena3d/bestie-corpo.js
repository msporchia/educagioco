// I pezzi che tengono insieme il corpo di una bestia: un «osso» è un tronco di cono che va da un punto a un altro (collo, zampa, criniera), così
// non può staccarsi da ciò che collega; `collega` lo rimette fra due punti a ogni fotogramma (il collo che si alza, la testa che scende).
// Regola: le parti di una bestia si toccano (docs/fattoria3d/animali.md, «Le parti si toccano»; la controlla unita/fattoria3d-bestie-connesse).
import * as THREE from 'three'
import { parte } from './modelli.js'

const GEO = new Map()
const unica = (k, f) => { if (!GEO.has(k)) GEO.set(k, f()); return GEO.get(k) }
const _d = new THREE.Vector3(), _su = new THREE.Vector3(0, 1, 0)

/** Tronco di cono alto 1 con la base in (0,0,0) e la cima in (0,1,0): `rBase` in basso, `rCima` in alto (si allunga con `scale.y`). */
export const geoOsso = (rBase, rCima, lati = 7) => unica(`osso${rBase},${rCima},${lati}`, () => new THREE.CylinderGeometry(rCima, rBase, 1, lati).translate(0, 0.5, 0))
/** Sfera di raggio 1 (si ingrandisce con `scale`): la testa, il muso, la coscia, il batuffolo. */
export const geoSfera = (lati = 8) => unica(`sfera${lati}`, () => new THREE.SphereGeometry(1, lati, Math.max(5, lati - 3)))
/** Cono con la base in (0,0,0) e la punta in (0,h,0): corno, orecchio appuntito, coda. */
export const geoPunta = (r, h, lati = 5) => unica(`punta${r},${h},${lati}`, () => new THREE.ConeGeometry(r, h, lati).translate(0, h / 2, 0))

/** Mette `m` (fatta con `geoOsso`) fra i punti (ax,ay,az) e (bx,by,bz): base sul primo, cima sul secondo. */
export function collega (m, ax, ay, az, bx, by, bz) {
  _d.set(bx - ax, by - ay, bz - az)
  const L = _d.length() || 1e-6
  m.position.set(ax, ay, az); m.scale.set(1, L, 1)
  m.quaternion.setFromUnitVectors(_su, _d.multiplyScalar(1 / L))
  return m
}
/** Un osso nuovo, già collegato. */
export function osso (g, geo, m, ax, ay, az, bx, by, bz) { return collega(parte(g, geo, m, ax, ay, az), ax, ay, az, bx, by, bz) }
/** Un ellissoide: centro (x,y,z), raggi (rx,ry,rz). */
export function ellisse (g, m, x, y, z, rx, ry, rz, lati = 8) { const o = parte(g, geoSfera(lati), m, x, y, z); o.scale.set(rx, ry, rz); return o }

/** Una zampa: dalla coscia (rotonda, dentro il corpo, a quota `yAlto`) fino a terra, con lo zoccolo. Tutto fermo: si fonde. */
export function zampa (g, mPelo, mZoccolo, x, z, yAlto, rAlto, rBasso, hZoccolo = 0.035) {
  osso(g, geoOsso(rBasso, rAlto, 6), mPelo, x, hZoccolo * 0.6, z, x, yAlto, z)
  ellisse(g, mPelo, x, yAlto - rAlto * 0.2, z, rAlto * 1.25, rAlto * 1.35, rAlto * 1.4, 6)
  parte(g, unica(`zoc${rBasso},${hZoccolo}`, () => new THREE.CylinderGeometry(rBasso * 1.15, rBasso * 1.3, hZoccolo, 6)), mZoccolo, x, hZoccolo / 2, z)
}
