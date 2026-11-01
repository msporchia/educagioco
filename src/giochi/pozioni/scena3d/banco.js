// Il laboratorio fermo: il tavolo, il muro con gli scaffali, il calderone
// sul fuoco col vapore e le bolle, e il bancone del mercante davanti. Si
// muove da sé (fuoco, bolle, vapore) e cambia solo il colore del brodo.
import { Mesh, Group, BoxGeometry, PlaneGeometry, CylinderGeometry, CircleGeometry, SphereGeometry, TorusGeometry,
         LatheGeometry, Vector2, Vector3, Color, MeshStandardMaterial, MeshBasicMaterial, Sprite, SpriteMaterial,
         InstancedMesh, Object3D, PointLight, AdditiveBlending } from 'three'

// dove stanno le cose (il tavolo è a y = 0)
export const POSTI = {
  calderone: new Vector3(0, 0, -2.3),
  brodo: 1.12,              // l'altezza del brodo nel calderone
  vasiZ: 0.75,              // la fila dei misurini
  bancoZ: 2.45, bancoY: 0.22,   // il bancone del mercante, e dove ci si appoggia sopra
}

const BIANCO = new Color(1, 1, 1)
const piatto = (c, op = {}) => new MeshStandardMaterial({ color: c, roughness: 0.8, metalness: 0, ...op })

export function creaBanco(scena, trame) {
  const g = new Group()
  scena.add(g)

  // il tavolo e il bancone
  const tLegno = trame.legno.clone(); tLegno.needsUpdate = true; tLegno.repeat.set(2, 1.6)
  const tavolo = new Mesh(new BoxGeometry(11, 0.4, 8), piatto(0xffffff, { map: tLegno, roughness: 0.75 }))
  tavolo.position.set(0, -0.2, -0.3)
  g.add(tavolo)
  const tBanco = trame.legno.clone(); tBanco.needsUpdate = true; tBanco.repeat.set(1.2, 0.25)
  const banco = new Mesh(new BoxGeometry(5.8, POSTI.bancoY, 1.35), piatto(0x8a6a50, { map: tBanco }))
  banco.position.set(0, POSTI.bancoY / 2, POSTI.bancoZ)
  g.add(banco)
  const bordo = new Mesh(new BoxGeometry(5.9, 0.08, 0.1), piatto(0x5a3a22))
  bordo.position.set(0, POSTI.bancoY + 0.04, POSTI.bancoZ + 0.66)
  g.add(bordo)

  // il muro, gli scaffali coi barattoli e le candele
  const tMuro = trame.mattoni.clone(); tMuro.needsUpdate = true; tMuro.repeat.set(3, 2)
  const muro = new Mesh(new PlaneGeometry(14, 8), piatto(0xffffff, { map: tMuro, roughness: 0.95 }))
  muro.position.set(0, 3.6, -3.7)
  g.add(muro)
  const tScaffale = trame.legno.clone(); tScaffale.needsUpdate = true; tScaffale.repeat.set(2, 0.1)
  const fiamme = []
  for (const y of [1.9, 3.1]) {
    const s = new Mesh(new BoxGeometry(9, 0.12, 0.6), piatto(0xffffff, { map: tScaffale }))
    s.position.set(0, y, -3.4)
    g.add(s)
  }
  const barattoli = new InstancedMesh(new CylinderGeometry(0.17, 0.19, 0.5, 12), piatto(0xffffff, { roughness: 0.3, metalness: 0.1 }), 22)
  const finto = new Object3D(), tinta = new Color()
  const tinte = [0x7fd4c1, 0xe2a53a, 0x8b5cc4, 0xd0455e, 0x5ec46a, 0x4aa3ff, 0xffd85e, 0xc06a4a]
  for (let i = 0; i < 22; i++) {
    const y = i < 11 ? 1.9 : 3.1, x = -4.2 + (i % 11) * 0.82 + Math.sin(i * 7.3) * 0.12
    const h = 0.7 + ((i * 37) % 10) / 14
    finto.position.set(x, y + 0.06 + 0.25 * h, -3.42 + Math.sin(i * 3.1) * 0.08)
    finto.scale.set(0.8 + ((i * 13) % 5) / 10, h, 0.8 + ((i * 13) % 5) / 10)
    finto.updateMatrix()
    barattoli.setMatrixAt(i, finto.matrix)
    barattoli.setColorAt(i, tinta.set(tinte[i % tinte.length]).multiplyScalar(0.7))
  }
  g.add(barattoli)
  const morbido = trame.morbido
  const fiamma = (x, y, z, s = 1) => {
    const f = new Sprite(new SpriteMaterial({ map: morbido, color: 0xffb347, blending: AdditiveBlending, depthWrite: false, transparent: true }))
    f.position.set(x, y, z); f.scale.set(0.22 * s, 0.38 * s, 1)
    f.userData.base = f.scale.clone(); f.userData.fase = x * 3.1 + y
    g.add(f); fiamme.push(f)
    return f
  }
  for (const [x, y] of [[-3.3, 1.96], [2.9, 3.16], [3.7, 1.96]]) {
    const c = new Mesh(new CylinderGeometry(0.07, 0.08, 0.36, 10), piatto(0xf2e6c8, { emissive: 0x332211 }))
    c.position.set(x, y + 0.18, -3.3)
    g.add(c)
    fiamma(x, y + 0.48, -3.3)
  }

  // il calderone: ghisa tornita, tre piedi, due maniglie
  const C = POSTI.calderone
  const profilo = [[0, 0.12], [0.5, 0.14], [0.9, 0.34], [1.1, 0.68], [1.07, 0.98], [0.99, 1.13], [1.1, 1.2], [1.13, 1.28],
                   [1.0, 1.3], [0.93, 1.18], [0.95, 0.98]].map(([x, y]) => new Vector2(x, y))
  const ghisa = new MeshStandardMaterial({ color: 0x2b2733, metalness: 0.65, roughness: 0.5 })
  const pentola = new Mesh(new LatheGeometry(profilo, 40), ghisa)
  pentola.position.copy(C); pentola.position.y = 0.22
  g.add(pentola)
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2 + 0.5
    const p = new Mesh(new CylinderGeometry(0.07, 0.05, 0.4, 8), ghisa)
    p.position.set(C.x + Math.cos(a) * 0.7, 0.2, C.z + Math.sin(a) * 0.7)
    g.add(p)
  }
  for (const s of [-1, 1]) {
    const m = new Mesh(new TorusGeometry(0.18, 0.04, 8, 16, Math.PI), ghisa)
    m.position.set(C.x + s * 1.12, 1.25, C.z); m.rotation.set(0, Math.PI / 2, s > 0 ? -Math.PI / 2 : Math.PI / 2)
    g.add(m)
  }

  // il brodo, che prende il colore di quello che c'è dentro
  const coloreBrodo = new Color(0x4b3f7d), metaBrodo = new Color(0x4b3f7d)
  const brodo = new Mesh(new CircleGeometry(0.97, 40),
    new MeshStandardMaterial({ color: coloreBrodo, emissive: coloreBrodo.clone().multiplyScalar(0.45), roughness: 0.15, metalness: 0.1 }))
  brodo.rotation.x = -Math.PI / 2
  brodo.position.set(C.x, POSTI.brodo + 0.22, C.z)
  g.add(brodo)

  // le bolle: affiorano, si gonfiano e scoppiano
  const NB = 14
  const bolle = new InstancedMesh(new SphereGeometry(0.09, 10, 8),
    new MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0, transparent: true, opacity: 0.85 }), NB)
  const datiBolle = Array.from({ length: NB }, (_, i) => ({ fase: i / NB, vel: 0.5 + (i * 7 % 5) / 8, x: 0, z: 0 }))
  const nuovoPosto = b => { const a = Math.random() * 7, r = Math.sqrt(Math.random()) * 0.78; b.x = C.x + Math.cos(a) * r; b.z = C.z + Math.sin(a) * r }
  datiBolle.forEach(nuovoPosto)
  g.add(bolle)
  let bollore = 1                                   // si alza quando entra qualcosa

  // il vapore
  const vapori = Array.from({ length: 9 }, (_, i) => {
    const v = new Sprite(new SpriteMaterial({ map: morbido, color: 0xd8ccff, transparent: true, opacity: 0, depthWrite: false }))
    v.userData.fase = i / 9
    g.add(v)
    return v
  })

  // il fuoco sotto
  for (let i = 0; i < 3; i++) {
    const l = new Mesh(new CylinderGeometry(0.09, 0.09, 1.1, 8), piatto(0x3a2414, { emissive: 0x401000 }))
    l.rotation.set(0, i * 1.05, Math.PI / 2); l.position.set(C.x, 0.1, C.z)
    g.add(l)
  }
  for (let i = 0; i < 7; i++) fiamma(C.x + (i - 3) * 0.17, 0.32, C.z + 0.35 + Math.sin(i) * 0.12, 1.6 + (i % 3) * 0.3)
  const luceFuoco = new PointLight(0xff8a3a, 6, 7, 1.6)
  luceFuoco.position.set(C.x, 0.8, C.z + 0.9)
  g.add(luceFuoco)

  function aggiorna(dt, t) {
    coloreBrodo.lerp(metaBrodo, Math.min(1, dt * 2.5))
    brodo.material.emissive.copy(coloreBrodo).multiplyScalar(0.45)
    bollore += (1 - bollore) * Math.min(1, dt * 0.8)
    for (const f of fiamme) {
      const k = 0.85 + Math.sin(t * 13 + f.userData.fase) * 0.08 + Math.sin(t * 7.3 + f.userData.fase * 2) * 0.07
      f.scale.set(f.userData.base.x * k, f.userData.base.y * (0.9 + (k - 0.85) * 2), 1)
    }
    luceFuoco.intensity = 5.5 + Math.sin(t * 11) * 0.6 + Math.sin(t * 17.3) * 0.4
    datiBolle.forEach((b, i) => {
      b.fase += dt * b.vel * bollore
      if (b.fase >= 1) { b.fase -= 1; nuovoPosto(b) }
      const s = Math.sin(b.fase * Math.PI) * (0.6 + bollore * 0.25)
      finto.position.set(b.x, POSTI.brodo + 0.22, b.z); finto.scale.setScalar(Math.max(0.001, s)); finto.updateMatrix()
      bolle.setMatrixAt(i, finto.matrix)
    })
    bolle.instanceMatrix.needsUpdate = true
    bolle.material.color.copy(coloreBrodo).lerp(BIANCO, 0.45)
    for (const v of vapori) {
      const f = (t * 0.12 * (0.8 + bollore * 0.3) + v.userData.fase) % 1
      v.position.set(C.x + Math.sin(f * 6 + v.userData.fase * 9) * 0.4, POSTI.brodo + 0.3 + f * 2.4, C.z + Math.cos(v.userData.fase * 7) * 0.3)
      v.scale.setScalar(0.5 + f * 1.4)
      v.material.opacity = Math.sin(f * Math.PI) * 0.16 * (0.7 + bollore * 0.3)
      v.material.color.copy(coloreBrodo).lerp(BIANCO, 0.65)
    }
  }

  return {
    aggiorna,
    colore(c) { metaBrodo.set(c) },
    ribolli(quanto = 3) { bollore = quanto },
    luceFuoco,
  }
}
