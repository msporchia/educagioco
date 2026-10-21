// Prototipo: i mostri della palude («La palude», livelli 7–9; guado, accampamento, palude, secco; dungeon cisterna e palafitta) in 3D.
// Contratto di mostri.js: `crea…()` → Group coi piedi a y = 0, davanti +z, `userData.anima(t)`, `attacca(p)`, `attacco`. Ogni mostro è una
// `pose(T, F)` che sistema tutto da zero (vedi palude-base.js). I tre grossi (Gorgo, Sibilla, Idra) stanno in palude-grossi.js.
import {
  THREE, M, sfera, rozza, scatola, cil, cono, perno, punta, liscio, onda, PI, V3, BUIO, lucido, lum, lumProprio, molle,
  arto, filo, tendi, occhio, marker, gesto, vivente, umano, catena
} from './palude-base.js'
import { creaPolpo, creaGorgo, creaSibilla, creaIdra } from './palude-grossi.js'

const mix = (a, b, k) => a + (b - a) * k

// ═════════════════════════════════════ LA SANGUISUGA ═════════════════════════════════════
export function creaSanguisuga () {
  const g = new THREE.Group()
  const N = 15, segs = []
  const pelle = M(0x4b4a2c, { flatShading: false, roughness: 0.4 }), banda = M(0xd0702a, { flatShading: false, roughness: 0.4 })
  const pancia = M(0x9a7a54, { flatShading: false }), sangue = lucido(0x7a1020, { roughness: 0.2 }), nero = M(0x1a1612)
  const raggio = u => 0.045 + 0.05 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.95 + 0.05)), 0.7)
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1), r = raggio(u), sg = new THREE.Group()
    sfera(sg, r, i % 2 ? pelle : M(0x3b3a22, { flatShading: false, roughness: 0.4 }), 0, 0, 0, 1.0, 0.85, 1.55, 9)
    sfera(sg, r * 0.8, pancia, 0, -r * 0.35, 0, 0.9, 0.5, 1.4, 6)
    rozza(sg, r * 0.55, banda, 0, r * 0.62, 0, 1.0, 0.35, 1.8, 0)
    g.add(sg); segs.push(sg)
  }
  sfera(segs[7], 0.07, sangue, 0, -0.02, 0, 1.15, 0.9, 1.1, 8)                   // il ventre gonfio di sangue (si vede dal lato)
  // la ventosa davanti: anello di carne con la bocca a tre lame e i denti
  const bocca = perno(segs[N - 1], 0, 0, 0.1)
  const anello = new THREE.TorusGeometry(0.075, 0.032, 6, 12)
  const an = new THREE.Mesh(anello, pelle); an.castShadow = true; bocca.add(an)
  sfera(bocca, 0.075, sangue, 0, 0, -0.012, 1, 1, 0.35, 8)
  for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2; const d = cono(bocca, 0.012, 0.045, M(0xf2ead0), Math.cos(a) * 0.058, Math.sin(a) * 0.058, 0.012, 4); d.rotation.set(Math.sin(a) * -1.2 + 0, 0, 0); d.lookAt(0, 0, 0.3); d.rotateX(PI / 2) }
  occhio(segs[N - 1], -0.04, 0.05, 0.01, 0.014, 0xe6c24a, { emis: 0.5 }); occhio(segs[N - 1], 0.04, 0.05, 0.01, 0.014, 0xe6c24a, { emis: 0.5 })
  sfera(segs[0], 0.06, pelle, 0, -0.01, -0.05, 1.2, 0.6, 1, 8)                    // la ventosa di coda
  const pose = (T, F) => {
    const { c, k, a } = F
    const rep = onda(T, 1.35)                                                    // l'onda del «passo a compasso»
    const al = gesto(T, 6.5, 2.2, 2.0)                                           // ogni tanto si alza e annusa
    const rear = 0.22 + 0.05 * onda(T, 0.8) + 0.12 * al + 0.1 * c - 0.14 * k
    const P = segs.map((_, i) => {
      const u = i / (N - 1), rise = liscio(0.4, 1, u), r = raggio(u)
      const x = Math.sin(u * 5 - T * 1.1) * 0.03 * (1 - rise) + onda(T, 0.7) * 0.05 * rise * (1 - k)
      const arco = Math.sin(Math.PI * u) * (0.05 + 0.04 * rep)
      const y = r * 0.9 + rise * rear * (0.5 + 0.5 * rise) + arco * (1 - rise) + (k * 0.04 * rise)
      const z = -0.42 + u * 0.7 - rise * (0.14 + 0.1 * c) + (k * 0.6) * rise + rep * 0.015 * u
      return [x, y, z]
    })
    segs.forEach((sg, i) => {
      sg.position.set(...P[i])
      const A = P[Math.max(0, i - 1)], B = P[Math.min(N - 1, i + 1)]
      sg.quaternion.setFromUnitVectors(new V3(0, 0, 1), new V3(B[0] - A[0], B[1] - A[1], B[2] - A[2]).normalize())
    })
    // la bocca pulsa da sola e si spalanca nel morso
    bocca.scale.setScalar(1 + 0.08 * onda(T, 5) + 0.45 * a)
  }
  const origine = marker(segs[N - 1], 0, 0, 0.1)
  return vivente(g, pose, { tipo: 'morso', durata: 0.6, arrivo: 0.5, origine })
}

// ═════════════════════════════════════ IL ROSPO e LA RANA VELENOSA ═════════════════════════════════════
const ANFIBI = {
  rospo: { pelle: 0x6b5a3a, scuro: 0x40331f, ventre: 0xd0c08a, occhi: 0xe8a82a, verruca: 0x8a7650, scala: 1, gola: 0xc8a050 },
  rana: { pelle: 0x2c7ad0, scuro: 0x101a3a, ventre: 0xf2d02a, occhi: 0xff7a1a, verruca: 0xf2d02a, scala: 1.25, gola: 0xf2d02a }
}
export function creaRospo (variante = 'rospo') {
  const v = ANFIBI[variante], rana = variante === 'rana'
  const g = new THREE.Group()
  const pelle = M(v.pelle, { flatShading: false, roughness: 0.55 }), scuro = M(v.scuro, { flatShading: false }), ventre = M(v.ventre, { flatShading: false })
  const verr = M(v.verruca, { flatShading: false }), gola = M(v.gola, { flatShading: false, roughness: 0.4 }), rosa = lucido(0xc8505a, { roughness: 0.3 })
  const corpo = perno(g, 0, 0.2, 0)
  sfera(corpo, 0.5, pelle, 0, 0.04, -0.02, rana ? 0.34 : 0.5, rana ? 0.3 : 0.38, rana ? 0.5 : 0.52, 16)
  sfera(corpo, 0.5, ventre, 0, -0.06, 0.03, rana ? 0.28 : 0.4, 0.2, 0.42, 12)
  // il dorso: verruche (rospo) o macchie nere (rana)
  const pos = [[-0.08, 0.17, -0.1], [0.1, 0.18, -0.06], [0.0, 0.2, -0.17], [-0.15, 0.1, 0.02], [0.16, 0.11, 0.02], [0.05, 0.19, 0.05], [-0.07, 0.19, 0.03], [0.14, 0.14, -0.18], [-0.15, 0.13, -0.17]]
  for (const [x, y, z] of pos) {
    if (rana) { sfera(corpo, 0.035, scuro, x * 0.8, 0.165 - (x * x + z * z) * 2.2, z, 1, 0.35, 1, 6) } else sfera(corpo, 0.026 + (x * 40 % 1 + 1) % 1 * 0.012, verr, x, y, z, 1, 0.8, 1, 6)
  }
  // la testa larga con la bocca da orecchio a orecchio
  const testa = perno(corpo, 0, 0.1, 0.22)
  sfera(testa, 0.5, pelle, 0, 0, 0.04, rana ? 0.3 : 0.4, 0.2, 0.34, 12)
  const mascella = perno(testa, 0, -0.03, 0.12)
  sfera(mascella, 0.5, ventre, 0, -0.01, 0.0, rana ? 0.26 : 0.36, 0.07, 0.3, 10)
  const golaSacca = sfera(mascella, 0.07, gola, 0, -0.04, 0.0, 1.2, 0.8, 1.1, 10)                  // la gola che pulsa
  sfera(mascella, 0.5, rosa, 0, 0.03, 0.01, rana ? 0.2 : 0.3, 0.03, 0.24, 8)                          // l'interno della bocca
  const occhi = []
  for (const s of [-1, 1]) {
    const o = occhio(testa, s * (rana ? 0.1 : 0.125), 0.12, 0.0, 0.058, v.occhi, { emis: 0.35, orizz: true, giro: s * 0.35 }); occhi.push(o)
    sfera(testa, 0.05, pelle, s * (rana ? 0.1 : 0.125), 0.1, -0.015, 1.2, 0.8, 1.1, 8)                // la palpebra carnosa
    if (!rana) sfera(testa, 0.05, scuro, s * 0.15, 0.1, -0.1, 0.8, 0.7, 1.7, 8)                       // le ghiandole dietro l'occhio
    sfera(testa, 0.011, scuro, s * 0.035, 0.035, 0.22, 1, 1, 1, 5)                                      // narici
  }
  // la lingua (sparata nell'attacco): un filo rosa col bottone appiccicoso
  const lingua = filo(mascella, 0.014, rosa, 6), punta1 = sfera(mascella, 0.03, rosa, 0, 0, 0, 1, 1, 1, 8)
  const origine = marker(mascella, 0, 0.0, 0.2)
  // le zampe: le posteriori ripiegate (coscia, stinco, piede palmato), le anteriori corte
  const post = [], ant = []
  for (const s of [-1, 1]) {
    const anca = perno(corpo, s * (rana ? 0.17 : 0.22), 0.0, -0.17); post.push(anca)
    sfera(anca, rana ? 0.08 : 0.1, pelle, 0, 0.02, 0, 1, 1.1, 1.3, 9)
    const gin = perno(anca, s * 0.04, 0.0, 0.0); sfera(gin, 0.05, pelle, 0, 0, 0, 1, 1, 1, 7)
    const co = perno(anca, 0, 0, 0); arto(co, [0, 0, 0], [0, -0.04, 0.2], 0.07, 0.045, pelle, 7, false); gin.position.set(0, -0.04, 0.2)
    const sti = perno(gin, 0, 0, 0); arto(sti, [0, 0, 0], [0, -0.04, -0.2], 0.045, 0.035, pelle, 7, false)
    const pie = perno(sti, 0, -0.04, -0.2)
    sfera(pie, 0.035, pelle, 0, 0, 0, 1, 1, 1, 6)
    for (let d = -1; d <= 1; d++) { const dt = cono(pie, 0.015, 0.14, ventre, d * 0.045, -0.0, 0.07, 4); dt.rotation.set(PI / 2 + 0.05, 0, d * -0.18); dt.scale.z = 0.5 }
    post[post.length - 1] = { anca, co, sti, pie }
    const br = perno(corpo, s * 0.14, 0.0, 0.2); ant.push(br)
    arto(br, [0, 0, 0], [0, -0.14, 0.02], 0.04, 0.032, pelle, 6, false)
    for (let d = -1; d <= 2; d++) cono(br, 0.012, 0.07, ventre, (d - 0.5) * 0.026, -0.17, 0.06, 4).rotation.x = PI / 2 + 0.2
  }
  g.scale.setScalar(v.scala)
  const pose = (T, F) => {
    const { c, k, a } = F
    const resp = onda(T, 3.6), salto = gesto(T, 6.7, 3.1, 0.7), mosca = gesto(T, 5.3, 0.6, 0.45)
    const acc = 0.05 * c                                                            // si accovaccia a molla
    corpo.position.set(0, 0.2 - acc + salto * 0.05 + 0.006 * resp, 0.5 * salto * 0.12 + k * 0.1)
    corpo.rotation.set(-0.04 * c + 0.18 * salto + 0.12 * k + 0.02 * onda(T, 1.1), onda(T, 0.5) * 0.08, onda(T, 0.9) * 0.025)
    corpo.scale.set(1 + 0.012 * resp, 1 + 0.025 * resp - 0.06 * c, 1)
    testa.rotation.set(0.05 + 0.35 * mosca - 0.1 * k + onda(T, 0.6) * 0.04 - 0.1 * c, onda(T, 0.45) * 0.25, onda(T, 0.8) * 0.05)
    const bocca = Math.max(0.0, mosca * 0.5 + a * 0.9)
    mascella.rotation.x = 0.02 + bocca * 0.5
    golaSacca.scale.set(1.2 + 0.25 * resp, 0.8 + 0.5 * Math.max(0, onda(T, 3.6)) + 0.5 * a, 1.1 + 0.2 * resp)
    const L = Math.max(mosca * 0.28, k * 1.0)                                           // lunghezza della lingua
    lingua.visible = punta1.visible = L > 0.02
    tendi(lingua, [0, 0.0, 0.1], [0, 0.0 + 0.08 * L, 0.1 + L]); punta1.position.set(0, 0.08 * L, 0.1 + L)
    post.forEach(({ anca, co, sti }, i) => {
      anca.rotation.set(-0.15 - 0.55 * salto * 0.0 + acc * 2.2 - 0.9 * k, 0, i ? -0.05 : 0.05)
      sti.rotation.x = 0.0 + salto * 0.7 + 0.5 * k
    })
    ant.forEach((b, i) => { b.rotation.set(-0.15 + 0.3 * k - 0.15 * c + onda(T, 0.9, i * 2) * 0.04 + (i ? mosca : 0) * 0.0, 0, 0) })
  }
  return vivente(g, pose, { tipo: rana ? 'sputo' : 'lingua', durata: 0.7, arrivo: 0.55, origine, proiettile: rana ? 'veleno' : null })
}

// ═════════════════════════════════════ L'AIRONE ═════════════════════════════════════
export function creaAirone () {
  const g = new THREE.Group()
  const grigio = M(0x8c9aa8, { flatShading: false, roughness: 0.7 }), chiaro = M(0xe8edf0, { flatShading: false }), scuro = M(0x2c3440, { flatShading: false })
  const giallo = M(0xe6b832, { flatShading: false, roughness: 0.4 }), zampa = M(0x6e6a3c, { flatShading: false })
  const corpo = perno(g, 0, 0.68, -0.02)
  sfera(corpo, 0.5, grigio, 0, 0, -0.02, 0.3, 0.36, 0.6, 14)
  sfera(corpo, 0.5, chiaro, 0, -0.04, 0.06, 0.24, 0.26, 0.4, 10)                                   // il petto chiaro
  cono(corpo, 0.12, 0.28, grigio, 0, 0.0, -0.4, 6).rotation.x = -PI / 2 - 0.2                      // la coda
  for (const s of [-1, 1]) {
    const ala = perno(corpo, s * 0.15, 0.04, -0.02); ala.userData.lato = s
    sfera(ala, 0.5, grigio, s * 0.02, -0.04, -0.02, 0.1, 0.34, 0.54, 12)
    sfera(ala, 0.5, scuro, s * 0.04, -0.1, -0.17, 0.07, 0.2, 0.28, 8)                              // le penne scure
    corpo.userData['ala' + s] = ala
  }
  // il collo a S: dieci pezzi sottili
  const spalla = perno(corpo, 0, 0.08, 0.22)
  const NC = 9, collo = catena(spalla, NC, 0.52, 0.045, 0.027, chiaro, 7, 1)
  collo[0].position.set(0, 0, 0)
  const capo = perno(collo[NC - 1], 0, 0.058, 0.0)
  sfera(capo, 0.05, chiaro, 0, 0.0, 0.0, 1.05, 0.95, 1.4, 10)
  sfera(capo, 0.036, scuro, -0.0, 0.03, -0.03, 1.3, 0.5, 2.6, 7)                                    // la striscia nera sopra l'occhio
  const becco = perno(capo, 0, -0.005, 0.06)
  const sopra = cono(becco, 0.03, 0.3, giallo, 0, 0, 0.15, 5); sopra.rotation.x = PI / 2
  const sotto = perno(becco, 0, -0.012, 0.0); const mand = cono(sotto, 0.024, 0.27, giallo, 0, 0, 0.13, 5); mand.rotation.x = PI / 2
  for (const s of [-1, 1]) occhio(capo, s * 0.04, 0.012, 0.03, 0.017, 0xf2c82a, { emis: 0.4, fessura: false, giro: s * 0.9 })
  for (let i = 0; i < 3; i++) cono(capo, 0.009, 0.2 - i * 0.03, scuro, 0, 0.03 - i * 0.01, -0.08 - i * 0.02, 4).rotation.x = -PI / 2 + 0.1 + i * 0.12  // il pennacchio
  for (let i = 0; i < 6; i++) cono(spalla, 0.014, 0.14, chiaro, (i - 2.5) * 0.015, -0.0, 0.02, 4).rotation.x = PI + 0.3                  // le penne del petto
  const origine = marker(becco, 0, 0, 0.3)
  // le zampe lunghe e sottili, ginocchio all'indietro
  const gambe = []
  for (const s of [-1, 1]) {
    const an = perno(g, s * 0.09, 0.66, 0)
    sfera(an, 0.032, grigio, 0, 0, 0, 1, 1.2, 1, 6)
    arto(an, [0, 0, 0], [0, -0.3, 0.0], 0.022, 0.015, zampa, 5, false)
    const gin = perno(an, 0, -0.3, 0); sfera(gin, 0.02, zampa, 0, 0, 0, 1, 1, 1, 6)
    arto(gin, [0, 0, 0], [0, -0.33, 0.0], 0.015, 0.011, zampa, 5, false)
    const pie = perno(gin, 0, -0.34, 0)
    for (let d = -1; d <= 1; d++) { const dt = cono(pie, 0.008, 0.12, zampa, d * 0.025, 0.0, 0.05, 4); dt.rotation.set(PI / 2 + 0.1, 0, d * -0.2) }
    const dp = cono(pie, 0.008, 0.07, zampa, 0, 0.0, -0.03, 4); dp.rotation.x = -PI / 2 - 0.1
    gambe.push({ an, gin, pie })
  }
  const curva = [0.75, -0.45, -0.55, -0.3, 0.05, 0.4, 0.5, 0.45, 0.3]                              // la forma a S del collo, per giunto (rad)
  const pose = (T, F) => {
    const { c, k, a } = F
    const resp = onda(T, 2.0), sollev = gesto(T, 8.2, 1.0, 2.6), beccata = gesto(T, 6.1, 4.6, 1.1), gira = onda(T, 0.45)
    const passo = sollev                                                           // alza la zampa destra e la posa avanti
    corpo.position.set(0, 0.68 + 0.012 * resp - 0.02 * passo + 0.015 * onda(T, 1.2), -0.02 - 0.06 * k * 0 + 0.02 * onda(T, 0.7))
    corpo.rotation.set(0.06 * resp * 0.3 + 0.1 * c - 0.1 * k + 0.12 * beccata, 0.05 * gira, 0.03 * onda(T, 0.6) + 0.06 * passo)
    const ricurva = 1 + 0.55 * c                                                     // nella carica il collo si ripiega a molla
    const stira = Math.max(k, 0.25 * beccata)                                        // lo scatto lo stende in avanti e in basso
    collo.forEach((p, i) => {
      const u = i / (NC - 1)
      const base = curva[i] * ricurva
      const strike = (i < 3 ? 0.5 : i < 6 ? -0.25 : -0.6) * stira * 1.0 + (1.5 * k * (i === 0 ? 1 : 0))
      p.rotation.set(base * (1 - 0.45 * stira) + strike + 0.025 * onda(T, 1.1, i * 0.6) - (beccata * 0.5 * (i === 0)), 0.04 * onda(T, 0.8, i * 0.4) * (i > 3), 0.0)
    })
    const tot = collo.reduce((s, p) => s + p.rotation.x, 0)
    capo.rotation.set(-tot + 0.08 + 0.15 * k + 0.1 * onda(T, 0.9), 0.22 * gira + 0.35 * gesto(T, 5.1, 0.2, 1.4) * onda(T, 3), 0.18 * gesto(T, 5.1, 0.2, 1.4))
    becco.rotation.x = 0.0
    sotto.rotation.x = 0.03 + 0.38 * a + 0.12 * beccata
    const sp = corpo.userData
    for (const s of [-1, 1]) {
      const ala = sp['ala' + s]; const sbatte = gesto(T, 9.3, 5.5, 0.9)
      ala.rotation.set(0.05 * resp, 0, s * (0.05 + 0.5 * sbatte * Math.abs(Math.sin(T * 14)) + 0.2 * k))
    }
    gambe.forEach(({ an, gin, pie }, i) => {
      const su = i ? passo : 0
      an.rotation.x = -0.9 * su - 0.04 * onda(T, 0.7, i * 3); gin.rotation.x = 1.5 * su; pie.rotation.x = -0.4 * su
    })
    spalla.position.set(0, 0.08, 0.22)
  }
  return vivente(g, pose, { tipo: 'beccata', durata: 0.65, arrivo: 0.55, origine })
}

// ═════════════════════════════════════ LA MELMA DI PALUDE ═════════════════════════════════════
export function creaMelmaPalude () {
  const g = new THREE.Group()
  const gel = new THREE.MeshStandardMaterial({ color: 0x5e8c36, roughness: 0.15, transparent: true, opacity: 0.8, emissive: 0x2c4a14, emissiveIntensity: 0.5 })
  const fondo = M(0x2d3a1c, { flatShading: false, roughness: 0.9 }), alga = M(0x3d6a2c, { flatShading: false, side: THREE.DoubleSide })
  const corpo = perno(g, 0, 0, 0)
  const pozza = sfera(g, 0.5, fondo, 0, 0.012, 0, 0.62, 0.02, 0.62, 16)
  const cupola = sfera(corpo, 0.5, gel, 0, 0.26, 0, 0.5, 0.52, 0.5, 18)
  // dentro: un po' di roba inghiottita, che si vede in trasparenza
  const dentro = perno(corpo, 0, 0.22, 0)
  sfera(dentro, 0.06, lucido(0xe8dcc0), 0.06, 0.04, 0.0, 1.1, 0.9, 0.9, 8)                                   // un teschio di rana
  for (let i = 0; i < 4; i++) cono(dentro, 0.008, 0.1, M(0xe8dcc0), -0.1 + i * 0.03, -0.02, 0.05, 4).rotation.z = 1.4 + i * 0.1       // lische
  const stivale = scatola(dentro, 0.08, 0.1, 0.05, M(0x5a3c24), -0.12, 0.0, -0.08); stivale.rotation.z = 0.4
  const nucleo = sfera(corpo, 0.04, lumProprio(0xc8f060, 1.2), -0.02, 0.2, -0.03, 1, 1, 1, 8)
  // le canne di palude che spuntano dalla testa, con il pennacchio marrone, e un ciuffo d'alghe che pende
  const canne = []
  for (const [x, z, h, inc] of [[-0.12, -0.05, 0.62, -0.12], [0.05, -0.1, 0.78, 0.08], [0.14, 0.02, 0.55, 0.2], [-0.03, 0.08, 0.4, -0.05]]) {
    const cp = perno(corpo, x, 0.42, z); cp.rotation.z = inc
    cil(cp, 0.007, 0.011, h, M(0x6a8a3a), 0, h / 2 - 0.1, 0, 5)
    cil(cp, 0.02, 0.02, h * 0.28, M(0x5a3a1c, { flatShading: false }), 0, h - 0.1 - 0.0, 0, 7)
    cono(cp, 0.012, 0.07, M(0x5a3a1c), 0, h + 0.07 - 0.1 + 0.0, 0, 5)
    canne.push(cp)
  }
  const fili = []
  for (let i = 0; i < 4; i++) { const f = perno(corpo, -0.16 + i * 0.1, 0.44, 0.16 - i * 0.04); const s = scatola(f, 0.04, 0.2, 0.004, alga, 0, -0.1, 0); fili.push(f) }
  // occhi e bocca
  const occhi = [-1, 1].map(s => occhio(corpo, s * 0.1, 0.3, 0.2, 0.05, 0xf4e8a0, { emis: 0.4, pupilla: 0x1c2a0c }))
  const bocca = perno(corpo, 0, 0.18, 0.22)
  sfera(bocca, 0.06, M(0x1c2a0c, { flatShading: false }), 0, 0, 0, 1.6, 0.5, 0.4, 8)
  const bolle = []
  for (let i = 0; i < 4; i++) bolle.push(sfera(corpo, 0.03, lucido(0xcff0a0, { transparent: true, opacity: 0.55 }), 0, 0, 0, 1, 1, 1, 8))
  const origine = marker(bocca, 0, 0, 0.1)
  const pose = (T, F) => {
    const { c, k, a } = F
    const bounce = Math.abs(onda(T, 3.6 * 0.5 + 0.3)) , sdr = gesto(T, 6.0, 1.3, 1.6)
    const sx = 1 + 0.1 * (1 - bounce) - 0.03 * sdr + 0.2 * c - 0.12 * k, sy = 1 + 0.14 * bounce + 0.15 * sdr - 0.25 * c + 0.1 * k
    corpo.scale.set(sx, sy, sx + 0.35 * k + 0.05 * (1 - bounce)); corpo.position.set(0.0, 0.0, 0.14 * k - 0.02 * c)
    corpo.rotation.set(-0.06 * c + 0.12 * k, onda(T, 0.4) * 0.12, onda(T, 1.3) * 0.04)
    pozza.scale.set(0.62 * (1 + 0.1 * bounce), 0.02, 0.62 * (1 + 0.1 * bounce))
    canne.forEach((cp, i) => { cp.rotation.z = [-0.12, 0.08, 0.2, -0.05][i] + onda(T, 1.1, i * 1.6) * 0.07 + 0.1 * k * (i - 1.5); cp.rotation.x = onda(T, 0.9, i) * 0.05 })
    fili.forEach((f, i) => { f.rotation.set(0.1 + onda(T, 1.4, i) * 0.12 + 0.3 * k, 0, onda(T, 1.0, i * 2) * 0.1) })
    dentro.rotation.y = onda(T, 0.5) * 0.4; dentro.position.y = 0.22 + onda(T, 0.9) * 0.012
    nucleo.material.emissiveIntensity = 1.0 + 0.5 * onda(T, 2)
    bocca.scale.set(1 + 0.4 * a, 1 + 1.6 * a + 0.2 * sdr, 1)
    bolle.forEach((b, i) => {
      const u = ((T * 0.25 + i * 0.27) % 1), r = 0.2 + i * 0.07
      b.position.set(Math.sin(i * 2.4) * 0.14, 0.04 + u * 0.4, Math.cos(i * 2.4) * 0.12 - 0.04); b.scale.setScalar((0.5 + u) * (u > 0.93 ? 0.1 : 1))
    })
  }
  return vivente(g, pose, { tipo: 'schizzo', durata: 0.65, arrivo: 0.5, origine, proiettile: 'melma' })
}

// ═════════════════════════════════════ I BRIGANTI (dell'accampamento) ═════════════════════════════════════
/** Porta un valore dalla posa base verso la posa di carica (c) e di colpo (k). */
const tra = (base, car, col, c, k) => base + (car - base) * c + (col - base) * k
const FERRO = 0xa8b0b8
function coltello (g, lung = 0.36, lama = FERRO, manico = 0x4a3020) {
  const w = new THREE.Group()
  const mf = M(lama, { roughness: 0.35, metalness: 0.6 })
  scatola(w, 0.04, 0.12, 0.04, M(manico), 0, 0.03, 0)
  scatola(w, 0.14, 0.025, 0.05, M(0x6a5a3a, { metalness: 0.4 }), 0, -0.035, 0)
  const bl = scatola(w, 0.045, lung, 0.014, mf, 0, -0.035 - lung / 2, 0)
  punta(w, [0, -0.035 - lung, 0], [0, -0.035 - lung - 0.09, 0], 0.025, mf, 4).scale.z = 0.3
  w.rotation.x = PI                                                              // la lama prolunga l'avambraccio
  return w
}
function sciabola (g) {
  const w = new THREE.Group(), mf = M(0xc8d0d8, { roughness: 0.3, metalness: 0.7 })
  scatola(w, 0.045, 0.16, 0.045, M(0x3a2418), 0, 0.04, 0)
  sfera(w, 0.04, M(0xc8a030, { metalness: 0.6, roughness: 0.4 }), 0, 0.13, 0, 1, 1, 1, 8)
  scatola(w, 0.15, 0.03, 0.07, M(0xc8a030, { metalness: 0.6, roughness: 0.4 }), 0, -0.045, 0)
  const lama = perno(w, 0, -0.06, 0)
  for (let i = 0; i < 6; i++) { const u = i / 6; const b = scatola(lama, 0.06 + u * 0.03, 0.14, 0.014, mf, 0, -0.07 - i * 0.135, u * u * 0.07); b.rotation.x = -u * 0.28 }
  punta(lama, [0, -0.88, 0.1], [0, -0.99, 0.15], 0.04, mf, 4).scale.z = 0.3
  w.rotation.x = PI
  return w
}
const volto = (testa, tela, occhiColor = 0xf2e6c0) => {
  for (const s of [-1, 1]) {
    occhio(testa, s * 0.075, 0.025, 0.16, 0.035, occhiColor, { emis: 0.1, giro: s * 0.2 })
    scatola(testa, 0.09, 0.022, 0.03, M(NERO_PELLE), s * 0.075, 0.075, 0.175).rotation.z = s * -0.3   // sopracciglio severo
  }
}
const NERO_PELLE = 0x2a1c14

export function creaBrigante (variante = 0) {
  const capo = variante === 1
  const P = umano({
    pelle: capo ? 0xb8805a : 0xc8956a, veste: capo ? 0x7a2230 : 0x5a3c26, calzoni: capo ? 0x2c2c3a : 0x3a3a44, scarpa: 0x2a1a10,
    gamba: capo ? 0.4 : 0.36, busto: capo ? [0.44, 0.44, 0.27] : [0.34, 0.38, 0.21], testa: capo ? 0.23 : 0.21, braccio: capo ? 0.34 : 0.3, gr: capo ? 0.058 : 0.05, sg: capo ? 0.07 : 0.062
  })
  const { g, busto, testa, bracci, gomiti, mani, gambe } = P
  const pelle = M(capo ? 0xb8805a : 0xc8956a, { flatShading: false })
  const cuoio = M(0x3c2616), tela = M(capo ? 0xc8a030 : 0x7a2a2a, { flatShading: false, side: THREE.DoubleSide }), verde = M(capo ? 0x2a2a34 : 0x39482c, { flatShading: false, side: THREE.DoubleSide })
  const bw = capo ? 0.44 : 0.34, bh = capo ? 0.44 : 0.38
  // il cappuccio (brigante) o il tricorno con la piuma (capo), il fazzoletto sul naso, il bendaggio all'occhio
  volto(testa, tela)
  const faz = sfera(testa, 0.5, tela, 0, -0.075, 0.075, 0.43, 0.18, 0.42, 12)
  scatola(testa, 0.012, 0.09, 0.012, tela, -0.12, -0.07, -0.02).rotation.z = 0.0
  if (!capo) {
    const cap = sfera(testa, 0.23, verde, 0, 0.07, -0.08, 1.02, 0.95, 1.0, 12)
    cono(testa, 0.14, 0.3, verde, 0, 0.12, -0.2, 7).rotation.x = -1.15                       // la punta del cappuccio che cade dietro
    sfera(testa, 0.11, M(0x1a140f), 0, 0.14, 0.14, 1.2, 0.5, 0.35, 8)                         // l'ombra sulla fronte
  } else {
    sfera(testa, 0.5, tela, 0, 0.11, 0.0, 0.5, 0.18, 0.5, 12)                                // il fazzoletto in testa
    const tri = perno(testa, 0, 0.19, 0.0)
    cil(tri, 0.31, 0.31, 0.03, M(0x2a1c26), 0, 0.0, 0, 3).rotation.y = 0.5
    cil(tri, 0.19, 0.2, 0.12, M(0x2a1c26), 0, 0.07, 0, 9)
    const piuma = cono(tri, 0.03, 0.34, M(0xd23a2a, { flatShading: false }), 0.12, 0.2, -0.1, 5); piuma.rotation.z = -0.9; piuma.rotation.x = -0.4
    for (let i = 0; i < 3; i++) sfera(testa, 0.03, M(0xc8a030, { metalness: 0.7, roughness: 0.3 }), 0.0, 0.24, 0.0, 0.01, 0.01, 0.01, 4)
    const benda = scatola(testa, 0.1, 0.1, 0.02, M(0x151010), 0.075, 0.03, 0.19); sfera(testa, 0.05, M(0x151010), 0.075, 0.03, 0.185, 1, 1, 0.3, 8)
    scatola(testa, 0.4, 0.016, 0.02, M(0x151010), 0.0, 0.1, 0.15).rotation.z = -0.25
    cono(testa, 0.014, 0.1, M(0x2a1a10), 0.07, -0.12, 0.22, 4).rotation.x = PI                // il pizzetto
  }
  // la cintura, la borsa dei soldi, il coltello alla cintola, la sacca sulla schiena (o le monete al collo del capo)
  cil(busto, 0.5, 0.5, 0.05, cuoio, 0, 0.04, 0, 14).scale.set(bw * 1.02, 1, capo ? 0.27 : 0.21)
  scatola(busto, 0.06, 0.06, 0.03, M(0xc8a030, { metalness: 0.7, roughness: 0.3 }), 0, 0.04, bw * 0.28)
  const borsa = sfera(busto, 0.06, M(0x6a4a2a, { flatShading: false }), bw * 0.4, 0.0, 0.1, 1, 1.1, 0.9, 8)
  cono(busto, 0.02, 0.06, cuoio, bw * 0.4, 0.07, 0.1, 5)
  const sacca = sfera(busto, 0.16, M(0x6a5a3a, { flatShading: false }), 0.0, bh * 0.52, -bw * 0.38, 1, 1.15, 0.8, 9)
  scatola(busto, 0.05, bh * 1.0, 0.012, cuoio, 0.0, bh * 0.5, bw * 0.0 + 0.0).rotation.z = 0.0
  for (const s of [-1, 1]) { const tr = scatola(busto, 0.04, bh * 1.15, 0.022, cuoio, s * bw * 0.18, bh * 0.52, bw * 0.28 * 0.0 + 0.11); tr.rotation.z = s * 0.45 }   // le bretelle di cuoio
  if (capo) for (let i = 0; i < 5; i++) { const a = i / 4 * PI; cil(busto, 0.018, 0.018, 0.008, M(0xe0b838, { metalness: 0.7, roughness: 0.3 }), Math.cos(a) * 0.11 - 0.0, bh * 0.82 - Math.sin(a) * 0.06 - 0.02, 0.13, 8).rotation.x = PI / 2 }   // monete al collo
  if (capo) for (let i = 0; i < 4; i++) sfera(busto, 0.022, M(0xe0b838, { metalness: 0.7, roughness: 0.3 }), -0.15 + i * 0.07, bh * 0.45, 0.14, 1, 1, 0.5, 6)  // bottoni d'oro
  // il mantello da brigante: due lembi ai lati del collo
  if (capo) { const m = scatola(busto, bw * 1.15, bh * 1.2, 0.02, M(0x3a1a26, { flatShading: false, side: THREE.DoubleSide }), 0, bh * 0.45, -bw * 0.4); m.rotation.x = 0.08 }
  // l'arma: coltello (brigante) o sciabola (capo) nella mano destra (indice 1); nella sinistra niente o il pugno
  const arma = capo ? sciabola() : coltello()
  mani[1].add(arma)
  for (const s of [-1, 1]) sfera(mani[s < 0 ? 0 : 1], 0.05 * (capo ? 1.1 : 1), cuoio, 0, 0.005, 0, 1, 0.8, 1, 7)            // i guanti
  const origine = marker(arma, 0, capo ? -1.0 : -0.38, 0)
  const sc = capo ? 1.08 : 1
  g.scale.setScalar(sc)
  const pose = (T, F) => {
    const { c, k } = F
    const resp = onda(T, 2.4), peso = onda(T, 0.7), occhio1 = gesto(T, 5.8, 1, 1.5), tic = gesto(T, 7.2, 4, 0.8)
    g.position.set(0, 0, 0.3 * k - 0.04 * c); g.rotation.y = onda(T, 0.5) * 0.06 + 0.12 * c - 0.2 * k * (capo ? 0 : 1)
    busto.position.y = P.gamba + 0.012 * Math.abs(onda(T, 3)) + 0.01 * resp - 0.03 * c
    busto.rotation.set(0.1 + 0.02 * resp - 0.25 * c + 0.45 * k * (capo ? 0.5 : 1), 0.07 * peso + (capo ? -0.5 * c + 0.7 * k : 0.2 * c - 0.3 * k), 0.04 * peso)
    testa.rotation.set(0.05 + 0.1 * c - 0.15 * k + onda(T, 0.6) * 0.04, onda(T, 0.4) * 0.3 + 0.5 * occhio1 * onda(T, 3) - 0.1 * k, 0.05 * occhio1)
    // la guardia: pugnale basso e pronto, l'altro pugno alzato; ogni tanto ruota il polso e lo guarda
    if (capo) {
      bracci[1].rotation.set(tra(-1.0, -2.7, -0.5, c, k) + onda(T, 1.6) * 0.04, 0.0, tra(0.25, 0.1, -0.15, c, k)); gomiti[1].rotation.x = tra(-0.9, -0.8, -0.25, c, k) + onda(T, 2.2) * 0.07 - tic * 0.5
      mani[1].rotation.set(0.0, 0.0, 0.0)
    } else {
      bracci[1].rotation.set(tra(-0.65, -0.25, -1.45, c, k) + onda(T, 1.6) * 0.04, 0.0, tra(0.25, 0.15, 0.0, c, k)); gomiti[1].rotation.x = tra(-0.95, -1.9, -0.12, c, k) + onda(T, 2.2) * 0.08 - tic * 0.7
    }
    bracci[0].rotation.set(tra(-0.5, -0.9, -0.3, c, k) + onda(T, 1.9, 1) * 0.04, 0, tra(-0.35, -0.4, -0.5, c, k)); gomiti[0].rotation.x = tra(-1.25, -1.0, -0.7, c, k) + onda(T, 2.5, 2) * 0.06
    gambe[0].rotation.x = -0.1 + onda(T, 3) * 0.04 - peso * 0.04 + 0.35 * k * 0 - 0.7 * k * (capo ? 0 : 1) + 0.3 * c
    gambe[1].rotation.x = 0.12 - onda(T, 3) * 0.04 + peso * 0.04 + (capo ? -0.5 : 0.5) * k * 0.7 - 0.2 * c
  }
  return vivente(g, pose, { tipo: capo ? 'fendente' : 'pugnalata', durata: capo ? 0.85 : 0.7, arrivo: capo ? 0.6 : 0.55, origine })
}

export function creaBriganteArciere () {
  const P = umano({ pelle: 0xc08a60, veste: 0x4c5a38, calzoni: 0x3a3028, scarpa: 0x2a1a10, gamba: 0.35, busto: [0.33, 0.37, 0.2], testa: 0.2, braccio: 0.3, gr: 0.046, sg: 0.06 })
  const { g, busto, testa, bracci, gomiti, mani, gambe } = P
  const cuoio = M(0x3c2616), verde = M(0x2f4224, { flatShading: false, side: THREE.DoubleSide }), tela = M(0x8a3a2a, { flatShading: false, side: THREE.DoubleSide })
  volto(testa, tela)
  sfera(testa, 0.5, tela, 0, -0.075, 0.075, 0.43, 0.18, 0.42, 12)
  sfera(testa, 0.23, verde, 0, 0.07, -0.08, 1.02, 0.95, 1.0, 12)
  cono(testa, 0.14, 0.3, verde, 0, 0.12, -0.2, 7).rotation.x = -1.15
  sfera(testa, 0.11, M(0x1a140f), 0, 0.14, 0.14, 1.2, 0.5, 0.35, 8)
  cil(busto, 0.5, 0.5, 0.045, cuoio, 0, 0.04, 0, 14).scale.set(0.34, 1, 0.2)
  // la faretra con le frecce sulla schiena, la bretella a tracolla
  const far = cil(busto, 0.065, 0.055, 0.34, M(0x5a3a22, { flatShading: false }), 0.07, 0.3, -0.16, 9); far.rotation.set(-0.1, 0, 0.3)
  for (let i = 0; i < 4; i++) { const f = cil(busto, 0.006, 0.006, 0.12, M(0xd8c898), 0.02 + i * 0.03, 0.54, -0.17, 4); f.rotation.z = 0.3; cono(busto, 0.02, 0.05, M(0xc83a2a), 0.045 + i * 0.03, 0.605, -0.17, 4).rotation.z = 0.3 }
  const tr = scatola(busto, 0.04, 0.5, 0.02, cuoio, 0.0, 0.2, 0.0); tr.position.z = 0.1; tr.rotation.z = 0.7
  for (const s of [-1, 1]) sfera(mani[s < 0 ? 0 : 1], 0.05, cuoio, 0, 0.005, 0, 1, 0.8, 1, 7)
  // l'arco: nella sinistra, un arco ricurvo con la corda che si tende fino alla guancia
  const arcoG = perno(mani[0], 0, -0.02, 0); arcoG.rotation.x = PI / 2
  const R = 0.45, ang = 1.7
  const geo = new THREE.TorusGeometry(R, 0.016, 5, 16, ang); geo.rotateZ(-ang / 2); geo.rotateY(-PI / 2)
  const arcoM = new THREE.Mesh(geo, M(0x6a4422, { flatShading: false })); arcoM.castShadow = true; arcoM.position.z = -R; arcoG.add(arcoM)
  scatola(arcoG, 0.045, 0.12, 0.05, cuoio, 0, 0, 0)
  const punteY = R * Math.sin(ang / 2), punteZ = R * Math.cos(ang / 2) - R
  const corda1 = filo(arcoG, 0.004, M(0xe8e0c8), 4), corda2 = filo(arcoG, 0.004, M(0xe8e0c8), 4)
  const freccia = perno(arcoG, 0, 0, 0)
  const asta = cil(freccia, 0.007, 0.007, 0.7, M(0xd8c898), 0, 0, 0.36, 5); asta.rotation.x = PI / 2
  const ferro = cono(freccia, 0.02, 0.08, M(FERRO, { metalness: 0.6 }), 0, 0, 0.74, 4); ferro.rotation.x = PI / 2
  for (let i = 0; i < 2; i++) { const pm = scatola(freccia, 0.002, 0.05, 0.1, M(0xc83a2a, { side: THREE.DoubleSide }), 0, 0, 0.05 + i * 0.01); pm.rotation.z = i * PI / 2 }
  const origine = marker(freccia, 0, 0, 0.78)
  const pose = (T, F) => {
    const { c, k } = F
    const resp = onda(T, 2.4), peso = onda(T, 0.7), occhi1 = gesto(T, 5.5, 1.5, 1.5)
    const tira = Math.max(c, 0) * 1.0                                                  // quanto è tesa la corda
    g.position.set(0, 0, -0.03 * c); g.rotation.y = onda(T, 0.5) * 0.05 - 0.45 * c - 0.1 * k + 0.0
    busto.position.y = P.gamba + 0.01 * Math.abs(onda(T, 3)) + 0.01 * resp
    busto.rotation.set(0.05 + 0.02 * resp - 0.1 * c, 0.1 * peso + 0.5 * c * 0.0, 0.04 * peso + 0.05 * k)
    testa.rotation.set(0.05 - 0.05 * c + onda(T, 0.6) * 0.04, onda(T, 0.4) * 0.3 * (1 - c) + 0.45 * c + 0.2 * occhi1 * onda(T, 2), 0.03 * peso - 0.1 * c)
    // guardia: arco basso alla sinistra, freccia in mano; poi il braccio sinistro si tende in avanti e il destro tira
    bracci[0].rotation.set(tra(-0.7, -1.45, -1.5, c, k) + onda(T, 1.7) * 0.03, tra(0, 0, 0, c, k), tra(-0.35, -0.12, -0.1, c, k)); gomiti[0].rotation.x = tra(-0.7, -0.05, -0.1, c, k)
    bracci[1].rotation.set(tra(-0.85, -1.4, -1.0, c, k) + onda(T, 1.5, 1) * 0.03, tra(0, -0.75, 0.0, c, k) * 1, tra(0.35, 0.95, 0.5, c, k)); gomiti[1].rotation.x = tra(-1.2, -2.3, -0.9, c, k)
    arcoG.rotation.x = PI / 2 - 0.3 * (1 - c) * 0.0
    // la corda: dalle due punte al punto di incocco, che si tira indietro nella carica e scatta in avanti al colpo
    const z = punteZ - 0.34 * c
    tendi(corda1, [0, punteY, punteZ], [0, 0, z]); tendi(corda2, [0, -punteY, punteZ], [0, 0, z])
    freccia.position.set(0, 0, z - 0.02); freccia.visible = k < 0.5
    freccia.rotation.set(0, 0, 0)
    gambe[0].rotation.x = -0.1 + onda(T, 3) * 0.04 - peso * 0.04; gambe[1].rotation.x = 0.1 - onda(T, 3) * 0.04 + peso * 0.04 + 0.2 * c
  }
  return vivente(g, pose, { tipo: 'freccia', durata: 0.9, arrivo: 0.62, origine, proiettile: 'freccia' })
}


// ═════════════════════════════════════ IL COCCODRILLO ═════════════════════════════════════
export function creaCoccodrillo () {
  const g = new THREE.Group()
  const dorso = M(0x4d6a30, { flatShading: false, roughness: 0.6 }), scuro = M(0x2c4220, { flatShading: false }), ventre = M(0xc2b878, { flatShading: false })
  const scudo = M(0x3a5224), avorio = M(0xf0e8c8), bocca = M(0xd8707a, { flatShading: false, roughness: 0.4 })
  const NB = 9, NT = 10, N = NB + NT, segs = [], ztesta = 0.78
  const spessore = i => i < NB ? 0.15 + 0.03 * Math.sin(i / (NB - 1) * PI) : 0.17 * (1 - (i - NB) / NT) + 0.02
  for (let i = 0; i < N; i++) {
    const r = spessore(i), sg = new THREE.Group(), h = i < NB ? 0.17 : 0.14
    sfera(sg, r, i % 2 ? dorso : scuro, 0, r * 0.1, 0, 1.1, 0.8, h / r * 1.3, 9)
    sfera(sg, r * 0.8, ventre, 0, -r * 0.35, 0, 0.9, 0.5, h / r * 1.1, 6)
    cono(sg, r * 0.32, r * 0.7, scudo, 0, r * 0.82, 0, 4)
    for (const s of [-1, 1]) cono(sg, r * 0.2, r * 0.45, scudo, s * r * 0.62, r * 0.55, 0, 4).rotation.z = -s * 0.5
    g.add(sg); segs.push(sg)
  }
  // la testa: cranio con le arcate degli occhi, muso lungo, mascella che si apre, denti disuguali
  const testa = perno(g, 0, 0.17, ztesta)
  sfera(testa, 0.5, dorso, 0, 0.0, 0.1, 0.25, 0.17, 0.46, 12)
  sfera(testa, 0.5, dorso, 0, -0.02, 0.4, 0.17, 0.11, 0.62, 12)
  sfera(testa, 0.04, scuro, 0, 0.025, 0.7, 1.2, 0.8, 1.1, 7)                                           // la protuberanza del naso
  for (const s of [-1, 1]) {
    sfera(testa, 0.035, scuro, s * 0.025, 0.045, 0.69, 1, 1, 1, 6)
    occhio(testa, s * 0.095, 0.1, 0.04, 0.036, 0xf0c030, { emis: 0.8, fessura: true, giro: s * 0.4 })
    sfera(testa, 0.05, dorso, s * 0.095, 0.085, 0.03, 1.1, 0.8, 1.5, 8)                              // l'arcata
    for (let d = 0; d < 7; d++) cono(testa, 0.01, 0.045, avorio, s * (0.06 - d * 0.0035 + (d > 3 ? 0.012 : 0)), -0.055, 0.2 + d * 0.085, 4).rotation.x = PI
  }
  const mascella = perno(testa, 0, -0.04, 0.0)
  sfera(mascella, 0.5, ventre, 0, -0.02, 0.35, 0.2, 0.07, 0.72, 10)
  sfera(mascella, 0.5, bocca, 0, 0.03, 0.33, 0.15, 0.03, 0.62, 8)
  for (const s of [-1, 1]) for (let d = 0; d < 7; d++) cono(mascella, 0.011, 0.05 + (d % 2) * 0.02, avorio, s * 0.065, 0.05, 0.14 + d * 0.085, 4)
  const origine = marker(testa, 0, 0, 0.7)
  // le zampe: coscia che esce di lato, stinco che scende, piede con quattro dita
  const zampe = []
  for (const [zz, ii] of [[0.5, 1], [-0.28, NB - 2]]) for (const s of [-1, 1]) {
    const an = perno(g, s * 0.16, 0.14, zz); const r = zz > 0 ? 0.052 : 0.06
    arto(an, [0, 0, 0], [s * 0.12, -0.02, 0.02], r, r * 0.8, dorso, 7, true)
    const gi = perno(an, s * 0.12, -0.02, 0.02)
    arto(gi, [0, 0, 0], [s * 0.04, -0.1, 0.02], r * 0.8, r * 0.65, dorso, 7, false)
    const pie = perno(gi, s * 0.04, -0.11, 0.02)
    sfera(pie, r * 0.8, scuro, 0, 0.0, 0.02, 1.2, 0.5, 1.5, 7)
    for (let d = -1; d <= 1; d++) cono(pie, 0.012, 0.07, avorio, d * 0.035, -0.0, 0.1, 4).rotation.x = PI / 2
    zampe.push({ an, gi, s, zz })
  }
  const pose = (T, F) => {
    const { c, k, a } = F
    const resp = onda(T, 1.9), sbad = gesto(T, 7.5, 2.0, 1.6), coda = gesto(T, 5.2, 0.5, 1.2)
    const amp = 0.07 + 0.08 * coda + 0.15 * c                                               // quanto serpeggia il corpo
    const P = segs.map((_, i) => {
      const u = i / (N - 1), peso = Math.pow(u, 1.3), r = spessore(i)
      const z = ztesta - 0.12 - i * (i < NB ? 0.135 : 0.14) + k * 0.55 * (1 - u * 0.6) - c * 0.1 * (1 - u)
      const x = Math.sin(u * 5.5 - T * 1.3) * amp * (0.2 + peso) + c * 0.12 * u + onda(T, 0.4) * 0.03 + (coda * 0.18 + k * -0.12) * u * u
      const y = r * 0.82 + 0.008 * resp * (1 - u) + (i < 3 ? (0.05 * c + 0.03 * sbad) * (1 - i / 3) : 0) - k * 0.02 * (1 - u)
      return [x, y, z]
    })
    segs.forEach((sg, i) => {
      sg.position.set(...P[i])
      const A = P[Math.max(0, i - 1)], B = P[Math.min(N - 1, i + 1)]
      sg.quaternion.setFromUnitVectors(new V3(0, 0, 1), new V3(A[0] - B[0], A[1] - B[1], A[2] - B[2]).normalize())
    })
    testa.position.set(P[0][0] + 0.0, 0.17 + 0.05 * c - 0.03 * k + 0.012 * resp, P[0][2] + 0.1)
    testa.rotation.set(-0.15 * c - 0.45 * sbad * 0.3 + 0.12 * k + onda(T, 0.8) * 0.03 - 0.5 * a * 0.4, onda(T, 0.5) * 0.18 + 0.2 * sbad * onda(T, 4), onda(T, 0.7) * 0.03)
    mascella.rotation.x = 0.02 + 0.06 * Math.max(0, onda(T, 0.6)) + 0.1 * sbad + 0.85 * a + 0.0
    zampe.forEach(({ an, gi, s, zz }, i) => { an.position.y = 0.14 + 0.012 * resp; an.rotation.set(0.12 * onda(T, 0.9, i * 1.7) * 0.5 + (zz > 0 ? 0.35 * k : -0.1 * k), 0, s * (0.02 - 0.12 * c)); gi.rotation.x = -0.06 * c })
    segs[0].position.y += 0.0
    for (let i = 0; i < 0; i++);
  }
  return vivente(g, pose, { tipo: 'morso', durata: 0.75, arrivo: 0.55, origine })
}

// ═════════════════════════════════════ IL PESCATORE NON MORTO ═════════════════════════════════════
export function creaPescatoreMorto () {
  const P = umano({ pelle: 0x7e9c8c, veste: 0x9a8a30, calzoni: 0x2a3838, scarpa: 0x1c2a22, gamba: 0.38, busto: [0.38, 0.42, 0.24], testa: 0.21, braccio: 0.32, gr: 0.052, sg: 0.065 })
  const { g, busto, testa, bracci, gomiti, mani, gambe } = P
  const pelle = M(0x7e9c8c, { flatShading: false }), alga = M(0x1e3a22, { flatShading: false, side: THREE.DoubleSide }), giallo = M(0x9a8a30, { flatShading: false, side: THREE.DoubleSide })
  const guscio = M(0xb8b4a0), buio = M(0x14201c), ruggine = M(0x7a4a32, { roughness: 0.6, metalness: 0.4 }), legno = M(0x5a4430)
  const luceOcchi = lumProprio(0x6ffff0, 2.2)
  // la faccia: occhi di luce acquosa, bocca aperta, guance infossate, barba d'alga
  for (const s of [-1, 1]) {
    const o = perno(testa, s * 0.075, 0.025, 0.16); o.userData.occhio = true
    sfera(o, 0.04, luceOcchi, 0, 0, 0, 1, 0.8, 0.6, 8); sfera(testa, 0.055, buio, s * 0.075, 0.025, 0.14, 1, 1.1, 0.5, 8)
  }
  const mascella = perno(testa, 0, -0.1, 0.08)
  sfera(mascella, 0.075, buio, 0, 0, 0.06, 1.3, 0.5, 1.0, 8)
  for (const x of [-0.05, -0.015, 0.02, 0.055]) cono(mascella, 0.012, 0.04, guscio, x, 0.025, 0.1, 4)
  cono(testa, 0.03, 0.06, pelle, 0, -0.03, 0.2, 4).rotation.x = 1.2
  // il sudario d'alghe: capelli e barba a strisce che pendono, un cappello da pescatore di tela cerata
  const strisce = []
  for (let i = 0; i < 7; i++) { const f = perno(testa, -0.15 + i * 0.05, 0.02, -0.02 - Math.abs(i - 3) * 0.015); scatola(f, 0.04, 0.22 + (i & 1) * 0.08, 0.006, alga, 0, -0.11, 0); strisce.push(f) }
  for (let i = 0; i < 3; i++) { const f = perno(testa, -0.05 + i * 0.05, -0.14, 0.15); scatola(f, 0.03, 0.14, 0.006, alga, 0, -0.07, 0); strisce.push(f) }
  const cap = perno(testa, 0, 0.12, 0)
  cil(cap, 0.3, 0.3, 0.025, giallo, 0, 0.0, 0.02, 12).scale.set(1, 1, 1.25)
  sfera(cap, 0.2, giallo, 0, 0.04, -0.01, 1.0, 0.85, 1.0, 10)
  sfera(cap, 0.1, buio, 0, 0.0, 0.2, 1.4, 0.3, 0.4, 8)
  // gli impiastri di crostacei e cozze sulle spalle, il pesce secco alla cintura, la rete a brandelli
  for (const [x, y, z] of [[-0.22, 0.4, 0.0], [-0.18, 0.43, 0.06], [0.2, 0.4, -0.06], [-0.24, 0.36, -0.07], [0.23, 0.43, 0.02]]) cono(busto, 0.04, 0.07, guscio, x, y, z, 5).rotation.set(0.3, 0, x * 3)
  for (let i = 0; i < 6; i++) sfera(busto, 0.026, M(0x8aa0a0), -0.15 + i * 0.06, 0.15 + (i % 2) * 0.1, 0.12, 1, 1, 0.6, 6)
  cil(busto, 0.5, 0.5, 0.05, M(0x3a2a1c), 0, 0.04, 0, 12).scale.set(0.38, 1, 0.24)
  const rete = perno(busto, 0.1, 0.04, 0.16)
  for (let i = 0; i < 5; i++) { const fl = scatola(rete, 0.012, 0.28, 0.006, M(0xc8bc98), -0.1 + i * 0.05, -0.14, 0); fl.rotation.z = (i - 2) * 0.04 }
  for (let j = 0; j < 4; j++) scatola(rete, 0.26, 0.012, 0.006, M(0xc8bc98), 0, -0.05 - j * 0.07, 0)
  const pesce = perno(busto, -0.16, 0.0, 0.14); pesce.rotation.z = 0.2
  sfera(pesce, 0.05, M(0xa8b4b8, { flatShading: false }), 0, -0.1, 0, 0.5, 1.4, 0.4, 8); cono(pesce, 0.04, 0.07, M(0xa8b4b8), 0, -0.2, 0, 4).rotation.x = 0
  // le gocce che colano
  const gocce = []
  for (let i = 0; i < 5; i++) gocce.push(sfera(g, 0.016, lucido(0x9ad8f0, { transparent: true, opacity: 0.7 }), 0, 0, 0, 0.8, 1.3, 0.8, 6))
  // l'arpione: asta di legno con la testa a due uncini e la corda; nella destra (indice 1)
  const arpione = new THREE.Group()
  cil(arpione, 0.017, 0.017, 1.2, legno, 0, -0.25, 0, 6)
  const testaA = perno(arpione, 0, -0.9, 0)
  cono(testaA, 0.03, 0.2, M(0xa8b0b0, { metalness: 0.6, roughness: 0.4 }), 0, -0.1, 0, 5).rotation.x = PI
  for (const s of [-1, 1]) { const u = cono(testaA, 0.012, 0.12, ruggine, s * 0.04, -0.02, 0, 4); u.rotation.set(0, 0, -s * 0.5); u.position.y = 0.0 }
  for (let i = 0; i < 4; i++) sfera(arpione, 0.014, M(0xc8bc98), 0.015 * Math.sin(i * 2), 0.1 + i * 0.1, 0, 1, 1, 1, 5)
  arpione.rotation.x = PI                                                                   // la punta prolunga l'avambraccio
  arpione.position.y = 0.05
  mani[1].add(arpione); sfera(mani[1], 0.05, pelle, 0, 0, 0, 1, 1, 1, 7)
  // nell'altra mano un gancio da pesca arrugginito
  const gancio = new THREE.Group(); cil(gancio, 0.012, 0.012, 0.2, ruggine, 0, -0.1, 0, 5); mani[0].add(gancio)
  const origine = marker(testaA, 0, -0.2, 0)
  origine.parent.remove(origine); arpione.add(origine); origine.position.set(0, -1.1, 0)
  const pose = (T, F) => {
    const { c, k } = F
    const resp = onda(T, 1.8), peso = onda(T, 0.55), ev = gesto(T, 6.3, 2.5, 1.9)
    g.position.set(0, 0, 0.34 * k - 0.05 * c); g.rotation.y = onda(T, 0.4) * 0.05 + 0.2 * c - 0.2 * k
    busto.position.y = P.gamba + 0.012 * Math.abs(onda(T, 2.2)) - 0.015 * ev - 0.04 * c
    busto.rotation.set(0.18 + 0.02 * resp - 0.2 * c + 0.4 * k + 0.08 * ev, 0.07 * peso - 0.35 * c + 0.45 * k, 0.07 * peso + 0.08 * ev * onda(T, 7))
    testa.rotation.set(0.2 + 0.05 * onda(T, 0.7) + 0.2 * ev - 0.15 * k, onda(T, 0.5) * 0.18 + 0.3 * ev * onda(T, 3), 0.1 * onda(T, 0.9) + 0.18 * ev)
    mascella.rotation.x = 0.15 + 0.15 * Math.max(0, onda(T, 1.5)) + 0.3 * ev + 0.25 * k
    bracci[1].rotation.set(tra(-0.7, -1.9, -1.45, c, k) + onda(T, 1.5) * 0.04, tra(0.0, 0.1, 0, c, k), tra(0.18, 0.2, 0.05, c, k)); gomiti[1].rotation.x = tra(-0.95, -0.9, -0.1, c, k) + onda(T, 2) * 0.05
    bracci[0].rotation.set(-0.35 + onda(T, 1.8, 1) * 0.05 - 0.4 * c, 0.0, -0.22); gomiti[0].rotation.x = -0.5 + onda(T, 2.4) * 0.06
    gambe[0].rotation.x = -0.08 + onda(T, 2) * 0.04 - 0.55 * k; gambe[1].rotation.x = 0.1 - onda(T, 2) * 0.04 + 0.2 * k + 0.2 * c
    strisce.forEach((f, i) => { f.rotation.set(-0.1 + onda(T, 1.6, i * 0.7) * 0.12 + 0.35 * k, 0, onda(T, 1.2, i) * 0.1) })
    luceOcchi.emissiveIntensity = 2.0 + 0.7 * onda(T, 2.4) + 1.0 * k
    gocce.forEach((d, i) => { const u = (T * 0.55 + i * 0.21) % 1; d.position.set(-0.2 + i * 0.1, 0.9 - u * 0.88, 0.13 + (i % 2) * 0.1); d.scale.setScalar(u > 0.95 ? 0.01 : 0.8) })
  }
  return vivente(g, pose, { tipo: 'arpione', durata: 0.85, arrivo: 0.58, origine })
}

// ═════════════════════════════════════ L'ANGUILLA ELETTRICA ═════════════════════════════════════
export function creaAnguilla () {
  const g = new THREE.Group()
  const N = 24, segs = []
  const pelle = M(0x2a3a44, { flatShading: false, roughness: 0.3 }), dorso = M(0x1a2630, { flatShading: false, roughness: 0.3 }), pancia = M(0xd8b848, { flatShading: false, roughness: 0.4 })
  const pinna = M(0x3a5a68, { flatShading: false, side: THREE.DoubleSide }), arco = lumProprio(0x9ff0ff, 2.4)
  const raggio = u => 0.04 + 0.055 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + u * 0.88)), 0.6) * (1 - 0.55 * liscio(0.8, 1, u))
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1), r = raggio(u), sg = new THREE.Group()
    sfera(sg, r, i % 3 === 0 ? dorso : pelle, 0, 0, 0, 0.9, 1.0, 1.6, 8)
    sfera(sg, r * 0.8, pancia, 0, -r * 0.4, 0, 0.7, 0.45, 1.4, 6)
    scatola(sg, 0.004, r * 1.0 + 0.04 * Math.sin(i * 0.9) ** 2, 0.1, pinna, 0, r * 0.9, 0)                  // la pinna dorsale continua
    if (i > 14 && i < N - 1) scatola(sg, 0.004, r * 0.8, 0.1, pinna, 0, -r * 0.9, 0)
    g.add(sg); segs.push(sg)
  }
  // la testa piatta con la bocca larga e due occhietti, due pinne pettorali
  const testa = perno(segs[N - 1], 0, 0, 0)
  const cranio = sfera(testa, 0.06, pelle, 0, 0, 0.05, 1.1, 0.8, 1.7, 10)
  const mascella = perno(testa, 0, -0.03, 0.04)
  sfera(mascella, 0.05, pancia, 0, -0.005, 0.05, 1.0, 0.45, 1.6, 8)
  sfera(mascella, 0.05, M(0xc86a70), 0, 0.012, 0.045, 0.8, 0.2, 1.4, 6)
  for (const s of [-1, 1]) {
    occhio(testa, s * 0.05, 0.025, 0.1, 0.017, 0xfff8a0, { emis: 0.8, giro: s * 0.7 })
    for (let d = 0; d < 4; d++) cono(testa, 0.006, 0.025, M(0xf0ecd8), s * 0.03, -0.035, 0.07 + d * 0.025, 3).rotation.x = PI
    const pt = scatola(segs[N - 3], 0.1, 0.004, 0.07, pinna, s * 0.1, -0.02, 0.08); pt.rotation.z = -s * 0.4
  }
  // le scariche: zigzag sottili che saltano sul corpo (visibili a intervalli)
  const scariche = []
  for (let i = 0; i < 5; i++) {
    const f = new THREE.Group(); g.add(f)
    let x = 0, y = 0
    for (let j = 0; j < 4; j++) { const a = scatola(f, 0.012, 0.11, 0.012, arco, 0, 0, 0); a.position.set(Math.sin(j * 2.3 + i) * 0.05, j * 0.09, 0); a.rotation.z = Math.sin(j * 3.1 + i * 2) * 0.7 }
    scariche.push(f)
  }
  const origine = marker(testa, 0, 0, 0.18)
  const pose = (T, F) => {
    const { c, k, a } = F
    const alza = gesto(T, 7.0, 2.8, 2.2)
    const P = segs.map((_, i) => {
      const u = i / (N - 1), r = raggio(u), rise = liscio(0.55, 1.0, u)
      const x = Math.sin(u * 8.5 - T * 2.2) * (0.14 - 0.06 * rise) * (0.35 + u * 0.65) * (1 + 0.5 * c) * (1 - 0.8 * k * rise)
      const hh = 0.5 + 0.1 * onda(T, 0.7) + 0.2 * alza + 0.18 * c - 0.3 * k
      const y = r * 0.9 + rise * hh * rise + 0.02 * onda(T, 3 + u)
      const z = -(1 - u) * 1.35 + 0.18 + (0.7 * k - 0.18 * c) * rise
      return [x, y, z]
    })
    segs.forEach((sg, i) => {
      sg.position.set(...P[i])
      const A = P[Math.max(0, i - 1)], B = P[Math.min(N - 1, i + 1)]
      sg.quaternion.setFromUnitVectors(new V3(0, 0, 1), new V3(B[0] - A[0], B[1] - A[1], B[2] - A[2]).normalize())
    })
    testa.rotation.set(0.3 + 0.25 * k + 0.1 * onda(T, 1.2), onda(T, 0.9) * 0.25 * (1 - k), 0)
    mascella.rotation.x = 0.08 + 0.14 * Math.max(0, onda(T, 1.5)) + 0.65 * a
    const lampo = Math.max(c, k * 0.9, gesto(T, 3.3, 0.5, 0.35) * 0.9)                      // le scariche guizzano da sole ogni tanto e a mazzi nell'attacco
    scariche.forEach((f, i) => {
      const vis = lampo > 0.12 && ((Math.floor(T * 14 + i * 3) % 3) !== 0 || lampo > 0.8)
      f.visible = vis
      const idx = 8 + i * 3, p = P[Math.min(N - 1, idx)]
      f.position.set(p[0] + (i % 2 ? 0.07 : -0.07), p[1] - 0.04, p[2]); f.rotation.set(0, (i % 2 ? 1 : -1) * 0.5 + i, (i % 2 ? -1 : 1) * 0.6 + Math.sin(T * 30 + i))
      f.scale.setScalar(0.6 + 0.8 * lampo)
    })
    arco.emissiveIntensity = 1.4 + 1.4 * lampo
  }
  return vivente(g, pose, { tipo: 'scarica', durata: 0.75, arrivo: 0.55, origine, proiettile: 'fulmine' })
}

// ═════════════════════════════════════ IL RAGNO D'ACQUA ═════════════════════════════════════
export function creaRagnoAcqua () {
  const g = new THREE.Group()
  const pelle = M(0x5a6a2c, { flatShading: false, roughness: 0.5 }), striscia = M(0xe0c050, { flatShading: false }), scuro = M(0x262c14, { flatShading: false }), ventre = M(0x9ab8a0, { flatShading: false })
  const onde2 = M(0xbfe8f0, { transparent: true, opacity: 0.45, flatShading: false, depthWrite: false })
  const corpo = perno(g, 0, 0.5, 0)
  const addome = perno(corpo, 0, 0.0, -0.18)
  sfera(addome, 0.5, pelle, 0, 0.0, 0, 0.3, 0.26, 0.42, 14)
  for (let i = 0; i < 4; i++) sfera(addome, 0.5, striscia, 0, 0.1 - i * 0.012, 0.1 - i * 0.075, 0.2 - i * 0.02, 0.1, 0.05, 8)
  sfera(addome, 0.5, ventre, 0, -0.07, 0.0, 0.2, 0.1, 0.34, 8)
  const filiere = cono(addome, 0.05, 0.1, scuro, 0, 0.0, -0.22, 5); filiere.rotation.x = -PI / 2
  const testa = perno(corpo, 0, 0.01, 0.14)
  sfera(testa, 0.5, pelle, 0, 0.0, 0, 0.24, 0.2, 0.26, 12)
  const occhi = []
  for (const [x, y, z, r] of [[-0.04, 0.07, 0.11, 0.028], [0.04, 0.07, 0.11, 0.028], [-0.075, 0.06, 0.08, 0.02], [0.075, 0.06, 0.08, 0.02], [-0.02, 0.08, 0.12, 0.014], [0.02, 0.08, 0.12, 0.014]]) {
    const o = sfera(testa, r, lum(0xff6a2a, 0.9), x, y, z, 1, 1, 0.8, 8); sfera(testa, r * 0.4, lucido(BUIO), x, y, z + r * 0.6, 1, 1, 0.5, 5)
  }
  const occ = perno(testa, 0, 0.065, 0.105); occ.userData.occhio = true; sfera(occ, 0.02, lum(0xffd24a, 0.8), 0, 0, 0, 1, 1, 0.6, 6)
  const cheli = []
  for (const s of [-1, 1]) {
    const ch = perno(testa, s * 0.04, -0.04, 0.12); sfera(ch, 0.032, scuro, 0, 0, 0, 1, 1.3, 1, 7)
    cono(ch, 0.012, 0.09, M(0xe8e0c0), 0, -0.07, 0.01, 4).rotation.x = PI + 0.3
    cheli.push(ch)
  }
  // otto zampe lunghe: ancora, ginocchio altissimo, poi la punta che poggia sul pelo dell'acqua (y = 0), e un anello d'onda sotto ognuna
  const zampe = [], cerchi = []
  const ang = [0.85, 0.35, -0.2, -0.75]                                             // direzioni d'attacco, dal davanti al dietro
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
    const an = perno(corpo, s * 0.06, 0.0, 0.1 - i * 0.075), a = ang[i]
    an.rotation.y = s * (PI / 2 - a * 0.9)
    const f = perno(an, 0, 0, 0)
    sfera(f, 0.026, pelle, 0, 0, 0, 1, 1, 1, 6)
    const su = perno(f, 0, 0, 0); arto(su, [0, 0, 0], [0, 0.24, 0.3], 0.02, 0.014, pelle, 5, true)
    const gi = perno(su, 0, 0.24, 0.3); arto(gi, [0, 0, 0], [0, -0.55, 0.3], 0.014, 0.008, striscia, 5, false)
    zampe.push({ an, su, gi, s, i, f })
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.045, 18), onde2); ring.rotation.x = -PI / 2; g.add(ring); cerchi.push(ring)
  }
  const origine = marker(testa, 0, -0.06, 0.2)
  let h0 = 0.5
  const pose = (T, F) => {
    const { c, k, a } = F
    const resp = onda(T, 2.6), scat = gesto(T, 6.2, 3.0, 0.5), ruota = gesto(T, 7.7, 1, 1.6)
    corpo.position.set(0, h0 + 0.012 * resp + 0.02 * Math.abs(onda(T, 1.4)) - 0.12 * c + 0.03 * scat, 0.55 * k - 0.1 * c + 0.2 * scat)
    corpo.rotation.set(0.1 * c - 0.12 * k + 0.03 * resp, onda(T, 0.5) * 0.15 + 0.5 * ruota * onda(T, 1.2), onda(T, 0.8) * 0.03)
    addome.rotation.x = -0.08 + 0.1 * resp + 0.2 * c; addome.scale.setScalar(1 + 0.03 * resp)
    testa.rotation.set(-0.05 - 0.2 * c + 0.2 * k, 0.15 * onda(T, 0.7), 0)
    cheli.forEach((ch, i) => { ch.rotation.set(0.1 - 0.6 * c + 0.5 * k + 0.1 * onda(T, 1.5, i), (i ? -1 : 1) * (0.2 + 0.5 * c * 0 + 0.5 * a), 0) })
    zampe.forEach(({ an, su, gi, s, i, f }) => {
      const ph = onda(T, 1.2, i * 1.1 + (s > 0 ? 0 : 2.1)), alz = i === 0 ? (0.4 * c + 0.2 * Math.max(0, ph) + 0.5 * k) : 0.08 * Math.max(0, ph)
      su.rotation.x = -0.35 * alz * 2.0 * (i === 0 ? 1 : 0) + 0.04 * ph; gi.rotation.x = 0.0 + 0.0
      f.rotation.set(-alz * 0.6 * (i === 0 ? 1 : 0.3), 0, 0)
      an.rotation.z = 0
    })
  }
  vivente(g, pose, { tipo: 'morso', durata: 0.6, arrivo: 0.5, origine })
  // quota perché le punte delle zampe tocchino y = 0, poi gli anelli d'acqua sotto le punte (fissi: a ogni fotogramma si riposizionano)
  g.userData.anima(0); g.updateMatrixWorld(true)
  let min = 1e9; const v = new V3()
  zampe.forEach(({ gi }) => { gi.updateWorldMatrix(true, false); v.set(0, -0.55, 0.3).applyMatrix4(gi.matrixWorld); min = Math.min(min, v.y) })
  h0 = 0.5 - min; g.userData.anima(0)
  const animaOrig = g.userData.anima, attaccaOrig = g.userData.attacca
  const anelli = () => {
    g.updateMatrixWorld(true)
    zampe.forEach(({ gi }, i) => { v.set(0, -0.55, 0.3); gi.localToWorld(v); g.worldToLocal(v); cerchi[i].position.set(v.x, 0.006, v.z); const u = (g.userData._t * 0.6 + i * 0.37) % 1; cerchi[i].scale.setScalar(0.6 + u * 1.4); cerchi[i].material = onde2 })
  }
  g.userData.anima = t => { g.userData._t = t; animaOrig(t); anelli() }
  g.userData.attacca = p => { attaccaOrig(p); anelli() }
  g.userData.anima(0)
  return g
}

export const MOSTRI_PALUDE = [
  { chiave: 'sanguisuga', nome: 'Sanguisuga', zona: 'palude', luogo: 'palude, secco, cisterna', taglia: 'piccola', forza: 1, ruolo: 'comune', crea: creaSanguisuga },
  { chiave: 'rospo', nome: 'Rospo', zona: 'palude', luogo: 'palude, guado, palafitta', taglia: 'piccola', forza: 1, ruolo: 'comune', crea: () => creaRospo('rospo') },
  { chiave: 'rana-velenosa', nome: 'Rana velenosa', zona: 'palude', luogo: 'palude, palafitta', taglia: 'piccola', forza: 2, ruolo: 'comune', crea: () => creaRospo('rana') },
  { chiave: 'airone', nome: 'Airone', zona: 'palude', luogo: 'guado, palude, secco', taglia: 'media', forza: 2, ruolo: 'comune', crea: creaAirone },
  { chiave: 'melma-palude', nome: 'Melma di palude', zona: 'palude', luogo: 'palude, palafitta', taglia: 'media', forza: 1, ruolo: 'comune', crea: creaMelmaPalude },
  { chiave: 'brigante', nome: 'Brigante', zona: 'palude', luogo: 'accampamento, guado', taglia: 'media', forza: 2, ruolo: 'comune', crea: () => creaBrigante(0) },
  { chiave: 'brigante-arciere', nome: 'Brigante arciere', zona: 'palude', luogo: 'accampamento, guado', taglia: 'media', forza: 2, ruolo: 'comune', crea: creaBriganteArciere },
  { chiave: 'anguilla', nome: 'Anguilla elettrica', zona: 'palude', luogo: 'cisterna, palude', taglia: 'media', forza: 2, ruolo: 'comune', crea: creaAnguilla },
  { chiave: 'polpo', nome: 'Polpo', zona: 'palude', luogo: 'cisterna', taglia: 'media', forza: 2, ruolo: 'comune', crea: () => creaPolpo(false) },
  { chiave: 'ragno-acqua', nome: "Ragno d'acqua", zona: 'palude', luogo: 'palafitta, palude', taglia: 'media', forza: 2, ruolo: 'comune', crea: creaRagnoAcqua },
  { chiave: 'coccodrillo', nome: 'Coccodrillo', zona: 'palude', luogo: 'palude, secco, palafitta', taglia: 'grande', forza: 3, ruolo: 'forte', crea: creaCoccodrillo },
  { chiave: 'pescatore-morto', nome: 'Pescatore non morto', zona: 'palude', luogo: 'palafitta, guado', taglia: 'media', forza: 3, ruolo: 'forte', crea: creaPescatoreMorto },
  { chiave: 'brigante-capo', nome: 'Capo dei briganti', zona: 'palude', luogo: 'accampamento', taglia: 'grande', forza: 3, ruolo: 'forte', crea: () => creaBrigante(1) },
  { chiave: 'gorgo', nome: 'Gorgo (polpo gigante)', zona: 'palude', luogo: 'cisterna', taglia: 'enorme', forza: 4, ruolo: 'boss', crea: creaGorgo },
  { chiave: 'sibilla', nome: 'Sibilla (serpente gigante)', zona: 'palude', luogo: 'palafitta', taglia: 'enorme', forza: 4, ruolo: 'boss', crea: creaSibilla },
  { chiave: 'idra', nome: 'Idra della palude', zona: 'palude', luogo: 'palafitta, palude', taglia: 'enorme', forza: 5, ruolo: 'superboss', crea: creaIdra }
]
