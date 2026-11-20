<script setup>
// L'app della maestra: il quaderno e la lezione in corso (docs/scuola/quaderno.md). Le schermate si impilano: ← toglie l'ultima.
import { ref, computed, nextTick } from 'vue'
import { quaderno, avvisi } from './stato.js'
import { riprendi } from './diretta.js'
import { lezioneDalLink } from './quaderno.js'
import Inizio from './Inizio.vue'
import Classe from './Classe.vue'
import Lezione from './Lezione.vue'
import LezioneDalLink from './LezioneDalLink.vue'
import Avvia from './Avvia.vue'
import Diretta from './Diretta.vue'
import Resoconto from './Resoconto.vue'
import Storico from './Storico.vue'
import Bambino from './Bambino.vue'

const versione = __VERSIONE_SCUOLA__
const VISTE = { inizio: Inizio, classe: Classe, lezione: Lezione, link: LezioneDalLink, avvia: Avvia, diretta: Diretta,
                resoconto: Resoconto, storico: Storico, bambino: Bambino }
const TITOLI = { inizio: 'Educagioco a scuola', classe: 'La classe', lezione: 'La lezione', link: 'Una lezione dal link',
                 avvia: 'Avvia la lezione', diretta: 'La lezione', resoconto: 'Il resoconto', storico: 'Lo storico', bambino: 'Lo storico' }

const pila = ref([{ nome: 'inizio' }])
const qui = computed(() => pila.value[pila.value.length - 1])
const dati = computed(() => { const { nome, ...resto } = qui.value; return resto })
const radice = ref(null)
const linkRotto = ref(false)

function cima() { nextTick(() => radice.value?.scrollTo?.(0, 0)) }
/* `al_posto`: la schermata nuova prende il posto di questa (l'avvio diventa la lezione, la lezione il resoconto) */
function vai(nome, dati = {}, { al_posto = false } = {}) {
  if (nome === 'inizio') pila.value = [{ nome: 'inizio' }]
  else if (al_posto) pila.value = [...pila.value.slice(0, -1), { nome, ...dati }]
  else pila.value = [...pila.value, { nome, ...dati }]
  cima()
}
function indietro() { if (pila.value.length > 1) pila.value = pila.value.slice(0, -1); cima() }

riprendi()
if (quaderno.inCorso) vai('diretta')
if (/#(?:.*&)?lezione=/.test(location.hash)) {
  const l = lezioneDalLink(location.hash)
  if (l) vai('link', { lezione: l })
  else linkRotto.value = true
  history.replaceState(null, '', location.pathname + location.search)
}
</script>

<template>
  <div ref="radice" class="schermo pulito maestra" :data-schermata="qui.nome">
    <header class="barra-maestra no-stampa">
      <button v-if="pila.length > 1" class="torna" aria-label="indietro" @click="indietro">←</button>
      <b class="dove">{{ TITOLI[qui.nome] }}</b>
    </header>
    <div class="pagina">
      <p v-if="avvisi.pieno" class="avviso no-stampa" data-avviso="pieno">
        Il browser non riesce più a scrivere il quaderno (è pieno o vietato): salva subito il quaderno in un file.
      </p>
      <p v-if="linkRotto && qui.nome === 'inizio'" class="avviso no-stampa" data-avviso="link-rotto">
        Il link della lezione è rotto o incompleto: chiedi di mandarlo di nuovo.
      </p>
      <component :is="VISTE[qui.nome]" :key="pila.length + qui.nome" v-bind="dati" @vai="vai" @indietro="indietro" />
    </div>
    <span class="versione mini no-stampa" data-versione>{{ versione }}</span>
  </div>
</template>

<style scoped>
.barra-maestra { display:flex; align-items:center; gap:10px; flex:none; padding:10px 16px; position:sticky; top:0; z-index:5;
                 background:var(--superficie); box-shadow:0 1px 0 var(--filo) }
.dove { font-size:16px; font-weight:600; color:var(--inchiostro); white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.torna { width:40px; height:40px; border-radius:50%; flex:none; font-size:21px; font-weight:900; line-height:1; color:#fff;
         background:linear-gradient(180deg,var(--viola),var(--viola-scuro)); box-shadow:0 3px 0 #2c4283 }
.torna:active { transform:translateY(2px); box-shadow:0 1px 0 #2c4283 }
.versione { position:fixed; right:8px; bottom:6px; opacity:.7; pointer-events:none }
</style>
