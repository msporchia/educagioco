<script setup>
// La mappa della campagna: tre scalini, nove tappe, riceve tutto già
// deciso. Su ogni tappa c'è scritto quanto dura. La partita lasciata a
// metà sta in cima (a che punto era): toccare un'altra tappa avverte
// invece di buttarla via in silenzio, perché il dito di un bambino
// sulla mappa ci finisce comunque.
import { ref } from 'vue'

const props = defineProps({
  scalini: { type: Array, required: true },   // [{ chiave, nome, icona, dritta, tappe: [] }]
  libero: { type: Object, required: true },   // { aperto, quante, fatte, primato }
  ripresa: { type: Object, default: null },   // { nome, libera, restano, livello, cuori… }
})
const emit = defineEmits(['gioca', 'libero', 'riprendi', 'scorda'])

const durata = s => s < 60 ? `${s}s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

const chiede = ref(null)   // quale partita si sta per cominciare avendone una in sospeso

function tocca(quale) {
  if (!props.ripresa) return vai(quale)
  chiede.value = quale
}

function vai(quale) {
  chiede.value = null
  if (quale.indice === undefined) emit('libero')
  else emit('gioca', quale.indice)
}
</script>

<template>
  <div class="sv-mappa">
    <div v-if="ripresa" class="sv-ripresa" data-ripresa="1">
      <p class="sv-dove">
        <span class="sv-faccia em">{{ ripresa.icona }}</span>
        <b>{{ ripresa.nome }}</b>
        <i class="em">
          <template v-if="ripresa.libera">⏱ {{ ripresa.tempo }}s resistiti</template>
          <template v-else>⏱ mancano {{ ripresa.restano }}s</template>
          · ❤️ {{ ripresa.cuori }}/{{ ripresa.cuoriMax }} · livello {{ ripresa.livello }}
        </i>
      </p>
      <button class="sv-grosso" data-azione="riprendi" @click="$emit('riprendi')">
        <span class="em">▶</span> torno in campo da dove ero
      </button>
      <button class="sv-grosso sv-chiaro" data-azione="scorda" @click="$emit('scorda')">
        lascio perdere quella partita
      </button>
    </div>

    <section v-for="s in scalini" :key="s.chiave" class="sv-scalino">
      <h3>
        <span class="em">{{ s.icona }}</span>
        <b>{{ s.nome }}</b>
        <i>{{ s.dritta }}</i>
      </h3>
      <div class="sv-tappe">
        <button v-for="t in s.tappe" :key="t.chiave"
                class="sv-tappa tappa"
                :class="{ 'sv-chiusa': !t.aperta, 'sv-adesso': t.adesso }"
                :style="{ '--sv-accento': t.accento }"
                :data-tappa="t.indice" :disabled="!t.aperta"
                @click="tocca(t)">
          <span class="sv-faccia em">{{ t.aperta ? t.icona : '🔒' }}</span>
          <span class="sv-testo">
            <b>{{ t.nome }}</b>
            <!-- chiusa, si dice cosa ci sarà: «la neve» è un motivo per
                 arrivarci, «prima finisci quella prima» no -->
            <i>{{ t.aperta ? t.racconto : t.scenarioNome }}</i>
          </span>
          <span class="sv-stelle em">
            {{ t.stelle ? '⭐'.repeat(t.stelle) : durata(t.durata) }}
          </span>
        </button>
      </div>
    </section>

    <!-- il gioco libero: si apre quando la campagna è finita, e non
         finisce mai — il punteggio è quanto si resiste -->
    <button class="sv-libero" :class="{ 'sv-chiusa': !libero.aperto }"
            data-tappa="libero" :disabled="!libero.aperto"
            @click="tocca({ nome: 'sopravvivenza' })">
      <span class="em">{{ libero.aperto ? '♾️' : '🔒' }}</span>
      <span v-if="libero.aperto">
        sopravvivenza
        <!-- il primato arriva già scritto in parole («2:05»): l'unità
             la sa il manifesto del gioco, non questa schermata -->
        <b v-if="libero.primato"> · primato {{ libero.primato }}</b>
      </span>
      <span v-else>finisci le {{ libero.quante }} tappe ({{ libero.fatte }} fatte)</span>
    </button>

    <!-- «ne cominci un'altra?»: detto prima, mai dopo -->
    <div v-if="chiede" class="sv-velo" @click.self="chiede = null">
      <div class="sv-modale">
        <h2><span class="em">⚠️</span> Hai una partita a metà</h2>
        <p>
          Se cominci <b>{{ chiede.nome }}</b> perdi quella che avevi lasciato,
          con tutte le carte che avevi guadagnato.
        </p>
        <button class="sv-grosso" data-azione="riprendi-invece"
                @click="chiede = null; emit('riprendi')">
          no, torno a quella di prima
        </button>
        <button class="sv-grosso sv-chiaro" data-azione="comincia" @click="vai(chiede)">
          va bene, comincio {{ chiede.nome.toLowerCase() }}
        </button>
      </div>
    </div>
  </div>
</template>
