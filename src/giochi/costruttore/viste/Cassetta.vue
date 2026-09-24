<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA CASSETTA — i blocchi che il livello mette a disposizione

   Si apre dal «＋» e mostra solo i blocchi del livello: al primo livello
   sono due, all'ultimo sette. Un blocco che non serve ancora non si
   offre — un tasto che il livello non sa usare è una domanda che il
   bambino si fa senza nessuno a cui farla.

   I progetti sono del bambino: compaiono qui uno per uno, e chiamarli è
   metterli nel programma come un blocco qualunque. Gli **attrezzi**
   (`dati/attrezzi.js`) stanno in un gruppo loro, anche nei livelli dove
   un progetto non si può ancora scrivere: si chiamano e basta, e sotto
   il nome dicono dove lasciano il robot — la riga dopo comincia da lì.

   Il porto ha una cassetta sua (`GRUPPI_PORTO`): quattro frecce per tre
   gesti, e le frecce di un gesto stanno su una riga sola (`fila`),
   perché dodici tasti uno sotto l'altro sono un elenco da scorrere.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { GRUPPI, GRUPPI_PORTO, ICONE } from './frasi.js'

const props = defineProps({
  cassetta: { type: Array, required: true },
  /* dove si possono posare i mattoni in questo livello: di solito solo
     sotto i piedi, i lati arrivano quando servono (il bosco, il ponte) */
  posti: { type: Array, default: () => ['sotto'] },
  progetti: { type: Array, default: () => [] },
  lavagnette: { type: Array, default: () => [] },
  dentroProgetto: { type: String, default: null },   // la scheda aperta: il progetto che si sta scrivendo
  /* i progetti scritti negli altri livelli: [{ chiave, nomeLivello, progetto }] */
  altri: { type: Array, default: () => [] },
  /* il cantiere di lato o il porto dall'alto: i blocchi non sono gli stessi */
  porto: { type: Boolean, default: false },
})
const emit = defineEmits(['scegli', 'nuovo-progetto', 'importa', 'chiudi'])

const gruppi = computed(() => (props.porto ? GRUPPI_PORTO : GRUPPI)
  .map(g => ({ ...g, blocchi: g.blocchi.filter(b => props.cassetta.includes(b.blocco) &&
                                                    (!b.dove || props.posti.includes(b.dove))) }))
  .filter(g => g.blocchi.length))
const chiaveDi = b => [b.blocco, b.verso, b.dove, b.lato].filter(Boolean).join(':')

/* la finestra cieca di sempre: la cassetta nasce sotto il dito che ha
   appena premuto «＋», e un secondo tocco di troppo sceglierebbe un
   blocco che nessuno ha chiesto */
const cieco = ref(true)
let timer = 0
onMounted(() => { timer = setTimeout(() => { cieco.value = false }, 320) })
onUnmounted(() => clearTimeout(timer))
const scegli = x => { if (!cieco.value) emit('scegli', x) }
const importa = x => { if (!cieco.value) emit('importa', x) }
const conProgetti = computed(() => props.cassetta.includes('progetti'))
const attrezzi = computed(() => props.progetti.filter(p => p.attrezzo))
const suoi = computed(() => props.progetti.filter(p => !p.attrezzo))
</script>

<template>
  <div class="cst-velo" @click.self="emit('chiudi')">
    <div class="cst-foglio" data-cassetta>
      <button type="button" class="cst-chiudi" aria-label="chiudi" data-chiudi @click="emit('chiudi')">✕</button>
      <h3>Cosa deve fare il robot?</h3>
      <section v-for="g in gruppi" :key="g.nome" class="cst-gruppo">
        <h4>{{ g.nome }}</h4>
        <!-- le frecce del porto: una riga per gesto, un tasto per freccia -->
        <div v-if="g.fila" class="cst-fila-frecce">
          <span class="cst-ico">{{ ICONE[g.blocchi[0].blocco] }}</span>
          <button v-for="b in g.blocchi" :key="chiaveDi(b)" type="button" class="cst-blocco-nuovo cst-freccia"
                  :data-blocco="chiaveDi(b)" :aria-label="b.esempio"
                  @click="scegli({ blocco: b.blocco, verso: b.verso, lato: b.lato })">{{ b.freccia }}</button>
        </div>
        <button v-for="b in (g.fila ? [] : g.blocchi)" :key="chiaveDi(b)" type="button" class="cst-blocco-nuovo"
                :data-blocco="chiaveDi(b)" @click="scegli({ blocco: b.blocco, verso: b.verso, dove: b.dove })">
          <span class="cst-ico">{{ ICONE[b.blocco] }}</span> {{ b.esempio }}
          <small v-if="b.nota">{{ b.nota }}</small>
          <small v-if="b.blocco === 'assegna' && !lavagnette.length">(prima crea una lavagnetta)</small>
        </button>
      </section>
      <section v-if="attrezzi.length" class="cst-gruppo" data-attrezzi>
        <h4>Gli attrezzi <small>già scritti: li chiami e costruiscono</small></h4>
        <button v-for="p in attrezzi" :key="p.id" type="button" class="cst-blocco-nuovo cst-blocco-attrezzo"
                :data-blocco="'chiama:' + p.id" @click="scegli({ blocco: 'chiama', progetto: p.id })">
          <span class="cst-ico">{{ p.icona }}</span> {{ p.nome }}
          <small v-if="p.misure.length">{{ p.misure.join(', ') }}</small>
          <small class="cst-finisce">finisce {{ p.finisce }}</small>
        </button>
      </section>
      <section v-if="conProgetti" class="cst-gruppo">
        <h4>I tuoi progetti</h4>
        <button v-for="p in suoi" :key="p.id" type="button" class="cst-blocco-nuovo"
                :data-blocco="'chiama:' + p.id" @click="scegli({ blocco: 'chiama', progetto: p.id })">
          <span class="cst-ico">{{ p.icona }}</span> {{ p.nome }}
          <small v-if="p.misure.length">{{ p.misure.join(', ') }}</small>
          <small v-if="p.id === dentroProgetto">(chiama sé stesso)</small>
        </button>
        <button type="button" class="cst-blocco-nuovo cst-nuovo" data-azione="nuovo-progetto" @click="emit('nuovo-progetto')">
          ＋ un progetto nuovo
        </button>
      </section>
      <section v-if="conProgetti && altri.length" class="cst-gruppo">
        <h4>Dai tuoi altri cantieri</h4>
        <button v-for="a in altri" :key="a.chiave + a.progetto.id" type="button" class="cst-blocco-nuovo cst-importa"
                :data-importa="a.progetto.nome" @click="importa({ chiave: a.chiave, progetto: a.progetto.id })">
          <span class="cst-ico">{{ a.progetto.icona }}</span> {{ a.progetto.nome }}
          <small>da «{{ a.nomeLivello }}»</small>
        </button>
      </section>
    </div>
  </div>
</template>
