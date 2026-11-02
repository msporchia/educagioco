<script setup>
// L'editor del personaggio (docs/sotterraneo/personaggio.md): oggi si sceglie se l'eroe è maschio o femmina, gratis e sempre
// cambiabile. I due modelli stanno uno accanto all'altro con la roba che l'eroe ha addosso, e toccarne uno lo sceglie subito
// (niente «conferma»: si vede già com'è). Il sesso non cambia mai i numeri, solo chi si vede; qui è la casa delle prossime scelte.
import { VARIANTI, SESSI } from '../dati/eroi.js'
import Armato from './Armato.vue'

const props = defineProps({
  // la scheda di Gioco.vue (`avventure`): chiave, la roba addosso (mano, mancina, corpo, testa) e il sesso scelto
  eroe: { type: Object, required: true },
  sesso: { type: String, required: true },
  nuovo: { type: Boolean, default: false },     // la prima volta di quell'eroe: «Si parte» invece di «Fatto»
})
defineEmits(['scegli', 'chiudi'])

const vedi = x => ({ ...props.eroe, ...VARIANTI[props.eroe.chiave][x] })
</script>

<template>
  <div class="sot-velo" @click.self="$emit('chiudi')">
    <div class="sot-modale sot-personaggio" data-editor-personaggio :data-eroe-editor="eroe.chiave" :data-sesso-scelto="sesso">
      <h2><span class="em">✎</span> Come è il tuo eroe?</h2>
      <p>Cambia solo come lo vedi: la roba, la forza e le discese restano quelle che sono. Puoi ripensarci quando vuoi.</p>

      <div class="sot-sessi">
        <button v-for="x in SESSI" :key="x" type="button" class="sot-sesso" :class="{ 'sot-scelto': x === sesso }"
                :data-sesso="x" :aria-pressed="x === sesso" @click="$emit('scegli', x)">
          <Armato :eroe="vedi(x)" :mano="eroe.mano" :mancina="eroe.mancina" :corpo="eroe.corpo" :testa="eroe.testa" :scala="3" />
          <b>{{ VARIANTI[eroe.chiave][x].nome }}</b>
        </button>
      </div>

      <button class="sot-grosso" data-azione="chiudi-personaggio" @click="$emit('chiudi')">
        {{ nuovo ? 'Si parte' : 'Fatto' }}
      </button>
    </div>
  </div>
</template>
