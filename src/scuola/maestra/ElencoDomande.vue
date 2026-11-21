<script setup>
// Cosa si chiede, nei giochi che prendono le domande del catalogo (le schede, Survivors, il sotterraneo, gli Asteroidi): un
// elenco solo, per materia, dove ogni tipo di domanda si accende con la spunta e prende la sua intensità (scelta dell'utente:
// una scelta sola e in fila, non «una cosa e poi mescolane un'altra»). Le parti sono quelle di un esercizio `insieme`.
// docs/scuola/esercizi.md
import { ref, watch } from 'vue'
import { materieDelGioco, PESI, MAX_PARTI } from '../comune/esercizi.js'
import ParteEsercizio from './ParteEsercizio.vue'
import Aiuto from './Aiuto.vue'

const props = defineProps({
  parti: { type: Array, required: true },       // [{ esercizio, peso }]
  gioco: { type: String, required: true },
})
const emit = defineEmits(['cambia'])

const copia = x => JSON.parse(JSON.stringify(x))
const idDella = e => (e?.tipo === 'tabelline' ? 'tabelline' : e?.tipo === 'modulo' ? e.modulo : e?.tipo)
const materie = () => materieDelGioco(props.gioco)
const partiDi = v => props.parti.map((p, i) => ({ ...p, i })).filter(p => idDella(p.esercizio) === v.id)
const quanteIn = m => m.voci.reduce((n, v) => n + (partiDi(v).length ? 1 : 0), 0)
const pieno = () => props.parti.length >= MAX_PARTI

// le materie aperte: quelle che hanno già qualcosa acceso, e sempre tutte se il gioco ne ha una sola (gli Asteroidi); le
// altre si aprono toccandole. Cambiando gioco il componente resta lo stesso: le aperte si rifanno (docs/core/interfaccia.md)
const daAprire = () => new Set(materie().filter(m => quanteIn(m) || materie().length === 1).map(m => m.id))
const aperte = ref(daAprire())
watch(() => props.gioco, () => { aperte.value = daAprire() })
const apri = id => { const x = new Set(aperte.value); x.has(id) ? x.delete(id) : x.add(id); aperte.value = x }

function accendi(v) {
  // spenta: via tutte le sue parti (anche l'ultima: il blocco torna a non chiedere niente, e l'editor lo dice)
  if (partiDi(v).length) return emit('cambia', props.parti.filter(p => idDella(p.esercizio) !== v.id))
  if (!pieno()) emit('cambia', [...props.parti, { esercizio: copia(v.vuota || v.base), peso: 'normale' }])
}
const ancora = v => { if (!pieno()) emit('cambia', [...props.parti, { esercizio: copia(v.base), peso: 'poco' }]) }
const cambiaParte = (i, esercizio) => emit('cambia', props.parti.map((p, j) => (j === i ? { ...p, esercizio } : p)))
const cambiaPeso = (i, peso) => emit('cambia', props.parti.map((p, j) => (j === i ? { ...p, peso } : p)))
const togli = i => { if (props.parti.length > 1) emit('cambia', props.parti.filter((_, j) => j !== i)) }
</script>

<template>
  <div class="elenco-domande" data-elenco-domande>
    <section v-for="m in materie()" :key="m.id" class="materia" :data-materia-elenco="m.id">
      <button class="testa-materia" :aria-expanded="aperte.has(m.id)" @click="apri(m.id)">
        <span>{{ m.emoji }} <b>{{ m.nome }}</b></span>
        <span v-if="quanteIn(m)" class="accese">{{ quanteIn(m) === 1 ? '1 scelta' : `${quanteIn(m)} scelte` }}</span>
        <span class="freccia" aria-hidden="true">{{ aperte.has(m.id) ? '▴' : '▾' }}</span>
      </button>
      <div v-if="aperte.has(m.id)" class="voci">
        <div v-for="v in m.voci" :key="v.id" class="voce" :class="{ accesa: partiDi(v).length }">
          <button class="riga" :aria-pressed="!!partiDi(v).length" :disabled="!partiDi(v).length && pieno()" :data-voce="v.id" @click="accendi(v)">
            <span class="segno" aria-hidden="true">{{ partiDi(v).length ? '✓' : '' }}</span>
            <span class="corpo"><b>{{ v.icona }} {{ v.nome }}</b><span class="nota">{{ v.spiega }}</span></span>
          </button>
          <div v-for="p in partiDi(v)" :key="p.i" class="parte" :class="`c${p.i}`" :data-parte="p.i">
            <div v-if="props.parti.length > 1" class="testa-parte">
              <span class="titoletto">Quanto spesso</span>
              <span class="pesi">
                <button v-for="x in PESI" :key="x.id" class="peso" :class="{ scelta: p.peso === x.id }" :aria-pressed="p.peso === x.id"
                        :aria-label="x.nome" :title="x.nome" :data-peso="x.id" @click="cambiaPeso(p.i, x.id)">
                  <i v-for="n in x.volte" :key="n"></i></button>
              </span>
              <Aiuto testo="Più pallini, più domande di questo tipo rispetto alle altre accese: la barra in cima dice quante su dieci." />
              <button v-if="partiDi(v).length > 1" class="togli" aria-label="togli queste scelte" data-azione="togli-parte" @click="togli(p.i)">✕</button>
            </div>
            <ParteEsercizio :model-value="p.esercizio" :gioco="props.gioco" solo-parametri @update:model-value="x => cambiaParte(p.i, x)" />
          </div>
          <button v-if="partiDi(v).length && !pieno() && (v.tipo === 'tabelline' || v.tipo === 'modulo')" class="ancora" data-azione="aggiungi-parte" @click="ancora(v)">
            ＋ Ancora {{ v.nome.toLowerCase() }}, con altre scelte</button>
        </div>
      </div>
    </section>
    <p v-if="pieno()" class="nota">Al massimo {{ MAX_PARTI }} scelte insieme.</p>
  </div>
</template>

<style scoped>
.elenco-domande { display:flex; flex-direction:column; gap:6px }
.materia { border-radius:var(--raggio-piccolo); border:1px solid var(--filo); overflow:hidden }
.testa-materia { width:100%; display:flex; align-items:center; gap:10px; padding:10px 12px; font:inherit; font-size:15px; text-align:left;
                 color:var(--inchiostro); background:var(--superficie); border:0; cursor:pointer }
.accese { font-size:12px; font-weight:600; padding:2px 8px; border-radius:999px; background:var(--penna, var(--inchiostro)); color:#fff }
.freccia { margin-left:auto; color:var(--grigio) }
.voci { display:flex; flex-direction:column; gap:6px; padding:8px; background:var(--tessera) }
.voce { display:flex; flex-direction:column; gap:8px; border-radius:var(--raggio-piccolo) }
.voce.accesa { background:var(--superficie); padding:6px; box-shadow:inset 0 0 0 2px var(--penna, var(--inchiostro)) }
.riga { display:flex; align-items:flex-start; justify-content:flex-start; gap:10px; width:100%; padding:8px 10px; font:inherit;
        text-align:left; color:var(--inchiostro); background:var(--superficie); border:0; border-radius:var(--raggio-piccolo); cursor:pointer }
.riga:disabled { opacity:.5 }
.segno { flex:none; width:20px; height:20px; margin-top:1px; display:grid; place-items:center; font-size:13px; font-weight:700;
         border:2px solid var(--filo); border-radius:5px }
.accesa .segno { border-color:var(--penna, var(--inchiostro)); background:var(--penna, var(--inchiostro)); color:#fff }
.corpo { display:flex; flex-direction:column; gap:2px; min-width:0; font-size:15px }
.parte { display:flex; flex-direction:column; gap:10px; padding:8px 10px 10px; border-left:5px solid var(--colore, var(--filo));
         border-radius:6px; background:var(--superficie) }
.c0 { --colore:#5b8def } .c1 { --colore:#e8a33d } .c2 { --colore:#55b07f } .c3 { --colore:#c46ac4 } .c4 { --colore:#d9645a } .c5 { --colore:#6bb6c9 }
.testa-parte { display:flex; align-items:center; gap:8px; flex-wrap:wrap }
.titoletto { font-size:13px; font-weight:600 }
.pesi { display:flex; gap:6px }
.peso { display:flex; align-items:center; gap:3px; padding:6px 9px; min-height:30px; border-radius:var(--raggio-piccolo);
        background:var(--tessera); border:2px solid transparent; cursor:pointer }
.peso i { width:9px; height:9px; border-radius:50%; background:var(--grigio); opacity:.55 }
.peso.scelta { border-color:var(--inchiostro); background:var(--superficie) }
.peso.scelta i { background:var(--colore); opacity:1 }
.togli { margin-left:auto; border:0; background:none; font-size:17px; cursor:pointer; color:var(--inchiostro) }
.ancora { align-self:flex-start; padding:2px 4px; border:0; background:none; font:inherit; font-size:13px; font-weight:600;
          color:var(--penna, var(--inchiostro)); text-decoration:underline; cursor:pointer }
</style>
