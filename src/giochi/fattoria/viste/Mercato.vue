<script setup>
/* Il mercato: tre ordini, caselle accese per quello che hai (non una formula), il premio è una ⭐
   e non una 🪙 — vedi docs/fattoria/chi-chiede.md e regole.md. Riceve gli ordini già contati
   (bancoDi), non sa niente del profilo. */
import { computed } from 'vue'
import { RIPOSO_MIN } from '../dati/mercato.js'
import Merce from './Merce.vue'
import Chiudi from './Chiudi.vue'

const props = defineProps({
  // [{id, cliente, righe, xp, minuti, pronto}] — vedi bancoDi
  ordini: { type: Array, default: () => [] },
  // [{minuti}]: i posti che stanno riposando dopo un rifiuto
  riposi: { type: Array, default: () => [] },
})
const emit = defineEmits(['consegna', 'rifiuta', 'chiudi', 'albero'])

const pronti = computed(() => props.ordini.filter(o => o.pronto).length)

// Le caselle di una riga: una per pezzo, accesa se ce l'hai (disegno, non del motore).
const caselle = riga => Array.from({ length: riga.serve },
                                   (_, i) => ({ piena: i < riga.hai }))
</script>

<template>
  <div class="fa-foglio fa-mercato" data-mercato>
    <Chiudi @chiudi="$emit('chiudi')" />
    <h2>Il mercato</h2>

    <!-- La prima riga cambia con lo stato: chi ha da consegnare va portato lì, chi no va spiegato. -->
    <p v-if="pronti">Ce n'{{ pronti === 1 ? 'è uno' : 'è ' + pronti }} che puoi
       consegnare adesso: la roba esce dal silo e la fattoria
       <b>cresce di livello</b>.</p>
    <p v-else-if="ordini.length">Chi passa di qui ordina quello che gli
       serve. Portagli quello che chiede e la fattoria <b>cresce di
       livello</b> — al mercato non si vendono cose, si fanno favori.</p>
    <p v-else>Per adesso non è arrivato nessuno. Torna fra poco.</p>

    <div class="fa-ordini">
      <div v-for="o in ordini" :key="o.id" class="fa-ordine"
           :class="{ pronto: o.pronto }" :data-ordine="o.id">
        <div class="fa-chi">
          <b>{{ o.cliente.emoji }}</b>
          <span>{{ o.cliente.nome }} vuole</span>
          <em class="fa-premio-xp">⭐ {{ o.xp }}</em>
        </div>

        <div class="fa-chiede">
          <span v-for="r in o.righe" :key="r.prodotto" class="fa-pezzetto">
            <span class="fa-caselle">
              <span v-for="(c, i) in caselle(r)" :key="i"
                    :class="['fa-casella', { piena: c.piena }]">
                <Merce :merce="r.prodotto" :lato="22" />
              </span>
            </span>
            <u>{{ r.hai }} su {{ r.serve }} · {{ r.nome.toLowerCase() }}</u>
          </span>
        </div>

        <div class="fa-fila">
          <!-- Rifiutare costa tempo: il posto resta vuoto cinque minuti. -->
          <button class="fa-bot piano piccolo" data-azione="rifiuta"
                  :title="`ne arriva un altro fra ${RIPOSO_MIN} minuti`"
                  @click="emit('rifiuta', o.id)">✕ non mi va</button>
          <button class="fa-bot forte" data-azione="consegna"
                  :disabled="!o.pronto" @click="emit('consegna', o.id)">
            Consegna</button>
        </div>
        <!-- Quello che manca si preme: apre l'albero di quella merce. -->
        <p v-if="!o.pronto" class="fa-piccolo fa-manca">
          <span>Ti {{ o.righe.filter(r => !r.pieno).length > 1
                      ? 'servono ancora' : 'serve ancora' }}</span>
          <button v-for="r in o.righe.filter(r => !r.pieno)" :key="r.prodotto"
                  type="button" class="fa-manca-tasto" :data-albero-apri="r.prodotto"
                  @click="emit('albero', r.prodotto)">
            <b>{{ r.serve - r.hai }}
            <Merce :merce="r.prodotto" :lato="20" />
            {{ r.nome.toLowerCase() }}</b> 🌳</button>
        </p>
      </div>
    </div>

    <!-- Un posto che riposa non è un buco: dice fra quanto torna. -->
    <p v-for="(r, i) in riposi" :key="i" class="fa-piccolo" data-riposo>
      Un altro ordine arriva fra <b>{{ r.minuti }}</b>
      {{ r.minuti === 1 ? 'minuto' : 'minuti' }}.</p>

    <p class="fa-piccolo">Consegnare non dà monete: quelle si guadagnano
       negli altri giochi. Dà <b>esperienza</b>, cioè livelli — e i
       livelli aprono roba nuova nel baule.</p>
  </div>
</template>
