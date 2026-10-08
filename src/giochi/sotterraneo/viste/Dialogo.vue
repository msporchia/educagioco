<script setup>
// Il dialogo con chi sta sulla terra di sopra: il ritratto, il nome, il testo a pagine (un tocco va avanti, niente
// scorre) e all'ultima pagina le domande da fargli. Non decide niente: dice «ha scelto questa» a chi lo usa
// (viste/Terra.vue), che sa cosa vuol dire. Le regole: docs/sotterraneo/dialoghi.md
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import Ritratto from './Ritratto.vue'

// appena aperto non ascolta, e nemmeno le domande appena comparse: il tocco che le ha fatte uscire, ripetuto
// d'impazienza, cadrebbe su una scelta (gli stessi 320 ms ciechi della bottega, docs/core/interfaccia.md)
const CIECO = 320

const props = defineProps({
  chi: { type: String, required: true },      // la chiave: 'minatore', 'ragazza', …, 'armaiolo'
  nome: { type: String, required: true },
  pagine: { type: Array, required: true },    // [{ testo, dato?, missione?, fase?, manca? }] (motore/dialoghi.js)
  scelte: { type: Array, default: () => [] }, // [{ che, testo, missione?, premio? }]
  giro: { type: Number, default: 0 },         // cambia a ogni risposta: si riparte dalla prima pagina
})
const emit = defineEmits(['scegli'])

const i = ref(0)
const ultima = computed(() => i.value >= props.pagine.length - 1)
const pagina = computed(() => props.pagine[Math.min(i.value, props.pagine.length - 1)] || { testo: '' })

let finoA = 0, tScelte = 0
const pronte = ref(false)
function ciechiDaAdesso() { finoA = performance.now() + CIECO }
const sveglio = () => performance.now() >= finoA
// le scelte compaiono all'ultima pagina, e restano cieche un attimo
function mostraLeScelte() {
  pronte.value = false
  clearTimeout(tScelte)
  tScelte = setTimeout(() => { pronte.value = true }, CIECO)
}

onMounted(() => { ciechiDaAdesso(); if (ultima.value) mostraLeScelte() })
onBeforeUnmount(() => clearTimeout(tScelte))
watch(() => props.giro, () => { i.value = 0; ciechiDaAdesso(); if (ultima.value) mostraLeScelte() })
watch(ultima, u => { if (u) mostraLeScelte() })

function avanti() {
  if (!sveglio() || ultima.value) return
  i.value++
  // un doppio tocco non salta una pagina senza leggerla
  finoA = performance.now() + 180
}
function scegli(s) { if (pronte.value) emit('scegli', s) }

// gli attributi della riga per i test (e per lo stile): `data-detto`, `data-ti-cerca`, `data-sotto-livello`…
const dati = p => ({
  ...(p.dato ? { [`data-${p.dato}`]: '' } : {}),
  ...(p.manca ? { 'data-manca': p.manca } : {}),
  ...(p.missione ? { 'data-missione': p.missione, 'data-fase': p.fase || null } : {}),
})
</script>

<template>
  <section class="sot-dialogo" :data-dialogo="chi" :data-pagina="i + 1" :data-pagine="pagine.length"
           :data-ultima="ultima ? 1 : null" @click.stop>
    <span class="sot-dialogo-ritratto" data-ritratto-dialogo aria-hidden="true"><Ritratto :chi="chi" :scala="3" /></span>
    <b class="sot-dialogo-nome">{{ nome }}</b>
    <button type="button" class="sot-dialogo-testo" data-dialogo-testo
            @click="avanti">
      <span :key="giro + ':' + i" class="sot-dialogo-riga" :class="pagina.dato ? ['sot-riga-' + pagina.dato, { em: pagina.dato === 'premio' }] : null"
            data-riga v-bind="dati(pagina)">{{ pagina.testo }}</span>
      <i v-if="!ultima" class="sot-dialogo-avanti" data-avanti-pagina aria-hidden="true"></i>
    </button>
    <div v-if="ultima" class="sot-dialogo-scelte" :class="{ 'sot-ciechi': !pronte }" data-scelte>
      <button v-for="s in scelte" :key="s.che + (s.missione || '')" type="button" class="sot-dialogo-scelta"
              :class="'sot-scelta-' + s.che" :data-scelta="s.che" :data-missione="s.missione || null"
              @click="scegli(s)">
        <span>{{ s.testo }}</span>
        <small v-if="s.premio" class="em">{{ s.premio }}</small>
      </button>
    </div>
  </section>
</template>
