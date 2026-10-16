<script setup>
// Le discese sulla terra di sopra (viste/Terra.vue): riceve le tappe già decise, sceglie solo dove andare. La
// discesa lasciata a metà sta in cima; scenderne un'altra avverte invece di buttare la partita in silenzio.
import { riprendiSeChiesta } from '../../ripresa.js'
import { ref, computed, defineAsyncComponent } from 'vue'
import Terra from './Terra.vue'
// il mondo di sopra in 3D (viste/Mondo3d.vue) si carica solo nel Sotterraneo 3D: il Sotterraneo di sempre non tira dentro three
const Mondo3d = defineAsyncComponent(() => import('./Mondo3d.vue'))
import Diario from './Diario.vue'
import LascioPerdere from './LascioPerdere.vue'

const props = defineProps({
  tappe: { type: Array, required: true },   // [{ indice, chiave, nome, icona, dritta, piani, aperta, adesso, stelle, perEta, fatta }]
  ripresa: { type: Object, default: null }, // { tappa, chiave, nome, icona, immagine, piano, piani, vita, gemme, chi, via }
  eroe: { type: Object, required: true },   // la scheda di chi scende, da dati/eroi.js
  abisso: { type: Object, default: null },   // { indice, nome, icona, dritta, fondo }; in fondo, la ripresa è più urgente
  terra: { type: Object, default: null },    // la terra dell'avventura: la nebbia, dove si era, se il minatore ha già parlato
  missioni: { type: Object, default: () => ({}) },   // lo stato delle missioni dell'avventura (motore/missioni.js)
  azioneMissione: { type: Function, default: null },  // (id, 'prendi' | 'consegna') → l'esito, da Gioco.vue
  conti: { type: Object, default: () => ({}) },   // a che punto sono le «sconfiggi N» (avventura.conti)
  segui: { type: String, default: null },    // la missione che le freccine seguono, scelta nel diario (avventura.segui)
  roba: { type: Object, default: null },     // quello che ci si porta dietro, già contato (schedaConLaRoba): { vita, att, dif, gemme, mano, mancina, corpo, tratti… }
  punti: { type: Number, default: 0 },          // le linguette del diario (viste/SchedeEroe.vue): i «+» delle altre schede
  puntiAbilita: { type: Number, default: 0 },
  forze: { type: Object, default: null },    // vita ed energia di chi ha lasciato la discesa dal portale: { vita, vitaMax, energia, energiaMax }
  annuncio: { type: Object, default: null }, // la zona appena nata che il minatore racconta (motore/zone.js): { chiave, nome, livello, detto, sentita }
  // il Sotterraneo 3D: il mondo generato al posto della terra dipinta, col suo salvataggio (`mondo`) e la veduta d'insieme
  disegno: { type: String, default: null },
  mondo: { type: Object, default: null },
  veduta: { type: Boolean, default: false },
  pensiero: { type: Object, default: null },  // il pensiero dell'eroe sopra la testa (docs/sotterraneo/pensieri.md)
})
const emit = defineEmits(['gioca', 'riprendi', 'scorda', 'terra', 'bottega', 'segui', 'sentito', 'scheda', 'cura', 'mondo', 'risposta', 'veduta',
                          'pensa', 'pensiero', 'pensiero-fine', 'trovati'])
const in3d = props.disegno === '3d'
riprendiSeChiesta(() => props.ripresa, () => emit('riprendi'))

const chiede = ref(null)   // quale tappa si sta per cominciare avendo una discesa in sospeso
const perdere = ref(false)   // «lascio perdere questa discesa»: il foglio che dice cosa resta e cosa no

// il gemello nel villaggio c'è solo se si è salita la discesa dal portale vero (`via: 'portale'`): uscire con la ✕ non
// regala una strada per tornare giù (docs/sotterraneo/portale-e-sosta.md)
const portale = computed(() => (props.ripresa && props.ripresa.via === 'portale' ? props.ripresa : null))

// il diario delle missioni (viste/Diario.vue), una scheda della finestra dell'eroe: lo apre Gioco.vue (apriDiario)
const diarioAperto = ref(false)
// «vai da …» nel dettaglio: il diario si chiude e l'eroe va da chi aspetta (viste/Terra.vue, vaDa)
const terraEl = ref(null)
function vaDa(chi) {
  diarioAperto.value = false
  if (terraEl.value) terraEl.value.vaDa(chi)
}

// un tocco fuori dal diario (o dalla bottega, da Gioco.vue) lo chiude e passa alla terra: l'eroe va dove si è toccato
function toccoDaFuori(x, y) { if (terraEl.value) terraEl.value.toccoDaFuori(x, y) }
const vaDaMercante = k => { if (terraEl.value) terraEl.value.vaDaMercante(k) }
function fuoriDalDiario(e) {
  diarioAperto.value = false
  if (e) toccoDaFuori(e.clientX, e.clientY)
}
const apriDiario = su => { diarioAperto.value = su === undefined ? !diarioAperto.value : !!su }
defineExpose({ toccoDaFuori, apriDiario, vaDaMercante })

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
    <component :is="in3d ? Mondo3d : Terra" ref="terraEl" :tappe="tappe" :abisso="abisso" :eroe="eroe" :roba="roba"
           v-bind="in3d ? { mondo, veduta } : { terra }"
           :missioni="missioni" :azione-missione="azioneMissione" :segui="segui"
           :giaScesa="ripresa ? ripresa.tappa : null" :portale="portale"
           :annuncio="annuncio" :forze="forze" @sentito="$emit('sentito')" @cura="r => $emit('cura', r)"
           @scendi="tocca" @terra="v => $emit('terra', v)" @bottega="(k, s) => $emit('bottega', k, s)"
           @mondo="v => $emit('mondo', v)" @risposta="r => $emit('risposta', r)" @veduta="v => $emit('veduta', v)"
           @riprendi="$emit('riprendi')" :pensiero="pensiero" @pensa="$emit('pensa')" @pensiero="p => $emit('pensiero', p)"
           @pensiero-fine="$emit('pensiero-fine')" @trovati="v => $emit('trovati', v)">
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
    </component>

    <Diario v-if="diarioAperto" :stati="missioni" :conti="conti" :tappe="tappe" :segui="segui" :punti="punti" :punti-abilita="puntiAbilita"
            @scheda="s => $emit('scheda', s)" @chiudi="diarioAperto = false"
            @segui="id => $emit('segui', id)" @vai="vaDa" @fuori="fuoriDalDiario" />

    <!-- detto prima: la roba resta, la discesa ricomincia da capo -->
    <LascioPerdere v-if="perdere && ripresa" :nome="ripresa.nome"
                   @si="perdere = false; $emit('scorda')" @no="perdere = false" />

    <!-- detto prima, mai dopo: quello che si perde non torna. È una scelta, e non si chiude toccando fuori -->
    <div v-if="chiede" class="sot-velo" data-chiede>
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
