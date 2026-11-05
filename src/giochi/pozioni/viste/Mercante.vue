<script setup>
// Il laboratorio: la tela 3D col banco, sopra la pergamena con la ricetta,
// sotto la borsa dei gettoni. Si parte col listino aperto; fatta la spesa,
// sotto ci sono la roba e le azioni del procedimento. Questa vista non decide
// niente: riceve la bottega e l'ordine in preparazione, traduce in scena
// quello che c'è, suona le animazioni che il coordinatore chiede e dice
// cosa il dito ha toccato. Vedi docs/pozioni/regole.md.
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { scrivi, mescola } from '../dati/misure.js'
import { PULIZIA, SPEDIZIONE } from '../dati/bottega.js'
import { ANTEPRIME } from '../dati/anteprime.js'
import { regola } from '../motore/misura.js'
import { ATTREZZI, MOSSE } from '../motore/procedimento.js'
import { creaBottega3d } from '../scena3d/indice.js'

const props = defineProps({
  bottega: { type: Object, required: true },
  bozza: { type: Array, default: () => [] },     // l'ordine in preparazione: [{ i, k }]
  animazione: { type: Object, default: null },   // { n, tipo: ordine | pulisci | festa, … }
  messaggio: { type: Object, default: null },    // { tipo: aiuto | giusto | trabocca, righe }
  attesa: { type: Number, default: 0 },          // 0..1, quanto manca prima di poter pulire
  bloccato: { type: Boolean, default: false },
})
const emit = defineEmits(['aggiungi', 'togli', 'ordina', 'fai', 'pulisci', 'fermo'])

const b = computed(() => props.bottega)
const aiuto = computed(() => b.value.tappa.aiuto)
const fatto = g => g.messo >= g.dose
const sporco = computed(() => b.value.macchie.length > 0)
// la parola giusta per quello che c'è sul tavolo: una radice non si pulisce, si toglie
const ripulisci = computed(() => {
  const f = new Set(b.value.macchie.map(i => b.value.ingredienti[i].famiglia))
  return f.size > 1 ? 'Metti a posto' : f.has('lunghezza') ? 'Togli' : f.has('massa') ? 'Spazza' : 'Pulisci'
})
// mentre il mercante versa, la pergamena dice quello che si è già visto, non il risultato
const mostrati = ref(null)
const aperto = ref(b.value.speso === 0)          // il rotolo del mercante: si comincia da lì
const listino = computed(() => aperto.value && !b.value.pronta)
const daComprare = computed(() => b.value.ingredienti.map((g, i) => ({ g, i })).filter(x => !x.g.dispensa))
// la spesa è finita quando si è vista finire, non quando il motore l'ha decisa
const pronta = computed(() => b.value.pronta && !mostrati.value)

/* il procedimento: niente bottoni, sulla tela si trascina tutto */
function lascia({ attrezzo, su }) {
  if (attrezzo.startsWith('roba:')) return emit('fai', su === 'mortaio' ? 'metti' : 'versa', [Number(attrezzo.slice(5))], attrezzo)
  const m = MOSSE[`${attrezzo}:${su}`]
  if (m) emit('fai', m[0], m[1], attrezzo)
}
// la riga è fatta quando tutti i suoi passi sono fatti
const rigaFatta = r => r.passi.every(k => k < b.value.passo)

const messo = (g, i) => (mostrati.value ? mostrati.value[i] : g.messo)
const pieno = (g, i) => messo(g, i) >= g.dose

const voce = v => { const g = b.value.ingredienti[v.i], o = g.offerte[v.k]; return { g, o, testo: scrivi(o.base, o.unita) } }
const piena = computed(() => props.bozza.length >= b.value.quanteInOrdine)
const totale = computed(() => (props.bozza.length ? props.bozza.reduce((s, v) => s + voce(v).o.prezzo, SPEDIZIONE) : 0))
const percento = n => Math.min(100, n / b.value.gettoni * 100) + '%'
// il conto scritto sotto la targhetta, solo dove la tappa lo dà
const vale = (g, o) => (aiuto.value === 'svolto' && o.unita !== g.unita ? `= ${scrivi(o.base, g.unita)}` : '')
// l'uguaglianza resta scritta in tutte le tappe: a memoria si va solo nel calderone senza fondo
const leRegole = g => (aiuto.value === '' ? [] : [...new Set(g.offerte.map(o => regola(g.unita, o.unita)).filter(Boolean))])

/* la scena, già decisa: la tela la traduce e basta */
const quadro = computed(() => {
  const q = b.value
  const macchie = q.macchie.map(i => ({ i, colore: q.ingredienti[i].colore }))
  // davanti solo gli strumenti che servono: a ingrediente finito si mettono via (uno sporco resta finché non si pulisce)
  const vasi = q.ingredienti.flatMap((x, i) => (fatto(x) && !q.macchie.includes(i) ? [] : [{
    i, nome: x.nome, foto: ANTEPRIME[x.nome], famiglia: x.famiglia, colore: x.colore, livello: fatto(x) ? 0 : x.messo / x.dose, pezzi: fatto(x) ? [] : x.pezzi.map(p => p / x.dose),
  }]))
  return {
    vasi, macchie,
    calderone: q.brodo,
    riempito: q.dentro.length / q.ingredienti.length,
    arcobaleno: q.dentro.length > 0 && !q.mescolato,
    fuoco: q.scaldato ? 1 : 0,
    attrezzi: { visibili: q.pronta && !q.macchie.length, quali: q.tappa.azioni.flatMap(a => ATTREZZI[a] || []), quanti: q.ingredienti.length,
                roba: q.ingredienti.flatMap((x, i) => (q.dentro.includes(i) || q.mortaio.includes(i) ? [] : [{ i, posto: i, nome: x.nome, foto: ANTEPRIME[x.nome] }])),
                pestato: q.mortaio.length ? mescola(q.mortaio.map(i => q.ingredienti[i].colore)) : null },
  }
})

const tela = ref(null)
const senza3d = ref(false)
let scena = null

function tocca(t) {
  if (!t || props.bloccato) return
  // lo sporco sta attorno al suo strumento: toccarlo, o lui, vuol dire toglierlo
  if (t.che === 'macchia' || (t.che === 'vaso' && b.value.macchie.includes(t.i))) emit('pulisci')
}
function accendi() {
  scena?.rilascia()
  scena = creaBottega3d(tela.value, { tocca, lascia, perso: () => { senza3d.value = true } })
  senza3d.value = !scena
  if (scena) scena.imposta(quadro.value)
}
onMounted(accendi)
onBeforeUnmount(() => { scena?.rilascia(); scena = null })

watch(quadro, q => scena?.imposta(q))
// sincrono: l'animazione deve tenere la scena prima che arrivi quella nuova
watch(() => props.animazione, async a => {
  if (!a) return
  aperto.value = false
  if (scena) {
    if (a.tipo === 'ordine') {
      mostrati.value = [...a.prima]
      await scena.ordine(a.voci, k => { mostrati.value[a.voci[k].i] = a.voci[k].messo })
      mostrati.value = null
    } else if (a.tipo === 'passo') await scena.passo(a)
    else if (a.tipo === 'pulisci') await scena.pulisci()
    else if (a.tipo === 'festa') await scena.festa(a.colore)
  }
  emit('fermo', a.n)
}, { flush: 'sync' })

/* per lo strumento delle foto: quanto costa un fotogramma */
if (typeof window !== 'undefined') window.__bottega3d = { grafica: () => scena?.grafica(), dove: id => scena?.dove(id) }
</script>

<template>
  <div class="pz-mercante" :data-fase="sporco ? 'macchia' : b.finita ? 'finita' : pronta ? 'procedimento' : listino ? 'listino' : 'banco'">
    <div class="pz-scena">
      <canvas ref="tela" class="pz-tela" data-tela></canvas>
      <div v-if="senza3d" class="pz-senza">
        Qui il banco non si riesce a disegnare.
        <button class="pz-piccolo" @click="accendi">riprova</button>
      </div>

      <div class="pz-strati">
        <div class="pz-pergamena" data-pergamena>
          <h3><span class="em">{{ b.pozione.emoji }}</span> {{ b.pozione.nome }}</h3>
          <div v-for="{ g, i } in (pronta ? [] : daComprare)" :key="g.nome" class="pz-riga" :class="{ 'pz-fatto': pieno(g, i) }" :data-voce="g.nome">
            <span v-if="pieno(g, i)" class="em">✅</span>
            <img v-else class="pz-foto" :src="ANTEPRIME[g.nome]" alt="">
            <span class="pz-nome">{{ g.nome }}</span>
            <i class="pz-puntini" aria-hidden="true"></i>
            <span class="pz-quanto" data-dose>
              <b>{{ scrivi(messo(g, i), g.unita) }}</b> di {{ scrivi(g.dose, g.unita) }}
              <i v-if="b.tappa.manca && !pieno(g, i) && messo(g, i)" class="pz-manca">manca {{ scrivi(g.dose - messo(g, i), g.unita) }}</i>
            </span>
          </div>
          <!-- col rotolo aperto basta la lista: sul telefono non ci starebbe -->
          <ul v-if="!listino" class="pz-procedimento" :class="{ 'pz-letto': pronta }" data-ricetta>
            <li v-for="(r, n) in b.righe" :key="n" :class="{ 'pz-fatto': rigaFatta(r) }" data-riga>{{ r.testo }}</li>
          </ul>
        </div>

        <!-- il rotolo del mercante: targhette, nessuna figura che suggerisca quanto -->
        <div v-if="listino" class="pz-rotolo" data-listino>
          <div class="pz-testa-rotolo">
            <h3>Il listino del mercante</h3>
            <button class="pz-chiudi" aria-label="chiudi" data-chiudi @click="aperto = false">✕</button>
          </div>
          <p v-if="messaggio && messaggio.tipo === 'aiuto'" class="pz-dice" data-esito data-codice="aiuto">{{ messaggio.righe.join(' ') }}</p>
          <div class="pz-elenco">
            <section v-for="{ g, i } in daComprare" :key="g.nome" class="pz-merce" :class="{ 'pz-fatto': fatto(g) }" :data-merce="g.nome">
              <h4><img class="pz-foto" :src="ANTEPRIME[g.nome]" alt=""> {{ g.nome }}
                <i v-for="r in leRegole(g)" :key="r" class="pz-regola" data-regola>{{ r }}</i>
              </h4>
              <div class="pz-targhette">
                <button v-for="(o, k) in g.offerte" :key="k" class="pz-targhetta" :data-targhetta="`${i}:${k}`"
                        :disabled="bloccato || piena || fatto(g)" @click="$emit('aggiungi', i, k)">
                  <b>{{ scrivi(o.base, o.unita) }}</b>
                  <em v-if="vale(g, o)" data-vale>{{ vale(g, o) }}</em>
                  <span><i class="pz-gettone" aria-hidden="true"></i>{{ o.prezzo }}</span>
                </button>
              </div>
            </section>
          </div>
        </div>
        <div v-else class="pz-vuoto-tela"></div>

        <!-- il cartello sta sopra il bancone, che è vuoto finché non arriva la consegna -->
        <div v-if="messaggio && !listino" class="pz-cartello" :class="'pz-' + messaggio.tipo" data-esito :data-codice="messaggio.tipo">
          <b>{{ messaggio.righe[0] }}</b>
          <span v-for="(r, n) in messaggio.righe.slice(1)" :key="n" class="pz-riga-esito">{{ r }}</span>
          <div v-if="attesa > 0" class="pz-attesa" aria-hidden="true"><i :style="{ width: attesa * 100 + '%' }"></i></div>
        </div>
      </div>
    </div>

    <div v-if="!b.finita" class="pz-piede">
      <div class="pz-borsa" :class="{ 'pz-rosso': b.speso + totale > b.gettoni }" data-gettoni>
        <i class="pz-gettone" aria-hidden="true"></i>
        <span>Hai speso <b data-speso>{{ b.speso }}</b> su <b>{{ b.gettoni }}</b>
          <template v-if="totale"> · ordine {{ totale }}</template></span>
        <div class="pz-livello" aria-hidden="true">
          <i :style="{ width: percento(b.speso) }"></i>
          <i class="pz-in-ordine" :style="{ width: percento(totale) }"></i>
        </div>
      </div>
      <div v-if="listino" class="pz-ordine" data-ordine>
        <!-- lo scontrino: quello che si pagherà, riga per riga; una riga toccata si toglie -->
        <div class="pz-scontrino" data-scontrino>
          <p v-if="!bozza.length" class="pz-invito">Tocca le targhette: fino a {{ b.quanteInOrdine }} in un ordine.</p>
          <button v-for="(v, n) in bozza" :key="n" class="pz-voce" :data-posto="n" :disabled="bloccato" @click="$emit('togli', n)">
            <i class="pz-via" aria-hidden="true">✕</i>
            <img class="pz-foto" :src="ANTEPRIME[voce(v).g.nome]" alt="">
            <span>{{ voce(v).testo }}</span>
            <i class="pz-puntini" aria-hidden="true"></i>
            <b><i class="pz-gettone" aria-hidden="true"></i>{{ voce(v).o.prezzo }}</b>
          </button>
          <div class="pz-voce" data-spedizione>
            <span>Spedizione</span>
            <i class="pz-puntini" aria-hidden="true"></i>
            <b><i class="pz-gettone" aria-hidden="true"></i>{{ SPEDIZIONE }}</b>
          </div>
          <div v-if="bozza.length" class="pz-voce pz-totale" data-totale>
            <span>Totale</span>
            <i class="pz-puntini" aria-hidden="true"></i>
            <b><i class="pz-gettone" aria-hidden="true"></i>{{ totale }}</b>
          </div>
        </div>
        <button class="pz-grosso pz-ordina" data-azione="ordina" :disabled="bloccato || !bozza.length || sporco" @click="$emit('ordina')">
          Ordina
        </button>
      </div>
      <button v-else-if="sporco" class="pz-grosso pz-pulisci" data-azione="pulisci"
              :disabled="bloccato || attesa > 0" @click="$emit('pulisci')">
        {{ ripulisci }} · <i class="pz-gettone" aria-hidden="true"></i>{{ PULIZIA * b.macchie.length }}
      </button>
      <button v-else-if="!pronta" class="pz-grosso pz-al-mercante" data-azione="mercante" :disabled="bloccato" @click="aperto = true">
        Dal mercante
      </button>
    </div>
  </div>
</template>
