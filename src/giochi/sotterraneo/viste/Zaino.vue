<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LO ZAINO — due caselle addosso e sei tasche

   Toccare una tasca fa **la sola cosa sensata** per quell'oggetto: si
   indossa quello che si indossa, si beve quello che si beve. Un menù con
   «equipaggia / usa / butta» su ogni riga sarebbe tre volte la stessa
   domanda, e per un bambino di sei anni tre occasioni di sbagliare.

   Le tasche vuote si vedono lo stesso, spente: sono il limite, e un
   limite che non si vede non fa scegliere niente.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  mano: { type: Object, default: null },      // { em, nome } o niente
  corpo: { type: Object, default: null },
  tasche: { type: Array, required: true },    // [{ em, nome, dice } | null]
  att: { type: Number, required: true },
  dif: { type: Number, required: true },
  gemme: { type: Number, required: true },
  piano: { type: Number, required: true },
  piani: { type: Number, required: true },
})
defineEmits(['usa', 'chiudi'])
</script>

<template>
  <div>
    <p class="sot-riepilogo em">
      ⚔️ {{ att }} · 🛡️ {{ dif }} · 💎 {{ gemme }} · piano {{ piano }} di {{ piani }}
    </p>
    <div class="sot-caselle">
      <div class="sot-casella">
        <span class="em">{{ mano ? mano.em : '·' }}</span>
        <b>{{ mano ? mano.nome : '—' }}</b>
        <i>in mano</i>
      </div>
      <div class="sot-casella">
        <span class="em">{{ corpo ? corpo.em : '·' }}</span>
        <b>{{ corpo ? corpo.nome : '—' }}</b>
        <i>addosso</i>
      </div>
    </div>
    <div class="sot-tasche">
      <button v-for="(t, i) in tasche" :key="i" class="sot-tasca" :class="{ 'sot-vuota': !t }"
              :disabled="!t" :data-tasca="i" @click="$emit('usa', i)">
        <span class="em">{{ t ? t.em : '·' }}</span>
        {{ t ? t.nome : 'vuota' }}
      </button>
    </div>
    <button class="sot-grosso sot-chiaro" data-azione="chiudi" @click="$emit('chiudi')">
      chiudo
    </button>
  </div>
</template>
