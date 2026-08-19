<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CASTELLO A SPRITE — IL COORDINATORE

   Per adesso questo gioco **non si gioca**: si guarda. Mostra il campo
   di una qualsiasi delle venti tappe del tower defense disegnato con le
   tessere del foglio invece che coi poligoni, e dice a che punto è la
   composizione — quante celle, se la strada si è chiusa da sola o si è
   dovuto ripiegare, quanti giunti restano storti.

   È voluto, ed è il modo più corto per mettere una cosa in mano invece
   di raccontarla: la parte difficile del passaggio agli sprite non è il
   gioco, che c'è già e funziona (`src/views/castello/`), ma **il campo**
   — e finché il campo non regge tutte e venti le tappe, portarsi dietro
   torri e mostri servirebbe solo a nascondere il problema sotto altre
   cose che si muovono.

   Cosa manca per farlo diventare un gioco, nell'ordine:
     · le figure nell'atlante (torri, castello, bocche): oggi sono cerchi
     · i mostri, che sono l'unica cosa che il foglio non ha proprio
     · attaccarci `motore/battaglia.js`, che gira già e non sa di grafica

   ⚠ Il nome. Questo gioco si chiama `castello` e **non è** il tower
   defense di oggi, che si chiama `torri` e vive in `src/views/castello/`,
   `src/components/castello/`, `src/motore/castello/`, `src/data/castello.js`
   e `src/grafica/castello/`. I dati sono gli stessi — le tappe, i
   percorsi, le piazzole vengono di là — la pelle no. Il giorno che
   questo prende il posto di quello, quello sparisce e questo prende il
   suo nome.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onMounted, watch } from 'vue'
import Barra from '../../components/Barra.vue'
import { CAMPAGNE } from '../../data/campagne-castello.js'
import { campoDi, TAPPE } from './scena/campo.js'
import { Tela } from './scena/tela.js'
import './stile.css'

defineOptions({ name: 'CastelloSprite' })
const emit = defineEmits(['vai'])

const quale = ref(0)
const tela = ref(null)
const canvas = ref(null)

const tappa = computed(() => TAPPE[quale.value])
const campo = computed(() => campoDi(tappa.value))

/* le tappe raggruppate per campagna, che è come si guardano */
const archi = computed(() => {
  let i = 0
  return CAMPAGNE.map(c => ({
    id: c.id, nome: c.nome, emoji: c.emoji,
    tappe: c.tappe.map(t => ({ nome: t.nome, emoji: t.emoji, indice: i++ })),
  }))
})

const nota = computed(() => {
  const c = campo.value
  const pezzi = [`${c.materiale}`, `${c.strada.length} celle`]
  if (c.approssimato) pezzi.push(c.storti ? `${c.storti} giunti storti` : 'ripiego')
  else pezzi.push('composta')
  if (c.mancanti.length) pezzi.push(`${c.mancanti.length} senza tessera`)
  return pezzi.join(' · ')
})

function ridisegna() { if (tela.value) tela.value.disegna(campo.value) }

/* Non c'è niente da rifare quando lo schermo cambia: il canvas è grande
   quanto il mondo e ci sta dentro da sé (`object-fit` in `stile.css`).
   Girare il telefono non ridisegna un pixel — prima invece serviva un
   `ResizeObserver`, perché la scala dipendeva da quanto era largo lo
   schermo. */
onMounted(() => {
  tela.value = new Tela(canvas.value)
  ridisegna()
})
watch(campo, ridisegna)
</script>

<template>
  <div class="castello-sprite">
    <Barra titolo="Il castello a tessere" guida="castello" @indietro="emit('vai', 'home')" />

    <div class="scelta">
      <div v-for="a in archi" :key="a.id" class="arco">
        <span class="emoji">{{ a.emoji }}</span>
        <button v-for="t in a.tappe" :key="t.indice"
                class="tappa" :class="{ scelta: t.indice === quale }"
                :data-tappa="t.indice" @click="quale = t.indice">{{ t.emoji }}</button>
      </div>
    </div>

    <div class="campo"><canvas ref="canvas" /></div>

    <p class="nota"><b>{{ tappa.nome }}</b> — {{ nota }}</p>
  </div>
</template>
