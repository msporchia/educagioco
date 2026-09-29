// Una fotografia a settimana di quanto sa un bambino, fuori dal profilo: vedi docs/genitori/come-va.md.
// Voce: { t: quando, m: { materia: 0..100 }, c: { tipologia: [ok, err] } }. Le frecce e «migliorate» la confrontano con adesso.
import { load, save, flush, remove } from './storage.js'

export const OGNI = 7 * 86400000   // una a settimana: il confronto è a una e a due settimane
export const TENUTE = 8            // due mesi: basta per «due settimane fa» anche dopo una pausa

const CHIAVE = id => `istantanee:${id}`

// pura: la prima, o una settimana dopo l'ultima
export function serveUnaNuova(voci = [], now = Date.now()) {
  const ultima = voci[voci.length - 1]
  return !ultima || now - ultima.t >= OGNI
}

export const aggiunta = (voci = [], voce) => [...voci, voce].slice(-TENUTE)

// pura: la più recente che ha almeno `giorni` giorni; null se non ce n'è (il confronto parte da quando c'è)
export function laPiuRecenteDa(voci = [], giorni, now = Date.now()) {
  const limite = now - giorni * 86400000
  for (let i = voci.length - 1; i >= 0; i--) if (voci[i].t <= limite) return voci[i]
  return null
}

export async function leggiIstantanee(id) {
  if (!id) return []
  return (await load(CHIAVE(id)))?.voci || []
}

// `fai` costruisce la voce solo se serve: il conto delle materie non è gratis
export async function fotografaSeServe(id, fai, now = Date.now()) {
  if (!id) return false
  const voci = await leggiIstantanee(id)
  if (!serveUnaNuova(voci, now)) return false
  save(CHIAVE(id), { voci: aggiunta(voci, { t: now, ...fai() }) })
  await flush()
  return true
}

export const scordaIstantanee = id => (id ? remove(CHIAVE(id)) : null)
