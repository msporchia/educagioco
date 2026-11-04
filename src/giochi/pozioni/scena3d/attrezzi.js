// Gli attrezzi del procedimento, sul tavolo a spesa fatta: il mortaio, il
// pestello, il mestolo, il fiammifero, la brocca; e sul bancone la roba comprata,
// con la foto del suo modello. Tutto si trascina (indice.js): ognuno ha una presa
// invisibile più grande di lui, se no il dito non lo prende.
import { Group, Mesh, Sprite, SpriteMaterial, LatheGeometry, CylinderGeometry, SphereGeometry, CircleGeometry, TorusGeometry, Vector2, Vector3,
         MeshStandardMaterial, MeshBasicMaterial, DoubleSide, TextureLoader, SRGBColorSpace } from 'three'
import { POSTI } from './banco.js'
import { nomeSulBanco } from './trame.js'

const giro = punti => punti.map(([x, y]) => new Vector2(x, y))
const FILA = 0.1                // la z della fila sul tavolo
const COSTRUITI = ['mortaio', 'pestello', 'mestolo', 'fiammifero', 'brocca']
const PASSO_ROBA = 1.6          // quanto stanno distanti sul bancone
const GRANDE_ROBA = 1.25

export function creaAttrezzi(scena) {
  const pietra = new MeshStandardMaterial({ color: 0x8d8a92, roughness: 0.85, side: DoubleSide })
  const metallo = new MeshStandardMaterial({ color: 0xc2c8d2, roughness: 0.35, metalness: 0.6, side: DoubleSide })
  const coccio = new MeshStandardMaterial({ color: 0xc87a4a, roughness: 0.6, side: DoubleSide })
  const pesto = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
  const capocchia = new MeshStandardMaterial({ color: 0xd8342a, roughness: 0.6 })
  const niente = new MeshBasicMaterial({ visible: false })
  const presaGeo = new SphereGeometry(0.72, 8, 6)

  // `x`, `y`, `z`: dove riposa; `giu`: com'è posato (in mano sta dritto)
  const attrezzo = (id, gruppo, x, y, giu, z = FILA) => {
    const presa = new Mesh(presaGeo, niente)
    presa.position.y = 0.3
    presa.userData.attrezzo = id
    gruppo.add(presa)
    gruppo.userData = { id, presa, casa: new Vector3(x, y, z), giu }
    gruppo.position.copy(gruppo.userData.casa)
    gruppo.rotation.z = giu
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
  attrezzo('mortaio', mortaio, -1.75, 0, 0)

  // il pestello: una clava corta di pietra, posato dritto verso destra
  const pestello = new Group()
  const asta = new Mesh(new CylinderGeometry(0.075, 0.13, 0.95, 12), pietra)
  asta.position.y = 0.48
  const punta = new Mesh(new SphereGeometry(0.15, 14, 10), pietra)
  punta.position.y = 0.06
  pestello.add(asta, punta)
  attrezzo('pestello', pestello, -0.6, 0.15, -1.45, -0.6)
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
  attrezzo('mestolo', mestolo, 1.3, 0.3, 1.5, 0.6)
  mestolo.userData.presa.position.y = 0.7

  // il fiammifero: si posa spento e si accende sotto il calderone
  const fiammifero = new Group()
  const stecco = new Mesh(new CylinderGeometry(0.04, 0.04, 0.95, 8), new MeshStandardMaterial({ color: 0xe6c88a, roughness: 0.8 }))
  stecco.position.y = 0.48
  const testa = new Mesh(new SphereGeometry(0.085, 10, 8), capocchia)
  testa.position.y = 0.98
  fiammifero.add(stecco, testa)
  attrezzo('fiammifero', fiammifero, 1.55, 0.08, -1.5, -2)
  fiammifero.userData.presa.position.y = 0.5

  const brocca = new Group()
  brocca.add(new Mesh(new LatheGeometry(giro([[0, 0], [0.3, 0.01], [0.38, 0.3], [0.3, 0.68], [0.24, 0.82], [0.32, 0.92], [0.27, 0.92], [0.2, 0.8], [0.25, 0.66], [0, 0.6]]), 24), coccio))
  const ansa = new Mesh(new TorusGeometry(0.2, 0.04, 8, 16, Math.PI), coccio)
  ansa.position.set(0.34, 0.5, 0); ansa.rotation.z = -Math.PI / 2
  brocca.add(ansa)
  attrezzo('brocca', brocca, 2.05, 0, 0, -0.4)

  // la ciotola: compare sul calderone per versare quello che arriva dal fondo dello schermo
  const ciotola = new Group()
  ciotola.add(new Mesh(new LatheGeometry(giro([[0, 0], [0.3, 0.01], [0.46, 0.18], [0.5, 0.34], [0.45, 0.34], [0.38, 0.2], [0, 0.1]]), 24), coccio))
  const sopra = new Mesh(new CircleGeometry(0.42, 20), new MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }))
  sopra.rotation.x = -Math.PI / 2; sopra.position.y = 0.27
  ciotola.add(sopra)
  ciotola.visible = false
  scena.add(ciotola)

  const tutti = { mortaio, pestello, mestolo, fiammifero, brocca }
  let quali = []

  // la roba sul bancone: la foto, col nome davanti. Ognuna ha il suo posto, che non cambia
  const trame = []
  function nuovaRoba({ i, nome, foto }, posto, quanti) {
    const g = new Group()
    const t = new TextureLoader().load(foto); t.colorSpace = SRGBColorSpace
    const figura = new Sprite(new SpriteMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }))
    figura.scale.setScalar(GRANDE_ROBA); figura.center.set(0.5, 0.05)
    const nomeT = nomeSulBanco(nome)
    const targa = new Sprite(new SpriteMaterial({ map: nomeT, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }))
    targa.scale.set(1.3, 0.42, 1); targa.position.set(0, 0.2, 0.42)
    g.add(figura, targa)
    trame.push(t, nomeT)
    return attrezzo(`roba:${i}`, g, (posto - (quanti - 1) / 2) * Math.min(PASSO_ROBA, 5.6 / (quanti - 1 || 1)), POSTI.bancoY, 0, POSTI.bancoZ - 0.55)
  }

  return {
    ...tutti, ciotola,
    cosa: id => tutti[id],
    // `q`: { visibili, quali: gli attrezzi di questa tappa, pestato: colore o null, roba: [{ i, nome, foto, posto }], quanti }
    imposta(q) {
      quali = q.visibili ? q.quali : []
      for (const id of COSTRUITI) tutti[id].visible = quali.includes(id)
      const sulBanco = q.visibili ? q.roba : []
      for (const d of sulBanco) tutti[`roba:${d.i}`] ||= nuovaRoba(d, d.posto, q.quanti)
      for (const id of Object.keys(tutti).filter(k => k.startsWith('roba:'))) tutti[id].visible = false
      for (const d of sulBanco) { tutti[`roba:${d.i}`].visible = true; quali = [...quali, `roba:${d.i}`] }
      dentro.visible = !!q.pestato
      if (q.pestato) pesto.color.set(q.pestato)
    },
    colpibili: () => quali.map(id => tutti[id].userData.presa),
    tintaCiotola(colore) { sopra.material.color.set(colore) },
    rilascia() {
      for (const a of [...Object.values(tutti), ciotola]) { a.traverse(o => { if (o.geometry !== presaGeo) o.geometry?.dispose() }); scena.remove(a) }
      presaGeo.dispose()
      for (const t of trame) t.dispose()
      for (const m of [pietra, metallo, coccio, pesto, capocchia, niente, sopra.material, stecco.material]) m.dispose()
    },
  }
}
