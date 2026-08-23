<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL SOTTERRANEO — IL COORDINATORE

   Un sotterraneo che si **cammina**, dall'alto, col dito: si tocca dove
   si vuole andare, si entra nelle stanze, si toccano le cose. Ogni cosa
   che vale qualcosa ha un prezzo, e il prezzo è **rispondere**.

   Non è il Dungeon a bivi di `src/giochi/dungeon/`, e non lo sostituisce:
   quello è un gioco a carte — una mappa a nodi, un bivio alla volta, non
   si torna indietro. Questo è un posto invece che un diagramma. I due
   fanno cose diverse con gli stessi esercizi; se un giorno se ne terrà
   uno solo, sarà perché i bambini avranno detto quale.

   Questo file mette insieme i pezzi ed è l'unico che sa che esistono le
   monete, l'avanzamento salvato e i quiz: le regole stanno in `motore/`,
   i numeri in `dati/`, il disegno in `scena/`, le schermate in `viste/`.
   Se qui dentro comincia a comparire una regola di gioco, vuol dire che
   è nel file sbagliato.

   ── LA DOMANDA LA CHIEDE IL MOTORE, LA TROVA QUESTO FILE ──────────
   `corsa.chiesta` dice soltanto **quanto dev'essere difficile**; qui si
   va a prenderne una vera dai moduli di quiz e la si mette in scena. Il
   gioco non sa di che materia sia, e `evita` serve solo a non far uscire
   due domande di fila della stessa.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, shallowRef, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { addCoins, segna, segnaBest } from '../../store/profile.js'
import { progresso, aperta, stelleDi, completa, sosta, salvaSosta, buttaSosta,
         scelta, ricorda } from '../campagne.js'
import { domandaPerGioco } from '../../quiz/scelta.js'
import Domanda from '../../quiz/Domanda.vue'

import { CAMPAGNA, QUANTE_TAPPE, stelleDella } from './dati/campagna.js'
import { COSE, SEGNI } from './dati/cose.js'
import { MOSTRI } from './dati/mostri.js'
import { CURIOSITA_DI } from './dati/curiosita.js'
import { pezzoAndante } from './dati/tessere.js'
import { EROI, DI_PARTENZA, eroeDi } from './dati/eroi.js'
import { TASCHE } from './dati/mondo.js'
import { Corsa } from './motore/corsa.js'
import { scrivi, leggi, dice } from './motore/sosta.js'
import { Tela } from './scena/tela.js'

import Campagna from './viste/Campagna.vue'
import Eroi from './viste/Eroi.vue'
import Foglio from './viste/Foglio.vue'
import Icona from './viste/Icona.vue'
import { cambioDetto } from './viste/cambio.js'
import { occhio } from './viste/occhio.js'
import Scontro from './viste/Scontro.vue'
import Zaino from './viste/Zaino.vue'
import Mercante from './viste/Mercante.vue'
import Fine from './viste/Fine.vue'
import './stile.css'

defineOptions({ name: 'IlSotterraneo' })
const emit = defineEmits(['vai'])

const CHIAVE = 'sotterraneo'
/* Il dito si lascia dietro un click, e quel click va ingoiato: chi apre
   un foglio dal tocco su un canvas si ritrova il click sul foglio appena
   comparso, cioè su un tasto che si preme da solo. Col mouse non succede
   — lì il bersaglio si decide alla pressione — ed è il motivo per cui
   questi guasti si vedono solo dal telefono. Vedi `giochi/fattoria`. */
const FANTASMA_MS = 100
const FANTASMA_PX = 32
/* Un dito non sta fermo come un mouse: sotto i sedici pixel Android e
   iOS considerano il dito ancora fermo, e un gioco più severo del
   telefono butta via i tocchi di chi preme forte — cioè dei bambini. */
const FERMO_PX = 16

const tela = ref(null)
const corsa = shallowRef(null)
/* aperto il foglio del `?`, il tempo del sotterraneo si ferma */
const aiutoAperto = ref(false)
const tappaIdx = ref(-1)
const domanda = ref(null)
const fine = ref(null)
/* Un avviso è una riga sola in mezzo al campo. Chi lo manda dal motore
   può dire **quale cosa** riguarda (`dilloDi`), e allora accanto al
   testo ci va la sua faccia vera invece di un'emoji: la stessa che si
   vede per terra e nella tasca. Le righe che non parlano di una cosa —
   «di là non si passa» — restano stringhe. */
const avviso = ref(null)
const zainoAperto = ref(false)
const scosso = ref(0)
const tic = ref(0)                 // batte quando cambia qualcosa che si vede
/* ── tutto quello che si guarda dentro la discesa passa di qui ──
   La corsa è uno `shallowRef`, quindi Vue non vede niente di quello che
   succede là dentro: chi vuole mostrarne un pezzo deve leggere il tic, e
   scrivendo `computed` a mano ce ne si dimentica — o, peggio, si deriva
   da un altro computed che il tic lo legge ma ritorna sempre lo stesso
   oggetto, e allora non si sveglia nessuno. Il perché per esteso sta in
   `viste/occhio.js`; qui basta la regola: **niente `computed` a mano su
   quello che sta dentro la corsa**. */
const dallaCorsa = occhio(corsa, tic)
let ultimoModulo = null
let pittore = null
let orologio = 0
let ultimoAvviso = 0

const avanza = progresso(CHIAVE)

/* ═══════════ chi scende ═══════════
   Si sceglie una volta e resta (`cfg.eroe`, che è il posto delle scelte
   del bambino — le impostazioni dei grandi stanno altrove). La prima
   volta la scelta si presenta da sé: entrare in un gioco di ruolo senza
   sapere chi si è non ha senso, e un tasto «cambio eroe» che nessuno ha
   mai premuto sarebbe una porta che non si apre mai. */
const chiEro = ref(scelta(CHIAVE, 'eroe', null))
/* ── chi si sta guardando ──
   Due fonti per la stessa cosa, e divergevano: il campo disegna **chi
   sta scendendo** (`corsa.io`), lo zaino leggeva **chi è scelto nel
   profilo**. Basta riprendere una discesa cominciata con un altro eroe
   — o riprendere un salvataggio vecchio, che il nome di chi scendeva
   non ce l'ha — per vedere un cavaliere sul campo e un'elfa
   nell'inventario, nello stesso istante.

   Durante una discesa comanda la discesa: chi è sceso è sceso, e
   cambiare idea a metà scala non si può. Fuori — sulla mappa delle
   tappe — comanda la scelta, perché lì si decide chi scenderà. */
const chiScende = dallaCorsa(c => c.io || null)
const eroeScheda = computed(() => chiScende.value || eroeDi(chiEro.value || DI_PARTENZA))
const scegliEroe = ref(!chiEro.value)

function scegli(k) {
  chiEro.value = ricorda(CHIAVE, 'eroe', k)
  scegliEroe.value = false
  suono.ok()
}

/* ═══════════ la discesa lasciata a metà ═══════════
   Una discesa dura più di una seduta, e prima chiudere il gioco voleva
   dire buttarla. Adesso si scrive dove si era (`motore/sosta.js`) e la
   mappa la offre in cima. Il ref serve solo a farla comparire e sparire:
   la verità sta in archivio. */
/* la carta «riprendi» dice anche **con chi**: il nome, non la chiave */
const conNome = d => (d ? { ...d, chi: d.eroe ? eroeDi(d.eroe).nome : '' } : null)
const ripresa = ref(conNome(dice(sosta(CHIAVE), CAMPAGNA)))
let ultimoSalvato = 0

function salva({ subito = false } = {}) {
  const c = corsa.value
  if (!c || c.finita || tappaIdx.value < 0) return
  ultimoSalvato = orologio
  salvaSosta(CHIAVE, scrivi(c, tappaIdx.value), { subito })
}

function scorda() {
  buttaSosta(CHIAVE)
  ripresa.value = null
}

/* Riprendere non è ricominciare: il piano si **rifà dal seme** e sopra
   ci si rimette quello che era successo. Se il salvataggio non si legge
   più — una versione vecchia, un dato storto — si comincia la tappa da
   capo invece di lasciare un tasto che non fa niente. */
function riprendiDiscesa() {
  const dato = sosta(CHIAVE)
  /* un salvataggio vecchio non sa chi stava scendendo — era il difetto
     dei due campi `eroe` — e in quel caso vale la scelta di casa invece
     del cavaliere di sistema: è quasi sempre la stessa persona */
  const c = dato ? leggi(dato, CAMPAGNA[dato.tappa], chiEro.value || DI_PARTENZA) : null
  if (!c) { scorda(); return }
  tappaIdx.value = dato.tappa
  fine.value = null
  domanda.value = null
  zainoAperto.value = false
  corsa.value = c
  ripresa.value = null
  suono.nota(180, 90, 0.4, 'sawtooth', 0.12)
  nextTick(() => accendi())
}

/* ═══════════ la mappa delle tappe ═══════════ */
const tappe = computed(() => CAMPAGNA.map((t, i) => ({
  ...t, indice: i,
  aperta: aperta(CHIAVE, i),
  adesso: i === avanza.tappa,
  stelle: stelleDi(CHIAVE, i),
})))

const titolo = computed(() =>
  corsa.value ? CAMPAGNA[tappaIdx.value].nome : 'Il sotterraneo')

/* ═══════════ com'è messo l'eroe, per la fascia ═══════════
   Già pronto da mostrare: la vista non somma bonus e non guarda dentro
   le tasche. */
const eroe = dallaCorsa(c => {
  const q = c.vita / Math.max(1, c.vitaMax)
  return {
    vita: c.vita, vitaMax: c.vitaMax, quota: q,
    att: c.att, dif: c.dif, gemme: c.gemme,
    piano: c.piano + 1, piani: c.quantiPiani,
    chiave: c.chiaveDelPiano,
    polso: q > 0.6 ? '#4fce7c' : q > 0.3 ? '#f0b429' : '#e0432f',
  }
})

/* Il foglio aperto è **sempre lo stesso oggetto** finché resta aperto, e
   per questo nessuno dei conti qui sotto si deriva da lui: guardano
   `c.foglio` per conto proprio, che è il modo di svegliarsi quando
   dentro quel foglio cambia qualcosa. */
const foglio = dallaCorsa(c => c.foglio || null)

/* ── com'è andato l'ultimo colpo ──
   Due numeri, detti dopo: «gli hai tolto 8, ti ha graffiato 3». Serve
   perché il graffio esiste da sempre ma non si vedeva: rispondendo bene
   la propria barra calava e partiva un rumore di botta, e da fuori è
   indistinguibile da uno sbaglio. Sta qui e non nel motore perché è una
   cosa che si guarda, non una regola: il motore dice `dato` e `preso`,
   e per quanto restino a schermo decide chi disegna. */
const scambio = ref(null)
let scambioFinoA = 0

/* Quello che si legge sopra la domanda mentre si combatte, e **cambia a
   ogni risposta**: le ossa che restano, quante risposte mancano, quanta
   vita si ha. Erano numeri fatti una volta all'inizio della battaglia —
   «ancora 3 risposte» restava 3 fino alla fine. */
const nemico = dallaCorsa(c => {
  const f = c.foglio
  if (!f || f.che !== 'scontro') return null
  const scheda = MOSTRI[f.chi.tipo] || {}
  return {
    mostro: f.chi, colpo: c.colpo(f.chi), restano: c.colpiPer(f.chi),
    /* la faccia di chi hai davanti è **la stessa che sta sul campo**:
       un'emoji al suo posto è un secondo personaggio che nessuno ha mai
       visto, e mentre si risponde una domanda quel salto confonde */
    sprite: scheda.sprite ? pezzoAndante(scheda.sprite, 'fermo', 0) : null,
    /* quello che passa comunque, e quello che arriva sbagliando: si dice
       **prima** di rispondere, perché è con quei due numeri che si
       decide se restare o scappare */
    graffio: c.graffio(f.chi), male: c.danno(f.chi),
    vita: c.vita, vitaMax: c.vitaMax,
  }
})

/* quante tasche sono occupate: sta sul tasto, e dice quando conviene
   aprirlo — sei su sei vuol dire che la prossima cosa resta per terra */
const pieni = dallaCorsa(c => c.zaino.length, 0)

const zaino = dallaCorsa(c => {
  const voce = k => (k ? { chiave: k, ...COSE[k] } : null)
  return {
    mano: voce(c.mano), mancina: voce(c.mancina),
    corpo: voce(c.corpo), dito: voce(c.dito),
    tasche: Array.from({ length: TASCHE }, (_, i) => voce(c.zaino[i])),
  }
})

/* Il banco, riga per riga. Si rifà a ogni tic e non a ogni apertura del
   foglio, perché **comprare e vendere cambiano tutte e tre le colonne**:
   le gemme scendono, la roba esce dalla lista, quello che si ha addosso
   non è più quello di prima. */
/* Quali righe ci sono, e quali non finiscono mai, lo dice il motore
   (`mercanzia`): qui si aggiunge solo quello che serve a disegnarle. */
const merce = dallaCorsa(c => c.mercanzia().map(({ chiave: k, sempre }) => ({
  chiave: k, sempre, ...COSE[k], posso: c.gemme >= COSE[k].prezzo,
  /* quanto cambia rispetto a quello che si ha addosso: è il numero
     con cui si decide se spendere, e al banco non c'era */
  cambio: cambioDetto(c.confronto(k), x => COSE[x].nome),
  /* quanto ti manca per portartela via: senza, una riga che non puoi
     comprare si legge come una che puoi — il prezzo da solo non dice
     niente finché non lo confronti con le tue gemme, e un bambino
     quel confronto non lo fa guardando due numeri lontani */
  mancano: Math.max(0, COSE[k].prezzo - c.gemme),
  /* di pozioni se ne portano quante ne stanno, quindi restano in
     vendita anche quando ne hai già: quello che serve sapere è
     **quante**, o si compra la quarta senza accorgersene */
  quante: c.quanteNeHo(k),
})), [])

/* Quello che il mercante **ti** comprerebbe: le tasche, col loro mezzo
   prezzo già fatto dal motore — che è l'unico che sa quanto vale una
   cosa. Le caselle addosso non ci sono: quelle si ripongono prima. */
const daVendere = dallaCorsa(c => Array.from({ length: TASCHE }, (_, i) => {
  const k = c.zaino[i]
  return k ? { chiave: k, ...COSE[k], vale: c.quantoVale(k) } : null
}), [])

/* la curiosità aperta adesso, coi suoi dati: il nome, il pezzo, la
   frase d'invito. Il motore dice quale tipo è, la tabella il resto. */
const curiosita = dallaCorsa(c => {
  const f = c.foglio
  if (!f || f.che !== 'curiosita') return {}
  return CURIOSITA_DI[f.chi.tipo] || {}
}, {})

const segno = dallaCorsa(c => {
  const f = c.foglio
  return f && f.che === 'porta' ? SEGNI[f.chi.segno] : null
})

/* ═══════════ i suoni ═══════════
   Col suono spento il gioco resta intero: qui dentro non c'è niente che
   si sappia solo sentendolo. */
const suoni = {
  passo: () => suono.nota(320, 320, 0.05, 'sine', 0.06),
  colpo: () => suono.boom(),
  ahia: () => suono.no(),
  /* Il graffio che passa **rispondendo bene** non può suonare come uno
     sbaglio, e suonava proprio così: era `suono.no()`, cioè il rumore
     con cui il gioco dice «hai risposto male». Un bambino che risponde
     giusto e sente quello impara la cosa sbagliata. Qui è un tonfo
     sordo e breve, che è un'altra frase. */
  graffio: () => suono.nota(200, 150, 0.09, 'triangle', 0.07),
  bottino: () => suono.moneta(),
  tesoro: () => suono.livello(),
}

/* ═══════════ giocare ═══════════ */
/* Il seme dall'indirizzo (`#seme=812`), come i cheat delle monete e del
   codice dei genitori. Serve a poter dire «riaprilo col seme 812 e guarda
   la stanza in basso a destra» invece di «fidati»: senza, ogni discesa è
   un posto nuovo e non si può far vedere niente a nessuno. */
function semeDallIndirizzo() {
  const n = Number(new URLSearchParams(location.hash.slice(1)).get('seme'))
  return Number.isFinite(n) && n > 0 ? n : null
}

/* `#sotterraneo=roba` scende già equipaggiato: serve a **guardare una
   schermata** — lo zaino pieno, l'arma in pugno, le tre caselle addosso
   — senza doversi prima giocare mezza discesa. Sta accanto agli altri
   cheat di casa (`#monete=500`, `#fattoria=9`), e come quelli non è
   nascosto: un bambino che lo scopre si è guadagnato il diritto di
   usarlo. */
function corredoDaProva(c) {
  if (new URLSearchParams(location.hash.slice(1)).get('sotterraneo') !== 'roba') return
  c.mano = 'spada'
  c.mancina = 'scudo-ferro'
  c.corpo = 'corazza'
  c.dito = 'anello-ambra'
  c.zaino = ['pozione-grande', 'pozione', 'torcia', 'chiave', 'spadone', 'medaglione']
  c.gemme += 120
  c.aggiornaLuce()
}

function avvia(i) {
  scorda()
  tappaIdx.value = i
  fine.value = null
  domanda.value = null
  zainoAperto.value = false
  corsa.value = new Corsa(CAMPAGNA[i], { seme: semeDallIndirizzo(), eroe: chiEro.value || DI_PARTENZA })
  corredoDaProva(corsa.value)
  suono.nota(180, 90, 0.4, 'sawtooth', 0.12)
  nextTick(() => accendi())
}

function accendi() {
  if (!tela.value || !corsa.value) return
  /* il canvas di prima è stato smontato tornando alle discese: il
     pittore va riagganciato a quello nuovo, o dipinge su una tela che
     non è più a schermo */
  if (!pittore) pittore = new Tela(tela.value)
  else pittore.attacca(tela.value)
  pittore.misura()
  pittore.segui(corsa.value.livello, corsa.value.eroe.x, corsa.value.eroe.y)
  pittore.avvia()
  giro()
}

/* ── il giro ──
   Il tempo lo tiene questo file, non il motore: `passo(dt)` è una
   funzione pura di quanto tempo è passato, e per questo il banco di
   prova può farla girare mille volte in un millisecondo. */
/* Quanto schermo copre il foglio in questo momento, misurato sul foglio
   vero e non indovinato: la telecamera centra l'eroe in quello che resta.
   Una quota fissa non funziona — un foglio con dentro una domanda
   disegnata è alto il doppio di uno con due righe di testo, e la cosa
   che si sta guardando finisce sotto il pannello proprio mentre serve.
   Si rilegge ogni sei fotogrammi: è una misura del DOM, non un conto.

   Lo scontro non è più fra questi: sta al centro (`.sot-velo`), non
   porta la classe `.sot-foglio`, e quindi qui misura zero e la
   telecamera resta ferma. È voluto — muovere la scena mentre comincia
   una battaglia era la metà peggiore del problema. */
let altoFoglio = 0, contaGiri = 0
function misuraFoglio() {
  const f = document.querySelector('.sot-foglio')
  altoFoglio = f ? f.getBoundingClientRect().height : 0
}

let raf = 0, prima = 0
function giro() {
  cancelAnimationFrame(raf)
  prima = performance.now()
  const passo = ora => {
    raf = requestAnimationFrame(passo)
    const dt = Math.min(0.05, (ora - prima) / 1000)
    prima = ora
    orologio += dt
    const c = corsa.value
    /* col foglio del `?` davanti il sotterraneo sta fermo: il velo copre
       lo schermo, e quello che si muove sotto non lo vede nessuno */
    if (!c || c.finita || aiutoAperto.value) return
    c.passo(dt)
    /* col foglio aperto la telecamera alza l'eroe, così la porta o il
       forziere di cui si sta leggendo restano visibili sopra il
       pannello (lo scontro no: quello sta al centro e non chiede spazio) */
    if ((contaGiri++ % 6) === 0) misuraFoglio()
    /* ogni tanto, e non a ogni fotogramma: una discesa salvata sono un
       paio di chilobyte, e chi cammina per un minuto senza toccare
       niente non deve ritrovarsi indietro di un minuto */
    if (orologio - ultimoSalvato > 8) salva()
    pittore.segui(c.livello, c.eroe.x, c.eroe.y, altoFoglio)
    pittore.mostra({ corsa: c, orologio })
    guarda(c)
  }
  raf = requestAnimationFrame(passo)
}

/* Cosa è cambiato di quello che si vede. Un `tic` a ogni fotogramma
   farebbe ricalcolare mezza schermata sessanta volte al secondo per
   niente: si confronta una firma corta e si batte solo quando serve. */
let firma = ''
function guarda(c) {
  const f = `${c.vita}|${c.gemme}|${c.foglio ? c.foglio.che : '-'}|${c.chiesta ? c.chiesta.id : 0}` +
            `|${c.piano}|${c.zaino.length}|${c.chiaveDelPiano}|${c.finita}` +
            /* tutte e quattro le caselle, non solo le due che si vedono
               nella fascia: uno scudo raccolto camminandoci sopra va
               nella mancina e un anello al dito, e senza di loro qui
               l'unica cosa che cambiava era la roba per terra — che alla
               raccolta non cambia, perché quello che si prende resta in
               elenco con addosso `presa` */
            `|${c.mano}|${c.mancina}|${c.corpo}|${c.dito}` +
            /* due cose trovate di fila hanno lo stesso `che`: senza la
               cosa in chiaro il foglio resterebbe quello di prima */
            `|${c.foglio ? c.foglio.cosa || '' : ''}|${c.livello.robe.length}`
  if (f !== firma) { firma = f; tic.value++ }
  if (c.avvisi.length) {
    const a = c.avvisi.shift()
    avviso.value = typeof a === 'string' ? { testo: a } : { ...a, ...(COSE[a.cosa] || {}) }
    ultimoAvviso = orologio
  } else if (avviso.value && orologio - ultimoAvviso > 1.8) avviso.value = null
  if (scambio.value && orologio > scambioFinoA) scambio.value = null
}

/* ═══════════ la domanda ═══════════
   L'unico punto del gioco in cui si nomina un quiz.

   `tic` non è di contorno, è **la dipendenza**: la corsa sta in uno
   `shallowRef`, quindi Vue non guarda dentro e `corsa.value.chiesta`
   cambia senza dire niente a nessuno. Senza il `tic` in cima, questo
   watcher scatterebbe solo quando nasce una corsa nuova — cioè la
   domanda non comparirebbe **mai**, e il gioco resterebbe fermo su un
   foglio vuoto senza un errore da nessuna parte. Si è visto giocandolo,
   non leggendolo. */
watch(() => { tic.value; return corsa.value?.chiesta?.id }, (id) => {
  if (!id) { domanda.value = null; return }
  const chiesta = corsa.value.chiesta
  try {
    const q = domandaPerGioco({ difficolta: chiesta.difficolta, evita: ultimoModulo })
    if (!q?.domanda) throw new Error('nessun modulo di quiz')
    ultimoModulo = q.modulo
    domanda.value = q
  } catch (e) {
    /* senza moduli non si blocca un bambino davanti a una porta: si apre
       e via. È l'unico caso in cui una domanda vale sì. */
    domanda.value = null
    risolvi(true)
  }
})

function risposto({ giusto }) {
  domanda.value = null
  risolvi(giusto)
}

function risolvi(giusto) {
  const c = corsa.value
  if (!c) return
  const esito = c.rispondi(giusto)
  tic.value++
  salva()
  if (!esito) return
  scosso.value++
  /* lo scambio resta a schermo un paio di secondi: il tempo di leggerlo
     mentre la domanda dopo si sta già montando */
  if (esito.dato != null || esito.preso != null) {
    scambio.value = { dato: esito.dato || 0, preso: esito.preso || 0, caduto: esito.che === 'caduto' }
    scambioFinoA = orologio + 2.4
  }
  switch (esito.che) {
    case 'colpo': suoni.colpo(); if (esito.male) setTimeout(() => suoni.graffio(), 200); break
    case 'caduto': suoni.colpo(); setTimeout(() => suoni.bottino(), 260); break
    case 'ferito': suoni.ahia(); break
    case 'svenuto': suono.fine(); break
    case 'tesoro': suoni.tesoro(); break
    case 'curiosita': esito.buono ? suoni.tesoro() : suoni.graffio(); break
    case 'aperta': suono.ok(); break
    case 'bevuto': suoni.tesoro(); break
    default: suono.no()
  }
}

/* ═══════════ i tasti dei fogli ═══════════ */
/* Scappare costa un graffio (vedi `Corsa.scappa`), quindi può anche far
   svenire: il suono lo dice, e il foglio che compare da solo è quello
   dello svenimento. */
function scappa() {
  const e = corsa.value.scappa()
  domanda.value = null
  tic.value++
  if (e?.che === 'svenuto') suono.fine()
  else { suoni.graffio(); setTimeout(() => suoni.passo(), 160) }
  salva()
}
function chiudiFoglio() { corsa.value.chiudi(); domanda.value = null; tic.value++ }
/* «riprovo» rimette in piedi all'ingresso — tranne all'ultima occasione,
   dove `riprendi()` risale da sé e la discesa è finita: allora la
   schermata da mostrare è quella di fine, non il campo. */
function riprendi() {
  const c = corsa.value
  c.riprendi()
  tic.value++
  if (c.finita) chiudi()
}
function compra(k) { const e = corsa.value.compra(k); tic.value++; if (e?.che === 'comprato') suono.compra(); salva() }
function vendi(i) { const e = corsa.value.vendi(i); tic.value++; if (e) suoni.bottino(); salva() }
function usa(i) { corsa.value.usa(i); tic.value++; suono.ok(); salva() }
function butta(i) { corsa.value.butta(i); tic.value++; suoni.passo(); salva() }
function riponi(dove) { corsa.value.riponi(dove); tic.value++; suono.ok(); salva() }

function scendi() {
  const e = corsa.value.scendi()
  tic.value++
  if (e?.che === 'finita') return chiudi()
  suono.livello()
  salva()          // un piano nuovo è il momento in cui si perde di più
}

/* ═══════════ com'è finita ═══════════ */
function chiudi() {
  const c = corsa.value
  if (!c) return
  if (!c.finita) c.risali()
  scorda()          // finita o risalita, non c'è più niente da riprendere
  const e = c.esito
  const stelle = stelleDella(e)

  /* prima l'avanzamento, poi i contatori: i traguardi si controllano
     dentro `segna()` e devono vedere la tappa già segnata come fatta */
  if (e.vinta) completa(CHIAVE, tappaIdx.value, QUANTE_TAPPE, { stelle })

  /* i contatori si muovono a fine discesa, non stanza per stanza:
     salvare venti volte per partita non aggiunge niente e costa a ogni
     tocco */
  segna('sotStanze', e.stanze)
  segna('sotPiani', e.piani)
  if (e.mostri) segna('sotMostri', e.mostri)
  if (e.tesori) segna('sotTesori', e.tesori)
  segnaBest('sotGemme', e.gemme)

  const monete = e.vinta ? CAMPAGNA[tappaIdx.value].premio * Math.max(1, stelle) : 0
  if (monete) addCoins(monete)
  if (e.vinta) { if (e.svenimenti === 0) segna('sotInteri'); suono.livello() } else suono.fine()

  fine.value = { vinta: e.vinta, titolo: CAMPAGNA[tappaIdx.value].nome, stelle, monete, fatti: e }
}

function ancora() {
  const vinta = fine.value.vinta
  fine.value = null
  if (vinta) return allaMappa()
  avvia(tappaIdx.value)
}

function allaMappa() {
  cancelAnimationFrame(raf)
  if (pittore) pittore.ferma()
  fine.value = null
  domanda.value = null
  corsa.value = null
}

/* ── tornare su ──
   Uscire a metà **non chiude più la discesa**: si scrive dove si era e
   la mappa la offre in cima. Prima usciva un cartello che raccontava
   com'era andata e la partita finiva lì, che con tre piani da fare vuol
   dire buttare via venti minuti ogni volta che suonano alla porta.

   Si salva **sempre**, anche a mani vuote e dopo due passi. La regola
   con l'eccezione — «solo se hai fatto abbastanza» — sembrava più
   pulita e non lo è: quello che si perde in una discesa appena
   cominciata non sono le gemme, è **la mappa già girata**, e girare al
   buio è metà del gioco. Meglio una carta in più in cima che due minuti
   di corridoi da rifare. */
function indietro() {
  if (!corsa.value && !fine.value) return emit('vai', 'home')
  const c = corsa.value
  if (c && !c.finita && !fine.value) {
    salva({ subito: true })
    ripresa.value = conNome(dice(sosta(CHIAVE), CAMPAGNA))
  }
  allaMappa()
}

/* ═══════════ il dito ═══════════ */
const dita = new Map()
let pizzico = 0, premuto = false, giu = null, ultimoTrascina = 0

function punto(e) {
  const r = tela.value.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}

function premi(e) {
  dita.set(e.pointerId, e)
  if (corsa.value?.foglio || zainoAperto.value || fine.value) return
  if (dita.size > 1) { premuto = false; return }
  premuto = true
  giu = { x: e.clientX, y: e.clientY }
  tela.value.setPointerCapture?.(e.pointerId)
  vai(punto(e), true)
}

/* Tenendo premuto e trascinando, l'eroe insegue il dito: è il modo di
   girare in un posto grande senza toccare quaranta volte. Si ricalcola
   di rado apposta — a ogni fotogramma il percorso tremerebbe e il passo
   verrebbe a scatti. */
function muovi(e) {
  if (dita.has(e.pointerId)) dita.set(e.pointerId, e)
  if (dita.size === 2) return pizzica()
  if (!premuto || corsa.value?.foglio) return
  if (giu && Math.hypot(e.clientX - giu.x, e.clientY - giu.y) < FERMO_PX) return
  const ora = performance.now()
  if (ora - ultimoTrascina < 140) return
  ultimoTrascina = ora
  vai(punto(e), false)
}

function pizzica() {
  premuto = false                                   // due dita non camminano
  const [a, b] = [...dita.values()]
  const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
  if (!pizzico) { pizzico = d; return }
  if (Math.abs(d - pizzico) < 45) return
  if (pittore.zoomA(pittore.scala + (d > pizzico ? 1 : -1))) suoni.passo()
  pizzico = d
}

function lascia(e) {
  if (e.pointerType !== 'mouse') zittisciIlFantasma(e.clientX, e.clientY)
  dita.delete(e.pointerId)
  if (dita.size < 2) pizzico = 0
  premuto = false
  giu = null
}

/* Il click che il dito si lascia dietro va ingoiato prima che arrivi a
   un tasto del foglio appena comparso. */
function zittisciIlFantasma(x, y) {
  const t0 = performance.now()
  const smetti = () => removeEventListener('click', zitto, true)
  const zitto = ev => {
    if (performance.now() - t0 > FANTASMA_MS) return smetti()
    if (Math.hypot(ev.clientX - x, ev.clientY - y) > FANTASMA_PX) return
    ev.stopPropagation(); ev.preventDefault(); smetti()
  }
  addEventListener('click', zitto, true)
  setTimeout(smetti, FANTASMA_MS + 20)
}

function vai(p, preciso) {
  const c = corsa.value
  if (!c || c.finita) return
  c.vaiVerso(pittore.cellaDa(p.x, p.y), preciso)
  tic.value++
}

function rotella(e) {
  if (!pittore) return
  pittore.zoomA(pittore.scala + (e.deltaY < 0 ? 1 : -1))
}

function nienteClickDalCampo(e) { if (e.cancelable) e.preventDefault() }

/* ── il telefono che si mette in tasca ──
   Su un telefono l'app non si chiude: sparisce. `visibilitychange` è
   l'ultimo momento in cui si può ancora scrivere, e `flushNow` serve
   perché il salvataggio pigro potrebbe non scattare mai. */
function seSparisce(e) {
  if (e?.type === 'pagehide' || document.visibilityState === 'hidden') salva({ subito: true })
}

onMounted(() => {
  addEventListener('resize', ridimensiona)
  addEventListener('visibilitychange', seSparisce)
  addEventListener('pagehide', seSparisce)
})
onUnmounted(() => {
  salva({ subito: true })
  removeEventListener('resize', ridimensiona)
  removeEventListener('visibilitychange', seSparisce)
  removeEventListener('pagehide', seSparisce)
  cancelAnimationFrame(raf)
  if (pittore) pittore.ferma()
})
function ridimensiona() { if (pittore) pittore.misura() }
</script>

<template>
  <div class="schermo">
    <Barra :titolo="titolo" guida="sotterraneo" @aiuto="aiutoAperto = $event" :monete="!corsa" scura @indietro="indietro">
      <button v-if="corsa && eroe" class="sot-io" data-azione="zaino-barra"
              aria-label="lo zaino" @click="zainoAperto = true">
        <span class="sot-polso" :style="{ '--sot-polso': eroe.polso }">
          <i :style="{ width: eroe.quota * 100 + '%' }"></i>
          <b>{{ eroe.vita }}</b>
        </span>
        <span class="sot-n em">⚔️<b>{{ eroe.att }}</b></span>
        <span class="sot-n em">🛡️<b>{{ eroe.dif }}</b></span>
        <span class="sot-n em">💎<b>{{ eroe.gemme }}</b></span>
        <span class="sot-n em">🎒</span>
      </button>
    </Barra>

    <div class="sot">
      <template v-if="!corsa">
        <Campagna :tappe="tappe" :ripresa="ripresa" :eroe="eroeScheda"
                  @gioca="avvia" @riprendi="riprendiDiscesa" @scorda="scorda"
                  @eroe="scegliEroe = true" />
        <Eroi v-if="scegliEroe" :eroi="EROI" :scelto="chiEro || ''" :primo="!chiEro"
              @scegli="scegli" @chiudi="scegliEroe = false" />
      </template>

      <template v-else>
        <div class="sot-campo">
          <!-- il campo si tocca coi puntatori: un click qui sotto non
               serve mai a nessuno, e quello che il dito si lascia dietro
               finirebbe sul foglio appena aperto -->
          <canvas ref="tela" class="sot-tela"
                  @pointerdown="premi" @pointermove="muovi" @pointerup="lascia"
                  @pointercancel="lascia" @touchend="nienteClickDalCampo"
                  @wheel.prevent="rotella"></canvas>

          <p class="sot-piede">
            piano {{ eroe.piano }} di {{ eroe.piani }} ·
            <span v-if="eroe.chiave" class="em">🗝️ la scala è aperta</span>
            <span v-else>la chiave ce l'ha qualcuno, qua sotto</span>
          </p>
          <!-- ═══ lo zaino, dove il pollice lo trova ═══
               Si apriva toccando la fascia dei numeri in cima, e nessuno
               lo sapeva: una fascia con dentro dei conti non ha l'aria
               di un tasto, e in cima allo schermo il pollice non ci
               arriva. Qui è un tasto tondo in basso a destra, con
               scritto quante tasche sono piene — così si vede anche
               *quando conviene aprirlo*. -->
          <button class="sot-zaino-tasto" data-azione="zaino" aria-label="zaino"
                  @click="zainoAperto = true">
            <span class="em">🎒</span>
            <b>{{ pieni }}/{{ TASCHE }}</b>
          </button>

          <p v-if="avviso" class="sot-avviso">
            <Icona v-if="avviso.cosa" :sprite="avviso.sprite" :em="avviso.em" :emAlto="20" />
            {{ avviso.testo }}
          </p>
        </div>

        <!-- ═══ lo scontro: al centro, non dal basso ═══
             Gli altri fogli salgono dal basso e lasciano vedere il campo,
             che è giusto: ci si sta decidendo se aprire una porta, e la
             caverna intorno è metà della decisione. Una battaglia no. Un
             mostro addosso arriva **mentre si cammina**, quindi il foglio
             compariva in fondo allo schermo, dove chi stava guardando il
             proprio eroe non lo vedeva affatto; e per non lasciarlo
             sotto il pannello la telecamera si spostava — cioè la scena
             si muoveva da sola nel momento peggiore. Al centro il mostro
             è dove stanno già gli occhi e niente si sposta.

             Non porta la classe `sot-foglio` apposta: `misuraFoglio()`
             cerca quella, e non trovandola la telecamera smette da sé di
             fare spazio a un pannello che spazio non ne chiede. -->
        <div v-if="foglio && foglio.che === 'scontro'" class="sot-velo">
          <div class="sot-modale">
            <Scontro v-bind="nemico" :scosso="scosso" :scambio="scambio" />
            <div v-if="domanda" class="sot-domanda">
              <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                       :origine="domanda" gioco="sotterraneo" :respiro="900"
                       @risposto="risposto" />
            </div>
            <!-- il costo sta **sul tasto**: scappare toglie un graffio,
                 come restare e rispondere bene, e chi sceglie deve
                 vederlo prima e non nell'avviso che arriva dopo -->
            <button class="sot-grosso sot-chiaro" data-azione="scappa" @click="scappa">
              <span class="em">🏃</span> scappo via
              <small v-if="nemico">ti graffia ❤️ −{{ nemico.graffio }}</small>
            </button>
          </div>
        </div>

        <Foglio v-else-if="foglio && foglio.che === 'porta'" em="🚪" titolo="Una porta chiusa"
                :dice="segno ? segno.em + ' ' + segno.dice : ''">
          <div v-if="domanda" class="sot-domanda">
            <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                     :origine="domanda" gioco="sotterraneo" :respiro="900"
                     @risposto="risposto" />
          </div>
          <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
            ci torno dopo
          </button>
        </Foglio>

        <Foglio v-else-if="foglio && foglio.che === 'forziere'" em="🎁" titolo="Un forziere"
                dice="Una domanda sola. Se la sbagli, resta chiuso per sempre.">
          <div v-if="domanda" class="sot-domanda">
            <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                     :origine="domanda" gioco="sotterraneo" :respiro="900"
                     @risposto="risposto" />
          </div>
          <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
            non me la sento
          </button>
        </Foglio>

        <Foglio v-else-if="foglio && foglio.che === 'fonte'" em="⛲" titolo="Una fonte"
                dice="Acqua pulita. Rispondi e bevi.">
          <div v-if="domanda" class="sot-domanda">
            <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                     :origine="domanda" gioco="sotterraneo" :respiro="900"
                     @risposto="risposto" />
          </div>
          <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
            più tardi
          </button>
        </Foglio>

        <!-- al centro come lo zaino: qui si sta scegliendo, non si sta
             camminando, e adesso che si vende è anche il pannello più
             lungo del gioco -->
        <Foglio v-else-if="foglio && foglio.che === 'mercante'" em="🧙" titolo="Il mercante" centro
                :dice="`Hai 💎 ${eroe.gemme}. Quello che compri finisce nello zaino.`">
          <Mercante :roba="merce" :tasche="daVendere" :gemme="eroe.gemme"
                    @compra="compra" @vendi="vendi" @chiudi="chiudiFoglio" />
        </Foglio>

        <!-- ═══ una curiosità ═══
             Una domanda, e poi **la battuta**: il foglio non si chiude
             da sé, perché quella frase è il premio vero e una riga che
             passa in mezzo secondo non la legge nessuno. -->
        <Foglio v-else-if="foglio && foglio.che === 'curiosita'"
                :em="curiosita.em" :sprite="curiosita.pezzo"
                :titolo="curiosita.nome"
                :dice="foglio.esito ? '' : curiosita.dice + ' Può andare bene, o male.'">
          <template v-if="foglio.esito">
            <p class="sot-storia">{{ foglio.esito.dice }}</p>
            <p v-if="foglio.esito.conto" class="sot-cambio em"
               :class="{ 'sot-meglio': foglio.esito.buono }">{{ foglio.esito.conto }}</p>
            <button class="sot-grosso" data-azione="avanti" @click="chiudiFoglio">
              vado avanti
            </button>
          </template>
          <template v-else>
            <div v-if="domanda" class="sot-domanda">
              <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                       :origine="domanda" gioco="sotterraneo" :respiro="900"
                       @risposto="risposto" />
            </div>
            <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
              lascio perdere
            </button>
          </template>
        </Foglio>

        <Foglio v-else-if="foglio && foglio.che === 'chiusa'" em="🔒" titolo="La scala è chiusa"
                :dice="foglio.visto && foglio.chi
                  ? `Un cancello di ferro. La chiave ce l'ha ${foglio.chi.nome.toLowerCase()}, ed è segnato in oro sulla mappina.`
                  : 'Un cancello di ferro, e la serratura non ha buco per le dita. La chiave ce l\'ha qualcuno, qua sotto.'">
          <button class="sot-grosso" data-azione="cerca" @click="chiudiFoglio">
            vado a cercarla
          </button>
        </Foglio>

        <Foglio v-else-if="foglio && foglio.che === 'scala'" em="🕳️" titolo="La scala che scende"
                :dice="foglio.ultimo
                  ? 'Da qui si risale, e quello che hai trovato resta la tua storia.'
                  : 'Sotto è più buio, i mostri hanno più ossa e le domande si fanno toste. Quello che hai addosso scende con te.'">
          <button class="sot-grosso" data-azione="scendi" @click="scendi">
            {{ foglio.ultimo ? 'esco dal sotterraneo' : `scendo al piano ${eroe.piano + 1}` }}
          </button>
          <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
            prima giro ancora
          </button>
        </Foglio>

        <!-- ═══ svenuto ═══
             Due cartelli, e la differenza è tutta nel numero che resta.
             Finché ci sono occasioni si torna all'ingresso e si dice
             **quante ne restano**: un fondo che non si vede arrivare è
             una partita che finisce senza motivo. All'ultima si risale,
             e il tasto lo dice prima di premerlo. -->
        <Foglio v-else-if="foglio && foglio.che === 'svenuto'" em="💫"
                :titolo="foglio.ultimo ? 'Non ti reggi più in piedi' : 'Ti sei svegliato all\'ingresso'"
                :dice="foglio.ultimo
                  ? 'Ti hanno portato su. Il sotterraneo resta lì: questa discesa ricomincia da capo.'
                  : 'Qualcuno ti ha trascinato fuori. Le gemme che avevi in tasca non ci sono più, ma quello che avevi addosso sì.'">
          <p v-if="!foglio.ultimo" class="sot-storia">
            Ancora <b>{{ foglio.restano }}</b>
            {{ foglio.restano === 1 ? 'volta' : 'volte' }}, poi si risale.
          </p>
          <button class="sot-grosso" data-azione="riprendi" @click="riprendi">
            {{ foglio.ultimo ? 'torno su' : 'riprovo' }}
          </button>
        </Foglio>

        <!-- ═══ lo zaino: al centro, come lo scontro ═══
             Dal basso era un'appendice del campo: il gioco si fermava e
             non si capiva perché, perché quello che si vedeva era
             sempre la caverna. Al centro la ragione per cui non ci si
             muove sta in mezzo allo schermo. -->
        <Foglio v-else-if="zainoAperto" em="🎒" titolo="Lo zaino" centro>
          <Zaino v-bind="zaino" :eroe="eroeScheda"
                 :att="eroe.att" :dif="eroe.dif" :gemme="eroe.gemme"
                 :vita="eroe.vita" :vitaMax="eroe.vitaMax"
                 :piano="eroe.piano" :piani="eroe.piani"
                 @usa="usa" @butta="butta" @riponi="riponi"
                 @chiudi="zainoAperto = false" />
        </Foglio>

        <Fine v-if="fine" v-bind="fine" @ancora="ancora" @esci="allaMappa" />
      </template>
    </div>
  </div>
</template>
