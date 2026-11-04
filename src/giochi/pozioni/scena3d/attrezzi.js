// Gli attrezzi del procedimento: il mortaio col pestello, la ciotola che porta
// la roba al calderone, il mestolo, la brocca dell'acqua. Stanno sul tavolo
// quando la spesa è fatta; le mosse le fa indice.js.
import { Group, Mesh, LatheGeometry, CylinderGeometry, SphereGeometry, CircleGeometry, TorusGeometry, Vector2, MeshStandardMaterial, DoubleSide } from 'three'

const giro = punti => punti.map(([x, y]) => new Vector2(x, y))

export function creaAttrezzi(scena) {
  const pietra = new MeshStandardMaterial({ color: 0x8d8a92, roughness: 0.85, side: DoubleSide })
  const legno = new MeshStandardMaterial({ color: 0x9a6a3a, roughness: 0.7 })
  const coccio = new MeshStandardMaterial({ color: 0xc87a4a, roughness: 0.6, side: DoubleSide })
  const pesto = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })

  // il mortaio, col pestato dentro
  const mortaio = new Group()
  mortaio.add(new Mesh(new LatheGeometry(giro([[0, 0], [0.42, 0], [0.5, 0.08], [0.62, 0.55], [0.66, 0.62], [0.56, 0.62], [0.44, 0.2], [0, 0.14]]), 28), pietra))
  const dentro = new Mesh(new CircleGeometry(0.48, 24), pesto)
  dentro.rotation.x = -Math.PI / 2; dentro.position.y = 0.4; dentro.visible = false
  mortaio.add(dentro)
  const pestello = new Group()
  const asta = new Mesh(new CylinderGeometry(0.075, 0.13, 0.95, 12), pietra)
  asta.position.y = 0.48
  const punta = new Mesh(new SphereGeometry(0.15, 14, 10), pietra)
  punta.position.y = 0.06
  pestello.add(asta, punta)
  pestello.position.set(0.1, 0.34, 0); pestello.rotation.z = -0.3
  mortaio.add(pestello)
  mortaio.position.set(-1.65, 0, 0.7)
  mortaio.userData.casa = mortaio.position.clone()

  // la ciotola: porta nel calderone quello che non si pesta
  const ciotola = new Group()
  ciotola.add(new Mesh(new LatheGeometry(giro([[0, 0], [0.3, 0.01], [0.46, 0.18], [0.5, 0.34], [0.45, 0.34], [0.38, 0.2], [0, 0.1]]), 24), coccio))
  const sopra = new Mesh(new CircleGeometry(0.42, 20), new MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }))
  sopra.rotation.x = -Math.PI / 2; sopra.position.y = 0.27; sopra.visible = false
  ciotola.add(sopra)
  ciotola.position.set(0, 0, 0.9)
  ciotola.userData.casa = ciotola.position.clone()

  // il mestolo: si vede solo mentre gira
  const mestolo = new Group()
  const manico = new Mesh(new CylinderGeometry(0.045, 0.055, 2.3, 10), legno)
  manico.position.y = 1.1
  const paletta = new Mesh(new SphereGeometry(0.16, 12, 8), legno)
  paletta.scale.set(1, 0.5, 1)
  mestolo.add(manico, paletta)
  mestolo.visible = false

  // la brocca dell'acqua
  const brocca = new Group()
  brocca.add(new Mesh(new LatheGeometry(giro([[0, 0], [0.3, 0.01], [0.38, 0.3], [0.3, 0.68], [0.24, 0.82], [0.32, 0.92], [0.27, 0.92], [0.2, 0.8], [0.25, 0.66], [0, 0.6]]), 24), coccio))
  const ansa = new Mesh(new TorusGeometry(0.2, 0.04, 8, 16, Math.PI), coccio)
  ansa.position.set(0.34, 0.5, 0); ansa.rotation.z = -Math.PI / 2
  brocca.add(ansa)
  brocca.position.set(1.65, 0, 0.7)
  brocca.userData.casa = brocca.position.clone()

  const sulTavolo = [mortaio, ciotola, brocca]
  for (const a of sulTavolo) { a.visible = false; scena.add(a) }
  scena.add(mestolo)

  return {
    mortaio, pestello, ciotola, mestolo, brocca,
    // `q`: { visibili, pestato: colore o null }
    imposta(q) {
      for (const a of sulTavolo) a.visible = q.visibili
      dentro.visible = !!q.pestato
      if (q.pestato) pesto.color.set(q.pestato)
      ciotola.scale.setScalar(1)
    },
    riempiCiotola(colore) { sopra.visible = !!colore; if (colore) sopra.material.color.set(colore) },
    rilascia() {
      for (const a of [...sulTavolo, mestolo]) { a.traverse(o => o.geometry?.dispose()); scena.remove(a) }
      for (const m of [pietra, legno, coccio, pesto, sopra.material]) m.dispose()
    },
  }
}
