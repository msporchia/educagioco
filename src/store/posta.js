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
// c'è un avviso sulle domande che vanno male: la home lo dice al bambino con una frase sola, mai con il contenuto (docs/genitori/cestino-e-posta.md)
export const difficoltaDaDire = ref(false)
// «Non avvertirmi più» e quando si è avvisato l'ultima volta, per bambino: fuori dai profili, come il resto della posta
const SILENZI = 'posta-silenzi'
const ULTIMI = 'posta-difficolta'
export const avvisiDifficolta = ref(true)

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
  difficoltaDaDire.value = avvisi.some(a => a.tipo === 'difficolta')
  return daLeggere.value
}

// chiamata dopo profile.init(): senza segno, nessun profilo in casa parte da ULTIMA
// (installazione nuova), altrimenti da 0 (casa che giocava già)
export async function initPosta() {
  avvisiDifficolta.value = (await load(SILENZI))?.difficolta !== false
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

// azione facoltativa, stessa forma delle note ({ testo, scheda, dove? }: dove è una chiave di DOVE in GenitoriView)
export async function avvisa(testo, azione = null, extra = {}) {
  const voci = await leggiAvvisi()
  voci.unshift({ quando: new Date().toISOString(), testo, azione, ...extra })
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

/* ── Gli avvisi sulle domande che vanno male (quiz/allarme.js, store/difficolta.js) ── */
export const ultimoAvvisoDifficolta = async id => (await load(ULTIMI))?.[id] || 0
export async function segnaAvvisoDifficolta(id, quando = Date.now()) {
  save(ULTIMI, { ...((await load(ULTIMI)) || {}), [id]: quando })
  await flush()
}
// `tipo` e `silenzia`: la home dice al bambino la sua frase, e il grande trova «Non avvertirmi più» sulla carta
export const avvisaDifficolta = (testo, azione) => avvisa(testo, azione, { tipo: 'difficolta', silenzia: true })

// mai il booleano nudo (docs/core/archivio.md): { difficolta: false } vuol dire spento
export async function accendiAvvisiDifficolta(si) {
  avvisiDifficolta.value = !!si
  save(SILENZI, { difficolta: !!si })
  if (!si) save(AVVISI, { voci: (await leggiAvvisi()).filter(a => a.tipo !== 'difficolta') })
  await flush()
  return ricalcola()
}
