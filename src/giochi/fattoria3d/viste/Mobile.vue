<script setup>
// Il foglio di un mobile (docs/fattoria3d/casa.md) sopra l'interfaccia unica (components/personalizza/Personalizza.vue, docs/core/personalizza.md), tema fattoria.
// Si apre col tocco. La griglia ha i mobili della stessa stanza (si intonano senza richiudere), la forma è la trama, il colore è il colore: tutto gratis, quindi si mette subito.
// Nel fondo quello che non è un colore: ↻, 📦, e per l'armadio «👕 Apri l'armadio». Spostare è tenerlo premuto (scena3d/casa3d.js).
import { ref, computed } from 'vue'
import { MOBILI, COLORI, TRAME } from '../dati/interni.js'
import { campioneTrama } from './campione-trama.js'
import Personalizza from '../../../components/personalizza/Personalizza.vue'

const p = defineProps({
  casa: { type: Object, required: true },          // usaCasa() di casa.js
  foto: { type: Function, required: true },        // (tipo, colore, trama, giro?) → url o null; col giro è la foto grande
})
const c = p.casa
const { mobile, nellaStanza, messaggio, eArmadio } = c
const giro = ref(0)
const SCHEDE = [{ id: 'stanza', nome: 'In questa stanza', tipo: 'oggetti' }]
const coloreHex = o => (COLORI[MOBILI[o.tipo].tinte].find(x => x.id === o.colore) || COLORI[MOBILI[o.tipo].tinte][0]).c
const voci = computed(() => nellaStanza.value.map(o => {
  const v = MOBILI[o.tipo]
  return { id: o.id, scheda: 'stanza', posto: 'mobile', nome: v.nome, mobile: o, dati: { 'data-mobile': o.tipo },
    forme: v.trame ? TRAME.map(t => ({ id: t.id, nome: t.nome, foto: campioneTrama(coloreHex(o), t.id), dati: { 'data-trama': t.id } })) : [],
    colori: COLORI[v.tinte].map(x => ({ id: x.id, nome: x.nome, css: x.c, dati: { 'data-colore': x.id } })) }
}))
const indossato = computed(() => ({ mobile: { oggetto: mobile.value.id, forma: mobile.value.voce.trame ? mobile.value.trama : null, colore: mobile.value.colore } }))
/** Toccato un altro mobile della stanza si passa a lui; il colore e la trama sono di quello aperto. */
function scegli({ oggetto, forma, colore }) { if (oggetto !== mobile.value.id) c.apriMobile(oggetto); else c.tingi(colore, forma) }
</script>

<template>
  <Personalizza tema="fattoria" titolo="I mobili" :chi="mobile.voce.nome" :schede="SCHEDE" :voci="voci" :indossato="indossato" v-model:giro="giro" :avviso="messaggio"
                data-f3="mobile" :data-tipo="mobile.tipo" @scegli="scegli" @chiudi="c.chiudi()">
    <template #anteprima>
      <div class="f3-mob-ritratto"><img v-if="foto(mobile.tipo, mobile.colore, mobile.trama, giro)" :src="foto(mobile.tipo, mobile.colore, mobile.trama, giro)" :alt="mobile.voce.nome" draggable="false"></div>
    </template>
    <template #foto="{ voce }">
      <img v-if="voce && foto(voce.mobile.tipo, voce.mobile.colore, voce.mobile.trama)" class="f3-mob-foto" :src="foto(voce.mobile.tipo, voce.mobile.colore, voce.mobile.trama)" alt="" draggable="false">
    </template>
    <template #fondo>
      <button v-if="mobile.voce.strato !== 'muro'" type="button" class="prs-secondario" data-f3="mobile-gira" @click="c.giraMobile()">↻ Gira</button>
      <button v-if="eArmadio" type="button" class="prs-compra" data-f3="apri-armadio" @click="c.apriArmadio()">👕 Apri l'armadio</button>
      <template v-else>
        <button type="button" class="prs-secondario" data-f3="mobile-via" @click="c.mettiVia()">📦 Metti via</button>
        <span class="prs-muto">Tieni premuto un mobile per spostarlo.</span>
      </template>
    </template>
  </Personalizza>
</template>

<style>
.f3-mob-ritratto { position: absolute; inset: 0; }
.prs-fondo .prs-secondario { flex: none; white-space: nowrap; }
.f3-mob-ritratto img, .f3-mob-foto { width: 100%; height: 100%; object-fit: contain; pointer-events: none; -webkit-user-drag: none; }
</style>
