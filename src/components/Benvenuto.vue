<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL PRIMO AVVIO — E, DA ADESSO, OGNI VOLTA CHE SI AGGIUNGE UN BAMBINO

   Quando nell'archivio non c'è nessun giocatore, questa è la prima cosa
   che si vede. Prima non poteva succedere: i giocatori erano scritti nel
   codice, quindi ce n'erano sempre due anche su un telefono appena
   installato. Adesso l'elenco è vuoto finché qualcuno non ci mette il
   suo nome.

   Non chiede il PIN apposta. Il PIN protegge le cose dei genitori, ma
   qui non c'è ancora niente da proteggere: chiederlo vorrebbe dire che
   un'app appena installata non si apre senza sapere un codice che
   nessuno ha ancora scelto. Aggiungere un fratello, invece, ci si
   arriva **da dentro le impostazioni**, che il codice l'hanno già
   chiesto: la schermata è la stessa, il gradino sta prima.

   ── UN MODULO SOLO, E NON DUE ────────────────────────────────────
   Qui e nella schermata dei grandi c'erano due moduli diversi che
   facevano la stessa cosa — nome, faccia, da dove parte — disegnati in
   due modi, con due tasti «Aggiungi» che si comportavano diversamente
   (di là il bambino nuovo non entrava nemmeno in partita). Adesso è
   questo, e basta: `primo` dice solo se c'è già qualcuno che gioca,
   e cambia due parole e la via d'uscita.

   ── DUE PASSI, E IL SECONDO NON È PER IL BAMBINO ──────────────────
   Il nome e la faccia sono la sua domanda; **quanti anni ha** è la
   domanda del grande che gli sta installando il gioco, e le due cose
   non stanno bene sullo stesso schermo — una colonna con dentro il
   nome, sei facce e una manopola con il suo riassunto non è più «tre
   tocchi», è un modulo.

   Perché chiederlo qui e non lasciarlo alla schermata dei genitori:
   perché di lì passa chi aggiunge il *secondo* bambino, e il primo —
   cioè chiunque installi l'app — non ci passava mai. Nasceva con tutto
   acceso: quindici carte in home, con dentro le divisioni in colonna,
   anche a un bambino di cinque anni. Regalando il gioco si è visto due
   volte di fila, e le due volte era una sorella più piccola.

   ── L'ETÀ NON SI PRESELEZIONA ────────────────────────────────────
   La manopola nasce **senza un valore**, e il tasto resta spento finché
   non si muove. È la stessa cautela che avevano le quattro carte, e per
   lo stesso motivo: una risposta già data si preme senza leggerla, con
   l'effetto che un bambino di quattro anni si ritroverebbe la home di
   un quinta elementare perché nessuno ha guardato. Solo che adesso, a
   guardarla, la manopola dice cosa fa — quali giochi entrano in casa e
   come si spostano le domande — invece di dire a chi è rivolta.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import { creaGiocatore } from '../store/profile.js'
import { eccezioniPerEta } from '../data/partenze.js'
import { PERSONE } from '../giochi/fattoria/dati/atlante.js'
import SceltaAspetto from './SceltaAspetto.vue'
import ManopolaEta from './ManopolaEta.vue'
import Prova from '../quiz/Prova.vue'

const props = defineProps({
  /* `false` quando si arriva qui dalle impostazioni per aggiungere un
     fratello: cambia le parole e accende la via d'uscita */
  primo: { type: Boolean, default: true },
})
const emit = defineEmits(['fatto', 'lasciaStare'])

const nome = ref('')
const occupato = ref(false)
/* Preselezionato, non chiesto vuoto come l'età: qui non cambia cosa il
   bambino vede o sa, solo con che faccia si vede in mappa — un tasto
   spento finché non si sceglie sarebbe attrito su una schermata che
   vuole restare corta. */
const aspetto = ref(PERSONE[0])
/* ── SI PARTE DA QUATTRO ANNI ──
   Non da un valore in mezzo e non da vuoto. Chi apre questa schermata
   sta aggiungendo un bambino, e un bambino che si aggiunge è quasi
   sempre il più piccolo di casa: da lì si sale finché l'elenco di
   quello che il gioco dà per scontato non comincia a dire cose che non
   sa, e ci si ferma.

   La cautela che c'era prima — nessun valore, e il tasto spento finché
   non si muove — serviva a impedire che si premesse senza leggere. Con
   quattro anni non serve più, perché **premere senza leggere adesso
   sbaglia dalla parte giusta**: si consegna la casa più piccola e la
   taratura più prudente, e chi ne aveva bisogno se ne accorge subito e
   torna a spostarla. Con un valore in mezzo no: un bambino di quattro
   anni si sarebbe trovato la home di un terza elementare. */
const anni = ref(4)
const passo = ref(1)
const prova = ref(null)   // { sorgente|chiave, nome } | null

const pulito = computed(() => nome.value.trim())
const daQuellEta = computed(() =>
  anni.value == null ? { giochi: {}, sa: {} } : eccezioniPerEta(anni.value))

function avanti() {
  if (!pulito.value) return
  passo.value = 2
}

async function entra() {
  if (!pulito.value || anni.value == null || occupato.value) return
  occupato.value = true
  /* `entra: true` anche quando si aggiunge un fratello, ed è cambiato
     apposta: prima il bambino nuovo nasceva e restava fermo: si tornava
     alle impostazioni di chi stava giocando prima, e chi l'aveva appena
     creato doveva uscire, tornare in home e sceglierlo. Si aggiunge un
     bambino perché vuole giocare adesso. */
  try {
    await creaGiocatore(pulito.value, true, anni.value, aspetto.value)
    emit('fatto')
  } finally { occupato.value = false }
}
</script>

<template>
  <div class="schermo benvenuto">
    <div v-if="passo === 1" class="centro">
      <span class="em">{{ primo ? '👋' : '➕' }}</span>
      <h1 v-if="primo">Ciao!<br><span>Come ti chiami?</span></h1>
      <h1 v-else>Chi si aggiunge?<br><span>Come si chiama?</span></h1>

      <form @submit.prevent="avanti">
        <input v-model="nome" class="nome" type="text" maxlength="20"
               autocomplete="off" autocapitalize="words" spellcheck="false"
               :placeholder="primo ? 'il tuo nome' : 'il nome'"
               :aria-label="primo ? 'il tuo nome' : 'il nome'">
        <SceltaAspetto :scelto="aspetto" data-scelta="aspetto" @scegli="aspetto = $event" />
        <button class="via" type="submit" :disabled="!pulito">Avanti</button>
      </form>

      <p v-if="primo" class="mini">Lo possono cambiare mamma e papà quando vogliono.</p>
      <p v-else class="mini">Parte da zero, coi suoi progressi separati dagli altri.</p>
      <button v-if="!primo" class="indietro" type="button"
              data-azione="lascia-stare" @click="emit('lasciaStare')">← lascia stare</button>
    </div>

    <!-- ── il passo dei grandi ── -->
    <div v-else class="centro fasce">
      <span class="em">🎒</span>
      <h1>{{ pulito }}<br><span>quanti anni ha?</span></h1>
      <p class="mini alto">Non è un'anagrafe: è la taratura. Da qui si decide quali giochi
        mettergli in casa e quanto difficili sono le domande. Si sposta quando si vuole,
        dalle impostazioni.</p>

      <!-- Le impostazioni da mostrare le calcola qui il padre, perché
           qui il bambino non esiste ancora: non ha né giochi spenti né
           saperi tolti, e quello che il riassunto deve far vedere è
           **cosa gli daremmo** a quell'età. Sono le stesse che
           `creaGiocatore` scriverà nel profilo, dalla stessa funzione:
           se le due divergessero il wizard prometterebbe una casa e ne
           consegnerebbe un'altra. -->
      <div class="manopola-posto">
        <ManopolaEta :anni="anni" :giochi="daQuellEta.giochi" :sa="daQuellEta.sa"
                     @scegli="anni = $event" @prova="prova = $event" />
      </div>

      <button class="via" type="button" :disabled="occupato"
              data-azione="si-gioca" @click="entra">Si gioca!</button>
      <button class="indietro" type="button" @click="passo = 1">← cambia il nome</button>
    </div>

    <!-- ── provare una domanda mentre si decide ──
         Lo stesso pannello della schermata dei grandi, e per lo stesso
         motivo: il nome di una classe di domande non dice che aspetto
         abbia. Qui serve anche di più che di là, perché chi è al primo
         avvio non ha ancora visto **nessuna** domanda del gioco, e sta
         decidendo su un elenco di titoli. Provare non scrive niente. -->
    <!-- l'età va passata anche qui: un gruppo di sapere è largo, e senza
         il ▶ su «i numeri e le quantità» pescherebbe fra tutte le sue
         domande — a quattro anni si finiva su una dichiarata otto e
         mezzo (`quiz/nucleo/esempi.js`) -->
    <!-- `giro` va inoltrato come gli altri tre, e la sua assenza non
         dava nessun errore: il ▶ di un pezzo di scuola manda la lista
         delle sue domande, qui andava persa, e `Prova` ripiegava sul
         modo «pesca come in partita» — si partiva da «i numeri e le
         quantità» e la domanda dopo era di logica. Un ripiego che
         funziona è il modo più caro di rompersi. -->
    <Prova v-if="prova" :chiave="prova.chiave || ''" :nome="prova.nome"
           :sorgente="prova.sorgente || null" :giro="prova.giro || null"
           :eta="prova.eta ?? null"
           @chiudi="prova = null" />
  </div>
</template>

<style scoped>
.benvenuto .centro { display:flex; flex-direction:column; align-items:center; gap:18px; padding:24px }
/* Il passo dell'età è **una colonna che scorre**, non una schermata
   centrata: il riassunto della manopola cresce quanto ha da dire, e
   centrarlo verticalmente gli farebbe sbattere il tasto «Si gioca!»
   fuori dallo schermo su un telefono corto. */
.benvenuto .centro.fasce { gap:12px; padding:18px 14px 28px; justify-content:flex-start;
                           min-height:100%; overflow-y:auto }
.em { font-size:64px; line-height:1 }
.fasce .em { font-size:40px }
h1 { text-align:center; margin:0 }
.fasce h1 { font-size:25px }
form { display:flex; flex-direction:column; align-items:center; gap:14px; width:min(320px, 82vw) }
.nome {
  width:100%; padding:15px 18px; border:none; border-radius:16px;
  font-size:22px; text-align:center; font-family:inherit;
  background:#ffffffee; color:var(--viola-scuro); box-shadow:0 3px 0 #0002;
}
.nome:focus { outline:3px solid var(--viola); outline-offset:2px }
.via {
  padding:14px 34px; border:none; border-radius:999px; font-size:20px; font-weight:800;
  font-family:inherit; color:#fff; cursor:pointer;
  background:linear-gradient(180deg, var(--viola), var(--viola-scuro)); box-shadow:0 4px 0 #0003;
}
.via:disabled { opacity:.45; box-shadow:none }
.mini { opacity:.75; font-size:14px; text-align:center; margin:0 }
.mini.alto { max-width:36ch; font-size:12.5px; margin:-4px 0 0 }
.indietro { background:none; border:none; font-family:inherit; font-size:14px;
            color:#fff; opacity:.75; padding:4px 10px; cursor:pointer }

.manopola-posto { width:min(360px, 92vw) }
</style>
