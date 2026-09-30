<script setup>
// Un cartello solo per tutti i modi di finire: i numeri veri si dicono SEMPRE, anche perdendo — soprattutto.
defineProps({
  vinta: { type: Boolean, default: false },
  titolo: { type: String, default: '' },
  stelle: { type: Number, default: 0 },
  monete: { type: Number, default: 0 },
  notaMonete: { type: String, default: '' },   // il salvadanaio stanco: docs/genitori/varieta.md
  fatti: { type: Object, required: true },   // { piani, quantiPiani, domande, mostri, tesori, gemme, perche, fondo }
  // il terzo modo di finire: l'abisso non ha niente da vincere né da fallire, si riprende da dove si è arrivati
  abisso: { type: Boolean, default: false },
  record: { type: Boolean, default: false },  // ...ed è il più giù di sempre
})
defineEmits(['ancora', 'esci'])
</script>

<template>
  <div class="sot-velo">
    <div class="sot-fine">
      <!-- tre modi di finire: vinta, lasciata a metà, o finita male (svenimenti) — mai la stessa frase -->
      <div class="sot-em em">{{ abisso ? '🕳️' : vinta ? '🏆' : fatti.perche === 'svenuto' ? '💫' : '🕯️' }}</div>
      <h2 :class="vinta || abisso ? 'sot-oro' : 'sot-rosso'">
        {{ abisso ? `Sei risalito dal piano ${fatti.fondo}`
           : vinta ? 'Sei risalito!'
           : fatti.perche === 'svenuto' ? 'Ti hanno portato su'
           : 'Sei tornato su a mani vuote' }}
      </h2>
      <p class="sot-racconto">
        {{ abisso
          ? (record ? 'Nessuno era mai arrivato così giù. L\'abisso ti aspetta lì: da lì si riprende.'
                    : 'L\'abisso non finisce, e non è finito adesso: da lì si riprende, con quello che hai addosso.')
          : vinta
            ? `${titolo}: hai trovato la scala fino in fondo.`
            : fatti.perche === 'svenuto'
              ? `Sei svenuto ${fatti.svenimenti} volte: ${titolo} ricomincia da capo. Cerca una spada prima di picchiarti con tutti.`
              : 'Il sotterraneo resta lì. La prossima volta sarà tutto diverso.' }}
      </p>

      <div v-if="stelle" class="sot-stelle em">{{ '⭐'.repeat(stelle) }}</div>

      <div class="sot-fatti">
        <!-- nell'abisso non esiste un "su quanti" -->
        <div><b>{{ fatti.piani }}<small v-if="fatti.quantiPiani">/{{ fatti.quantiPiani }}</small></b><span>piani</span></div>
        <div><b>{{ fatti.domande }}</b><span>domande</span></div>
        <div><b>{{ fatti.mostri }}</b><span>mostri</span></div>
        <div><b>{{ fatti.tesori }}</b><span>tesori</span></div>
      </div>

      <p v-if="monete" class="sot-coda sot-oro" data-monete-prese>+{{ monete }} 🪙 nel salvadanaio</p>
      <p v-if="notaMonete" class="sot-coda" data-nota-monete>{{ notaMonete }}</p>

      <button class="sot-grosso" data-fine="ancora" @click="$emit('ancora')">
        <span class="em">{{ vinta || abisso ? '🗺️' : '↻' }}</span>
        {{ vinta || abisso ? 'alle discese' : 'ci riprovo' }}
      </button>
      <button v-if="!vinta && !abisso" class="sot-grosso sot-chiaro" data-fine="esci" @click="$emit('esci')">
        <span class="em">🗺️</span> lascio qui
      </button>
    </div>
  </div>
</template>
