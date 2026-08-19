<script setup>
/* La faccia di una roba del granaio: il grano, il foraggio, la lana.

   Sta a parte perché la stessa faccia deve comparire uguale in quattro
   posti che raccontano la stessa cosa — lo scaffale del silo, i tasti
   di una macchina, le colture di un campo, la ciotola di una bestia — e
   una figura che cambia da un pannello all'altro fa sembrare due merci
   quello che è una merce sola. È il fratello di `Provino.vue`, che fa
   lo stesso lavoro per le cose del baule.

   ── UN DISEGNO SE C'È, L'EMOJI SE NO ──────────────────────────────
   Un'emoji la disegna il telefono: in mezzo a uno schermo dipinto a
   mano ha lo stile di Apple, non si tinge dell'ambiente e a venti pixel
   dentro un fumetto non si distingue da un'altra emoji della stessa
   tinta. Quindi una merce dichiara il suo `pezzo` dell'atlante
   (`dati/coltivazioni.js`) e qui si disegna quello.

   L'emoji resta il **ripiego dichiarato**, e oggi non la usa nessuno:
   tutte e quattordici le merci hanno la loro figura. Il ripiego non si
   toglie per questo — è quello che permette di aggiungere una merce
   nuova *prima* del suo disegno, invece di aspettare un foglio per
   scrivere una riga di tabella. Una merce senza faccia si vede subito,
   ed è il verso giusto in cui sbagliare. */
import { computed } from 'vue'
import { PRODOTTI } from '../dati/coltivazioni.js'
import Provino from './Provino.vue'

const props = defineProps({
  /* la chiave di `PRODOTTI` — `'grano'`, `'foraggio'` */
  merce: { type: String, required: true },
  lato: { type: Number, default: 34 },
})

const r = computed(() => PRODOTTI[props.merce] || { nome: props.merce, emoji: '📦' })
</script>

<template>
  <Provino v-if="r.pezzo" class="fa-merce" :pezzo="r.pezzo" :lato="lato" :aria="1" />
  <span v-else class="fa-merce fa-merce-emoji"
        :style="{ width: lato + 'px', height: lato + 'px',
                  fontSize: Math.round(lato * 0.7) + 'px' }">{{ r.emoji }}</span>
</template>
