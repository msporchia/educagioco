<script setup>
// Il diario delle missioni: il riassunto sempre a portata di mano sulla terra di sopra (docs/sotterraneo/missioni.md).
// Quelle in mano (le fatte da consegnare in cima, poi le da fare, con chi aspetta), quelle che aspettano di essere prese, quelle
// già consegnate. Toccando una voce si apre il suo dettaglio, nella stessa finestra: chi te l'ha data, cosa ha detto,
// dove, cosa, il premio, a che punto sei. Da lì si sceglie quale missione indicano le freccine («segui questa») e si va
// da chi aspetta. Non scrive niente: dice `segui` e `vai` a chi lo usa (viste/Campagna.vue); si chiude con la ✕ o
// toccando fuori (`fuori`, col tocco: chi lo usa lo passa alla mappa, docs/core/interfaccia.md). `giu`: aperto in
// discesa, dove chi aspetta non c'è e «vai da …» non serve.
import { computed, ref, watch } from 'vue'
import Foglio from './Foglio.vue'
import Icona from './Icona.vue'
import Ritratto from './Ritratto.vue'
import { diario } from '../motore/missioni.js'
import { iconaDi } from '../dati/terra.js'

const props = defineProps({
  stati: { type: Object, default: () => ({}) },
  tappe: { type: Array, required: true },
  segui: { type: String, default: null },   // la missione che le freccine seguono, se ne è stata scelta una
  giu: { type: Boolean, default: false },
})
const emit = defineEmits(['chiudi', 'segui', 'vai', 'fuori'])

const d = computed(() => diario(props.stati, props.tappe, props.segui))

// il dettaglio: l'id della voce aperta (null = l'elenco). Si cerca fra tutte le voci a ogni giro, così se la voce
// cambia sotto (consegnata mentre il diario è aperto) il dettaglio la segue, e se sparisce si torna all'elenco
const aperta = ref(null)
const voce = computed(() => {
  if (!aperta.value) return null
  const tutte = [...d.value.pronte, ...d.value.daFare, ...d.value.offerte, ...d.value.consegnate]
  return tutte.find(v => v.id === aperta.value) || null
})
watch(voce, v => { if (aperta.value && !v) aperta.value = null })

// a che punto sei, a parole
const stato = v => (v.stato === 'fatta' ? `Fatta: torna ${v.daChi}`
  : v.stato === 'presa' ? 'Da fare'
  : v.stato === 'offerta' ? `${v.chi} ha un favore da chiederti`
  : 'Consegnata')
const fatto = v => v.stato === 'fatta' || v.stato === 'consegnata'
const nomeFigura = v => (v.cosa.sprite ? `${v.cosa.sprite}-fermo-0` : null)
// «vai da …» c'è per chi aspetta qualcosa da te: un favore da chiederti, o la consegna di una missione fatta
const puoiAndare = v => !props.giu && (v.stato === 'offerta' || v.stato === 'fatta')
const vaDa = v => emit('vai', v.da)
</script>

<template>
  <Foglio :em="voce ? '' : '📖'" :titolo="voce ? '' : 'Le tue missioni'" centro con-chiudi data-diario
          @click.self="$emit('fuori', $event)" @chiudi="$emit('chiudi')">

    <!-- ═══ il dettaglio di una missione ═══ -->
    <div v-if="voce" class="sot-dettaglio" data-dettaglio :data-missione="voce.id" :data-stato="voce.stato">
      <button class="sot-indietro" data-azione="indietro-diario" @click="aperta = null">‹ indietro</button>

      <h3 class="sot-dettaglio-titolo"><span class="em">{{ voce.em }}</span> {{ voce.titolo }}</h3>
      <p class="sot-dettaglio-stato" :class="'sot-stato-' + voce.stato" data-esito>{{ stato(voce) }}</p>

      <!-- chi te l'ha data, e quello che ha detto: con la voce sua -->
      <div class="sot-dettaglio-chi" data-dettaglio-chi :data-chi="voce.da">
        <span class="sot-dettaglio-ritratto"><Ritratto :chi="voce.da" :scala="3" /></span>
        <div>
          <b>{{ voce.chi }}</b>
          <p class="sot-dettaglio-detto" data-racconto>«{{ voce.dice }}»</p>
          <p v-if="voce.stato === 'consegnata'" class="sot-dettaglio-detto sot-grazie" data-grazie>«{{ voce.grazie }}»</p>
        </div>
      </div>

      <!-- dove: la discesa ritagliata dalla mappa, e il piano -->
      <div class="sot-dettaglio-riga" data-dettaglio-dove>
        <img v-if="iconaDi(voce.discesa)" class="sot-ritaglio" :src="iconaDi(voce.discesa)" alt="" data-ritaglio>
        <span class="sot-testo">
          <small>Dove</small>
          <b>{{ voce.dove }}</b>
          <i>piano {{ voce.piano }}</i>
        </span>
      </div>

      <!-- cosa: la cosa da trovare, o il mostro da battere -->
      <div class="sot-dettaglio-riga" data-dettaglio-cosa :data-tipo="voce.tipo">
        <span class="sot-dettaglio-icona"><Icona :sprite="nomeFigura(voce)" :em="voce.cosa.em" :scala="2" :emAlto="38" /></span>
        <span class="sot-testo">
          <small>{{ voce.tipo === 'trova' ? (fatto(voce) ? 'Trovata' : 'Da trovare') : (fatto(voce) ? 'Battuto' : 'Da battere') }}</small>
          <b>{{ voce.cosa.nome }}</b>
          <i v-if="!fatto(voce)">{{ voce.tipo === 'trova' ? 'in un forziere d\'oro' : 'il mostro con la corona' }}</i>
        </span>
      </div>

      <!-- il premio, pezzo per pezzo -->
      <div class="sot-dettaglio-riga" data-dettaglio-premio>
        <span class="sot-testo">
          <small>Premio</small>
          <span class="sot-premio-pezzi">
            <span v-if="voce.gemme" class="em" data-premio-gemme>💎 {{ voce.gemme }}</span>
            <span v-if="voce.regalo" class="sot-premio-roba" data-premio-roba>
              <Icona :sprite="voce.regalo.sprite" :em="voce.regalo.em" :emAlto="22" /> {{ voce.regalo.nome }}
            </span>
            <span v-if="voce.monete" class="em" data-premio-monete>🪙 {{ voce.monete }}</span>
          </span>
        </span>
      </div>

      <button v-if="voce.seguibile" class="sot-grosso" :class="{ 'sot-chiaro': voce.segui }" data-azione="segui"
              :data-segui-attivo="voce.segui ? 1 : null" @click="$emit('segui', voce.segui ? null : voce.id)">
        <template v-if="voce.segui"><span class="em">▸</span> la stai seguendo · smetti</template>
        <template v-else><span class="em">▸</span> segui questa</template>
      </button>
      <button v-if="puoiAndare(voce)" class="sot-grosso" :class="{ 'sot-chiaro': voce.seguibile }" data-azione="vai-da"
              @click="vaDa(voce)">
        <span class="em">🚶</span> vai {{ voce.daChi }}
      </button>
    </div>

    <!-- ═══ l'elenco ═══ -->
    <template v-else>
      <!-- le fatte da riportare, in cima e in oro: è quello che qualcuno sta aspettando -->
      <section v-if="d.pronte.length" class="sot-diario-sezione sot-diario-pronte" data-sezione="da-consegnare">
        <h3>Da consegnare</h3>
        <ul>
          <li v-for="v in d.pronte" :key="v.id" :data-missione="v.id" :data-stato="v.stato" role="button" tabindex="0"
              @click="aperta = v.id" @keydown.enter="aperta = v.id">
            <img v-if="iconaDi(v.discesa)" class="sot-ritaglio" :src="iconaDi(v.discesa)" alt="" data-ritaglio>
            <span class="sot-testo">
              <b><span class="em">{{ v.em }}</span> {{ v.titolo }}</b>
              <i>{{ v.dove }}, piano {{ v.piano }}</i>
              <em class="sot-fatta" data-esito>{{ v.torna }}</em>
            </span>
            <span class="sot-diario-premio em">{{ v.premio }}</span>
          </li>
        </ul>
      </section>

      <section v-if="d.daFare.length" class="sot-diario-sezione" data-sezione="da-fare">
        <h3>Da fare</h3>
        <ul>
          <li v-for="v in d.daFare" :key="v.id" :data-missione="v.id" :data-stato="v.stato" :data-segui="v.segui ? 1 : null"
              role="button" tabindex="0" @click="aperta = v.id" @keydown.enter="aperta = v.id">
            <img v-if="iconaDi(v.discesa)" class="sot-ritaglio" :src="iconaDi(v.discesa)" alt="" data-ritaglio>
            <span class="sot-testo">
              <b><span class="em">{{ v.em }}</span> {{ v.titolo }}</b>
              <i>{{ v.dove }}, piano {{ v.piano }} · {{ v.chi.toLowerCase() }}</i>
              <em data-esito>da fare<template v-if="v.segui"> · la segui</template></em>
            </span>
            <span class="sot-diario-premio em">{{ v.premio }}</span>
          </li>
        </ul>
      </section>

      <section v-if="d.offerte.length" class="sot-diario-sezione" data-sezione="ti-aspettano">
        <h3>Ti aspettano</h3>
        <ul>
          <li v-for="v in d.offerte" :key="v.id" :data-missione="v.id" data-stato="offerta"
              role="button" tabindex="0" @click="aperta = v.id" @keydown.enter="aperta = v.id">
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
          <li v-for="v in d.consegnate" :key="v.id" :data-missione="v.id" data-stato="consegnata"
              role="button" tabindex="0" @click="aperta = v.id" @keydown.enter="aperta = v.id">
            <span class="em">✅</span> {{ v.titolo }}
          </li>
        </ul>
      </section>
    </template>
  </Foglio>
</template>
