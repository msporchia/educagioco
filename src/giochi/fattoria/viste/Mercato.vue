<script setup>
/* Il mercato: la bacheca degli ordini, come in Hay Day — tre foglietti appuntati, chi chiede grande,
   le merci grandi col «0/2», il premio in ⭐ (non 🪙: il mercato non paga monete). Pochissime parole:
   quello che manca si tocca e apre il suo albero. Riceve gli ordini già contati (bancoDi), non sa
   niente del profilo — vedi docs/fattoria/chi-chiede.md. */
import Merce from './Merce.vue'
import Chiudi from './Chiudi.vue'

defineProps({
  // [{id, cliente, righe, xp, minuti, pronto}] — vedi bancoDi
  ordini: { type: Array, default: () => [] },
  // [{minuti}]: i posti che stanno riposando dopo un rifiuto
  riposi: { type: Array, default: () => [] },
})
const emit = defineEmits(['consegna', 'rifiuta', 'chiudi', 'albero'])
</script>

<template>
  <div class="fa-foglio fa-mercato" data-mercato>
    <Chiudi @chiudi="$emit('chiudi')" />
    <h2>Il mercato</h2>

    <div class="fa-bacheca">
      <div v-for="(o, n) in ordini" :key="o.id" class="fa-foglietto"
           :class="{ pronto: o.pronto }" :style="{ '--piega': (n % 2 ? 1.2 : -1.2) + 'deg' }"
           :data-ordine="o.id">
        <i class="fa-puntina"></i>
        <b class="fa-cliente" :title="o.cliente.nome">{{ o.cliente.emoji }}</b>

        <!-- Una riga per merce: la figura grande e quanti, in grassetto. Quella che manca si tocca. -->
        <button v-for="r in o.righe" :key="r.prodotto" type="button"
                :class="['fa-chiesta', { piena: r.pieno }]"
                :data-albero-apri="r.pieno ? null : r.prodotto"
                :disabled="r.pieno" @click="emit('albero', r.prodotto)">
          <Merce :merce="r.prodotto" :lato="50" />
          <span><b>{{ r.hai }}</b>/{{ r.serve }}</span>
        </button>

        <em class="fa-premio-xp">⭐ {{ o.xp }}</em>
        <div class="fa-foglietto-tasti">
          <!-- Rifiutare costa tempo: il posto resta vuoto qualche minuto. -->
          <button type="button" class="fa-butta" data-azione="rifiuta" aria-label="non mi va"
                  @click="emit('rifiuta', o.id)">🗑</button>
          <button type="button" class="fa-bot forte piccolo" data-azione="consegna"
                  :disabled="!o.pronto" @click="emit('consegna', o.id)">✓</button>
        </div>
      </div>

      <!-- Un posto che riposa non è un buco: un foglietto vuoto che dice fra quanto torna. -->
      <div v-for="(r, i) in riposi" :key="'r' + i" class="fa-foglietto vuoto" data-riposo>
        <i class="fa-puntina"></i>
        <b class="fa-cliente">⏳</b>
        <span class="fa-fra">{{ r.minuti }} min</span>
      </div>
    </div>

    <p v-if="!ordini.length && !riposi.length">Per adesso non è arrivato nessuno.</p>
  </div>
</template>
