<script setup>
// Il nome della fattoria: si scrive (o si lascia «La fattoria»). Vale per la propria e per ogni fattoria in comune, dove lo vedono
// tutti e due. ✕ in alto a destra. Vedi docs/fattoria3d/nome.md.
import { computed, ref } from 'vue'
import { pulisciNomeFattoria, NOME_FATTORIA_MAX } from '../motore/stato.js'
import '../stile-bestia.css'

const props = defineProps({ nome: { type: String, default: '' }, predefinito: { type: String, default: 'La fattoria' } })
const emit = defineEmits(['scegli', 'chiudi'])
const scritto = ref(props.nome)
const pronto = computed(() => pulisciNomeFattoria(scritto.value))
function conferma() { if (pronto.value) emit('scegli', pronto.value) }
</script>

<template>
  <div class="f3-velo" data-f3="nome-velo" @click.self="emit('chiudi')">
    <div class="f3-foglio f3-colonna f3-bes f3-bat" data-f3="nome-fattoria">
      <header class="f3-bes-asse"><span aria-hidden="true">🏡</span><h2>Come si chiama la fattoria?</h2></header>
      <button class="f3-chiudi f3-bes-x" data-chiudi aria-label="chiudi" @click="emit('chiudi')">✕</button>
      <div class="f3-corpo f3-bes-corpo">
        <form class="f3-bat-scrivi" @submit.prevent="conferma">
          <input v-model="scritto" data-f3="nome-scrivi" type="text" :maxlength="NOME_FATTORIA_MAX" autocomplete="off" autocapitalize="words" spellcheck="false"
                 enterkeyhint="done" placeholder="Scrivi il nome" aria-label="il nome della fattoria">
          <button type="submit" class="f3-bes-az" data-azione="scrivi" :disabled="!pronto">✔ Va bene</button>
        </form>
        <div class="f3-bes-azioni">
          <button type="button" class="f3-bes-az" data-azione="lascia" @click="emit('scegli', '')">Lascia «{{ predefinito }}»</button>
        </div>
      </div>
    </div>
  </div>
</template>
