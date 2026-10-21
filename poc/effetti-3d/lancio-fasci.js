// FASCIO (un raggio continuo dall'eroe al mostro) e CATENA (un arco elettrico che salta in fila; l'ascia che rimbalza).
import { Group, Mesh, Vector3, Quaternion, CylinderGeometry, TorusGeometry, Color } from 'three'
import { sat, liscio, esce, mix, hash, sprite, misura, matAdd, tex, Particelle, assembla, bersagli, tinte, impatto } from './lancio-base.js'
import { Saetta, asciaModello, falce } from './lancio-forme.js'
import { lancio } from './lancio-colpi.js'

const BIANCO = new Color(1, 1, 1), Z = new Vector3(0, 0, 1), _v = new Vector3()

// ── il raggio: un'anima chiara, un alone nel colore dell'elemento, anelli che scorrono verso il bersaglio, una spirale di luce ──
function raggio(da, b, r, { c1, c2, k, i }) {
  const g = new Group(), lung = da.distanceTo(b), T = 0.14 + r
  const dir = _v.subVectors(b, da).normalize()
  g.position.copy(da); g.quaternion.setFromUnitVectors(Z, dir)
  const cil = (rd, mat) => { const m = new Mesh(new CylinderGeometry(rd, rd * 1.35, 1, 14, 1, true).rotateX(Math.PI / 2).translate(0, 0, 0.5), mat); g.add(m); return m }
  const alone = cil(0.1 * k, matAdd(c1, null, 0.42)), alone2 = cil(0.17 * k, matAdd(c1, null, 0.16)), anima = cil(0.035 * k, matAdd(c2.clone().lerp(new Color(1, 1, 1), 0.5), null, 0.95))
  const anelli = Array.from({ length: 6 }, () => { const m = new Mesh(new TorusGeometry(1, 0.045, 6, 28), matAdd(c2, null, 1)); g.add(m); return m })
  const bocca = sprite(c2, 'alone'), fine = sprite(c2, 'alone'), stella = sprite(c2, 'stella'); g.add(bocca); const fineG = new Group(); fineG.add(fine, stella); fineG.position.z = lung; g.add(fineG)
  const pt = new Particelle(18, 'stella'); g.add(pt.punti)
  const imp = impatto({ tinta: c1, tinta2: c2, k, seme: 11 + i, pos: b, forza: 0.7, n: 10, tempo: 0.4 })
  imp.g.position.set(0, 0, lung); imp.g.quaternion.copy(g.quaternion).invert(); g.add(imp.g)
  const aggiorna = t => {
    const tl = t - r, vivo = tl >= 0 && tl < 0.56
    for (const m of [alone, alone2, anima, bocca, fineG, ...anelli]) m.visible = vivo
    pt.punti.visible = vivo
    if (vivo) {
      const ext = esce(tl / 0.14), usc = 1 - liscio((tl - 0.34) / 0.2), fl = 0.85 + 0.15 * Math.sin(tl * 90), rd = usc * fl
      for (const [m, s] of [[alone, 1], [alone2, 1.1], [anima, 0.9]]) { m.scale.set(rd * s * (1 + 0.1 * Math.sin(tl * 40)), rd * s, lung * ext); m.visible = rd > 0.02 }
      anelli.forEach((m, j) => {
        const p = (tl * 1.7 + j / anelli.length) % 1, z = p * lung * ext
        m.position.z = z; m.scale.setScalar(k * mix(0.2, 0.15, p) * rd * (0.9 + 0.2 * Math.sin(p * 6.28 * 2))); m.material.opacity = sat(Math.sin(Math.PI * p) * 1.4) * usc
        m.visible = p * ext > 0.02 && usc > 0.02
      })
      misura(bocca, 0.55 * k * (0.8 + 0.4 * fl) * usc, 0.9); fineG.visible = tl > 0.1
      misura(fine, mix(0.5, 1.15, esce((tl - 0.1) / 0.1)) * k * usc * fl, 0.95); misura(stella, 1.1 * k * usc, 0.9, tl * 2)
      pt.inizia()
      for (let j = 0; j < 18; j++) {
        const p = (tl * 1.1 + j / 18) % 1, z = p * lung * ext, a = z * 9 - tl * 24 + j * 0.7, rr = 0.15 * k * rd
        pt.metti(Math.cos(a) * rr, Math.sin(a) * rr, z, 0.1 * k, c2, sat(Math.sin(Math.PI * p) * 2) * usc)
      }
      pt.fine()
    }
    imp.aggiorna(tl - 0.14)
  }
  return { g, aggiorna }
}

// ── l'arco elettrico: una saetta per ogni salto, che si ridisegna a ogni fotogramma ──
function catenaParti(ctx) {
  const k = ctx.scala ?? 1, [c1, c2] = tinte(ctx), B = bersagli(ctx), seme = ctx.seme || 1, punti = [ctx.da, ...B]
  const parti = [], ARR = 0.13, PASSO = 0.14
  const g = new Group()
  const salti = B.map((b, j) => {
    const s = j === 0 ? 0 : ARR + (j - 1) * PASSO, e = j === 0 ? ARR : s + PASSO
    const cc = c1.clone().lerp(BIANCO, 0.4), a = new Saetta(14, c1, cc, 0.03 * k), eco = new Saetta(14, c1, cc, 0.018 * k)
    g.add(a.g, eco.g)
    const nodo = sprite(c2, 'alone'), stella = sprite(c2, 'stella'); g.add(nodo, stella)
    const imp = impatto({ tinta: c1, tinta2: c2, k, seme: seme + j * 5, pos: b, forza: 0.7, n: 10, tempo: 0.38, anello: false })
    g.add(imp.g)
    return { s, e, a, eco, nodo, stella, imp, A: punti[j], Bp: b }
  })
  parti.push({
    g,
    aggiorna(t) {
      for (const j of salti) {
        const vivo = t >= j.s && t < j.e + 0.26
        j.a.g.visible = j.eco.g.visible = j.nodo.visible = j.stella.visible = vivo
        if (vivo) {
          const u = esce((t - j.s) / (j.e - j.s)), f = 1 - liscio((t - j.e - 0.06) / 0.2), sd = Math.floor(t * 42) + j.s * 100
          j.a.genera(j.A, j.Bp, sd, { amp: 0.17 * k, rivela: u, spessore: 0.6 + 0.3 * f, luce: f * (0.8 + 0.2 * hash(sd)) })
          j.eco.genera(j.A, j.Bp, sd + 77, { amp: 0.26 * k, rivela: u, spessore: 0.7, luce: f * 0.55 })
          const pre = t >= j.e
          misura(j.nodo, 0.6 * k * (pre ? 0.8 + 0.4 * hash(sd) : 0.4), pre ? f * 0.8 : 0); misura(j.stella, 0.9 * k * f, pre ? f * 0.7 : 0, t * 3)
          j.nodo.position.copy(j.Bp); j.stella.position.copy(j.Bp)
        }
        j.imp.aggiorna(t - j.e)
      }
    },
  })
  return parti
}

export const EFFETTI = {
  fascio: {
    via: 'fascio', durata: 0.52, arrivo: 0.14, passo: 0.07,
    crea: ctx => { const [c1, c2] = tinte(ctx), k = ctx.scala ?? 1; return assembla(bersagli(ctx).map((b, i) => raggio(ctx.da, b, i * 0.07, { c1, c2, k, i })), 0.52 + (ctx.altri?.length || 0) * 0.07) },
  },
  catena: {
    via: 'catena', durata: 0.72, arrivo: 0.13, passo: 0.14,
    crea: ctx => assembla(catenaParti(ctx), 0.72),
  },
  ascia: {
    via: 'catena', durata: 0.78, arrivo: 0.23, passo: 0.19,
    crea: ctx => lancio(ctx, {
      durata: 0.78, orienta: false, accel: 1.1,
      voli: (c, B) => {
        const pts = [c.da, ...B], tm = [0, ...B.map((_, i) => 0.23 + i * 0.19)]
        const ult = B[B.length - 1], pre = B.length > 1 ? B[B.length - 2] : c.da, d = ult.clone().sub(pre).setY(0).normalize()
        pts.push(new Vector3(ult.x - d.x * 0.9, 0.2, ult.z - d.z * 0.9 + 0.5)); tm.push(tm[tm.length - 1] + 0.26)
        return [{ pts, tm, arco: pts.slice(1).map((p, j) => (j === 0 ? 0.18 : 0.14 + 0.06 * (j === pts.length - 2))), hit: [...B.map(() => true), false] }]
      },
      testa: ({ k, c1, c2 }) => {
        const g = new Group(), asc = new Group(); asc.add(asciaModello(k * 2.2, c1)); g.add(asc)
        const h = sprite(c2, 'alone'), h2 = sprite(c1, 'alone'); g.add(h, h2)
        const lato = new Vector3(), su = new Vector3(0, 1, 0), q = new Quaternion()
        return {
          g,
          anima(t, u, d) { lato.crossVectors(d, su).normalize(); asc.quaternion.setFromAxisAngle(lato, -t * 26); misura(h, 0.55 * k, 0.45); misura(h2, 0.95 * k, 0.28) },
        }
      },
      scia: { n: 16, r: 0.035, lung: 0.2, lum: 0.7 },
      impatto: o => {
        const g = new Group(), im = impatto({ tinta: o.c1, tinta2: o.c2, k: o.k, seme: o.seme, pos: o.pos, forza: 0.8, n: 12, tempo: 0.38, anello: false, suolo: false })
        g.add(im.g)
        const tg = new Group(); tg.position.copy(o.pos); tg.rotation.x = -0.95; g.add(tg)
        const sl = falce(o.c1, o.c2, 0.4 * o.k); const w = new Group(); w.scale.set(1, 0.55, 1); w.rotation.z = 0.5 + 1.7 * hash(o.i + 3); w.add(sl); tg.add(w)
        return { g, aggiorna: tl => { im.aggiorna(tl); tg.visible = tl >= 0 && tl < 0.3; if (tg.visible) { sl.material.opacity = 1 - liscio(tl / 0.3); tg.scale.setScalar(mix(0.5, 1.5, esce(tl / 0.12))) } } }
      },
    }),
  },
}
