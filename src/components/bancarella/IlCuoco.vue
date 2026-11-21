<script setup>
// Il tuo cuoco (docs/bancarella/cuoco.md) sopra l'interfaccia unica (components/personalizza/Personalizza.vue, docs/core/personalizza.md),
// tema fattoria. Cinque schede: Chi è, Aspetto (pelle e capelli, o il pelo di un animale), Grembiule, Cappello, Collo. Tutto gratis:
// ogni scelta si scrive subito. Le foto sono il cuoco vero fotografato adesso con quella scelta (grafica/cucina3d/ritratto.js).
import { ref, reactive, computed } from 'vue'
import Personalizza from '../personalizza/Personalizza.vue'
import { SCHEDE_CUOCO, vociDelCuoco, valoriDellaVeste, vesteDeiValori, chiaveVeste, nomeDi, vesteInForma } from '../../data/bancarella-cuochi.js'

const props = defineProps({
  veste: { type: String, required: true },          // la riga del cuoco di adesso
  ritratti: { type: Object, default: null },        // creaRitratti(), o null finché non c'è (o senza WebGL)
})
const emit = defineEmits(['scegli', 'chiudi'])
const giro = ref(0)

const voci = computed(() => vociDelCuoco(props.veste))
const indossato = computed(() => valoriDellaVeste(props.veste))
const chi = computed(() => nomeDi(vesteInForma(props.veste).chi))

function scegli({ posto, oggetto, forma, colore }) {
  emit('scegli', chiaveVeste(vesteDeiValori({ [posto]: { oggetto, forma, colore } }, props.veste)))
}

// le foto: una per veste, quadro e lato; quando arriva, la carta si ridisegna
const foto = reactive({}), chiesti = new Set()
function fotoDi(stato, quadro, g = 0) {
  if (!props.ritratti) return ''
  const veste = chiaveVeste(vesteDeiValori(stato, props.veste)), chiave = `${veste}|${quadro}|${g}`
  if (!chiesti.has(chiave)) { chiesti.add(chiave); props.ritratti.chiedi(veste, { quadro, giro: g }).then(url => { if (url) foto[chiave] = url }) }
  return foto[chiave] || ''
}
// il taglio della foto: la testa per l'aspetto e il cappello, il busto per il grembiule e il collo, tutto per chi è
const QUADRO = { chi: 'tutto', pelle: 'testa', capelli: 'testa', pelo: 'testa', cappello: 'testa', grembiule: 'busto', collo: 'busto' }
const quadroDi = voce => QUADRO[voce?.posto] || 'tutto'
</script>

<template>
  <Personalizza tema="fattoria" titolo="Il tuo cuoco" :chi="chi" :schede="SCHEDE_CUOCO" :voci="voci" :indossato="indossato"
                v-model:giro="giro" data-cuoco @scegli="scegli" @chiudi="emit('chiudi')">
    <template #anteprima="{ stato }">
      <div class="ritratto"><img v-if="fotoDi(stato, 'tutto', giro)" :src="fotoDi(stato, 'tutto', giro)" alt="Il tuo cuoco" draggable="false"></div>
    </template>
    <template #foto="{ voce, stato }">
      <img v-if="fotoDi(stato, quadroDi(voce))" class="foto" :src="fotoDi(stato, quadroDi(voce))" alt="" draggable="false">
    </template>
  </Personalizza>
</template>

<style scoped>
.ritratto { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none }
.ritratto img { height:100%; max-width:100%; object-fit:contain }
.foto { width:100%; height:100%; object-fit:contain }
</style>
