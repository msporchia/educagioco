<script setup>
/* Una bottega del paese, sorella di viste/Mercato.vue: un cliente vuole una cosa sola, i cuori
   della fama, un bancone vuoto dice fra quanto torna — vedi docs/fattoria/chi-chiede.md. */
import { computed } from 'vue'
import { ATTESA_MIN, ATTESA_MAX, BANCONI_MAX } from '../dati/botteghe.js'
import Merce from './Merce.vue'
import Chiudi from './Chiudi.vue'

const props = defineProps({
  // {id, nome, fama:{banconi,cuori,di,piena}, banconi:[...]} — vedi bottegaDi
  bottega: { type: Object, required: true },
})
const emit = defineEmits(['consegna', 'rifiuta', 'chiudi', 'albero'])

const clienti = computed(() => props.bottega.banconi.filter(b => b.cliente))
const attese = computed(() => props.bottega.banconi.filter(b => !b.cliente))
</script>

<template>
  <div class="fa-foglio fa-mercato fa-bottega" data-bottega :data-bottega-id="bottega.id">
    <Chiudi @chiudi="$emit('chiudi')" />
    <h2>{{ bottega.nome }}</h2>

    <!-- La fama: cinque cuori; ogni consegna è un cuore, a cinque arriva un bancone in più. -->
    <div class="fa-fama" data-fama :data-cuori="bottega.fama.cuori"
         :title="bottega.fama.piena ? `${BANCONI_MAX} banconi: è famosa`
                                    : `a ${bottega.fama.di} cuori arriva un altro bancone`">
      <span class="fa-cuori">
        <span v-for="i in bottega.fama.di" :key="i"
              :class="['fa-cuore', { pieno: i <= bottega.fama.cuori }]">
          {{ i <= bottega.fama.cuori ? '❤️' : '🤍' }}</span>
      </span>
    </div>

    <!-- Come al mercato: un foglietto per cliente, la roba grande col 0/2, quella che manca si tocca. -->
    <div class="fa-bacheca">
      <div v-for="(b, n) in clienti" :key="b.cliente.id" class="fa-foglietto"
           :class="{ pronto: b.cliente.pronto }" :style="{ '--piega': (n % 2 ? 1.2 : -1.2) + 'deg' }"
           :data-cliente="b.cliente.id">
        <i class="fa-puntina"></i>
        <b class="fa-cliente" :title="b.cliente.cliente.nome">{{ b.cliente.cliente.emoji }}</b>
        <button v-for="r in b.cliente.righe" :key="r.prodotto" type="button"
                :class="['fa-chiesta', { piena: r.pieno }]"
                :data-albero-apri="r.pieno ? null : r.prodotto"
                :disabled="r.pieno" @click="emit('albero', r.prodotto)">
          <Merce :merce="r.prodotto" :lato="50" />
          <span><b>{{ r.hai }}</b>/{{ r.serve }}</span>
        </button>
        <em class="fa-premio-xp">⭐ {{ b.cliente.xp }}</em>
        <div class="fa-foglietto-tasti">
          <!-- "Non mi va" costa quanto consegnare: stesso tempo d'attesa. -->
          <button type="button" class="fa-butta" data-azione="rifiuta" aria-label="non mi va"
                  :title="`il prossimo arriva fra ${ATTESA_MIN}–${ATTESA_MAX} minuti`"
                  @click="emit('rifiuta', b.cliente.id)">🗑</button>
          <button type="button" class="fa-bot forte piccolo" data-azione="consegna"
                  :disabled="!b.cliente.pronto" @click="emit('consegna', b.cliente.id)">✓</button>
        </div>
      </div>

      <!-- Un bancone vuoto: il foglietto dice fra quanto arriva qualcuno, il motivo per tornare. -->
      <div v-for="b in attese" :key="'a' + b.i" class="fa-foglietto vuoto" data-attesa>
        <i class="fa-puntina"></i>
        <b class="fa-cliente">⏳</b>
        <span class="fa-fra">{{ b.minuti > 0 ? `${b.minuti} min` : 'arriva!' }}</span>
      </div>
    </div>
  </div>
</template>
