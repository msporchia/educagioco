<script setup>
/* ═══════════════════════════════════════════════════════════════════
   UN PROGETTO: COME SI CHIAMA, CHE FACCIA HA, CHE MISURE VUOLE

   Il nome lo sceglie il bambino — dare un nome a un pezzo di programma
   *è* la lezione dei progetti, e a nove anni una tastiera non è più un
   muro. Ma si può anche solo toccare: la figurina propone il suo nome
   («🏛️ → colonna»), e le misure hanno i loro nomi pronti (alta, larga,
   lunga…).

   Le misure (i parametri) ci sono solo nei livelli che le insegnano, e
   sono al massimo quattro: la torre del casaro ne vuole tante — quanto è
   alta, e le tre assi di partenza, arrivo e appoggio.
   Una misura rinominata porta con sé le righe che la usano, e toglierne
   una sistema tutte le chiamate: lo fa `aggiornaProgetto`, qui si
   raccoglie soltanto cosa vuole il bambino.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import { ICONE_PROGETTI, NOMI_MISURE, NOMI_MISURE_COLORE } from './frasi.js'

const props = defineProps({
  progetto: { type: Object, default: null },     // null = nuovo
  conMisure: { type: Boolean, default: false },
  /* le misure di tipo colore, nei livelli che hanno più di un colore */
  conColori: { type: Boolean, default: false },
  nomiPresi: { type: Array, default: () => [] },
})
const emit = defineEmits(['salva', 'elimina', 'chiudi'])

const icona = ref(props.progetto ? props.progetto.icona : ICONE_PROGETTI[0][0])
const nome = ref(props.progetto ? props.progetto.nome : '')
/* una misura è un numero o un colore: la bandiera riceve un colore,
   la colonna un numero */
const misure = ref(props.progetto
  ? props.progetto.misure.map(m => ({ nome: m, da: m, tipo: (props.progetto.tipi || {})[m] === 'colore' ? 'colore' : 'numero' }))
  : [])
const conferma = ref(false)
const MISURE_MAX = 4

function figurina([e, n]) {
  const prima = ICONE_PROGETTI.find(x => x[0] === icona.value)
  icona.value = e
  if (!nome.value || (prima && nome.value === prima[1])) nome.value = n
}
if (!props.progetto) nome.value = ICONE_PROGETTI[0][1]

const pulito = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 14)
const nomeBuono = computed(() => {
  const n = pulito(nome.value)
  return n && (!props.nomiPresi.includes(n) || (props.progetto && props.progetto.nome === n))
})
const misureBuone = computed(() => {
  const n = misure.value.map(m => pulito(m.nome).replace(/\s+/g, '-'))
  return n.every(x => /^[a-zà-ù][a-zà-ù0-9-]*$/.test(x)) && new Set(n).size === n.length
})

function aggiungiMisura(tipo = 'numero') {
  const proposte = tipo === 'colore' ? ['tinta', 'colore', 'vernice'] : NOMI_MISURE
  const libero = proposte.find(n => !misure.value.some(m => m.nome === n)) || 'm'
  misure.value.push({ nome: libero, da: null, tipo })
}
function salva() {
  if (!nomeBuono.value || !misureBuone.value) return
  emit('salva', {
    nome: pulito(nome.value), icona: icona.value,
    misure: misure.value.map(m => ({ nome: pulito(m.nome).replace(/\s+/g, '-'), da: m.da, tipo: m.tipo })),
  })
}
</script>

<template>
  <div class="cst-velo" @click.self="emit('chiudi')">
    <div class="cst-foglio" data-foglio-progetto>
      <button type="button" class="cst-chiudi" aria-label="chiudi" data-chiudi @click="emit('chiudi')">✕</button>
      <h3>{{ progetto ? 'Il progetto' : 'Un progetto nuovo' }}</h3>
      <p class="cst-piccolo">Un progetto è un pezzo di programma con un nome: si scrive una volta e si chiama quante volte vuoi.</p>

      <div class="cst-figurine">
        <button v-for="f in ICONE_PROGETTI" :key="f[0]" type="button" class="cst-figurina"
                :class="{ 'cst-su': icona === f[0] }" @click="figurina(f)">{{ f[0] }}</button>
      </div>
      <label class="cst-campo-testo">
        <span>nome</span>
        <input v-model="nome" data-nome-progetto maxlength="14" autocomplete="off" autocapitalize="none">
      </label>
      <p v-if="!nomeBuono" class="cst-avviso">Serve un nome, e non uno già usato da un altro progetto.</p>

      <template v-if="conMisure">
        <h4>Le misure <small>(quello che il progetto riceve quando lo chiami)</small></h4>
        <div v-for="(m, k) in misure" :key="k" class="cst-misura-riga">
          <span class="cst-tipo-misura">{{ m.tipo === 'colore' ? '🎨' : '🔢' }}</span>
          <input v-model="m.nome" maxlength="10" autocomplete="off" autocapitalize="none" :data-misura="k">
          <button v-for="s in (m.tipo === 'colore' ? NOMI_MISURE_COLORE : NOMI_MISURE).slice(0, 4)" :key="s" type="button"
                  class="cst-chip" @click="m.nome = s">{{ s }}</button>
          <button type="button" class="cst-chip cst-via-chip" aria-label="togli la misura" @click="misure.splice(k, 1)">✕</button>
        </div>
        <div v-if="misure.length < MISURE_MAX" class="cst-fila">
          <button type="button" class="cst-chip cst-nuova" data-azione="aggiungi-misura"
                  @click="aggiungiMisura('numero')">＋ 🔢 una misura che è un numero</button>
          <button v-if="conColori" type="button" class="cst-chip cst-nuova" data-azione="aggiungi-colore"
                  @click="aggiungiMisura('colore')">＋ 🎨 una misura che è un colore</button>
        </div>
        <p v-if="!misureBuone" class="cst-avviso">Ogni misura vuole un nome diverso, fatto di lettere.</p>
      </template>

      <div class="cst-tasti-foglio">
        <button v-if="progetto && !conferma" type="button" class="cst-secondario" @click="conferma = true">🗑 elimina</button>
        <button v-if="conferma" type="button" class="cst-pericolo" data-azione="elimina-progetto"
                @click="emit('elimina')">sì, elimina il progetto e le sue chiamate</button>
        <button type="button" class="cst-primario" data-azione="salva-progetto" :disabled="!nomeBuono || !misureBuone"
                @click="salva">{{ progetto ? 'Salva' : 'Crea' }}</button>
      </div>
    </div>
  </div>
</template>
