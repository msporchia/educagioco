<script setup>
// L'app del bambino a scuola: codice, nome, attesa, domande, fine. Il giro sta in giro.js; docs/scuola/bambini.md
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { apriBambino } from '../comune/rete.js'
import { descrivi, racconta, raccontaAsteroide, giocoDi } from '../comune/esercizi.js'
import * as G from './giro.js'
import Codice from './viste/Codice.vue'
import Nomi from './viste/Nomi.vue'
import Domande from './viste/Domande.vue'
import Asteroidi from './viste/Asteroidi.vue'

const versione = __VERSIONE_SCUOLA__
const PAZIENZA = 3000      // prima di dire «Sto ricollegando…» al primo collegamento
const BATTITO = 2000       // ogni quanto si rilegge l'orologio per i minuti che restano

const codice = ref(null)
const nato = ref(0)
const stato = ref(null)          // { fase, lezione, io, alunni }: l'ultimo dal servizio, o quello ricordato
const avanzamento = ref(null)
const collegato = ref(false)
const pazienza = ref(false)
const scelgo = ref(false)
const avviso = ref('')
const ora = ref(Date.now())
let rete = null, attesa = 0, battito = 0

// gli Asteroidi vogliono WebGL 2 (come grafica/spazio3d), provato una volta e solo se serve: senza, o se il gioco non parte, si fa a schede
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

const schermo = computed(() => G.schermata({ codice: codice.value, stato: stato.value, avanzamento: avanzamento.value }))
const io = computed(() => stato.value?.io || null)
const lezione = computed(() => stato.value?.lezione || null)
const segno = computed(() => (schermo.value === 'obiettivo' && avanzamento.value
  ? G.segno(avanzamento.value, lezione.value.obiettivo, ora.value) : ''))
const ricollego = computed(() => !!codice.value && !collegato.value && pazienza.value && schermo.value !== 'chiusa')
const dopo = computed(() => (G.haDopo(lezione.value) ? descrivi(lezione.value.dopo) : ''))
const esercizioDi = parte => (parte === 'obiettivo' ? lezione.value.obiettivo.esercizio : lezione.value.dopo)
const inGioco = parte => !senzaGioco.value && giocoDi(esercizioDi(parte)) === 'asteroidi' && cèWebGL()

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
  avanzamento.value = ricordo?.avanzamento ?? null
  collegato.value = false
  pazienza.value = false
  scelgo.value = false
  avviso.value = ''
  attesa = setTimeout(() => { pazienza.value = true }, PAZIENZA)
  rete = apriBambino(c, {
    suStato: d => { stato.value = { fase: d.fase, lezione: d.lezione, io: d.io, alunni: d.alunni || [] } },
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
  avanzamento.value = null
}

function scegli(chi) {
  scelgo.value = true
  avviso.value = ''
  rete?.sono(chi)
}

function risposta(parte, { domanda, giusto, indice, chiave, tempo }) {
  rete?.rispondi({ parte, chiave, giusta: giusto, ms: Math.round(tempo * 1000), ...racconta(domanda, indice) })
  if (parte === 'obiettivo') avanzamento.value = G.rispostaData(avanzamento.value, lezione.value.obiettivo, Date.now())
}

// negli Asteroidi alla maestra va ogni colpo, ma l'obiettivo conta la domanda una volta, quando si chiude (`ultima`)
function rispostaGioco(parte, e) {
  rete?.rispondi({ parte, chiave: 'tab:prodotto', giusta: e.giusta, ms: e.ms, ultima: e.ultima, ...raccontaAsteroide(e) })
  if (parte === 'obiettivo') avanzamento.value = G.rispostaData(avanzamento.value, lezione.value.obiettivo, Date.now(), e.ultima)
}

function continua() {
  avanzamento.value = G.continua(avanzamento.value)
}

// il nome cambia (scelto, o liberato dalla maestra): l'avanzamento è di quel nome
watch(() => io.value?.id, id => {
  scelgo.value = false
  avviso.value = ''
  if (id) avanzamento.value = G.perAlunno(avanzamento.value, id)
})

watch(schermo, s => {
  if (s === 'obiettivo') {
    avanzamento.value = G.entraNellObiettivo(G.perAlunno(avanzamento.value, io.value.id), lezione.value.obiettivo, Date.now())
    if (avanzamento.value.parte !== 'obiettivo') return       // il tempo era già scaduto: lo schermo passa a «finito»
  }
  if (s === 'obiettivo' || s === 'finito' || s === 'dopo') rete?.dove(s)
})

watch([codice, stato, avanzamento], () => {
  G.ricorda({ codice: codice.value, nato: nato.value, stato: stato.value, avanzamento: avanzamento.value })
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

    <div v-else-if="schermo === 'obiettivo' || schermo === 'dopo'" class="dentro" data-domanda :data-parte="schermo">
      <Asteroidi v-if="inGioco(schermo)" :key="'gioco-' + schermo" :esercizio="esercizioDi(schermo)" :alunno="io"
                 @risposta="e => rispostaGioco(schermo, e)" @guasto="senzaGioco = true" />
      <Domande v-else :key="schermo" :esercizio="esercizioDi(schermo)" @risposta="e => risposta(schermo, e)" />
    </div>

    <div v-else-if="schermo === 'finito'" class="centro" data-finito>
      <p class="grande">Hai finito!</p>
      <template v-if="dopo">
        <p class="frase">Ora puoi continuare con: {{ dopo }}</p>
        <button type="button" class="bottone" data-continua @click="continua">Continua</button>
      </template>
      <p v-else class="frase">Aspetta la maestra</p>
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
