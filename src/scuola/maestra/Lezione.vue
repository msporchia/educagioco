<script setup>
// L'editor di una lezione a blocchi (docs/scuola/lezione.md): nome, i blocchi con cosa si chiede e quando si passa, in tondo; anche da una lezione pronta
import { ref, computed } from 'vue'
import { CATALOGO, valido, descrivi } from '../comune/esercizi.js'
import { MODI_PASSA, MAX_BLOCCHI, modoDi, sogliaDi, descriviPassa, passaValido } from '../comune/lezione.js'
import { quaderno, salva, lezioneDi } from './stato.js'
import * as Q from './quaderno.js'
import { paginaMaestra, copia } from './utili.js'
import { lezioneDa } from '../comune/lezioni-pronte.js'
import SceltaEsercizio from './SceltaEsercizio.vue'
import Conferma from './Conferma.vue'

const props = defineProps({ id: { type: String, default: null }, proposta: { type: Object, default: null } })
const emit = defineEmits(['vai', 'indietro'])

const vecchia = props.id ? lezioneDi(props.id) : null
const primaBase = () => JSON.parse(JSON.stringify(CATALOGO.materie[0].voci[0].base))
const partenza = vecchia ? JSON.parse(JSON.stringify(vecchia))
  : props.proposta ? lezioneDa(props.proposta, Q.nuovoId('l')) : Q.nuovaLezione(primaBase())

// un blocco come lo tocca l'editor: il modo e il numero a parte, così il numero si scrive anche storto e si dice perché
let chiavi = 0
const daBlocco = b => ({ chiave: ++chiavi, esercizio: b.esercizio, modo: modoDi(b.passa), n: sogliaDi(b.passa) })
const nome = ref(partenza.nome)
const blocchi = ref(partenza.blocchi.map(daBlocco))
const inTondo = ref(!!partenza.inTondo)
const copiato = ref(false)
const daCopiare = ref('')

const modo = id => MODI_PASSA.find(m => m.id === id)
const passaDi = b => (modo(b.modo).unita ? { [b.modo]: Number(b.n) } : null)
function scegliModo(b, id) {
  if (b.modo === id) return
  b.modo = id
  b.n = modo(id).base ?? null
}

// la lezione come uscirà: senza nome prende quello del primo esercizio
const pronta = computed(() => {
  const primo = blocchi.value[0]?.esercizio
  const n = Q.nomePulito(nome.value, Q.MAX_NOME_LEZIONE) || (valido(primo) ? descrivi(primo).slice(0, Q.MAX_NOME_LEZIONE) : '')
  return { id: partenza.id, nome: n, blocchi: blocchi.value.map(b => ({ esercizio: b.esercizio, passa: passaDi(b) })), inTondo: inTondo.value }
})
const problema = computed(() => {
  for (const [i, b] of blocchi.value.entries()) {
    const quale = blocchi.value.length > 1 ? `Il blocco ${i + 1}` : 'Il blocco'
    if (!valido(b.esercizio)) return `${quale} così non chiede niente.`
    const m = modo(b.modo)
    if (!passaValido(passaDi(b))) return `${quale}: le ${m.unita} vanno da 1 a ${m.tetto}.`
  }
  return Q.lezioneValida(pronta.value) ? '' : 'La lezione non è completa.'
})

// la nota sotto l'ultimo blocco: cosa succede dopo
const dopoLUltimo = computed(() => {
  if (inTondo.value) return 'Poi si ricomincia dal primo blocco.'
  return modo(blocchi.value.at(-1).modo).unita ? 'Poi il bambino vede «Hai finito!».' : 'Il bambino resta qui finché non premi «Avanti tutti».'
})

// un blocco nuovo ripete l'esercizio dell'ultimo e passa dopo le giuste: si cambia quello che serve
function aggiungi() {
  if (blocchi.value.length >= MAX_BLOCCHI) return
  blocchi.value.push(daBlocco({ esercizio: JSON.parse(JSON.stringify(blocchi.value.at(-1).esercizio)), passa: Q.passaDiBase() }))
}
const togli = i => { if (blocchi.value.length > 1) blocchi.value.splice(i, 1) }
function sposta(i, verso) {
  const j = i + verso
  if (j < 0 || j >= blocchi.value.length) return
  const b = blocchi.value.splice(i, 1)[0]
  blocchi.value.splice(j, 0, b)
}

function salvaLezione() {
  if (problema.value || !Q.salvaLezione(quaderno, pronta.value)) return
  salva(['lezioni'])
  emit('vai', 'inizio')
}
function duplica() {
  const c = Q.duplicaLezione(quaderno, vecchia.id)
  salva(['lezioni'])
  if (c) emit('vai', 'lezione', { id: c.id }, { al_posto: true })
}
function cancella() { Q.cancellaLezione(quaderno, vecchia.id); salva(['lezioni']); emit('indietro') }
async function copiaLink() {
  const link = Q.linkDellaLezione(pronta.value, paginaMaestra())
  if (await copia(link)) { copiato.value = true; daCopiare.value = ''; setTimeout(() => (copiato.value = false), 2500) }
  else daCopiare.value = link
}
</script>

<template>
  <section class="carta" data-editor-lezione>
    <h1>{{ vecchia ? 'Modifica la lezione' : 'Nuova lezione' }}</h1>
    <label>Nome della lezione
      <input v-model="nome" class="campo" :maxlength="Q.MAX_NOME_LEZIONE" :placeholder="pronta.nome || 'per esempio: ripasso del 9'" data-campo="nome-lezione">
    </label>
    <p v-if="props.proposta && !vecchia" class="bene" data-da-pronta>Pronta per la {{ props.proposta.anno }}ª: {{ props.proposta.allena }} Cambia quello che vuoi e salvala.</p>
    <p class="nota">La lezione è una fila di blocchi: ognuno dice cosa si fa e quando si passa al blocco dopo. «Avanti tutti», durante
      la lezione, porta avanti chi è rimasto indietro anche nei blocchi che passano da soli.</p>
  </section>

  <section v-for="(b, i) in blocchi" :key="b.chiave" class="carta" :data-blocco="i">
    <div class="fila tra">
      <h2>{{ blocchi.length > 1 ? `Blocco ${i + 1}` : 'Il blocco' }}</h2>
      <span v-if="blocchi.length > 1" class="fila">
        <button class="bottone chiaro piccolo" :disabled="i === 0" aria-label="sposta su" data-azione="su" @click="sposta(i, -1)">↑</button>
        <button class="bottone chiaro piccolo" :disabled="i === blocchi.length - 1" aria-label="sposta giù" data-azione="giu" @click="sposta(i, 1)">↓</button>
        <button class="bottone chiaro piccolo" aria-label="togli questo blocco" data-azione="togli-blocco" @click="togli(i)">Togli</button>
      </span>
    </div>
    <SceltaEsercizio v-model="b.esercizio" dove="blocco" />
    <div class="gruppo">
      <span class="titoletto">Quando si passa al blocco dopo</span>
      <div class="fila">
        <button v-for="m in MODI_PASSA" :key="m.id" class="tessera" :class="{ scelta: b.modo === m.id }" :aria-pressed="b.modo === m.id"
                :data-passa="m.id" @click="scegliModo(b, m.id)">{{ m.nome }}</button>
      </div>
      <div v-if="modo(b.modo).unita" class="fila">
        <input v-model.number="b.n" class="campo numero" type="number" min="1" :max="modo(b.modo).tetto" data-campo="soglia"
               :aria-label="`quante ${modo(b.modo).unita}`">
        <span>{{ modo(b.modo).unita }}</span>
      </div>
      <p class="nota">{{ passaValido(passaDi(b)) ? `Si passa ${descriviPassa(passaDi(b))}.` : '' }}
        <template v-if="i === blocchi.length - 1">{{ dopoLUltimo }}</template></p>
    </div>
  </section>

  <section class="carta">
    <div class="fila">
      <button v-if="blocchi.length < MAX_BLOCCHI" class="tessera" data-azione="aggiungi-blocco" @click="aggiungi">＋ Aggiungi un blocco</button>
      <span v-else class="nota">Al massimo {{ MAX_BLOCCHI }} blocchi.</span>
    </div>
    <label class="spunta">
      <input v-model="inTondo" type="checkbox" data-campo="in-tondo">
      <span>In tondo: dopo l'ultimo blocco si ricomincia dal primo</span>
    </label>
    <p class="nota">Per i giri a rotazione: più blocchi che passano quando lo dici tu, e a ogni giro premi «Avanti tutti».</p>
  </section>

  <section class="carta">
    <p v-if="problema" class="avviso" data-problema>{{ problema }}</p>
    <div class="fila">
      <button class="bottone" :disabled="!!problema" data-azione="salva-lezione" @click="salvaLezione">Salva la lezione</button>
      <button class="bottone chiaro" :disabled="!!problema" data-azione="copia-link" @click="copiaLink">{{ copiato ? 'Link copiato' : 'Copia il link' }}</button>
      <button v-if="vecchia" class="bottone chiaro" data-azione="duplica" @click="duplica">Duplica</button>
      <Conferma v-if="vecchia" etichetta="Cancella" si="Cancella" data-azione="cancella-lezione" @si="cancella" />
    </div>
    <label v-if="daCopiare">Il browser non lascia copiare: seleziona il link e copialo a mano
      <input class="campo" readonly :value="daCopiare" data-link-lezione @focus="$event.target.select()">
    </label>
    <p class="nota">Il link porta con sé la lezione: chi lo apre nella sua pagina della maestra la vede e può aggiungerla al suo quaderno.</p>
  </section>
</template>

<style scoped>
.numero { width:110px }
.tra { justify-content:space-between }
.gruppo { display:flex; flex-direction:column; gap:6px }
.titoletto { font-size:14px; font-weight:600 }
.spunta { flex-direction:row; align-items:center; gap:10px; font-weight:600 }
.spunta input { width:20px; height:20px; flex:none }
</style>
