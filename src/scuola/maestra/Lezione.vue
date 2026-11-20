<script setup>
// L'editor di una lezione a blocchi (docs/scuola/lezione.md): nome, i blocchi con cosa si chiede e quando si passa, in tondo; anche da una lezione pronta,
// e la lezione in corso da mandare cambiata ai bambini (`inCorso`, docs/scuola/ripieghi.md)
import { ref, computed } from 'vue'
import { CATALOGO, valido, descrivi } from '../comune/esercizi.js'
import { MODI_PASSA, MAX_BLOCCHI, modoDi, sogliaDi, descriviPassa, passaValido, contaDi, modiPassaPer } from '../comune/lezione.js'
import { quaderno, salva, lezioneDi } from './stato.js'
import * as Q from './quaderno.js'
import { paginaMaestra, copia } from './utili.js'
import { lezioneDa } from '../comune/lezioni-pronte.js'
import SceltaEsercizio from './SceltaEsercizio.vue'
import Aiuto from './Aiuto.vue'
import Conferma from './Conferma.vue'
import { cambiaLezione, diretta } from './diretta.js'

const props = defineProps({ id: { type: String, default: null }, proposta: { type: Object, default: null }, inCorso: { type: Boolean, default: false } })
const emit = defineEmits(['vai', 'indietro'])

const vecchia = props.id ? lezioneDi(props.id) : null
const primaBase = () => JSON.parse(JSON.stringify(CATALOGO.materie[0].voci[0].base))
const inCorso = props.inCorso && quaderno.inCorso ? quaderno.inCorso.lezione : null
const partenza = inCorso ? JSON.parse(JSON.stringify(inCorso)) : vecchia ? JSON.parse(JSON.stringify(vecchia))
  : props.proposta ? lezioneDa(props.proposta, Q.nuovoId('l')) : Q.nuovaLezione(primaBase())

// un blocco come lo tocca l'editor: il modo e il numero a parte, così il numero si scrive anche storto e si dice perché
let chiavi = 0
const daBlocco = b => ({ chiave: ++chiavi, esercizio: b.esercizio, modo: modoDi(b.passa), n: sogliaDi(b.passa), cambia: false })
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
// le scelte per «quando si passa», con le parole del gioco del blocco (nel coniglio «livelli», non «domande») e il loro «?»
function scelteDi(b) {
  const c = contaDi(b.esercizio)
  const dove = { maestra: 'Lo dici tu', giuste: cap(c.giuste || ''), domande: cap(c.tante), minuti: 'Minuti' }
  const aiuto = {
    maestra: 'Il bambino resta su questo blocco finché non premi «Chiudi il blocco» nel pannello della lezione: la classe va avanti insieme.',
    giuste: `Ognuno passa da solo quando ha fatto quel numero di ${c.giuste}: chi sbaglia ci resta un po' di più.`,
    domande: `Ognuno passa da solo dopo quel numero di ${c.tante}, giuste o sbagliate.`,
    minuti: 'Ognuno passa da solo dopo quei minuti su questo blocco.',
  }
  const prima = m => (m.id === 'maestra' ? 0 : 1)   // la scelta di base per prima
  return modiPassaPer(b.esercizio).map(m => ({ ...m, nome: dove[m.id], aiuto: aiuto[m.id] })).sort((x, y) => prima(x) - prima(y))
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1)
// un blocco col «dopo N giuste» passato in un gioco che non le conta (il coniglio) ripiega su «dopo N livelli»
function sistemaModo(b) { if (!modiPassaPer(b.esercizio).some(m => m.id === b.modo)) b.modo = 'domande' }
function cambiaEsercizio(b, x) { b.esercizio = x; sistemaModo(b) }

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
  return modo(blocchi.value.at(-1).modo).unita ? 'Poi il bambino vede «Hai finito!».' : 'Il bambino resta qui finché non chiudi il blocco.'
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
const nonMandata = ref('')
function manda() {
  if (problema.value) return
  if (!cambiaLezione(pronta.value)) { nonMandata.value = 'Non c\'è linea: riprova fra un attimo.'; return }
  emit('indietro')
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
    <h1>{{ inCorso ? 'Cambia la lezione in corso' : vecchia ? 'Modifica la lezione' : 'Nuova lezione' }}</h1>
    <p v-if="inCorso" class="bene" data-cambia-in-corso>La mandi ai bambini senza un codice nuovo: ognuno resta al blocco dove si
      trova (il primo è il blocco 1). Se togli blocchi, chi era oltre l'ultimo ha finito. Nel quaderno resta la lezione di prima.</p>
    <label>Nome della lezione
      <input v-model="nome" class="campo" :maxlength="Q.MAX_NOME_LEZIONE" :placeholder="pronta.nome || 'per esempio: ripasso del 9'" data-campo="nome-lezione">
    </label>
    <p v-if="props.proposta && !vecchia" class="bene" data-da-pronta>Pronta per la {{ props.proposta.anno }}ª: {{ props.proposta.allena }} Cambia quello che vuoi e salvala.</p>
    <p class="nota">Una fila di blocchi: ognuno dice a che gioco, cosa si fa e quando si passa al blocco dopo.</p>
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
    <SceltaEsercizio :model-value="b.esercizio" dove="blocco" @update:model-value="x => cambiaEsercizio(b, x)" />
    <div class="gruppo passa">
      <div class="fila">
        <span class="titoletto">Al blocco dopo si passa</span>
        <b :data-passa-scelto="b.modo">{{ passaValido(passaDi(b)) ? descriviPassa(passaDi(b), b.esercizio) : '…' }}</b>
        <button class="bottone chiaro piccolo" :aria-expanded="b.cambia" data-azione="cambia-passa" @click="b.cambia = !b.cambia">
          {{ b.cambia ? 'Fatto' : 'Cambia' }}</button>
      </div>
      <template v-if="b.cambia">
        <div class="fila">
          <span v-for="m in scelteDi(b)" :key="m.id" class="scelta-passa">
            <button class="tessera" :class="{ scelta: b.modo === m.id }" :aria-pressed="b.modo === m.id" :data-passa="m.id"
                    @click="scegliModo(b, m.id)">{{ m.nome }}</button>
            <Aiuto :testo="m.aiuto" />
          </span>
        </div>
        <div v-if="modo(b.modo).unita" class="fila">
          <span>Dopo</span>
          <input v-model.number="b.n" class="campo numero" type="number" min="1" :max="modo(b.modo).tetto" data-campo="soglia"
                 :aria-label="`quante ${modo(b.modo).unita}`">
          <span>{{ b.modo === 'minuti' ? 'minuti' : b.modo === 'giuste' ? contaDi(b.esercizio).giuste : contaDi(b.esercizio).tante }}</span>
        </div>
      </template>
      <p v-if="i === blocchi.length - 1" class="nota">{{ dopoLUltimo }}</p>
    </div>
  </section>

  <section class="carta">
    <div class="fila">
      <button v-if="blocchi.length < MAX_BLOCCHI" class="tessera" data-azione="aggiungi-blocco" @click="aggiungi">＋ Aggiungi un blocco</button>
      <span v-else class="nota">Al massimo {{ MAX_BLOCCHI }} blocchi.</span>
    </div>
    <div class="fila">
      <label class="spunta">
        <input v-model="inTondo" type="checkbox" data-campo="in-tondo">
        <span>In tondo: dopo l'ultimo blocco si ricomincia dal primo</span>
      </label>
      <Aiuto testo="Per i giri a rotazione: per esempio tre giochi, e a ogni giro chiudi il blocco e ognuno passa al gioco dopo." />
    </div>
  </section>

  <section v-if="inCorso" class="carta">
    <p v-if="problema" class="avviso" data-problema>{{ problema }}</p>
    <p v-if="nonMandata" class="avviso" data-messaggio>{{ nonMandata }}</p>
    <div class="fila">
      <button class="bottone" :disabled="!!problema || diretta.linea !== 'su'" data-azione="manda-lezione" @click="manda">Manda ai bambini</button>
      <button class="bottone chiaro" data-azione="annulla" @click="emit('indietro')">Lascia com'era</button>
    </div>
  </section>

  <section v-else class="carta">
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
.campo.numero { width:110px; flex:none }
.tra { justify-content:space-between }
.gruppo { display:flex; flex-direction:column; gap:6px }
.titoletto { font-size:14px; font-weight:600 }
.spunta { flex-direction:row; align-items:center; gap:10px; font-weight:600 }
.passa { padding-top:12px; border-top:1px solid var(--tessera) }
.scelta-passa { display:inline-flex; align-items:center; gap:4px }
.spunta input { width:20px; height:20px; flex:none }
</style>
