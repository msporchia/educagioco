<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LE SEI DISCESE

   Riceve le tappe già decise — cosa è aperto, quante stelle — e non sa
   niente di profili né di motore: qui dentro si sceglie dove andare.

   Una tappa chiusa dice **cosa ci sarà**, non «prima finisci quella di
   prima»: la dritta è un motivo per arrivarci, il lucchetto da solo no.

   ── LA DISCESA LASCIATA A METÀ STA IN CIMA ────────────────────────
   È la prima cosa che si vede, e dice a che punto era: piano, vita,
   gemme. Sotto ci sono le discese di sempre, e toccarne una **avverte**
   invece di buttare via la partita in silenzio — perché il dito di un
   bambino sulla mappa ci finisce comunque, e quello che si perde sono
   venti minuti.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import { figura } from './figura.js'
import { pezzoAndante } from '../dati/tessere.js'

const props = defineProps({
  tappe: { type: Array, required: true },   // [{ indice, nome, icona, dritta, piani, aperta, adesso, stelle }]
  ripresa: { type: Object, default: null }, // { tappa, nome, icona, piano, piani, vita, gemme }
  eroe: { type: Object, required: true },   // la scheda di chi scende, da dati/eroi.js
})
const emit = defineEmits(['gioca', 'riprendi', 'scorda', 'eroe'])

/* Il ritratto di chi scende: lo sprite vero, non l'emoji. Chi apre
   questa schermata deve vedere **chi è**, non leggerlo. */
const ritratto = computed(() => figura(pezzoAndante(props.eroe.sprite, 'fermo', 0), { scala: 2 }))

/* Quale tappa si sta per cominciare avendo una discesa in sospeso. */
const chiede = ref(null)

function tocca(t, cSospeso) {
  if (!cSospeso) return emit('gioca', t.indice)
  chiede.value = t
}

function comincia() {
  const t = chiede.value
  chiede.value = null
  emit('gioca', t.indice)
}
</script>

<template>
  <div class="sot-tappe">
    <p class="sot-invito">
      Sotto c'è un posto solo, e si gira col dito.
      <b>Ogni cosa che vale ha un prezzo, e il prezzo è rispondere.</b>
    </p>

    <!-- ═══ chi scende ═══
         Si sceglie una volta e resta; di qui si cambia. Sta in cima
         perché è la cosa che decide come andrà la discesa, e perché una
         scelta fatta un mese fa va ricordata a chi torna. -->
    <button class="sot-chi" data-azione="eroe" @click="$emit('eroe')">
      <span class="sot-ritratto" :style="ritratto ? ritratto.gabbia : null">
        <i v-if="ritratto" :style="ritratto.pezzo"></i>
        <b v-else class="em">{{ eroe.em }}</b>
      </span>
      <span class="sot-testo">
        <b>{{ eroe.nome }}</b>
        <i class="em">❤️ {{ eroe.vita }} · ⚔️ {{ eroe.att }}<template v-if="eroe.dif"> · 🛡️ {{ eroe.dif }}</template></i>
      </span>
      <span class="sot-cambia">cambio</span>
    </button>

    <!-- ═══ dove eri rimasto ═══ -->
    <div v-if="ripresa" class="sot-ripresa" data-ripresa="1">
      <p class="sot-dove">
        <span class="em">{{ ripresa.icona }}</span>
        <b>{{ ripresa.nome }}</b>
        <i>piano {{ ripresa.piano }} di {{ ripresa.piani }} ·
           ❤️ {{ ripresa.vita }} · 💎 {{ ripresa.gemme }}</i>
      </p>
      <button class="sot-grosso" data-azione="riprendi" @click="$emit('riprendi')">
        <span class="em">🕳️</span> torno giù da dove ero
      </button>
      <button class="sot-grosso sot-chiaro" data-azione="scorda" @click="$emit('scorda')">
        lascio perdere quella discesa
      </button>
    </div>

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
