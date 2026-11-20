<script setup>
// L'esercizio di un blocco della lezione (docs/scuola/esercizi.md): prima il gioco, col suo disegno, poi quello che quel gioco sa
// fare (una o più parti, con quante domande ciascuna), poi quanto è difficile
import { ref, computed } from 'vue'
import { valido, descrivi, giochiPer, giocoDi, PESI, MAX_PARTI, GIOCHI, DIFFICOLTA, difficoltaDi, materieDelGioco, mescolaPiuCose } from '../comune/esercizi.js'
import ParteEsercizio from './ParteEsercizio.vue'
import TesseraGioco from './TesseraGioco.vue'
import Aiuto from './Aiuto.vue'

const props = defineProps({
  modelValue: { type: Object, required: true },
  dove: { type: String, default: 'blocco' },
})
const emit = defineEmits(['update:modelValue'])

const copia = x => JSON.parse(JSON.stringify(x))
const senzaGioco = ({ gioco, difficolta, ...resto }) => resto
const e = computed(() => props.modelValue)

// le parti come le vede l'editor: un esercizio semplice è una parte sola, «normale»
const parti = computed(() => {
  const x = senzaGioco(e.value)
  return x.tipo === 'insieme' ? x.parti : [{ esercizio: x, peso: 'normale' }]
})

// il gioco resta scritto finché accetta l'esercizio; la difficoltà finché il gioco la regge («normale» non si scrive)
const conGioco = (es, gioco) => (gioco && gioco !== 'schede' && giochiPer(es).some(g => g.id === gioco) ? { ...es, gioco } : es)
const conDifficolta = (es, d) => (d !== 'normale' && GIOCHI.find(g => g.id === giocoDi(es))?.difficolta ? { ...es, difficolta: d } : es)
function scrivi(nuove, gioco = giocoDi(e.value), d = difficoltaDi(e.value)) {
  const es = nuove.length === 1 ? copia(nuove[0].esercizio) : { tipo: 'insieme', parti: copia(nuove) }
  emit('update:modelValue', conDifficolta(conGioco(es, gioco), d))
}

/* ── il gioco: se non sa fare quello che c'era, si parte dalla prima cosa che sa fare ── */
const gioco = computed(() => giocoDi(e.value))
const schedaDelGioco = computed(() => GIOCHI.find(g => g.id === gioco.value) || GIOCHI[0])
const tuttiIGiochi = ref(false)   // il gioco scelto e «Cambia gioco»; i giochi tutti in vista solo per cambiarlo
function scegliGioco(id) {
  tuttiIGiochi.value = false
  if (id === gioco.value) return
  if (valido(senzaGioco(e.value)) && giochiPer(senzaGioco(e.value)).some(g => g.id === id)) return scrivi(parti.value, id)
  const prima = materieDelGioco(id)[0]?.voci[0]
  if (prima) scrivi([{ esercizio: prima.base, peso: 'normale' }], id)
}

/* ── le parti, e quante domande per ciascuna ── */
const cambiaParte = (i, esercizio) => scrivi(parti.value.map((p, j) => (j === i ? { ...p, esercizio } : p)))
const cambiaPeso = (i, peso) => scrivi(parti.value.map((p, j) => (j === i ? { ...p, peso } : p)))
const togliParte = i => scrivi(parti.value.filter((_, j) => j !== i))
// una parte nuova parte dalla stessa voce dell'ultima, «un po'»: di solito si aggiunge un ripasso
const aggiungiParte = () => scrivi([...parti.value, { esercizio: copia(parti.value.at(-1).esercizio), peso: 'poco' }])
const piuCose = computed(() => mescolaPiuCose(gioco.value))

const volte = peso => PESI.find(x => x.id === peso)?.volte ?? 1
// su dieci domande, quante di ogni parte (circa: è un turno pesato, docs/scuola/esercizi.md)
const suDieci = computed(() => {
  const tot = parti.value.reduce((s, p) => s + volte(p.peso), 0)
  return parti.value.map(p => Math.round(volte(p.peso) / tot * 10))
})

/* ── quanto è difficile ── */
const difficolta = computed(() => difficoltaDi(e.value))
const scegliDifficolta = d => scrivi(parti.value, gioco.value, d)
</script>

<template>
  <div class="scelta-esercizio" :data-esercizio="dove">
    <div class="gruppo" data-scegli-gioco>
      <span class="titoletto">Il gioco</span>
      <div v-if="tuttiIGiochi" class="giochi">
        <TesseraGioco v-for="g in GIOCHI" :key="g.id" :gioco="g" :scelta="gioco === g.id" @click="scegliGioco(g.id)" />
      </div>
      <div v-else class="scelto">
        <TesseraGioco :gioco="schedaDelGioco" scelta grande @click="tuttiIGiochi = true" />
        <button class="bottone chiaro piccolo" data-azione="cambia-gioco" @click="tuttiIGiochi = true">Cambia gioco</button>
      </div>
    </div>

    <div class="gruppo">
      <span class="titoletto">Cosa si fa</span>
      <div v-if="parti.length > 1" class="mescola" data-mescola aria-label="quante domande di ogni parte">
        <span v-for="(p, i) in parti" :key="i" class="fetta" :class="`c${i}`" :style="{ flexGrow: volte(p.peso) }">{{ suDieci[i] }} su 10</span>
      </div>
      <div v-for="(p, i) in parti" :key="i" class="parte" :class="[{ insieme: parti.length > 1 }, `c${i}`]" :data-parte="i">
        <div v-if="parti.length > 1" class="testa-parte">
          <span class="titoletto">Quante domande</span>
          <div class="pesi">
            <button v-for="x in PESI" :key="x.id" class="peso" :class="{ scelta: p.peso === x.id }" :aria-pressed="p.peso === x.id"
                    :aria-label="x.nome" :title="x.nome" :data-peso="x.id" @click="cambiaPeso(i, x.id)">
              <i v-for="n in x.volte" :key="n"></i></button>
          </div>
          <button class="togli" aria-label="togli questa parte" data-azione="togli-parte" @click="togliParte(i)">✕</button>
        </div>
        <ParteEsercizio :model-value="p.esercizio" :gioco="gioco" @update:model-value="x => cambiaParte(i, x)" />
      </div>
      <span v-if="piuCose && parti.length < MAX_PARTI" class="fila">
        <button class="tessera aggiungi" data-azione="aggiungi-parte" @click="aggiungiParte">＋ Mescola un'altra cosa</button>
        <Aiuto testo="Nello stesso blocco le domande si mescolano: per esempio tanta tabellina dell'8 e un po' di ripasso del 3. Per fare una cosa dopo l'altra, invece, aggiungi un blocco dopo." />
      </span>
    </div>

    <div v-if="schedaDelGioco.difficolta" class="gruppo">
      <span class="titoletto">Quanto è difficile</span>
      <div class="livelli">
        <button v-for="(d, k) in DIFFICOLTA" :key="d.id" class="livello" :class="{ scelta: difficolta === d.id }" :aria-pressed="difficolta === d.id"
                :data-difficolta="d.id" @click="scegliDifficolta(d.id)">
          <span class="tacche" aria-hidden="true"><i v-for="n in 3" :key="n" :class="{ piena: n <= k + 1 }"></i></span>{{ d.nome }}</button>
      </div>
      <p class="nota">{{ difficolta === 'normale' ? 'Com\'è a casa.' : schedaDelGioco.difficolta[difficolta] }}</p>
    </div>

    <!-- il riassunto ripeteva le scelte appena fatte: resta solo quando l'esercizio così non chiede niente -->
    <p v-if="!valido(e)" class="descrizione storta" data-descrizione>Così l'esercizio non chiede niente: cambia le scelte qui sopra.</p>
  </div>
</template>

<style scoped>
.scelta-esercizio { display:flex; flex-direction:column; gap:16px }
.gruppo { display:flex; flex-direction:column; gap:8px }
.titoletto { font-size:14px; font-weight:600 }
.giochi { display:flex; flex-wrap:wrap; gap:8px }
.scelto { display:flex; align-items:center; gap:10px }
.scelto .tessera-gioco { flex:1; max-width:520px }

/* le parti: ognuna col suo colore, lo stesso della sua fetta nella barra */
.c0 { --colore:#5b8def } .c1 { --colore:#e8a33d } .c2 { --colore:#55b07f } .c3 { --colore:#c46ac4 } .c4 { --colore:#d9645a } .c5 { --colore:#6bb6c9 }
.mescola { display:flex; height:30px; border-radius:var(--raggio-piccolo); overflow:hidden; gap:2px }
.fetta { flex-basis:0; display:grid; place-items:center; min-width:52px; font-size:12px; font-weight:600; color:#fff; background:var(--colore) }
.parte.insieme { display:flex; flex-direction:column; gap:12px; padding:12px; border-radius:var(--raggio-piccolo);
                 border:1px solid var(--tessera); border-left:6px solid var(--colore) }
.testa-parte { display:flex; align-items:center; gap:10px; flex-wrap:wrap }
.pesi { display:flex; gap:6px; flex:1 }
.peso { display:flex; align-items:center; gap:3px; padding:8px 10px; min-height:34px; border-radius:var(--raggio-piccolo);
        background:var(--tessera); border:2px solid transparent; cursor:pointer }
.peso i { width:10px; height:10px; border-radius:50%; background:var(--grigio); opacity:.55 }
.peso.scelta { border-color:var(--inchiostro); background:var(--superficie) }
.peso.scelta i { background:var(--colore); opacity:1 }
.togli { border:0; background:none; font-size:18px; cursor:pointer; padding:4px 8px; color:var(--inchiostro) }
.aggiungi { align-self:flex-start }

/* quanto è difficile: tre tacche che si riempiono */
.livelli { display:flex; gap:6px; flex-wrap:wrap }
.livello { display:flex; align-items:center; gap:8px; padding:8px 14px; font:inherit; font-size:14px; color:var(--inchiostro);
           background:var(--tessera); border:2px solid transparent; border-radius:var(--raggio-piccolo); cursor:pointer }
.livello.scelta { border-color:var(--inchiostro); background:var(--superficie) }
.tacche { display:flex; align-items:flex-end; gap:2px; height:16px }
.tacche i { width:5px; border-radius:2px; background:var(--filo) }
.tacche i:nth-child(1) { height:6px } .tacche i:nth-child(2) { height:11px } .tacche i:nth-child(3) { height:16px }
.tacche i.piena { background:var(--inchiostro) }

.descrizione { font-size:14px; font-weight:600; padding:8px 12px; border-radius:var(--raggio-piccolo); background:var(--tessera) }
.descrizione.storta { background:#fff0e6; color:#b4603f }
</style>
