<script setup>
// il cartello «Applica», appiccicato in basso perché prima non si vedeva (vedi docs/genitori/manopola.md); non sa niente di profili, riceve la mossa già calcolata ed emette
import { computed } from 'vue'
import { anniInLettere, perdeInParole } from './lettere.js'

const props = defineProps({
  anni: { type: Number, required: true },
  mossa: { type: Object, required: true }, // il verdetto di spostandoLEta: cosa riscrive e cosa porta via
})
defineEmits(['applica', 'annulla'])

const perde = computed(() => perdeInParole(props.mossa.perde || {}))

const inLettere = anniInLettere
</script>

<template>
  <div class="conferma" data-conferma="eta">
    <p class="che">
      <b>{{ inLettere(anni) }}</b>
      <template v-if="!mossa.riscrive">
        · si sposta solo la mira delle domande, i giochi restano come li hai messi
      </template>
      <template v-else-if="perde">
        · <span class="perde" data-perde>⚠️ tornano di partenza: {{ perde }}</span>
      </template>
      <template v-else>
        · cambia fascia: giochi e domande ripartono dai valori di quell'età
      </template>
    </p>
    <div class="tasti">
      <button type="button" class="bottone chiaro" data-azione="eta-annulla"
              @click="$emit('annulla')">Annulla</button>
      <button type="button" class="bottone" data-azione="eta-applica"
              @click="$emit('applica')">Applica</button>
    </div>
  </div>
</template>

<style scoped>
.conferma { position:sticky; bottom:0; z-index:5;
            display:flex; flex-direction:column; gap:8px;
            background:#fff; border-radius:16px; padding:10px 12px;
            box-shadow:0 -3px 14px #00000022, 0 0 0 2px #5b3fa833 }
.che { margin:0; font-size:12.5px; line-height:1.35; color:#4a4a5a; text-align:left }
.che b { font-size:14px; color:var(--viola-scuro, #3b2b6b) }
/* non .avviso: quella globale ha sfondo e max-width, qui diventava un riquadro che si accavallava */
.perde { color:#a33 }
.tasti { display:flex; gap:8px }
.tasti .bottone { flex:1; padding:12px 14px; font-size:16px; cursor:pointer;
                  border:none; font-family:inherit }
</style>
