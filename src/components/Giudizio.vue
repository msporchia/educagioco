<script setup>
/* I tre tasti per giudicare una domanda (vedi docs/genitori/come-va.md),
   visibili solo se i giudizi sono accesi. `voce` può essere una funzione
   perché i dati (tempo, esito) cambiano mentre la domanda è a schermo: un
   oggetto fissato al montaggio li fotograferebbe sempre a zero. */
import { ref } from 'vue'
import { giudiziAccesi, VERDETTI, annota } from '../store/giudizi.js'
import { nomeCorrente } from '../store/profile.js'

const props = defineProps({
  voce: { type: [Object, Function], default: () => ({}) },
})

// l'id di questa comparsa a schermo, non della domanda: due tocchi sulla stessa sono un ripensamento, non due giudizi
let contatore = 0
const id = `g${Date.now().toString(36)}-${contatore++}`

const dato = ref('')

function segna(v) {
  if (dato.value === v.id) return
  dato.value = v.id
  const base = typeof props.voce === 'function' ? props.voce() : props.voce
  annota({ id, verdetto: v.id, chi: nomeCorrente() || '', ...base })
}
</script>

<template>
  <div v-if="giudiziAccesi" class="giudizio" data-che="giudizio">
    <button v-for="v in VERDETTI" :key="v.id" type="button"
            class="gd-tasto" :class="{ dato: dato === v.id }"
            :data-verdetto="v.id" :aria-label="v.che" :title="v.che"
            @click.stop="segna(v)">{{ v.ico }}</button>
  </div>
</template>

<style scoped>
.giudizio { display: flex; gap: 4px; align-items: center; }
.gd-tasto {
  width: 26px; height: 26px; padding: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  border-radius: 9px; border: 1px solid rgba(255, 255, 255, .14);
  background: rgba(255, 255, 255, .06);
  font-size: 13px; line-height: 1;
  opacity: .45; filter: grayscale(1); /* quasi invisibili: chi li cerca li trova, chi gioca no */
  transition: opacity .12s ease, filter .12s ease, transform .1s ease;
}
.gd-tasto:active { transform: scale(.9); }
.gd-tasto.dato {
  opacity: 1; filter: none;
  background: rgba(255, 213, 138, .22); border-color: #ffd58a;
}
</style>
