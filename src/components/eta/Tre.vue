<script setup>
// tacca a tre posizioni condivisa da InCasa.vue e Scuola.vue: sceglie chi decide (età o grande), non "quanto" (vedi docs/genitori/ritocchi.md). Non salva niente.
import { ref, computed } from 'vue'

const props = defineProps({
  radice: { type: String, required: true },   // data-<radice>="<chiave>"
  tasti: { type: String, required: true },    // data-<tasti>="giu|su|applica|lascia"
  ora: { type: String, required: true },      // data-<ora> sul nome della posizione
  chiave: { type: String, default: '' },
  titolo: { type: String, required: true },
  scelte: { type: Array, required: true }, // le tre posizioni, dal meno al più: { chiave, nome, che }
  scelto: { type: String, default: 'difetto' },
  spiega: { type: String, default: '' }, // cosa vuol dire «come dice l'età» qui e adesso: la posizione di mezzo non parla da sé
  // le chiavi che qui non si raggiungono, restano visibili sbiadite: la tacca dice anche dov'è la casa
  bloccate: { type: Array, default: () => [] },
  versi: { type: Array, default: () => ['verso il meno', 'verso il più'] }, // per chi non vede lo schermo
})
const emit = defineEmits(['applica', 'chiudi'])

const dove = ref(Math.max(0, props.scelte.findIndex(x => x.chiave === props.scelto)))
const posizione = computed(() => props.scelte[dove.value])
const ultima = computed(() => props.scelte.length - 1)

const spiegazione = computed(() => posizione.value.chiave === 'difetto'
  ? (props.spiega || posizione.value.che) : posizione.value.che)

const cambiata = computed(() => posizione.value.chiave !== props.scelto)

const puo = i => i >= 0 && i <= ultima.value &&
  !props.bloccate.includes(props.scelte[i].chiave)
const muovi = passo => { if (puo(dove.value + passo)) dove.value += passo }
</script>

<template>
  <!-- `.stop`: vive dentro una riga che si apre al tocco -->
  <div class="tre" v-bind="{ [`data-${radice}`]: chiave }" @click.stop>
    <p class="dice">{{ titolo }}</p>

    <div class="tacca">
      <button type="button" class="freccia" v-bind="{ [`data-${tasti}`]: 'giu' }"
              :disabled="!puo(dove - 1)" :aria-label="versi[0]" @click="muovi(-1)">◀</button>
      <span class="valore">
        <b v-bind="{ [`data-${ora}`]: '' }">{{ posizione.nome }}</b>
        <em>{{ spiegazione }}</em>
      </span>
      <button type="button" class="freccia" v-bind="{ [`data-${tasti}`]: 'su' }"
              :disabled="!puo(dove + 1)" :aria-label="versi[1]" @click="muovi(1)">▶</button>
    </div>

    <div class="puntini">
      <span v-for="(s, i) in scelte" :key="s.chiave"
            :class="{ ora: i === dove, casa: s.chiave === 'difetto',
                      chiusa: bloccate.includes(s.chiave) }"></span>
    </div>

    <div class="riga">
      <button type="button" class="bottone chiaro" v-bind="{ [`data-${tasti}`]: 'lascia' }"
              @click="emit('chiudi')">Lascia stare</button>
      <button type="button" class="bottone" v-bind="{ [`data-${tasti}`]: 'applica' }"
              :disabled="!cambiata"
              @click="emit('applica', posizione.chiave)">Conferma</button>
    </div>
  </div>
</template>

<style scoped>
.tre { display:flex; flex-direction:column; gap:7px; margin:6px 0 2px;
       background:#f7f5ff; border-radius:13px; padding:9px 10px }
.dice { margin:0; font-size:10.5px; color:#8a8a99; text-align:center }

.tacca { display:flex; align-items:center; gap:8px; background:#fff; border-radius:12px;
         padding:6px 7px; box-shadow:0 1px 4px #0000000f }
.freccia { border:none; background:#f0eaff; color:#5b3fa8; font-size:15px; line-height:1;
           width:38px; height:38px; border-radius:12px; cursor:pointer; font-family:inherit;
           flex:none }
.freccia:disabled { opacity:.28; cursor:default }
.freccia:active:not(:disabled) { transform:translateY(1px) }
.valore { flex:1; min-width:0; text-align:center; display:flex; flex-direction:column; gap:1px }
.valore b { font-size:14px; font-weight:850; color:var(--viola-scuro) }
.valore em { font-style:normal; font-size:10.5px; color:#7a7a8a; line-height:1.25 }

.puntini { display:flex; align-items:center; justify-content:center; gap:5px }
.puntini span { width:6px; height:6px; border-radius:50%; background:#ded8ee }
/* dov'è la taratura di casa: un cerchietto vuoto, così si vede da che
   punto ci si è allontanati */
.puntini span.casa { background:#fff; box-shadow:inset 0 0 0 2px #b9b0d6 }
.puntini span.ora { background:var(--viola); box-shadow:none; transform:scale(1.35) }
/* una posizione che non si raggiunge resta al suo posto, sbiadita: la
   fila deve continuare a dire quante sono e dov'è la casa */
.puntini span.chiusa { opacity:.3 }

.riga { display:flex; gap:6px }
.bottone { flex:1; border:none; border-radius:12px; padding:9px 6px; font-family:inherit;
           font-size:12.5px; font-weight:800; cursor:pointer; color:#fff;
           background:linear-gradient(180deg, var(--viola), var(--viola-scuro)) }
.bottone.chiaro { color:var(--viola-scuro); background:#eee9fb }
.bottone:disabled { opacity:.35; cursor:default }
.bottone:active:not(:disabled) { transform:translateY(1px) }
</style>
