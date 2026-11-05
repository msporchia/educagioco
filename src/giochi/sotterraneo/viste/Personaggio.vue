<script setup>
// L'editor del personaggio (docs/sotterraneo/personaggio.md) sopra l'interfaccia unica (components/personalizza/Personalizza.vue,
// docs/core/personalizza.md), col tema del sotterraneo. Tre schede: Chi sei (le due varianti dell'eroe), Aspetto (pelle; capelli: taglio,
// poi colore; barba) e Set (i set salvati di questo eroe). Qui tutto è gratis: ogni scelta si scrive subito nell'avventura.
// Le foto dei gettoni sono l'eroe disegnato dal vivo con quella scelta (Armato: il busto per l'aspetto, la figura per chi sei e i set).
import { ref, computed } from 'vue'
import { VARIANTI, SESSI, spriteConAspetto } from '../dati/eroi.js'
import { PELLI, COLORI_CAPELLI, TAGLI, BARBE } from '../../../grafica/persona/aspetto.js'
import Personalizza from '../../../components/personalizza/Personalizza.vue'
import Armato from './Armato.vue'
import { valoriDellAspetto, aspettoDeiValori } from './personaggio-valori.js'

const props = defineProps({
  // la scheda di Gioco.vue (`avventure`): chiave, la roba addosso (mano, mancina, corpo, testa), il sesso e l'aspetto scelti, i set salvati
  eroe: { type: Object, required: true },
  sesso: { type: String, required: true },
  aspetto: { type: Object, default: () => ({ pelle: null, capelli: null, taglio: null, barba: null }) },
  vestiti: { type: Array, default: () => [] },     // [{ posto, nome, sesso, aspetto }] (motore/avventure.js)
})
const emit = defineEmits(['scegli', 'aspetto', 'salva-set', 'rinomina-set', 'togli-set', 'chiudi'])
const giro = ref(0)
const avviso = ref('')

// a schermo mai «sesso» (è per bambini): la scheda si chiama «Chi sei», coi nomi dei personaggi; `m`/`f` sono chiavi interne
const SCHEDE = [{ id: 'chi', nome: 'Chi sei', tipo: 'oggetti' }, { id: 'aspetto', nome: 'Aspetto', tipo: 'oggetti' }, { id: 'set', nome: 'Set', tipo: 'set' }]
const DI_SERIE = { id: '-', nome: 'Di serie' }
const voci = computed(() => [
  ...SESSI.map(x => ({ id: x, scheda: 'chi', posto: 'chi', nome: VARIANTI[props.eroe.chiave][x].nome, dati: { 'data-sesso': x } })),
  { id: 'pelle', scheda: 'aspetto', posto: 'pelle', nome: 'Pelle', tratto: true, dati: { 'data-voce': 'pelle' },
    colori: [{ ...DI_SERIE, css: null, dati: { 'data-pelle': '-' } }, ...PELLI.map(p => ({ id: p.id, nome: p.nome, css: p.css, dati: { 'data-pelle': p.id } }))] },
  // il colore vale anche da calvo: colora la barba e le sopracciglia
  { id: 'capelli', scheda: 'aspetto', posto: 'capelli', nome: 'Capelli', tratto: true, nomeForme: 'Taglio', nomeColori: 'Colore', dati: { 'data-voce': 'capelli' },
    forme: [DI_SERIE, ...TAGLI].map(t => ({ id: t.id, nome: t.nome, dati: { 'data-taglio': t.id } })),
    colori: [{ ...DI_SERIE, css: null, dati: { 'data-capelli': '-' } }, ...COLORI_CAPELLI.map(c => ({ id: c.id, nome: c.nome, css: c.css, dati: { 'data-capelli': c.id } }))] },
  { id: 'barba', scheda: 'aspetto', posto: 'barba', nome: 'Barba', tratto: true, nomeForme: 'Barba', dati: { 'data-voce': 'barba' },
    forme: [DI_SERIE, ...BARBE].map(b => ({ id: b.id, nome: b.nome, dati: { 'data-barba': b.id } })) },
])
const indossato = computed(() => valoriDellAspetto(props.sesso, props.aspetto))
const mieiSet = computed(() => props.vestiti.map(v => ({ posto: v.posto, nome: v.nome, pezzi: valoriDellAspetto(v.sesso, v.aspetto) })))

// la scheda dell'eroe per un sesso e un aspetto (per Armato): il modello con l'aspetto nella chiave (`maga~ambra.rossi`)
const vedi = stato => {
  const { sesso, aspetto } = aspettoDeiValori(stato, props.sesso)
  const v = VARIANTI[props.eroe.chiave][sesso]
  return { ...props.eroe, ...v, sprite: spriteConAspetto(v.sprite, aspetto) }
}
const nomeChi = computed(() => VARIANTI[props.eroe.chiave][props.sesso].nome)

// gratis: ogni scelta arriva come `scegli` e si scrive subito
function scegli({ posto, oggetto, forma, colore }) {
  if (posto === 'chi') { emit('scegli', oggetto); return }
  emit('aspetto', aspettoDeiValori({ ...indossato.value, [posto]: { oggetto, forma, colore } }, props.sesso).aspetto)
}
function indossaSet({ pezzi, saltati }) {
  const { sesso, aspetto } = aspettoDeiValori({ ...indossato.value, ...pezzi }, props.sesso)
  if (sesso !== props.sesso) emit('scegli', sesso)
  emit('aspetto', aspetto)
  avviso.value = saltati ? `Indossato, tranne ${saltati}` : 'Indossato'
}
function salvaSet({ posto, nome }) { emit('salva-set', { posto, nome }); avviso.value = 'Salvato' }
const scala = { voce: 2.3, forma: 1.45, colore: 1.4, set: 2.3 }
</script>

<template>
  <Personalizza tema="sotterraneo" titolo="Come è il tuo eroe?" :chi="nomeChi" :schede="SCHEDE" :voci="voci" :indossato="indossato" :miei-set="mieiSet"
                v-model:giro="giro" :avviso="avviso" data-editor-personaggio :data-eroe-editor="eroe.chiave" :data-sesso-scelto="sesso"
                @scegli="scegli" @indossa-set="indossaSet" @salva-set="salvaSet" @rinomina-set="x => emit('rinomina-set', x)" @togli-set="x => emit('togli-set', x)"
                @chiudi="emit('chiudi')">
    <template #anteprima="{ stato }">
      <Armato :eroe="vedi(stato)" :mano="eroe.mano" :mancina="eroe.mancina" :corpo="eroe.corpo" :testa="eroe.testa" :tinte="eroe.tinte" :giro="giro" :scala="7" />
    </template>
    <!-- le foto: l'eroe con quella scelta, disegnato adesso (il busto per l'aspetto, la figura per chi sei e per i set) -->
    <template #foto="{ zona, voce, stato }">
      <Armato v-if="zona === 'set' || (voce && voce.posto === 'chi')" :eroe="vedi(stato)" :mano="eroe.mano" :mancina="eroe.mancina" :corpo="eroe.corpo" :testa="eroe.testa"
              :tinte="eroe.tinte" :scala="scala[zona] || 2.3" />
      <Armato v-else :eroe="vedi(stato)" modo="busto" :scala="scala[zona] || 2.3" />
    </template>
  </Personalizza>
</template>
