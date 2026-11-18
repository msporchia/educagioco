<script setup>
// Una parte di un esercizio, costruita solo dal catalogo (docs/scuola/esercizi.md): materia → voce → i suoi parametri
import { computed } from 'vue'
import { CATALOGO } from '../comune/esercizi.js'

const props = defineProps({ modelValue: { type: Object, required: true } })
const emit = defineEmits(['update:modelValue'])

const tutte = CATALOGO.materie.flatMap(m => m.voci.map(v => ({ ...v, materia: m.id })))
const copia = x => JSON.parse(JSON.stringify(x))
const idDella = e => (e?.tipo === 'tabelline' ? 'tabelline' : e?.modulo)

const voce = computed(() => tutte.find(v => v.id === idDella(props.modelValue)) || null)
const materia = computed(() => CATALOGO.materie.find(m => m.id === voce.value?.materia) || null)
const e = computed(() => props.modelValue)

const cambia = parti => emit('update:modelValue', { ...copia(props.modelValue), ...parti })

function sceltaMateria(id) {
  const m = CATALOGO.materie.find(x => x.id === id)
  if (m) emit('update:modelValue', copia(m.voci[0].base))
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
  <div class="parte-esercizio">
    <div class="due">
      <label>Materia
        <select class="campo" :value="materia?.id" data-campo="materia" @change="sceltaMateria($event.target.value)">
          <option v-for="m in CATALOGO.materie" :key="m.id" :value="m.id">{{ m.emoji }} {{ m.nome }}</option>
        </select>
      </label>
      <label>Esercizio
        <select class="campo" :value="voce?.id" data-campo="voce" @change="sceltaVoce($event.target.value)">
          <option v-for="v in materia?.voci || []" :key="v.id" :value="v.id">{{ v.icona }} {{ v.nome }}</option>
        </select>
      </label>
    </div>
    <p v-if="voce" class="nota">{{ voce.spiega }}</p>

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
        <span class="titoletto">Cosa si chiede</span>
        <div class="fila">
          <button v-for="m in voce.modi" :key="m.id" class="tessera" :class="{ scelta: e.modo === m.id }" :aria-pressed="e.modo === m.id"
                  :data-modo="m.id" @click="cambia({ modo: m.id })">{{ m.nome }} <span class="esempio">{{ m.esempio }}</span></button>
        </div>
      </div>
    </template>

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
</template>

<style scoped>
.parte-esercizio { display:flex; flex-direction:column; gap:12px }
.due { display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px }
.gruppo { display:flex; flex-direction:column; gap:6px }
.titoletto { font-size:14px; font-weight:600 }
.esempio { font-weight:400; opacity:.7; margin-left:4px }
</style>
