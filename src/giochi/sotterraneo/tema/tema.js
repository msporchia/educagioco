// L'aspetto dei pannelli del sotterraneo, in prova (docs/sotterraneo/tema-pannelli.md): l'attuale, «legno» (legno e
// ottone, in 2D) o «rilievo» (lo stesso, con lo spessore). Si sceglie col cheat `#tema=legno|rilievo|attuale`, e il
// telefono se lo ricorda (dall'app installata l'indirizzo non si scrive): è di chi prova, non di un bambino, come il
// tasto salta. Il tema è solo un attributo sulla radice del gioco (`data-tema`): lo leggono i CSS di questa
// cartella, e la Domanda comune lo eredita dalle sue variabili `--qz-…`
import { ref, watch, onUnmounted } from 'vue'
import { load, save } from '../../../store/storage.js'
import { accendiRilievo } from './rilievo.js'

const CHIAVE = 'sotterraneo-tema'
export const TEMI = ['attuale', 'legno', 'rilievo']
// «pietra» era il primo nome di «legno»: un telefono che l'ha salvato, o un indirizzo vecchio, vale legno
const ALIAS = { pietra: 'legno' }
export const temaDi = t => (TEMI.includes(t) ? t : ALIAS[t] || null)
// «rilievo» è legno più lo spessore: l'attributo li porta tutti e due, così rilievo.css aggiunge e non ripete
export const ATTRIBUTO = { attuale: null, legno: 'legno', rilievo: 'legno rilievo' }

export const tema = ref('attuale')
let letto = false

function dallIndirizzo() {
  try { return new URLSearchParams(location.hash.slice(1)).get('tema') } catch { return null }
}

// l'indirizzo vince e si ricorda; senza, quello ricordato. Mai il valore nudo: storage.js scarta i `true` soli
export async function leggiTema() {
  const h = temaDi(dallIndirizzo())
  if (h) {
    tema.value = h
    save(CHIAVE, { tema: h })
    return h
  }
  if (!letto) {
    letto = true
    const c = await load(CHIAVE)
    if (c && temaDi(c.tema) && !temaDi(dallIndirizzo())) tema.value = temaDi(c.tema)
  }
  return tema.value
}

// per Gioco.vue: legge il tema, lo rilegge se cambia il `#`, e accende il dito del rilievo sulla radice (`radice`, un ref)
export function usaTema(radice) {
  leggiTema()
  const rilegge = () => leggiTema()
  addEventListener('hashchange', rilegge)
  let spegni = null
  watch([tema, radice], ([t, el]) => {
    if (spegni) { spegni(); spegni = null }
    if (t === 'rilievo' && el) spegni = accendiRilievo(el)
  }, { immediate: true })
  onUnmounted(() => {
    removeEventListener('hashchange', rilegge)
    if (spegni) spegni()
  })
  return tema
}
