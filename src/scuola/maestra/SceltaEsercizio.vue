<script setup>
// L'esercizio di un blocco della lezione (docs/scuola/esercizi.md), a passi: il gioco, cosa si chiede, quanto è difficile.
// Una scelta fatta si richiude in una riga (`Fatta.vue`) sopra quella da fare, e «Cambia» la riapre; finite tutte, il blocco
// se ne accorge (`completo`) e si chiude. docs/scuola/editor.md
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { valido, descrivi, giochiPer, giocoDi, PESI, GIOCHI, DIFFICOLTA, difficoltaDi, materieDelGioco, mescolaPiuCose, NIENTE } from '../comune/esercizi.js'
import ParteEsercizio from './ParteEsercizio.vue'
import TesseraGioco from './TesseraGioco.vue'
import ElencoDomande from './ElencoDomande.vue'
import Fatta from './Fatta.vue'
import AnteprimaGioco from './AnteprimaGioco.vue'
import { cosaSiFa } from './utili.js'
import { ICONE } from '../comune/icone-giochi.js'

const props = defineProps({
  modelValue: { type: Object, required: true },
  dove: { type: String, default: 'blocco' },
})
const emit = defineEmits(['update:modelValue', 'completo'])

const copia = x => JSON.parse(JSON.stringify(x))
const senzaGioco = ({ gioco, difficolta, ...resto }) => resto
const e = computed(() => props.modelValue)

// le parti come le vede l'editor: un esercizio semplice è una parte sola, «normale»
const vuoto = computed(() => e.value?.tipo === NIENTE.tipo)
const parti = computed(() => {
  if (vuoto.value) return []
  const x = senzaGioco(e.value)
  return x.tipo === 'insieme' ? x.parti : [{ esercizio: x, peso: 'normale' }]
})

// il gioco resta scritto finché accetta l'esercizio; la difficoltà finché il gioco la regge («normale» non si scrive)
const conGioco = (es, gioco) => (gioco && gioco !== 'schede' && giochiPer(es).some(g => g.id === gioco) ? { ...es, gioco } : es)
const conDifficolta = (es, d) => (d !== 'normale' && GIOCHI.find(g => g.id === giocoDi(es))?.difficolta ? { ...es, difficolta: d } : es)
function scrivi(nuove, gioco = qualeGioco(), d = difficoltaDi(e.value)) {
  if (!nuove.length) return emit('update:modelValue', { ...NIENTE, gioco })   // spento tutto: il gioco resta, le domande no
  const es = nuove.length === 1 ? copia(nuove[0].esercizio) : { tipo: 'insieme', parti: copia(nuove) }
  emit('update:modelValue', conDifficolta(conGioco(es, gioco), d))
}

/* ── il gioco: se non sa fare quello che c'era, si parte dalla prima cosa che sa fare ── */
// il gioco scelto; null finché la maestra non ne tocca uno
const qualeGioco = () => (vuoto.value ? e.value.gioco ?? null : giocoDi(e.value))
const gioco = computed(qualeGioco)
const schedaDelGioco = computed(() => GIOCHI.find(g => g.id === gioco.value) || null)
// il gioco guardato nel carosello: toccarlo lo mostra sotto (il video, cosa fa), sceglierlo è un tasto a parte
const visto = ref(null)
const guardato = computed(() => GIOCHI.find(g => g.id === (visto.value ?? gioco.value)) || GIOCHI[0])
const fila = ref(null)
function guarda(id) {
  visto.value = id
  nextTick(() => fila.value?.querySelector(`[data-gioco="${id}"]`)?.scrollIntoView?.({ inline: 'center', block: 'nearest', behavior: 'smooth' }))
}
const accanto = verso => guarda(GIOCHI[(GIOCHI.indexOf(guardato.value) + verso + GIOCHI.length) % GIOCHI.length].id)
function scegliGioco(id) {
  if (id === gioco.value) return
  if (!vuoto.value && valido(senzaGioco(e.value)) && giochiPer(senzaGioco(e.value)).some(g => g.id === id)) return scrivi(parti.value, id)
  // un gioco che prende le domande del catalogo parte senza domande accese; uno col suo contenuto dal suo (i gradini, i capitoli)
  if (mescolaPiuCose(id)) return emit('update:modelValue', { ...NIENTE, gioco: id })
  // la sua forma vuota, se la scheda ne ha una (Passo passo: il personaggio da scegliere), se no la sua partenza
  const prima = materieDelGioco(id)[0]?.voci[0]
  if (prima) scrivi([{ esercizio: prima.vuota || prima.base, peso: 'normale' }], id)
}

/* ── le parti, e quante domande per ciascuna ── */
const cambiaParte = (i, esercizio) => scrivi(parti.value.map((p, j) => (j === i ? { ...p, esercizio } : p)))
const piuCose = computed(() => mescolaPiuCose(gioco.value))

const volte = peso => PESI.find(x => x.id === peso)?.volte ?? 1
// su dieci domande, quante di ogni parte (circa: è un turno pesato, docs/scuola/esercizi.md)
const suDieci = computed(() => {
  const tot = parti.value.reduce((s, p) => s + volte(p.peso), 0)
  return parti.value.map(p => Math.round(volte(p.peso) / tot * 10))
})

/* ── quanto è difficile ── */
const difficolta = computed(() => difficoltaDi(e.value))
const scegliDifficolta = d => { scrivi(parti.value, gioco.value, d); fatte.difficolta = true; aperto.value = null }

/* ── i passi: quali sono fatti, e quale è riaperto con «Cambia». Un esercizio già valido (una lezione salvata) li ha fatti tutti ── */
const fatte = reactive({ cosa: valido(e.value), difficolta: valido(e.value) })
const aperto = ref(null)                       // 'gioco' | 'cosa' | 'difficolta' riaperto, o null
const conDifficoltaDaScegliere = computed(() => !!schedaDelGioco.value?.difficolta)
const mostra = passo => aperto.value === passo || (passo === 'gioco' ? !gioco.value
  : passo === 'cosa' ? !!gioco.value && !fatte.cosa : !!gioco.value && fatte.cosa && !fatte.difficolta)
function giocoScelto(id) {
  const prima = gioco.value
  scegliGioco(id)
  if (id !== prima) { fatte.cosa = false; fatte.difficolta = false }
  aperto.value = null
  visto.value = null
}
function cosaFatta() { if (valido(e.value)) { fatte.cosa = true; aperto.value = null } }
const descrizione = computed(() => (valido(e.value) ? cosaSiFa({ ...senzaGioco(e.value), gioco: gioco.value }) : ''))
const nomeDifficolta = computed(() => DIFFICOLTA.find(d => d.id === difficolta.value)?.nome ?? '')
// tutto deciso: il blocco si può chiudere. Si dice solo quando lo diventa, non a pagina aperta
const completo = computed(() => !!gioco.value && fatte.cosa && valido(e.value) && (!conDifficoltaDaScegliere.value || fatte.difficolta) && !aperto.value)
watch(completo, (ora, prima) => { if (ora && !prima) emit('completo') })
</script>

<template>
  <div class="scelta-esercizio" :data-esercizio="dove">
    <!-- il gioco: fatto, una riga; da fare, tutti i giochi e la scheda di quello toccato -->
    <Fatta v-if="!mostra('gioco')" etichetta="Il gioco" :valore="schedaDelGioco.nome" :immagine="ICONE[gioco]?.src || ''" passo="gioco"
           @cambia="aperto = 'gioco'; guarda(gioco)" />
    <!-- un carosello: toccare un gioco lo fa vedere sotto, col video e cosa fa; si sceglie col tasto -->
    <div v-else class="gruppo" data-scegli-gioco>
      <span class="titoletto">A che gioco? <span class="nota">Tocca un gioco per vederlo.</span></span>
      <div class="carosello">
        <button class="freccia" aria-label="il gioco prima" data-azione="gioco-prima" @click="accanto(-1)">‹</button>
        <div ref="fila" class="fila-giochi">
          <TesseraGioco v-for="g in GIOCHI" :key="g.id" :gioco="g" :scelta="gioco === g.id" :guardata="guardato.id === g.id" piccola
                        @click="guarda(g.id)" />
        </div>
        <button class="freccia" aria-label="il gioco dopo" data-azione="gioco-dopo" @click="accanto(1)">›</button>
      </div>
      <div class="scheda-gioco" data-scheda-gioco :data-guardato="guardato.id">
        <AnteprimaGioco :gioco="guardato.id" />
        <div class="testo-gioco">
          <b>{{ guardato.nome }}</b>
          <!-- un testo solo, per la maestra: cosa allena, un esempio, come cresce (provati due campi fissi, esercizio e gioco: si
               ripetevano; e «Si può chiedere» sotto, che diceva «Matematica» o l'elenco che il passo dopo mostra comunque) -->
          <span class="allena" data-allena>{{ guardato.allena }}</span>
          <button class="bottone" data-azione="scegli-gioco" @click="giocoScelto(guardato.id)">
            {{ gioco === guardato.id ? 'Tieni' : 'Scegli' }} {{ guardato.nome }}</button>
        </div>
      </div>
    </div>

    <template v-if="gioco">
      <Fatta v-if="!mostra('cosa')" etichetta="Cosa si chiede" :valore="descrizione" passo="cosa" @cambia="aperto = 'cosa'" />
      <div v-else class="gruppo" data-passo-cosa>
        <span class="titoletto">Cosa si chiede</span>
        <div v-if="parti.length > 1" class="mescola" data-mescola aria-label="quante domande di ogni parte">
          <span v-for="(p, i) in parti" :key="i" class="fetta" :class="`c${i}`" :style="{ flexGrow: volte(p.peso) }">{{ suDieci[i] }} su 10</span>
        </div>
        <!-- i giochi che prendono le domande del catalogo: un elenco con la spunta e l'intensità; gli altri, il loro contenuto -->
        <ElencoDomande v-if="piuCose" :parti="parti" :gioco="gioco" @cambia="nuove => scrivi(nuove)" />
        <ParteEsercizio v-else-if="parti.length" :model-value="parti[0].esercizio" :gioco="gioco" @update:model-value="x => cambiaParte(0, x)" />
        <div class="fila">
          <button class="bottone" :disabled="!valido(e)" data-azione="cosa-fatta" @click="cosaFatta">Fatto</button>
          <span v-if="!valido(e)" class="nota">Scegli almeno una cosa.</span>
        </div>
      </div>
    </template>

    <template v-if="gioco && fatte.cosa && conDifficoltaDaScegliere">
      <Fatta v-if="!mostra('difficolta')" etichetta="Quanto è difficile" :valore="nomeDifficolta" passo="difficolta" @cambia="aperto = 'difficolta'" />
      <div v-else class="gruppo" data-passo-difficolta>
        <span class="titoletto">Quanto è difficile?</span>
        <div class="livelli">
          <button v-for="(d, k) in DIFFICOLTA" :key="d.id" class="livello" :class="{ scelta: fatte.difficolta && difficolta === d.id }"
                  :aria-pressed="fatte.difficolta && difficolta === d.id" :data-difficolta="d.id" @click="scegliDifficolta(d.id)">
            <span class="tacche" aria-hidden="true"><i v-for="n in 3" :key="n" :class="{ piena: n <= k + 1 }"></i></span>{{ d.nome }}</button>
        </div>
        <p class="nota">Normale è com'è a casa. Facile: {{ schedaDelGioco.difficolta.facile }} Difficile: {{ schedaDelGioco.difficolta.difficile }}</p>
      </div>
    </template>

  </div>
</template>

<style scoped>
.scelta-esercizio { display:flex; flex-direction:column; gap:16px }
.gruppo { display:flex; flex-direction:column; gap:8px }
.titoletto { font-size:14px; font-weight:600 }
/* il carosello: una fila che scorre di lato, con le frecce per chi ha il mouse */
.carosello { display:flex; align-items:center; gap:6px }
.fila-giochi { flex:1; min-width:0; display:flex; gap:6px; overflow-x:auto; scroll-snap-type:x proximity; padding:4px 2px 8px;
               scrollbar-width:thin; overscroll-behavior-x:contain }
.fila-giochi > * { flex:none; scroll-snap-align:center }
.freccia { width:36px; height:36px; flex:none; border-radius:50%; border:1px solid var(--filo); background:var(--superficie);
           color:var(--penna); font-size:22px; font-weight:700; line-height:1; cursor:pointer }
/* sotto, il gioco guardato: il video accanto a cosa fa, uno sopra l'altro sullo schermo stretto */
.scheda-gioco { display:grid; grid-template-columns:minmax(0, 1.1fr) minmax(0, 1fr); gap:14px; padding:12px; align-items:start;
                border-radius:var(--raggio-piccolo); background:var(--penna-chiara, var(--tessera)); font-size:14px; line-height:1.45 }
.testo-gioco { display:flex; flex-direction:column; gap:6px }
.testo-gioco > b { font-size:17px }
.allena { font-size:14px; line-height:1.5 }
.testo-gioco .bottone { align-self:flex-start; margin-top:4px }
@media (max-width:640px) { .scheda-gioco { grid-template-columns:1fr } }

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
