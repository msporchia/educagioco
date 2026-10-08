<script setup>
// Il diario delle missioni: il riassunto sempre a portata di mano sulla terra di sopra (docs/sotterraneo/missioni.md).
// Quelle in mano (da fare, o fatte e da consegnare, con chi aspetta), quelle che aspettano di essere prese, quelle
// già consegnate. Non scrive niente: si legge e si chiude con la ✕.
import { computed } from 'vue'
import Foglio from './Foglio.vue'
import { diario } from '../motore/missioni.js'
import { iconaDi } from '../dati/terra.js'

const props = defineProps({
  stati: { type: Object, default: () => ({}) },
  tappe: { type: Array, required: true },
})
defineEmits(['chiudi'])

const d = computed(() => diario(props.stati, props.tappe))
</script>

<template>
  <Foglio em="📖" titolo="Le tue missioni" centro con-chiudi data-diario @chiudi="$emit('chiudi')">
    <section v-if="d.inMano.length" class="sot-diario-sezione" data-sezione="da-fare">
      <h3>Da fare</h3>
      <ul>
        <li v-for="v in d.inMano" :key="v.id" :data-missione="v.id" :data-stato="v.stato">
          <img v-if="iconaDi(v.discesa)" class="sot-ritaglio" :src="iconaDi(v.discesa)" alt="" data-ritaglio>
          <span class="sot-testo">
            <b><span class="em">{{ v.em }}</span> {{ v.titolo }}</b>
            <i>{{ v.dove }}, piano {{ v.piano }} · {{ v.chi.toLowerCase() }}</i>
            <em v-if="v.stato === 'fatta'" class="sot-fatta" data-esito>fatta: torna {{ v.tornaDa }}</em>
            <em v-else data-esito>da fare</em>
          </span>
          <span class="sot-diario-premio em">{{ v.premio }}</span>
        </li>
      </ul>
    </section>

    <section v-if="d.offerte.length" class="sot-diario-sezione" data-sezione="ti-aspettano">
      <h3>Ti aspettano</h3>
      <ul>
        <li v-for="v in d.offerte" :key="v.id" :data-missione="v.id" data-stato="offerta">
          <img v-if="iconaDi(v.discesa)" class="sot-ritaglio" :src="iconaDi(v.discesa)" alt="" data-ritaglio>
          <span class="sot-testo">
            <b><span class="em">{{ v.em }}</span> {{ v.titolo }}</b>
            <i>{{ v.dove }}, piano {{ v.piano }}</i>
            <em data-esito>{{ v.chi }} ha un favore da chiederti</em>
          </span>
          <span class="sot-diario-premio em">{{ v.premio }}</span>
        </li>
      </ul>
    </section>

    <p v-if="!d.inMano.length && !d.offerte.length" class="sot-diario-vuoto" data-diario-vuoto>
      Per ora nessuno ti chiede niente. Quando una discesa sarà finita, qualcuno al villaggio avrà un favore da chiederti.
    </p>
    <p v-else-if="d.nascoste" class="sot-diario-tetto" data-diario-tetto>
      Hai già {{ d.aperte }} missioni aperte: consegnane una e ne arrivano altre.
    </p>

    <section v-if="d.consegnate.length" class="sot-diario-sezione sot-diario-fatte" data-sezione="consegnate">
      <h3>Consegnate ({{ d.consegnate.length }})</h3>
      <ul>
        <li v-for="v in d.consegnate" :key="v.id" :data-missione="v.id" data-stato="consegnata">
          <span class="em">✔️</span> {{ v.titolo }}
        </li>
      </ul>
    </section>
  </Foglio>
</template>
