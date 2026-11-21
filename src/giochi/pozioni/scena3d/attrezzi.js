// Gli attrezzi del procedimento, sul tavolo a spesa fatta: il mortaio, il
// pestello, il tagliere, il coltello, il fiammifero, la brocca, il sale, il pepe, la
// fiala, la grattugia nel suo ciotolino; in fondo il mestolo appeso e la bacchetta nel
// suo vasetto; e sul bancone la roba comprata, nel suo
// recipiente o con la foto del suo modello. Tutto si trascina (indice.js): ognuno ha
// una presa invisibile più grande di lui, se no il dito non lo prende.
import { Group, Mesh, Sprite, SpriteMaterial, LatheGeometry, CylinderGeometry, SphereGeometry, CircleGeometry, TorusGeometry, BoxGeometry,
         DodecahedronGeometry, ExtrudeGeometry, ShapeGeometry, Shape, Vector2, Vector3,
         MeshStandardMaterial, MeshBasicMaterial, DoubleSide, TextureLoader, SRGBColorSpace, AdditiveBlending } from 'three'
import { POSTI } from './banco.js'
import { nomeSulBanco } from './trame.js'

const giro = punti => punti.map(([x, y]) => new Vector2(x, y))
const FILA = 0.1                // la z della fila sul tavolo
const COSTRUITI = ['mortaio', 'pestello', 'tagliere', 'coltello', 'mestolo', 'fiammifero', 'bacchetta', 'brocca', 'grattugia', 'ciotolino', 'sale', 'pepe', 'fiala']
const FETTE = 7
const PASSO_ROBA = 1.6          // quanto stanno distanti sul bancone
const GRANDE_ROBA = 1.25

export function creaAttrezzi(scena, { morbido, lamiera, polvere }) {
  const pietra = new MeshStandardMaterial({ color: 0x8d8a92, roughness: 0.85, side: DoubleSide })
  const metallo = new MeshStandardMaterial({ color: 0xc2c8d2, roughness: 0.35, metalness: 0.6, side: DoubleSide })
  const coccio = new MeshStandardMaterial({ color: 0xc87a4a, roughness: 0.6, side: DoubleSide })
  const pesto = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
  const capocchia = new MeshStandardMaterial({ color: 0xd8342a, roughness: 0.6 })
  const legno = new MeshStandardMaterial({ color: 0xb98a5a, roughness: 0.7, side: DoubleSide })
  const scuro = new MeshStandardMaterial({ color: 0x4a2e1c, roughness: 0.65 })
  const oro = new MeshStandardMaterial({ color: 0xffd76a, emissive: 0xa87a18, roughness: 0.35 })
  const notte = new MeshStandardMaterial({ color: 0x5b3fc4, emissive: 0x24146a, roughness: 0.3 })
  const tagliato = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 })
  const ceramica = new MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.45 })
  const nero = new MeshStandardMaterial({ color: 0x2b2a2e, roughness: 0.5 })
  const vetro = new MeshStandardMaterial({ color: 0xcfeaff, roughness: 0.15, transparent: true, opacity: 0.38, side: DoubleSide, depthWrite: false })
  const succo = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  const niente = new MeshBasicMaterial({ visible: false })
  const presaGeo = new SphereGeometry(0.72, 8, 6)
  const trame = [], tinte = []
  const ciotolaGeo = new LatheGeometry(giro([[0, 0], [0.34, 0.01], [0.52, 0.2], [0.58, 0.42], [0.54, 0.44], [0.46, 0.24], [0.3, 0.12], [0, 0.1]]), 28)
  const mucchioGeo = new SphereGeometry(0.47, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2)
  const bicchiereGeo = new LatheGeometry(giro([[0, 0], [0.32, 0], [0.38, 0.05], [0.38, 0.74], [0.42, 0.8]]), 24)
  const dentroBicchiereGeo = new CylinderGeometry(0.35, 0.35, 0.56, 22)
  dentroBicchiereGeo.translate(0, 0.28, 0)

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
  // i pezzi interi, che il pestello fa sparire: la polvere versata dalla ciotola non ne ha
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
  // quello che ha pescato nel brodo: un disco sulla bocca della coppa, che guarda di lato
  const pescata = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, side: DoubleSide })
  const cucchiaiata = new Mesh(new CircleGeometry(0.25, 20), pescata)
  cucchiaiata.rotation.y = Math.PI / 2
  cucchiaiata.position.x = 0.22
  cucchiaiata.visible = false
  mestolo.add(new Mesh(coppa, metallo), manico, gancio, cucchiaiata)
  attrezzo('mestolo', mestolo, POSTI.gancio.x - 0.22, POSTI.gancio.y - 1.84, 0, POSTI.gancio.z)
  mestolo.userData.presa.position.y = 0.7
  mestolo.userData.fisso = true

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
  attrezzo('fiammifero', fiammifero, 1.55, 0.08, -1.5, -1.65)
  fiammifero.userData.presa.position.y = 0.5

  // la bacchetta: nel suo vasetto, con la stella che brilla e si guarda attorno. Pende un po' indietro:
  // la camera guarda dall'alto, e dritta si accorcerebbe a niente
  const bacchetta = new Group()
  const verga = new Mesh(new CylinderGeometry(0.022, 0.04, 1.05, 10), notte)
  verga.position.y = 0.62
  const manicoB = new Mesh(new CylinderGeometry(0.05, 0.055, 0.3, 12), oro)
  manicoB.position.y = 0.15
  const anelli = [0.34, 0.8, 1.12].map(y => {
    const a = new Mesh(new TorusGeometry(0.038 - y * 0.012, 0.012, 8, 16), oro)
    a.rotation.x = Math.PI / 2; a.position.y = y
    return a
  })
  const punte = new Shape()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.1 : 0.23, a = Math.PI / 2 + i * Math.PI / 5
    if (i) punte.lineTo(Math.cos(a) * r, Math.sin(a) * r); else punte.moveTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  const forma = new ExtrudeGeometry(punte, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 3, curveSegments: 4 })
  forma.translate(0, 0, -0.025)
  const stella = new Mesh(forma, oro)
  stella.position.y = 1.36
  const alone = new Sprite(new SpriteMaterial({ map: morbido, color: 0xffdf8a, blending: AdditiveBlending, depthWrite: false, transparent: true }))
  alone.position.y = 1.36
  bacchetta.add(verga, manicoB, ...anelli, stella, alone)
  attrezzo('bacchetta', bacchetta, 2.42, 0.12, 0, 0.55, -0.55)
  bacchetta.userData.presa.position.y = 0.75
  bacchetta.userData.presa.scale.setScalar(0.8)
  bacchetta.userData.punta = new Vector3(0, 1.36, 0)
  bacchetta.userData.fisso = true
  const vasetto = new Mesh(new LatheGeometry(giro([[0, 0], [0.2, 0], [0.26, 0.1], [0.24, 0.3], [0.18, 0.38], [0.21, 0.42], [0.14, 0.42], [0.1, 0.34], [0, 0.3]]), 22), notte)
  const orlo = new Mesh(new TorusGeometry(0.2, 0.018, 8, 22), oro)
  orlo.rotation.x = Math.PI / 2; orlo.position.y = 0.42
  const portaBacchetta = new Group()
  portaBacchetta.add(vasetto, orlo)
  portaBacchetta.position.set(2.42, 0, 0.45)
  portaBacchetta.visible = false
  scena.add(portaBacchetta)

  const brocca = new Group()
  brocca.add(new Mesh(new LatheGeometry(giro([[0, 0], [0.3, 0.01], [0.38, 0.3], [0.3, 0.68], [0.24, 0.82], [0.32, 0.92], [0.27, 0.92], [0.2, 0.8], [0.25, 0.66], [0, 0.6]]), 24), coccio))
  const ansa = new Mesh(new TorusGeometry(0.2, 0.04, 8, 16, Math.PI), coccio)
  ansa.position.set(0.34, 0.5, 0); ansa.rotation.z = -Math.PI / 2
  brocca.add(ansa)
  attrezzo('brocca', brocca, -1.62, 0, 0, -1.55)

  // il sale e il pepe: negli angoli in fondo, col nome davanti perché la ricetta ne chiede uno
  const barattolo = (id, corpo, x) => {
    const g = new Group()
    g.add(new Mesh(new LatheGeometry(giro([[0, 0], [0.2, 0], [0.24, 0.06], [0.2, 0.36], [0.21, 0.42], [0, 0.42]]), 20), corpo))
    g.add(new Mesh(new LatheGeometry(giro([[0.21, 0.42], [0.19, 0.52], [0.08, 0.6], [0, 0.61]]), 20), metallo))
    const nome = nomeSulBanco(id)
    const targa = new Sprite(new SpriteMaterial({ map: nome, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }))
    targa.scale.set(0.95, 0.3, 1); targa.position.set(0, 0.02, 0.42)
    g.add(targa)
    trame.push(nome)
    attrezzo(id, g, x, 0, 0, -2.7)
    g.userData.targa = targa
    g.userData.presa.scale.setScalar(0.65)     // piena, ruberebbe il mestolo
    return g
  }
  const sale = barattolo('sale', ceramica, -2.4)
  const pepe = barattolo('pepe', nero, 2.4)

  // la fiala: la riempie il mestolo, si tappa e resta sul tavolo col colore della pozione
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

  // la grattugia: in piedi sul tavolo dentro il suo ciotolino, che poi si versa come il mortaio
  const grattugia = new Group()
  const lamina = new Mesh(new BoxGeometry(0.58, 1.05, 0.03), new MeshStandardMaterial({ map: lamiera, roughness: 0.4, metalness: 0.5 }))
  const anello = new Mesh(new TorusGeometry(0.1, 0.022, 8, 16), metallo)
  anello.position.y = 0.6
  grattugia.add(lamina, anello)
  grattugia.position.set(1.7, 0.62, 0.75)
  grattugia.rotation.set(-0.3, 0, -0.12)
  grattugia.visible = false
  grattugia.userData = { id: 'grattugia', casa: grattugia.position.clone() }
  scena.add(grattugia)
  const ciotolino = new Group(), dentroCiotolino = new Group(), sfarinato = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, map: polvere })
  const mucchietto = new Mesh(mucchioGeo, sfarinato)
  mucchietto.position.y = 0.2
  dentroCiotolino.scale.setScalar(0.75)        // lo stesso della roba, in piccolo. Fuori dal gruppo: `aCasa` rimette la scala a 1
  dentroCiotolino.add(new Mesh(ciotolaGeo, coccio), mucchietto)
  ciotolino.add(dentroCiotolino)
  attrezzo('ciotolino', ciotolino, 1.7, 0, 0, 0.95)
  ciotolino.userData.presa.position.y = 0.15
  ciotolino.userData.presa.scale.setScalar(0.7)

  const tutti = { mortaio, pestello, tagliere, coltello, mestolo, fiammifero, bacchetta, brocca, grattugia, ciotolino, sale, pepe, fiala }
  let quali = [], stesa = 1      // lo schermo largo li allontana dal calderone, a misura uguale (indice.js)

  // quello che si è misurato arriva com'era sulla bilancia o nel cilindro: `vuota` lo fa calare mentre si versa
  function nelRecipiente(tipo, colore) {
    const corpo = new Group(), tinta = new MeshStandardMaterial({ color: colore, roughness: tipo === 'ciotola' ? 0.95 : 0.2, ...(tipo === 'ciotola' ? { map: polvere } : { emissive: colore, emissiveIntensity: 0.3 }) })
    tinte.push(tinta)
    if (tipo === 'ciotola') {
      const mucchio = new Mesh(mucchioGeo, tinta)
      mucchio.position.y = 0.26; mucchio.scale.y = 0.72
      corpo.add(new Mesh(ciotolaGeo, coccio), mucchio)
      return { corpo, bocca: new Vector3(-0.56, 0.42, 0), vuota: k => { mucchio.scale.set(1 - k * 0.5, Math.max(0.001, 0.72 * (1 - k)), 1 - k * 0.5) } }
    }
    const liquido = new Mesh(dentroBicchiereGeo, tinta)
    liquido.position.y = 0.04
    corpo.add(liquido, new Mesh(bicchiereGeo, vetro))
    return { corpo, bocca: new Vector3(-0.42, 0.78, 0), vuota: k => { liquido.scale.y = Math.max(0.001, 1 - k) } }
  }

  // la roba sul bancone, col nome davanti. Ognuna ha il suo posto, che non cambia
  function nuovaRoba({ i, nome, foto, recipiente, colore }, posto, quanti) {
    const g = new Group()
    const passo = Math.min(PASSO_ROBA, 3.8 / (quanti - 1 || 1))
    const dentro = recipiente && nelRecipiente(recipiente, colore)
    if (dentro) {
      dentro.corpo.scale.setScalar(Math.min(0.92, passo / 1.35))
      g.add(dentro.corpo)
    } else {
      const t = new TextureLoader().load(foto); t.colorSpace = SRGBColorSpace
      const figura = new Sprite(new SpriteMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }))
      figura.scale.setScalar(Math.min(GRANDE_ROBA, passo)); figura.center.set(0.5, 0.05)
      g.add(figura)
      trame.push(t)
    }
    const nomeT = nomeSulBanco(nome)
    const targa = new Sprite(new SpriteMaterial({ map: nomeT, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }))
    const targhe = Math.min(1.3, passo * 0.94)
    targa.scale.set(targhe, targhe * 0.32, 1); targa.position.set(0, 0.2, dentro ? 0.66 : 0.42)   // una ciotola è bassa: la coprirebbe
    g.add(targa)
    trame.push(nomeT)
    attrezzo(`roba:${i}`, g, (posto - (quanti - 1) / 2) * passo * stesa, POSTI.bancoY, 0, POSTI.bancoZ - 0.55)
    g.userData.targa = targa
    if (dentro) Object.assign(g.userData, { vuota: dentro.vuota, bocca: dentro.bocca.clone().multiplyScalar(dentro.corpo.scale.x) })
    return g
  }

  return {
    ...tutti,
    cosa: id => tutti[id],
    // tutto si allontana in x dal calderone, anche quello spostato col dito; il mestolo segue il suo gancio (banco.js)
    stendi(f) {
      const k = f / stesa
      stesa = f
      for (const [id, a] of Object.entries(tutti)) {
        const casa = a.userData.casa, fermo = a.position.distanceTo(casa) < 1e-3
        casa.x = id === 'mestolo' ? POSTI.gancio.x * f - 0.22 : casa.x * k
        if (fermo) a.position.x = casa.x
      }
      portaBacchetta.position.x *= k
    },
    // `q`: { visibili, quali: gli attrezzi di questa tappa, pestato e tagliere: colore o null, grumi: nel mortaio c'è roba intera, macinato e tagliato: già lavorati,
    //       fiala: il colore, a pozione finita, roba: [{ i, nome, foto, posto }], quanti }
    imposta(q) {
      quali = q.visibili ? q.quali : []
      for (const id of COSTRUITI) tutti[id].visible = quali.includes(id)
      portaBacchetta.visible = bacchetta.visible
      const sulBanco = q.visibili ? q.roba : []
      for (const d of sulBanco) tutti[`roba:${d.i}`] ||= nuovaRoba(d, d.posto, q.quanti)
      for (const id of Object.keys(tutti).filter(k => k.startsWith('roba:'))) tutti[id].visible = false
      for (const d of sulBanco) { tutti[`roba:${d.i}`].visible = true; quali = [...quali, `roba:${d.i}`] }
      dentro.visible = !!q.pestato
      if (q.pestato) pesto.color.set(q.pestato)
      this.macina(q.macinato ? 1 : 0)
      grumi.visible = !!q.pestato && !q.macinato && q.grumi
      if (q.tagliere) tagliato.color.set(q.tagliere)
      intero.visible = !!q.tagliere && !q.tagliato
      this.taglia(q.tagliere ? (q.tagliato ? 1 : 0) : -1)
      this.grattato(q.ciotolino ? 1 : 0, q.ciotolino)
      this.riempi(q.fiala ? 1 : 0, q.fiala)
      this.tappa(q.fiala ? 1 : 0)
    },
    // la stella si guarda attorno e brilla: col tempo, anche quando è in mano
    aggiorna(t) {
      stella.rotation.set(-0.64 - bacchetta.rotation.x, Math.sin(t * 1.1) * 0.55, Math.sin(t * 0.7) * 0.12)   // guarda la camera
      alone.scale.setScalar(0.72 + Math.sin(t * 2.6) * 0.13)
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
    // quello che è caduto nel ciotolino: `k` quanto è pieno
    grattato(k, colore) {
      mucchietto.visible = k > 0
      mucchietto.scale.set(0.3 + k * 0.7, Math.max(0.001, 0.72 * k), 0.3 + k * 0.7)
      if (colore) sfarinato.color.set(colore)
    },
    // il mestolo col brodo: `k` quanto ne resta, null è vuoto
    pesca(colore, k = 1) {
      cucchiaiata.visible = !!colore
      if (!colore) return
      pescata.color.set(colore)
      cucchiaiata.scale.setScalar(Math.max(0.001, k))
    },
    get pescato() { return cucchiaiata.visible },
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
    rilascia() {
      for (const a of [...Object.values(tutti), portaBacchetta]) { a.traverse(o => { if (o.geometry !== presaGeo) o.geometry?.dispose() }); scena.remove(a) }
      presaGeo.dispose()
      for (const t of trame) t.dispose()
      for (const m of [pietra, metallo, coccio, pesto, capocchia, legno, scuro, oro, notte, tagliato, ceramica, nero, vetro, succo, pescata, sfarinato, niente, stecco.material, lamina.material, fiammella.material, alone.material,
                       sale.userData.targa.material, pepe.userData.targa.material, ...tinte]) m.dispose()
    },
  }
}
