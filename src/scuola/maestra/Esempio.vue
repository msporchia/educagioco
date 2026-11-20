<script setup>
// Una domanda vera dell'esercizio, pescata come la pescherà il gioco, con la risposta che ci si aspetta: per capire cosa si
// chiede senza leggere i nomi dei gradini. «Un'altra» ne pesca una nuova. docs/scuola/quaderno.md
import { ref, computed } from 'vue'
import { valido, pescatore } from '../comune/esercizi.js'

const props = defineProps({ esercizio: { type: Object, required: true } })
const seme = ref(1)

const domanda = computed(() => {
  if (!valido(props.esercizio)) return null
  try { return pescatore(props.esercizio, seme.value).prossima().domanda } catch { return null }
})
// la risposta come la vede il bambino: il testo, il nome con l'emoji, o l'emoji sola; un disegno senza nome non si scrive
const detta = r => (r?.testo !== undefined ? String(r.testo) : [r?.emoji, r?.nome].filter(Boolean).join(' ') || '(una figura)')
const soggetto = computed(() => {
  const s = domanda.value?.soggetto
  if (!s) return ''
  return typeof s.testo === 'string' ? s.testo : [s.emoji, s.nome].filter(Boolean).join(' ')
})
</script>

<template>
  <div v-if="domanda" class="esempio" data-esempio>
    <div class="testa">
      <span class="titoletto">Per esempio</span>
      <button class="bottone chiaro piccolo" data-azione="altro-esempio" @click="seme++">Un'altra</button>
    </div>
    <p v-if="soggetto" class="soggetto">{{ soggetto }}</p>
    <p class="domanda">{{ domanda.testo }}</p>
    <div class="risposte">
      <span v-for="(r, i) in domanda.risposte || []" :key="i" class="risposta" :class="{ giusta: i === domanda.giusta }"
            :data-giusta="i === domanda.giusta ? '' : null">{{ detta(r) }}<b v-if="i === domanda.giusta"> ✓</b></span>
    </div>
  </div>
</template>

<style scoped>
.esempio { display:flex; flex-direction:column; gap:8px; padding:12px; border-radius:var(--raggio-piccolo); border:1px dashed var(--filo) }
.testa { display:flex; align-items:center; justify-content:space-between; gap:8px }
.titoletto { font-size:13px; font-weight:600; color:var(--grigio) }
.soggetto { font-size:15px; white-space:pre-line }
.domanda { font-size:17px; font-weight:600; white-space:pre-line }
.risposte { display:flex; flex-wrap:wrap; gap:6px }
.risposta { padding:6px 12px; border-radius:var(--raggio-piccolo); background:var(--tessera); font-size:15px }
.risposta.giusta { background:#dff3e4; color:#1f6b3a; font-weight:600 }
</style>
