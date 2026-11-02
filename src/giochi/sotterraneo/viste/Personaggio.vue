<script setup>
// L'editor del personaggio (docs/sotterraneo/personaggio.md): oggi si sceglie se l'eroe è maschio o femmina, gratis e sempre
// cambiabile. I due modelli stanno uno accanto all'altro con la roba che l'eroe ha addosso, e toccarne uno lo sceglie subito
// (niente «conferma»: si vede già com'è). Sotto, la pelle e il colore dei capelli, gli stessi toni del contadino della fattoria
// (src/grafica/persona/aspetto.js): toccare quello scelto lo toglie (torna il colore di serie del modello). Il sesso e l'aspetto non
// cambiano mai i numeri, solo chi si vede; qui è la casa delle prossime scelte.
import { VARIANTI, SESSI, spriteConAspetto } from '../dati/eroi.js'
import { PELLI, COLORI_CAPELLI, TAGLI, BARBE } from '../../../grafica/persona/aspetto.js'
import Armato from './Armato.vue'

const props = defineProps({
  // la scheda di Gioco.vue (`avventure`): chiave, la roba addosso (mano, mancina, corpo, testa) e il sesso scelto
  eroe: { type: Object, required: true },
  sesso: { type: String, required: true },
  aspetto: { type: Object, default: () => ({ pelle: null, capelli: null, taglio: null, barba: null }) },   // gli id scelti (dati/eroi.js, aspettoValido)
})
defineEmits(['scegli', 'aspetto', 'chiudi'])

const vedi = x => ({ ...props.eroe, ...VARIANTI[props.eroe.chiave][x], sprite: spriteConAspetto(VARIANTI[props.eroe.chiave][x].sprite, props.aspetto) })
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

      <div class="sot-tinte" data-tinte="pelle">
        <small>Pelle</small>
        <button v-for="p in PELLI" :key="p.id" type="button" class="sot-tinta" :class="{ 'sot-scelto': aspetto.pelle === p.id }"
                :style="{ background: p.css }" :data-pelle="p.id" :aria-label="p.nome" :aria-pressed="aspetto.pelle === p.id"
                @click="$emit('aspetto', 'pelle', p.id)"></button>
      </div>
      <div class="sot-tinte" data-tinte="capelli">
        <small>Capelli</small>
        <button v-for="c in COLORI_CAPELLI" :key="c.id" type="button" class="sot-tinta" :class="{ 'sot-scelto': aspetto.capelli === c.id }"
                :style="{ background: c.css }" :data-capelli="c.id" :aria-label="c.nome" :aria-pressed="aspetto.capelli === c.id"
                @click="$emit('aspetto', 'capelli', c.id)"></button>
      </div>

      <div class="sot-tinte" data-tinte="taglio">
        <small>Taglio di capelli</small>
        <button v-for="t in TAGLI" :key="t.id" type="button" class="sot-scelta-breve" :class="{ 'sot-scelto': aspetto.taglio === t.id }"
                :data-taglio="t.id" :aria-pressed="aspetto.taglio === t.id" @click="$emit('aspetto', 'taglio', t.id)">{{ t.nome }}</button>
      </div>
      <div class="sot-tinte" data-tinte="barba">
        <small>Barba</small>
        <button v-for="b in BARBE" :key="b.id" type="button" class="sot-scelta-breve" :class="{ 'sot-scelto': aspetto.barba === b.id }"
                :data-barba="b.id" :aria-pressed="aspetto.barba === b.id" @click="$emit('aspetto', 'barba', b.id)">{{ b.nome }}</button>
      </div>

      <button class="sot-grosso" data-azione="chiudi-personaggio" @click="$emit('chiudi')">
        Fatto
      </button>
    </div>
  </div>
</template>
