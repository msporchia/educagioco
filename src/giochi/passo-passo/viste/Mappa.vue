<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA MAPPA DELLA CAMPAGNA — ventiquattro posti in cinque gradini

   Una griglia e non un elenco: sono tante tappe, e una colonna di
   ventiquattro carte si scorre per mezzo minuto prima di arrivare dove
   si era. Ogni carta dice tre cose che si vedono senza leggere: il
   disegno del posto, le stelle prese, il lucchetto. Il nome sta sotto,
   piccolo, per chi legge.

   Il racconto di ogni posto (cosa si scopre lì) sta nell'`aria-label`:
   è per il grande che legge, e sul cartello di fine tappa si vede.

   In fondo, il sentiero senza fine: si apre a campagna finita, e sul
   tasto c'è il record — è quello che fa venire voglia di entrarci.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  scalini: { type: Array, required: true },       // [{ chiave, nome, icona, dritta, tappe: [] }]
  senzaFine: { type: Object, required: true },    // { aperto, record, quante, fatte }
})
defineEmits(['gioca', 'senza-fine'])
</script>

<template>
  <div class="pp-mappa" data-mappa>
    <section v-for="s in scalini" :key="s.chiave" class="pp-scalino">
      <h3>
        <span class="pp-em">{{ s.icona }}</span>
        <b>{{ s.nome }}</b>
        <i>{{ s.dritta }}</i>
      </h3>
      <div class="pp-tappe">
        <button v-for="t in s.tappe" :key="t.chiave"
                class="pp-tappa" :class="{ 'pp-chiusa': !t.aperta, 'pp-adesso': t.adesso }"
                :data-tappa="t.indice" :disabled="!t.aperta"
                :aria-label="`${t.indice + 1}. ${t.nome}: ${t.racconto}`"
                @click="$emit('gioca', t.indice)">
          <span class="pp-numero">{{ t.indice + 1 }}</span>
          <span class="pp-faccia pp-em">{{ t.aperta ? t.icona : '🔒' }}</span>
          <span class="pp-nome">{{ t.nome }}</span>
          <span class="pp-stelle">
            <span v-for="n in 3" :key="n" class="pp-em" :class="{ 'pp-spenta': n > t.stelle }">⭐</span>
          </span>
        </button>
      </div>
    </section>

    <button class="pp-sentiero" :class="{ 'pp-chiusa': !senzaFine.aperto }"
            data-tappa="senza-fine" :disabled="!senzaFine.aperto" @click="$emit('senza-fine')">
      <span class="pp-em">{{ senzaFine.aperto ? '♾️' : '🔒' }}</span>
      <span v-if="senzaFine.aperto">
        <b>Il sentiero senza fine</b>
        <i v-if="senzaFine.record">record: {{ senzaFine.record }}</i>
        <i v-else>sentieri nuovi, uno dopo l'altro</i>
      </span>
      <span v-else>
        <b>Il sentiero senza fine</b>
        <i>si apre alla fine delle {{ senzaFine.quante }} tappe ({{ senzaFine.fatte }} fatte)</i>
      </span>
    </button>
  </div>
</template>
