<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA BARRA IN CIMA, UGUALE OVUNQUE

   Ogni schermata si era fatta la sua: chi con ‹, chi con ←, chi con ✕,
   chi a sinistra e chi a destra, e nel castello i gettoni erano così
   tanti che il tasto per uscire finiva fuori dallo schermo. Per un
   bambino "come si torna indietro" deve essere una cosa sola, sempre
   nello stesso posto — non un indovinello per schermata.

   Regole: il tasto per tornare indietro è **sempre** il primo a sinistra
   ed è **sempre** ‹; il nome di dove sei sta accanto; quello che il gioco
   vuole mostrare va nello slot, che scorre in mezzo; audio (e monete, se
   servono) chiudono a destra. Niente sparisce mai al restringersi dello
   schermo: si stringe solo la parte in mezzo.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import { state, accendiSuono } from '../store/profile.js'
import { suono } from '../audio.js'
import { aiutoDi } from '../guide/contenuti.js'
import VeloAiuto from '../guide/VeloAiuto.vue'

const props = defineProps({
  titolo: { type: String, default: '' },
  monete: { type: Boolean, default: false },   // in battaglia contano altre valute
  audio: { type: Boolean, default: true },
  scura: { type: Boolean, default: false },    // per i fondi notturni, tipo lo spazio
  /* ── IL `?` ──
     La chiave della schermata (`torri`, `fattoria`, …). Se in
     `guide/contenuti.js` non c'è niente sotto quel nome il tasto non
     compare affatto: un `?` che apre un foglio vuoto è peggio di
     nessun `?`. Chi ha un orologio che gira ascolti `@aiuto`, che dice
     quando il foglio si apre e quando si chiude. */
  guida: { type: String, default: '' },
})
const emit = defineEmits(['indietro', 'aiuto'])

const aiuto = computed(() => aiutoDi(props.guida))
const apertoAiuto = ref(false)
function mostraAiuto (v) { apertoAiuto.value = v; emit('aiuto', v) }

/* ── PERCHÉ NON SI APRE DA SOLA ──
   Era stato provato: al primo ingresso il foglio si presentava da sé,
   una volta per gioco. Non regge al banco di prova vero, che sono i
   bambini — **un velo che compare all'apertura lo chiudono senza
   leggerlo**, per riflesso, e per giunta insegna proprio quello: che i
   cartelli si mandano via. Una spiegazione letta a forza vale zero, e in
   cambio si è addestrato il dito a saltare qualunque cosa compaia.
   Quindi il `?` resta un tasto, e si apre quando lo si tocca. Il posto
   dove insegnare *giocando* non è un velo prima della partita: è una
   riga dentro la partita, come i primi passi del tower defense
   (`views/TowerDefense.vue`). */
</script>

<template>
  <header class="barra-app" :class="{ scura }">
    <button class="tondo torna" aria-label="indietro" @click="$emit('indietro')">←</button>
    <b v-if="titolo" class="dove">{{ titolo }}</b>
    <div class="mezzo"><slot /></div>
    <!-- prima dell'audio e mai al posto di «indietro»: la mano di un
         bambino torna sempre nello stesso angolo -->
    <button v-if="aiuto" class="tondo" aria-label="aiuto" data-azione="aiuto"
            @click="mostraAiuto(true)">?</button>
    <div v-if="monete" class="gettone">🪙 <b>{{ state.profile.coins }}</b></div>
    <!-- passa dallo store e non da `suono.muta()`: così la scelta si
         salva nel profilo di chi sta giocando invece di sparire -->
    <button v-if="audio" class="tondo" aria-label="suono"
            @click="accendiSuono(!suono.acceso.value)">
      {{ suono.acceso.value ? '🔊' : '🔇' }}
    </button>
  </header>
  <VeloAiuto v-if="apertoAiuto && aiuto" :aiuto="aiuto" @chiudi="mostraAiuto(false)" />
</template>

<style scoped>
.barra-app { display:flex; align-items:center; gap:6px; flex:none;
             padding:calc(8px + env(safe-area-inset-top)) 8px 8px;
             background:#ffffff88; backdrop-filter:blur(6px);
             box-shadow:0 1px 0 #00000010; position:relative; z-index:20 }
/* il nome di dove si è: si accorcia lui quando lo spazio manca, mai i tasti */
.dove { font-size:clamp(13px,3.8vw,16px); color:var(--viola-scuro); white-space:nowrap;
        overflow:hidden; text-overflow:ellipsis; max-width:38vw }
.mezzo { flex:1; min-width:0; display:flex; align-items:center; gap:6px;
         justify-content:flex-end; overflow:hidden }
.barra-app .tondo { flex:none }
/* il `?` non deve competere col tasto per tornare indietro: stessa forma
   degli altri tondi chiari, nessun colore che chiami */
.barra-app .tondo[aria-label="aiuto"] { font-weight:900; color:var(--viola-scuro) }
/* Il tasto per tornare indietro è il solo che un bambino deve trovare senza
   cercarlo: pieno, colorato, con l'ombra sotto come i bottoni veri, e una
   freccia intera invece di un accento. Gli altri restano chiari. */
.torna { background:linear-gradient(180deg,var(--viola),var(--viola-scuro));
         color:#fff; font-size:clamp(19px,5vw,23px); font-weight:900; line-height:1;
         width:clamp(38px,10.5vw,44px); height:clamp(38px,10.5vw,44px);
         box-shadow:0 3px 0 #2c4283 }
.torna:active { transform:translateY(2px); box-shadow:0 1px 0 #2c4283 }

/* sul fondo dello spazio la barra chiara accecava: stessa forma, altri colori */
.barra-app.scura { background:#141c2aaa; box-shadow:0 1px 0 #ffffff18 }
.barra-app.scura .dove { color:#d3ddf2 }
.barra-app.scura :deep(.gettone) { background:#ffffff1c; color:#eef2fa }
.barra-app.scura :deep(.tondo) { background:#ffffff20; color:#eef2fa }
.barra-app.scura .torna { background:linear-gradient(180deg,#7f97e0,#4a63c4);
                          color:#fff; box-shadow:0 3px 0 #27386e }
</style>
