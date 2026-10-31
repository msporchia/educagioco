// Fare amicizia col codice breve (docs/core/amici.md, «Come ci si abbina»): «Invita un amico» crea la chiave e il codice da dare,
// «Ho un codice» riscatta quello ricevuto. Lo usano la carta dei grandi (CartaAmici.vue) e «Aggiungi un amico» (AggiungiAmico.vue).
import { ref, computed } from 'vue'
import { dati, aggiungi, casuale, MAX_AMICI } from '../store/amici.js'
import { creaCodice, riscattaCodice } from './rete.js'
import { aggiungiPonte } from './servizio.js'

export function usaAbbina() {
  const codice = ref(null)            // { testo, scade } mentre se ne mostra uno
  const scritto = ref('')
  const messaggio = ref('')
  const occupato = ref(false)
  const fatto = ref(false)            // un codice ricevuto è andato a buon fine
  const pieno = computed(() => dati.amici.length >= MAX_AMICI)
  const pulito = computed(() => scritto.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5))
  const scadeTra = computed(() => (codice.value ? Math.max(1, Math.round((codice.value.scade - Date.now()) / 3600000)) : 0))

  async function invita() {
    messaggio.value = ''; occupato.value = true
    try {
      const chiave = casuale(32)
      const c = await creaCodice(chiave)
      if (!aggiungi(chiave)) throw new Error('hai già tutti gli amici che si possono avere')
      codice.value = { testo: c.codice, scade: c.scade }
      aggiungiPonte(chiave)
    } catch (e) { messaggio.value = e.message } finally { occupato.value = false }
  }

  async function riscatta() {
    messaggio.value = ''; occupato.value = true
    try {
      const chiave = await riscattaCodice(pulito.value)
      if (!aggiungi(chiave)) throw new Error('questo amico c\'è già, o hai già tutti gli amici che si possono avere')
      scritto.value = ''
      aggiungiPonte(chiave)
      fatto.value = true
      messaggio.value = 'Fatto. Il nome dell\'amico comparirà appena i due telefoni sono accesi insieme.'
    } catch (e) { messaggio.value = e.message } finally { occupato.value = false }
  }

  /* il codice al genitore dell'amico: la condivisione del telefono, o copiato dove non c'è */
  async function manda(chi) {
    const testo = `Il codice per giocare con ${chi} su Educagioco: ${codice.value.testo} (vale ${scadeTra.value} ore)`
    try { if (navigator.share) return await navigator.share({ text: testo }); await navigator.clipboard.writeText(testo); messaggio.value = 'Copiato.' } catch { /* annullato */ }
  }

  const azzera = () => { codice.value = null; scritto.value = ''; messaggio.value = ''; fatto.value = false }

  return { codice, scritto, messaggio, occupato, fatto, pieno, pulito, scadeTra, invita, riscatta, manda, azzera }
}
