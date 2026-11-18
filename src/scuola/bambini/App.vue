<script setup>
// L'app del bambino a scuola: codice, nome, attesa, i blocchi della lezione, fine. Il giro sta in giro.js; docs/scuola/bambini.md
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { apriBambino } from '../comune/rete.js'
import { descrivi, racconta, giocoDi } from '../comune/esercizi.js'
import { posizione, bloccoDi } from '../comune/lezione.js'
import * as G from './giro.js'
import Codice from './viste/Codice.vue'
import Nomi from './viste/Nomi.vue'
import Domande from './viste/Domande.vue'
import { VISTE } from '../giochi/viste.js'
import { SCHEDE } from '../giochi/elenco.js'

const versione = __VERSIONE_SCUOLA__
const PAZIENZA = 3000      // prima di dire «Sto ricollegando…» al primo collegamento
const BATTITO = 2000       // ogni quanto si rilegge l'orologio per i minuti che restano

const codice = ref(null)
const nato = ref(0)
const stato = ref(null)          // { fase, lezione, avanti, io, alunni }: l'ultimo dal servizio, o quello ricordato
const cammino = ref(null)        // { alunno, p, visto, conto }: dove sta questo bambino
const collegato = ref(false)
const pazienza = ref(false)
const scelgo = ref(false)
const avviso = ref('')
const ora = ref(Date.now())
let rete = null, attesa = 0, battito = 0

// un gioco in 3D vuole WebGL 2 (come grafica/spazio3d), provato una volta e solo se serve: senza, o se il gioco non parte, si fa a schede
let webgl = null
function cèWebGL() {
  if (webgl !== null) return webgl
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    webgl = !!gl
  } catch { webgl = false }
  return webgl
}
const senzaGioco = ref(false)

const schermo = computed(() => G.schermata({ codice: codice.value, stato: stato.value, cammino: cammino.value }))
const io = computed(() => stato.value?.io || null)
const lezione = computed(() => stato.value?.lezione || null)
// la posizione e il blocco in cui sta, nelle schermate della lezione
const pos = computed(() => (io.value ? posizione(G.camminoDi(cammino.value, stato.value).p, stato.value.avanti) : 0))
const blocco = computed(() => (schermo.value === 'blocco' || schermo.value === 'passaggio' ? lezione.value.blocchi[bloccoDi(lezione.value, pos.value)] : null))
const segno = computed(() => (schermo.value === 'blocco' ? G.segno(blocco.value.passa, G.camminoDi(cammino.value, stato.value).conto, ora.value) : ''))
const ricollego = computed(() => !!codice.value && !collegato.value && pazienza.value && schermo.value !== 'chiusa')
// il gioco del blocco (docs/scuola/giochi.md); un esercizio col contenuto di un gioco non ha le schede come ripiego
const gioco = computed(() => giocoDi(blocco.value?.esercizio))
const scheda = computed(() => SCHEDE.find(s => s.id === gioco.value) || null)
const soloNelGioco = computed(() => !!scheda.value?.tipo && blocco.value?.esercizio?.tipo === scheda.value.tipo.id)
const inGioco = computed(() => !!VISTE[gioco.value] && !senzaGioco.value && (!scheda.value?.tred || cèWebGL()))

function chiudiRete() {
  rete?.chiudi()
  rete = null
  clearTimeout(attesa)
}

function entra(c, ricordo = null) {
  chiudiRete()
  codice.value = c
  nato.value = ricordo?.nato ?? Date.now()
  stato.value = ricordo?.stato ?? null
  cammino.value = ricordo?.cammino ?? null
  collegato.value = false
  pazienza.value = false
  scelgo.value = false
  avviso.value = ''
  attesa = setTimeout(() => { pazienza.value = true }, PAZIENZA)
  rete = apriBambino(c, {
    suStato: d => { stato.value = G.statoDa(d) },
    suNo: perche => {
      if (perche === 'codice') return esci()           // la lezione non c'è più: si torna al codice, senza errori
      if (schermo.value !== 'nome' || (perche !== 'preso' && perche !== 'storto')) return
      scelgo.value = false
      avviso.value = perche === 'preso' ? 'Questo nome l\'ha già scelto un altro computer: tocca il tuo.'
        : 'Non riesco a darti questo nome: chiedi alla maestra.'
    },
    suLinea: l => { collegato.value = l === 'su' },
  })
}

function esci() {
  chiudiRete()
  G.dimentica()
  codice.value = null
  stato.value = null
  cammino.value = null
}

function scegli(chi) {
  scelgo.value = true
  avviso.value = ''
  rete?.sono(chi)
}

// `p` è la posizione in cui la vista è stata montata (`:key`): una risposta arrivata dopo un cambio di blocco non conta qui
const aPos = (p, f) => e => f(p, e)
function contaRisposta(p, giusta, ultima) {
  cammino.value = G.rispostaData(cammino.value, lezione.value, { blocco: p, giusta, ultima }, Date.now())
}

function risposta(p, { domanda, giusto, indice, chiave, tempo }) {
  rete?.rispondi({ blocco: p, chiave, giusta: giusto, ms: Math.round(tempo * 1000), ultima: true, ...racconta(domanda, indice) })
  contaRisposta(p, giusto, true)
}

// un gioco vero manda la risposta già raccontata (docs/scuola/giochi.md); il blocco conta la domanda quando si chiude (`ultima`)
function rispostaGioco(p, { chiave, giusta, ms, ultima, fatto, data, attesa }) {
  rete?.rispondi({ blocco: p, chiave, giusta, ms: Math.round(ms), ultima: ultima !== false, fatto, data, attesa })
  contaRisposta(p, giusta, ultima !== false)
}

function continua() {
  cammino.value = G.continua(cammino.value)
}

// il nome cambia (scelto, o liberato dalla maestra) o la maestra preme «Avanti tutti»: il cammino è di quel nome, al passo col pavimento
watch([() => io.value?.id, () => stato.value?.avanti], ([id], [prima]) => {
  if (id !== prima) { scelgo.value = false; avviso.value = '' }
  if (id) cammino.value = G.segui(cammino.value, id, stato.value.avanti)
})

// entrando in un blocco il tempo parte; a minuti, una soglia già passata (pagina riaperta tardi) porta al blocco dopo
watch([schermo, pos], ([s]) => {
  if (s === 'blocco') cammino.value = G.entraNelBlocco(G.camminoDi(cammino.value, stato.value), lezione.value, Date.now())
})

// alla maestra: la posizione a ogni cambio di blocco, «finito» a lezione finita
const dove = computed(() => (schermo.value === 'blocco' || schermo.value === 'passaggio' ? pos.value : schermo.value === 'finito' ? 'finito' : null))
watch(dove, d => { if (d !== null) rete?.dove(d) })

watch([codice, stato, cammino], () => {
  G.ricorda({ codice: codice.value, nato: nato.value, stato: stato.value, cammino: cammino.value })
})

onMounted(() => {
  const r = G.leggiRicordo(Date.now())
  if (r) entra(r.codice, r)
  battito = setInterval(() => { ora.value = Date.now() }, BATTITO)
})
onUnmounted(() => { chiudiRete(); clearInterval(battito) })
</script>

<template>
  <div class="schermo pulito scuola" :data-schermata="schermo">
    <header v-if="io && schermo !== 'chiusa'" class="testa">
      <span class="chi">{{ io.nome }}</span>
      <span v-if="ricollego" class="ricollego" data-ricollego>Sto ricollegando…</span>
      <span v-if="segno" class="segno" data-segno>{{ segno }}</span>
    </header>

    <Codice v-if="schermo === 'codice'" @entra="entra" />

    <div v-else-if="schermo === 'collego'" class="centro" data-collego>
      <p class="frase">Mi collego alla classe…</p>
      <p v-if="ricollego" class="testo" data-ricollego>Sto ricollegando…</p>
      <button type="button" class="link" data-cambia-codice @click="esci">Ho sbagliato codice</button>
    </div>

    <template v-else-if="schermo === 'nome'">
      <p v-if="ricollego" class="ricollego sopra" data-ricollego>Sto ricollegando…</p>
      <Nomi :alunni="stato.alunni" :scelgo="scelgo" :avviso="avviso"
            @scegli="id => scegli(id)" @nuovo="nome => scegli({ nome })" @cambia="esci" />
    </template>

    <div v-else-if="schermo === 'aspetta'" class="centro" data-aspetta>
      <p class="grande">{{ io.nome }}</p>
      <p class="frase">Aspetta il via della maestra</p>
    </div>

    <div v-else-if="schermo === 'blocco'" class="dentro" data-domanda :data-blocco="bloccoDi(lezione, pos)">
      <component :is="VISTE[gioco]" v-if="inGioco" :key="'gioco-' + pos" :esercizio="blocco.esercizio" :alunno="io"
                 :onRisposta="aPos(pos, rispostaGioco)" @guasto="senzaGioco = true" />
      <div v-else-if="soloNelGioco" class="centro" data-senza-gioco>
        <p class="frase">Questo gioco non parte su questo computer: chiama la maestra.</p>
      </div>
      <Domande v-else :key="'schede-' + pos" :esercizio="blocco.esercizio" :onRisposta="aPos(pos, risposta)" />
    </div>

    <div v-else-if="schermo === 'passaggio'" class="centro" data-passaggio>
      <p class="grande">Bravo!</p>
      <p class="frase">Adesso: {{ descrivi(blocco.esercizio) }}</p>
      <button type="button" class="bottone" data-continua @click="continua">Continua</button>
    </div>

    <div v-else-if="schermo === 'finito'" class="centro" data-finito>
      <p class="grande">Hai finito!</p>
      <p class="frase">Aspetta la maestra</p>
    </div>

    <div v-else-if="schermo === 'chiusa'" class="centro" data-chiusa>
      <p class="grande">La lezione è finita.</p>
      <p class="frase">Hai lavorato bene!</p>
      <button type="button" class="link" data-altra-lezione @click="esci">Entra in un'altra lezione</button>
    </div>

    <div v-else-if="schermo === 'guasta'" class="centro" data-guasta>
      <p class="frase">Questa lezione non si apre: chiedi alla maestra.</p>
      <button type="button" class="link" data-cambia-codice @click="esci">Ho sbagliato codice</button>
    </div>

    <span class="versione" data-versione>{{ versione }}</span>
  </div>
</template>

<style scoped>
.scuola { color: var(--inchiostro) }
.testa {
  flex: none; display: flex; align-items: center; gap: 12px; padding: 10px 16px;
  background: var(--superficie); box-shadow: 0 1px 0 var(--filo);
  font-size: 16px; font-weight: 600;
}
.chi { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.segno { color: var(--grigio); white-space: nowrap }
.ricollego { color: var(--grigio); font-size: 14px; font-weight: 400; white-space: nowrap }
.ricollego.sopra { flex: none; text-align: center; padding-top: 8px }
.dentro { flex: 1; min-height: 0; display: flex; flex-direction: column }
.grande { font-size: 34px; font-weight: 600 }
.frase { font-size: 21px; max-width: 32ch; line-height: 1.4 }
.centro .bottone { font-size: 18px; padding: 14px 28px; min-width: 180px }
.centro .link { font-size: 14px }
.versione {
  position: fixed; right: 6px; bottom: 3px; z-index: 50; pointer-events: none;
  font-size: 10px; color: var(--grigio); opacity: .7;
}
</style>
