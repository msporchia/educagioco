<script setup>
// Le discese sul mondo di sopra (viste/Mondo3d.vue): riceve le tappe già decise, sceglie solo dove andare. La discesa lasciata a
// metà non ha una carta in cima (vedi tocca); scenderne un'altra avverte invece di buttare la partita in silenzio.
import { riprendiSeChiesta } from '../../ripresa.js'
import { ref, computed, defineAsyncComponent } from 'vue'
// il mondo (e three) si carica qui, non con l'app
const Mondo3d = defineAsyncComponent(() => import('./Mondo3d.vue'))
import Diario from './Diario.vue'

const props = defineProps({
  tappe: { type: Array, required: true },   // [{ indice, chiave, nome, icona, dritta, piani, aperta, adesso, stelle, fatta }]
  ripresa: { type: Object, default: null }, // { tappa, chiave, nome, icona, immagine, piano, piani, vita, gemme, chi, via }
  eroe: { type: Object, required: true },   // la scheda di chi scende, da dati/eroi.js
  abisso: { type: Object, default: null },   // { indice, nome, icona, dritta, fondo }
  missioni: { type: Object, default: () => ({}) },   // lo stato delle missioni dell'avventura (motore/missioni.js)
  azioneMissione: { type: Function, default: null },  // (id, 'prendi' | 'consegna') → l'esito, da Gioco.vue
  conti: { type: Object, default: () => ({}) },   // a che punto sono le «sconfiggi N» (avventura.conti)
  segui: { type: String, default: null },    // la missione che le freccine seguono, scelta nel diario (avventura.segui)
  roba: { type: Object, default: null },     // quello che ci si porta dietro, già contato (schedaConLaRoba): { vita, att, dif, gemme, mano, mancina, corpo, tratti… }
  punti: { type: Number, default: 0 },          // le linguette del diario (viste/SchedeEroe.vue): i «+» delle altre schede
  puntiAbilita: { type: Number, default: 0 },
  forze: { type: Object, default: null },    // vita ed energia di chi ha lasciato la discesa dal portale, o ferito sopra: { vita, vitaMax, energia, energiaMax }
  // il mondo generato, col suo salvataggio (`mondo`) e la veduta d'insieme
  mondo: { type: Object, default: null },
  di: { type: String, default: null },   // di chi è il mondo (eroe:terra): torna col salvataggio, anche da un mondo che si smonta
  veduta: { type: Boolean, default: false },
  // i tredici dungeon del mondo a percorso per chiave (Gioco.vue, docs/sotterraneo/dungeon-che-si-rigenerano.md): da passare al mondo
  dungeon: { type: Array, default: null },
  // la porta delle terre (motore/terre.js, laPorta): dove si è, se è aperta e dove porta; `terre` (t) chiede di passare
  terre: { type: Object, default: null },
  pensiero: { type: Object, default: null },  // il pensiero dell'eroe sopra la testa (docs/sotterraneo/pensieri.md)
  // i mostri di sopra (viste/Mondo3d.vue): la forza dell'eroe per l'annuncio, e se un pannello sta sopra il mondo (i mostri aspettano)
  forza: { type: Number, default: 1 },
  fermo: { type: Boolean, default: false },
})
const emit = defineEmits(['gioca', 'davanti', 'riprendi', 'bottega', 'segui', 'scheda', 'cura', 'mondo', 'risposta', 'veduta',
                          'pensa', 'pensiero', 'pensiero-fine', 'trovati', 'scontro', 'raccogli', 'terre'])
riprendiSeChiesta(() => props.ripresa, () => emit('riprendi'))

const chiede = ref(null)   // quale tappa si sta per cominciare avendo una discesa in sospeso

// il gemello nel villaggio c'è solo se si è salita la discesa dal portale vero (`via: 'portale'`): uscire con la ✕ non
// regala una strada per tornare giù (docs/sotterraneo/portale-e-sosta.md)
const portale = computed(() => (props.ripresa && props.ripresa.via === 'portale' ? props.ripresa : null))

// il diario delle missioni (viste/Diario.vue), una scheda della finestra dell'eroe: lo apre Gioco.vue (apriDiario)
const diarioAperto = ref(false)
// «vai da …» nel dettaglio: il diario si chiude e l'eroe va da chi aspetta (viste/Mondo3d.vue, vaDa)
const terraEl = ref(null)
function vaDa(chi) {
  diarioAperto.value = false
  if (terraEl.value) terraEl.value.vaDa(chi)
}
// «vai alla pietra»: se chi aspetta è lontano e c'è una pietra accesa vicino a lui
const pietraPer = chi => (terraEl.value && terraEl.value.pietraPer ? terraEl.value.pietraPer(chi) : null)
function vaAllaPietra(chi) {
  diarioAperto.value = false
  if (terraEl.value && terraEl.value.vaAllaPietra) terraEl.value.vaAllaPietra(chi)
}

// un tocco fuori dal diario (o dalla bottega, da Gioco.vue) lo chiude e passa alla terra: l'eroe va dove si è toccato
function toccoDaFuori(x, y) { if (terraEl.value) terraEl.value.toccoDaFuori(x, y) }
const vaDaMercante = k => { if (terraEl.value) terraEl.value.vaDaMercante(k) }
function fuoriDalDiario(e) {
  diarioAperto.value = false
  if (e) toccoDaFuori(e.clientX, e.clientY)
}
const apriDiario = su => { diarioAperto.value = su === undefined ? !diarioAperto.value : !!su }
// lo scontro di sopra (viste/Mondo3d.vue): Gioco.vue lo apre sul prato e lo chiude
const apriPalco = (corsa, opz) => (terraEl.value && terraEl.value.apriPalco ? terraEl.value.apriPalco(corsa, opz) : null)
const dopoLoScontro = (e, scontro) => { if (terraEl.value && terraEl.value.dopoLoScontro) terraEl.value.dopoLoScontro(e, scontro) }
const statoSopra = () => (terraEl.value && terraEl.value.statoSopra ? terraEl.value.statoSopra() : null)
const salvaSopra = () => { if (terraEl.value && terraEl.value.salvaSopra) terraEl.value.salvaSopra() }
defineExpose({ toccoDaFuori, apriDiario, vaDaMercante, apriPalco, dopoLoScontro, statoSopra, salvaSopra })

// niente carta in cima: si torna giù dal gemello o dall'ingresso dello stesso dungeon (docs/sotterraneo/portale-e-sosta.md)
const dellaSosta = t => !!props.ripresa && (t.chiave ? t.chiave === props.ripresa.chiave : t.indice === props.ripresa.tappa)

function tocca(t) {
  if (!props.ripresa) return emit('gioca', t.indice ?? t.chiave)   // un dungeon nuovo del mondo non ha indice: si scende per chiave
  if (dellaSosta(t)) return emit('riprendi')
  chiede.value = t
}

function comincia() {
  const t = chiede.value
  chiede.value = null
  emit('gioca', t.indice ?? t.chiave)
}
</script>

<template>
  <div class="sot-tappe">
    <!-- la discesa lasciata dal portale è anche il portale gemello nel villaggio: tutti e due riprendono la stessa sosta -->
    <Mondo3d ref="terraEl" :tappe="tappe" :abisso="abisso" :eroe="eroe" :roba="roba"
           :mondo="mondo" :veduta="veduta" :forza="forza" :fermo="fermo || diarioAperto || !!chiede" :dungeon="dungeon" :terre="terre"
           :missioni="missioni" :azione-missione="azioneMissione" :segui="segui"
           :giaScesa="ripresa ? ripresa.tappa : null" :portale="portale"
           :forze="forze" @cura="r => $emit('cura', r)"
           @scendi="tocca" @davanti="t => $emit('davanti', t ? t.indice ?? t.chiave : null)" @bottega="(k, s) => $emit('bottega', k, s)"
           @mondo="v => $emit('mondo', v, di)" @risposta="r => $emit('risposta', r)" @veduta="v => $emit('veduta', v)"
           @riprendi="$emit('riprendi')" :pensiero="pensiero" @pensa="$emit('pensa')" @pensiero="p => $emit('pensiero', p)"
           @pensiero-fine="$emit('pensiero-fine')" @trovati="v => $emit('trovati', v)"
           @scontro="v => $emit('scontro', v)" @raccogli="i => $emit('raccogli', i)" @terre="t => $emit('terre', t)">
      <template #scontro><slot name="scontro" /></template>
    </Mondo3d>

    <Diario v-if="diarioAperto" :stati="missioni" :conti="conti" :tappe="tappe" :segui="segui" :punti="punti" :punti-abilita="puntiAbilita"
            @scheda="s => $emit('scheda', s)" @chiudi="diarioAperto = false"
            :pietra="pietraPer" @segui="id => $emit('segui', id)" @vai="vaDa" @pietra="vaAllaPietra" @fuori="fuoriDalDiario" />

    <!-- detto prima, mai dopo: quello che si perde non torna. È una scelta, e non si chiude toccando fuori -->
    <div v-if="chiede" class="sot-velo" data-chiede>
      <div class="sot-modale">
        <h2><span class="em">⚠️</span> Hai una discesa a metà</h2>
        <p>
          Se cominci <b>{{ chiede.nome }}</b> lasci perdere quella che avevi in sospeso:
          quello che hai addosso e nello zaino resta tuo, ma quella discesa ricomincia da capo.
        </p>
        <!-- il no non riporta giù: si resta dove si è -->
        <button class="sot-grosso" data-azione="riprendi-invece" @click="chiede = null">
          no, non adesso
        </button>
        <button class="sot-grosso sot-chiaro" data-azione="comincia" @click="comincia">
          va bene, comincio {{ chiede.nome.toLowerCase() }}
        </button>
      </div>
    </div>
  </div>
</template>
