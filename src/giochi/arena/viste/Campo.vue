<script setup>
// Il campo, che si tocca: consegna il suo canvas a chi lo deve dipingere (emit('tela')) e
// sopra le piazzole e il castello mette dei bersagli trasparenti grandi quanto l'edificio.
// Toccata una piazzola libera le compare sopra la nuvoletta con le truppe (il disegno e il prezzo);
// toccato un edificio gli compare attorno l'anello (⬆️ potenzia, 💰 vendi, ? i numeri). Diamanti in alto,
// ripara e bomba come icone in basso a destra. Non conosce le regole: riceve già decisi posti, prezzi e cosa si
// può fare. Il dito non è un mouse: niente di piccolo da toccare.
import { ref, computed, onMounted } from 'vue'
import Scelta from './Scelta.vue'

const props = defineProps({
  cruscotto: { type: Object, required: true },
  pannello: { type: Object, required: true },     // { bersagli: [], anello: null | {...}, azioni: [] }
  avviso: { type: String, default: '' },
  dritta: { type: Boolean, default: true },        // «tocca una piazzola»
})
const emit = defineEmits(['tela', 'scegli', 'dettagli', 'tocca', 'anello', 'chiudiAnello', 'costruisci'])
const tela = ref(null)
onMounted(() => emit('tela', tela.value))

const orologio = computed(() => {
  // la battaglia infinita non ha un timer: l'orologio conta quanto si resiste
  const c = props.cruscotto
  const s = Math.max(0, c.infinita ? Math.floor(c.t) : Math.ceil(c.resto))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})
const ICONA = { ripara: '🔧', bomba: '💣' }
const NOME = { ripara: 'Ripara', bomba: 'Bomba' }
const px = v => `${Math.round(v)}px`
</script>

<template>
  <div class="ar-campo">
    <div class="ar-hud em">
      <span class="ar-gettone">{{ cruscotto.infinita ? '♾️' : '⏱️' }} <b>{{ orologio }}</b></span>
      <span class="ar-gettone ar-borsa" data-monete>💎 <b>{{ cruscotto.monete }}</b> <i>+{{ cruscotto.alSecondo.toFixed(1) }}/s</i></span>
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

      <!-- la nuvoletta di una piazzola libera: il disegno delle truppe e il prezzo -->
      <Scelta v-if="pannello.scelta" :s="pannello.scelta" @costruisci="id => emit('costruisci', id)"
              @dettagli="d => emit('dettagli', d)" />

      <!-- l'anello attorno all'edificio toccato: potenzia, vendi (due tocchi), il «?» dei numeri -->
      <div v-if="pannello.anello" class="ar-anello" :style="{ left: px(pannello.anello.x), top: px(pannello.anello.y) }">
        <button v-for="v in pannello.anello.voci" :key="v.chiave" class="ar-voce em"
                :class="{ 'ar-no': !v.puoi, 'ar-piccola': v.piccola, 'ar-sicuro': v.sicuro }" :data-anello="v.chiave"
                :aria-label="v.chiave" @click.stop="emit('anello', v.chiave)">
          <svg v-if="v.chiave === 'potenzia' && !v.testo.startsWith('💤')" class="ar-freccia" viewBox="0 0 34 34" aria-hidden="true">
            <defs><linearGradient id="ar-fr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9af06a"/><stop offset="1" stop-color="#2fa84a"/></linearGradient></defs>
            <path d="M17 3 L30 16 H22 V20 H12 V16 H4 Z" fill="url(#ar-fr)" stroke="#1d6b2a" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M17 18 L28 29 H6 Z" fill="url(#ar-fr)" stroke="#1d6b2a" stroke-width="1.6" stroke-linejoin="round"/>
          </svg>
          <span v-else class="ar-voce-icona">{{ v.icona }}</span>
          <span v-if="v.testo" class="ar-voce-testo">{{ v.testo }}</span>
        </button>
      </div>

      <!-- ripara e bomba: due icone tonde in basso a destra, il prezzo (o l'attesa) in un cartellino -->
      <div class="ar-azioni">
        <button v-for="a in pannello.azioni" :key="a.azione" class="ar-azione-tonda"
                :class="{ 'ar-no': !a.puoi }" :data-azione="a.azione" :aria-label="NOME[a.azione]"
                @click.stop="emit('scegli', { azione: a.azione })">
          <span class="ar-info em" role="button" aria-label="dettagli" :data-dettagli="a.azione"
                @click.stop="emit('dettagli', { azione: a.azione })">?</span>
          <span class="ar-icona em">{{ ICONA[a.azione] }}</span>
          <span class="ar-prezzo em">
            <template v-if="a.azione === 'bomba'">{{ a.attesa && !a.puoi ? a.attesa + ' s' : 'gratis' }}</template>
            <template v-else-if="a.prezzo === null">—</template>
            <template v-else>{{ a.prezzo }} 💎</template>
          </span>
        </button>
      </div>

      <div v-if="avviso" class="ar-avviso em" data-avviso>{{ avviso }}</div>
      <div v-else-if="dritta" class="ar-dritta em">👆 tocca una piazzola o il castello</div>
    </div>

  </div>
</template>
