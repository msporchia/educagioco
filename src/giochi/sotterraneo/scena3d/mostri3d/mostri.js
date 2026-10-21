// Generato da strumenti/promuovi-3d.mjs da poc/mostri-3d/mostri.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Prototipo: i mostri del sotterraneo come modelli 3D in codice (three.js), al posto degli sprite dipinti.
// Autonomo apposta (poc/): niente import dal gioco, solo three. Ogni `crea…()` torna un Group coi piedi a y = 0, il davanti
// verso +z, e `userData.anima(t)` che muove i perni (respiro, mascella, ali, coda…) con il tempo in secondi.
import * as THREE from 'three'

// ── mattoncini ────────────────────────────────────────────────────────────────────────────────────────────────────
const cache = new Map()
export function M (colore, o = {}) {
  const k = colore + JSON.stringify(o)
  if (!cache.has(k)) cache.set(k, new THREE.MeshStandardMaterial({ color: colore, roughness: 0.8, metalness: 0, flatShading: true, ...o }))
  return cache.get(k)
}
const pronto = m => { m.castShadow = true; m.receiveShadow = true; return m }
const mesh = (g, geo, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = pronto(new THREE.Mesh(geo, m)); o.position.set(x, y, z); o.scale.set(sx, sy, sz); g.add(o); return o }
const sfera = (g, r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, seg = 14) => mesh(g, new THREE.SphereGeometry(r, seg, Math.max(6, seg * 0.7 | 0)), m, x, y, z, sx, sy, sz)
const rozza = (g, r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, det = 1) => mesh(g, new THREE.IcosahedronGeometry(r, det), m, x, y, z, sx, sy, sz)
const scatola = (g, w, h, d, m, x = 0, y = 0, z = 0) => mesh(g, new THREE.BoxGeometry(w, h, d), m, x, y, z)
const cil = (g, rs, ri, h, m, x = 0, y = 0, z = 0, seg = 10) => mesh(g, new THREE.CylinderGeometry(rs, ri, h, seg), m, x, y, z)
const cono = (g, r, h, m, x = 0, y = 0, z = 0, seg = 6) => mesh(g, new THREE.ConeGeometry(r, h, seg), m, x, y, z)
const perno = (g, x, y, z) => { const p = new THREE.Group(); p.position.set(x, y, z); g.add(p); return p }

const SU = new THREE.Vector3(0, 1, 0)
/** Un cono che parte da `a` e punta verso `b` (artigli, corna, spine). */
function punta (g, a, b, r, m, seg = 5) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), h = d.length()
  const o = cono(g, r, h, m, 0, 0, 0, seg); o.position.copy(A).addScaledVector(d, 0.5)
  o.quaternion.setFromUnitVectors(SU, d.normalize()); return o
}
/** Un osso/tubo tra due punti, rotondo alle estremità (r1 vicino ad a, r2 vicino a b). */
function osso (g, a, b, r1, r2, m, seg = 8, sfere = true) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), h = d.length()
  const o = cil(g, r2, r1, h, m, 0, 0, 0, seg); o.position.copy(A).addScaledVector(d, 0.5)
  o.quaternion.setFromUnitVectors(SU, d.clone().normalize())
  if (sfere) { sfera(g, r1, m, A.x, A.y, A.z, 1, 1, 1, 8); sfera(g, r2, m, B.x, B.y, B.z, 1, 1, 1, 8) }
  return o
}
const liscio = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k) }
const onda = (t, f, f0 = 0) => Math.sin(t * f + f0)

// ══════════════════════════════════════ LO SCHELETRO ══════════════════════════════════════
const OSSO = 0xe9dcc0, OMBRA = 0xb8a784, BUIO = 0x1d1712, RUGGINE = 0x8e6b52, LEGNO = 0x6e4a2c, STRACCIO = 0x7a2f2a

/** Il teschio (serve anche dentro la melma). Origine al centro del cranio. */
export function creaTeschio (scala = 1) {
  const g = new THREE.Group()
  const osso1 = M(OSSO), buio = M(BUIO, { roughness: 1 }), brace = M(0xff7a1c, { emissive: 0xff5a10, emissiveIntensity: 2.2, flatShading: false })
  rozza(g, 0.16, osso1, 0, 0.02, 0, 1.0, 1.05, 1.08, 2)                              // il cranio
  sfera(g, 0.1, osso1, 0, -0.08, 0.07, 1.25, 0.8, 1.0, 12)                          // zigomi e mascella alta
  for (const s of [-1, 1]) {
    sfera(g, 0.052, buio, s * 0.066, 0.0, 0.135, 1, 1.18, 0.7, 10)                  // occhiaia
    sfera(g, 0.026, brace, s * 0.066, 0.0, 0.158, 1, 1, 0.6, 8)                     // la brace dentro
    scatola(g, 0.07, 0.014, 0.01, M(OMBRA), s * 0.07, 0.075, 0.15).rotation.z = s * -0.35  // arcata
  }
  const naso = cono(g, 0.026, 0.05, buio, 0, -0.045, 0.16, 3); naso.rotation.x = Math.PI; naso.rotation.y = Math.PI / 2
  for (let i = -3; i <= 3; i++) scatola(g, 0.021, 0.04, 0.02, M(0xf4ead2), i * 0.0235, -0.14, 0.135 - Math.abs(i) * 0.012)   // denti di sopra
  g.scale.setScalar(scala)
  return g
}

export function creaScheletro () {
  const g = new THREE.Group()
  const o1 = M(OSSO), o2 = M(OMBRA), buio = M(BUIO), rug = M(RUGGINE, { roughness: 0.55, metalness: 0.5 })
  const pivot = {}
  // bacino e colonna
  scatola(g, 0.3, 0.1, 0.17, o1, 0, 0.82, 0)
  for (const s of [-1, 1]) sfera(g, 0.1, o1, s * 0.15, 0.86, -0.01, 0.55, 1, 0.8, 10)
  const colonna = perno(g, 0, 0, 0)
  for (let i = 0; i < 9; i++) {
    const y = 0.9 + i * 0.055, z = -0.03 + Math.sin(i / 8 * Math.PI) * -0.01
    sfera(colonna, 0.036 - i * 0.0012, o2, 0, y, z, 1, 0.75, 1, 8)
  }
  // la cassa toracica: sei paia di costole ad arco sul davanti, più corte salendo
  const cassa = perno(g, 0, 0, 0); pivot.cassa = cassa
  for (let i = 0; i < 6; i++) {
    const arco = Math.PI * (1.55 - i * 0.04)
    const geo = new THREE.TorusGeometry(0.15 - Math.abs(i - 2.3) * 0.006, 0.014, 5, 16, arco)
    geo.rotateZ(Math.PI / 2 - arco / 2); geo.rotateX(Math.PI / 2)
    mesh(cassa, geo, o1, 0, 1.0 + i * 0.056, -0.02, 1.35, 1, 0.85)
  }
  scatola(cassa, 0.04, 0.3, 0.025, o1, 0, 1.17, 0.125)                                // lo sterno
  // le clavicole e le scapole
  for (const s of [-1, 1]) { scatola(cassa, 0.2, 0.03, 0.03, o1, s * 0.11, 1.34, 0.0).rotation.z = s * -0.12; scatola(cassa, 0.12, 0.14, 0.02, o2, s * 0.1, 1.2, -0.12) }
  // il collo e la testa
  for (let i = 0; i < 3; i++) sfera(g, 0.03 - i * 0.002, o2, 0, 1.4 + i * 0.045, 0.0 + i * 0.012, 1, 0.8, 1, 8)
  const testa = perno(g, 0, 1.64, 0.02); pivot.testa = testa
  testa.add(creaTeschio(1.1))
  const mascella = perno(testa, 0, -0.17, 0.0); pivot.mascella = mascella
  scatola(mascella, 0.17, 0.035, 0.15, o1, 0, -0.015, 0.075)
  for (let i = -2; i <= 2; i++) scatola(mascella, 0.02, 0.035, 0.018, M(0xf4ead2), i * 0.03, 0.012, 0.14 - Math.abs(i) * 0.012)
  for (const s of [-1, 1]) scatola(mascella, 0.02, 0.1, 0.03, o1, s * 0.095, 0.03, 0.0).rotation.z = s * 0.25   // ramo
  // le braccia
  for (const lato of [-1, 1]) {
    const sp = perno(g, lato * 0.205, 1.31, -0.005); pivot[lato < 0 ? 'bracciaS' : 'bracciaD'] = sp
    // l'omero: diafisi che si assottiglia, testa tonda in alto (nella spalla) e i due condili al gomito
    sfera(sp, 0.036, o1, 0, 0.0, 0, 1, 1, 1, 10); sfera(sp, 0.026, o2, lato * 0.02, 0.02, 0.0, 1, 1, 1, 8)
    cil(sp, 0.021, 0.0175, 0.27, o1, 0, -0.15, 0, 8)
    for (const c of [-1, 1]) sfera(sp, 0.024, o2, c * 0.014, -0.295, 0.0, 1, 1.1, 1, 8)
    const go = perno(sp, 0, -0.295, 0); pivot[lato < 0 ? 'gomitoS' : 'gomitoD'] = go
    // l'avambraccio: radio e ulna affiancati, con il polso a blocchetto
    for (const c of [-1, 1]) { cil(go, 0.0125, 0.01, 0.26, o1, c * 0.0125, -0.14, c * 0.004, 6); sfera(go, 0.015, o2, c * 0.0125, -0.0, 0.0, 1, 1, 1, 6) }
    scatola(go, 0.05, 0.022, 0.03, o2, 0, -0.275, 0)
    const mano = perno(go, 0, -0.285, 0.0)
    pivot[lato < 0 ? 'presaS' : 'presaD'] = perno(go, 0, -0.30, 0.0)                       // dove si impugna un'arma diversa (userData.impugna), senza la scala della mano
    mano.scale.setScalar(1.55)
    // la mano d'ossa: palmo, quattro dita a tre falangi che si chiudono sull'impugnatura, e il pollice
    scatola(mano, 0.085, 0.07, 0.03, o1, 0, -0.03, 0)
    for (let m = 0; m < 4; m++) sfera(mano, 0.011, o2, -0.03 + m * 0.02, -0.065, 0.0, 1, 1, 1, 6)           // le nocche
    for (let d = 0; d < 4; d++) {
      const x = -0.03 + d * 0.02, f = perno(mano, x, -0.065, 0.0)
      osso(f, [0, 0, 0], [0, -0.032, 0.012], 0.0105, 0.009, o1, 5, false)
      const f2 = perno(f, 0, -0.032, 0.012); f2.rotation.x = -0.9
      osso(f2, [0, 0, 0], [0, -0.026, 0.006], 0.009, 0.0075, o1, 5, false)
      const f3 = perno(f2, 0, -0.026, 0.006); f3.rotation.x = -0.9
      osso(f3, [0, 0, 0], [0, -0.02, 0.0], 0.0075, 0.006, o2, 5, false)
    }
    const pol = perno(mano, lato * -0.045, -0.02, 0.012); pol.rotation.set(0.3, 0, lato * 0.6)
    osso(pol, [0, 0, 0], [0, -0.035, 0.01], 0.013, 0.01, o1, 5, false); osso(pol, [0, -0.035, 0.01], [0, -0.06, 0.0], 0.01, 0.008, o2, 5, false)
    if (lato > 0) {                                                                                          // la spada arrugginita
      const sp2 = perno(mano, 0, -0.02, 0.0); sp2.rotation.x = 1.5; sp2.rotation.z = -0.28; pivot.spada = sp2
      scatola(sp2, 0.035, 0.2, 0.04, M(LEGNO), 0, 0.0, 0)
      scatola(sp2, 0.22, 0.03, 0.05, rug, 0, 0.11, 0)
      const lama = scatola(sp2, 0.055, 0.62, 0.014, rug, 0, 0.45, 0); lama.scale.set(1, 1, 1)
      punta(sp2, [0, 0.76, 0], [0, 0.88, 0], 0.028, rug, 4).scale.z = 0.25
      for (const [y, w] of [[0.32, 0.02], [0.52, 0.015], [0.66, 0.02]]) scatola(sp2, 0.02, w, 0.02, M(0x4a3426), 0.03, y, 0.0)   // le tacche di ruggine
    } else {                                                                                                 // lo scudo di legno scheggiato
      const sc = perno(mano, 0.0, -0.01, 0.08); sc.rotation.y = 1.15; pivot.scudo = sc
      const disco = cil(sc, 0.27, 0.27, 0.05, M(LEGNO), 0, 0, 0, 12); disco.rotation.x = Math.PI / 2
      const anello = mesh(sc, new THREE.TorusGeometry(0.27, 0.025, 5, 14), rug, 0, 0, 0.025)
      const ombelico = sfera(sc, 0.07, rug, 0, 0, 0.05, 1, 1, 0.6, 8)
      for (const a of [0.6, 2.2, 3.9, 5.2]) scatola(sc, 0.04, 0.2, 0.012, M(0x4a3020), Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0.03).rotation.z = a
      sc.position.set(-0.05, -0.06, 0.1)
    }
  }
  // le gambe
  for (const lato of [-1, 1]) {
    const an = perno(g, lato * 0.095, 0.78, 0); pivot[lato < 0 ? 'gambaS' : 'gambaD'] = an
    osso(an, [0, 0, 0], [0, -0.38, 0.015], 0.032, 0.026, o1)
    const gi = perno(an, 0, -0.38, 0.015)
    osso(gi, [0, 0, 0], [0, -0.37, -0.01], 0.026, 0.02, o1)
    sfera(gi, 0.035, o2, 0, 0.0, 0.03, 1, 1, 0.8, 8)                                                         // la rotula
    scatola(gi, 0.07, 0.035, 0.15, o1, 0, -0.395, 0.04)                                                      // il piede
    for (const d of [-1, 0, 1]) scatola(gi, 0.016, 0.02, 0.05, o2, d * 0.022, -0.395, 0.135)
  }
  // il perizoma a brandelli
  for (let i = -2; i <= 2; i++) {
    const s = scatola(g, 0.06, 0.2 - Math.abs(i) * 0.03, 0.01, M(STRACCIO, { side: THREE.DoubleSide }), i * 0.06, 0.7 - Math.abs(i) * 0.015, 0.1)
    s.rotation.z = i * 0.06
  }
  // un mantello a strappi sulle spalle
  const mantello = scatola(g, 0.34, 0.5, 0.012, M(0x3b2a35, { side: THREE.DoubleSide }), 0, 1.07, -0.17); mantello.rotation.x = 0.08
  for (let i = -2; i <= 2; i++) scatola(g, 0.06, 0.12 + (i & 1) * 0.07, 0.012, M(0x3b2a35, { side: THREE.DoubleSide }), i * 0.07, 0.78 - (i & 1) * 0.03, -0.18)
  // Il busto si piega insieme: nel gruppo del corpo restano figli diretti (altri moduli li cercano per posizione), quindi per piegarlo
  // si muovono tutti attorno al bacino con `ruotaBusto`; `ripristinaBusto` li rimette a posto a ogni fotogramma (prima di `attacca`)
  const CENTRO = new THREE.Vector3(0, 0.85, 0), animati = new Set([pivot.testa, pivot.bracciaS, pivot.bracciaD])
  const alto = g.children.filter(o => o === colonna || o === cassa || o.position.y > 0.95).map(o => ({ o, p: o.position.clone(), q: o.quaternion.clone() }))
  const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _v = new THREE.Vector3()
  const ripristinaBusto = () => { for (const a of alto) { a.o.position.copy(a.p); if (!animati.has(a.o)) a.o.quaternion.copy(a.q) } }
  const ruotaBusto = (rx, ry, rz) => {
    _q.setFromEuler(_e.set(rx, ry, rz))
    for (const a of alto) { _v.copy(a.o.position).sub(CENTRO).applyQuaternion(_q).add(CENTRO); a.o.position.copy(_v); a.o.quaternion.premultiply(_q) }
  }
  g.userData.anima = (t) => {
    ripristinaBusto()
    const r = onda(t, 2.1)
    pivot.cassa.scale.set(1 + r * 0.012, 1 + r * 0.02, 1 + r * 0.012)
    pivot.testa.rotation.set(0.03 + onda(t, 0.7) * 0.05, onda(t, 0.45) * 0.28, onda(t, 0.9) * 0.04)
    pivot.mascella.rotation.x = 0.06 + Math.max(0, onda(t, 3.1)) * 0.28 * liscio(0.3, 0.9, onda(t, 0.4) * 0.5 + 0.5)
    // il ciclo: guardia → fendente ogni ~3 s
    const colpo = 0, caricare = 0                                  // il fendente lo fa `attacca(p)`, chiamato da chi comanda lo scontro
    // guardia a braccia aperte e pronte (non strette al petto): il braccio dell'arma un po' scostato, il gomito mezzo piegato; quello dello scudo in avanti
    const r2 = onda(t, 1.7)
    pivot.bracciaD.rotation.set(-0.35 - caricare * 1.6 + colpo * 2.5 + r2 * 0.02, 0, 0.45)
    pivot.gomitoD.rotation.x = -1.0 - caricare * 0.5 + colpo * 0.8
    pivot.bracciaS.rotation.set(-0.4 + onda(t, 1.4) * 0.03, 0, -0.5); pivot.gomitoS.rotation.x = -1.25
    // da fermo non sta immobile: rimbalza sulle ginocchia, sposta il peso, dondola le braccia e ogni tanto trema e fa tintinnare la mascella
    const f = onda(t, 3.3), peso = onda(t, 0.6), k4 = (t % 4.6) / 4.6, tremito = liscio(0.8, 0.82, k4) * (1 - liscio(0.9, 0.92, k4))
    pivot.gambaS.rotation.x = -0.05 + f * 0.05 + peso * 0.03; pivot.gambaD.rotation.x = 0.06 - f * 0.05 - peso * 0.03
    pivot.bracciaD.rotation.z += onda(t, 1.9) * 0.05; pivot.gomitoD.rotation.x += onda(t, 2.3) * 0.09
    pivot.bracciaS.rotation.z += onda(t, 2.2, 1) * 0.04; pivot.gomitoS.rotation.x += onda(t, 2.7, 2) * 0.07
    pivot.spada.rotation.z = -0.28 + onda(t, 1.9, 0.5) * 0.06
    pivot.mascella.rotation.x += tremito * (0.12 + 0.12 * Math.sin(t * 38))
    g.position.y = 0; g.rotation.y = onda(t, 0.35) * 0.05
    for (const a of alto) a.o.position.y += f * 0.032 - 0.016 + tremito * Math.sin(t * 55) * 0.008
    ruotaBusto(0.03 * f, peso * 0.11 + tremito * Math.sin(t * 47) * 0.04, peso * 0.07)
  }
  // Lo scheletro può usare armi diverse: `impugna(destra, sinistra)` con i Group della collezione (poc/armi-3d/collezione.js) o
  // null per la mano vuota; `undefined` lascia quella di serie (spada arrugginita, scudo di legno). Torna `togli()`.
  let montate = []
  g.userData.impugna = (destra, sinistra) => {
    for (const m of montate) m.parent && m.parent.remove(m)
    montate = []
    pivot.spada.visible = destra === undefined; pivot.scudo.visible = sinistra === undefined
    const monta = (arma, presa, sinistro) => {
      if (!arma) return
      const w = perno(presa, 0, 0, 0), fam = arma.userData.famiglia
      w.scale.setScalar(1.4)
      if (fam === 'scudo') { w.position.set(sinistro ? -0.05 : 0.05, -0.06, 0.1); w.rotation.y = sinistro ? 1.15 : -1.15 }
      else w.rotation.set(fam === 'spada' ? 1.2 : fam === 'staffa' ? 0.15 : 0, 0, fam === 'spada' ? -0.1 : 0)
      if (arma.userData.tipo === 'ascia') arma.rotation.y = -Math.PI / 2   // il filo in avanti
      w.add(arma); montate.push(w)
    }
    monta(destra, pivot.presaD, false); monta(sinistra, pivot.presaS, true)
    if (!g.userData.animaIdle) { g.userData.animaIdle = g.userData.anima; g.userData.anima = t => { g.userData.animaIdle(t); for (const m of montate) { const q = m.children[0]; if (q && q.userData.anima) q.userData.anima(t) } } }
    return () => g.userData.impugna(undefined, undefined)
  }
  // l'attacco: carica il braccio con la spada, un passo avanti e il fendente dall'alto, poi rientra; `p` da 0 a 1, funzione pura
  g.userData.attacco = { tipo: 'colpo-arma', durata: 0.8, arrivo: 0.52, proiettile: null }
  g.userData.attacca = (p) => {
    const carica = liscio(0.0, 0.38, p) * (1 - liscio(0.38, 0.46, p)), fendi = liscio(0.4, 0.55, p) * (1 - liscio(0.72, 1.0, p)), w = Math.max(carica, fendi)
    const passo = liscio(0.25, 0.5, p) * (1 - liscio(0.7, 1.0, p))
    const mix = (a, b, k) => a + (b - a) * k
    // braccio destro: dalla guardia (-0.22, gomito -1.15) in alto dietro la testa, poi giù in avanti
    const rx = mix(mix(pivot.bracciaD.rotation.x, -2.55, carica), -0.55, fendi * (1 - carica))
    pivot.bracciaD.rotation.x = rx; pivot.gomitoD.rotation.x = mix(mix(pivot.gomitoD.rotation.x, -0.7, carica), -0.25, fendi * (1 - carica))
    pivot.bracciaS.rotation.x = mix(pivot.bracciaS.rotation.x, -0.7, w * 0.7); pivot.gomitoS.rotation.x = mix(pivot.gomitoS.rotation.x, -1.1, w * 0.7)  // lo scudo si alza
    pivot.testa.rotation.x += 0.18 * fendi
    g.position.z = 0.32 * passo; g.rotation.x = 0.1 * fendi
    ruotaBusto(mix(0, -0.12, carica) + 0.2 * fendi, mix(0, 0.25, carica) - 0.35 * fendi, 0)   // dopo le pose di testa e braccia: le compone
  }
  g.userData.anima(0)
  return g
}

// ══════════════════════════════════════ LA MELMA ══════════════════════════════════════
export function creaMelma (colore = 0x57d85e) {
  const g = new THREE.Group()
  const base = new THREE.SphereGeometry(0.62, 40, 28), pos = base.attributes.position, orig = pos.array.slice()
  for (let i = 0; i < pos.count; i++) {                                                // la pancia si schiaccia sul pavimento: forma di goccia
    const y = orig[i * 3 + 1], k = y < 0 ? 0.38 : 1.0
    pos.setY(i, y * k + 0.2)
    const sotto = y < 0 ? 1 + (-y / 0.62) * 0.18 : 1
    pos.setX(i, orig[i * 3] * sotto); pos.setZ(i, orig[i * 3 + 2] * sotto)
  }
  const orig2 = pos.array.slice()
  base.computeVertexNormals()
  const gelatina = new THREE.MeshPhysicalMaterial({ color: colore, transparent: true, opacity: 0.74, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08,
    emissive: 0x2a9a38, emissiveIntensity: 0.35, side: THREE.FrontSide, depthWrite: false })
  const guscio = new THREE.Mesh(base, gelatina); guscio.castShadow = false; guscio.receiveShadow = false; guscio.renderOrder = 3; g.add(guscio)
  // l'interno: un nucleo che brilla e le cose che ha inghiottito
  const dentro = perno(g, 0, 0.42, 0)
  const nucleo = rozza(dentro, 0.15, M(0xd8ff7a, { emissive: 0xb6ff3a, emissiveIntensity: 1.6, flatShading: false }), 0.0, -0.02, -0.04, 1, 1, 1, 2); nucleo.castShadow = false
  const teschio = creaTeschio(0.55); teschio.position.set(0.2, 0.08, -0.12); teschio.rotation.set(0.5, -0.7, 0.4); dentro.add(teschio)
  const lama = perno(dentro, -0.22, -0.05, -0.05); lama.rotation.set(0.4, 0.2, 1.1)
  scatola(lama, 0.04, 0.3, 0.012, M(0x9aa6b0, { metalness: 0.6, roughness: 0.4 }), 0, 0.1, 0); scatola(lama, 0.14, 0.025, 0.03, M(0x8a6a3a), 0, -0.05, 0)
  const monete = [[0.0, -0.12, 0.2], [0.12, -0.16, 0.16], [-0.1, -0.15, 0.22]].map(([x, y, z]) => cil(dentro, 0.045, 0.045, 0.012, M(0xf2c14e, { emissive: 0x6a4a00, emissiveIntensity: 0.6, metalness: 0.7, roughness: 0.3 }), x, y, z, 12))
  monete.forEach((m, i) => { m.rotation.x = Math.PI / 2 - 0.5 + i * 0.4 })
  // occhi e bocca sul davanti
  const faccia = perno(g, 0, 0.5, 0.5)
  const bianco = M(0xffffff, { flatShading: false, roughness: 0.3 }), nero = M(0x111a12, { flatShading: false, roughness: 0.2 })
  for (const s of [-1, 1]) {
    const o = perno(faccia, s * 0.2, 0.07, 0.03)
    sfera(o, 0.105, bianco, 0, 0, 0, 1, 1.1, 0.8, 16)
    sfera(o, 0.055, nero, -s * 0.01, -0.01, 0.07, 1, 1.15, 0.7, 12)
    sfera(o, 0.017, bianco, -s * 0.01 + 0.02, 0.025, 0.1, 1, 1, 1, 6)
    const sopracciglio = scatola(faccia, 0.17, 0.035, 0.04, M(0x1d6a2c, { flatShading: false }), s * 0.2, 0.2, 0.06); sopracciglio.rotation.z = s * 0.38
    o.userData.sf = o
  }
  const bocca = mesh(faccia, new THREE.TorusGeometry(0.12, 0.022, 6, 14, Math.PI), nero, 0, -0.1, 0.02); bocca.rotation.z = Math.PI; bocca.scale.set(1, 0.7, 1)
  for (const s of [-1, 1]) cono(faccia, 0.018, 0.045, bianco, s * 0.07, -0.145, 0.025, 4).rotation.x = Math.PI
  // la pozza e le gocce
  const pozza = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshPhysicalMaterial({ color: colore, transparent: true, opacity: 0.55, roughness: 0.1, clearcoat: 1, depthWrite: false }))
  pozza.rotation.x = -Math.PI / 2; pozza.position.y = 0.012; pozza.scale.set(0.95, 0.8, 1); pozza.receiveShadow = true; pozza.renderOrder = 1; g.add(pozza)
  const macchie = []
  for (const [x, z, r] of [[0.75, 0.2, 0.17], [-0.7, 0.35, 0.14], [0.3, 0.72, 0.1], [-0.35, -0.65, 0.16], [0.55, -0.5, 0.09]]) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 14), pozza.material); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.013, z); m.renderOrder = 1; g.add(m); macchie.push(m)
  }
  const bolle = []
  const matBolla = new THREE.MeshPhysicalMaterial({ color: 0xcfffd0, transparent: true, opacity: 0.55, roughness: 0, clearcoat: 1, depthWrite: false })
  for (let i = 0; i < 6; i++) { const b = sfera(g, 0.03 + (i % 3) * 0.012, matBolla, 0, 0, 0, 1, 1, 1, 8); b.castShadow = false; b.renderOrder = 2; bolle.push(b) }
  g.userData.anima = (t) => {
    const p = onda(t, 2.6), q = onda(t, 2.6, Math.PI / 2)
    guscio.scale.set(1 + p * 0.06, 1 - p * 0.085, 1 + p * 0.06)
    g.rotation.z = onda(t, 0.9) * 0.035
    for (let i = 0; i < pos.count; i++) {                                              // il tremolio della gelatina
      const x = orig2[i * 3], y = orig2[i * 3 + 1], z = orig2[i * 3 + 2]
      const k = 1 + 0.028 * Math.sin(t * 3.1 + y * 7 + x * 5) + 0.02 * Math.sin(t * 2.3 + z * 6 - y * 4)
      pos.setXYZ(i, x * k, y + 0.015 * Math.sin(t * 2.0 + x * 6 + z * 4) * liscio(0.2, 0.9, y), z * k)
    }
    pos.needsUpdate = true; base.computeVertexNormals()
    dentro.rotation.y = t * 0.35; dentro.position.y = 0.42 + Math.sin(t * 1.3) * 0.03
    nucleo.scale.setScalar(1 + onda(t, 5) * 0.08)
    faccia.position.y = 0.5 - p * 0.02; faccia.rotation.y = onda(t, 0.8) * 0.08
    macchie.forEach((m, i) => { const s = 1 + onda(t, 1.4, i * 1.7) * 0.12; m.scale.set(s, s, 1) })
    bolle.forEach((b, i) => { const u = ((t * 0.18 + i / 6) % 1); b.position.set(Math.cos(i * 2.4) * 0.28, 0.25 + u * 0.75, Math.sin(i * 2.4) * 0.22); b.scale.setScalar(1 - Math.pow(u, 3)) })
  }
  // l'attacco: si raccoglie (schiaccia e arretra), poi si lancia in avanti allungandosi e schizza; funzione pura di p
  g.userData.attacco = { tipo: 'schianto', durata: 0.7, arrivo: 0.5, proiettile: null }
  g.userData.attacca = (p) => {
    const raccogli = liscio(0.0, 0.32, p) * (1 - liscio(0.32, 0.42, p)), balza = liscio(0.34, 0.52, p) * (1 - liscio(0.6, 1.0, p))
    g.scale.set(1 + 0.18 * raccogli - 0.12 * balza, 1 - 0.38 * raccogli - 0.15 * balza, 1 - 0.1 * raccogli + 0.7 * balza)
    g.position.z = -0.12 * raccogli + 0.55 * balza
    faccia.rotation.x = -0.15 * balza; faccia.position.z += 0.08 * balza
  }
  g.userData.anima(0)
  return g
}

// ══════════════════════════════════════ IL DRAGO ══════════════════════════════════════
const SQUAMA = 0xc2362b, SQUAMA2 = 0x9a2a22, PANCIA = 0xf0c987, CORNO = 0xe8d9b8, MEMB = 0xd9553a, OSSOALA = 0x7b241d

export function creaDrago () {
  const g = new THREE.Group()
  const sq = M(SQUAMA), sq2 = M(SQUAMA2), pancia = M(PANCIA), corno = M(CORNO, { roughness: 0.5 }), buio = M(0x2b1410)
  const fuoco = M(0xffa21a, { emissive: 0xff7a00, emissiveIntensity: 2.4, flatShading: false, transparent: true, opacity: 0.92 })
  const pivot = {}
  // il corpo
  const corpo = perno(g, 0, 0, 0); pivot.corpo = corpo
  rozza(corpo, 0.52, sq, 0, 0.95, -0.05, 0.95, 0.85, 1.5, 2)
  rozza(corpo, 0.46, pancia, 0, 0.82, 0.02, 0.8, 0.75, 1.42, 2)                                       // il ventre chiaro
  // il collo, a segmenti che salgono in curva, e la testa in cima
  const collo = perno(corpo, 0, 0, 0); pivot.collo = collo
  const nodiCollo = []
  for (let i = 0; i < 11; i++) {
    const u = i / 10, y = 1.1 + u * u * 0.18 + u * 0.55, z = 0.55 + Math.sin(u * 1.4) * 0.55, r = 0.27 - u * 0.08
    nodiCollo.push([0, y, z, r])
    rozza(collo, r, sq, 0, y, z, 1, 1, 1.25, 2)
    rozza(collo, r * 0.82, pancia, 0, y - r * 0.28, z + r * 0.18, 0.75, 0.7, 1.25, 1)
    if (i > 0 && i % 2 === 0) cono(collo, 0.04, 0.12, corno, 0, y + r * 0.9, z - 0.04, 4).rotation.x = -0.4
  }
  const [hx, hy, hz] = nodiCollo.at(-1)
  const testa = perno(collo, hx, hy + 0.04, hz + 0.05); pivot.testa = testa; testa.rotation.x = 0.22
  rozza(testa, 0.2, sq, 0, 0.0, 0.0, 1.0, 0.92, 1.1, 2)                                                // il cranio
  rozza(testa, 0.14, sq, 0, -0.03, 0.22, 0.85, 0.65, 1.55, 2)                                          // il muso
  sfera(testa, 0.04, buio, 0, 0.0, 0.46, 1.2, 0.8, 1, 6)
  for (const s of [-1, 1]) {
    sfera(testa, 0.016, buio, s * 0.04, 0.03, 0.42, 1, 1, 1, 6)                                       // narici
    const occhio = perno(testa, s * 0.115, 0.09, 0.12)
    sfera(occhio, 0.052, M(0xffd23a, { emissive: 0xffa800, emissiveIntensity: 1.3, flatShading: false }), 0, 0, 0, 1, 1, 0.7, 12)
    sfera(occhio, 0.022, buio, 0, 0, 0.032, 0.35, 1.5, 0.6, 8)                                         // la pupilla a fessura
    const soprac = scatola(testa, 0.14, 0.04, 0.09, sq2, s * 0.115, 0.165, 0.1); soprac.rotation.set(0.0, s * -0.15, s * 0.4)
    punta(testa, [s * 0.1, 0.12, -0.04], [s * 0.3, 0.42, -0.34], 0.06, corno, 6)                      // corna grandi, all'indietro
    punta(testa, [s * 0.17, 0.0, -0.02], [s * 0.34, 0.07, -0.2], 0.045, corno, 6)                      // corna piccole di lato
    for (let k = 0; k < 3; k++) cono(testa, 0.022, 0.07, corno, s * (0.19 - k * 0.012), -0.07 - k * 0.012, 0.0 - k * 0.07, 4).rotation.z = s * -1.1  // spine della guancia
  }
  for (let k = 0; k < 4; k++) cono(testa, 0.018, 0.06 + (k % 2) * 0.03, corno, 0, 0.19 - k * 0.012, -0.06 - k * 0.07, 4).rotation.x = -0.5   // la cresta
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) cono(testa, 0.012, 0.045, M(0xf8f0dc), s * 0.075, -0.08, 0.14 + k * 0.07, 4).rotation.x = Math.PI    // denti di sopra
  const mascella = perno(testa, 0, -0.09, 0.06); pivot.mascella = mascella
  rozza(mascella, 0.1, sq2, 0, -0.01, 0.12, 0.8, 0.45, 1.75, 1)
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) cono(mascella, 0.011, 0.04, M(0xf8f0dc), s * 0.055, 0.03, 0.1 + k * 0.07, 4)
  const gola = rozza(mascella, 0.075, M(0xff6a00, { emissive: 0xff4400, emissiveIntensity: 1.6, flatShading: false }), 0, 0.03, 0.13, 0.9, 0.45, 1.6, 1); gola.castShadow = false
  // la fiamma: tre lingue che tremano, davanti alla bocca
  const fiamma = perno(testa, 0, -0.03, 0.46); pivot.fiamma = fiamma
  const lingue = []
  for (let i = 0; i < 4; i++) {
    const l = new THREE.Mesh(new THREE.ConeGeometry(0.09 - i * 0.012, 0.5 - i * 0.07, 7), i % 2 ? fuoco : M(0xffe27a, { emissive: 0xffd040, emissiveIntensity: 2.6, flatShading: false, transparent: true, opacity: 0.9 }))
    l.rotation.x = Math.PI / 2; l.position.z = 0.25 - i * 0.02; l.castShadow = false; fiamma.add(l); lingue.push(l)
  }
  // la coda: segmenti che si assottigliano, con le spine sul dorso e una punta a lancia
  const coda = perno(corpo, 0, 0.8, -0.65); pivot.coda = coda
  const segmenti = []
  let px = 0, py = 0, pz = 0
  for (let i = 0; i < 9; i++) {
    const u = i / 8, r = 0.3 * (1 - u) + 0.045, lung = 0.24
    const s = perno(coda, 0, 0, 0); s.position.set(px, py, pz)
    rozza(s, r, sq, 0, 0, -lung / 2, 1, 1, 1.5, 1)
    rozza(s, r * 0.8, pancia, 0, -r * 0.3, -lung / 2, 0.7, 0.6, 1.3, 1)
    cono(s, r * 0.35, r * 1.1, sq2, 0, r * 0.95, -lung / 2, 4)
    segmenti.push(s); pz -= lung; py += (i < 4 ? -0.02 : 0.025)
  }
  const punta1 = cono(coda, 0.1, 0.3, corno, px, py, pz - 0.1, 4); punta1.rotation.x = -Math.PI / 2; punta1.scale.set(1.6, 1, 0.5)
  // le zampe: quelle dietro con la coscia grossa, quelle davanti più dritte; ognuna con tre artigli
  const zampe = []
  for (const [z, grossa] of [[0.45, false], [-0.5, true]]) for (const s of [-1, 1]) {
    const an = perno(corpo, s * 0.42, 0.78, z); zampe.push(an)
    rozza(an, grossa ? 0.27 : 0.19, sq, s * 0.03, -0.05, 0, 0.9, 1.1, 1.0, 1)
    osso(an, [s * 0.02, -0.1, grossa ? 0.0 : 0.02], [s * 0.04, -0.45, grossa ? 0.1 : 0.08], grossa ? 0.1 : 0.075, 0.06, sq)
    const piede = perno(an, s * 0.045, -0.5, grossa ? 0.14 : 0.12)
    rozza(piede, 0.1, sq2, 0, 0.0, 0.02, 1.0, 0.5, 1.4, 1)
    for (let k = -1; k <= 1; k++) punta(piede, [k * 0.055, -0.01, 0.12], [k * 0.07, -0.03, 0.27], 0.028, corno, 5)
  }
  // le ali: ossa e membrana, costruite per il lato destro e specchiate
  const ali = []
  for (const s of [-1, 1]) {
    const ala = perno(corpo, s * 0.3, 1.28, 0.05); ala.scale.set(s * 0.72, 0.72, 0.72); ali.push(ala)
    const S = [0, 0, 0], E = [0.55, 0.62, -0.12], W = [1.15, 0.95, 0.02]
    const dita = [[1.78, 1.38, 0.1], [2.05, 0.7, -0.15], [1.7, -0.15, -0.4], [1.0, -0.55, -0.62]]
    const B = [0.1, -0.5, -0.6]
    osso(ala, S, E, 0.075, 0.06, sq); osso(ala, E, W, 0.06, 0.045, sq)
    sfera(ala, 0.06, sq2, ...W, 1, 1, 1, 8); punta(ala, W, [W[0] + 0.12, W[1] + 0.22, W[2] + 0.1], 0.04, corno, 5)   // l'artiglio dell'ala
    for (const d of dita) osso(ala, W, d, 0.032, 0.014, M(OSSOALA), 5)
    const tris = [S, W, B, W, dita[3], B, W, dita[2], dita[3], W, dita[1], dita[2], W, dita[0], dita[1]]
    const v = new Float32Array(tris.flat()); const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(v, 3)); geo.computeVertexNormals()
    const colori = new Float32Array(tris.length * 3), c0 = new THREE.Color(MEMB), c1 = new THREE.Color(0x7a1e2a)
    tris.forEach((p, i) => { const k = Math.min(1, Math.hypot(p[0], p[1] + 0.2) / 2.1); const c = c0.clone().lerp(c1, 1 - k * 0.9); colori.set([c.r, c.g, c.b], i * 3) })
    geo.setAttribute('color', new THREE.BufferAttribute(colori, 3))
    const membrana = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.65, flatShading: true, emissive: 0x3a0a08, emissiveIntensity: 0.5 }))
    membrana.castShadow = true; ala.add(membrana)
    ala.rotation.set(0.0, s * 0.35, 0)
  }
  // le spine sul dorso
  for (let i = 0; i < 7; i++) cono(corpo, 0.06 - i * 0.004, 0.2 - i * 0.012, corno, 0, 1.4 - i * 0.04, 0.5 - i * 0.2, 4).rotation.x = -0.25
  g.userData.anima = (t) => {
    const r = onda(t, 1.9), v = onda(t, 4.2)
    pivot.corpo.position.y = r * 0.012; pivot.corpo.scale.set(1 + r * 0.01, 1 + r * 0.012, 1)
    ali.forEach((a, i) => { const s = i ? 1 : -1; const f = onda(t, 2.2); a.rotation.z = s * -1 * (0.2 + f * 0.3); a.rotation.y = (i ? 1 : -1) * 0.38 + f * 0.07 })
    pivot.collo.rotation.x = onda(t, 1.0) * 0.04; pivot.collo.rotation.y = onda(t, 0.55) * 0.12
    pivot.testa.rotation.x = 0.2 + onda(t, 1.2) * 0.05
    const sbuffo = liscio(0.55, 0.62, (t % 4) / 4) * (1 - liscio(0.9, 0.97, (t % 4) / 4))      // ogni quattro secondi soffia
    pivot.mascella.rotation.x = 0.14 + sbuffo * 0.42 + onda(t, 1.7) * 0.02
    pivot.fiamma.visible = sbuffo > 0.02; pivot.fiamma.scale.set(1, 1, sbuffo * (1 + onda(t, 28) * 0.08))
    lingue.forEach((l, i) => { l.scale.y = 1 + onda(t, 21 + i * 4, i) * 0.12; l.position.x = onda(t, 33 + i, i) * 0.01 })
    segmenti.forEach((s, i) => { s.rotation.y = onda(t, 1.4, -i * 0.5) * (0.07 + i * 0.012); s.rotation.x = onda(t, 1.0, -i * 0.4) * 0.02 })
    zampe.forEach((z, i) => { z.rotation.x = Math.sin(t * 1.1 + i) * 0.015 })
  }
  g.userData.anima(0)
  return g
}

// ══════════════════════════════════════ IL DRAGO, VERSIONE CARINA ══════════════════════════════════════
// Proporzioni da cucciolone: testa enorme, muso corto, occhi grandi e lucidi, corpo tondo, zampe tozze, ali piccole, coda che si arriccia.
export function creaDragoCarino () {
  const g = new THREE.Group()
  const sq = M(0xe4573c, { flatShading: false, roughness: 0.55 }), sq2 = M(0xc3402f, { flatShading: false, roughness: 0.6 })
  const pancia = M(0xffe2a8, { flatShading: false, roughness: 0.7 }), corno = M(0xfff1cf, { flatShading: false, roughness: 0.4 })
  const buio = M(0x24131a, { flatShading: false, roughness: 0.15 }), bianco = M(0xffffff, { flatShading: false, roughness: 0.2 })
  const guancia = M(0xff8fa0, { flatShading: false, roughness: 0.9 })
  const pivot = {}
  const corpo = perno(g, 0, 0, 0); pivot.corpo = corpo
  sfera(corpo, 0.56, sq, 0, 0.72, -0.02, 1.0, 0.92, 1.12, 24)
  sfera(corpo, 0.5, pancia, 0, 0.66, 0.2, 0.8, 0.88, 0.62, 20)
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.TorusGeometry(0.34 - i * 0.015, 0.012, 4, 14, Math.PI), M(0xe8c17a, { flatShading: false })); f.rotation.set(0, 0, Math.PI); f.scale.z = 0.6; f.position.set(0, 0.5 + i * 0.12, 0.45 - i * 0.02); corpo.add(f) }
  // le zampe: tozze, con le dita a pallina e piccoli artigli chiari
  const zampe = []
  for (const [z, r] of [[0.3, 0.17], [-0.32, 0.21]]) for (const sg of [-1, 1]) {
    const an = perno(corpo, sg * 0.34, 0.32, z); zampe.push(an)
    sfera(an, r, sq, 0, 0, 0, 0.95, 1.1, 1, 14)
    const piede = perno(an, 0, -0.2, 0.06)
    sfera(piede, 0.15, sq2, 0, 0, 0.03, 1.05, 0.62, 1.3, 14)
    for (let k = -1; k <= 1; k++) { sfera(piede, 0.045, pancia, k * 0.07, -0.01, 0.17, 1, 0.8, 1.1, 8); cono(piede, 0.018, 0.045, corno, k * 0.07, -0.01, 0.23, 5).rotation.x = Math.PI / 2 }
  }
  // la testa: grande, tonda, con il muso corto
  const testa = perno(corpo, 0, 1.2, 0.5); pivot.testa = testa
  sfera(testa, 0.42, sq, 0, 0, 0, 1.12, 1.0, 1.05, 26)
  sfera(testa, 0.22, sq, 0, -0.12, 0.34, 1.05, 0.8, 1.0, 18)                                    // il muso
  sfera(testa, 0.16, pancia, 0, -0.17, 0.4, 1.05, 0.55, 0.75, 14)                               // il mento chiaro
  for (const sg of [-1, 1]) {
    sfera(testa, 0.026, buio, sg * 0.075, -0.06, 0.53, 1, 0.8, 0.7, 8)                          // le narici
    const occhio = perno(testa, sg * 0.21, 0.08, 0.34); pivot[sg < 0 ? 'occhioS' : 'occhioD'] = occhio
    sfera(occhio, 0.115, buio, 0, 0, 0, 1, 1.12, 0.78, 18)
    sfera(occhio, 0.07, M(0xffb22e, { emissive: 0x7a4300, emissiveIntensity: 0.6, flatShading: false }), 0.0, -0.02, 0.05, 1, 1.05, 0.5, 14)   // l'iride ambra
    sfera(occhio, 0.045, buio, 0.0, -0.02, 0.075, 0.8, 1.1, 0.5, 10)                            // la pupilla
    sfera(occhio, 0.034, bianco, 0.04, 0.05, 0.085, 1, 1, 0.5, 8); sfera(occhio, 0.016, bianco, -0.035, -0.045, 0.085, 1, 1, 0.5, 6)   // i riflessi
    sfera(testa, 0.07, guancia, sg * 0.31, -0.09, 0.26, 1, 0.65, 0.5, 10)                       // il rossore
    const soprac = scatola(testa, 0.13, 0.03, 0.05, sq2, sg * 0.21, 0.23, 0.36); soprac.rotation.z = sg * 0.22
    const c1 = perno(testa, sg * 0.2, 0.34, -0.02); c1.rotation.set(-0.5, 0, sg * -0.35)        // le corna, corte e tonde in punta
    cono(c1, 0.085, 0.28, corno, 0, 0.14, 0, 10); sfera(c1, 0.02, corno, 0, 0.28, 0, 1, 1, 1, 6)
    const orecchio = perno(testa, sg * 0.45, 0.06, -0.06); orecchio.rotation.set(0, sg * 0.5, sg * -0.25)   // le pinne ai lati
    for (let k = 0; k < 3; k++) { const l = cono(orecchio, 0.035, 0.22 - k * 0.04, M(0xff9a5c, { flatShading: false, side: THREE.DoubleSide }), 0, 0, 0, 3); l.rotation.z = sg * (-1.1 + k * 0.35); l.position.set(sg * 0.06, 0.03 - k * 0.05, 0); l.scale.z = 0.3 }
  }
  for (let k = 0; k < 4; k++) cono(testa, 0.045 - k * 0.005, 0.14 - k * 0.015, corno, 0, 0.4 - k * 0.1, -0.12 - k * 0.1, 8).rotation.x = -0.7 - k * 0.1   // il ciuffo di spine
  const mascella = perno(testa, 0, -0.2, 0.3); pivot.mascella = mascella
  sfera(mascella, 0.13, sq2, 0, -0.01, 0.1, 1.05, 0.38, 1.2, 12)
  for (const sg of [-1, 1]) cono(mascella, 0.017, 0.045, bianco, sg * 0.05, 0.04, 0.16, 6)
  const gola = sfera(mascella, 0.09, M(0xff6a3d, { emissive: 0xff4a1a, emissiveIntensity: 1.1, flatShading: false }), 0, 0.02, 0.1, 1, 0.35, 1.1, 10); gola.castShadow = false
  const sorriso = mesh(testa, new THREE.TorusGeometry(0.12, 0.012, 5, 14, Math.PI * 0.8), buio, 0, -0.09, 0.51); sorriso.rotation.set(0.15, 0, Math.PI + Math.PI * 0.1); sorriso.scale.set(1, 0.55, 1)
  // la fiamma: un soffio piccolo e allegro
  const fiamma = perno(testa, 0, -0.15, 0.56); pivot.fiamma = fiamma
  const lingue = []
  for (let i = 0; i < 3; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.1 - i * 0.02, 12, 10), i % 2 ? M(0xffd24a, { emissive: 0xffb300, emissiveIntensity: 2.4, flatShading: false, transparent: true, opacity: 0.92 }) : M(0xff7a1c, { emissive: 0xff5200, emissiveIntensity: 2.2, flatShading: false, transparent: true, opacity: 0.9 }))
    l.scale.set(1, 0.9, 2.0 - i * 0.3); l.position.z = 0.1 + i * 0.12; l.castShadow = false; fiamma.add(l); lingue.push(l)
  }
  // la coda: grossa, che si arriccia verso l'alto, con la punta a foglia
  const coda = perno(corpo, 0, 0.5, -0.55); pivot.coda = coda
  const seg = []
  let px = 0, py = 0, pz = 0, ang = 0
  for (let i = 0; i < 9; i++) {
    const u = i / 8, r = 0.24 * (1 - u) + 0.05, s1 = perno(coda, px, py, pz); s1.rotation.x = 0
    sfera(s1, r, sq, 0, 0, 0, 1, 1, 1.15, 12); sfera(s1, r * 0.7, pancia, 0, -r * 0.45, r * 0.1, 0.8, 0.6, 1, 8)
    if (i % 2 === 1) cono(s1, r * 0.4, r * 1.2, corno, 0, r * 0.95, 0, 6)
    seg.push(s1)
    ang += i < 3 ? 0.04 : 0.34; pz -= 0.15 * Math.cos(ang); py += 0.15 * Math.sin(ang) - (i < 3 ? 0.03 : 0)
  }
  const foglia = sfera(coda, 0.12, M(0xff9a5c, { flatShading: false }), px, py + 0.06, pz - 0.04, 0.5, 1.6, 0.9, 10); foglia.rotation.x = -0.4
  // le ali: piccole e tonde
  const ali = []
  for (const sg of [-1, 1]) {
    const ala = perno(corpo, sg * 0.3, 1.0, -0.12); ala.scale.set(sg * 0.5, 0.5, 0.5); ali.push(ala)
    const W = [1.0, 0.85, 0.0], E = [0.5, 0.5, -0.1]
    osso(ala, [0, 0, 0], E, 0.1, 0.075, sq, 8); osso(ala, E, W, 0.075, 0.055, sq, 8)
    const dita = [[1.55, 1.25, 0.05], [1.8, 0.65, -0.1], [1.5, 0.0, -0.3], [0.9, -0.4, -0.45]]
    for (const d of dita) osso(ala, W, d, 0.04, 0.02, sq2, 6)
    const B = [0.1, -0.3, -0.4], tris = [[0, 0, 0], W, B, W, dita[3], B, W, dita[2], dita[3], W, dita[1], dita[2], W, dita[0], dita[1]]
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tris.flat()), 3)); geo.computeVertexNormals()
    const mem = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xffb36b, side: THREE.DoubleSide, roughness: 0.6, emissive: 0x5a2a10, emissiveIntensity: 0.4 }))
    mem.castShadow = true; ala.add(mem); ala.rotation.set(0, sg * 0.45, 0)
  }
  // le spine sul dorso, tonde
  for (let i = 0; i < 5; i++) cono(corpo, 0.07 - i * 0.008, 0.2 - i * 0.025, corno, 0, 1.3 - i * 0.04, 0.32 - i * 0.18, 8).rotation.x = -0.3
  let prossimoOcchio = 2.5
  g.userData.anima = (t) => {
    const r = onda(t, 2.0), sob = Math.abs(onda(t, 2.6)) * 0.03
    pivot.corpo.position.y = sob; pivot.corpo.scale.set(1 + r * 0.01, 1 + r * 0.015, 1)
    ali.forEach((a, i) => { const sg = i ? 1 : -1, f = onda(t, 5.2); a.rotation.z = sg * -1 * (0.35 + f * 0.25); a.rotation.y = sg * 0.45 })
    pivot.testa.rotation.set(0.05 + onda(t, 1.3) * 0.04, onda(t, 0.6) * 0.18, onda(t, 0.8) * 0.05)
    const ciclo = (t % 4.5) / 4.5, sb = liscio(0.6, 0.66, ciclo) * (1 - liscio(0.9, 0.96, ciclo))
    pivot.mascella.rotation.x = 0.06 + sb * 0.5 + onda(t, 2.0) * 0.015
    pivot.fiamma.visible = sb > 0.05; pivot.fiamma.scale.setScalar(sb * (1 + onda(t, 26) * 0.08))
    const sbat = Math.max(0, 1 - Math.abs(((t + 0.4) % 3.2) - 0.1) * 12)                                  // una strizzata d'occhi ogni tanto
    for (const o of [pivot.occhioS, pivot.occhioD]) o.scale.y = 1 - sbat * 0.9
    seg.forEach((s1, i) => { s1.rotation.y = onda(t, 2.4, -i * 0.55) * (0.1 + i * 0.015) })
    zampe.forEach((z, i) => { z.rotation.x = onda(t, 2.6, i * 1.3) * 0.02 })
  }
  g.userData.anima(0)
  return g
}

export const MOSTRI = [
  { chiave: 'scheletro', nome: 'Scheletro', crea: creaScheletro, sprite: ['mostri-1', [12, 94, 45, 73]] },
  { chiave: 'melma', nome: 'Melma', crea: () => creaMelma(), sprite: ['mostri-1', [12, 20, 52, 56]] },
  { chiave: 'drago', nome: 'Drago (carino)', crea: creaDragoCarino, sprite: ['mostri-1', [543, 855, 151, 135]] },
  { chiave: 'drago-fiero', nome: 'Drago (fiero)', crea: creaDrago, sprite: ['mostri-1', [543, 855, 151, 135]] },
]

export { mesh, sfera, rozza, scatola, cil, cono, perno, punta, osso, liscio, onda }
