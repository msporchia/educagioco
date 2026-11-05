// Gli attrezzi del procedimento, sul tavolo a spesa fatta: il mortaio, il
// pestello, il tagliere, il coltello, il mestolo, il fiammifero, il mantice, la
// bacchetta, la brocca, il sale, il pepe, la fiala, la grattugia appesa al calderone; e sul bancone la roba
// comprata, con la foto del suo modello. Tutto si trascina (indice.js): ognuno ha
// una presa invisibile più grande di lui, se no il dito non lo prende.
import { Group, Mesh, Sprite, SpriteMaterial, LatheGeometry, CylinderGeometry, SphereGeometry, CircleGeometry, TorusGeometry, BoxGeometry,
         ConeGeometry, DodecahedronGeometry, ShapeGeometry, Shape, Vector2, Vector3,
         MeshStandardMaterial, MeshBasicMaterial, DoubleSide, TextureLoader, SRGBColorSpace, AdditiveBlending } from 'three'
import { POSTI } from './banco.js'
import { nomeSulBanco } from './trame.js'

const giro = punti => punti.map(([x, y]) => new Vector2(x, y))
const FILA = 0.1                // la z della fila sul tavolo
const COSTRUITI = ['mortaio', 'pestello', 'tagliere', 'coltello', 'mestolo', 'fiammifero', 'mantice', 'bacchetta', 'brocca', 'grattugia', 'sale', 'pepe', 'fiala']
const FETTE = 7
const PASSO_ROBA = 1.6          // quanto stanno distanti sul bancone
const GRANDE_ROBA = 1.25

export function creaAttrezzi(scena, { morbido, lamiera }) {
  const pietra = new MeshStandardMaterial({ color: 0x8d8a92, roughness: 0.85, side: DoubleSide })
  const metallo = new MeshStandardMaterial({ color: 0xc2c8d2, roughness: 0.35, metalness: 0.6, side: DoubleSide })
  const coccio = new MeshStandardMaterial({ color: 0xc87a4a, roughness: 0.6, side: DoubleSide })
  const pesto = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
  const capocchia = new MeshStandardMaterial({ color: 0xd8342a, roughness: 0.6 })
  const legno = new MeshStandardMaterial({ color: 0xb98a5a, roughness: 0.7, side: DoubleSide })
  const scuro = new MeshStandardMaterial({ color: 0x4a2e1c, roughness: 0.65 })
  const cuoio = new MeshStandardMaterial({ color: 0x7a4a2a, roughness: 0.9 })
  const oro = new MeshStandardMaterial({ color: 0xffd76a, emissive: 0x8a6210, roughness: 0.35 })
  const tagliato = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 })
  const ceramica = new MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.45 })
  const nero = new MeshStandardMaterial({ color: 0x2b2a2e, roughness: 0.5 })
  const vetro = new MeshStandardMaterial({ color: 0xcfeaff, roughness: 0.15, transparent: true, opacity: 0.38, side: DoubleSide, depthWrite: false })
  const succo = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  const niente = new MeshBasicMaterial({ visible: false })
  const presaGeo = new SphereGeometry(0.72, 8, 6)
  const trame = []

  // `x`, `y`, `z`: dove riposa; `giu`: com'è posato (in mano sta dritto)
  const attrezzo = (id, gruppo, x, y, giu, z = FILA, sdraiato = 0) => {
    const presa = new Mesh(presaGeo, niente)
    presa.position.y = 0.3
    presa.userData.attrezzo = id
    gruppo.add(presa)
    gruppo.userData = { id, presa, casa: new Vector3(x, y, z), giu, sdraiato }
    gruppo.position.copy(gruppo.userData.casa)
    gruppo.rotation.set(sdraiato, 0, giu)
    gruppo.visible = false
    scena.add(gruppo)
    return gruppo
  }

  // il mortaio, col pestato dentro
  const mortaio = new Group()
  mortaio.add(new Mesh(new LatheGeometry(giro([[0, 0], [0.42, 0], [0.5, 0.08], [0.62, 0.55], [0.66, 0.62], [0.56, 0.62], [0.44, 0.2], [0, 0.14]]), 28), pietra))
  const dentro = new Mesh(new CircleGeometry(0.48, 24), pesto)
  dentro.rotation.x = -Math.PI / 2; dentro.position.y = 0.4; dentro.visible = false
  mortaio.add(dentro)
  // i pezzi interi, che il pestello fa sparire
  const grumi = new Group()
  const geoGrumo = new DodecahedronGeometry(0.13)
  for (let i = 0; i < 6; i++) {
    const g = new Mesh(geoGrumo, pesto)
    g.position.set(Math.cos(i * 1.05) * 0.26, 0.44, Math.sin(i * 1.05) * 0.26)
    g.rotation.set(i, i * 2, 0)
    grumi.add(g)
  }
  grumi.visible = false
  mortaio.add(grumi)
  attrezzo('mortaio', mortaio, -2.0, 0, 0, -0.1)

  // il pestello: una clava corta di pietra, posato dritto verso destra
  const pestello = new Group()
  const asta = new Mesh(new CylinderGeometry(0.075, 0.13, 0.95, 12), pietra)
  asta.position.y = 0.48
  const punta = new Mesh(new SphereGeometry(0.15, 14, 10), pietra)
  punta.position.y = 0.06
  pestello.add(asta, punta)
  attrezzo('pestello', pestello, -1.15, 0.15, -1.45, -0.55)
  pestello.userData.presa.position.y = 0.5

  // il mestolo: una coppa di metallo fonda in cima a un manico lungo e sottile, col gancio
  const mestolo = new Group()
  const coppa = new LatheGeometry(giro([[0, 0], [0.13, 0.015], [0.22, 0.08], [0.27, 0.18], [0.28, 0.27]]), 22)
  coppa.rotateZ(-Math.PI / 2)
  const manico = new Mesh(new CylinderGeometry(0.028, 0.028, 1.5, 8), metallo)
  manico.position.set(0.22, 1.0, 0)
  const gancio = new Mesh(new TorusGeometry(0.07, 0.024, 8, 16, Math.PI * 1.3), metallo)
  gancio.position.set(0.22, 1.8, 0.0)
  mestolo.add(new Mesh(coppa, metallo), manico, gancio)
  attrezzo('mestolo', mestolo, 2.35, 0.3, 1.5, 0.35)
  mestolo.userData.presa.position.y = 0.7

  // il tagliere, con quello che si sminuzza: un pezzo intero che si accorcia e le fette
  const tagliere = new Group()
  const asse = new Mesh(new BoxGeometry(1.5, 0.09, 0.82), legno)
  asse.position.y = 0.05
  const manicoT = new Mesh(new BoxGeometry(0.34, 0.08, 0.2), legno)
  manicoT.position.set(0.9, 0.05, 0)
  tagliere.add(asse, manicoT)
  const intero = new Mesh(new CylinderGeometry(0.1, 0.12, 1.05, 12), tagliato)
  intero.rotation.z = Math.PI / 2
  intero.position.set(0, 0.2, 0)
  intero.visible = false
  tagliere.add(intero)
  const geoFetta = new CylinderGeometry(0.1, 0.1, 0.05, 10)
  const fette = Array.from({ length: FETTE }, (_, i) => {
    const f = new Mesh(geoFetta, tagliato)
    f.position.set(-0.55 + (i % 4) * 0.3, 0.13, i < 4 ? 0.24 : -0.22)
    f.rotation.set(0.4 + i, i * 2, 0.3 * i)
    f.visible = false
    tagliere.add(f)
    return f
  })
  attrezzo('tagliere', tagliere, -0.75, 0, 0, 0.55)
  tagliere.userData.presa.position.y = 0.1

  // il coltello: si posa di piatto, di taglio in mano
  const coltello = new Group()
  const profilo = new Shape()
  profilo.moveTo(-0.62, 0.02); profilo.quadraticCurveTo(-0.3, 0, 0.1, 0); profilo.lineTo(0.1, 0.22); profilo.lineTo(-0.3, 0.2); profilo.closePath()
  const lama = new Mesh(new ShapeGeometry(profilo), metallo)
  const impugnatura = new Mesh(new BoxGeometry(0.44, 0.1, 0.07), scuro)
  impugnatura.position.set(0.32, 0.15, 0)
  coltello.add(lama, impugnatura)
  attrezzo('coltello', coltello, 0.95, 0.04, 0, 0.85, -Math.PI / 2)
  coltello.userData.presa.position.set(0, 0.1, 0)

  // il fiammifero: si posa spento e si accende sfregandolo sulla legna
  const fiammifero = new Group()
  const stecco = new Mesh(new CylinderGeometry(0.04, 0.04, 0.95, 8), new MeshStandardMaterial({ color: 0xe6c88a, roughness: 0.8 }))
  stecco.position.y = 0.48
  const testa = new Mesh(new SphereGeometry(0.085, 10, 8), capocchia)
  testa.position.y = 0.98
  fiammifero.add(stecco, testa)
  const fiammella = new Sprite(new SpriteMaterial({ map: morbido, color: 0xffb347, blending: AdditiveBlending, depthWrite: false, transparent: true }))
  fiammella.position.y = 1.08; fiammella.scale.set(0.2, 0.34, 1); fiammella.visible = false
  fiammifero.add(fiammella)
  attrezzo('fiammifero', fiammifero, 1.75, 0.08, -1.5, -1.65)
  fiammifero.userData.presa.position.y = 0.5

  // il mantice: due assi col cuoio in mezzo, il becco in avanti
  const mantice = new Group()
  const soffietto = new Group()
  const pancia = new Mesh(new SphereGeometry(0.34, 16, 10), cuoio)
  pancia.scale.set(1.15, 0.5, 0.85)
  const assaSu = new Mesh(new CylinderGeometry(0.38, 0.38, 0.04, 20), legno)
  assaSu.scale.set(1.25, 1, 0.92); assaSu.position.y = 0.17
  soffietto.add(pancia, assaSu)
  soffietto.position.y = 0.2
  const assaGiu = new Mesh(new CylinderGeometry(0.38, 0.38, 0.04, 20), legno)
  assaGiu.scale.set(1.25, 1, 0.92); assaGiu.position.y = 0.04
  const becco = new Mesh(new ConeGeometry(0.075, 0.45, 12), metallo)
  becco.rotation.z = -Math.PI / 2; becco.position.set(0.62, 0.16, 0)
  const manici = new Mesh(new BoxGeometry(0.42, 0.05, 0.1), scuro)
  manici.position.set(-0.62, 0.1, 0)
  mantice.add(soffietto, assaGiu, becco, manici)
  attrezzo('mantice', mantice, -1.85, 0, 0, -1.55)
  mantice.userData.presa.position.y = 0.2
  mantice.userData.soffietto = soffietto
  mantice.userData.bocca = new Vector3(0.86, 0.16, 0)

  // la bacchetta, con la stellina in cima
  const bacchetta = new Group()
  const verga = new Mesh(new CylinderGeometry(0.018, 0.034, 1.15, 8), scuro)
  verga.position.y = 0.58
  const stellina = new Mesh(new DodecahedronGeometry(0.075), oro)
  stellina.position.y = 1.2
  bacchetta.add(verga, stellina)
  attrezzo('bacchetta', bacchetta, 0.9, 0.05, 1.5, -0.45)
  bacchetta.userData.presa.position.y = 0.55
  bacchetta.userData.punta = new Vector3(0, 1.2, 0)

  const brocca = new Group()
  brocca.add(new Mesh(new LatheGeometry(giro([[0, 0], [0.3, 0.01], [0.38, 0.3], [0.3, 0.68], [0.24, 0.82], [0.32, 0.92], [0.27, 0.92], [0.2, 0.8], [0.25, 0.66], [0, 0.6]]), 24), coccio))
  const ansa = new Mesh(new TorusGeometry(0.2, 0.04, 8, 16, Math.PI), coccio)
  ansa.position.set(0.34, 0.5, 0); ansa.rotation.z = -Math.PI / 2
  brocca.add(ansa)
  attrezzo('brocca', brocca, 2.3, 0, 0, -0.45)

  // il sale e il pepe: uno a ogni lato, col nome davanti perché la ricetta ne chiede uno
  const barattolo = (id, corpo, x) => {
    const g = new Group()
    g.add(new Mesh(new LatheGeometry(giro([[0, 0], [0.2, 0], [0.24, 0.06], [0.2, 0.36], [0.21, 0.42], [0, 0.42]]), 20), corpo))
    g.add(new Mesh(new LatheGeometry(giro([[0.21, 0.42], [0.19, 0.52], [0.08, 0.6], [0, 0.61]]), 20), metallo))
    const nome = nomeSulBanco(id)
    const targa = new Sprite(new SpriteMaterial({ map: nome, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }))
    targa.scale.set(0.95, 0.3, 1); targa.position.set(0, 0.02, 0.42)
    g.add(targa)
    trame.push(nome)
    attrezzo(id, g, x, 0, 0, 1.25)
    g.userData.targa = targa
    g.userData.presa.scale.setScalar(0.65)     // piena, ruberebbe il mestolo
    return g
  }
  const sale = barattolo('sale', ceramica, -2.1)
  const pepe = barattolo('pepe', nero, 2.1)

  // la fiala: si riempie dal calderone e si tappa, e resta sul tavolo col colore della pozione
  const fiala = new Group()
  const dentroFiala = new Group()
  dentroFiala.scale.setScalar(1.35)
  const liquido = new Mesh(new LatheGeometry(giro([[0, 0.02], [0.14, 0.03], [0.24, 0.14], [0.24, 0.3], [0.14, 0.44], [0.07, 0.54], [0.07, 0.68], [0, 0.68]]), 20), succo)
  liquido.visible = false
  const tappo = new Mesh(new CylinderGeometry(0.1, 0.08, 0.16, 12), legno)
  tappo.visible = false
  dentroFiala.add(liquido, new Mesh(new LatheGeometry(giro([[0, 0], [0.16, 0.01], [0.27, 0.14], [0.27, 0.3], [0.16, 0.46], [0.09, 0.56], [0.09, 0.78], [0.12, 0.8]]), 22), vetro), tappo)
  fiala.add(dentroFiala)
  attrezzo('fiala', fiala, 1.6, 0, 0, -0.7)
  fiala.userData.presa.position.y = 0.35
  fiala.userData.presa.scale.setScalar(0.75)

  // la grattugia: sta appesa al calderone, quello che ci si sfrega cade dentro
  const grattugia = new Group()
  const lamina = new Mesh(new BoxGeometry(0.58, 1.05, 0.03), new MeshStandardMaterial({ map: lamiera, roughness: 0.4, metalness: 0.5 }))
  const anello = new Mesh(new TorusGeometry(0.1, 0.022, 8, 16), metallo)
  anello.position.y = 0.6
  grattugia.add(lamina, anello)
  grattugia.position.set(POSTI.calderone.x + 1.2, 1.0, POSTI.calderone.z + 0.95)
  grattugia.rotation.set(-0.5, 0, -0.2)
  grattugia.visible = false
  grattugia.userData = { id: 'grattugia', casa: grattugia.position.clone() }
  scena.add(grattugia)

  // la ciotola: compare sul calderone per versare quello che arriva dal fondo dello schermo
  const ciotola = new Group()
  ciotola.add(new Mesh(new LatheGeometry(giro([[0, 0], [0.3, 0.01], [0.46, 0.18], [0.5, 0.34], [0.45, 0.34], [0.38, 0.2], [0, 0.1]]), 24), coccio))
  const sopra = new Mesh(new CircleGeometry(0.42, 20), new MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }))
  sopra.rotation.x = -Math.PI / 2; sopra.position.y = 0.27
  ciotola.add(sopra)
  ciotola.visible = false
  scena.add(ciotola)

  const tutti = { mortaio, pestello, tagliere, coltello, mestolo, fiammifero, mantice, bacchetta, brocca, grattugia, sale, pepe, fiala }
  let quali = []

  // la roba sul bancone: la foto, col nome davanti. Ognuna ha il suo posto, che non cambia
  function nuovaRoba({ i, nome, foto }, posto, quanti) {
    const g = new Group()
    const t = new TextureLoader().load(foto); t.colorSpace = SRGBColorSpace
    const figura = new Sprite(new SpriteMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }))
    const passo = Math.min(PASSO_ROBA, 3.8 / (quanti - 1 || 1))
    figura.scale.setScalar(Math.min(GRANDE_ROBA, passo)); figura.center.set(0.5, 0.05)
    const nomeT = nomeSulBanco(nome)
    const targa = new Sprite(new SpriteMaterial({ map: nomeT, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }))
    const targhe = Math.min(1.3, passo * 0.94)
    targa.scale.set(targhe, targhe * 0.32, 1); targa.position.set(0, 0.2, 0.42)
    g.add(figura, targa)
    trame.push(t, nomeT)
    return attrezzo(`roba:${i}`, g, (posto - (quanti - 1) / 2) * passo, POSTI.bancoY, 0, POSTI.bancoZ - 0.55)
  }

  return {
    ...tutti, ciotola,
    cosa: id => tutti[id],
    // `q`: { visibili, quali: gli attrezzi di questa tappa, pestato e tagliere: colore o null, macinato e tagliato: già lavorati,
    //       fiala: il colore, a pozione finita, roba: [{ i, nome, foto, posto }], quanti }
    imposta(q) {
      quali = q.visibili ? q.quali : []
      for (const id of COSTRUITI) tutti[id].visible = quali.includes(id)
      const sulBanco = q.visibili ? q.roba : []
      for (const d of sulBanco) tutti[`roba:${d.i}`] ||= nuovaRoba(d, d.posto, q.quanti)
      for (const id of Object.keys(tutti).filter(k => k.startsWith('roba:'))) tutti[id].visible = false
      for (const d of sulBanco) { tutti[`roba:${d.i}`].visible = true; quali = [...quali, `roba:${d.i}`] }
      dentro.visible = !!q.pestato
      if (q.pestato) pesto.color.set(q.pestato)
      this.macina(q.macinato ? 1 : 0)
      grumi.visible = !!q.pestato && !q.macinato
      if (q.tagliere) tagliato.color.set(q.tagliere)
      intero.visible = !!q.tagliere && !q.tagliato
      this.taglia(q.tagliere ? (q.tagliato ? 1 : 0) : -1)
      this.riempi(q.fiala ? 1 : 0, q.fiala)
      this.tappa(q.fiala ? 1 : 0)
    },
    // il pestello ha fatto `k`: i pezzi spariscono e la polvere sale
    macina(k) {
      for (const g of grumi.children) g.scale.setScalar(Math.max(0.001, 1 - k))
      dentro.position.y = 0.34 + 0.08 * k
    },
    // il coltello ha fatto `k`: il pezzo si accorcia, le fette aumentano. -1: non c'è niente
    taglia(k) {
      intero.scale.y = Math.max(0.001, 1 - k)
      intero.position.x = -0.5 * k
      fette.forEach((f, i) => { f.visible = k >= 0 && i < Math.round(k * FETTE) })
    },
    fiammella(si) { fiammella.visible = si },
    // la fiala piena a `k`, di quel colore
    riempi(k, colore) {
      liquido.visible = k > 0
      liquido.scale.y = Math.max(0.001, k)
      if (colore) succo.color.set(colore)
    },
    // il tappo scende: 0 non c'è, 1 è chiusa
    tappa(k) {
      tappo.visible = k > 0
      tappo.position.y = 1.15 - 0.33 * k
    },
    colpibili: () => quali.filter(id => id !== 'grattugia').map(id => tutti[id].userData.presa),
    tintaCiotola(colore) { sopra.material.color.set(colore) },
    rilascia() {
      for (const a of [...Object.values(tutti), ciotola]) { a.traverse(o => { if (o.geometry !== presaGeo) o.geometry?.dispose() }); scena.remove(a) }
      presaGeo.dispose()
      for (const t of trame) t.dispose()
      for (const m of [pietra, metallo, coccio, pesto, capocchia, legno, scuro, cuoio, oro, tagliato, ceramica, nero, vetro, succo, niente, sopra.material, stecco.material, lamina.material, fiammella.material,
                       sale.userData.targa.material, pepe.userData.targa.material]) m.dispose()
    },
  }
}
