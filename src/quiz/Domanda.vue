<script setup>
/* Mette in scena una domanda già fatta (`quiz/scelta.js`) ed emette
   `{ giusto, chiave, tempo, indice }`: non chiama motori e non sa cosa
   sia una moneta. Annota anche il ripasso (`quiz/memoria.js`) — l'unico
   posto che lo fa, per non doverselo ricordare in ogni gioco. Gemello
   imperativo per chi non ha Vue: `grafica/scheda.js`. Vedi
   docs/apprendimento/quiz-moduli.md e la-domanda.md; `--qz-h` (1vh di
   default) è l'altezza che il gioco concede alla scheda, e ogni misura
   vi è legata con `clamp()` così un pannello più corto la rimpicciolisce
   tutta invece di tagliarla. */
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { dipingi } from './grafica/riquadro.js'
import MazzoSoldi from '../components/MazzoSoldi.vue'
import { pezziDelMazzo } from '../grafica/soldi.js'
import Giudizio from '../components/Giudizio.vue'
import TastoSalta from '../components/TastoSalta.vue'
import { giudiziAccesi } from '../store/giudizi.js'
import { saltoAcceso } from '../store/salto.js'
import { annota, alleggerita, alleggerisciSeServe } from './memoria.js'
import { esempioSvolto, generatoreDi, daLeggerePrima } from './nucleo/svolto.js'
import { perId } from './nucleo/registro.js'
import { sorteQualunque } from './nucleo/sorte.js'
import { serveLaDritta, troppoDiFretta, spiegazioneDi, attesaDellEsito, evidenziando,
         fraseDaLeggere, tempoDaAnnotare, rispostaSaltata, PONDERA }
  from './nucleo/domanda.js'
import { pesoDellaFretta } from './fretta.js'

const props = defineProps({
  domanda: { type: Object, required: true },
  pittori: { type: Object, default: () => ({}) },
  titolo: { type: String, default: '' },
  respiro: { type: Number, default: 1500 }, // quanto resta a vedere l'esito prima di sparire
  // per i giudizi (troppo facile/difficile) e il ripasso, non per mostrare la domanda: facoltativi
  origine: { type: Object, default: null },
  gioco: { type: String, default: '' },
  saltabile: { type: Boolean, default: false }, // vedi docs/apprendimento/la-domanda.md
})
const emit = defineEmits(['risposto'])
let cieca = 0

const scelto = ref(-1)
const saltata = ref(false) // il tasto «salta» dei grandi: giusta per il gioco, invisibile al ripasso (docs/core/comandi.md)
// il tempo si ferma a schermo nascosto (setTimeout/performance.now non se ne accorgono da sé):
// vedi docs/core/interfaccia.md#i-tempi e docs/apprendimento/la-domanda.md
let partenza = 0        // quando è ricominciato il conto (0 = fermo)
let visto = 0           // quanto è già stata guardata, in ms
const CIECA = 320       // finestra cieca al montaggio: vedi docs/core/interfaccia.md
const pronta = ref(false)
const attesa = ref(0)   // quanto manca alla prossima (0 = non si aspetta niente)
const diFretta = ref(false) // vedi docs/apprendimento/la-domanda.md#troppo-di-fretta-il-tempo-non-la-roba
// per le tipologie alleggerite, l'esempio svolto (o il solo metodo) prima di rispondere: deciso a inizio domanda
const prima = ref(null)
const svolto = computed(() => prima.value?.esempio || null)
// i soldi non sono un canvas: gli stessi pezzi della bancarella, in file (grafica/soldi.js)
const soldiInMano = computed(() => pezziDelMazzo(props.domanda.soggetto?.scena))
const soldiSvolti = computed(() => pezziDelMazzo(svolto.value?.soggetto?.scena))
const svoltaGiusta = computed(() => svolto.value?.risposte?.[svolto.value.giusta] || null)
const teloSvolto = ref(null)
const teloSvoltaGiusta = ref(null)
// il timer della prossima domanda: non è un `ref` perché non si disegna
let avanti = null        // il timer
let vaiAvanti = null     // cosa fa quando scatta
let scade = 0            // a che istante scatterebbe
const giro = ref(0)       // rifà la barra da capo quando l'attesa riparte (l'animazione CSS non cambia durata da sola)
const tele = ref([])          // i canvas delle risposte disegnate
const teloSoggetto = ref(null)
const ingrandito = ref(false) // la lente: solo il soggetto si ingrandisce, vedi quiz-moduli.md
const teloZoom = ref(null)

const risposte = computed(() => props.domanda.risposte || [])
// la frase col rilievo: il ritaglio sta in nucleo/domanda.js (lo condivide grafica/scheda.js)
const frase = computed(() =>
  evidenziando(props.domanda.soggetto?.testo, props.domanda.soggetto?.evidenzia))
const fraseSvolta = computed(() =>
  evidenziando(svolto.value?.soggetto?.testo, svolto.value?.soggetto?.evidenzia))
// una frase da leggere sta su un foglio che non somiglia a un tasto; una parola sola resta un titolo da guardare
const daLeggere = computed(() => fraseDaLeggere(props.domanda.soggetto))
const svoltaDaLeggere = computed(() => fraseDaLeggere(svolto.value?.soggetto))
// il layout delle risposte (colonne, larghezza minima): vedi docs/apprendimento/la-domanda.md
const colonne = computed(() => (risposte.value.length === 3 ? 3 : 2))
const minTasto = computed(() => {
  const testi = risposte.value
    .map(r => (r.testo ?? '') + '')
    .filter(t => t.trim().length)
  if (!testi.length) return '0px'
  const parola = Math.max(...testi.flatMap(t => t.split(/\s+/).map(p => p.length)))
  const intera = Math.max(...testi.map(t => t.length))
  // +18px: l'imbottitura e il bordo del tasto, che con border-box contano nella flex-basis
  return `calc(${Math.max(parola, Math.ceil(intera / 2))}ch + 18px)`
})

// perche + comeSiFa, mai un `||`: vedi docs/apprendimento/la-domanda.md
const spiegazione = computed(() => spiegazioneDi(props.domanda, scelto.value))

// la dritta: solo a chi sbaglia o a chi indovina tardi, vedi la-domanda.md
const quantoCiHaMesso = ref(0)
const dritta = computed(() => {
  if (scelto.value < 0) return ''
  const giusto = scelto.value === props.domanda.giusta
  return serveLaDritta(props.domanda, { giusto, tempo: quantoCiHaMesso.value })
    ? props.domanda.dritta : ''
})

function classe(i) {
  if (scelto.value < 0) return ''
  if (i === props.domanda.giusta) return 'giusta'
  if (i === scelto.value) return 'sbagliata'
  return 'spenta'
}

/* quanto è stata guardata questa domanda, in secondi: `visto` più il
   pezzo in corso, e 0 per il pezzo che non c'è mentre il telefono è
   posato */
function guardata() {
  return tempoDaAnnotare(visto + (partenza ? performance.now() - partenza : 0))
}

function scegli(i) {
  if (scelto.value >= 0 || !pronta.value) return
  scelto.value = i
  const giusto = i === props.domanda.giusta
  const tempo = guardata()
  quantoCiHaMesso.value = tempo
  /* il ripasso si annota subito, non fra un secondo e mezzo: il gioco
     che sta sotto può chiudere la domanda appena arriva l'evento, e
     una risposta persa perché si è cambiato schermo è una risposta che
     il bambino ha dato e che non conta */
  if (props.origine && props.gioco !== 'prova') {
    annota({ chiave: props.domanda.chiave, giusto, tempo })
    // al muro il gioco alleggerisce da sé per una settimana: vedi quiz/alleggerire.js
    alleggerisciSeServe(props.domanda.chiave)
  }
  /* Sbagliando si resta fermi più a lungo, perché c'è da leggere il
     perché. Ma un'attesa che non si vede è **indistinguibile da un gioco
     bloccato** — a un bambino col telefono in mano, due secondi di
     schermata ferma sono un tasto che non funziona, e infatti tocca di
     nuovo, e quel tocco finisce sulla domanda dopo. Per questo l'attesa
     si vede: la riga sotto la carta si riempie, e quando è piena si va
     avanti. È la stessa regola di «un errore non resta muto», applicata
     al tempo che passa. */
  /* indovinando si tira dritto, a meno che non ci sia una scorciatoia
     da leggere: allora si resta quanto basta per leggerla, che è la
     stessa attesa di quando si sbaglia */
  // chi ha avuto l'esempio davanti aveva più da leggere: il tempo di lettura lo conta
  const inPiu = daLeggerePrima(prima.value)
  diFretta.value = troppoDiFretta(inPiu
    ? { ...props.domanda, testo: `${props.domanda.testo} ${inPiu}` } : props.domanda,
  { giusto, tempo })
  /* il conto della raffica si aggiorna **a ogni risposta**, anche
     quando è stata letta: le risposte giuste sono il modo di uscirne
     (`quiz/fretta.js`, quattro) */
  const penale = pesoDellaFretta(diFretta.value, giusto)
  /* Quanto si sta fermi lo decidono **le righe che restano a schermo**:
     dopo uno sbaglio sono «Era questa», il perché e il come si fa, che
     insieme arrivano a venticinque parole e ogni tanto al doppio.
     «Era questa.» si conta anche lui — sono due parole, ma il conto le
     vuole tutte, se no la stessa funzione direbbe due cose diverse a
     seconda di chi la chiama. */
  const { perche, comeSiFa } = spiegazione.value
  const quanto = attesaDellEsito({
    // sbagliando si torna a guardare il metodo dell'esempio sopra, e anche quello si legge
    righe: giusto ? [dritta.value]
      : ['Era questa.', perche, comeSiFa, dritta.value, svolto.value?.aiuto],
    pavimento: giusto
      ? (dritta.value ? props.respiro + 900 : Math.min(props.respiro, 700))
      : Math.max(PONDERA, props.respiro),
    penale: penale.attesa,
  })
  attesa.value = quanto
  vaiAvanti = () => emit('risposto', {
    giusto,
    indice: i,
    chiave: props.domanda.chiave,
    tempo,
    /* «ha risposto prima di poterla leggere»: nessun gioco lo usa
       ancora, e sta nell'evento perché il giorno che uno volesse farne
       qualcosa il conto è già fatto qui e non va rifatto in quattro
       posti con quattro soglie diverse */
    diFretta: diFretta.value,
  })
  programma(quanto)
}

/* «salta» (solo se chi sviluppa l'ha acceso): la domanda va al gioco per giusta, ma
   non passa da `scegli` — niente ripasso, niente alleggerimento, niente fretta —
   e `saltata` nell'evento dice a chi ascolta di non pagare né contare. Una
   pausa breve per vedere la giusta accendersi, non l'attesa di un esito vero. */
const PAUSA_SALTO = 450
function saltaQuesta() {
  if (scelto.value >= 0 || !pronta.value) return
  saltata.value = true
  scelto.value = props.domanda.giusta
  vaiAvanti = () => emit('risposto', rispostaSaltata(props.domanda))
  programma(PAUSA_SALTO)
}

/* Il timer dell'esito, in un posto solo: lo arma chi risponde e lo
   riarma chi torna a guardare lo schermo, e tutti e due devono
   ricordarsi di segnare **quando scade** — se no il pezzo che resta,
   quando il telefono si posa, non si può calcolare. */
function programma(quanto) {
  clearTimeout(avanti)
  scade = performance.now() + quanto
  avanti = setTimeout(() => { avanti = null; salta() }, quanto)
}

/* `vaiAvanti` si svuota prima di chiamarlo: senza, un tocco che arriva
   mentre il timer sta scattando manderebbe l'evento due volte, e il
   pannello scorrerebbe di due domande a ogni tocco. */
function salta() {
  if (!vaiAvanti) return
  clearTimeout(avanti)
  avanti = null
  const fatto = vaiAvanti
  vaiAvanti = null
  fatto()
}

/* il tocco che salta l'attesa: vale solo dopo aver risposto, e solo se
   chi ci ha messo la domanda l'ha chiesto */
/* Toccare la barra **accorcia l'attesa**, non aggiunge un evento: chi
   sta sotto riceve `risposto` come sempre, solo prima. Un secondo
   evento sembrava più espressivo e faceva avanzare di due domande per
   volta, perché il pannello ascoltava tutti e due — un difetto che si
   vede solo contando, e infatti l'ha trovato il contatore del giro. */
function saltaAttesa() {
  if (props.saltabile) salta()
}

// solo a domanda pronta: nei primi millisecondi il tocco è il fantasma di quello di prima (vedi CIECA)
async function ingrandisci() {
  if (!pronta.value || !props.domanda.soggetto?.scena) return
  ingrandito.value = true
  await nextTick()
  if (teloZoom.value) dipingi(teloZoom.value, props.pittori, props.domanda.soggetto.scena)
}

// una funzione e non un oggetto: il tempo scorre e l'esito arriva dopo, i tre tasti la chiamano al tocco
const daGiudicare = () => ({
  gioco: props.gioco,
  modulo: props.origine?.modulo || '',
  grado: props.origine?.grado ?? '',
  materia: props.origine?.materia || '',
  chiave: props.domanda.chiave || '',
  testo: props.domanda.testo || '',
  esito: scelto.value < 0 ? 'aperta' : saltata.value ? 'saltata'
    : scelto.value === props.domanda.giusta ? 'giusta' : 'sbagliata',
  tempo: guardata(),
})

// azzera tutto a ogni domanda nuova: vedi docs/core/interfaccia.md#un-v-if-che-non-si-spegne-mai-non-rimonta-niente
async function inizia() {
  clearTimeout(cieca)
  scelto.value = -1
  saltata.value = false
  quantoCiHaMesso.value = 0
  attesa.value = 0
  diFretta.value = false
  prima.value = alleggerita(props.domanda.chiave) ? esempioSvolto({
    vera: props.domanda,
    genera: generatoreDi(perId(props.origine?.modulo), props.origine?.grado, props.domanda.chiave),
    sorte: sorteQualunque(),
  }) : null
  clearTimeout(avanti)
  avanti = null
  vaiAvanti = null
  scade = 0
  pronta.value = false
  ingrandito.value = false
  visto = 0
  partenza = performance.now()
  cieca = setTimeout(() => { pronta.value = true }, CIECA)
  await nextTick()
  if (props.domanda.soggetto?.scena && teloSoggetto.value)
    dipingi(teloSoggetto.value, props.pittori, props.domanda.soggetto.scena)
  risposte.value.forEach((r, i) => {
    if (r.scena && tele.value[i]) dipingi(tele.value[i], props.pittori, r.scena)
  })
  // l'esempio viene dallo stesso modulo: i suoi disegni li fanno gli stessi pittori
  if (svolto.value?.soggetto?.scena && teloSvolto.value)
    dipingi(teloSvolto.value, props.pittori, svolto.value.soggetto.scena)
  if (svoltaGiusta.value?.scena && teloSvoltaGiusta.value)
    dipingi(teloSvoltaGiusta.value, props.pittori, svoltaGiusta.value.scena)
}

// il telefono si posa e torna: il tempo riparte, l'attesa dell'esito riparte da quello che restava
function schermo(e) {
  if (e?.type === 'pagehide' || document.visibilityState === 'hidden') {
    if (partenza) { visto += performance.now() - partenza; partenza = 0 }
    if (avanti) {
      attesa.value = Math.max(0, Math.round(scade - performance.now()))
      clearTimeout(avanti)
      avanti = null
    }
    return
  }
  if (!partenza) partenza = performance.now()
  if (!avanti && vaiAvanti) { // c'era un'attesa in corso: riparte da dov'era, barra compresa
    giro.value++
    programma(attesa.value)
  }
}

onMounted(() => {
  inizia()
  document.addEventListener('visibilitychange', schermo) // sul document: alla finestra arriva solo perché risale
  addEventListener('pagehide', schermo)
})
watch(() => props.domanda, inizia) // sull'oggetto, non sulla chiave: due domande di fila possono avere la stessa chiave

onUnmounted(() => {
  clearTimeout(cieca)
  clearTimeout(avanti)
  document.removeEventListener('visibilitychange', schermo)
  removeEventListener('pagehide', schermo)
})
</script>

<template>
  <div class="qz-velo">
    <div class="qz-carta">
      <!-- titolo e giudizio: il secondo solo se un grande l'ha acceso, e allora la riga compare anche senza titolo -->
      <div v-if="titolo || giudiziAccesi" class="qz-testa">
        <span>{{ titolo }}</span>
        <Giudizio :voce="daGiudicare" />
      </div>
      <!-- alleggerita: un'altra domanda della stessa tipologia, già risolta, e poi la vera (vedi la-domanda.md) -->
      <div v-if="svolto" class="qz-svolto" data-come-prima data-esempio-svolto>
        <div class="qz-svolto-titolo">Guarda come si fa</div>
        <div class="qz-svolto-consegna">{{ svolto.testo }}</div>
        <div v-if="svolto.soggetto" class="qz-svolto-soggetto">
          <MazzoSoldi v-if="soldiSvolti" :pezzi="soldiSvolti" />
          <canvas v-else-if="svolto.soggetto.scena" ref="teloSvolto" class="qz-svolto-telo" />
          <span v-else-if="svolto.soggetto.emoji">{{ svolto.soggetto.emoji }}</span>
          <!-- stesso foglio della domanda vera, solo più piccolo: l'esempio si legge come si leggerà lei -->
          <blockquote v-else-if="svoltaDaLeggere" class="qz-foglio svolto" data-esempio-frase>
            <span class="qz-leggi">Leggi:</span>
            <p class="qz-frase"
            >{{ fraseSvolta.prima }}<b v-if="fraseSvolta.parola" class="qz-spicca">{{ fraseSvolta.parola }}</b>{{ fraseSvolta.dopo }}</p>
          </blockquote>
          <span v-else>{{ svolto.soggetto.testo }}</span>
          <span v-if="svolto.soggetto.nome" class="qz-nome">{{ svolto.soggetto.nome }}</span>
        </div>
        <div class="qz-svolto-risposta" data-esempio-risposta>
          <span>Risposta:</span>
          <canvas v-if="svoltaGiusta.scena" ref="teloSvoltaGiusta" class="qz-svolto-telo" />
          <b v-else-if="svoltaGiusta.emoji !== undefined" class="emoji">{{ svoltaGiusta.emoji }}</b>
          <b v-else>{{ svoltaGiusta.testo }}</b>
          <span v-if="svoltaGiusta.nome" class="qz-nome">{{ svoltaGiusta.nome }}</span>
        </div>
        <div class="qz-come"><b>Si fa così:</b> {{ svolto.aiuto }}</div>
      </div>
      <div v-if="svolto" class="qz-tocca" data-tocca-a-te>Adesso tocca a te</div>
      <!-- nessun esempio diverso da questa: il metodo solo se non ha numeri, che direbbero la risposta -->
      <div v-else-if="prima?.metodo" class="qz-come qz-prima" data-come-prima data-metodo-prima>
        <b>Si fa così:</b> {{ prima.metodo }}
      </div>
      <div class="qz-consegna">{{ domanda.testo }}</div>

      <!-- una frase da leggere è un foglio, non un riquadro: mai l'aspetto di un tasto (la-domanda.md) -->
      <blockquote v-if="daLeggere" class="qz-foglio" data-da-leggere>
        <span class="qz-leggi">Leggi:</span>
        <!-- i tre pezzi attaccati apposta: uno spazio in più qui si vedrebbe in mezzo alla frase -->
        <p class="qz-frase"
        >{{ frase.prima }}<b v-if="frase.parola" class="qz-spicca">{{ frase.parola }}</b>{{ frase.dopo }}</p>
      </blockquote>
      <div v-else-if="domanda.soggetto" class="qz-soggetto" :class="{ nominato: domanda.soggetto.nome }">
        <!-- la lente in un angolo dice che il disegno si può ingrandire, perché un canvas non sembra un tasto -->
        <MazzoSoldi v-if="soldiInMano" :pezzi="soldiInMano" />
        <button v-else-if="domanda.soggetto.scena" type="button" class="qz-guarda"
                aria-label="ingrandisci il disegno" @click="ingrandisci">
          <canvas ref="teloSoggetto" class="qz-telo-grande" />
          <span class="qz-lente" aria-hidden="true">🔍</span>
        </button>
        <span v-else-if="domanda.soggetto.emoji" class="qz-emoji">{{ domanda.soggetto.emoji }}</span>
        <span v-else>{{ domanda.soggetto.testo }}</span>
        <span v-if="domanda.soggetto.nome" class="qz-nome grande">{{ domanda.soggetto.nome }}</span>
      </div>

      <div v-if="daLeggere" class="qz-scegli" data-scegli>Scegli:</div>
      <div class="qz-risposte"
           :style="{ '--qz-colonne': colonne, '--qz-min': minTasto }">
        <!-- data-giusta è per chi gioca da script (prove e clip del README): non si vede a schermo -->
        <button v-for="(r, i) in risposte" :key="i" type="button"
                class="qz-tasto" :data-giusta="i === domanda.giusta ? '' : null"
                :class="[classe(i), { emoji: r.emoji !== undefined, nominata: r.nome !== undefined }]"
                @click="scegli(i)">
          <canvas v-if="r.scena" :ref="el => (tele[i] = el)" class="qz-telo" />
          <span v-else-if="r.emoji !== undefined">{{ r.emoji }}</span>
          <template v-else>{{ r.testo }}</template>
          <span v-if="r.nome" class="qz-nome">{{ r.nome }}</span>
        </button>
      </div>

      <!-- per provare i giochi: la leva di #admin, docs/core/comandi.md -->
      <div v-if="saltoAcceso && scelto < 0" class="qz-salta"><TastoSalta @salta="saltaQuesta" /></div>

      <!-- l'attesa che si vede, senza la quale sembra un gioco fermo -->
      <div v-if="attesa" class="qz-avanti" :class="{ saltabile }"
           @click="saltaAttesa">
        <i :key="giro" :style="{ animationDuration: attesa + 'ms' }"></i>
      </div>

      <div class="qz-esito">
        <template v-if="scelto >= 0">
          <span v-if="saltata" class="bene" data-saltata>⏭️ Saltata</span>
          <span v-else-if="scelto === domanda.giusta" class="bene">Giusto!</span>
          <!-- tre righe, tre mestieri: la correzione, il metodo (comeSiFa, l'unico utile anche domani), la dritta -->
          <template v-else><span class="male">Era questa.</span> {{ spiegazione.perche }}</template>
          <div v-if="spiegazione.comeSiFa" class="qz-come">
            <b>Si fa così:</b> {{ spiegazione.comeSiFa }}
          </div>
          <div v-if="dritta" class="qz-dritta">💡 {{ dritta }}</div>
          <!-- una riga sola: il meccanismo (cresce con l'insistenza, quattro giuste per uscirne) non si spiega -->
          <div v-if="diFretta" class="qz-fretta">🐢 Troppo di fretta: leggi bene la domanda.</div>
        </template>
      </div>
    </div>

    <!-- Teleport al body: appesa al pannello di un gioco, un `position: fixed` si ritaglia sul primo
         antenato con una transform (i fogli del sotterraneo ne hanno una) e può finire sotto la barra.
         Si chiude sul click, non sul pointerup, o il dito si lascia dietro un click che risponde da solo. -->
    <Teleport to="body">
      <div v-if="ingrandito" class="qz-zoom" @click="ingrandito = false">
        <canvas ref="teloZoom" class="qz-telo-zoom" />
        <div class="qz-zoom-testo">{{ domanda.testo }}</div>
        <button type="button" class="qz-zoom-x" aria-label="chiudi">✕</button>
      </div>
    </Teleport>
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
.qz-salta { text-align: center }
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
.qz-avanti { height: 3px; border-radius: 999px; background: #ffffff14;
             overflow: hidden; margin-top: 8px }
.qz-avanti i { display: block; height: 100%; width: 0;
               background: linear-gradient(90deg, #ffd58a, #ffb43f);
               animation: qz-riempi linear forwards }
/* mentre si guarda, la barra si può toccare per non aspettare: un filo
   più alta, così il dito la prende */
.qz-avanti.saltabile { height: 7px; padding: 2px 0; background-clip: content-box;
                       cursor: pointer }
@keyframes qz-riempi { to { width: 100% } }

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
.qz-emoji { font-size: clamp(38px, 11vw, 56px); } /* la figura È la domanda: grande quanto concede il riquadro */
.qz-foglio { /* la frase da leggere: carta chiara, barra a sinistra, niente bordo né ombra da tasto */
  position: relative; margin: 0 0 clamp(6px, calc(1.2 * var(--qz-h)), 12px);
  padding: clamp(8px, calc(1.5 * var(--qz-h)), 14px) 14px clamp(9px, calc(1.6 * var(--qz-h)), 15px) 18px;
  border: 0; border-left: 5px solid #e0a23a; border-radius: 3px 16px 16px 3px;
  background: #f8efd6; color: #2a2417; text-align: left;
}
.qz-foglio::before { /* le virgolette dicono «questo è scritto», non «tocca qui» */
  content: '\201D'; position: absolute; top: -4px; right: 10px;
  font: 700 44px/1 "Emoji Gioco", Georgia, "Times New Roman", serif; color: rgba(224, 162, 58, .55);
  pointer-events: none;
}
.qz-leggi {
  display: block; margin-bottom: 3px;
  font-size: 11.5px; letter-spacing: .08em; text-transform: uppercase;
  font-weight: 800; color: #8a5a12;
}
.qz-frase {
  margin: 0; font-family: "Emoji Gioco", Georgia, "Times New Roman", serif;
  font-size: clamp(17px, 4.9vw, 21px); font-weight: 500; line-height: 1.5;
}
.qz-scegli { /* l'altra metà del confine: da qui in giù si tocca */
  margin: 0 0 4px 2px; font-size: 11.5px; letter-spacing: .08em;
  text-transform: uppercase; font-weight: 800; color: #ffd58a;
}
.qz-foglio.svolto { margin: 0; flex: 1 1 100%; padding: 6px 10px 7px 12px; }
.qz-foglio.svolto::before { display: none; }
.qz-foglio.svolto .qz-frase { font-size: clamp(14px, 4vw, 16.5px); }
.qz-spicca {
  color: #ffd58a; font-weight: 800;
  border-bottom: 2px solid #ffb43f; padding-bottom: 1px;
}
.qz-foglio .qz-spicca { /* sulla carta chiara il giallo sparisce: evidenziatore ambra e testo scuro */
  color: #5a3500; background: rgba(255, 180, 63, .45); border-bottom-color: #c9801a;
  border-radius: 3px; padding: 0 2px 1px;
}
.qz-guarda {
  position: relative; display: block; padding: 0; border: 0; cursor: zoom-in;
  background: none; color: inherit; font: inherit; line-height: 0;
}
.qz-guarda:active { transform: scale(.97); }
.qz-lente {
  position: absolute; right: -6px; bottom: -6px;
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; line-height: 1;
  background: #223055; border: 1px solid rgba(255, 255, 255, .22);
  box-shadow: 0 2px 6px rgba(0, 0, 0, .45);
}
.qz-telo-grande {
  width: clamp(76px, calc(17 * var(--qz-h)), 148px);
  height: auto; aspect-ratio: 1;
}
/* la fila va a capo da sé (vedi docs/apprendimento/la-domanda.md): --qz-colonne è il tetto,
   --qz-min la larghezza sotto cui un tasto non si stringe (calcolate nello script) */
.qz-risposte {
  --qz-gap: clamp(6px, calc(1.1 * var(--qz-h)), 10px);
  font-size: clamp(16px, 4.4vw, 19px); /* si misura anche qui: `ch` dipende da dove si usa */
  display: flex; flex-wrap: wrap; gap: var(--qz-gap);
}
.qz-tasto {
  flex: 1 1 max(var(--qz-min, 0px),
                (100% - (var(--qz-colonne, 2) - 1) * var(--qz-gap))
                  / var(--qz-colonne, 2) - 1px);
  display: flex; align-items: center; justify-content: center;
  /* `anywhere` e non `break-word`: solo il primo abbassa il min-content, o una parola lunga sfonda il tasto */
  min-width: 0; overflow-wrap: anywhere;
  min-height: clamp(42px, calc(7 * var(--qz-h)), 62px); /* 42px è il dito, non l'estetica */
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
.qz-tasto.nominata { flex-direction: column; gap: clamp(2px, calc(.6 * var(--qz-h)), 5px); } /* figura sopra, nome sotto */
.qz-soggetto.nominato { flex-direction: column; gap: clamp(3px, calc(.8 * var(--qz-h)), 7px); }
.qz-nome {
  font-size: clamp(11px, 3.2vw, 14px); font-weight: 650; line-height: 1.2;
  text-align: center; opacity: .93;
}
.qz-nome.grande { font-size: clamp(13px, 3.8vw, 16px); }
.qz-tasto:active { transform: scale(.97); background: rgba(255, 255, 255, .13); }
.qz-tasto.giusta { background: rgba(78, 214, 128, .24); border-color: #4ed680; }
.qz-tasto.sbagliata { background: rgba(255, 105, 105, .2); border-color: #ff6969; }
.qz-tasto.spenta { opacity: .38; }
.qz-esito {
  margin-top: clamp(7px, calc(1.4 * var(--qz-h)), 14px);
  min-height: 20px; font-size: clamp(13px, 3.8vw, 15px);
  line-height: 1.4; color: #b9c6e6;
}
.qz-zoom {
  /* fixed, appesa al body col Teleport: il velo scorre quando la carta è più alta dello schermo,
     e un absolute scorrerebbe con lui. z-index scala dell'app: vedi docs/core/z-index-dal-codice.md */
  --qz-h: 1vh;
  position: fixed; inset: 0; z-index: 100; cursor: zoom-out;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: clamp(6px, calc(1.5 * var(--qz-h)), 14px);
  padding: clamp(8px, calc(2 * var(--qz-h)), 18px);
  background: rgba(6, 9, 18, .96);
  animation: qz-entra .14s ease;
  container-type: size; /* così `cqh` qui sotto misura questo riquadro e non la finestra */
}
/* due misure perché --qz-h è una dichiarazione che può non combaciare col riquadro vero (cqh) */
.qz-telo-zoom {
  width: min(100%, calc(78 * var(--qz-h)));
  width: min(100%, 78cqh);
  height: auto; aspect-ratio: 1;
}
.qz-zoom-testo {
  max-width: 430px; text-align: center; white-space: pre-line;
  font-size: clamp(13px, 3.8vw, 16px); line-height: 1.35; color: #b9c6e6;
}
.qz-zoom-x {
  position: absolute; top: 8px; right: 10px;
  width: 40px; height: 40px; border-radius: 50%; cursor: pointer;
  border: 1px solid rgba(255, 255, 255, .16);
  background: rgba(255, 255, 255, .08); color: #eaf0ff;
  font: inherit; font-size: 18px; line-height: 1;
}
.qz-esito .bene { color: #7ee6a4; font-weight: 700; }
.qz-dritta { /* ambra: è un consiglio, non una correzione */
  margin-top: 4px; color: #ffd79a;
  font-size: clamp(12px, 3.5vw, 14px); line-height: 1.35;
}
.qz-esito .male { color: #ffb0b0; font-weight: 700; }
.qz-come { /* azzurro: parla del prossimo tentativo, non c'è niente da rimproverare */
  margin-top: 6px; padding: 5px 10px 6px;
  border-left: 3px solid #6fc4ff; border-radius: 0 8px 8px 0;
  background: rgba(111, 196, 255, .1); color: #dbeaff;
  font-size: clamp(12.5px, 3.6vw, 14.5px); line-height: 1.4;
}
.qz-come b { color: #8fd0ff; font-weight: 750; }
.qz-prima { margin: 0 0 8px; text-align: left; } /* in cima: si legge prima della consegna */
/* l'esempio svolto: più piccolo e più spento della domanda vera, dentro un riquadro suo, perché non si confonda */
.qz-svolto {
  margin: 0 0 6px; padding: 8px 10px 9px; text-align: left;
  border-radius: 14px; border: 1px dashed rgba(143, 208, 255, .45);
  background: rgba(111, 196, 255, .06); color: #cfdcf5;
  font-size: clamp(12.5px, 3.6vw, 14.5px); line-height: 1.35;
}
.qz-svolto-titolo {
  font-size: 11.5px; letter-spacing: .06em; text-transform: uppercase;
  color: #8fd0ff; font-weight: 750; margin-bottom: 3px;
}
.qz-svolto-consegna { font-weight: 650; white-space: pre-line; }
.qz-svolto-soggetto, .qz-svolto-risposta {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 4px;
}
.qz-svolto-risposta b { color: #7ee6a4; font-weight: 800; }
.qz-svolto-risposta b.emoji { font-size: 22px; }
.qz-svolto-telo { width: clamp(44px, calc(9 * var(--qz-h)), 72px); height: auto; aspect-ratio: 1; }
.qz-svolto .qz-come { margin-top: 6px; }
/* il confine fra l'esempio e la domanda vera: a occhio, non solo a parole */
.qz-tocca {
  display: flex; align-items: center; gap: 8px; margin: 8px 0 6px;
  font-size: 12.5px; letter-spacing: .06em; text-transform: uppercase;
  color: #ffd58a; font-weight: 750;
}
.qz-tocca::before, .qz-tocca::after {
  content: ''; flex: 1; height: 1px; background: rgba(255, 213, 138, .35);
}
.qz-fretta { margin-top: 4px; font-size: 12.5px; color: #ffd9a0; } /* un consiglio come la dritta, non rossa */
</style>
