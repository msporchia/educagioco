<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL VELO DELLA PAUSA — uno solo per tutti i giochi

   Copre tutto, **barra compresa**, e si toglie con un tocco qualunque.
   Copre anche la barra apposta: in pausa non c'è niente da fare se non
   ripartire o uscire, e un ⏸ ancora premibile sotto il velo è un tasto
   che non fa niente. Chi vuole uscire tocca, e poi tocca «indietro»
   come sempre.

   Il contratto sta in `giochi/pausa.js`: qui dentro non si decide
   nulla, si mostra che il gioco è fermo. Due sole accortezze.

   **La finestra cieca** (`CIECA`, la stessa della domanda). Il dito che
   ha premuto ⏸ si lascia dietro un `click` che arriva a chi sta sotto
   in quel momento — cioè a questo velo, appena comparso, che si
   toglierebbe da solo. Col mouse non succede, perché lì il bersaglio si
   decide alla pressione: è il motivo per cui questi guasti si vedono
   solo dal telefono.

   **L'attesa non si dice.** Trecentoventi millisecondi non sono
   un'attesa da annunciare con una barretta che si riempie: sono meno
   del tempo che ci mette il velo a entrare, e il velo che entra È il
   segnale. La regola «l'attesa si vede» vale per i secondi interi (il
   respiro dopo uno sbaglio), non per un battito di ciglia.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, onMounted, onUnmounted } from 'vue'
import { CIECA } from './pausa.js'

defineProps({
  /* Cosa si stava facendo, se il gioco vuole dirlo: «tappa 3 · 240 m».
     Non serve a giocare — serve a riconoscere la partita che si ritrova
     in mano dopo mezz'ora, che è il momento in cui questo velo compare
     più spesso. */
  dove: { type: String, default: '' },
})
const emit = defineEmits(['riprendi'])

const pronto = ref(false)
let cieca = 0
onMounted(() => { cieca = setTimeout(() => { pronto.value = true }, CIECA) })
onUnmounted(() => clearTimeout(cieca))

function riprendi() {
  if (!pronto.value) return
  emit('riprendi')
}
</script>

<template>
  <!-- il tocco si prende **sul velo** e non sul tasto: il tasto è lì per
       dire dove guardare e per la tastiera, ma quello che si tocca sul
       telefono è tutto lo schermo. Un click sul tasto sale fin qui, e
       così la mano che lo gestisce resta una sola. -->
  <div class="pa-velo" data-pausa :class="{ pronto }" @click="riprendi">
    <div class="pa-foglio">
      <!-- le due stanghette sono disegnate, non scritte: ⏸ grande è un
           riquadro blu pieno (il telefono lo disegna con la sua font a
           colori) e in mezzo a una schermata sfocata sembra il tasto di
           un'altra applicazione -->
      <div class="pa-segno" aria-hidden="true"><i></i><i></i></div>
      <h2>In pausa</h2>
      <div v-if="dove" class="pa-dove">{{ dove }}</div>
      <button type="button" class="bottone" data-azione="riprendi">
        <span class="em">▶</span> tocca per continuare
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Sopra tutto quello che un gioco mette in scena (i veli dei giochi
   stanno fra 5 e 40, quelli di casa fra 60 e 80, il foglio del `?` a
   120) e sotto il 200 del cartello «gira il telefono», che vince sempre
   su tutto. Sopra il foglio del `?` perché la pausa è lo stato più
   esterno: se il telefono si posa col foglio aperto, quello che si
   ritrova davanti è la pausa, e dietro c'è ancora il foglio. */
.pa-velo { position:fixed; inset:0; z-index:130; display:flex;
           align-items:center; justify-content:center; padding:18px;
           background:#131a2ad9; backdrop-filter:blur(3px);
           animation:pa-entra .18s ease-out; cursor:pointer }
@keyframes pa-entra { from { opacity:0 } }
.pa-foglio { display:flex; flex-direction:column; align-items:center; gap:10px;
             text-align:center; color:#eef2fa }
.pa-segno { display:flex; gap:clamp(7px,2.4vw,11px); align-items:center }
.pa-segno i { display:block; width:clamp(13px,4vw,18px); height:clamp(40px,12vw,56px);
              border-radius:5px; background:#eef2fa; box-shadow:0 3px 12px #0006 }
.pa-foglio h2 { color:#eef2fa; font-size:clamp(22px,6vw,28px) }
.pa-dove { font-size:14px; color:#b9c6e6 }
/* il tasto non è premibile finché il velo è cieco, e si vede: un tasto
   che c'è ma non risponde è la cosa che fa toccare tre volte */
.pa-foglio .bottone { margin-top:6px; opacity:.45; transition:opacity .18s ease }
.pa-velo.pronto .bottone { opacity:1 }
.pa-foglio .em { font-style:normal }
</style>
