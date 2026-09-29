// la bozza dell'età: la tacca la muove senza toccare il profilo, si scrive solo con «Applica» (vedi docs/genitori/manopola.md)
import { ref, computed, watch } from 'vue'
import { spostandoLEta } from '../../data/partenze.js'

// i quattro argomenti sono funzioni e non valori: il profilo che leggono può cambiare sotto (si applica, si cambia bambino)
export function usaBozzaEta ({ eta, giochi = () => ({}), sa = () => ({}),
                               ritocchi = () => ({}), min = 4, max = 12 }) {
  const bozza = ref(eta())

  watch(eta, a => { bozza.value = a })

  const mossa = computed(() => spostandoLEta({
    da: eta(), a: bozza.value ?? eta(),
    giochi: giochi() || {}, sa: sa() || {}, ritocchi: ritocchi() || {},
  }))

  // null è il primo avvio, dove un'età ancora non c'è
  const cambiata = computed(() =>
    bozza.value != null && eta() != null && bozza.value !== eta())

  function muovi (passo) {
    const ora = bozza.value == null ? min - passo : bozza.value
    const nuova = Math.round((ora + passo) * 2) / 2
    if (nuova < min || nuova > max) return
    bozza.value = nuova
  }

  const annulla = () => { bozza.value = eta() }

  return { bozza, mossa, cambiata, muovi, annulla }
}
