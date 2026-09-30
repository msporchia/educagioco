<script setup>
// Il coordinatore dell'inglese a mondi: l'unico file del gioco che sa di
// monete, contatori e profilo. Regole in `motore/`, tabelle in `dati/`, la
// mappa in `scena/`, le schermate in `viste/`. Il progetto e l'interfaccia
// col motore: docs/lingue/mondi.md.
import { ref, shallowRef, computed, reactive, onUnmounted } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { state, item, answer, segna, persist, flushNow, engProgresso } from '../../store/profile.js'
import { strength, newItem } from '../../store/srs.js'
import { incassa, premioDetto } from '../../store/varieta.js'
import { pronuncia, haVoce, prepara, zittisci } from '../../voce.js'
import { troppoDiFretta, attesaDellEsito, PONDERA } from '../../quiz/nucleo/domanda.js'
import { pesoDellaFretta } from '../../quiz/fretta.js'
import { progresso } from '../campagne.js'
import LinguaGame from '../../views/LinguaGame.vue'

import { CHIAVE, mondoDi, tappaDi } from './dati/mondi.js'
import { CAPITOLI } from './dati/capitoli.js'
import { pagaDi, PAGA_CAPITOLO } from './dati/monete.js'
import { statoMappa, segnaVinta, tappaAperta, vinta } from './motore/mappa.js'
import { Sessione } from './motore/sessione.js'
import { Tocchi, domandeCheLPagano } from './motore/tocchi.js'
import { cassettoDi, mondoDellaTappa } from './motore/grafo.js'
import { gradoTappa } from './motore/grado.js'
import { capitoliDi, capitolo } from './motore/libro.js'
import { traduci } from './motore/lessico.js'
import * as F from './motore/fila.js'

import Mappa from './viste/Mappa.vue'
import Domanda from './viste/Domanda.vue'
import Libro from './viste/Libro.vue'
import Fine from './viste/Fine.vue'
import Bolla from './viste/Bolla.vue'
import { usaOrologio } from './viste/orologio.js'
import './stile.css'

defineOptions({ name: 'IngleseAMondi' })
defineProps({ lingua: { type: String, default: 'en' } })   // App.vue la passa a tutte le lingue
const emit = defineEmits(['vai'])

const vista = ref('mappa')          // mappa | tappa | libro | prima
const c = progresso(CHIAVE)
const orologio = usaOrologio()
const { attesa, giro } = orologio

// la forza di una voce senza crearla: la mappa legge centinaia di chiavi mai viste
const leggi = k => state.profile.items[k] || newItem()
const forzaDi = k => strength(leggi(k), Date.now())

/* ═══════════ la mappa ═══════════ */
const ridisegna = ref(0)
const stato = computed(() => { void ridisegna.value; return statoMappa(c, forzaDi) })
const extra = computed(() => {
  void ridisegna.value
  const out = {}
  for (const m of stato.value) {
    if (!m.pronto) continue
    const mondo = mondoDi(m.id)
    const ultima = mondo.tappe[mondo.tappe.length - 1]
    out[m.id] = {
      libro: capitoliDi(CAPITOLI, m.id).length ? { aperto: tappaAperta(c, ultima.id) } : null,
      cassetto: m.cassetto && m.cassetto.chiavi ? { aperto: m.cassetto.aperto } : null,
    }
  }
  return out
})
// il gioco libero di prima resta a chi aveva finito la campagna vecchia (docs/lingue/mondi.md)
const diPrima = computed(() => !!engProgresso().libera)

function allaMappa() {
  orologio.ferma()
  zittisci()
  bolla.value = null
  fine.value = null
  sessione = null
  d.value = null
  libro.value = null
  ridisegna.value++
  vista.value = 'mappa'
}

function indietro() {
  if (vista.value === 'mappa') emit('vai', 'home')
  else allaMappa()
}

/* ═══════════ una tappa (o il cassetto) ═══════════ */
let sessione = null
let tocchi = null
const tappa = shallowRef(null)
const d = shallowRef(null)
const fila = ref([])
const esito = ref(null)
const pagaQui = ref(true)
const conti = reactive({ giuste: 0, errori: 0, monete: 0, chieste: 0, gradoPrima: null, bersaglio: 1 })
const fine = ref(null)
let prossimaId = null

const haVoceOra = p => suono.acceso.value && haVoce(p, 'en')

function avvia(t) {
  tappa.value = t
  sessione = new Sessione({ tappa: t, itemDi: leggi, haVoce: haVoceOra })
  Object.assign(conti, { giuste: 0, errori: 0, monete: 0, chieste: 0, bersaglio: sessione.bersaglio,
                         gradoPrima: t.cassetto ? null : sessione.gradoIniziale })
  fine.value = null
  vista.value = 'tappa'
  if (t.parole) prepara(t.parole, 'en')
  prossima()
}
const giocaTappa = id => avvia(tappaDi(id))
const giocaCassetto = m => avvia(cassettoDi(m))

function prossima() {
  const q = sessione && sessione.prossima()
  if (!q) return chiudiTappa()
  d.value = q
  fila.value = F.filaVuota(q)
  esito.value = null
  tocchi = new Tocchi({ itemDi: item })
  pagaQui.value = true
  bolla.value = null
  orologio.riparti()
  if (q.genere === 'parola' && q.domanda.ascolta) setTimeout(() => pronuncia(q.domanda.ascolta, 'en'), 260)
}

const caselle = computed(() => (d.value && d.value.tessere ? F.caselle(d.value, fila.value) : null))
const banco = computed(() => (d.value && d.value.tessere
  ? F.nelBanco(d.value, fila.value).map(t => ({ ...t, posto: F.postoDi(d.value, t.id) })) : null))
const pronto = computed(() => !!(d.value && d.value.tessere && F.pronta(d.value, fila.value)))
const parla = computed(() => {
  const q = d.value
  return !!(q && q.genere === 'parola' && q.domanda.testo && !q.domanda.italiano && haVoceOra(q.domanda.testo))
})

function metti(id) {
  if (esito.value || !orologio.pronta.value) return
  fila.value = F.metti(d.value, fila.value, id)
}
function togli(id) {
  if (esito.value) return
  fila.value = F.togli(d.value, fila.value, id)
}

const CONTATORE = { 'en:': 'en', 'verbo:': 'verbi', 'frase:': 'frasi' }
const contatoreDi = k => CONTATORE[Object.keys(CONTATORE).find(p => k.startsWith(p))] || null

function rispondi(risposta, scelta) {
  if (esito.value || !orologio.pronta.value || !sessione) return
  const q = d.value
  const tempo = orologio.guardata()
  const e = sessione.rispondi(q, risposta, { tocchi })
  for (const r of e.registra) answer(r.chiave, { correct: r.correct, ms: r.chiave === q.chiave ? tempo * 1000 : 0 })
  if (e.giusta) {
    conti.giuste++
    const k = contatoreDi(q.chiave)
    if (k) segna(k)
    suono.ok()
  } else {
    conti.errori++
    suono.no()
  }
  if (e.paga) {
    const pagato = incassa(pagaDi(q))
    conti.monete += pagato.dato
    conti.chieste += pagato.chiesto
  }
  // la fretta si misura su quello che c'era da leggere: la consegna e le risposte (o le tessere)
  const daLeggere = { testo: q.domanda.testo || '',
                      risposte: (q.opzioni || q.tessere || []).map(o => ({ testo: o.testo })) }
  const diFretta = troppoDiFretta(daLeggere, { giusto: e.giusta, tempo })
  const penale = pesoDellaFretta(diFretta, e.giusta)
  const giustaEra = !e.giusta && q.tessere ? e.giustaEra : null
  esito.value = {
    giusta: e.giusta, scelta, diFretta, giustaEra,
    perche: e.perche || '', siFa: e.giusta ? '' : (e.siFa || ''),
    sbagliate: !e.giusta && q.tessere ? F.sbagliate(q, fila.value) : [],
  }
  const quanto = e.giusta ? 900
    : attesaDellEsito({ righe: ['Non così.', e.perche, e.siFa, giustaEra ? 'Si dice: ' + giustaEra : ''],
                        pavimento: PONDERA, penale: penale.attesa })
  orologio.aspetta(quanto, () => (sessione && sessione.finita ? chiudiTappa() : prossima()))
}

function chiudiTappa() {
  const t = tappa.value
  let primaVolta = false
  if (!t.cassetto) {
    primaVolta = segnaVinta(c, t.id)
    persist()
    flushNow()      // una tappa si vince di rado: non deve perdersi
    // niente premio d'arrivo: ogni risposta giusta si è già pagata (docs/lingue/mondi-vista.md)
  }
  const m = t.cassetto ? null : mondoDellaTappa(t.id)
  const dopo = m ? m.tappe[m.tappe.findIndex(x => x.id === t.id) + 1] : null
  const avanti = dopo && !vinta(c, dopo.id) && tappaAperta(c, dopo.id) ? dopo : null
  fine.value = {
    titolo: t.cassetto ? 'Il cassetto è in ordine'
      : primaVolta ? (t.bandiera ? 'Il mondo è tuo!' : 'Tappa vinta!') : 'Tappa ripassata',
    sotto: t.cassetto ? mondoDi(t.mondo).nome : t.nome,
    prima: conti.gradoPrima,
    dopo: t.cassetto ? null : gradoTappa(t, forzaDi),
    giuste: conti.giuste, errori: conti.errori, monete: conti.monete,
    notaMonete: premioDetto(CHIAVE, conti.chieste, conti.monete),
    avanti: avanti ? avanti.nome : '',
  }
  prossimaId = avanti ? avanti.id : null
  suono.livello()
}

function avantiDaFine() {
  const id = prossimaId
  fine.value = null
  if (id) giocaTappa(id)
  else allaMappa()
}

/* ═══════════ il libro ═══════════ */
const libro = shallowRef(null)
const libroFase = ref('leggi')
const libroK = ref(0)
const libroScelta = ref(-1)
const libroPersi = ref(0)            // tocchi a pagamento nel capitolo: ognuno toglie una domanda
let libroGiuste = 0
let libroPagate = 0                  // le domande del capitolo già pagate, una per volta
let tocchiLibro = null

function apriLibro(mondo) {
  const caps = capitoliDi(CAPITOLI, mondo)
  if (!caps.length) return
  libro.value = capitolo(caps[Math.floor(Math.random() * caps.length)])
  libroFase.value = 'leggi'
  libroK.value = 0
  libroScelta.value = -1
  libroPersi.value = 0
  libroGiuste = 0
  libroPagate = 0
  tocchiLibro = new Tocchi({ itemDi: item })
  Object.assign(conti, { giuste: 0, errori: 0, monete: 0, chieste: 0, gradoPrima: null })
  fine.value = null
  vista.value = 'libro'
}

function hoLetto() {
  libroFase.value = 'domande'
  orologio.riparti()
}

function rispondiLibro(i) {
  if (libroScelta.value >= 0 || !orologio.pronta.value) return
  libroScelta.value = i
  const giusta = !!libro.value.domande[libroK.value].opzioni[i].giusta
  if (giusta) { libroGiuste++; conti.giuste++; suono.ok() } else { conti.errori++; suono.no() }
  // la domanda giusta paga adesso, se un tocco a pagamento non se l'è già mangiata
  if (giusta && domandeCheLPagano(libroGiuste, tocchiLibro.aPagamento) > libroPagate) {
    libroPagate++
    const p = incassa(PAGA_CAPITOLO)
    conti.monete += p.dato
    conti.chieste += p.chiesto
  }
  const quanto = giusta ? 900 : attesaDellEsito({ righe: ['Non così: rileggi il testo qui sopra.'], pavimento: 2500 })
  orologio.aspetta(quanto, avantiLibro)
}

function avantiLibro() {
  if (libroK.value + 1 < libro.value.domande.length) {
    libroK.value++
    libroScelta.value = -1
    orologio.riparti()
    return
  }
  for (const k of tocchiLibro.nonSapute) answer(k, { correct: false })
  const tot = libro.value.domande.length
  fine.value = {
    titolo: '📖 ' + libro.value.titolo,
    sotto: (libroGiuste === tot ? 'Hai capito tutto!' : `${libroGiuste} risposte giuste su ${tot}`) +
      (libroPersi.value ? ` · ${libroPersi.value === 1 ? 'una parola chiesta' : libroPersi.value + ' parole chieste'}, ` +
                          `${libroPersi.value === 1 ? 'una domanda' : libroPersi.value + ' domande'} senza monete` : ''),
    giuste: conti.giuste, errori: conti.errori, monete: conti.monete,
    notaMonete: premioDetto(CHIAVE, conti.chieste, conti.monete), avanti: '',
  }
  suono.livello()
}

/* ═══════════ la parola da toccare ═══════════ */
const bolla = ref(null)
let bollaTimer = 0

function tocca(el) {
  const parola = el && el.dataset && el.dataset.parola
  if (!parola) return
  let r
  if (vista.value === 'libro' && tocchiLibro) {
    r = tocchiLibro.tocca(parola)
    libroPersi.value = tocchiLibro.aPagamento
  } else if (vista.value === 'tappa' && tocchi && !esito.value) {
    r = tocchi.tocca(parola)
    pagaQui.value = tocchi.paga
  } else r = { ...traduci(parola), gratis: true }   // a domanda chiusa guardare non costa niente
  persist()   // il conto dei tocchi gratis sta sull'elemento SRS della parola
  const box = el.getBoundingClientRect()
  const x = Math.min(innerWidth - 90, Math.max(90, box.left + box.width / 2))   // la nuvoletta resta dentro lo schermo
  bolla.value = { parola, it: r.it || '', costa: !r.gratis, x, y: box.top }
  clearTimeout(bollaTimer)
  bollaTimer = setTimeout(() => { bolla.value = null }, 2200)
}

function ascolta() {
  const q = d.value
  if (!q || q.genere !== 'parola') return
  pronuncia(q.domanda.ascolta || q.domanda.testo, 'en')
}

/* ═══════════ l'indicatore delle monete ═══════════ */
const indicatore = computed(() => {
  if (vista.value === 'tappa' && d.value && !fine.value) {
    const quanto = pagaDi(d.value)
    return pagaQui.value ? { testo: `+${quanto}`, paga: true } : { testo: '+0', paga: false }
  }
  if (vista.value === 'libro' && libro.value && !fine.value) {
    const resto = Math.max(0, libro.value.domande.length - libroPersi.value) * PAGA_CAPITOLO
    return { testo: `fino a +${resto}`, paga: libroPersi.value === 0 }
  }
  return null
})

const titolo = computed(() => {
  if (vista.value === 'tappa' && tappa.value) return tappa.value.nome
  if (vista.value === 'libro' && libro.value) return 'Il libro'
  return 'English'
})

onUnmounted(() => { clearTimeout(bollaTimer); zittisci() })
</script>

<template>
  <LinguaGame v-if="vista === 'prima'" lingua="en" libero @vai="allaMappa" />
  <div v-else class="schermo ing" :data-vista="vista">
    <Barra :titolo="titolo" guida="inglese" monete @indietro="indietro">
      <div v-if="indicatore" class="ing-paga" :class="{ 'ing-non-paga': !indicatore.paga }"
           data-paga :data-paga-si="indicatore.paga ? '1' : '0'"
           :title="indicatore.paga ? 'quanto vale questa domanda' : 'hai chiesto una parola: questa non paga'">
        🪙 {{ indicatore.testo }}<span v-if="!indicatore.paga" class="ing-perso">🔍</span>
      </div>
    </Barra>

    <Mappa v-if="vista === 'mappa'" :stato="stato" :extra="extra" :prima="diPrima"
           @tappa="giocaTappa" @libro="apriLibro" @cassetto="giocaCassetto" @prima="vista = 'prima'" />

    <div v-else-if="vista === 'tappa' && d" class="ing-palco">
      <div class="ing-conto" data-conto>
        <span>✅ {{ Math.min(conti.giuste, conti.bersaglio) }} / {{ conti.bersaglio }}</span>
        <span class="ing-barretta"><i :style="{ width: Math.min(100, 100 * conti.giuste / conti.bersaglio) + '%' }"></i></span>
      </div>
      <Domanda :d="d" :caselle="caselle" :banco="banco" :pronto="pronto" :esito="esito"
               :attesa="attesa" :giro="giro" :parla="parla"
               @opzione="i => rispondi(d.opzioni[i], i)" @metti="metti" @togli="togli"
               @consegna="rispondi(F.risposta(fila), null)" @tocca="tocca" @ascolta="ascolta" />
    </div>

    <Libro v-else-if="vista === 'libro' && libro" :cap="libro" :fase="libroFase" :k="libroK"
           :scelta="libroScelta" :attesa="attesa" :giro="giro"
           @ho-letto="hoLetto" @rispondi="rispondiLibro" @tocca="tocca" />

    <Fine v-if="fine" v-bind="fine" @mappa="allaMappa" @avanti="avantiDaFine" />
    <Bolla v-if="bolla" v-bind="bolla" />
  </div>
</template>
