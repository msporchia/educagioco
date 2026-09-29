<script setup>
// prova una voce: la stessa domanda che arriverebbe al bambino, in scena con Domanda.vue (i quattro modi chiave/sorgente/giro/eta sono in docs/apprendimento/quiz-moduli.md). Non decide niente: profilo e progressi restano intatti.
import { ref, computed, onMounted } from 'vue'
import Domanda from './Domanda.vue'
import { esempioDi } from './saperi.js'
import { esempioDa } from './nucleo/esempi.js'
import { sorteQualunque } from './nucleo/sorte.js'
import { pescaComeUnGioco } from './catalogo.js'

const props = defineProps({
  chiave: { type: String, default: '' }, // un gruppo (misure) o una tipologia (orto:apostrofo)
  nome: { type: String, default: '' }, // con le parole della carta da cui si è arrivati
  sorgente: { type: Object, default: null }, // una classe precisa: { modulo, grado, tipo, nome }
  giro: { type: Array, default: null }, // lista di classi da scorrere in ordine (righe del catalogo)
  eta: { type: Number, default: null }, // pesca come pescherebbe un gioco, tagliando per età
})
defineEmits(['chiudi'])

const esempio = ref(null)
// chiave del v-if: cambiarla rimonta la scheda, così la domanda dopo riparte pulita (canvas compresi)
const giro = ref(0)
const risposto = ref(false)

// dove si è finiti: tace il modulo/tipo se ripetono già il nome della voce (niente rumore)
const dove = computed(() => {
  const e = esempio.value
  if (!e) return ''
  const pezzi = []
  if (!props.nome.includes(e.titolo)) pezzi.push(e.titolo)
  pezzi.push(`grado ${e.grado}`)
  if (e.dice && e.dice !== props.nome) pezzi.push(e.dice)
  return pezzi.join(' · ')
})

// -1 perché il primo unAltra() (al montaggio) deve mostrare la prima, non la seconda
const passo = ref(-1)
const quante = computed(() => props.giro?.length || 0)
const nelGiro = computed(() => quante.value > 0)

const dovePosizione = computed(() =>
  nelGiro.value ? `${passo.value + 1} di ${quante.value}` : '')

function pesca() {
  if (nelGiro.value) {
    passo.value = (passo.value + 1) % quante.value
    const c = props.giro[passo.value]
    return esempioDa(c.sorgente, sorteQualunque())
  }
  if (props.sorgente) return esempioDa(props.sorgente, sorteQualunque())
  // voce + età: quello che arriva A LUI da questo gruppo. Senza chiave, età vuol dire l'altro modo («cosa becca in partita»)
  if (props.chiave) return esempioDi(props.chiave, sorteQualunque(), props.eta)
  if (props.eta !== null) return pescaComeUnGioco(props.eta)
  return null
}

function unAltra() {
  esempio.value = pesca()
  risposto.value = false
  giro.value++
}

function indietro() {
  if (!nelGiro.value) return
  passo.value = (passo.value - 2 + quante.value * 2) % quante.value
  unAltra()
}

onMounted(unAltra)
</script>

<template>
  <div class="prova-velo" data-prova>
    <div class="prova-testa">
      <div class="prova-chi">
        <b>{{ nome || chiave }}</b>
        <i v-if="esempio">{{ dove }}</i>
      </div>
      <span v-if="nelGiro" class="prova-conta" data-conta>{{ dovePosizione }}</span>
      <button type="button" class="prova-x" aria-label="basta" @click="$emit('chiudi')">✕</button>
    </div>

    <div class="prova-palco">
      <Domanda v-if="esempio" :key="giro" :domanda="esempio.domanda" :pittori="esempio.pittori"
               :origine="esempio" gioco="prova"
               :respiro="600" saltabile
               @risposto="unAltra" />
      <!-- non dovrebbe succedere (il tasto compare solo se siPuoProvare è vero): lo dice, invece di un rettangolo nero -->
      <p v-else class="prova-niente">{{ chiave && eta !== null
        ? 'A quest\'età non gli arriva nessuna domanda di questo gruppo.'
        : 'Di questa voce non c\'è nessuna domanda da mostrare.' }}</p>
    </div>

    <div class="prova-piede">
      <button v-if="nelGiro" type="button" class="prova-indietro" aria-label="quella prima"
              data-indietro @click="indietro">‹</button>
      <button type="button" class="prova-altra" @click="unAltra">
        {{ nelGiro ? 'La prossima ›' : (risposto ? "Un'altra" : 'Cambiala') }}
      </button>
      <button type="button" class="prova-fine" @click="$emit('chiudi')">Basta</button>
    </div>
  </div>
</template>

<style scoped>
.prova-velo {
  position: fixed; inset: 0; z-index: 60;
  display: flex; flex-direction: column;
  background: radial-gradient(120% 80% at 50% 0%, #1d2a4a 0%, #0d1220 60%, #080b14 100%);
  color: #e8edf7; text-align: left;
  padding: max(10px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
}
.prova-testa { display: flex; align-items: flex-start; gap: 10px; padding: 4px 2px 10px }
.prova-chi { flex: 1; min-width: 0 }
.prova-chi b { display: block; font-size: 16px; font-weight: 800 }
.prova-chi i {
  display: block; font-style: normal; font-size: 12px; color: #93a0bd;
  margin-top: 2px; overflow-wrap: anywhere;
}
.prova-x {
  flex: none; width: 40px; height: 40px; border-radius: 12px; cursor: pointer;
  border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.06);
  color: #e8edf7; font: inherit; font-size: 17px;
}
.prova-conta {
  flex: none; align-self: center; font-size: 12px; font-weight: 700;
  color: #cbd5ea; background: rgba(255,255,255,.08);
  border-radius: 999px; padding: 5px 10px; white-space: nowrap;
}

/* relative: il velo di Domanda.vue (absolute) si aggancia qui, non al telefono intero; --qz-h è l'altezza utile senza testa e piede */
.prova-palco { position: relative; flex: 1; min-height: 0; --qz-h: .82vh }
.prova-niente {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  margin: 0; padding: 20px; text-align: center; color: #93a0bd; font-size: 14px;
}

.prova-piede { display: flex; gap: 10px; padding-top: 12px }
.prova-piede button {
  flex: 1; min-height: 52px; cursor: pointer; border-radius: 16px;
  border: none; font: inherit; font-size: 16px; font-weight: 750;
}
.prova-altra { background: rgba(255,255,255,.1); color: #e8edf7 }
.prova-fine { background: #ffd58a; color: #23272f }
.prova-indietro { flex: 0 0 56px; background: rgba(255,255,255,.1); color: #e8edf7; font-size: 20px } /* stretto: scorciatoia, non uno dei due tasti veri */
.prova-piede button:active { transform: translateY(2px) }
</style>
