<script setup>
/* Una storia del libro: prima il testo inglese da leggere, una pagina
   alla volta, con la tipografia di un libro, poi le domande in italiano
   una alla volta. Il testo resta sopra anche durante le domande, e si
   sfoglia ancora: rileggere è lecito, è quello che si fa con un libro. Le
   parole si toccano come dappertutto; quelle della storia sono segnate e
   toccarle è gratis. Le domande sono a scelta, «chi l'ha detto», «tocca la
   frase» (il testo diventa a frasi da toccare) e «metti in ordine» (una
   fila di fatti, come le tessere). Vedi docs/lingue/libro-vista.md. */
import { ref, computed, watch, nextTick } from 'vue'
import Testo from './Testo.vue'
import { tenere } from './tenere.js'
import * as F from '../motore/fila.js'

const props = defineProps({
  cap: { type: Object, required: true },        // il racconto di motore/libro.js: pagine, blocchi, domande, storia
  fase: { type: String, default: 'leggi' },     // leggi | domande
  k: { type: Number, default: 0 },              // la domanda di adesso
  risposta: { default: null },                  // quello che si è risposto: un'opzione, una riga, una fila
  giusta: { type: Boolean, default: false },
  attesa: { type: Number, default: 0 },
  giro: { type: Number, default: 0 },
})
const emit = defineEmits(['ho-letto', 'rispondi', 'tocca'])

const pagina = ref(0)
const foglio = ref(null)
const dom = computed(() => (props.fase === 'domande' ? props.cap.domande[props.k] : null))
const risposto = computed(() => props.risposta !== null && props.risposta !== undefined)
// «Tocca la frase»: il testo si mostra a frasi da toccare, finché resta questa domanda
const aFrasi = computed(() => !!dom.value && dom.value.tipo === 'frase')

// «Un'altra storia» e «Puntata 2» riusano questo componente: la storia nuova riparte dalla prima pagina
watch(() => props.cap, () => { pagina.value = 0 })

function sfoglia(passo) { vaiA(pagina.value + passo) }
function vaiA(n) {
  if (n < 0 || n >= props.cap.pagine.length) return
  pagina.value = n
  nextTick(() => { if (foglio.value) foglio.value.scrollTop = 0 })
}
// dopo uno sbaglio su «frase», il testo va alla pagina della frase giusta, che si accende
watch(() => props.risposta, r => {
  const d = dom.value
  if (d && d.tipo === 'frase' && r !== null && !props.giusta) vaiA(d.pagina)
})

// le parole si traducono tenendo premuto, dove un tocco ha già un mestiere (una frase da scegliere)
const t = tenere(el => emit('tocca', el))
function scegli(i) {
  if (t.ingoia() || risposto.value) return
  emit('rispondi', i)
}
function classeFrase(r) {
  if (!risposto.value) return ''
  if (r.i === dom.value.giusta) return 'ing-giusta'
  return r.i === props.risposta ? 'ing-sbagliata' : 'ing-spenta'
}
function classeOpzione(o, i) {
  if (!risposto.value) return ''
  if (o.giusta) return 'ing-giusta'
  return i === props.risposta ? 'ing-sbagliata' : 'ing-spenta'
}

// «Metti in ordine»: la fila dei fatti, con motore/fila.js come per le tessere
const fila = ref([])
watch(() => [props.k, props.cap, props.fase], () => { fila.value = [] })
const banco = computed(() => (dom.value && dom.value.tipo === 'ordine' ? F.nelBanco(dom.value, fila.value) : []))
const testoDi = id => (dom.value.tessere.find(x => x.id === id) || {}).testo
const fuoriPosto = computed(() => (risposto.value && !props.giusta ? F.sbagliate(dom.value, fila.value) : []))
function metti(id) { if (!risposto.value) fila.value = F.metti(dom.value, fila.value, id) }
function togli(id) { if (!risposto.value) fila.value = F.togli(dom.value, fila.value, id) }
</script>

<template>
  <div class="ing-libro" data-libro-aperto>
    <article ref="foglio" class="ing-pagina" :class="{ 'ing-pagina-corta': fase === 'domande' }" data-libro-testo
             :data-pagina="pagina + 1" :data-pagine="cap.pagine.length" :data-a-frasi="aFrasi ? '1' : null">
      <div v-if="pagina === 0 && cap.puntata" class="ing-puntata" data-puntata>Puntata {{ cap.puntata }}</div>
      <h2 v-if="pagina === 0" class="ing-capitolo">{{ cap.titolo }}</h2>
      <!-- «tocca la frase»: ogni frase è un blocco da toccare; la parola si traduce tenendo premuto -->
      <template v-if="aFrasi">
        <button v-for="r in cap.pagine[pagina]" :key="'f' + r.i" type="button" class="ing-frase-scelta"
                :class="classeFrase(r)" :data-frase="r.i" :data-giusta="r.i === dom.giusta ? '' : null"
                :data-chi="r.chi"
                @pointerdown="t.giu" @pointermove="t.muovi" @pointerup="t.su" @pointercancel="t.su"
                @click="scegli(r.i)">
          <span v-if="r.riassunto" class="ing-chi">Nella puntata prima</span>
          <span v-else-if="r.chi" class="ing-chi">{{ r.nome }}</span>
          <Testo :testo="r.en" :storia="cap.storia" />
        </button>
      </template>
      <!-- la narrazione si legge di seguito, come in un libro; ogni battuta va a capo col nome di chi parla -->
      <template v-else><template v-for="(b, i) in cap.blocchi[pagina]" :key="pagina + '-' + i">
        <p v-if="b.riassunto" class="ing-riassunto" data-riassunto><span class="ing-chi">Nella puntata prima</span><Testo
          :testo="b.righe.map(r => r.en).join(' ')" :storia="cap.storia" @tocca="el => $emit('tocca', el)" /></p>
        <p v-else-if="!b.chi" class="ing-riga" :class="{ 'ing-prima-riga': pagina === 0 && i === 0 }"><Testo
          :testo="b.righe.map(r => r.en).join(' ')" :storia="cap.storia" @tocca="el => $emit('tocca', el)" /></p>
        <p v-else class="ing-battuta" data-battuta :data-chi="b.chi"><span class="ing-chi">{{ b.nome }}</span><Testo
          :testo="b.righe.map(r => r.en).join(' ')" :storia="cap.storia" @tocca="el => $emit('tocca', el)" /></p>
      </template></template>
      <div v-if="pagina === cap.pagine.length - 1" class="ing-fregio" aria-hidden="true">❦</div>
    </article>

    <!-- si sfoglia coi due tasti grandi, anche durante le domande -->
    <nav v-if="cap.pagine.length > 1" class="ing-sfoglia" aria-label="pagine">
      <button type="button" class="ing-freccia-pagina" aria-label="pagina prima" data-azione="pagina-indietro"
              :disabled="pagina === 0" @click="sfoglia(-1)">←</button>
      <span class="ing-numero-pagina" data-pagina-di>pagina {{ pagina + 1 }} di {{ cap.pagine.length }}</span>
      <button type="button" class="ing-freccia-pagina" aria-label="pagina dopo" data-azione="pagina-avanti"
              :disabled="pagina === cap.pagine.length - 1" @click="sfoglia(1)">→</button>
    </nav>

    <div v-if="fase === 'leggi'" class="ing-dopo-lettura">
      <p class="ing-sotto">Tocca una parola se non sai cosa vuol dire.<template v-if="cap.storia.length"> Quelle
        sottolineate sono nuove: toccarle è gratis.</template></p>
      <button v-if="pagina === cap.pagine.length - 1" type="button" class="ing-grosso" data-azione="ho-letto"
              @click="$emit('ho-letto')">
        Ho letto →
      </button>
    </div>

    <div v-else class="ing-libro-domanda" data-libro-domanda :data-k="k" :data-tipo="dom.tipo">
      <div class="ing-etichetta">Domanda {{ k + 1 }} di {{ cap.domande.length }}<template
        v-if="dom.etichetta"> · {{ dom.etichetta }}</template></div>

      <!-- la consegna: una battuta in inglese (chi l'ha detto?) o una domanda in italiano -->
      <blockquote v-if="dom.tipo === 'chi'" class="ing-citazione" data-citazione>“<Testo :testo="dom.citazione"
        :storia="cap.storia" @tocca="el => $emit('tocca', el)" />”</blockquote>
      <div v-else class="ing-consegna ing-it ing-lunga">{{ dom.testo }}</div>
      <div v-if="dom.tipo === 'frase' && !risposto" class="ing-sotto">
        Tocca la frase nel testo qui sopra, anche sfogliando. Tieni premuta una parola per sapere cosa vuol dire.
      </div>

      <!-- metti in ordine: la fila in alto, i fatti sotto; si tocca e basta -->
      <template v-if="dom.tipo === 'ordine'">
        <div class="ing-fila ing-fila-fatti" data-fila :class="{ 'ing-fila-vuota': !fila.length }">
          <button v-for="(id, i) in fila" :key="'o' + id" type="button" class="ing-tessera ing-in-fila ing-fatto"
                  :class="{ 'ing-sbagliata': fuoriPosto.includes(id) }" :data-in-fila="id"
                  :data-sbagliata="fuoriPosto.includes(id) ? '' : null" @click="togli(id)">
            <b>{{ i + 1 }}.</b> {{ testoDi(id) }}</button>
          <span v-if="!fila.length" class="ing-invito">tocca i fatti qui sotto, dal primo all’ultimo</span>
        </div>
        <div class="ing-banco ing-banco-fatti" data-banco>
          <button v-for="x in banco" :key="'b' + x.id" type="button" class="ing-tessera ing-fatto"
                  :data-tessera="x.id" :data-posto="x.id" @click="metti(x.id)">{{ x.testo }}</button>
        </div>
        <button v-if="!risposto" type="button" class="ing-grosso" data-azione="consegna"
                :disabled="!F.pronta(dom, fila)" @click="$emit('rispondi', F.risposta(fila))">Fatto ✓</button>
      </template>

      <div v-else-if="dom.opzioni" class="ing-opzioni ing-lunghe">
        <button v-for="(o, i) in dom.opzioni" :key="k + '-' + i" type="button"
                class="ing-opzione" :class="classeOpzione(o, i)"
                :data-opzione="i" :data-giusta="o.giusta ? '' : null"
                @click="!risposto && $emit('rispondi', i)">{{ o.testo }}</button>
      </div>

      <!-- dopo uno sbaglio: rileggere; per la frase e l'ordine si vede anche la soluzione -->
      <div v-if="risposto" class="ing-esito" :data-esito="giusta ? 'giusta' : 'sbagliata'">
        <div v-if="giusta" class="ing-bene">Giusto!</div>
        <div v-else-if="dom.tipo === 'frase'" class="ing-male" data-si-fa>Non così: la frase che lo dice è quella
          in verde, qui sopra.</div>
        <template v-else-if="dom.tipo === 'ordine'">
          <div class="ing-male">Non così. L’ordine giusto è questo:</div>
          <ol class="ing-soluzione" data-si-fa><li v-for="(f, i) in dom.soluzione" :key="i">{{ f }}</li></ol>
        </template>
        <div v-else class="ing-male">Non così: rileggi {{ cap.pagine.length > 1 ? 'la storia, anche sfogliando'
          : 'il testo qui sopra' }}.</div>
        <div v-if="attesa" class="ing-avanti" data-attesa>
          <i :key="giro" :style="{ animationDuration: attesa + 'ms' }"></i>
        </div>
      </div>
    </div>
  </div>
</template>
