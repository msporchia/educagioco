<script setup>
// un blocco del quadro dell'età: titolo, quanti, cosa vuol dire, l'assaggio, apribile in ogni punto (forma unica: vedi docs/genitori/quadro.md). Non sa niente di età/saperi/domande: riceve parole e uno slot.
defineProps({
  titolo: { type: String, required: true },
  conta: { type: String, default: '' }, // quanti sono, già scritto: «5», «3 su 14», «nessuna»
  spiega: { type: String, default: '' },
  assaggio: { type: String, default: '' }, // da chiuso, se non si passa lo slot `chiuso`
  aperto: { type: Boolean, default: false },
  apribile: { type: Boolean, default: true }, // un blocco vuoto non si apre, e si vede
  allarme: { type: Object, default: null }, // { conta, frase }: risale da vannoMale di data/quadro.js
})
defineEmits(['apri'])
</script>

<template>
  <div class="voce" :class="{ apribile, aperta: aperto, muta: !apribile }"
       :role="apribile ? 'button' : null" :tabindex="apribile ? 0 : null"
       @click="apribile && $emit('apri')" @keydown.enter="apribile && $emit('apri')">
    <span class="tit">
      <span>{{ titolo }}</span>
      <b v-if="conta">{{ conta }}</b>
      <b v-if="allarme" class="male" data-va-male>{{ allarme.conta }}</b>
      <em v-if="apribile">{{ aperto ? '▴' : '▾' }}</em>
    </span>
    <i v-if="spiega" class="spiega">{{ spiega }}</i>

    <template v-if="!aperto">
      <!-- prima dell'assaggio: dice cosa non funziona adesso, non cosa c'è sempre -->
      <b v-if="allarme" class="frase male" data-male-frase>{{ allarme.frase }}</b>
      <slot name="chiuso">
        <b v-if="assaggio" class="frase">{{ assaggio }}</b>
      </slot>
    </template>
    <slot v-else />
  </div>
</template>

<style scoped>
.voce { display:flex; flex-direction:column; gap:3px; background:#fff; border-radius:var(--raggio);
        padding:9px 12px; box-shadow:0 2px 8px #0000000d }
.tit { display:flex; align-items:baseline; gap:7px;
       font-size:11px; text-transform:uppercase; letter-spacing:.4px; color:var(--grigio);
       font-weight:600 }
.tit > span:first-child { flex:1 }
.tit > b { font-size:13px; font-weight:600; color:var(--inchiostro);
           text-transform:none; letter-spacing:0 }
.tit > em { font-style:normal; font-size:13px; font-weight:600; color:var(--accento) }
.tit > b.male { color:#8c2f2f; background:#ffdede; padding:1px 7px; border-radius:var(--raggio-piccolo);
                font-size:11px }

.frase { font-size:13.5px; font-weight:600; line-height:1.4 }
.frase.male { color:#8c2f2f; font-size:12.5px; font-weight:600 }
.spiega { font-style:normal; font-size:11px; color:var(--grigio); line-height:1.3; margin:-1px 0 3px }

/* si tocca tutto il riquadro, non solo il titolo: su un telefono è l'unico bersaglio comodo */
.voce.apribile { cursor:pointer; -webkit-tap-highlight-color:transparent }
.voce.apribile:active { transform:scale(.995) }
.voce.apribile.aperta { box-shadow:0 2px 10px #0000001a, inset 0 0 0 2px var(--tessera) }

.voce.muta { background:var(--tessera); box-shadow:none; border:1px dashed #e4e0ee }
.voce.muta .tit > b { color:var(--grigio) } /* quello che non si apre si vede che non si apre */
.voce.muta .frase { color:#6a6a7a; font-weight:600 }
</style>
