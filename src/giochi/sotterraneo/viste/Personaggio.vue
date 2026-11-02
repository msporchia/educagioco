<script setup>
// L'editor del personaggio (docs/sotterraneo/personaggio.md): l'interfaccia in comune con la fattoria (components/personalizza/Personalizza.vue)
// col tema del sotterraneo. In alto l'eroe grande, vestito con la roba che ha addosso e con quello che si sta scegliendo; sotto le schede
// (sesso, pelle, capelli, taglio, barba) e i gettoni. Toccare un gettone lo sceglie subito (si scrive nell'avventura, nessuna conferma),
// e toccare quello scelto lo toglie (torna quello di serie del modello). I toni sono quelli in comune (src/grafica/persona/aspetto.js).
import { ref, computed } from 'vue'
import { VARIANTI, SESSI, spriteConAspetto } from '../dati/eroi.js'
import { PELLI, COLORI_CAPELLI, TAGLI, BARBE } from '../../../grafica/persona/aspetto.js'
import Personalizza from '../../../components/personalizza/Personalizza.vue'
import Armato from './Armato.vue'

const props = defineProps({
  // la scheda di Gioco.vue (`avventure`): chiave, la roba addosso (mano, mancina, corpo, testa) e il sesso scelto
  eroe: { type: Object, required: true },
  sesso: { type: String, required: true },
  aspetto: { type: Object, default: () => ({ pelle: null, capelli: null, taglio: null, barba: null }) },   // gli id scelti (dati/eroi.js, aspettoValido)
})
const emit = defineEmits(['scegli', 'aspetto', 'chiudi'])

const scheda = ref('sesso')
// a schermo mai «sesso» (è per bambini): la prima scheda dice chi si è, coi nomi dei personaggi (Mago/Maga…); `sesso` è solo la chiave interna
const SCHEDE = [
  { id: 'sesso', nome: 'Chi sei' }, { id: 'pelle', nome: 'Pelle', emoji: '🖐️' }, { id: 'capelli', nome: 'Colore capelli', emoji: '🎨' },
  { id: 'taglio', nome: 'Taglio', emoji: '✂️' }, { id: 'barba', nome: 'Barba', emoji: '🧔' },
]
const vedi = (sesso, a = props.aspetto) => ({ ...props.eroe, ...VARIANTI[props.eroe.chiave][sesso], sprite: spriteConAspetto(VARIANTI[props.eroe.chiave][sesso].sprite, a) })
const grande = computed(() => vedi(props.sesso))

const voci = computed(() => {
  const a = props.aspetto, s = scheda.value
  if (s === 'sesso') return SESSI.map(x => ({ id: x, nome: VARIANTI[props.eroe.chiave][x].nome, sel: x === props.sesso, slot: true, dati: { 'data-sesso': x } }))
  if (s === 'pelle') return PELLI.map(p => ({ id: p.id, nome: p.nome, colore: p.css, sel: a.pelle === p.id, dati: { 'data-pelle': p.id } }))
  if (s === 'capelli') return COLORI_CAPELLI.map(c => ({ id: c.id, nome: c.nome, colore: c.css, sel: a.capelli === c.id, dati: { 'data-capelli': c.id } }))
  if (s === 'taglio') return TAGLI.map(t => ({ id: t.id, nome: t.nome, emoji: '✂️', sel: a.taglio === t.id, dati: { 'data-taglio': t.id } }))
  return BARBE.map(b => ({ id: b.id, nome: b.nome, emoji: '🧔', sel: a.barba === b.id, dati: { 'data-barba': b.id } }))
})
const RIGA = { sesso: 'Cambia solo come lo vedi: la roba, la forza e le discese restano quelle che sono.', pelle: 'Tocca ancora quella scelta per tornare a quella di prima.',
               capelli: 'Il colore dei capelli, della barba e delle trecce.', taglio: 'Un taglio di capelli. «Calvo» li toglie.', barba: 'Una barba. «Nessuna» la toglie.' }

function scegli(sch, v) {
  if (sch === 'sesso') emit('scegli', v.id)
  else emit('aspetto', sch, v.id)
}
</script>

<template>
  <Personalizza tema="sotterraneo" titolo="Come è il tuo eroe?" :schede="SCHEDE" :scheda="scheda" :voci="voci" :riga="RIGA[scheda]"
                data-editor-personaggio :data-eroe-editor="eroe.chiave" :data-sesso-scelto="sesso"
                @scheda="s => scheda = s" @scegli="scegli" @chiudi="$emit('chiudi')">
    <template #anteprima>
      <Armato :eroe="grande" :mano="eroe.mano" :mancina="eroe.mancina" :corpo="eroe.corpo" :testa="eroe.testa" :scala="7" />
    </template>
    <template #gettone="{ voce }">
      <span class="pz-campione foto"><Armato :eroe="vedi(voce.id)" :mano="eroe.mano" :mancina="eroe.mancina" :corpo="eroe.corpo" :testa="eroe.testa" :scala="2.2" /></span>
    </template>
    <template #fondo>
      <button class="sot-grosso" data-azione="chiudi-personaggio" style="margin-top: 8px" @click="$emit('chiudi')">Fatto</button>
    </template>
  </Personalizza>
</template>
