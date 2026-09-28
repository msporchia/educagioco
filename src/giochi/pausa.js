// La pausa, una sola per tutti i giochi: vedi docs/core/interfaccia.md.
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { state } from '../store/profile.js'

// stesso numero di quiz/Domanda.vue: il click che il dito lascia dietro a ⏸
export const CIECA = 320

// gira in Node, si prova in test/unita/pausa
export function siFerma({ inPausa = false, festa = false, aiuto = false, anche = false } = {}) {
  return !!(inPausa || festa || aiuto || anche)
}

export class Freno {
  constructor() {
    this.ferma = false
    this.motivo = ''   // 'voluta' (⏸) o 'schermo' (telefono posato): stesso velo, motivo diverso
  }

  get inPausa() { return this.ferma }

  // idempotente, il primo motivo vince: chi ha premuto ⏸ e poi posato il telefono resta in pausa sua
  metti({ auto = false } = {}) {
    if (this.ferma) return false
    this.ferma = true
    this.motivo = auto ? 'schermo' : 'voluta'
    return true
  }

  togli() {
    if (!this.ferma) return false
    this.ferma = false
    this.motivo = ''
    return true
  }

  schermo(visibile) {   // il ritorno non fa niente: mai riprendere da soli
    if (!visibile) this.metti({ auto: true })
    return this.ferma
  }
}

export function usaPausa({ anche = null } = {}) {
  const freno = new Freno()
  const inPausa = ref(false)
  const motivo = ref('')
  const aiutoAperto = ref(false)   // il foglio del `?` ferma la partita, come state.festa

  const rispecchia = () => { inPausa.value = freno.inPausa; motivo.value = freno.motivo }
  const metti = opzioni => { freno.metti(opzioni); rispecchia() }
  const togli = () => { freno.togli(); rispecchia() }
  const aiuto = v => { aiutoAperto.value = !!v }

  const fermo = computed(() => siFerma({
    inPausa: inPausa.value,
    festa: state.festa.length > 0,
    aiuto: aiutoAperto.value,
    anche: anche ? !!anche() : false,
  }))

  // pagehide oltre a visibilitychange: su iOS il primo non arriva sempre (come App.vue)
  function guarda(e) {
    if (e?.type === 'pagehide' || document.visibilityState === 'hidden') {
      freno.schermo(false)
      rispecchia()
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', guarda)
    addEventListener('pagehide', guarda)
  })
  onUnmounted(() => {
    document.removeEventListener('visibilitychange', guarda)
    removeEventListener('pagehide', guarda)
  })

  return { inPausa, motivo, fermo, aiutoAperto, metti, togli, aiuto }
}
