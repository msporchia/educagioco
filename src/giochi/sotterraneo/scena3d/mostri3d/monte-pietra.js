// Generato da strumenti/promuovi-3d.mjs da poc/mostri-3d/monte-pietra.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Il monte, 1/4: i golem (pietra, ghiaccio, lava), lo spirito elettrico e l'elementale di tempesta. Contratto: vedi mostri.js/prati.js.
import {
  THREE, M, sfera, rozza, scatola, cil, cono, perno, punta, PI, V3, SU, lumi, lum, lucido, senzaOmbra, figura, idleUmano, ritmo, marcatore, dichiara,
  evento, chiudi, fulmine, occhio, onda,
} from './monte-base.js'

// ══════════════════════════════════════ I GOLEM ══════════════════════════════════════
const GOLEM = {
  pietra: { corpo: 0x8d877a, scuro: 0x5f5a50, chiaro: 0xb4ae9b, luce: 0xffb040, occhi: 0xffd060, scala: 0.88, nome: 'pietra' },
  ghiaccio: { corpo: 0x9fcdea, scuro: 0x5a8db4, chiaro: 0xe2f4ff, luce: 0x6fe6ff, occhi: 0xb8f8ff, scala: 1.0, nome: 'ghiaccio' },
  lava: { corpo: 0x3b3431, scuro: 0x221d1c, chiaro: 0x5a514b, luce: 0xff6a1c, occhi: 0xffb030, scala: 1.0, nome: 'lava' },
}

export function creaGolem (v = 'pietra') {
  const C = GOLEM[v]
  const P = figura({ pelle: C.corpo, pelle2: C.scuro, calzoni: C.scuro, veste: C.corpo, scarpa: C.corpo, gamba: 0.5, busto: [0.95, 0.72, 0.62], testa: 0.23, braccio: 0.8, gr: 0.12, sg: 0.15, spalla: 0.2, collo: 0.1, mano: 1.55, seg: 6, roccia: true, piede: 1.25 })
  const { g, busto, testa, bracci, gomiti, mani } = P
  const ice = v === 'ghiaccio', lava = v === 'lava'
  const chi = ice ? M(C.chiaro, { roughness: 0.12, metalness: 0.15 }) : M(C.chiaro), scu = M(C.scuro)
  const nucleo = lumi(C.luce, 2.2), runa = lumi(C.luce, 1.6), occhiMat = lumi(C.occhi, 2.6)
  // il petto: piastre di roccia, il nucleo acceso e le righe di rune che ne partono
  rozza(busto, 0.3, chi, 0, 0.48, 0.1, 1.3, 1.0, 0.55, 1); rozza(busto, 0.26, scu, -0.3, 0.2, 0.2, 1.0, 0.8, 0.6, 1); rozza(busto, 0.26, scu, 0.3, 0.2, 0.2, 1.0, 0.8, 0.6, 1)
  rozza(busto, 0.34, chi, 0, 0.38, -0.25, 1.4, 1.1, 0.6, 1)                              // il dorso
  const cuore = sfera(busto, 0.1, nucleo, 0, 0.42, 0.34, 1, 1, 0.6, 10); senzaOmbra(cuore)
  const cranio = (a, b, c) => scatola(busto, a, b, 0.03, runa, c[0], c[1], 0.36)
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + 0.3, r = scatola(busto, 0.03, 0.2, 0.03, runa, Math.cos(a) * 0.17, 0.42 + Math.sin(a) * 0.17, 0.33); r.rotation.z = a - PI / 2; senzaOmbra(r) }
  void cranio
  // la testa incassata: arcata pesante, occhi accesi, bocca a fessura, mento
  rozza(testa, 0.17, chi, 0, -0.1, 0.07, 1.2, 0.7, 0.9, 1)
  scatola(testa, 0.34, 0.07, 0.12, scu, 0, 0.06, 0.14).rotation.x = 0.25
  for (const s of [-1, 1]) { const o = scatola(testa, 0.1, 0.035, 0.03, occhiMat, s * 0.08, 0.0, 0.19); o.rotation.z = s * -0.3; senzaOmbra(o) }
  senzaOmbra(scatola(testa, 0.15, 0.02, 0.03, runa, 0, -0.1, 0.17))
  // le braccia: rune lungo l'avambraccio, nocche; le mani sono macigni
  gomiti.forEach((go, i) => { const s = i ? 1 : -1; senzaOmbra(scatola(go, 0.03, 0.2, 0.05, runa, s * 0.1, -0.2, 0)); rozza(go, 0.1, chi, 0, -0.05, 0, 1.1, 0.8, 1.1, 1) })
  mani.forEach(ma => { for (let k = -1; k <= 1; k++) cono(ma, 0.05, 0.13, scu, k * 0.1, -0.2, 0.17, 4).rotation.x = PI - 0.4 })
  const ex = []                                              // pezzi che cambiano da variante a variante e che si animano
  if (v === 'pietra') {
    const muschio = M(0x5f7d3a, { roughness: 1 }), muschio2 = M(0x7da04a, { roughness: 1 })
    for (const [pa, x, y, z, n] of [[bracci[0], -0.1, 0.22, 0, 5], [bracci[1], 0.1, 0.22, 0, 5], [testa, 0, 0.17, -0.02, 4], [busto, 0.3, 0.62, -0.15, 4]]) for (let k = 0; k < n; k++) cono(pa, 0.035, 0.12 + (k % 2) * 0.05, k % 2 ? muschio : muschio2, x + (k - n / 2) * 0.06, y, z + (k % 3) * 0.05, 4).rotation.set((k % 3 - 1) * 0.3, 0, (k - n / 2) * 0.2)
    rozza(P.busto, 0.14, muschio, -0.25, 0.7, 0.15, 1.3, 0.55, 1.1, 1)                      // un tappeto di muschio sulla spalla
  } else if (ice) {
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) cono(bracci[s < 0 ? 0 : 1], 0.07, 0.34 - k * 0.05, chi, s * (0.08 + k * 0.1), 0.2 + k * 0.03, -0.02, 5).rotation.z = s * (-0.3 - k * 0.45)
    for (let k = 0; k < 5; k++) cono(busto, 0.07, 0.38 - Math.abs(k - 2) * 0.06, chi, (k - 2) * 0.15, 0.55 + (2 - Math.abs(k - 2)) * 0.06, -0.3, 5).rotation.x = -0.6
    for (let k = 0; k < 5; k++) cono(testa, 0.04, 0.2 - Math.abs(k - 2) * 0.03, chi, (k - 2) * 0.07, 0.2, -0.02, 5).rotation.z = (k - 2) * -0.25
    gomiti.forEach((go, i) => { for (let k = 0; k < 3; k++) cono(go, 0.025, 0.14, chi, (k - 1) * 0.07, -0.42, 0.06, 4).rotation.x = PI })
    for (let k = 0; k < 3; k++) { const f = rozza(g, 0.06, chi, 0, 0, 0, 0.55, 1.5, 0.55, 0); f.userData.orb = k; ex.push(f) }   // schegge di ghiaccio che girano attorno
  } else {
    const fiamma = lumi(0xff8a20, 2.2, { flatShading: false })
    for (let k = 0; k < 3; k++) { const f = cono(testa, 0.05 - Math.abs(k - 1) * 0.012, 0.28 - Math.abs(k - 1) * 0.07, fiamma, (k - 1) * 0.08, 0.28, -0.04, 5); senzaOmbra(f); f.userData.fiamma = k; ex.push(f) }
    for (const [i, s] of [[0, -1], [1, 1]]) for (let k = 0; k < 2; k++) { const f = cono(bracci[i], 0.07, 0.3 - k * 0.1, fiamma, s * (0.04 + k * 0.1), 0.34, 0, 5); senzaOmbra(f); f.userData.fiamma = k + 3; ex.push(f) }
    for (let k = 0; k < 7; k++) { const a = k * 2.1; const c = scatola(busto, 0.03, 0.11 + (k % 3) * 0.06, 0.03, runa, Math.sin(a) * 0.3, 0.2 + (k * 0.09) % 0.5, 0.2 + (k % 2) * 0.1); c.rotation.z = a; senzaOmbra(c) }
    for (const s of [-1, 1]) for (let k = 0; k < 2; k++) senzaOmbra(scatola(P.gambe[s < 0 ? 0 : 1], 0.03, 0.14, 0.03, runa, 0.05 * s, -0.12 - k * 0.22, 0.13)).rotation.z = k * 0.4
    for (let k = 0; k < 3; k++) { const f = rozza(g, 0.05, lumi(0xff7a1c, 2), 0, 0, 0, 1, 1, 1, 0); f.userData.orb = k; senzaOmbra(f); ex.push(f) }   // braci che salgono
  }
  const sassi = []                                           // i frammenti di roccia che le girano attorno (non è scritto da nessuna parte che stiano fermi)
  if (v !== 'lava') for (let k = 0; k < 3; k++) { const f = rozza(g, 0.06 + k * 0.01, scu, 0, 0, 0, 1, 0.8, 1, 0); sassi.push(f) }
  g.scale.setScalar(C.scala)
  chiudi(g, T => {
    idleUmano(P, T, { respiro: 0.03, rit: 0.65, riposoB: [-0.12, -0.12], zB: 0.2, gom: [-0.3, -0.3], testa: [0.12, 0], oscilla: 0.05, peso: 0.03, bob: 0.03 })
    const ev = evento(T, 7.3, 2.4), pugno = evento(T, 11, 1.6, 4)
    bracci[0].rotation.x += -ev.b * 0.55; bracci[1].rotation.x += -ev.b * 0.8; gomiti[0].rotation.x += -ev.b * 0.9; gomiti[1].rotation.x += -ev.b * 1.1   // flette i pugni
    busto.rotation.z += ev.b * 0.04; testa.rotation.x += ev.b * 0.12
    bracci[1].rotation.x += -pugno.b * 0.5; gomiti[1].rotation.x += -pugno.b * 0.7; busto.rotation.y += pugno.b * 0.12            // un colpo sul palmo, ogni tanto
    const pul = 0.5 + 0.5 * Math.sin(T * 3.1)
    nucleo.emissiveIntensity = 1.6 + pul * 1.4 + ev.b * 0.8; runa.emissiveIntensity = 1.0 + pul * 1.0; occhiMat.emissiveIntensity = 2.0 + Math.sin(T * 7) * 0.4 + ev.b
    sassi.forEach((s, k) => { const a = T * (0.7 + k * 0.12) + k * 2.1; s.position.set(Math.cos(a) * 0.82, 1.1 + k * 0.22 + Math.sin(T * 1.6 + k) * 0.06, Math.sin(a) * 0.82); s.rotation.set(T + k, T * 0.7, 0) })
    ex.forEach(f => {
      if (f.userData.fiamma != null) { const k = f.userData.fiamma; f.scale.set(1 + Math.sin(T * 9 + k) * 0.15, 1 + Math.sin(T * 7.3 + k * 2) * 0.28, 1) }
      else if (f.userData.orb != null) {
        const k = f.userData.orb, a = T * (0.9 + k * 0.1) + k * 2.1
        if (lava) { const u = ((T * 0.5 + k * 0.37) % 1); f.position.set(Math.cos(a) * 0.5, 0.3 + u * 1.5, Math.sin(a) * 0.5); f.scale.setScalar(1 - u * 0.8) }
        else f.position.set(Math.cos(a) * 0.9, 1.35 + Math.sin(T * 1.7 + k) * 0.12, Math.sin(a) * 0.9)
        if (!lava) f.rotation.set(T * 1.3 + k, a, 0.4)
      }
    })
  })
  dichiara(g, 'schianto', 1.0, 0.55)                                            // alza i pugni sopra la testa e li abbatte
  g.userData.attacca = p => {
    const { W, L } = ritmo(p, 0.55)
    bracci.forEach(b => { b.rotation.x += -W * 2.75 - L * 0.5 }); gomiti.forEach(go => { go.rotation.x += W * 0.2 - L * 0.1 })
    busto.rotation.x += -W * 0.3 + L * 0.42; testa.rotation.x += -W * 0.25 + L * 0.28
    busto.position.y -= L * 0.1; g.position.z += L * 0.32; P.gambe.forEach(a => { a.rotation.x += -L * 0.15 })
    nucleo.emissiveIntensity += W * 1.5 + L * 2; runa.emissiveIntensity += L * 2
  }
  return g
}

// ══════════════════════════════════════ LO SPIRITO ELETTRICO ══════════════════════════════════════
export function creaSpiritoElettrico () {
  const g = new THREE.Group()
  const nucleoM = lumi(0xfff3a8, 3, { flatShading: false }), arcoM = lumi(0xd6f0ff, 4.5, { flatShading: false })
  const guscioM = new THREE.MeshStandardMaterial({ color: 0x86c4ff, emissive: 0x3a7bff, emissiveIntensity: 0.9, transparent: true, opacity: 0.34, depthWrite: false, roughness: 0.2 })
  const buio = lucido(0x0e1a44)
  const corpo = perno(g, 0, 0.9, 0)
  const nucleo = senzaOmbra(sfera(corpo, 0.17, nucleoM, 0, 0, 0, 1, 1, 1, 12))
  const guscio = senzaOmbra(sfera(corpo, 0.3, guscioM, 0, 0, 0, 1, 1.08, 1, 16)); guscio.renderOrder = 3
  // il viso sul guscio: occhi tondi con il bianco, bocca che sorride storta, sopracciglia tese
  for (const s of [-1, 1]) {
    senzaOmbra(occhio(corpo, s * 0.1, 0.05, 0.27, 0.052, 0x0f1c4f, { emis: 0.25, bianco: 0xfffbe0 }))
    const so = senzaOmbra(scatola(corpo, 0.1, 0.022, 0.02, buio, s * 0.11, 0.135, 0.26)); so.rotation.z = s * -0.38
  }
  const bocca = senzaOmbra(sfera(corpo, 0.05, buio, 0, -0.07, 0.275, 1.2, 0.45, 0.4, 8))
  // i cornetti elettrici e le punte attorno
  for (const s of [-1, 1]) { const c = cono(corpo, 0.05, 0.24, arcoM, s * 0.14, 0.31, 0, 4); c.rotation.z = s * -0.45; senzaOmbra(c) }
  for (let k = 0; k < 7; k++) { const a = k / 7 * PI * 2 + 0.4, d = new V3(Math.cos(a), 0.15, Math.sin(a)).normalize(), c = cono(corpo, 0.035, 0.15, arcoM, d.x * 0.33, d.y * 0.3, d.z * 0.33, 4); c.quaternion.setFromUnitVectors(SU, d); senzaOmbra(c) }
  const archi = Array.from({ length: 6 }, () => fulmine(corpo, 5, 0.011, arcoM))
  const coda = fulmine(corpo, 7, 0.016, arcoM)
  archi.forEach(a => a.segs.forEach(s => { s.castShadow = false })); coda.segs.forEach(s => { s.castShadow = false })
  const scintille = Array.from({ length: 3 }, (_, k) => senzaOmbra(sfera(g, 0.035, arcoM, 0, 0, 0, 1, 1, 1, 6)))
  const pozza = new THREE.Mesh(new THREE.CircleGeometry(0.4, 20), new THREE.MeshBasicMaterial({ color: 0x8fc8ff, transparent: true, opacity: 0.12, depthWrite: false }))
  pozza.rotation.x = -PI / 2; pozza.position.y = 0.012; g.add(pozza)
  const A = new V3(), B = new V3()
  let ultimoT = 0
  const disegnaArchi = (T, ext, ingresso = 0) => {
    const q = Math.floor(T * 14)
    archi.forEach((a, k) => {
      const th = k / archi.length * PI * 2 + Math.floor(T * 14 + k) * 2.4, ph = ((k * 0.37 + Math.floor(T * 14) * 0.61) % 1 - 0.5) * 2.2
      const d = new V3(Math.cos(th) * Math.cos(ph), Math.sin(ph), Math.sin(th) * Math.cos(ph))
      if (ingresso) d.lerp(new V3(0, 0, 1), ingresso).normalize()
      A.copy(d).multiplyScalar(0.27); B.copy(d).multiplyScalar(0.27 + (0.3 + 0.2 * ((k + q) % 3)) * ext)
      a.imposta(A, B, q + k * 5, 0.07 * ext + 0.02); a.mostra(ext > 0.05)
    })
    A.set(0, -0.26, -0.02); B.set(Math.sin(T * 3) * 0.1, -0.88, -0.3 + Math.sin(T * 2.3) * 0.08)
    coda.imposta(A, B, q + 40, 0.09)
  }
  const mira = marcatore(corpo, 0, 0, 0.5)
  chiudi(g, T => {
    ultimoT = T
    const ev = evento(T, 5.5, 0.6), pul = 0.5 + 0.5 * Math.sin(T * 5.2)
    g.rotation.set(0, Math.sin(T * 0.5) * 0.3, 0); g.position.set(0, 0, 0)
    corpo.position.set(Math.sin(T * 0.9) * 0.07, 0.9 + Math.sin(T * 1.9) * 0.09 + ev.b * 0.06, Math.sin(T * 0.7) * 0.05)
    corpo.rotation.set(Math.sin(T * 1.3) * 0.08, Math.sin(T * 0.8) * 0.2, Math.sin(T * 1.1) * 0.1)
    corpo.scale.setScalar(1 + pul * 0.04 + ev.b * 0.12)
    nucleoM.emissiveIntensity = 2.6 + pul * 1.4 + ev.b * 3; guscioM.emissiveIntensity = 0.8 + pul * 0.4 + ev.b * 1.2; guscioM.opacity = 0.34
    bocca.scale.set(1.2, 0.45 + Math.max(0, Math.sin(T * 1.3)) * 0.25, 0.4)
    disegnaArchi(T, 0.75 + ev.b * 1.2)
    scintille.forEach((s, k) => { const a = T * (2.2 + k * 0.6) + k * 2.1; s.position.set(Math.cos(a) * 0.5, 0.9 + Math.sin(a * 1.3 + k) * 0.28 + Math.sin(T * 1.9) * 0.09, Math.sin(a) * 0.5); s.scale.setScalar(0.6 + 0.6 * Math.abs(Math.sin(T * 9 + k))) })
    pozza.scale.setScalar(1 + pul * 0.1); pozza.material.opacity = 0.08 + pul * 0.08
  })
  dichiara(g, 'scarica', 0.9, 0.5, { tipo: 'fulmine', origine: mira })           // si raccoglie, si gonfia, e spara il fulmine davanti a sé
  g.userData.attacca = p => {
    const { W, L } = ritmo(p, 0.5)
    corpo.position.z += -W * 0.2 + L * 0.45; corpo.position.y -= W * 0.06
    corpo.scale.multiplyScalar(1 - W * 0.22 + L * 0.35)
    corpo.rotation.x += -W * 0.2 + L * 0.2
    nucleoM.emissiveIntensity += W * 3 + L * 4; guscioM.emissiveIntensity += W * 1.5 + L * 3
    disegnaArchi(ultimoT, Math.max(0.05, 0.75 - W * 0.7 + L * 2.2), L)
  }
  return g
}

// ══════════════════════════════════════ L'ELEMENTALE DI TEMPESTA ══════════════════════════════════════
export function creaElementaleTempesta () {
  const g = new THREE.Group()
  const nubi = [M(0x59627f, { emissive: 0x141c3a }), M(0x7e89a8, { emissive: 0x141c3a }), M(0x434b69, { emissive: 0x101830 }), M(0xa4aecb, { emissive: 0x1a2444 })]
  const lampo = lumi(0xdff4ff, 4.5, { flatShading: false }), occhiM = lumi(0xbff4ff, 3.2, { flatShading: false })
  const corpo = perno(g, 0, 0.12, 0)
  const strati = []
  for (let i = 0; i < 7; i++) {
    const u = i / 6, y = 0.06 + i * 0.17, r = 0.1 + Math.pow(u, 1.3) * 0.42
    const st = perno(corpo, 0, y, 0); st.userData.v = 1.3 - u * 0.5 + (i % 2 ? 0.5 : -0.2)
    const spira = new THREE.Mesh(new THREE.TorusGeometry(r * 0.95, 0.03 + u * 0.012, 5, 14, 3.4), M(0xdfe8ff, { emissive: 0x6a86d0, emissiveIntensity: 0.6, flatShading: false })); spira.rotation.x = PI / 2; spira.position.y = 0.02; st.add(spira)
    for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2 + i, rr = 0.15 + u * 0.1; rozza(st, rr, nubi[(i + k) % 4], Math.cos(a) * r * 0.75, 0, Math.sin(a) * r * 0.75, 1.1, 0.75, 1.1, 1) }
    strati.push(st)
  }
  const busto = perno(corpo, 0, 1.28, 0)
  rozza(busto, 0.42, nubi[1], 0, 0.08, 0, 1.2, 0.85, 0.95, 1); rozza(busto, 0.3, nubi[3], 0.1, 0.18, 0.18, 1, 0.8, 0.8, 1); rozza(busto, 0.26, nubi[2], -0.2, 0.0, 0.2, 1, 0.8, 1, 1)
  const testa = perno(busto, 0, 0.5, 0.08)
  rozza(testa, 0.23, nubi[3], 0, 0, 0, 1, 0.92, 0.95, 1)
  rozza(testa, 0.2, nubi[2], 0, 0.08, 0.1, 1.15, 0.5, 0.7, 1)                                          // l'arcata scura
  for (const s of [-1, 1]) {
    const o = senzaOmbra(sfera(testa, 0.055, occhiM, s * 0.1, 0.01, 0.2, 1.2, 0.8, 0.5, 10)); o.rotation.z = s * -0.3; o.userData.occhio = true
    const c = cono(testa, 0.05, 0.28, nubi[2], s * 0.17, 0.2, 0, 5); c.rotation.z = s * -0.55                     // due corna di nuvola temporalesca
  }
  senzaOmbra(sfera(testa, 0.045, lucido(0x10172b), 0, -0.1, 0.2, 1.5, 0.55, 0.45, 8))
  const braccia = []
  for (const s of [-1, 1]) {
    const sp = perno(busto, s * 0.48, 0.15, 0); braccia.push(sp)
    const catena = []
    let y = 0
    for (let k = 0; k < 4; k++) { const r = 0.17 - k * 0.025; y -= r * 1.15; catena.push(rozza(sp, r, nubi[(k + (s > 0 ? 1 : 0)) % 4], s * 0.02 * k, y, 0, 1, 1.1, 1, 1)) }
    const mano = perno(sp, 0, y - 0.16, 0); sp.userData.mano = mano
    senzaOmbra(sfera(mano, 0.1, lampo, 0, 0, 0, 1, 1, 1, 8))
  }
  const sfreccia = Array.from({ length: 6 }, () => fulmine(corpo, 4, 0.014, lampo))
  const alto = fulmine(corpo, 6, 0.02, lampo), tra = fulmine(g, 6, 0.022, lampo)
  ;[...sfreccia, alto, tra].forEach(f => f.segs.forEach(s => { s.castShadow = false }))
  const A = new V3(), B = new V3(), Ma = new V3(), Mb = new V3()
  const mira = marcatore(g, 0, 1.5, 0.8)
  const crepita = (T, quanto) => {
    const q = Math.floor(T * 13)
    sfreccia.forEach((f, k) => {
      const a = q * 1.7 + k * 1.9, y = 0.3 + ((q * 0.37 + k * 0.29) % 1) * 1.1, r = 0.15 + (y / 1.4) * 0.5
      A.set(Math.cos(a) * r, y, Math.sin(a) * r); B.set(Math.cos(a + 0.7) * (r + 0.05), y - 0.35, Math.sin(a + 0.7) * (r + 0.05))
      f.imposta(A, B, q + k * 3, 0.06); f.mostra(((q + k * 5) % 7) < 5 * quanto)
    })
  }
  let ultimoT = 0
  chiudi(g, T => {
    ultimoT = T
    const ev = evento(T, 6.2, 1.2), sw = Math.sin(T * 0.8)
    g.position.set(0, 0, 0); g.rotation.set(0, Math.sin(T * 0.4) * 0.15, 0)
    corpo.position.set(sw * 0.05, 0.1 + Math.sin(T * 1.9) * 0.05 + ev.b * 0.06, 0); corpo.rotation.set(0.03, 0, sw * 0.07 + Math.sin(T * 1.3) * 0.03)
    strati.forEach((s, i) => { s.rotation.y = T * s.userData.v; s.position.x = Math.sin(T * 1.4 + i * 0.5) * 0.03 * (1 + i * 0.3) })
    busto.position.set(0, 1.28, 0); busto.rotation.set(0, 0, 0); busto.scale.setScalar(1 + Math.sin(T * 2.2) * 0.02)
    testa.rotation.set(0.05 + ev.b * 0.25, Math.sin(T * 0.6) * 0.5, Math.sin(T * 0.9) * 0.07)
    braccia.forEach((b, i) => { const s = i ? 1 : -1; b.rotation.set(-0.15 + Math.sin(T * 1.5 + i * 1.7) * 0.2 - ev.b * 0.8, 0, s * (0.5 + Math.sin(T * 1.1 + i) * 0.18)) })
    occhiM.emissiveIntensity = 2.6 + Math.sin(T * 8) * 0.5 + ev.b * 2.5
    crepita(T, 0.8 + ev.b * 0.4)
    if (ev.b > 0.05) { A.set(0, 2.1, 0); B.set(0, 2.9, 0); alto.imposta(A, B, Math.floor(T * 14), 0.2); alto.mostra(true) } else alto.mostra(false)
    tra.mostra(false)
  })
  dichiara(g, 'fulmine', 1.0, 0.5, { tipo: 'fulmine', origine: mira })           // alza le braccia, raccoglie una scarica fra le mani e la scaglia in avanti
  g.userData.attacca = p => {
    const { W, L } = ritmo(p, 0.5)
    braccia.forEach((b, i) => { const s = i ? 1 : -1; b.rotation.x += -W * 2.4 - L * 1.3; b.rotation.z += -s * W * 0.2 })
    busto.rotation.x += -W * 0.2 + L * 0.35; testa.rotation.x += -W * 0.2 + L * 0.2; corpo.rotation.x += -W * 0.1 + L * 0.2; corpo.position.z += L * 0.3
    occhiM.emissiveIntensity += W * 2 + L * 3
    if (W > 0.25 || L > 0.2) {
      g.updateMatrixWorld(true)
      braccia[0].userData.mano.getWorldPosition(Ma); braccia[1].userData.mano.getWorldPosition(Mb)
      g.worldToLocal(Ma); g.worldToLocal(Mb)
      tra.imposta(Ma, Mb, Math.floor(ultimoT * 20), 0.12 + W * 0.2 + L * 0.1); tra.mostra(true)
    }
    crepita(ultimoT, 1)
  }
  return g
}
