// Il ritaglio di pavimento e pareti (docs/sotterraneo/prestazioni-3d.md, «Il ritaglio»): sono una mesh ciascuno per tutto il piano, e la
// telecamera ne vede un pezzo; i triangoli si mettono a blocchi di celle e a ogni fotogramma l'indice tiene solo i blocchi che l'inquadratura
// tocca (riscritto quando cambiano). Le chiamate restano quelle: cambia quanti vertici fa la GPU, che sul Note 7 era il fondo che pesava.
import { Frustum, Matrix4, Box3, Vector3, BufferAttribute, DynamicDrawUsage } from 'three'
import { ACCESI } from './costanti.js'

export const BLOCCO = 4     // celle per lato di un blocco
const MARGINE = 1           // celle attorno a un blocco: i muri che sporgono, l'ombra che arriva da appena fuori

/**
 * `geo`: la geometria indicizzata (coi suoi gruppi, se ha più materiali), in celle del piano `W`×`H`, alta al più `alto`.
 * → { aggiorna(camera), blocchi: quanti blocchi si disegnano, tutti: quanti ne hanno qualcosa }
 */
export function creaRitaglio(geo, W, H, alto) {
  const pos = geo.attributes.position, intero = geo.index, idx = intero.array
  const BW = Math.ceil(W / BLOCCO), BH = Math.ceil(H / BLOCCO), NB = BW * BH
  const conGruppi = geo.groups.length > 0
  const originali = conGruppi ? geo.groups.map(g => ({ ...g })) : [{ start: 0, count: idx.length, materialIndex: 0 }]
  // per gruppo e per blocco, i suoi triangoli (il blocco del baricentro)
  const pezzi = originali.map(g => {
    const l = Array.from({ length: NB }, () => [])
    for (let i = g.start; i < g.start + g.count; i += 3) {
      const a = idx[i], b = idx[i + 1], c = idx[i + 2]
      const x = (pos.getX(a) + pos.getX(b) + pos.getX(c)) / 3, z = (pos.getZ(a) + pos.getZ(b) + pos.getZ(c)) / 3
      const bx = Math.min(BW - 1, Math.max(0, Math.floor(x / BLOCCO))), bz = Math.min(BH - 1, Math.max(0, Math.floor(z / BLOCCO)))
      l[bz * BW + bx].push(a, b, c)
    }
    return l.map(v => (v.length ? Uint32Array.from(v) : null))
  })
  const pieni = Array.from({ length: NB }, (_, b) => pezzi.some(p => p[b]))
  const scatole = Array.from({ length: NB }, (_, b) => {
    const x = (b % BW) * BLOCCO, z = Math.floor(b / BW) * BLOCCO
    return new Box3(new Vector3(x - MARGINE, -0.5, z - MARGINE), new Vector3(x + BLOCCO + MARGINE, alto + 0.5, z + BLOCCO + MARGINE))
  })
  const dentro = new (idx instanceof Uint16Array ? Uint16Array : Uint32Array)(idx.length)
  const ritagliato = new BufferAttribute(dentro, 1).setUsage(DynamicDrawUsage)
  const visti = new Uint8Array(NB), fr = new Frustum(), m = new Matrix4()
  let acceso = false, blocchi = 0
  const rimetti = () => {
    geo.setIndex(intero); geo.setDrawRange(0, Infinity)
    if (conGruppi) originali.forEach((g, k) => { geo.groups[k].start = g.start; geo.groups[k].count = g.count })
  }
  return {
    get blocchi() { return acceso ? blocchi : pieni.filter(Boolean).length },
    get tutti() { return pieni.filter(Boolean).length },
    aggiorna(camera) {
      if (!ACCESI.ritaglio) { if (acceso) { rimetti(); acceso = false } return }
      let cambia = !acceso
      if (!acceso) { geo.setIndex(ritagliato); acceso = true }
      camera.updateMatrixWorld()
      fr.setFromProjectionMatrix(m.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse))
      for (let b = 0; b < NB; b++) {
        const v = pieni[b] && fr.intersectsBox(scatole[b]) ? 1 : 0
        if (v !== visti[b]) { visti[b] = v; cambia = true }
      }
      if (!cambia) return
      let o = 0
      blocchi = 0
      for (let b = 0; b < NB; b++) blocchi += visti[b]
      originali.forEach((_, k) => {
        const s = o
        for (let b = 0; b < NB; b++) if (visti[b] && pezzi[k][b]) { dentro.set(pezzi[k][b], o); o += pezzi[k][b].length }
        if (conGruppi) { geo.groups[k].start = s; geo.groups[k].count = o - s }
      })
      if (!conGruppi) geo.setDrawRange(0, o)
      ritagliato.clearUpdateRanges(); ritagliato.addUpdateRange(0, Math.max(1, o)); ritagliato.needsUpdate = true
    },
  }
}
