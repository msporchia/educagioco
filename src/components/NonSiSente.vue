<script setup>
/* Il tasto di chi non può (o non vuole) ascoltare: sta sotto ogni domanda che
   dipende dalla voce. Due strade, e il gioco non decide per lui:
   - «non si sente»: scrive un rigo nel registro (audio-log.js) e riprova;
   - «continua senza audio»: spegne il suono del profilo e il gioco cambia
     domanda (le domande in ascolto non escono più). Vedi docs/lingue/voce.md. */
import { ref } from 'vue'
import { accendiSuono } from '../store/profile.js'
import { segnala, nota } from '../audio-log.js'

const props = defineProps({ lingua: { type: String, default: 'en' } })
const emit = defineEmits(['riprova', 'senza'])

const aperto = ref(false)
const riprovato = ref(false)

function nonSiSente () {
  nota('tasto', 'premuto «non si sente»')
  segnala('tasto', 'voce:' + props.lingua, 'premuto «non si sente»')
  riprovato.value = true
  emit('riprova')
}
function senzaAudio () {
  nota('scelta', 'continua senza audio')
  accendiSuono(false)
  aperto.value = false
  riprovato.value = false
  emit('senza')
}
</script>

<template>
  <div class="non-si-sente" data-non-si-sente>
    <button v-if="!aperto" type="button" class="nss-apri" data-azione="non-si-sente"
            @click="aperto = true">🔇 non posso ascoltare</button>
    <div v-else class="nss-pannello">
      <button type="button" class="nss-tasto" data-azione="nss-riprova" @click="nonSiSente">
        🔁 {{ riprovato ? 'Ancora niente: riprova' : 'Non si sente: riprova' }}</button>
      <button type="button" class="nss-tasto nss-senza" data-azione="nss-senza" @click="senzaAudio">
        🔇 Continua senza audio</button>
      <button type="button" class="nss-chiudi" aria-label="chiudi" @click="aperto = false">✕</button>
    </div>
  </div>
</template>

<style scoped>
.non-si-sente { display:flex; justify-content:center; margin:8px 0 0 }
.nss-apri { font:inherit; font-size:12.5px; font-weight:800; color:var(--tenue, #6b6480);
            background:#ffffffaa; border:1px dashed #00000030; border-radius:999px; padding:5px 12px }
.nss-pannello { position:relative; display:flex; flex-wrap:wrap; gap:8px; justify-content:center;
                padding:10px 34px 10px 10px; background:#ffffffee; border-radius:16px;
                box-shadow:0 3px 0 #d4dce6 }
.nss-tasto { font:inherit; font-size:14px; font-weight:800; padding:9px 14px; border:none;
             border-radius:12px; color:#4b3f72; background:#eef1fb; box-shadow:0 3px 0 #d4dce6 }
.nss-senza { background:linear-gradient(180deg,#ffd166,#f4a261); color:#5a3200; box-shadow:0 3px 0 #c9803f }
.nss-chiudi { position:absolute; top:4px; right:4px; width:28px; height:28px; border:none;
              border-radius:50%; background:#00000012; font-size:13px; font-weight:900 }
</style>
