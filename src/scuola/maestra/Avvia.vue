<script setup>
// Avvia: si sceglie la classe, il servizio dà il codice, la lezione in corso entra subito nel quaderno
import { ref, computed } from 'vue'
import { quaderno } from './stato.js'
import { avvia } from './diretta.js'
import { MAX_ALUNNI, lezioneValida } from './quaderno.js'
import { comeSiSvolge, seHaiFinito } from './utili.js'

const props = defineProps({ lezione: { type: Object, required: true } })
const emit = defineEmits(['vai', 'indietro'])
const classe = ref(quaderno.classi.length === 1 ? quaderno.classi[0].id : null)
const attesa = ref(false)
const errore = ref('')
const scelta = computed(() => quaderno.classi.find(c => c.id === classe.value) || null)
const problema = computed(() => {
  if (!lezioneValida(props.lezione)) return 'Questa lezione non si può avviare: aprila e sistemala.'
  if (quaderno.inCorso) return 'C\'è già una lezione in corso: chiudila prima.'
  if (!scelta.value) return ''
  if (!scelta.value.alunni.length) return 'Questa classe non ha alunni: scrivili prima.'
  if (scelta.value.alunni.length > MAX_ALUNNI) return `Al massimo ${MAX_ALUNNI} alunni per lezione.`
  return ''
})

async function parti() {
  if (!scelta.value || problema.value || attesa.value) return
  attesa.value = true
  errore.value = ''
  try {
    await avvia(JSON.parse(JSON.stringify(props.lezione)), JSON.parse(JSON.stringify(scelta.value)))
    emit('vai', 'diretta', {}, { al_posto: true })
  } catch (e) {
    errore.value = `Non è partita: ${e.message}.`
  } finally { attesa.value = false }
}
</script>

<template>
  <section class="carta" data-avvia>
    <h1>{{ lezione.nome }}</h1>
    <p>{{ comeSiSvolge(lezione) }}</p>
    <p class="nota">{{ seHaiFinito(lezione) }}</p>
  </section>
  <section class="carta">
    <h2>Con quale classe?</h2>
    <p v-if="!quaderno.classi.length" class="nota">Nel quaderno non c'è ancora nessuna classe.</p>
    <div class="fila">
      <button v-for="c in quaderno.classi" :key="c.id" class="tessera" :class="{ scelta: classe === c.id }" :aria-pressed="classe === c.id"
              :data-classe="c.id" @click="classe = c.id">{{ c.nome || 'Senza nome' }} <span class="nota">· {{ c.alunni.length }}</span></button>
    </div>
    <div v-if="!quaderno.classi.length" class="fila">
      <button class="bottone chiaro" data-azione="nuova-classe" @click="emit('vai', 'classe', { id: null })">Crea una classe</button>
    </div>
    <p v-if="problema" class="avviso" data-problema>{{ problema }}</p>
    <p v-if="errore" class="avviso" data-errore>{{ errore }}</p>
    <div class="fila">
      <button class="bottone" :disabled="!scelta || !!problema || attesa" data-azione="avvia-lezione" @click="parti">
        {{ attesa ? 'Mi collego…' : 'Avvia la lezione' }}</button>
    </div>
    <p class="nota">Dopo l'avvio i bambini entrano con un codice; le domande partono quando premi «Via».</p>
  </section>
</template>
