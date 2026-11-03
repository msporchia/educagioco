<script setup>
// Il guardaroba del contadino (docs/fattoria3d/guardaroba.md) sopra l'interfaccia unica (components/personalizza/Personalizza.vue,
// docs/core/personalizza.md), tema fattoria. Schede: Chi sei (Contadina, Contadino), Aspetto (pelle; capelli: taglio, poi colore; barba),
// Cappelli, Vestiti (maglia, salopette o gonna, stivali, collo), Set (i set salvati e quelli da salvare). Quello che è tuo si mette subito;
// un capo con 🪙 resta in prova sul ritratto finché non si preme «Acquista e indossa». Le voci e i valori stanno in dati/guardaroba-voci.js.
// Il ritratto e le foto dei gettoni sono il contadino con quella scelta, fotografato adesso (`contadino:<chiave>[:r<giro>]`, scena3d/anteprime.js).
import { ref, computed, reactive } from 'vue'
import { chiaveAbito } from '../dati/abiti.js'
import { SCHEDE_GUARDAROBA, NOMI_PERSONE, vociDelGuardaroba, valoriDellAbito, abitoDeiValori } from '../dati/guardaroba-voci.js'
import Personalizza from '../../../components/personalizza/Personalizza.vue'
import '../stile-guardaroba.css'

const props = defineProps({
  abito: { type: Object, required: true },        // l'abito di adesso, con la persona
  livello: { type: Number, default: 1 },
  monete: { type: Number, default: 0 },
  armadio: { type: Object, default: () => ({}) }, // i pezzi a pagamento comprati: { 'cappello:cilindro': true }
  stagione: { type: String, default: '' },        // la festa in corso: i pezzi di festa si comprano solo allora
  messaggio: { type: String, default: '' },       // l'esito dell'ultimo acquisto, detto da Gioco.vue
  vestiti: { type: Array, default: () => [] },    // i set salvati (dati/guardaroba-voci.js, vestitiInForma)
  anteprima: { type: Function, required: true },  // tipo → Promise<dataURL|null>
  anteprimaPronta: { type: Function, required: true },
})
const emit = defineEmits(['indossa', 'aspetto', 'salva-set', 'rinomina-set', 'togli-set', 'chiudi'])

const persona = computed(() => props.abito.persona)
const giro = ref(0)
const voci = computed(() => vociDelGuardaroba(persona.value, { livello: props.livello, armadio: props.armadio, stagione: props.stagione }))
const indossato = computed(() => valoriDellAbito(props.abito))
const mieiSet = computed(() => props.vestiti.filter(s => s.persona === persona.value).map(s => ({ posto: s.posto, nome: s.nome, pezzi: valoriDellAbito({ persona: s.persona, ...s.capi }) })))

// le foto: il contadino fotografato con quell'abito (una per chiave, tenute qui finché il foglio è aperto)
const foto = reactive({}), chiesti = new Set()
function fotoDi(tipo) {
  if (foto[tipo]) return foto[tipo]
  const pronta = props.anteprimaPronta(tipo)
  if (pronta) return pronta
  if (!chiesti.has(tipo)) { chiesti.add(tipo); props.anteprima(tipo).then(url => { if (url) foto[tipo] = url }) }
  return ''
}
const tipoDi = (stato, r = 0) => 'contadino:' + chiaveAbito(abitoDeiValori(stato, persona.value)) + (r ? ':r' + r : '')
// il taglio della foto per zona: la testa per i cappelli e i capelli, il busto per la maglia… (la foto è il contadino intero)
const ZONA = { pelle: 'testa', capelli: 'testa', barba: 'testa', cappello: 'testa', maglia: 'busto', collo: 'collo', pantalone: 'gambe', stivali: 'piedi' }

// gratis: si mette subito; da pagare: lo paga Gioco.vue (motore.compraAbito), tutto o niente
function scegli({ posto, oggetto, forma, colore }) {
  if (posto === 'chi') { if (oggetto !== persona.value) emit('aspetto', oggetto === 'contadina' ? 'bambina' : 'bimbo'); return }
  emit('indossa', abitoDeiValori({ ...indossato.value, [posto]: { oggetto, forma, colore } }, persona.value))
}
function acquista({ pezzi }) {
  const v = { ...indossato.value }
  for (const p of pezzi) v[p.posto] = { oggetto: p.oggetto, forma: p.forma, colore: p.colore }
  emit('indossa', abitoDeiValori(v, persona.value))
}
function indossaSet({ pezzi }) { emit('indossa', abitoDeiValori({ ...indossato.value, ...pezzi }, persona.value)) }
function salvaSet({ posto, nome }) { emit('salva-set', { posto, nome, persona: persona.value }) }
</script>

<template>
  <Personalizza tema="fattoria" titolo="Guardaroba" :chi="NOMI_PERSONE[persona]" valuta="🪙" :saldo="monete" :livello="livello"
                :schede="SCHEDE_GUARDAROBA" :voci="voci" :indossato="indossato" :miei-set="mieiSet" v-model:giro="giro" :avviso="messaggio" data-f3="guardaroba"
                @scegli="scegli" @acquista="acquista" @indossa-set="indossaSet" @salva-set="salvaSet"
                @rinomina-set="x => emit('rinomina-set', { ...x, persona })" @togli-set="x => emit('togli-set', { posto: x, persona })" @chiudi="emit('chiudi')">
    <template #anteprima="{ stato }">
      <div class="f3-gua-ritratto" data-f3="guardaroba-ritratto">
        <img v-if="fotoDi(tipoDi(stato, giro))" :src="fotoDi(tipoDi(stato, giro))" alt="Il ritratto" draggable="false">
      </div>
    </template>
    <template #foto="{ zona, voce, stato }">
      <span class="f3-gua-foto" :class="'f3-gua-' + (zona === 'set' || (voce && voce.posto === 'chi') ? 'tutto' : ZONA[voce && voce.posto] || 'tutto')">
        <img v-if="fotoDi(tipoDi(stato))" :src="fotoDi(tipoDi(stato))" alt="" draggable="false">
      </span>
    </template>
  </Personalizza>
</template>
