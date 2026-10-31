<script setup>
// Il fumetto del mondo di sopra in 3D (viste/Mondo3d.vue): sopra un ingresso, una pietra del viaggio, il portale gemello, il
// cartello, la bacheca, la fontana o la porta delle terre. Non decide niente: Mondo3d.vue gli dà i dati già pronti e lui dice cosa si è toccato
// (`scendi`, `giu`, `viaggio`, `bevi`, `taglia` per un foglio della bacheca, `scava` per la X, `passa` la porta delle terre, `terra` il
// villaggio di un'altra terra dalla pietra del villaggio).
import { faccia, inFrase, titoloDi } from '../motore/missioni.js'

defineProps({
  f: { type: Object, required: true },   // { tipo, … } (vedi fumetto in Mondo3d.vue)
})
defineEmits(['scendi', 'giu', 'viaggio', 'bevi', 'taglia', 'scava', 'passa', 'terra'])
const minuscolo = s => { const t = String(s ?? ''); return t.charAt(0).toLowerCase() + t.slice(1) }   // un nome che manca non rompe la pagina
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
      <!-- la discesa lasciata a metà si riprende da qui (viste/Campagna.vue, tocca) -->
      <button v-if="f.colore !== 'rosso'" class="sot-grosso" data-azione="scendi" :data-sosta="f.sosta ? 1 : null" @click="$emit('scendi')">
        <span class="em">🪜</span> {{ f.sosta ? 'riprendo da dove ero' : f.tappa && f.tappa.stelle && !f.tappa.potenza ? 'ci torno giù' : 'scendo' }}
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
    <i v-else-if="!f.terre.length" class="sot-fum-dritta" data-nessuna-meta>La runa è accesa. Accendi un'altra pietra, e da qui ci arrivi in un attimo.</i>
    <!-- le terre già viste: si arriva nella piazza del loro villaggio (docs/sotterraneo/terre-successive.md) -->
    <template v-if="f.terre.length">
      <i class="sot-fum-dritta" data-terre-da-tornare>La runa ricorda anche le altre terre dove sei stato.</i>
      <button v-for="t in f.terre" :key="t.terra" type="button" class="sot-grosso sot-chiaro sot-fum-viaggio" data-azione="torna-terra"
              :data-terra="t.terra" @click="$emit('terra', t.terra)"><span class="em">🌀</span> {{ t.villaggio }}, {{ minuscolo(t.nome) }}</button>
    </template>
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
    <p v-for="x in f.frecce" :key="x.verso + x.nome" class="sot-fum-freccia" :class="{ 'sot-fum-freccia-meta': x.meta }" :data-freccia="x.verso">
      <b class="em">{{ x.verso }}</b> {{ x.detto }}<template v-if="x.nomi.length"><br><i>{{ x.nomi.join(' · ') }}</i></template>
      <!-- la freccia che porta alla meta di adesso: lo stesso azzurro delle luci per terra (docs/sotterraneo/mondo-3d-la-meta.md) -->
      <template v-if="x.meta && f.meta"><br><b class="sot-fum-di-qui" data-freccia-meta>◎ di qui per {{ f.meta.minuscolo }}: segui le luci azzurre</b></template>
    </p>
    <p v-if="f.meta && f.meta.qui" class="sot-fum-freccia sot-fum-freccia-meta" data-meta-qui>
      <b class="sot-fum-di-qui">◎ {{ f.meta.nome }} è da queste parti: segui le luci azzurre per terra</b>
    </p>
  </template>

  <template v-else-if="f.tipo === 'bacheca'">
    <b class="sot-fum-nome"><span class="em">📜</span> {{ f.nome }}</b>
    <i v-if="!f.voci.length" class="sot-fum-dritta" data-bacheca-vuota>Fogli bianchi, e un chiodo. Per ora non c'è niente da fare: torna più avanti.</i>
    <ul v-else class="sot-taglie" data-taglie>
      <li v-for="v in f.voci" :key="v.id" class="sot-taglia" :class="{ 'sot-taglia-spenta': v.piena }" :data-taglia="v.id" :data-stato="v.stato" :data-tipo="v.tipo">
        <span class="em sot-taglia-em">{{ v.em }}</span>
        <span class="sot-taglia-testo"><b>{{ v.titolo }}</b><i>{{ v.dove }}<template v-if="v.nota"> · {{ v.nota }}</template></i></span>
        <span class="em sot-taglia-premio" data-premio-gemme>💎 {{ v.gemme }}</span>
        <button v-if="v.azione === 'prendi'" type="button" class="sot-grosso sot-taglia-bottone" data-azione="prendi" :data-taglia-prendi="v.id"
                @click="$emit('taglia', { id: v.id, azione: 'prendi' })">prendo</button>
        <button v-else-if="v.azione === 'consegna'" type="button" class="sot-grosso sot-taglia-bottone sot-taglia-oro" data-azione="consegna" :data-taglia-consegna="v.id"
                @click="$emit('taglia', { id: v.id, azione: 'consegna' })">consegno</button>
        <small v-else-if="v.stato === 'presa'" class="sot-taglia-nota" data-taglia-in-corso>in corso</small>
        <span v-else class="sot-taglia-piena" data-taglia-piena aria-hidden="true">🔒</span>
      </li>
    </ul>
    <p v-if="f.voci.some(v => v.piena)" class="sot-fum-avviso" data-taglie-piene>Hai già tre taglie in mano: consegnane una, e potrai prenderne un'altra.</p>
  </template>

  <template v-else-if="f.tipo === 'scavo'">
    <b class="sot-fum-nome"><span class="em">🗺️</span> La X della mappa</b>
    <i class="sot-fum-dritta" data-scavo-dice>Il terreno qui è smosso. Scavi?</i>
    <button class="sot-grosso" data-azione="scava" @click="$emit('scava')">scavo</button>
  </template>

  <template v-else-if="f.tipo === 'fontana'">
    <b class="sot-fum-nome"><span class="em">⛲</span> {{ f.nome }}</b>
    <i class="sot-fum-dritta" data-fontana-dice :data-serve="f.serve ? 1 : 0">{{ f.serve ? f.dice : f.gia }}</i>
    <button v-if="f.serve" class="sot-grosso" data-azione="bevi" @click="$emit('bevi')"><span class="em">💧</span> {{ f.bevi }}</button>
  </template>

  <!-- la porta delle terre, in fondo alla landa: si apre ripulite le tombe del vento, e porta alla terra dopo (docs/sotterraneo/terre-successive.md) -->
  <template v-else-if="f.tipo === 'terre'">
    <b class="sot-fum-nome"><span class="em">🌀</span> {{ f.nome }}</b>
    <i class="sot-fum-dritta" data-terre-dice :data-aperta="f.aperta ? 1 : 0">{{ f.dice }}</i>
    <button v-if="f.aperta" class="sot-grosso" data-azione="passa-terra" @click="$emit('passa')"><span class="em">🌀</span> {{ f.passa }}</button>
  </template>
</template>
