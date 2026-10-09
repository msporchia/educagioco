<script setup>
/* Lo stendardo: chi arriva, appeso al bordo destro del campo dove ci sono
   solo alberi, sempre in vista. Un medaglione per ondata: il mostro, quanti
   e le torri a cui è immune, sbarrate. In battaglia il primo è chi è in
   campo; fra un'ondata e l'altra è chi parte col tasto. Le prossime tre si
   vedono sempre (più chi è in campo); la linguetta apre le altre. Toccato un medaglione si apre la scheda del
   mostro (SchedaGrande). Vedi docs/castello/mostri.md. */
import { ref, computed } from 'vue'
import { TORRI } from '../../data/ops.js'
import RitrattoMostro from './RitrattoMostro.vue'

const props = defineProps({
  // [{ onda, fra, id, nome, quanti, vita, immune, abilita, divisioni, capo, con?, lato? }]
  prossime: { type: Array, default: () => [] },
  inCampo: { type: Object, default: null },     // la stessa forma, per l'ondata in corso
})
const emit = defineEmits(['scegli'])

const PROSSIME = 3        // sempre in vista, oltre a chi è in campo
const aperto = ref(false)
const voci = computed(() => (props.inCampo ? [{ ...props.inCampo, ora: true }, ...props.prossime] : props.prossime))
const visibili = computed(() => PROSSIME + (props.inCampo ? 1 : 0))
const mostrate = computed(() => (aperto.value ? voci.value : voci.value.slice(0, visibili.value)))
const altre = computed(() => Math.max(0, voci.value.length - visibili.value))
const facce = p => (p.con ? [p, p.con] : [p])
const FRECCE = { sinistra: '↙', destra: '↘', ambo: '↙↘' }
</script>

<template>
  <div v-if="voci.length" class="stendardo" :class="{ aperto }" data-stendardo>
    <span class="asta"></span>
    <div class="telo">
      <button v-for="(p, k) in mostrate" :key="p.ora ? 'ora' : p.onda" class="medaglione"
              :class="{ ora: p.ora, subito: !p.ora && k === 0, capo: p.capo, mista: p.con }"
              :data-onda-preavviso="p.ora ? null : p.onda" :data-in-campo="p.ora ? '' : null"
              :data-immune="(p.immune || []).join(',')" :data-mista="p.con ? p.con.id : null"
              :data-immune-con="p.con ? p.con.immune.join(',') : null"
              :data-abilita="p.abilita || null" :data-divisioni="p.divisioni > 1 ? p.divisioni : null"
              :data-capo="p.capo ? '' : null"
              :aria-label="p.nome" @click="emit('scegli', p)">
        <span v-if="p.ora" class="cartiglio">in campo</span>
        <span v-else-if="p.capo" class="cartiglio">il capo</span>
        <span class="tondo">
          <span v-for="f in facce(p)" :key="f.id" class="faccia"><RitrattoMostro :bestia="f.id" /></span>
        </span>
        <span class="quanti">×{{ p.quanti }}<template v-if="p.lato"> {{ FRECCE[p.lato] }}</template></span>
        <span v-if="p.immune && p.immune.length" class="immuni">
          <span v-for="t in p.immune" :key="t" class="no">{{ TORRI[t].emoji }}</span>
        </span>
      </button>
    </div>
    <button v-if="altre" class="linguetta" data-azione="altre-ondate" @click="aperto = !aperto">
      {{ aperto ? '▴' : `+${altre} ▾` }}</button>
  </div>
</template>

<style scoped src="./stendardo.css"></style>
