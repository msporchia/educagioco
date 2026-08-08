<script setup>
/* ═══════════════════════════════════════════════════════════════════
   PROVA UNA VOCE — la palestra dei poc, dentro la schermata dei grandi.

   Un genitore che deve decidere se spegnere «Metri, litri e chili» ha
   davanti tre righe di spiegazione e un interruttore. Non basta: la
   domanda che sparisce la immagina, e a naso si spegne troppo o non si
   spegne niente. Qui invece la domanda arriva davvero — la stessa che
   riceverebbe il bambino, generata dallo stesso modulo — e si può
   rispondere, sbagliare e leggere il perché.

   È la palestra di `poc/quiz-*.html` con due differenze, tutte e due
   volute. Là si prova un MODULO a raffica, per vedere se le domande
   sono belle; qui si prova UNA VOCE — un gruppo di sapere o una singola
   tipologia — perché la domanda che il genitore ha in mente è «cosa
   perdo se spengo questa?». E là le domande si rincorrono da sole,
   perché chi prova un modulo ne vuole venti di fila; qui una alla
   volta, col tasto per chiederne un'altra: chi è entrato voleva
   decidere, non giocare.

   NON DECIDE NIENTE. Riceve una chiave, mostra le sue domande, e quando
   si chiude non ha toccato né il profilo né i progressi: l'interruttore
   sta sulla carta di fuori, ed è giusto che stia lì. Provare e spegnere
   sono due gesti diversi e restano due tasti diversi.

   La domanda la mette in scena `Domanda.vue`, la stessa dei giochi: i
   disegni (l'orologio, la figura da specchiare, i quadretti), le emoji
   e il «Era questa» col perché vengono da lì senza una riga in più. Se
   quella cambia, cambia anche qui — che è esattamente quello che si
   vuole, perché la promessa di questo pannello è «è la domanda vera».
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onMounted } from 'vue'
import Domanda from './Domanda.vue'
import { esempioDi } from './saperi.js'

const props = defineProps({
  /* la voce da provare: un gruppo (`misure`) o una tipologia
     (`orto:apostrofo`). Per chi genera sono la stessa cosa. */
  chiave: { type: String, required: true },
  /* come si chiama, con le parole della carta da cui si è arrivati */
  nome: { type: String, default: '' },
})
defineEmits(['chiudi'])

const esempio = ref(null)
/* la chiave del `v-if`, non un punteggio: cambiarla rimonta la scheda,
   ed è l'unico modo perché la domanda dopo riparta pulita — canvas
   compresi. Quante ne ha fatte non interessa a nessuno: qui non si
   tiene il conto di niente, si guarda. */
const giro = ref(0)
const risposto = ref(false)

/* dove si è finiti: il modulo, il grado e cosa si chiede lì.
   L'ultimo pezzo si tace quando ripete il nome della voce — una
   tipologia si chiama come la riga che la descrive, e «La lettera h ·
   Ortografia grado 5 · La lettera h» è solo rumore. */
const dove = computed(() => {
  const e = esempio.value
  if (!e) return ''
  const coda = e.dice && e.dice !== props.nome ? ` · ${e.dice}` : ''
  return `${e.titolo} · grado ${e.grado}${coda}`
})

function unAltra() {
  esempio.value = esempioDi(props.chiave)
  risposto.value = false
  giro.value++
}

onMounted(unAltra)
</script>

<template>
  <div class="prova-velo" data-prova>
    <div class="prova-testa">
      <div class="prova-chi">
        <b>{{ nome || chiave }}</b>
        <!-- il modulo che la fa e il grado: serve a un grande per
             capire che la stessa voce esce in posti diversi -->
        <i v-if="esempio">{{ dove }}</i>
      </div>
      <button type="button" class="prova-x" aria-label="basta" @click="$emit('chiudi')">✕</button>
    </div>

    <div class="prova-palco">
      <Domanda v-if="esempio" :key="giro" :domanda="esempio.domanda" :pittori="esempio.pittori"
               :respiro="600" @risposto="risposto = true" />
      <!-- non dovrebbe succedere: il tasto per arrivare qui compare
           solo dove `siPuoProvare` è vero. Se succede lo dice, invece
           di lasciare un rettangolo nero. -->
      <p v-else class="prova-niente">Di questa voce non c'è nessuna domanda da mostrare.</p>
    </div>

    <div class="prova-piede">
      <button type="button" class="prova-altra" @click="unAltra">
        {{ risposto ? "Un'altra" : 'Cambiala' }}
      </button>
      <button type="button" class="prova-fine" @click="$emit('chiudi')">Basta</button>
    </div>
  </div>
</template>

<style scoped>
/* fisso e sopra tutto: si è entrati per guardare una cosa sola, e la
   schermata dei genitori sotto non deve poter scorrere via */
.prova-velo {
  position: fixed; inset: 0; z-index: 60;
  display: flex; flex-direction: column;
  background: radial-gradient(120% 80% at 50% 0%, #1d2a4a 0%, #0d1220 60%, #080b14 100%);
  color: #e8edf7; text-align: left;
  padding: max(10px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
}
.prova-testa { display: flex; align-items: flex-start; gap: 10px; padding: 4px 2px 10px }
.prova-chi { flex: 1; min-width: 0 }
.prova-chi b { display: block; font-size: 16px; font-weight: 800 }
.prova-chi i {
  display: block; font-style: normal; font-size: 12px; color: #93a0bd;
  margin-top: 2px; overflow-wrap: anywhere;
}
.prova-x {
  flex: none; width: 40px; height: 40px; border-radius: 12px; cursor: pointer;
  border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.06);
  color: #e8edf7; font: inherit; font-size: 17px;
}

/* il palco: `relative` perché il velo di `Domanda.vue` è `absolute` e
   si aggancia qui, non al telefono intero. `--qz-h` è l'altezza utile
   che gli si concede — meno di uno schermo, perché testa e piede se ne
   prendono un pezzo — e i disegni si rimpiccioliscono di conseguenza. */
.prova-palco { position: relative; flex: 1; min-height: 0; --qz-h: .82vh }
.prova-niente {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  margin: 0; padding: 20px; text-align: center; color: #93a0bd; font-size: 14px;
}

.prova-piede { display: flex; gap: 10px; padding-top: 12px }
.prova-piede button {
  flex: 1; min-height: 52px; cursor: pointer; border-radius: 16px;
  border: none; font: inherit; font-size: 16px; font-weight: 750;
}
.prova-altra { background: rgba(255,255,255,.1); color: #e8edf7 }
.prova-fine { background: #ffd58a; color: #23272f }
.prova-piede button:active { transform: translateY(2px) }
</style>
