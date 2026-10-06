<script setup>
import { ref, watch, onMounted } from 'vue'
import { init, state } from './store/profile.js'
import { initPosta } from './store/posta.js'
import { entra as entraNelGioco, esci as esciDalGioco } from './store/sessioni.js'
import { fotografa } from './quiz/fotografia.js'
import { controlla } from './aggiornamento.js'
import HomeView from './views/HomeView.vue'
import LinguaGame from './views/LinguaGame.vue'
import MathGame from './views/MathGame.vue'
import TowerDefense from './views/TowerDefense.vue'
import BancarellaGame from './views/BancarellaGame.vue'
import GeneraleGame from './views/GeneraleGame.vue'
import AlboView from './views/AlboView.vue'
import ProfiloView from './views/ProfiloView.vue'
import GenitoriView from './views/GenitoriView.vue'
import Guide from './guide/Guide.vue'
import Novita from './guide/Novita.vue'
import AdminView from './views/AdminView.vue'
import Traguardo from './components/Traguardo.vue'
import Benvenuto from './components/Benvenuto.vue'
import AvvisoMonete from './components/varieta/Avviso.vue'   // importarlo accende anche il filtro delle monete
import { SCHERMATE } from './giochi/schermate.js'

const vista = ref('home')
const pronto = ref(false)
// verbi -> LinguaGame: la cameretta non c'è più (#cameretta, #animali restano ignorati sotto)
const viste = { home: HomeView,
                inglese: LinguaGame, verbi: LinguaGame, spagnolo: LinguaGame,
                mate: MathGame, torri: TowerDefense,
                bancarella: BancarellaGame,
                generale: GeneraleGame,
                albo: AlboView, profilo: ProfiloView, genitori: GenitoriView,
                guide: Guide,
                novita: Novita,
                admin: AdminView,   // #admin: nessuna carta ci porta
                ...SCHERMATE }

// stesso componente con due lingue: il key le tiene separate, se no Vue riuserebbe la schermata di prima
const lingue = { inglese: 'en', verbi: 'en', spagnolo: 'es' }

// giochi.html#generale apre già quella schermata: non è un router, l'indirizzo
// non viene mai riscritto da qui. hasOwnProperty e non viste[k]: #toString altrimenti sarebbe valida
function dallIndirizzo() {
  if (typeof location === 'undefined') return
  const chiave = (location.hash || '').replace(/^#/, '')
  if (Object.prototype.hasOwnProperty.call(viste, chiave)) vista.value = chiave
  // il cheat della fattoria si legge ENTRANDO nella fattoria, quindi ci porta anche l'indirizzo
  else if (/(?:^|&)fattoria-tipo=\d/i.test(chiave)) vista.value = 'fattoria'
}

onMounted(async () => {
  await init()
  await initPosta()   // dopo init(): la prima volta decide guardando se in casa c'è già un profilo
  dallIndirizzo()
  if (typeof window !== 'undefined') window.addEventListener('hashchange', dallIndirizzo)
  pronto.value = true

  // il watch si accende QUI e non in cima al file: init() sceglie il primo
  // giocatore, e dichiarato fuori scatterebbe anche a quella scelta,
  // rimandando in home chi è entrato da #sotterraneo
  watch(() => state.player, () => {
    esciDalGioco()   // la sessione è di chi stava giocando: si chiude prima di cambiare
    if (vista.value !== 'admin') vista.value = 'home'   // admin: cambiare bambino è previsto lì
  })
  guardaLoSchermo()
})
function vai(v) { vista.value = v }

// solo i giochi contano il tempo: home, impostazioni, albo, guide e novità non sono tempo di gioco
const NON_GIOCHI = ['home', 'albo', 'profilo', 'genitori', 'guide', 'novita', 'admin']
const gioca = v => !!viste[v] && !NON_GIOCHI.includes(v)

function apriSessione(v) {
  if (gioca(v)) {
    entraNelGioco(v, state.player)
    fotografa()   // una a settimana, fuori dal profilo: le frecce di «Come va» (docs/genitori/come-va.md)
  } else esciDalGioco()
}
watch(vista, apriSessione)

// pagehide copre il caso in cui la scheda venga chiusa e basta: su iOS visibilitychange non arriva sempre
function guardaLoSchermo() {
  if (typeof document === 'undefined') return
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') esciDalGioco()
    else apriSessione(vista.value)
  })
  window.addEventListener('pagehide', () => esciDalGioco())
}

watch(vista, v => { if (v === 'home') controlla() })   // uscire da un gioco è un buon momento per controllare
</script>

<template>
  <div v-if="!pronto" class="schermo">
    <div class="centro"><h1>Un attimo…</h1></div>
  </div>
  <Benvenuto v-else-if="!state.player" />
  <template v-else>
    <component :is="viste[vista]" :lingua="lingue[vista]" @vai="vai"
               :key="vista + state.player" />
    <!-- i giochi sono pensati in verticale: girato, il campo diventa una fessura -->
    <div class="gira"><span class="em">📱</span><b>Gira il telefono</b>
      <span class="mini">i giochi si vedono in verticale</span></div>
    <!-- key = state.player: il cartello di un traguardo non deve sopravvivere al cambio di bambino -->
    <Traguardo :key="state.player" />
    <AvvisoMonete :key="'monete' + state.player" />
  </template>
</template>
