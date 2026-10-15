// Le regole del giardino, senza schermo: niente DOM, niente Vue, non sa cos'è
// una moneta né un conto. Il caso arriva da fuori (`rnd`), così una partita si
// rifà identica. Gli eventi (`prendiEventi`) sono per chi suona e dipinge.
// Vedi docs/giardino/regole.md.
import { CAMPO, ALTEZZA, CIELO, COLPO, FRONTE, MANGIA, GELO, PASSO_MAX, pesoDi } from '../dati/regole.js'
import { PIANTE } from '../dati/piante.js'
import { ZOMBI } from '../dati/zombi.js'

const PRIMO_ZOMBI = 14

export class Partita {
  constructor({ sfida, rnd = Math.random }) {
    this.sfida = sfida
    this.rnd = rnd
    this.t = 0
    this.soli = sfida.soli
    this.corsie = sfida.corsie.slice()
    this.carretti = Object.fromEntries(this.corsie.map(c => [c, true]))   // uno per corsia: ferma tutto una volta
    this.usati = 0
    this.piante = []
    this.zombi = []
    this.colpi = []
    this.raccolte = []                 // i soli sul campo, da toccare
    this.cd = Object.fromEntries(sfida.piante.map(id => [id, 0]))
    this.prossimoSole = CIELO.primo
    this.arrivi = this.pianifica()     // i zombi che devono ancora entrare, per tempo
    this.totale = this.arrivi.length
    this.fine = null                   // null | 'vinto' | 'perso'
    this.eventi = []
  }

  pianifica() {
    const { n, durata, tipi } = this.sfida.zombi
    const lista = []
    for (let k = 0; k < n; k++) {
      const q = (k + 0.5) / n
      lista.push({
        t: PRIMO_ZOMBI + q * (durata - PRIMO_ZOMBI) + (this.rnd() - 0.5) * 3,
        col: this.corsie[Math.floor(this.rnd() * this.corsie.length)],
        tipo: tipi[Math.min(tipi.length - 1, Math.floor(q * tipi.length * 1.2))],
      })
    }
    if (this.sfida.capo)
      lista.push({ t: PRIMO_ZOMBI + 0.66 * (durata - PRIMO_ZOMBI), col: this.corsie[Math.floor(this.corsie.length / 2)], tipo: 'gigante' })
    return lista.sort((a, b) => a.t - b.t)
  }

  /* ── cosa si può fare ── */
  cella(c, r) { return this.piante.find(p => p.c === c && p.r === r) || null }
  libera(c, r) { return this.corsie.includes(c) && r >= CAMPO.rigaMin && r < CAMPO.righe && !this.cella(c, r) }
  pronta(id) { return !this.fine && this.cd[id] === 0 }
  puoComprare(id) { return !!PIANTE[id] && id in this.cd && this.pronta(id) && this.soli >= PIANTE[id].costo }

  // il conto che la compra: la pianta dice l'operazione, il prezzo il peso
  calcoloDi(id) { return { op: PIANTE[id].op, peso: pesoDi(PIANTE[id].costo) } }

  pianta(id, c, r) {
    if (!this.puoComprare(id) || !this.libera(c, r)) return false
    const P = PIANTE[id]
    this.soli -= P.costo
    this.cd[id] = P.ricarica
    this.piante.push({ id, c, r, vita: P.vita, tempo: 0 })
    this.eventi.push({ tipo: 'piantata', c, r })
    return true
  }

  raccogli(i) {
    const s = this.raccolte[i]
    if (!s || this.fine) return false
    this.soli += s.v
    this.raccolte.splice(i, 1)
    this.eventi.push({ tipo: 'sole', v: s.v })
    return true
  }

  prendiEventi() { const e = this.eventi; this.eventi = []; return e }
  get restano() { return this.arrivi.length + this.zombi.length }

  /* ── il tempo ── */
  avanza(dt) {
    while (dt > 1e-9 && !this.fine) {
      const d = Math.min(dt, PASSO_MAX)
      this.passo(d)
      dt -= d
    }
  }

  passo(dt) {
    this.t += dt
    for (const k in this.cd) this.cd[k] = Math.max(0, this.cd[k] - dt)

    this.prossimoSole -= dt
    if (this.prossimoSole <= 0) {
      this.prossimoSole = CIELO.ogni
      this.raccolte.push({ x: 30 + this.rnd() * (CAMPO.colonne * CAMPO.cella - 60), y: -20,
                           ty: 80 + this.rnd() * (ALTEZZA - 140), vita: CIELO.dura, v: CIELO.vale })
    }
    for (const s of this.raccolte) { s.y = Math.min(s.ty, s.y + CIELO.caduta * dt); s.vita -= dt }
    this.raccolte = this.raccolte.filter(s => s.vita > 0)

    while (this.arrivi.length && this.arrivi[0].t <= this.t) {
      const a = this.arrivi.shift()
      this.zombi.push({ tipo: a.tipo, c: a.col, y: -30, vita: ZOMBI[a.tipo].vita, lento: 0 })
    }

    for (const p of this.piante) this.lavora(p, dt)
    this.muoviColpi(dt)
    this.muoviZombi(dt)

    this.zombi = this.zombi.filter(z => z.vita > 0)
    this.piante = this.piante.filter(p => p.vita > 0)
    if (!this.fine && !this.arrivi.length && !this.zombi.length) {
      this.fine = 'vinto'
      this.eventi.push({ tipo: 'vinto' })
    }
  }

  lavora(p, dt) {
    const P = PIANTE[p.id]
    p.tempo += dt
    if (P.sole && p.tempo >= P.ogni) {
      p.tempo = 0
      this.raccolte.push({ x: p.c * CAMPO.cella + CAMPO.cella / 2, y: p.r * CAMPO.cella + 10, ty: p.r * CAMPO.cella + 10, vita: CIELO.dura, v: P.sole })
    }
    if (P.colpi && p.tempo >= P.ogni && this.zombi.some(z => z.c === p.c && z.y > 0 && z.y < p.r * CAMPO.cella)) {
      p.tempo = 0
      for (let k = 0; k < P.colpi; k++)
        this.colpi.push({ c: p.c, y: p.r * CAMPO.cella + 8 - k * 18, gelo: !!P.gelo })
      this.eventi.push({ tipo: 'spara', c: p.c })
    }
  }

  muoviColpi(dt) {
    for (const k of this.colpi) {
      k.y -= COLPO.velocita * dt
      const z = this.zombi.filter(z => z.c === k.c && z.y > 0 && z.vita > 0 && Math.abs(z.y - k.y) < COLPO.raggio)
                          .sort((a, b) => b.y - a.y)[0]
      if (z) {
        z.vita -= COLPO.danno
        if (k.gelo) z.lento = GELO.dura
        k.morto = true
        this.eventi.push({ tipo: 'colpito', c: z.c, y: z.y })
      }
      if (k.y < 0) k.morto = true
    }
    this.colpi = this.colpi.filter(k => !k.morto)
  }

  muoviZombi(dt) {
    for (const z of this.zombi) {
      if (z.vita <= 0) continue
      const Z = ZOMBI[z.tipo]
      z.lento = Math.max(0, z.lento - dt)
      const fronte = z.y + FRONTE
      const p = this.piante.find(p => p.c === z.c && fronte >= p.r * CAMPO.cella && fronte <= (p.r + 1) * CAMPO.cella)
      if (p) p.vita -= (Z.mangia || MANGIA) * dt
      else z.y += Z.vel * (z.lento > 0 ? GELO.fattore : 1) * dt
      if (z.y > ALTEZZA) this.arrivato(z)
    }
  }

  // uno zombi in casa: se c'è il carretto della corsia passa e spazza tutto, una volta sola
  arrivato(z) {
    if (!this.carretti[z.c]) {
      this.fine = 'perso'
      this.eventi.push({ tipo: 'perso' })
      return
    }
    this.carretti[z.c] = false
    this.usati++
    for (const x of this.zombi) if (x.c === z.c) x.vita = 0
    this.eventi.push({ tipo: 'carretto', c: z.c })
  }
}
