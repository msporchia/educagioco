<script setup>
// la tacca ✎ che sposta una riga in mezzi anni (vedi docs/genitori/ritocchi.md): perché non a blocchi, l'ultimo scatto che spegne, e perché non salva niente sono spiegati lì
import { ref, computed } from 'vue'
import { doveCadeCon } from '../../quiz/nucleo/catalogo.js'
import { anniDelLivello } from '../../quiz/nucleo/classi.js'
import { PASSO } from '../../quiz/nucleo/modulo.js'
import { GRUPPI } from './gruppi.js'
import { anniInLettere } from './lettere.js'

const props = defineProps({
  livello: { type: Number, required: true }, // difficoltà dichiarata, scala 0..100
  livelli: { type: Array, default: () => [] }, // livelli di tutte le domande legate a questa riga; vuoto = una sola
  eta: { type: Number, required: true }, // i confini dei blocchi sono suoi, non della domanda
  ritocco: { type: Number, default: 0 }, // segno del profilo: positivo = più facile per lui
  spenta: { type: Boolean, default: false },
  attesaSpenta: { type: Boolean, default: false }, // true se la partenza di quest'età la spegne da sola (fissaSapere)
  puoSpegnere: { type: Boolean, default: false }, // l'ultimo scatto c'è solo dove c'è un pezzo di scuola da spegnere
  chiave: { type: String, default: '' },
})
const emit = defineEmits(['applica', 'chiudi'])

const TETTO = 3 // deve combaciare col tetto di ritocca() in store/profile.js

// verso della tacca (destra = più difficile); il profilo lo scrive col segno opposto
const d = ref(-props.ritocco)
const via = ref(props.spenta)

const dove = computed(() => doveCadeCon(props.eta))
const livelloOra = computed(() => props.livello + d.value * PASSO)
const blocco = computed(() => dove.value(livelloOra.value))
const nome = computed(() => via.value
  ? GRUPPI.spenta.corto
  : (GRUPPI[blocco.value] || GRUPPI.medie).corto)

const anniOra = computed(() => anniDelLivello(livelloOra.value))
const inLettere = anniInLettere

// «mezzo anno più difficile», non «+1»: il numero di gradini non dice niente a un grande
const QUANTO = ['', 'mezzo anno', 'un anno', 'un anno e mezzo']
const scarto = computed(() => {
  if (!d.value) return 'come l\'abbiamo tarata noi'
  return `${QUANTO[Math.abs(d.value)]} più ${d.value > 0 ? 'difficile' : 'facile'}`
    + ` · vale ${inLettere(Math.round(anniOra.value * 2) / 2)}`
})

// un pezzo di scuola ha domande che partono da punti diversi: dice quante attraversano il confine, senza mentire
const quante = computed(() => {
  const tutti = props.livelli.length ? props.livelli : [props.livello]
  return tutti.filter(l => dove.value(l + d.value * PASSO) === blocco.value).length
})
const totale = computed(() => props.livelli.length || 1)
const finisce = computed(() => {
  if (via.value) return 'sparisce dalle domande di tutti i giochi, e si può rimettere'
  const dentro = (GRUPPI[blocco.value] || GRUPPI.medie).corto
  if (totale.value === 1)
    return blocco.value === dove.value(props.livello)
      ? 'resta nel blocco dov\'è adesso' : `va a finire in «${dentro}»`
  return quante.value === totale.value
    ? `tutte e ${totale.value} finiscono in «${dentro}»`
    : `${quante.value} su ${totale.value} finiscono in «${dentro}», le altre no`
})

// oltre l'ultimo scatto si spegne; si torna indietro dalla stessa parte (una fila sola)
const alLimite = computed(() => !via.value && d.value >= TETTO && !props.puoSpegnere)
function muovi (verso) {
  if (verso > 0) {
    if (via.value) return
    if (d.value >= TETTO) { if (props.puoSpegnere) via.value = true; return }
    d.value++
  } else {
    if (via.value) { via.value = false; return }
    if (d.value <= -TETTO) return
    d.value--
  }
}

const cambiata = computed(() => via.value !== props.spenta
  || (!via.value && -d.value !== props.ritocco))
// spegnendo, il ritocco resta quello di prima: riaccendendo si ritrova la taratura che aveva
const applica = () => emit('applica', { ritocco: via.value ? props.ritocco : -d.value,
                                        spenta: via.value })
// «com'era» è com'è di partenza a quest'età, non lo zero (vedi attesaSpenta)
const rimetti = () => emit('applica', { ritocco: 0, spenta: props.attesaSpenta })

const puntini = computed(() => {
  const fila = []
  for (let i = -TETTO; i <= TETTO; i++)
    fila.push({ k: `p${i}`, cls: !via.value && i === d.value ? 'ora'
      : (i === 0 && !props.attesaSpenta ? 'casa' : '') })
  if (props.puoSpegnere) {
    fila.push({ k: 'tacchetta', cls: 'tacchetta' })
    fila.push({ k: 'via', cls: 'via' + (via.value ? ' ora' : props.attesaSpenta ? ' casa' : '') })
  }
  return fila
})
</script>

<template>
  <!-- .stop: vive dentro una riga che si apre/chiude al tocco -->
  <div class="taratura" :class="{ via }" :data-taratura="chiave" @click.stop>
    <p class="dice">Per lui questo è:</p>

    <div class="tacca">
      <button type="button" class="freccia" data-tara="giu" :disabled="!via && d <= -3"
              aria-label="più facile per lui" @click="muovi(-1)">◀</button>
      <span class="valore">
        <b data-tara-ora>{{ nome }}</b>
        <em>{{ via ? 'a scuola non l\'hanno ancora fatto' : scarto }}</em>
      </span>
      <button type="button" class="freccia" data-tara="su" :disabled="via || alLimite"
              aria-label="più difficile per lui" @click="muovi(1)">▶</button>
    </div>

    <!-- sette puntini + l'ottavo che spegne, staccato da una tacchetta -->
    <div class="puntini">
      <span v-for="p in puntini" :key="p.k" :class="p.cls"></span>
    </div>

    <p class="finisce">{{ finisce }}</p>

    <div class="riga">
      <button type="button" class="bottone chiaro" data-tara="lascia"
              @click="emit('chiudi')">Lascia stare</button>
      <button type="button" class="bottone" :class="{ spegne: via }" data-tara="applica"
              :disabled="!cambiata" @click="applica">{{ via ? 'Toglila' : 'Conferma' }}</button>
    </div>

    <button v-if="ritocco || spenta !== attesaSpenta" type="button" class="rimetti"
            data-tara="rimetti"
            @click="rimetti">rimettila com'era</button>
  </div>
</template>

<style scoped>
.taratura { display:flex; flex-direction:column; gap:7px; margin:6px 0 2px;
            background:#f7f5ff; border-radius:13px; padding:9px 10px }
.taratura.via { background:#fdf6e8 }
.dice { margin:0; font-size:10.5px; color:#8a8a99; text-align:center }

.tacca { display:flex; align-items:center; gap:8px; background:#fff; border-radius:12px;
         padding:6px 7px; box-shadow:0 1px 4px #0000000f }
.freccia { border:none; background:#f0eaff; color:#5b3fa8; font-size:15px; line-height:1;
           width:38px; height:38px; border-radius:12px; cursor:pointer; font-family:inherit;
           flex:none }
.freccia:disabled { opacity:.28; cursor:default }
.freccia:active:not(:disabled) { transform:translateY(1px) }
.valore { flex:1; min-width:0; text-align:center; display:flex; flex-direction:column; gap:1px }
.valore b { font-size:14px; font-weight:850; color:var(--viola-scuro) }
.taratura.via .valore b { color:#8a5a10 }
.valore em { font-style:normal; font-size:10.5px; color:#7a7a8a; line-height:1.25 }

.puntini { display:flex; align-items:center; justify-content:center; gap:5px }
.puntini span { width:6px; height:6px; border-radius:50%; background:#ded8ee }
.puntini span.casa { background:#fff; box-shadow:inset 0 0 0 2px #b9b0d6 } /* cerchietto vuoto = taratura di casa */
.puntini span.ora { background:var(--viola); transform:scale(1.35) }
.puntini span.tacchetta { width:2px; height:12px; border-radius:1px; background:#e6cfa0 }
.puntini span.via { background:#efdcb4 }
.puntini span.via.casa { background:#fff; box-shadow:inset 0 0 0 2px #e0b25c }
.puntini span.via.ora { background:#d99a26 }

.finisce { margin:0; font-size:10.5px; color:#7a7a8a; text-align:center; line-height:1.3 }

.riga { display:flex; gap:6px }
.bottone { flex:1; border:none; border-radius:12px; padding:9px 6px; font-family:inherit;
           font-size:12.5px; font-weight:800; cursor:pointer; color:#fff;
           background:linear-gradient(180deg, var(--viola), var(--viola-scuro)) }
.bottone.chiaro { color:var(--viola-scuro); background:#eee9fb }
.bottone.spegne { background:linear-gradient(180deg,#e0a33c,#c07a10) }
.bottone:disabled { opacity:.35; cursor:default }
.bottone:active:not(:disabled) { transform:translateY(1px) }

.rimetti { border:none; background:none; padding:0; font-family:inherit; font-size:10.5px;
           color:#a9741c; text-decoration:underline; cursor:pointer; align-self:center }
</style>
