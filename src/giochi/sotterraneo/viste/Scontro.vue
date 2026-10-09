<script setup>
// Il duello (docs/sotterraneo/abilita.md), alla Monkey Island: l'eroe e il mostro uno di fronte all'altro, grandi, che
// si fanno sotto a ogni scambio. Del mostro si vede solo la barra della vita, senza numeri: il brivido di non sapere
// quanto resiste (l'utente, 9 ottobre); quanto fai e quanto subisci lo dice la riga dello scambio. Non calcola
// niente: riceve i numeri già fatti dal motore.
import { computed } from 'vue'
import Icona from './Icona.vue'
import Grosso from './Grosso.vue'
import Glifo from './Glifo.vue'
import Palco from './Palco.vue'

const props = defineProps({
  mostro: { type: Object, required: true },   // { em, nome, ossa, ossaMax, chiave }
  sprite: { type: String, default: null },    // il suo pezzo, quello che si vede sul campo
  grosso: { type: Object, default: null },    // il mostro grosso (dati/grossi.js): la sua figura disegnata in codice
  palco: { type: Object, default: () => ({}) },   // lo scenario vero: { pavimento, faccia, roccia }
  eroe: { type: Object, default: () => ({}) },   // { sprite, em, vita, vitaMax }: lui, di fronte
  puoiScappare: { type: Boolean, default: true },   // lo usa il tasto sotto (Gioco.vue): qui solo per non finire sul div
  scosso: { type: Number, default: 0 },
  scambio: { type: Object, default: null },   // com'è andato l'ultimo scambio: { dato, preso, caduto, usata, veleno, colpiti, rimandato }
  stati: { type: Array, default: () => [] },   // cosa sta succedendo al mostro (avvelenato, gelato…): [{ glifo, n, dice }]
  mie: { type: Array, default: () => [] },     // e cosa protegge l'eroe in questo scontro (scudo, parato…)
})
// cosa ha addosso il mostro, per il colore della figura: fuoco, gelo, veleno, stordito
const addosso = computed(() => props.stati.map(x => 'sot-addosso-' + (x.fuoco ? 'fuoco' : x.chiave)))
</script>

<template>
  <div class="sot-scontro">
  <!-- il palco: i due si guardano; a ogni scambio (`scosso` cambia) chi ha colpito scatta in avanti e chi è colpito trema -->
  <div class="sot-duello" data-duello>
    <Palco v-bind="palco" />
    <div class="sot-lato sot-lato-eroe">
      <div :key="'e' + scosso" class="sot-figura sot-eroe-fig" :class="{ 'sot-scatta-dx': scambio && scambio.dato, 'sot-colpito': scambio && scambio.preso, 'sot-protetto': mie.some(x => ['parato', 'scudo', 'intoccabile', 'specchio'].includes(x.chiave)), 'sot-guarisce': mie.some(x => x.chiave === 'linfa') }">
        <Icona :sprite="eroe.sprite" :em="eroe.em" :scala="4" :emAlto="64" />
      </div>
      <span v-if="scambio && scambio.preso" :key="'p' + scosso" class="sot-numero sot-numero-preso">−{{ scambio.preso }}</span>
    </div>
    <!-- il dardo: l'abilità usata vola dall'eroe al mostro, del colore del suo ramo -->
    <span v-if="scambio && scambio.usata" :key="'v' + scosso" class="sot-dardo" data-dardo :style="{ '--tinta': scambio.usata.tinta }">
      <Glifo :nome="scambio.usata.glifo" :misura="34" />
    </span>
    <div class="sot-info-mostro">
      <b class="sot-nome-mostro">{{ mostro.nome }}<span v-if="mostro.chiave" class="em"> 🗝️</span></b>
      <div class="sot-vita"><i :style="{ width: Math.max(0, mostro.ossa / mostro.ossaMax * 100) + '%' }"></i></div>
    </div>
    <div class="sot-lato sot-lato-mostro">
      <div :key="'m' + scosso" class="sot-figura sot-mostro-fig sot-respira" :class="[{ 'sot-scatta-sx': scambio && scambio.preso, 'sot-colpito': scambio && scambio.dato }, ...addosso]">
        <Grosso v-if="grosso" :disegno="grosso.disegno" :colori="grosso.colori" :scala="3" />
        <Icona v-else :sprite="sprite" :em="mostro.em" :scala="5" :emAlto="76" />
      </div>
      <!-- gli effetti che durano stanno addosso al mostro, non solo nelle pastiglie: brucia, gela, è stordito -->
      <div class="sot-effetti" data-effetti>
        <Glifo v-for="x in stati" :key="x.chiave" :nome="x.glifo" :misura="22" :class="'sot-effetto sot-effetto-' + (x.fuoco ? 'fuoco' : x.chiave)" />
      </div>
      <span v-if="scambio && scambio.dato" :key="'d' + scosso" class="sot-numero sot-numero-dato">−{{ scambio.dato }}</span>
    </div>
  </div>
  <div v-if="stati.length" class="sot-stati em" data-stati-mostro>
    <span v-for="x in stati" :key="x.chiave" :data-stato="x.chiave" :title="x.dice"><Glifo :nome="x.glifo" :misura="14" /> {{ x.n }}</span>
  </div>
  <!-- una riga per fonte: da dove viene il danno (colpo, abilità, veleno) e cosa si è portato via quello che arriva -->
  <div v-if="scambio" class="sot-scambio" :class="{ 'sot-male': !scambio.dato && !scambio.veleno }" :data-usata="scambio.usata ? scambio.usata.id : null">
    <p v-if="scambio.dato" class="em" data-scambio="danno">
      <span v-if="scambio.usata" class="sot-scambio-abilita"><Glifo :nome="scambio.usata.glifo" :misura="16" /> {{ scambio.usata.nome }}: </span>
      fai <b>{{ scambio.dato }}</b> di danno<span v-if="scambio.usata && scambio.volte > 1 && scambio.base"> (il tuo colpo di {{ scambio.base }} ×{{ String(scambio.volte).replace('.', ',') }})</span><span v-else-if="scambio.primoTiro"> (da lontano: il mostro non risponde)</span>
    </p>
    <p v-else-if="scambio.usata" class="sot-scambio-abilita" data-scambio="abilita"><Glifo :nome="scambio.usata.glifo" :misura="16" /> {{ scambio.usata.nome }}</p>
    <p v-if="scambio.veleno" class="sot-scambio-abilita" data-scambio="veleno"><Glifo nome="veleno" :misura="14" /> altri <b>{{ scambio.veleno }}</b> di danno a ogni turno</p>
    <p v-if="scambio.colpiti" class="em" data-scambio="stanza">e colpisci altri {{ scambio.colpiti }} {{ scambio.colpiti === 1 ? 'mostro' : 'mostri' }} della stanza</p>
    <p v-if="scambio.rimandato" class="em" data-scambio="specchio">il suo colpo si ritorce contro di lui: <b>{{ scambio.rimandato }}</b> di danno</p>
    <p v-if="scambio.preso" class="em" data-scambio="preso">
      subisci <b>{{ scambio.preso }}</b> di danno<span v-if="scambio.gelato"> (il gelo gli dimezza il colpo)</span><span v-if="scambio.assorbito"> · la barriera ne para {{ scambio.assorbito }}</span>
    </p>
    <p v-else-if="scambio.assorbito" class="em" data-scambio="preso">la barriera para tutto: <b>{{ scambio.assorbito }}</b> di danno</p>
    <p v-else-if="scambio.schivato" class="em" data-scambio="preso">schivi il colpo</p>
    <p v-else-if="scambio.salvo" class="em" data-scambio="preso">
      {{ { fermo: 'è stordito: non ti attacca', intoccabile: 'sei invulnerabile: non subisci danni', parato: 'sei protetto: non subisci danni', quieto: 'non fa in tempo a risponderti' }[scambio.salvo] }}
    </p>
  </div>

  <div v-if="mie.length" class="sot-stati sot-stati-mie em" data-stati-eroe>
    <span v-for="x in mie" :key="x.chiave" :data-stato="x.chiave"><Glifo :nome="x.glifo" :misura="14" /> {{ x.dice }}</span>
  </div>
  </div>
</template>
