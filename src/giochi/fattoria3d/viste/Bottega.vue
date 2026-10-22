<script setup>
// Il foglio di una bottega del paese (pasticceria, osteria, mensa, merceria): un'insegna col colore della bottega, i cuori della fama
// (cinque per un bancone in più, fino a tre) e un foglietto per bancone: chi è (un mestiere), la merce che vuole col conto `ho/serve`, il
// premio in esperienza ⭐ (mai monete), «Consegna» e «Non mi va». Un bancone senza cliente dice fra quanto torna qualcuno. Riceve una
// fotografia già pronta (`motore.vistaBottega()`) e dice cosa si vuole con gli `emit`. Vedi docs/fattoria3d/botteghe.md.
import { computed } from 'vue'
import Faccia from './Faccia.vue'
import ConsiglioRiga from './ConsiglioRiga.vue'
import { ATTESA_MIN, ATTESA_MAX, CUORI, BANCONI_MAX } from '../dati/botteghe.js'
import '../stile-bottega.css'

const p = defineProps({
  bottega: { type: Object, required: true },       // motore.vistaBottega(): { tipo, nome, emoji, stato, fama: { banconi, cuori, di, piena }, banconi, pronti, liv, prezzo }
  messaggio: { type: String, default: '' },        // l'esito dell'ultimo tocco (manca roba, consegnato)
  consiglio: { type: Object, default: null },      // il passo per avere ciò che manca (motore/consiglio.js)
})
defineEmits(['consegna', 'rifiuta', 'chiudi', 'consiglio'])

const dice = computed(() => p.bottega.fama.piena
  ? `Famosa: ${BANCONI_MAX} banconi`
  : `${p.bottega.fama.banconi} ${p.bottega.fama.banconi === 1 ? 'bancone' : 'banconi'} · a ${CUORI} cuori ne arriva un altro`)
const chiusa = computed(() => `Costruisci ${p.bottega.nome.toLowerCase()} dal menu «Costruisci»: costa 🪙 ${p.bottega.prezzo}, arriva al livello ${p.bottega.liv}.`)
</script>

<template>
  <div class="f3-foglio f3-colonna f3-bt" data-f3="bottega" :data-bottega="bottega.tipo" :data-stato="bottega.stato">
    <header class="f3-bt-testa">
      <span class="insegna" aria-hidden="true">{{ bottega.emoji }}</span>
      <div class="titolo">
        <h2>{{ bottega.nome }}</h2>
        <small data-f3="bottega-sotto">{{ bottega.stato === 'aperta' ? dice : 'Non è ancora tua' }}</small>
      </div>
    </header>
    <button class="f3-chiudi f3-bt-x" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>

    <div class="f3-corpo">
      <p v-if="bottega.stato !== 'aperta'" class="f3-messaggio" data-f3="bottega-chiusa">{{ chiusa }}</p>
      <template v-else>
        <div class="f3-bt-fama" data-f3="bottega-fama" :data-cuori="bottega.fama.cuori" :data-banconi="bottega.fama.banconi"
             :aria-label="'cuori ' + bottega.fama.cuori + ' su ' + bottega.fama.di">
          <span v-for="i in bottega.fama.di" :key="i" class="cuore" :class="{ pieno: i <= bottega.fama.cuori }" aria-hidden="true">{{ i <= bottega.fama.cuori ? '❤️' : '🤍' }}</span>
        </div>

        <p v-if="messaggio" class="f3-messaggio" data-f3="bottega-msg">{{ messaggio }}</p>
        <ConsiglioRiga v-if="messaggio && consiglio" :consiglio="consiglio" @fai="a => $emit('consiglio', a)" />

        <div class="f3-bt-banchi">
          <template v-for="b in bottega.banconi" :key="b.i">
            <article v-if="b.cliente" class="f3-bt-banco" :class="{ pronto: b.pronto }" data-f3="bancone" :data-cliente="b.id" :data-pronto="b.pronto">
              <div class="chi">
                <span class="ritratto" aria-hidden="true">{{ b.cliente.emoji }}</span>
                <span class="nome"><b>{{ b.cliente.nome }}</b><span class="premio" data-f3="premio">+{{ b.xp }} ⭐</span></span>
                <button type="button" class="butta" data-f3="bottega-rifiuta" aria-label="non mi va" :title="'il prossimo arriva fra ' + ATTESA_MIN + '–' + ATTESA_MAX + ' minuti'" @click="$emit('rifiuta', b.id)">🗑️</button>
              </div>
              <div class="merci">
                <div v-for="c in b.chiede" :key="c.k" class="merce" :class="c.manca ? 'manca' : 'ok'" :data-chiede="c.k">
                  <Faccia :k="c.k" :emoji="c.emoji" :n="c.n" :lato="52" />
                  <span class="nome-merce">{{ c.nome }}</span>
                  <span class="conto" :class="c.manca ? 'manca' : 'ok'">{{ c.manca ? c.ha + '/' + c.n : '✓' }}</span>
                </div>
              </div>
              <!-- aria-disabled e non disabled: un tasto spento non si tocca, e toccarlo deve dire cosa manca -->
              <button type="button" class="consegna" :class="{ spenta: !b.pronto }" :aria-disabled="!b.pronto" :data-puoi="b.pronto"
                      data-f3="bottega-consegna" @click="$emit('consegna', b.id)"><span aria-hidden="true">🛍️</span> Consegna</button>
            </article>
            <article v-else class="f3-bt-banco attesa" data-f3="bottega-attesa" :data-minuti="b.minuti">
              <span class="ritratto" aria-hidden="true">⏳</span>
              <span class="nome"><b>Posto libero</b><small>{{ b.minuti > 0 ? 'Torna qualcuno fra ' + b.minuti + ' min' : 'Sta arrivando!' }}</small></span>
            </article>
          </template>
        </div>
        <p class="f3-nota">Ogni cliente vuole una cosa sola. Le consegne danno esperienza ⭐, non monete: più ne fai, più cuori ti vuole bene la bottega.</p>
      </template>
    </div>
  </div>
</template>
