// La consegna del mercante: le ampolle ordinate compaiono sul bancone, in
// fila, con la targhetta. Sul listino la figura non c'è, per non suggerire;
// qui sono già comprate e si vedono a misura reale, così si capisce cosa si
// è ordinato: il fiasco e il barattolo grandi quanto la roba, la radice
// lunga quanto sarà sul metro (docs/pozioni/regole.md).
import { Group, Mesh, Sprite, SpriteMaterial, LatheGeometry, CylinderGeometry, TorusGeometry, BoxGeometry, CircleGeometry,
         Vector2, Vector3, Color, MeshStandardMaterial, DoubleSide } from 'three'
import { POSTI } from './banco.js'
import { cartellino } from './trame.js'

const PASSO = 1.5
const LUNGA = 0.75              // la radice di partenza: la scala la porta alla misura vera
const PIU_LUNGA = 1.45          // sul bancone oltre non ci sta
const v2 = a => a.map(([x, y]) => new Vector2(x, y))

// una radice un po' storta e bitorzoluta
function radice(l) {
  const r = new CylinderGeometry(0.075, 0.105, l, 10, 8)
  const p = r.attributes.position
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), k = 1 + Math.sin(y * 23 + i) * 0.08
    p.setX(i, p.getX(i) * k + Math.sin(y * 4) * 0.03); p.setZ(i, p.getZ(i) * k)
  }
  r.computeVertexNormals()
  return r
}

export function creaAmpolle(scena, trame) {
  const g = new Group()
  scena.add(g)
  let posti = []

  const vetro = new MeshStandardMaterial({ color: 0xe6f4ff, transparent: true, opacity: 0.28, roughness: 0.05,
                                           depthWrite: false, side: DoubleSide })
  const sughero = new MeshStandardMaterial({ color: 0xb08050, roughness: 0.9 })
  const legno = new MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.8 })
  const geo = {
    fiasco: new LatheGeometry(v2([[0, 0], [0.2, 0], [0.3, 0.08], [0.33, 0.2], [0.3, 0.33], [0.2, 0.42], [0.1, 0.48], [0.09, 0.66], [0.11, 0.7]]), 24),
    succo: new LatheGeometry(v2([[0, 0.02], [0.18, 0.02], [0.27, 0.09], [0.3, 0.2], [0.27, 0.3], [0, 0.3]]), 24),
    tappo: new CylinderGeometry(0.085, 0.075, 0.12, 12),
    vaso: new CylinderGeometry(0.27, 0.27, 0.55, 24, 1, true),
    fondoVaso: new CircleGeometry(0.27, 24),
    polvere: new CylinderGeometry(0.245, 0.245, 0.4, 24),
    panno: new CylinderGeometry(0.32, 0.3, 0.07, 24),
    spago: new TorusGeometry(0.28, 0.018, 6, 24),
    piolo: new BoxGeometry(0.08, 0.12, 0.3),
    radice: radice(LUNGA),
  }
  geo.vaso.translate(0, 0.275, 0); geo.fondoVaso.rotateX(-Math.PI / 2); geo.polvere.translate(0, 0.2, 0)

  function costruisci(d, k, n) {
    const corpo = new Group(), tinta = new Color(d.colore)
    // `misura`: quanto dose è questa ampolla. Il volume cresce col cubo, quindi la scala con la radice cubica
    const s = 0.45 + 0.7 * Math.cbrt(Math.min(1.5, d.misura))
    const mat = []
    let alto, bocca, chiuso = []            // quello che si toglie prima di versare
    if (d.famiglia === 'capacita') {
      const succo = new MeshStandardMaterial({ color: tinta, emissive: tinta.clone().multiplyScalar(0.3), roughness: 0.2, transparent: true, opacity: 0.9 })
      mat.push(succo)
      const t = new Mesh(geo.tappo, sughero); t.position.y = 0.73
      corpo.add(new Mesh(geo.succo, succo), new Mesh(geo.fiasco, vetro), t)
      alto = 0.8; bocca = new Vector3(0, 0.7, 0); chiuso = [t]
    } else if (d.famiglia === 'massa') {
      const polvere = new MeshStandardMaterial({ color: tinta, roughness: 0.95, map: trame.polvere })
      const panno = new MeshStandardMaterial({ color: tinta.clone().offsetHSL(0.05, -0.2, -0.25), roughness: 1 })
      mat.push(polvere, panno)
      const p = new Mesh(geo.panno, panno); p.position.y = 0.58
      const sp = new Mesh(geo.spago, sughero); sp.rotation.x = Math.PI / 2; sp.position.y = 0.52
      corpo.add(new Mesh(geo.polvere, polvere), new Mesh(geo.vaso, vetro), new Mesh(geo.fondoVaso, vetro), p, sp)
      alto = 0.62; bocca = new Vector3(0, 0.6, 0); chiuso = [p, sp]
    } else {
      const scorza = new MeshStandardMaterial({ color: tinta, roughness: 0.85, map: trame.radice })
      mat.push(scorza)
      const lungo = Math.max(0.1, Math.min(PIU_LUNGA, d.lungo))
      const r = new Mesh(geo.radice, scorza); r.rotation.z = Math.PI / 2; r.position.y = 0.2; r.scale.y = lungo / LUNGA
      for (const x of [-lungo * 0.3, lungo * 0.3]) { const pp = new Mesh(geo.piolo, legno); pp.position.set(x, 0.06, 0); corpo.add(pp) }
      corpo.add(r)
      alto = 0.3; bocca = new Vector3(lungo / 2, 0.2, 0)
      corpo.userData.lungo = lungo
    }
    if (d.famiglia !== 'lunghezza') { corpo.scale.setScalar(s); alto *= s; bocca.multiplyScalar(s) }
    const cartello = new Sprite(new SpriteMaterial({ map: cartellino(d.testo), transparent: true, depthWrite: false }))
    cartello.scale.set(1.12, 0.62, 1)
    cartello.position.y = alto + 0.5
    const gruppo = new Group()
    gruppo.add(corpo, cartello)
    const casa = new Vector3((k - (n - 1) / 2) * PASSO, POSTI.bancoY, POSTI.bancoZ)
    gruppo.position.copy(casa)
    gruppo.scale.setScalar(0.001)
    g.add(gruppo)
    return { gruppo, corpo, cartello, mat, casa, chiuso, famiglia: d.famiglia, bocca, entra: -0.25 * k, fase: k * 1.3 }
  }

  function butta(a) {
    g.remove(a.gruppo)
    a.cartello.material.map.dispose(); a.cartello.material.dispose()
    for (const m of a.mat) m.dispose()
  }

  function aggiorna(dt, t) {
    for (const a of posti) {
      if (!a || a.preso) continue
      if (a.entra < 1) {
        a.entra = Math.min(1, a.entra + dt * 3)
        const e = Math.max(0, a.entra)
        // arriva dall'alto e si posa sul bancone
        a.gruppo.scale.setScalar(Math.max(0.001, e))
        a.gruppo.position.y = a.casa.y + (1 - e) * (1 - e) * 1.2 + Math.sin(e * Math.PI) * 0.12
      }
      a.cartello.material.rotation = Math.sin(t * 1.1 + a.fase) * 0.03
    }
  }

  const sgombra = () => { for (const a of posti) if (a) butta(a); posti = [] }
  return {
    aggiorna, sgombra,
    // le ampolle dell'ordine compaiono sul bancone: `voci` [{ testo, colore, famiglia }]
    consegna(voci) { sgombra(); posti = voci.map((d, k) => costruisci(d, k, voci.length)) },
    // la si prende dal bancone per versarla
    stacca(k) { const a = posti[k]; a.preso = true; a.gruppo.scale.setScalar(1); return a },
    via(k) { if (posti[k]) { butta(posti[k]); posti[k] = null } },
    rilascia() { sgombra(); geo.radice.dispose() },
  }
}
