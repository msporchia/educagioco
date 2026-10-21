// Generato da strumenti/promuovi-3d.mjs da poc/effetti-3d/lancio-cielo.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// CIELO, prima parte: fulmine, luce (colonna sacra), meteora. Ogni bersaglio ha la sua parte, in ritardo di `passo` per chi è più lontano.
import { Group, Mesh, Vector3, Color, CylinderGeometry, TorusGeometry, PlaneGeometry, BufferAttribute, MeshBasicMaterial, AdditiveBlending, DoubleSide, SphereGeometry } from 'three'
import { sat, liscio, esce, entra, sovra, mix, hash, sprite, misura, matAdd, tex, Particelle, Scia, assembla, bersagli, tinte, direzione, emetti, impatto } from './lancio-base.js'
import { Saetta, roccia } from './lancio-forme.js'

const BIANCO = new Color(1, 1, 1)
const _v = new Vector3(), _w = new Vector3()

// ── fulmine: una saetta ramificata scende sul bersaglio, bagliore, crepitio a terra ──
function parteFulmine(b, i, r, { c1, c2, k, seme }) {
  const T = 0.2 + r, g = new Group(), alto = new Vector3(b.x + 0.5 * k, b.y + 2.6, b.z - 0.25)
  const cc = c1.clone().lerp(BIANCO, 0.4), main = new Saetta(22, c1, cc, 0.034 * k), rami = [0, 1, 2].map(() => new Saetta(9, c1, cc, 0.02 * k)), suolo = [0, 1, 2, 3].map(() => new Saetta(6, c1, cc, 0.016 * k))
  g.add(main.g, ...rami.map(x => x.g), ...suolo.map(x => x.g))
  const cielo = sprite(c1, 'alone'), corpo = sprite(c2, 'alone'), st = sprite(c2, 'stella'); g.add(cielo, corpo, st); corpo.position.copy(b); st.position.copy(b); cielo.position.copy(alto)
  const imp = impatto({ tinta: c1, tinta2: c2, k, seme: seme + i * 3, pos: b, forza: 0.85, n: 14, tempo: 0.42 }); g.add(imp.g)
  const piede = new Vector3(b.x, 0.06, b.z)
  const aggiorna = t => {
    const tl = t - T, vivo = tl > -0.08 && tl < 0.4
    for (const m of [main.g, cielo, corpo, st, ...rami.map(x => x.g), ...suolo.map(x => x.g)]) m.visible = vivo
    if (vivo) {
      const sd = Math.floor(t * 38) + i * 17 + seme * 3, riv = esce((tl + 0.08) / 0.08), f = tl < 0.1 ? 1 : 1 - liscio((tl - 0.1) / 0.3), lu = f * (0.7 + 0.3 * hash(sd))
      main.genera(alto, b, sd, { amp: 0.32 * k, rivela: riv, spessore: 0.6 + 0.3 * f, luce: lu, libero: true })
      rami.forEach((x, j) => {
        const idx = Math.floor((0.28 + j * 0.22) * 21); x.g.visible = riv > idx / 21
        if (x.g.visible) { _v.copy(main.P[idx]); _w.set((hash(sd + j * 9) - 0.5) * 1.4 * k + (j - 1) * 0.4, -0.7 - hash(sd + j) * 0.5, (hash(sd + j * 5) - 0.5) * 0.9).add(_v); x.genera(_v, _w, sd + j * 31, { amp: 0.14 * k, rivela: 1, spessore: 0.8, luce: lu * 0.8, libero: true }) }
      })
      suolo.forEach((x, j) => {
        x.g.visible = tl > 0
        if (tl > 0) { const a = j * 1.57 + hash(sd) * 1.2; _w.set(piede.x + Math.cos(a) * 0.55 * k, 0.06, piede.z + Math.sin(a) * 0.55 * k); x.genera(piede, _w, sd + j * 13, { amp: 0.09 * k, rivela: esce(tl / 0.06), spessore: 0.8, luce: f }) }
      })
      misura(cielo, 1.2 * k * riv, 0.5 * lu); misura(corpo, k * mix(0.6, 1.5, esce(tl / 0.1)) * (0.85 + 0.3 * hash(sd + 3)), tl > -0.01 ? f : 0); misura(st, 1.8 * k * f, tl > -0.01 ? f * 0.8 : 0, tl * 4)
    }
    imp.aggiorna(tl)
  }
  return { g, aggiorna }
}

// ── luce: una colonna sacra con anelli e granelli che salgono ──
function parteLuce(b, i, r, { c1, c2, k }) {
  const g = new Group(), H = 3.4, S = r + 0.04, piede = new Vector3(b.x, 0, b.z); g.position.copy(piede)
  const colonna = (rt, rb, mat, vivace) => {
    const geo = new CylinderGeometry(rt, rb, H, 20, 1, true).translate(0, H / 2, 0), p = geo.attributes.position, col = new Float32Array(p.count * 3)
    for (let v = 0; v < p.count; v++) { const q = sat(p.getY(v) / H), f = vivace ? (1 - q) ** 1.3 : (1 - q) ** 1.8 * 0.8 + 0.02; col[v * 3] = f; col[v * 3 + 1] = f; col[v * 3 + 2] = f }
    geo.setAttribute('color', new BufferAttribute(col, 3))
    const m = new Mesh(geo, mat); g.add(m); return m
  }
  const mat = (c, o) => new MeshBasicMaterial({ color: c, vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, opacity: o })
  const fuori = colonna(0.34 * k, 0.4 * k, mat(c1, 0.38), false), dentro = colonna(0.17 * k, 0.2 * k, mat(c2.clone().lerp(BIANCO, 0.1), 0.5), true)
  const anelli = Array.from({ length: 5 }, () => { const m = new Mesh(new TorusGeometry(1, 0.03, 6, 30).rotateX(Math.PI / 2), matAdd(c2, null, 1)); g.add(m); return m })
  const disco = new Mesh(new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), matAdd(c1, tex('alone'), 0.9)); disco.position.y = 0.04; g.add(disco)
  const onda = new Mesh(new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), matAdd(c2, tex('anello'), 1)); onda.position.y = 0.05; g.add(onda)
  const base = sprite(c2, 'alone'); base.position.y = 0.3 * k; g.add(base)
  const pt = new Particelle(26, 'stella'); g.add(pt.punti)
  const imp = impatto({ tinta: c1, tinta2: c2, k, seme: 21 + i, pos: new Vector3(0, 0.5, 0), forza: 0.7, n: 12, tempo: 0.45, anello: false }); g.add(imp.g)
  const aggiorna = t => {
    const tl = t - S, vivo = tl > 0 && tl < 0.62
    for (const m of [fuori, dentro, disco, onda, base, pt.punti, ...anelli]) m.visible = vivo
    imp.aggiorna(t - (r + 0.24))
    if (!vivo) return
    const cresce = sovra(tl / 0.18), esco = 1 - liscio((tl - 0.34) / 0.28), rd = cresce * esco, pul = 1 + 0.06 * Math.sin(tl * 40)
    fuori.scale.set(rd * pul, 1, rd * pul); dentro.scale.set(rd * (1 + 0.1 * Math.sin(tl * 55)), 1, rd * pul)
    fuori.scale.y = dentro.scale.y = esce(tl / 0.14)
    anelli.forEach((m, j) => {
      const p = (tl * 1.5 + j / 5) % 1, rr = mix(0.62, 0.36, p) * k * rd
      m.position.y = p * H * 0.85; m.scale.set(rr, 1, rr); m.material.opacity = sat(Math.sin(Math.PI * p) * 1.5) * esco; m.visible = rd > 0.03
    })
    disco.scale.setScalar(k * 1.5 * rd); disco.material.opacity = 0.9 * esco
    onda.scale.setScalar(k * mix(0.5, 3, esce(tl / 0.3))); onda.material.opacity = 1 - liscio(tl / 0.32)
    misura(base, k * 1.3 * rd * pul, 0.8)
    pt.inizia()
    for (let j = 0; j < 26; j++) {
      const p = (tl * 1.1 + hash(j) * 1.0 + j * 0.04) % 1, a = j * 2.4 + tl * 3, rr = (0.15 + 0.3 * hash(j + 9)) * k
      pt.metti(Math.cos(a) * rr * rd, p * H * 0.9, Math.sin(a) * rr * rd, 0.13 * k, c2, sat(Math.sin(Math.PI * p) * 2) * esco)
    }
    pt.fine()
  }
  return { g, aggiorna }
}

// ── meteora: una roccia in fiamme con la coda diagonale, schianta e scuote il palco ──
function parteMeteora(b, ctx, { c1, c2, k, seme }) {
  const T = 0.38, g = new Group(), q = 1.4 * k
  const S = new Vector3(b.x - 2.6, b.y + 3.3, b.z - 1.8), E = new Vector3(b.x, b.y - 0.1, b.z)
  const pos = (t, out) => out.lerpVectors(S, E, sat(t / T) ** 1.55)
  const testa = new Group(); g.add(testa)
  const sasso = roccia(0.3 * q, 0x4c3b30, { emissive: c1, emissiveIntensity: 0.18 }); testa.add(sasso)
  const guscio = new Mesh(new SphereGeometry(0.4 * q, 14, 10), matAdd(c1, null, 0.16)); testa.add(guscio)
  const h1 = sprite(c1, 'alone'), h2 = sprite(c2, 'alone'); testa.add(h1, h2)
  const coda = new Scia(30, c1, c1, 0.26 * q, 0.26, 8), coda2 = new Scia(30, c1, c2, 0.12 * q, 0.2, 6); g.add(coda.mesh, coda2.mesh)
  const pt = new Particelle(36); g.add(pt.punti)
  const imp = impatto({ tinta: c1, tinta2: c2, k, seme, pos: b, forza: 1.6, n: 26, tempo: 0.62, fuoco: 7, dimScint: 3 }); g.add(imp.g)
  const buca = new Mesh(new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new MeshBasicMaterial({ color: 0x050302, map: tex('alone'), transparent: true, depthWrite: false })); buca.position.set(b.x, 0.035, b.z); g.add(buca)
  const detriti = Array.from({ length: 7 }, (_, j) => { const m = roccia((0.06 + 0.06 * hash(j + seme)) * k, 0x4c3b30, { emissive: c1, emissiveIntensity: 0.6 }); g.add(m); const a = j * 0.9 + hash(j) * 1.5; return { m, v: [Math.cos(a) * (1.2 + hash(j + 5)), 2.4 + 2 * hash(j + 2), Math.sin(a) * (1.2 + hash(j + 7)) * 0.8] } })
  const aggiorna = t => {
    const vola = t < T
    testa.visible = vola; pt.punti.visible = true
    if (vola) {
      pos(t, _v); testa.position.copy(_v); sasso.rotation.set(t * 9, t * 6, t * 4)
      misura(h1, 1.4 * q * (1 + 0.1 * Math.sin(t * 50)), 0.5); misura(h2, 0.62 * q, 0.55)
      guscio.scale.setScalar(1 + 0.12 * Math.sin(t * 60))
    }
    const dis = 1 - liscio((t - T) / 0.14)
    coda.mesh.visible = coda2.mesh.visible = t > 0.01 && dis > 0.01
    if (coda.mesh.visible) { coda.imposta(pos, Math.min(t, T + 0.14), 0, dis); coda2.imposta(pos, Math.min(t, T + 0.14), 0, dis, 0.9) }
    pt.inizia(); if (t > 0.01 && dis > 0.01) emetti(pt, pos, Math.min(t, T), 0, { n: 34, lung: 0.3, dim: 0.16 * k, c1, c2, spread: 0.55 * k, salita: 0.6, seme: 5, dis }); pt.fine()
    const tl = t - T
    imp.aggiorna(tl)
    buca.visible = tl > 0; if (tl > 0) { buca.scale.setScalar(k * 2.1 * esce(tl / 0.12)); buca.material.opacity = 0.55 * (1 - liscio((tl - 0.45) / 0.3)) }
    for (const d of detriti) { d.m.visible = tl > 0 && tl < 0.55; if (d.m.visible) { d.m.position.set(b.x + d.v[0] * tl * k, Math.max(0.03, 0.3 + d.v[1] * tl - 9 * tl * tl), b.z + d.v[2] * tl * k); d.m.rotation.set(tl * 14, tl * 9, 0); d.m.scale.setScalar(1 - liscio((tl - 0.35) / 0.2)) } }
  }
  return { g, aggiorna }
}

const pa = (ctx, passo, f) => { const k = ctx.scala ?? 1, [c1, c2] = tinte(ctx); return bersagli(ctx).map((b, i) => f(b, i, i * passo, { c1, c2, k, seme: ctx.seme || 1 })) }
const durataMulti = (ctx, d, passo) => d + (ctx.altri?.length || 0) * passo

const LUCE = ctx => assembla(pa(ctx, 0.08, parteLuce), durataMulti(ctx, 0.7, 0.08))
export const EFFETTI = {
  fulmine: { via: 'cielo', durata: 0.56, arrivo: 0.20, passo: 0.08, crea: ctx => assembla(pa(ctx, 0.08, parteFulmine), durataMulti(ctx, 0.56, 0.08)) },
  luce: { via: 'cielo', durata: 0.70, arrivo: 0.24, passo: 0.08, crea: LUCE },
  colonna: { via: 'su-me', durata: 0.70, arrivo: 0.24, passo: 0.08, crea: LUCE },
  meteora: {
    via: 'cielo', durata: 0.78, arrivo: 0.38, scuote: true,
    crea: ctx => {
      const k = ctx.scala ?? 1, [c1, c2] = tinte(ctx), parte = parteMeteora(ctx.a, ctx, { c1, c2, k, seme: ctx.seme || 1 })
      const e = assembla([parte], 0.78)
      e.scossa = t => (t > 0.38 ? 0.11 * Math.exp(-(t - 0.38) * 7) * (t < 0.78 ? 1 : 0) : 0)
      return e
    },
  },
}
