<script setup>
import { computed, onMounted, watch } from 'vue'
import { state, level, countMastered, nomeCorrente, livelloOra,
         mateProgresso, mercatoProgresso,
         tabellineIntere, genProgresso,
         quantiGiochiAccesi } from '../store/profile.js'
import { daLeggere } from '../store/posta.js'
import { SCALETTA, posizioneOra, filaDi } from '../data/asteroidi.js'
import { CAMPAGNE as GIORNATE } from '../data/bancarella.js'
// conta le prove CHE SI VEDONO, non tutte: le non approvate sono dietro il cancello dei giochi in prova
import { fatte as proveFatte, quante as proveQuante } from './generale/fila.js'
import { gioco as giocoNuovo } from '../giochi/indice.js'
import { progresso as progressoDi, primatoDi } from '../giochi/campagne.js'
import { recordPiuRecente, recordInParole, sfidaDi } from '../giochi/primati.js'
import { GIOCHI } from '../data/giochi.js'
import { inCasa } from '../data/portata-giochi.js'
import { AREE } from '../data/aree.js'
import Nastri from '../guide/Nastri.vue'
import Carosello from '../components/home/Carosello.vue'
import Riprendi from '../components/home/Riprendi.vue'
import Iniziale from '../components/home/Iniziale.vue'
import { chiediRipresa } from '../giochi/ripresa.js'
import { vociInMemoria, versione } from '../store/sessioni.js'
import { giro, ricarica } from '../store/varieta.js'
import { chiaveDelGioco } from '../data/varieta.js'
import Aggiorna from '../guide/Aggiorna.vue'
import { aggiornando, aggiornaOra, daUnSito } from '../aggiornamento.js'

const emit = defineEmits(['vai'])

const versione = __VERSIONE__   // la stringa la mette il build (vite.config.js)
const siCerca = daUnSito()      // il tasto "cerca aggiornamenti": solo se c'è un sito a cui chiedere

const imparateEn = computed(() =>
  countMastered('en:') + countMastered('verbo:') + countMastered('frase:'))
const imparateEs = computed(() =>
  countMastered('es:') + countMastered('verbo-es:') + countMastered('frase-es:'))
const pianeta = computed(() => mateProgresso())
const stelleMate = computed(() => tabellineIntere().length)
// tabelline e conti a mente sono una scaletta sola (data/asteroidi.js): un contatore, non due
const filaMate = SCALETTA
const doveMate = computed(() => posizioneOra(filaDi(pianeta.value)))
const fatteMate = doveMate

const clienti = computed(() => state.profile.totals.clienti || 0)
const restiPerfetti = computed(() => state.profile.totals.restiPerfetti || 0)
const mercato = computed(() => mercatoProgresso())
const QUANTE_GIORNATE = GIORNATE.length

const generale = computed(() => genProgresso())
const stelleGen = computed(() =>
  Object.values(generale.value.stelle || {}).reduce((n, s) => n + s, 0))

const salita = computed(() => livelloOra())

// azzerare i progressi vive dietro il PIN in GenitoriView, non qui

// quali carte si vedono: vedi docs/genitori/interruttori.md e docs/apprendimento/eta-e-portata.md
const acceso = inCasa
const nessunGioco = computed(() => quantiGiochiAccesi() === 0)

// le classi dei giochi vecchi restano: le usano i test (`.carta.mate`)
const CLASSE = {
  mate: 'mate', inglese: 'eng', spagnolo: 'esp', torri: 'td',
  bancarella: 'banco', generale: 'gen',
}

// un gruppo senza nemmeno un gioco acceso non si disegna
const gruppi = computed(() => AREE
  .map(a => ({ ...a, giochi: GIOCHI.filter(g => g.area === a.chiave && acceso(g.chiave)) }))
  .filter(a => a.giochi.length))

// i giochi nuovi sanno dire da soli a che punto sono; per i vecchi il testo è qui sotto
// il castello: si racconta il record più recente, non il più alto (docs/core/primati.md)
const recordTorri = computed(() => {
  const r = recordPiuRecente((state.profile.campagne || {}).torri || {},
                             GIOCHI.find(g => g.chiave === 'torri').senzaFine)
  return r ? `${r.sfida.icona} ${r.sfida.nome} · record ${recordInParole(r.quaderno, r.sfida)}` : ''
})

const recordMate = computed(() => {
  const s = sfidaDi(GIOCHI.find(g => g.chiave === 'mate').senzaFine)
  const r = recordInParole(primatoDi('mate'), s)
  return r ? ` · record ${r}` : ''
})

const dove = computed(() => {
  const q = (n, tot) => `${Math.min(n + 1, tot)} di ${tot}`
  return {
    mate: doveMate.value >= filaMate.length
      ? `volo infinito ♾️ · ✖️ ${stelleMate.value}/10 tabelline${recordMate.value}`
      : `${fatteMate.value} tapp${fatteMate.value === 1 ? 'a' : 'e'} ` +
        `su ${filaMate.length} · ora ${filaMate[doveMate.value].T.nome}`,
    // l'inglese a mondi (src/giochi/inglese) si racconta dal suo manifesto; le sicure restano quelle di sempre
    inglese: `${giocoNuovo('inglese').riassunto(progressoDi('inglese'))} · 🎯 ${imparateEn.value} sicure`,
    spagnolo: `${giocoNuovo('spagnolo').riassunto(progressoDi('spagnolo'))} · 🎯 ${imparateEs.value} sicure`,
    torri: recordTorri.value ? `♾️ ${recordTorri.value}` : '',
    bancarella: mercato.value.libera
      ? `♾️ mercato libero · ✨ ${restiPerfetti.value} resti precisi`
      : clienti.value
        ? `🧺 giornata ${mercato.value.tappa + 1} di ${QUANTE_GIORNATE} · ✨ ${restiPerfetti.value} resti precisi`
        : '',
    generale: generale.value.tappa
      ? `🎖️ livello ${Math.min(proveFatte + 1, proveQuante)} · ⭐ ${stelleGen.value} stelle`
      : '',
  }
})

/* i nuovi passano dal manifesto, i vecchi dalla tabella qui sopra */
function aChePunto (chiave) {
  if (chiave in dove.value) return dove.value[chiave]
  const m = giocoNuovo(chiave)
  return m ? m.riassunto(progressoDi(chiave)) : ''
}

// il carosello: tutti i giochi accesi, nell'ordine delle aree (docs/core/home.md)
const elenco = computed(() => gruppi.value.flatMap(a => a.giochi)
  .map(g => ({ ...g, classe: CLASSE[g.chiave], punto: aChePunto(g.chiave) })))

// l'ultimo gioco giocato, dal registro delle sessioni; uno spento non si ripropone
onMounted(ricarica)
watch(() => state.player, ricarica)
const ultimo = computed(() => {
  void giro.value, versione.value
  const voci = vociInMemoria(state.player) || []
  const v = voci.reduce((a, b) => (!a || b.t > a.t ? b : a), null)
  const k = v && chiaveDelGioco(v.g)
  return k && elenco.value.some(g => g.chiave === k) ? k : null
})
// un gioco nuovo può dire da sé cosa riprendere e con che immagine (il sotterraneo: la discesa a metà)
const ripresa = computed(() => {
  const g = elenco.value.find(g => g.chiave === ultimo.value)
  if (!g) return null
  const m = giocoNuovo(g.chiave)
  const r = m && m.ripresa ? m.ripresa(progressoDi(g.chiave)) : null
  return r ? { ...g, punto: r.dove, immagine: r.immagine } : g
})
// la partita a metà riparte da sola, senza «torno da dove ero» (docs/core/ripresa.md)
function riprendi (k) { chiediRipresa(k); emit('vai', k) }
</script>

<template>
  <!-- data-archivio: usato dai test di avvio per verificare IndexedDB vs memoria -->
  <div class="schermo home" :data-archivio="state.storage">
    <div class="centro">
      <!-- i nastri (installazione, versione nuova...) stanno solo qui: vedi docs/genitori/guide.md -->
      <Nastri @vai="v => $emit('vai', v)" />

      <!-- chi gioca, a che punto è, le monete: tocca e si apre il profilo (docs/core/home.md) -->
      <button class="fascia" data-azione="profilo" @click="$emit('vai','profilo')">
        <Iniziale :id="state.player" :nome="nomeCorrente()" :misura="34" />
        <span class="dove">
          <b data-nome>{{ nomeCorrente() }}</b>
          <i>{{ salita.titolo }} · livello {{ level }}</i>
        </span>
        <span class="numeri">🪙 {{ state.profile.coins }}</span>
        <span class="freccia" aria-hidden="true">›</span>
      </button>

      <Riprendi v-if="ripresa" :gioco="ripresa" :dove="ripresa.punto" :immagine="ripresa.immagine"
                @apri="riprendi" />

      <div class="carte">
        <Carosello v-if="elenco.length" :giochi="elenco" :ultimo="ultimo" @apri="k => $emit('vai', k)" />

        <!-- se i genitori li hanno spenti tutti, la home lo dice: senza,
             sarebbe una schermata rotta invece di una scelta -->
        <p v-if="nessunGioco" class="mini vuoto">I giochi sono spenti.
          Si riaccendono da <b>Impostazioni</b>, qui sotto.</p>
      </div>

      <div v-if="state.regalo.n" :key="state.regalo.k" class="regalo">
        {{ state.regalo.n > 0 ? '+' : '' }}{{ state.regalo.n }} 🪙
      </div>

      <p v-if="state.storage === 'memoria'" class="avviso">
        Questa anteprima non può salvare nulla. Scarica il file e aprilo dal telefono
        o dal computer perché monete e progressi restino.
      </p>
      <!-- ══ la porta dei grandi ══
           Ha già cambiato posto due volte, e tutte e due per lo stesso
           motivo letto al contrario. Prima era una scritta grigia in
           minuscolo, e non la trovava chi non sapeva già che c'era;
           allora è diventata una carta come i giochi, col lucchetto —
           e i bambini hanno cominciato a provarci, perché un lucchetto
           in mezzo a undici giochi non dice «chiuso», dice «qui c'è un
           tesoro». Il divieto («per i grandi») è pubblicità, e la
           griglia dei giochi la faceva leggere come il dodicesimo.

           Adesso è un tasto vero, largo quanto le carte e leggibile —
           chi la cerca la trova al primo colpo — ma piatto, grigio, nel
           piede insieme alla versione, con un nome da modulo da
           compilare: quello che promette è di poter cambiare le
           impostazioni, che è precisamente la cosa che c'è dentro e non
           interessa a nessun bambino. Chi ci prova lo stesso trova
           l'attesa del gradino (`store/pin.js`).

           `data-azione="grandi"` resta com'era: è il bersaglio di tre
           test di integrazione, e non è cambiato dove porta. -->
      <button class="impostazioni" data-azione="grandi" @click="$emit('vai','genitori')">
        <!-- ══ il pallino della posta ══
             Fuori dal codice non si può distinguere un grande da un
             bambino, quindi qui fuori sta **solo il segnale che esiste
             qualcosa**, mai il contenuto: un pallino non si chiude, non
             dice niente, e sopravvive al bambino che ci sbatte sopra —
             preme, trova il tastierino, non entra, e il pallino è ancora
             lì. Si spegne solo con «Ho letto», dentro
             (`store/posta.js`). -->
        <span v-if="daLeggere" class="pallino-posta" data-posta-pallino></span>
        <b>⚙︎ Impostazioni</b>
        <i v-if="daLeggere">c'è un messaggio per te, e le solite cose da grandi</i>
        <i v-else>giochi visibili, difficoltà delle domande, chi gioca, salvataggio</i>
      </button>
      <!-- ══ le guide ══
           Accanto alle impostazioni ma **fuori dal codice**, e la
           differenza è tutta nel primo genitore che apre il link
           ricevuto da un altro: deve poter leggere come si installa
           senza sapere che il codice di partenza è 0000. Qui dentro si
           legge soltanto, non c'è niente da chiudere a chiave.
           Piatto e grigio come l'altro: non è un gioco, e in mezzo alle
           carte a colori nessun bambino lo tocca due volte. -->
      <button class="impostazioni guide" data-azione="guide" @click="$emit('vai','guide')">
        <b>? Come funziona</b>
        <i>cos'è, chi l'ha fatto, installarlo sul telefono, l'età, le domande</i>
      </button>
      <!-- la versione serve a rispondere «il telefono ha preso
           l'aggiornamento?» guardando lo schermo. E accanto c'è la
           risposta quando è no: la domanda e il tasto nello stesso
           posto, perché è qui che ci si accorge di essere indietro.
           Grigio e piccolo come la versione — è roba da grandi — ma non
           chiuso col codice: il nastro «c'è una versione nuova» fa la
           stessa cosa e sta già fuori, e premerlo per sbaglio al più
           dice «hai già l'ultima». -->
      <p class="piede">
        <span class="versione">aggiornato il {{ versione.etichetta
          }}<span v-if="versione.commit"> · {{ versione.commit }}</span></span>
        <button v-if="siCerca" type="button" class="cerca" data-azione="cerca-versione"
                @click="aggiornaOra()">↻ cerca aggiornamenti</button>
      </p>
    </div>

    <Aggiorna v-if="aggiornando" />
  </div>
</template>

<style scoped>
.home { background:#f6f7f9 }
/* in cima, non in mezzo: su un telefono alto il centrato lasciava un vuoto sopra il profilo */
.home .centro { justify-content:flex-start }
.carte { width:100%; max-width:400px }
/* la riga del profilo */
.fascia { display:flex; align-items:center; gap:11px; width:100%; max-width:400px; padding:9px 12px;
          border-radius:16px; text-align:left; background:#fff; box-shadow:0 1px 2px #1f243312 }
.fascia:active { transform:scale(.99) }
.dove { flex:1; min-width:0; display:flex; flex-direction:column }
.dove b { font-size:14px; font-weight:600; color:#1f2433; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.dove i { font-style:normal; font-size:11.5px; color:#7a8193 }
.numeri { flex:none; font-size:13px; font-weight:600; color:#1f2433 }
.freccia { flex:none; font-size:20px; color:#a3a9b8 }
.vuoto { text-align:center; padding:6px 0 2px }
/* le monete regalate dall'indirizzo: si vedono e poi se ne vanno */
.regalo { position:fixed; left:50%; top:21%; z-index:60; pointer-events:none;
          font-size:44px; font-weight:900; color:#c98a00;
          text-shadow:0 2px 0 #fff, 0 0 20px #ffd94a;
          animation:regalo 1.8s ease-out forwards }
@keyframes regalo { 0%{opacity:0;transform:translateX(-50%) scale(.4)}
                    25%{opacity:1;transform:translateX(-50%) scale(1.2)}
                    40%{transform:translateX(-50%) scale(1)}
                    100%{opacity:0;transform:translate(-50%,-120px) scale(.85)} }
/* Deve potersi leggere se la si cerca, e sparire se non la si cerca:
   e' roba da grandi, i bambini non ci devono nemmeno inciampare. */
/* Un tasto pieno — si tocca col dito e si legge senza occhiali — ma
   senza niente di quello che rende invitanti le carte: nessuna ombra
   che sporge, nessuna tinta, nessuna emoji grande. È scritto, non
   illustrato: sotto le carte a pastello si legge come il piede della
   pagina, e questo è il punto. */
/* il pallino: piccolo, in alto a destra del tasto, colorato quanto basta
   a farsi notare da un occhio adulto che passa. Non lampeggia — non è
   mai urgente. */
.impostazioni { position:relative }
.pallino-posta { position:absolute; top:9px; right:10px; width:9px; height:9px;
                 border-radius:50%; background:#e2564a }

.impostazioni { display:block; width:100%; max-width:400px; margin-top:18px;
                padding:11px 16px; border-radius:14px; text-align:left;
                background:#fff; box-shadow:0 1px 2px #1f243312 }
.impostazioni:active { background:#ffffffaa }
.impostazioni.guide { margin-top:8px }
.impostazioni b { display:block; font-size:13px; font-weight:600; color:#1f2433 }
.impostazioni i { font-style:normal; font-size:11.5px; color:var(--tenue); opacity:.75 }

.piede { display:flex; align-items:baseline; justify-content:center; gap:9px;
         flex-wrap:wrap; margin-top:10px }
.versione { font-size:11px; opacity:.42; letter-spacing:.3px }
/* la stessa pelle piatta di «Impostazioni», in piccolo: si legge senza
   occhiali e si prende col pollice, ma non chiama nessuno */
.cerca { padding:7px 12px; border-radius:999px; font-size:11.5px; font-weight:800;
         color:var(--tenue); background:#ffffff66; box-shadow:inset 0 0 0 1px #d7dfea }
.cerca:active { background:#ffffffaa }
</style>
