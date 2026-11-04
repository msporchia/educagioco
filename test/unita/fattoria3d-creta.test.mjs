/* La creta della fattoria 3D (docs/fattoria3d/creta.md): le forme danno la distanza giusta, la pelle è chiusa (ogni spigolo fra due triangoli),
   i vertici stanno sulla superficie, le normali guardano fuori, le unioni morbide fanno un pezzo solo; e gli animali nati «da lontano» fanno la
   pelle fine solo quando serve.
   `node test/esegui.mjs fattoria3d-creta`
   tempo: 1 */
import { controlla, uguale, dentro as tra, riassunto } from '../aiuto/verifica.mjs'

const ctx = new Proxy({}, { get: (_, k) => k === 'canvas' ? {} : () => {}, set: () => true })
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
const { palla, osso, fila, girata, unione, meno, dentro, sopra, pelle, macchie, PARTENZA } = await import('../../src/giochi/fattoria3d/scena3d/creta.js')
const { impostaDettaglio, misure } = await import('../../src/giochi/fattoria3d/scena3d/modelli-compagni.js')
const { creaCaneDiRazza } = await import('../../src/giochi/fattoria3d/scena3d/modelli-cani.js')

// ── le forme ──
{
  const s = palla([0, 0, 0], 0.1)
  tra('la palla: al centro è dentro di un raggio', s.f(0, 0, 0), -0.1001, -0.0999)
  tra('…sulla pelle è zero', s.f(0.1, 0, 0), -1e-9, 1e-9)
  tra('…fuori è la distanza', s.f(0.3, 0, 0), 0.1999, 0.2001)
  const o = osso([0, 0, 0], [0, 1, 0], 0.2, 0.1)
  tra('l\'osso: sotto la base tonda', o.f(0, -0.3, 0), 0.0999, 0.1001)
  tra('…di lato a metà, fuori di poco', o.f(0.5, 0.5, 0), 0.34, 0.36)
  const e = girata(palla([0, 0, 0], [0.3, 0.05, 0.05]), [0, 0, Math.PI / 2])
  controlla('girata di un quarto, l\'ellissoide lungo in x diventa lungo in y', e.f(0, 0.29, 0) < 0 && e.f(0.29, 0, 0) > 0)
  const u = unione([palla([-0.1, 0, 0], 0.1), palla([0.1, 0, 0], 0.1)], 0.06)
  controlla('l\'unione morbida riempie il collo fra due palle', u.f(0, 0.03, 0) < 0 && Math.min(palla([-0.1, 0, 0], 0.1).f(0, 0.03, 0), palla([0.1, 0, 0], 0.1).f(0, 0.03, 0)) > 0)
  const m = meno(palla([0, 0, 0], 0.1), palla([0, 0, 0.1], 0.05))
  controlla('meno scava', m.f(0, 0, 0.08) > 0 && m.f(0, 0, -0.08) < 0)
  controlla('dentro e sopra tagliano piatto', dentro(palla([0, 0, 0], 0.1), sopra(0)).f(0, -0.05, 0) > 0)
  const vals = Array.from({ length: 200 }, (_, i) => macchie(i * 0.013, i * 0.007, i * 0.011))
  controlla('le macchie stanno fra 0 e 1, e ce ne sono', vals.every(v => v >= 0 && v <= 1) && vals.some(v => v > 0.9) && vals.some(v => v === 0))
  uguale('…e sono sempre le stesse', macchie(0.31, 0.2, -0.1), macchie(0.31, 0.2, -0.1))
}

// ── la pelle ──
{
  const forma = unione([palla([0, 0, 0], [0.12, 0.08, 0.1]), osso([0, 0, 0], [0, 0.2, 0.05], 0.05, 0.03)], 0.04)
  const g = pelle(forma, { min: [-0.15, -0.1, -0.15], max: [0.15, 0.25, 0.15], passo: 0.012, colore: (x, y, z, c) => c.setRGB(y > 0.1 ? 1 : 0, 0, 0) })
  const pos = g.attributes.position, nor = g.attributes.normal, col = g.attributes.color, ind = g.index.array
  let lontano = 0, storte = 0
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    if (Math.abs(forma.f(x, y, z)) > 0.0015) lontano++
    const e = 1e-4, gx = forma.f(x + e, y, z) - forma.f(x - e, y, z), gy = forma.f(x, y + e, z) - forma.f(x, y - e, z), gz = forma.f(x, y, z + e) - forma.f(x, y, z - e)
    if (nor.getX(i) * gx + nor.getY(i) * gy + nor.getZ(i) * gz <= 0) storte++
  }
  controlla('i vertici stanno sulla pelle (a meno di un millimetro e mezzo)', lontano === 0, `${lontano} su ${pos.count}`)
  uguale('le normali guardano fuori', storte, 0)
  const spigoli = new Map()
  for (let t = 0; t < ind.length; t += 3) for (const [a, b] of [[ind[t], ind[t + 1]], [ind[t + 1], ind[t + 2]], [ind[t + 2], ind[t]]]) { const k = a < b ? a + ',' + b : b + ',' + a; spigoli.set(k, (spigoli.get(k) || 0) + 1) }
  controlla('la pelle è chiusa: ogni spigolo sta fra due triangoli', [...spigoli.values()].every(n => n === 2))
  controlla('i triangoli guardano fuori come le normali', (() => {
    let ok = 0, tot = 0
    for (let t = 0; t < ind.length; t += 3) {
      const [a, b, c] = [ind[t], ind[t + 1], ind[t + 2]].map(i => [pos.getX(i), pos.getY(i), pos.getZ(i)])
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
      if (n[0] * nor.getX(ind[t]) + n[1] * nor.getY(ind[t]) + n[2] * nor.getZ(ind[t]) > 0) ok++; tot++
    }
    return ok / tot > 0.99
  })())
  controlla('i colori vengono dalla posizione', col.getX(0) === (pos.getY(0) > 0.1 ? 1 : 0))
  const g2 = pelle(forma, { min: [-0.15, -0.1, -0.15], max: [0.15, 0.25, 0.15], passo: 0.012, centro: [0, 0.1, 0] })
  tra('`centro` sposta la pelle nel suo perno', g2.boundingBox.min.y - g.boundingBox.min.y, -0.1001, -0.0999)
}

// ── da lontano prima, fine quando serve ──
{
  PARTENZA.lontano = true
  let cane
  try { cane = creaCaneDiRazza('collie') } finally { PARTENZA.lontano = false }
  const povero = misure(cane).triangoli
  impostaDettaglio(cane, true); impostaDettaglio(cane, false)
  const fine = misure(cane).triangoli
  controlla('nato da lontano ha la pelle povera, e quella fine arriva avvicinandosi', povero * 3 < fine, `${povero} → ${fine}`)
  uguale('…uguale a quella di un cane nato vicino', fine, misure(creaCaneDiRazza('collie')).triangoli)
}

riassunto('Fattoria 3D — la creta')
