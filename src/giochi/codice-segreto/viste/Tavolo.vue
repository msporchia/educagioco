<script setup>
// Il tavolo: codice coperto in cima, tabellone in mezzo, disegni sotto.
// Non decide niente, manda solo i tre gesti (posare, togliere, consegnare);
// le righe le prepara il motore (`partita.righe`).
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  partita: { type: Object, required: true },
  posata: { type: Number, default: -1 },   // l'ultima buca riempita
  rifiuti: { type: Number, default: 0 },   // dita finite su una riga già piena
})
defineEmits(['posa', 'togli', 'conferma'])

const trema = ref(false)
watch(() => props.rifiuti, () => {
  trema.value = false
  requestAnimationFrame(() => {
    trema.value = true
    setTimeout(() => { trema.value = false }, 320)
  })
})

// Consegnata una riga, quella nuova va portata in vista: `nearest` scorre
// il minimo indispensabile, così la riga resta lì sopra invece di scappare.
const tabellone = ref(null)
watch(() => props.partita.usate, () => nextTick(() => {
  tabellone.value?.querySelector('.cs-riga.cs-attiva')
    ?.scrollIntoView({ block: 'nearest' })
}))
</script>

<template>
  <div class="cs-segreto">
    <span class="cs-lucchetto em">{{ partita.finita ? '👁️' : '🔒' }}</span>
    <div v-for="(s, i) in partita.codice" :key="i" class="cs-coperta em"
         :class="{ 'cs-scoperta': partita.finita }"
         :style="{ animationDelay: (i * 80) + 'ms' }">{{ partita.finita ? s : '?' }}</div>
  </div>

  <!-- la regola che cambia tutto (doppioni sì/no) sta sotto il codice: è
       la domanda che torna a ogni riga, non solo all'inizio -->
  <div class="cs-regola" :class="{ 'cs-nienteDoppioni': !partita.regole.ripetizioni }"
       :aria-label="partita.regole.ripetizioni
                    ? 'lo stesso disegno può tornare più volte'
                    : 'ogni disegno una volta sola'">
    <span class="cs-esempio">
      <i class="em">{{ partita.regole.pool[0] }}</i>
      <i class="em">{{ partita.regole.pool[0] }}</i>
    </span>
    <b>{{ partita.regole.ripetizioni ? '✓' : '✕' }}</b>
    <span>{{ partita.regole.ripetizioni
             ? 'lo stesso disegno può tornare' : 'ogni disegno una volta sola' }}</span>
  </div>

  <div ref="tabellone" class="cs-tabellone">
    <div v-for="riga in partita.righe" :key="riga.n"
         class="cs-riga" :class="{ 'cs-fatta': !!riga.fatta, 'cs-attiva': riga.attiva }">
      <div class="cs-caselle" :style="{ '--cs-n': partita.regole.caselle }">
        <button v-for="(s, i) in riga.simboli" :key="i" class="cs-casella em"
                :class="{ 'cs-piena': !!s,
                          'cs-prossima': riga.attiva && i === partita.prossima,
                          'cs-posata': riga.attiva && i === posata }"
                :tabindex="riga.attiva && s ? 0 : -1"
                :aria-label="riga.attiva && s ? 'togli ' + s : undefined"
                @click="riga.attiva && s && $emit('togli', i)">{{ s }}</button>
      </div>
      <div class="cs-indizi">
        <template v-if="riga.fatta">
          <i v-for="k in riga.fatta.pieni" :key="'p' + k" class="cs-pallino cs-pieno"
             :class="{ 'cs-nuovo': riga.ultima }"
             :style="{ animationDelay: (140 + (k - 1) * 130) + 'ms' }"></i>
          <i v-for="k in riga.fatta.vuoti" :key="'v' + k" class="cs-pallino cs-vuoto"
             :class="{ 'cs-nuovo': riga.ultima }"
             :style="{ animationDelay: (140 + (riga.fatta.pieni + k - 1) * 130) + 'ms' }"></i>
          <i v-if="riga.fatta.muta" class="cs-pallino cs-zero"
             :class="{ 'cs-nuovo': riga.ultima }"></i>
        </template>
      </div>
    </div>
  </div>

  <div class="cs-tastiera">
    <button v-for="s in partita.regole.pool" :key="s" class="cs-tasto em"
            :aria-label="'disegno ' + s" :data-simbolo="s"
            @click="$emit('posa', s)">{{ s }}</button>
  </div>

  <button class="cs-conferma" :class="{ 'cs-scossa': trema }"
          :disabled="!partita.piena || partita.finita"
          aria-label="conferma" @click="$emit('conferma')">✓</button>
</template>
