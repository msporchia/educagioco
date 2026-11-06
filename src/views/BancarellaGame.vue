<script setup>
/* LA BANCARELLA — la cucina: le ordinazioni, il cuoco, la cassa. Vedi docs/bancarella/cucina.md. */
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, onUnmounted } from 'vue'
import { state, answer, segna, segnaBest, tappaAperta } from '../store/profile.js'
import { nuovoOrdine, tappaDi, scomponi, euro, centesimiScritti, scriviCifra, premioCliente, ORDINI_PER_TAPPA } from '../data/bancarella.js'
import { CUCINE, ricetteDi, bancoPulito, orologio } from '../data/bancarella-cucine.js'
import { FOTO } from '../data/bancarella-foto.js'
import { cucinaNuova, passo as passoCucina, usa, tocca, vaiA, arriva, consegna as daiPiatto, cheManca } from '../motore/bancarella/cucina.js'
import { suono } from '../audio.js'
import { usaAmici } from '../amici/usaAmici.js'
import { borsa } from '../store/varieta.js'
import Barra from '../components/Barra.vue'
import TastoSalta from '../components/TastoSalta.vue'
import Cucina from '../components/bancarella/Cucina.vue'
import Ordini from '../components/bancarella/Ordini.vue'
import LeCucine from '../components/bancarella/LeCucine.vue'
import Ricetta from '../components/bancarella/Ricetta.vue'
import Soldo from '../components/Soldo.vue'
import { usaPausa } from '../giochi/pausa.js'
import VeloPausa from '../giochi/VeloPausa.vue'
import Ripresa from '../giochi/Ripresa.vue'
import { sosta, salvaSosta, buttaSosta, ritocca, segnaPrimato } from '../giochi/campagne.js'
import { fraseDiFine } from '../giochi/primati.js'
import { scrivi, leggi, dice } from '../motore/bancarella/sosta.js'

const emit = defineEmits(['vai'])

const CHIAVE = 'bancarella'
const CUORI = 3
const STACCO_ORDINI = 20            // le ordinazioni scadono una dopo l'altra, così c'è il tempo di farle
// le monete di questo livello: un'ordinazione pagata paga subito (docs/apprendimento/calibrazione.md)
let borsellino = borsa(CHIAVE)
const guadagno = reactive({ monete: 0, nota: '' })
/* i dodici tasti della cassa, nell'ordine di un registratore vero: le
   cifre, la virgola e il cancelletto. Il ✓ sta a parte perché è l'unico
   che manda qualcosa — gli altri scrivono e basta. */
const TASTI = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫']
const fase = ref('cucine')          // cucine | gioco | fine
const livello = ref(0)              // l'indice in CUCINE
const nTappa = ref(0)               // a che giro di ordinazioni siamo
const coda = ref([])                // le ordinazioni: quella che si paga sta in cima
const piatto = ref([])              // le monete già posate
const hud = reactive({ cuori: CUORI, serviti: 0, perfetti: 0, incasso: 0, resta: 0 })   // `resta`: i secondi, nell'ultima
const momento = ref('cucina')       // cucina | cassa
const sbagliato = ref('')
const rifiutata = ref(0)
const bonus = ref(false)
const moneta = ref(0)
const digitato = ref('')            // la cifra che sta battendo sulla cassa
const contoFatto = ref(false)       // il totale l'ha già indovinato
const cambio = ref(null)            // il cartello fra un giro e l'altro
const esito = ref('')               // vinta | persa | tempo
const cucina = ref(cucinaNuova())   // la stanza, il cuoco, i piatti
const cucineAperte = /[#&](aperte|livello)=/.test(location.hash)   // la prova dei grandi
const ricettaAperta = ref('')       // il piatto di cui si legge la ricetta: intanto il tempo si ferma
const dettoCuoco = ref(null)        // il perché di un tocco a vuoto
const frasePrimato = ref('')        // alla fine della cucina senza fine: com'è andata col record

/* L'incasso resta. */
const mioBanco = ref(bancoPulito((state.profile.campagne || {}).bancarella?.banco, state.profile.totals.incasso))
const scriviBanco = (b, opzioni) => {
  mioBanco.value = b
  ritocca(CHIAVE, c => { c.banco = b }, opzioni)
}
const incassa = cent => scriviBanco({ ...mioBanco.value, cassa: mioBanco.value.cassa + cent })
let raf = 0, ultimo = 0, apertoIl = 0, occupato = false, rifiuti = 0, ordiniFatti = 0

const amici = usaAmici(CHIAVE)
const puoGiocare = k => cucineAperte || tappaAperta(k, mioBanco.value.cucina.fatte)

const camp = computed(() => CUCINE[livello.value])
const T = computed(() => tappaDi(camp.value, nTappa.value))
const cliente = computed(() => coda.value[0] || null)
const dato = computed(() => piatto.value.reduce((s, c) => s + c, 0))
const manca = computed(() => (cliente.value ? cliente.value.resto - dato.value : 0))
const monetine = computed(() => (cliente.value ? cliente.value.monete.filter(v => v < 500) : []))
const carte = computed(() => (cliente.value ? cliente.value.monete.filter(v => v >= 500) : []))
const barra = c => Math.max(0, Math.min(100, c.restaPazienza / c.pazienza * 100))

const { inPausa, fermo, aiutoAperto, metti: mettiInPausa, togli: togliLaPausa,
        aiuto: leggeLaGuida } = usaPausa({ anche: () => fase.value !== 'gioco' })
const dovEravamo = computed(() => (fase.value === 'gioco' ? camp.value.nome : ''))

/* `setTimeout`, a differenza del `ciclo` a fotogrammi, non si congela da sé
   a pagina nascosta: qui si congela quello che resta e riparte da lì. */
let timer = 0, scadeIl = 0, restaAl = 0, faPoi = null

function programma(fn, ms) {
  clearTimeout(timer)
  faPoi = fn
  // a velo su resta congelato, come farebbe il `watch` qui sotto
  if (inPausa.value || aiutoAperto.value) { timer = 0; restaAl = ms; return }
  scadeIl = performance.now() + ms
  timer = setTimeout(() => { timer = 0; const f = faPoi; faPoi = null; f() }, ms)
}

function spegniOrologio() {
  clearTimeout(timer); timer = 0; faPoi = null; restaAl = 0
}

watch(() => inPausa.value || aiutoAperto.value, giu => {
  if (giu) {
    if (!timer) return
    restaAl = Math.max(0, scadeIl - performance.now())
    clearTimeout(timer); timer = 0
  } else if (!timer && faPoi) {
    programma(faPoi, restaAl)
  }
})

/* il livello */
function inizia(k = livello.value) {
  if (!puoGiocare(k)) return
  scorda()
  togliLaPausa()
  spegniOrologio()
  livello.value = k
  cucina.value = cucinaNuova(CUCINE[k])
  ricettaAperta.value = ''
  nTappa.value = 0
  hud.cuori = CUORI; hud.serviti = 0; hud.perfetti = 0; hud.incasso = 0; hud.resta = CUCINE[k].durata || 0
  borsellino = borsa(CHIAVE); Object.assign(guadagno, { monete: 0, nota: '' })
  occupato = false; esito.value = ''
  fase.value = 'gioco'
  apriTappa()
  accendi()
}

function accendi() {
  ultimo = 0
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(ciclo)
}

/* Un giro di ordinazioni. Finché il cartello è su il tempo non scorre. */
function apriTappa() {
  const t = T.value, piatti = ricetteDi(t.camp.ricette)
  coda.value = Array.from({ length: ORDINI_PER_TAPPA }, (_, i) => {
    const o = nuovoOrdine(t, piatti)
    const pazienza = o.pazienza + i * STACCO_ORDINI
    return { ...o, pazienza, restaPazienza: pazienza, fatti: [], id: ++ordiniFatti }
  })
  allaCucina()
  cambio.value = { n: nTappa.value }
  programma(() => { cambio.value = null; allaCucina() }, 1500)
}

function allaCucina() {
  momento.value = 'cucina'
  piatto.value = []
  digitato.value = ''
  contoFatto.value = false
  rifiuti = 0
  bonus.value = false
  occupato = false
}

/* pagata la prima, si torna ai fornelli: se non ne restano, il giro è finito */
function prossimo() {
  coda.value.shift()
  allaCucina()
  if (!coda.value.length) tappaFinita()
  salva()
}

function tappaFinita() {
  nTappa.value++
  // un giro finito ridà fiato: un cuore, mai più di tre
  hud.cuori = Math.min(CUORI, hud.cuori + 1)
  if (nTappa.value >= camp.value.tappe) return chiudi('vinta')
  apriTappa()
}

/* ---------- la cucina ----------
   Le ordinazioni si fanno in qualsiasi ordine, e quella finita passa in cima per farsi pagare. */
const mancaA = o => o.articoli.map(a => a.emoji).filter(e => !o.fatti.includes(e))
const toccaStanza = d => (d.id ? tocca(cucina.value, d.id) : vaiA(cucina.value, d.x, d.z))

/* Il cuoco è arrivato dove si era toccato: si fa quello che lì è ovvio. */
function agisciCuoco() {
  if (occupato || cambio.value || !cliente.value) return
  const k = cucina.value, posto = arriva(k)
  if (posto.tipo === 'consegna' ? serviDalleMani() : usa(k, posto)) return suono.nota(720, 980, 0.07, 'triangle', 0.1)
  suono.no()
  if (k.perche) dettoCuoco.value = { testo: k.perche }
}

function serviDalleMani() {
  const k = cucina.value, m = k.cuoco.mano, emoji = m?.nudo ? '' : m?.pronto
  const o = emoji && coda.value.find(c => mancaA(c).includes(emoji))
  k.perche = momento.value !== 'cucina' ? 'Prima dai il resto'
    : !m ? 'Qui si porta il piatto finito'
    : !o ? cheManca(k, m, coda.value.flatMap(mancaA)) : ''
  if (k.perche) return false
  daiPiatto(k, [emoji])
  o.fatti.push(emoji)
  if (mancaA(o).length) return true
  coda.value = [o, ...coda.value.filter(c => c !== o)]
  allaCassa()
  return true
}

function ordineScaduto(o) {
  suono.no()
  coda.value = coda.value.filter(c => c !== o)
  if (!camp.value.durata && --hud.cuori <= 0) return chiudi('persa')
  if (!coda.value.length) tappaFinita()
}

/* Alla cassa si conta da fermi, sempre: la fretta sta nel muoversi. */
function tempoCucina(dt) {
  if (momento.value === 'cassa') return
  if (camp.value.durata && (hud.resta -= dt) <= 0) return chiudi('tempo')
  for (const o of coda.value) o.restaPazienza -= dt
  passoCucina(cucina.value, dt)
  if (cucina.value.arrivato) agisciCuoco()
  const via = coda.value.find(o => o.restaPazienza <= 0)
  if (via) ordineScaduto(via)
}

const ordini = computed(() => coda.value.map(o => ({
  id: o.id, quanto: barra(o), pagando: momento.value === 'cassa' && o === coda.value[0],
  piatti: o.articoli.map(a => ({ emoji: a.emoji, nome: a.nome, fatto: o.fatti.includes(a.emoji) })),
})))

/* ---------- la cassa ----------
   `chiediTotale`/`aMente` sono `conto` (vedi data/bancarella.js) scomposto in due
   domande. Finché il totale non è indovinato il cassetto non si apre nemmeno. */
function allaCassa() {
  momento.value = 'cassa'
  apertoIl = performance.now()
}

const aMente = computed(() => !!(cliente.value && cliente.value.chiediResto))
const chiediTotale = computed(() => !!(cliente.value && cliente.value.chiediTotale) && !contoFatto.value)

/* Il totale battuto sulla cassa: mai la cifra giusta, solo troppo o poco. */
function batti(t) {
  if (occupato || !cliente.value || momento.value !== 'cassa' || !chiediTotale.value) return
  digitato.value = scriviCifra(digitato.value, t)
  suono.nota(600, 700, 0.05, 'square', 0.05)
}

function nonTorna() {
  rifiuti++
  sbagliato.value = 'conto'
  setTimeout(() => { if (sbagliato.value === 'conto') sbagliato.value = '' }, 600)
  suono.no()
}

function confermaTotale() {
  const c = cliente.value
  if (occupato || !c || momento.value !== 'cassa' || !chiediTotale.value) return
  const detto = centesimiScritti(digitato.value)
  if (detto === null) return
  if (detto === c.totale) {
    contoFatto.value = true
    suono.nota(720, 980, 0.09, 'triangle', 0.11)
    return
  }
  nonTorna()
  digitato.value = ''
}

function metti(v) {
  const c = cliente.value
  if (occupato || !c || momento.value !== 'cassa' || chiediTotale.value) return
  if (!c.chiediResto && dato.value + v > c.resto) {
    // non si sbaglia per eccesso: la moneta è rifiutata
    rifiuti++
    rifiutata.value = v
    setTimeout(() => { if (rifiutata.value === v) rifiutata.value = 0 }, 420)
    suono.no()
    return
  }
  piatto.value.push(v)
  suono.nota(680, 900, 0.06, 'triangle', 0.09)
  if (!c.chiediResto && dato.value === c.resto) consegna()
}

const togli = () => { if (!occupato) piatto.value.pop() }

/* «Ecco il resto»: a mente. Se non torna si riprova, non si perde un cuore né si scopre la cifra. */
function proponi() {
  const c = cliente.value
  if (occupato || !c || momento.value !== 'cassa' || chiediTotale.value || !piatto.value.length) return
  if (dato.value === c.resto) return consegna()
  nonTorna()
}

function paga(c) {
  const preso = borsellino.paga(premioCliente(camp.value))
  guadagno.monete = borsellino.dato
  if (preso) { moneta.value = preso; setTimeout(() => (moneta.value = 0), 1100) }
  incassa(c.totale)
}

/* Il tasto «salta» dei grandi (docs/core/comandi.md): il conto è dato per fatto. Paga come
   un'ordinazione servita, ma non lo è: niente ripasso, niente contatori. */
function salta() {
  const c = cliente.value
  if (occupato || !c || momento.value !== 'cassa') return
  occupato = true
  suono.moneta()
  paga(c)
  programma(prossimo, 600)
}

function consegna() {
  occupato = true
  const c = cliente.value
  const perfetto = piatto.value.length === c.minimo
  answer(c.chiave, { correct: rifiuti === 0, ms: performance.now() - apertoIl })
  hud.serviti++; hud.incasso += c.totale
  segna('clienti'); segna('incasso', c.totale)
  if (perfetto) { hud.perfetti++; bonus.value = true; segna('restiPerfetti') }
  suono.moneta()
  paga(c)
  programma(prossimo, 900)
}

/* ---------- il tempo ---------- */
function ciclo(ts) {
  const dt = Math.min(0.05, (ts - ultimo) / 1000 || 0); ultimo = ts
  if (!fermo.value && !cambio.value && !occupato && !ricettaAperta.value) tempoCucina(dt)
  raf = requestAnimationFrame(ciclo)
}

function chiudi(come) {
  scorda()
  esito.value = come
  guadagno.nota = borsellino.nota()
  fase.value = 'fine'
  cancelAnimationFrame(raf)
  spegniOrologio()
  cambio.value = null
  segnaBest('clienti', hud.serviti)
  frasePrimato.value = camp.value.infinita
    ? fraseDiFine(segnaPrimato(CHIAVE, hud.serviti, Date.now(), { incasso: hud.incasso, banchi: nTappa.value }), 'quanti') : ''
  if (come === 'vinta') {
    segna('mercati')
    const b = mioBanco.value
    if (livello.value >= b.cucina.fatte) scriviBanco({ ...b, cucina: { ...b.cucina, fatte: livello.value + 1 } }, { subito: true })
  }
  suono.fine()
}

const dopo = computed(() => (livello.value + 1 < CUCINE.length ? livello.value + 1 : null))
function alleCucine() {
  salva({ subito: true })
  spegniOrologio()
  cancelAnimationFrame(raf)
  ripresa.value = laRipresa()
  fase.value = 'cucine'
}
function indietro() {
  if (fase.value === 'cucine') esci()
  else alleCucine()
}

/* ── il livello lasciato a metà ── */
const laRipresa = () => {
  const d = dice(sosta(CHIAVE))
  return d && { emoji: '🍳', nome: d.nome, dettaglio: [d.tappa, '❤️'.repeat(d.cuori), `🧾 ${d.serviti}`].filter(Boolean).join(' · ') }
}
const ripresa = ref(laRipresa())
const chiede = ref(null)           // { nome, k }: il livello nuovo che butterebbe quello a metà

const foto = () => ({
  livello: livello.value, nTappa: nTappa.value, hud, coda: coda.value, cucina: cucina.value, momento: momento.value,
  piatto: piatto.value, digitato: digitato.value, contoFatto: contoFatto.value, rifiuti,
  cartello: !!cambio.value, monete: { chiesto: borsellino.chiesto, dato: borsellino.dato },
})

function salva({ subito = false } = {}) {
  if (fase.value !== 'gioco') return
  // l'ordinazione appena pagata ha già pagato: il suo giro si chiude prima di scrivere
  if (occupato && faPoi === prossimo) {
    spegniOrologio(); prossimo()
    if (fase.value !== 'gioco') return       // era l'ultima del livello
  }
  salvaSosta(CHIAVE, scrivi(foto()), { subito })
}

function scorda() {
  if (sosta(CHIAVE)) buttaSosta(CHIAVE)
  ripresa.value = null
  chiede.value = null
}

function vuoleIniziare(k) {
  if (!puoGiocare(k)) return
  if (!ripresa.value) return inizia(k)
  chiede.value = { nome: CUCINE[k].nome, k }
}
const comincia = () => inizia(chiede.value.k)

// se il salvataggio non si legge più la carta sparisce e restano i livelli
function riprendiPartita() {
  const g = leggi(sosta(CHIAVE))
  if (!g) return scorda()
  spegniOrologio()
  // il livello ripreso nasce fermo, dietro il velo: riparte al tocco
  mettiInPausa({ auto: true })
  livello.value = g.livello
  nTappa.value = g.nTappa
  Object.assign(hud, { resta: CUCINE[g.livello].durata || 0 }, g.hud)
  borsellino = borsa(CHIAVE, g.monete)
  Object.assign(guadagno, { monete: borsellino.dato, nota: '' })
  coda.value = g.coda
  cucina.value = g.cucina
  occupato = false; bonus.value = false; esito.value = ''
  ripresa.value = null
  chiede.value = null
  ricettaAperta.value = ''
  fase.value = 'gioco'
  momento.value = g.momento
  piatto.value = g.piatto
  digitato.value = g.digitato
  contoFatto.value = g.contoFatto
  rifiuti = g.rifiuti
  apertoIl = performance.now()
  if (g.cartello) {
    cambio.value = { n: nTappa.value }
    programma(() => { cambio.value = null; allaCucina() }, 1500)
  } else cambio.value = null
  accendi()
}

function esci() {
  salva({ subito: true })
  emit('vai', 'home')
}

// su un telefono l'app non si chiude, sparisce: è l'ultimo momento per scrivere
function seSparisce(e) {
  if (e?.type === 'pagehide' || document.visibilityState === 'hidden') salva({ subito: true })
}
onMounted(() => {
  window.__shop = { fase, coda, piatto, hud, inizia, metti, togli, proponi, mioBanco, cliente, dato, manca, scomponi, momento,
                    tappa: nTappa, camp, T, cambio, esito, batti, confermaTotale, digitato, contoFatto, chiediTotale, aMente,
                    TASTI, cucina, guadagno, inPausa, chiudi, livello }
  // la sosta del mercato che non c'è più non si legge: via
  if (sosta(CHIAVE) && !leggi(sosta(CHIAVE))) scorda()
  const n = Number((location.hash.match(/livello=(\d+)/) || [])[1])
  if (n >= 1 && n <= CUCINE.length) inizia(n - 1)
  document.addEventListener('visibilitychange', seSparisce)
  addEventListener('pagehide', seSparisce)
})
onUnmounted(() => { cancelAnimationFrame(raf); spegniOrologio() })
// prima di smontare: dopo, le ordinazioni non ci sono più
onBeforeUnmount(() => {
  salva({ subito: true })
  document.removeEventListener('visibilitychange', seSparisce)
  removeEventListener('pagehide', seSparisce)
})
</script>

<template>
  <div class="schermo negozio">
    <!-- niente salvadanaio in barra: qui si maneggiano euro, e lo spazio serve ai cuori -->
    <!-- in partita il titolo cede il posto ai cuori: con le ordinazioni che scadono servono -->
    <Barra :titolo="fase === 'gioco' ? '' : 'La cucina'" guida="bancarella" :monete="fase !== 'gioco'"
           :pausa="fase === 'gioco' && !state.festa.length" @pausa="mettiInPausa()"
           @aiuto="leggeLaGuida" @indietro="indietro">
      <template v-if="fase === 'gioco'">
        <div v-if="camp.durata" class="gettone" :class="{ poco: hud.resta < 30 }" data-resta>⏱️ <b>{{ orologio(hud.resta) }}</b></div>
        <div v-else class="gettone">{{ '❤️'.repeat(Math.max(0, hud.cuori)) || '💔' }}</div>
        <div class="gettone">🧾 <b>{{ hud.serviti }}</b></div>
        <div class="gettone">✨ <b>{{ hud.perfetti }}</b></div>
      </template>
    </Barra>

    <template v-if="fase === 'cucine'">
      <div class="in-cima">
        <Ripresa :ripresa="ripresa" :chiede="chiede ? chiede.nome : ''"
                 @riprendi="riprendiPartita" @scorda="scorda"
                 @comincia="comincia" @annulla="chiede = null" />
      </div>
      <!-- chi è da raggiungere -->
      <p v-if="amici.davanti" class="davanti" data-amico-davanti>{{ amici.davanti }}</p>
      <LeCucine :banco="mioBanco" :aperte="cucineAperte" @scegli="vuoleIniziare" />
    </template>

    <template v-else-if="fase === 'gioco'">
      <Ordini :ordini="ordini" :tappa="camp.infinita ? 'giro ' + (T.i + 1) : (T.i + 1) + '/' + camp.tappe" @ricetta="e => (ricettaAperta = e)" />

      <div class="banco">
        <Ricetta v-if="ricettaAperta" :ricetta="cucina.ricette.find(r => r.emoji === ricettaAperta)" @chiudi="ricettaAperta = ''" />
        <Cucina :stato="cucina" :detto="dettoCuoco" @tocca="toccaStanza" />

        <!-- il resto non chiude i fornelli: sta in un foglio, e finché non è dato non si va avanti -->
        <div v-if="momento === 'cassa'" class="cassa">
          <!-- i soldi si mostrano e non si dicono: si contano -->
          <div class="porge" data-porge>
            <small>Ti danno</small><Soldo v-for="(m, i) in cliente.pagaCon" :key="i" :cents="m" mini />
          </div>
          <div class="macchina">
            <div class="scontrino">
              <div class="voci">
                <span v-for="a in cliente.articoli" :key="a.emoji">
                  <img class="foto-voce" :src="FOTO['piatto:' + a.emoji]" :alt="a.nome">
                  <b>{{ euro(a.prezzo) }}</b>
                </span>
              </div>
              <div class="somma" :class="{ daFare: chiediTotale }">
                <span>TOTALE</span><b>{{ chiediTotale ? '? ? ?' : euro(cliente.totale) }}</b>
              </div>
            </div>
            <div class="corpo" :class="{ rotta: aMente || chiediTotale }">
              <!-- mentre batte il totale mostra quello che sta scrivendo, come su un registratore vero -->
              <div class="display" v-if="chiediTotale">
                <span>QUANTO FA?</span>
                <b>{{ digitato ? digitato + ' €' : '_ _ _' }}</b>
                <span>BATTI IL TOTALE</span>
              </div>
              <div class="display" v-else>
                <span>IL RESTO</span>
                <b>{{ aMente ? '? ? ?' : euro(cliente.resto) }}</b>
                <span>{{ aMente ? 'CONTALO TU' : 'DA DARE' }}</span>
              </div>
              <div class="tastiera"><i v-for="n in 12" :key="n"></i></div>
            </div>
          </div>

          <!-- per provare i giochi: la leva di #admin, docs/core/comandi.md -->
          <TastoSalta @salta="salta" />

          <!-- la tastiera vera sta qui e non nel registratore: dodici tasti
               larghi due centimetri non ci stanno in 74 pixel -->
          <div v-if="chiediTotale" class="tastierone" :class="{ nonTorna: sbagliato === 'conto' }">
            <button v-for="t in TASTI" :key="t" class="tasto" :data-tasto="t"
                    @click="batti(t)">{{ t }}</button>
            <button class="tasto ok" data-tasto="fatto" @click="confermaTotale">✓ è questo</button>
          </div>

          <!-- quello che hai già posato sul banco -->
          <div v-else class="piatto" :class="{ nonTorna: sbagliato === 'conto' }">
            <div class="quanto">
              <b>{{ euro(dato) }}</b>
              <!-- a mente non si dice quanto manca: sarebbe dire il resto -->
              <span v-if="aMente">sul banco</span>
              <span v-else-if="manca > 0">mancano {{ euro(manca) }}</span>
              <span v-else-if="bonus" class="ok">✨ col minimo di monete!</span>
            </div>
            <div class="dati">
              <Soldo v-for="(m, i) in piatto" :key="i" :cents="m" mini />
              <button v-if="piatto.length" class="annulla" @click="togli">↶</button>
              <button v-if="aMente && piatto.length" class="eccolo" @click="proponi">
                ✓ ecco il resto</button>
            </div>
          </div>

          <!-- il cassetto estratto, con gli scomparti -->
          <div v-if="!chiediTotale" class="cassetto">
            <div class="vaschette" :class="{ poche: monetine.length < 3 }" :style="{ '--colonne': Math.min(3, monetine.length) }">
              <button v-for="v in monetine" :key="v" class="scomparto" :data-v="v" @click="metti(v)">
                <span class="pila" :class="{ rifiutata: rifiutata === v }">
                  <Soldo v-for="i in 5" :key="i" :cents="v" :style="{ '--i': i - 1 }" />
                </span>
              </button>
            </div>
            <div class="vaschette larghe" v-if="carte.length"
                 :style="{ gridTemplateColumns: 'repeat(' + carte.length + ',1fr)' }">
              <button v-for="v in carte" :key="v" class="scomparto" :data-v="v" @click="metti(v)">
                <span class="pila mazzetta" :class="{ rifiutata: rifiutata === v }">
                  <Soldo v-for="i in 4" :key="i" :cents="v" :style="{ '--i': i - 1 }" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- il cartello fra un giro e l'altro: finché è su, il tempo è fermo -->
      <div v-if="cambio" class="cartello-tappa">
        <b>{{ camp.nome }}</b>
        <span class="mini">{{ camp.infinita ? 'giro ' + (cambio.n + 1) : 'ordinazioni ' + (cambio.n + 1) + ' di ' + camp.tappe }}</span>
      </div>
    </template>

    <div v-else class="centro">
      <h1 style="font-size:30px">{{ esito === 'vinta' || camp.infinita ? 'Servizio finito!' : 'La cucina ha chiuso' }}</h1>
      <div class="vetrina">{{ esito === 'vinta' ? '🎉' : hud.serviti >= 5 ? '😊' : '😅' }}</div>
      <p class="testo">Ordinazioni servite: <b>{{ hud.serviti }}</b> ·
        resti perfetti: <b>{{ hud.perfetti }}</b><br>Incasso: <b>{{ euro(hud.incasso) }}</b><template
          v-if="guadagno.monete"> · <b data-monete-prese>+{{ guadagno.monete }} 🪙</b></template></p>
      <p v-if="guadagno.nota" class="mini" data-nota-monete>{{ guadagno.nota }}</p>
      <p v-if="frasePrimato" class="testo" data-primato>{{ frasePrimato }}</p>
      <div class="riga">
        <button v-if="esito === 'vinta' && dopo !== null" class="bottone" @click="inizia(dopo)">Prossima cucina ▶</button>
        <button v-else class="bottone" @click="inizia(livello)">Riprova ▶</button>
        <button class="bottone chiaro" data-azione="le-cucine" @click="alleCucine">Le cucine</button>
      </div>
    </div>

    <div v-if="moneta" class="moneta">+{{ moneta }} 🪙</div>

    <!-- niente velo sopra un altro velo: dove il gioco è già fermo dietro
         il suo (fine livello, traguardo) non se ne mette un secondo -->
    <VeloPausa v-if="inPausa && fase === 'gioco' && !state.festa.length"
               :dove="dovEravamo" @riprendi="togliLaPausa" @esci="esci" />
  </div>
</template>

<style scoped>
.negozio { background:linear-gradient(180deg,#cfe8f5,#ffe9c7 32%,#f3e6d0) }

.davanti { flex:none; margin:0; padding:6px 12px 2px; text-align:center; font-size:14px; font-weight:800; color:#3a2a1a }
.in-cima { flex:none; display:flex; justify-content:center; padding:0 12px }
.in-cima:empty { display:none }

/* la stanza, e sopra il foglio del resto */
.banco { flex:1; min-height:0; display:flex; flex-direction:column; position:relative; overflow:hidden; background:#3f3128 }
.cassa { position:absolute; left:0; right:0; bottom:0; top:min(120px,18%); z-index:20; display:flex; flex-direction:column; gap:7px;
         padding:10px 8px calc(8px + env(safe-area-inset-bottom)); border-radius:18px 18px 0 0;
         background-color:#a9713c; background-image:repeating-linear-gradient(179deg,#ffffff0f 0 2px,#00000000 2px 34px,#00000026 34px 36px);
         box-shadow:0 -6px 16px #0000004d; animation:apre .2s }
@keyframes apre { from { transform:translateY(10px); opacity:0 } to { transform:none; opacity:1 } }
.porge { display:flex; align-items:center; gap:6px; margin:0 4px 6px }
.porge small { font-size:13px; font-weight:800; color:#fff3dc }
.foto-voce { width:34px; height:34px; vertical-align:middle }

/* il registratore disegnato: scontrino e display verde, e sotto il cassetto estratto con gli scomparti */
.macchina { flex:none; display:flex; align-items:stretch; gap:8px; padding:0 2px }
.scontrino { flex:1; min-width:0; background:#fffdf7; border-radius:3px 3px 0 0;
             padding:3px 8px 8px; box-shadow:0 3px 6px #00000038; transform:rotate(-1deg);
             -webkit-mask-image:radial-gradient(circle at 5px 100%, transparent 4.5px, #000 5px);
             mask-image:radial-gradient(circle at 5px 100%, transparent 4.5px, #000 5px);
             -webkit-mask-size:10px 100%; mask-size:10px 100%;
             -webkit-mask-repeat:repeat-x; mask-repeat:repeat-x }
.voci { display:flex; flex-wrap:wrap; gap:0 10px }
.voci span { display:flex; align-items:center; gap:3px; font-size:11px; font-weight:800; color:#7a6045 }
.somma { display:flex; justify-content:space-between; align-items:baseline;
         border-top:2px dashed #d8c3a5; margin-top:3px; padding-top:2px }
.somma span { font-size:10px; font-weight:900; color:#a98860; letter-spacing:1px }
.somma b { font-size:15px; font-weight:900; color:#5a4632 }
.corpo { flex:none; display:flex; flex-direction:column; gap:4px; align-items:center;
         padding:6px 8px 7px; border-radius:9px 9px 6px 6px;
         background:linear-gradient(180deg,#e4e9ee,#9fabb4);
         box-shadow:0 4px 0 #00000038, inset 0 2px 4px #ffffff99 }
.display { background:#1d2a1c; border-radius:5px; padding:3px 10px 4px; text-align:center;
           box-shadow:inset 0 2px 6px #000a; font-family:"Emoji Gioco", ui-monospace,monospace }
.display span { display:block; font-size:9px; font-weight:800; color:#6fbf80; letter-spacing:.5px }
.display b { display:block; font-size:clamp(17px,5vw,23px); font-weight:900; color:#9dfcb0;
             font-variant-numeric:tabular-nums }
/* il totale ancora da battere: si vede che è un buco, non una cifra */
.somma.daFare b { color:#c8442f; letter-spacing:2px }

/* la tastiera vera: tre colonne larghe come su un telefono, il ✓ largo
   quanto tutta la fila per non confonderlo con un tasto che scrive.
   Le righe sono dichiarate (`repeat(5,1fr)`) e non lasciate al contenuto:
   un grid che si misura sui tasti cresce oltre `flex:1` e il ✓ esce dallo
   schermo. */
.tastierone { flex:1; min-height:0; display:grid; grid-template-columns:repeat(3,1fr);
              grid-template-rows:repeat(5,1fr); gap:5px; padding:7px; border-radius:12px;
              background:linear-gradient(180deg,#5d4a3a,#7a6350);
              box-shadow:inset 0 3px 8px #00000055 }
.tastierone .tasto { display:flex; align-items:center; justify-content:center;
                     min-height:0; font:900 clamp(18px,5.5vw,26px)/1 inherit; color:#3c3226;
                     border:0; border-radius:9px; padding:0; cursor:pointer;
                     background:linear-gradient(180deg,#f6efe0,#d8c8ad);
                     box-shadow:0 3px 0 #00000055, inset 0 1px 0 #fff9 }
.tastierone .tasto:active { transform:translateY(2px); box-shadow:0 1px 0 #00000055 }
.tastierone .ok { grid-column:1/-1; font-size:clamp(15px,4.6vw,19px); color:#123a1c;
                  background:linear-gradient(180deg,#bff0c4,#6fc47e) }
/* uno scarto laterale e basta: la rotazione di `scarto` sta bene su un
   piattino e fa ribaltare un pannello alto mezzo schermo */
.tastierone.nonTorna { animation:sussulto .4s }
@keyframes sussulto { 0%,100%{transform:none} 20%{transform:translateX(-9px)}
                      50%{transform:translateX(8px)} 80%{transform:translateX(-4px)} }

/* il piano dove finiscono le monete date */
.piatto { flex:none; background:#00000026; border-radius:11px; padding:5px 8px 6px;
          box-shadow:inset 0 2px 6px #00000038 }
.quanto { display:flex; align-items:baseline; gap:8px; justify-content:center }
.quanto b { font-size:18px; font-weight:900; color:#fff8ea; text-shadow:0 2px 3px #0006 }
.quanto span { font-size:12px; font-weight:800; color:#ffe3b8 }
.quanto .ok { color:#c9ffd8 }
.dati { display:flex; flex-wrap:wrap; gap:4px; justify-content:center; align-items:center;
        min-height:22px; margin-top:3px }

/* il cassetto estratto: ogni taglio nel suo scomparto */
.cassetto { flex:1; min-height:0; display:flex; flex-direction:column; gap:5px;
            border-radius:8px 8px 12px 12px; padding:6px;
            background:linear-gradient(180deg,#5d4a3a,#7a6350);
            box-shadow:inset 0 8px 14px #00000066, 0 -3px 0 #46372b }
.vaschette { flex:1; min-height:0; display:grid; grid-template-columns:repeat(var(--colonne,3),1fr);
             grid-auto-rows:1fr; gap:5px }
.vaschette.larghe { flex:none; grid-template-columns:repeat(2,1fr) }
.scomparto { display:flex; align-items:center; justify-content:center; padding:3px;
             border-radius:7px; background:#00000038; border:0;
             box-shadow:inset 0 3px 6px #00000059, inset 0 -1px 0 #ffffff1a }
.scomparto:active { transform:translateY(2px) }
/* nel cassetto i soldi si vedono a pile: le monete una sull'altra, le banconote a mazzetta */
.pila { position:relative; display:grid; place-items:center; width:100%; height:100%; min-height:0 }
.pila .soldo { grid-area:1/1; max-width:min(100%,58px); font-size:19px; transform:translateY(calc(var(--i) * -4px + 8px));
               box-shadow:0 2px 0 #00000059 }
.vaschette.poche .pila .soldo { max-width:84px; font-size:28px }
.vaschette.larghe { height:30% }
.pila.mazzetta .soldo { max-width:min(100%,128px); width:100%; font-size:22px;
                        transform:translate(calc(var(--i) * 3px - 5px), calc(var(--i) * -3px + 5px)) rotate(calc((var(--i) - 2) * 1.6deg));
                        box-shadow:1px 2px 2px #00000059 }
@media (min-width:700px) { .vaschette { grid-template-columns:repeat(4,1fr) } }

/* il cartello fra un giro di ordinazioni e l'altro */
.cartello-tappa { position:absolute; left:50%; top:46%; transform:translate(-50%,-50%); z-index:40; display:flex; flex-direction:column; align-items:center; gap:2px;
                  background:#fffdf7; border-radius:20px; padding:14px 26px 15px; box-shadow:0 8px 0 #00000026, 0 14px 30px #00000045, inset 0 0 0 4px #b5472f;
                  animation:arriva .45s cubic-bezier(.2,1.4,.4,1) }
.cartello-tappa b { font-size:19px; font-weight:900; color:#b5472f }
.cartello-tappa .mini { font-size:11.5px; font-weight:800; color:#a98860 }
@keyframes arriva { from { transform:translate(-50%,-50%) scale(.6); opacity:0 }
                    to { transform:translate(-50%,-50%) scale(1); opacity:1 } }

/* ---------- monete e banconote ---------- */
/* il disegno è di `components/Soldo.vue` (stile in `grafica/soldi.js`); qui solo lo scarto */
.rifiutata { animation:scarto .42s }
@keyframes scarto { 0%,100%{transform:none} 25%{transform:translateX(-8px) rotate(-9deg)}
                    60%{transform:translateX(8px) rotate(9deg)} }
.annulla { width:32px; height:32px; border-radius:50%; background:#ffffff44; color:#fff;
           font-size:16px; font-weight:900; margin-left:4px }
/* il tasto della cassa rotta: la risposta la dai tu */
.eccolo { margin-left:6px; padding:6px 13px; border-radius:12px; border:0; color:#1c3d24;
          font-size:13px; font-weight:900; background:linear-gradient(180deg,#a8f0b8,#5cc47a);
          box-shadow:0 3px 0 #2f7a4a }
.eccolo:active { transform:translateY(2px); box-shadow:0 1px 0 #2f7a4a }
.piatto.nonTorna { animation:scarto .5s }
.corpo.rotta .display b { color:#ffd76a; letter-spacing:2px }

.vetrina { font-size:38px; letter-spacing:2px }
.moneta { position:fixed; left:50%; top:40%; transform:translateX(-50%); z-index:60;
          font-size:38px; font-weight:900; color:#c98a00; pointer-events:none;
          animation:vola 1.1s ease-out forwards }
@keyframes vola { 0%{transform:translateX(-50%) scale(.4);opacity:0}
                  30%{transform:translateX(-50%) scale(1.3);opacity:1}
                  100%{transform:translate(-50%,-120px) scale(.85);opacity:0} }
</style>
