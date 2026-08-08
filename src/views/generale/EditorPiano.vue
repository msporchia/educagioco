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
import { VERBI, BLOCCHI, eCondizione, ilSegnale, testoCond, manca,
         verbiPer, condCompone, laCosa } from '../../motore/generale.js'
import { aggiungiIn, togliIn, spostaIn, ordineIn, listaIn, partiDaCapo, partiParallele,
         puntiDi, stessaVia } from './piano.js'
import { suMappa, cosePer, nomeDi, emDi } from './bersagli.js'
import { suono } from '../../audio.js'

const props = defineProps({
  ordini: { type: Array, default: () => [] },     // la fila dell'unità che si sta comandando
  mondoOra: { type: Function, default: () => null },
  tic: { type: Number, default: 0 },
  unitaOra: { type: String, default: '' },
})
const emit = defineEmits(['mira'])

const mondo = () => props.mondoOra()
const foglio = ref(null)      // { modo, perc?, via?, verbo?, campo?, cose? }
let chiesto = null            // cosa si è chiesto alla mappa: { verbo, via, perc }

/* cambiare unità vuol dire cambiare piano: quello che era aperto era di
   un'altra fila */
watch(() => props.unitaOra, () => { foglio.value = null; chiesto = null })

/* ═══════════ le domande ═══════════ */
const chiudi = () => { foglio.value = null }

/* il posto vuoto: «e qui cosa fa?» */
function chiedi (perc) {
  suono.nota(520, 520, 0.05)
  foglio.value = { modo: 'azione', perc }
}

/* una casella di un ordine che c'è già */
function tocca (via, casella) {
  const o = ordineIn(props.ordini, via)
  if (!o) return
  if (casella.campo) { foglio.value = { modo: 'cond', via, campo: casella.campo }; return }
  if (casella.punti) { chiediMira('pattuglia', via, null, puntiDi(o)); return }
  chiediBersaglio(o.verbo, via, null)
}

/* un bersaglio: sulla mappa se è una cosa che sta sulla mappa, da un
   elenco se è un nome. Vale per un ordine nuovo (`perc`) e per uno che
   c'è già (`via`). */
function chiediBersaglio (verbo, via, perc) {
  if (suMappa(mondo(), verbo)) { chiediMira(verbo, via, perc, null); return }
  foglio.value = { modo: 'cosa', via, perc, verbo, cose: cosePer(mondo(), verbo) }
}
function chiediMira (verbo, via, perc, punti) {
  chiesto = { verbo, via, perc }
  foglio.value = null
  emit('mira', { verbo, punti: punti || [] })
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
  if (v === 'pattuglia') {
    /* IL «FINCHÉ» DI UN GIRO NON È FACOLTATIVO: nasce con l'ordine.
       Senza uscita il giro non finisce mai e gli ordini dopo non
       partono — non dev'essere nemmeno componibile. */
    chiediMira('pattuglia', null, perc, [])
    return
  }
  chiediBersaglio(v, null, perc)
  if (foglio.value && foglio.value.modo === 'cosa') foglio.value.verbo = v
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
function scegliAscolto () {
  const via = nasce([], { verbo: 'quando', complemento: null, allora: [] })
  foglio.value = { modo: 'cosa', via, verbo: 'quando', cose: cosePer(mondo(), 'quando') }
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
}
function posaGiro (punti) {
  if (!chiesto || !punti.length) { chiesto = null; return }
  const { via, perc } = chiesto
  if (via) {
    const o = ordineIn(props.ordini, via)
    o.complemento = punti[0]; o.punti = [...punti]
  } else nasce(perc, { verbo: 'pattuglia', complemento: punti[0], punti: [...punti], finche: {} })
  chiesto = null
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
const verbiDisponibili = computed(() => {
  props.tic
  return mondo() ? verbiPer(mondo(), props.unitaOra) : []
})
/* la casella che sta aspettando una risposta dalla mappa si accende */
const mirando = (via, casella) => !!chiesto && stessaVia(chiesto.via, via) &&
  ((casella.punti && chiesto.verbo === 'pattuglia') || (casella.cosa && !casella.punti))

const daCapo = computed(() => { props.tic; return partiDaCapo(props.ordini) })
const ascolti = computed(() => { props.tic; return partiParallele(props.ordini) })

/* il titolo del foglio: cosa si sta scegliendo, in tre parole */
const titoloFoglio = computed(() => {
  const f = foglio.value
  if (!f) return ''
  if (f.modo === 'azione') return 'E qui cosa fa?'
  if (f.modo === 'cond') return f.campo === 'finche' ? 'Finché…' : 'La domanda'
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
   dove una fila è ancora piatta */
const inRamo = perc => typeof perc[perc.length - 1] === 'string'

provide('editor', {
  chiedi, tocca, togli, sposta, presaGiu, presaMuovi, presaSu,
  statoRiga, ramoPreso, perche, frase, comeSiChiama, mirando,
})
defineExpose({ posaBersaglio, posaGiro, nienteMira })
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
                @click.stop="tocca([i], { cosa: true })">
          {{ o.complemento ? comeSiChiama(o.complemento) : '＋ quale segnale' }}</button>
        <button class="viaqui" aria-label="togli l'ascolto" @click.stop="togli([i])">✕</button>
      </div>
      <div class="dentro">
        <FilaOrdini :voci="(o.allora || []).map((oo, j) => ({ o: oo, i: j }))" :perc="[i]" />
      </div>
    </div>

    <!-- anche un ascolto nuovo è un posto vuoto: non c'è nessun posto
         dove andarlo a prendere -->
    <button class="posto ascolto-nuovo" @click="scegliAscolto">
      ＋ {{ VERBI.quando.et }} {{ VERBI.quando.nome }}…</button>
  </section>

  <SceltaAzione :modo="foglio ? foglio.modo : ''" :titolo="titoloFoglio"
                :verbi="verbiDisponibili"
                :con-decisione="!!(foglio && foglio.modo === 'azione' && gruppi.length
                                   && !inRamo(foglio.perc))"
                :cose="foglio && foglio.cose || []" :scelto="cosaScelta"
                :gruppi="gruppi" :cond="condOra" :frase="frase(condOra)"
                @verbo="scegliVerbo" @decisione="scegliDecisione" @ascolto="scegliAscolto"
                @cosa="scegliCosa" @cond-cambia="cambiaCond" @chiudi="chiudi" />
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
</style>
