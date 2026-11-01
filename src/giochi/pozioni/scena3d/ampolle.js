// Il banchetto del mercante: quattro ampolle sul bancone, ognuna col suo
// cartellino (quanto c'è dentro, come l'ha scritto lui, e il prezzo).
// Il liquido sta in un fiasco, la polvere in un barattolo, la radice è un
// pezzo di radice coricato. Più ce n'è, più è grande: la grandezza vera
// delle cose si vede anche senza leggere.
import { Group, Mesh, Sprite, SpriteMaterial, LatheGeometry, CylinderGeometry, TorusGeometry, BoxGeometry, CircleGeometry,
         Vector2, Vector3, Color, MeshStandardMaterial, MeshBasicMaterial, DoubleSide } from 'three'
import { POSTI } from './banco.js'
import { cartellino } from './trame.js'

const PASSO = 1.2
const v2 = a => a.map(([x, y]) => new Vector2(x, y))

export function creaAmpolle(scena, trame) {
  const g = new Group()
  scena.add(g)
  let posti = [], vecchie = [], firma = ''

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
    colpo: new BoxGeometry(1.15, 1.9, 1.0),
  }
  geo.vaso.translate(0, 0.275, 0); geo.fondoVaso.rotateX(-Math.PI / 2); geo.polvere.translate(0, 0.2, 0)
  geo.colpo.translate(0, 0.85, 0)
  const invisibile = new MeshBasicMaterial({ visible: false })

  // una radice un po' storta e bitorzoluta, lunga `l`
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

  function costruisci(d, k, n) {
    const s = 0.62 + 0.42 * Math.sqrt(Math.min(1, d.misura))
    const corpo = new Group(), tinta = new Color(d.colore)
    const mat = []
    let alto, bocca
    if (d.famiglia === 'capacita') {
      const succo = new MeshStandardMaterial({ color: tinta, emissive: tinta.clone().multiplyScalar(0.3), roughness: 0.2, transparent: true, opacity: 0.9 })
      mat.push(succo)
      const t = new Mesh(geo.tappo, sughero); t.position.y = 0.73
      corpo.add(new Mesh(geo.succo, succo), new Mesh(geo.fiasco, vetro), t)
      alto = 0.8; bocca = new Vector3(0, 0.7, 0)
    } else if (d.famiglia === 'massa') {
      const polvere = new MeshStandardMaterial({ color: tinta, roughness: 0.95, map: trame.polvere }), panno = new MeshStandardMaterial({ color: tinta.clone().offsetHSL(0.05, -0.2, -0.25), roughness: 1 })
      mat.push(polvere, panno)
      const p = new Mesh(geo.panno, panno); p.position.y = 0.58
      const sp = new Mesh(geo.spago, sughero); sp.rotation.x = Math.PI / 2; sp.position.y = 0.52
      corpo.add(new Mesh(geo.polvere, polvere), new Mesh(geo.vaso, vetro), new Mesh(geo.fondoVaso, vetro), p, sp)
      alto = 0.62; bocca = new Vector3(0, 0.6, 0)
    } else {
      const l = 0.32 + 0.72 * Math.sqrt(Math.min(1, d.misura))
      const scorza = new MeshStandardMaterial({ color: tinta, roughness: 0.85, map: trame.radice })
      mat.push(scorza)
      const r = new Mesh(radice(l), scorza); r.rotation.z = Math.PI / 2; r.position.y = 0.2
      r.userData.geoPropria = true
      for (const x of [-l * 0.3, l * 0.3]) { const pp = new Mesh(geo.piolo, legno); pp.position.set(x, 0.06, 0); corpo.add(pp) }
      corpo.add(r)
      alto = 0.3; bocca = new Vector3(l / 2, 0.2, 0)
      corpo.userData.lungo = l
    }
    if (d.famiglia !== 'lunghezza') corpo.scale.setScalar(s)
    const sc = d.famiglia === 'lunghezza' ? 1 : s
    const cartello = new Sprite(new SpriteMaterial({ map: cartellino(d.testo, d.prezzo), transparent: true, depthWrite: false }))
    cartello.scale.set(1.04, 0.57, 1)
    cartello.position.y = alto * sc + 0.48
    const colpo = new Mesh(geo.colpo, invisibile); colpo.userData.tocca = { che: 'ampolla', k }
    const gruppo = new Group()
    gruppo.add(corpo, cartello, colpo)
    const casa = new Vector3((k - (n - 1) / 2) * PASSO, POSTI.bancoY, POSTI.bancoZ)
    gruppo.position.copy(casa)
    gruppo.scale.setScalar(0.001)
    g.add(gruppo)
    return { gruppo, corpo, cartello, colpo, mat, casa, famiglia: d.famiglia, colore: d.colore, dato: d,
             bocca: bocca.multiplyScalar(sc), entra: 0, via: -1, fase: k * 1.3 }
  }

  function butta(a) {
    g.remove(a.gruppo)
    a.cartello.material.map.dispose(); a.cartello.material.dispose()
    for (const m of a.mat) m.dispose()
    a.corpo.traverse(o => { if (o.userData.geoPropria) o.geometry.dispose() })
  }

  // un banchetto nuovo (un altro ingrediente): quelle di prima affondano, le nuove spuntano
  function imposta(lista, chiave) {
    if (chiave === firma) return
    firma = chiave
    for (const a of posti) if (a) { a.via = 0; vecchie.push(a) }
    posti = lista.map((d, k) => { const a = costruisci(d, k, lista.length); a.entra = -0.15 * k - 0.15; return a })
  }

  function aggiorna(dt, t) {
    vecchie = vecchie.filter(a => {
      a.via += dt * 4
      a.gruppo.scale.setScalar(Math.max(0.001, 1 - a.via))
      a.gruppo.position.y = a.casa.y - a.via * 0.4
      if (a.via >= 1) { butta(a); return false }
      return true
    })
    for (const a of posti) {
      if (!a || a.libera) continue
      if (a.entra < 1) {
        a.entra = Math.min(1, a.entra + dt * 3.5)
        const e = Math.max(0, a.entra)
        // spunta con un rimbalzino
        a.gruppo.scale.setScalar(Math.max(0.001, e < 1 ? 1 + Math.sin(e * Math.PI) * 0.18 - (1 - e) * (1 - e) : 1))
      }
      a.cartello.position.x = Math.sin(t * 1.4 + a.fase) * 0.02
      a.cartello.material.rotation = Math.sin(t * 1.1 + a.fase) * 0.03
    }
  }

  return {
    imposta, aggiorna,
    ampolla: k => posti[k],
    colpibili: () => posti.filter(a => a && !a.libera).map(a => a.colpo),
    // la si prende dal bancone per versarla: il posto resta vuoto finché non torna il mercante
    stacca(k) { const a = posti[k]; a.libera = true; a.gruppo.scale.setScalar(1); return a },
    rimpiazza(k) {
      const a = posti[k]
      butta(a)
      const nuova = costruisci(a.dato, k, posti.length)
      nuova.entra = 0
      posti[k] = nuova
    },
    rilascia() { for (const a of [...posti, ...vecchie]) if (a) butta(a); posti = []; vecchie = [] },
  }
}
