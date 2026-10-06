<script setup>
/* La mappa della campagna: una griglia e non un elenco, perché una colonna
   di trenta carte si scorre per mezzo minuto prima di arrivare dove si
   era. Il racconto di ogni posto sta nell'`aria-label`, per il grande che
   legge. Il sentiero senza fine: docs/passo-passo/sentiero.md. */
defineProps({
  scalini: { type: Array, required: true },       // [{ chiave, nome, icona, dritta, tappe: [] }]
  senzaFine: { type: Object, required: true },    // { aperto, record, quante, fatte, dopo }
})
defineEmits(['gioca', 'senza-fine'])
</script>

<template>
  <div class="pp-mappa" data-mappa>
    <!-- in cima, la partita lasciata a metà (docs/passo-passo/sosta.md) -->
    <slot />
    <template v-for="s in scalini" :key="s.chiave">
      <section class="pp-scalino" :data-scalino="s.chiave">
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
            <span v-if="t.aMeta && t.aperta" class="pp-a-meta pp-em" data-a-meta>✏️</span>
            <span class="pp-faccia pp-em">{{ t.aperta ? t.icona : '🔒' }}</span>
            <span class="pp-nome">{{ t.nome }}</span>
            <span class="pp-stelle">
              <span v-for="n in 4" :key="n" class="pp-em" :class="{ 'pp-spenta': n > t.stelle }">⭐</span>
            </span>
          </button>
        </div>
      </section>

      <button v-if="s.chiave === senzaFine.dopo" class="pp-sentiero" :class="{ 'pp-chiusa': !senzaFine.aperto }"
              data-tappa="senza-fine" :disabled="!senzaFine.aperto" @click="$emit('senza-fine')">
        <span class="pp-em">{{ senzaFine.aperto ? '♾️' : '🔒' }}</span>
        <span v-if="senzaFine.aperto">
          <b>Il sentiero senza fine</b>
          <i v-if="senzaFine.record">record: {{ senzaFine.record }}</i>
          <i v-else>sentieri nuovi, uno dopo l'altro</i>
        </span>
        <span v-else>
          <b>Il sentiero senza fine</b>
          <i>si apre alla fine delle prime {{ senzaFine.quante }} tappe ({{ senzaFine.fatte }} fatte)</i>
        </span>
      </button>
    </template>
  </div>
</template>
