<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CAMPO: COSA CI SEMINO, E QUANDO È PRONTO

   Si tocca un campo e si apre questo, esattamente come toccando un cane
   si apre `Bestia.vue`: è **lo stesso gesto per la stessa cosa** — «mi
   avvicino a qualcosa di mio e vedo cosa posso farci» — e averne uno solo
   è il motivo per cui non c'è niente di nuovo da imparare.

   Tre stati e non uno di più: vuoto (cosa ci semino), sta crescendo
   (quanto manca), pronto (raccogli). Il prezzo si vede **prima** di
   premere, come sulla ciotola e come sui cartelli del bosco: scegliere
   fra il grano da 10 minuti e il mais da 18 è una scelta solo se i due
   numeri sono a schermo.

   ── QUELLO CHE QUI NON SI DICE MAI ────────────────────────────────
   Che si può perdere qualcosa. Un campo pronto resta pronto per sempre
   (`dati/coltivazioni.js`), quindi non c'è nessun conto alla rovescia
   dopo la maturazione, nessun «sbrigati», nessun rosso. Chi è a zero
   monete legge quanto gli serve e torna dopo, e il grano è ancora lì.

   Non sa niente del profilo né delle monete vere: riceve `stato` e
   `monete`, manda fuori `semina` e `raccogli`. Chi paga è `Gioco.vue`.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { PRODOTTI } from '../dati/coltivazioni.js'

const props = defineProps({
  /* quello che torna da `Fattoria.statoCampo()` */
  stato: { type: Object, required: true },
  monete: { type: Number, default: 0 },
  /* quanto ci sta ancora nel silo del raccolto: zero vuol dire che
     raccogliere non si può, e il pannello lo dice invece di mostrare un
     tasto spento senza perché */
  ciSta: { type: Number, default: 99 },
  /* il silo del raccolto non è ancora stato costruito. Si dice **prima
     di seminare**, non a raccolto pronto: scoprire che non c'è dove
     metterlo dopo aver aspettato dieci minuti veri è la cosa che fa
     smettere di seminare. */
  senzaSilo: { type: Boolean, default: false },
  prezzoSilo: { type: Number, default: 0 },
  /* Quelle che il livello della fattoria ha già aperto
     (`dati/livelli.js`): al primo campo sono due, e crescono con la
     fattoria. Le porta chi apre il foglio — qui non si decide niente. */
  colture: { type: Array, default: () => [] },
})
const emit = defineEmits(['semina', 'raccogli', 'chiudi'])

const c = computed(() => props.stato.coltura)
const pieno = computed(() => !props.stato.vuoto && props.stato.pronto &&
                             props.ciSta < (c.value ? c.value.resa : 0))
const prodotto = k => PRODOTTI[k] || { nome: k, emoji: '📦' }
</script>

<template>
  <div class="fa-foglio">
    <h2>{{ stato.vuoto ? 'Un campo da seminare' : c.nome }}</h2>

    <!-- ── vuoto: cosa ci metto ── -->
    <template v-if="stato.vuoto">
      <p>Scegli cosa seminare. Ci vuole del tempo vero: puoi chiudere il
         gioco e tornare quando è cresciuto.</p>
      <div class="fa-nomi">
        <button v-for="k in colture" :key="k.id" class="fa-cibo suo"
                :disabled="k.semina > monete" @click="emit('semina', k)">
          <b>{{ k.emoji }}</b>
          <span>{{ k.nome }}</span>
          <em>🪙{{ k.semina }} · {{ k.minuti }} min</em>
        </button>
      </div>
      <p v-if="senzaSilo" class="fa-piccolo">Ti servirà anche il <b>silo
         del raccolto</b> (🪙{{ prezzoSilo }}): è lì che finisce quello
         che raccogli, e senza non c'è dove metterlo.</p>
      <p v-else class="fa-piccolo">Poi si raccoglie, e quello che viene
         fuori finisce nel silo del raccolto: con il mulino diventa pappa
         per i tuoi animali. <b>Il silo si guarda toccandolo.</b></p>
    </template>

    <!-- ── sta crescendo ── -->
    <template v-else-if="!stato.pronto">
      <p>{{ c.emoji }} Sta crescendo. È pronto fra
         <b>{{ stato.manca }} {{ stato.manca === 1 ? 'minuto' : 'minuti' }}</b>.</p>
      <div class="fa-bisogni">
        <div class="fa-bisogno">
          <span>{{ c.emoji }}</span>
          <span class="fa-livello">
            <i :style="{ width: Math.round(stato.quanto * 100) + '%', background: '#8fcf6f' }"></i>
          </span>
          <em>{{ Math.round(stato.quanto * 100) }}%</em>
        </div>
      </div>
      <p class="fa-piccolo">Non serve restare a guardare: cresce anche a
         gioco chiuso, e non si secca mai.</p>
    </template>

    <!-- ── pronto ── -->
    <template v-else>
      <p><b>{{ c.emoji }} È pronto!</b> Ne viene
         {{ c.resa }} {{ prodotto(c.da).emoji }}
         {{ prodotto(c.da).nome.toLowerCase() }}.</p>
      <p v-if="pieno && senzaSilo" class="fa-piccolo">Non hai ancora il
         <b>silo del raccolto</b> (🪙{{ prezzoSilo }}): senza, non c'è dove
         metterlo. Il campo ti aspetta.</p>
      <p v-else-if="pieno" class="fa-piccolo">Nel silo del raccolto non
         c'è posto per {{ c.resa }} {{ prodotto(c.da).emoji }}: usa
         qualcosa, o toccalo e ingrandiscilo. Il campo ti aspetta.</p>
      <p v-else-if="c.raccolta > monete" class="fa-piccolo">Ti
         {{ c.raccolta - monete === 1 ? 'serve' : 'servono' }}
         <b>🪙{{ c.raccolta - monete }}</b> in più per raccoglierlo. Resta
         qui ad aspettarti: fai un po' di esercizi e torna.</p>
    </template>

    <div class="fa-fila">
      <button class="fa-bot piano" @click="emit('chiudi')">Chiudi</button>
      <button v-if="!stato.vuoto && stato.pronto" class="fa-bot forte"
              :disabled="pieno || c.raccolta > monete" @click="emit('raccogli')">
        Raccogli{{ c.raccolta ? ` · 🪙${c.raccolta}` : '' }}</button>
    </div>
  </div>
</template>
