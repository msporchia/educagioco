<script setup>
/* La misura del telefono (docs/core/vecchio-telefono.md): un foglio a tutto schermo con due prove. Le scene di
   `grafica/benchmark/prove.js` (una cosa sola a qualità diverse, un minuto) e quelle coi modelli veri dei giochi
   (`grafica/benchmark/veri.js`, qualche minuto, docs/core/vecchio-telefono-veri.md). Ognuna compone un log da mandare dal modulo
   (in più invii se è lungo) o da copiare, e l'ultimo resta sul telefono. Il codice (e three) si carica solo premendo il tasto.
   La ✕ in alto a destra chiude, e durante la misura la ferma; «Interrompi» la ferma e tiene quello che c'è. */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { componi } from '../../grafica/benchmark/log.js'
import { componiVeri, conNote, spezza } from '../../grafica/benchmark/log-veri.js'
import { ultimeMisure, salvaMisura } from '../../store/benchmark.js'
import { fasciaAttiva } from '../../store/qualita.js'
import { sondaRicevitore, mandaAlRicevitore } from '../../grafica/benchmark/invio-diretto.js'

const props = defineProps({ modulo: { type: String, required: true } })
const emit = defineEmits(['chiudi'])

const stato = ref('pronto')            // pronto | corre | fatto | guasto
const modo = ref('sintetico')          // sintetico | veri
const avanza = ref({ i: 0, n: 1, nome: '' })
const log = ref('')
const note = ref('')
const esito = ref('')
const tela = ref(null)
const palco = ref(null)
const ultime = ref({})
let fermare = false

const versione = () => (typeof __VERSIONE__ !== 'undefined' ? __VERSIONE__.id : '')
// Chrome accorcia lo user agent («Android 10; K»): il modello vero, se c'è, lo dice userAgentData
async function meta() {
  let nome = ''
  try { const h = navigator.userAgentData && await navigator.userAgentData.getHighEntropyValues(['model']); nome = (h && h.model) || '' } catch (e) { /* non lo dice */ }
  return { versione: versione(), ua: navigator.userAgent, nome, cpu: navigator.hardwareConcurrency, memoria: navigator.deviceMemory }
}

onMounted(async () => { ultime.value = await ultimeMisure() })

// Il lettore in diretta mentre gira (docs/core/vecchio-telefono-elementi.md, «Il tetto di tempo e il lettore»): gli fps dell'ultimo mezzo secondo con un
// requestAnimationFrame suo, come ContaFps.vue, e i secondi nella scena di adesso (anche nelle pause e nelle attese lunghe). Se i fotogrammi
// non arrivano per 5 s lo dice; se si ferma tutta la pagina, lo dice il CSS (`.muto`, che compare da sé se il battito non lo rinnova)
const fps = ref(0), secondi = ref(0), muto = ref(false), battito = ref(0)
let rafVivo = 0, ultimoRaf = 0, finestra = [], aggFps = 0, inizioScena = 0, chiaveScena = '', orologio = 0
function vivo(t) {
  if (ultimoRaf && t - ultimoRaf < 1000) finestra.push(t - ultimoRaf)
  ultimoRaf = t
  if (t - aggFps > 500) { fps.value = finestra.length ? Math.round(1000 * finestra.length / finestra.reduce((a, b) => a + b, 0)) : 0; finestra = []; aggFps = t; battito.value++ }
  rafVivo = requestAnimationFrame(vivo)
}
function accendiLettore() {
  spegniLettore()
  inizioScena = performance.now(); chiaveScena = ''; muto.value = false
  rafVivo = requestAnimationFrame(vivo)
  orologio = setInterval(() => {
    const ora = performance.now()
    secondi.value = Math.floor((ora - inizioScena) / 1000)
    muto.value = !!ultimoRaf && ora - ultimoRaf > 5000
  }, 500)
}
function spegniLettore() { cancelAnimationFrame(rafVivo); clearInterval(orologio); rafVivo = 0; ultimoRaf = 0; finestra = []; fps.value = 0 }
onBeforeUnmount(spegniLettore)

async function avvia(che = modo.value, lunga = false) {
  modo.value = che; stato.value = 'corre'; fermare = false; esito.value = ''; note.value = ''
  accendiLettore()
  // il tempo della scena riparte a ogni scena nuova (e fra la pausa e il riferimento), non a ogni secondo del conto alla rovescia
  const progresso = (i, n, nome) => {
    const chiave = `${i}|${String(nome).replace(/\d+ s$/, '')}`
    if (chiave !== chiaveScena) { chiaveScena = chiave; inizioScena = performance.now(); secondi.value = 0 }
    avanza.value = { i, n, nome }
  }
  try {
    if (che === 'veri') {
      const { eseguiVeri } = await import('../../grafica/benchmark/veri.js')
      // chi pesa (docs/core/vecchio-telefono-elementi.md) non ha più un tasto: solo dal computer, con `window.__benchmarkSolo`
      const solo = window.__benchmarkSolo || null
      // a ogni scena il log fin lì diventa «l'ultima»: se il telefono si pianta, alla riapertura c'è quello che è stato misurato
      const m = await meta()
      const parziale = d => { salvaMisura(che, componiVeri(d, m)).catch(() => {}) }
      const dati = await eseguiVeri({ contenitore: palco.value, corto: !!window.__benchmarkCorto, solo, fascia: fasciaAttiva(), completa: lunga,
        ...(window.__benchmarkRaffredda != null ? { raffredda: window.__benchmarkRaffredda } : {}),
        progresso, fermo: () => fermare, parziale })
      window.__benchmarkVeri = dati
      log.value = componiVeri(dati, await meta())
    } else {
      const { eseguiProve } = await import('../../grafica/benchmark/prove.js')
      const dati = await eseguiProve({ canvas: tela.value, corto: !!window.__benchmarkCorto, solo: window.__benchmarkSolo || null, progresso, fermo: () => fermare })
      window.__benchmarkFluidita = dati
      log.value = componi(dati, await meta())
    }
    stato.value = 'fatto'
    mandaAuto()
    salvaMisura(che, log.value).then(async () => { ultime.value = await ultimeMisure() }).catch(() => {})
  } catch (e) {
    log.value = ''; esito.value = 'Non è partita: ' + (e && e.message || e); stato.value = 'guasto'
  } finally { spegniLettore() }
}
function rivedi(che) { modo.value = che; log.value = ultime.value[che].log; note.value = ''; esito.value = ''; stato.value = 'fatto'; sonda() }
function interrompi() { fermare = true }
function chiudi() { fermare = true; emit('chiudi') }
onBeforeUnmount(() => { fermare = true })

// il log con le note, e i pezzi che stanno nel campo del modulo
const finale = computed(() => conNote(log.value, note.value))
const parti = computed(() => spezza(finale.value))
const link = testo => `${props.modulo}?${new URLSearchParams({ versione: versione(), giudizi: testo })}`
const quando = q => new Date(q).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
// il computer di sviluppo in LAN (`node strumenti/ricevi-log.mjs`, docs/core/vecchio-telefono-veri.md): se la pagina è servita da lui il resoconto
// parte da solo a fine prova e c'è «Manda al computer» per rimandarlo con le note; altrimenti niente di tutto questo
const alComputer = ref(false)
async function sonda() { alComputer.value = await sondaRicevitore() }
async function mandaAlComputer() {
  const r = await mandaAlRicevitore({ testo: finale.value, quando: Date.now() })
  esito.value = r.ok ? `Mandato al computer (${r.file}).` : `Non è arrivato al computer: ${r.errore}.`
}
async function mandaAuto() {
  await sonda()
  if (alComputer.value) await mandaAlComputer()
}
async function copia() {
  try { await navigator.clipboard.writeText(finale.value); esito.value = 'Copiato negli appunti.' } catch (e) { esito.value = 'Non si riesce a copiare: tieni premuto sul testo.' }
}
</script>

<template>
  <div class="bench" data-benchmark>
    <canvas ref="tela" class="tela" :class="{ vista: stato === 'corre' && modo === 'sintetico' }"></canvas>
    <div ref="palco" class="palco" :class="{ vista: stato === 'corre' && modo !== 'sintetico' }" data-benchmark-palco></div>
    <button class="chiudi" type="button" aria-label="chiudi" data-azione="benchmark-chiudi" @click="chiudi">✕</button>
    <div v-if="stato === 'corre'" class="lettore" data-benchmark-lettore>
      <span class="pasti" :class="fps >= 50 ? 'ok' : fps >= 28 ? 'medio' : 'male'">{{ fps }} fps · {{ secondi }} s in questa scena</span>
      <span v-if="muto" class="pasti male" data-benchmark-muto>il telefono non risponde</span>
      <span v-else :key="battito" class="pasti male muto">il telefono non risponde</span>
    </div>
    <div v-if="stato === 'pronto'" class="carta">
      <h2>Misura questo telefono</h2>
      <p>Per circa un minuto lo schermo mostra scene di prova (pixel, sfumature, esplosioni, triangoli, ombre) a qualità diverse.
        Alla fine c'è un resoconto che dice cosa lo fa andare a scatti e che si può mandare.</p>
      <p>Tieni lo schermo acceso e non toccare niente.</p>
      <button type="button" class="bottone" data-azione="benchmark-avvia" @click="avvia('sintetico')">Avvia la misura</button>
      <h3>Con i modelli veri del gioco</h3>
      <p>23 scene, circa 5 minuti: il primo attacco in un piano col riscaldamento acceso e spento; la scala, cioè lo scontro con 3 mostri
        costruito un pezzo alla volta (prima niente, poi pavimento e pareti con una luce fissa, poi colonne, rilievo, torcia, fuochi, nebbia,
        mostri, particelle, effetti, ombra); lo scontro com'è con 1, 2, 3, 4 e 6 mostri; il mondo di sopra con 8 persone e 8 mostri; lo zaino. Il resoconto dice quanto
        aggiunge ogni gradino della scala e quali sono i più cari. Ogni scena si salva appena misurata: se il telefono si pianta, riapri questa
        pagina e «L'ultima coi modelli veri» ha le scene fatte fin lì.</p>
      <p><b>Guarda lo schermo</b>: se un colore, una luce o la nebbia ti sembrano strani, alla fine scrivilo nelle note.
        Tieni il telefono acceso e in carica se puoi: lo schermo non deve spegnersi.</p>
      <button type="button" class="bottone" data-azione="benchmark-veri" @click="avvia('veri')">Avvia coi modelli veri</button>
      <h3>Misure complete</h3>
      <p>Un quarto d'ora circa (con pause a schermo nero perché il telefono non si scaldi): le serie lunghe, cioè sempre più mostri, persone, edifici,
        triangoli, chiamate, luci e pixel, la roba, e la stessa scena con una cosa tolta alla volta, per sapere cosa la rallenta.</p>
      <button type="button" class="bottone" data-azione="benchmark-veri-lunga" @click="avvia('veri', true)">Misure complete (lunga)</button>
      <p v-if="ultime.sintetico || ultime.veri" class="riga">
        <button v-if="ultime.sintetico" type="button" class="bottone chiaro" data-azione="benchmark-ultima" data-tipo="sintetico" @click="rivedi('sintetico')">L'ultima a scene ({{ quando(ultime.sintetico.quando) }})</button>
        <button v-if="ultime.veri" type="button" class="bottone chiaro" data-azione="benchmark-ultima" data-tipo="veri" @click="rivedi('veri')">L'ultima coi modelli veri ({{ quando(ultime.veri.quando) }})</button>
      </p>
    </div>
    <div v-else-if="stato === 'corre'" class="carta piccola" data-benchmark-corre>
      <div class="corre">
        <span><b>scena {{ avanza.i + 1 }} di {{ avanza.n }}</b> · {{ avanza.nome }}<br>
          <small data-benchmark-secondi>sono {{ secondi }} s in questa scena · {{ fps }} fps<template v-if="muto"> · il telefono non risponde</template></small></span>
        <button type="button" class="bottone mini" data-azione="benchmark-interrompi" @click="interrompi">Interrompi</button>
      </div>
      <div class="barra"><i :style="{ width: (100 * avanza.i / avanza.n) + '%' }"></i></div>
    </div>
    <div v-else class="carta" data-benchmark-fine>
      <h2>{{ stato === 'fatto' ? 'Misura finita' : 'Qualcosa non va' }}</h2>
      <template v-if="stato === 'fatto'">
        <textarea readonly class="testo" data-benchmark-log :value="log" rows="14"></textarea>
        <label v-if="modo !== 'sintetico'" class="note">Note (facoltative): luci, colori, nebbia strani? cosa hai visto?
          <textarea v-model="note" class="testo" rows="3" data-benchmark-note></textarea>
        </label>
        <div class="riga">
          <a v-for="(p, k) in parti" :key="k" class="bottone" data-azione="benchmark-manda" :data-parte="k + 1"
             :href="link(p)" target="_blank" rel="noopener">{{ parti.length > 1 ? `Manda ${k + 1}/${parti.length}` : 'Manda' }}</a>
          <button v-if="alComputer" type="button" class="bottone" data-azione="benchmark-al-computer" @click="mandaAlComputer">Manda al computer</button>
          <button type="button" class="bottone" data-azione="benchmark-copia" @click="copia">Copia</button>
          <button type="button" class="bottone" data-azione="benchmark-ripeti" @click="avvia()">Rifai</button>
        </div>
        <p v-if="parti.length > 1" class="esito">Il resoconto è lungo: va mandato in {{ parti.length }} invii, uno per tasto.</p>
      </template>
      <p v-if="esito" class="esito">{{ esito }}</p>
    </div>
  </div>
</template>

<style scoped>
.bench { position: fixed; inset: 0; z-index: 99990; background: #0c101e; color: #eef; display: flex; align-items: center; justify-content: center; padding: 16px; overflow: auto }
.tela { position: fixed; inset: 0; width: 100vw; height: 100vh; opacity: 0; pointer-events: none }
.tela.vista { opacity: 1 }
.palco { position: fixed; inset: 0; visibility: hidden; pointer-events: none }
.palco.vista { visibility: visible }
.chiudi { position: fixed; top: 8px; right: 8px; z-index: 2; width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(255,255,255,.5); background: rgba(10,14,28,.85); color: #fff; font-size: 18px; cursor: pointer }
.carta { position: relative; z-index: 1; max-width: 520px; width: 100%; background: rgba(20, 26, 48, .94); border: 1px solid rgba(255,255,255,.25); border-radius: 16px; padding: 16px; line-height: 1.4; margin: auto 0 }
.carta.piccola { position: fixed; bottom: 16px; left: 16px; right: 16px; width: auto; max-width: none; padding: 10px 14px; font-size: 14px }
h2 { margin: 0 0 8px; font-size: 20px }
h3 { margin: 18px 0 6px; font-size: 17px }
.corre { display: flex; align-items: center; justify-content: space-between; gap: 8px }
.barra { height: 6px; border-radius: 3px; background: rgba(255,255,255,.2); margin-top: 6px; overflow: hidden }
.barra i { display: block; height: 100%; background: #6fe08a }
.testo { width: 100%; box-sizing: border-box; font: 11px/1.35 "Emoji Gioco", ui-monospace, monospace; background: #080b16; color: #dfe6ff; border: 1px solid rgba(255,255,255,.25); border-radius: 8px; padding: 8px; resize: none }
.note { display: block; margin-top: 10px; font-size: 14px }
.note .testo { margin-top: 4px; font-size: 13px; resize: vertical }
.riga { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap }
.bottone { display: inline-block; font: inherit; font-weight: 700; padding: 10px 16px; border-radius: 12px; border: 0; background: #3b82f6; color: #fff; text-decoration: none; cursor: pointer }
.bottone.chiaro { background: rgba(255,255,255,.14); font-weight: 600 }
.bottone.mini { padding: 6px 12px; font-size: 13px; background: #b4462f }
.esito { margin: 8px 0 0; font-size: 14px }
.lettore { position: fixed; top: calc(env(safe-area-inset-top, 0px) + 6px); left: 6px; z-index: 3; display: flex; flex-direction: column; gap: 4px; pointer-events: none;
  font: 700 12px/1.3 "Emoji Gioco", ui-monospace, monospace }
.pasti { align-self: flex-start; background: rgba(10, 14, 28, .85); border: 1px solid rgba(255, 255, 255, .5); border-radius: 999px; padding: 3px 9px; color: #fff }
.pasti.ok { border-color: #6fe08a } .pasti.medio { border-color: #ffd45a } .pasti.male { border-color: #ff6b6b }
/* se la pagina si ferma, il battito non la rinnova e dopo 5 s compare da sola (l'opacità la anima il compositore, non il JS) */
.pasti.muto { opacity: 0; animation: muto 0.2s linear 5s forwards }
@keyframes muto { to { opacity: 1 } }
</style>
