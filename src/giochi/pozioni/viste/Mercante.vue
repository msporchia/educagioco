<script setup>
// La bottega del mercante (in prova): la tela 3D col banco, sopra la
// pergamena coi misurini e i gettoni, sotto il listino a targhette e
// l'ordine da fare. Questa vista non decide niente: riceve la bottega e
// l'ordine in preparazione, traduce in scena quello che c'è, suona le
// animazioni che il coordinatore chiede e dice cosa il dito ha toccato.
// Vedi docs/pozioni/bottega.md.
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { scrivi, mescola } from '../dati/misure.js'
import { PULIZIA } from '../dati/bottega.js'
import { creaBottega3d } from '../scena3d/indice.js'

const props = defineProps({
  bottega: { type: Object, required: true },
  bozza: { type: Array, default: () => [] },     // l'ordine in preparazione: [{ i, k }]
  animazione: { type: Object, default: null },   // { n, tipo: ordine | pulisci | festa, … }
  messaggio: { type: Object, default: null },    // { tipo: aiuto | giusto | trabocca, righe }
  attesa: { type: Number, default: 0 },          // 0..1, quanto manca prima di poter pulire
  bloccato: { type: Boolean, default: false },
  manca: { type: Boolean, default: false },      // la pergamena dice quanto manca
})
const emit = defineEmits(['aggiungi', 'togli', 'ordina', 'scegli', 'pulisci', 'fermo'])

const b = computed(() => props.bottega)
const corrente = computed(() => b.value.ingredienti[b.value.corrente])
const fatto = g => g.messo >= g.dose
// mentre il mercante versa, la pergamena dice quello che si è già visto, non il risultato
const mostrati = ref(null)
const messo = (g, i) => (mostrati.value ? mostrati.value[i] : g.messo)
const pieno = (g, i) => messo(g, i) >= g.dose
const sporco = computed(() => b.value.macchie.length > 0)
const voce = v => { const g = b.value.ingredienti[v.i], o = g.offerte[v.k]; return { g, o, testo: scrivi(o.base, o.unita) } }
const totale = computed(() => props.bozza.reduce((s, v) => s + voce(v).o.prezzo, 0))
const piena = computed(() => props.bozza.length >= b.value.quanteInOrdine)

/* la scena, già decisa: la tela la traduce e basta */
const quadro = computed(() => {
  const q = b.value
  return {
    vasi: q.ingredienti.map((x, i) => ({
      famiglia: x.famiglia, colore: x.colore, livello: x.messo / x.dose, fatto: fatto(x),
      scelto: i === q.corrente && !q.finita, pezzi: x.pezzi.map(p => p / x.dose),
    })),
    macchie: q.macchie.map(i => ({ i, colore: q.ingredienti[i].colore })),
    calderone: mescola(q.ingredienti.filter(fatto).map(x => x.colore)),
  }
})

const tela = ref(null)
const senza3d = ref(false)
let scena = null

function tocca(t) {
  if (!t || props.bloccato) return
  // la macchia sta attorno al suo misurino: toccarlo, o lei, vuol dire pulire
  if (t.che === 'macchia' || (t.che === 'vaso' && b.value.macchie.includes(t.i))) emit('pulisci')
  else if (t.che === 'vaso') emit('scegli', t.i)
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
    if (a.tipo === 'ordine') {
      mostrati.value = [...a.prima]
      await scena.ordine(a.voci, k => { mostrati.value[a.voci[k].i] = a.voci[k].messo })
      mostrati.value = null
    }
    else if (a.tipo === 'pulisci') await scena.pulisci()
    else if (a.tipo === 'festa') await scena.festa(a.colore)
  }
  emit('fermo', a.n)
}, { flush: 'sync' })

/* per lo strumento delle foto: quanto costa un fotogramma */
if (typeof window !== 'undefined') window.__bottega3d = { grafica: () => scena?.grafica() }
</script>

<template>
  <div class="pz-mercante" :data-fase="sporco ? 'macchia' : b.finita ? 'finita' : 'ordina'">
    <div class="pz-scena">
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
                  :class="{ 'pz-scelta': i === b.corrente && !b.finita, 'pz-fatto': pieno(g, i) }"
                  :data-voce="g.nome" :disabled="fatto(g) || bloccato" @click="$emit('scegli', i)">
            <span class="pz-pallino" :style="{ background: g.colore }"></span>
            <span class="em">{{ pieno(g, i) ? '✅' : g.emoji }}</span>
            <span class="pz-nome">{{ g.nome }}</span>
            <span class="pz-quanto" data-dose>
              <b>{{ scrivi(messo(g, i), g.unita) }}</b> di {{ scrivi(g.dose, g.unita) }}
              <i v-if="manca && !pieno(g, i) && messo(g, i)" class="pz-manca">manca {{ scrivi(g.dose - messo(g, i), g.unita) }}</i>
            </span>
          </button>
        </div>
      </div>

      <!-- il cartello sta sopra il bancone, che è vuoto finché non arriva la consegna -->
      <div class="pz-sotto-tela">
        <div v-if="messaggio" class="pz-cartello" :class="'pz-' + messaggio.tipo" data-esito
             :data-codice="messaggio.tipo">
          <b>{{ messaggio.righe[0] }}</b>
          <span v-for="(r, n) in messaggio.righe.slice(1)" :key="n" class="pz-riga-esito">{{ r }}</span>
          <div v-if="attesa > 0" class="pz-attesa" aria-hidden="true"><i :style="{ width: attesa * 100 + '%' }"></i></div>
        </div>
      </div>
    </div>

    <div v-if="!b.finita" class="pz-bottega" :class="{ 'pz-bloccato': bloccato }">
      <!-- il listino dell'ingrediente scelto: targhette, nessuna figura che suggerisca quanto -->
      <div class="pz-listino" data-listino>
        <span class="pz-di">Il listino · <span class="em">{{ corrente.emoji }}</span> <b>{{ corrente.nome }}</b></span>
        <div class="pz-targhette">
          <button v-for="(o, k) in corrente.offerte" :key="k" class="pz-targhetta" :data-targhetta="k"
                  :disabled="bloccato || piena || fatto(corrente)" @click="$emit('aggiungi', b.corrente, k)">
            <b>{{ scrivi(o.base, o.unita) }}</b>
            <span><i class="pz-gettone" aria-hidden="true"></i>{{ o.prezzo }}</span>
          </button>
        </div>
      </div>
      <!-- l'ordine al mercante: si paga tutto e lui le versa in fila -->
      <div class="pz-ordine" data-ordine>
        <button v-for="n in b.quanteInOrdine" :key="n" class="pz-posto" :class="{ 'pz-vuoto': !bozza[n - 1] }"
                :data-posto="n - 1" :disabled="!bozza[n - 1] || bloccato" @click="$emit('togli', n - 1)">
          <template v-if="bozza[n - 1]">
            <span class="pz-pallino" :style="{ background: voce(bozza[n - 1]).g.colore }"></span>
            <b>{{ voce(bozza[n - 1]).testo }}</b>
            <i class="pz-via" aria-hidden="true">✕</i>
          </template>
        </button>
        <button v-if="sporco" class="pz-grosso pz-pulisci" data-azione="pulisci"
                :disabled="bloccato || attesa > 0" @click="$emit('pulisci')">
          Pulisci · <i class="pz-gettone" aria-hidden="true"></i>{{ PULIZIA * b.macchie.length }}
        </button>
        <button v-else class="pz-grosso pz-ordina" data-azione="ordina"
                :disabled="bloccato || !bozza.length" @click="$emit('ordina')">
          Ordina · <i class="pz-gettone" aria-hidden="true"></i>{{ totale }}
        </button>
      </div>
    </div>
  </div>
</template>
