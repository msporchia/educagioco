<script setup>
// La riga delle torce, nello zaino e nella pagina dell'eroe (docs/sotterraneo/roba.md, «La torcia si accende da sé»): quella
// che brucia con le stanze che restano, quelle alla cintura, e senza nessuna (solo con `sempre`) chi le vende
import Icona from './Icona.vue'

defineProps({
  torcia: { type: Object, default: null },   // { resta, quota (0..1), scorta, n } o null: le prepara `torceDi` in Gioco.vue
  sempre: { type: Boolean, default: false },  // anche senza torce: la pagina dell'eroe dice dove si comprano
})
const TORCIA = { chiave: 'torcia' }   // la torcia della riga è il suo modello (docs/sotterraneo/roba-3d.md)
const stanze = n => (n === 1 ? 'stanza' : 'stanze')
</script>

<template>
  <p v-if="torcia || sempre" class="sot-torcia-riga" :class="{ 'sot-torcia-niente': !torcia }"
     :data-torce="torcia ? torcia.n : 0" :data-resta="torcia ? torcia.resta : 0" :data-scorta="torcia ? torcia.scorta : 0">
    <Icona sprite="torcia" em="🔥" :emAlto="16" :cosa3d="TORCIA" :lato="30" />
    <i class="sot-lume"><u :style="{ height: (torcia ? torcia.quota : 0) * 100 + '%' }"></u></i>
    <template v-if="torcia && torcia.resta">
      <b>ancora {{ torcia.resta }} {{ stanze(torcia.resta) }}</b>
      <em v-if="torcia.scorta">
        e {{ torcia.scorta }} alla cintura: {{ torcia.scorta === 1 ? 'si accende' : 'si accendono' }} da sé
      </em>
      <em v-else>poi si spegne</em>
    </template>
    <template v-else-if="torcia">
      <b>{{ torcia.scorta === 1 ? 'una torcia' : `${torcia.scorta} torce` }} alla cintura</b>
      <em>scendendo se ne accende una da sé</em>
    </template>
    <template v-else>
      <b>nessuna torcia</b>
      <em>la guaritrice le vende, al villaggio</em>
    </template>
  </p>
</template>
