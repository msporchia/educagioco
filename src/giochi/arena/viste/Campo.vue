<script setup>
// Il campo e il pannello delle scelte: consegna il suo canvas a chi lo deve
// dipingere (emit('tela')) e trasforma il tocco su una carta in una scelta
// (emit('scegli')). Non conosce le regole: riceve già decisi prezzi, livelli e
// cosa si può fare. Il dito non è un mouse: niente di piccolo da toccare.
import { ref, computed, onMounted } from 'vue'
import Ritratto from './Ritratto.vue'

const props = defineProps({
  cruscotto: { type: Object, required: true },
  pannello: { type: Object, required: true },     // { caserme: [] (una per edificio), azioni: [] }
  avviso: { type: String, default: '' },
  dritta: { type: Boolean, default: true },        // «tocca una caserma»
})
const emit = defineEmits(['tela', 'scegli', 'dettagli', 'edificio'])
const tela = ref(null)
onMounted(() => emit('tela', tela.value))

const orologio = computed(() => {
  const s = Math.max(0, Math.ceil(props.cruscotto.resto))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})
const ICONA = { miniera: '⛏️', ripara: '🔧', bomba: '💣' }
const NOME = { miniera: 'Più monete', ripara: 'Ripara', castello: 'Castello', bomba: 'Bomba' }
</script>

<template>
  <div class="ar-campo">
    <div class="ar-hud em">
      <span class="ar-gettone">⏱️ <b>{{ orologio }}</b></span>
    </div>

    <div class="ar-quadro">
      <canvas ref="tela" class="ar-tela"></canvas>
      <div v-if="avviso" class="ar-avviso em" data-avviso>{{ avviso }}</div>
      <div v-else-if="dritta" class="ar-dritta em">👇 tocca una caserma · il ? spiega</div>
    </div>

    <!-- le monete stanno sopra le scelte che le spendono -->
    <div class="ar-borsa em" data-monete>
      <span class="ar-moneta">🪙 <b>{{ cruscotto.monete }}</b></span>
      <i>+{{ cruscotto.alSecondo.toFixed(1) }} al secondo</i>
    </div>

    <div class="ar-pannello">
      <!-- una carta per edificio: costruito si potenzia, da costruire apre la scelta fra le sue due truppe -->
      <button v-for="c in pannello.caserme" :key="c.ed" class="ar-carta"
              :class="{ 'ar-no': !c.puoi, 'ar-nuova': !c.presente }"
              :data-caserma="c.ed" :data-variante="c.id || null"
              @click="c.presente ? emit('scegli', { azione: 'potenzia', id: c.id }) : emit('edificio', { ed: c.ed })">
        <svg v-if="c.presente && c.prezzo !== null" class="ar-su" viewBox="0 0 12 12" aria-label="si può potenziare">
          <path d="M6 0.8 L11.2 6.6 H8 V11.2 H4 V6.6 H0.8 Z" />
        </svg>
        <span class="ar-info em" role="button" aria-label="dettagli" :data-dettagli="c.presente ? c.id : c.ed"
              @click.stop="c.presente ? emit('dettagli', { id: c.id }) : emit('edificio', { ed: c.ed })">?</span>
        <Ritratto v-if="c.presente" :id="c.id" :lato="40" />
        <span v-else class="ar-coppia">
          <Ritratto v-for="v in c.varianti" :key="v" :id="v" :lato="c.varianti.length > 1 ? 28 : 40" />
        </span>
        <span class="ar-nome">{{ c.nome }}</span>
        <span class="ar-liv">{{ c.presente ? 'Lv ' + c.liv : c.liv ? 'rifalla · Lv ' + c.liv : 'da costruire' }}</span>
        <span class="ar-prezzo em">
          <template v-if="c.riposo > 0">💤 {{ Math.ceil(c.riposo) }}s</template>
          <template v-else-if="c.prezzo === null">MAX</template>
          <template v-else>{{ c.prezzo }} 🪙</template>
        </span>
        <i v-if="c.presente" class="ar-prog"><b :style="{ width: (c.avanza * 100) + '%' }"></b></i>
      </button>

      <button v-for="a in pannello.azioni" :key="a.azione" class="ar-carta ar-azione"
              :class="{ 'ar-no': !a.puoi }"
              :data-azione="a.azione" @click="emit('scegli', { azione: a.azione })">
        <svg v-if="(a.azione === 'miniera' || a.azione === 'castello') && a.prezzo !== null" class="ar-su" viewBox="0 0 12 12" aria-label="si può potenziare">
          <path d="M6 0.8 L11.2 6.6 H8 V11.2 H4 V6.6 H0.8 Z" />
        </svg>
        <span class="ar-info em" role="button" aria-label="dettagli" :data-dettagli="a.azione"
              @click.stop="emit('dettagli', { azione: a.azione })">?</span>
        <Ritratto v-if="a.azione === 'castello'" torre :livello="a.livello" :lato="40" />
        <span v-else class="ar-icona em">{{ ICONA[a.azione] }}</span>
        <span class="ar-nome">{{ NOME[a.azione] }}</span>
        <span class="ar-liv">{{ a.stato }}</span>
        <span class="ar-prezzo em">
          <template v-if="a.azione === 'bomba'">{{ a.attesa && !a.puoi ? 'fra ' + a.attesa + ' s' : 'in regalo' }}</template>
          <template v-else-if="a.prezzo === null">—</template>
          <template v-else>{{ a.prezzo }} 🪙</template>
        </span>
      </button>
    </div>
  </div>
</template>
