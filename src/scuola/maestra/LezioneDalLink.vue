<script setup>
// Una lezione arrivata da un link (#lezione=…): si guarda, si aggiunge al quaderno o si avvia
import { ref, computed } from 'vue'
import { quaderno, salva, lezioneDi } from './stato.js'
import * as Q from './quaderno.js'
import { paginaMaestra, copia, comeSiSvolge, seHaiFinito } from './utili.js'

const props = defineProps({ lezione: { type: Object, required: true } })
const emit = defineEmits(['vai', 'indietro'])
const giaDentro = computed(() => !!lezioneDi(props.lezione.id))
const aggiunta = ref(false)
const copiato = ref(false)
const daCopiare = ref('')

function aggiungi() {
  if (Q.salvaLezione(quaderno, props.lezione)) { salva(['lezioni']); aggiunta.value = true }
}
async function copiaLink() {
  const link = Q.linkDellaLezione(props.lezione, paginaMaestra())
  if (await copia(link)) { copiato.value = true; daCopiare.value = '' } else daCopiare.value = link
}
</script>

<template>
  <section class="carta" data-lezione-dal-link>
    <h1>{{ lezione.nome }}</h1>
    <p>{{ comeSiSvolge(lezione) }}</p>
    <p class="nota">{{ seHaiFinito(lezione) }}</p>
    <p v-if="aggiunta" class="bene" data-esito="aggiunta">È nel quaderno, fra le lezioni.</p>
    <p v-else-if="giaDentro" class="nota">Nel quaderno c'è già questa lezione: aggiungendola la sostituisci con quella del link.</p>
    <div class="fila">
      <button class="bottone" :disabled="aggiunta" data-azione="aggiungi-al-quaderno" @click="aggiungi">Aggiungi al quaderno</button>
      <button class="bottone chiaro" :disabled="!!quaderno.inCorso" data-azione="avvia" @click="emit('vai', 'avvia', { lezione })">Avvia</button>
      <button class="bottone chiaro" data-azione="copia-link" @click="copiaLink">{{ copiato ? 'Link copiato' : 'Copia il link' }}</button>
    </div>
    <label v-if="daCopiare">Il browser non lascia copiare: seleziona il link e copialo a mano
      <input class="campo" readonly :value="daCopiare" data-link-lezione @focus="$event.target.select()">
    </label>
    <p v-if="quaderno.inCorso" class="nota">C'è già una lezione in corso: chiudila per avviarne un'altra.</p>
  </section>
</template>
