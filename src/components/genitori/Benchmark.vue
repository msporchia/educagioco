<script setup>
/* La misura del telefono (docs/core/vecchio-telefono.md): un foglio a tutto schermo che fa girare le scene di
   `grafica/benchmark/prove.js` a qualità diverse e compone un log da mandare dal modulo (o da copiare).
   three si carica solo qui, premendo «Avvia». La ✕ in alto a destra chiude, e durante la misura la ferma. */
import { ref, onBeforeUnmount } from 'vue'
import { componi } from '../../grafica/benchmark/log.js'

const props = defineProps({ modulo: { type: String, required: true } })
const emit = defineEmits(['chiudi'])

const stato = ref('pronto')            // pronto | corre | fatto | guasto
const avanza = ref({ i: 0, n: 1, nome: '' })
const log = ref('')
const esito = ref('')
const tela = ref(null)
let fermare = false

async function avvia() {
  stato.value = 'corre'; fermare = false; esito.value = ''
  try {
    const { eseguiProve } = await import('../../grafica/benchmark/prove.js')
    const dati = await eseguiProve({ canvas: tela.value, corto: !!window.__benchmarkCorto, solo: window.__benchmarkSolo || null,
      progresso: (i, n, nome) => { avanza.value = { i, n, nome } }, fermo: () => fermare })
    window.__benchmarkFluidita = dati
    log.value = componi(dati, { versione: typeof __VERSIONE__ !== 'undefined' ? __VERSIONE__.id : '', ua: navigator.userAgent,
      cpu: navigator.hardwareConcurrency, memoria: navigator.deviceMemory })
    stato.value = 'fatto'
  } catch (e) {
    log.value = ''; esito.value = 'Non è partita: ' + (e && e.message || e); stato.value = 'guasto'
  }
}
function chiudi() { fermare = true; emit('chiudi') }
onBeforeUnmount(() => { fermare = true })

const link = () => `${props.modulo}?${new URLSearchParams({ versione: typeof __VERSIONE__ !== 'undefined' ? __VERSIONE__.id : '', giudizi: log.value })}`
async function copia() {
  try { await navigator.clipboard.writeText(log.value); esito.value = 'Copiato negli appunti.' } catch (e) { esito.value = 'Non si riesce a copiare: tieni premuto sul testo.' }
}
</script>

<template>
  <div class="bench" data-benchmark>
    <canvas ref="tela" class="tela" :class="{ vista: stato === 'corre' }"></canvas>
    <button class="chiudi" type="button" aria-label="chiudi" data-azione="benchmark-chiudi" @click="chiudi">✕</button>
    <div v-if="stato === 'pronto'" class="carta">
      <h2>Misura questo telefono</h2>
      <p>Per circa un minuto lo schermo mostra scene di prova (pixel, sfumature, esplosioni, triangoli, ombre) a qualità diverse.
        Alla fine c'è un resoconto che dice cosa lo fa andare a scatti e che si può mandare.</p>
      <p>Tieni lo schermo acceso e non toccare niente.</p>
      <button type="button" class="bottone" data-azione="benchmark-avvia" @click="avvia">Avvia la misura</button>
    </div>
    <div v-else-if="stato === 'corre'" class="carta piccola" data-benchmark-corre>
      <b>{{ avanza.i + 1 }} / {{ avanza.n }}</b> {{ avanza.nome }}
      <div class="barra"><i :style="{ width: (100 * avanza.i / avanza.n) + '%' }"></i></div>
    </div>
    <div v-else class="carta" data-benchmark-fine>
      <h2>{{ stato === 'fatto' ? 'Misura finita' : 'Qualcosa non va' }}</h2>
      <template v-if="stato === 'fatto'">
        <textarea readonly class="testo" data-benchmark-log :value="log" rows="14"></textarea>
        <div class="riga">
          <a class="bottone" data-azione="benchmark-manda" :href="link()" target="_blank" rel="noopener">Manda</a>
          <button type="button" class="bottone" data-azione="benchmark-copia" @click="copia">Copia</button>
          <button type="button" class="bottone" data-azione="benchmark-ripeti" @click="avvia">Rifai</button>
        </div>
      </template>
      <p v-if="esito" class="esito">{{ esito }}</p>
    </div>
  </div>
</template>

<style scoped>
.bench { position: fixed; inset: 0; z-index: 99990; background: #0c101e; color: #eef; display: flex; align-items: center; justify-content: center; padding: 16px; overflow: auto }
.tela { position: fixed; inset: 0; width: 100vw; height: 100vh; opacity: 0; pointer-events: none }
.tela.vista { opacity: 1 }
.chiudi { position: fixed; top: 8px; right: 8px; z-index: 2; width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(255,255,255,.5); background: rgba(10,14,28,.85); color: #fff; font-size: 18px; cursor: pointer }
.carta { position: relative; z-index: 1; max-width: 520px; width: 100%; background: rgba(20, 26, 48, .94); border: 1px solid rgba(255,255,255,.25); border-radius: 16px; padding: 16px; line-height: 1.4 }
.carta.piccola { position: fixed; bottom: 16px; left: 16px; right: 16px; width: auto; max-width: none; padding: 10px 14px; font-size: 14px }
h2 { margin: 0 0 8px; font-size: 20px }
.barra { height: 6px; border-radius: 3px; background: rgba(255,255,255,.2); margin-top: 6px; overflow: hidden }
.barra i { display: block; height: 100%; background: #6fe08a }
.testo { width: 100%; box-sizing: border-box; font: 11px/1.35 "Emoji Gioco", ui-monospace, monospace; background: #080b16; color: #dfe6ff; border: 1px solid rgba(255,255,255,.25); border-radius: 8px; padding: 8px; resize: none }
.riga { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap }
.bottone { display: inline-block; font: inherit; font-weight: 700; padding: 10px 16px; border-radius: 12px; border: 0; background: #3b82f6; color: #fff; text-decoration: none; cursor: pointer }
.esito { margin: 8px 0 0; font-size: 14px }
</style>
