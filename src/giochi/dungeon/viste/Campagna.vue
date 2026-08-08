<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA MAPPA DELLE TAPPE

   Tre scalini, nove discese. Riceve tutto già deciso — cosa è aperto,
   quante stelle, di che colore è l'ambiente — e non sa niente di
   profili, monete e motore: qui dentro si sceglie dove andare e basta.

   La discesa senza fondo sta in coda, e quando è aperta si porta
   dietro le sue tre profondità: è l'unico posto del gioco dove la
   difficoltà si sceglie a mano.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  scalini: { type: Array, required: true },   // [{ chiave, nome, icona, dritta, tappe }]
  libero: { type: Object, required: true },   // { aperto, quante, fatte }
  profondita: { type: Array, default: () => [] },
  scelta: { type: String, default: '' },
})
defineEmits(['gioca', 'libera', 'profondita'])
</script>

<template>
  <div class="dng-tappe">
    <section v-for="s in scalini" :key="s.chiave" class="dng-scalino">
      <h3>
        <span class="em">{{ s.icona }}</span>
        <b>{{ s.nome }}</b>
        <i>{{ s.dritta }}</i>
      </h3>
      <div class="dng-fila">
        <button v-for="t in s.tappe" :key="t.chiave"
                class="dng-tappa" :class="{ 'dng-chiusa': !t.aperta, 'dng-adesso': t.adesso }"
                :style="{ '--dng-accento': t.accento }"
                :data-tappa="t.indice" :disabled="!t.aperta"
                @click="$emit('gioca', t.indice)">
          <span class="dng-faccia em">{{ t.aperta ? t.icona : '🔒' }}</span>
          <span class="dng-testo">
            <b>{{ t.nome }}</b>
            <!-- chiusa si dice cosa ci sarà: «pipistrelli e lucertole» è
                 un motivo per arrivarci, «prima finisci quella prima» no -->
            <i>{{ t.aperta ? t.racconto : t.ambienteNome }}</i>
          </span>
          <span class="dng-conto em">
            {{ t.stelle ? '⭐'.repeat(t.stelle) : `${t.file} 🪜` }}
          </span>
        </button>
      </div>
    </section>

    <!-- la discesa senza fondo: si apre a campagna finita -->
    <div class="dng-libero" :class="{ 'dng-chiusa': !libero.aperto }">
      <button class="dng-portone" data-tappa="libera"
              :disabled="!libero.aperto" @click="$emit('libera')">
        <span class="em">{{ libero.aperto ? '🕳️' : '🔒' }}</span>
        <span v-if="libero.aperto">scendi senza fondo</span>
        <span v-else>finisci le {{ libero.quante }} discese ({{ libero.fatte }} fatte)</span>
      </button>
      <div v-if="libero.aperto" class="dng-scelte">
        <button v-for="p in profondita" :key="p.chiave"
                :aria-pressed="p.chiave === scelta" @click="$emit('profondita', p.chiave)">
          <span class="em">{{ p.icona }}</span>{{ p.nome }}
        </button>
      </div>
    </div>
  </div>
</template>
