// Il resto del kit del mondo di sopra: i ponti dei confini fra le zone (arco di pietra, travi, passerella di corde: nessuna grata,
// si passa sempre), le staccionate dei campi, il cartello e la bacheca del villaggio, il campo del minatore. Le parti ferme nel
// cantiere (kit.js), quelle che si muovono a parte. Dal prototipo poc/mondo-sopra/kit.js.
import { Shape, Path, ExtrudeGeometry, DodecahedronGeometry, OctahedronGeometry, SphereGeometry, Group } from 'three'
import { scatola, cilindro, triangolo, COLORI, Cantiere } from './kit.js'
import { quotaTerreno, LIVELLO_ACQUA, pontiDi } from './suolo.js'

// ── i ponti: si costruiscono lungo la x locale e si girano verso sud quando il fiume corre da ovest a est ──
export function ponte(q, cant, m) {
  const p = pontiDi(m).get(q.i)
  if (!p) return
  const L = p.lungoX ? p.x1 - p.x0 : p.y1 - p.y0
  const cx = (p.x0 + p.x1) / 2, cz = (p.y0 + p.y1) / 2
  if (p.lungoX) cant.base(p.x0, 0, cz, 0); else cant.base(cx, 0, p.y0, -Math.PI / 2)
  cant.qui(cx, cz)
  const quota = t => p.quota + p.arco * Math.sin(Math.PI * t), N = 10
  if (p.modello === 'arco') {
    const sh = new Shape(), fondo = LIVELLO_ACQUA - 0.9
    sh.moveTo(0, fondo)
    for (let i = 0; i <= N; i++) sh.lineTo(L * i / N, quota(i / N) - 0.02)
    sh.lineTo(L, fondo)
    const buco = new Path(), rv = L / 2 - 0.9
    buco.moveTo(L / 2 + rv, fondo); buco.absarc(L / 2, LIVELLO_ACQUA - 0.2, rv, 0, Math.PI, false); buco.lineTo(L / 2 - rv, fondo)
    sh.holes.push(buco)
    const g = new ExtrudeGeometry(sh, { depth: 2.2, bevelEnabled: false, curveSegments: 10 })
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.4, uv.getY(i) / 1.4)
    cant.metti('pietra', g, 0, 0, -1.1, [0.82, 0.8, 0.75])
    for (let i = 0; i < N; i++) {
      const ta = i / N, tb = (i + 1) / N, ya = quota(ta), yb = quota(tb), lx = L / N, ang = Math.atan2(yb - ya, lx)
      for (const s of [-1, 1]) cant.metti('pietra', scatola(Math.hypot(lx, yb - ya) + 0.02, 0.38, 0.2, 1.4), (ta + tb) / 2 * L, (ya + yb) / 2 + 0.19, s * 1.0, [0.78, 0.76, 0.72], { rz: ang })
    }
  } else if (p.modello === 'travi') {
    for (let i = 0; i < N; i++) {
      const ta = i / N, tb = (i + 1) / N, ya = quota(ta), yb = quota(tb), lx = L / N, ang = Math.atan2(yb - ya, lx)
      cant.metti('legno', scatola(Math.hypot(lx, yb - ya) + 0.02, 0.1, 2.0, 1), (ta + tb) / 2 * L, (ya + yb) / 2 - 0.05, 0, [0.7, 0.55, 0.4], { rz: ang })
    }
    for (const s of [-1, 1]) {
      cant.metti('legno', cilindro(0.1, 0.1, L + 0.4, 8, 1), L / 2, p.quota - 0.12, s * 0.95, [0.5, 0.38, 0.28], { rz: Math.PI / 2 })
      for (let i = 0; i <= 4; i++) { const t = i / 4; cant.metti('legno', scatola(0.1, 0.75, 0.1), 0.2 + t * (L - 0.4), quota(t) + 0.37, s * 0.95, COLORI.legnoScuro) }
      cant.metti('legno', scatola(L - 0.3, 0.08, 0.08), L / 2, p.quota + p.arco * 0.7 + 0.7, s * 0.95, COLORI.legno)
      for (const t of [0.33, 0.67]) cant.metti('legno', cilindro(0.12, 0.14, p.quota - LIVELLO_ACQUA + 0.8, 8), t * L, (p.quota + LIVELLO_ACQUA - 0.8) / 2, s * 0.75, COLORI.legnoScuro)
    }
  } else {
    const assi = Math.round(L / 0.3)
    for (let i = 0; i < assi; i++) {
      const t = (i + 0.5) / assi
      cant.metti('legno', scatola(0.24, 0.06, 1.7), t * L, quota(t) - 0.03, Math.sin(i * 7.1) * 0.05, [0.66 + Math.sin(i) * 0.06, 0.52, 0.38], { ry: Math.sin(i * 3.3) * 0.05 })
    }
    for (const s of [-1, 1]) {
      for (const t of [0, 1]) cant.metti('legno', scatola(0.12, 1.1, 0.12), t * L, p.quota + 0.45, s * 0.9, COLORI.legnoScuro)
      for (let i = 0; i < 8; i++) {
        const ta = i / 8, tb = (i + 1) / 8, ya = p.quota + 0.85 - Math.sin(Math.PI * ta) * 0.25, yb = p.quota + 0.85 - Math.sin(Math.PI * tb) * 0.25
        cant.metti('liscio', cilindro(0.025, 0.025, Math.hypot(L / 8, yb - ya), 5), (ta + tb) / 2 * L, (ya + yb) / 2, s * 0.9, [0.78, 0.68, 0.5], { rz: Math.PI / 2 + Math.atan2(yb - ya, L / 8) })
      }
    }
  }
}

// ── la staccionata attorno ai campi: pali e due traverse ──
export function staccionate(campi, cant, m) {
  for (const c of campi) {
    const x0 = c.x - 0.25, x1 = c.x + c.w + 0.25, z0 = c.y - 0.25, z1 = c.y + c.h + 0.25
    for (const [xa, za, xb, zb] of [[x0, z0, x1, z0], [x1, z0, x1, z1], [x0, z1, x1, z1], [x0, z0, x0, z1]]) {
      const L = Math.hypot(xb - xa, zb - za), n = Math.max(1, Math.round(L / 1.1))
      cant.base(0, 0, 0, 0).qui((xa + xb) / 2, (za + zb) / 2)
      for (let i = 0; i <= n; i++) { const t = i / n, x = xa + (xb - xa) * t, z = za + (zb - za) * t; cant.metti('legno', scatola(0.09, 0.7, 0.09), x, quotaTerreno(m, x, z) + 0.3, z, [0.62, 0.48, 0.34], { ry: i * 0.7 }) }
      const ya = quotaTerreno(m, xa, za), yb = quotaTerreno(m, xb, zb)
      for (const h of [0.32, 0.58]) cant.metti('legno', scatola(L + 0.08, 0.06, 0.04), (xa + xb) / 2, (ya + yb) / 2 + h, (za + zb) / 2, [0.62, 0.48, 0.34], { ry: -Math.atan2(zb - za, xb - xa), rz: Math.atan2(yb - ya, L), ordine: 'YZX' })
    }
  }
}

// ── il cartello all'incrocio: un palo e una freccia per ogni passaggio della città (`versi` in radianti, 0 = est, π/2 = nord) ──
export function cartello(c, versi, cant, m) {
  const x = c.x + 0.5, z = c.y + 0.5
  cant.base(x, quotaTerreno(m, x, z), z, 0)
  cant.metti('legno', scatola(0.1, 1.6, 0.1), 0, 0.8, 0, COLORI.legnoScuro)
  versi.forEach((a, k) => {
    const g = new Shape(); g.moveTo(0, -0.1); g.lineTo(0.55, -0.1); g.lineTo(0.68, 0); g.lineTo(0.55, 0.1); g.lineTo(0, 0.1)
    cant.metti('legno', new ExtrudeGeometry(g, { depth: 0.04, bevelEnabled: false }), 0, 1.38 - k * 0.24, 0, [0.82, 0.66, 0.46], { ry: a })
  })
}

// ── la bacheca delle taglie: due pali, la tavola col tettuccio, due fogli (le taglie vengono con le quest, fase 6) ──
export function bacheca(b, cant, m) {
  const x = b.x + b.w / 2, z = b.y + b.h / 2
  cant.base(x, quotaTerreno(m, x, z), z, 0)
  for (const s of [-1, 1]) cant.metti('legno', scatola(0.12, 1.9, 0.12), s * 0.8, 0.95, 0, COLORI.legnoScuro)
  cant.metti('legno', scatola(1.7, 1.0, 0.08, 1), 0, 1.25, 0.04, [0.6, 0.45, 0.3])
  for (const s of [-1, 1]) cant.metti('tegole', scatola(2.0, 0.05, 0.42, 1.4), 0, 1.95 + 0.06, s * 0.15, [0.55, 0.32, 0.26], { rx: s * 0.5 })
  for (const [dx, dy, r] of [[-0.42, 1.32, 0.08], [0.36, 1.18, -0.06]]) cant.metti('liscio', scatola(0.42, 0.52, 0.02), dx, dy, 0.1, [0.94, 0.9, 0.78], { rz: r })
}

// ── la X della mappa del tesoro (le taglie «mappa»): un mucchietto di terra smossa con due assi rosse inchiodate a croce, la pala
// piantata accanto, due sassi. Non sta nel cantiere del pezzo: c'è solo a taglia in mano, e indice.js la mette e la toglie (`S.scavi`),
// come il portale. Un gruppo a sé, coi materiali dei pezzi che si muovono ──
export function creaScavo(kit) {
  const c = new Cantiere(), ROSSO = [0.78, 0.16, 0.12]
  c.metti('liscio', new SphereGeometry(0.6, 9, 4, 0, Math.PI * 2, 0, Math.PI / 2), 0, 0, 0, [0.4, 0.29, 0.19], { s: [1.15, 0.34, 1] })
  c.metti('liscio', new SphereGeometry(0.34, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2), 0.12, 0.12, -0.08, [0.33, 0.24, 0.16], { s: [1, 0.45, 1] })
  for (const r of [Math.PI / 4, -Math.PI / 4]) c.metti('legno', scatola(1.05, 0.06, 0.16, 1), 0, 0.23, 0, ROSSO, { ry: r })
  c.metti('liscio', scatola(0.07, 0.03, 0.07), 0, 0.27, 0, COLORI.ferro)
  // la pala piantata nella terra, un po' storta
  c.metti('legno', cilindro(0.03, 0.03, 1.0, 6, 1), 0.55, 0.62, 0.15, COLORI.legno, { rz: -0.28, rx: 0.12 })
  c.metti('legno', scatola(0.2, 0.05, 0.05), 0.69, 1.1, 0.21, COLORI.legnoScuro, { rz: -0.28 })
  c.metti('liscio', scatola(0.22, 0.28, 0.03), 0.43, 0.14, 0.12, [0.55, 0.56, 0.6], { rz: -0.28, rx: 0.12 })
  for (const [x, z, r] of [[-0.62, 0.3, 0.14], [-0.4, -0.55, 0.11]]) c.metti('pietra', new DodecahedronGeometry(r), x, r * 0.5, z, [0.6, 0.58, 0.55], { s: [1.2, 0.7, 1] })
  const g = new Group()
  for (const me of c.chiudi(kit.mobili, kit.ombraMobili)) g.add(me)
  return { g, via() { g.traverse(o => { if (o.geometry) o.geometry.dispose() }) } }
}

// ── il campo del minatore: la tenda, il carretto col minerale, il falò (le fiamme le fa vita.js) ──
export function campoMinatore(mi, cant, m, cose) {
  const tx = mi.tenda.x + 1.5, tz = mi.tenda.y + 1
  cant.base(tx, quotaTerreno(m, tx, tz), tz, 0)
  const L = Math.hypot(1.2, 1.4), a = Math.atan2(1.4, 1.2)
  for (const s of [-1, 1]) cant.metti('stoffa', scatola(L, 0.04, 1.9, 3), s * 0.6, 0.7, 0, [0.82, 0.74, 0.58], { rz: -s * a })
  cant.metti('liscio', triangolo([-1.1, 0, 0.96], [1.1, 0, 0.96], [0, 1.4, 0.96]).scale(0.55, 0.9, 1), 0, 0.02, 0, [0.1, 0.08, 0.06])
  for (const s of [-1, 1]) cant.metti('legno', scatola(0.08, 1.6, 0.08), 0, 0.8, s * 0.95, COLORI.legnoScuro)
  const cx = mi.tenda.x + 3.5, cz = mi.tenda.y + 0.7
  cant.base(cx, quotaTerreno(m, cx, cz), cz, 0.3)
  cant.metti('legno', scatola(0.8, 0.5, 1.3, 1), 0, 0.6, 0, [0.6, 0.45, 0.32])
  for (const s of [-1, 1]) cant.metti('legno', cilindro(0.32, 0.32, 0.1, 12), s * 0.45, 0.32, 0, COLORI.legnoScuro, { rz: Math.PI / 2 })
  for (let i = 0; i < 6; i++) cant.metti('liscio', new DodecahedronGeometry(0.18), (i < 3 ? -0.15 : 0.15), 0.92, (i % 3 - 1) * 0.35, [0.38, 0.36, 0.4])
  cant.metti('liscio', new OctahedronGeometry(0.12), 0, 1.05, 0.2, [0.4, 0.75, 0.95])
  const fx = mi.tenda.x + 0.4, fz = mi.tenda.y + 2.6
  cant.base(fx, quotaTerreno(m, fx, fz), fz, 0)
  for (let i = 0; i < 8; i++) { const a2 = i * Math.PI / 4; cant.metti('liscio', new DodecahedronGeometry(0.1), Math.cos(a2) * 0.32, 0.05, Math.sin(a2) * 0.32, [0.55, 0.53, 0.5]) }
  for (let i = 0; i < 3; i++) cant.metti('legno', cilindro(0.05, 0.05, 0.6, 6), 0, 0.08, 0, [0.45, 0.32, 0.22], { rz: Math.PI / 2, ry: i * Math.PI / 3 })
  cose.fuochi.push(cant.dove(0, 0.08, 0))
  cose.camini.push(cant.dove(0, 0.7, 0))
  for (const s of [0, 1]) cant.metti('stoffa', new SphereGeometry(0.22, 8, 6), -1.0 + s * 0.45, 0.18, -0.9, [0.75, 0.66, 0.5], { s: [1, 0.8, 1] })
}

