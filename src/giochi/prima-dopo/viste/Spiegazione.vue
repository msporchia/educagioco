<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA SPIEGAZIONE — cosa succede quando si sbaglia

   C'era prima un lampo: la fila giusta prendeva il posto della
   striscia, settecento millisecondi, e si riprovava. Era già il
   rimedio a qualcosa di peggio (un replay da quattro secondi che
   ripeteva quello che si vedeva già), ma sbagliava dall'altra parte:
   settecento millisecondi non bastano nemmeno a **guardare** tre
   disegni, figurarsi a capire perché quello che si era messo non
   andava. Il bambino vedeva le vignette cambiare posto da sole e
   ritrovarsi davanti la stessa domanda, senza aver imparato niente.

   Adesso l'errore apre un foglio, e il foglio dice tre cose:
     1. **qual era la storia**, un passo per riga e in grande — è
        l'unico momento del gioco in cui i disegni si vedono davvero,
        e per questo la fila qui si legge dall'alto in basso invece
        che da sinistra a destra: in colonna un riquadro sta largo
        quanto un terzo di schermo invece che un nono.
     2. **cosa c'è scritto sotto ogni disegno**, che letto di fila fa
        una frase — «prima il seme, poi si annaffia, infine il
        girasole». Le didascalie stanno in `dati/didascalie.js`: non
        servono a giocare (a quattro anni non si legge), servono al
        grande che sta lì a leggerle ad alta voce.
     3. **dov'era lo sbaglio**: la riga che si chiedeva è marcata, e
        quello che si era scelto per sbaglio si vede lì sotto.

   Il tempo non lo decide più un `setTimeout` da mezzo secondo: si
   resta finché non si dice «ho capito», e se non lo dice nessuno il
   foglio si chiude da sé dopo `DURATA`. La barra sotto fa vedere
   quanto manca — due secondi muti sono indistinguibili da un tasto
   rotto — e il tasto non si lascia premere nei primi 320 ms, perché
   il dito che ha appena sbagliato è ancora in aria e questo foglio
   compare proprio dove stava premendo.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, onMounted, onUnmounted } from 'vue'
import Passo from './Passo.vue'
import { didascalia, ordinale } from '../dati/didascalie.js'

const props = defineProps({
  /* già masticata da `motore/quesito.js`: qui non si sa cosa sia un
     quesito, e nemmeno che ce ne siano tre tipi */
  spiega: { type: Object, required: true },
})
const emit = defineEmits(['avanti'])

const CIECA = 320          // quanto resta insensibile al tocco appena comparsa
const DURATA = 7000        // e quanto resta a schermo se non la chiude nessuno

const cieca = ref(true)
let apertura = 0
let scadenza = 0

onMounted(() => {
  apertura = setTimeout(() => { cieca.value = false }, CIECA)
  scadenza = setTimeout(() => emit('avanti'), DURATA)
})
onUnmounted(() => { clearTimeout(apertura); clearTimeout(scadenza) })

function avanti() {
  if (cieca.value) return
  emit('avanti')
}
</script>

<template>
  <div class="pd-velo" data-spiega="1">
    <div class="pd-cartello pd-spiega">
      <h2>La storia era questa</h2>
      <p class="pd-nome">{{ spiega.titolo }}</p>

      <ol class="pd-passi">
        <li v-for="(p, i) in spiega.passi" :key="i"
            :class="{ 'pd-chiave': i === spiega.buco,
                      'pd-storto': spiega.esatti && !spiega.esatti[i] }">
          <span class="pd-num">{{ i + 1 }}</span>
          <div class="pd-riquadro em"><Passo :passo="p" /></div>
          <span class="pd-frase">
            <b>{{ ordinale(i, spiega.passi.length) }}</b> {{ didascalia(p) }}
          </span>
        </li>
      </ol>

      <!-- l'opzione sbagliata che si era toccata: non c'entrava con la
           storia, quindi non ha una riga sua — si fa vedere qui sotto,
           piccola, accanto a quello che è davvero -->
      <p v-if="spiega.scelta && spiega.buco !== null" class="pd-fuori">
        <span class="em">❌</span>
        <span class="pd-mini em"><Passo :passo="spiega.scelta" /></span>
        <span>{{ didascalia(spiega.scelta) }} non c'entra</span>
      </p>
      <p v-else-if="spiega.intruso" class="pd-fuori">
        <span class="em">❌</span>
        <span class="pd-mini em"><Passo :passo="spiega.intruso" /></span>
        <span>{{ didascalia(spiega.intruso) }} era di un'altra storia</span>
      </p>

      <button class="pd-grosso" :disabled="cieca" @click="avanti">
        <span class="em">👍</span> ho capito
      </button>
      <div class="pd-attesa"><i :style="{ animationDuration: DURATA + 'ms' }"></i></div>
    </div>
  </div>
</template>
