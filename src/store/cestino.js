// Il cestino dei progressi: vedi docs/genitori/cestino-e-posta.md.
import { load, save, flush } from './storage.js'

const CHIAVE = 'cestino'
const QUANTE = 3   // di più farebbe fallire la scrittura del profilo vero su localStorage

async function elenco() {
  const c = await load(CHIAVE)
  return Array.isArray(c?.voci) ? c.voci : []
}

// il profilo si passa da fuori quando il chiamante ne ha uno più fresco
// del disco (state.profile, quasi sempre); senza, si rilegge dall'archivio
export async function cestina(id, nome, profilo = null, motivo = '') {
  if (!id) return
  const dati = profilo ? JSON.parse(JSON.stringify(profilo)) : await load('profilo:' + id)
  if (!dati) return
  const voci = await elenco()
  voci.unshift({ quando: new Date().toISOString(), id, nome: nome || id, motivo, profilo: dati })
  save(CHIAVE, { voci: voci.slice(0, QUANTE) })
  await flush()   // subito: quello che segue è una cancellazione
}

export async function leggiCestino() {
  return (await elenco()).map(({ quando, id, nome, motivo }) => ({ quando, id, nome, motivo }))
}

// si riconosce dal momento in cui è stata cestinata (nessuna doppia nello stesso ms)
export async function voceCestinata(quando) {
  return (await elenco()).find(v => v.quando === quando) || null
}

export async function svuotaCestino() {
  save(CHIAVE, { voci: [] })
  await flush()
}
