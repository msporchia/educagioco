// L'aspetto dei pannelli del sotterraneo, in prova (docs/sotterraneo/tema-pannelli.md): l'attuale, «pietra» (2D
// rifinito) o «rilievo» (lo stesso, con la profondità). Si sceglie col cheat `#tema=pietra|rilievo|attuale`, e il
// telefono se lo ricorda (dall'app installata l'indirizzo non si scrive): è di chi prova, non di un bambino, come il
// tasto salta. Il tema è solo un attributo sulla radice del gioco (`data-tema`): lo leggono i CSS di questa
// cartella, e la Domanda comune lo eredita dalle sue variabili `--qz-…`
import { ref, watch, onUnmounted } from 'vue'
import { load, save } from '../../../store/storage.js'
import { accendiRilievo } from './rilievo.js'

const CHIAVE = 'sotterraneo-tema'
export const TEMI = ['attuale', 'pietra', 'rilievo']
// «rilievo» è pietra più la profondità: l'attributo li porta tutti e due, così rilievo.css aggiunge e non ripete
export const ATTRIBUTO = { attuale: null, pietra: 'pietra', rilievo: 'pietra rilievo' }

export const tema = ref('attuale')
let letto = false

function dallIndirizzo() {
  try { return new URLSearchParams(location.hash.slice(1)).get('tema') } catch { return null }
}

// l'indirizzo vince e si ricorda; senza, quello ricordato. Mai il valore nudo: storage.js scarta i `true` soli
export async function leggiTema() {
  const h = dallIndirizzo()
  if (TEMI.includes(h)) {
    tema.value = h
    save(CHIAVE, { tema: h })
    return h
  }
  if (!letto) {
    letto = true
    const c = await load(CHIAVE)
    if (c && TEMI.includes(c.tema) && !TEMI.includes(dallIndirizzo())) tema.value = c.tema
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
