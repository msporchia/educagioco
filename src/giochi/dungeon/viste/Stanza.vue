<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA STANZA — quello che c'è dietro la porta

   Due sole schermate, perché nel dungeon succedono due sole cose: o
   c'è qualcuno che chiede di rispondere (`che: 'sfida'`) o c'è
   qualcosa da decidere (`che: 'scelte'`). Il fuoco, il mercante e le
   stranezze sono la stessa schermata con altre voci — se avessero tre
   file diversi, il giorno che si sposta un bottone lo si sposta in tre
   posti e in due si dimentica.

   La domanda **non sta qui**: la mette in scena `Gioco.vue`, che è
   l'unico a sapere che esistono i quiz. Qui c'è il mostro che aspetta,
   la sua vita che scende, e i cartelli che dicono com'è andata.

   ── COSA SI LEGGE DI UNO SCONTRO, E PERCHÉ ──
   Da quando i mostri hanno vita, attacco e difesa, la barra da sola
   non basta: «ventiquattro su trentaquattro» non dice a un bambino se
   conviene insistere. Quello che decide è **«ancora quanti colpi»**, e
   quindi è il numero grosso. La barra sta dietro come sfondo, i due
   numeri del mostro (⚔️ e 🛡️) stanno piccoli sotto il nome, e la riga
   di sotto dice quanto gli togli tu — che è l'unica cosa che cambia
   quando trovi una spada, cioè l'unico posto in cui il bottino si
   *vede* lavorare.

   Non tocca il profilo, non chiama il motore: riceve quello che deve
   mostrare e manda fuori quello che il dito ha fatto.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'

const props = defineProps({
  stanza: { type: Object, required: true },
  /* com'è messo l'eroe adesso: serve per dire quanto gli toglie, che è
     una sottrazione fra due numeri che stanno in due posti diversi */
  eroe: { type: Object, default: () => ({ attacco: 0, difesa: 0 }) },
  /* solo per l'animazione del colpo: cambia, e il mostro trema */
  scosso: { type: Number, default: 0 },
  /* c'è una domanda in scena: l'arena si stringe in cima e gli lascia
     il posto, invece di restarci sotto nascosta */
  stretta: { type: Boolean, default: false },
})
defineEmits(['scegli', 'continua', 'scappa', 'avanti'])

const mostro = computed(() => props.stanza.mostro || null)
const quanto = computed(() =>
  mostro.value ? Math.max(1, props.eroe.attacco - mostro.value.difesa) : 0)
const ancora = computed(() =>
  mostro.value ? Math.max(1, Math.ceil(mostro.value.vita / quanto.value)) : 0)
const pieno = computed(() =>
  mostro.value ? Math.max(0, mostro.value.vita) / Math.max(1, mostro.value.vitaMax) : 0)
</script>

<template>
  <div class="dng-stanzone" :class="{ 'dng-stretta': stretta }"
       :style="{ '--dng-accento': stanza.colore }">
    <!-- ═══ chi ti aspetta ═══ -->
    <div class="dng-arena">
      <div class="dng-bestia em" :class="{ 'dng-colpita': scosso }" :key="scosso">
        {{ stanza.che === 'sfida' ? stanza.faccia : stanza.em }}
      </div>
      <h2 class="dng-titolone">{{ stanza.che === 'sfida' ? stanza.nome : stanza.tit }}</h2>

      <!-- Uno scrigno non si combatte: niente barra da consumare e
           niente numeri da confrontare, perché non c'è nessuno dentro.
           Una domanda sola, e o si apre o resta chiuso: quello che si
           rischia è il tesoro, non la pelle, e va detto prima. -->
      <p v-if="stanza.che === 'sfida' && stanza.sfuma" class="dng-serratura">
        <b>Una domanda sola.</b> Se la sbagli, resta chiuso per sempre.
      </p>

      <template v-else-if="stanza.che === 'sfida' && mostro">
        <!-- i due numeri di chi hai davanti: piccoli, ma è da questi
             che si capisce se serve la spada o l'armatura -->
        <div class="dng-ossa">
          <span>⚔️ {{ mostro.attacco }}</span>
          <span>🛡️ {{ mostro.difesa }}</span>
        </div>
        <div class="dng-barra" :aria-label="`vita ${mostro.vita} su ${mostro.vitaMax}`">
          <i :style="{ width: pieno * 100 + '%' }"></i>
          <b>{{ mostro.vita }}</b>
        </div>
        <!-- la riga che fa vedere il bottino al lavoro -->
        <p class="dng-scambi">
          gli togli <b>{{ quanto }}</b> a colpo — ancora
          <b>{{ ancora }}</b> {{ ancora === 1 ? 'colpo' : 'colpi' }}
        </p>
      </template>
      <p v-else class="dng-racconto">{{ stanza.testo }}</p>

      <!-- l'attesa fra un colpo e l'altro: sparisce appena la domanda
           è in scena, o resterebbe a dire «preparati» a cose fatte -->
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
          <!-- «al posto di»: la casella è una sola, e lasciare quello
               che si ha è metà della decisione. Va detto prima del
               tocco, che è l'unico momento in cui serve saperlo. -->
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
