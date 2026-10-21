/* Il caso del mondo: sempre lo stesso per le stesse coordinate. Niente `Math.random`: un lotto lontano si genera a richiesta e
   deve venire uguale a ogni avvio, su ogni telefono. Vedi docs/fattoria3d/mondo-infinito.md. */
export const SEME_MONDO = 0x5eed1

/** Un numero in [0, 1) che dipende solo da (a, b, sale): per le scelte di un lotto («è un lago?») senza una sequenza. */
export function mescola(a, b, sale = 0) {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul((sale + SEME_MONDO) | 0, 2246822519)) | 0
  h = Math.imul(h ^ (h >>> 15), 2246822519); h = Math.imul(h ^ (h >>> 13), 3266489917); h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

/** Una sequenza (mulberry32) che parte da (a, b, sale): `caso()` torna un numero in [0, 1). */
export function sequenza(a, b, sale = 0) {
  let r = (Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul((sale + SEME_MONDO) | 0, 0x9e3779b9)) >>> 0
  return () => { r = (r + 0x6d2b79f5) >>> 0; let t = Math.imul(r ^ (r >>> 15), 1 | r); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
