<script setup>
// Il fumetto del mondo di sopra in 3D (viste/Mondo3d.vue): sopra un ingresso, una pietra del viaggio, il portale gemello, il
// cartello, la bacheca o una grata chiusa. Non decide niente: Mondo3d.vue gli dà i dati già pronti e lui dice cosa si è toccato
// (`scendi`, `giu`, `viaggio`). Gli stessi bersagli dei test del fumetto della terra dipinta (viste/Terra.vue).
import { faccia, inFrase, titoloDi } from '../motore/missioni.js'

defineProps({
  f: { type: Object, required: true },   // { tipo, … } (vedi fumetto in Mondo3d.vue)
})
defineEmits(['scendi', 'giu', 'viaggio'])
const minuscolo = s => s.charAt(0).toLowerCase() + s.slice(1)
</script>

<template>
  <template v-if="f.tipo === 'posto'">
    <b class="sot-fum-nome"><span v-if="!f.aperto" class="em">🔒</span> {{ f.nome }}</b>
    <i class="sot-fum-dritta">{{ f.dritta }}</i>
    <template v-if="f.aperto">
      <p v-if="f.tappa" class="sot-fum-conto em">
        🪜 {{ f.tappa.piani }} piani<template v-if="f.tappa.stelle && !f.tappa.potenza"> · {{ '⭐'.repeat(f.tappa.stelle) }}</template>
        · <span class="sot-fum-livello" :class="'sot-pallino-' + f.tappa.colore" data-livello-zona
                :data-livello="f.tappa.livello" :data-colore="f.tappa.colore"
                :data-fascia="f.tappa.fascia && f.tappa.fascia.join('-')">livello {{ f.tappa.fascia ? f.tappa.fascia.join('–') : f.tappa.livello }}</span>
      </p>
      <p v-else class="sot-fum-conto em" data-fondo>{{ f.fondo ? `il più giù: piano ${f.fondo}` : 'mai sceso' }}</p>
      <p v-if="f.storia" class="sot-fum-storia" :data-storia-qui="f.storia.stato"><b>La storia:</b> {{ f.storia.testo }}</p>
      <p v-if="f.prese.length" class="sot-fum-missioni" data-missioni-qui>
        <span v-for="m in f.prese" :key="m.id" :data-missione="m.id">
          <span class="em">{{ faccia(m) }}</span> {{ inFrase(titoloDi(m)) }}<template v-if="m.tipo !== 'conta'">, piano {{ m.piano + 1 }}</template>
        </span>
      </p>
      <p v-if="f.livello && f.colore !== 'rosso'" class="sot-fum-avviso" data-sotto-livello :data-manca="f.livello.manca">
        <b>Il minatore ti ha visto passare:</b> «{{ f.livello.detto }}»
      </p>
      <p v-if="f.detto" class="sot-fum-avviso" :data-detto-colore="f.colore" :data-ferma="f.colore === 'rosso' ? 1 : null">
        <b>{{ f.detto.chi }}:</b> «{{ f.detto.detto }}»
      </p>
      <button v-if="f.colore !== 'rosso'" class="sot-grosso" data-azione="scendi" @click="$emit('scendi')">
        <span class="em">🪜</span> {{ f.tappa && f.tappa.stelle && !f.tappa.potenza ? 'ci torno giù' : 'scendo' }}
      </button>
    </template>
    <p v-else class="sot-fum-chiusa" data-chiusa-perche>{{ f.perche }}</p>
  </template>

  <template v-else-if="f.tipo === 'pietra'">
    <b class="sot-fum-nome">{{ f.nome }}</b>
    <template v-if="f.mete.length">
      <i class="sot-fum-dritta">La runa è accesa. Tocca dove vuoi andare: il viaggio è subito.</i>
      <button v-for="v in f.mete" :key="v.chiave" type="button" class="sot-grosso sot-chiaro sot-fum-viaggio" :data-viaggio="v.chiave"
              @click="$emit('viaggio', v.chiave)">{{ v.nome }}</button>
    </template>
    <i v-else class="sot-fum-dritta" data-nessuna-meta>La runa è accesa. Accendi un'altra pietra, e da qui ci arrivi in un attimo.</i>
  </template>

  <template v-else-if="f.tipo === 'portale'">
    <b class="sot-fum-nome">Il portale</b>
    <p class="sot-fum-portale">
      <img v-if="f.immagine" class="sot-ritaglio" :src="f.immagine" alt="" data-ritaglio>
      <span>Ti riporta giù: <b>{{ minuscolo(f.nome) }}</b>, piano {{ f.piano }}, dove eri.</span>
    </p>
    <button class="sot-grosso" data-azione="portale-giu" @click="$emit('giu')"><span class="em">🌀</span> torno giù</button>
  </template>

  <template v-else-if="f.tipo === 'cartello'">
    <b class="sot-fum-nome">Il cartello</b>
    <p v-for="x in f.frecce" :key="x.passaggio" class="sot-fum-freccia" :data-freccia="x.verso">
      <b class="em">{{ x.verso }}</b> {{ x.detto }}<template v-if="x.nomi.length"><br><i>{{ x.nomi.join(' · ') }}</i></template>
    </p>
  </template>

  <template v-else-if="f.tipo === 'bacheca'">
    <b class="sot-fum-nome">La bacheca</b>
    <i class="sot-fum-dritta" data-bacheca-vuota>Due fogli bianchi, e un chiodo. Per ora non c'è niente da fare: torna più avanti.</i>
  </template>

  <template v-else-if="f.tipo === 'grata'">
    <b class="sot-fum-nome"><span class="em">🔒</span> {{ f.nome }}</b>
    <p class="sot-fum-chiusa" data-grata-perche>{{ f.perche }}</p>
  </template>
</template>
