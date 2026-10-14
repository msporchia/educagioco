<script setup>
// Il campo, che si tocca: consegna il suo canvas a chi lo deve dipingere (emit('tela')) e
// sopra le piazzole e il castello mette dei bersagli trasparenti grandi quanto l'edificio.
// Toccata una piazzola libera si sceglie cosa costruirci; toccato un edificio gli compare
// attorno l'anello (⬆️ potenzia, 💰 vendi, ? i numeri). Sotto resta una barra sottile:
// monete, ripara, bomba. Non conosce le regole: riceve già decisi posti, prezzi e cosa si
// può fare. Il dito non è un mouse: niente di piccolo da toccare.
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  cruscotto: { type: Object, required: true },
  pannello: { type: Object, required: true },     // { bersagli: [], anello: null | {...}, azioni: [] }
  avviso: { type: String, default: '' },
  dritta: { type: Boolean, default: true },        // «tocca una piazzola»
})
const emit = defineEmits(['tela', 'scegli', 'dettagli', 'tocca', 'anello', 'chiudiAnello'])
const tela = ref(null)
onMounted(() => emit('tela', tela.value))

const orologio = computed(() => {
  const s = Math.max(0, Math.ceil(props.cruscotto.resto))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})
const ICONA = { ripara: '🔧', bomba: '💣' }
const NOME = { ripara: 'Ripara', bomba: 'Bomba' }
const px = v => `${Math.round(v)}px`
</script>

<template>
  <div class="ar-campo">
    <div class="ar-hud em">
      <span class="ar-gettone">⏱️ <b>{{ orologio }}</b></span>
    </div>

    <div class="ar-quadro" @click.self="emit('chiudiAnello')">
      <canvas ref="tela" class="ar-tela" @click="emit('chiudiAnello')"></canvas>

      <!-- i bersagli: uno per piazzola (libera o con l'edificio) e uno per il castello -->
      <button v-for="b in pannello.bersagli" :key="b.chiave" class="ar-bersaglio"
              :class="{ 'ar-scelto': pannello.anello && pannello.anello.chiave === b.chiave }"
              :style="{ left: px(b.x), top: px(b.y), width: px(b.w), height: px(b.h) }"
              :data-piazzola="b.posto ?? null" :data-variante="b.id || null" :data-castello="b.castello ? '' : null"
              :aria-label="b.nome" @click.stop="emit('tocca', b)">
        <span v-if="b.posto !== undefined && !b.id && b.puoi" class="ar-piu em">＋</span>
      </button>

      <!-- l'anello attorno all'edificio toccato: pulsanti grandi, sopra l'edificio -->
      <div v-if="pannello.anello" class="ar-anello" :style="{ left: px(pannello.anello.x), top: px(pannello.anello.y) }">
        <button v-for="v in pannello.anello.voci" :key="v.chiave" class="ar-voce em"
                :class="{ 'ar-no': !v.puoi }" :data-anello="v.chiave" @click.stop="emit('anello', v.chiave)">
          <span class="ar-voce-icona">{{ v.icona }}</span>
          <span class="ar-voce-testo">{{ v.testo }}</span>
        </button>
      </div>

      <div v-if="avviso" class="ar-avviso em" data-avviso>{{ avviso }}</div>
      <div v-else-if="dritta" class="ar-dritta em">👆 tocca una piazzola o il castello</div>
    </div>

    <!-- la barra sottile: le monete, e le due scelte che non stanno su un edificio -->
    <div class="ar-barra-sotto">
      <div class="ar-borsa em" data-monete>
        <span class="ar-moneta">🪙 <b>{{ cruscotto.monete }}</b></span>
        <i>+{{ cruscotto.alSecondo.toFixed(1) }}/s</i>
      </div>
      <button v-for="a in pannello.azioni" :key="a.azione" class="ar-carta ar-azione ar-bassa"
              :class="{ 'ar-no': !a.puoi }"
              :data-azione="a.azione" @click="emit('scegli', { azione: a.azione })">
        <span class="ar-info em" role="button" aria-label="dettagli" :data-dettagli="a.azione"
              @click.stop="emit('dettagli', { azione: a.azione })">?</span>
        <span class="ar-icona em">{{ ICONA[a.azione] }}</span>
        <span class="ar-nome">{{ NOME[a.azione] }} · {{ a.stato }}</span>
        <span class="ar-prezzo em">
          <template v-if="a.azione === 'bomba'">{{ a.attesa && !a.puoi ? 'fra ' + a.attesa + ' s' : 'in regalo' }}</template>
          <template v-else-if="a.prezzo === null">—</template>
          <template v-else>{{ a.prezzo }} 🪙</template>
        </span>
      </button>
    </div>
  </div>
</template>
