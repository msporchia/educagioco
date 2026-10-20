<script setup>
// Le azioni in basso: libero, semina, raccogli (si armano e poi si toccano i campi) e costruisci. Il numero rosso dice quanti
// campi aspettano. Non tocca il gioco: dice cosa si vuole con gli `emit`.
defineProps({
  modo: { type: String, default: 'libero' },
  seme: { type: String, default: '🌾' },
  daFare: { type: Object, default: () => ({ semina: 0, raccogli: 0 }) },
})
defineEmits(['modo', 'semina', 'costruisci'])
</script>

<template>
  <div class="f3-azioni-colonna">
    <div class="f3-azioni" data-f3="azioni">
      <button :class="{ acceso: modo === 'libero' }" data-f3="az-libero" @click="$emit('modo', 'libero')"><span>✋</span><small>Libero</small></button>
      <button :class="{ acceso: modo === 'semina' }" data-f3="az-semina" @click="$emit('semina')">
        <span>🌱</span><small>Semina</small>
        <em v-if="daFare.semina" class="f3-n">{{ daFare.semina }}</em><span class="f3-seme">{{ seme }}</span>
      </button>
      <button :class="{ acceso: modo === 'raccogli' }" data-f3="az-raccogli" @click="$emit('modo', modo === 'raccogli' ? 'libero' : 'raccogli')">
        <span>✂️</span><small>Raccogli</small><em v-if="daFare.raccogli" class="f3-n">{{ daFare.raccogli }}</em>
      </button>
      <button data-f3="az-costruisci" @click="$emit('costruisci')"><span>🏗</span><small>Costruisci</small></button>
    </div>
  </div>
</template>
