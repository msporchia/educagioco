// La guida del primo giro, una per tutti i giochi: vedi docs/core/guida.md.
// Il gioco dice cosa toccare con un selettore (`passo.dove`, di solito il
// bersaglio dei test), qui lo si accende con `data-indicato`: l'anello sta
// in style.css, la riga col 👇 in Guida.vue. `passo.mano` aggiunge la manina
// 👆, per i giochi di chi non legge ancora.
import { ref, reactive, computed, watch, onUnmounted, nextTick } from 'vue'

export function usaGuida(radice, passo) {
  let accesi = []
  /* un selettore che non trova niente (la cassetta ancora chiusa) non è un
     guasto: si riaccende appena il pezzo compare */
  function accendi() {
    const p = passo.value, r = radice.value
    let nuovi = []
    try { nuovi = p && p.dove && r ? [...r.querySelectorAll(p.dove)] : [] } catch { nuovi = [] }
    const v = p && p.mano ? 'mano' : ''
    for (const e of accesi) if (!nuovi.includes(e)) e.removeAttribute('data-indicato')
    for (const e of nuovi) if (e.getAttribute('data-indicato') !== v) e.setAttribute('data-indicato', v)
    accesi = nuovi
  }
  // solo i nodi che entrano ed escono: gli attributi li scrive accendi() stessa
  const osserva = typeof MutationObserver === 'undefined' ? null : new MutationObserver(accendi)
  watch(radice, r => {
    osserva?.disconnect()
    if (r) osserva?.observe(r, { childList: true, subtree: true })
    nextTick(accendi)
  }, { immediate: true, flush: 'post' })
  watch(() => passo.value && passo.value.dove + (passo.value.mano ? ':mano' : ''), () => nextTick(accendi))
  onUnmounted(() => { osserva?.disconnect(); for (const e of accesi) e.removeAttribute('data-indicato') })
}

/* La guida che si richiama col `?` (docs/core/come-si-gioca.md): accesa da sé al primo giro (`prima`) o dal `?`.
   `saltabile`: la ✕ anche sul primo giro (a scuola). `finita()` si chiama una volta per accensione, quando si spegne.
   Le mosse fatte (`segna`/`fatto`) contano da quando è accesa, così richiamata a metà partita fa fare una mossa vera. */
export const FINE_MS = 7000

export function usaGuidaRichiamata({ prima = false, saltabile = false, finita = () => {} } = {}) {
  const accesa = ref(!!prima)
  const richiamata = ref(false)
  const fatti = reactive(new Set())
  const spegnibile = computed(() => accesa.value && (richiamata.value || saltabile))
  let orologio = 0

  function accendi() {
    clearTimeout(orologio)
    fatti.clear()
    richiamata.value = true
    accesa.value = true
  }
  function spegni() {
    clearTimeout(orologio)
    if (!accesa.value) return
    accesa.value = false
    finita()
  }
  const alterna = () => (accesa.value ? spegni() : accendi())
  const segna = mossa => { if (accesa.value) fatti.add(mossa) }
  const fatto = mossa => fatti.has(mossa)
  const daCapo = () => fatti.clear()   // una partita nuova: le mosse di quella prima non contano

  // l'anello e lo spegnersi da sola qualche secondo dopo il passo finale (`fine`)
  function segui(radice, passo) {
    usaGuida(radice, passo)
    watch(() => !!passo.value?.fine, f => {
      clearTimeout(orologio)
      if (f) orologio = setTimeout(spegni, FINE_MS)
    })
  }
  onUnmounted(() => clearTimeout(orologio))
  return { accesa, spegnibile, accendi, spegni, alterna, segna, fatto, daCapo, segui }
}
