<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA FATTORIA — IL COORDINATORE

   L'unico file del gioco che sa che esistono le monete, il profilo e i
   contatori. Le regole stanno in `motore/fattoria.js` e girano senza
   schermo; il disegno in `scena/tela.js` e non conosce i prezzi; le
   tabelle in `dati/`. Se qualcosa qui dentro comincia a somigliare a una
   regola di gioco o a un `ctx.drawImage`, è nel file sbagliato.

   ── DOVE STA LA FATTORIA ──────────────────────────────────────────
   Non in un campo nuovo del profilo: sotto
   `profile.campagne.fattoria.cfg.stato`, che è l'unico posto sanzionato
   dove un gioco nuovo scrive (vedi `src/giochi/campagne.js`). È quello
   che torna da `Fattoria.serializza()`.

   Si salva **a ritardo**: trascinando una panchina si muovono venti volte
   al secondo delle celle, e persistere a ogni fotogramma vorrebbe dire
   scrivere in archivio venti volte al secondo per niente.

   ── LE MONETE SONO QUELLE VERE ────────────────────────────────────
   La borsa che il motore riceve è il salvadanaio del profilo. È il punto
   di tutto il gioco: la fattoria è il posto dove si *spende* quello che
   si è guadagnato facendo esercizi altrove, non un'altra lezione.
   ═══════════════════════════════════════════════════════════════════ */
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import Barra from '../../components/Barra.vue'
import { state, addCoins, segna, segnaBest, aspettoDi } from '../../store/profile.js'
import { scelta, ricorda } from '../campagne.js'

import { Fattoria } from './motore/fattoria.js'
import { Tela, Attore } from './scena/tela.js'
import { PER_ID, puoGirare } from './dati/catalogo.js'
import { animale, siDisegna } from './dati/animali.js'
import { pezzoAttore } from './dati/atlante.js'
import { PRIMA, ULTIMA, CELLE, SCALA_INIZIALE } from './dati/mondo.js'

import Roba from './viste/Roba.vue'
import Attrezzi from './viste/Attrezzi.vue'
import Battesimo from './viste/Battesimo.vue'
import Bestia from './viste/Bestia.vue'
import Provino from './viste/Provino.vue'
import './stile.css'

defineOptions({ name: 'LaFattoria' })
const emit = defineEmits(['vai'])

const CHIAVE = 'fattoria'
const ATTESA = 420                 // ms di pressione per prendere una cosa

/* ═══════════ lo stato ═══════════ */
const tela = ref(null)
const monete = computed(() => state.profile.coins || 0)
const avviso = ref('')
const pannello = ref(null)          // 'roba' | { tipo: 'piazzola'|'ostacolo', … }
const scelto = shallowRef(null)     // la cosa o l'attore selezionato
/* Il pennello del terreno **non è a schermo**, e lo si tiene spento di
   proposito: il motore sa già dipingere (`dipingi`/`spiana`, e la mappa
   delle materie in `dati/terreni.js`), ma finché il pittore non sa
   raccordare due materie diverse dare in mano un pennello vuol dire far
   disegnare pozze coi bordi sbagliati. La strada è pronta, il tasto
   arriva quando arriva il disegno. */
const pennello = ref(false)

let mondo = null                    // la Fattoria (motore)
let scena = null                    // la Tela (disegno)
let attori = []
let bambino = null
let salvaFra = 0, orologio = 0, ultimo = 0, giro = 0

/* La borsa che il motore usa: il salvadanaio vero. `paga(-n)` incassa —
   sgombrare il bosco rende, ed è l'unico modo di guadagnare qui dentro. */
const borsa = {
  quante: () => state.profile.coins || 0,
  paga: n => { addCoins(-n); return true },
}

function salva() { salvaFra = 1.2 }
function salvaOra() {
  salvaFra = 0
  if (mondo) ricorda(CHIAVE, 'stato', mondo.serializza())
}

function avvisa(testo) { avviso.value = testo; setTimeout(() => { avviso.value = '' }, 2600) }

/* ═══════════ nascere ═══════════ */
onMounted(() => {
  mondo = new Fattoria({ borsa, dato: scelta(CHIAVE, 'stato', null) })

  scena = new Tela(tela.value)
  scena.scala = SCALA_INIZIALE
  vaiACasa()

  /* Il personaggio è quello scelto nel profilo: senza, il gioco dovrebbe
     indovinare se è una bambina o un bambino, e indovinare vuol dire
     sbagliare per metà dei bambini. */
  const c0 = PRIMA * CELLE
  const casa = mondo.cellaLibera(c0 + 7, c0 + 9)
  bambino = new Attore(aspettoDi(), casa.x, casa.y, { velocita: 3.6 })
  attori = [bambino]

  metti_in_scena_le_bestie()

  scena.avvia()
  giro = requestAnimationFrame(passo)
  addEventListener('resize', vaiACasa)
  setTimeout(() => avvisa('Tieni premuto sul prato per aprire il baule, o su una cosa per prenderla.'), 500)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(giro)
  if (scena) scena.ferma()
  removeEventListener('resize', vaiACasa)
  salvaOra()
})

/* Le bestie comprate entrano in scena. Quelle che oggi non si sanno
   disegnare si **saltano in silenzio**: restano nel salvataggio, e
   torneranno quando il loro sprite arriverà. Un travaso a senso unico
   non deve perdere niente per strada, ma nemmeno mostrare un buco. */
function metti_in_scena_le_bestie() {
  const c0 = PRIMA * CELLE
  for (const b of mondo.bestie) {
    if (!siDisegna(b.chi) || attori.some(a => a.nome === b.chi)) continue
    const dove = mondo.cellaLibera(c0 + 8, c0 + 10)
    attori.push(new Attore(b.chi, dove.x, dove.y,
      { velocita: 2.4, vaga: 2.4, chi: b.nome || nomeDi(b.chi) }))
  }
}

function vaiACasa() {
  if (!scena) return
  scena.misura()
  const c = ((PRIMA + ULTIMA + 1) / 2) * scena.latoPx
  scena.vista.x = c - scena.L / 2
  scena.vista.y = c - scena.A / 2
  scena.limita()
}

function passo(ora) {
  giro = requestAnimationFrame(passo)
  const dt = Math.min(0.05, (ora - ultimo) / 1000 || 0)
  ultimo = ora
  orologio += dt
  const dentro = (x, y) => mondo.cellaMia(x, y) && !mondo.eAcqua(x, y)
  for (const a of attori) { if (a !== scelto.value) a.muovi(dt, dentro) }
  if (salvaFra > 0) { salvaFra -= dt; if (salvaFra <= 0) salvaOra() }
  scena.mostra({
    fattoria: mondo, attori, scelto: scelto.value, preso, anello,
    orologio, pennello: anteprimaPennello(),
  })
}

/* ═══════════ il dito ═══════════ */
const dita = new Map()
let pizzico = null, giu = null, lungo = null, anello = null, preso = null, scorrendo = false

/* Le coordinate del dito arrivano in pagina, ma la tela comincia sotto
   la barra: senza togliere l'origine si tocca una cella e se ne prende
   un'altra, e l'errore cresce con l'altezza della barra. */
function dove(e) {
  const r = tela.value.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}

function centro() {
  const v = [...dita.values()]
  return { x: (v[0].x + v[1].x) / 2, y: (v[0].y + v[1].y) / 2,
           d: Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y) }
}

function anteprimaPennello() {
  if (!pennello.value || !giu) return null
  const c = scena.cellaDa(giu.x, giu.y)
  return { celle: new Set([c.x + ',' + c.y]),
           ok: mondo.cellaMia(c.x, c.y) && mondo.libera(c.x, c.y, 1, 1) }
}

function premi(e) {
  dita.set(e.pointerId, dove(e))
  if (dita.size === 2) {
    if (lungo) { clearTimeout(lungo); lungo = null }
    giu = null; anello = null; scorrendo = false
    pizzico = { d0: centro().d, scala0: scena.scala }
    return
  }
  if (dita.size > 2) return

  const p = dove(e)
  giu = { ...p, x0: p.x, y0: p.y, mosso: false }
  scorrendo = false
  if (pennello.value) return dipingi(p)

  const c = scena.cellaDa(p.x, p.y)
  const cosa = mondo.cosaSotto(c.x, c.y)

  /* Tenere premuto sul prato vuoto apre il baule. È lo stesso gesto con
     cui si prende una cosa che c'è già — «tieni premuto dove vuoi agire»
     — e risparmia il viaggio fino al tasto in alto: si tiene premuto
     **dove** si vuole mettere qualcosa. */
  if (!cosa && mondo.cellaMia(c.x, c.y) && !mondo.ostacoloSotto(c.x, c.y)) {
    anello = { x: p.x, y: p.y, q: 0 }
    riempiAnello(performance.now())
    lungo = setTimeout(() => {
      lungo = null; anello = null; scelto.value = null; pannello.value = 'roba'
    }, ATTESA)
    return
  }
  if (!cosa || !mondo.cellaMia(c.x, c.y)) return

  /* L'anello che si riempie dice «sto per prenderlo»: finché non è pieno
     non è successo niente, e lasciando adesso non hai mosso nulla. */
  anello = { x: p.x, y: p.y, q: 0 }
  riempiAnello(performance.now())
  lungo = setTimeout(() => { lungo = null; anello = null; prendi(PER_ID[cosa.id], cosa, p) }, ATTESA)
}

/* L'anello che si riempie sotto il dito: finché non è pieno non è
   successo niente, e lasciando adesso non si è mosso nulla. */
function riempiAnello(t0) {
  const cresci = () => {
    if (!anello) return
    anello.q = Math.min(1, (performance.now() - t0) / ATTESA)
    if (anello.q < 1) requestAnimationFrame(cresci)
  }
  requestAnimationFrame(cresci)
}

function muovi(e) {
  if (dita.has(e.pointerId)) dita.set(e.pointerId, dove(e))
  if (pizzico && dita.size >= 2) {
    const c = centro()
    if (c.d > 24) scena.zoomA(pizzico.scala0 * (c.d / pizzico.d0), c.x, c.y)
    return
  }
  const p = dove(e)
  if (preso) return muoviPreso(p)
  if (!giu) return
  const dx = p.x - giu.x, dy = p.y - giu.y
  if (Math.abs(p.x - giu.x0) + Math.abs(p.y - giu.y0) > 10) {
    giu.mosso = true
    if (!pennello.value) scorrendo = true
    if (lungo) { clearTimeout(lungo); lungo = null; anello = null }
  }
  if (pennello.value && giu.mosso) dipingi(p)
  else if (scorrendo) {
    scena.vista.x -= Math.round(dx); scena.vista.y -= Math.round(dy); scena.limita()
  }
  giu.x = p.x; giu.y = p.y
  if (anello) { anello.x = p.x; anello.y = p.y }
}

function lascia(e) {
  const eraPizzico = !!pizzico
  dita.delete(e.pointerId)
  if (dita.size < 2) pizzico = null
  if (lungo) { clearTimeout(lungo); lungo = null }
  anello = null
  const p = dove(e)
  if (preso) { posaPreso(); giu = null; return }
  if (eraPizzico || !giu) { giu = null; return }
  /* Un tocco fermo è un tocco, quanto lungo sia: il limite di tempo che
     c'era buttava via le pressioni un po' lente, cioè proprio quelle di
     chi ha imparato che «si tiene premuto per prendere». */
  const fermo = !giu.mosso
  giu = null
  if (!fermo || pennello.value) return

  const c = scena.cellaDa(p.x, p.y)
  const px = (c.x / CELLE) | 0, py = (c.y / CELLE) | 0

  /* Comprare la terra viene PRIMA di tutto. Le bestie non ci vanno mai —
     restano su quello che è tuo — ma il loro bersaglio è più largo della
     cella su cui poggiano, e sporgendo sul bosco accanto si mangiava il
     tocco: alcune piazzole diventavano incomprabili a seconda di dove si
     era fermato il cane, il che è il tipo di guasto che sembra un caso. */
  if (mondo.comprabile(px, py)) { pannello.value = { tipo: 'piazzola', px, py }; return }

  const bestia = attoreSotto(p.x, p.y)
  if (bestia) {
    scelto.value = bestia
    apriBestia(bestia.nome)
    bestia.vaiA(bambino.cella.x, bambino.cella.y + 1)
    return
  }

  /* Un tocco secco su una cosa la **seleziona**: compaiono i suoi
     attrezzi, e da lì la si gira o la si mette via. Prima non faceva
     niente e per muoverla si teneva premuto — ma chi la teneva premuta
     una seconda volta finiva dritto nel trascinamento, senza mai vedere
     il tastino «mettila via». Adesso i due gesti sono separati: tocchi
     per scegliere, tieni premuto per spostare. */
  const cosa = mondo.cosaSotto(c.x, c.y)
  if (cosa && mondo.cellaMia(c.x, c.y)) { scelto.value = cosa; return }
  if (scelto.value) { scelto.value = null; return }

  const o = mondo.ostacoloSotto(c.x, c.y)
  if (o) { pannello.value = { tipo: 'ostacolo', o }; return }
  if (mondo.cellaMia(c.x, c.y)) bambino.vaiA(c.x, c.y)
}

/* Chi c'è sotto il dito. Si guarda il rettangolo davvero disegnato, non
   la cella: è l'unico modo perché toccare un cane grosso funzioni dove
   il cane si vede, e non solo dove appoggia. */
function attoreSotto(sx, sy) {
  for (let i = attori.length - 1; i >= 0; i--) {
    const a = attori[i]
    if (a === bambino) continue
    const p2 = pezzoAttore(a.nome, a.verso === 'sinistra' ? 'lato' : a.verso, 0)
    const r = a.riquadro(scena.cellaPx, scena.vista, p2)
    if (sx >= r.x - 4 && sx <= r.x + r.w + 4 && sy >= r.y && sy <= r.y + r.h + 4) return a
  }
  return null
}

const nomeDi = chi => (animale(chi) || {}).nome || chi

function annulla() {
  if (lungo) { clearTimeout(lungo); lungo = null }
  dita.clear(); pizzico = null; anello = null; preso = null; giu = null
}

/* col mouse non si pizzica: la rotella fa lo stesso mestiere, ma a passi
   interi — moltiplicare per 1,18 arrotondato lascerebbe la scala dov'è */
function rotella(e) {
  e.preventDefault()
  scena.zoomA(scena.scala + (e.deltaY < 0 ? 1 : -1), e.clientX, e.clientY)
}

/* ═══════════ prendere e posare ═══════════ */
function prendi(voce, da, p) {
  if (!voce) return
  preso = { voce, da, cx: null, cy: null, ok: false }
  scelto.value = da || null
  pannello.value = null
  if (p) muoviPreso(p)
}

function muoviPreso(p) {
  if (!preso) return
  const { voce, da } = preso
  const piede = da ? mondo.ingombro(da) : { w: voce.piede[0], h: voce.piede[1] }
  const c = scena.cellaDa(p.x, p.y)
  preso.cx = c.x - (((piede.w || voce.piede[0]) - 1) / 2 | 0)
  preso.cy = c.y
  preso.piede = [piede.w || voce.piede[0], piede.h || voce.piede[1]]
  preso.ok = mondo.libera(preso.cx, preso.cy, preso.piede[0], preso.piede[1], da)
}

function posaPreso() {
  const p = preso
  preso = null
  if (!p || p.cx === null) return
  const r = mondo.posa(p.voce.id, p.cx, p.cy, { sposta: p.da })
  if (!r.ok) {
    avvisa(r.motivo === 'poche-monete'
      ? `Ti servono ${r.costo - monete.value} monete in più.`
      : 'Lì non ci sta.')
    return
  }
  if (!p.da) { segna('fattoriaPosati'); segnaBest('fattoriaVarieta', mondo.tipiPosseduti) }
  if (r.cosa) scelto.value = r.cosa
  salva()
}

function dipingi(p) {
  const c = scena.cellaDa(p.x, p.y)
  const r = mondo.dipingiAcqua(c.x, c.y, PREZZO_ACQUA)
  if (r.ok && r.costo) salva()
  else if (r.motivo === 'poche-monete') { pennello.value = false; avvisa('Monete finite.') }
}

/* ═══════════ gli attrezzi della cosa scelta ═══════════ */
const gestiDiScelto = computed(() => {
  const s = scelto.value
  if (!s || !s.id) return []
  const v = PER_ID[s.id]
  return [
    ...(puoGirare(v) ? [{ chiave: 'gira', icona: '↻', titolo: 'giralo' }] : []),
    { chiave: 'via', icona: '📦', titolo: 'mettilo via' },
  ]
})

const doveAttrezzi = computed(() => {
  const s = scelto.value
  if (!s || !s.id || !scena || preso) return null
  const g = mondo.ingombro(s)
  return {
    x: Math.max(8, Math.min(scena.L - 140, (g.x + g.w / 2) * scena.cellaPx - scena.vista.x - 60)),
    y: Math.max(8, g.y * scena.cellaPx - scena.vista.y - 54 - scena.cellaPx),
  }
})

function attrezzo(chiave) {
  const s = scelto.value
  if (!s) return
  if (chiave === 'gira') {
    const r = mondo.gira(s)
    if (!r.ok) avvisa('Girato non ci sta: fagli spazio.')
    else salva()
  }
  if (chiave === 'via') {
    mondo.mettiVia(s)
    scelto.value = null
    salva()
  }
}

/* ═══════════ i pannelli ═══════════ */
function compraPiazzola() {
  const { px, py } = pannello.value
  const r = mondo.compraPiazzola(px, py)
  if (!r.ok) return avvisa(`Ti servono ${r.costo - monete.value} monete in più.`)
  segna('fattoriaTerre')
  pannello.value = null
  salva()
}

function sgombra() {
  const { o } = pannello.value
  const r = mondo.sgombra(o.x, o.y)
  if (!r.ok) return avvisa(`Ti servono ${r.costo - monete.value} monete in più.`)
  segna('fattoriaSgomberi')
  pannello.value = null
  salva()
}

/* Prima si sceglie il nome, poi si paga: un animale che compare senza
   nome e va battezzato dopo è un animale che resta «il cane» per sempre,
   perché quel «dopo» non arriva mai. */
function apriBattesimo(a) {
  if (mondo.hoLaBestia(a.chi)) return avvisa(`${a.nome} è già tuo.`)
  if (a.prezzo > monete.value)
    return avvisa(`Ti servono ${a.prezzo - monete.value} monete in più.`)
  pannello.value = { tipo: 'battesimo', chi: a.chi, che: a.nome, prezzo: a.prezzo }
}

/* Toccare una bestia mostra **come sta**, non chiede il nome: il nome
   glielo dai una volta, lo stato lo guardi ogni volta. */
function apriBestia(chi) {
  const b = mondo.laBestia(chi)
  if (!b) return
  pannello.value = { tipo: 'bestia', chi, che: nomeDi(chi), nome: b.nome || '',
                     stato: mondo.stato(chi) }
}

function nutri(cibo) {
  const chi = pannello.value.chi
  const r = mondo.nutri(chi, cibo)
  if (!r.ok) return avvisa(r.motivo === 'non-ha-fame'
    ? 'Ha la pancia piena.' : `Ti servono ${r.costo - monete.value} monete in più.`)
  salva(); apriBestia(chi)
}

function coccola(gesto) {
  const chi = pannello.value.chi
  const r = mondo.coccola(chi, gesto)
  if (!r.ok) return avvisa('Non ne ha bisogno adesso.')
  salva(); apriBestia(chi)
}

function battezza(nome) {
  const b = pannello.value
  pannello.value = null
  if (b.prezzo) {
    const r = mondo.compraBestia(b.chi, b.prezzo, nome)
    if (!r.ok) return avvisa('Non è andata: riprova.')
    metti_in_scena_le_bestie()
    avvisa(nome ? `${nome} è arrivato!` : `${b.che} è arrivato!`)
  } else {
    mondo.rinominaBestia(b.chi, nome)
    avvisa(nome ? `Adesso si chiama ${nome}.` : 'Nome tolto.')
    apriBestia(b.chi)
  }
  salva()
}

function compraVoce(v) {
  const r = mondo.compra(v.id)
  if (!r.ok) return avvisa(`Ti servono ${r.costo - monete.value} monete in più.`)
  segnaBest('fattoriaVarieta', mondo.tipiPosseduti)
  salva()
}

function tiraVoce({ voce, x, y }) {
  pannello.value = null
  prendi(voce, null, { x, y })
}
</script>

<template>
  <div class="schermo">
    <Barra titolo="La fattoria" monete @indietro="emit('vai', 'home')" />

    <div class="fa">
    <canvas ref="tela" class="fa-tela"
            @pointerdown="premi" @pointermove="muovi" @pointerup="lascia"
            @pointercancel="annulla" @wheel.prevent="rotella"></canvas>

    <div class="fa-tasti">
      <button class="fa-tondo" title="il baule" @click="pannello = 'roba'">📦</button>
    </div>

    <p v-if="avviso" class="fa-avviso">{{ avviso }}</p>

    <Attrezzi v-if="doveAttrezzi" :x="doveAttrezzi.x" :y="doveAttrezzi.y"
              :gesti="gestiDiScelto" @fai="attrezzo" @fine="scelto = null" />

    <div v-if="pannello" class="fa-velo" @click.self="pannello = null">
      <Roba v-if="pannello === 'roba'" class="fa-foglio"
            :monete="monete" :magazzino="mondo.magazzino" :bestie="mondo.bestie"
            @compra="compraVoce" @tira="tiraVoce" @compra-bestia="apriBattesimo"
            @chiudi="pannello = null" />

      <Bestia v-else-if="pannello.tipo === 'bestia'"
              :chi="pannello.chi" :che="pannello.che" :nome="pannello.nome"
              :stato="pannello.stato" :monete="monete"
              @nutri="nutri" @coccola="coccola"
              @rinomina="pannello = { tipo: 'battesimo', chi: pannello.chi,
                                      che: pannello.che, nome: pannello.nome, prezzo: 0 }"
              @chiudi="pannello = null" />

      <Battesimo v-else-if="pannello.tipo === 'battesimo'"
                 :chi="pannello.chi" :che="pannello.che" :nome="pannello.nome || ''"
                 :prezzo="pannello.prezzo"
                 @conferma="battezza" @chiudi="pannello = null" />

      <div v-else-if="pannello.tipo === 'piazzola'" class="fa-foglio">
        <h2>Un altro pezzo di terra</h2>
        <p>Costa <b>🪙{{ mondo.prezzoDellaProssima }}</b>. Ogni pezzo dopo
           costa un po' di più.</p>
        <div class="fa-fila">
          <button class="fa-bot piano" @click="pannello = null">Lascia stare</button>
          <button class="fa-bot forte" :disabled="monete < mondo.prezzoDellaProssima"
                  @click="compraPiazzola">Compra</button>
        </div>
      </div>

      <div v-else class="fa-foglio">
        <h2>{{ pannello.o.nome }}</h2>
        <Provino :pezzo="pannello.o.pezzo" :lato="64" />
        <p>Toglierlo costa <b>🪙{{ pannello.o.costo }}</b>, e libera il posto
           per metterci quello che vuoi.</p>
        <div class="fa-fila">
          <button class="fa-bot piano" @click="pannello = null">Lascia stare</button>
          <button class="fa-bot forte" :disabled="monete < pannello.o.costo"
                  @click="sgombra">Sgombra</button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>
