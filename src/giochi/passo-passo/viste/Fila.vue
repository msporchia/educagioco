<script setup>
/* La fila — il programma del bambino, una tessera per carta (vedi
   docs/passo-passo/regole.md). Le scatole le disegna `Carte.vue`, che si
   chiama da sé; con lo zaino, dopo l'ultima carta ci sono tanti posti
   tratteggiati quante carte ci stanno ancora. Il consiglio del 💡 compare
   qui, accanto al cursore, e non solo sul suo tasto: l'anello attorno al
   tasto da solo non lo vedeva nessuno. Riceve tutto già deciso e non tocca
   niente: dice solo dove si è toccato, e dove è caduta una carta trascinata
   (docs/passo-passo/zaino.md). */
import { ref, computed, watch, nextTick, provide, onBeforeUnmount } from 'vue'
import Carte from './Carte.vue'
import { albero, carteDi, conCicli, eApri, chiusuraDi } from '../dati/carte.js'
import { gestoDelDito, postoSotto, puntiDellaFila, scatolaDi } from './trascina.js'

const props = defineProps({
  fila: { type: Array, required: true },
  cursore: { type: Number, required: true },
  corrente: { type: Number, default: -1 },       // la tessera che sta girando
  guasto: { type: Number, default: null },       // dove la fila si è fermata male
  inCorsa: { type: Boolean, default: false },
  sospette: { type: Boolean, default: false },   // un aiuto ha messo il cursore in mezzo
  consiglio: { type: String, default: null },    // la carta che l'aiuto propone
  piena: { type: Boolean, default: false },      // la fila non ne tiene altre
  zaino: { type: Number, default: null },        // quante carte tiene, dove c'è lo zaino
  giri: { type: Array, default: null },          // a che giro sono le scatole
  scelta: { type: Number, default: null },       // la scatola di cui si sta scegliendo il numero
  consiglioTesta: { type: Number, default: null }, // la scatola a cui l'aiuto cambia il numero
})
const emit = defineEmits(['cursore', 'freccia', 'testa', 'sposta'])

const scatola = ref(null)
const nodi = computed(() => albero(props.fila))
const fantasma = computed(() => !!props.consiglio && !props.inCorsa && !props.piena)
/* i posti dello zaino ancora vuoti: il consiglio del 💡, se c'è, ne
   occupa già uno — è una carta che sta per entrare */
const liberi = computed(() => (props.zaino
  ? Math.max(0, props.zaino - carteDi(props.fila) - (fantasma.value ? 1 : 0)) : 0))

/* la carta al dito: `da` è la sua testa o la sua tessera, `posa` dove cadrebbe */
const presa = ref(null)
const pupazzo = ref(null)
const scorre = ref(false)
const fondoLibero = computed(() => liberi.value > 0)
const segno = computed(() => (presa.value ? presa.value.posa : props.cursore))

provide('fila', {
  s: computed(() => ({
    cursore: props.cursore, corrente: props.corrente, guasto: props.guasto,
    inCorsa: props.inCorsa, sospette: props.sospette, consiglio: props.consiglio,
    fantasma: fantasma.value,
    giri: props.giri, scelta: props.scelta, consiglioTesta: props.consiglioTesta,
    piatta: !conCicli(props.fila),
    presa: presa.value?.da ?? null, posa: presa.value ? presa.value.posa ?? -1 : null,
    fondoLibero: fondoLibero.value,
    scatolaQui: props.inCorsa && !presa.value ? null : scatolaDi(nodi.value, segno.value),
  })),
  tocca: p => { if (!props.inCorsa) emit('cursore', p) },
  /* una tessera: il cursore dopo di lei, o prima se c'era già */
  toccaTessera: i => { if (!props.inCorsa) emit('cursore', props.cursore === i + 1 ? i : i + 1) },
  testa: i => { if (!props.inCorsa) emit('testa', i) },
  metti: t => { if (!props.inCorsa) emit('freccia', t) },
  prendi,
})

/* ═══════════ trascinare una carta ═══════════
   Fermo è un tocco, e lo fa il click; il resto lo decide il movimento
   (docs/core/il-dito.md). La tessera ha `touch-action: none`, quindi lo
   scorrimento partito da lei lo fa la fila a mano. */
let dito = null

function prendi(e, i) {
  if (props.inCorsa || (e.pointerType === 'mouse' && e.button !== 0)) return
  const el = e.currentTarget
  dito = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), i, stato: 'attesa',
           mouse: e.pointerType === 'mouse', cima: scatola.value.scrollTop,
           pezzo: el.classList.contains('pp-testa') ? el.parentElement : el }
  window.addEventListener('pointermove', muovi)
  window.addEventListener('pointerup', lascia)
  window.addEventListener('pointercancel', smetti)
}

function alza(e) {
  const r = dito.pezzo.getBoundingClientRect()
  const copia = dito.pezzo.cloneNode(true)
  for (const n of [copia, ...copia.querySelectorAll('*')]) {
    for (const a of [...n.attributes]) if (a.name.startsWith('data-')) n.removeAttribute(a.name)
  }
  pupazzo.value.replaceChildren(copia)
  dito.presa = { dx: e.clientX - r.left, dy: e.clientY - r.top }
  dito.stato = 'trascina'
  presa.value = { da: dito.i, posa: null }
}

function muovi(e) {
  if (!dito || e.pointerId !== dito.id) return
  const dx = e.clientX - dito.x, dy = e.clientY - dito.y
  if (dito.stato === 'attesa') {
    const g = gestoDelDito({ dx, dy, ms: performance.now() - dito.t, mouse: dito.mouse, puoScorrere: scorre.value })
    if (g === 'fermo') return
    if (g === 'scorri') dito.stato = 'scorri'
    else alza(e)
  }
  if (dito.stato === 'scorri') { scatola.value.scrollTop = dito.cima - dy; return }
  pupazzo.value.style.transform = `translate(${e.clientX - dito.presa.dx}px, ${e.clientY - dito.presa.dy}px)`
  const r = scatola.value.getBoundingClientRect()
  // contro il bordo la fila scorre da sé, se è più lunga di quello che si vede
  if (e.clientY < r.top + 16) scatola.value.scrollTop -= 6
  else if (e.clientY > r.bottom - 16) scatola.value.scrollTop += 6
  const fine = eApri(props.fila[dito.i]) ? chiusuraDi(props.fila, dito.i) : dito.i
  presa.value = { da: dito.i, posa: postoSotto(e.clientX, e.clientY, r, puntiDellaFila(scatola.value), dito.i, fine) }
}

/* il click che segue un trascinamento non è un tocco */
function ingoia() {
  const via = e => { e.stopPropagation(); e.preventDefault() }
  window.addEventListener('click', via, { capture: true, once: true })
  setTimeout(() => window.removeEventListener('click', via, { capture: true }), 350)
}

function lascia(e) {
  if (!dito || e.pointerId !== dito.id) return
  const { stato, i } = dito
  const posto = presa.value?.posa
  smetti()
  if (stato !== 'attesa') ingoia()
  if (stato === 'trascina' && posto != null) emit('sposta', { da: i, posto })
}

function smetti() {
  dito = null
  presa.value = null
  if (pupazzo.value) pupazzo.value.replaceChildren()
  window.removeEventListener('pointermove', muovi)
  window.removeEventListener('pointerup', lascia)
  window.removeEventListener('pointercancel', smetti)
}
onBeforeUnmount(smetti)
watch(() => props.inCorsa, c => { if (c) smetti() })

/* la fila più lunga di quello che si vede: solo lì su e giù vuol dire scorrere */
const misura = () => nextTick(() => {
  const el = scatola.value
  scorre.value = !!el && el.scrollHeight > el.clientHeight + 1
})
watch(() => props.fila.length, misura, { immediate: true })

/* la tessera che conta — quella che gira, o il cursore — resta a vista:
   in una fila lunga la striscia scorre da sé */
function aVista(sel) {
  nextTick(() => {
    const el = scatola.value && scatola.value.querySelector(sel)
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  })
}
watch(() => props.corrente, i => { if (i >= 0) aVista(`[data-tessera="${i}"]`) })
watch(() => [props.cursore, props.fila.length], () => { if (!props.inCorsa) aVista('[data-cursore]') })
watch(() => props.guasto, i => { if (i != null) aVista(`[data-tessera="${i}"]`) })
watch(() => props.consiglio, m => { if (m) aVista('[data-consiglio]') })

const tocca = i => { if (!props.inCorsa) emit('cursore', i) }
</script>

<template>
  <div ref="scatola" class="pp-fila" :class="{ 'pp-in-corsa': inCorsa, 'pp-con-zaino': !!zaino, 'pp-trascina': !!presa }" data-fila>
    <div class="pp-programma">
      <Carte :nodi="nodi" :fine="fila.length" />
      <!-- vuota, la fila mostra dove andrà la prima freccia: un posto
           tratteggiato, non una frase (e col consiglio del 💡 quel posto
           ce l'ha già dentro). Con lo zaino i posti sono tutti quelli che
           restano, e toccarne uno porta il cursore in fondo -->
      <template v-if="zaino">
        <button v-for="n in liberi" :key="'z' + n" class="pp-posto" :data-libero="fila.length"
                :class="{ 'pp-qui': n === 1 && segno === fila.length && (!inCorsa || presa) }"
                :data-cursore="n === 1 && segno === fila.length ? '' : null"
                :aria-label="n === 1 ? 'in fondo alla fila' : null" @click="tocca(fila.length)">{{ n === 1 ? '+' : '' }}</button>
      </template>
      <span v-else-if="!fila.length && !fantasma" class="pp-posto" aria-hidden="true"></span>
    </div>
    <!-- la carta al dito: una copia, che la vera resta al suo posto finché non cade -->
    <div ref="pupazzo" class="pp-pupazzo" data-pupazzo aria-hidden="true"></div>
  </div>
</template>
