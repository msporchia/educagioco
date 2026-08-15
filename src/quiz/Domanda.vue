<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA DOMANDA — il componente che i giochi mettono in scena.

   Riceve una domanda già fatta (`src/quiz/scelta.js` la produce) e la
   mostra: consegna, la cosa da guardare se c'è, i tasti delle risposte.
   Poi dice com'è andata e si toglie di mezzo.

     <Domanda :domanda="d.domanda" :pittori="d.pittori"
              :titolo="`${d.icona} ${d.nome}`" @risposto="incassa" />

   Segue la convenzione dei giochi nuovi: **non tocca il profilo, non
   chiama nessun motore, non sa cosa sia una moneta**. Riceve quello che
   deve mostrare ed emette quello che è successo — `{ giusto, chiave,
   tempo, indice }` — e chi l'ha chiamato decide se quello vale una carta
   di potenziamento, una porta che si apre o niente.

   È il gemello Vue di `grafica/scheda.js`, che fa la stessa cosa in DOM
   puro per le palestre dei prototipi: là non c'è Vue e non ci deve
   essere, qui invece un overlay imperativo dentro un gioco reattivo
   sarebbe un corpo estraneo.

   UNA COSA SOLA DA SAPERE: il velo è `position: absolute`, così copre il
   riquadro del gioco e non tutto il telefono (la barra in cima resta
   dov'è). Chi lo mette in scena deve avere `position: relative` addosso,
   o la domanda esce dal posto sbagliato.

   LA SCHEDA SI ADATTA ALLO SCHERMO, non ha una taglia sola. I disegni
   (l'orologio, la figura da specchiare, i quadretti) erano fissi a 148 e
   118 pixel: su un telefono vecchio da 320×480 una domanda di geometria
   veniva alta 760 pixel e le ultime due risposte restavano fuori, senza
   nemmeno il modo di arrivarci. Adesso ogni misura è un `clamp()` legato
   a `--qz-h`, l'unità di altezza utile, e il velo scorre lo stesso —
   perché un carattere grosso di sistema o una consegna lunga possono
   sempre sforare, e allora si scrolla invece di perdere un pezzo.

   `--qz-h` vale `1vh`, cioè «ho tutto lo schermo». Un gioco che apre la
   domanda in un pannello più corto la stringe da fuori — il dungeon, che
   la tiene in fondo su tre quarti d'altezza, dichiara `--qz-h: .72vh` —
   e i disegni rimpiccioliscono di conseguenza.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onMounted, nextTick } from 'vue'
import { dipingi } from './grafica/riquadro.js'
import Giudizio from '../components/Giudizio.vue'
import { giudiziAccesi } from '../store/giudizi.js'

const props = defineProps({
  domanda: { type: Object, required: true },
  pittori: { type: Object, default: () => ({}) },
  titolo: { type: String, default: '' },
  /* quanto resta a vedere l'esito prima di sparire */
  respiro: { type: Number, default: 1500 },
  /* Da dove viene la domanda: il pacchetto che `scelta.js` ha
     consegnato (`{ modulo, grado, materia, … }`) e il nome del gioco
     che l'ha chiesta. Non servono a mostrarla — la domanda si mette in
     scena benissimo senza — ma a chi la giudica troppo facile o troppo
     difficile: sono le due cose che rendono un giudizio azionabile
     invece che un «una domanda era difficile». Facoltativi: un gioco
     che non li passa mostra la domanda come sempre. */
  origine: { type: Object, default: null },
  gioco: { type: String, default: '' },
})
const emit = defineEmits(['risposto'])

const scelto = ref(-1)
const partenza = ref(0)
const tele = ref([])          // i canvas delle risposte disegnate
const teloSoggetto = ref(null)

const risposte = computed(() => props.domanda.risposte || [])
const lunghe = computed(() => risposte.value.some(r => (r.testo || '').length > 13))
const colonne = computed(() =>
  lunghe.value ? 'lunghe' : risposte.value.length === 2 ? 'due'
    : risposte.value.length === 3 ? 'tre' : 'molte')

const esito = computed(() => {
  if (scelto.value < 0) return ''
  if (scelto.value === props.domanda.giusta) return 'giusto'
  return risposte.value[scelto.value]?.perche || props.domanda.aiuto || ''
})

function classe(i) {
  if (scelto.value < 0) return ''
  if (i === props.domanda.giusta) return 'giusta'
  if (i === scelto.value) return 'sbagliata'
  return 'spenta'
}

function scegli(i) {
  if (scelto.value >= 0) return
  scelto.value = i
  const giusto = i === props.domanda.giusta
  const attesa = giusto ? Math.min(props.respiro, 700)
    : props.respiro + (esito.value ? 900 : 0)
  setTimeout(() => emit('risposto', {
    giusto,
    indice: i,
    chiave: props.domanda.chiave,
    tempo: (performance.now() - partenza.value) / 1000,
  }), attesa)
}

/* Quello che si sa di questa domanda **adesso**: il tempo scorre e
   l'esito arriva dopo, quindi non è un oggetto ma una funzione, che i
   tre tasti chiamano nel momento in cui li tocchi. */
const daGiudicare = () => ({
  gioco: props.gioco,
  modulo: props.origine?.modulo || '',
  grado: props.origine?.grado ?? '',
  materia: props.origine?.materia || '',
  chiave: props.domanda.chiave || '',
  testo: props.domanda.testo || '',
  esito: scelto.value < 0 ? 'aperta'
    : scelto.value === props.domanda.giusta ? 'giusta' : 'sbagliata',
  tempo: partenza.value ? (performance.now() - partenza.value) / 1000 : 0,
})

/* I disegni si fanno dopo il layout: prima il canvas non sa quanto è
   largo, e un riquadro dipinto a misura sbagliata resta sgranato. */
onMounted(async () => {
  partenza.value = performance.now()
  await nextTick()
  if (props.domanda.soggetto?.scena && teloSoggetto.value)
    dipingi(teloSoggetto.value, props.pittori, props.domanda.soggetto.scena)
  risposte.value.forEach((r, i) => {
    if (r.scena && tele.value[i]) dipingi(tele.value[i], props.pittori, r.scena)
  })
})
</script>

<template>
  <div class="qz-velo">
    <div class="qz-carta">
      <!-- la riga in cima porta due cose che non c'entrano fra loro: di
           che materia è la domanda, e i tre tasti per giudicarla. I
           secondi ci sono solo se un grande li ha accesi, e allora la
           riga compare anche senza titolo. -->
      <div v-if="titolo || giudiziAccesi" class="qz-testa">
        <span>{{ titolo }}</span>
        <Giudizio :voce="daGiudicare" />
      </div>
      <div class="qz-consegna">{{ domanda.testo }}</div>

      <div v-if="domanda.soggetto" class="qz-soggetto">
        <canvas v-if="domanda.soggetto.scena" ref="teloSoggetto" class="qz-telo-grande" />
        <span v-else-if="domanda.soggetto.emoji" class="qz-emoji">{{ domanda.soggetto.emoji }}</span>
        <span v-else>{{ domanda.soggetto.testo }}</span>
      </div>

      <div class="qz-risposte" :class="colonne">
        <button v-for="(r, i) in risposte" :key="i" type="button"
                class="qz-tasto" :class="[classe(i), { emoji: r.emoji !== undefined }]"
                @click="scegli(i)">
          <canvas v-if="r.scena" :ref="el => (tele[i] = el)" class="qz-telo" />
          <template v-else>{{ r.testo ?? r.emoji }}</template>
        </button>
      </div>

      <div class="qz-esito">
        <template v-if="scelto >= 0">
          <span v-if="scelto === domanda.giusta" class="bene">Giusto!</span>
          <template v-else><span class="male">Era questa.</span> {{ esito }}</template>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qz-velo {
  /* l'unità di altezza utile: quanto schermo ha davvero questa domanda.
     Chi la apre in un pannello più corto la ridefinisce da fuori. */
  --qz-h: 1vh;
  position: absolute; inset: 0; z-index: 40; display: flex;
  /* `flex-start` più `margin: auto` sulla carta: centrata quando ci
     sta, ma quando è più alta del velo scorre invece di farsi tagliare
     sopra e sotto (con `align-items: center` la cima è irraggiungibile) */
  align-items: flex-start; justify-content: center;
  padding: clamp(6px, calc(2 * var(--qz-h)), 16px);
  overflow-y: auto; overscroll-behavior: contain;
  background: rgba(6, 9, 18, .82); backdrop-filter: blur(3px);
  animation: qz-entra .18s ease;
}
@keyframes qz-entra { from { opacity: 0 } to { opacity: 1 } }
.qz-carta {
  margin: auto;
  width: 100%; max-width: 430px;
  padding: clamp(10px, calc(2 * var(--qz-h)), 20px)
           clamp(12px, 4vw, 18px)
           clamp(10px, calc(1.8 * var(--qz-h)), 18px);
  border-radius: 24px; color: #eaf0ff;
  background: linear-gradient(180deg, #223055 0%, #141c33 100%);
  border: 1px solid rgba(255, 255, 255, .13);
  box-shadow: 0 24px 60px rgba(0, 0, 0, .55);
}
.qz-testa {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  font-size: 12.5px; letter-spacing: .06em; text-transform: uppercase;
  color: #ffd58a; font-weight: 700;
  margin-bottom: clamp(5px, calc(1.2 * var(--qz-h)), 12px);
}
.qz-consegna {
  font-size: clamp(15px, 4.4vw, 20px); font-weight: 650; line-height: 1.3;
  margin-bottom: clamp(7px, calc(1.5 * var(--qz-h)), 14px);
  /* una consegna può arrivare su più righe (le premesse di un
     ragionamento si leggono una alla volta): gli a capo si rispettano */
  white-space: pre-line;
}
.qz-soggetto {
  display: flex; align-items: center; justify-content: center;
  margin-bottom: clamp(8px, calc(1.7 * var(--qz-h)), 16px);
  padding: clamp(7px, calc(1.4 * var(--qz-h)), 14px);
  min-height: clamp(46px, calc(8 * var(--qz-h)), 74px);
  border-radius: 18px; background: rgba(255, 255, 255, .06);
  border: 1px solid rgba(255, 255, 255, .08);
  font-size: clamp(22px, 6vw, 30px); font-weight: 750; text-align: center;
}
.qz-emoji { font-size: clamp(30px, 8vw, 40px); }
.qz-telo-grande {
  width: clamp(76px, calc(17 * var(--qz-h)), 148px);
  height: auto; aspect-ratio: 1;
}
.qz-risposte { display: grid; gap: clamp(6px, calc(1.1 * var(--qz-h)), 10px); }
.qz-risposte.due { grid-template-columns: 1fr 1fr; }
.qz-risposte.tre { grid-template-columns: 1fr 1fr 1fr; }
.qz-risposte.molte { grid-template-columns: 1fr 1fr; }
.qz-risposte.lunghe { grid-template-columns: 1fr; }
.qz-tasto {
  display: flex; align-items: center; justify-content: center;
  /* 42px è il dito, non l'estetica: sotto non si scende mai */
  min-height: clamp(42px, calc(7 * var(--qz-h)), 62px);
  padding: clamp(6px, calc(1.1 * var(--qz-h)), 12px) 8px; cursor: pointer;
  border-radius: 16px; border: 1px solid rgba(255, 255, 255, .14);
  background: rgba(255, 255, 255, .075); color: inherit;
  font: inherit; font-size: clamp(16px, 4.4vw, 19px); font-weight: 650;
  text-align: center;
  transition: transform .1s ease, background .12s ease, border-color .12s ease;
}
.qz-tasto.emoji { font-size: clamp(28px, 7.5vw, 40px); }
.qz-telo {
  width: 100%; max-width: clamp(52px, calc(13.5 * var(--qz-h)), 118px);
  aspect-ratio: 1; height: auto;
}
.qz-tasto:active { transform: scale(.97); background: rgba(255, 255, 255, .13); }
.qz-tasto.giusta { background: rgba(78, 214, 128, .24); border-color: #4ed680; }
.qz-tasto.sbagliata { background: rgba(255, 105, 105, .2); border-color: #ff6969; }
.qz-tasto.spenta { opacity: .38; }
.qz-esito {
  margin-top: clamp(7px, calc(1.4 * var(--qz-h)), 14px);
  min-height: 20px; font-size: clamp(13px, 3.8vw, 15px);
  line-height: 1.4; color: #b9c6e6;
}
.qz-esito .bene { color: #7ee6a4; font-weight: 700; }
.qz-esito .male { color: #ffb0b0; font-weight: 700; }
</style>
