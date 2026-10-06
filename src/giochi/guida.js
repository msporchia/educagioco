// La guida del primo giro, una per tutti i giochi: vedi docs/core/guida.md.
// Il gioco dice cosa toccare con un selettore (`passo.dove`, di solito il
// bersaglio dei test), qui lo si accende con `data-indicato`: l'anello sta
// in style.css, la riga col 👇 in Guida.vue. `passo.mano` aggiunge la manina
// 👆, per i giochi di chi non legge ancora.
import { watch, onUnmounted, nextTick } from 'vue'

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
