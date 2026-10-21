// Gli effetti di LANCIO: qualcosa parte dall'eroe, vola in arco, e scoppia sul bersaglio.
// Un'ossatura sola (`lancio`) per tutti: i voli (punti e istanti), la testa che vola, la scia, le particelle e l'impatto.
import { Group, Color, Vector3, Mesh, LatheGeometry, Vector2, MeshBasicMaterial, SphereGeometry } from 'three'
import { sat, liscio, esce, mix, hash, sprite, misura, matAdd, Scia, Particelle, assembla, bersagli, tinte, direzione, emetti, impatto, tex } from './lancio-base.js'
import { creaFreccia, creaQuadrello, cristallo, gelata, nube, falce } from './lancio-forme.js'

const Z = new Vector3(0, 0, 1), BIANCO = new Color(1, 1, 1)
const _p = new Vector3(), _d = new Vector3()

// un volo: punti e istanti di passaggio (pts[0] = partenza); arco = altezza dell'arco di ogni tratto
export const volo = (da, a, t0, arrivo, arcoF) => ({ pts: [da, a], tm: [t0, t0 + arrivo], arco: [arcoF * da.distanceTo(a)], hit: [true] })
export const paralleli = (ctx, arrivo, passo, arcoF) => bersagli(ctx).map((b, i) => volo(ctx.da, b, i * passo, arrivo, arcoF))

function posizioneDi(v, accel = 1) {
  const { pts, tm, arco } = v
  return (t, out) => {
    let j = 0; while (j < tm.length - 2 && t > tm[j + 1]) j++
    const u = sat((t - tm[j]) / (tm[j + 1] - tm[j])), e = j === 0 ? u ** accel : u
    out.lerpVectors(pts[j], pts[j + 1], e); out.y += arco[j] * Math.sin(Math.PI * u); return out
  }
}

export function lancio(ctx, cfg) {
  const k = ctx.scala ?? 1, [c1, c2] = tinte(ctx), B = bersagli(ctx), seme = ctx.seme || 1
  const voli = cfg.voli(ctx, B), parti = []
  voli.forEach((v, vi) => {
    const t0 = v.tm[0], tE = v.tm[v.tm.length - 1], pos = posizioneDi(v, cfg.accel), g = new Group()
    const testa = cfg.testa({ k, c1, c2, seme: seme + vi, ctx }); g.add(testa.g)
    const scia = cfg.scia ? new Scia(cfg.scia.n, cfg.scia.c1 || c1, (typeof cfg.scia.c2 === 'function' ? cfg.scia.c2(c1, c2) : cfg.scia.c2) || c2, cfg.scia.r * k, cfg.scia.lung, cfg.scia.lati || 6) : null
    if (scia) g.add(scia.mesh)
    const pt = cfg.emetti ? new Particelle(cfg.emetti.n, cfg.emetti.tex) : null
    if (pt) g.add(pt.punti)
    const coda = cfg.scia ? cfg.scia.lung : 0.15
    parti.push({
      g,
      aggiorna(t) {
        const vivo = t >= t0 && t < tE
        testa.g.visible = vivo
        if (vivo) {
          pos(t, _p); testa.g.position.copy(_p)
          direzione(pos, t, _d)
          if (cfg.orienta !== false) testa.g.quaternion.setFromUnitVectors(Z, _d)
          testa.anima?.(t, (t - t0) / (tE - t0), _d)
        }
        const dis = 1 - liscio((t - tE) / coda)
        if (scia) { scia.mesh.visible = t > t0 + 0.004 && dis > 0.01; if (scia.mesh.visible) scia.imposta(pos, t, t0, dis, cfg.scia.lum ?? 1) }
        if (pt) {
          pt.inizia(); if (t > t0 && dis > 0.01) emetti(pt, pos, t, t0, { c1: cfg.emetti.c1 || c1, c2: cfg.emetti.c2 || c2, ...cfg.emetti, dim: cfg.emetti.dim * k, spread: (cfg.emetti.spread || 0.2) * k, dis })
          pt.fine()
        }
      },
    })
  })
  const imp = cfg.impatti ? cfg.impatti(ctx, B, voli)
    : voli.flatMap(v => v.pts.slice(1).map((p, j) => (v.hit[j] === false ? null : { pos: p, t: v.tm[j + 1], i: 0 })).filter(Boolean)).map((x, i) => ({ ...x, i }))
  imp.forEach(m => {
    const o = cfg.impatto({ pos: m.pos, c1, c2, k, i: m.i, seme: seme + m.i * 11, ctx })
    parti.push({ g: o.g, aggiorna: t => o.aggiorna(t - m.t) })
  })
  return assembla(parti, cfg.durata)
}

// ── le teste ──
function testaPalla({ k, c1, c2 }) {
  const g = new Group()
  g.add(new Mesh(new SphereGeometry(0.11 * k, 18, 14), new MeshBasicMaterial({ color: c2.clone().lerp(BIANCO, 0.4) })))
  const guscio = new Mesh(new SphereGeometry(0.16 * k, 16, 12), matAdd(c1, null, 0.55)); g.add(guscio)
  const h1 = sprite(c1, 'alone'), h2 = sprite(c1, 'alone'), an = sprite(c2, 'anello'); g.add(h1, h2, an)
  const orb = [0, 1, 2].map(() => { const s = sprite(c2, 'stella'); g.add(s); return s })
  return {
    g,
    anima(t) {
      const f = 1 + 0.12 * Math.sin(t * 55) + 0.06 * Math.sin(t * 31)
      guscio.scale.setScalar(f); misura(h1, 0.95 * k * f, 0.8); misura(h2, 1.9 * k * f, 0.4); misura(an, 0.62 * k, 0.8, t * 6)
      orb.forEach((s, i) => { const a = t * 15 + i * 2.1; s.position.set(Math.cos(a) * 0.2 * k, Math.sin(a * 1.3) * 0.12 * k, Math.sin(a) * 0.2 * k); misura(s, 0.2 * k, 1, a) })
    },
  }
}
function testaDardo({ k, c1, c2 }) {
  const g = new Group(), prof = [[0, -0.42], [0.06, -0.14], [0.085, 0], [0.055, 0.2], [0, 0.48]].map(([x, y]) => new Vector2(x * k, y * k))
  const geo = new LatheGeometry(prof, 8).rotateX(Math.PI / 2)
  g.add(new Mesh(geo, new MeshBasicMaterial({ color: c2.clone().lerp(BIANCO, 0.6) })))
  const aura = new Mesh(geo, matAdd(c1, null, 0.55)); aura.scale.set(1.9, 1.9, 1.15); g.add(aura)
  const h = sprite(c1, 'alone'), st = sprite(c2, 'stella'); st.position.z = 0.46 * k; g.add(h, st)
  return { g, anima(t) { misura(h, 0.7 * k, 0.8); misura(st, 0.34 * k * (1 + 0.2 * Math.sin(t * 50)), 1, t * 3) } }
}
function testaFreccia(o = {}) {
  return ({ k, c1, c2 }) => {
    const g = new Group(); g.add(o.quadrello ? creaQuadrello(k * 1.7) : creaFreccia(k * 1.8)); let h = null
    if (o.alone) { h = sprite(o.alone === 'c2' ? c2 : c1, 'alone'); h.position.z = 0.45 * k; g.add(h) }
    return { g, anima(t) { if (h) misura(h, o.dimAlone * k * (1 + 0.15 * Math.sin(t * 45)), 0.9) } }
  }
}
function testaCristallo(grande) {
  return ({ k, c1, c2 }) => {
    const g = new Group(), q = grande ? 1.7 : 1.45, corpo = new Group(); g.add(corpo)
    corpo.add(cristallo(c1, c2, 0.36 * k * q, 0.075 * k * q))
    if (grande) for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.283 + 0.4, s = cristallo(c1, c2, 0.2 * k, 0.045 * k); s.position.set(Math.cos(a) * 0.13 * k, Math.sin(a) * 0.13 * k, -0.14 * k); s.rotation.set(Math.sin(a) * 0.22, -Math.cos(a) * 0.22, 0); corpo.add(s) }
    const h = sprite(c1, 'alone'); g.add(h)
    return { g, anima(t) { corpo.rotation.z = t * 7; misura(h, (grande ? 1.3 : 1.0) * k * (1 + 0.1 * Math.sin(t * 40)), 0.85) } }
  }
}
function testaFalce({ k, c1, c2 }) {
  const g = new Group(), inclina = new Group(); inclina.rotation.x = -0.95; g.add(inclina)
  const copie = [0, 1, 2, 3].map(j => { const m = falce(c1, c2, 0.4 * k); m.material.opacity = [1, 0.4, 0.2, 0.1][j]; const w = new Group(); w.add(m); inclina.add(w); return w })
  const h = sprite(c1, 'alone'); g.add(h)
  return { g, anima(t) { copie.forEach((w, j) => { w.rotation.z = -(t * 24 - j * 0.55); w.scale.setScalar(1 - j * 0.04) }); misura(h, 1.0 * k, 0.3) } }
}

// ── gli impatti ──
const scoppio = (forza, n = 20, tempo = 0.5, fuoco = 0) => o => impatto({ tinta: o.c1, tinta2: o.c2, k: o.k, seme: o.seme, pos: o.pos, forza: o.i === 0 ? forza : forza * 0.75, n, tempo, fuoco: fuoco || 0, dimScint: fuoco ? 3 : 1.7 })
const colpo = (forza, n = 8) => o => impatto({ tinta: o.c1, tinta2: o.c2, k: o.k, seme: o.seme, pos: o.pos, forza, n, tempo: 0.34, anello: false })
const insieme = (...fs) => o => { const l = fs.map(f => f(o)); const g = new Group(); l.forEach(x => g.add(x.g)); return { g, aggiorna: tl => l.forEach(x => x.aggiorna(tl)) } }
const dellaGelata = (n, alt, raggio, tempo) => o => gelata({ pos: o.pos, c1: o.c1, c2: o.c2, k: o.k, n, alt, raggio, seme: o.seme, tempo })
const dellaNube = o => nube({ pos: o.pos, c1: o.c1, c2: o.c2, k: o.k, seme: o.seme, tempo: 0.36 })

const BRACE = { n: 18, lung: 0.22, dim: 0.13, spread: 0.25, salita: 0.55 }
const sc = (n, r, lung, lum = 1) => ({ n, r, lung, lum })

export const EFFETTI = {
  palla: {
    via: 'lancio', durata: 0.72, arrivo: 0.34, passo: 0.1,
    crea: ctx => lancio(ctx, {
      durata: 0.72, voli: (c, B) => [volo(c.da, B[0], 0, 0.34, 0.28)], accel: 1.15, testa: testaPalla, scia: { ...sc(22, 0.12, 0.2), c2: (a, b) => a.clone().lerp(b, 0.45) }, emetti: BRACE,
      impatti: (c, B) => B.map((b, i) => ({ pos: b, t: 0.34 + i * 0.1, i })),
      impatto: insieme(scoppio(1.25, 24, 0.52, 7), o => impatto({ tinta: o.c1, tinta2: o.c2, k: o.k, seme: o.seme + 3, pos: o.pos, forza: o.i === 0 ? 0.7 : 0.5, n: 0, tempo: 0.6, stella: false, anello: true, suolo: true })),
    }),
  },
  dardo: {
    via: 'lancio', durata: 0.56, arrivo: 0.30, passo: 0.04,
    crea: ctx => lancio(ctx, { durata: 0.56, voli: c => paralleli(c, 0.3, 0.04, 0.1), testa: testaDardo, scia: sc(14, 0.06, 0.18), impatto: colpo(0.8, 10) }),
  },
  freccia: {
    via: 'lancio', durata: 0.52, arrivo: 0.28, passo: 0.04,
    crea: ctx => lancio(ctx, { durata: 0.52, voli: c => paralleli(c, 0.28, 0.04, 0.12), testa: testaFreccia(), scia: sc(10, 0.035, 0.12, 0.5), impatto: colpo(0.55, 7) }),
  },
  'freccia-fuoco': {
    via: 'lancio', durata: 0.6, arrivo: 0.28,
    crea: ctx => lancio(ctx, { durata: 0.6, voli: c => paralleli(c, 0.28, 0, 0.12), testa: testaFreccia({ alone: 'c1', dimAlone: 0.5 }), scia: sc(16, 0.06, 0.2), emetti: { ...BRACE, n: 14, dim: 0.1 }, impatto: scoppio(0.95, 16, 0.45) }),
  },
  'freccia-veleno': {
    via: 'lancio', durata: 0.64, arrivo: 0.28,
    crea: ctx => lancio(ctx, { durata: 0.64, voli: c => paralleli(c, 0.28, 0, 0.12), testa: testaFreccia({ alone: 'c1', dimAlone: 0.4 }), scia: sc(16, 0.045, 0.22, 0.8), emetti: { n: 12, lung: 0.25, dim: 0.09, spread: 0.2, salita: 0.35, seme: 9 }, impatto: insieme(colpo(0.5, 6), dellaNube) }),
  },
  quadrello: {
    via: 'lancio', durata: 0.52, arrivo: 0.26,
    crea: ctx => lancio(ctx, { durata: 0.52, voli: c => paralleli(c, 0.26, 0, 0.03), testa: testaFreccia({ quadrello: true }), scia: sc(8, 0.03, 0.09, 0.45), impatto: colpo(0.65, 8) }),
  },
  trapassa: {
    via: 'lancio', durata: 0.70, arrivo: 0.26, passo: 0.12,
    crea: ctx => lancio(ctx, {
      durata: 0.70, testa: testaFreccia({ alone: 'c2', dimAlone: 0.45 }), scia: sc(22, 0.05, 0.32, 0.9), impatto: colpo(0.6, 8),
      voli: (c, B) => {
        const pts = [c.da, ...B], tm = [0, ...B.map((_, i) => 0.26 + i * 0.12)]
        const ultimo = B[B.length - 1], pre = B.length > 1 ? B[B.length - 2] : c.da, dir = ultimo.clone().sub(pre).normalize()
        pts.push(ultimo.clone().addScaledVector(dir, 1.1)); tm.push(tm[tm.length - 1] + 0.14)
        return [{ pts, tm, arco: pts.slice(1).map((p, j) => (j === 0 ? 0.1 * c.da.distanceTo(p) : 0.02)), hit: [...B.map(() => true), false] }]
      },
    }),
  },
  scheggia: {
    via: 'lancio', durata: 0.68, arrivo: 0.32, passo: 0.04,
    crea: ctx => lancio(ctx, { durata: 0.68, voli: c => paralleli(c, 0.32, 0.04, 0.1), testa: testaCristallo(false), scia: sc(14, 0.045, 0.18, 0.8), emetti: { n: 10, lung: 0.25, dim: 0.1, spread: 0.18, salita: 0.1, seme: 4, tex: 'fiocco' }, impatto: insieme(colpo(0.55, 6), dellaGelata(5, 0.5, 0.4, 0.34)) }),
  },
  lancia: {
    via: 'lancio', durata: 0.72, arrivo: 0.30,
    crea: ctx => lancio(ctx, { durata: 0.72, voli: (c, B) => [volo(c.da, B[0], 0, 0.3, 0.1)], testa: testaCristallo(true), scia: sc(18, 0.085, 0.22, 0.9), emetti: { n: 14, lung: 0.28, dim: 0.14, spread: 0.3, salita: 0.1, seme: 6, tex: 'fiocco' }, impatto: insieme(scoppio(0.9, 10, 0.45), dellaGelata(8, 0.85, 0.6, 0.4)) }),
  },
  falce: {
    via: 'lancio', durata: 0.62, arrivo: 0.30, passo: 0.05,
    crea: ctx => lancio(ctx, { durata: 0.62, orienta: false, voli: c => paralleli(c, 0.3, 0.05, 0.14), testa: testaFalce, impatto: insieme(colpo(0.95, 12), o => impatto({ tinta: o.c1, tinta2: o.c2, k: o.k, seme: o.seme + 1, pos: o.pos, forza: 1.1, n: 0, tempo: 0.4, anello: true, suolo: false })) }),
  },
}
