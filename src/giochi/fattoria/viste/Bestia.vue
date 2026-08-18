<script setup>
/* ═══════════════════════════════════════════════════════════════════
   COME STA, E COSA POSSO FARE PER LUI

   Si tocca l'animale e si vede **come sta**: tre barrette e una riga che
   lo dice a parole. Prima qui si apriva la scelta del nome — sbagliato:
   il nome glielo si dà una volta, lo stato si guarda ogni volta.
   Rinominare è rimasto, ma è un tastino in fondo.

   La ciotola sta sotto, e **ogni cibo dice quanto costa prima che tu lo
   tocchi**: così scegliere fra i semini da 5 e la frutta da 14 è una
   scelta, non una sorpresa a cose fatte. È la stessa regola dei cartelli
   del prezzo sui pezzi di bosco.

   ── I CIBI CI SONO TUTTI, ANCHE I SUOI NO ─────────────────────────
   Nella ciotola compaiono **tutti** i cibi, non solo quelli che questa
   bestia mangia: quelli sbagliati sono lì spenti, con la loro faccia.
   Mostrare solo i giusti sarebbe più pulito e non insegnerebbe niente —
   che un gatto non mangi i semini si impara vedendo il semino accanto
   al pesce, non vedendo solo il pesce. La riga sopra la ciotola dice
   comunque qual è il suo, così nessuno resta a indovinare.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { BISOGNI, CHIAVI, CIBI, COCCOLE, comeSta, cibiPer, gradisce } from '../dati/bisogni.js'
import { famigliaDi } from '../dati/animali.js'
import Provino from './Provino.vue'

const props = defineProps({
  chi: { type: String, required: true },
  che: { type: String, default: '' },          // la razza, se non ha nome
  nome: { type: String, default: '' },
  stato: { type: Object, required: true },     // { pancia, pelo, gioco }
  monete: { type: Number, default: 0 },
  granaio: { type: Object, default: () => ({}) },  // per i cibi che si producono
})
const emit = defineEmits(['nutri', 'coccola', 'rinomina', 'chiudi'])

const pieno = k => (props.stato[k] ?? 0) > 0.93
/* Nella riga «gli piace…» stanno solo i cibi **suoi**: il mangime del
   mulino va bene per tutti, e infilarlo lì allungherebbe la frase senza
   dire niente su questa bestia — che è l'unica cosa che quella riga
   serve a dire. */
const suoi = computed(() => cibiPer(famigliaDi(props.chi)).filter(c => !c.da))
const gliPiace = cibo => gradisce(cibo, famigliaDi(props.chi))

/* Un cibo si paga in monete **o** si scala dal granaio (`dati/bisogni.js`),
   e la ciotola mostra la cosa giusta per ognuno dei due: un prezzo per
   quello che si compra, la scorta per quello che si è prodotto. Mostrare
   «🪙0» sul mangime lo farebbe sembrare gratis, che è la metà della
   verità — è costato un campo e un quarto d'ora. */
const quantiNe = prodotto => props.granaio[prodotto] || 0
const quanti = cibo => (cibo.da ? quantiNe(cibo.da) : 0)
const puoDarlo = cibo => gliPiace(cibo) && !pieno('pancia') &&
  (cibo.da ? quanti(cibo) > 0 : cibo.prezzo <= props.monete)

/* Una coccola si paga come un cibo — monete **o** roba del granaio — e
   la copertina di lana è la prima delle seconde. Un tasto spento perché
   non hai lana non deve somigliare a uno spento perché il pelo è già a
   posto: il primo mostra `×0`, il secondo mostra il suo prezzo di
   sempre e si riaccende da solo col tempo. */
const puoFarla = g => !pieno(g.bisogno) &&
  (g.da ? quantiNe(g.da) > 0 : (g.prezzo || 0) <= props.monete)
</script>

<template>
  <div class="fa-foglio">
    <h2>{{ nome || che }}</h2>
    <Provino :pezzo="chi + '_giu0'" :lato="64" />
    <p>{{ comeSta(stato, nome || che) }}</p>

    <div class="fa-bisogni">
      <div v-for="k in CHIAVI" :key="k" class="fa-bisogno">
        <span>{{ BISOGNI[k].icona }}</span>
        <span class="fa-livello">
          <i :style="{ width: Math.round(stato[k] * 100) + '%', background: BISOGNI[k].colore }"></i>
        </span>
        <em>{{ Math.round(stato[k] * 100) }}%</em>
      </div>
    </div>

    <span class="fa-etichetta">La ciotola · gli piace
      {{ suoi.map(c => c.emoji + ' ' + c.nome.toLowerCase()).join(' e ') }}</span>
    <div class="fa-nomi">
      <button v-for="c in CIBI" :key="c.id"
              :class="['fa-cibo', { suo: gliPiace(c), altrui: !gliPiace(c) }]"
              :disabled="!puoDarlo(c)"
              @click="emit('nutri', c)">
        <b>{{ c.emoji }}</b>
        <span>{{ c.nome }}</span>
        <em v-if="!gliPiace(c)">no</em>
        <em v-else-if="c.da">×{{ quanti(c) }}</em>
        <em v-else>🪙{{ c.prezzo }}</em>
      </button>
    </div>

    <!-- giocare costa una monetina, spazzolare no, la copertina costa
         lana: il prezzo si vede prima di premere, come sulla ciotola, e
         di ognuno si mostra la sua moneta — quella vera o la scorta -->
    <div class="fa-fila" style="margin-bottom:12px">
      <button v-for="g in COCCOLE" :key="g.id" class="fa-bot"
              :disabled="!puoFarla(g)"
              @click="emit('coccola', g)">
        {{ g.emoji }} {{ g.nome }}<template v-if="g.da"> · ×{{ quantiNe(g.da) }}</template
        ><template v-else-if="g.prezzo"> · 🪙{{ g.prezzo }}</template></button>
    </div>

    <div class="fa-fila">
      <button class="fa-bot forte" @click="emit('chiudi')">Va bene</button>
    </div>
    <!-- il nome si dà una volta e si cambia di rado: sta in fondo, piccolo,
         dove non ruba il posto a quello che si fa ogni volta -->
    <button class="fa-minuto" @click="emit('rinomina')">cambia nome</button>
  </div>
</template>
