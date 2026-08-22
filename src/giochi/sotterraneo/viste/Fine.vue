<script setup>
/* ═══════════════════════════════════════════════════════════════════
   COM'È FINITA

   Un cartello solo per i due modi di finire, perché è lo stesso gesto:
   «è finita, ecco com'è andata, si riparte da qui».

   I numeri veri si dicono **sempre**, anche quando è andata male — anzi
   soprattutto: «ero al terzo piano su quattro» è il motivo per cui un
   bambino rimette la mano sul telefono, «hai perso» è il motivo per cui
   lo posa.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  vinta: { type: Boolean, default: false },
  titolo: { type: String, default: '' },
  stelle: { type: Number, default: 0 },
  monete: { type: Number, default: 0 },
  fatti: { type: Object, required: true },   // { piani, quantiPiani, domande, mostri, tesori, gemme, perche }
})
defineEmits(['ancora', 'esci'])
</script>

<template>
  <div class="sot-velo">
    <div class="sot-fine">
      <!-- ── tre modi di finire, non due ──
           Vinta, lasciata a metà, e **finita male**: al fondo degli
           svenimenti si risale per forza, e raccontarlo come «sei
           tornato su a mani vuote» — la frase di chi ha scelto di
           smettere — nasconde l'unica cosa che c'è da capire, cioè che
           si è caduti troppe volte. Il numero degli svenimenti sta
           sotto, fra i fatti, e la frase ci si appoggia. -->
      <div class="sot-em em">{{ vinta ? '🏆' : fatti.perche === 'svenuto' ? '💫' : '🕯️' }}</div>
      <h2 :class="vinta ? 'sot-oro' : 'sot-rosso'">
        {{ vinta ? 'Sei risalito!'
           : fatti.perche === 'svenuto' ? 'Ti hanno portato su'
           : 'Sei tornato su a mani vuote' }}
      </h2>
      <p class="sot-racconto">
        {{ vinta
          ? `${titolo}: hai trovato la scala fino in fondo.`
          : fatti.perche === 'svenuto'
            ? `Sei svenuto ${fatti.svenimenti} volte: ${titolo} ricomincia da capo. Cerca una spada prima di picchiarti con tutti.`
            : 'Il sotterraneo resta lì. La prossima volta sarà tutto diverso.' }}
      </p>

      <div v-if="stelle" class="sot-stelle em">{{ '⭐'.repeat(stelle) }}</div>

      <div class="sot-fatti">
        <div><b>{{ fatti.piani }}<small>/{{ fatti.quantiPiani }}</small></b><span>piani</span></div>
        <div><b>{{ fatti.domande }}</b><span>domande</span></div>
        <div><b>{{ fatti.mostri }}</b><span>mostri</span></div>
        <div><b>{{ fatti.tesori }}</b><span>tesori</span></div>
      </div>

      <p v-if="monete" class="sot-coda sot-oro">+{{ monete }} 🪙 nel salvadanaio</p>

      <button class="sot-grosso" data-fine="ancora" @click="$emit('ancora')">
        <span class="em">{{ vinta ? '🗺️' : '↻' }}</span>
        {{ vinta ? 'alle discese' : 'ci riprovo' }}
      </button>
      <button v-if="!vinta" class="sot-grosso sot-chiaro" data-fine="esci" @click="$emit('esci')">
        <span class="em">🗺️</span> lascio qui
      </button>
    </div>
  </div>
</template>
