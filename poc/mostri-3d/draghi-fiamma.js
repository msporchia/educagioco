// La fiammata del drago: gocce allungate annidate (rosso → arancio → giallo → bianco al nucleo), additive, che ondeggiano
// ognuna a modo suo, scintille che schizzano in avanti e un bagliore nella gola. Autonoma: solo three.
// `creaFiamma(palette, lunghezza)` torna un Group con l'origine alla bocca, il fuoco verso +z, e
// `userData.aggiorna(p, t)`: p 0..1 è quanto soffia (0 = spenta e nascosta), t i secondi.
import * as THREE from 'three'

export const PALETTE_FIAMMA = {
  arancio: { esterno: 0xe02a08, medio: 0xff7a14, interno: 0xffc83a, nucleo: 0xffd24a, scintille: 0xffd060, gola: 0xff8a20 },
  ghiaccio: { esterno: 0x1f5fe8, medio: 0x4ab4ff, interno: 0xa8ecff, nucleo: 0xffffff, scintille: 0xd8f8ff, gola: 0x8ae6ff },
  viola: { esterno: 0x6a0fc8, medio: 0xb23af0, interno: 0xff6ee0, nucleo: 0xffb4ee, scintille: 0xf2a0ff, gola: 0xd060ff },
  oro: { esterno: 0xff9a14, medio: 0xffd040, interno: 0xfff0a0, nucleo: 0xffe890, scintille: 0xfff6c0, gola: 0xffe070 },
}

const LUNGHEZZA_BASE = 2.4

/** Una goccia: parte appuntita dalla bocca, si allarga e finisce a punta. Asse lungo +z, lunga L. */
function goccia (R, L, lati = 12, passi = 18) {
  const pts = []
  for (let i = 0; i <= passi; i++) {
    const s = i / passi
    pts.push(new THREE.Vector2(Math.max(0.0001, R * 2.6 * Math.pow(s, 0.5) * Math.pow(1 - s, 1.05)), s * L))
  }
  const g = new THREE.LatheGeometry(pts, lati)
  g.rotateX(Math.PI / 2)                                   // l'asse y diventa +z
  return g
}

const aditivo = (colore, opacita) => new THREE.MeshBasicMaterial({
  color: colore, transparent: true, opacity: opacita, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
})

export function creaFiamma (palette = PALETTE_FIAMMA.arancio, lunghezza = LUNGHEZZA_BASE) {
  const g = new THREE.Group()
  const radice = new THREE.Group(); radice.scale.setScalar(lunghezza / LUNGHEZZA_BASE); g.add(radice)
  const L = LUNGHEZZA_BASE
  const dati = [
    { col: palette.esterno, R: 0.3, l: 1.0, op: 0.38, vel: 15, fase: 0.0, amp: 0.1 },
    { col: palette.medio, R: 0.24, l: 0.9, op: 0.42, vel: 18, fase: 1.2, amp: 0.09 },
    { col: new THREE.Color(palette.medio).lerp(new THREE.Color(palette.interno), 0.5), R: 0.18, l: 0.8, op: 0.45, vel: 22, fase: 2.3, amp: 0.075 },
    { col: palette.interno, R: 0.125, l: 0.68, op: 0.42, vel: 26, fase: 3.1, amp: 0.06 },
    { col: palette.nucleo, R: 0.07, l: 0.5, op: 0.42, vel: 33, fase: 4.6, amp: 0.035 },
  ]
  const strati = dati.map((d, k) => {
    const geo = goccia(d.R, L * d.l), orig = geo.attributes.position.array.slice()
    const m = new THREE.Mesh(geo, aditivo(d.col, d.op)); m.renderOrder = 10 + k; m.frustumCulled = false
    radice.add(m)
    return { ...d, geo, orig, m }
  })
  // il bagliore nella gola: un nucleo e un alone che pulsano
  const gola = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), aditivo(palette.gola, 0.7)); gola.scale.set(1, 0.7, 1.5); gola.renderOrder = 14; radice.add(gola)
  const alone = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), aditivo(palette.gola, 0.12)); alone.scale.set(1, 0.8, 1.3); alone.renderOrder = 9; radice.add(alone)
  // le scintille: palline che schizzano in avanti, salgono un poco e svaniscono
  const sGeo = new THREE.SphereGeometry(1, 5, 4), sMat = [aditivo(palette.scintille, 1), aditivo(palette.nucleo, 1)]
  let seme = 7; const caso = () => { seme = (seme * 16807) % 2147483647; return seme / 2147483647 }
  const scintille = []
  for (let i = 0; i < 28; i++) {
    const s = new THREE.Mesh(sGeo, sMat[i % 3 === 0 ? 1 : 0]); s.renderOrder = 15; s.frustumCulled = false
    radice.add(s)
    scintille.push({ s, off: caso(), vel: 0.35 + caso() * 0.5, vx: (caso() - 0.5) * 1.0, vy: (caso() - 0.5) * 0.7, lung: 0.55 + caso() * 0.9, r: 0.012 + caso() * 0.018 })
  }

  g.userData.aggiorna = (p, t, lungh) => {
    g.visible = p > 0.02
    if (!g.visible) return
    const kz = (lungh ?? lunghezza) / L, kxy = Math.pow(kz, 0.65) * (0.55 + 0.45 * p)
    radice.scale.set(kxy, kxy, kz * p)
    for (const st of strati) {
      const a = st.geo.attributes.position.array, o = st.orig, n = a.length / 3
      for (let i = 0; i < n; i++) {
        const x = o[i * 3], y = o[i * 3 + 1], z = o[i * 3 + 2], s = z / (L * st.l)
        const gonfia = 1 + 0.13 * Math.sin(s * 13 - t * st.vel * 0.7 + st.fase) * s
        const sx = Math.sin(s * 9 - t * st.vel + st.fase) * st.amp * s * s * 1.6
        const sy = Math.cos(s * 7.5 - t * st.vel * 0.85 + st.fase * 1.3) * st.amp * s * s * 1.3 + 0.2 * s * s * st.l     // il calore sale
        a[i * 3] = x * gonfia + sx; a[i * 3 + 1] = y * gonfia + sy; a[i * 3 + 2] = z * (1 + 0.04 * Math.sin(t * st.vel * 0.9 + st.fase))
      }
      st.geo.attributes.position.needsUpdate = true
    }
    const pul = 1 + 0.18 * Math.sin(t * 31) + 0.1 * Math.sin(t * 17)
    gola.scale.set(pul, 0.7 * pul, 1.5); alone.scale.set(1.1 * pul, 0.9 * pul, 1.3)
    gola.position.z = 0.02; alone.position.z = 0.12
    for (const sc of scintille) {
      const u = (t * sc.vel + sc.off) % 1
      sc.s.position.set(sc.vx * u * 0.9, sc.vy * u * 0.7 + 0.35 * u * u, 0.15 + u * L * sc.lung)
      sc.s.scale.setScalar(sc.r * (1 - u) * (0.4 + p))
      sc.s.visible = u < 0.98
    }
  }
  g.userData.aggiorna(0, 0)
  g.visible = false
  return g
}

/** La fiammata piccola per il draghetto (e per chiunque soffi corto): stessa fiamma, più corta. `colore` è una chiave di PALETTE_FIAMMA. */
export function creaFiammaSoffio (colore = 'arancio', lunghezza = 1.2) { return creaFiamma(PALETTE_FIAMMA[colore], lunghezza) }
