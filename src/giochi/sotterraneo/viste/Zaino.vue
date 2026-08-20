<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LO ZAINO — quello che porti addosso, e quello che porti dietro

   Tre caselle addosso e sei tasche (`TASCHE` in `mondo.js`). Le tasche
   non sono decorazione: sono **il limite**. Uno zaino pieno vuol dire
   scegliere cosa lasciare per terra.

   ── LE CASELLE STANNO INTORNO A CHI LE PORTA ──────────────────────
   Non una fila di riquadri uguali, ma **posti addosso a una figura**: la
   mano a destra, l'armatura a sinistra, l'anello sotto, e in mezzo
   l'eroe che si è scelto, con l'arma vera in pugno. È la differenza fra
   un elenco di oggetti e un personaggio equipaggiato, e la sanno tutti i
   giochi di questo genere: guardando la figura si vede **come si è
   messi** senza leggere una riga.

   Le statistiche stanno in una riga sola in cima, compatte. Erano un
   riquadro a parte più in basso: due posti dove leggere la stessa cosa,
   e quello in basso lo si trovava solo scorrendo.

   ── UNA TASCA SI SCEGLIE, POI SI DECIDE ───────────────────────────
   Prima toccare una tasca faceva subito «la sola cosa sensata» per
   quell'oggetto. Il difetto si è visto giocando: con sei tasche piene
   **non c'era nessun modo di liberarne una** se non usare quello che
   c'era dentro — bere una pozione buona per far posto a una spada. E una
   pozione beveva sé stessa al primo tocco sbagliato, che con un dito su
   un telefono capita.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, watch, nextTick } from 'vue'
import { figura, SCALA } from './figura.js'
import Icona from './Icona.vue'
import { cambioDetto } from './cambio.js'
import { pezzoAndante } from '../dati/tessere.js'

const props = defineProps({
  eroe: { type: Object, required: true },     // la scheda di chi scende
  mano: { type: Object, default: null },      // { chiave, em, nome, dice, att, sprite, mani } o niente
  mancina: { type: Object, default: null },   // la seconda arma, o l'ombra di quella a due mani
  corpo: { type: Object, default: null },
  dito: { type: Object, default: null },
  tasche: { type: Array, required: true },    // [{ em, nome, dice } | null]
  att: { type: Number, required: true },
  dif: { type: Number, required: true },
  vita: { type: Number, required: true },
  vitaMax: { type: Number, required: true },
  gemme: { type: Number, required: true },
  piano: { type: Number, required: true },
  piani: { type: Number, required: true },
})
const emit = defineEmits(['usa', 'butta', 'riponi', 'chiudi'])

/* Chi è selezionato: una tasca (`{ dove: 'zaino', i }`) o una casella
   addosso (`{ dove: 'mano' }`). Niente selezionato è lo stato normale. */
const scelto = ref(null)

const CASELLE = [
  { dove: 'mano', dice: 'in mano' },
  { dove: 'mancina', dice: 'l\'altra mano' },
  { dove: 'corpo', dice: 'addosso' },
  { dove: 'dito', dice: 'al dito' },
]

const addosso = dove => (dove === 'mano' ? props.mano
  : dove === 'mancina' ? props.mancina
    : dove === 'corpo' ? props.corpo : props.dito)

/* ── l'ombra nella mano debole ──
   Un arco, uno spadone, un bastone si tengono con tutte e due le mani:
   la casella di sinistra non è «vuota», è **occupata da quella che hai
   in pugno**. Lasciarla vuota diceva il contrario — che ci si poteva
   mettere qualcosa — e non c'era modo di scoprire perché non funzionava.
   Ci si mette quindi la stessa arma, in ombra e specchiata, con scritto
   che serve tutta e due. */
const dueMani = computed(() => !!(props.mano && props.mano.mani === 2))
const spenta = dove => dove === 'mancina' && dueMani.value

const cosa = computed(() => {
  const s = scelto.value
  if (!s) return null
  return s.dove === 'zaino' ? (props.tasche[s.i] || null) : addosso(s.dove)
})

/* Una tasca svuotata non deve lasciare selezionato il buco che ha
   lasciato: le azioni sotto parlerebbero di una cosa che non c'è più. */
watch(cosa, c => { if (!c) scelto.value = null })

const azioni = ref(null)

/* ── il tasto che sembrava non esserci ──
   Toccare una tasca **sceglie**, e le azioni compaiono sotto la
   griglia. Con lo zaino pieno il pannello è alto quanto lo schermo, e
   quel «la impugno» nasceva **oltre il bordo di sotto**: da fuori si
   legge come un tocco che non fa niente — si premeva la spada, non
   succedeva nulla, e poi si scopriva che era stata impugnata davvero.
   Perciò appena si sceglie, le azioni si portano in vista. */
function tocca(dove, i = 0) {
  const s = scelto.value
  scelto.value = (s && s.dove === dove && s.i === i) ? null : { dove, i }
  if (scelto.value) nextTick(() => azioni.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
}

/* Fatto quello che si era scelto, la selezione si spegne: la tasca
   `i` adesso tiene un'altra cosa — quello che si aveva addosso è
   tornato nello zaino, e la fila si è accorciata — e lasciarla accesa
   mostrava le azioni di un oggetto che non era quello toccato. */
function fai(che, dato) {
  scelto.value = null
  emit(che, dato)
}
const sceltoQui = (dove, i = 0) => {
  const s = scelto.value
  return !!s && s.dove === dove && (s.i || 0) === i
}

/* La figura in mezzo, con in pugno quello che si impugna davvero: è il
   colpo d'occhio che l'elenco non dà. */
const ritratto = computed(() => figura(pezzoAndante(props.eroe.sprite, 'fermo', 0), { scala: 4 }))
const inPugno = computed(() => (props.mano && props.mano.sprite
  ? figura(props.mano.sprite, { scala: 2 }) : null))

/* Lo sprite di una cosa dentro una casella, alla scala di casa: la
   stessa che ha nel banco del mercante e nella riga dell'avviso. Prima
   era «grande quanto ci sta nel quadrato», e la stessa boccetta veniva
   grande il doppio qui rispetto a là. */
const dentro = c => (c && c.sprite ? figura(c.sprite, { scala: SCALA }) : null)

/* ── cosa fa, in numeri ──
   «Una lama per parte: non perdona» racconta un'arma; per sapere se
   conviene servono i numeri, e sono gli stessi che il gioco somma.
   Vengono prima della frase, perché sono quelli che fanno decidere. */
const numeri = computed(() => {
  const c = cosa.value
  if (!c) return []
  const n = []
  if (c.att) n.push(`⚔️ ${c.att}`)
  if (c.dif) n.push(`🛡️ ${c.dif}`)
  if (c.vita) n.push(`❤️ +${c.vita}`)
  if (c.cura) n.push(`❤️ ${c.cura} subito`)
  if (c.cresce) n.push(`❤️ +${c.cresce} per sempre`)
  if (c.luce) n.push('🔦 vedi più lontano')
  if (c.gemme) n.push(`💎 ×${(1 + c.gemme).toString().replace('.', ',')}`)
  if (c.mani === 2) n.push('✋✋ due mani')
  return n
})

/* Cosa vuol dire «usa» per questa cosa qui. Sta nella vista e non nel
   motore perché è una parola, non una regola. */
const verbo = computed(() => {
  const c = cosa.value
  if (!c) return ''
  if (c.dove === 'mano') return 'la impugno'
  if (c.dove === 'corpo') return 'me la metto'
  if (c.dove === 'dito') return 'me lo infilo'
  if (c.usa === 'cura') return 'la bevo'
  if (c.usa === 'luce') return 'l\'accendo'
  if (c.usa === 'porta') return 'apro una porta'
  return 'la uso'
})

/* Quanto cambierebbe, a metterla addosso: il numero che fa scegliere.
   La frase la compone `cambio.js`, che è lo stesso posto da cui la
   prende il banco del mercante — erano due copie, e una delle due non
   c'era affatto. Zero non si scrive come «+0»: si dice «come quella
   che hai», che è la stessa cosa in italiano. */
const cambio = computed(() => {
  const c = cosa.value
  if (!c || !c.dove || scelto.value.dove !== 'zaino') return ''
  if (c.dove === 'dito') return c.dice
  const campo = c.dove === 'mano' ? 'att' : 'dif'
  const gia = addosso(c.dove)
  return cambioDetto({ campo, addosso: gia ? gia.chiave : null, delta: (c[campo] || 0) - (gia ? (gia[campo] || 0) : 0) },
                     () => (gia ? gia.nome : ''))
})
</script>

<template>
  <div class="sot-zaino">
    <!-- ═══ com'è messo, in una riga ═══ -->
    <p class="sot-riepilogo em">
      <span class="sot-polso" :style="{ '--sot-polso': vita / vitaMax > 0.6 ? '#4fce7c'
                                        : vita / vitaMax > 0.3 ? '#f0b429' : '#e0432f' }">
        <i :style="{ width: (vita / vitaMax) * 100 + '%' }"></i>
        <b>{{ vita }}/{{ vitaMax }}</b>
      </span>
      ⚔️ {{ att }} · 🛡️ {{ dif }} · 💎 {{ gemme }} · 🪜 {{ piano }}/{{ piani }}
    </p>

    <!-- ═══ chi sei, e cosa hai addosso ═══ -->
    <div class="sot-corredo">
      <button v-for="c in CASELLE" :key="c.dove" class="sot-slot"
              :class="[`sot-slot-${c.dove}`, { 'sot-vuota': !addosso(c.dove) && !spenta(c.dove),
                                               'sot-ombra': spenta(c.dove),
                                               'sot-scelto': sceltoQui(c.dove) }]"
              :data-casella="c.dove" :disabled="spenta(c.dove)" @click="tocca(c.dove)">
        <!-- la mano occupata da un'arma a due mani: la stessa figura,
             in ombra e girata, che è il modo di dire «è questa che te la
             tiene» senza scrivere una riga di regolamento -->
        <template v-if="spenta(c.dove)">
          <span class="sot-dentro" :style="dentro(mano) ? dentro(mano).gabbia : null">
            <i v-if="dentro(mano)" :style="dentro(mano).pezzo"></i>
            <b v-else class="em">{{ mano.em }}</b>
          </span>
          <i>a due mani</i>
        </template>
        <template v-else>
          <span class="sot-dentro" :style="dentro(addosso(c.dove)) ? dentro(addosso(c.dove)).gabbia : null">
            <i v-if="dentro(addosso(c.dove))" :style="dentro(addosso(c.dove)).pezzo"></i>
            <b v-else class="em">{{ addosso(c.dove) ? addosso(c.dove).em : '·' }}</b>
          </span>
          <i>{{ addosso(c.dove) ? addosso(c.dove).nome : c.dice }}</i>
        </template>
      </button>

      <div class="sot-figura">
        <span class="sot-ritratto" :style="ritratto ? ritratto.gabbia : null">
          <i v-if="ritratto" :style="ritratto.pezzo"></i>
          <b v-else class="em">{{ eroe.em }}</b>
        </span>
        <!-- l'arma si posa accanto al pugno, come nel campo -->
        <span v-if="inPugno" class="sot-impugnata" :style="inPugno.gabbia">
          <i :style="inPugno.pezzo"></i>
        </span>
      </div>
    </div>

    <!-- ═══ le tasche ═══ -->
    <div class="sot-tasche">
      <button v-for="(t, i) in tasche" :key="i" class="sot-tasca"
              :class="{ 'sot-vuota': !t, 'sot-scelto': sceltoQui('zaino', i) }"
              :disabled="!t" :data-tasca="i" @click="tocca('zaino', i)">
        <span class="sot-dentro" :style="dentro(t) ? dentro(t).gabbia : null">
          <i v-if="dentro(t)" :style="dentro(t).pezzo"></i>
          <b v-else class="em">{{ t ? t.em : '·' }}</b>
        </span>
        <em>{{ t ? t.nome : '' }}</em>
      </button>
    </div>

    <!-- ═══ cosa faccio con questa ═══
         Sotto la griglia, non sopra: la roba resta dov'era e non balla
         sotto il dito mentre si sceglie. -->
    <div v-if="cosa" ref="azioni" class="sot-azioni">
      <p class="sot-dice">
        <Icona :sprite="cosa.sprite" :em="cosa.em" :emAlto="20" /> <b>{{ cosa.nome }}</b>
      </p>
      <p v-if="numeri.length" class="sot-numeri em">{{ numeri.join(' · ') }}</p>
      <p class="sot-detto">{{ cosa.dice }}</p>
      <p v-if="cambio" class="sot-cambio em">{{ cambio }}</p>

      <template v-if="scelto.dove === 'zaino'">
        <button class="sot-grosso" data-azione="usa" @click="fai('usa', scelto.i)">
          {{ verbo }}
        </button>
        <button class="sot-grosso sot-chiaro" data-azione="butta" @click="fai('butta', scelto.i)">
          <span class="em">🫳</span> la lascio per terra
        </button>
      </template>
      <button v-else class="sot-grosso sot-chiaro" data-azione="riponi"
              @click="fai('riponi', scelto.dove)">
        <span class="em">🎒</span> nello zaino
      </button>
    </div>

    <button class="sot-grosso sot-chiaro" data-azione="chiudi" @click="$emit('chiudi')">
      chiudo
    </button>
  </div>
</template>
