<script setup>
// Gli Asteroidi veri, limitati alle tabelline dell'esercizio, su un profilo in memoria; se non partono, chi la monta torna alle schede. docs/scuola/bambini.md
import { ref, shallowRef, onMounted, onErrorCaptured } from 'vue'
import MathGame from '../../../views/MathGame.vue'
import { bambinoInMemoria } from '../../bambini/profilo.js'
import { limiteAsteroidi, raccontaAsteroide, difficoltaDi } from '../../comune/esercizi.js'

const props = defineProps({
  esercizio: { type: Object, required: true },
  alunno: { type: Object, required: true },     // { id, nome }
})
const emit = defineEmits(['risposta', 'guasto'])
const limite = { ...limiteAsteroidi(props.esercizio), difficolta: difficoltaDi(props.esercizio) }
const chi = shallowRef('')           // il profilo pronto: prima il gioco non si monta
const radice = ref(null)

// la tela scrive i numeri dei sassi col font delle emoji: si aspetta che sia decodificato, ma non a lungo (come src/main.js)
const emojiPronte = () => {
  try {
    return Promise.race([document.fonts.load('16px "Emoji Gioco"', '🐰'), new Promise(r => setTimeout(r, 1500))]).catch(() => {})
  } catch { return Promise.resolve() }
}

let guasto = false
function nonParte(motivo = '') { if (!guasto) { guasto = true; emit('guasto', motivo) } }   // il motivo lo scrive la prova del computer

onMounted(async () => {
  try {
    const [, id] = await Promise.all([emojiPronte(), bambinoInMemoria(props.alunno.id, props.alunno.nome)])
    chi.value = id
  } catch { return nonParte('il profilo non si prepara') }
  // il cielo che non si accende mostra il tasto per riaccenderlo (docs/asteroidi/grafica-3d.md): a scuola si torna alle schede
  setTimeout(() => { if (radice.value?.querySelector('[data-riaccendi-tela]')) nonParte('la tela 3D si è persa') }, 0)
})
onErrorCaptured(e => { nonParte(`errore: ${(e && e.message) || e}`); return false })

// alla maestra va ogni colpo; il blocco conta la domanda una volta, quando si chiude (`ultima`). La forma: docs/scuola/giochi.md
// la chiave per la maestra: il calcolo a mente (le chiavi del gioco cominciano con «calc:»), il nascosto («9 × ? = 63»), il risultato
const chiaveDi = e => (String(e.chiave ?? '').startsWith('calc') ? 'asteroidi:mente'
  : /= \?$/.test(String(e.testo ?? '').trim()) ? 'tab:prodotto' : 'tab:nascosto')
const riferisci = e => emit('risposta', { chiave: chiaveDi(e), giusta: e.giusta, ms: e.ms, ultima: e.ultima !== false, ...raccontaAsteroide(e) })
</script>

<template>
  <div ref="radice" class="asteroidi" data-gioco="asteroidi">
    <div class="colonna">
      <MathGame v-if="chi" :key="chi" :limite="limite" @risposta="riferisci" />
    </div>
  </div>
</template>

<style scoped>
/* il gioco è un `.schermo` assoluto: sta nella colonna, centrata su uno schermo largo */
.asteroidi { position: relative; flex: 1; min-height: 0; display: flex; justify-content: center; background: #05081a }
.colonna { position: relative; flex: 1; max-width: 600px; overflow: hidden }
</style>
