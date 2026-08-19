<script setup>
import { ref, onMounted } from 'vue'
import { init, state } from './store/profile.js'
import HomeView from './views/HomeView.vue'
import CamerettaView from './views/CamerettaView.vue'
import LinguaGame from './views/LinguaGame.vue'
import MathGame from './views/MathGame.vue'
import TowerDefense from './views/TowerDefense.vue'
import PozioniGame from './views/PozioniGame.vue'
import BancarellaGame from './views/BancarellaGame.vue'
import GeneraleGame from './views/GeneraleGame.vue'
import AlboView from './views/AlboView.vue'
import GenitoriView from './views/GenitoriView.vue'
import Guide from './guide/Guide.vue'
import Traguardo from './components/Traguardo.vue'
import Benvenuto from './components/Benvenuto.vue'
import { SCHERMATE } from './giochi/schermate.js'

const vista = ref('home')
const pronto = ref(false)
/* `verbi` esiste ancora e porta a English: i verbi sono una tappa della
   campagna, ma un vecchio rimando alla schermata separata non deve
   finire su una pagina bianca. */
/* `animali` porta alla cameretta come `cameretta`: la stanza, il negozio
   e gli amici sono un posto solo, ma i vecchi rimandi devono continuare
   ad arrivare da qualche parte. */
const viste = { home: HomeView, cameretta: CamerettaView, animali: CamerettaView,
                inglese: LinguaGame, verbi: LinguaGame, spagnolo: LinguaGame,
                mate: MathGame, torri: TowerDefense,
                pozioni: PozioniGame, bancarella: BancarellaGame,
                generale: GeneraleGame,
                albo: AlboView, genitori: GenitoriView,
                /* «Come funziona»: sta fuori dal codice dei genitori
                   apposta — la prima guida è come si installa, e la
                   legge chi ha appena ricevuto il link (`guide/Guide.vue`) */
                guide: Guide,
                /* i giochi scritti con la convenzione nuova (`src/giochi/`)
                   si registrano da soli: una riga in `schermate.js` e sono
                   raggiungibili da qui e dall'indirizzo, senza toccare
                   questo elenco ogni volta */
                ...SCHERMATE }

/* English e Spagnolo sono lo stesso componente con dentro due lingue: il
   `key` le tiene separate, altrimenti passando dall'una all'altra Vue
   riuserebbe la schermata di prima con i dati nuovi a metà. */
const lingue = { inglese: 'en', verbi: 'en', spagnolo: 'es' }

/* ---------- entrare da un indirizzo ----------
   `giochi.html#generale` si apre già dentro quella schermata. Non è un
   router: la navigazione resta quella dei tasti e l'indirizzo non viene
   mai riscritto da qui. Serve a due cose vere — i test entrano in una
   schermata senza doverci arrivare a colpi di dito, e un gioco che non
   ha ancora la sua carta in home si può comunque provare.

   Un frammento che non è il nome di una schermata viene ignorato: il
   cheat delle monete (`#monete=500`) passa di qui e non sposta niente.
   Il controllo è `hasOwnProperty` e non `viste[k]` perché `#toString`
   sarebbe altrimenti una schermata valida, e non lo è. */
function dallIndirizzo() {
  if (typeof location === 'undefined') return
  const chiave = (location.hash || '').replace(/^#/, '')
  if (Object.prototype.hasOwnProperty.call(viste, chiave)) vista.value = chiave
}

onMounted(async () => {
  await init()
  dallIndirizzo()
  if (typeof window !== 'undefined') window.addEventListener('hashchange', dallIndirizzo)
  pronto.value = true
})
function vai(v) { vista.value = v }
</script>

<template>
  <div v-if="!pronto" class="schermo">
    <div class="centro"><h1>Un attimo…</h1></div>
  </div>
  <!-- nessun giocatore nell'archivio: si comincia dal nome. Prima di
       qualunque schermata, perché senza un profilo non c'è niente da
       mostrare e niente su cui salvare -->
  <Benvenuto v-else-if="!state.player" />
  <template v-else>
    <component :is="viste[vista]" :lingua="lingue[vista]" @vai="vai"
               :key="vista + state.player" />
    <!-- i giochi sono pensati in verticale: girato, il campo diventa una fessura -->
    <div class="gira"><span class="em">📱</span><b>Gira il telefono</b>
      <span class="mini">i giochi si vedono in verticale</span></div>
    <!-- fuori dalla vista: un traguardo può scattare in qualsiasi gioco.
         La chiave è la stessa della schermata perché il cartello di un
         traguardo appena preso deve sparire quando si cambia bambino:
         `selectPlayer` svuota `state.festa`, ma il cartello già a schermo
         se ne stava lì a fare i complimenti al bambino sbagliato. -->
    <Traguardo :key="state.player" />
  </template>
</template>
