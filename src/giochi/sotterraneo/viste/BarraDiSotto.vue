<script setup>
// La barra in basso, come quella di Diablo, la stessa sopra e sotto: a sinistra il globo della vita, a destra quello
// dell'energia delle abilità, in mezzo l'esperienza in una riga col livello e sotto le caselle (bevi, zaino, incanti,
// mappa, gemme) in una cornice di pietra. I globi aprono la finestra dell'eroe; gli incanti da preparare hanno la loro casella. Tutto in CSS e SVG finché la cornice dipinta non è approvata (docs/sotterraneo/barra.md). Le regole non le
// sa: dice solo cosa è stato toccato. `sopra`: sulla terra di sopra la mappa grande non c'è (la terra è già la mappa)
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import Globo from './Globo.vue'
import GloboVivo from './GloboVivo.vue'
import { tema, globi } from '../tema/tema.js'
import Glifo from './Glifo.vue'
import Pixel from './Pixel.vue'
import { BISACCIA } from './pixel.js'

defineProps({
  vita: { type: Number, required: true },
  vitaMax: { type: Number, required: true },
  colpito: { type: Boolean, default: false },
  livello: { type: Number, default: 1 },
  esperienza: { type: Number, default: 0 },     // 0..1 verso il livello dopo
  espFatta: { type: Number, default: 0 },       // e in numeri, dentro questo livello: il globo dice «fatta/serve»
  espServe: { type: Number, default: 0 },
  punti: { type: Number, default: 0 },          // i punti da dare: un «+» sul livello, finché non si danno
  sale: { type: Boolean, default: false },      // un livello appena salito: la riga si accende
  energia: { type: Number, default: 0 },        // l'energia delle abilità (docs/sotterraneo/abilita.md)
  energiaMax: { type: Number, default: 10 },
  puntiAbilita: { type: Number, default: 0 },   // i punti dell'albero: un «+» sul globo dell'energia
  incanti: { type: Array, default: () => [] },  // gli incanti preparati addosso: [{ id, nome, glifo, tinta, passi, dura }], sopra il globo blu (docs/sotterraneo/orologio.md)
  pozioni: { type: Number, default: 0 },
  pieni: { type: Number, default: 0 },          // le tasche occupate
  tasche: { type: Number, default: 6 },
  gemme: { type: Number, default: 0 },
  preparabili: { type: Number, default: 0 },   // gli incantesimi che l'eroe sa e si possono preparare: sulla casella degli incanti
  missioniPronte: { type: Number, default: 0 }, // le missioni fatte, da consegnare: una pastiglia d'oro sul globo rosso
  mappa: { type: Boolean, default: false },     // la mappina è aperta grande
  sopra: { type: Boolean, default: false },
})
defineEmits(['bevi', 'zaino', 'incanti', 'mappa', 'eroe', 'abilita'])
// col tema dei pannelli i globi sono vivi (GloboVivo.vue, strada A o B); senza, quelli di sempre
const vivo = computed(() => tema.value !== 'attuale')
const IlGlobo = computed(() => (vivo.value ? GloboVivo : Globo))

// quanto si alza la barra dal fondo del gioco, punta dei globi compresa, misurato: lo scrive in `--sot-sopra-barra` sulla
// radice `.sot`, e i pannelli che ci poggiano sopra finiscono lì (docs/sotterraneo/barra.md, «Sopra la barra»). Senza la
// misura vale la stima in stile.css. Si misura la scatola dei globi (offsetTop), non il disegno: il battito li scala
const RESPIRO = 6
const nav = ref(null)
let osserva = null, radiceSot = null
function misura() {
  const el = nav.value
  radiceSot = el && el.closest('.sot')
  if (!radiceSot) return
  const lati = [...el.querySelectorAll('.sot-plancia-lato')]
  const cima = el.getBoundingClientRect().top + Math.min(0, ...lati.map(l => l.offsetTop))
  const su = Math.ceil(radiceSot.getBoundingClientRect().bottom - cima + RESPIRO)
  if (su > RESPIRO) radiceSot.style.setProperty('--sot-sopra-barra', su + 'px')
}
onMounted(() => {
  misura()
  if (typeof ResizeObserver === 'function') {
    osserva = new ResizeObserver(misura)
    osserva.observe(nav.value)
    for (const l of nav.value.querySelectorAll('.sot-plancia-lato')) osserva.observe(l)
  }
  addEventListener('resize', misura)
})
onBeforeUnmount(() => {
  if (osserva) osserva.disconnect()
  removeEventListener('resize', misura)
  if (radiceSot) radiceSot.style.removeProperty('--sot-sopra-barra')
})
</script>

<template>
  <nav ref="nav" class="sot-plancia" data-barra-giu :data-barra="sopra ? 'sopra' : 'giu'" aria-label="la barra dell'eroe">
    <div class="sot-plancia-lato sot-plancia-sx">
      <!-- la vita è un tasto: apre la finestra dell'eroe; la pastiglia d'oro dice che c'è una missione da consegnare -->
      <button type="button" class="sot-globo-tasto" data-azione="vita" :data-missioni-pronte="missioniPronte || null"
              :aria-label="`vita ${vita} su ${vitaMax}${missioniPronte ? `: ${missioniPronte} ${missioniPronte === 1 ? 'missione' : 'missioni'} da consegnare` : ''}`"
              @click="$emit('eroe')">
        <component :is="IlGlobo" tipo="vita" :quota="vita / Math.max(1, vitaMax)" :numero="vita" :colpito="colpito"
                   :etichetta="`vita ${vita} su ${vitaMax}`" v-bind="vivo ? { modo: globi } : {}" />
        <b v-if="missioniPronte" class="sot-pastiglia-missioni" aria-hidden="true"><Glifo nome="libro" :misura="12" />{{ missioniPronte }}</b>
      </button>
      <svg class="sot-reggi" viewBox="0 0 100 44" aria-hidden="true"><use href="#sot-reggi" /></svg>
    </div>

    <div class="sot-plancia-mezzo">
      <!-- l'esperienza è una riga sopra le caselle, come in Diablo; il livello a sinistra apre la pagina dell'eroe, e
           il «+» d'oro dice che ci sono punti da dare alle caratteristiche -->
      <div class="sot-esp-riga" :class="{ 'sot-acceso': sale }">
        <button type="button" class="sot-livello" data-azione="eroe-pagina" :data-livello="livello" :data-punti="punti || null"
                :aria-label="`livello ${livello}${punti ? `: ${punti} ${punti === 1 ? 'punto' : 'punti'} da dare` : ''}`"
                @click="$emit('eroe')">
          <b>{{ livello }}</b>
          <i v-if="punti" class="sot-punti sot-punti-piccolo" aria-hidden="true">+</i>
        </button>
        <span class="sot-esp" data-esperienza-barra :data-quota="Math.max(0, Math.min(1, esperienza)).toFixed(2)" role="img"
              :aria-label="`esperienza ${espFatta} su ${espServe}`">
          <u :style="{ width: Math.max(0, Math.min(1, esperienza)) * 100 + '%' }"></u>
          <small class="sot-esp-numero">{{ espServe ? `${espFatta}/${espServe}` : '' }}</small>
        </span>
      </div>
      <div class="sot-caselle">
        <button type="button" class="sot-cella" :class="{ 'sot-vuota': !pozioni }" data-casella-barra="pozione"
                data-azione="bevi" :data-n="pozioni" :aria-label="pozioni ? 'bevi una pozione' : 'nessuna pozione'"
                @click="$emit('bevi')">
          <span class="em">🧪</span><b>{{ pozioni }}</b>
        </button>
        <button type="button" class="sot-cella" data-casella-barra="zaino" data-azione="zaino" :data-n="pieni"
                aria-label="zaino" @click="$emit('zaino')">
          <Pixel :figura="BISACCIA" :scala="2" /><b>{{ pieni }}/{{ tasche }}</b>
        </button>
        <!-- gli incanti da preparare: quanti ne hai addosso su quanti ne sai; spenta se non ne sai nessuno o sei sopra, ma si tocca lo stesso e dice perché -->
        <button type="button" class="sot-cella" :class="{ 'sot-pronta': incanti.length, 'sot-vuota': sopra || !preparabili }" data-casella-barra="incanti"
                data-azione="incanti" :data-n="incanti.length" :data-preparabili="preparabili"
                :aria-label="incanti.length ? `incanti addosso: ${incanti.length} su ${preparabili}` : preparabili ? `incanti da preparare: ${preparabili}` : 'incanti da preparare: nessuno'"
                @click="$emit('incanti')">
          <Glifo nome="incanto" :misura="19" /><b>{{ incanti.length }}/{{ preparabili }}</b>
        </button>
        <button type="button" class="sot-cella" :class="{ 'sot-vuota': sopra }" data-casella-barra="mappa"
                data-azione="mappina" :disabled="sopra" :aria-label="sopra ? 'la mappa: sei già sopra' : 'la mappa'"
                :aria-pressed="mappa ? 'true' : 'false'" @click="$emit('mappa')">
          <span class="em">🗺️</span>
        </button>
        <button type="button" class="sot-cella" data-casella-barra="gemme" data-gemme-barra :data-n="gemme"
                :aria-label="`gemme: ${gemme}`" @click="$emit('zaino')">
          <span class="em">💎</span><b>{{ gemme }}</b>
        </button>
      </div>
    </div>

    <div class="sot-plancia-lato sot-plancia-dx">
      <!-- gli incanti preparati addosso, con i passi che restano: stanno sul globo che li ha pagati, e si toccano come la loro casella -->
      <button v-if="incanti.length" type="button" class="sot-incanti" data-incanti :aria-label="`incanti addosso: ${incanti.map(x => `${x.nome}, ${x.passi} passi`).join('; ')}`"
              @click="$emit('incanti')">
        <span v-for="x in incanti" :key="x.id" class="sot-incanto" :data-incanto="x.id" :data-passi="x.passi" :class="{ 'sot-incanto-fine': x.passi <= 10 }"
              :style="{ '--tinta': x.tinta, '--quota': Math.max(0.08, Math.min(1, x.passi / x.dura)) }">
          <Glifo :nome="x.glifo" :misura="13" /><b>{{ x.passi }}</b>
        </span>
      </button>
      <!-- l'energia delle abilità: un tocco apre l'albero (la scheda Abilità); il «+» dice che ci sono punti da dare -->
      <button type="button" class="sot-globo-tasto" data-azione="abilita" :data-punti-abilita="puntiAbilita || null"
              :aria-label="`energia ${energia} su ${energiaMax}${puntiAbilita ? `: ${puntiAbilita} da imparare` : ''}`"
              @click="$emit('abilita')">
        <component :is="IlGlobo" tipo="energia" :quota="energia / Math.max(1, energiaMax)" :numero="energia"
                   :etichetta="`energia ${energia} su ${energiaMax}`" v-bind="vivo ? { modo: globi } : {}" />
        <b v-if="puntiAbilita" class="sot-punti" aria-hidden="true">+</b>
      </button>
      <svg class="sot-reggi" viewBox="0 0 100 44" aria-hidden="true"><use href="#sot-reggi" /></svg>
    </div>

    <!-- l'ornamento che regge i globi, disegnato una volta: una coppa di pietra col filo d'oro e due riccioli -->
    <svg width="0" height="0" class="sot-plancia-defs" aria-hidden="true">
      <defs>
        <linearGradient id="sot-pietra-reggi" x1="0" y1="0" x2="0" y2="1">
          <!-- i colori della pietra da variabili col ripiego di sempre: il tema dei pannelli li fa d'ottone -->
          <stop offset="0" style="stop-color: var(--reggi-1, #77717f)" /><stop offset=".45" style="stop-color: var(--reggi-2, #46414f)" />
          <stop offset="1" style="stop-color: var(--reggi-3, #211e26)" />
        </linearGradient>
        <g id="sot-reggi">
          <path d="M2 8C5 30 26 42 50 42S95 30 98 8L88 6C86 24 69 33 50 33S14 24 12 6Z"
                fill="url(#sot-pietra-reggi)" stroke="#0b0a0e" stroke-width="1.6" stroke-linejoin="round" />
          <path d="M6 13C10 30 30 38.5 50 38.5S90 30 94 13" fill="none" stroke="#0007" stroke-width="1.1" />
          <path d="M12 6C14 24 31 33 50 33S86 24 88 6" fill="none" stroke="#d8a845" stroke-width="1.8" />
          <circle cx="7" cy="7" r="6" fill="url(#sot-pietra-reggi)" stroke="#0b0a0e" stroke-width="1.4" />
          <circle cx="93" cy="7" r="6" fill="url(#sot-pietra-reggi)" stroke="#0b0a0e" stroke-width="1.4" />
          <path d="M7 7m-3 0a3 3 0 1 1 3 3" fill="none" stroke="#d8a845" stroke-width="1.3" />
          <path d="M93 7m3 0a3 3 0 1 0-3 3" fill="none" stroke="#d8a845" stroke-width="1.3" />
          <path d="M50 34.5l3.6 3.9-3.6 3.9-3.6-3.9z" fill="#ffd977" stroke="#7a4f12" stroke-width=".9" />
        </g>
      </defs>
    </svg>
  </nav>
</template>
