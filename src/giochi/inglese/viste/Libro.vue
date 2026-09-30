<script setup>
/* Una storia del libro: prima il testo inglese da leggere, una pagina
   alla volta, con la tipografia di un libro, poi le domande in italiano
   una alla volta. Il testo resta sopra anche durante le domande, e si
   sfoglia ancora: rileggere è lecito, è quello che si fa con un libro. Le
   parole si toccano come dappertutto. Vedi docs/lingue/mondi-vista.md. */
import { ref, watch, nextTick } from 'vue'
import Testo from './Testo.vue'

const props = defineProps({
  cap: { type: Object, required: true },        // { titolo, pagine: [[{ en }]], domande: [{ testo, opzioni }] }
  fase: { type: String, default: 'leggi' },     // leggi | domande
  k: { type: Number, default: 0 },              // la domanda di adesso
  scelta: { type: Number, default: -1 },        // l'opzione toccata, -1 se non ancora
  attesa: { type: Number, default: 0 },
  giro: { type: Number, default: 0 },
})
defineEmits(['ho-letto', 'rispondi', 'tocca'])

const pagina = ref(0)
const foglio = ref(null)
// «Un'altra storia» riusa questo componente: la storia nuova riparte dalla prima pagina
watch(() => props.cap, () => { pagina.value = 0 })

function sfoglia(passo) {
  const n = pagina.value + passo
  if (n < 0 || n >= props.cap.pagine.length) return
  pagina.value = n
  nextTick(() => { if (foglio.value) foglio.value.scrollTop = 0 })
}

function classe(d, o, i, scelta) {
  if (scelta < 0) return ''
  if (o.giusta) return 'ing-giusta'
  return i === scelta ? 'ing-sbagliata' : 'ing-spenta'
}
</script>

<template>
  <div class="ing-libro" data-libro-aperto>
    <article ref="foglio" class="ing-pagina" :class="{ 'ing-pagina-corta': fase === 'domande' }" data-libro-testo
             :data-pagina="pagina + 1" :data-pagine="cap.pagine.length">
      <h2 v-if="pagina === 0" class="ing-capitolo">{{ cap.titolo }}</h2>
      <!-- le frasi di una pagina sono un racconto: si leggono di seguito, come in un libro -->
      <p class="ing-riga" :class="{ 'ing-prima-riga': pagina === 0 }"><Testo :key="pagina"
        :testo="cap.pagine[pagina].map(r => r.en).join(' ')" @tocca="el => $emit('tocca', el)" /></p>
      <div v-if="pagina === cap.pagine.length - 1" class="ing-fregio" aria-hidden="true">❦</div>
    </article>

    <!-- si sfoglia coi due tasti grandi, anche durante le domande -->
    <nav v-if="cap.pagine.length > 1" class="ing-sfoglia" aria-label="pagine">
      <button type="button" class="ing-freccia-pagina" aria-label="pagina prima" data-azione="pagina-indietro"
              :disabled="pagina === 0" @click="sfoglia(-1)">←</button>
      <span class="ing-numero-pagina" data-pagina-di>pagina {{ pagina + 1 }} di {{ cap.pagine.length }}</span>
      <button type="button" class="ing-freccia-pagina" aria-label="pagina dopo" data-azione="pagina-avanti"
              :disabled="pagina === cap.pagine.length - 1" @click="sfoglia(1)">→</button>
    </nav>

    <div v-if="fase === 'leggi'" class="ing-dopo-lettura">
      <p class="ing-sotto">Tocca una parola se non sai cosa vuol dire.</p>
      <button v-if="pagina === cap.pagine.length - 1" type="button" class="ing-grosso" data-azione="ho-letto"
              @click="$emit('ho-letto')">
        Ho letto →
      </button>
    </div>

    <div v-else class="ing-libro-domanda" data-libro-domanda :data-k="k">
      <div class="ing-etichetta">Domanda {{ k + 1 }} di {{ cap.domande.length }}</div>
      <div class="ing-consegna ing-it ing-lunga">{{ cap.domande[k].testo }}</div>
      <div class="ing-opzioni ing-lunghe">
        <button v-for="(o, i) in cap.domande[k].opzioni" :key="k + '-' + i" type="button"
                class="ing-opzione" :class="classe(cap.domande[k], o, i, scelta)"
                :data-opzione="i" :data-giusta="o.giusta ? '' : null"
                @click="scelta < 0 && $emit('rispondi', i)">{{ o.testo }}</button>
      </div>
      <div v-if="scelta >= 0" class="ing-esito"
           :data-esito="cap.domande[k].opzioni[scelta].giusta ? 'giusta' : 'sbagliata'">
        <div v-if="cap.domande[k].opzioni[scelta].giusta" class="ing-bene">Giusto!</div>
        <div v-else class="ing-male">Non così: rileggi {{ cap.pagine.length > 1 ? 'la storia, anche sfogliando'
          : 'il testo qui sopra' }}.</div>
        <div v-if="attesa" class="ing-avanti" data-attesa>
          <i :key="giro" :style="{ animationDuration: attesa + 'ms' }"></i>
        </div>
      </div>
    </div>
  </div>
</template>
