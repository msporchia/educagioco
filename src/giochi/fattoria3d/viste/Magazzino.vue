<script setup>
// Il foglio di un magazzino (il silo del raccolto, quello della stalla, la dispensa): si apre toccandolo nella fattoria. Sopra quello che
// tiene, ogni merce col suo `n/max`; sotto il riquadro per avere più posto, detto in parole: cosa cambia («da 12 a 14 per tipo»), che
// l'edificio cresce, e una fila di tacche per quanto è già cresciuto ognuno. Quando sono tutti grandi al massimo propone di costruirne un
// altro accanto. Riceve una fotografia già pronta (viste/magazzino-puro.js). Vedi docs/fattoria3d/magazzini.md.
import Faccia from './Faccia.vue'
import '../stile-inventario.css'

defineProps({
  vista: { type: Object, required: true },        // vistaDelMagazzino()
  messaggio: { type: String, default: '' },
})
defineEmits(['ingrandisci', 'chiudi'])
</script>

<template>
  <div class="f3-foglio f3-colonna f3-inv f3-mag" data-f3="magazzino" :data-silo="vista.silo" :data-passo="vista.passo">
    <header class="f3-inv-asse"><span aria-hidden="true">{{ vista.emoji }}</span><h2>{{ vista.nome }}</h2></header>
    <button class="f3-chiudi f3-inv-x" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <div class="f3-corpo">
      <p v-if="!vista.merci.length" class="f3-inv-vuoto">Ancora vuoto.</p>
      <div class="f3-inv-griglia">
        <div v-for="(v, i) in vista.merci" :key="v.k" class="f3-inv-gettone" :class="{ velata: v.velata }" :data-merce="v.k" :data-n="v.n" :style="{ '--i': i }">
          <span class="f3-inv-faccia"><Faccia :k="v.k" :emoji="v.emoji" :lato="46" /><em class="f3-inv-n" :class="{ pieno: v.pieno }">{{ v.n }}/{{ v.max }}</em></span>
          <b>{{ v.nome }}</b>
        </div>
      </div>
    </div>
    <section class="f3-mag-piu" data-f3="magazzino-piu">
      <h3>{{ vista.titolo }}</h3>
      <p>{{ vista.testo }}</p>
      <div class="f3-mag-taglie" aria-hidden="true">
        <span v-for="(t, e) in vista.taglie" :key="e" class="f3-mag-edificio">
          <i v-for="k in vista.massimo" :key="k" :class="{ fatta: k <= t }"></i>
        </span>
      </div>
      <button v-if="vista.tasto" type="button" class="f3-mag-tasto" :class="{ povero: !vista.puoi }" data-f3="magazzino-ingrandisci" @click="$emit('ingrandisci')">{{ vista.tasto }}</button>
      <p v-if="messaggio" class="f3-mag-msg" data-f3="magazzino-msg">{{ messaggio }}</p>
    </section>
  </div>
</template>
