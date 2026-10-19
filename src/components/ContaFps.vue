<script setup>
/* Il contafotogrammi (docs/core/vecchio-telefono.md): una pastiglia in un angolo, solo se i grandi l'hanno acceso.
   Un tocco avvia una misura, un secondo tocco la chiude e la tiene (con il pixel ratio e le chiamate del gioco 3D);
   il «▾» apre le ultime misure. Non tocca i giochi: legge i fotogrammi con un suo requestAnimationFrame. */
import { ref, watch, onBeforeUnmount } from 'vue'
import { fpsAcceso, misure, aggiungiMisura, dimenticaMisure, riassumi } from '../store/fps.js'

const props = defineProps({ vista: { type: String, default: '' } })
const ora = ref(0)          // fps nell'ultimo mezzo secondo
const registra = ref(false)
const aperto = ref(false)
let raf = 0, ultimo = 0, finestra = [], corsa = [], inizio = 0, ultimoAgg = 0

function giro(t) {
  if (ultimo) {
    const d = t - ultimo
    if (d < 1000) {   // un telefono posato o una scheda in secondo piano non è un fotogramma lento
      finestra.push(d); if (registra.value) corsa.push(d)
    }
  }
  ultimo = t
  if (t - ultimoAgg > 500 && finestra.length) {
    ora.value = Math.round(1000 * finestra.length / finestra.reduce((a, b) => a + b, 0))
    finestra = []; ultimoAgg = t
  }
  raf = requestAnimationFrame(giro)
}
const ferma = () => { cancelAnimationFrame(raf); raf = 0; ultimo = 0; finestra = []; ora.value = 0 }
watch(fpsAcceso, si => { if (si && !raf) raf = requestAnimationFrame(giro); if (!si) { ferma(); registra.value = false } },
  { immediate: true })
onBeforeUnmount(ferma)

const grafica = () => {
  try { return (window.__sotterraneo3d?.grafica || window.__mate?.grafica)?.() || null } catch (e) { return null }
}
function tocca() {
  if (!registra.value) { corsa = []; inizio = Date.now(); registra.value = true; aperto.value = false; return }
  registra.value = false
  const r = riassumi(corsa)
  if (!r) return
  const g = grafica()
  aggiungiMisura({ ...r, vista: props.vista, quando: inizio,
    dpr: g?.dpr != null ? Math.round(g.dpr * 100) / 100 : null, chiamate: g?.chiamate ?? null, tri: g?.triangoli ?? null })
  aperto.value = true
}
const ora2 = q => new Date(q).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
const classe = f => f >= 50 ? 'ok' : f >= 28 ? 'medio' : 'male'
</script>

<template>
  <div v-if="fpsAcceso" class="contafps" data-fps>
    <div class="riga">
      <button type="button" class="pasti" :class="[classe(ora), { rec: registra }]" data-azione="fps-misura"
              @click="tocca">{{ registra ? '● ' + corsa.length : '' }} {{ ora }} fps{{ registra ? ' — tocca per chiudere' : '' }}</button>
      <button v-if="misure.length" type="button" class="pasti" data-azione="fps-elenco" aria-label="ultime misure"
              @click="aperto = !aperto">{{ aperto ? '▴' : '▾' }}</button>
    </div>
    <div v-if="aperto && misure.length" class="elenco" data-fps-elenco>
      <p v-for="(m, i) in misure" :key="m.quando" :class="classe(m.fps)">
        <b>{{ i === 0 ? 'ultima' : ora2(m.quando) }}</b> {{ m.vista || '—' }} · {{ m.fps }} fps · p95 {{ m.p95 }} ms ·
        &gt;33 ms {{ m.l33 }}/{{ m.n }} · {{ m.s }} s<template v-if="m.dpr"> · dpr {{ m.dpr }}</template><template
          v-if="m.chiamate"> · {{ m.chiamate }} chiamate, {{ m.tri }} tri</template>
      </p>
      <button type="button" class="pasti" data-azione="fps-svuota" @click="dimenticaMisure(); aperto = false">svuota</button>
    </div>
  </div>
</template>

<style scoped>
.contafps { position: fixed; top: calc(env(safe-area-inset-top, 0px) + 4px); left: 4px; z-index: 99999; max-width: calc(100vw - 8px);
  font: 700 12px/1.3 "Emoji Gioco", ui-monospace, monospace; color: #fff; pointer-events: none }
.riga { display: flex; gap: 4px }
.pasti { pointer-events: auto; font: inherit; color: inherit; background: rgba(10, 14, 28, .82); border: 1px solid rgba(255, 255, 255, .5);
  border-radius: 999px; padding: 3px 9px; cursor: pointer; touch-action: manipulation }
.pasti.ok { border-color: #6fe08a } .pasti.medio { border-color: #ffd45a } .pasti.male { border-color: #ff6b6b }
.pasti.rec { background: rgba(150, 20, 20, .85) }
.elenco { pointer-events: auto; margin-top: 4px; padding: 6px 8px; border-radius: 10px; background: rgba(10, 14, 28, .88);
  border: 1px solid rgba(255, 255, 255, .35); font-weight: 600 }
.elenco p { margin: 0 0 4px; border-left: 3px solid; padding-left: 6px }
.elenco p.ok { border-color: #6fe08a } .elenco p.medio { border-color: #ffd45a } .elenco p.male { border-color: #ff6b6b }
</style>
