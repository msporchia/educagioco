<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL MERCATO — CHI VUOLE COSA

   Tre ordini, uno sotto l'altro, e per ognuno una domanda sola: **ce
   l'ho?** La risposta non è un numero da confrontare con un altro
   numero: sono **caselle**, una per pezzo che serve, accesa se quel
   pezzo ce l'hai. È lo stesso disegno delle ricette delle macchine
   (`viste/Macchina.vue`), e per la stessa ragione — «3 → 2» è una
   formula, e leggere è la cosa che qui non si può dare per scontato.
   Tre caselle di grano con due accese non si leggono, si guardano.

   ── COSA SI VEDE, E IN CHE ORDINE ─────────────────────────────────
   Chi ordina (la faccia e il mestiere: «il fornaio» dice da solo
   perché vuole del grano), cosa vuole, quanto rende, e il tasto. In
   fondo a ogni ordine il ✕ per rifiutarlo, piccolo e in disparte:
   rifiutare è una cosa che si fa ogni tanto, consegnare è quella per
   cui si è venuti.

   ── IL PREMIO È UNA ⭐, NON UNA 🪙 ────────────────────────────────
   E va detto perché si nota: **il mercato non paga monete**. Le monete
   si guadagnano facendo esercizi negli altri giochi, e un banco che
   comprasse il grano chiuderebbe l'anello — il perché per esteso sta
   in `dati/mercato.js`. Quello che dà è esperienza, cioè il livello
   della fattoria, cioè roba nuova nel baule. Perciò il numero porta la
   stessa ⭐ del gettone in alto: chi lo vede sa già dove va a finire.

   Non sa niente del profilo né del granaio: riceve gli ordini già
   contati da `motore/mercato.js` (`bancoDi`) e manda fuori `consegna`
   e `rifiuta`.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { RIPOSO_MIN } from '../dati/mercato.js'
import Merce from './Merce.vue'

const props = defineProps({
  /* `[{ id, cliente, righe, xp, minuti, pronto }]` — vedi `bancoDi` */
  ordini: { type: Array, default: () => [] },
  /* `[{ minuti }]`: i posti che stanno riposando dopo un rifiuto */
  riposi: { type: Array, default: () => [] },
})
const emit = defineEmits(['consegna', 'rifiuta', 'chiudi'])

const pronti = computed(() => props.ordini.filter(o => o.pronto).length)

/* Le caselle di una riga: una per pezzo che serve, accesa se ce l'hai.
   Si compone qui e non nel motore perché è **disegno**: il motore dice
   quanti ne servono e quanti ne hai, e da lì in poi è una fila di
   quadratini. */
const caselle = riga => Array.from({ length: riga.serve },
                                   (_, i) => ({ piena: i < riga.hai }))
</script>

<template>
  <div class="fa-foglio fa-mercato" data-mercato>
    <h2>Il mercato</h2>

    <!-- La prima riga cambia con lo stato, come nel carretto del
         vicino: chi ha qualcosa da consegnare è venuto a consegnare, e
         va portato lì in una mossa; chi non ha niente è passato di qui
         e va spiegato cos'è questo posto. La stessa frase per tutti e
         due sarebbe muta per il primo e incomprensibile per il
         secondo. -->
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
          <!-- Rifiutare costa **tempo**: il posto resta vuoto per
               cinque minuti veri. Sta scritto sul tasto, perché una
               cosa che si scopre dopo averla premuta è una trappola. -->
          <button class="fa-bot piano piccolo" data-azione="rifiuta"
                  :title="`ne arriva un altro fra ${RIPOSO_MIN} minuti`"
                  @click="emit('rifiuta', o.id)">✕ non mi va</button>
          <button class="fa-bot forte" data-azione="consegna"
                  :disabled="!o.pronto" @click="emit('consegna', o.id)">
            Consegna</button>
        </div>
        <!-- Un tasto spento dice sempre **cosa manca**, come in tutto il
             resto del gioco: è il numero che rimanda a coltivare. -->
        <p v-if="!o.pronto" class="fa-piccolo fa-manca">
          <span>Ti {{ o.righe.filter(r => !r.pieno).length > 1
                      ? 'servono ancora' : 'serve ancora' }}</span>
          <b v-for="r in o.righe.filter(r => !r.pieno)" :key="r.prodotto">
            {{ r.serve - r.hai }}
            <Merce :merce="r.prodotto" :lato="20" />
            {{ r.nome.toLowerCase() }}</b>
        </p>
      </div>
    </div>

    <!-- Un posto che riposa non è un buco: dice fra quanto torna. Senza
         questa riga il banco sembrerebbe più piccolo di com'è, e chi ha
         appena rifiutato non saprebbe di aver pagato con l'attesa. -->
    <p v-for="(r, i) in riposi" :key="i" class="fa-piccolo" data-riposo>
      Un altro ordine arriva fra <b>{{ r.minuti }}</b>
      {{ r.minuti === 1 ? 'minuto' : 'minuti' }}.</p>

    <div class="fa-fila">
      <button class="fa-bot" @click="emit('chiudi')">Chiudi</button>
    </div>
    <p class="fa-piccolo">Consegnare non dà monete: quelle si guadagnano
       negli altri giochi. Dà <b>esperienza</b>, cioè livelli — e i
       livelli aprono roba nuova nel baule.</p>
  </div>
</template>
