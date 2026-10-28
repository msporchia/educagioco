/* ═══════════════════════════════════════════════════════════════════
   IL RITAGLIO DI PAVIMENTO E PARETI — docs/sotterraneo/prestazioni-3d-bassa.md, «Il ritaglio»

   Un pavimento di 40×40 celle (un quadrato per cella) e una parete a due
   materiali: con la telecamera su un angolo l'indice tiene solo i blocchi
   inquadrati (i triangoli sotto la telecamera ci sono, quelli lontani no),
   i gruppi restano uno per materiale; spento il ritaglio torna tutto.
   ═══════════════════════════════════════════════════════════════════ */
import { BufferGeometry, Float32BufferAttribute, PerspectiveCamera } from 'three'
import { creaRitaglio } from '../../src/giochi/sotterraneo/scena3d/ritaglio.js'
import { ACCESI } from '../../src/giochi/sotterraneo/scena3d/costanti.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const W = 40, H = 40
function griglia(gruppi = false) {
  const pos = [], idx = []
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const b = pos.length / 3
    pos.push(x, 0, y, x + 1, 0, y, x, 0, y + 1, x + 1, 0, y + 1)
    idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  if (gruppi) { g.addGroup(0, idx.length / 2, 0); g.addGroup(idx.length / 2, idx.length / 2, 1) }
  return g
}
// la telecamera sopra la cella (5, 5), che guarda giù
const cam = new PerspectiveCamera(50, 1, 0.5, 200)
cam.position.set(5.5, 12, 9); cam.lookAt(5.5, 0, 5.5); cam.updateProjectionMatrix()
const celleDi = (g, da, n) => { const s = new Set(), p = g.attributes.position, l = g.index.array; for (let i = da; i < da + n; i += 3) s.add(Math.floor(p.getZ(l[i]) + 0.01) * W + Math.floor(p.getX(l[i]) + 0.01)); return s }

const pav = griglia(), rp = creaRitaglio(pav, W, H, 0), tutti = pav.index.count
rp.aggiorna(cam)
const n = pav.drawRange.count, viste = celleDi(pav, 0, n)
controlla('si disegna meno di un quarto del pavimento', n > 0 && n < tutti / 4, `${n} di ${tutti}`)
controlla('la cella sotto la telecamera c\'è, quella nell\'angolo lontano no', viste.has(5 * W + 5) && !viste.has(39 * W + 39))
uguale('i blocchi: quelli disegnati e tutti', rp.tutti, 100)
const prima = pav.index.version
rp.aggiorna(cam)
uguale('ferma la telecamera, l\'indice non si riscrive', pav.index.version, prima)

const par = griglia(true), rm = creaRitaglio(par, W, H, 2)
rm.aggiorna(cam)
// il primo materiale ha le righe 0-19 (vicine alla telecamera), il secondo le 20-39
controlla('due materiali: due gruppi, uno dopo l\'altro, ognuno coi suoi blocchi', par.groups.length === 2 && par.groups[1].start === par.groups[0].count && par.groups[0].count > 0 && par.groups[1].count < par.groups[0].count,
  JSON.stringify(par.groups))

ACCESI.ritaglio = false
rp.aggiorna(cam); rm.aggiorna(cam)
controlla('spento: l\'indice intero e i gruppi di prima', pav.index.count === tutti && pav.drawRange.count === Infinity && par.groups[0].count === tutti / 2 && par.groups[1].start === tutti / 2)
ACCESI.ritaglio = true

riassunto('il ritaglio di pavimento e pareti')
