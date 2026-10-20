<script setup>
// Il pannello ⚙: i preset di qualità, gli interruttori che pesano, le prove di stress e le statistiche vive (fps, fotogramma peggiore,
// draw call…), per capire se la fattoria gira bene su questo telefono. «▾» lo riduce alle sole statistiche e si gioca sotto.
import { ref, computed } from 'vue'
import { PRESET, SCALE, OMBRE, DISTANZA } from '../dati/qualita.js'

const props = defineProps({
  q: { type: Object, required: true },           // le opzioni (reattive)
  stat: { type: Object, required: true },        // le statistiche (le aggiorna chi lo usa)
  conta: { type: Object, default: () => ({ cose: 0, prove: 0 }) },
  rapporto: { type: String, default: '' },
})
const emit = defineEmits(['cambia', 'stress', 'chiudi', 'ridotto', 'rapporto'])
const ridotto = ref(false)
const mostraRapporto = ref(false)
function riduci() { ridotto.value = !ridotto.value; emit('ridotto', ridotto.value) }
function preset(nome) { Object.assign(props.q, PRESET[nome], { preset: nome }); emit('cambia') }
function tocca(chiave, valore) {
  props.q[chiave] = valore
  if (!(chiave === 'camera')) props.q.preset = Object.keys(PRESET).find(n => Object.keys(PRESET.medio).every(k => PRESET[n][k] === props.q[k])) || 'personale'
  emit('cambia')
}
const interruttori = [['ombre', 'Ombre'], ['vento', "Vento: grano ed erba ondeggiano"], ['particelle', 'Scintille e fumo'], ['alberi', 'Alberi'],
                      ['erba', "Ciuffi d'erba nei prati"], ['nebbia', 'Nebbia in lontananza']]
const grafico = computed(() => (props.stat.grafico || []).map(ms => ({ h: Math.min(100, ms * 2), c: ms > 33 ? '#d8452a' : ms > 18 ? '#e6a030' : '#5fae3a' })))
</script>

<template>
  <div class="f3-foglio f3-opzioni" :class="{ ridotto }" data-f3="opzioni">
    <h2>Opzioni e prove</h2>
    <button class="f3-riduci" aria-label="riduci" @click="riduci">{{ ridotto ? '▴' : '▾' }}</button>
    <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <div class="f3-stat">
      <b>{{ stat.fps.toFixed(0) }}</b> fps · fotogramma peggiore <b>{{ stat.peggiore.toFixed(0) }}</b> ms (1%: {{ stat.p1.toFixed(0) }}) · lavoro JS <b>{{ stat.cpu.toFixed(1) }}</b> ms<br>
      {{ stat.calls }} draw call · {{ (stat.triangoli / 1000).toFixed(0) }}k triangoli · {{ stat.geometrie }} geometrie · {{ stat.texture }} texture · {{ (stat.dpr || 1).toFixed(2) }} px/px
    </div>
    <div class="f3-grafico"><u v-for="(g, i) in grafico" :key="i" :style="{ height: g.h + '%', background: g.c }"></u></div>
    <template v-if="!ridotto">
      <h3>Qualità</h3>
      <div class="f3-preset">
        <button v-for="n in Object.keys(PRESET)" :key="n" :class="{ acceso: q.preset === n }" :data-preset="n" @click="preset(n)">{{ n[0].toUpperCase() + n.slice(1) }}</button>
      </div>
      <label class="f3-riga"><span>Risoluzione</span>
        <select :value="q.scala" @change="tocca('scala', Number($event.target.value))"><option v-for="[v, t] in SCALE" :key="v" :value="v">{{ t }}</option></select></label>
      <label class="f3-riga"><span>Qualità delle ombre</span>
        <select :value="q.ombraRes" @change="tocca('ombraRes', Number($event.target.value))"><option v-for="[v, t] in OMBRE" :key="v" :value="v">{{ t }}</option></select></label>
      <label v-for="[k, nome] in interruttori" :key="k" class="f3-riga"><span>{{ nome }}</span>
        <input type="checkbox" :checked="q[k]" @change="tocca(k, $event.target.checked)"></label>
      <p class="f3-nota">«Basso» tiene spenti ombre, vento e scintille per risparmiare il telefono; i ciuffi restano accesi (costano un disegno l'uno).</p>
      <label class="f3-riga"><span>Distanza della telecamera <b>{{ q.camera }}</b></span>
        <input type="range" :min="DISTANZA.min" :max="DISTANZA.max" step="1" :value="q.camera" @input="tocca('camera', Number($event.target.value))"></label>
      <h3>Prova di stress</h3>
      <div class="f3-preset">
        <button @click="$emit('stress', 'campo', 10)">+10 campi</button>
        <button @click="$emit('stress', 'recinto', 3)">+3 recinti</button>
        <button @click="$emit('stress', null, 0)">Tutto via</button>
      </div>
      <p class="f3-nota">In scena: {{ conta.cose }} cose di cui {{ conta.prove }} di prova (non si salvano).</p>
      <h3>Rapporto</h3>
      <button class="f3-largo" @click="mostraRapporto = true; $emit('rapporto')">Mostra il rapporto da incollare</button>
      <textarea v-if="mostraRapporto" class="f3-rapporto" readonly rows="9" :value="rapporto" @focus="$event.target.select()"></textarea>
    </template>
  </div>
</template>
