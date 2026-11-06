// La mano: cosa fa un attrezzo mentre il dito lo muove sul suo bersaglio. Il gesto
// lo riconosce gesti.js; qui si traduce in figura, col pestello che picchia e la
// lama che taglia, e si dice quand'è finito. Niente regole: se il momento era
// giusto lo dirà il motore, a gesto finito. Vedi docs/pozioni/gesti.md.
import { Vector3 } from 'three'
import { POSTI } from './banco.js'
import { creaGesto, VERSA_DA } from './gesti.js'
import { suoni } from '../suoni.js'

const SEGUE = 24                // 1/s: quanto in fretta l'attrezzo va dove vuole il dito
const stringi = (v, a, b) => Math.max(a, Math.min(b, v))

// quanto è giù il dito in una finestra che lo segue, così i colpi non finiscono mai contro un
// fondo: 0 in alto, 1 in basso
function finestra(largo) {
  let cima = null
  return y => {
    if (cima === null) cima = y - largo / 2
    if (y - cima > largo) cima = y - largo
    if (y < cima) cima = y
    return (y - cima) / largo
  }
}

export function creaMani({ attrezzi, banco, eff, sulPiano, sulCalderone, scena }) {
  const C = POSTI.calderone, L = POSTI.legna, q = new Vector3()
  const dalla = (cosa, punto) => cosa.localToWorld(punto.clone())

  const POSE = {
    'mestolo:calderone': c => ({
      dito(x, y, e) {
        const brodo = banco.quotaBrodo()
        if (!sulPiano(x, y, brodo, q)) return
        const dx = q.x - C.x, dz = q.z - C.z, k = Math.min(1, 0.62 / (Math.hypot(dx, dz) || 1))
        c.meta.p.set(C.x + dx * k, brodo - 0.05, C.z + dz * k)
        c.meta.rz = -dx * k * 0.4; c.meta.rx = dz * k * 0.4
        banco.gira(1.2)
        banco.sfuma(1 - c.gesto.avanzato)
        if (e.colpo) {
          suoni.sciacquo()
          eff.gocce.emetti(4, { da: c.meta.p, sparpaglia: 0.2, verso: [0, 1.4, 0], caso: 0.8, colore: scena().calderone, vita: 0.45, misura: 0.07, gravita: 5 })
        }
      },
      via() { banco.sfuma(1) },
    }),
    'pestello:mortaio': c => {
      const giu = finestra(46), m = attrezzi.mortaio.position
      return {
        dito(x, y, e) {
          c.meta.p.set(m.x + 0.05, 0.8 - giu(y) * 0.48, m.z); c.meta.rz = -0.2
          attrezzi.macina(c.gesto.avanzato)
          if (e.colpo) {
            suoni.colpo()
            eff.gocce.emetti(7, { da: new Vector3(m.x, 0.6, m.z), sparpaglia: 0.3, verso: [0, 1.3, 0], caso: 0.9, colore: scena().attrezzi.pestato || '#b8b4bc', vita: 0.5, misura: 0.08, gravita: 5 })
          }
        },
        via() { attrezzi.macina(0) },
      }
    },
    'coltello:tagliere': c => {
      const giu = finestra(46), t = attrezzi.tagliere.position
      let da = null
      return {
        dito(x, y, e) {
          da ??= x
          const lungo = stringi((x - da) / 60, -0.4, 0.4)
          c.meta.p.set(t.x + 0.1 + lungo, 0.78 - giu(y) * 0.64, t.z)
          attrezzi.taglia(scena().attrezzi.tagliere ? c.gesto.avanzato : -1)
          if (e.colpo) {
            suoni.taglio()
            eff.gocce.emetti(5, { da: new Vector3(c.meta.p.x - 0.2, 0.25, t.z), sparpaglia: 0.15, verso: [0, 1.1, 0], caso: 0.9, colore: scena().attrezzi.tagliere || '#d8b483', vita: 0.4, misura: 0.06, gravita: 5 })
          }
        },
        via() { attrezzi.taglia(scena().attrezzi.tagliere ? 0 : -1) },
      }
    },
    // si sfrega sulla legna, e a forza di scintille prende
    'fiammifero:legna': c => {
      let da = null
      return {
        dito(x, y, e) {
          da ??= x
          c.meta.p.set(L.x + 0.55 + stringi((x - da) / 60, -0.7, 0.7), 0.82, L.z + 0.1); c.meta.rz = 2.3
          attrezzi.fiammella(c.gesto.avanzato >= 0.6)
          if (e.colpo) {
            suoni.sfrega()
            eff.luci.emetti(9, { da: dalla(c.cosa, new Vector3(0, 0.98, 0)), sparpaglia: 0.08, verso: [0, 1.3, 0], caso: 1.3, colore: '#ffcf6a', vita: 0.4, misura: 0.06, gravita: 3 })
          }
        },
        via() { attrezzi.fiammella(false) },
      }
    },
    // il vapore lo spinge su, il dito lo schiaccia giù: a ogni colpo sbuffa dal bordo e il fuoco si alza
    'coperchio:calderone': c => {
      const giu = finestra(46), orlo = 1.52
      return {
        dito(x, y, e) {
          c.meta.p.set(C.x, orlo + (1 - giu(y)) * 0.38, C.z)
          if (e.colpo) {
            suoni.coperchio()
            banco.vampa()
            banco.ribolli(3)
            for (let a = 0; a < 6.2; a += 0.78) eff.gocce.emetti(3, { da: q.set(C.x + Math.cos(a) * 1.08, orlo + 0.05, C.z + Math.sin(a) * 1.08), sparpaglia: 0.1, verso: [Math.cos(a) * 1.1, 1.2, Math.sin(a) * 1.1], caso: 0.4, colore: '#eae6f2', vita: 0.7, misura: 0.24, gravita: -0.4, allarga: 2 })
          }
        },
      }
    },
    // lascia una scia del colore della pozione, e scuotendo scoppia
    'bacchetta:calderone': c => {
      let n = 0
      return {
        dito(x, y, e) {
          if (!sulPiano(x, y, 1.5, q)) return
          c.meta.p.set(C.x + stringi(q.x - C.x, -1.1, 1.1) - 0.45, 1.1, C.z + stringi(q.z - C.z, -0.2, 1.1)); c.meta.rz = -0.4
          const punta = dalla(c.cosa, c.cosa.userData.punta)
          eff.luci.emetti(2, { da: punta, sparpaglia: 0.06, verso: [0, 0.2, 0], caso: 0.3, colore: banco.riflesso, vita: 0.7, misura: 0.09, gravita: 0.5 })
          if (e.colpo) {
            suoni.incanto(n++)
            eff.luci.emetti(14, { da: punta, sparpaglia: 0.1, verso: [0, 0.6, 0], caso: 1.5, colore: '#fff2b0', vita: 0.6, misura: 0.08, gravita: 1 })
          }
        },
      }
    },
    'ciotola:calderone': c => versaRoba(c, () => sulCalderone(1), () => banco.quotaBrodo()),
    'ciotola:mortaio': c => {
      const m = attrezzi.mortaio.position
      return versaRoba(c, () => q.set(m.x + 0.55, 1.55, m.z), () => 0.45)
    },
    'brocca:calderone': c => inclina(c, 1, () => '#bfe4ff', false, new Vector3(-0.45, 0.4, 0)),
    'mortaio:calderone': c => inclina(c, -1, () => scena().attrezzi.pestato, true, new Vector3(0.45, 0.4, 0)),
    'tagliere:calderone': c => inclina(c, -1, () => scena().attrezzi.tagliere, true, new Vector3(0.7, 0.1, 0)),
    'sale:calderone': c => pizzico(c, '#f6f2ea'),
    'pepe:calderone': c => pizzico(c, '#3b3330'),
    // si piega verso il brodo, e piegata si riempie
    'fiala:calderone': c => {
      let riempie = false
      return {
        dito() {
          const piega = Math.abs(c.gesto.piega)
          c.meta.p.set(C.x + 1, banco.quotaBrodo() + 0.55 - piega * 0.4, C.z + 0.55); c.meta.rz = piega * 1.4
        },
        scorre() {
          const si = Math.abs(c.gesto.piega) >= VERSA_DA
          attrezzi.riempi(c.gesto.avanzato, scena().calderone)
          if (si && !riempie) suoni.liquido(0.9)
          if (si && Math.random() < 0.4) eff.gocce.emetti(1, { da: new Vector3(C.x + 0.1, banco.quotaBrodo(), C.z + 0.55), sparpaglia: 0.15, verso: [0.4, 0.8, 0], caso: 0.3, colore: scena().calderone, vita: 0.35, misura: 0.06, gravita: 3 })
          riempie = si
        },
        via() { attrezzi.riempi(0) },
      }
    },
    // si sfrega su e giù, si consuma e cade dentro
    'roba:grattugia': c => {
      const giu = finestra(46), g = attrezzi.grattugia.position
      const colore = () => scena().attrezzi.roba.find(d => `roba:${d.i}` === c.cosa.userData.id)?.colore || '#ffffff'
      return {
        dito(x, y, e) {
          c.meta.p.set(g.x, g.y + 0.45 - giu(y) * 0.9, g.z + 0.25)
          c.cosa.scale.setScalar(1 - c.gesto.avanzato * 0.55)
          if (e.colpo) {
            suoni.gratta()
            eff.gocce.emetti(10, { da: new Vector3(g.x - 0.1, g.y - 0.1, g.z), sparpaglia: 0.3, verso: [-1, -0.4, -0.5], caso: 0.5, colore: colore(), vita: 0.55, misura: 0.05, gravita: 4 })
          }
        },
        via() { c.cosa.scale.setScalar(1) },
      }
    },
  }

  // capovolto sul calderone: su e giù, e a ogni scossa ne cade un po'
  function pizzico(c, colore) {
    const giu = finestra(46), { targa } = c.cosa.userData
    return {
      dito(x, y, e) {
        targa.visible = false
        c.meta.p.set(C.x - 0.35, 2.75 - giu(y) * 0.5, C.z + 0.5); c.meta.rz = 2.7
        if (e.colpo) {
          suoni.pizzico()
          eff.gocce.emetti(14, { da: dalla(c.cosa, new Vector3(0, 0.56, 0)), sparpaglia: 0.1, verso: [0, -1.6, 0], caso: 0.35, colore, vita: 0.6, misura: 0.05, gravita: 5 })
        }
      },
      via() { targa.visible = true },
      fine() { targa.visible = true },
    }
  }

  // la ciotola o il bicchiere della roba: come gli attrezzi, e intanto si vede calare
  function versaRoba(c, sopra, fondo) {
    const { id, targa, bocca, vuota } = c.cosa.userData
    const d = () => scena().attrezzi.roba.find(x => `roba:${x.i}` === id)
    const v = inclina(c, 1, () => d()?.colore, d()?.recipiente === 'ciotola', bocca, sopra, fondo)
    const a = v.scorre
    return { ...v,
      dito() { targa.visible = false; v.dito() },
      scorre() { a(); vuota(c.gesto.avanzato) },
      via() { v.via(); vuota(0); targa.visible = true },
      fine() { v.fine(); targa.visible = true } }
  }

  // sopra il calderone: il dito di lato lo piega, e piegato versa
  function inclina(c, lato, colore, polvere, bocca, sopra = () => sulCalderone(lato), fondo = () => banco.quotaBrodo()) {
    let versando = false
    return {
      dito() { c.meta.p.copy(sopra()); c.meta.rz = lato * Math.abs(c.gesto.piega) * 1.9 },
      scorre() {
        const k = colore() && Math.abs(c.gesto.piega) >= VERSA_DA
        if (k) {
          if (!versando) { if (polvere) suoni.polvere(0.55); else suoni.liquido(0.55) }
          const b = dalla(c.cosa, bocca)
          eff.versa(b, new Vector3(b.x, fondo(), b.z), colore(), polvere)
        } else if (versando) eff.smetti()
        versando = !!k
      },
      via() { eff.smetti() },
      fine() { eff.smetti() },
    }
  }

  let c = null, posa = null
  return {
    get su() { return c?.su ?? null },
    get spec() { return c?.spec ?? null },
    get fatto() { return c?.gesto.avanzato >= 1 },
    get fermo() { return c?.fermo ?? 0 },
    prendi(su, spec, cosa, x, y) {
      const id = cosa.userData.id
      c = { su, spec, cosa, gesto: creaGesto(spec), fermo: 0, fatto: 0, meta: { p: cosa.position.clone(), rx: 0, rz: 0 } }
      // la roba: sulla grattugia si sfrega quella intera, altrove si versa dal suo recipiente
      posa = POSE[`${id.startsWith('roba:') ? (su === 'grattugia' ? 'roba' : 'ciotola') : id}:${su}`](c)
      this.dito(x, y)
    },
    dito(x, y) {
      posa.dito(x, y, c.gesto.punto(x, y))
    },
    scorre(dt) {
      c.gesto.scorre?.(dt)
      posa.scorre?.(dt)
      c.fermo = c.gesto.avanzato > c.fatto ? 0 : c.fermo + dt
      c.fatto = c.gesto.avanzato
      const k = 1 - Math.exp(-SEGUE * dt), r = c.cosa.rotation
      c.cosa.position.lerp(c.meta.p, k)
      r.x += (c.meta.rx - r.x) * k; r.z += (c.meta.rz - r.z) * k
    },
    // il dito se n'è andato prima della fine: come se niente fosse
    lascia() { if (c) posa.via?.(); c = posa = null },
    // il gesto è finito: quello che ha fatto resta, ci pensa la mossa
    finita() { posa.fine?.(); c = posa = null },
  }
}
