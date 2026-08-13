<script setup>
/* ═══════════════════════════════════════════════════════════════════
   L'EDITOR DEL PIANO — dove si scrivono gli ordini di un'unità

   Tiene insieme tre cose e nient'altro:
     · il PIANO che parte all'inizio, e gli ASCOLTI, che sono piani a
       parte con la loro testa (`quando senti [segnale]`);
     · il FOGLIO delle scelte, che si apre da un posto vuoto o da una
       casella e si richiude appena hai scelto;
     · quello che il piano deve sapere della partita in corso: quale
       riga sta correndo adesso, quale si è rotta, quale ramo è partito.

   ── UN SOLO GESTO ────────────────────────────────────────────────
   Tocchi un posto vuoto — il `＋` in fondo a una fila, o la casella di
   un ordine — e ti si chiede con cosa riempirlo. Non c'è nessuna
   modalità da ricordare, nessuna cassetta fissa in fondo allo schermo,
   e soprattutto non c'è più lo stato invisibile «dove sto scrivendo»:
   il posto che hai toccato È il posto.

   ── CHI CAMBIA COSA ──────────────────────────────────────────────
   Tutte le modifiche al piano passano di qui, e sono le funzioni di
   `piano.js`, che non sanno cosa sia uno schermo. L'unica cosa che
   questo file non sa fare è indicare col dito una casella della mappa:
   quella la chiede fuori (`@mira`), e quando la risposta arriva la
   scrive lui (`posaBersaglio`, `posaGiro`).
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, watch, provide } from 'vue'
import FilaOrdini from './FilaOrdini.vue'
import SceltaAzione from './SceltaAzione.vue'
import { VERBI, BLOCCHI, eCondizione, eRipeti, eRoutine, eBlocco, ilSegnale, testoCond, manca,
         verbiPer, nonSa, scusaDi, condCompone, laCosa, raccogliRoutine } from '../../motore/generale.js'
import { aggiungiIn, togliIn, spostaIn, ordineIn, listaIn, partiDaCapo, partiParallele,
         partiChiamate, nomeLibero, stessaVia } from './piano.js'
import { suMappa, cosePer, nomeDi, emDi } from './bersagli.js'
import { suono } from '../../audio.js'

const props = defineProps({
  ordini: { type: Array, default: () => [] },     // la fila dell'unità che si sta comandando
  mondoOra: { type: Function, default: () => null },
  tic: { type: Number, default: 0 },
  unitaOra: { type: String, default: '' },
  /* ── LO STESSO PIANO, MA NON SI TOCCA ──
     Gli ordini di un nemico si leggono con questo componente, non con
     una copia: erano due viste della stessa cosa, e la seconda sapeva
     disegnare solo gli ordini semplici e i bivi — un ciclo la faceva
     esplodere, e le azioni non le avrebbe mai viste. Una forma nuova
     deve costare una riga in un posto, non in due. Qui l'unica
     differenza è che niente si può cambiare. */
  sola: { type: Boolean, default: false },
})
const emit = defineEmits(['mira'])

const mondo = () => props.mondoOra()
const foglio = ref(null)      // { modo, perc?, via?, verbo?, campo?, cose? }
let chiesto = null            // cosa si è chiesto alla mappa: { verbo, via, perc }

/* ── DOVE SI APRE LA DOMANDA ──
   Attaccata al tasto che l'ha chiamata. Il foglio saliva dal basso, e
   fra il `＋` che avevi premuto e le risposte c'era mezzo schermo: il
   posto vuoto È il tasto, quindi la risposta deve nascergli accanto.
   Qui si prende solo la misura di quel tasto — in coordinate di
   finestra, che è quello che serve a chi si posiziona. */
const ancora = ref(null)
function segnaDove (e) {
  const el = e && (e.currentTarget || e.target)
  if (!el || !el.getBoundingClientRect) return
  const r = el.getBoundingClientRect()
  ancora.value = { cx: r.left + r.width / 2, su: r.top, giu: r.bottom }
}

/* cambiare unità vuol dire cambiare piano: quello che era aperto era di
   un'altra fila */
watch(() => props.unitaOra, () => { foglio.value = null; chiesto = null })

/* ═══════════ le domande ═══════════ */
const chiudi = () => { foglio.value = null }

/* il posto vuoto: «e qui cosa fa?» */
function chiedi (perc, e) {
  segnaDove(e)
  suono.nota(520, 520, 0.05)
  foglio.value = { modo: 'azione', perc }
}

/* una casella di un ordine che c'è già */
function tocca (via, casella, e) {
  segnaDove(e)
  const o = ordineIn(props.ordini, via)
  if (!o) return
  if (casella.campo) { foglio.value = { modo: 'cond', via, campo: casella.campo }; return }
  chiediBersaglio(o.verbo, via, null)
}

/* un bersaglio: sulla mappa se è una cosa che sta sulla mappa, da un
   elenco se è un nome. Vale per un ordine nuovo (`perc`) e per uno che
   c'è già (`via`). */
function chiediBersaglio (verbo, via, perc) {
  conLeAzioni()                     // «esegui» sceglie fra le azioni scritte
  /* ── C'È CHI VUOLE UNA DOMANDA, NON UNA COSA ──
     `aspetta che [non vedi le sentinelle]`: l'ordine nasce già e poi si
     compone la domanda, com'è per un bivio. Chiederla prima non si
     potrebbe — la domanda si scrive dentro una riga che deve esistere. */
  if ((VERBI[verbo] || {}).vuoleCond) {
    /* NASCE GIÀ CON UNA DOMANDA, come il bivio. Con la domanda in
       bianco il foglio si apriva mostrando i verbi («vedi») e
       l'interruttore «non», ma NIENTE su cui applicarli: le cose
       compaiono sotto il verbo scelto, e finché non ne scegli uno la
       pagina sembra vuota. Partendo dalla prima domanda possibile la
       riga dice già qualcosa di sensato — «aspetta che vedi le
       sentinelle» — e cambiarla è toccare quello che c'è scritto. */
    const g = gruppi.value[0]
    const v = via || nasce(perc, { verbo,
      cond: g ? { cond: g.cond, complemento: (g.cose[0] || {}).id } : {} })
    foglio.value = { modo: 'cond', via: v, campo: 'cond' }
    return
  }
  if (suMappa(mondo(), verbo)) { chiediMira(verbo, via, perc); return }
  /* ── E QUANDO VALGONO TUTTI E DUE I MODI ──
     Un verbo che accetta una CASELLA QUALSIASI (`vai`) ha due bersagli
     legittimi e diversi: un nome — «il tesoro», che lo segue dovunque
     finisca — e un punto della mappa, «lì dietro quel muro», che non ha
     nome e non ce l'avrà mai.

     ── LA MAPPA È SEMPRE VIVA, PER OGNI VERBO ──
     Prima lo era solo per `vai`, e solo dopo aver scelto «un punto
     sulla mappa» in fondo a un elenco: tre gesti per la cosa più
     immediata che ci sia. Adesso **il foglio dei nomi e la mappa sono
     vivi insieme, sempre**: «prendi» apre l'elenco delle cose e nello
     stesso momento accende sul campo quelle che si possono prendere —
     tocchi il sacco dov'è e l'ordine è scritto.
     È il verso giusto delle due strade: l'elenco serve per quello che
     **non si può indicare** — un segnale, una schiera, una cosa in
     tasca a qualcuno — e per chi preferisce leggere un nome. Tutto
     quello che sta sul campo si tocca dove sta. */
  foglio.value = { modo: 'cosa', via, perc, verbo, conMappa: true,
                   cose: cosePer(mondo(), verbo) }
  chiesto = { verbo, via, perc }
  emit('mira', { verbo })
}
/* «lo indico io»: si chiude l'elenco e si passa alla mappa, con lo
   stesso meccanismo che usano i verbi che hanno solo bersagli fermi */
function dallaMappa () {
  const f = foglio.value
  if (f) chiediMira(f.verbo, f.via, f.perc)
}
function chiediMira (verbo, via, perc) {
  chiesto = { verbo, via, perc }
  foglio.value = null
  emit('mira', { verbo })
}

/* ═══════════ scrivere ═══════════ */
function nasce (perc, o) {
  const via = aggiungiIn(props.ordini, perc, o)
  suono.ok()
  return via
}
/* il verbo scelto dal foglio: o si crea subito l'ordine, o prima si
   chiede su cosa vale */
function scegliVerbo (v) {
  const { perc } = foglio.value
  chiediBersaglio(v, null, perc)
  if (foglio.value && foglio.value.modo === 'cosa') foglio.value.verbo = v
}
/* IL CICLO NASCE VUOTO E BASTA. Non gli si chiede niente subito: la
   decisione ha solo la sua domanda, quindi tanto vale chiederla nello
   stesso gesto, ma un ciclo ha due cose — cosa rifà e quando smette —
   e aprire d'ufficio la seconda vuol dire mettersi davanti alla prima.
   Prima ti trovavi il foglio dell'uscita in faccia mentre stavi ancora
   pensando a cosa mettergli dentro. */
function scegliCiclo () {
  const { perc } = foglio.value
  nasce(perc, { blocco: 'ripeti', corpo: [], finche: {} })
  chiudi()
}
/* la cosa scelta dall'elenco */
function scegliCosa (id) {
  const { via, perc, verbo } = foglio.value
  if (via) ordineIn(props.ordini, via).complemento = id
  else nasce(perc, { verbo, complemento: id })
  chiudi()
}
/* LA DECISIONE SI AGGIUNGE COME UNA COSA SUA: non è un pezzo che si
   appende a un ordine, è un blocco. Nasce e chiede subito la domanda,
   che è la sola cosa che deve avere per esistere. */
function scegliDecisione () {
  const { perc } = foglio.value
  const g = gruppi.value[0]
  const via = nasce(perc, {
    blocco: 'condizione',
    cond: g ? { cond: g.cond, complemento: (g.cose[0] || {}).id } : {},
    vero: [], falso: [],
  })
  foglio.value = { modo: 'cond', via, campo: 'cond' }
}
/* UN «QUANDO SENTI» NON STA MAI DENTRO NIENTE: nasce in cima al piano
   anche se lo chiedi da dentro un ramo, e poi chiede il suo segnale. */
function scegliAscolto (e) {
  segnaDove(e)
  const via = nasce([], { verbo: 'quando', complemento: null, allora: [] })
  foglio.value = { modo: 'cosa', via, verbo: 'quando', cose: cosePer(mondo(), 'quando') }
}
/* UN'AZIONE NASCE VUOTA E COL NOME GIÀ MESSO. Niente da chiedere: il
   nome lo sceglie il gioco (a sei anni una tastiera in mezzo al
   pensiero è una porta chiusa) e cosa ci va dentro si scrive dopo, nel
   suo riquadro. Sta accanto al piano, come un ascolto. */
function scegliAzione () {
  nasce([], { blocco: 'routine', nome: nomeLibero(props.ordini), corpo: [] })
  chiudi()
}
const cambiaCond = c => {
  const { via, campo } = foglio.value
  ordineIn(props.ordini, via)[campo] = { ...c }
}


/* ═══════════ quello che torna dalla mappa ═══════════ */
function posaBersaglio (id) {
  if (!chiesto) return
  const { verbo, via, perc } = chiesto
  if (via) ordineIn(props.ordini, via).complemento = id
  else nasce(perc, { verbo, complemento: id })
  chiesto = null
  /* la mappa e l'elenco erano vivi insieme: se la risposta è arrivata
     dalla mappa, l'elenco dei nomi non serve più */
  if (foglio.value) foglio.value = null
}
const nienteMira = () => { chiesto = null }

/* ═══════════ togliere e spostare ═══════════ */
function togli (via) {
  togliIn(props.ordini, via)
  if (foglio.value) chiudi()
  suono.nota(300, 300, 0.05)
}
function sposta (via, d) {
  spostaIn(props.ordini, via, d)
  suono.nota(440, 440, 0.04)
}

/* ── trascinare un ordine ──
   Con una presa dedicata, così il resto della riga resta fatto di
   caselle che si toccano e la lista continua a scorrere. Un ordine non
   esce dalla sua fila. */
let trasc = null
function presaGiu (e, via) {
  const riga = e.currentTarget.closest('.ordi')
  const righe = [...riga.parentElement.children].filter(x => x.classList.contains('ordi'))
  /* la posizione nella lista non è la posizione a schermo: nel main gli
     ascolti stanno altrove, quindi ogni riga si porta dietro il suo
     indice vero (`data-i`) */
  trasc = { via, y0: e.clientY, righe, a: righe.indexOf(riga), da: righe.indexOf(riga),
            indici: righe.map(r => +r.dataset.i),
            centri: righe.map(r => { const q = r.getBoundingClientRect(); return q.top + q.height / 2 }) }
  riga.classList.add('vola')
  e.currentTarget.setPointerCapture(e.pointerId)
  e.preventDefault()
}
function presaMuovi (e) {
  if (!trasc) return
  const da = trasc.da
  const y = trasc.centri[da] + (e.clientY - trasc.y0)
  let a = da
  while (a > 0 && y < trasc.centri[a - 1]) a--
  while (a < trasc.centri.length - 1 && y > trasc.centri[a + 1]) a++
  trasc.a = a
  trasc.righe[da].style.transform = `translateY(${e.clientY - trasc.y0}px)`
}
function presaSu () {
  if (!trasc) return
  const { da, a, indici, righe, via } = trasc
  righe.forEach(r => { r.style.transform = ''; r.classList.remove('vola') })
  trasc = null
  if (a !== da) sposta(via, indici[a] - indici[da])
}

/* ═══════════ quello che il piano sa della partita ═══════════
   Il motore, per ogni riga di registro, dice in quale FILA stava
   (`filo`), a che punto (`i`), e — se stava dentro un bivio — in quale
   ramo (`ramo`) e a che punto del ramo (`j`). Una via si traduce in
   quelle quattro cose, e da lì si sa quale riga accendere: senza il
   ramo si accenderebbero tutte e due le strade di un bivio.

   La riga della DECISIONE è quella che ha il ramo ma non il `j`: è il
   momento in cui il bivio ha guardato e ha scelto. */
function coordinate (via) {
  /* ── DENTRO UN'AZIONE ──
     Quando il motore entra in un'azione ne prende la fila: da lì in poi
     `filo` è il nome dell'azione e `i` conta gli ordini di QUELLA lista.
     La via invece parte sempre dal piano — `[3, 'corpo', 1]` — quindi si
     saltano i due passi che ci sono entrati. */
  const capo = props.ordini[via[0]]
  if (eRoutine(capo)) {
    const q = via.slice(2)
    return typeof q[1] === 'string'
      ? { filo: capo.nome, i: q[0], ramo: q[1], j: q[2] }
      : { filo: capo.nome, i: q[0], ramo: null, j: null }
  }
  const dentroQuando = typeof via[1] === 'number'
  const filo = dentroQuando
    ? `quando «${ilSegnale(props.ordini[via[0]].complemento).nome}»` : 'principale'
  const q = dentroQuando ? via.slice(1) : via
  return typeof q[1] === 'string'
    ? { filo, i: q[0], ramo: q[1], j: q[2] }
    : { filo, i: q[0], ramo: null, j: null }
}
function righeDi (via) {
  const m = mondo()
  const { filo, i, ramo, j } = coordinate(via)
  const bivio = eCondizione(ordineIn(props.ordini, via))
  return [...m.traccia].reverse().filter(r =>
    r.unita === props.unitaOra && r.filo === filo && r.i === i &&
    (bivio ? r.j == null : (r.ramo || null) === ramo && (r.j ?? null) === (j ?? null)))
}
function statoRiga (via) {
  props.tic                                     // si rinfresca a ogni passo
  const m = mondo()
  if (!m || !m.passi) return ''
  const { filo, i, ramo, j } = coordinate(via)
  const bivio = eCondizione(ordineIn(props.ordini, via))
  const r = righeDi(via)[0]
  const u = m.perId[props.unitaOra]
  const q = u && u.ordineOra
  const suDiMe = q && q.filo === filo && q.i === i &&
    (bivio || ((q.ramo || null) === ramo && (q.j ?? null) === (j ?? null)))
  if (suDiMe && !m.finita) return 'attivo'
  if (r && r.esito === 'no') return 'guasta'
  if (r && r.esito === 'salto') return 'saltata'
  /* è partito l'altro ramo: questa riga, quel giro, non è toccata a
     nessuno */
  if (ramo && [...m.traccia].reverse()
    .some(z => z.unita === props.unitaOra && z.filo === filo && z.i === i &&
               z.ramo && z.ramo !== ramo)) return 'saltata'
  return ''
}
function ramoPreso (via) {
  props.tic
  const m = mondo()
  if (!m || !m.passi) return null
  const r = righeDi(via)[0]
  return (r && r.ramo) || null
}
function perche (via) {
  props.tic
  const m = mondo()
  if (!m || !m.passi) return ''
  const o = ordineIn(props.ordini, via)
  const m2 = o ? manca(m, o) : ''
  if (m2) return m2                              // quello che manca si dice sempre
  const r = righeDi(via).find(z => z.esito === 'no' || z.esito === 'salto')
  return r ? r.testo : ''
}

/* ═══════════ le parole ═══════════ */
const comeSiChiama = id => `${emDi(mondo(), id)} ${nomeDi(mondo(), id)}`
/* una condizione a metà non si legge: finché non dice anche SU COSA si
   mostra la casella vuota invece di «vedi undefined» */
const frase = c => (mondo() && c && c.cond && c.complemento ? testoCond(mondo(), c) : '')
const gruppi = computed(() => {
  props.tic
  if (!mondo()) return []
  return condCompone(mondo(), props.unitaOra).map(g => ({
    ...g, cose: g.cose.map(k => laCosa(mondo(), k)).filter(Boolean),
  }))
})
/* ── IL MONDO DEVE SAPERE CHE AZIONI HAI SCRITTO ──
   `esegui` compare in cassetta solo se c'è qualcosa da eseguire, e
   quel qualcosa non sta nel livello: lo stai scrivendo adesso. Prima
   di chiedere al motore cosa si può fare, gli si dice cosa c'è. */
const azioni = computed(() => { props.tic; return partiChiamate(props.ordini) })
function conLeAzioni () {
  const m = mondo()
  if (m) raccogliRoutine(m, { [props.unitaOra]: props.ordini })
  return m
}
const verbiDisponibili = computed(() => {
  props.tic; azioni.value
  return conLeAzioni() ? verbiPer(mondo(), props.unitaOra) : []
})
/* ── QUELLO CHE QUESTA NON SA FARE ──
   Si vede lo stesso, spento, con la ragione scritta sotto. Sparire era
   peggio che essere negato: chi gioca non si chiede «perché il
   cavaliere non prende il tesoro?», si chiede «dov'è finito prendi?» —
   e si mette a cercare un tasto invece di dividersi i compiti. */
const verbiNegati = computed(() => {
  props.tic
  const m = mondo()
  if (!m) return []
  return nonSa(m, props.unitaOra).map(v => ({ v, perche: scusaDi(m, props.unitaOra, v) }))
})
/* la casella che sta aspettando una risposta dalla mappa si accende */
const mirando = (via, casella) => !!chiesto && stessaVia(chiesto.via, via) && !!casella.cosa

const daCapo = computed(() => { props.tic; return partiDaCapo(props.ordini) })
const ascolti = computed(() => { props.tic; return partiParallele(props.ordini) })

/* il titolo del foglio: cosa si sta scegliendo, in tre parole */
const titoloFoglio = computed(() => {
  const f = foglio.value
  if (!f) return ''
  if (f.modo === 'azione') return 'E qui cosa fa?'
  if (f.modo === 'cond') return f.campo === 'finche' ? 'Smetti quando…' : 'La domanda'
  return f.verbo === 'quando' ? 'Quale segnale' : `${VERBI[f.verbo].et} ${VERBI[f.verbo].nome}`
})
const cosaScelta = computed(() => {
  const f = foglio.value
  if (!f || f.modo !== 'cosa' || !f.via) return ''
  const o = ordineIn(props.ordini, f.via)
  return (o && o.complemento) || ''
})
const condOra = computed(() => {
  const f = foglio.value
  if (!f || f.modo !== 'cond') return null
  const o = ordineIn(props.ordini, f.via)
  return (o && o[f.campo]) || null
})

/* dentro un ramo non ci va un altro bivio: la decisione si offre solo
   dove una fila è ancora piatta. Il CORPO DI UN'AZIONE non è un ramo —
   è una fila come il piano, e una domanda ci va eccome: è esattamente
   il motivo per cui le azioni esistono, fare la seconda scelta dove
   annidarla non si poteva. */
const inRamo = perc => {
  if (typeof perc[perc.length - 1] !== 'string') return false
  return !(perc.length === 2 && perc[1] === 'corpo' && eRoutine(props.ordini[perc[0]]))
}

/* in sola lettura tutto quello che cambia il piano diventa un gesto a
   vuoto: le righe restano, i tasti spariscono (`sola` lo sa anche
   FilaOrdini), e quello che si vede è com'è fatto il piano e quale
   riga sta correndo adesso — che è il motivo per cui lo si apre. */
const niente = () => {}
provide('editor', props.sola
  ? { chiedi: niente, tocca: niente, togli: niente, sposta: niente,
      presaGiu: niente, presaMuovi: niente, presaSu: niente,
      statoRiga, ramoPreso, perche: () => '', frase, comeSiChiama,
      mirando: () => false, sola: true }
  : { chiedi, tocca, togli, sposta, presaGiu, presaMuovi, presaSu,
      statoRiga, ramoPreso, perche, frase, comeSiChiama, mirando, sola: false })
defineExpose({ posaBersaglio, nienteMira })
</script>

<template>
  <section class="lista">
    <!-- ═════ IL PIANO ═════ quello che parte all'inizio. Non ha una
         testa e non si chiude: è il piano, e basta. -->
    <FilaOrdini :voci="daCapo" :perc="[]" />

    <!-- ═════ GLI ASCOLTI ═════ un blocco per ogni «quando senti».
         Sono piani a parte, e si vedono a parte: dentro, la solita fila
         piatta — la gerarchia è FRA i blocchi, mai dentro una fila. -->
    <div v-for="{ o, i } in ascolti" :key="'q' + i" class="ascolto">
      <div class="testa">
        <span class="ico">{{ VERBI.quando.et }}</span>
        <span class="lab">{{ VERBI.quando.nome }}</span>
        <button class="casella" :class="{ manca: !o.complemento }"
                @click.stop="tocca([i], { cosa: true }, $event)">
          {{ o.complemento ? comeSiChiama(o.complemento) : '＋ quale segnale' }}</button>
        <button v-if="!sola" class="viaqui" aria-label="togli l'ascolto" @click.stop="togli([i])">✕</button>
      </div>
      <div class="dentro">
        <FilaOrdini :voci="(o.allora || []).map((oo, j) => ({ o: oo, i: j }))" :perc="[i]" />
      </div>
    </div>

    <!-- ═════ LE AZIONI ═════ un pezzo di piano con un nome, che parte
         solo se qualcuno lo chiama. Si vede come un ascolto — un
         riquadro a parte con la sua testa — perché è la stessa cosa
         con un altro modo di partire. -->
    <div v-for="{ o, i } in azioni" :key="'a' + i" class="azione">
      <div class="testa">
        <span class="ico">{{ BLOCCHI.routine.et }}</span>
        <span class="lab">{{ o.nome }}</span>
        <button v-if="!sola" class="viaqui" aria-label="togli l'azione" @click.stop="togli([i])">✕</button>
      </div>
      <div class="dentro">
        <FilaOrdini :voci="(o.corpo || []).map((oo, j) => ({ o: oo, i: j }))"
                    :perc="[i, 'corpo']" />
      </div>
    </div>

    <!-- anche un ascolto nuovo è un posto vuoto: non c'è nessun posto
         dove andarlo a prendere. Ma solo dove i segnali esistono
         davvero: questo tasto stava fuori dal filtro dei verbi, e nei
         livelli senza segnali apriva «quale segnale» su un elenco
         vuoto — un tasto che porta a una stanza vuota. -->
    <button v-if="!sola && verbiDisponibili.includes('quando')"
            class="posto ascolto-nuovo" @click="scegliAscolto">
      ＋ {{ VERBI.quando.et }} {{ VERBI.quando.nome }}…</button>
    <!-- e un'azione nuova. C'è sempre: non dipende da cosa offre il
         livello, perché quello che ci metti dentro lo decidi tu. -->
    <button v-if="!sola" class="posto azione-nuova" @click="scegliAzione">
      ＋ {{ BLOCCHI.routine.et }} una azione…</button>
  </section>

  <SceltaAzione :modo="foglio ? foglio.modo : ''" :titolo="titoloFoglio"
                :ancora="ancora" :verbi="verbiDisponibili" :negati="verbiNegati"
                :con-decisione="!!(foglio && foglio.modo === 'azione' && gruppi.length
                                   && !inRamo(foglio.perc))"
                :con-ciclo="!!(foglio && foglio.modo === 'azione' && gruppi.length
                               && !inRamo(foglio.perc))"
                :cose="foglio && foglio.cose || []" :scelto="cosaScelta"
                :con-mappa="!!(foglio && foglio.conMappa)"
                :gruppi="gruppi" :cond="condOra" :frase="frase(condOra)"
                @verbo="scegliVerbo" @decisione="scegliDecisione" @ciclo="scegliCiclo"
                @ascolto="scegliAscolto"
                @cosa="scegliCosa" @mappa="dallaMappa"
                @cond-cambia="cambiaCond" @chiudi="chiudi" />
</template>

<style scoped>
.lista { flex:1; min-height:0; overflow-y:auto; padding:0 10px 8px }

/* ── un ascolto ── un piano a parte, con la sua testa */
.ascolto { margin:6px 0 2px }
.ascolto .testa { display:flex; align-items:center; gap:6px; min-height:40px; padding:4px 8px;
                  border-radius:12px; background:#fff1ef; border-left:5px solid #e0554d }
.ascolto .testa .ico { font-size:15px; flex:none }
.ascolto .testa .lab { flex:none; font-size:12px; font-weight:800; color:var(--tenue) }
.ascolto .dentro { margin:0 0 4px 14px; padding:1px 4px 0; border-left:2px dashed #f0c2bc }
.casella { flex:1; min-width:0; min-height:32px; padding:4px 9px; border-radius:10px;
           background:#ffffffcc; box-shadow:inset 0 0 0 1.5px #f0cfca; font-size:12.5px;
           font-weight:900; color:var(--viola-scuro); text-align:left; white-space:nowrap;
           overflow:hidden; text-overflow:ellipsis }
.casella.manca { border:1px dashed #d9b3ad; color:var(--tenue); font-weight:800 }
.viaqui { flex:none; width:30px; height:30px; border:0; border-radius:9px; background:transparent;
          color:#c49a94; font-size:15px; font-weight:900 }
.viaqui:active { background:#ffe4e4; color:#d0503f }

.posto { display:block; width:100%; min-height:38px; margin:4px 0 2px; border-radius:11px;
         border:1.5px dashed #c6cfdd; background:#ffffff66; color:var(--tenue);
         font-size:12.5px; font-weight:900 }
.posto:active { background:var(--giallo); color:#3a2c00; border-style:solid }
.posto.ascolto-nuovo { border-color:#f0c2bc; color:#a8564d }

/* ── un'azione ── stessa forma di un ascolto, colore suo: quello che
   parte quando lo chiami non si confonde con quello che parte da sé */
.azione { margin:6px 0 2px }
.azione .testa { display:flex; align-items:center; gap:6px; min-height:38px; padding:4px 8px;
                 border-radius:12px; background:#eef7f1; border-left:5px solid #3fb872 }
.azione .testa .ico { font-size:15px; flex:none }
.azione .testa .lab { flex:1; font-size:12.5px; font-weight:900; color:#1c6b3f }
.azione .dentro { margin:0 0 4px 14px; padding:1px 4px 0; border-left:2px dashed #a8dcc0 }
.posto.azione-nuova { border-color:#a8dcc0; color:#2a8a63 }
</style>
