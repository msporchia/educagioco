// La posta dei grandi: vedi docs/genitori/cestino-e-posta.md. Contenuto in
// guide/novita.js; qui solo la memoria di cosa si è letto.
import { ref } from 'vue'
import { load, save, flush, chiavi } from './storage.js'
import { NOTE, ULTIMA } from '../guide/novita.js'

const CHIAVE = 'note-lette'
const AVVISI = 'posta-avvisi'
// avvisi «una volta sola» già scritti: separati dagli avvisi perché quelli si buttano leggendo, questo no
const DETTI = 'posta-detti'

export const daLeggere = ref(0)

const leggiSegno = async () => (await load(CHIAVE))?.id
const leggiAvvisi = async () => (await load(AVVISI))?.voci || []

// si enumerano le chiavi dei profili invece del roster: un profilo orfano gioca comunque
async function etaInCasa() {
  const eta = []
  for (const k of await chiavi('profilo:')) {
    const e = (await load(k))?.settings?.eta
    if (typeof e === 'number') eta.push(e)
  }
  return eta
}

// pura, test/unita/posta: senza età conosciuta una nota mirata si mostra comunque
export function scegli(note, segno, eta = []) {
  const daQui = typeof segno === 'number' ? segno : 0
  return note
    .filter(n => n.id > daQui)
    .filter(n => {
      if (!n.riguarda || !eta.length) return true
      const { etaDa = -Infinity, etaA = Infinity } = n.riguarda
      return eta.some(e => e >= etaDa && e <= etaA)
    })
    .sort((a, b) => b.id - a.id)
}

export async function laPosta() {
  const note = scegli(NOTE, await leggiSegno(), await etaInCasa())
  return { note, avvisi: await leggiAvvisi() }
}

async function ricalcola() {
  const { note, avvisi } = await laPosta()
  daLeggere.value = note.length + avvisi.length
  return daLeggere.value
}

// chiamata dopo profile.init(): senza segno, nessun profilo in casa parte da ULTIMA
// (installazione nuova), altrimenti da 0 (casa che giocava già)
export async function initPosta() {
  if (typeof await leggiSegno() !== 'number') {
    const vergine = (await chiavi('profilo:')).length === 0
    save(CHIAVE, { id: vergine ? ULTIMA : 0 })
    await flush()
  }
  return ricalcola()
}

export async function segnaLetta() {
  save(CHIAVE, { id: ULTIMA })
  save(AVVISI, { voci: [] })
  await flush()
  return ricalcola()
}

// azione facoltativa, stessa forma delle note ({ testo, scheda })
export async function avvisa(testo, azione = null) {
  const voci = await leggiAvvisi()
  voci.unshift({ quando: new Date().toISOString(), testo, azione })
  save(AVVISI, { voci: voci.slice(0, 10) })
  await flush()
  return ricalcola()
}

// Una volta sola per chiave: la chiave contiene il bambino (g2:orto:doppie),
// se no due fratelli si toglierebbero l'avviso a vicenda.
export async function avvisaUnaVolta(chiave, testo, azione = null) {
  if (!chiave) return false
  const detti = (await load(DETTI))?.voci || []
  if (detti.includes(chiave)) return false
  save(DETTI, { voci: [chiave, ...detti].slice(0, 200) })
  await avvisa(testo, azione)
  return true
}
