<script setup>
// La bottega di un mercante di sopra, come quella di un gioco di ruolo stretta in un telefono: in cima il
// mercante, sotto l'eroe con le sue caselle e le gemme, le linguette del banco, la griglia dei pezzi e il
// pannello di quello scelto col confronto. Un tocco sceglie, il secondo (o il tasto) compra: il dito sbaglia.
// Le regole sono quelle del banco di prima (motore/bottega.js); il perché: docs/sotterraneo/bottega.md, "La bottega e lo zaino"
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import Cornice from './Cornice.vue'
import Addosso from './Addosso.vue'
import Casella from './Casella.vue'
import Pannello from './Pannello.vue'
import Pixel from './Pixel.vue'
import Icona from './Icona.vue'
import { figura, haFigura } from './figura.js'
import { ARMAIOLO, ERBORISTA, RIGATTIERE, MINATORE } from './pixel.js'
import { schedaDi } from '../dati/mercanti.js'
import { COSE } from '../dati/cose.js'

// appena aperta non ascolta: un secondo tocco sul mercante, dato mentre l'eroe ci arriva, cadrebbe su una
// casella (gli stessi 320 ms ciechi della domanda, docs/core/interfaccia.md)
const CIECO = 320
// un secondo tocco più svelto di così è un dito che ha premuto due volte, non un «sì, lo compro»
const RIPENSO = 400

const props = defineProps({
  chi: { type: Object, required: true },        // il mercante (dati/mercanti.js)
  roba: { type: Array, required: true },        // [{ chiave, …COSE, costa, avanti, posso, nonPuoi, mancano, quante, prova, va }]
  tasche: { type: Array, default: null },       // [{ chiave, …COSE, vale } | null]; null: non compra
  eroe: { type: Object, required: true },       // la scheda (Armato)
  addosso: { type: Object, required: true },    // { mano, mancina, corpo, dito }: voci o null
  numeri: { type: Object, required: true },     // { vita, att, dif, gemme }
  detto: { type: Object, default: null },       // l'ultima riga: { testo, sprite?, em? }
  chiCompra: { type: String, default: '' },     // «al mercante, vicino al carro»: detto da chi non compra
  scheda: { type: String, default: null },      // la linguetta da cui aprire (dal dialogo: «ho roba da vendere»)
})
const emit = defineEmits(['compra', 'vendi', 'chiudi', 'fuori'])

const pronto = ref(false)
let cieco = 0
onMounted(() => { cieco = setTimeout(() => { pronto.value = true }, CIECO) })
onBeforeUnmount(() => clearTimeout(cieco))

const FIGURE = { armaiolo: ARMAIOLO, erborista: ERBORISTA, rigattiere: RIGATTIERE }
const ritratto = computed(() => (haFigura(`${props.chi.sprite}-fermo-0`)
  ? figura(`${props.chi.sprite}-fermo-0`, { scala: 3 }) : null))

const scheda = ref(props.chi.schede.some(s => s.chiave === props.scheda) ? props.scheda : props.chi.schede[0].chiave)
const laScheda = computed(() => props.chi.schede.find(s => s.chiave === scheda.value))
const vende = computed(() => !!(laScheda.value && laScheda.value.vendi))
const qui = computed(() => props.roba.filter(r => (schedaDi(props.chi, r.chiave) || {}).chiave === scheda.value))

// { che: 'merce', k } | { che: 'tasca', i } | { che: 'addosso', dove }
const scelto = ref(null)
let sceltoAlle = 0
const cosa = computed(() => {
  const s = scelto.value
  if (!s) return null
  if (s.che === 'merce') return props.roba.find(r => r.chiave === s.k) || null
  if (s.che === 'tasca') return (props.tasche || [])[s.i] || null
  return props.addosso[s.dove] || null
})
// comprato un pezzo unico se ne va, venduta una tasca le altre scalano: la scelta non resta su un buco
watch(cosa, c => { if (!c) scelto.value = null })

const dettoVivo = ref(false)
watch(() => props.detto, d => { dettoVivo.value = !!d })

function scegli(s) {
  scelto.value = s
  sceltoAlle = performance.now()
  dettoVivo.value = false
}
const sceltoQui = (che, x) => !!scelto.value && scelto.value.che === che &&
  (scelto.value.k ?? scelto.value.i ?? scelto.value.dove) === x

function cambiaScheda(k) {
  if (!pronto.value || k === scheda.value) return
  scheda.value = k
  scelto.value = null
  dettoVivo.value = false
}

const puoiComprare = r => !!r && r.posso && !r.nonPuoi
function toccaMerce(r) {
  if (!pronto.value) return
  if (sceltoQui('merce', r.chiave)) {
    if (performance.now() - sceltoAlle > RIPENSO && puoiComprare(r)) emit('compra', r.chiave)
    return
  }
  scegli({ che: 'merce', k: r.chiave })
}
function toccaTasca(i) {
  if (!pronto.value || !props.tasche[i]) return
  if (sceltoQui('tasca', i)) {
    if (performance.now() - sceltoAlle > RIPENSO) vendi(i)
    return
  }
  scegli({ che: 'tasca', i })
}
function toccaAddosso(dove) {
  if (!pronto.value) return
  if (sceltoQui('addosso', dove) || !props.addosso[dove]) { scelto.value = null; return }
  scegli({ che: 'addosso', dove })
}
function compra() { if (pronto.value && puoiComprare(cosa.value)) emit('compra', cosa.value.chiave) }
function vendi(i) {
  scelto.value = null
  emit('vendi', i)
}

// le righe sotto i numeri: solo quello che non si vede già (docs/sotterraneo/dialoghi.md, «Le scritte»). Il prezzo
// alto dei pezzi avanti lo dice il cartellino, quante ne hai la casella (×2), dove va il confronto
const note = computed(() => {
  const c = cosa.value, s = scelto.value
  if (!c || s.che !== 'merce') return []
  if (c.nonPuoi) return [{ em: '✋', testo: c.nonPuoi, tono: 'ambra', dato: 'data-non-puoi' }]
  if (c.prova && c.prova.bloccata)
    return [{ em: '✋', testo: `${COSE[c.prova.bloccata].nome} tiene tutte e due le mani: questo resta in tasca.`, tono: 'ambra' }]
  return []
})
// il confronto solo per quello che si compra: addosso è già lì, e chi vende non si mette niente
const prova = computed(() => (scelto.value && scelto.value.che === 'merce' && cosa.value && cosa.value.prova &&
  cosa.value.prova.prima ? cosa.value.prova : null))
const va = computed(() => (prova.value ? prova.value.dove : null))

const sottoMerce = r => `💎 ${r.costa ?? r.prezzo}`
const tascheVuote = computed(() => !!props.tasche && !props.tasche.some(Boolean))
</script>

<template>
  <Cornice alta data-bottega :data-mercante-aperto="chi.chiave" @chiudi="$emit('chiudi')"
           @fuori="e => pronto && $emit('fuori', e)">
    <header class="sot-targa">
      <span class="sot-targa-ritratto">
        <span v-if="ritratto" class="sot-ritratto" :style="ritratto.gabbia"><i :style="ritratto.pezzo"></i></span>
        <Pixel v-else :figura="FIGURE[chi.chiave] || MINATORE" :scala="3" />
      </span>
      <span class="sot-targa-nome">
        <b>{{ chi.nome }}</b>
        <i>bottega del villaggio</i>
      </span>
    </header>

    <Addosso :eroe="eroe" v-bind="addosso" :scelto="scelto && scelto.che === 'addosso' ? scelto.dove : null"
             :va="va" @tocca="toccaAddosso">
      <span class="em"><b>❤️</b> {{ numeri.vita }}</span>
      <span class="em"><b>⚔️</b> {{ numeri.att }}</span>
      <span class="em"><b>🛡️</b> {{ numeri.dif }}</span>
      <span class="em sot-gemme-tue" data-gemme-bottega><b>💎</b> {{ numeri.gemme }}</span>
    </Addosso>

    <nav class="sot-linguette" role="tablist">
      <button v-for="s in chi.schede" :key="s.chiave" type="button" role="tab" class="sot-linguetta"
              :class="{ 'sot-su': s.chiave === scheda, 'sot-vendi': s.vendi }" :aria-selected="s.chiave === scheda"
              :data-scheda="s.chiave" @click="cambiaScheda(s.chiave)">
        <span class="em">{{ s.em }}</span> {{ s.nome }}
      </button>
    </nav>

    <div class="sot-banco-griglia">
      <template v-if="!vende">
        <div class="sot-griglia">
          <Casella v-for="r in qui" :key="r.chiave" :cosa="r" :sotto="sottoMerce(r)"
                   :spenta="!puoiComprare(r)" :rosso="!r.posso"
                   :segno="r.nonPuoi ? '✋' : r.quante ? `×${r.quante}` : ''"
                   :scelta="sceltoQui('merce', r.chiave)"
                   :data-casella-pezzo="r.chiave" :data-avanti="r.avanti || null"
                   :data-posso="puoiComprare(r) ? '1' : '0'" @click="toccaMerce(r)" />
        </div>
        <!-- ogni linguetta che veste ha sempre i suoi pezzi (motore/bottega.js, rialzi): questa riga non serve a chi veste.
             Un mercante non dice mai «niente per te» (docs/sotterraneo/dialoghi.md) -->
        <p v-if="!qui.length" class="sot-banco-voce">«Su questo banco, oggi, niente alla tua altezza. Guarda l'altro.»</p>
      </template>
      <template v-else>
        <div class="sot-griglia">
          <Casella v-for="(t, i) in tasche" :key="i" :cosa="t" vuota="·" :sotto="t ? `+💎 ${t.vale}` : ''" :segno="t && t.n > 1 ? `×${t.n}` : ''"
                   :scelta="sceltoQui('tasca', i)" :disabled="!t" class="sot-da-vendere"
                   :data-casella-pezzo="t ? t.chiave : null" :data-vendo="t ? t.chiave : null" :data-tasca-banco="i"
                   @click="toccaTasca(i)" />
        </div>
        <p v-if="tascheVuote" class="sot-banco-voce" data-tasche-vuote>
          «Tasche vuote? Torna quando laggiù avrai trovato qualcosa.»
        </p>
      </template>
    </div>

    <div class="sot-banco-piede">
      <p v-if="detto && dettoVivo" class="sot-detto-banco" data-detto-banco>
        <Icona v-if="detto.sprite || detto.em" :sprite="detto.sprite" :em="detto.em" :emAlto="18" />
        {{ detto.testo }}
      </p>
      <Pannello v-if="cosa" :cosa="cosa" :prova="prova" :note="note">
        <template v-if="scelto.che === 'merce'">
          <button type="button" class="sot-grosso sot-compra" data-azione="compra" :disabled="!puoiComprare(cosa)"
                  @click="compra">
            <template v-if="cosa.nonPuoi">non fa per te</template>
            <template v-else-if="!cosa.posso">ti mancano <span class="em">💎</span> {{ cosa.mancano }}</template>
            <template v-else>Compra <span class="em">💎</span> {{ cosa.costa ?? cosa.prezzo }}</template>
          </button>
        </template>
        <button v-else-if="scelto.che === 'tasca'" type="button" class="sot-grosso sot-vendi-tasto" data-azione="vendi"
                @click="pronto && vendi(scelto.i)">
          Vendi <span class="em">+💎</span> {{ cosa.vale }}
        </button>
      </Pannello>
      <!-- niente di scelto: parla il mercante -->
      <div v-else class="sot-battuta" data-battuta>
        <p>«{{ vende ? 'Fammi vedere cos\'hai in tasca: te lo pago la metà di quello che vale.' : chi.dice }}»</p>
        <p v-if="!tasche && chiCompra" class="sot-battuta-poi" data-chi-compra>
          «Roba da vendere? Portala {{ chiCompra }}.»
        </p>
      </div>
    </div>
  </Cornice>
</template>
