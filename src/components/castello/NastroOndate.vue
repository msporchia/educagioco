<script setup>
// Il preavviso: le prossime tre ondate, con le emoji delle torri a cui il
// mostro è immune (sbarrate, non colorate: il segno dice «non questa»).
// Sta in cima al campo solo fra un'ondata e l'altra. Nelle miste (`con`)
// due facce con le loro immunità, non fuse (fuse direbbero «tutte
// sbarrate»). Vedi docs/castello/mostri.md.
import { TORRI } from '../../data/ops.js'
import { ABILITA } from '../../data/mostri.js'
import RitrattoMostro from './RitrattoMostro.vue'

const FRECCE = { sinistra: '↙', destra: '↘', ambo: '↙↘' }

defineProps({
  prossime: { type: Array, default: () => [] },  // [{ onda, fra, id, nome, quanti, immune, abilita, capo, con? }]
})

// la frase del titolo, per chi ci tiene il dito sopra o non vede le emoji
function frase(p) {
  if (p.con) return `${p.nome} e ${p.con.nome} insieme: ` + [p, p.con].map(delTipo).join(' — ')
  return delTipo(p)
}
function delTipo(p) {
  const parti = [p.capo ? `${p.nome} gigante: il capo` : p.nome]
  if (p.immune && p.immune.length)
    parti.push('immune a ' + p.immune.map(k => TORRI[k].nome.toLowerCase()).join(' e '))
  if (p.abilita) parti.push(ABILITA[p.abilita].che)
  return parti.join(' · ')
}
const facce = p => (p.con ? [p, p.con] : [p])
</script>

<template>
  <div v-if="prossime.length" class="preavviso">
    <span class="titolo">In arrivo</span>
    <div v-for="p in prossime" :key="p.onda" class="avviso"
         :class="{ subito: p.fra === 1, capo: p.capo, mista: p.con }" :title="frase(p)"
         :data-onda-preavviso="p.onda" :data-immune="(p.immune || []).join(',')"
         :data-mista="p.con ? p.con.id : null"
         :data-immune-con="p.con ? p.con.immune.join(',') : null"
         :data-abilita="p.abilita || null" :data-capo="p.capo ? '' : null">
      <span v-for="f in facce(p)" :key="f.id" class="faccia">
        <RitrattoMostro :bestia="f.id" />
        <span v-if="f.immune && f.immune.length" class="immuni">
          <span v-for="k in f.immune" :key="k" class="punto">{{ TORRI[k].emoji }}</span>
        </span>
        <span v-if="f.abilita" class="abilita">{{ ABILITA[f.abilita].emoji }}</span>
        <span v-if="p.capo" class="corona">👑</span>
      </span>
      <span class="dati">
        <b>{{ p.capo ? 'Capo!' : p.con ? 'Misti!' : p.nome }}</b>
        <i>🌊{{ p.onda }} · ×{{ p.quanti }}<template v-if="p.lato"> ·
          <em :class="p.lato">{{ FRECCE[p.lato] }}</em></template></i>
      </span>
    </div>
  </div>
</template>

<style scoped src="./nastro.css"></style>
