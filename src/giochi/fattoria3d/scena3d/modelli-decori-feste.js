// Le feste e la fiera delle decorazioni (W15): l'albero di Natale (si compra solo da novembre al 6 gennaio) e le otto decorazioni della fiera, che non si comprano ma
// arrivano dalla sorpresa della mongolfiera: bandierine, giostrina (che gira), zucchero filato, lanterne, tiro al barattolo, girasole di legno, spaventapasseri in festa, palco.
// Ognuna è una mesh fusa (la giostrina ne ha due: la base e la parte che gira). Tutto tocca ciò che lo regge. Vedi docs/fattoria3d/decorazioni.md.
import * as THREE from 'three'
import { decoro, mat, pronto, scatola, cilindro, cono, palla, filo, listello, festoneFra, arco, luce } from './modelli-decori-base.js'
import { tetto } from './modelli.js'
import { fondiPerMateriale } from './fondi.js'
import { creaAlberoNatale } from './modelli-natale.js'

const LEGNO = 0x9a6a36, LEGNO_SCURO = 0x6e4a2c, LEGNO_CHIARO = 0xd9b27a, ROSSO = 0xd8352a, GIALLO = 0xf0c52a, BIANCO = 0xf4efe4, ROSA = 0xf29ab6, AZZURRO = 0x3f78c8, VERDE = 0x5aa84c
const VARI = [ROSSO, GIALLO, AZZURRO, ROSA, VERDE]

export const FESTE_DECORI = {
  albero_natale: () => creaAlberoNatale.albero_natale(),      // il disegno è in modelli-natale.js, con gli altri alberi e le feste di Natale

  fiera_bandierine: decoro('fiera_bandierine', g => {
    for (const s of [-1, 1]) { cilindro(g, 0.045, 0.06, 1.7, mat(LEGNO_CHIARO), s * 1.4, 0.85, 0, 6); palla(g, 0.07, GIALLO, s * 1.4, 1.74, 0, 1, 1, 1, 0); cilindro(g, 0.12, 0.14, 0.06, mat(0x8f8a7e), s * 1.4, 0.03, 0, 8) }
    const p = festoneFra(g, [-1.4, 1.62, 0], [1.4, 1.62, 0], 0.4, 16, 0.012, 0xe9dfc8)
    p.forEach(([x, y, z], i) => { if (i > 0 && i < 16) { const f = cono(g, 0.12, 0.26, mat(VARI[i % 5]), x, y - 0.12, z, 3); f.rotation.set(0, 0, Math.PI); f.scale.z = 0.15 } })
    return { altezza: 1.9 }
  }),

  fiera_giostra: decoro('fiera_giostra', g => {
    cilindro(g, 0.98, 1.0, 0.14, mat(0xb8243a), 0, 0.07, 0, 16); cilindro(g, 0.92, 0.92, 0.02, mat(BIANCO), 0, 0.15, 0, 16)
    cilindro(g, 0.1, 0.12, 1.85, mat(0xf0c52a), 0, 0.98, 0, 6)
    const giro = new THREE.Group(); giro.position.set(0, 0.16, 0); g.add(giro)
    cilindro(giro, 0.86, 0.86, 0.06, mat(0xf4efe4), 0, 0.03, 0, 16)
    const cavalli = [[0xf4efe4, 0.5], [0xb07a42, 0.7], [ROSA, 0.5], [0x8a8f99, 0.7], [0xf4efe4, 0.5], [0xb07a42, 0.7]]
    cavalli.forEach(([c, y], i) => {
      const a = (i / 6) * Math.PI * 2, x = Math.cos(a) * 0.62, z = Math.sin(a) * 0.62
      cilindro(giro, 0.016, 0.016, 1.3, mat(0xd9a82a), x, 0.71, z, 3)
      const h = new THREE.Group(); h.position.set(x, y, z); h.rotation.y = -(a + Math.PI / 2); h.scale.setScalar(1.35); giro.add(h)
      palla(h, 0.13, c, 0, 0, 0, 1.5, 0.9, 0.8, 0)
      scatola(h, 0.07, 0.2, 0.2, mat(c), 0.1, -0.15, 0); scatola(h, 0.07, 0.2, 0.2, mat(c), -0.1, -0.15, 0)
      cono(h, 0.07, 0.24, mat(c), 0.2, 0.15, 0, 4).rotation.z = -0.5
      palla(h, 0.075, c, 0.29, 0.26, 0, 1.4, 0.9, 0.8, 0); cono(h, 0.03, 0.1, mat(c), 0.27, 0.35, 0, 3)
      palla(h, 0.04, 0x4a321c, -0.2, -0.03, 0, 1, 2, 0.6, 0)
      scatola(h, 0.2, 0.03, 0.2, mat(ROSSO), 0, 0.12, 0)
    })
    cono(giro, 1.05, 0.5, mat(0xe86a8a), 0, 1.6, 0, 12)
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; palla(giro, 0.12, i % 2 ? BIANCO : ROSSO, Math.cos(a) * 1.0, 1.36, Math.sin(a) * 1.0, 1, 0.7, 1, 0) }
    palla(giro, 0.11, GIALLO, 0, 1.92, 0, 1, 1, 1, 0); cono(giro, 0.04, 0.14, mat(GIALLO), 0, 2.0, 0, 4)
    fondiPerMateriale(giro)
    g.userData.giro = giro
    g.userData.anima = function (t) { this.giro.rotation.y = t * 0.6 }
    return { altezza: 2.2, escludi: [giro] }
  }),

  fiera_zucchero_filato: decoro('fiera_zucchero_filato', g => {
    scatola(g, 0.8, 0.5, 0.56, mat(0xb8243a), 0, 0.5, 0)
    for (let i = 0; i < 4; i++) scatola(g, 0.1, 0.5, 0.58, mat(BIANCO), -0.3 + i * 0.2, 0.5, 0)
    scatola(g, 0.88, 0.05, 0.64, mat(LEGNO_CHIARO), 0, 0.77, 0)
    for (const s of [-1, 1]) { cilindro(g, 0.2, 0.2, 0.06, mat(0x4a321c), s * 0.4, 0.2, 0.36, 10).rotation.x = Math.PI / 2; filo(g, [s * 0.4, 0.2, 0.0], [s * 0.4, 0.5, 0.0], 0.02, LEGNO_SCURO) }
    filo(g, [-0.4, 0.5, 0.3], [-0.4, 0.2, 0.3], 0.02, LEGNO_SCURO); filo(g, [0.4, 0.5, 0.3], [0.4, 0.2, 0.3], 0.02, LEGNO_SCURO)
    cilindro(g, 0.3, 0.2, 0.14, mat(0xcfd4dc, { metalness: 0.4, roughness: 0.4 }), -0.1, 0.87, 0, 14)
    palla(g, 0.28, 0xf6a6c6, -0.1, 1.13, 0, 1, 0.9, 1, 1); palla(g, 0.16, 0xf7bcd4, 0.0, 1.3, 0.1, 1, 1, 1, 1); palla(g, 0.14, 0xf08ab0, -0.25, 1.22, -0.08, 1, 1, 1, 1)
    for (const [x, ang] of [[0.3, -0.25], [0.42, 0.1], [0.2, 0.3]]) {
      const st = cilindro(g, 0.012, 0.012, 0.5, mat(BIANCO), x, 1.0, 0.15, 4); st.rotation.z = ang
      palla(g, 0.1, [0xf6a6c6, 0xa6d6f6, 0xf7e08a][Math.round(x * 10) % 3], x - Math.sin(ang) * 0.27, 1.27, 0.15, 1, 1, 1, 1)
    }
    for (const s of [-1, 1]) scatola(g, 0.05, 1.05, 0.05, mat(LEGNO_SCURO), s * 0.4, 1.3, -0.25)
    tetto(g, 1.0, 0.78, 1.82, 0xf08ab0, 0.3)
    return { altezza: 1.9 }
  }),

  fiera_lanterne: decoro('fiera_lanterne', g => {
    cilindro(g, 0.1, 0.13, 0.06, mat(0x8f8a7e), -0.3, 0.03, 0, 8); cilindro(g, 0.04, 0.055, 1.9, mat(LEGNO_SCURO), -0.3, 0.98, 0, 6)
    scatola(g, 0.85, 0.05, 0.05, mat(LEGNO_SCURO), 0.1, 1.9, 0); filo(g, [-0.3, 1.5, 0], [0.0, 1.88, 0], 0.02, LEGNO_SCURO)
    ;[[-0.02, 0.3, ROSSO], [0.2, 0.55, GIALLO], [0.42, 0.35, 0xff8a2a]].forEach(([x, l, c], i) => {
      filo(g, [x, 1.9, 0], [x, 1.9 - l, 0], 0.01, 0xe9dfc8, 3)
      const y = 1.9 - l - 0.15
      cilindro(g, 0.05, 0.05, 0.04, mat(0x33343c), x, y + 0.17, 0, 6)
      palla(g, 0.14, c, x, y, 0, 1, 1.25, 1, 1).material = luce(c)
      for (const dy of [-0.07, 0, 0.07]) { const o = pronto(new THREE.Mesh(new THREE.TorusGeometry(0.14 * Math.sqrt(1 - (dy / 0.17) ** 2), 0.007, 3, 10), mat(0x8a2a18))); o.rotation.x = Math.PI / 2; o.position.set(x, y + dy, 0); g.add(o) }
      cilindro(g, 0.05, 0.05, 0.04, mat(0x33343c), x, y - 0.17, 0, 6); cono(g, 0.02, 0.18, mat(c), x, y - 0.28, 0, 4).rotation.x = Math.PI
    })
    return { altezza: 2.0 }
  }),

  fiera_barattoli: decoro('fiera_barattoli', g => {
    for (const s of [-1, 1]) scatola(g, 0.08, 1.7, 0.08, mat(LEGNO_SCURO), s * 0.85, 0.85, -0.25)
    scatola(g, 1.7, 1.0, 0.04, mat(0x3f78c8), 0, 0.95, -0.3)
    for (let i = 0; i < 5; i++) scatola(g, 0.3, 0.8, 0.02, mat(BIANCO), -0.68 + i * 0.34, 1.0, -0.275)
    for (const y of [0.55, 0.95]) scatola(g, 1.7, 0.05, 0.3, mat(LEGNO), 0, y, -0.12)
    const colori = [ROSSO, GIALLO, 0x3f9a5a, ROSA, 0xff8a2a]
    for (const [y0, n, x0] of [[0.575, 4, -0.9], [0.975, 3, -0.5]]) {
      for (let r = 0; r < 3; r++) for (let i = 0; i < n - r; i++) { const x = (r ? 0.5 * r * 0.17 : 0) + x0 * 0 + (-((n - 1) * 0.17) / 2) + i * 0.17 + r * 0.085; cilindro(g, 0.07, 0.07, 0.13, mat(colori[(i + r * 2 + Math.round(y0 * 4)) % 5]), x, y0 + 0.065 + r * 0.13, -0.12, 8) }
    }
    scatola(g, 1.7, 0.5, 0.36, mat(0xb98a4a), 0, 0.28, 0.35); scatola(g, 1.82, 0.06, 0.5, mat(LEGNO_CHIARO), 0, 0.56, 0.35)
    for (let i = 0; i < 4; i++) scatola(g, 0.06, 0.5, 0.38, mat(i % 2 ? ROSSO : BIANCO), -0.7 + i * 0.47, 0.28, 0.35)
    for (const x of [-0.3, 0, 0.3]) palla(g, 0.065, x ? 0xf4efe4 : ROSSO, x, 0.66, 0.4, 1, 1, 1, 1)
    listello(g, [0, 1.75, -0.3], [0, 1.45, 0.6], 2.1, 0.05, ROSSO, [1, 0, 0]); for (const s of [-1, 1]) filo(g, [s * 0.85, 1.7, -0.25], [s * 0.85, 1.5, 0.55], 0.03, LEGNO_SCURO)
    return { altezza: 1.9 }
  }),

  fiera_girasole: decoro('fiera_girasole', g => {
    cilindro(g, 0.15, 0.18, 0.06, mat(0x8f8a7e), 0, 0.03, 0, 8)
    scatola(g, 0.13, 1.45, 0.07, mat(LEGNO), 0, 0.75, 0)
    for (const [s, y] of [[-1, 0.5], [1, 0.8]]) { const f = scatola(g, 0.34, 0.14, 0.03, mat(0x3f9a4a), s * 0.2, y, 0.02); f.rotation.z = s * 0.45 }
    const t = new THREE.Group(); t.position.set(0, 1.5, 0.06); g.add(t)
    for (let i = 0; i < 14; i++) { const br = new THREE.Group(); br.rotation.z = (i / 14) * Math.PI * 2; t.add(br); scatola(br, 0.24, 0.14, 0.035, mat(i % 2 ? GIALLO : 0xf5b820), 0.5, 0, 0) }
    const d = cilindro(t, 0.4, 0.4, 0.07, mat(0x6a4a2a), 0, 0, 0.02, 14); d.rotation.x = Math.PI / 2
    for (const s of [-1, 1]) palla(t, 0.035, 0x2b2b30, s * 0.14, 0.1, 0.07, 1, 1, 0.6, 0)
    const sorriso = arco(t, 0.16, 0.022, 0x2b2b30, 0, 0.0, 0.065, Math.PI, 8); sorriso.rotation.z = Math.PI
    scatola(g, 0.2, 0.05, 0.04, mat(LEGNO), 0, 1.5, 0)
    return { altezza: 2.1 }
  }),

  fiera_spaventapasseri: decoro('fiera_spaventapasseri', g => {
    cilindro(g, 0.12, 0.15, 0.06, mat(0x8f8a7e), 0, 0.03, 0, 8)
    cilindro(g, 0.04, 0.05, 1.5, mat(LEGNO_SCURO), 0, 0.8, 0, 6)
    scatola(g, 1.2, 0.07, 0.07, mat(LEGNO_SCURO), 0, 1.15, 0)
    cilindro(g, 0.15, 0.25, 0.65, mat(AZZURRO), 0, 0.88, 0, 8)
    for (const [x, y] of [[0.08, 0.95], [-0.1, 0.78]]) scatola(g, 0.1, 0.1, 0.03, mat(ROSSO), x, y, 0.2)
    for (const s of [-1, 1]) { cilindro(g, 0.06, 0.07, 0.5, mat(0xd9c07a), s * 0.3, 1.15, 0, 6).rotation.z = Math.PI / 2; cono(g, 0.06, 0.18, mat(0xe8c85a), s * 0.62, 1.15, 0, 5).rotation.z = s * -Math.PI / 2 }
    for (let i = 0; i < 6; i++) cono(g, 0.03, 0.2, mat(0xe8c85a), -0.2 + i * 0.08, 0.5, 0.0 + (i % 2 ? 0.1 : -0.06), 4).rotation.x = Math.PI
    palla(g, 0.17, 0xdcc48e, 0, 1.4, 0, 1, 1.05, 1, 1)
    for (const s of [-1, 1]) palla(g, 0.03, 0x2b2b30, s * 0.07, 1.44, 0.15, 1, 1, 0.6, 0)
    palla(g, 0.035, ROSSO, 0, 1.38, 0.17, 1, 0.8, 0.6, 0)
    const m = arco(g, 0.06, 0.012, 0x4a321c, 0, 1.33, 0.155, Math.PI, 6); m.rotation.z = Math.PI
    cilindro(g, 0.32, 0.32, 0.03, mat(0xe0b860), 0, 1.53, 0, 14); cilindro(g, 0.17, 0.2, 0.1, mat(0xe0b860), 0, 1.6, 0, 12)
    cono(g, 0.11, 0.3, mat(ROSA), 0.02, 1.8, 0, 8).rotation.z = -0.15; palla(g, 0.04, GIALLO, 0.06, 1.96, 0, 1, 1, 1, 0)
    cilindro(g, 0.2, 0.2, 0.03, mat(ROSSO), 0, 1.66, 0, 12)
    const p = festoneFra(g, [-0.62, 1.15, 0], [0.62, 1.15, 0], 0.18, 8, 0.01, 0xe9dfc8)
    p.forEach(([x, y, z], i) => { if (i > 0 && i < 8) { const f = cono(g, 0.06, 0.14, mat(VARI[i % 5]), x, y - 0.07, z, 3); f.rotation.z = Math.PI; f.scale.z = 0.2 } })
    return { altezza: 2.1 }
  }),

  fiera_palco: decoro('fiera_palco', g => {
    scatola(g, 2.8, 0.3, 1.7, mat(0xb98a4a), 0, 0.15, -0.05)
    for (const x of [-1, -0.33, 0.33, 1]) scatola(g, 0.05, 0.3, 1.72, mat(LEGNO_SCURO), x * 1.4 * 0.95, 0.15, -0.05)
    scatola(g, 0.8, 0.14, 0.26, mat(LEGNO), 0, 0.07, 0.93); scatola(g, 0.8, 0.14, 0.26, mat(LEGNO_CHIARO), 0, 0.21, 0.82)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) scatola(g, 0.1, 1.75, 0.1, mat(LEGNO_SCURO), sx * 1.3, 1.175, sz * 0.75 - 0.05)
    scatola(g, 2.7, 1.3, 0.05, mat(0xf2dfc2), 0, 0.95, -0.76); for (const x of [-0.9, 0, 0.9]) scatola(g, 0.5, 1.3, 0.052, mat(ROSSO), x, 0.95, -0.76)
    scatola(g, 2.8, 0.08, 0.08, mat(LEGNO_SCURO), 0, 2.02, 0.7); scatola(g, 2.8, 0.08, 0.08, mat(LEGNO_SCURO), 0, 2.02, -0.8)
    tetto(g, 3.0, 1.9, 2.05, 0xd8352a, 0.3)
    const p = festoneFra(g, [-1.3, 2.0, 0.75], [1.3, 2.0, 0.75], 0.16, 12, 0.01, 0xe9dfc8)
    p.forEach(([x, y, z], i) => { if (i > 0 && i < 12) { const f = cono(g, 0.07, 0.16, mat(VARI[i % 5]), x, y - 0.08, z, 3); f.rotation.z = Math.PI; f.scale.z = 0.2 } })
    // la banda: un tamburo, una tuba, un leggio
    cilindro(g, 0.2, 0.2, 0.26, mat(ROSSO), -0.7, 0.43, 0.1, 14); cilindro(g, 0.205, 0.205, 0.03, mat(BIANCO), -0.7, 0.575, 0.1, 14)
    filo(g, [-0.62, 0.62, 0.1], [-0.48, 0.74, 0.1], 0.012, LEGNO_CHIARO); filo(g, [-0.78, 0.62, 0.1], [-0.88, 0.74, 0.1], 0.012, LEGNO_CHIARO)
    const tuba = pronto(new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 5, 14), mat(0xe0a82a, { metalness: 0.4, roughness: 0.4 }))); tuba.position.set(0.7, 0.51, 0.1); g.add(tuba)
    const campana = cono(g, 0.17, 0.3, mat(0xe0a82a, { metalness: 0.4, roughness: 0.4 }), 0.97, 0.51, 0.1, 10); campana.rotation.z = -Math.PI / 2
    cilindro(g, 0.02, 0.02, 0.9, mat(0x33343c), 0.1, 0.75, 0.2, 5)
    scatola(g, 0.4, 0.28, 0.03, mat(BIANCO), 0.1, 1.2, 0.2).rotation.x = -0.3
    cilindro(g, 0.1, 0.12, 0.04, mat(0x33343c), 0.1, 0.32, 0.2, 6)
    return { altezza: 2.5 }
  }),
}
