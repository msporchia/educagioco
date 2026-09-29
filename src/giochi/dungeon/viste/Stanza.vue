<script setup>
// La stanza: due sole schermate (sfida o scelte — fuoco/mercante/stranezze
// sono la stessa schermata con altre voci, così un bottone si sposta in un
// posto solo). La domanda non sta qui: la mette in scena Gioco.vue. Quello
// che decide se insistere è "ancora quanti colpi" (il numero grosso), non la
// barra da sola: i due numeri del mostro stanno piccoli sotto il nome.
import { computed, ref, watch, onUnmounted } from 'vue'
import Bestia from './Bestia.vue'

const props = defineProps({
  stanza: { type: Object, required: true },
  eroe: { type: Object, default: () => ({ attacco: 0, difesa: 0 }) },
  scosso: { type: Number, default: 0 },   // sale a ogni colpo, e il mostro trema
  stretta: { type: Boolean, default: false },   // c'è una domanda in scena: l'arena si stringe
})
defineEmits(['scegli', 'continua', 'scappa', 'avanti'])

const mostro = computed(() => props.stanza.mostro || null)
const quanto = computed(() =>
  mostro.value ? Math.max(1, props.eroe.attacco - mostro.value.difesa) : 0)
const ancora = computed(() =>
  mostro.value ? Math.max(1, Math.ceil(mostro.value.vita / quanto.value)) : 0)
const pieno = computed(() =>
  mostro.value ? Math.max(0, mostro.value.vita) / Math.max(1, mostro.value.vitaMax) : 0)

// la stazza (quanto è grosso) la decide il tipo di stanza, non le ossa:
// chi disegna non sa cosa sia un punto di vita
const stazza = computed(() =>
  props.stanza.che === 'sfida' ? 'dng-s-' + (props.stanza.tipo || 'mostro') : '')

// se la stanza ha una taglia di mostro c'è qualcuno (disegnato), se no c'è
// qualcosa (emoji): disegnare a mano uno scrigno sarebbe lavoro sprecato
const viva = computed(() =>
  props.stanza.che === 'sfida' && props.stanza.taglia && props.stanza.taglia !== 'serratura')

// `scosso` è un contatore che sale (non un interruttore): su una tela non si
// può ripartire un'animazione CSS cambiando chiave, si spegne a tempo
const botta = ref(false)
let spegni = 0
watch(() => props.scosso, () => {
  botta.value = true
  clearTimeout(spegni)
  spegni = setTimeout(() => { botta.value = false }, 340)
})
onUnmounted(() => clearTimeout(spegni))

const comeSta = computed(() => {
  if (!mostro.value) return 'normale'
  if (mostro.value.vita <= 0) return 'ko'
  return botta.value ? 'colpito' : 'normale'
})
</script>

<template>
  <div class="dng-stanzone" :class="{ 'dng-stretta': stretta }"
       :style="{ '--dng-accento': stanza.colore }">
    <!-- ═══ chi ti aspetta ═══ -->
    <div class="dng-arena">
      <!-- chi ti aspetta è disegnato; le cose restano emoji -->
      <Bestia v-if="viva" :chi="stanza.faccia" :tipo="stanza.tipo" :stato="comeSta"
              class="dng-viva" :class="stazza" />
      <div v-else class="dng-bestia em" :class="[stazza, { 'dng-colpita': scosso }]" :key="scosso">
        {{ stanza.che === 'sfida' ? stanza.faccia : stanza.em }}
      </div>
      <h2 class="dng-titolone">{{ stanza.che === 'sfida' ? stanza.nome : stanza.tit }}</h2>

      <!-- uno scrigno non si combatte: una domanda sola, si rischia il tesoro non la pelle -->
      <p v-if="stanza.che === 'sfida' && stanza.sfuma" class="dng-serratura">
        <b>Una domanda sola.</b> Se la sbagli, resta chiuso per sempre.
      </p>

      <template v-else-if="stanza.che === 'sfida' && mostro">
        <div class="dng-ossa">
          <span>⚔️ {{ mostro.attacco }}</span>
          <span>🛡️ {{ mostro.difesa }}</span>
        </div>
        <div class="dng-barra" :aria-label="`vita ${mostro.vita} su ${mostro.vitaMax}`">
          <i :style="{ width: pieno * 100 + '%' }"></i>
          <b>{{ mostro.vita }}</b>
        </div>
        <p class="dng-scambi">
          gli togli <b>{{ quanto }}</b> a colpo — ancora
          <b>{{ ancora }}</b> {{ ancora === 1 ? 'colpo' : 'colpi' }}
        </p>
      </template>
      <p v-else class="dng-racconto">{{ stanza.testo }}</p>

      <!-- sparisce appena la domanda è in scena, o direbbe "preparati" a cose fatte -->
      <p v-if="stanza.che === 'sfida' && stanza.momento === 'domanda' && !stretta"
         class="dng-attesa">
        {{ stanza.sfuma ? 'gira la chiave…' : 'preparati…' }}
      </p>
    </div>

    <!-- ═══ le cose da decidere ═══ -->
    <div v-if="stanza.che === 'scelte' && !stanza.esito" class="dng-voci">
      <button v-for="v in stanza.voci" :key="v.chiave" class="dng-voce"
              :data-voce="v.chiave" :disabled="v.spento" @click="$emit('scegli', v.chiave)">
        <span class="dng-em em">{{ v.em }}</span>
        <span class="dng-testo">
          <b>{{ v.nome }}</b>
          <i>{{ v.desc }}</i>
          <!-- detto prima del tocco: la casella è una sola, lasciare quello che si ha è metà della decisione -->
          <em v-if="v.invece" class="dng-invece">al posto di {{ v.invece }}</em>
        </span>
        <span v-if="v.prezzo" class="dng-prezzo">💎 {{ v.prezzo }}</span>
        <span v-else-if="v.azzardo" class="dng-prezzo dng-forse">⚠️</span>
      </button>
    </div>

    <!-- ═══ le prendi: si insiste o si scappa ═══ -->
    <div v-if="stanza.che === 'sfida' && stanza.momento === 'colpito'" class="dng-cartello">
      <div class="dng-em em">{{ stanza.colpito.em }}</div>
      <h3>{{ stanza.colpito.tit }}</h3>
      <p>{{ stanza.colpito.testo }}</p>
      <button class="dng-grosso" @click="$emit('continua')">
        <span class="em">⚔️</span> ci riprovo
      </button>
      <button v-if="stanza.scappabile" class="dng-grosso dng-chiaro" @click="$emit('scappa')">
        <span class="em">🏃</span> scappo via
      </button>
    </div>

    <!-- ═══ com'è andata ═══ -->
    <div v-else-if="stanza.esito" class="dng-cartello">
      <div class="dng-em em">{{ stanza.esito.em }}</div>
      <h3>{{ stanza.esito.tit }}</h3>
      <p>{{ stanza.esito.testo }}</p>
      <p v-if="stanza.esito.coda" class="dng-coda">{{ stanza.esito.coda }}</p>
      <p v-if="stanza.esito.tesoro" class="dng-coda dng-bottino">
        {{ stanza.esito.tesoro.em }} <b>{{ stanza.esito.tesoro.nome }}</b>
      </p>
      <button class="dng-grosso" data-voce="avanti" @click="$emit('avanti')">
        <span class="em">🚪</span> avanti
      </button>
    </div>
  </div>
</template>
