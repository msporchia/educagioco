<script setup>
// Una parte di un esercizio, costruita solo dal catalogo (docs/scuola/esercizi.md): fra quello che il gioco sa fare, la materia
// e la voce (tessere, nascoste se c'è una sola scelta), poi i suoi parametri
import { computed } from 'vue'
import { CATALOGO, materieDelGioco } from '../comune/esercizi.js'
import { PARAMETRI } from '../giochi/parametri.js'
import Esempio from './Esempio.vue'

const props = defineProps({ modelValue: { type: Object, required: true }, gioco: { type: String, default: 'schede' },
  soloParametri: { type: Boolean, default: false } })   // nell'elenco delle domande la voce è già scelta: solo le sue scelte
const emit = defineEmits(['update:modelValue'])

const tutte = CATALOGO.materie.flatMap(m => m.voci.map(v => ({ ...v, materia: m.id })))
const copia = x => JSON.parse(JSON.stringify(x))
const idDella = e => (e?.tipo === 'tabelline' ? 'tabelline' : e?.tipo === 'modulo' ? e.modulo : e?.tipo)   // la voce di un gioco ha l'id del suo tipo

const voce = computed(() => tutte.find(v => v.id === idDella(props.modelValue)) || null)
const materie = computed(() => materieDelGioco(props.gioco))
const materia = computed(() => materie.value.find(m => m.id === voce.value?.materia) || null)
const e = computed(() => props.modelValue)
const conEsempio = computed(() => voce.value?.tipo === 'tabelline' || voce.value?.tipo === 'modulo')

const cambia = parti => emit('update:modelValue', { ...copia(props.modelValue), ...parti })

function sceltaMateria(id) {
  const m = materie.value.find(x => x.id === id)
  if (m && m.id !== materia.value?.id) emit('update:modelValue', copia(m.voci[0].base))
}
function sceltaVoce(id) {
  const v = tutte.find(x => x.id === id)
  if (v) emit('update:modelValue', copia(v.base))
}

/* ── le tabelline ── */
function tabellina(n) {
  const scelte = e.value.tabelline.includes(n) ? e.value.tabelline.filter(x => x !== n) : [...e.value.tabelline, n].sort((a, b) => a - b)
  if (scelte.length) cambia({ tabelline: scelte })
}

/* ── cosa si chiede delle tabelline: due spunte, il risultato e il numero nascosto; tutte e due sono «misti». Una resta accesa ── */
const modiAccesi = computed(() => (e.value.modo === 'misti' ? ['prodotto', 'nascosto'] : [e.value.modo]))
function modo(id) {
  const accesi = modiAccesi.value.includes(id) ? modiAccesi.value.filter(x => x !== id) : [...modiAccesi.value, id]
  if (accesi.length) cambia({ modo: accesi.length === 2 ? 'misti' : accesi[0] })
}

/* ── un modulo: i gradini da..a e le tipologie (nessuna scelta vuol dire tutte) ── */
const aperta = t => t.gradini.some(g => g >= e.value.da && g <= e.value.a)
function gradini(da, a) {
  if (da > a) [da, a] = [a, da]
  const restano = e.value.tipologie.filter(id => voce.value.tipologie.find(t => t.id === id)?.gradini.some(g => g >= da && g <= a))
  cambia({ da, a, tipologie: restano })
}
function tipologia(id) {
  if (id === null) return cambia({ tipologie: [] })
  const t = e.value.tipologie
  cambia({ tipologie: t.includes(id) ? t.filter(x => x !== id) : [...t, id] })
}
</script>

<template>
  <div class="parte-esercizio" :class="{ 'con-esempio': conEsempio }">
    <div class="scelte">
    <div v-if="materie.length > 1 && !props.soloParametri" class="fila" data-materie>
      <button v-for="m in materie" :key="m.id" class="tessera" :class="{ scelta: materia?.id === m.id }" :aria-pressed="materia?.id === m.id"
              :data-materia="m.id" @click="sceltaMateria(m.id)">{{ m.emoji }} {{ m.nome }}</button>
    </div>
    <div v-if="(materia?.voci.length || 0) > 1 && !props.soloParametri" class="fila voci" data-voci>
      <button v-for="v in materia.voci" :key="v.id" class="tessera" :class="{ scelta: voce?.id === v.id }" :aria-pressed="voce?.id === v.id"
              :data-voce="v.id" @click="sceltaVoce(v.id)">{{ v.icona }} {{ v.nome }}</button>
    </div>
    <p v-if="voce && (materia?.voci.length || 0) > 1 && !props.soloParametri" class="nota">{{ voce.spiega }}</p>

    <template v-if="voce?.tipo === 'tabelline'">
      <div class="gruppo">
        <span class="titoletto">Quali tabelline</span>
        <div class="fila">
          <button v-for="t in voce.tabelline" :key="t.valore" class="tessera" :class="{ scelta: e.tabelline.includes(t.valore) }"
                  :aria-pressed="e.tabelline.includes(t.valore)" :title="t.nome" :data-tabellina="t.valore"
                  @click="tabellina(t.valore)">{{ t.valore }}</button>
        </div>
      </div>
      <div class="gruppo">
        <span class="titoletto">Che domande <span class="nota">(anche tutte e due: si mescolano)</span></span>
        <div class="fila">
          <button v-for="m in voce.modi.filter(x => x.id !== 'misti')" :key="m.id" class="tessera spunta-modo"
                  :class="{ scelta: modiAccesi.includes(m.id) }" :aria-pressed="modiAccesi.includes(m.id)" :data-modo="m.id" @click="modo(m.id)">
            <span class="quadretto" aria-hidden="true">{{ modiAccesi.includes(m.id) ? '✓' : '' }}</span>{{ m.nome }} <span class="esempio">{{ m.esempio }}</span></button>
        </div>
      </div>
    </template>

    <!-- il contenuto di un gioco (docs/scuola/giochi.md): i parametri li disegna il gioco -->
    <component :is="PARAMETRI[voce.gioco]" v-else-if="voce?.gioco && PARAMETRI[voce.gioco]" :model-value="e"
               @update:model-value="x => emit('update:modelValue', x)" />

    <template v-else-if="voce?.tipo === 'modulo'">
      <div class="due">
        <label>Dal gradino
          <select class="campo" :value="e.da" data-campo="da" @change="gradini(Number($event.target.value), e.a)">
            <option v-for="g in voce.gradini" :key="g.grado" :value="g.grado">{{ g.grado }} · {{ g.nome }}</option>
          </select>
        </label>
        <label>Al gradino
          <select class="campo" :value="e.a" data-campo="a" @change="gradini(e.da, Number($event.target.value))">
            <option v-for="g in voce.gradini" :key="g.grado" :value="g.grado">{{ g.grado }} · {{ g.nome }}</option>
          </select>
        </label>
      </div>
      <div v-if="voce.tipologie.length > 1" class="gruppo">
        <span class="titoletto">Quali domande</span>
        <div class="fila">
          <button class="tessera" :class="{ scelta: !e.tipologie.length }" :aria-pressed="!e.tipologie.length" data-tipologia=""
                  @click="tipologia(null)">Tutte</button>
          <button v-for="t in voce.tipologie" :key="t.id" class="tessera" :class="{ scelta: e.tipologie.includes(t.id) }"
                  :aria-pressed="e.tipologie.includes(t.id)" :disabled="!aperta(t) && !e.tipologie.includes(t.id)" :data-tipologia="t.id"
                  @click="tipologia(t.id)">{{ t.nome }}</button>
        </div>
      </div>
    </template>

    </div>
    <!-- a destra la domanda vera, nella scheda dei bambini: le voci del catalogo (i giochi col contenuto loro lo dicono da sé) -->
    <Esempio v-if="conEsempio" :esercizio="e" :gioco="props.gioco" />
  </div>
</template>

<style scoped>
.parte-esercizio { display:flex; flex-direction:column; gap:12px }
.scelte { display:flex; flex-direction:column; gap:12px; min-width:0 }
/* su uno schermo largo le scelte a sinistra e la domanda d'esempio a destra */
@media (min-width:900px) { .parte-esercizio.con-esempio { display:grid; grid-template-columns:minmax(0, 1fr) 360px; gap:16px; align-items:start } }
.due { display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px }
.gruppo { display:flex; flex-direction:column; gap:6px }
.titoletto { font-size:14px; font-weight:600 }
.esempio { font-weight:400; opacity:.7; margin-left:4px }
.voci { padding-top:8px; border-top:1px solid var(--tessera) }
.spunta-modo { display:inline-flex; align-items:center; gap:8px }
.quadretto { width:18px; height:18px; display:grid; place-items:center; font-size:12px; font-weight:700; border-radius:4px;
             border:2px solid currentColor; opacity:.9 }
</style>
