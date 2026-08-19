<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL GIOCO DI LINGUA — uno solo, a campagna, per English e Spagnolo.

   Prima l'inglese era due giochi: le parole con le figure e i verbi in
   ascolto. Stesso identico meccanismo — un bersaglio, alcune risposte,
   si tocca quella giusta — con due vestiti diversi e due mucchi di
   contenuti separati, e nessuno dei due andava da nessuna parte.

   Qui il meccanismo resta uno, e sopra ci girano tutti i TIPI DI DOMANDA
   di `data/domande.js`: guarda la figura, ascolta, traduci, gira la
   traduzione, scegli fra due frasi che sembrano uguali. Quale tipo tocca
   a un elemento lo decide la sua forza nel motore, non la tappa: vedi
   lassù il perché.

   Delle lingue questo file sa solo quello che gli passa `data/lingue.js`:
   la campagna, dove segnare i progressi, il nome da scrivere. Inglese e
   spagnolo sono due strade separate — chiavi diverse, tappe diverse,
   progressi diversi — che girano sullo stesso gioco.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { state, item, answer, level, addCoins, mastered, segna,
         linguaProgresso, linguaCompleta, tappaAperta } from '../store/profile.js'
import { apertaQui } from '../data/portata-giochi.js'
import { createPicker, activeSet, overdue, strength, SRS } from '../store/srs.js'
import { linguaDi } from '../data/lingue.js'
import { voceDi } from '../data/lessico.js'
import { TIPI, scegliTipo, componi } from '../data/domande.js'
import { suono } from '../audio.js'
import { pronuncia, haVoce, prepara, zittisci } from '../voce.js'
import Barra from '../components/Barra.vue'

const props = defineProps({ lingua: { type: String, default: 'en' } })
const emit = defineEmits(['vai'])

/* Tutto quello che cambia da una lingua all'altra sta qui dentro. Non è
   reattivo di proposito: la lingua la sceglie chi apre il gioco dalla
   home e non cambia mentre si gioca — sarebbe un altro gioco. */
const L = linguaDi(props.lingua)
const CAMPAGNA = L.CAMPAGNA

const PER_MONETA = 10
const fase = ref('mappa')          // mappa | gioco | vinta | trionfo | fine

/* ---------- la campagna ---------- */
const progresso = computed(() => linguaProgresso(L.campo))
const tappaIdx = ref(0)            // -1 = gioco libero
const tappa = computed(() => L.tappaDi(tappaIdx.value))
const campagna = computed(() => tappaIdx.value >= 0)
/* Il lucchetto guarda anche l'età: le tappe che questo bambino ha già
   passato nascono aperte, quelle troppo avanti restano chiuse
   (`data/portata.js`, il campo `portata` su ogni tappa). */
const sbloccata = i => apertaQui(L.tappaDi(i), i, progresso.value.tappa)

/* le chiavi nuove della tappa, in un Set: serve a ogni risposta per
   sapere se contava come "mirata", e `includes` su settanta chiavi a
   ogni turno si sentirebbe */
const nuoveDiTappa = computed(() => new Set(tappa.value.nuove))
const vecchieDiTappa = computed(() =>
  tappa.value.chiavi.filter(k => !nuoveDiTappa.value.has(k)))

/* quanto si sa di ogni tappa: la mappa lo mostra come barretta, ed è la
   risposta alla domanda "che cosa mi manca qui?" */
const saputeDi = t => t.nuove.filter(k => mastered(k)).length

/* ---------- ordine di introduzione ----------
   Prima le parole che somigliano all'italiano: sono regali, e cominciare
   con un regalo tiene dentro. Le frasi vanno in fondo comunque, perché
   la loro tappa arriva dopo. */
const cacheOrdine = new Map()
function ordine(k) {
  if (cacheOrdine.has(k)) return cacheOrdine.get(k)
  const v = voceDi(k)
  let d = 99
  if (v) {
    if (v.genere === 'frase') d = 100 + v.str.length / 10
    else {
      const gr = s => { const o = new Set(); s = s.toLowerCase().replace(/[^a-z]/g, '')
                        for (let i = 0; i < s.length - 1; i++) o.add(s.slice(i, i + 2)); return o }
      const A = gr(v.str), B = gr(v.it)
      let hit = 0; for (const g of A) if (B.has(g)) hit++
      const sim = (A.size && B.size) ? 2 * hit / (A.size + B.size) : 0
      const len = v.str.replace(/[^a-z]/gi, '').length
      d = (0.55 + 0.11 * Math.max(0, len - 3)) * (1 - 0.62 * sim)
    }
  }
  cacheOrdine.set(k, d); return d
}

/* ---------- stato di gioco ---------- */
const turno = ref(null)            // il turno pronto da mostrare (vedi domande.js)
const esito = ref({})              // testo opzione -> 'bene' | 'male' | 'mostra'
const svelato = ref(false)         // in ascolto: dopo la risposta si vede la parola
const premio = ref(0)
const moneta = ref(0)
const hud = reactive({ giuste: 0, mirate: 0, errori: 0, serie: 0 })
let occupato = false, timerId = null

const picker = createPicker({ getItem: k => item(k), useTime: false, pausaDopo: 3 })

/* Il pool: per due terzi la roba nuova della tappa, il resto ripasso.
   È la stessa scelta dei pianeti — se il nuovo uscisse una volta su
   dieci, la tappa diventerebbe un'attesa invece di una lezione. */
function attive(chiavi, quante) {
  if (!chiavi.length) return []
  const now = Date.now()
  const { learning, due } = activeSet(chiavi, k => item(k), ordine, now, quante)
  const scaduti = due
    .sort((a, b) => overdue(item(b), now) - overdue(item(a), now))
    .slice(0, Math.max(2, Math.round(quante / 3)))
  const p = [...new Set([...learning, ...scaduti])]
  return p.length ? p : chiavi.slice(0, quante)
}

function pool() {
  if (!campagna.value) return attive(tappa.value.chiavi, SRS.setSize + 4)
  const nuove = attive(tappa.value.nuove, SRS.setSize)
  const ripasso = attive(vecchieDiTappa.value, 4)
  const p = [...new Set([...nuove, ...ripasso])]
  return p.length ? p : tappa.value.chiavi.slice(0, SRS.setSize)
}

/* Se una chiave non sa produrre una domanda — una voce sparita, o un tipo
   che non le si applica — si riprova con un'altra invece di restare lì:
   un turno che non arriva mai è un gioco morto, e da fuori sembrerebbe
   che il tocco non funzioni. */
function nuovoTurno() {
  const P = pool()
  for (let tentativi = 0; tentativi < 12; tentativi++) {
    const chiave = picker.pick(P)
    const v = voceDi(chiave)
    if (!v) continue
    const tipo = scegliTipo(v, {
      aperti: tappa.value.tipi,
      forza: strength(item(chiave), Date.now()),
      haVoce: p => haVoce(p, L.id),
    })
    if (!tipo) continue
    turno.value = componi(v, tipo, L.nome)
    esito.value = {}
    svelato.value = false
    occupato = false
    if (turno.value.domanda.ascolta)
      setTimeout(() => pronuncia(turno.value.domanda.ascolta, L.id), 260)
    return
  }
  occupato = false                                  // meglio ripetere che bloccarsi
}

/* Dopo la risposta la parola NON si ripete da sola: il bambino ha appena
   premuto, sentirsi parlare addosso confonde. Se vuole risentirla, tocca
   la carta. */
function rispondi(o) {
  if (occupato || !o || !turno.value) return
  occupato = true
  const t = turno.value
  const giusto = !!o.giusta
  answer(t.chiave, { correct: giusto })
  picker.afterAnswer(t.chiave, giusto)
  svelato.value = true

  const conta = L.contatori[t.voce.genere]

  if (giusto) {
    esito.value = { [o.testo]: 'bene' }
    suono.ok()
    hud.giuste++
    hud.serie++
    if (nuoveDiTappa.value.has(t.chiave)) hud.mirate++
    segna(conta)
    if (hud.giuste % PER_MONETA === 0 && !campagna.value) {
      // nella campagna le monete arrivano dal traguardo, non dal tempo passato
      const g = level.value
      addCoins(g); moneta.value = g
      setTimeout(() => (moneta.value = 0), 1100)
      suono.moneta()
    }
    if (centrato()) return tappaSuperata()
    timerId = setTimeout(nuovoTurno, 620)
  } else {
    const giusta = t.opzioni.find(x => x.giusta)
    esito.value = { [o.testo]: 'male', [giusta.testo]: 'mostra' }
    suono.no()
    hud.errori++
    hud.serie = 0
    timerId = setTimeout(nuovoTurno, 2100)
  }
}

const centrato = () => campagna.value &&
  hud.giuste >= tappa.value.bersaglio && hud.mirate >= tappa.value.mirate

/* ---------- passaggi di fase ---------- */
function inizia(i = tappaIdx.value) {
  clearTimeout(timerId)
  tappaIdx.value = i
  hud.giuste = 0; hud.mirate = 0; hud.errori = 0; hud.serie = 0
  picker.reset()
  cacheOrdine.clear()
  fase.value = 'gioco'
  // scalda l'audio della tappa: la prima pronuncia non deve far aspettare
  prepara(tappa.value.nuove.map(k => (voceDi(k) || {}).str).filter(Boolean), L.id)
  nuovoTurno()
}

function tappaSuperata() {
  clearTimeout(timerId)
  const ultima = tappaIdx.value === CAMPAGNA.length - 1
  // il premio è della prima volta: rigiocare una tappa già vinta lascia
  // una moneta di cortesia, non uno stipendio
  const giaFatta = progresso.value.tappa > tappaIdx.value
  linguaCompleta(L.campo, tappaIdx.value, CAMPAGNA.length)
  premio.value = giaFatta ? 1 : level.value * (2 + Math.floor(tappaIdx.value / 2))
  addCoins(premio.value)
  fase.value = ultima ? 'trionfo' : 'vinta'
  suono.livello(); suono.moneta()
}

function prossimaTappa() { inizia(Math.min(CAMPAGNA.length - 1, tappaIdx.value + 1)) }

function allaMappa() {
  clearTimeout(timerId)
  zittisci()
  fase.value = 'mappa'
  tappaIdx.value = Math.min(CAMPAGNA.length - 1, progresso.value.tappa)
}

/* ---------- trascinamento: solo quando le risposte sono figure ----------
   Toccare funziona sempre; trascinare la parola sulla figura è il gesto
   che al gioco delle parole piaceva, e sulle emoji ha senso perché il
   bersaglio è grande. Sui bottoni di testo no: sarebbe scomodo. */
const cartaEl = ref(null)
const grigliaEl = ref(null)
const trascina = ref(null)
let dr = null

function sotto(x, y) {
  if (!grigliaEl.value) return null
  return [...grigliaEl.value.children].find(c => {
    const r = c.getBoundingClientRect()
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
  }) || null
}
function giu(e) {
  if (occupato || !turno.value || !turno.value.figure) return
  const r = cartaEl.value.getBoundingClientRect()
  dr = { dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width, mosso: false }
  cartaEl.value.setPointerCapture(e.pointerId)
}
function muovi(e) {
  if (!dr) return
  if (!dr.mosso) { dr.mosso = true; trascina.value = { x: 0, y: 0, w: dr.w } }
  trascina.value.x = e.clientX - dr.dx
  trascina.value.y = e.clientY - dr.dy
  const s = sotto(e.clientX, e.clientY)
  ;[...grigliaEl.value.children].forEach(c => c.classList.toggle('calda', c === s))
}
function su(e) {
  if (!dr) return
  const era = dr.mosso; dr = null; trascina.value = null
  ;[...grigliaEl.value.children].forEach(c => c.classList.remove('calda'))
  if (!era) return riascolta()          // tocco secco sulla carta: la ripete
  const s = sotto(e.clientX, e.clientY)
  if (s) rispondi(turno.value.opzioni[Number(s.dataset.i)])
}

function riascolta() {
  const d = turno.value && turno.value.domanda
  if (!d) return
  pronuncia(d.ascolta || (turno.value.voce.genere !== 'frase' ? turno.value.voce.str : null), L.id)
}

/* ---------- quello che si vede ---------- */
const parolaCarta = computed(() => {
  const t = turno.value
  if (!t) return ''
  if (t.domanda.ascolta && !svelato.value) return '🎧'
  return t.domanda.ascolta ? t.domanda.svela : t.domanda.testo
})
const cartaParla = computed(() => {
  const t = turno.value
  if (!t) return false
  return !!t.domanda.ascolta || (t.voce.genere !== 'frase' && haVoce(t.voce.str, L.id))
})
const avanzamento = computed(() => campagna.value
  ? Math.min(100, (hud.giuste / tappa.value.bersaglio) * 100)
  : (hud.giuste % PER_MONETA) * (100 / PER_MONETA))
const quota = (n, tot) => Math.min(100, Math.round((n / tot) * 100)) + '%'

const sapute = computed(() => CAMPAGNA.map(saputeDi))
const totaleSapute = computed(() => sapute.value.reduce((a, b) => a + b, 0))
const totaleChiavi = CAMPAGNA[CAMPAGNA.length - 1].chiavi.length

onMounted(() => {
  tappaIdx.value = Math.min(CAMPAGNA.length - 1, progresso.value.tappa)
  /* aggancio per i test automatici: `__eng` per l'inglese e `__es` per lo
     spagnolo, più `__lingua` che punta sempre al gioco aperto adesso. */
  const api = { fase, hud, turno, tappa, tappaIdx, rispondi, inizia, progresso,
                CAMPAGNA, allaMappa, iniziaLibero: () => inizia(-1), lingua: L.id,
                giusta: () => turno.value && turno.value.opzioni.find(o => o.giusta) }
  window[L.id === 'en' ? '__eng' : '__es'] = api
  window.__lingua = api
})
onUnmounted(() => { clearTimeout(timerId); zittisci() })
</script>

<template>
  <div class="schermo">
    <!-- ═══════════ la mappa delle tappe ═══════════ -->
    <template v-if="fase === 'mappa'">
      <Barra :titolo="L.titolo" monete @indietro="$emit('vai','home')">
        <div class="gettone">⭐ <b>{{ level }}</b></div>
      </Barra>

      <div class="mappa">
        <div class="riepilogo">
          <b>{{ totaleSapute }}</b> parole e frasi che sai · tappa
          {{ Math.min(progresso.tappa + 1, CAMPAGNA.length) }} di {{ CAMPAGNA.length }}
        </div>

        <button v-for="t in CAMPAGNA" :key="t.i" class="tappa"
                :class="{ chiusa: !sbloccata(t.i), fatta: progresso.tappa > t.i }"
                :disabled="!sbloccata(t.i)" @click="inizia(t.i)">
          <span class="em">{{ sbloccata(t.i) ? t.emoji : '🔒' }}</span>
          <span class="testo">
            <b>{{ t.nome }}</b>
            <i v-if="sbloccata(t.i)">{{ sapute[t.i] }}/{{ t.nuove.length }} sicure</i>
            <i v-else>supera la tappa prima</i>
            <span v-if="sbloccata(t.i)" class="barretta">
              <i :style="{ width: quota(sapute[t.i], t.nuove.length) }"></i>
            </span>
          </span>
          <span v-if="progresso.tappa > t.i" class="spunta">✓</span>
        </button>

        <button v-if="progresso.libera" class="tappa libera" @click="inizia(-1)">
          <span class="em">♾️</span>
          <span class="testo"><b>Gioco libero</b><i>tutto insieme, senza fine</i></span>
        </button>
      </div>
    </template>

    <!-- ═══════════ il gioco ═══════════ -->
    <template v-else-if="fase === 'gioco'">
      <Barra :titolo="L.titolo" @indietro="allaMappa()">
        <div class="gettone">✅ <b>{{ hud.giuste }}</b></div>
        <div class="avanz"><i :style="{ width: avanzamento + '%' }"></i></div>
      </Barra>

      <div v-if="campagna" class="bersaglio">
        <span>{{ hud.giuste }}/{{ tappa.bersaglio }}</span>
        <span v-if="tappa.mirate">· nuove {{ Math.min(hud.mirate, tappa.mirate) }}/{{ tappa.mirate }}</span>
      </div>

      <div class="palco" v-if="turno">
        <div class="etichetta">{{ turno.etichetta }}</div>

        <!-- la carta è anche il pulsante per risentire la parola -->
        <button class="carta" ref="cartaEl"
                :class="{ misteriosa: turno.domanda.ascolta && !svelato,
                          italiana: turno.domanda.italiano,
                          lunga: turno.lunghe || turno.domanda.testo && turno.domanda.testo.length > 16,
                          muta: !cartaParla }"
                @pointerdown="giu" @pointermove="muovi" @pointerup="su" @pointercancel="su"
                @click="turno.figure ? null : riascolta()">
          {{ parolaCarta }}
          <span v-if="cartaParla" class="altoparlante">🔊</span>
        </button>

        <div v-if="turno.domanda.aiuto" class="aiuto">{{ turno.domanda.aiuto }}</div>
        <div v-else-if="cartaParla" class="mini">tocca per sentirla</div>
      </div>

      <div v-if="turno" class="scelte" ref="grigliaEl"
           :class="{ figure: turno.figure, lunghe: turno.lunghe }">
        <button v-for="(o, i) in turno.opzioni" :key="o.testo + i" class="scelta"
                :data-i="i" :class="esito[o.testo]" @click="rispondi(o)">
          {{ o.testo }}
        </button>
      </div>

      <div v-if="trascina" class="carta volante"
           :style="{ left: trascina.x + 'px', top: trascina.y + 'px', width: trascina.w + 'px' }">
        {{ parolaCarta }}
      </div>
      <div v-if="moneta" class="moneta">+{{ moneta }} 🪙</div>
    </template>

    <!-- ═══════════ tappa superata ═══════════ -->
    <template v-else>
      <div class="finale">
        <div class="grande">{{ fase === 'trionfo' ? '🏆' : tappa.emoji }}</div>
        <h2>{{ fase === 'trionfo' ? 'Campagna finita!' : 'Tappa superata!' }}</h2>
        <p v-if="fase === 'trionfo'">Hai fatto tutte e {{ CAMPAGNA.length }} le tappe.
          Da adesso c'è il gioco libero: tutto insieme, senza fine.</p>
        <p v-else class="dritta">{{ tappa.dritta }}</p>
        <div class="premio">+{{ premio }} 🪙</div>
        <div class="conti">✅ {{ hud.giuste }} giuste · ✋ {{ hud.errori }} errori</div>
        <div class="bottoni">
          <button v-if="fase !== 'trionfo'" class="grosso" @click="prossimaTappa()">Avanti →</button>
          <button class="grosso chiaro" @click="allaMappa()">La mappa</button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.titolo { flex:1; text-align:center; font-weight:900; font-size:18px; color:var(--viola-scuro) }
.avanz { height:8px; background:#ffffffcc; border-radius:5px; overflow:hidden; flex:1 1 30px; min-width:24px }
.avanz i { display:block; height:100%; border-radius:5px; transition:width .35s;
           background:linear-gradient(90deg,var(--giallo),var(--rosa)) }
.tappina { font-size:18px }

/* ---------- mappa ---------- */
.mappa { flex:1; min-height:0; overflow-y:auto; padding:10px 14px calc(18px + env(safe-area-inset-bottom));
         display:flex; flex-direction:column; gap:9px; max-width:560px; width:100%; margin:0 auto }
.riepilogo { color:var(--tenue); font-weight:800; font-size:14px; text-align:center; padding:4px 0 6px }
.tappa { display:flex; align-items:center; gap:12px; text-align:left; padding:12px 14px;
         background:var(--carta); border-radius:18px; box-shadow:0 5px 0 #dde3ea, 0 10px 20px #8593a822;
         position:relative }
.tappa:active:not(:disabled) { transform:translateY(2px); box-shadow:0 3px 0 #dde3ea }
.tappa.chiusa { opacity:.55; box-shadow:none }
.tappa.fatta { background:linear-gradient(120deg,#e9fbf1,#ffffff) }
.tappa .em { font-size:30px; line-height:1; flex:0 0 36px; text-align:center }
.tappa .testo { display:flex; flex-direction:column; gap:2px; flex:1; min-width:0 }
.tappa .testo b { font-size:17px; color:var(--viola-scuro) }
.tappa .testo i { font-style:normal; font-size:12.5px; color:#7a6b95; font-weight:700 }
.barretta { display:block; height:6px; background:#eee3f7; border-radius:4px; overflow:hidden; margin-top:4px }
.barretta i { display:block; height:100%; background:linear-gradient(90deg,var(--verde),#8fe3b0) }
.spunta { color:var(--verde); font-size:22px; font-weight:900 }

/* ---------- gioco ---------- */
.bersaglio { text-align:center; color:var(--tenue); font-weight:800; font-size:13px; padding:2px 0;
             display:flex; gap:6px; justify-content:center }
/* la domanda sta in basso, appoggiata alle risposte: su un telefono
   tenuto in mano il pollice arriva lì, e occhio e dito non devono fare
   avanti e indietro per mezzo schermo */
.palco { flex:1; min-height:0; display:flex; flex-direction:column; align-items:center;
         justify-content:flex-end; gap:8px; padding:8px 12px 14px }
.etichetta { font-size:13px; font-weight:800; letter-spacing:1px; text-transform:uppercase;
             color:var(--tenue) }

.carta { position:relative; background:linear-gradient(180deg,var(--viola),var(--viola-scuro));
         color:#fff; border-radius:22px; padding:18px 30px; min-width:min(76vw,340px);
         max-width:min(92vw,520px); font-size:clamp(26px,8vw,44px); font-weight:900;
         letter-spacing:.5px; touch-action:none; text-align:center;
         box-shadow:0 8px 0 #2c4283, 0 14px 30px #4f6bd055; transition:transform .12s, box-shadow .12s }
.carta:active:not(.muta) { transform:translateY(4px); box-shadow:0 4px 0 #2c4283, 0 8px 18px #4f6bd044 }
.carta.misteriosa { background:linear-gradient(180deg,#5b46c9,#372a86); font-size:clamp(38px,11vw,60px) }
.carta.italiana { background:linear-gradient(180deg,#ff9f43,#e07b1f); box-shadow:0 8px 0 #b35f14, 0 14px 30px #ff9f4355 }
.carta.lunga { font-size:clamp(18px,4.6vw,26px); line-height:1.3; padding:16px 22px }
.carta .altoparlante { position:absolute; right:10px; bottom:8px; font-size:17px; opacity:.7 }
.carta.volante { position:fixed; z-index:50; pointer-events:none;
                 transform:scale(1.05) rotate(-2deg); box-shadow:0 14px 34px #2c428377 }
.aiuto { font-size:14px; font-weight:700; color:var(--tenue); text-align:center }
.mini { font-size:12.5px; font-weight:700; color:var(--tenue); opacity:.8 }

.scelte { display:grid; grid-template-columns:1fr 1fr; gap:9px; padding:6px 12px calc(12px + env(safe-area-inset-bottom));
          width:100%; max-width:540px; margin:0 auto }
.scelte.figure { grid-template-columns:repeat(3,1fr); justify-content:center }
.scelte.lunghe { grid-template-columns:1fr }
.scelta { background:var(--carta); color:var(--viola-scuro); font-size:clamp(15px,4.2vw,20px);
          font-weight:800; padding:15px 10px; border-radius:16px; border:3px solid transparent;
          box-shadow:0 5px 0 #dde3ea, 0 10px 20px #8593a822;
          transition:transform .14s, border-color .14s, box-shadow .14s }
.scelte.figure .scelta { aspect-ratio:1; display:flex; align-items:center; justify-content:center;
                         font-size:clamp(30px,9vh,54px); padding:0; max-width:min(160px,22vh);
                         width:100%; justify-self:center }
.scelte.lunghe .scelta { font-size:clamp(14px,4vw,18px); padding:13px 12px; text-align:center }
.scelta:active { transform:translateY(2px); box-shadow:0 3px 0 #dde3ea }
.scelta.bene { animation:salta .5s; border-color:var(--verde); background:#e6f9ee }
.scelta.mostra { border-color:var(--verde); box-shadow:0 0 0 5px #38c17244 }
.scelta.male { animation:scuoti .4s; border-color:var(--rosso); background:#ffe9ee }
@keyframes salta { 0%{transform:scale(1)} 40%{transform:scale(1.12)} 100%{transform:scale(1)} }
@keyframes scuoti { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)}
                    50%{transform:translateX(8px)} 75%{transform:translateX(-5px)} }

/* ---------- finale ---------- */
.finale { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:10px; padding:20px; text-align:center; color:var(--testo) }
.finale .grande { font-size:72px; animation:salta 1s }
.finale h2 { font-size:26px; font-weight:900 }
.finale p { max-width:420px; font-size:15px; font-weight:700; color:var(--tenue); line-height:1.4 }
.finale .dritta { background:#ffffffcc; border-radius:14px; padding:12px 16px; color:var(--testo);
                   box-shadow:0 4px 14px #8593a822 }
.premio { font-size:30px; font-weight:900; color:#c98a00 }
.conti { font-size:14px; font-weight:800; color:var(--tenue) }
.bottoni { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin-top:6px }
.grosso { background:var(--giallo); color:#5a3d00; font-weight:900; font-size:18px;
          padding:13px 26px; border-radius:999px; box-shadow:0 5px 0 #c99a00 }
.grosso.chiaro { background:#ffffffee; color:var(--viola-scuro); box-shadow:0 5px 0 #d4dce6 }
.grosso:active { transform:translateY(2px); box-shadow:0 3px 0 #c99a00 }

.moneta { position:fixed; left:50%; top:52%; transform:translateX(-50%); z-index:60;
          font-size:40px; font-weight:900; color:#c98a00; pointer-events:none;
          animation:vola 1.1s ease-out forwards }
@keyframes vola { 0%{transform:translateX(-50%) scale(.4);opacity:0}
                  30%{transform:translateX(-50%) scale(1.3);opacity:1}
                  100%{transform:translate(-50%,-130px) scale(.85);opacity:0} }
</style>
