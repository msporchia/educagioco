<script>
import { reactive } from 'vue'
// le scelte restano finché la pagina è aperta: tornando dall'editor, o preparando la lezione dopo, si ritrovano
const ricordo = reactive({ anno: null, materia: null, gioco: null })
</script>

<script setup>
// Il percorso guidato di «Nuova lezione»: classe → materia → gioco → le lezioni pronte (docs/scuola/lezioni-pronte.md)
import { computed } from 'vue'
import { quaderno } from './stato.js'
import { annoDelleClassi } from './quaderno.js'
import { ANNI, pronte, materiePer, giochiDi } from '../comune/lezioni-pronte.js'
import { comeSiSvolge } from './utili.js'

const emit = defineEmits(['vai', 'indietro'])

const materie = computed(() => (ricordo.anno ? materiePer(ricordo.anno) : []))
const giochi = computed(() => (ricordo.anno && ricordo.materia ? giochiDi(ricordo.anno, ricordo.materia) : []))
const proposte = computed(() => (ricordo.gioco ? pronte({ anno: ricordo.anno, materia: ricordo.materia, gioco: ricordo.gioco }) : []))
const classiDellAnno = a => quaderno.classi.filter(c => c.anno === a).map(c => c.nome).join(', ')

// un gioco solo è già scelto; una scelta che con l'anno o la materia nuovi non c'è più si toglie
function sistema() {
  if (!materie.value.some(m => m.id === ricordo.materia)) ricordo.materia = null
  const g = giochi.value
  if (!g.some(x => x.id === ricordo.gioco)) ricordo.gioco = g.length === 1 ? g[0].id : null
}
function scegliAnno(a) { ricordo.anno = a; sistema() }
function scegliMateria(id) { ricordo.materia = id; sistema() }

if (!ricordo.anno) ricordo.anno = annoDelleClassi(quaderno)
sistema()
</script>

<template>
  <section class="carta" data-percorso>
    <h1>Nuova lezione</h1>
    <p class="nota">Scegli la classe e la materia: ti propongo lezioni già pronte col programma di quell'anno. Ne tocchi una e la cambi come vuoi.</p>
    <div class="fila">
      <button class="bottone chiaro" data-azione="preparala-tu" @click="emit('vai', 'lezione', { id: null })">Preparala tu, da zero</button>
    </div>
  </section>

  <section class="carta" data-passo="anno">
    <h2>Per quale classe?</h2>
    <div class="fila">
      <button v-for="a in ANNI" :key="a" class="tessera" :class="{ scelta: ricordo.anno === a }" :aria-pressed="ricordo.anno === a"
              :data-anno="a" @click="scegliAnno(a)">{{ a }}ª<span v-if="classiDellAnno(a)" class="esempio"> · {{ classiDellAnno(a) }}</span></button>
    </div>
  </section>

  <section v-if="ricordo.anno" class="carta" data-passo="materia">
    <h2>Che materia?</h2>
    <div class="fila">
      <button v-for="m in materie" :key="m.id" class="tessera" :class="{ scelta: ricordo.materia === m.id }" :aria-pressed="ricordo.materia === m.id"
              :data-materia="m.id" @click="scegliMateria(m.id)">{{ m.emoji }} {{ m.nome }}</button>
    </div>
  </section>

  <section v-if="ricordo.materia" class="carta" data-passo="gioco">
    <h2>In che gioco?</h2>
    <div class="giochi">
      <button v-for="g in giochi" :key="g.id" class="tessera gioco" :class="{ scelta: ricordo.gioco === g.id }" :aria-pressed="ricordo.gioco === g.id"
              :data-gioco="g.id" @click="ricordo.gioco = g.id"><b>{{ g.nome }}</b><span>{{ g.spiega }}</span></button>
    </div>
  </section>

  <section v-if="ricordo.gioco" class="carta" data-passo="lezioni">
    <h2>Le lezioni pronte per la {{ ricordo.anno }}ª</h2>
    <p class="nota">Toccane una: si apre già compilata, e prima di salvarla cambi quello che vuoi.</p>
    <ul class="proposte">
      <li v-for="p in proposte" :key="p.id">
        <button class="pronta" :data-pronta="p.id" @click="emit('vai', 'lezione', { proposta: p })">
          <b>{{ p.nome }}</b>
          <span>{{ p.allena }}</span>
          <span v-for="(r, i) in comeSiSvolge(p)" :key="i" class="nota">{{ r }}</span>
        </button>
      </li>
    </ul>
    <div class="fila">
      <button class="bottone chiaro" data-azione="preparala-tu" @click="emit('vai', 'lezione', { id: null })">Nessuna va bene: preparala tu</button>
    </div>
  </section>
</template>

<style scoped>
.esempio { font-weight:400; opacity:.7 }
.giochi { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:8px }
.gioco { display:flex; flex-direction:column; gap:4px; text-align:left; padding:12px }
.gioco span { font-size:13px; opacity:.8 }
.proposte { list-style:none; display:flex; flex-direction:column; gap:8px }
.pronta { width:100%; display:flex; flex-direction:column; gap:2px; text-align:left; padding:12px; font:inherit; font-size:14px;
          color:var(--inchiostro); background:var(--tessera); border:1px solid transparent; border-radius:var(--raggio-piccolo) }
.pronta b { font-size:15px }
.pronta:active { border-color:var(--filo) }
</style>
