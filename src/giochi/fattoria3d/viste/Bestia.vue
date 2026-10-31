<script setup>
// Il foglio di una bestia di casa o di un compagno gratis (G6, docs/fattoria3d/bestie-di-casa.md): come sta, a blocchi (pancia, pelo, gioco), con
// solo le cose che riempiono ogni bisogno; una carezza gratis sempre; «Sposta» (non ai compagni: girano col contadino) e «Cambia nome»; sotto, «Vestilo»:
// gli addobbi che le stanno (dati/addobbi.js), toccati si mettono (comprandoli, se non li hai) o si tolgono. ✕ in alto a destra. Qui non si decide niente: ogni gesto va
// a chi lo usa (`nutri`, `coccola`, ...), che parla col motore (motore/cura.js) e rimanda il testo. Il ritratto lo fotografa `anteprime.js` (`bestia:<id>`).
import { ref, computed, watch, onMounted } from 'vue'
import { BISOGNI, CHIAVI, curabile, comeSta, gestiPer, cibiPer } from '../dati/bestie.js'
import { merceDi } from '../dati/ricette.js'
import '../stile-bestia.css'

const props = defineProps({
  id: { type: String, required: true },
  nome: { type: String, default: '' },
  stato: { type: Object, required: true },          // { pancia, pelo, gioco }: una fotografia, non la bestia viva
  monete: { type: Number, default: 0 },
  scorte: { type: Object, default: () => ({}) },    // { prodotto: quanti } per i gesti che si pagano col granaio
  messaggio: { type: String, default: '' },
  anteprima: { type: Function, default: null },
  anteprimaPronta: { type: Function, default: null },
  vestiario: { type: Array, default: () => [] },     // [{ id, nome, emoji, prezzo, dove, addosso, hai }] (Cura.vestiarioDi)
})
const emit = defineEmits(['nutri', 'coccola', 'carezza', 'nome', 'sposta', 'vesti', 'spoglia', 'chiudi'])
const prezzoAddobbo = a => a.addosso ? '✓ addosso' : a.hai ? '×' + a.hai : '🪙' + a.prezzo
const toccaAddobbo = a => (a.addosso ? emit('spoglia', a) : emit('vesti', a))

const b = computed(() => curabile(props.id))
const pieno = k => (props.stato[k] ?? 0) > 0.93
const ce = g => g.da ? (props.scorte[g.da] || 0) > 0 : (g.prezzo || 0) <= props.monete
const gesti = k => gestiPer(k, b.value.famiglia).slice().sort((x, y) => (ce(y) ? 1 : 0) - (ce(x) ? 1 : 0))
const suoi = computed(() => cibiPer(b.value.famiglia).filter(c => !c.da))
const nomeDi = g => g.che === 'cibo' || !g.da ? g.nome : g.nome

const ritratto = ref('')
async function disegna() {
  const t = 'bestia:' + props.id
  const pronta = props.anteprimaPronta && props.anteprimaPronta(t)
  if (pronta) { ritratto.value = pronta; return }
  if (!props.anteprima) return
  const url = await props.anteprima(t)
  if (url) ritratto.value = url
}
watch(() => props.id, disegna)
onMounted(disegna)

function tocca(g, k) {
  if (g.che === 'cibo') emit('nutri', g); else emit('coccola', g)
  void k
}
const quanti = g => g.da ? '×' + (props.scorte[g.da] || 0) : '🪙' + g.prezzo
const faccia = g => g.da ? ((merceDi(g.da) || {}).emoji || g.emoji) : g.emoji
</script>

<template>
  <div class="f3-foglio f3-colonna f3-bes" data-f3="bestia" :data-bestia="id">
    <header class="f3-bes-asse"><span aria-hidden="true">{{ b.emoji }}</span><h2 data-f3="bestia-nome">{{ nome }}</h2></header>
    <button class="f3-chiudi f3-bes-x" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <div class="f3-bes-testa">
      <div class="f3-bes-ritratto" data-f3="bestia-ritratto">
        <img v-if="ritratto" :src="ritratto" :alt="'Ritratto di ' + nome" draggable="false">
        <span v-else class="f3-bes-attesa" aria-hidden="true">{{ b.emoji }}</span>
      </div>
      <p class="f3-bes-come" data-f3="bestia-come">{{ comeSta(stato, nome) }}</p>
    </div>
    <div class="f3-corpo f3-bes-corpo">
      <section v-for="k in CHIAVI" :key="k" class="f3-bes-blocco" :data-bisogno="k">
        <div class="f3-bes-riga">
          <b>{{ BISOGNI[k].icona }} {{ BISOGNI[k].nome }}</b>
          <span class="f3-bes-barra" role="img" :aria-label="Math.round(stato[k] * 100) + ' per cento'"><i :style="{ width: Math.round(stato[k] * 100) + '%', background: BISOGNI[k].colore }"></i></span>
          <em>{{ pieno(k) ? 'a posto' : Math.round(stato[k] * 100) + '%' }}</em>
        </div>
        <p v-if="k === 'pancia'" class="f3-bes-gli-piace">Gli piace {{ suoi.map(c => c.emoji + ' ' + c.nome.toLowerCase()).join(' e ') }}</p>
        <div class="f3-bes-gesti">
          <button v-for="g in gesti(k)" :key="g.id" type="button" class="f3-bes-gesto" :class="{ manca: !ce(g), pieno: pieno(k) }"
                  :data-cibo="g.che === 'cibo' ? g.id : null" :data-coccola="g.che === 'coccola' ? g.id : null" :aria-disabled="pieno(k) || null" @click="tocca(g, k)">
            <b aria-hidden="true">{{ faccia(g) }}</b><span>{{ nomeDi(g) }}</span><em>{{ quanti(g) }}</em>
          </button>
        </div>
      </section>
      <div class="f3-bes-azioni">
        <button type="button" class="f3-bes-az" data-azione="carezza" @click="emit('carezza')">🤚 Carezza<small>gratis</small></button>
        <button v-if="!b.compagno" type="button" class="f3-bes-az" data-azione="sposta" @click="emit('sposta')">📍 Sposta<small>gratis</small></button>
        <button type="button" class="f3-bes-az" data-azione="nome" @click="emit('nome')">✎ Nome</button>
      </div>
      <section v-if="vestiario.length" class="f3-bes-blocco" data-f3="bestia-vestiario">
        <div class="f3-bes-riga"><b>🎩 Vestilo</b><em>tocca per mettere o togliere</em></div>
        <div class="f3-bes-gesti">
          <button v-for="a in vestiario" :key="a.id" type="button" class="f3-bes-gesto" :class="{ sel: a.addosso, manca: !a.addosso && !a.hai && a.prezzo > monete }"
                  :data-addobbo="a.id" :aria-pressed="a.addosso" @click="toccaAddobbo(a)">
            <b aria-hidden="true">{{ a.emoji }}</b><span>{{ a.nome }}</span><em>{{ prezzoAddobbo(a) }}</em>
          </button>
        </div>
      </section>
    </div>
    <p class="f3-bes-msg" data-f3="bestia-msg">{{ messaggio || 'Tocca una cosa per darla a ' + nome + '.' }}</p>
  </div>
</template>
