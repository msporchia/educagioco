<script setup>
// Le discese sulla terra di sopra (viste/Terra.vue): riceve le tappe già decise, sceglie solo dove andare. La
// discesa lasciata a metà sta in cima; scenderne un'altra avverte invece di buttare la partita in silenzio.
import { riprendiSeChiesta } from '../../ripresa.js'
import { ref, computed } from 'vue'
import { figura } from './figura.js'
import { pezzoAndante } from '../dati/tessere.js'
import Terra from './Terra.vue'

const props = defineProps({
  tappe: { type: Array, required: true },   // [{ indice, chiave, nome, icona, dritta, piani, aperta, adesso, stelle, perEta, fatta }]
  ripresa: { type: Object, default: null }, // { tappa, nome, icona, piano, piani, vita, gemme, chi }
  eroe: { type: Object, required: true },   // la scheda di chi scende, da dati/eroi.js
  abisso: { type: Object, default: null },   // { indice, nome, icona, dritta, fondo }; in fondo, la ripresa è più urgente
  terra: { type: Object, default: null },    // cfg.terra: la nebbia, dove si era, se il minatore ha già parlato
  roba: { type: Object, default: null },     // quello che ci si porta dietro: { att, dif, gemme, tasche } già contati
})
const emit = defineEmits(['gioca', 'riprendi', 'scorda', 'eroe', 'terra', 'bottega'])
riprendiSeChiesta(() => props.ripresa, () => emit('riprendi'))

const ritratto = computed(() => figura(pezzoAndante(props.eroe.sprite, 'fermo', 0), { scala: 2 }))

const chiede = ref(null)   // quale tappa si sta per cominciare avendo una discesa in sospeso

function tocca(t) {
  if (!props.ripresa) return emit('gioca', t.indice)
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
    <Terra :tappe="tappe" :abisso="abisso" :eroe="eroe" :terra="terra"
           :giaScesa="ripresa ? ripresa.tappa : null"
           @scendi="tocca" @terra="v => $emit('terra', v)" @bottega="k => $emit('bottega', k)">
      <template #sopra>
        <div v-if="ripresa" class="sot-ripresa" data-ripresa="1">
          <p class="sot-dove">
            <span class="em">{{ ripresa.icona }}</span>
            <b>{{ ripresa.nome }}</b>
            <!-- con chi si riprende: chi è sceso è sceso, anche se nel frattempo si è cambiato eroe -->
            <i>{{ ripresa.chi ? ripresa.chi + ' · ' : '' }}piano {{ ripresa.piano
               }}<template v-if="ripresa.piani"> di {{ ripresa.piani }}</template> ·
               ❤️ {{ ripresa.vita }} · 💎 {{ ripresa.gemme }}</i>
          </p>
          <div class="sot-ripresa-tasti">
            <button class="sot-grosso" data-azione="riprendi" @click="$emit('riprendi')">
              <span class="em">🕳️</span> torno giù da dove ero
            </button>
            <button class="sot-grosso sot-chiaro" data-azione="scorda" @click="$emit('scorda')">
              lascio perdere
            </button>
          </div>
        </div>
      </template>

      <template #sotto>
        <!-- chi scende: si sceglie una volta e resta, di qui si cambia -->
        <button class="sot-chi" data-azione="eroe" @click="$emit('eroe')">
          <span class="sot-ritratto" :style="ritratto ? ritratto.gabbia : null">
            <i v-if="ritratto" :style="ritratto.pezzo"></i>
            <b v-else class="em">{{ eroe.em }}</b>
          </span>
          <span class="sot-testo">
            <b>{{ eroe.nome }}</b>
            <!-- con la roba addosso: è quella che scende, e le gemme sono quelle da spendere qui sopra -->
            <i class="em" data-roba-sopra>❤️ {{ eroe.vita }} · ⚔️ {{ roba ? roba.att : eroe.att }}<template
               v-if="roba ? roba.dif : eroe.dif"> · 🛡️ {{ roba ? roba.dif : eroe.dif }}</template><template
               v-if="roba"> · 💎 {{ roba.gemme }}</template></i>
          </span>
          <span class="sot-cambia">cambio</span>
        </button>
      </template>
    </Terra>

    <!-- detto prima, mai dopo: quello che si perde non torna -->
    <div v-if="chiede" class="sot-velo" data-chiede @click.self="chiede = null">
      <div class="sot-modale">
        <h2><span class="em">⚠️</span> Hai una discesa a metà</h2>
        <p>
          Se cominci <b>{{ chiede.nome }}</b> perdi quella che avevi lasciato
          in sospeso, con tutto quello che avevi trovato.
        </p>
        <button class="sot-grosso" data-azione="riprendi-invece"
                @click="chiede = null; $emit('riprendi')">
          no, torno a quella di prima
        </button>
        <button class="sot-grosso sot-chiaro" data-azione="comincia" @click="comincia">
          va bene, comincio {{ chiede.nome.toLowerCase() }}
        </button>
      </div>
    </div>
  </div>
</template>
