<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA MAPPA DEI CANTIERI

   Un capitolo per concetto, e sotto i suoi livelli: ognuno dice accanto
   al nome **cosa si impara** («ripeti», «un progetto con una misura»),
   come le prove del Generale. Riceve tutto già deciso — cosa è aperto
   e cosa è chiuso per età, quante stelle — e sceglie dove andare.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  capitoli: { type: Array, required: true },   // [{ chiave, nome, icona, dice, livelli: [] }]
  libero: { type: Object, default: null },      // il cantiere libero, con `aperto`
})
defineEmits(['gioca', 'libero'])
</script>

<template>
  <div class="cst-mappa">
    <button v-if="libero" type="button" class="cst-livello cst-libero" :class="{ 'cst-chiuso': !libero.aperto }"
            data-libero :disabled="!libero.aperto" @click="$emit('libero')">
      <span class="cst-faccia">{{ libero.aperto ? libero.icona : '🔒' }}</span>
      <span class="cst-testo-livello">
        <b>{{ libero.nome }}</b>
        <i>{{ libero.aperto ? 'costruisci quello che vuoi, coi tuoi progetti' : 'si apre finito il primo capitolo' }}</i>
      </span>
    </button>
    <section v-for="c in capitoli" :key="c.chiave" class="cst-capitolo">
      <h3><span class="cst-ico">{{ c.icona }}</span> {{ c.nome }}</h3>
      <p class="cst-piccolo">{{ c.dice }}</p>
      <div class="cst-livelli">
        <button v-for="l in c.livelli" :key="l.chiave" type="button" class="cst-livello"
                :class="{ 'cst-chiuso': !l.aperta, 'cst-adesso': l.adesso, 'cst-fatto': l.stelle > 0 }"
                :data-livello="l.indice" :disabled="!l.aperta" @click="$emit('gioca', l.indice)">
          <span class="cst-faccia">{{ l.aperta ? l.icona : '🔒' }}</span>
          <span class="cst-testo-livello">
            <b>{{ l.indice + 1 }}. {{ l.nome }}</b>
            <!-- chiuso per età non si scrive niente: andando avanti non si
                 apre, e per questo bambino il gioco finisce lì -->
            <i v-if="l.aperta">{{ l.impara }}</i>
            <i v-else-if="!l.perEta">finisci quello prima</i>
          </span>
          <span class="cst-stelline">{{ l.stelle ? '⭐'.repeat(l.stelle) : '' }}</span>
        </button>
      </div>
    </section>
  </div>
</template>
