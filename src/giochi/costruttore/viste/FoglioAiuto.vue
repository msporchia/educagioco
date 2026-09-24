<script setup>
/* ═══════════════════════════════════════════════════════════════════
   GLI AIUTI — una scala: prima si ragiona, poi si paga

   I gradini scesi restano scritti, uno sotto l'altro, e sotto c'è un
   tasto solo per il prossimo, col suo prezzo **prima** di essere
   premuto (la scala la compone `motore/aiuti.js`, i prezzi stanno in
   `giochi/aiuti.js`):

     🧠 ragiona   gratis   cosa chiede il livello, la domanda giusta
     💡 indizio   🪙10     una cosa concreta
     🧩 pezzo · forma · ✅ soluzione   🪙50 · 100 · 200, e scrivono nel
                 programma al posto di quello che c'è

   Senza monete il tasto c'è, spento, e dice quanto manca. Dai cinquanta
   in su chiede un secondo tocco. Un gradino che scrive, una volta
   pagato, si rimette gratis dalla sua riga.

   Qui non si spende niente: si dice cosa ha toccato il dito, e chi
   compra è il coordinatore.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, watch, onUnmounted } from 'vue'
import { mancano, chiedeConferma, scrive } from '../../aiuti.js'

const props = defineProps({
  fatti: { type: Array, default: () => [] },     // i gradini già scesi
  prossimo: { type: Object, default: null },     // quello che il tasto promette
  monete: { type: Number, default: 0 },
})
const emit = defineEmits(['altro', 'rimetti', 'chiudi'])

const FACCIA = {
  ragiona: { em: '🧠', fatto: 'Ragioniamo', tasto: 'Aiutami a ragionare', ancora: 'Ragioniamoci ancora' },
  indizio: { em: '💡', fatto: 'Indizio', tasto: 'Dammi un indizio', ancora: 'Un altro indizio' },
  pezzo: { em: '🧩', fatto: 'Un pezzo', tasto: 'Scrivimi un pezzo',
           sotto: 'ti metto nel programma un pezzo già fatto' },
  forma: { em: '🧩', fatto: 'La forma', tasto: 'Mettimi la forma',
           sotto: 'tutti i blocchi al loro posto: i numeri, i colori e le domande li scegli tu' },
  svela: { em: '✅', fatto: 'La soluzione', tasto: 'Mostrami la soluzione',
           sotto: 'ti scrivo il programma intero: premi ▶ e guardalo lavorare. La seconda ⭐ resta spenta' },
}
const faccia = p => FACCIA[p && p.che] || FACCIA.indizio
const etichetta = p => (props.fatti.some(a => a.che === p.che) && faccia(p).ancora) || faccia(p).tasto

/* il secondo tocco: il primo arma, e si disarma da solo */
const armato = ref(false)
let disarma = 0
const povero = () => mancano(props.monete, props.prossimo) > 0
function premi() {
  const p = props.prossimo
  if (!p || povero()) return
  if (chiedeConferma(p) && !armato.value) {
    armato.value = true
    clearTimeout(disarma)
    disarma = setTimeout(() => { armato.value = false }, 4000)
    return
  }
  armato.value = false
  clearTimeout(disarma)
  emit('altro')
}
watch(() => props.prossimo, () => { armato.value = false; clearTimeout(disarma) })
onUnmounted(() => clearTimeout(disarma))
</script>

<template>
  <div class="cst-velo" @click.self="emit('chiudi')">
    <div class="cst-foglio" data-foglio-aiuto>
      <button type="button" class="cst-chiudi" aria-label="chiudi" data-chiudi @click="emit('chiudi')">✕</button>
      <h3>💡 Un aiuto</h3>
      <ol class="cst-aiuti">
        <li v-for="(a, k) in fatti" :key="k" class="cst-aiuto" :class="'cst-aiuto-' + a.che" :data-aiuto-fatto="a.che">
          <b>{{ faccia(a).em }} {{ faccia(a).fatto }}</b>
          {{ a.testo || faccia(a).sotto }}
          <button v-if="scrive(a)" type="button" class="cst-rimetti" data-azione="rimetti-aiuto"
                  @click="emit('rimetti', k)">↺ rimettilo nel programma <small>già pagato</small></button>
        </li>
      </ol>

      <button v-if="prossimo" type="button" class="cst-chiedi"
              :class="{ 'cst-gratis': !prossimo.prezzo, 'cst-povero': povero(), 'cst-armato': armato }"
              :disabled="povero()" data-azione="chiedi-aiuto" :data-prezzo="prossimo.prezzo" @click="premi">
        <span class="cst-riga-chiedi">
          <span>{{ faccia(prossimo).em }} {{ armato ? `Sì, pago ${prossimo.prezzo} monete` : etichetta(prossimo) }}</span>
          <span class="cst-prezzo">{{ prossimo.prezzo ? `🪙 ${prossimo.prezzo}` : 'gratis' }}</span>
        </span>
        <small v-if="povero()" data-mancano>Ti servono {{ prossimo.prezzo }} monete e ne hai {{ monete }}: le monete
          si guadagnano finendo i livelli, qui e negli altri giochi.</small>
        <small v-else-if="armato">Tocca ancora per confermare.<template v-if="scrive(prossimo)"> Il programma
          che hai adesso viene sostituito.</template></small>
        <small v-else-if="faccia(prossimo).sotto">{{ faccia(prossimo).sotto }} · hai 🪙 {{ monete }}</small>
        <small v-else-if="prossimo.prezzo">hai 🪙 {{ monete }}</small>
        <small v-else>non ti dico la risposta: ti aiuto a trovarla</small>
      </button>
      <p v-else class="cst-piccolo">Non ho altro da dirti: il resto è tuo.</p>
    </div>
  </div>
</template>

<style scoped>
/* le righe già scese: quelle gratis col verde, quelle che hanno scritto
   col viola, gli indizi col giallo del costruttore */
.cst-aiuto { padding: 7px 9px; border-radius: 10px; background: #f7f1e6; border-left: 4px solid var(--cst-giallo) }
.cst-aiuto b { display: block; font-size: 11px; letter-spacing: .4px; text-transform: uppercase; color: #8a6414 }
.cst-aiuto-ragiona { background: #edf8f0; border-left-color: #3aa76d }
.cst-aiuto-ragiona b { color: #237a4b }
.cst-aiuto-pezzo, .cst-aiuto-forma, .cst-aiuto-svela { background: #f4efff; border-left-color: #8a63d2 }
.cst-aiuto-pezzo b, .cst-aiuto-forma b, .cst-aiuto-svela b { color: #6b52ab }
.cst-rimetti { display: block; margin-top: 6px; min-height: 34px; border-radius: 10px; padding: 0 10px;
               background: #e7defb; color: #4d3a86; font-size: 13px; font-weight: 800 }
.cst-rimetti small { font-weight: 600; color: #7d6bb0; margin-left: 4px }

/* il tasto del prossimo gradino, col prezzo a destra */
.cst-chiedi { display: block; width: 100%; margin-top: 12px; min-height: 56px; border-radius: 14px;
              padding: 9px 12px; text-align: left; background: #fff; font-size: 15px; font-weight: 800;
              box-shadow: inset 0 0 0 1.5px #e3d6bf, 0 2px 0 #e3d6bf }
.cst-chiedi small { display: block; margin-top: 3px; font-size: 12px; font-weight: 600; line-height: 1.35;
                    color: var(--cst-tenue) }
.cst-riga-chiedi { display: flex; align-items: center; gap: 8px }
.cst-riga-chiedi > span:first-child { flex: 1; min-width: 0 }
.cst-prezzo { flex: none; border-radius: 999px; padding: 3px 10px; font-size: 13px;
              background: #fff3c4; color: #7a5a00; box-shadow: inset 0 0 0 1.5px #f0d77a }
.cst-gratis { background: #e3f6e9; box-shadow: 0 2px 0 #c4e7d0 }
.cst-gratis .cst-prezzo { background: #c9efd6; color: #1c6b3f; box-shadow: none }
.cst-armato { background: #fff7d6; box-shadow: inset 0 0 0 2px #e0a800, 0 2px 0 #e3d6bf;
              animation: cst-armato .28s ease-out }
@keyframes cst-armato { 50% { transform: scale(1.02) } }
.cst-povero { opacity: .75; background: #f4f2ee }
.cst-povero .cst-prezzo { background: #ebe7df; color: #8f8778; box-shadow: none }
.cst-povero small { color: #a8322c }
</style>
