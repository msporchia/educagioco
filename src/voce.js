// La voce: pronuncia incisa, non sintesi del dispositivo. Vedi docs/lingue/voce.md.
import { SPRITE as SPRITE_EN, INDICE as INDICE_EN } from './data/voci.js'
import { SPRITE as SPRITE_ES, INDICE as INDICE_ES } from './data/voci-es.js'
import { acceso, contesto } from './audio.js'

const VOCI = {
  en: { sprite: SPRITE_EN, indice: INDICE_EN },
  es: { sprite: SPRITE_ES, indice: INDICE_ES },
}

const QUANTI_TENERNE = 3
const decodificati = new Map()      // 'lingua:sprite' -> AudioBuffer (in ordine d'uso)
const inCorso = new Map()           // 'lingua:sprite' -> Promise, per non decodificare due volte
let ultima = null                   // la sorgente che sta suonando

const vocabolario = lingua => VOCI[lingua] || VOCI.en

/** C'è la pronuncia di questa parola? */
export const haVoce = (parola, lingua = 'en') => !!vocabolario(lingua).indice[parola]

function daBase64(dato) {
  const b = atob(dato.slice(dato.indexOf(',') + 1))
  const a = new Uint8Array(b.length)
  for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i)
  return a.buffer
}

async function prendiSprite(lingua, nome) {
  const id = lingua + ':' + nome
  if (decodificati.has(id)) {
    const buf = decodificati.get(id)
    decodificati.delete(id); decodificati.set(id, buf)   // rinfresca l'ordine d'uso
    return buf
  }
  if (inCorso.has(id)) return inCorso.get(id)

  const ac = contesto()
  const sprite = vocabolario(lingua).sprite[nome]
  if (!ac || !sprite) return null
  const lavoro = ac.decodeAudioData(daBase64(sprite)).then(buf => {
    decodificati.set(id, buf)
    while (decodificati.size > QUANTI_TENERNE)
      decodificati.delete(decodificati.keys().next().value)
    inCorso.delete(id)
    return buf
  }).catch(() => { inCorso.delete(id); return null })
  inCorso.set(id, lavoro)
  return lavoro
}

/** Scalda lo sprite di una parola senza suonarlo, così la prima pronuncia non fa aspettare. */
export function prepara(parole, lingua = 'en') {
  const indice = vocabolario(lingua).indice
  const visti = new Set()
  for (const p of parole) {
    const v = indice[p]
    if (v && !visti.has(v[0])) { visti.add(v[0]); prendiSprite(lingua, v[0]) }
    if (visti.size >= QUANTI_TENERNE) break
  }
}

export async function pronuncia(parola, lingua = 'en') {
  const voce = vocabolario(lingua).indice[parola]
  if (!voce || !acceso.value) return
  const [nome, inizio, durata] = voce
  const ac = contesto()
  if (!ac) return
  const buf = await prendiSprite(lingua, nome)
  if (!buf || !acceso.value) return

  zittisci()
  const src = ac.createBufferSource()
  src.buffer = buf
  const g = ac.createGain()
  g.gain.value = 1
  src.connect(g); g.connect(ac.destination)
  src.start(0, inizio, durata + 0.06)   // margine in coda: il taglio secco mangia la fine della parola
  ultima = src
  src.onended = () => { if (ultima === src) ultima = null }
}

export function zittisci() {
  if (!ultima) return
  try { ultima.stop() } catch { /* già finita */ }
  ultima = null
}
