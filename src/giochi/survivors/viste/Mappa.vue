<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA MAPPA DELLA CAMPAGNA

   Tre scalini, nove tappe. Riceve tutto già deciso — cosa è aperto,
   quante stelle, di che colore, quanto dura — e non sa niente di
   profili, monete e motore: qui dentro si sceglie dove andare e basta.

   Su ogni tappa c'è scritto **quanto dura**: è la prima cosa che un
   bambino vuole sapere prima di dire di sì, e «40 secondi» è una
   promessa che si può mantenere.

   ── LA PARTITA LASCIATA A METÀ STA IN CIMA ────────────────────────
   È la prima cosa che si vede, e dice a che punto era: quanto manca,
   che livello, quanti cuori restano. Sotto ci sono le tappe di sempre,
   e toccarne una **avverte** invece di buttare via la partita in
   silenzio — perché il dito di un bambino sulla mappa ci finisce
   comunque, e quello che si perde sono le carte già pagate rispondendo.
   ═══════════════════════════════════════════════════════════════════ */
import { ref } from 'vue'

const props = defineProps({
  scalini: { type: Array, required: true },   // [{ chiave, nome, icona, dritta, tappe: [] }]
  libero: { type: Object, required: true },   // { aperto, quante, fatte, primato }
  ripresa: { type: Object, default: null },   // { nome, libera, restano, livello, cuori… }
})
const emit = defineEmits(['gioca', 'libero', 'riprendi', 'scorda'])

const durata = s => s < 60 ? `${s}s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/* Quale partita si sta per cominciare avendone una in sospeso: la tappa
   (con nome e indice) o la Sopravvivenza. */
const chiede = ref(null)

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
    <!-- ═══ dove eri rimasto ═══ -->
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
        <b v-if="libero.primato"> · primato {{ libero.primato }}s</b>
      </span>
      <span v-else>finisci le {{ libero.quante }} tappe ({{ libero.fatte }} fatte)</span>
    </button>

    <!-- ═══ «ne cominci un'altra?» ═══
         Detto prima, mai dopo: quello che si perde non torna. -->
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
