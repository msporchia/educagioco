// Il budget del Sotterraneo 3D per chi crea un modello o un effetto (docs/sotterraneo/appiattimento-3d.md, «Le regole»): quanto pesa un
// oggetto (`pesa`, puro: gira in Node sul catalogo 3D) e cosa gli è permesso (`BUDGET`, `fuori`). I numeri vengono dal catalogo del
// budget misurato sulla scena vera e dal log del Redmi Note 7. Nel prototipo finché Marco non sceglie: poi va in src/grafica/.

/**
 * Quanto pesa un oggetto 3D, una volta costruito: { chiamate, triangoli, luci, fisici, pelle, additivi, trasparenti, shader, tipi }.
 * `chiamate`: una per mesh visibile e per gruppo di materiali (un InstancedMesh è una); `triangoli` contando le istanze; `luci`: le luci
 * puntiformi e i coni dentro il modello; `fisici`: i MeshPhysicalMaterial (vetro, gelatina: i più cari per pixel); `pelle`: le
 * SkinnedMesh; `additivi`/`trasparenti`: le mesh in somma di luce o sfumate (pixel disegnati due volte); `shader`: le ricette
 * diverse di materiale (tipo + trame + colori ai vertici + pelle + istanze + trasparenza), una stima dei programmi da compilare.
 */
export function pesa(o) {
  const p = { chiamate: 0, triangoli: 0, luci: 0, fisici: 0, pelle: 0, additivi: 0, trasparenti: 0, shader: 0, tipi: {} }
  const ricette = new Set()
  o.traverseVisible(x => {                               // un gruppo spento (le fiamme del soffio a riposo) non si disegna, coi figli
    if (x.isPointLight || x.isSpotLight) { p.luci++; return }
    if (!(x.isMesh || x.isPoints || x.isLine || x.isSprite)) return
    if ((x.layers.mask & 1) === 0) return              // un osso della pelle (scena3d/salda3d.js): lo disegna la SkinnedMesh
    const g = x.geometry, mats = [].concat(x.material || [])
    const gruppi = Array.isArray(x.material) && g && g.groups.length ? g.groups.length : 1
    p.chiamate += gruppi
    if (g && g.attributes && g.attributes.position) {
      const n = (g.index ? g.index.count : g.attributes.position.count) / (x.isMesh ? 3 : 1)
      p.triangoli += Math.round(n * (x.isInstancedMesh ? x.count : 1))
    }
    if (x.isSkinnedMesh) p.pelle++
    for (const m of mats) {
      if (!m) continue
      p.tipi[m.type] = (p.tipi[m.type] || 0) + 1
      if (m.isMeshPhysicalMaterial) p.fisici++
      if (m.blending === 2) p.additivi++                   // AdditiveBlending
      else if (m.transparent) p.trasparenti++
      ricette.add([m.type, !!m.map, !!m.normalMap, !!m.vertexColors, !!m.transparent, x.isSkinnedMesh, x.isInstancedMesh, m.customProgramCacheKey ? m.customProgramCacheKey().length : 0].join('|'))
    }
  })
  p.shader = ricette.size
  return p
}

// Per modello (dopo la saldatura, come nel gioco). `personaggio`: un mostro, una persona, l'eroe vestito; `cosa`: arredo, roba, un
// edificio; `effetto`: un colpo, un'aura, uno stato. Le luci dentro un modello sono sempre zero: la luce è della scena, con la riserva
// fissa di luci.js (ognuna costa in ogni pixel di ogni materiale); un modello che vuole brillare usa l'emissivo o un bagliore additivo.
export const BUDGET = {
  personaggio: { chiamate: 40, triangoli: 15000, luci: 0, fisici: 0, additivi: 4, shader: 4 },
  cosa: { chiamate: 12, triangoli: 6000, luci: 0, fisici: 0, additivi: 4, shader: 3 },
  effetto: { chiamate: 8, triangoli: 4000, luci: 0, fisici: 0, additivi: 8, shader: 3 },
}
// Per scena dello scontro (il Note 7, fascia bassa: docs/sotterraneo/appiattimento-3d.md, «Il budget della scena»)
export const SCENA = { chiamate: 350, triangoli: 400000, luciPerPixel: 2, shader: 40, pixelRatio: 1, uniform: 600 }

/** Le voci di `peso` oltre il budget `b`: [[nome, valore, tetto]]. */
export const fuori = (peso, b) => Object.keys(b).filter(k => peso[k] > b[k]).map(k => [k, peso[k], b[k]])
