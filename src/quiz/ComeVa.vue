<script setup>
// «Come va»: tutte le tipologie ordinate dalla peggiore alla migliore, con la misura per capirle (vedi docs/genitori/come-va.md). Non ritoccca niente da sé: mostra il conto, il tasto lo preme un umano.
import { ref, computed } from 'vue'
import { fasceDelBambino } from './catalogo.js'
import { andamentoDi, riassuntoDi, CUORI } from './andamento.js'
import SchedaDomanda from './SchedaDomanda.vue'
import { state, ritocca, azzeraConto, etaDelBambino } from '../store/profile.js'

const emit = defineEmits(['prova'])

// dipendenza per rifare i conti dopo un ritocco/azzera: il catalogo si ricalcola a mano, costa
const giro = ref(0)
const aperta = ref(null)          // la riga di cui è aperta la scheda
const mostraMai = ref(false)

const eta = computed(() => etaDelBambino())

const elenco = computed(() => {
  giro.value
  const righe = fasceDelBambino().flatMap(f => f.righe)
  return andamentoDi(righe, state.profile.items || {})
})
const conti = computed(() => riassuntoDi(elenco.value))

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
</script>

<template>
  <div class="come-va" data-come-va>
    <!-- tre numeri in cima: «7 su 10» vuol dire una cosa diversa dopo 12 risposte o dopo 2000 -->
    <div class="sommario" data-sommario>
      <div><b>{{ conti.risposte }}</b><span>risposte in tutto</span></div>
      <div><b>{{ conti.incontrate }}</b><span>domande incontrate</span></div>
      <div :class="{ male: conti.male > 0 }"><b>{{ conti.male }}</b><span>vanno male</span></div>
    </div>

    <p v-if="!conti.risposte" class="vuoto">
      Non ha ancora risposto a niente. Questa pagina si riempie da sola giocando:
      ogni domanda si porta dietro quante volte gli è capitata e come è andata.
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
        <li v-for="r in elenco.viste" :key="r.tipo" :data-riga="r.tipo">
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

      <!-- non ancora capitate: ripiegate in fondo, servono a spegnere in anticipo -->
      <button v-if="elenco.mai.length" type="button" class="altre"
              data-altre @click="mostraMai = !mostraMai">
        {{ mostraMai ? '▴' : '▾' }} altre {{ elenco.mai.length }} non gli sono ancora capitate
      </button>
      <ul v-if="mostraMai" class="righe spente">
        <li v-for="r in elenco.mai" :key="r.tipo" :data-riga="r.tipo">
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
    </template>

    <SchedaDomanda v-if="aperta" :riga="aperta" :eta="eta"
                   @chiudi="chiudi" @prova="provaRiga"
                   @ritocca="ritoccaRiga" @azzera="azzeraRiga" />
  </div>
</template>

<style scoped>
.come-va { display: grid; gap: 10px }

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
