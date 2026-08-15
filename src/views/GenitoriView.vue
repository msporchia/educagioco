<script setup>
/* ═══════════════════════════════════════════════════════════════════
   SCHERMATA DEI GENITORI
   Le cose che un bambino non deve poter fare per sbaglio: portarsi via i
   progressi, rimetterli, cancellarli. Prima stavano sulla home, e
   "azzera i dati" a portata di dito era solo questione di tempo.

   Il PIN non è sicurezza: è un gradino contro il tocco distratto. Chi
   vuole entrare davvero apre gli strumenti del browser. Si cambia da qui
   dentro — quando i bambini imparano a leggerlo da sopra la spalla — e
   vive in `store/pin.js`, fuori dai profili.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onMounted } from 'vue'
import { state, esportaTutto, importaTutto, resetPlayer, nomeCorrente,
         creaGiocatore, rinominaGiocatore, eliminaGiocatore, selectPlayer,
         sapereAcceso, accendiSapere, saperiSpenti, saperiCheMancano,
         giocoAcceso, accendiGioco, quantiGiochiAccesi,
         tuttoAperto, accendiTuttoAperto,
         sperimentaliAccesi, accendiSperimentali,
         aspettoDi, scegliAspetto } from '../store/profile.js'
import { PERSONE } from '../giochi/fattoria/dati/atlante.js'
import { azzeraCampagna, haGiocato } from '../giochi/campagne.js'
import SceltaAspetto from '../components/SceltaAspetto.vue'
import { leggiPin, scriviPin, PIN_INIZIALE } from '../store/pin.js'
import { leggi as leggiIncidenti, dimentica as scordaIncidenti, ripara } from '../incidenti.js'
import { giudiziAccesi, accendiGiudizi, leggi as leggiGiudizi,
         dimentica as svuotaGiudizi, riga as rigaGiudizio,
         pacco as paccoGiudizi, verdettoDi } from '../store/giudizi.js'
import { GIOCHI } from '../data/giochi.js'
import { PARTENZE } from '../data/partenze.js'
import { MATERIE_SAPERI, saperiDiMateria, sapereDi } from '../data/saperi.js'
import { sottoDi, siPuoProvare } from '../quiz/saperi.js'
import Barra from '../components/Barra.vue'
import Prova from '../quiz/Prova.vue'

defineEmits(['vai'])

/* Il nome di chi sta giocando. Da quando esiste il roster `state.player`
   è un id e non un nome: scritto a schermo direbbe «Impostazioni di g2»
   a chi si è appena iscritto. Il nome sta nel roster, e si chiede lì. */
const chi = computed(() => nomeCorrente() || 'questo giocatore')

/* chi finisce dentro il salvataggio: si legge dal roster, così la carta
   dice la verità anche dopo che i genitori hanno aggiunto qualcuno */
const chiGioca = computed(() => {
  const nomi = state.giocatori.map(g => g.nome).filter(Boolean)
  if (nomi.length <= 1) return nomi[0] || 'tutti i progressi'
  return nomi.slice(0, -1).join(', ') + ' e ' + nomi[nomi.length - 1]
})

const pin = ref(PIN_INIZIALE)    // quello vero arriva dall'archivio, sotto
const cifre = ref('')
const dentro = ref(false)
const sbagliato = ref(false)
const esito = ref(null)          // { ok: bool, testo: string }
const confermaAzzera = ref(false)
const confermaFattoria = ref(false)

/* Ricomincia la fattoria e basta. Passa da `campagne.js` come tutti i
   giochi nuovi: qui non si sa nemmeno com'è fatta dentro. */
function azzeraFattoria() {
  azzeraCampagna('fattoria')
  confermaFattoria.value = false
  esito.value = { ok: true, testo: 'La fattoria di ' + chi.value + ' riparte da zero.' }
}
const file = ref(null)
/* il cambio del codice: 'nuovo' mentre lo si sceglie, 'ripeti' mentre lo
   si conferma. Chiedere due volte non è una formalità — un codice
   sbagliato di un dito chiude fuori i grandi e basta. */
const modo = ref('')
const nuovo = ref('')
/* le due schede: quello che si vede ('giochi') e quello che si sa
   ('sa'). Erano una colonna sola e i macrogruppi l'avrebbero fatta
   lunga il doppio, con due cose diverse mescolate: quali giochi
   compaiono, e quali domande hanno senso per questo bambino. */
const scheda = ref('giochi')

/* i guasti registrati da `incidenti.js`: si leggono una volta all'entrata
   e non si stanno a guardare in diretta — chi apre questa pagina lo fa
   dopo, per capire cos'è successo prima */
const incidenti = ref([])

/* i giudizi sulle domande, dallo stesso posto e per lo stesso motivo:
   si sono accumulati mentre si giocava, e si guardano dopo */
const giudizi = ref([])

onMounted(async () => {
  pin.value = await leggiPin()
  incidenti.value = await leggiIncidenti()
  giudizi.value = await leggiGiudizi()
})

/* l'ora e basta se è di oggi, altrimenti anche il giorno: «alle 17:42»
   è quello che un genitore confronta col «si è rotto prima di cena» */
function quando (iso) {
  const d = new Date(iso)
  if (isNaN(d)) return '?'
  const ore = d.toLocaleTimeString('it', { hour: '2-digit', minute: '2-digit' })
  const oggi = new Date().toDateString() === d.toDateString()
  return oggi ? ore : d.toLocaleDateString('it', { day: 'numeric', month: 'short' }) + ' ' + ore
}

/* copiare serve a mandarlo a chi ci mette le mani: negli appunti finisce
   tutto quello che c'è, pila compresa, che a schermo sarebbe illeggibile */
async function copiaGuasti () {
  const testo = incidenti.value.map(g =>
    `${g.quando} · ${g.dove} · ${g.versione}\n${g.testo}\n${g.pila || ''}`).join('\n\n')
  try {
    await navigator.clipboard.writeText(testo)
    esito.value = { ok: true, testo: 'Copiato negli appunti.' }
  } catch (e) {
    esito.value = { ok: false, testo: 'Non si riesce a copiare: si legge da qui.' }
  }
}

async function scordaGuasti () {
  await scordaIncidenti()
  incidenti.value = []
  esito.value = { ok: true, testo: 'Cancellati.' }
}

/* la riparazione ricarica la pagina da sé: non c'è niente da dire dopo */
const riparaApp = () => ripara()

/* ── segnalare ──
   Un modulo fuori dal gioco, e non un indirizzo di posta: su un telefono
   senza client configurato un `mailto:` è l'ennesimo tasto che non fa
   niente, ed è precisamente il guasto che questa pagina esiste per non
   avere. Ci va dentro quello che chi scrive non saprebbe dire — la
   versione, e l'ultimo inciampo se ce n'è uno — così che una segnalazione
   utile costi una frase invece di una traduzione.

   La pila non entra nell'indirizzo: sarebbe lunga il triplo del limite
   che i browser reggono in fila. Per quella c'è «Copia» qui sopra.

   ── COME ARRIVANO DALL'ALTRA PARTE ──
   In Tally i parametri dell'indirizzo riempiono **solo i campi
   nascosti**, che nell'editor si aggiungono scrivendo `/hidden`, e sono
   **sensibili alle maiuscole**: il nome del campo dev'essere identico
   al parametro, lettera per lettera. Un campo normale — una casella di
   testo, un indirizzo di posta — dall'indirizzo non si tocca affatto.
   Quindi un parametro che nel form non ha il suo campo nascosto non dà
   nessun errore: il modulo si apre come sempre e il dato sparisce.

   Questo qui vuole `versione` e `guasto`. */
const SEGNALA = 'https://tally.so/r/D4OO1q'

const linkSegnala = computed(() => {
  const q = new URLSearchParams({ versione: __VERSIONE__.id })
  const ultimo = incidenti.value[incidenti.value.length - 1]
  if (ultimo) q.set('guasto', `${ultimo.dove} · ${ultimo.testo}`.slice(0, 300))
  return `${SEGNALA}?${q}`
})

/* ── i giudizi sulle domande ──
   L'interruttore mette tre tastini sopra ogni domanda dei quiz. Sta qui
   dentro e non in `settings` perché è del telefono e non di un bambino:
   chi giudica è il grande seduto di fianco, e cambiando giocatore non
   deve riaccenderlo. */
function cambiaGiudizi() {
  accendiGiudizi(!giudiziAccesi.value)
  esito.value = { ok: true, testo: giudiziAccesi.value
    ? 'Acceso: sopra ogni domanda compaiono 😴 😰 🐛.'
    : 'Spento: le domande tornano come prima.' }
}

/* la riga da leggere a schermo: la stessa che partirebbe nel modulo,
   che è il punto — quello che si manda si vede prima */
const righeGiudizi = computed(() =>
  giudizi.value.slice().reverse().map(g => ({
    ico: verdettoDi(g.verdetto)?.ico || '·',
    testo: rigaGiudizio(g),
  })))

/* ── dove vanno ──
   Non c'è un server a cui mandarli e non ci sarà: un modulo è l'unico
   canale che da un telefono senza posta configurata non chiede niente a
   nessuno.

   Ma è un modulo **suo**, non quello dei guasti, e i due non vanno
   mescolati: il primo lo compila chiunque inciampi nel gioco e chiede
   di raccontare cosa è successo, questo lo apre chi ha in mano il
   telefono di casa e non ha niente da scrivere — si apre e si tocca
   invia. Un campo obbligatorio, qui, sarebbe un pedaggio su un gesto
   che deve costare un tocco.

   Vuole un campo nascosto `giudizi` e uno `versione` (vedi sopra come
   si aggiungono). */
const SEGNALA_GIUDIZI = 'https://tally.so/r/lb28zp'

const paccoDaMandare = computed(() => paccoGiudizi(giudizi.value))
const linkGiudizi = computed(() => {
  const q = new URLSearchParams({
    versione: __VERSIONE__.id,
    giudizi: paccoDaMandare.value.testo,
  })
  return `${SEGNALA_GIUDIZI}?${q}`
})

async function copiaGiudizi() {
  try {
    await navigator.clipboard.writeText(paccoDaMandare.value.testo)
    esito.value = { ok: true, testo: 'Copiati negli appunti.' }
  } catch (e) {
    esito.value = { ok: false, testo: 'Non si riesce a copiare: si legge da qui.' }
  }
}

/* Cancellare è a mano, e apposta: il modulo si apre in un'altra scheda
   e da qui non si sa se è stato davvero inviato. Svuotare da soli dopo
   aver aperto il link vorrebbe dire buttare via i giudizi di chi ci ha
   ripensato a metà. */
async function scordaGiudizi () {
  await svuotaGiudizi()
  giudizi.value = []
  esito.value = { ok: true, testo: 'Cancellati.' }
}

const pallini = computed(() => [0, 1, 2, 3].map(i => i < cifre.value.length))
const titoloCambio = computed(() => modo.value === 'ripeti' ? 'Ripeti il codice nuovo' : 'Il codice nuovo')

function premi(n) {
  if (cifre.value.length >= 4) return
  sbagliato.value = false
  cifre.value += n
  if (cifre.value.length < 4) return
  if (modo.value) return quattroDelCambio()
  if (cifre.value === pin.value) { dentro.value = true; cifre.value = '' }
  else { sbagliato.value = true; cifre.value = '' }
}

function cancella() { cifre.value = cifre.value.slice(0, -1); sbagliato.value = false }

/* ---------- cambiare il codice ---------- */
function cambiaCodice() { modo.value = 'nuovo'; nuovo.value = ''; cifre.value = ''; esito.value = null }
function lasciaStare() { modo.value = ''; nuovo.value = ''; cifre.value = ''; sbagliato.value = false }

async function quattroDelCambio() {
  if (modo.value === 'nuovo') { nuovo.value = cifre.value; cifre.value = ''; modo.value = 'ripeti'; return }
  // 'ripeti': due volte uguali o si ricomincia, senza dire quale delle due era
  if (cifre.value !== nuovo.value) {
    cifre.value = ''; nuovo.value = ''; modo.value = 'nuovo'; sbagliato.value = true
    esito.value = { ok: false, testo: 'Le due volte non erano uguali. Riprova.' }
    return
  }
  try {
    pin.value = await scriviPin(nuovo.value)
    esito.value = { ok: true, testo: 'Codice cambiato. Da adesso si entra con quello nuovo.' }
  } catch (e) {
    esito.value = { ok: false, testo: e.message }
  }
  lasciaStare()
}

/* ---------- salvataggio ---------- */
async function esporta() {
  esito.value = null
  try {
    const dati = await esportaTutto()
    const oggi = new Date().toISOString().slice(0, 10)
    scarica(`giochi-progressi-${oggi}.json`, JSON.stringify(dati, null, 2))
    esito.value = { ok: true, testo: 'Salvataggio scaricato. Tienilo da parte: se il telefono si rompe, è tutto lì dentro.' }
  } catch (e) {
    esito.value = { ok: false, testo: 'Non sono riuscito a salvare: ' + e.message }
  }
}

function scarica(nome, testo) {
  const url = URL.createObjectURL(new Blob([testo], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  // il browser deve fare in tempo a leggere il blob prima che sparisca
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

async function importa(ev) {
  esito.value = null
  const f = ev.target.files?.[0]
  if (!f) return
  try {
    const nomi = await importaTutto(JSON.parse(await f.text()))
    esito.value = { ok: true, testo: 'Rimessi i progressi di ' + nomi.join(' e ') + '.' }
  } catch (e) {
    esito.value = { ok: false, testo: e.message }
  }
  ev.target.value = ''   // stesso file due volte di fila deve poter funzionare
}

/* ── chi gioca ──
   Aggiungere, rinominare, eliminare. Sta dietro il PIN e non in home
   perché sono i tre gesti che possono far sparire mesi di partite col
   dito sbagliato — eliminare cancella davvero, e non c'è un cestino.

   L'unica porta che non passa di qui è la prima: a roster vuoto il nome
   si chiede subito, senza codice (`components/Benvenuto.vue`). Un'app
   appena installata che chiede un PIN che nessuno ha ancora scelto non
   si apre più.

   Una schermata sola con tre stati, come il resto di questo file:
   `rinominando` tiene l'id di chi si sta ribattezzando, `eliminando`
   quello di chi sta per sparire, `aggiungendo` dice che si sta scrivendo
   un nome nuovo. Mai due aperti insieme. */
const rinominando = ref('')
const eliminando = ref('')
const aggiungendo = ref(false)
const nomeInCorso = ref('')

function chiudiTutto() {
  rinominando.value = ''; eliminando.value = ''; aggiungendo.value = false; nomeInCorso.value = ''
}
function apriRinomina(g) { chiudiTutto(); rinominando.value = g.id; nomeInCorso.value = g.nome }
/* nessuna preselezionata: la partenza è una domanda vera, e una risposta
   già data si preme senza leggerla — con l'effetto che un bambino di
   quattro anni si ritroverebbe la home di un quinta elementare perché
   nessuno ha guardato. Il tasto «Aggiungi» resta spento finché non si
   sceglie, che è il modo di chiederlo senza scriverlo. */
const partenzaScelta = ref('')
/* Un valore c'è sempre — a differenza della partenza, che si chiede
   apposta vuota: qui non è una domanda che cambia cosa il bambino vede,
   e un tasto spento finché non si sceglie sarebbe attrito senza motivo.
   Il primo di `PERSONE` è la stessa ricaduta di `aspettoDi()`. */
const aspettoScelto = ref(PERSONE[0])
function apriAggiungi() {
  chiudiTutto(); partenzaScelta.value = ''; aspettoScelto.value = PERSONE[0]; aggiungendo.value = true
}
function apriElimina(g) { chiudiTutto(); eliminando.value = g.id }

async function salvaNome() {
  const nome = nomeInCorso.value.trim()
  if (!nome) return
  try {
    if (aggiungendo.value) {
      /* senza entrarci: cambiare giocatore da qui ricarica la schermata
         e rimanderebbe al codice chi sta ancora sistemando le cose */
      await creaGiocatore(nome, false, partenzaScelta.value, aspettoScelto.value)
      const p = PARTENZE.find(p => p.chiave === partenzaScelta.value)
      esito.value = { ok: true, testo: `${nome} adesso può giocare: lo trova in home, dove si sceglie chi gioca.`
        + (p ? ` È partito da «${p.nome}» — quello che vede si cambia qui sotto.` : '') }
    } else {
      const prima = nomeCorrente()
      await rinominaGiocatore(rinominando.value, nome)
      esito.value = { ok: true, testo: `Adesso si chiama ${nome}. I progressi di ${prima === nome ? 'prima' : prima} sono rimasti tutti dov'erano.` }
    }
    chiudiTutto()
  } catch (e) {
    esito.value = { ok: false, testo: e.message }
  }
}

async function eliminaOra(g) {
  try {
    await eliminaGiocatore(g.id)
    esito.value = { ok: true, testo: `${g.nome} non c'è più, e con lui i suoi progressi.` }
  } catch (e) {
    esito.value = { ok: false, testo: e.message }
  }
  chiudiTutto()
}

/* ── cosa sa il bambino ──
   La seconda scheda. Un macrogruppo spento toglie le domande che lo
   davano per scontato — le conversioni a chi non ha ancora visto i
   litri — e i giochi degradano invece di sbarrare, come il castello che
   senza divisioni chiede moltiplicazioni più difficili. Non spegne
   giochi e non tocca progressi: è scritto sulla scheda, perché la paura
   di perdere qualcosa è l'unica ragione per cui un genitore non tocca
   un interruttore che gli servirebbe. */
/* Le sottovoci arrivano dai moduli di quiz (`quiz/saperi.js`) e si
   contano una volta sola: sono dato fermo, non cambiano mentre uno
   guarda la schermata. */
const materie = MATERIE_SAPERI.map(m => ({
  nome: m,
  saperi: saperiDiMateria(m).map(s => ({ ...s, sotto: sottoDi(s.chiave) })),
}))
const spenti = computed(() => saperiSpenti().length)
const acceso = chiave => sapereAcceso(chiave)
function cambiaSapere(s) {
  accendiSapere(s.chiave, !sapereAcceso(s.chiave))
  esito.value = { ok: true, testo: sapereAcceso(s.chiave)
    ? `${s.nome}: ${chi.value} le domande le vede di nuovo.`
    : `${s.nome} spento per ${chi.value}: ${s.spegne}.` }
}

/* ── il dettaglio di un gruppo ──
   Un gruppo è grosso — «accenti e apostrofi» sono cinque domande
   diverse — e a volte il bambino ne ha fatta una parte: l'apostrofo sì,
   l'accento tonico no. Il dettaglio serve a quello, e sta chiuso finché
   non lo si chiede: la scheda deve restare leggibile per chi vuole solo
   spegnere un gruppo intero, che è il gesto normale.

   Sta chiuso anche quando il gruppo è spento, e allora non si apre
   proprio: sotto un gruppo spento sono già spente tutte, e mostrare
   sette interruttori che non fanno niente è il modo migliore per far
   credere di aver acceso qualcosa. */
const dettaglio = ref('')
const apriDettaglio = chiave => { dettaglio.value = dettaglio.value === chiave ? '' : chiave }
function cambiaSotto(gruppo, t) {
  accendiSapere(t.chiave, !sapereAcceso(t.chiave))
  esito.value = { ok: true, testo: sapereAcceso(t.chiave)
    ? `${t.nome}: le domande tornano.`
    : `${t.nome}: niente più domande di questo. Il resto di «${gruppo.nome}» resta acceso.` }
}
/* quante ne ha spente dentro un gruppo: è l'unica cosa che si vede da
   fuori quando il dettaglio è chiuso, e senza non si saprebbe che lì
   dentro qualcuno ha già messo mano */
const spenteIn = s => s.sotto.filter(t => !sapereAcceso(t.chiave)).length

/* ── provare una voce prima di decidere ──
   Le tre righe scritte sulla carta dicono cosa sparisce; questo lo fa
   vedere. La domanda che si apre è quella vera, generata dallo stesso
   modulo che la darebbe al bambino: nessuno la scrive a mano e quindi
   nessuno se la dimentica aggiornata (`quiz/nucleo/esempi.js`).

   Provare NON spegne: si guarda, si chiude, e l'interruttore è ancora
   dove stava. Sono due gesti diversi e restano due tasti diversi —
   toccare la carta commuta, toccare «prova una domanda» mostra.

   `siPuoProvare` è falso dove quel sapere le domande non le fa: le
   divisioni vivono nel castello e non passano da nessun modulo di quiz.
   Là il tasto non compare, invece di aprire un pannello vuoto. */
const prova = ref(null)          // { chiave, nome } | null
const apriProva = (chiave, nome) => { prova.value = { chiave, nome } }

/* Tutte le tappe aperte da subito. L'interruttore c'è e la scelta si
   salva nel profilo; i giochi però non lo leggono ancora, quindi per ora
   non cambia niente — ed è scritto sulla carta, perché un interruttore
   che sembra fare qualcosa e non la fa è peggio che non averlo. */
const aperto = computed(() => tuttoAperto())
function cambiaAperto() {
  accendiTuttoAperto(!aperto.value)
  esito.value = { ok: true, testo: aperto.value
    ? 'Segnato: tutte le tappe aperte. Ancora nessun gioco lo legge, quindi per ora non cambia niente.'
    : 'Tornato al normale: le tappe si aprono una per volta.' }
}

/* ── con che faccia si vede in mappa ──
   Si può cambiare solo per chi sta giocando adesso: il profilo degli
   altri fratelli non è caricato in memoria, e caricarlo solo per
   guardare un aspetto sarebbe un giro lungo per una carta che oggi non
   lo mostra. Sta nella carta di «Chi gioca» che ha la spunta 🎮, non
   quassù fra gli interruttori: è un attributo del bambino, come il nome,
   non una preferenza su cosa si vede in home. */
const aspettoAttuale = computed(() => aspettoDi())
function cambiaAspetto(nome) {
  if (nome === aspettoAttuale.value) return
  scegliAspetto(nome)
}

/* Le carte della home, una per gioco. Spegnere non cancella niente: i
   progressi restano dove sono e riaccendendo si ritrovano tutti. Serve a
   togliere di mezzo quello che a un bambino adesso non serve — e a
   lasciarne pochi davanti a chi, con nove carte, non ne apre nessuna. */
/* `manca` è il macrogruppo spento senza il quale quel gioco non si può
   giocare: la sua carta resta lì, spenta e con scritto perché, invece
   di sparire senza motivo dall'elenco dei genitori. */
const conStato = g => {
  const manca = saperiCheMancano(g.chiave).map(c => sapereDi(c)?.nome || c)
  return { ...g, acceso: giocoAcceso(g.chiave), manca: manca.join(' e ') }
}
const giochi = computed(() => GIOCHI.filter(g => !g.sperimentale).map(conStato))
const accesi = computed(() => quantiGiochiAccesi())

/* ── i giochi in prova ──
   Il cancello è uno per tutti. Chiuso, i giochi che ci stanno dietro non
   si elencano nemmeno: accendere il singolo non avrebbe nessun effetto,
   e un interruttore che non fa niente è peggio di un interruttore che
   non c'è. */
const inProva = computed(() => sperimentaliAccesi())
const sperimentali = computed(() =>
  inProva.value ? GIOCHI.filter(g => g.sperimentale).map(conStato) : [])
function cambiaProva() {
  accendiSperimentali(!inProva.value)
  esito.value = { ok: true, testo: inProva.value
    ? `I giochi in prova compaiono nella home di ${chi.value}. Sono a metà: aspettati che cambino.`
    : `I giochi in prova spariscono dalla home di ${chi.value}.` }
}
function cambiaGioco(g) {
  /* la carta bloccata da un sapere non si accende da qui: si accende
     dall'altra scheda, ed è l'unica cosa utile da dire */
  if (g.manca) {
    esito.value = { ok: false, testo:
      `${g.nome} è fatto tutto di quello: finché «${g.manca}» è spento in «Cosa sa», ` +
      `${chi.value} non lo trova in home.` }
    return
  }
  accendiGioco(g.chiave, !giocoAcceso(g.chiave))
  esito.value = { ok: true, testo: giocoAcceso(g.chiave)
    ? `${g.nome} torna nella home di ${chi.value}.`
    : `${g.nome} sparisce dalla home di ${chi.value}. I progressi restano: riaccendendolo si ritrovano.` }
}

async function azzera() {
  await resetPlayer()
  confermaAzzera.value = false
  confermaFattoria.value = false
  esito.value = { ok: true, testo: 'I progressi di ' + chi.value + ' sono stati cancellati.' }
}
</script>

<template>
  <div class="schermo">
    <Barra titolo="Genitori" :audio="false" @indietro="$emit('vai','home')" />

    <!-- ── il gradino ── -->
    <div v-if="!dentro" class="centro">
      <h2>Solo per i grandi</h2>
      <p class="testo">Qui si salvano, si rimettono e si cancellano i progressi.</p>

      <div class="pallini">
        <span v-for="(pieno, i) in pallini" :key="i" :class="{ pieno }"></span>
      </div>
      <p v-if="sbagliato" class="avviso">Codice sbagliato</p>

      <div class="tastierino">
        <button v-for="n in [1,2,3,4,5,6,7,8,9]" :key="n" class="tasto" @click="premi(String(n))">{{ n }}</button>
        <span></span>
        <button class="tasto" @click="premi('0')">0</button>
        <button class="tasto canc" @click="cancella">⌫</button>
      </div>
    </div>

    <!-- ── il codice nuovo: stesso tastierino, due giri ── -->
    <div v-else-if="modo" class="centro">
      <h2>{{ titoloCambio }}</h2>
      <p class="testo">Quattro cifre. Te lo chiedo due volte, così un dito
        storto non ti chiude fuori.</p>

      <div class="pallini">
        <span v-for="(pieno, i) in pallini" :key="i" :class="{ pieno }"></span>
      </div>
      <p v-if="esito && !esito.ok" class="avviso">{{ esito.testo }}</p>

      <div class="tastierino">
        <button v-for="n in [1,2,3,4,5,6,7,8,9]" :key="n" class="tasto" @click="premi(String(n))">{{ n }}</button>
        <span></span>
        <button class="tasto" @click="premi('0')">0</button>
        <button class="tasto canc" @click="cancella">⌫</button>
      </div>
      <button class="link" @click="lasciaStare">lascia stare</button>
    </div>

    <!-- ── dentro ── -->
    <div v-else class="centro">
      <h2>Impostazioni di {{ chi }}</h2>

      <div class="schede">
        <button :class="{ ora: scheda === 'giochi' }" data-scheda="giochi"
                @click="scheda = 'giochi'">Giochi</button>
        <button :class="{ ora: scheda === 'sa' }" data-scheda="sa"
                @click="scheda = 'sa'">Cosa sa</button>
      </div>

      <!-- ══════════ scheda: cosa sa il bambino ══════════ -->
      <template v-if="scheda === 'sa'">
        <p class="mini">Quello che {{ chi }} a scuola non ha ancora fatto si spegne
          qui: le domande che lo davano per scontato spariscono, e al loro posto ne
          arrivano di più facili. Nessun gioco si chiude e nessun progresso si perde.</p>

        <template v-for="m in materie" :key="m.nome">
          <h3 class="materia">{{ m.nome }}</h3>
          <div class="carte">
            <template v-for="s in m.saperi" :key="s.chiave">
              <button class="carta interruttore sapere"
                      :class="{ spento: !acceso(s.chiave) }" :data-sapere="s.chiave"
                      @click="cambiaSapere(s)">
                <span class="ico">{{ s.ico }}</span>
                <b>{{ s.nome }}</b>
                <i>{{ acceso(s.chiave) ? s.che : s.spegne }}</i>
                <small v-if="acceso(s.chiave)">per esempio {{ s.esempio }}</small>
                <span class="leva"><span class="pallina"></span></span>
              </button>

              <!-- sotto la carta: guardare e approfondire, i due gesti
                   che non spengono niente. Stanno fuori dalla carta
                   perché la carta è già un tasto, e un tasto dentro un
                   tasto non si può fare. -->
              <div v-if="siPuoProvare(s.chiave) || (s.sotto.length && acceso(s.chiave))"
                   class="azioni-sapere">
                <button v-if="siPuoProvare(s.chiave)" class="prova-tasto"
                        :data-prova="s.chiave" @click="apriProva(s.chiave, s.nome)">
                  ▶ prova una domanda
                </button>
                <!-- il dettaglio: solo se il gruppo ha sottovoci ed è acceso -->
                <button v-if="s.sotto.length && acceso(s.chiave)" class="dettaglio-tasto"
                        :data-dettaglio="s.chiave" @click="apriDettaglio(s.chiave)">
                  {{ dettaglio === s.chiave ? 'chiudi il dettaglio ▴' : 'nel dettaglio ▾' }}
                  <em v-if="spenteIn(s)">{{ spenteIn(s) }} di {{ s.sotto.length }} spente</em>
                </button>
              </div>
              <div v-if="s.sotto.length && acceso(s.chiave) && dettaglio === s.chiave" class="dettaglio">
                <div v-for="t in s.sotto" :key="t.chiave" class="voce-riga">
                  <button class="voce" :class="{ spento: !acceso(t.chiave) }"
                          :data-sapere="t.chiave" @click="cambiaSotto(s, t)">
                    <span>{{ t.nome }}</span>
                    <span class="leva"><span class="pallina"></span></span>
                  </button>
                  <!-- una tipologia una domanda ce l'ha sempre: il `v-if`
                       è per il giorno che qualcuno ne dichiarasse una
                       che non esce da nessun grado -->
                  <button v-if="siPuoProvare(t.chiave)" class="prova-tasto solo-segno"
                          :data-prova="t.chiave" :aria-label="'prova ' + t.nome"
                          @click="apriProva(t.chiave, t.nome)">▶</button>
                </div>
              </div>
            </template>
          </div>
        </template>

        <p class="mini">{{ spenti ? spenti + ' spenti: quelle domande non arrivano più.'
                                  : 'Nessuno spento: arrivano domande di tutto.' }}</p>
      </template>

      <!-- ══════════ scheda: i giochi ══════════ -->
      <template v-else>
      <div class="carte">
        <button class="carta interruttore" :class="{ spento: !aperto }"
                data-flag="tuttoAperto" @click="cambiaAperto">
          <span class="ico">🔓</span>
          <b>Sblocca tutti i livelli</b>
          <i>{{ aperto ? 'Segnato — nessun gioco lo legge ancora: per ora non cambia niente'
                       : 'Le tappe si aprono una per volta, come adesso' }}</i>
          <span class="leva"><span class="pallina"></span></span>
        </button>
      </div>

      <h2>Giochi in home</h2>
      <p class="mini">Spegnere non cancella niente: i progressi restano al loro posto.</p>

      <div class="carte">
        <button v-for="g in giochi" :key="g.chiave" class="carta interruttore gioco"
                :class="{ spento: !g.acceso, bloccato: !!g.manca }" :data-gioco="g.chiave"
                @click="cambiaGioco(g)">
          <span class="ico">{{ g.ico }}</span>
          <b>{{ g.nome }}</b>
          <i v-if="g.manca">è tutto «{{ g.manca }}», che hai spento in «Cosa sa»</i>
          <i v-else>{{ g.che }}</i>
          <span class="leva"><span class="pallina"></span></span>
        </button>
      </div>
      <p v-if="!accesi" class="avviso">Sono spenti tutti: nella home di
        {{ chi }} non resta nessun gioco.</p>

      <!-- ── i giochi in prova ──
           Il cancello, e dietro il cancello quello che c'è. Spento, i
           giochi a metà non esistono per chi gioca: non sono in home e
           non sono nemmeno qui, perché non c'è niente da accendere. -->
      <h2>Giochi in prova</h2>
      <p class="mini">Roba che sto ancora scrivendo: si vede a metà e può cambiare da un
        giorno all'altro. Acceso, {{ chi }} li trova in home insieme agli altri.</p>

      <div class="carte">
        <button class="carta interruttore" :class="{ spento: !inProva }"
                data-flag="sperimentali" @click="cambiaProva">
          <span class="ico">🧪</span>
          <b>Mostra i giochi in prova</b>
          <i>{{ inProva ? (sperimentali.length === 1
                            ? '1 gioco in prova, e ' + chi.value + ' lo vede'
                            : sperimentali.length + ' giochi in prova, e ' + chi.value + ' li vede')
                        : 'Nascosti: in home non compaiono' }}</i>
          <span class="leva"><span class="pallina"></span></span>
        </button>

        <button v-for="g in sperimentali" :key="g.chiave" class="carta interruttore gioco prova"
                :class="{ spento: !g.acceso }" :data-gioco="g.chiave"
                @click="cambiaGioco(g)">
          <span class="ico">{{ g.ico }}</span>
          <b>{{ g.nome }} <small>in prova</small></b>
          <i>{{ g.che }}</i>
          <span class="leva"><span class="pallina"></span></span>
        </button>
      </div>
      </template>

      <!-- chi gioca, il salvataggio e il codice non stanno in nessuna
           delle due schede: sono le cose che si vengono a fare qui di
           corsa, e nasconderle dietro una linguetta vorrebbe dire
           cercarle -->
      <h2>Chi gioca</h2>

      <div class="carte">
        <template v-for="g in state.giocatori" :key="g.id">
          <!-- in rinomina: il campo prende il posto della riga, così non
               si può cambiare il nome di uno guardando quello di un altro -->
          <div v-if="rinominando === g.id" class="carta aperta" :data-giocatore="g.id">
            <b>Come si chiama?</b>
            <form class="riga campo" @submit.prevent="salvaNome">
              <input v-model="nomeInCorso" class="nome" type="text" maxlength="20"
                     autocomplete="off" spellcheck="false" aria-label="il nome">
              <button class="bottone chiaro" type="button" @click="chiudiTutto">Lascia stare</button>
              <button class="bottone" type="submit" :disabled="!nomeInCorso.trim()">Salva</button>
            </form>
            <i>Cambia solo il nome scritto: monete, animali e traguardi restano suoi.</i>
          </div>

          <div v-else-if="eliminando === g.id" class="carta pericolo aperta" :data-giocatore="g.id">
            <b>Eliminare {{ g.nome }}?</b>
            <i>Spariscono anche tutti i suoi progressi, e non si torna indietro.
               Se non l'hai ancora fatto, salva prima su file.</i>
            <div class="riga">
              <button class="bottone chiaro" @click="chiudiTutto">No, lascia stare</button>
              <button class="bottone rosso" @click="eliminaOra(g)">Sì, elimina</button>
            </div>
          </div>

          <div v-else class="carta chi-gioca" :data-giocatore="g.id">
            <span class="ico">{{ g.id === state.player ? '🎮' : '🙂' }}</span>
            <b>{{ g.nome }}</b>
            <!-- chi gioca si cambia dalla home, non da qui: cambiarlo
                 ricarica la schermata e richiederebbe il codice -->
            <i v-if="g.id === state.player">sta giocando adesso</i>
            <i v-else>i suoi progressi sono separati</i>
            <div class="riga">
              <button class="bottone chiaro" data-azione="rinomina"
                      @click="apriRinomina(g)">Cambia nome</button>
              <button class="bottone chiaro" data-azione="elimina"
                      @click="apriElimina(g)">Elimina</button>
            </div>
            <!-- solo per chi sta giocando adesso: il profilo di un altro
                 fratello non è in memoria, vedi il commento sopra
                 `aspettoAttuale` -->
            <div v-if="g.id === state.player" class="aspetto-sezione">
              <p class="mini">Con che faccia si vede in mappa</p>
              <SceltaAspetto :scelto="aspettoAttuale" data-scelta="aspetto"
                             @scegli="cambiaAspetto" />
            </div>
          </div>
        </template>

        <div v-if="aggiungendo" class="carta aperta" data-azione="nuovo-nome">
          <b>Come si chiama?</b>
          <form class="riga campo" @submit.prevent="salvaNome">
            <input v-model="nomeInCorso" class="nome" type="text" maxlength="20"
                   autocomplete="off" autocapitalize="words" spellcheck="false"
                   placeholder="il nome" aria-label="il nome">
          </form>

          <!-- ── da dove parte ──
               Chiedere qui e non dopo è il punto: spegnere a mano dodici
               giochi e tre saperi si può fare da sempre, ma va fatto
               PRIMA che il bambino apra il gioco la prima volta — cioè
               nel momento in cui uno ha meno voglia di configurare. Tre
               tocchi al posto di trenta, e niente che resti appiccicato
               al profilo: da domani si tocca tutto a mano come prima. -->
          <div class="partenze">
            <button v-for="p in PARTENZE" :key="p.chiave" type="button"
                    class="partenza" :class="{ on: partenzaScelta === p.chiave }"
                    :data-partenza="p.chiave" @click="partenzaScelta = p.chiave">
              <b>{{ p.nome }}<em>{{ p.eta }}</em></b>
              <i>{{ p.che }}</i>
            </button>
          </div>

          <p class="mini">Con che faccia si vede in mappa</p>
          <SceltaAspetto :scelto="aspettoScelto" data-scelta="aspetto"
                         @scegli="aspettoScelto = $event" />

          <div class="riga">
            <button class="bottone chiaro" type="button" @click="chiudiTutto">Lascia stare</button>
            <button class="bottone" type="button" :disabled="!nomeInCorso.trim() || !partenzaScelta"
                    @click="salvaNome">Aggiungi</button>
          </div>
          <i>Parte da zero, con i suoi progressi separati da quelli degli altri.
            Quello che si accende adesso si cambia quando si vuole, da qui.</i>
        </div>
        <button v-else class="carta" data-azione="aggiungi-giocatore" @click="apriAggiungi">
          <span class="ico">➕</span>
          <b>Aggiungi un giocatore</b>
          <i>Un altro bambino, con progressi tutti suoi</i>
        </button>
      </div>

      <h2>Progressi</h2>

      <div class="carte">
        <button class="carta" @click="esporta">
          <span class="ico">💾</span>
          <b>Salva su file</b>
          <i>Scarica tutto: {{ chiGioca }}</i>
        </button>

        <button class="carta" @click="file.click()">
          <span class="ico">📂</span>
          <b>Rimetti da un file</b>
          <i>Sostituisce i progressi con quelli salvati</i>
        </button>
        <input ref="file" type="file" accept="application/json,.json" hidden @change="importa">

        <button v-if="!confermaAzzera" class="carta pericolo" @click="confermaAzzera = true">
          <span class="ico">🗑️</span>
          <b>Cancella i progressi di {{ chi }}</b>
          <i>Riparte da zero, non si torna indietro</i>
        </button>
        <div v-else class="carta pericolo aperta">
          <b>Cancellare i progressi di {{ chi }}?</b>
          <i>Monete, animali, traguardi: tutto perso. Se non l'hai ancora
             fatto, salva prima su file.</i>
          <div class="riga">
            <button class="bottone chiaro" @click="confermaAzzera = false">No, lascia stare</button>
            <button class="bottone rosso" @click="azzera">Sì, cancella</button>
          </div>
        </div>

        <!-- Ricominciare UN gioco solo, che non è la stessa cosa di
             cancellare tutto. Sta in un blocco a sé e non dentro la catena
             qui sopra: infilata lì in mezzo spezzava il `v-else` del
             cancella-tutto, che smetteva di comparire — e il tasto rosso
             sembrava non fare niente. Compare solo se quel bambino la
             fattoria l'ha davvero aperta. -->
        <template v-if="haGiocato('fattoria')">
          <button v-if="!confermaFattoria" class="carta pericolo"
                  data-azione="azzera-fattoria" @click="confermaFattoria = true">
            <span class="ico">🚜</span>
            <b>Ricomincia la fattoria di {{ chi }}</b>
            <i>Solo la fattoria: il resto dei progressi non si tocca</i>
          </button>
          <div v-else class="carta pericolo aperta">
            <b>Ricominciare la fattoria di {{ chi }}?</b>
            <i>Terra, cose comprate e animali spariscono, e il prato torna
               vuoto. <b>Le monete spese non tornano indietro.</b> Tutto il
               resto — gli altri giochi, i traguardi, il salvadanaio — resta
               com'è.</i>
            <div class="riga">
              <button class="bottone chiaro" @click="confermaFattoria = false">No, lascia stare</button>
              <button class="bottone rosso" @click="azzeraFattoria">Sì, ricomincia</button>
            </div>
          </div>
        </template>
      </div>

      <h2>Codice</h2>

      <div class="carte">
        <button class="carta" data-azione="cambia-codice" @click="cambiaCodice">
          <span class="ico">🔑</span>
          <b>Cambia il codice</b>
          <i v-if="pin === PIN_INIZIALE">È ancora {{ PIN_INIZIALE }}: cambialo appena
            qualcuno te lo legge da sopra la spalla</i>
          <i v-else>Quattro cifre nuove, chieste due volte</i>
        </button>
      </div>

      <!-- ── SE QUALCOSA SI ROMPE ──
           Un guasto su un telefono che non è il tuo è, di solito, il
           racconto di un bambino: «si è piantato». Qui c'è scritto cosa
           è successo davvero, con l'ora e la versione, e sotto il tasto
           che rimette a posto la copia dell'app senza toccare i
           progressi. La sezione compare solo quando c'è qualcosa da
           dire: una riga «nessun guasto» sarebbe una riga in più da
           leggere ogni volta per non sapere niente. -->
      <template v-if="incidenti.length">
        <h2>Se qualcosa si è rotto</h2>

        <div class="carte">
          <div class="carta guasti" data-azione="guasti">
            <span class="ico">🔧</span>
            <b>Ultimi inciampi</b>
            <i>Da leggere se il gioco si è chiuso o un tasto non rispondeva</i>
            <ul class="lista-guasti">
              <li v-for="(g, i) in incidenti.slice().reverse()" :key="i">
                <b>{{ quando(g.quando) }}</b>
                <span>{{ g.testo }}</span>
                <small>{{ g.dove }}{{ g.versione ? ' · ' + g.versione : '' }}{{
                  g.volte > 1 ? ' · ' + g.volte + ' volte' : '' }}</small>
              </li>
            </ul>
            <div class="riga">
              <button class="bottone chiaro" data-azione="copia-guasti" @click="copiaGuasti">
                Copia</button>
              <button class="bottone chiaro" data-azione="scorda-guasti" @click="scordaGuasti">
                Cancella</button>
            </div>
          </div>

          <button class="carta" data-azione="ripara" @click="riparaApp">
            <span class="ico">♻️</span>
            <b>Riscarica il gioco</b>
            <i>Butta la copia tenuta da parte e riprende l'applicazione da capo.
              I progressi non si toccano — quelli stanno da un'altra parte, e li
              porta via solo il tasto rosso qui sopra</i>
          </button>
        </div>
      </template>

      <!-- ── DIRMELO ──
           Questa sta fuori dal `v-if` di sopra, e il motivo è tutto qui:
           i guasti che il gioco si annota sono quelli che lanciano un
           errore, e la metà delle cose che non vanno non ne lancia
           nessuno — un livello troppo difficile, una parola sbagliata,
           un tasto che risponde ma fa la cosa storta. Se il modo di
           dirmelo comparisse solo quando c'è già un errore in archivio,
           mancherebbe esattamente quando serve di più. -->
      <h2>Dirmi che qualcosa non va</h2>

      <div class="carte">
        <a class="carta segnala" data-azione="segnala" :href="linkSegnala"
           target="_blank" rel="noopener">
          <span class="ico">✉️</span>
          <b>Segnala un problema</b>
          <i v-if="incidenti.length">Si apre un modulo che ha già dentro la versione
            e l'ultimo inciampo: non resta da scrivere niente di tecnico</i>
          <i v-else>Si apre un modulo, con già dentro la versione del gioco</i>
        </a>
      </div>

      <!-- ── GIUDICARE LE DOMANDE ──
           L'altra metà di quello che non va, e quella che nessun errore
           segnala: una domanda giusta ma fuori misura. Il difetto non lo
           vede il gioco — per lui la domanda è ineccepibile — lo vede
           solo chi sta seduto di fianco mentre il bambino ci sbatte, e
           finora finiva su un foglietto. Acceso l'interruttore, tre
           tastini sopra ogni domanda: il verdetto lo dà il grande, tutto
           il resto (modulo, grado, tipologia, tempo, esito) se lo
           annota il gioco da solo. -->
      <h2>Le domande dei quiz</h2>

      <div class="carte">
        <button class="carta interruttore" :class="{ spento: !giudiziAccesi }"
                data-flag="giudizi" @click="cambiaGiudizi">
          <span class="ico">😰</span>
          <b>Giudicare le domande</b>
          <i>{{ giudiziAccesi
                ? 'Sopra ogni domanda ci sono 😴 troppo facile, 😰 troppo difficile, 🐛 storta'
                : 'Spento: nessun tastino in più mentre si gioca' }}</i>
          <span class="leva"><span class="pallina"></span></span>
        </button>

        <div v-if="giudizi.length" class="carta guasti" data-azione="giudizi">
          <span class="ico">📝</span>
          <b>{{ giudizi.length === 1 ? '1 domanda segnata' : giudizi.length + ' domande segnate' }}</b>
          <i>Questo è quello che parte: verdetto, chi giocava, il modulo col grado,
            la tipologia, quanto ci ha messo e com'è finita</i>
          <ul class="lista-guasti">
            <li v-for="(g, i) in righeGiudizi" :key="i">
              <span>{{ g.ico }} {{ g.testo }}</span>
            </li>
          </ul>
          <p v-if="paccoDaMandare.lasciati" class="mini">
            Nel modulo ci stanno gli ultimi {{ paccoDaMandare.mandati }}: gli altri
            {{ paccoDaMandare.lasciati }} restano qui, e si mandano con «Copia».
          </p>
          <div class="riga">
            <a class="bottone chiaro" data-azione="manda-giudizi" :href="linkGiudizi"
               target="_blank" rel="noopener">Manda</a>
            <button class="bottone chiaro" data-azione="copia-giudizi" @click="copiaGiudizi">
              Copia</button>
            <button class="bottone chiaro" data-azione="scorda-giudizi" @click="scordaGiudizi">
              Cancella</button>
          </div>
        </div>
      </div>

      <p v-if="esito" :class="esito.ok ? 'mini' : 'avviso'">{{ esito.testo }}</p>
    </div>

    <!-- il pannello di prova copre tutto: si è entrati per guardare una
         cosa sola. Sta fuori dalle schede perché non è di nessuna delle
         due: è un modo di leggere una voce, non un'impostazione. -->
    <Prova v-if="prova" :chiave="prova.chiave" :nome="prova.nome" @chiudi="prova = null" />
  </div>
</template>

<style scoped>
.pallini { display:flex; gap:14px; margin:4px 0 2px }
.pallini span { width:15px; height:15px; border-radius:50%; background:#ffffffcc;
                box-shadow:inset 0 0 0 2px #d4dce6; transition:.12s }
.pallini span.pieno { background:var(--viola); box-shadow:none; transform:scale(1.1) }

.tastierino { display:grid; grid-template-columns:repeat(3,1fr); gap:11px; width:100%; max-width:260px }
.tasto { height:58px; border-radius:16px; background:#ffffffdd; color:var(--viola-scuro);
         font-size:23px; font-weight:800; box-shadow:0 4px 0 #d4dce6 }
.tasto:active { transform:translateY(2px); box-shadow:0 2px 0 #d4dce6 }
.tasto.canc { font-size:19px; color:var(--tenue) }

/* le due linguette: quella aperta è piena, l'altra è solo scritta —
   non c'è modo di sbagliarsi su dove si è */
.schede { display:flex; gap:8px; width:100%; max-width:400px; margin:-4px 0 2px }
.schede button { flex:1; padding:11px 8px; border-radius:14px; font-size:15px; font-weight:800;
                 color:var(--tenue); background:#ffffff88 }
.schede button.ora { background:var(--viola); color:#fff; box-shadow:0 4px 0 #00000018 }
.schede button:active { transform:translateY(2px) }

h3.materia { margin:10px 0 -2px; font-size:13px; font-weight:900; letter-spacing:.6px;
             text-transform:uppercase; color:var(--tenue); align-self:flex-start;
             width:100%; max-width:400px }

.carte { display:flex; flex-direction:column; gap:11px; width:100%; max-width:400px }
.carta { display:grid; grid-template-columns:auto 1fr; grid-template-rows:auto auto;
         gap:2px 14px; align-items:center; text-align:left; padding:15px 18px;
         border-radius:18px; background:var(--carta); box-shadow:0 4px 14px #8593a822 }
.carta .ico { grid-row:1/3; font-size:29px }
.carta b { font-size:16px; font-weight:800; color:var(--viola-scuro) }
.carta i { font-style:normal; font-size:12.5px; color:var(--tenue) }
.carta:active { transform:translateY(2px) }

/* l'interruttore: la leva a destra dice acceso/spento senza leggere */
.carta.interruttore { grid-template-columns:auto 1fr auto }
.carta.interruttore .leva { grid-column:3; grid-row:1/3; width:46px; height:27px; border-radius:999px;
                            background:#38c172; position:relative; transition:.15s }
.carta.interruttore .pallina { position:absolute; top:3px; left:22px; width:21px; height:21px;
                               border-radius:50%; background:#fff; transition:.15s;
                               box-shadow:0 1px 3px #00000033 }
.carta.interruttore.spento .leva { background:#c9c2d6 }
.carta.interruttore.spento .pallina { left:3px }
/* la carta di un sapere ha una riga in più: l'esempio di una domanda
   che sparisce, che è quello che fa capire cosa si sta spegnendo */
.carta.sapere { grid-template-rows:auto auto auto; padding:12px 16px }
.carta.sapere .ico, .carta.sapere .leva { grid-row:1/4 }
.carta.sapere small { font-size:11.5px; color:var(--tenue); opacity:.85 }
.carta.sapere.spento { opacity:.62 }

/* ── il dettaglio di un gruppo ──
   Sta sotto la sua carta e non è una carta a sua volta: deve leggersi
   come «dentro questo», non come «un'altra cosa allo stesso livello».
   Da qui il rientro, lo sfondo più tenue e la leva più piccola. */
.dettaglio-tasto { align-self:flex-start; margin:-6px 0 0 14px; padding:4px 8px;
                   font-size:12px; font-weight:700; color:var(--tenue); background:none;
                   display:flex; align-items:center; gap:8px }
.dettaglio-tasto em { font-style:normal; font-size:11px; font-weight:700; color:#b23a5a;
                      background:#b23a5a1a; border-radius:999px; padding:2px 7px }
.dettaglio { display:flex; flex-direction:column; gap:1px; margin:-4px 0 4px 14px;
             border-radius:14px; overflow:hidden; background:#8593a81a }
.dettaglio .voce { display:flex; align-items:center; justify-content:space-between; gap:12px;
                   width:100%; padding:10px 14px; text-align:left; background:var(--carta);
                   font-size:13.5px; font-weight:700; color:var(--viola-scuro) }
.dettaglio .voce:active { transform:translateY(1px) }
.dettaglio .voce.spento { color:var(--tenue) }
.dettaglio .voce .leva { flex:none; width:38px; height:22px; border-radius:999px;
                         background:#38c172; position:relative; transition:.15s }
.dettaglio .voce .pallina { position:absolute; top:3px; left:19px; width:16px; height:16px;
                            border-radius:50%; background:#fff; transition:.15s;
                            box-shadow:0 1px 3px #00000033 }
.dettaglio .voce.spento .leva { background:#c9c2d6 }
.dettaglio .voce.spento .pallina { left:3px }
.carta.sapere.spento i { color:#b23a5a }

/* ── i due tasti che non spengono niente ──
   Sotto la carta, in fila e in piccolo: chi è venuto a spegnere tocca
   la carta e non li legge nemmeno, chi non sa cosa sta spegnendo li
   trova lì. Il rientro è lo stesso del dettaglio, così si vede che
   parlano della carta di sopra. */
.azioni-sapere { display:flex; align-items:center; gap:4px; flex-wrap:wrap;
                 margin:-6px 0 0 14px }
/* dentro la riga il rientro ce l'ha già il contenitore */
.azioni-sapere .dettaglio-tasto { margin:0 }
.prova-tasto { padding:4px 9px; font-size:12px; font-weight:700; color:var(--viola);
               background:#7c5cff14; border-radius:999px }
.prova-tasto:active { transform:translateY(1px) }
/* nel dettaglio la riga è stretta: resta il solo triangolino, e il
   nome della voce lo dice l'`aria-label` a chi legge con le orecchie.
   Colorato come il tasto grande, però: grigio si leggeva come «apri
   questa riga», e invece è la stessa cosa di sopra. */
.dettaglio .voce-riga { display:flex; align-items:center; gap:2px; background:var(--carta) }
.dettaglio .voce-riga .voce { flex:1; min-width:0 }
.prova-tasto.solo-segno { flex:none; padding:10px 14px; font-size:12px; border-radius:0;
                          background:none; color:var(--viola) }

/* sette carte di fila: più basse, e quelle spente si vedono da lontano */
.carta.gioco { padding:11px 16px }
.carta.gioco .ico { font-size:25px }
.carta.gioco.spento { opacity:.62 }
/* spento da un macrogruppo, non dai genitori: la leva è ferma e il
   motivo sta scritto sulla carta */
.carta.gioco.bloccato i { color:#b23a5a }
.carta.gioco.bloccato .leva { background:#e3dce8 }
/* un gioco in prova lo dice sulla carta: chi lo accende deve sapere che
   quello che troverà è a metà */
.carta.gioco.prova b small { margin-left:6px; font-size:10px; font-weight:900; letter-spacing:.4px;
                             text-transform:uppercase; color:#8a6a1f; background:#fff2cf;
                             border-radius:7px; padding:2px 6px; vertical-align:middle }

/* ── il libretto dei guasti ──
   Una carta che si legge, non che si preme: il testo dell'errore va a
   capo quanto serve e resta in monospazio, perché è roba da girare a chi
   ci mette le mani, non da capire a colpo d'occhio. */
.carta.guasti { grid-template-rows:auto auto auto auto }
.carta.guasti .ico { grid-row:1/3 }
.lista-guasti { grid-column:1/3; margin:8px 0 0; padding:0; list-style:none;
                display:flex; flex-direction:column; gap:7px }
.lista-guasti li { display:flex; flex-direction:column; gap:1px; padding:7px 10px;
                   background:#fff0e6; border-radius:11px }
.lista-guasti b { font-size:12px; color:#b4603f }
.lista-guasti span { font-size:11.5px; line-height:1.35; word-break:break-word;
                     font-family:ui-monospace,monospace; color:var(--viola-scuro) }
.lista-guasti small { font-size:10.5px; color:var(--tenue); opacity:.8 }
.carta.guasti .riga { grid-column:1/3; justify-content:flex-start; margin-top:9px }
.carta.guasti .bottone { font-size:14px; padding:9px 15px; box-shadow:0 4px 0 #d4dce6 }

/* l'unica carta che è un link e non un tasto: da sola prenderebbe il blu
   e la sottolineatura del browser, e in mezzo alle altre si leggerebbe
   come una cosa d'altro tipo */
.carta.segnala { text-decoration:none; color:inherit }
/* e l'unico bottone che è un link, per lo stesso motivo: «Manda» apre il
   modulo fuori dal gioco, ma in fila con «Copia» e «Cancella» deve
   sembrare uno dei tre */
a.bottone { text-decoration:none; display:inline-flex; align-items:center;
            justify-content:center }

/* ── da dove parte un bambino ──
   Tre righe da leggere e non tre pastiglie da premere: la differenza fra
   «terza» e «quarta» sta tutta nella riga sotto, e chi sceglie senza
   leggerla sceglie a caso. Per questo la scritta piccola c'è sempre,
   anche sulla scelta non selezionata. */
.partenze { display:flex; flex-direction:column; gap:7px; width:100% }
.partenza { display:flex; flex-direction:column; gap:2px; width:100%; text-align:left;
            padding:10px 13px; border-radius:14px; background:#fff;
            box-shadow:inset 0 0 0 2px #e3e8ef; transition:.14s }
.partenza b { display:flex; align-items:baseline; gap:7px; font-size:14.5px; font-weight:800;
              color:var(--viola-scuro) }
.partenza b em { font-style:normal; font-size:11px; font-weight:700; color:var(--tenue) }
.partenza i { font-style:normal; font-size:11.5px; line-height:1.35; color:var(--tenue) }
.partenza.on { background:#f4f1ff; box-shadow:inset 0 0 0 2px var(--viola) }
.partenza.on b { color:var(--viola) }
.partenza:active { transform:translateY(1px) }

/* Cancellare non deve somigliare alle altre due: si vede da lontano che è
   quella che fa danni. */
.carta.pericolo b { color:#b23a5a }
.carta.pericolo.aperta { display:flex; flex-direction:column; gap:9px; align-items:center;
                         text-align:center; background:#fff0f3 }
.carta.pericolo.aperta i { max-width:34ch }
.bottone.rosso { background:linear-gradient(180deg,var(--rosso),#d63a5c); color:#fff;
                 box-shadow:0 6px 0 #a82a46; font-size:16px; padding:13px 22px }
.bottone.rosso:active { box-shadow:0 3px 0 #a82a46 }
.bottone.chiaro { font-size:16px; padding:13px 22px }

/* ── chi gioca ──
   La carta di un giocatore ha una riga in più delle altre: sotto il nome
   ci stanno i suoi tre gesti. I bottoni vanno a capo da soli, perché
   «Passa a Federica» più altri due su un telefono stretto non ci stanno
   in fila — ed è lo stesso motivo per cui la fila in home ora va a capo. */
.carta.chi-gioca { grid-template-rows:auto auto auto }
.carta.chi-gioca .ico { grid-row:1/4 }
.carta.chi-gioca .riga { grid-column:2; justify-content:flex-start; margin-top:7px }
.carta.chi-gioca .bottone { font-size:14px; padding:9px 15px; box-shadow:0 4px 0 #d4dce6 }
.carta.chi-gioca .bottone:active { transform:translateY(2px); box-shadow:0 2px 0 #d4dce6 }
/* l'aspetto è un quarto rigo che solo chi sta giocando adesso ha: le
   altre carte restano a tre righe, quindi occupa colonna intera invece
   di lasciare l'icona a mezz'aria sotto di sé */
.carta.chi-gioca .aspetto-sezione { grid-column:1/3; margin-top:9px;
  padding-top:9px; border-top:1px solid #8593a822 }
.carta.chi-gioca .aspetto-sezione .mini { text-align:left; margin:0 0 7px }
/* la carta aperta a scrivere un nome: stessa forma di quella che chiede
   conferma prima di cancellare, senza il rosso */
.carta.aperta { display:flex; flex-direction:column; gap:9px; align-items:center; text-align:center }
.carta.aperta i { max-width:34ch }
.campo { width:100% }
.campo .nome {
  flex:1 1 130px; min-width:0; padding:12px 14px; border:none; border-radius:14px;
  font-size:17px; font-family:inherit; text-align:center;
  background:#fff; color:var(--viola-scuro); box-shadow:inset 0 0 0 2px #e3e8ef;
}
.campo .nome:focus { outline:3px solid var(--viola); outline-offset:1px }
.campo .bottone { font-size:15px; padding:11px 17px }
</style>
