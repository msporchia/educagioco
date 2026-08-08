<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA CAMERETTA — una stanza sola, quattro schermate

   Cameretta, negozio e animali erano tre posti diversi con due negozi e
   un salvadanaio solo. Adesso sono una stanza disegnata: gli scaffali
   con gli oggetti comprati, gli animali sul tappeto, la porta del
   negozio e la macchina delle sorprese in un angolo. Tutto quello che si
   tocca si vede — non c'è una lista di posti dove andare, c'è una stanza.

   Le altre tre schermate si aprono da lì e ci tornano: la freccia in alto
   torna indietro di UN passo, mai a casa da qualsiasi punto.

   L'orologio delle barre batte qui: la stanza e la scheda dell'animale
   guardano lo stesso `adesso`, così l'osso sopra la testa e la barra
   della pancia non si contraddicono mai.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { state, miei, haAnimale } from '../store/profile.js'
import { petDi } from '../data/pets.js'
import Barra from '../components/Barra.vue'
import Stanza from '../components/Stanza.vue'
import SchedaAnimale from '../components/SchedaAnimale.vue'
import Negozio from '../components/Negozio.vue'
import Sorprese from '../components/Sorprese.vue'

const emit = defineEmits(['vai'])

const sez = ref('stanza')        // stanza | animale | negozio | sorprese
const chi = ref(null)            // l'animale aperto
const banco = ref('casa')        // quale banco del negozio
const messaggio = ref({ testo: '', n: 0 })
const centro = ref(null)

/* le barre passano col tempo reale: senza un battito l'orologio resterebbe
   fermo a quando si è aperta la stanza */
const adesso = ref(Date.now())
let battito = 0

const titolo = computed(() => ({
  stanza:   'La cameretta',
  animale:  petDi(chi.value)?.nome || 'La cameretta',
  negozio:  'Negozio',
  sorprese: 'Sorprese',
}[sez.value]))

function avvisa(t) { messaggio.value = { testo: t, n: messaggio.value.n + 1 } }

/* cambiando schermata si riparte dall'alto: restare a metà pagina fa
   sembrare che il tocco non abbia funzionato */
function vaiA(s) {
  sez.value = s
  if (centro.value) centro.value.scrollTop = 0
}

function apriAnimale(id) {
  if (!haAnimale(id)) return apriNegozio('animali')
  chi.value = id
  vaiA('animale')
}

function apriNegozio(b) {
  banco.value = b === 'animali' ? 'animali' : 'casa'
  vaiA('negozio')
}

/* cambiare banco è come cambiare schermata: si riparte dall'alto, che in
   fondo a cinque scaffali è l'unico modo di ritrovarsi */
function cambiaBanco(b) {
  banco.value = b
  if (centro.value) centro.value.scrollTop = 0
}

function adottato(id) {
  chi.value = id
  vaiA('stanza')
  avvisa(petDi(id).nome + ' è arrivato!')
}

/* la freccia torna indietro di un passo: da una schermata si torna alla
   stanza, e solo dalla stanza si esce */
function indietro() {
  if (sez.value === 'stanza') return emit('vai', 'home')
  vaiA('stanza')
}

onMounted(() => {
  chi.value = miei()[0]?.id || null
  battito = setInterval(() => (adesso.value = Date.now()), 15000)
})
onUnmounted(() => clearInterval(battito))
</script>

<template>
  <div class="schermo">
    <Barra :titolo="titolo" monete @indietro="indietro" />

    <!-- ═══════════ LA STANZA ═══════════ -->
    <div v-if="sez === 'stanza'" class="dentro">
      <Stanza :adesso="adesso" @animale="apriAnimale" @negozio="apriNegozio"
              @sorprese="vaiA('sorprese')" />
    </div>

    <!-- ═══════════ LE ALTRE TRE ═══════════ -->
    <div v-else class="centro" ref="centro">
      <SchedaAnimale v-if="sez === 'animale' && chi" :chi="chi" :adesso="adesso"
                     @cambia="chi = $event" @avviso="avvisa"
                     @negozio="apriNegozio" @sorprese="vaiA('sorprese')" />

      <Negozio v-else-if="sez === 'negozio'" :banco="banco" @banco="cambiaBanco"
               @avviso="avvisa" @adottato="adottato" />

      <Sorprese v-else @avviso="avvisa" />
    </div>

    <div v-if="messaggio.testo" :key="messaggio.n" class="annuncio">{{ messaggio.testo }}</div>
  </div>
</template>

<style scoped>
/* la stanza non scorre: sta tutta nello schermo, sempre. È un disegno,
   e un disegno che scorre a metà non è più una stanza. */
.dentro { flex:1; min-height:0; display:flex; align-items:center; justify-content:center;
          padding:12px }

/* Pastiglia in basso: stava sotto la barra in alto, ma lì copriva la
   navigazione. In fondo non nasconde niente e resta sotto il pollice. */
.annuncio { position:absolute; left:50%; bottom:20px; z-index:20; pointer-events:none;
            font-size:clamp(14px,4vw,19px); font-weight:900; color:var(--viola-scuro);
            background:#fffffff2; border-radius:999px; padding:8px 18px; white-space:nowrap;
            max-width:92vw; overflow:hidden; text-overflow:ellipsis;
            box-shadow:0 6px 18px #8593a844; animation:apparire 1.7s ease-out forwards }
@keyframes apparire {
  0%   { opacity:0; transform:translateX(-50%) scale(.6) }
  18%  { opacity:1; transform:translateX(-50%) scale(1.06) }
  32%  { transform:translateX(-50%) scale(1) }
  72%  { opacity:1; transform:translateX(-50%) scale(1) }
  100% { opacity:0; transform:translateX(-50%) translateY(-14px) scale(1) } }
</style>
