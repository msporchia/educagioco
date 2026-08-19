<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CARRETTO DEL VICINO — LA SCHERMATA

   Due passi e non uno di più: **cosa gli dai**, e **cosa ti dà**. In
   mezzo non c'è nessuna conferma, perché non si spende niente e non si
   perde niente che non fosse già in eccesso.

   ── LA RIGA CHE CAMBIA TUTTO È LA PRIMA ───────────────────────────
   Chi apre questo foglio ci arriva in due stati diversi, e la schermata
   deve accorgersene: chi ha uno scomparto colmo è **venuto a
   sbloccarsi** e va portato lì in una mossa; chi non ne ha nessuno è
   passato per curiosità, e va spiegato cos'è questo posto. La stessa
   frase per tutti e due sarebbe muta per il primo e incomprensibile per
   il secondo.

   ── QUELLO CHE NON SI DICE MAI ────────────────────────────────────
   «Butta». Il vicino **prende**, e se non ha niente da darti in cambio
   ringrazia. La differenza fra le due parole è tutta la differenza fra
   sprecare il proprio lavoro e regalarlo, e in una fattoria dove niente
   marcisce è l'unico posto in cui la roba può uscire dalle mani di un
   bambino: quindi deve uscirne bene.

   Non sa niente del profilo: riceve cosa si può dare e cosa si può
   ricevere, già decisi da `motore/vicino.js`.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { PRODOTTI } from '../dati/coltivazioni.js'
import { DAI, RICEVI } from '../motore/vicino.js'
import Merce from './Merce.vue'

const props = defineProps({
  /* `[{ prodotto, quanti, colmo }]` — quello di cui hai almeno cinque */
  puoiDare: { type: Array, default: () => [] },
  /* `[{ prodotto, quanti }]` per la merce scelta: quello che ci sta
     ancora ed è già stato sbloccato. Vuoto vuol dire che resta solo il
     regalo, ed è uno stato normale, non un errore. */
  offerte: { type: Array, default: () => [] },
  /* quante merci hanno lo scomparto colmo: decide di cosa parla la
     prima riga */
  colmi: { type: Number, default: 0 },
  /* la merce scelta al primo passo, tenuta da chi apre il foglio
     perché è lui a dover ricalcolare le offerte */
  scelto: { type: String, default: '' },
})
const emit = defineEmits(['scegli', 'scambia', 'regala', 'chiudi'])

const roba = k => PRODOTTI[k] || { nome: k, emoji: '📦' }
const dato = computed(() => props.scelto ? roba(props.scelto) : null)
/* Quello che si sta per dare, se c'è: serve a scrivere «5 🌽» invece di
   «cinque cose», che a sei anni è un'altra frase. */
const troppo = computed(() => props.puoiDare.filter(r => r.colmo))
</script>

<template>
  <div class="fa-foglio">
    <h2>Il carretto del vicino</h2>

    <!-- ── primo passo: cosa gli dai ── -->
    <template v-if="!scelto">
      <p v-if="colmi">Il vicino passa a ritirare quello che ti avanza.
         Dagli <b>{{ DAI }}</b> di una cosa e te ne dà <b>{{ RICEVI }}</b>
         di un'altra: ci perdi, ma ti libera il posto.</p>
      <p v-else>Il vicino ti dà una mano quando hai troppo di una cosa
         sola: gliene dai <b>{{ DAI }}</b> e te ne dà <b>{{ RICEVI }}</b>
         di un'altra. Conviene solo quando non sai più dove metterla.</p>

      <!-- **Nessuna di queste è spenta**, e non deve sembrarlo: sono
           tutte cose che il vicino prende. Erano segnate `altrui` —
           la classe del cibo che una bestia rifiuta, scritta in rosso —
           e quel rosso qui diceva una bugia: si leggeva «non hai i
           requisiti» su un tasto che funziona benissimo. Quello colmo
           si segna in **oro**, che è la tinta con cui il silo segna uno
           scomparto pieno e vuol dire «guarda qui». -->
      <div v-if="puoiDare.length" class="fa-nomi">
        <button v-for="r in puoiDare" :key="r.prodotto"
                :class="['fa-cibo', 'grande', r.colmo ? 'colma' : '']"
                @click="emit('scegli', r.prodotto)">
          <Merce :merce="r.prodotto" :lato="40" />
          <span>{{ roba(r.prodotto).nome }}</span>
          <u>ne hai {{ r.quanti }}{{ r.colmo ? ' · pieno' : '' }}</u>
        </button>
      </div>
      <p v-else class="fa-piccolo">Per adesso non hai <b>{{ DAI }}</b> pezzi
         di niente: il vicino ritira solo quando ti avanza qualcosa. Torna
         quando un raccolto non ci sta più.</p>
      <p v-if="troppo.length && puoiDare.length" class="fa-piccolo">
         Quello con scritto <b>pieno</b> è quello che ti sta bloccando.</p>
    </template>

    <!-- ── secondo passo: cosa ti dà ── -->
    <template v-else>
      <p><b>{{ DAI }} {{ dato.emoji }} {{ dato.nome.toLowerCase() }}</b>
         al vicino. Cosa vuoi in cambio?</p>
      <div v-if="offerte.length" class="fa-nomi">
        <button v-for="r in offerte" :key="r.prodotto" class="fa-cibo grande suo"
                @click="emit('scambia', r.prodotto)">
          <Merce :merce="r.prodotto" :lato="40" />
          <span>{{ roba(r.prodotto).nome }}</span>
          <u>{{ r.quanti ? 'ne hai ' + r.quanti : 'non ne hai' }}</u>
        </button>
      </div>
      <!-- Nessuna offerta: non è un errore ed è importante che non lo
           sembri. Il vicino la prende lo stesso, e ringrazia. -->
      <p v-else class="fa-piccolo">Adesso non ha niente da darti in cambio:
         hai già tutto, o quello che potrebbe darti non ci starebbe. Se
         vuoi se lo prende lo stesso — ti ringrazia, e tu hai il posto
         libero.</p>
    </template>

    <div class="fa-fila">
      <button class="fa-bot piano" @click="scelto ? emit('scegli', '') : emit('chiudi')">
        {{ scelto ? 'Indietro' : 'Chiudi' }}</button>
      <button v-if="scelto" class="fa-bot" @click="emit('regala')">
        Regalaglielo</button>
    </div>
  </div>
</template>
