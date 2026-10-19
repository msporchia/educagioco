<script setup>
// Il diario delle missioni, la quarta scheda della finestra dell'eroe (viste/SchedeEroe.vue, docs/sotterraneo/barra.md):
// il riassunto sempre a portata di mano, sopra e sotto (docs/sotterraneo/missioni.md).
// In cima la missione principale, la storia (docs/sotterraneo/la-storia-principale.md), con la freccina verso la discesa
// di adesso e le sette porte nel dettaglio. Poi quelle in mano (le fatte da consegnare in cima, poi le da fare, con chi aspetta), quelle che aspettano di essere prese, quelle
// già consegnate. Toccando una voce si apre il suo dettaglio, nella stessa finestra: chi te l'ha data, cosa ha detto,
// dove, cosa, il premio, a che punto sei. Da lì si sceglie quale missione indicano le freccine («segui questa») e si va
// da chi aspetta. Non scrive niente: dice `segui`, `vai` e `scheda` a chi lo usa (viste/Campagna.vue, Gioco.vue); si chiude con la ✕ o
// toccando fuori (`fuori`, col tocco: chi lo usa lo passa alla mappa, docs/core/interfaccia.md). `giu`: aperto in
// discesa, dove chi aspetta non c'è e «vai da …» non serve.
import { computed, ref, watch } from 'vue'
import Cornice from './Cornice.vue'
import SchedeEroe from './SchedeEroe.vue'
import Icona from './Icona.vue'
import Ritratto from './Ritratto.vue'
import { diario } from '../motore/missioni.js'
import { iconaDi } from '../dati/terra.js'

const props = defineProps({
  stati: { type: Object, default: () => ({}) },
  conti: { type: Object, default: () => ({}) },   // a che punto sono le «sconfiggi N»
  tappe: { type: Array, required: true },
  segui: { type: String, default: null },   // la missione che le freccine seguono, se ne è stata scelta una
  giu: { type: Boolean, default: false },
  punti: { type: Number, default: 0 },          // le schede: i «+» delle altre
  puntiAbilita: { type: Number, default: 0 },
  mondo: { type: Boolean, default: false },     // nel Sotterraneo 3D la strada è quella del mondo aperto (dati/terra.js, luogoDi)
})
const emit = defineEmits(['chiudi', 'segui', 'vai', 'fuori', 'scheda'])

const d = computed(() => diario(props.stati, props.tappe, props.segui, props.conti, props.mondo))

// il dettaglio: l'id della voce aperta (null = l'elenco). Si cerca fra tutte le voci a ogni giro, così se la voce
// cambia sotto (consegnata mentre il diario è aperto) il dettaglio la segue, e se sparisce si torna all'elenco
const aperta = ref(null)
const voce = computed(() => {
  if (!aperta.value) return null
  const tutte = [...d.value.pronte, ...d.value.daFare, ...d.value.offerte, ...d.value.consegnate]
  return tutte.find(v => v.id === aperta.value) || null
})
watch(voce, v => { if (aperta.value && !v) aperta.value = null })

// la missione principale, sempre in cima (docs/sotterraneo/la-storia-principale.md): il suo dettaglio è una pagina a parte
const storia = computed(() => d.value.storia)
const storiaAperta = ref(false)
const inDettaglio = computed(() => !!voce.value || storiaAperta.value)
const porta = p => (p.fatta ? 'chiusa' : storia.value.corrente && storia.value.corrente.chiave === p.chiave ? 'adesso' : 'avanti')
const doveAndare = computed(() => {
  const c = storia.value.corrente
  return c && !c.ferma ? c.chiave : null
})

// a che punto sei, a parole
const stato = v => (v.stato === 'fatta' ? `Fatta: torna ${v.daChi}`
  : v.stato === 'presa' ? 'Da fare'
  : v.stato === 'offerta' ? `${v.chi} ha un favore da chiederti`
  : 'Consegnata')
const fatto = v => v.stato === 'fatta' || v.stato === 'consegnata'
const nomeFigura = v => (v.cosa.sprite ? `${v.cosa.sprite}-fermo-0` : null)
// «vai da …» c'è per chi aspetta qualcosa da te: un favore da chiederti, o la consegna di una missione fatta
const puoiAndare = v => !props.giu && (v.stato === 'offerta' || v.stato === 'fatta')
const vaDa = v => emit('vai', v.vai || v.da)
</script>

<template>
  <Cornice alta data-diario @chiudi="$emit('chiudi')" @fuori="e => $emit('fuori', e)">
    <SchedeEroe attiva="missioni" :punti="punti" :punti-abilita="puntiAbilita" :missioni="d.pronte.length" @scheda="s => $emit('scheda', s)" />
    <div class="sot-diario-corpo">

    <!-- ═══ il dettaglio della missione principale: le sette porte ═══ -->
    <div v-if="storiaAperta" class="sot-dettaglio" data-dettaglio data-missione="storia"
         :data-stato="storia.finita ? 'consegnata' : 'presa'">
      <button class="sot-indietro" data-azione="indietro-diario" @click="storiaAperta = false">‹ indietro</button>

      <h3 class="sot-dettaglio-titolo"><span class="em">🚪</span> {{ storia.titolo }}</h3>
      <p class="sot-dettaglio-stato" :class="storia.finita ? 'sot-stato-consegnata' : 'sot-stato-fatta'" data-esito>
        {{ storia.finita ? 'Compiuta' : `Porta ${storia.chiuse + 1} di ${storia.totale}` }}
      </p>

      <!-- il minatore la dà, e dice perché questa porta -->
      <div class="sot-dettaglio-chi" data-dettaglio-chi data-chi="minatore">
        <span class="sot-dettaglio-ritratto"><Ritratto chi="minatore" :scala="3" /></span>
        <div>
          <b>Il vecchio minatore</b>
          <p class="sot-dettaglio-detto" data-racconto>«{{ storia.finita ? storia.fine : storia.corrente.ferma ? storia.ferma : storia.corrente.dice }}»</p>
        </div>
      </div>

      <!-- dove va la freccina: la discesa, e come ci si arriva -->
      <div v-if="storia.corrente" class="sot-dettaglio-riga" data-dettaglio-dove>
        <img v-if="iconaDi(storia.corrente.chiave, mondo)" class="sot-ritaglio" :src="iconaDi(storia.corrente.chiave, mondo)" alt="" data-ritaglio>
        <span class="sot-testo">
          <small>Dove</small>
          <b>{{ storia.corrente.nome }}</b>
          <i v-if="!storia.corrente.ferma">{{ storia.corrente.luogo }}</i>
        </span>
      </div>

      <div v-if="storia.corrente && storia.corrente.cosa" class="sot-dettaglio-riga" data-dettaglio-cosa data-tipo="sconfiggi">
        <span class="sot-dettaglio-icona"><Icona :sprite="nomeFigura(storia.corrente)" :em="storia.corrente.cosa.em" :scala="2" :emAlto="38" /></span>
        <span class="sot-testo">
          <small>Da battere</small>
          <b>{{ storia.corrente.cosa.nome }}</b>
          <i>il mostro grosso in fondo all'ultimo piano</i>
        </span>
      </div>

      <button v-if="doveAndare" class="sot-grosso" :class="{ 'sot-chiaro': storia.segui }" data-azione="segui"
              :data-segui-attivo="storia.segui ? 1 : null" @click="$emit('segui', storia.segui ? null : 'storia')">
        <template v-if="storia.segui"><span class="em">▸</span> la stai seguendo · smetti</template>
        <template v-else><span class="em">▸</span> segui questa</template>
      </button>
      <button v-if="doveAndare && !giu" class="sot-grosso sot-chiaro" data-azione="vai-da" @click="$emit('vai', doveAndare)">
        <span class="em">🚶</span> vai alla discesa
      </button>

      <!-- le sette porte, una per una: perché una è aperta e un'altra no -->
      <div class="sot-porte" data-porte>
        <small>Le sette porte</small>
        <ol>
          <li v-for="p in storia.porte" :key="p.chiave" :data-porta="p.chiave" :data-stato="porta(p)">
            <span class="sot-porta-segno"></span>
            <span class="sot-testo">
              <b>{{ p.nome }}</b>
              <i>{{ porta(p) === 'chiusa' ? p.grosso + ' è caduto' : porta(p) === 'adesso' ? 'da qui: batti ' + p.grosso : 'si apre dopo la porta di prima' }}</i>
            </span>
          </li>
        </ol>
      </div>

    </div>

    <!-- ═══ il dettaglio di una missione ═══ -->
    <div v-else-if="voce" class="sot-dettaglio" data-dettaglio :data-missione="voce.id" :data-stato="voce.stato">
      <button class="sot-indietro" data-azione="indietro-diario" @click="aperta = null">‹ indietro</button>

      <h3 class="sot-dettaglio-titolo"><span class="em">{{ voce.em }}</span> {{ voce.titolo }}</h3>
      <p class="sot-dettaglio-stato" :class="'sot-stato-' + voce.stato" data-esito>{{ stato(voce) }}</p>

      <!-- chi te l'ha data, e quello che ha detto: con la voce sua -->
      <div class="sot-dettaglio-chi" data-dettaglio-chi :data-chi="voce.da">
        <span v-if="voce.bacheca" class="sot-dettaglio-ritratto em sot-dettaglio-bacheca">📜</span>
        <span v-else class="sot-dettaglio-ritratto"><Ritratto :chi="voce.da" :scala="3" /></span>
        <div>
          <b>{{ voce.chi }}</b>
          <p class="sot-dettaglio-detto" data-racconto>«{{ voce.dice }}»</p>
          <p v-if="voce.stato === 'consegnata'" class="sot-dettaglio-detto sot-grazie" data-grazie>«{{ voce.grazie }}»</p>
        </div>
      </div>

      <!-- dove: la discesa ritagliata dalla mappa, e il piano -->
      <div class="sot-dettaglio-riga" data-dettaglio-dove>
        <img v-if="iconaDi(voce.discesa, mondo)" class="sot-ritaglio" :src="iconaDi(voce.discesa, mondo)" alt="" data-ritaglio>
        <span class="sot-testo">
          <small>Dove</small>
          <b>{{ voce.dove }}</b>
          <i v-if="voce.piano">piano {{ voce.piano }}</i>
        </span>
      </div>

      <!-- cosa: la cosa da trovare, o il mostro da battere -->
      <div class="sot-dettaglio-riga" data-dettaglio-cosa :data-tipo="voce.tipo">
        <span class="sot-dettaglio-icona"><Icona :sprite="nomeFigura(voce)" :em="voce.cosa.em" :scala="2" :emAlto="38" /></span>
        <span class="sot-testo">
          <small>{{ voce.cosa.verbo ? voce.cosa.verbo[fatto(voce) ? 1 : 0] : voce.tipo === 'trova' ? (fatto(voce) ? 'Trovata' : 'Da trovare') : (fatto(voce) ? 'Battuti' : 'Da battere') }}</small>
          <b>{{ voce.cosa.nome }}</b>
          <i v-if="voce.progresso" data-progresso :data-fatti="voce.progresso.fatti">{{ voce.progresso.fatti }} di {{ voce.progresso.quanti }}</i>
          <i v-else-if="voce.cosa.nota && !fatto(voce)">{{ voce.cosa.nota }}</i>
          <i v-else-if="!fatto(voce)">{{ voce.tipo === 'trova' ? 'in un forziere d\'oro' : 'il mostro con la corona' }}</i>
        </span>
      </div>

      <!-- il premio, pezzo per pezzo -->
      <div class="sot-dettaglio-riga" data-dettaglio-premio>
        <span class="sot-testo">
          <small>Premio</small>
          <span class="sot-premio-pezzi">
            <span v-if="voce.gemme" class="em" data-premio-gemme>💎 {{ voce.gemme }}</span>
            <span v-if="voce.regalo" class="sot-premio-roba" data-premio-roba>
              <Icona :sprite="voce.regalo.sprite" :em="voce.regalo.em" :emAlto="22" /> {{ voce.regalo.nome }}
            </span>
            <span v-if="voce.monete" class="em" data-premio-monete>🪙 {{ voce.monete }}</span>
          </span>
        </span>
      </div>

      <button v-if="voce.seguibile" class="sot-grosso" :class="{ 'sot-chiaro': voce.segui }" data-azione="segui"
              :data-segui-attivo="voce.segui ? 1 : null" @click="$emit('segui', voce.segui ? null : voce.id)">
        <template v-if="voce.segui"><span class="em">▸</span> la stai seguendo · smetti</template>
        <template v-else><span class="em">▸</span> segui questa</template>
      </button>
      <button v-if="puoiAndare(voce)" class="sot-grosso" :class="{ 'sot-chiaro': voce.seguibile }" data-azione="vai-da"
              @click="vaDa(voce)">
        <span class="em">🚶</span> vai {{ voce.daChi }}
      </button>
    </div>

    <!-- ═══ l'elenco ═══ -->
    <template v-else>
      <!-- la missione principale: la storia, data dal minatore. Sempre in cima, distinta dalle altre, con la freccina
           verso la discesa di adesso -->
      <section class="sot-diario-sezione sot-diario-storia" data-sezione="storia" :data-chiuse="storia.chiuse">
        <h3>La storia</h3>
        <ul>
          <li data-storia :data-stato="storia.finita ? 'consegnata' : 'presa'" :data-segui="storia.segui ? 1 : null"
              role="button" tabindex="0" @click="storiaAperta = true" @keydown.enter="storiaAperta = true">
            <img v-if="storia.corrente && iconaDi(storia.corrente.chiave, mondo)" class="sot-ritaglio" :src="iconaDi(storia.corrente.chiave, mondo)" alt="" data-ritaglio>
            <span v-else class="em">{{ storia.finita ? '✅' : '🚪' }}</span>
            <span class="sot-testo">
              <b>{{ storia.titolo }}</b>
              <template v-if="storia.corrente">
                <i>Porta {{ storia.chiuse + 1 }} di {{ storia.totale }} · {{ storia.corrente.nome }}</i>
                <em class="sot-freccia-storia" data-freccia-storia :data-ferma="storia.corrente.ferma ? 1 : null">
                  <span v-if="!storia.corrente.ferma" class="sot-freccina" aria-hidden="true"></span>
                  {{ storia.corrente.ferma ? storia.ferma : `Batti ${storia.corrente.grosso}, in fondo` }}
                </em>
              </template>
              <i v-else>{{ storia.fine }}</i>
            </span>
          </li>
        </ul>
      </section>

      <!-- le fatte da riportare, in cima e in oro: è quello che qualcuno sta aspettando -->
      <section v-if="d.pronte.length" class="sot-diario-sezione sot-diario-pronte" data-sezione="da-consegnare">
        <h3>Da consegnare</h3>
        <ul>
          <li v-for="v in d.pronte" :key="v.id" :data-missione="v.id" :data-stato="v.stato" role="button" tabindex="0"
              @click="aperta = v.id" @keydown.enter="aperta = v.id">
            <img v-if="iconaDi(v.discesa, mondo)" class="sot-ritaglio" :src="iconaDi(v.discesa, mondo)" alt="" data-ritaglio>
            <span class="sot-testo">
              <b><span class="em">{{ v.em }}</span> {{ v.titolo }}</b>
              <i>{{ v.dove }}<template v-if="v.piano">, piano {{ v.piano }}</template></i>
              <em class="sot-fatta" data-esito>{{ v.torna }}</em>
            </span>
            <span class="sot-diario-premio em">{{ v.premio }}</span>
          </li>
        </ul>
      </section>

      <section v-if="d.daFare.length" class="sot-diario-sezione" data-sezione="da-fare">
        <h3>Da fare</h3>
        <ul>
          <li v-for="v in d.daFare" :key="v.id" :data-missione="v.id" :data-stato="v.stato" :data-segui="v.segui ? 1 : null"
              role="button" tabindex="0" @click="aperta = v.id" @keydown.enter="aperta = v.id">
            <img v-if="iconaDi(v.discesa, mondo)" class="sot-ritaglio" :src="iconaDi(v.discesa, mondo)" alt="" data-ritaglio>
            <span class="sot-testo">
              <b><span class="em">{{ v.em }}</span> {{ v.titolo }}</b>
              <i>{{ v.dove }}<template v-if="v.piano">, piano {{ v.piano }}</template> · {{ v.chi.toLowerCase() }}</i>
              <em data-esito>da fare<template v-if="v.segui"> · la segui</template></em>
            </span>
            <span class="sot-diario-premio em">{{ v.premio }}</span>
          </li>
        </ul>
      </section>

      <section v-if="d.offerte.length" class="sot-diario-sezione" data-sezione="ti-aspettano">
        <h3>Ti aspettano</h3>
        <ul>
          <li v-for="v in d.offerte" :key="v.id" :data-missione="v.id" data-stato="offerta"
              role="button" tabindex="0" @click="aperta = v.id" @keydown.enter="aperta = v.id">
            <img v-if="iconaDi(v.discesa, mondo)" class="sot-ritaglio" :src="iconaDi(v.discesa, mondo)" alt="" data-ritaglio>
            <span class="sot-testo">
              <b><span class="em">{{ v.em }}</span> {{ v.titolo }}</b>
              <i>{{ v.dove }}<template v-if="v.piano">, piano {{ v.piano }}</template></i>
              <em data-esito>{{ v.chi }} ha un favore da chiederti</em>
            </span>
            <span class="sot-diario-premio em">{{ v.premio }}</span>
          </li>
        </ul>
      </section>

      <p v-if="!d.inMano.length && !d.offerte.length" class="sot-diario-vuoto" data-diario-vuoto>
        Per ora nessuno ti cerca. Finisci una discesa: al villaggio qualcuno avrà bisogno di te.
      </p>
      <p v-else-if="d.nascoste" class="sot-diario-tetto" data-diario-tetto>
        Hai già {{ d.aperte }} missioni aperte: consegnane una e ne arrivano altre.
      </p>

      <section v-if="d.consegnate.length" class="sot-diario-sezione sot-diario-fatte" data-sezione="consegnate">
        <h3>Consegnate ({{ d.consegnate.length }})</h3>
        <ul>
          <li v-for="v in d.consegnate" :key="v.id" :data-missione="v.id" data-stato="consegnata"
              role="button" tabindex="0" @click="aperta = v.id" @keydown.enter="aperta = v.id">
            <span class="em">✅</span> {{ v.titolo }}
          </li>
        </ul>
      </section>
    </template>
    </div>
  </Cornice>
</template>
