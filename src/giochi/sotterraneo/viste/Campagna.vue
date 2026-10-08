<script setup>
// Le discese sulla terra di sopra (viste/Terra.vue): riceve le tappe già decise, sceglie solo dove andare. La
// discesa lasciata a metà sta in cima; scenderne un'altra avverte invece di buttare la partita in silenzio.
import { riprendiSeChiesta } from '../../ripresa.js'
import { ref, computed } from 'vue'
import Icona from './Icona.vue'
import Armato from './Armato.vue'
import { COSE } from '../dati/cose.js'
import Terra from './Terra.vue'
import Diario from './Diario.vue'
import LascioPerdere from './LascioPerdere.vue'
import { diario } from '../motore/missioni.js'

const props = defineProps({
  tappe: { type: Array, required: true },   // [{ indice, chiave, nome, icona, dritta, piani, aperta, adesso, stelle, perEta, fatta }]
  ripresa: { type: Object, default: null }, // { tappa, chiave, nome, icona, immagine, piano, piani, vita, gemme, chi, via }
  eroe: { type: Object, required: true },   // la scheda di chi scende, da dati/eroi.js
  abisso: { type: Object, default: null },   // { indice, nome, icona, dritta, fondo }; in fondo, la ripresa è più urgente
  terra: { type: Object, default: null },    // la terra dell'avventura: la nebbia, dove si era, se il minatore ha già parlato
  missioni: { type: Object, default: () => ({}) },   // lo stato delle missioni dell'avventura (motore/missioni.js)
  azioneMissione: { type: Function, default: null },  // (id, 'prendi' | 'consegna') → l'esito, da Gioco.vue
  segui: { type: String, default: null },    // la missione che le freccine seguono, scelta nel diario (avventura.segui)
  roba: { type: Object, default: null },     // quello che ci si porta dietro, già contato (schedaConLaRoba): { vita, att, dif, gemme, mano, mancina, corpo, tratti… }
})
const emit = defineEmits(['gioca', 'riprendi', 'scorda', 'eroe', 'terra', 'bottega', 'segui'])
riprendiSeChiesta(() => props.ripresa, () => emit('riprendi'))

// l'armatura non si vede sul ritratto (come in discesa): sta accanto ai numeri, con la sua figura
const veste = computed(() => (props.roba && props.roba.corpo ? COSE[props.roba.corpo] || null : null))

const chiede = ref(null)   // quale tappa si sta per cominciare avendo una discesa in sospeso
const perdere = ref(false)   // «lascio perdere questa discesa»: il foglio che dice cosa resta e cosa no

// il gemello nel villaggio c'è solo se si è salita la discesa dal portale vero (`via: 'portale'`): uscire con la ✕ non
// regala una strada per tornare giù (docs/sotterraneo/portale-e-sosta.md)
const portale = computed(() => (props.ripresa && props.ripresa.via === 'portale' ? props.ripresa : null))

// il diario delle missioni (viste/Diario.vue): un tasto accanto alla carta di chi scende, col numero di quelle aperte
const diarioAperto = ref(false)
const riassunto = computed(() => diario(props.missioni, props.tappe, props.segui))
// «vai da …» nel dettaglio: il diario si chiude e l'eroe va da chi aspetta (viste/Terra.vue, vaDa)
const terraEl = ref(null)
function vaDa(chi) {
  diarioAperto.value = false
  if (terraEl.value) terraEl.value.vaDa(chi)
}
const pronte = computed(() => riassunto.value.inMano.some(v => v.stato === 'fatta'))

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
    <!-- la discesa lasciata dal portale è anche il portale gemello nel villaggio: tutti e due riprendono la stessa sosta -->
    <Terra ref="terraEl" :tappe="tappe" :abisso="abisso" :eroe="eroe" :terra="terra" :roba="roba"
           :missioni="missioni" :azione-missione="azioneMissione" :segui="segui"
           :giaScesa="ripresa ? ripresa.tappa : null" :portale="portale"
           @scendi="tocca" @terra="v => $emit('terra', v)" @bottega="k => $emit('bottega', k)"
           @riprendi="$emit('riprendi')">
      <template #sopra>
        <div v-if="ripresa" class="sot-ripresa" data-ripresa="1">
          <p class="sot-dove">
            <!-- la discesa ritagliata dalla mappa: un'emoji non dice quale pozzo -->
            <img v-if="ripresa.immagine" class="sot-ritaglio" :src="ripresa.immagine" alt="" data-ritaglio>
            <span v-else class="em">{{ ripresa.icona }}</span>
            <b>{{ ripresa.nome }}</b>
            <!-- con chi si riprende: la sosta è dell'avventura, quindi di questo eroe -->
            <i>{{ ripresa.chi ? ripresa.chi + ' · ' : '' }}piano {{ ripresa.piano
               }}<template v-if="ripresa.piani"> di {{ ripresa.piani }}</template> ·
               ❤️ {{ ripresa.vita }} · 💎 {{ ripresa.gemme }}</i>
          </p>
          <div class="sot-ripresa-tasti">
            <button class="sot-grosso" data-azione="riprendi" @click="$emit('riprendi')">
              <span class="em">🕳️</span> torno giù da dove ero
            </button>
            <button class="sot-grosso sot-chiaro" data-azione="scorda" @click="perdere = true">
              lascio perdere
            </button>
          </div>
        </div>
      </template>

      <template #sotto>
        <div class="sot-riga-sotto">
        <!-- chi scende: di qui si torna alle quattro avventure, senza perdere niente di questa -->
        <button class="sot-chi" data-azione="eroe" @click="$emit('eroe')">
          <Armato :eroe="eroe" :mano="roba ? roba.mano : null" :mancina="roba ? roba.mancina : null" :scala="2" />
          <span class="sot-testo">
            <b>{{ eroe.nome }}</b>
            <!-- con la roba addosso: è quella che scende, e le gemme sono quelle da spendere qui sopra -->
            <i class="em" data-roba-sopra>❤️ {{ roba ? roba.vita : eroe.vita }} · ⚔️ {{ roba ? roba.att : eroe.att }}<template
               v-if="roba ? roba.dif : eroe.dif"> · 🛡️ {{ roba ? roba.dif : eroe.dif }}</template><template
               v-if="roba"> · 💎 {{ roba.gemme }}</template></i>
            <i v-if="veste || (roba && roba.tratti.length)" class="sot-veste" data-veste-sopra>
              <Icona v-if="veste" :sprite="veste.sprite" :em="veste.em" :emAlto="14" :scala="1" />
              <span v-for="t in (roba ? roba.tratti : [])" :key="t" class="em">{{ t }}</span>
            </i>
          </span>
          <span class="sot-cambia">cambio</span>
        </button>
        <!-- il diario: sempre sottomano, col numero delle missioni aperte (in oro se ce n'è una da consegnare) -->
        <button class="sot-diario-tasto" :class="{ 'sot-pronta': pronte }" data-azione="diario" aria-label="le missioni"
                @click="diarioAperto = true">
          <span class="em">📖</span>
          <b v-if="riassunto.aperte" data-diario-n>{{ riassunto.aperte }}</b>
        </button>
        </div>
      </template>
    </Terra>

    <Diario v-if="diarioAperto" :stati="missioni" :tappe="tappe" :segui="segui" @chiudi="diarioAperto = false"
            @segui="id => $emit('segui', id)" @vai="vaDa" />

    <!-- detto prima: la roba resta, la discesa ricomincia da capo -->
    <LascioPerdere v-if="perdere && ripresa" :nome="ripresa.nome"
                   @si="perdere = false; $emit('scorda')" @no="perdere = false" />

    <!-- detto prima, mai dopo: quello che si perde non torna -->
    <div v-if="chiede" class="sot-velo" data-chiede @click.self="chiede = null">
      <div class="sot-modale">
        <h2><span class="em">⚠️</span> Hai una discesa a metà</h2>
        <p>
          Se cominci <b>{{ chiede.nome }}</b> lasci perdere quella che avevi in sospeso:
          quello che hai addosso e nello zaino resta tuo, ma quella discesa ricomincia da capo.
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
