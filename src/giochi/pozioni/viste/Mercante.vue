<script setup>
// La bottega del mercante (in prova): la tela 3D col banco, e sopra la
// pergamena coi misurini e i gettoni. Questa vista non decide niente:
// riceve la bottega, traduce in scena quello che c'è, suona le animazioni
// che il coordinatore chiede e dice cosa il dito ha toccato. Vedi
// docs/pozioni/bottega.md.
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { FAMIGLIA, VALE, scrivi, mescola } from '../dati/misure.js'
import { PULIZIA } from '../dati/bottega.js'
import { creaBottega3d } from '../scena3d/indice.js'

const props = defineProps({
  bottega: { type: Object, required: true },
  animazione: { type: Object, default: null },   // { n, tipo: versa | pulisci | festa, … }
  messaggio: { type: Object, default: null },    // { tipo: aiuto | giusto | trabocca, righe }
  attesa: { type: Number, default: 0 },          // 0..1, quanto manca prima di poter pulire
  bloccato: { type: Boolean, default: false },
  manca: { type: Boolean, default: false },      // la pergamena dice quanto manca
})
const emit = defineEmits(['compra', 'scegli', 'pulisci', 'fermo'])

const b = computed(() => props.bottega)
const corrente = computed(() => b.value.ingredienti[b.value.corrente])
const fatto = g => g.messo >= g.dose

/* la scena, già decisa: la tela la traduce e basta */
const quadro = computed(() => {
  const q = b.value, g = corrente.value
  return {
    vasi: q.ingredienti.map((x, i) => ({
      famiglia: x.famiglia, colore: x.colore, livello: x.messo / x.dose, fatto: fatto(x),
      scelto: i === q.corrente && !q.finita, pezzi: x.pezzi.map(p => p / x.dose),
    })),
    banchetto: `${q.pozione.nome}:${q.corrente}`,
    ampolle: g.offerte.map(o => ({
      testo: scrivi(o.base, o.unita), prezzo: o.prezzo, colore: g.colore, famiglia: g.famiglia,
      misura: o.base / VALE[FAMIGLIA[g.famiglia].unita.G],
    })),
    macchia: q.macchia ? { i: q.macchia.ingrediente, colore: q.macchia.colore } : null,
    calderone: mescola(q.ingredienti.filter(fatto).map(x => x.colore)),
  }
})

const tela = ref(null)
const senza3d = ref(false)
let scena = null

function tocca(t) {
  if (!t || props.bloccato) return
  if (t.che === 'ampolla') emit('compra', t.k)
  // la macchia sta attorno al suo misurino: toccarlo vuol dire pulire
  else if (t.che === 'vaso' && b.value.macchia?.ingrediente === t.i) emit('pulisci')
  else if (t.che === 'vaso') emit('scegli', t.i)
  else if (t.che === 'macchia') emit('pulisci')
}
function accendi() {
  scena?.rilascia()
  scena = creaBottega3d(tela.value, { tocca, perso: () => { senza3d.value = true } })
  senza3d.value = !scena
  if (scena) scena.imposta(quadro.value)
}
onMounted(accendi)
onBeforeUnmount(() => { scena?.rilascia(); scena = null })

watch(quadro, q => scena?.imposta(q))
// sincrono: l'animazione deve tenere la scena prima che arrivi quella nuova
watch(() => props.animazione, async a => {
  if (!a) return
  if (scena) {
    if (a.tipo === 'versa') await scena.versa(a)
    else if (a.tipo === 'pulisci') await scena.pulisci()
    else if (a.tipo === 'festa') await scena.festa(a.colore)
  }
  emit('fermo', a.n)
}, { flush: 'sync' })

/* per lo strumento delle foto: quanto costa un fotogramma */
if (typeof window !== 'undefined') window.__bottega3d = { grafica: () => scena?.grafica() }
</script>

<template>
  <div class="pz-mercante" :data-fase="b.macchia ? 'macchia' : b.finita ? 'finita' : 'compra'">
    <canvas ref="tela" class="pz-tela" data-tela></canvas>
    <div v-if="senza3d" class="pz-senza">
      Qui il banco non si riesce a disegnare.
      <button class="pz-piccolo" @click="accendi">riprova</button>
    </div>

    <div class="pz-sopra-tela">
      <div class="pz-pergamena pz-ricetta" data-pergamena>
        <div class="pz-testa-ricetta">
          <b><span class="em">{{ b.pozione.emoji }}</span> {{ b.pozione.nome }}</b>
          <span class="pz-borsa" :class="{ 'pz-rosso': b.resto < 0 }" data-gettoni>
            <i class="pz-gettone" aria-hidden="true"></i>{{ b.resto }}
          </span>
        </div>
        <button v-for="(g, i) in b.ingredienti" :key="g.nome" class="pz-riga"
                :class="{ 'pz-scelta': i === b.corrente && !b.finita, 'pz-fatto': fatto(g) }"
                :data-voce="g.nome" :disabled="fatto(g) || bloccato" @click="$emit('scegli', i)">
          <span class="pz-pallino" :style="{ background: g.colore }"></span>
          <span class="em">{{ fatto(g) ? '✅' : g.emoji }}</span>
          <span class="pz-nome">{{ g.nome }}</span>
          <span class="pz-quanto" data-dose>
            <b>{{ scrivi(g.messo, g.unita) }}</b> di {{ scrivi(g.dose, g.unita) }}
            <i v-if="manca && !fatto(g) && g.messo" class="pz-manca">manca {{ scrivi(g.dose - g.messo, g.unita) }}</i>
          </span>
        </button>
      </div>

      <div v-if="messaggio" class="pz-cartello" :class="'pz-' + messaggio.tipo" data-esito
           :data-codice="messaggio.tipo">
        <b>{{ messaggio.righe[0] }}</b>
        <span v-for="(r, n) in messaggio.righe.slice(1)" :key="n" class="pz-riga-esito">{{ r }}</span>
        <div v-if="attesa > 0" class="pz-attesa" aria-hidden="true"><i :style="{ width: attesa * 100 + '%' }"></i></div>
      </div>
    </div>

    <div class="pz-piede">
      <button v-if="b.macchia" class="pz-grosso pz-pulisci" data-azione="pulisci"
              :disabled="bloccato || attesa > 0" @click="$emit('pulisci')">
        Pulisci la macchia · <i class="pz-gettone" aria-hidden="true"></i>{{ PULIZIA }}
      </button>
      <span v-else-if="!b.finita" class="pz-banchetto">
        Il mercante vende <b>{{ corrente.nome }}</b>: tocca un'ampolla per comprarla
      </span>
    </div>
  </div>
</template>
