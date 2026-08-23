<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA MANOPOLA DELL'ETÀ, CHE DICE COSA FA

   ── DA DOVE VIENE ────────────────────────────────────────────────
   C'erano due manopole per la stessa cosa, e in due posti diversi:
   quattro carte con scritto «prima o seconda / terza elementare» — che
   riscrivevano giochi, saperi ed età in blocco — e, dieci pixel più
   sopra, un `− 7,5 anni +` che spostava solo l'età. Niente le
   distingueva a guardarle, e la prima cancellava senza dirlo tutto
   quello che il grande aveva sistemato a mano.

   Il difetto vero però era un altro, e le carte lo nascondevano invece
   di risolverlo: **la tacca non diceva cosa fa**. «Terza elementare» ti
   dice a chi è rivolta la scelta, mai cosa cambia scegliendola — e
   siccome l'effetto (quali carte in home, quali domande) si vedeva solo
   uscendo e andando a guardare da un'altra parte, nessuno lo verificava.

   ── COS'È ADESSO ─────────────────────────────────────────────────
   Una manopola sola, in anni — che è l'unità vera di tutto il sistema:
   12,5 punti per anno, la stessa scala delle domande e delle campagne.
   Sotto, il quadro di quell'età (`data/quadro.js`): quante carte in
   home, cosa non si dà per scontato, come si spartiscono le domande. E
   appena si muove, **cosa è cambiato rispetto alla tacca di prima** —
   che è la riga che si legge davvero, perché nessuno confronta due
   elenchi: si guarda cosa si è mosso.

   ── DUE MESTIERI, UN COMPONENTE ──────────────────────────────────
   Lo usano il primo avvio (`Benvenuto.vue`, dove il bambino non esiste
   ancora) e la schermata dei grandi (dove esiste e ha le sue
   impostazioni). La differenza sta tutta in cosa gli si passa: le
   eccezioni di adesso, o niente. Il conto di cosa diventerebbero lo fa
   `spostandoLEta` in `data/partenze.js`, che è **la stessa funzione**
   che poi le scrive — se il riassunto lo calcolasse per conto suo
   direbbe una cosa e il salvataggio ne farebbe un'altra, e sarebbe
   peggio di nessun riassunto.

   ── NON SALVA NIENTE, E ADESSO NEMMENO DI NASCOSTO ───────────────
   Emette `scegli` e basta, e lo emette **una volta sola**: quando chi
   guarda ha deciso. Chi lo usa scrive.

   Con `conferma`, la tacca muove una **bozza** e il quadro sotto
   diventa l'anteprima di quell'età — quello che il primo avvio faceva
   già, perché lì un bambino da riscrivere non c'è. In fondo compare
   «Applica», appiccicato in basso finché la bozza è diversa.

   Prima, nella schermata dei grandi, si scriveva a ogni tacca; e
   quando lo spostamento cambiava fascia con delle scelte fatte a mano
   da difendere, la manopola si fermava ad aspettare un cartello che
   compariva **in fondo alla colonna**, cioè fuori dallo schermo. Da
   sopra si vedeva solo una freccia che smetteva di rispondere: si
   premeva tre volte e non succedeva niente. Adesso il patto è uno
   solo, ed è lo stesso nei due posti: si guarda, poi si conferma.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import Blocco from './Blocco.vue'
import Riga from './Riga.vue'
import Tacca from './Tacca.vue'
import Conferma from './Conferma.vue'
import Taratura from './Taratura.vue'
import InCasa from './InCasa.vue'
import Scuola from './Scuola.vue'
import { GRUPPI } from './gruppi.js'
import { usaBozzaEta } from './bozza.js'
import { anniInLettere, perdeInParole } from './lettere.js'
import { quadroDi, vannoMale } from '../../data/quadro.js'
import { partenzaPerEta, rimettendoLEta } from '../../data/partenze.js'
import { classiNude } from '../../quiz/catalogo.js'
import { contoDi, consiglioDa } from '../../quiz/consiglio.js'

const props = defineProps({
  /* gli anni di adesso, o `null` se non sono ancora stati scelti: è il
     caso del primo avvio, dove una risposta già data si premerebbe
     senza leggerla */
  anni: { type: Number, default: null },
  /* le eccezioni che il bambino ha adesso, nella forma di `settings` */
  giochi: { type: Object, default: () => ({}) },
  sa: { type: Object, default: () => ({}) },
  /* i ritocchi delle domande: non si vedono nel quadro, ma sono roba
     messa a mano e cambiando fascia se ne vanno — quindi vanno contati
     da chi dice cosa si perde */
  ritocchi: { type: Object, default: () => ({}) },
  sperimentali: { type: Boolean, default: false },
  /* ── I DUE MESTIERI, IN UN INTERRUTTORE ──
     `false` (il primo avvio): la tacca è del padre, che la tiene in un
     ref e conferma a modo suo — lì il tasto finale è «Si gioca!», e un
     «Applica» prima di quello sarebbe una conferma della conferma.
     `true` (la schermata dei grandi): la tacca muove una bozza, il
     quadro è l'anteprima di quell'età e in fondo compare «Applica».
     In tutti e due i casi `scegli` esce una volta sola, quando chi
     guarda ha deciso. */
  conferma: { type: Boolean, default: false },
  /* Dove atterra la **prima tacca**, quando un'età ancora non c'è. In
     fondo alla scala e non in mezzo: chi apre questa schermata sta
     aggiungendo un bambino, e un bambino che si aggiunge è quasi sempre
     il più piccolo di casa — il grande il gioco ce l'ha già. Partendo
     da metà si sale e si scende a caso; partendo da quattro si sale e
     basta, e si smette quando l'elenco comincia a dare per scontato
     qualcosa che non sa. */
  partenza: { type: Number, default: 4 },
  /* ── SI PUÒ ANCHE CORREGGERE, O SOLO GUARDARE ──
     Nel primo avvio no, ed è il caso più chiaro: il bambino non esiste
     ancora, quindi non c'è nessun profilo su cui scrivere un ritocco —
     e chi sta scegliendo l'età non ha ancora nessun motivo di dissentire
     da una taratura che non ha mai visto in azione. Nella schermata dei
     grandi sì: lì il quadro è di un bambino vero, e la ✎ di una riga
     apre la tacca (`Taratura.vue`). */
  tarabile: { type: Boolean, default: false },
  /* ── COM'È ANDATA FINORA, RIGA PER RIGA ──
     `state.profile.items`: per ogni tipologia quante ne ha prese e
     quante sbagliate. Il quadro dice **cosa gli arriva**, e da solo non
     dice mai la cosa che un grande cerca davvero — se quello che gli
     arriva stia funzionando. Una riga che va male porta il suo numero
     accanto al nome, con la stessa soglia dell'avviso in posta
     (`quiz/consiglio.js`): otto risposte almeno, meno di metà giuste.

     Vuoto nel primo avvio, ed è giusto: un bambino che non esiste
     ancora non ha sbagliato niente. */
  risposte: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['scegli', 'prova', 'ritocca', 'gioco', 'sapere', 'rimetti'])

/* ── PROVARE UNA VOCE DELL'ELENCO ──
   Un nome non basta, e non è colpa del nome: «le analogie fra figure»
   non dice a un grande che aspetto abbia la domanda, e senza vederla
   non può giudicare se sia roba da suo figlio. Il ▶ apre la domanda
   vera, generata dallo stesso modulo che la darebbe in partita — non
   una scritta a mano, che invecchierebbe da sola
   (`quiz/nucleo/esempi.js`).

   Chi lo mostra non apre niente: passa su. Il pannello è uno solo
   (`quiz/Prova.vue`) e vive nella schermata, perché la messa in scena
   di una domanda dev'essere la stessa da qualunque parte si arrivi.

   `.stop` non è pignoleria: il riquadro intero si apre e si chiude al
   tocco, quindi senza fermarlo il ▶ aprirebbe la domanda e nello
   stesso gesto richiuderebbe l'elenco da cui è stata chiesta. */
/* L'età viaggia con l'evento, e non è un di più: una classe è una
   domanda sola e si mostra com'è, ma un **gruppo di sapere** è largo —
   dal colpo d'occhio sui pallini ai numeri a tre cifre — e senza sapere
   di chi stiamo parlando il pannello pescherebbe in tutto il gruppo. A
   quattro anni usciva una domanda dichiarata otto e mezzo, cioè si
   chiedeva a un grande di giudicare se suo figlio sappia una cosa
   mostrandogli quello che a suo figlio non arriverà per anni. */
const provaClasse = r => emit('prova', { sorgente: r.sorgente, nome: r.nome, eta: anniVisti.value })
/* Il ▶ di un pezzo di scuola non pesca in tutto il gruppo: scorre **le
   sue domande di questa fascia**, che sono quelle che la riga sta
   dichiarando. È lo stesso `giro` della scheda delle domande — una
   lista di classi col contatore — e non un secondo modo di mostrare le
   stesse cose. Se pescasse nel gruppo intero, il ▶ della riga «sta
   imparando» aprirebbe anche quelle toste, e il riquadro direbbe una
   cosa mentre il tasto ne apre un'altra. */
const provaSapere = s => emit('prova', { giro: s.classi, nome: s.nome, eta: anniVisti.value })
/* e la pesca di un blocco: nessuna sorgente e nessun giro, solo l'età —
   è la forma con cui `quiz/Prova.vue` pesca come farebbe un gioco */
const provaFascia = g => emit('prova',
  { nome: `Domande: ${GRUPPI[g.chiave].corto.toLowerCase()}`, eta: anniVisti.value })

const MIN = 4
const MAX = 12

/* Le classi non cambiano mai durante la vita della schermata — sono la
   scaletta delle domande, non uno stato — e costruirle è il pezzo caro
   del quadro: si chiedono una volta sola. */
const classi = classiNude()

/* ── LA BOZZA, QUANDO C'È DA CONFERMARE ──
   Il numero che la tacca muove senza toccare il profilo. Fuori dalla
   schermata dei grandi non serve: lì la tacca è del padre, e questa
   resta allineata a `props.anni` senza fare niente. */
const { bozza, mossa, cambiata, muovi: muoviBozza, annulla } = usaBozzaEta({
  eta: () => props.anni, giochi: () => props.giochi, sa: () => props.sa,
  ritocchi: () => props.ritocchi, min: MIN, max: MAX,
})

/* Gli anni che si stanno guardando: la bozza dove si conferma, quelli
   veri dove chi la usa tiene la tacca per conto suo. */
const anniVisti = computed(() => props.conferma ? bozza.value : props.anni)

/* ── LE IMPOSTAZIONI DIETRO IL QUADRO ──
   Non se le ricalcola: nelle due situazioni sono due cose diverse e
   solo il padre sa quale. Nel primo avvio sono quelle che quell'età
   darebbe a un bambino che ancora non esiste (`eccezioniPerEta`), e il
   padre le ricalcola a ogni tacca. Nella schermata dei grandi sono
   quelle vere del bambino — e finché la bozza è ferma sono quelle che
   si mostrano.

   Muovendo la bozza, invece, il quadro diventa **l'anteprima**: giochi
   e saperi sono quelli che `spostandoLEta` scriverebbe applicando, che
   è la stessa funzione che poi scrive davvero. Dentro la stessa fascia
   ritorna quelli di adesso, quindi l'anteprima dice il vero anche nel
   caso in cui non cambia niente. */
/* I ritocchi seguono la stessa regola, e per una ragione che si vede
   solo qui: cambiando fascia `spostandoLEta` li porta via tutti — sono
   correzioni sopra un'età che non c'è più. L'anteprima deve mostrarlo,
   se no un grande vedrebbe le sue righe ambra ancora al loro posto un
   istante prima di perderle. */
const eccezioni = computed(() => props.conferma && cambiata.value
  ? { giochi: mossa.value.giochi, sa: mossa.value.sa,
      ritocchi: mossa.value.riscrive ? {} : props.ritocchi }
  : { giochi: props.giochi, sa: props.sa, ritocchi: props.ritocchi })

const quadro = computed(() => anniVisti.value == null ? null : quadroDi(
  { eta: anniVisti.value, giochi: eccezioni.value.giochi, sa: eccezioni.value.sa,
    sperimentali: props.sperimentali, ritocchi: eccezioni.value.ritocchi },
  { classi }))

/* ── LA TACCA APERTA, UNA SOLA ──
   La chiave dell'apertura porta dentro **anche il blocco**, e non è un
   dettaglio: lo stesso pezzo di scuola sta in due blocchi quando ha
   domande di due difficoltà — le figure piane sono roba che sa già fare
   per due domande e roba tosta per una terza — e con la sola chiave del
   sapere si aprivano tutte e due le tacche insieme, sulla stessa
   schermata, con la seconda che copriva la prima.

   Due tacche aperte insieme sarebbero due bozze in sospeso sulla stessa
   schermata, e la seconda coprirebbe la prima senza chiuderla: si
   confermerebbe qualcosa senza più vedere cosa. Aprirne una chiude
   l'altra.

   E **non si tara mentre l'età è in sospeso**: la bozza dell'età può
   riscrivere tutto (cambiando fascia i ritocchi se ne vanno), quindi un
   ritocco fatto lì sarebbe un lavoro che «Applica» butta via un
   momento dopo. Prima si decide l'età, poi si correggono le eccezioni. */
const tarando = ref('')
const siPuoTarare = computed(() => props.tarabile && !(props.conferma && cambiata.value))
const apriTara = k => { tarando.value = tarando.value === k ? '' : k }
function ritocca (chiave, mossa) {
  emit('ritocca', { chiave, ...mossa })
  tarando.value = ''
}
function fissa (chiave, come) {
  emit('gioco', { chiave, come })
  tarando.value = ''
}
/* e la stessa cosa per un pezzo di scuola che vive dentro un gioco: la
   tacca è un'altra (`Scuola.vue`) perché le parole sono altre, ma il
   patto è identico — non salva niente, dice cosa ha deciso */
function fissaSap (chiave, come) {
  emit('sapere', { chiave, come })
  tarando.value = ''
}

/* ── E IL TASTO CHE RIMETTE TUTTO ──
   Le correzioni riga per riga sono tante e piccole, e dopo un po'
   nessuno ricorda più cosa ha toccato: senza un modo di tornare
   indietro tutti insieme, l'unica strada era spostare l'età avanti e
   indietro finché non cambiava fascia — un rimedio per iniziati, e per
   giunta cambia anche l'età.

   Sta **in fondo al quadro** e non in cima: è la fine dell'elenco di
   quello che si può correggere, non un'intestazione. E si mostra solo
   se c'è qualcosa di suo da buttare — un ripristino che non ripristina
   niente fa dubitare di aver capito cosa fa.

   Il conto lo fa `rimettendoLEta`, che è la stessa funzione che poi
   scrive: se il tasto dicesse «3 domande ritoccate» e il salvataggio ne
   togliesse quattro, sarebbe peggio di nessun conto. */
const rimessa = computed(() => rimettendoLEta({
  eta: anniVisti.value, giochi: props.giochi, sa: props.sa, ritocchi: props.ritocchi,
}))
const chiedoRimetti = ref(false)
const perdeTutto = computed(() => perdeInParole(rimessa.value.perde))

/* ── PERCHÉ NON C'È UNA RIGA CHE DICE COSA È CAMBIATO ──
   C'era, e diceva «＋ arriva La bancarella», «＋ da qui in poi dà per
   scontato anche le divisioni». Sembrava il pezzo più utile e non lo
   era: **raccontava il movimento a chi stava già guardando la manopola
   muoversi**, e da fermo non diceva niente — chi apriva la schermata
   senza toccare nulla non lo vedeva mai.

   In cambio costava una forma in più fra i riquadri, e metteva in fila
   due modi di dire la stessa cosa: «arriva la bancarella» sopra un
   elenco in cui la bancarella era già lì, con scritto «c'è». Adesso i
   blocchi sono sei e sono tutti uguali: dicono **come stanno le cose**
   a quell'età, e il movimento si vede perché si muovono loro. */

/* Muovere è una cosa sola vista da due parti: dove si conferma sposta
   la bozza e non esce niente, dove non si conferma la tacca è del
   padre e l'unico modo di spostarla è dirglielo. */
function muovi (passo) {
  if (props.conferma) return muoviBozza(passo)
  const ora = props.anni == null ? props.partenza - passo : props.anni
  const nuova = Math.round((ora + passo) * 2) / 2
  if (nuova < MIN || nuova > MAX) return
  emit('scegli', nuova)
}

const inLettere = anniInLettere

/* l'età di una domanda, arrotondata al mezzo anno: il catalogo la dà a
   un decimale («7,4 anni») e nessun genitore giudica un decimale */
const etaDella = a => inLettere(Math.round((a || 0) * 2) / 2)

const fascia = computed(() => partenzaPerEta(anniVisti.value))

/* ── L'ASSAGGIO DI UN BLOCCO CHIUSO ──
   Tre pezzi di scuola e quanti ne restano: un riassunto che elenca
   trenta voci non è più un riassunto. Sono i **gruppi** e non le
   classi, che è la stessa unità che si trova aprendo — prima l'assaggio
   mostrava i nomi delle domande e dentro c'era dell'altro, e due
   elenchi diversi sotto lo stesso titolo fanno credere di aver
   sbagliato a premere. */
/* ── COME SI DICE UNO SPOSTAMENTO ──
   «mezzo anno più facile», non «+1»: i gradini sono roba nostra, e un
   grande non ha nessun modo di sapere quanto vale uno. Il segno è
   quello del profilo — positivo vuol dire che per lui è più facile. */
const QUANTO = ['', 'mezzo anno', 'un anno', 'un anno e mezzo']
const scartoDi = n => n ? `${QUANTO[Math.min(Math.abs(n), 3)]} più ${n > 0 ? 'facile' : 'difficile'}` : ''

const sottoDelSapere = s => s.spento
  ? 'l\'hai tolta tu: non gliele chiediamo più'
  : (s.quante === 1 ? '1 domanda' : `${s.quante} domande`) +
    (s.ritocco ? ` · ${scartoDi(s.ritocco)}` : '')
/* gli anni sono quelli **visti**: se un grande l'ha spostata, la riga
   deve dire il numero che vale per suo figlio, non quello che avevamo
   scritto noi — se no la riga cambia blocco e continua a dichiarare
   l'età di prima */
const sottoDellaClasse = r => etaDella(r.anniOra ?? r.anni) +
  (r.ritocco ? ` · ${scartoDi(r.ritocco)}` : '')

/* ── E SOTTO UN GIOCO, QUELLO CHE GLI MANCA ──
   Un pezzo di scuola spento si vede aprendo la riga, e una riga chiusa
   che non lo dice è metà del guasto da cui è nato tutto questo: le
   divisioni del castello erano spente da anni e niente, a nessun
   livello, lo diceva a un grande che non fosse andato a cercarle.
   `senza le divisioni` sta nella riga di contesto perché è la stessa
   frase che risponde a «perché il castello chiede solo
   moltiplicazioni». */
const sottoDelGioco = g => {
  if (g.manca) return `è tutto «${g.manca}», che hai tolto dalle domande`
  const via = (g.chiede || []).filter(s => s.spento)
  return via.length ? `${g.che} · senza ${elencoDi(via.map(s => giu(s.nome)))}` : g.che
}

/* Le due parole con cui si dice come sta un pezzo di scuola. Sono le
   stesse del blocco che raccoglie quelli tolti (`eta/gruppi.js`): due
   nomi per lo stesso stato farebbero credere a due stati. */
const statoDelPezzo = s => s.spento
  ? { testo: 'non ancora spiegate', cls: 'off' }
  : { testo: 'lo dà per scontato', cls: 'si' }

/* ── il segno di una riga che va male ──
   Torna l'etichetta di destra, cioè lo stesso posto dove i giochi
   dicono «c'è» o «arriva più avanti»: una riga ha un posto solo per
   dire come sta, e inventarne un secondo avrebbe fatto due righe
   diverse per la stessa cosa. Niente quando non c'è niente da dire, che
   è il caso normale — un elenco che segnala tutto non segnala niente. */
function allarmeDi(chiavi) {
  const buone = (Array.isArray(chiavi) ? chiavi : [chiavi]).filter(Boolean)
  if (!buone.length) return null
  const c = consiglioDa(contoDi(buone, props.risposte))
  if (!c || c.verso !== -1) return null
  return { testo: `${c.detto}`, cls: 'va-male' }
}
/* un pezzo di scuola sta male se stanno male le sue domande **prese
   insieme**: quattro tipologie con tre tiri ciascuna non direbbero
   niente da sole, e sono dodici risposte che parlano.

   E sta male anche se **una sola** delle sue domande va male, pur
   restando la somma dentro la soglia: quattro tipologie che vanno bene
   ne coprono una che va a fondo, e quella riga sta un'apertura più
   sotto — chiusa non si vede. Il numero però resta quello della somma
   solo quando è la somma a parlare: qui si dice quante righe, e il
   numero vero si legge aprendo, sulla riga di cui è. */
const allarmeDelSapere = s => {
  const insieme = allarmeDi((s.classi || []).map(c => c.tipo))
  if (insieme) return insieme
  const righe = vannoMale({ saperi: [s] }, props.risposte)
  if (!righe.length) return null
  return { testo: righe.length === 1 ? '1 domanda va male'
                                     : `${righe.length} domande vanno male`,
           cls: 'va-male' }
}

/* ── E IL SEGNALE RISALE FINO ALLA TESTATA ──
   Le due etichette qui sopra vivono su una riga, e una riga si vede
   solo dopo due aperture: il blocco, e dentro il blocco il pezzo di
   scuola. Un grande che ha appena letto in posta «Le analogie sulle
   cose del mondo» non sa in quale blocco cercarla — quel nome nel
   quadro sta al terzo livello — e scorrendo il quadro chiuso non
   trovava niente di rosso da nessuna parte. Quello che si è scritto
   nella posta dei grandi deve restare scritto anche qui, dove si va a
   fare qualcosa.

   Il conto lo fa `data/quadro.js` (`vannoMale`), che è puro e si
   prova; qui si scelgono solo le parole. Una sola riga si nomina per
   intero, col numero e col pezzo di scuola dove sta — che è la mappa
   per trovarla aprendo — due o più si contano, perché una testata non
   è un elenco: l'elenco è quello che si apre sotto. */
const maleDi = g => {
  const righe = vannoMale(g, props.risposte)
  if (!righe.length) return null
  const uno = righe[0]
  return {
    conta: righe.length === 1 ? '1 va male' : `${righe.length} vanno male`,
    /* «in Le analogie» non si può scrivere e «nelle analogie» vorrebbe
       sapere che articolo ha il nome: la strada da fare si dice come si
       dice una strada, un pezzo dopo l'altro */
    frase: righe.length === 1
      ? `⚠ ${uno.dentro ? `${uno.dentro} › ` : ''}«${uno.nome}» · ${uno.detto}`
      : `⚠ ${righe.slice(0, 2).map(r => `«${r.nome}»`).join(' · ')}` +
        (righe.length > 2 ? ` · e altre ${righe.length - 2}` : ''),
  }
}

const TRE = 3
const assaggioDi = g => {
  const nomi = g.saperi.slice(0, TRE).map(s => giu(s.nome))
  const restanti = g.saperi.length - nomi.length
  return nomi.join(' · ') + (restanti > 0 ? ` · e altri ${restanti}` : '')
}

/* Un solo aperto per volta non serve: sono blocchi corti e chi apre
   due elenchi li sta confrontando. Basta ricordarsi quali. */
const aperti = ref([])
const eAperto = k => aperti.value.includes(k)
const apri = k => { aperti.value = eAperto(k)
  ? aperti.value.filter(x => x !== k) : [...aperti.value, k] }

/* I nomi dei blocchi stanno in `eta/gruppi.js`: li chiede anche la
   tacca che sposta una riga, che deve poter dire dove va a finire
   quello che si sta muovendo — e se i due nomi non fossero lo stesso,
   la tacca direbbe una cosa e l'elenco ne mostrerebbe un'altra. */

/* ── COME SI DICE UNO STATO ──
   Quattro frasi corte, e la differenza fra le ultime tre è tutta la
   ragione per cui l'elenco si mostra intero invece che come due righe
   di «arriva» e «non compare più»: quelle raccontavano il movimento a
   chi stava già guardando la manopola muoversi, questo dice **come
   stanno le cose** e si legge anche da fermi. */
const STATI = {
  qui: { testo: 'c\'è', cls: 'si' },
  passato: { testo: 'l\'ha già passato', cls: 'giu' },
  avanti: { testo: 'arriva più avanti', cls: 'su' },
  spento: { testo: 'l\'hai spento tu', cls: 'off' },
}
const stato = g => STATI[g.stato] || STATI.qui
const quantiQui = computed(() =>
  quadro.value ? quadro.value.giochi.filter(g => g.stato === 'qui').length : 0)

/* «Survivors, il Dungeon e il sotterraneo»: la virgola fino al
   penultimo e la «e» in fondo, come si parla */
const ARTICOLI = ['il', 'lo', 'la', 'i', 'gli', 'le', "l'"]
/* «con Survivors, il Dungeon e il sotterraneo»: dentro una frase
   l'articolo va minuscolo, il nome proprio no — abbassare tutto darebbe
   «survivors», tenere tutto darebbe «Il Dungeon» in mezzo a una riga */
const inFrase = nome => {
  const [prima, ...resto] = String(nome || '').split(' ')
  return ARTICOLI.includes(prima.toLowerCase()) && resto.length
    ? [prima.toLowerCase(), ...resto].join(' ') : nome
}
const elencoDi = nomi => {
  const x = (nomi || []).map(inFrase)
  return x.length < 2 ? (x[0] || '') : `${x.slice(0, -1).join(', ')} e ${x[x.length - 1]}`
}

/* minuscolo perché finisce dentro una frase e non a capo di una riga:
   «le divisioni», non «Le divisioni» */
const giu = n => String(n || '').charAt(0).toLowerCase() + String(n || '').slice(1)

</script>

<template>
  <div class="manopola" data-manopola>
    <Tacca :anni="anniVisti" :min="MIN" :max="MAX"
           :sotto="fascia ? `come in ${fascia.come}` : ''" @muovi="muovi" />

    <!-- Finché non si è scelto non si mostra un quadro: sarebbe il
         quadro di un'età che nessuno ha deciso, e uno che lo legge
         crederebbe di aver già risposto. -->
    <p v-if="!quadro" class="invito">Sposta la manopola per vedere cosa cambia.</p>

    <div v-else class="quadro">
      <!-- ══ CINQUE BLOCCHI, UNA FORMA SOLA ══
           Titolo · quanti sono · cosa vuol dire · l'assaggio, e si apre
           toccandolo in qualunque punto. La forma sta in
           `eta/Blocco.vue` e la riga in `eta/Riga.vue`: erano
           scritte a mano una per blocco, ed è così che due di loro
           erano finite diverse dalle altre senza che nessuno l'avesse
           deciso. -->

      <!-- i giochi, tutti, con lo stato addosso: chi c'è, chi il
           bambino ha già passato, cosa arriva più avanti -->
      <Blocco data-apri="giochi" titolo="In casa"
              :conta="`${quantiQui} su ${quadro.giochi.length}`"
              spiega="i giochi che trova in home a quest'età"
              :aperto="eAperto('giochi')" @apri="apri('giochi')">
        <template #chiuso>
          <span class="chip-riga">
            <span v-for="g in quadro.giochi" :key="g.chiave" class="chip"
                  :class="g.stato" :title="`${g.nome} — ${stato(g).testo}`">{{ g.ico }}</span>
          </span>
        </template>
        <ul class="elenco">
          <template v-for="g in quadro.giochi" :key="g.chiave">
            <!-- La ✎ di un gioco non sposta niente di mezzo anno: sceglie
                 **chi decide** se sta in casa — l'età, o il grande. È la
                 stessa forma della tacca delle domande perché è lo stesso
                 gesto, e la riga si colora uguale quando la scelta non è
                 più quella dell'età. -->
            <Riga :chiave="g.chiave" :ico="g.ico" :nome="g.nome" :stato="stato(g)"
                  :sotto="sottoDelGioco(g)"
                  :tara="siPuoTarare" :tarando="tarando === `gioco:${g.chiave}`"
                  :ritoccata="g.aMano"
                  :apribile="g.chiedeQui.length > 0" :aperto="eAperto(`gioco:${g.chiave}`)"
                  @tara="apriTara(`gioco:${g.chiave}`)" @apri="apri(`gioco:${g.chiave}`)">
              <InCasa v-if="tarando === `gioco:${g.chiave}`"
                      :nome="g.nome" :scelto="g.scelto" :difetto="g.difetto" :stato="g.stato"
                      :eta="anniVisti" :chiave="g.chiave"
                      @applica="fissa(g.chiave, $event)" @chiudi="tarando = ''" />
            </Riga>
            <!-- ══ I PEZZI DI SCUOLA CHE QUESTO GIOCO CHIEDE ══
                 Le divisioni del castello: `chiede:` nel manifesto
                 (`data/giochi.js`). Stanno qui e non fra i blocchi delle
                 domande per una ragione sola — non ne hanno una, quindi
                 non cadono in nessuna fascia di padronanza — e questo è
                 anche il posto dove un grande le va a cercare: «cosa
                 chiede il castello». Chi le domande ce le ha, la sua riga
                 ce l'ha già di là, e `data/quadro.js` non la ripete: due
                 tacche diverse sulla stessa voce del profilo sono il
                 modo più veloce di far confermare la cosa sbagliata. -->
            <Riga v-for="(s, i) in (eAperto(`gioco:${g.chiave}`) ? g.chiedeQui : [])"
                  :key="s.chiave" dentro :ultima="i === g.chiedeQui.length - 1"
                  :ico="s.ico" :nome="s.nome" :sotto="s.che" :chiave="s.chiave"
                  :stato="statoDelPezzo(s)"
                  :tara="siPuoTarare" :tarando="tarando === `chiede:${g.chiave}:${s.chiave}`"
                  :ritoccata="s.aMano" @tara="apriTara(`chiede:${g.chiave}:${s.chiave}`)">
              <!-- niente scatti in mezzi anni: senza domande non c'è una
                   difficoltà da spostare, c'è un acceso e uno spento -->
              <Scuola v-if="tarando === `chiede:${g.chiave}:${s.chiave}`"
                      :nome="s.nome" :scelto="s.scelto" :atteso-spento="s.attesoSpento"
                      :spegne="s.spegne" :eta="anniVisti" :chiave="s.chiave"
                      @applica="fissaSap(s.chiave, $event)" @chiudi="tarando = ''" />
            </Riga>
          </template>
        </ul>
      </Blocco>

      <!-- ══ QUANDO LE DOMANDE NON LE CHIEDE NESSUNO ══
           Da quattro a cinque anni e mezzo in casa ci sono tre giochi e
           nessuno pesca dai moduli di quiz: i blocchi elencavano undici
           classi coi nomi e col tastino per provarle, e un grande le
           leggeva come «ecco cosa gli chiederemo». Non gliele avremmo
           chieste mai. Una riga sola al posto di quattro elenchi, e dice
           anche da quando cambia — che è l'unica cosa utile lì: cosa si
           guadagna salendo ancora. -->
      <Blocco v-if="!quadro.domande.chiedono" data-domande="nessuna"
              titolo="Le domande" conta="nessuna" :apribile="false"
              spiega="a quest'età nessun gioco gliele chiede: quelli che ha in casa hanno le loro"
              :assaggio="quadro.domande.da
                ? `Arrivano a ${inLettere(quadro.domande.da)}, con ${elencoDi(quadro.domande.quali)}`
                : ''" />

      <!-- ══ E LE DOMANDE, NELLA SCALA CHE ESISTE GIÀ ══
           Quattro blocchi, e sono quattro livelli di padronanza rispetto
           a **questo** bambino: le sa fare · sta imparando · difficili
           ma ce la può fare · non gliele chiediamo più. Il quinto —
           impossibili — non si mostra, perché non gli arrivano.

           Dentro, i **pezzi di scuola**, e sotto ognuno le sue domande
           di quella fascia. Lo stesso pezzo può stare in due blocchi, ed
           è il punto: le figure piane sono roba che sta imparando per
           due domande e roba tosta per una terza. Prima c'era un blocco
           a parte, «dà per scontato che sappia», fatto di gruppi mentre
           questi erano fatti di classi: due unità di misura per la
           stessa roba, e nessuna delle due diceva l'altra. -->
      <!-- `quadro.gruppi` è già vuoto dove nessun gioco in casa le
           chiede: la regola sta in `data/quadro.js`, insieme al conto
           di chi le chiede e a quello che decide dove va la riga di un
           pezzo di scuola. Qui resta solo «un blocco vuoto non si
           mostra». -->
      <Blocco v-for="g in quadro.gruppi.filter(x => x.quante || x.saperi.length)"
              :key="g.chiave" :data-apri="g.chiave"
              :titolo="GRUPPI[g.chiave].nome" :conta="String(g.quante)"
              :spiega="GRUPPI[g.chiave].che"
              :assaggio="assaggioDi(g)" :allarme="maleDi(g)"
              :aperto="eAperto(g.chiave)" @apri="apri(g.chiave)">
        <ul class="elenco">
          <template v-for="s in g.saperi" :key="s.chiave">
            <!-- il pezzo di scuola, col suo ▶ e la sua ✎: il ▶ scorre le
                 sue domande di questa fascia e nient'altro, la ✎ apre la
                 tacca che le sposta tutte insieme. Si apre a sua volta,
                 perché a otto anni un blocco solo ha cinquantasette
                 domande in venti pezzi di scuola — mostrarle tutte
                 insieme non è un elenco, è un muro. -->
            <Riga :ico="s.ico" :nome="s.nome" :chiave="s.chiave"
                  :sotto="sottoDelSapere(s)" :stato="allarmeDelSapere(s)"
                  :prova="!!s.quante" :tara="siPuoTarare"
                  :tarando="tarando === `sapere:${g.chiave}:${s.chiave}`"
                  :ritoccata="!!s.ritocco || s.spento"
                  apribile :aperto="eAperto(`${g.chiave}:${s.chiave}`)"
                  @prova="provaSapere(s)" @tara="apriTara(`sapere:${g.chiave}:${s.chiave}`)"
                  @apri="apri(`${g.chiave}:${s.chiave}`)">
              <!-- la tacca di un pezzo di scuola ha l'ottavo scatto: è
                   qui che si dice «a scuola non l'hanno ancora fatto», ed
                   è l'unico posto dove si può dire, perché è il gruppo
                   che si spegne e non la domanda -->
              <Taratura v-if="tarando === `sapere:${g.chiave}:${s.chiave}`"
                        :livello="s.livello" :livelli="s.livelli" :eta="anniVisti"
                        :ritocco="s.ritocco" :spenta="s.spento" :chiave="s.chiave"
                        puo-spegnere
                        @applica="ritocca(s.chiave, $event)" @chiudi="tarando = ''" />
            </Riga>
            <!-- sotto una domanda va **a che età serve**, non il nome del
                 modulo: dentro il suo pezzo di scuola il modulo lo
                 ripete quasi sempre («Coniugazione» sotto «I verbi al
                 presente»), mentre gli anni sono la sola cosa che un
                 grande può giudicare guardandola -->
            <Riga v-for="(r, i) in (eAperto(`${g.chiave}:${s.chiave}`) ? s.classi : [])"
                  :key="r.chiave" dentro :ultima="i === s.classi.length - 1"
                  :nome="r.nome" :sotto="sottoDellaClasse(r)" :chiave="r.chiave"
                  :stato="allarmeDi(r.tipo)"
                  prova :tara="siPuoTarare && !!r.tipo"
                  :tarando="tarando === `classe:${g.chiave}:${r.chiave}`"
                  :ritoccata="!!r.ritocco"
                  @prova="provaClasse(r)" @tara="apriTara(`classe:${g.chiave}:${r.chiave}`)">
              <!-- e qui la tacca si ferma agli scatti: una domanda non ha
                   un pezzo di scuola da spegnere — quello sta un gradino
                   sopra, ed è il ✕ della vecchia scheda che, standosene
                   sulla riga di una domanda, ne toglieva otto -->
              <Taratura v-if="tarando === `classe:${g.chiave}:${r.chiave}`"
                        :livello="r.livello" :eta="anniVisti"
                        :ritocco="r.ritocco" :chiave="r.chiave"
                        @applica="ritocca(r.tipo, $event)" @chiudi="tarando = ''" />
            </Riga>
          </template>
        </ul>
        <!-- ── E COSA GLI CAPITA DAVVERO ──
             L'elenco dice cosa esiste in quel blocco; questo pesca
             **come pescherebbe un gioco** a quella difficoltà, con la
             stessa campana e gli stessi saperi spenti. È l'altra
             domanda che un grande si fa, e dall'elenco non si deduce:
             una riga che esiste può uscire una volta su trenta. -->
        <button type="button" class="pesca" :data-fascia-pesca="g.chiave"
                @click.stop="provaFascia(g)">▶ pescane una come farebbe un gioco</button>
      </Blocco>

      <!-- ══ RIMETTERE TUTTO COM'ERA ══
           In fondo, e solo quando c'è qualcosa di suo da buttare. Chiede
           conferma dicendo **cosa** perde: «2 giochi messi a mano, 1
           domanda ritoccata» è una domanda a cui si può rispondere,
           «sei sicuro?» no. -->
      <div v-if="siPuoTarare && rimessa.cambia" class="rimetti-tutto">
        <button v-if="!chiedoRimetti" type="button" class="tasto-rimetti"
                data-azione="rimetti-difetti" @click="chiedoRimetti = true">
          ↺ Rimetti tutto com'è di partenza a {{ inLettere(anniVisti) }}
          <i v-if="perdeTutto" data-perde-tutto>hai messo a mano: {{ perdeTutto }}</i>
        </button>
        <template v-else>
          <p class="che">Torna tutto ai valori di {{ inLettere(anniVisti) }}, e si perde
            quello che hai messo a mano<template v-if="perdeTutto">:
            {{ perdeTutto }}</template>. I progressi non si toccano.</p>
          <div class="riga-tasti">
            <button type="button" class="tasto-rimetti chiaro" data-azione="rimetti-no"
                    @click="chiedoRimetti = false">Lascia stare</button>
            <button type="button" class="tasto-rimetti forte" data-azione="rimetti-si"
                    @click="chiedoRimetti = false; emit('rimetti')">Rimetti</button>
          </div>
        </template>
      </div>
    </div>

    <!-- ══ «APPLICA» ══
         Compare solo quando c'è una modifica in sospeso, e resta a
         schermo mentre si scorre il quadro: prima la conferma stava in
         fondo alla colonna, dove un grande che spostava la manopola non
         la vedeva mai — quello che vedeva era una freccia che smetteva
         di rispondere. -->
    <Conferma v-if="conferma && cambiata" :anni="bozza" :mossa="mossa"
              @applica="emit('scegli', bozza)" @annulla="annulla" />
  </div>
</template>

<style scoped>
.manopola { width:100%; display:flex; flex-direction:column; gap:10px }

.invito { margin:0; text-align:center; font-size:13px; color:#7a7a8a }

.quadro { display:flex; flex-direction:column; gap:8px; text-align:left }
.chip-riga { display:flex; flex-wrap:wrap; gap:3px; margin-top:4px }
.chip { font-size:17px; line-height:1.1 }
/* chi non c'è resta nella fila, sbiadito: una fila che mostra solo gli
   accesi non fa vedere *che* manca qualcosa — e quanto manca è metà di
   quello che la manopola deve raccontare */
.chip.passato, .chip.avanti, .chip.spento { opacity:.28; filter:grayscale(1) }

.elenco { list-style:none; margin:5px 0 0; padding:0; display:flex;
          flex-direction:column; gap:5px }
.pesca { width:100%; margin-top:7px; border:none; border-radius:11px; cursor:pointer;
         font-family:inherit; font-size:12px; font-weight:750; color:var(--viola);
         background:#f4f2fd; padding:9px }
.pesca:active { transform:translateY(1px) }

/* ── il tasto che rimette tutto ──
   Ambra come le righe che si è messo a mano, non rosso: non cancella
   niente di quello che il bambino ha fatto — monete, traguardi e
   campagne restano — e un colore d'allarme qui direbbe il falso. */
.rimetti-tutto { display:flex; flex-direction:column; gap:7px; margin-top:2px }
.tasto-rimetti { border:none; border-radius:13px; cursor:pointer; font-family:inherit;
                 padding:10px 12px; text-align:left; background:#fdf4e3; color:#8a5a10;
                 font-size:12.5px; font-weight:800;
                 display:flex; flex-direction:column; gap:2px }
.tasto-rimetti i { font-style:normal; font-size:10.5px; font-weight:600; color:#9a7434 }
.tasto-rimetti:active { transform:translateY(1px) }
.rimetti-tutto .che { margin:0; font-size:11.5px; color:#7a7a8a; line-height:1.35;
                      text-align:left }
.riga-tasti { display:flex; gap:6px }
.riga-tasti .tasto-rimetti { flex:1; text-align:center; align-items:center; font-size:12.5px }
.tasto-rimetti.chiaro { background:#eee9fb; color:var(--viola-scuro) }
.tasto-rimetti.forte { background:linear-gradient(180deg,#e0a33c,#c07a10); color:#fff }
</style>
