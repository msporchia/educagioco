<script>
import { reactive } from 'vue'
// le scelte restano finché la pagina è aperta: tornando dall'editor, o preparando la lezione dopo, si ritrovano
const ricordo = reactive({ anno: null, gioco: null })
</script>

<script setup>
// Il percorso guidato di «Nuova lezione»: classe → gioco → le lezioni pronte di quel gioco, per materia (docs/scuola/lezioni-pronte.md)
import { computed } from 'vue'
import { quaderno } from './stato.js'
import { annoDelleClassi } from './quaderno.js'
import { ANNI, pronte } from '../comune/lezioni-pronte.js'
import { GIOCHI, CATALOGO } from '../comune/esercizi.js'
import { comeSiSvolge } from './utili.js'
import TesseraGioco from './TesseraGioco.vue'

const emit = defineEmits(['vai', 'indietro'])

// tutti i giochi: quelli senza lezioni pronte per quella classe si preparano da zero, già nel loro gioco
const giochi = GIOCHI
const conPronte = id => !!ricordo.anno && pronte({ anno: ricordo.anno, gioco: id }).length > 0
// le lezioni pronte del gioco, a gruppi per materia nell'ordine del catalogo
const perMateria = computed(() => {
  if (!ricordo.gioco) return []
  const tutte = pronte({ anno: ricordo.anno, gioco: ricordo.gioco })
  return CATALOGO.materie.map(m => ({ ...m, lezioni: tutte.filter(p => p.materia === m.id) })).filter(m => m.lezioni.length)
})
const classiDellAnno = a => quaderno.classi.filter(c => c.anno === a).map(c => c.nome).join(', ')

function scegliAnno(a) { ricordo.anno = a }

if (!ricordo.anno) ricordo.anno = annoDelleClassi(quaderno)
if (ricordo.anno) scegliAnno(ricordo.anno)
</script>

<template>
  <section class="carta" data-percorso>
    <div class="fila tra">
      <h1>Nuova lezione</h1>
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

  <section v-if="ricordo.anno" class="carta" data-passo="gioco">
    <h2>In che gioco?</h2>
    <div class="giochi">
      <TesseraGioco v-for="g in giochi" :key="g.id" :gioco="g" :scelta="ricordo.gioco === g.id" @click="ricordo.gioco = g.id" />
    </div>
    <p v-if="ricordo.gioco" class="nota">{{ giochi.find(g => g.id === ricordo.gioco)?.spiega }}</p>
  </section>

  <section v-if="ricordo.gioco && !conPronte(ricordo.gioco)" class="carta" data-passo="da-zero">
    <h2>Lezioni pronte non ce ne sono</h2>
    <p class="nota">Per questo gioco in {{ ricordo.anno }}ª non c'è una lezione già fatta: la prepari tu, e l'editor parte già da qui.</p>
    <div class="fila">
      <button class="bottone" data-azione="preparala-nel-gioco" @click="emit('vai', 'lezione', { id: null, gioco: ricordo.gioco })">Preparala tu</button>
    </div>
  </section>

  <section v-if="ricordo.gioco && conPronte(ricordo.gioco)" class="carta" data-passo="lezioni">
    <h2>Le lezioni pronte</h2>
    <p class="nota">Toccane una: si apre già fatta e la cambi come vuoi.</p>
    <div v-for="m in perMateria" :key="m.id" class="materia" :data-materia="m.id">
      <h3 v-if="perMateria.length > 1">{{ m.emoji }} {{ m.nome }}</h3>
      <ul class="proposte">
        <li v-for="p in m.lezioni" :key="p.id">
          <button class="pronta" :data-pronta="p.id" @click="emit('vai', 'lezione', { proposta: p })">
            <b>{{ p.nome }}</b>
            <span v-for="(r, i) in comeSiSvolge(p)" :key="i" class="nota">{{ r }}</span>
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.tra { justify-content:space-between }
.esempio { font-weight:400; opacity:.7 }
.giochi { display:flex; flex-wrap:wrap; gap:8px }
.materia { display:flex; flex-direction:column; gap:8px }
.proposte { list-style:none; display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:8px }
.pronta { width:100%; height:100%; display:flex; flex-direction:column; gap:2px; text-align:left; padding:12px; font:inherit; font-size:14px;
          color:var(--inchiostro); background:var(--tessera); border:1px solid transparent; border-radius:var(--raggio-piccolo) }
.pronta b { font-size:15px }
.pronta:active { border-color:var(--filo) }
</style>
