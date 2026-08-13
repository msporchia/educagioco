<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL GENERALE — dai gli ordini e guarda

   Qui il bambino non pilota nessuno: **firma ordini permanenti** alle
   sue unità e poi guarda la scena svolgersi.

     vai a [chiave]                     sequenza
     prendi [chiave]                    sequenza
     ripeti { vai, vai } smetti quando  ciclo
     ❓ condizione [vedi l'orco] → …     decisione, due rami
     quando arriva [tutto libero] → …   evento
     aspetta [l'orco]                   attesa

   È un gioco che insegna a programmare, e la cosa che insegna sta
   tutta nel **par**: vincere allungando la lista lo fa chiunque,
   vincere con quattro ordini vuol dire aver trovato il modo giusto di
   dirlo. Ogni livello si gioca su più varianti e si vince solo
   superandole tutte — un piano che funziona su una mappa sola non è
   un piano, è fortuna.

   ── i tre file ────────────────────────────────────────────────────
   · le REGOLE stanno in `motore/generale.js` e non sanno che esiste
     uno schermo: qui si chiamano `avvia()` e `passo()`, e tutto quello
     che succede succede lì;
   · i LIVELLI stanno in `data/generale.js`, dati puri;
   · il DISEGNO sta in `grafica/generale.js` e `grafica/ambienti.js`.
     Questa vista non tocca mai un contesto 2D: costruisce la lista
     delle cose in scena — `{ che:'orco', x, y, dir, passo }` — e la
     passa a `tela.disegna()`. L'unica cosa che passa di qui è il
     fondale già dipinto, ricopiato dalla finestra che si vede.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import Barra from '../components/Barra.vue'
import SceltaAvventura from './generale/SceltaAvventura.vue'
import MappaCapitoli from './generale/MappaCapitoli.vue'
import ElencoProve from './generale/ElencoProve.vue'
import CartelloScena from './generale/CartelloScena.vue'
import CampoLivello from './generale/CampoLivello.vue'
import FogliLivello from './generale/FogliLivello.vue'
import EditorPiano from './generale/EditorPiano.vue'
import { ogniVoce } from './generale/piano.js'
import { bersagliDi } from './generale/bersagli.js'
import { cosaCambia, nomiScene } from './generale/scene.js'
import { creaNavigazione } from './generale/navigazione.js'
import { genProgresso, genCompleta } from '../store/profile.js'
import { superaCapitolo, stelleDi } from '../store/storie.js'
import { suono } from '../audio.js'
import { LIVELLI, QUANTI, proveDi } from '../data/generale.js'
import { creaMondo, avvia, passo, esegui, pianoCompleto, mieUnita, altruiUnita, altriInCampo,
         contaOrdini, VERBI, ilSegnale, testoCond, laCosa,
         registro, eAvanzato, libera, perdute,
         manca, eCondizione, eRipeti, eRoutine, eBlocco, ramoDi, corpoDi, dentroA,
         RAMI, BLOCCHI, raccogliRoutine }
       from '../motore/generale.js'

const emit = defineEmits(['vai'])
const NOME = 'Il generale'

/* ── dove si è ──
   Le quattro schermate e il modo di passare dall'una all'altra stanno
   in `generale/navigazione.js`: qui si gioca un livello, e da quale
   schermata sia arrivato non è affare di questo file. */
const nav = creaNavigazione({ avvia: avviaLivello, aCasa: () => emit('vai', 'home'), nome: NOME })
const { fase, storiaOra, contesto, L, apri, apriCapitolo, apriStoria,
        indietro, dopo, numeroTappa, titolo } = nav
const livOra = ref(null)           // il livello in corso, da qualunque parte venga
const piano = ref({})              // gli ordini firmati: { unità: [ordini] }
const unitaOra = ref('')           // di chi stiamo scrivendo il piano
const letta = ref(null)            // di chi stiamo LEGGENDO gli ordini
const editor = ref(null)           // chi scrive gli ordini: `generale/EditorPiano.vue`
const pannello = ref('')           // '' | 'registro' | 'cartello' | 'scheda'
const scheda = ref(null)
const aiuti = ref(0), pagato = ref(false)
const auto = ref(false)
/* ── UNA VELOCITÀ SOLA, E SVELTA ──
   C'erano tre andature e un tasto per girarle (🐢 🐇 🐌). Non era una
   scelta di gioco: la scena si guarda per capire dove il piano si è
   rotto, e per quello serve vederla **subito** — chi rallentava lo
   faceva una volta, per curiosità, e poi ci restava lento. Il tasto in
   più costava un posto nella barra e una domanda a ogni partita
   («e questo?»), e la risposta giusta era sempre la stessa: la più
   veloce. Adesso è quella, e basta.
   Il montaggio delle scene dopo la prima resta più svelto ancora: là
   non si sta capendo, si sta verificando (vedi `battito`). */
const VEL = 180
const serieI = ref(0), esiti = ref([])
/* ── IL MONTAGGIO ──
   Vinta una scena, le altre si giocano **a schermo**, accelerate, una
   dopo l'altra. Prima si provavano senza schermo e si andava dritti al
   velo: era la scelta giusta per il tempo e quella sbagliata per la
   soddisfazione, perché chi ha appena scritto sei ordini vuole VEDERE
   che reggono anche dove la chiave sta dall'altra parte — se no non sa
   se ha faticato per niente, e il velo che gli dice «ha retto in tre
   situazioni» è la parola di qualcun altro.

   Va veloce perché la seconda scena non si guarda come la prima: la
   prima è la partita, queste sono la prova che era un piano. Chi ha già
   capito ha «salta →», che le manda giù senza schermo come prima. */
const montaggio = ref(false)
/* e più va avanti, più stringe: dopo una ventina di passi si è visto
   come si mette, e quello che resta è la conferma. Una scena da
   trecento passi guardata tutta allo stesso ritmo sarebbe cinque volte
   la partita che si è appena giocata. */
const VEL_MONTAGGIO = 105, VEL_SPICCIA = 55, DOPO_QUANTI = 20
const battito = computed(() => {
  if (!montaggio.value) return VEL
  tic.value                        // il mondo non è reattivo: si guarda attraverso il battito
  return (mondo && mondo.passi > DOPO_QUANTI) ? VEL_SPICCIA : VEL_MONTAGGIO
})
/* l'attesa del cartello fra una scena e l'altra: si cancella, perché
   uscire dal livello mentre è appeso farebbe ripartire una scena in una
   schermata che non c'è più */
let attesaCambio = 0
const fermaAttesa = () => { clearTimeout(attesaCambio); attesaCambio = 0 }
const gettoni = ref(0), scoperte = ref([])
const tic = ref(0)                 // batte a ogni passo: è quello che rinfresca la scena
const manchevole = ref('')         // cosa manca al piano, se ▶ non può partire
const finito = ref(null)           // il velo di fine livello
const cambio = ref(null)           // il cartello fra una scena e l'altra
const andato = ref(null)           // com'è andata storta: si tocca e si riparte

const progresso = computed(() => genProgresso())
const liv = computed(() => livOra.value || LIVELLI[L.value])
const par = computed(() => liv.value.par)
const quantiOrdini = computed(() => contaOrdini(piano.value))
const prove = computed(() => proveDi(liv.value))
const stelle = computed(() => nav.inStoria()
  ? stelleDi(contesto.value.storia, contesto.value.capId)
  : progresso.value.stelle[L.value] || 0)

/* il mondo è un oggetto grosso e mutabile: non lo mettiamo in reattivo,
   lo si guarda attraverso `tic` (che batte a ogni passo). È la stessa
   scelta del castello. */
let mondo = null, raf = 0
/* i compagni persi nelle scene provate in background: non si vedono
   giocare, ma se il piano ne sacrifica uno lì la stella si paga uguale */
let caduttiFondo = 0
/* IL DISEGNO STA DA UN'ALTRA PARTE. Tela, camera, quanto è grande una
   cella e il dito che trascina sono in `CampoLivello.vue`: qui si sa
   solo che c'è un campo, che si può inquadrare qualcuno e che a ogni
   passo va animato. */
const campo = ref(null)
/* il mondo si chiede, non si passa: quando la scena cambia, l'oggetto è
   un altro nello stesso istante, e una prop arriverebbe un disegno dopo */
const mondoOra = () => mondo

/* ═══════════ preparare la partita ═══════════
   Il livello arriva già scelto: da qui in giù non conta se venga da una
   prova o da un capitolo di storia — la partita è la stessa, e questa
   vista non ha due modi di giocare. */
function avviaLivello (l) {
  livOra.value = l
  piano.value = Object.fromEntries(mieUnita(l).map(id => [id, []]))
  unitaOra.value = mieUnita(l)[0]
  letta.value = null; scegliendo.value = null
  gettoni.value = l.gettoni || 0
  scoperte.value = l.mostraNemici === true ? altriInCampo(l) : []
  aiuti.value = 0; pagato.value = false; finito.value = null; andato.value = null
  cambio.value = null; fermaAttesa(); montaggio.value = false
  serieI.value = 0; esiti.value = []; auto.value = false; caduttiFondo = 0
  pannello.value = 'cartello'          // la prima cosa è la spiegazione, e non costa niente
  nuovoMondo(0)
  nextTick(async () => { await campo.value?.misura(); campo.value?.disegna() })
}

/* ═══════════ la partita ═══════════ */
function nuovoMondo (k) {
  serieI.value = k
  /* un livello può non avere varianti: dove non c'è niente da
     indovinare la scena è una sola, e `creaMondo` la sa prendere da sé */
  mondo = creaMondo(liv.value, (liv.value.varianti || [])[k])
  avvia(mondo, pianoCompleto(mondo, piano.value))
  mondo.passi = 0
  campo.value?.azzera()
  /* una scena nuova si mette in modo che si veda chi ha degli ordini:
     è l'unica inquadratura automatica rimasta, e succede da fermi */
  campo.value?.inquadraSu(mondo.unita.find(u => piano.value[u.id]) || mondo.unita[0])
  tic.value++
}
/* ── SFOGLIARE LE SITUAZIONI, DA FERMI ──
   Non è una partita: è guardare il caso successivo. Si rifà il mondo su
   quella variante e lo si disegna, senza toccare il piano — gli ordini
   scritti restano, ed è il punto: **lo stesso piano, un'altra
   battaglia**. Premendo Via si riparte comunque dalla prima, perché il
   giudizio è su tutte e l'ordine in cui si guardano non c'entra. */
function guarda (k) {
  if (auto.value || montaggio.value) return
  const q = Math.max(0, Math.min(prove.value - 1, k))
  nuovoMondo(q)
  campo.value?.mostraTutto()
}

/* ── UN TASTO SOLO, E FA UNA COSA SOLA ──
   Erano quattro: ▶, un passo, da capo, velocità. Adesso il tasto grande
   dice sempre cosa succede se lo premi — «Via» quando è fermo, «Stop»
   mentre gira — e Stop vuol dire «rimetti tutto com'era», che è l'unica
   cosa che si vuole davvero fare a metà di una scena andata storta. La
   pausa non c'era per niente: fermare una scena e lasciarla a metà non
   serve, perché il piano non si può correggere mentre gira — è la
   regola del gioco. */
function via () {
  if (auto.value || montaggio.value) { ferma(); return }
  /* Non si fa partire una scena che non può finire: si dice cosa manca
     e si resta fermi. Prima il giro senza uscita partiva e girava per
     trecento passi. */
  if (incompleti.value.length) {
    const q = incompleti.value[0]
    manchevole.value = `A «${q.verbo}» ${q.m}.`
    suono.no()
    return
  }
  manchevole.value = ''
  /* si comincia SEMPRE dalla prima: le situazioni si sfogliano da fermi
     per guardarle, ma il giudizio è su tutte e in ordine — se no
     «passate 3 di 3» vorrebbe dire cose diverse a seconda di dove si
     era rimasti a guardare */
  if (!mondo || mondo.finita || !mondo.passi || serieI.value !== 0) nuovoMondo(0)
  /* si parte vedendo tutta la stanza: il piano si giudica guardando le
     unità muoversi insieme, non seguendone una */
  campo.value?.mostraTutto()
  auto.value = true
}
function unPasso () {
  auto.value = false
  if (mondo.finita || !mondo.passi) nuovoMondo(0)
  fai1()
}
function ferma () {
  fermaAttesa()
  auto.value = false; montaggio.value = false; cambio.value = null
  esiti.value = []; andato.value = null; nuovoMondo(0)
}
function fai1 () {
  if (!mondo || mondo.finita) return
  const rosseP = mondo.traccia.filter(r => r.esito === 'no').length
  /* il passo lo fa il motore; la scivolata da dov'erano a dove sono la
     fa il campo, che è l'unico a sapere cos'è un pixel */
  campo.value?.animaPasso(() => passo(mondo))
  ultimoPasso = performance.now()
  const ev = mondo.eventi
  /* nel montaggio i passi sono quattro volte più fitti e i suoni
     diventerebbero un tamburello: resta quello che conta, cioè qualcuno
     che cade, che è l'unica cosa che si vuole sentire senza guardare */
  if (ev.includes('morte')) suono.boom()
  else if (montaggio.value) { /* il resto tace */ }
  else if (ev.includes('colpo')) suono.sparo()
  else if (ev.includes('apre')) suono.compra()
  else if (ev.includes('presa')) suono.moneta()
  else if (ev.includes('segnale')) suono.vita()
  /* LA VISTA NON INSEGUE PIÙ NESSUNO. Prima a ogni passo la camera
     saltava sull'unità di turno, e con più unità in movimento la mappa
     scattava avanti e indietro: si perdeva il filo di quello che stava
     succedendo proprio mentre lo si voleva guardare. Adesso la scena
     sta ferma e la si guarda tutta — il campo al via si porta
     all'ingrandimento in cui la mappa ci sta intera, e spostarsi è una
     cosa che si fa col dito quando si vuole. */
  if (mondo.traccia.filter(r => r.esito === 'no').length > rosseP) suono.no()
  tic.value++
  if (mondo.finita) chiudiVariante()
}
function chiudiVariante () {
  const e = esiti.value.slice(); e[serieI.value] = mondo.vinto; esiti.value = e
  /* Vinta questa scena, LE ALTRE SI GIOCANO A SCHERMO. Per un pezzo si
     provavano di nascosto — `esegui()` su un mondo nuovo, migliaia di
     volte più svelto di un fotogramma — e vinte tutte si andava dritti
     al velo. Il conto tornava e la soddisfazione no: il bambino aveva
     appena scritto un piano per tre mondi e ne vedeva uno. «Ha retto in
     tre situazioni» era una cosa che gli veniva detta, non una cosa che
     aveva visto; e senza vederla non sa se quel giro di ronda in più
     serviva davvero o l'ha scritto per niente.

     Adesso la scena dopo comincia da sé, col cartello che dice cosa
     cambia e a passo svelto, e si guarda lo stesso piano cavarsela in
     un mondo che non è quello di prima. La scena che cede si comporta
     come sempre, perché è sempre stata così: si vede cadere. */
  if (mondo.vinto && serieI.value < prove.value - 1) { prossimaScena(); return }
  cambio.value = null
  montaggio.value = false
  auto.value = false
  if (mondo.vinto && e.filter(Boolean).length === prove.value) vittoria()
  else {
    suono.fine()
    const c = mondo.colpevole
    if (c && piano.value[c.unita]) { unitaOra.value = c.unita; letta.value = null }
    else if (c) letta.value = c.unita
    /* Il piano non ha retto: si dice PERCHÉ e si riparte con un tocco.
       Prima bisognava premere ⏹ a mano prima di poter toccare un ordine,
       e nessuno capiva di doverlo fare: la scena restava lì ferma e il
       gioco sembrava bloccato. Il cartello riporta le unità al loro
       posto — gli ordini scritti non si toccano, quelli sono il lavoro. */
    andato.value = { motivo: mondo.motivo || 'Il piano non ha retto.',
                     chi: c && c.unita, quando: mondo.passi }
  }
}

/* ── la scena dopo ──
   Il cartello dice cosa cambia e resta il tempo di leggerlo, poi la
   scena parte da sola. Meno dei due secondi e due di prima: quello era
   il tempo giusto per un cartello che annunciava l'unica scena rimasta
   da giocare, ed è troppo per il secondo di tre. */
function prossimaScena () {
  suono.ok()
  const k = serieI.value + 1
  montaggio.value = true
  auto.value = false                 // ferma sotto il cartello: riparte lei
  cambio.value = { n: k + 1, quante: prove.value, testo: cosaCambia(liv.value, k) }
  fermaAttesa()
  attesaCambio = setTimeout(() => {
    attesaCambio = 0
    cambio.value = null
    nuovoMondo(k)
    campo.value?.mostraTutto()       // la prova si guarda intera, come la partita
    auto.value = true
  }, 1500)
}

/* ── salta ──
   Non salta il giudizio: le scene che restano si giocano lo stesso, ma
   senza schermo — è il modo di prima, che resta per chi ha già capito e
   vuole il risultato. Se una cede si va a vederla, perché quella è
   l'unica che vale davvero la pena guardare. */
function saltaMontaggio () {
  fermaAttesa()
  montaggio.value = false; auto.value = false; cambio.value = null
  let ceduta = -1
  for (let k = serieI.value; k < prove.value; k++) {
    if (esiti.value[k] === true) continue
    const r = esegui(creaMondo(liv.value, liv.value.varianti[k]), piano.value)
    caduttiFondo = Math.max(caduttiFondo, r.perdute || 0)
    const e = esiti.value.slice(); e[k] = r.vinto; esiti.value = e
    if (!r.vinto) { ceduta = k; break }
  }
  if (ceduta === -1) { vittoria(); return }
  cambio.value = { n: ceduta + 1, quante: prove.value, testo: cosaCambia(liv.value, ceduta) }
  attesaCambio = setTimeout(() => {
    attesaCambio = 0
    cambio.value = null
    nuovoMondo(ceduta)
    campo.value?.mostraTutto()
    auto.value = true
  }, 1500)
}

function vittoria () {
  suono.livello()
  const n = quantiOrdini.value
  /* «avanzato» vuol dire che nel piano c'è un ciclo, un evento o una
     decisione — e conta anche se sta dentro un ramo o dentro un ascolto */
  const dentroTutto = l => (l || []).flatMap(o => eBlocco(o)
    ? [o, ...dentroA(o).flatMap(dentroTutto)]
    : [o, ...dentroTutto(o.allora)])
  const avanzato = dentroTutto(Object.values(piano.value).flat()).some(eAvanzato)
  /* Due cose costano il vanto, non il passaggio: un aiuto pagato e un
     compagno lasciato sul campo. Si vince lo stesso — l'esca a volte è
     la mossa giusta — ma con una stella invece di due, se no mandare
     avanti qualcuno a morire sarebbe gratis. */
  const caduti = Math.max(mondo ? perdute(mondo) : 0, caduttiFondo)
  const dentroPar = n <= par.value && !pagato.value && caduti === 0
  const conto = { ordini: dentroPar ? n : Math.max(n, par.value + 1), par: par.value, avanzato }
  /* la vittoria va segnata dove è stata presa: le prove hanno la loro
     fila, un capitolo ha la sua storia. Il metro è lo stesso. */
  if (nav.inStoria())
    superaCapitolo(contesto.value.storia, contesto.value.n, conto)
  else genCompleta(L.value, QUANTI, conto)
  finito.value = { ordini: n, dentroPar, caduti }
}

/* ═══════════ il battito ═══════════
   Un giro solo per tutto: se la partita cammina da sola e il momento è
   arrivato, si fa un passo; poi si ridisegna. Il disegno vero lo fa il
   campo — qui si dice soltanto quando. */
let ultimoPasso = 0
function giro (ts) {
  if (mondo && fase.value === 'gioco') {
    if (auto.value && !mondo.finita && ts - ultimoPasso >= battito.value) fai1()
    campo.value?.disegna()
  }
  raf = requestAnimationFrame(giro)
}

/* ═══════════ un dito sulla mappa ═══════════
   Il campo dice quale casella è stata toccata; cosa voglia dire
   toccarla lo sa solo qui, perché dipende da cosa si sta facendo:
   comporre un giro di ronda, mirare il bersaglio di un verbo, o
   guardare in faccia qualcuno. */
function tocca ({ x, y }) {
  /* IL TOCCO È L'ORDINE. Nessuna conferma: quello che hai scelto si
     legge subito nella riga («vai a [🔑 la chiave]»), e se hai sbagliato
     tocchi la casella e cambi bersaglio. Una conferma proteggeva da un
     errore che si corregge in un tocco, e ne chiedeva uno ogni volta. */
  if (scegliendo.value) {
    const { verbo } = scegliendo.value
    const b = bersagli().find(t => t.x === x && t.y === y)
    /* una cella qualsiasi vale come bersaglio se il verbo la accetta:
       «vai lì» dietro quel muro è una mossa legittima, e non c'è nessun
       nome da scegliere in una lista — c'è un posto da indicare */
    const id = b ? b.id
              : (VERBI[verbo].accetta.includes('cella') && libera(mondo, x, y)) ? x + ',' + y
              : null
    if (!id) { suono.nota(180, 160, 0.07, 'square', 0.05); return }
    scegliendo.value = null
    editor.value?.posaBersaglio(id)
    return
  }
  const u = mondo.unita.find(z => z.eInPiedi() && z.x === x && z.y === y)
  if (!u) return
  if (piano.value[u.id]) { unitaOra.value = u.id; letta.value = null }
  else letta.value = letta.value === u.id ? null : u.id
  scheda.value = u.id; pannello.value = 'scheda'
}

/* ═══════════ scegliere il bersaglio sulla mappa ═══════════
   L'editor sa comporre un ordine ma non sa indicare una casella: quando
   gli serve un bersaglio lo chiede qui (`@mira`), si accendono le cose
   che quel verbo può prendere davvero, e il dito sceglie. Non c'è
   nessuna conferma: quello che hai toccato si legge subito nella riga,
   e se hai sbagliato ritocchi la casella e cambi. */
/* UN TOCCO, UNA COSA. Anche i punti di una ronda si chiedono uno per
   uno: prima c'era una modalità che li raccoglieva in fila e si
   chiudeva con «fatto», e quel tasto era l'unico posto del gioco dove
   bisognava dire «ho finito» invece di vedere quello che avevi
   scritto. Adesso la lista dei punti sta nel piano, e qui resta solo il
   mestiere di far indicare UNA casella. */
const scegliendo = ref(null)          // { verbo } — un verbo in cerca di bersaglio
function chiediMira ({ verbo }) {
  pannello.value = ''
  scegliendo.value = { verbo }
}
/* dove sono adesso le cose che il verbo in corso può prendere: la lista
   la fa `generale/bersagli.js`, qui si dice solo per quale verbo */
const bersagli = () =>
  (scegliendo.value ? bersagliDi(mondo, scegliendo.value.verbo) : [])
const esci = () => { scegliendo.value = null; editor.value?.nienteMira() }


/* ═══════════ il piano ═══════════
   Gli ordini di un'unità si scrivono in `generale/EditorPiano.vue`, e
   le regole di come si tiene in piedi una fila stanno in
   `generale/piano.js`, senza Vue e senza schermo. Qui resta una cosa
   sola: l'editor non sa indicare col dito una casella della mappa, e
   quando gli serve la chiede — `@mira` accende i bersagli, e quello che
   il dito sceglie torna indietro con `posaBersaglio`/`posaGiro`. */
const ordini = computed(() => piano.value[unitaOra.value] || [])

/* i giri da far vedere sulla mappa. Qui si dicono i NOMI dei punti; a
   trasformarli in pixel ci pensa il campo, che è l'unico a sapere dov'è
   finita la camera.
   Non c'è più un giro «che si sta componendo»: i punti stanno
   nell'ordine dal momento in cui li tocchi, quindi il giro sulla mappa
   cresce da sé mentre lo scrivi, ed è lo stesso disegno di quando è
   finito — una cosa in meno da tenere in piedi. */
const giri = computed(() => {
  tic.value
  if (!mondo) return []
  const out = []
  const agg = (punti, ora) => { if (punti && punti.length) out.push({ punti, ora }) }
  const daOrdini = lista => (lista || []).forEach(o => {
    /* IL GIRO DA DISEGNARE lo si legge dentro il ciclo: sono i `vai`
       che ha nel corpo, in fila. Prima era una lista di punti dentro un
       verbo; adesso è un blocco di ordini, e la mappa continua a
       mostrare la stessa cosa — dove passerà. */
    if (eRipeti(o)) {
      agg(corpoDi(o).filter(q => q && q.verbo === 'vai').map(q => q.complemento).filter(Boolean),
          !!scegliendo.value)
      corpoDi(o).forEach(q => daOrdini([q]))
      return
    }
    if (eCondizione(o)) { RAMI.forEach(r => daOrdini(ramoDi(o, r.ramo))); return }
    if (o.allora) daOrdini(o.allora)
  })
  if (letta.value && ordiniAltrui.value) daOrdini(ordiniAltrui.value)
  else if (!letta.value) daOrdini(ordini.value)
  return out
})

/* quello che a un ordine manca ancora: lo dice il motore, ed è la stessa
   risposta per la riga (che si segna) e per ▶ (che non parte) */
const incompleti = computed(() => {
  tic.value
  if (!mondo) return []
  /* il mondo deve sapere che azioni ci sono scritte, se no «esegui
     [azione 1]» sembra un ordine senza bersaglio e ▶ non parte */
  raccogliRoutine(mondo, piano.value)
  const out = []
  for (const id in piano.value)
    for (const o of ogniVoce(piano.value[id])) {
      const m = manca(mondo, o)
      if (!m) continue
      const come = eCondizione(o) ? BLOCCHI.condizione.nome
                 : VERBI[o.verbo] ? VERBI[o.verbo].nome : o.verbo
      out.push({ chi: id, verbo: come, m })
    }
  return out
})


/* le unità del giocatore e quelle di cui si possono leggere gli ordini */
const mieie = computed(() => (mondo ? mieUnita(liv.value) : []))
/* ── LA FILA IN FONDO È «CHI C'È» ──
   Tutti quelli che non comandi, anche chi non ha un piano: se non sta
   qui non lo si può toccare, e la sua scheda non la legge nessuno.
   Quelli di cui si può leggere il piano restano un elenco a parte
   (`altruiUnita`), ed è quello che il gettone della spia scopre. */
const altrui = computed(() => (mondo ? altriInCampo(liv.value) : []))
const conPiano = computed(() => (mondo ? altruiUnita(liv.value) : []))
const unita = id => (mondo ? mondo.perId[id] : null)
const ordiniAltrui = computed(() => {
  if (!letta.value || !mondo) return []
  if (!scoperte.value.includes(letta.value)) return null
  return pianoCompleto(mondo || liv.value, {})[letta.value] || []
})
/* gli ordini di un altro, appiattiti per essere LETTI: un bivio diventa
   la sua domanda e poi le due strade rientrate, che è come si racconta a
   parole. Qui non si tocca niente — si deduce. */
function intercetta () {
  const nascoste = conPiano.value.filter(u => !scoperte.value.includes(u))
  if (!gettoni.value || !nascoste.length) return
  gettoni.value--
  scoperte.value = [...scoperte.value, nascoste[0]]
  letta.value = nascoste[0]
  suono.moneta()
}

/* il registro: quello che si è visto succedere, riga per riga */
const righeRegistro = computed(() => {
  tic.value
  if (!mondo) return []
  return registro(mondo).filter(r => piano.value[r.unita] || scoperte.value.includes(r.unita) || r.visto)
    .slice(-60)
    .map(r => ({ ...r, testo: (piano.value[r.unita] || scoperte.value.includes(r.unita)) ? r.testo : r.fatto }))
})
const rosse = computed(() => { tic.value; return mondo ? mondo.traccia.filter(r => r.esito === 'no').length : 0 })
function riavvolgi (t) {
  auto.value = false
  const k = serieI.value
  nuovoMondo(k)
  for (let n = 0; n < t && !mondo.finita; n++) passo(mondo)
  /* riavvolgere non è camminare: si ricompare fermi al momento scelto,
     senza la scivolata di chi ha appena fatto un passo */
  campo.value?.fermaAnimazione()
  tic.value++
}

/* l'avviso vale finché il pezzo manca davvero */
const avvisoOra = computed(() => (manchevole.value && incompleti.value.length ? manchevole.value : ''))
const dritta = computed(() => {
  tic.value
  /* l'avviso se ne va da solo appena il pezzo mancante c'è: non si
     chiede a nessuno di chiudere un cartello per liberare la strada */
  if (avvisoOra.value) return '⚠ ' + avvisoOra.value
  if (!mondo) return ''
  if (mondo.finita && !mondo.vinto) return '💥 ' + mondo.motivo
  if (mondo.finita && mondo.vinto) return '✔ Battaglia ' + (serieI.value + 1) + ' vinta.'
  /* ── E COSA CAMBIA IN QUESTA, PRIMA DI FIRMARE ──
     Sta qui e non in una striscia sua: la riga dell'obiettivo è dove si
     guarda per sapere cosa si deve ottenere, e «stavolta l'orco arriva
     da tramontana» è la seconda metà della stessa domanda. Compare solo
     da fermi e solo dove le battaglie sono più d'una — durante la
     partita quella riga serve a dire com'è andata. */
  if (prove.value > 1 && !auto.value && !montaggio.value)
    return liv.value.dritta +
      ` <i class="quale">· battaglia ${serieI.value + 1}: ${cosaCambia(liv.value, serieI.value)}</i>`
  return liv.value.dritta
})
const listaAiuti = computed(() => (liv.value.aiuti || []).slice(0, aiuti.value))
function chiediAiuto () {
  if (aiuti.value > 0) pagato.value = true
  aiuti.value++
  suono.nota(700, 700, 0.1)
}

function avanti () { finito.value = null; auto.value = false; nav.avanti() }
/* uscire dalla partita ferma la scena e chiude i fogli aperti: il resto
   — dove si torna — lo sa la navigazione */
function torna () { auto.value = false; pannello.value = ''; indietro() }

onMounted(() => {
  raf = requestAnimationFrame(giro)
  window.addEventListener('resize', ridimensiona)
  window.__gen = { apri, apriStoria, apriCapitolo, via, unPasso, ferma, riavvolgi,
                   piano, LIVELLI, fase, L, storiaOra, contesto, esiti, finito, cambio,
                   montaggio, saltaMontaggio, serieI,
                   mondo: () => mondo, scegliendo, unitaOra,
                   /* dove sta una cella sullo schermo: serve ai test per
                      toccare il bersaglio come lo tocca un dito */
                   dove: (x, y) => campo.value.puntoDi(x, y) }
})
onUnmounted(() => {
  cancelAnimationFrame(raf); fermaAttesa()
  window.removeEventListener('resize', ridimensiona)
})
async function ridimensiona () {
  if (fase.value !== 'gioco') return
  await campo.value?.misura(); campo.value?.disegna()
}
</script>

<template>
  <div class="schermo generale">
    <Barra :titolo="fase === 'gioco' ? liv.nome : titolo" @indietro="torna">
      <template v-if="fase === 'gioco'">
        <!-- il numero della prova serve solo alle prove: dentro una
             storia il capitolo ce l'ha scritto nel titolo, e la barra di
             un telefono da 390 non tiene un gettone in più -->
        <div v-if="!nav.inStoria()" class="gettone mini">🎖️ <b>{{ numeroTappa }}</b></div>
        <div class="gettone mini">📜 <b>{{ quantiOrdini }}</b><i>· par {{ par }}</i></div>
        <!-- le scene: numerate, così si sa a quale si è e quali sono
             già passate. Erano tre pallini vuoti e non diceva niente. -->
        <!-- ── E SONO ANCHE IL SELETTORE ──
             Dicevano già «a quale battaglia siamo, e quali sono
             passate»: farci anche sfogliare non aggiunge niente da
             capire, e toglie di mezzo la striscia con le frecce che
             stava sopra al campo (e ne rubava i tocchi). Da fermi si
             tocca un numero e si guarda quella situazione: il piano
             scritto resta, ed è il punto — lo stesso piano, un'altra
             battaglia. Mentre gira non si tocca: la scena la decide il
             gioco, in ordine. -->
        <div v-if="prove > 1" class="prove"
             :title="auto || montaggio ? '' : 'tocca un numero per guardare quella battaglia'">
          <button v-for="n in prove" :key="n" :disabled="auto || montaggio"
                  :aria-label="'guarda la battaglia ' + n" @click="guarda(n - 1)"
                  :class="{ presa: esiti[n - 1] === true, persa: esiti[n - 1] === false,
                            ora: n - 1 === serieI && !esiti[n - 1] }">{{ esiti[n - 1] === true ? '✓' : n }}</button>
        </div>
        <div class="gettone mini stelline">{{ '⭐'.repeat(stelle) || '☆' }}</div>
      </template>
    </Barra>

    <!-- ════════ SCEGLI L'AVVENTURA ════════ -->
    <SceltaAvventura v-if="fase === 'avventure'"
                     @apri="apriStoria" @prove="fase = 'prove'" />

    <!-- ════════ I CAPITOLI DI UNA STORIA ════════ -->
    <MappaCapitoli v-else-if="fase === 'capitoli'" :storia-id="storiaOra"
                   @apri="apriCapitolo" />

    <!-- ════════ LE PROVE, I QUATTORDICI SCIOLTI ════════ -->
    <ElencoProve v-else-if="fase === 'prove'" @apri="apri" />

    <!-- ════════ IL GIOCO ════════ -->
    <template v-else>
      <!-- il campo: canvas, camera, animazione e dito stanno tutti là
           dentro. Qui si dice solo cosa c'è da far vedere. -->
      <!-- la scivolata dura quanto il passo: nel montaggio i passi sono
           più fitti, e un'andatura tarata su 420 ms resterebbe indietro
           mostrando le unità a metà casella per tutto il tempo -->
      <CampoLivello ref="campo" :mondo-ora="mondoOra" :liv="liv" :vel="battito" :tic="tic"
                    :giri="giri" :bersagli="bersagli()" :mirando="!!scegliendo"
                    :mie="mieie" :aperta="pannello === 'scheda' ? (scheda || '') : ''"
                    @tocca="tocca">
        <!-- fra una scena e l'altra: cosa è cambiato -->
        <CartelloScena v-if="cambio" v-bind="cambio" />

        <!-- IL MONTAGGIO. Le scene che restano si giocano da sole e
             svelte: la striscia dice quale si sta guardando e perché è
             diversa, che è tutto quello che serve sapere mentre scorre.
             «salta» sta lì dentro perché è l'unica cosa da fare qui: il
             piano non si tocca mentre gira, e il tasto grande sotto
             ferma tutto invece di andare avanti. -->
        <div v-if="montaggio && !cambio" class="montaggio">
          <div class="che">
            <span class="et">prova {{ serieI + 1 }} di {{ prove }} · lo stesso piano</span>
            <b>stavolta {{ cosaCambia(liv, serieI) }}</b>
          </div>
          <button class="salta" @click="saltaMontaggio">salta →</button>
        </div>
      </CampoLivello>

      <!-- Mentre si sceglie: la striscia dice cosa si sta facendo. Non è
           una conferma — il tocco fa già l'ordine — ma la via d'uscita e,
           per il giro di ronda, i punti presi finora. Sta SOTTO la mappa:
           sopra coprirebbe proprio le caselle da toccare. -->
      <div v-if="scegliendo" class="scelta">
        <!-- se il verbo prende anche una casella, si dice: le cose con
             un nome si accendono, un punto qualsiasi no, e senza una
             riga nessuno scopre che si può indicare anche il vuoto -->
        <div class="dett">tocca sulla mappa il bersaglio di
          <b>{{ VERBI[scegliendo.verbo].et }} {{ VERBI[scegliendo.verbo].nome }}</b>
          <i v-if="VERBI[scegliendo.verbo].accetta.includes('cella')">— o un punto qualsiasi</i></div>
        <button class="no" aria-label="annulla" @click="esci">✕</button>
      </div>

      <p class="dritta" :class="{ male: (mondo && mondo.finita && !mondo.vinto) || !!avvisoOra,
                                  bene: mondo && mondo.finita && mondo.vinto }" v-html="dritta"></p>

      <div class="comandi">
        <!-- il tasto grande dice cosa fa premendolo, e non c'è nient'altro
             da decidere: «un passo» era una scorciatoia da grandi, e
             «da capo» faceva la stessa cosa che fa Stop -->
        <!-- durante il montaggio il tasto resta «Stop» anche nel mezzo
             secondo di cartello in cui la scena è ferma: lì dentro sta
             girando il livello, e un «Via» offerto in quell'istante
             rimetterebbe tutto alla prima scena proprio mentre si sta
             guardando la seconda -->
        <button class="tasto via" :class="{ gira: auto || montaggio }" @click="via">
          {{ auto || montaggio ? '⏹ Stop' : '▶ Via' }}</button>
        <button v-if="liv.mostraNemici === 'gettoni'" class="tasto q spia"
                aria-label="intercetta" @click="intercetta">🕵<b>{{ gettoni }}</b></button>
        <button class="tasto q" :class="{ qui: pannello === 'cartello' }" aria-label="spiegazione"
                @click="pannello = pannello === 'cartello' ? '' : 'cartello'">💡</button>
        <button class="tasto q registro" :class="{ qui: pannello === 'registro' }"
                aria-label="registro" @click="pannello = pannello === 'registro' ? '' : 'registro'">
          📜<span v-if="rosse" class="pallo">{{ rosse }}</span></button>
      </div>

      <!-- chi comanda: una pastiglia per unità -->
      <div class="chi">
        <button v-for="id in mieie" :key="id" :class="{ qui: id === unitaOra && !letta }"
                @click="unitaOra = id; letta = null">
          {{ unita(id).emoji }} {{ unita(id).nome }}
          <b>{{ (piano[id] || []).length }}</b>
        </button>
        <button v-for="id in altrui" :key="'a' + id" class="nemico" :class="{ qui: letta === id }"
                @click="letta = letta === id ? null : id">
          {{ scoperte.includes(id) ? '👁' : '🔒' }} {{ unita(id).emoji }} {{ unita(id).nome }}
        </button>
      </div>

      <!-- ═════ GLI ORDINI FIRMATI ═════
           Si scrivono in `EditorPiano.vue`: una riga per ordine, fatta
           di caselle che si toccano, e in fondo a ogni fila il posto
           vuoto da cui ne nasce un altro. -->
      <EditorPiano v-if="!letta" ref="editor" :ordini="ordini" :mondo-ora="mondoOra"
                   :tic="tic" :unita-ora="unitaOra" @mira="chiediMira" />

      <!-- ═════ GLI ORDINI DI QUALCUN ALTRO ═════
           Lo stesso componente del proprio piano, che non si tocca. Ne
           esisteva una seconda versione qui dentro, più povera: sapeva
           disegnare gli ordini e i bivi e basta, quindi un ciclo la
           faceva esplodere e le azioni non le avrebbe mai viste. Una
           forma nuova del linguaggio deve costare una riga in un posto
           solo — e in regalo, del piano nemico si vede anche QUALE RIGA
           sta correndo adesso. -->
      <section v-else-if="!ordiniAltrui" class="lista">
        <div class="vuoto">I suoi ordini non li conosci. Puoi
          <b>dedurli</b> guardando cosa fa: apri il <b>registro 📜</b>.
          <template v-if="liv.mostraNemici === 'gettoni'">Oppure spendi un gettone 🕵 e li
          leggi — il livello si vince anche senza spenderne nessuno.</template></div>
      </section>
      <EditorPiano v-else sola :ordini="ordiniAltrui" :mondo-ora="mondoOra"
                   :tic="tic" :unita-ora="letta" />

      <!-- ═════ I FOGLI ═════
           Registro, spiegazione, scheda ed elenco dei nomi: si aprono
           SOPRA la lista e non sopra i comandi — un avviso che copre i
           verbi è un avviso che ti impedisce di fare la cosa che ti sta
           suggerendo. Il disegno sta tutto in `FogliLivello.vue`. -->
      <FogliLivello :quale="pannello" :liv="liv" :mondo-ora="mondoOra"
                    :righe="righeRegistro" :aiuti-dati="liv.aiuti || []" :aiuti="aiuti"
                    :pagato="pagato" :scheda="scheda || ''" :mia="!!piano[scheda]"
                    @chiudi="pannello = ''" @riavvolgi="riavvolgi" @aiuto="chiediAiuto" />

      <!-- ═════ NON HA RETTO ═════
           Si dice cosa è andato storto e si riparte con un tocco: le
           unità tornano al loro posto, gli ordini restano. -->
      <div v-if="andato" class="andato" @click="ferma()">
        <div class="dentro">
          <span class="bum">💥</span>
          <div class="txt">
            <b>Il piano non ha retto</b>
            <small>{{ andato.motivo }}</small>
          </div>
          <span class="ri">↻ riprova</span>
        </div>
      </div>

      <!-- ═════ IL VELO DI FINE ═════ -->
      <div v-if="finito" class="velo">
        <div class="urlo">{{ finito.dentroPar ? '🏅' : '🎖️' }}</div>
        <h2>{{ finito.dentroPar ? 'Piano elegante!' : 'Il piano regge!' }}</h2>
        <div class="stelline grandi">{{ finito.dentroPar ? '⭐⭐' : '⭐' }}</div>
        <!-- non «hai vinto tre volte»: il piano ha retto in tre mondi
             diversi, ed è quello che il gioco sta insegnando -->
        <p v-if="prove > 1" class="tenute">Il tuo piano ha retto in
          <b>{{ prove }} situazioni diverse</b>:
          <i v-for="(s, k) in nomiScene(liv, prove)" :key="k">✓ {{ s }}</i></p>
        <p>Ha funzionato
          con <b>{{ finito.ordini }} ordin{{ finito.ordini === 1 ? 'e' : 'i' }}</b>.
          Il par è <b>{{ par }}</b>.
          {{ finito.caduti ? (finito.caduti === 1 ? 'Ma uno dei tuoi è rimasto sul campo: questa vale una stella. Portali a casa tutti, e sono due.'
                                                  : `Ma ${finito.caduti} dei tuoi sono rimasti sul campo: questa vale una stella. Portali a casa tutti, e sono due.`)
             : pagato ? 'Hai chiesto un aiuto: questa vale una stella. Rifallo senza, e sono due.'
             : finito.dentroPar ? 'Non si poteva fare più corto.' : 'C’è un modo più corto: cercalo.' }}</p>
        <div class="due">
          <button class="grigio" @click="finito = null; ferma()">Riprova</button>
          <button @click="avanti">{{ dopo ? 'Avanti →' : 'Torna alla mappa' }}</button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.generale { background:linear-gradient(180deg,#eef2f8,#e6ecf6) }

/* le tre schermate di prima del gioco — scelta dell'avventura, capitoli
   di una storia, prove sciolte — hanno il loro file in `views/generale/`,
   e si portano dietro il loro stile */

/* la striscia di quando si sta mirando un bersaglio */
/* la striscia del montaggio: sta SOPRA la mappa e non la spinge in giù —
   il campo è già inquadrato per starci tutto, e una striscia che ruba
   altezza gli farebbe rimpicciolire le celle a metà scena. Per lo stesso
   motivo è translucida: sotto ci passano le unità che si stanno
   guardando. */
.montaggio { position:absolute; top:0; left:0; right:0; z-index:14;
             pointer-events:none;          /* come la striscia dello sfoglio */
             display:flex; align-items:center; gap:8px; padding:7px 9px;
             background:linear-gradient(180deg,#101828e8,#10182800);
             animation:entra-su .22s ease }
.montaggio .che { flex:1; min-width:0; display:flex; flex-direction:column; gap:1px }
.montaggio .et { font-size:9.5px; font-weight:900; letter-spacing:.7px;
                 text-transform:uppercase; color:var(--giallo) }
.montaggio b { font-size:13px; line-height:1.25; color:#eef2fa;
               overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
.montaggio .salta { flex:none; min-height:34px; border-radius:11px; padding:0 12px;
                    font-size:12.5px; font-weight:900; color:#eef2fa; background:#ffffff26 }
.montaggio .salta { pointer-events:auto }
.montaggio .salta:active { transform:translateY(1px) }
@keyframes entra-su { from { opacity:0; transform:translateY(-6px) } to { opacity:1 } }



.scelta { flex:none; display:flex; align-items:center; gap:7px; padding:6px 8px;
          background:#101828; border-bottom:2px solid var(--giallo) }
.scelta .dett { flex:1; min-width:0; font-size:12px; line-height:1.25; color:#eef2fa }
.scelta .dett b { color:var(--giallo) }
.scelta .dett i { font-style:normal; color:#aeb9cf }
.scelta button { flex:none; min-height:38px; border-radius:11px; padding:0 12px; font-size:13px;
                 font-weight:900 }
.scelta .ok { background:var(--verde); color:#06210f }
.scelta .no { width:38px; background:#ffffff22; color:#fff }

.dritta { flex:none; margin:0; padding:5px 12px; font-size:12px; line-height:1.35;
          color:var(--tenue); background:#ffffff9c; min-height:30px }
.dritta.male { color:#a8322c; background:#ffe6e3 }
.dritta.bene { color:#1c6b3f; background:#dff5e6 }

/* ── i comandi ── */
.comandi { flex:none; display:flex; gap:6px; padding:6px 8px }
.tasto { height:42px; border-radius:13px; background:#ffffffcc; font-size:15px; font-weight:900;
         color:var(--viola-scuro); box-shadow:0 3px 0 #dde3ea; display:grid; place-items:center }
.tasto:active { transform:translateY(2px); box-shadow:none }
.tasto.via { flex:1; background:linear-gradient(180deg,#6fd39a,#41b878); color:#06280f;
             box-shadow:0 3px 0 #2b8a53 }
.tasto.via.gira { background:linear-gradient(180deg,#f0a09a,#e0554d); color:#fff; box-shadow:0 3px 0 #a83b34 }
.tasto.q { width:44px; flex:none; position:relative }
.tasto.qui { background:var(--giallo) }
.tasto .pallo { position:absolute; top:-4px; right:-4px; min-width:17px; height:17px; border-radius:9px;
                background:#e0554d; color:#fff; font-size:10.5px; line-height:17px; font-weight:900 }
.spia b { font-size:11px }

/* ── chi comanda ── */
/* ── SI VEDONO TUTTI, SENZA SCORRERE ──
   Era una riga sola con `overflow-x:auto`: con quattro personaggi in
   campo il quarto finiva oltre il bordo e non lo trovava nessuno — «il
   guardiano non me lo mostra fra i tab». Una fila che scorre nasconde
   senza dirlo; una che va a capo no, e due righe di pastiglie costano
   trenta pixel. */
.chi { flex:none; display:flex; flex-wrap:wrap; gap:5px; padding:0 8px 4px }
.chi::-webkit-scrollbar { display:none }
.chi button { flex:none; min-height:32px; border-radius:11px; padding:0 9px; font-size:11.5px;
              font-weight:800; background:#ffffffaa; color:var(--tenue) }
.chi button.qui { background:#fff; color:var(--viola-scuro); box-shadow:inset 0 0 0 2px var(--giallo) }
.chi button b { margin-left:4px; font-size:10.5px; color:var(--tenue) }
.chi button.nemico { background:#ffe9e6; color:#9a3a33 }

/* ── la lista, quando si LEGGONO gli ordini di un altro ──
   Gli ordini che si scrivono se li disegna `EditorPiano.vue`, con il
   suo stile. Qui resta il piano di qualcun altro, che è un'altra cosa:
   si legge appiattito, senza caselle da toccare, perché non c'è niente
   da toccare — si deduce. */
.lista { flex:1; min-height:0; overflow-y:auto; padding:0 10px 8px }
.vuoto { font-size:12px; line-height:1.45; color:var(--tenue); padding:8px 4px }
.ordi { position:relative }
.riga { display:flex; align-items:center; gap:7px; min-height:42px; border-radius:12px;
        padding:5px 9px; background:var(--carta); margin:4px 0; border-left:5px solid #c6cfdd;
        box-shadow:0 2px 0 #dde3ea }
.riga .ico { font-size:16px; flex:none }
.riga .lab { flex:none; font-size:12px; color:var(--tenue); font-weight:800 }
.riga .chip { flex:1; min-width:0; font-size:12.5px; font-weight:900; color:var(--viola-scuro);
              white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.riga.altrui { background:#f4f6fa }
.riga.moto { border-left-color:#4a86e8 }
.riga.azione { border-left-color:#e8a33f }
.riga.ciclo { border-left-color:#3fb872 }
.riga.attesa { border-left-color:#b06be0 }
.riga.msg { border-left-color:#e0554d }
.riga.scelta { border-left-color:#8a63d2; background:#f6f2ff }
.capoAltrui { font-size:10.5px; font-weight:900; letter-spacing:.4px; text-transform:uppercase;
              color:#6b52ab; padding:4px 2px 0 }
.capoAltrui.niente { text-transform:none; letter-spacing:0; font-weight:700; color:var(--tenue) }

/* il cartello di quando il piano non ha retto: si tocca e si riparte */
.andato { position:fixed; left:0; right:0; bottom:0; z-index:40; padding:10px 12px 16px;
          background:linear-gradient(#0000, #0b1020cc 38%); cursor:pointer }
.andato .dentro { display:flex; align-items:center; gap:11px; max-width:520px; margin:0 auto;
                  background:#fff; border-radius:15px; padding:11px 13px;
                  box-shadow:0 8px 26px #0006; border-left:5px solid #d0503f }
.andato .bum { font-size:23px; flex:none }
.andato .txt { flex:1; min-width:0; display:grid; gap:2px }
.andato .txt b { font-size:14.5px; color:var(--viola-scuro) }
.andato .txt small { font-size:12px; color:var(--tenue); line-height:1.35 }
.andato .ri { flex:none; font-size:12.5px; font-weight:900; color:#4a86e8;
              background:#eef2fb; border-radius:9px; padding:7px 10px }


/* ── il velo di fine ── */
.velo { position:absolute; inset:0; z-index:20; display:flex; flex-direction:column;
        align-items:center; justify-content:center; gap:12px; padding:24px; text-align:center;
        background:#eef2f8ee }
.velo .urlo { font-size:58px }
.velo .stelline.grandi { font-size:28px; letter-spacing:3px }
.velo p { margin:0; color:var(--tenue); font-size:13px; line-height:1.45; max-width:30ch }
.velo p.tenute { display:grid; gap:3px; font-size:12.5px; color:var(--viola-scuro) }
.velo p.tenute i { font-style:normal; font-size:11.5px; font-weight:800; color:#1c6b3f }
.velo .due { display:flex; gap:9px }
.velo button { min-height:48px; border-radius:14px; padding:0 20px; font-size:15px; font-weight:900;
               background:linear-gradient(180deg,#6fd39a,#41b878); color:#06280f;
               box-shadow:0 3px 0 #2b8a53 }
.velo button.grigio { background:#ffffffcc; color:var(--viola-scuro); box-shadow:0 3px 0 #dde3ea }

/* ── gli indicatori nella barra ── */
.gettone.mini { padding:4px 8px; font-size:12px; gap:3px; white-space:nowrap }
.gettone.mini i { font-style:normal; font-size:10.5px; color:var(--tenue) }
.gettone.mini.stelline { font-size:11px; letter-spacing:-1px }
.prove { display:flex; gap:3px; flex:none }
/* più grandi di prima: adesso si toccano, e sedici pixel non sono un
   bersaglio per un dito. Restano pastiglie, non tasti: non devono
   sembrare un comando in più da capire. */
.prove button { width:22px; height:22px; border-radius:50%; background:#ffffffcc;
           font-size:10.5px; font-weight:900; line-height:22px; text-align:center; padding:0;
           color:var(--tenue); box-shadow:inset 0 0 0 1.5px #c6cfdd }
.prove button:disabled { opacity:.85 }
.prove button:active:not(:disabled) { transform:translateY(1px) }
.prove button.presa { background:var(--verde); color:#06210f; box-shadow:none }
.prove button.persa { background:#e0554d; color:#fff; box-shadow:none }
.prove button.ora { background:var(--giallo); color:#3a2c00; box-shadow:none }
</style>
