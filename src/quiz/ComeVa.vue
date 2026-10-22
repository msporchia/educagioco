<script setup>
// «Come va»: in cima le materie, poi la settimana, il tempo di gioco e tutte le tipologie dalla peggiore alla migliore (vedi docs/genitori/come-va.md).
import { ref, computed, onMounted, watch } from 'vue'
import { fasceDelBambino } from './catalogo.js'
import { andamentoDi, riassuntoDi, CUORI } from './andamento.js'
import { settimanaDi, giudizioDi, areeDi, DUE_SETTIMANE, UNA_SETTIMANA } from './comeva.js'
import { mattonelleOra, fotografa } from './fotografia.js'
import { vaBeneCosi } from './memoria.js'
import SchedaDomanda from './SchedaDomanda.vue'
import Aree from './Aree.vue'
import Radar from './Radar.vue'
import Settimana from './Settimana.vue'
import MappaTabelline from '../components/MappaTabelline.vue'
import TempoDiGioco from '../components/TempoDiGioco.vue'
import { state, ritocca, azzeraConto, etaDelBambino, accendiSapere, sapereAcceso } from '../store/profile.js'
import { TIPI } from './saperi.js'
import { leggiSessioni } from '../store/sessioni.js'
import { leggiIstantanee, laPiuRecenteDa } from '../store/istantanee.js'

defineProps({ chi: { type: String, default: '' } })
const emit = defineEmits(['prova'])

// dipendenza per rifare i conti dopo un ritocco/azzera: il catalogo si ricalcola a mano, costa
const giro = ref(0)
const aperta = ref(null)          // la riga di cui è aperta la scheda
const mostraMai = ref(false)
const materia = ref(null)         // la mattonella in cui si è entrati

// fuori dal profilo, quindi da leggere: le sessioni (minuti) e le fotografie (frecce, migliorate)
const voci = ref([])
const foto = ref([])
const adesso = ref(Date.now())
async function carica() {
  adesso.value = Date.now()
  await fotografa(adesso.value)   // la prima parte da qui, se il bambino non ha ancora giocato da quando c'è
  foto.value = await leggiIstantanee(state.player)
  voci.value = await leggiSessioni(state.player)
}
onMounted(carica)
watch(() => state.player, () => { materia.value = null; carica() })

const eta = computed(() => etaDelBambino())
const alleggerite = computed(() => state.profile.settings.alleggerite || {})

const righe = computed(() => {
  giro.value
  return fasceDelBambino().flatMap(f => f.righe)
})
const elenco = computed(() => andamentoDi(righe.value, state.profile.items || {}))
const conti = computed(() => riassuntoDi(elenco.value))

const mattonelle = computed(() => mattonelleOra({
  righe: righe.value, now: adesso.value,
  prima: laPiuRecenteDa(foto.value, DUE_SETTIMANE, adesso.value),
}))
const settimanaGrezza = computed(() => settimanaDi({
  righe: elenco.value.viste,
  items: state.profile.items || {},
  prima: laPiuRecenteDa(foto.value, UNA_SETTIMANA, adesso.value),
  vaBene: state.profile.settings.vaBene || {},
  alleggerite: alleggerite.value,
  voci: voci.value,
  now: adesso.value,
}))

// una domanda spenta non si lamenta più: esce dalle difficili e sta in «Le hai spente tu», da dove si riaccende
const settimana = computed(() => {
  giro.value
  const s = settimanaGrezza.value
  return { ...s, difficili: s.difficili.filter(r => sapereAcceso(r.tipo)) }
})
const spente = computed(() => {
  giro.value
  return Object.entries(state.profile.settings.sa || {})
    .filter(([k, v]) => v === false && TIPI.some(t => t.chiave === k))
    .map(([k]) => ({ tipo: k, nome: TIPI.find(t => t.chiave === k).nome }))
})
function spegni(r) { accendiSapere(r.tipo, false); giro.value++ }
function riaccendi(x) { accendiSapere(x.tipo, true); giro.value++ }

// il quadro a colpo d'occhio: un asse per materia, e una frase che dice come va (comeva.js: giudizioDi)
const aree = computed(() => areeDi(mattonelle.value))
const areaAperta = ref(null)      // l'area di cui si vedono le materie
// sempre tutte e cinque, anche quelle mai giocate (a zero, col trattino): il pentagono ha la stessa forma per tutti
const assi = computed(() => aree.value
  .map(a => ({ id: a.id, emoji: a.emoji, nome: a.nome, pct: a.pct ?? 0, vuota: a.pct == null, prima: a.freccia ? a.prima : null })))
const giudizio = computed(() => giudizioDi({
  viste: elenco.value.viste, difficili: settimana.value.difficili, migliorate: settimana.value.migliorate.length,
}))

const dentro = computed(() => materia.value &&
  [...mattonelle.value.viste, ...mattonelle.value.nonAncora].find(m => m.id === materia.value))
// dentro una materia dei quiz l'elenco è lo stesso, filtrato: l'ordine resta dalla peggiore
const lista = computed(() => {
  const m = dentro.value
  if (!m || m.tipo !== 'quiz') return elenco.value
  const sua = r => r.materia === m.id
  return { viste: elenco.value.viste.filter(sua), mai: elenco.value.mai.filter(sua) }
})
function entra(id) { materia.value = id; mostraMai.value = false }

// cinque simboli e non una percentuale: si legge con l'occhio; sbiaditi con poche prove (vedi andamento.js)
const cuori = r => '♥'.repeat(r.cuori) + '♡'.repeat(CUORI - r.cuori)

function apri(r) { aperta.value = r }
function chiudi() { aperta.value = null }

// stessa tacca del quadro dell'età, ma `spenta` è sempre falso: qui si ritocca solo una tipologia, mai un intero pezzo di scuola
function ritoccaRiga({ tipo, ritocco: gradini }) {
  ritocca(tipo, gradini)
  giro.value++
}
function azzeraRiga(r) {
  azzeraConto(r.tipo)
  giro.value++
  // la scheda resta aperta e i numeri si azzerano sotto gli occhi
  aperta.value = elenco.value.tutte.find(x => x.tipo === r.tipo) || null
}
function provaRiga(r) {
  chiudi()
  emit('prova', { sorgente: r.sorgente, nome: r.nome, giro: r.classi })
}
// rimandata: il vecchio conto parla delle domande di prima, quindi la riga lascia le difficili finché non ne arrivano otto nuove
function rimanda({ tipo, ritocco }) {
  ritocca(tipo, ritocco)
  vaBeneCosi(tipo)
  giro.value++
}
function vaBene(r) {
  vaBeneCosi(r.tipo)
  giro.value++
}
</script>

<template>
  <div class="come-va" data-come-va>
    <!-- dentro una materia: il resto della pagina si toglie di mezzo -->
    <template v-if="dentro">
      <div class="dentro-testa" :data-materia-aperta="dentro.id">
        <button type="button" class="torna" data-azione="materie-torna"
                @click="materia = null">← tutte le materie</button>
        <h2>{{ dentro.emoji }} {{ dentro.nome }} · {{ dentro.giuste == null ? '–' : dentro.giuste + '% giuste' }}</h2>
      </div>
      <MappaTabelline v-if="dentro.mappa === 'tabelline'" />
      <ul v-else-if="dentro.tipo === 'albo'" class="parti" data-parti>
        <li v-for="p in dentro.parti" :key="p.id">
          <b>{{ p.nome }}</b>
          <span>{{ p.imparati }} imparate su {{ p.totale }} · ne ha viste {{ p.visti }}</span>
        </li>
      </ul>
    </template>

    <template v-else>
      <h2>Come sta andando {{ chi }}</h2>
      <section class="quadro" data-quadro>
        <p class="giudizio" :class="giudizio.tono" data-giudizio :data-tono="giudizio.tono">
          <b>{{ giudizio.titolo }}</b><span>{{ giudizio.testo }}</span>
        </p>
        <Radar :assi="assi" @apri="id => (areaAperta = id)" />
        <p v-if="assi.some(a => a.prima != null)" class="legenda"><i class="adesso"></i> adesso <i class="prima"></i> due settimane fa</p>
      </section>

      <h3 class="sotto">Per area: risposte giuste su risposte date. Tocca per entrare</h3>
      <Aree :aree="aree" :aperta="areaAperta" @area="id => (areaAperta = id)" @apri="entra" />

      <Settimana :chi="chi" :settimana="settimana" :eta="eta" :alleggerite="alleggerite"
                 @prova="provaRiga" @rimanda="rimanda" @va-bene="vaBene"
                 :spente="spente" @spegni="spegni" @riaccendi="riaccendi" />

      <h2>Quanto ha giocato</h2>
      <TempoDiGioco />

    </template>

    <!-- il dettaglio: chiuso, è per chi vuole i numeri; dentro una materia si apre da solo e il titolo sparisce -->
    <details v-if="!dentro || dentro.tipo === 'quiz'" class="tendina dettaglio" :class="{ libera: !!dentro }" :open="!!dentro" data-dettaglio>
      <summary>Il dettaglio, domanda per domanda ({{ conti.incontrate }} incontrate)</summary>
      <!-- tre numeri in cima: «7 su 10» vuol dire una cosa diversa dopo 12 risposte o dopo 2000 -->
      <div v-if="!dentro" class="sommario" data-sommario>
        <div><b>{{ conti.risposte }}</b><span>risposte in tutto</span></div>
        <div><b>{{ conti.incontrate }}</b><span>domande incontrate</span></div>
        <div :class="{ male: conti.male > 0 }"><b>{{ conti.male }}</b><span>vanno male</span></div>
      </div>
      <p v-if="!lista.viste.length" class="vuoto">
        Non ha ancora risposto a niente<template v-if="dentro"> in questa materia</template>.
        Si riempie da sola giocando: ogni domanda si porta dietro quante volte gli è
        capitata e come è andata.
      </p>

      <template v-else>
        <p class="mini">
          Dalla peggiore alla migliore. <b>Premi il punteggio</b> di una riga per vedere
          tutti i numeri e decidere: provarla, spostarla più facile, o smettere di
          chiedergliela. Sotto {{ conti.minime }} risposte i cuori sono sbiaditi —
          troppo poche per dire com'è andata.
        </p>

        <!-- la riga intera è il tasto: un bersaglio di soli 90px in fondo alla riga si manca -->
        <ul class="righe">
          <li v-for="r in lista.viste" :key="r.tipo" :data-riga="r.tipo">
            <button type="button" class="riga" :data-voto="r.tipo" @click="apri(r)">
              <span class="ico">{{ r.icona }}</span>
              <span class="testo">
                <b>{{ r.nome }}</b>
                <i>{{ r.gruppoNome || r.modulo }}</i>
              </span>
              <span class="voto" :class="{ poche: r.poche, ritoccata: r.ritocco }">
                <b class="cuori">{{ cuori(r) }}</b>
                <i>{{ r.poche ? `${r.quante} prove` : `${r.ok} su ${r.quante}` }}</i>
              </span>
            </button>
          </li>
        </ul>
      </template>

      <!-- non ancora capitate: ripiegate in fondo, servono a spegnere in anticipo -->
      <button v-if="lista.mai.length" type="button" class="altre"
              data-altre @click="mostraMai = !mostraMai">
        {{ mostraMai ? '▴' : '▾' }} altre {{ lista.mai.length }} non gli sono ancora capitate
      </button>
      <ul v-if="mostraMai" class="righe spente">
        <li v-for="r in lista.mai" :key="r.tipo" :data-riga="r.tipo">
          <button type="button" class="riga" :data-voto="r.tipo" @click="apri(r)">
            <span class="ico">{{ r.icona }}</span>
            <span class="testo">
              <b>{{ r.nome }}</b>
              <i>{{ r.gruppoNome || r.modulo }}</i>
            </span>
            <span class="voto mai"><b class="cuori">–</b><i>mai vista</i></span>
          </button>
        </li>
      </ul>
    </details>

    <SchedaDomanda v-if="aperta" :riga="aperta" :eta="eta"
                   @chiudi="chiudi" @prova="provaRiga"
                   @ritocca="ritoccaRiga" @azzera="azzeraRiga" />
  </div>
</template>

<style scoped>
.come-va { display: grid; gap: 10px }
.quadro { display: grid; gap: 8px; padding: 12px; border-radius: 16px; background: #fff; box-shadow: 0 1px 6px #0000000f }
.giudizio { display: grid; gap: 2px; margin: 0; padding: 10px 12px; border-radius: 12px; text-align: left; background: #f5f3fc }
.giudizio b { font-size: 17px; font-weight: 850; color: #3a2a7a }
.giudizio span { font-size: 13px; line-height: 1.4; color: #55556a }
.giudizio.bene { background: #e4f6ea } .giudizio.bene b { color: #1f6a3d }
.giudizio.normale { background: #eef3ff } .giudizio.normale b { color: #2f4f9a }
.giudizio.alcune { background: #fff4de } .giudizio.alcune b { color: #8a5a0a }
.giudizio.tante { background: #ffe9e4 } .giudizio.tante b { color: #9a3a26 }
.legenda { margin: 0; text-align: center; font-size: 11px; color: #8a8a99 }
.legenda i { display: inline-block; width: 16px; height: 0; border-top: 3px solid #6a49c4; vertical-align: middle; margin: 0 4px 0 8px }
.legenda i.prima { border-top: 2px dashed #9a8fc0 }
.sotto { margin: 4px 0 0; font-size: 13px; font-weight: 850; color: #55556a }
.dettaglio { border-radius: 14px; background: #ffffffaa; padding: 0 10px 10px }
.dettaglio > summary { padding: 12px 4px; font-weight: 800; font-size: 14px; cursor: pointer; min-height: 44px; box-sizing: border-box; display: flex; align-items: center }
.dettaglio.libera { background: none; padding: 0 }
.dettaglio.libera > summary { display: none }
.come-va h2 { margin: 8px 0 0 }

.dentro-testa { display: grid; gap: 6px }
.dentro-testa h2 { margin: 0 }
.torna {
  justify-self: start; padding: 8px 12px; border: 0; border-radius: 11px;
  background: #f1eefb; color: #5b3fa8; font: inherit; font-size: 12px;
  font-weight: 750; cursor: pointer;
}
.parti { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px }
.parti li { display: grid; gap: 1px; padding: 9px 11px; border-radius: 12px; background: #f5f3fc }
.parti b { font-size: 13px }
.parti span { font-size: 11.5px; color: #8a8a99 }

.sommario { display: flex; gap: 8px }
.sommario > div {
  flex: 1; display: grid; gap: 1px; padding: 9px 4px; text-align: center;
  background: #f5f3fc; border-radius: 13px;
}
.sommario b { font-size: 18px; font-weight: 800 }
.sommario span { font-size: 10.5px; color: #8a8a99; line-height: 1.2 }
.sommario .male { background: #ffdede }
.sommario .male b { color: #8c2f2f }

.mini { margin: 0; font-size: 11.5px; line-height: 1.45; color: #8a8a99 }
.vuoto { margin: 0; font-size: 12.5px; line-height: 1.5; color: #55556a }

.righe { list-style: none; margin: 0; padding: 0; display: grid; gap: 3px }
.riga {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 4px 6px; margin: 0 -6px; border: 0; border-radius: 12px;
  background: none; color: inherit; font: inherit; text-align: left;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.riga:active { background: #f5f3fc; transform: scale(.995) }
.ico { font-size: 17px; width: 22px; text-align: center }
.testo { flex: 1; min-width: 0; display: grid }
.testo b { font-size: 13px; font-weight: 700 }
.testo i { font-style: normal; font-size: 11px; color: #8a8a99 }

.voto {
  display: grid; gap: 1px; min-width: 92px; padding: 6px 9px;
  border-radius: 12px; background: #f5f3fc; color: #5b3fa8;
  text-align: right;
}
.voto .cuori { font-size: 13px; letter-spacing: 1px }
.voto i { font-style: normal; font-size: 10.5px; color: #8a8a99 }
/* poche prove: il segnale c'è, il verdetto no */
.voto.poche { opacity: .55 }
.voto.ritoccata { background: #fff6e4; color: #7d5410 }
.voto.mai { background: #f2f2f6; color: #9a9aa8 }
.righe.spente .testo b { color: #7a7a8a; font-weight: 600 }

.altre {
  margin-top: 2px; padding: 9px; border: 0; border-radius: 12px;
  background: #f5f3fc; color: #5b3fa8; font: inherit; font-size: 12px;
  font-weight: 700; cursor: pointer;
}
</style>
