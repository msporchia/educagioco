<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LE SEI DISCESE

   Riceve le tappe già decise — cosa è aperto, quante stelle — e non sa
   niente di profili né di motore: qui dentro si sceglie dove andare.

   Una tappa chiusa dice **cosa ci sarà**, non «prima finisci quella di
   prima»: la dritta è un motivo per arrivarci, il lucchetto da solo no.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  tappe: { type: Array, required: true },   // [{ indice, nome, icona, dritta, piani, aperta, adesso, stelle }]
})
defineEmits(['gioca'])
</script>

<template>
  <div class="sot-tappe">
    <p class="sot-invito">
      Sotto c'è un posto solo, e si gira col dito.
      <b>Ogni cosa che vale ha un prezzo, e il prezzo è rispondere.</b>
    </p>
    <button v-for="t in tappe" :key="t.indice"
            class="sot-tappa" :class="{ 'sot-chiusa': !t.aperta, 'sot-adesso': t.adesso }"
            :data-tappa="t.indice" :disabled="!t.aperta"
            @click="$emit('gioca', t.indice)">
      <span class="sot-faccia em">{{ t.aperta ? t.icona : '🔒' }}</span>
      <span class="sot-testo">
        <b>{{ t.nome }}</b>
        <i>{{ t.dritta }}</i>
      </span>
      <span class="sot-conto em">
        {{ t.stelle ? '⭐'.repeat(t.stelle) : `${t.piani} 🪜` }}
      </span>
    </button>
  </div>
</template>
