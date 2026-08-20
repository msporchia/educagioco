<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA TACCA CHE SPOSTA UNA RIGA — ◀ Nel segno ▶

   ── PERCHÉ NON È UNA SCALA DI BLOCCHI ────────────────────────────
   Il primo disegno metteva i cinque blocchi in fila e li faceva
   scegliere: un tocco, nessun verso da capire. **Misurandoli non
   regge.** Per un bambino di otto anni «Le sa fare» è largo due anni e
   mezzo, «Nel segno» uno e mezzo, «Difficili» uno e mezzo: saltare un
   blocco sono quattro gradini, cioè due anni. E quello che un grande
   vuole dire quasi sempre è un'altra cosa — *le stagioni le davamo per
   sapute, a scuola sono indietro di mezzo anno*. Con la scala a blocchi
   il gesto più piccolo possibile buttava via la taratura buona per
   correggere un semestre.

   Quindi la scala resta quella vera del ritocco (mezzo anno per
   scatto, `PASSO`) e i nomi dei blocchi diventano **l'etichetta**: dove
   la riga va a finire. Il nome grande è la destinazione, la riga sotto
   è quello che si sta dicendo — «mezzo anno più difficile · vale otto
   anni» — così il verso non si indovina, si legge.

   ── L'ULTIMO SCATTO NON È UN RITOCCO ─────────────────────────────
   In `store/profile.js` il tetto è ±3 gradini e la ragione è scritta
   lì: «oltre un anno e mezzo non si sta più ritoccando una taratura, si
   sta dicendo un'altra cosa — e quell'altra cosa è spegnere il
   gruppo». Adesso quella frase si può prendere in parola: dopo l'ultimo
   scatto non c'è un muro, c'è **«Non ancora spiegate»**, oltre una
   tacchetta e col tasto ambra, perché lì cambia il genere di
   affermazione — scrive `settings.sa` e le domande spariscono da tutti
   i giochi, castello compreso.

   Su una singola domanda quello scatto non c'è: una domanda non ha un
   pezzo di scuola da spegnere, e il ✕ di oggi — che sta sulla riga
   della domanda e ne toglie otto — è esattamente il difetto che questa
   tacca chiude.

   ── NON SALVA NIENTE ─────────────────────────────────────────────
   Muove una bozza e la manda su con `applica`. Chi la usa scrive: il
   patto è lo stesso della manopola dell'età, e per lo stesso motivo —
   qui si sta guardando un elenco muoversi, e una scrittura a ogni
   scatto non si potrebbe annullare.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import { doveCadeCon } from '../../quiz/nucleo/catalogo.js'
import { anniDelLivello } from '../../quiz/nucleo/classi.js'
import { PASSO } from '../../quiz/nucleo/modulo.js'
import { GRUPPI } from './gruppi.js'
import { anniInLettere } from './lettere.js'

const props = defineProps({
  /* la difficoltà dichiarata da noi, sulla scala 0..100. Di un pezzo di
     scuola è quella della sua domanda più tosta in questo blocco. */
  livello: { type: Number, required: true },
  /* i livelli di tutte le domande che si muovono insieme a questa riga:
     serve a non dire «finisce in Difficili» mentre due su tre restano
     dov'erano. Vuoto vuol dire «è una sola», ed è il caso di una
     domanda. */
  livelli: { type: Array, default: () => [] },
  /* gli anni del bambino: i confini dei blocchi sono suoi, non della
     domanda */
  eta: { type: Number, required: true },
  /* quanto l'ha già spostata un grande, col segno del profilo:
     positivo = «per lui è più facile» */
  ritocco: { type: Number, default: 0 },
  spenta: { type: Boolean, default: false },
  /* l'ultimo scatto c'è solo dove c'è un pezzo di scuola da spegnere */
  puoSpegnere: { type: Boolean, default: false },
  chiave: { type: String, default: '' },
})
const emit = defineEmits(['applica', 'chiudi'])

/* il tetto è quello di `ritocca()`, e non è una scelta di questa
   schermata: scriverlo diverso vorrebbe dire mostrare uno scatto che
   il profilo poi non salva */
const TETTO = 3

/* `d` sono scatti di **difficoltà**, che è il verso in cui si legge la
   tacca: a destra più difficile. Il profilo li scrive col segno
   opposto, perché lì il numero risponde a «quanto è più facile per
   lui» — la conversione sta tutta in questa riga e in `applica`. */
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

/* «mezzo anno più difficile», non «+1»: il numero di gradini è roba
   nostra, e un grande non ha nessun modo di sapere quanto vale */
const QUANTO = ['', 'mezzo anno', 'un anno', 'un anno e mezzo']
const scarto = computed(() => {
  if (!d.value) return 'come l\'abbiamo tarata noi'
  return `${QUANTO[Math.abs(d.value)]} più ${d.value > 0 ? 'difficile' : 'facile'}`
    + ` · vale ${inLettere(Math.round(anniOra.value * 2) / 2)}`
})

/* ── DOVE VA A FINIRE, DETTO SENZA MENTIRE ──
   Una domanda sola ha una destinazione sola. Un pezzo di scuola no: le
   sue domande partono da punti diversi e il confine lo attraversa chi
   ce l'ha vicino. Dirlo com'è costa una riga, e senza quella riga il
   riquadro direbbe una cosa mentre l'elenco ne mostra un'altra. */
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

/* ── muovere ──
   Il passo oltre l'ultimo scatto è lo spegnimento, e si torna indietro
   dalla stessa parte: la tacca è una fila sola, quindi non c'è nessun
   modo di restare chiusi dentro. */
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
/* Spegnendo, il ritocco si porta dietro quello di prima invece di
   azzerarlo: riaccendendo si ritrova la taratura che aveva, che è
   quello che uno si aspetta da un interruttore. */
const applica = () => emit('applica', { ritocco: via.value ? props.ritocco : -d.value,
                                        spenta: via.value })
const rimetti = () => emit('applica', { ritocco: 0, spenta: false })

const puntini = computed(() => {
  const fila = []
  for (let i = -TETTO; i <= TETTO; i++)
    fila.push({ k: `p${i}`, cls: !via.value && i === d.value ? 'ora' : (i === 0 ? 'casa' : '') })
  if (props.puoSpegnere) {
    fila.push({ k: 'tacchetta', cls: 'tacchetta' })
    fila.push({ k: 'via', cls: 'via' + (via.value ? ' ora' : '') })
  }
  return fila
})
</script>

<template>
  <!-- `.stop` su tutto il riquadro: vive dentro una riga che si apre e
       si chiude al tocco, e senza fermarlo ogni scatto della tacca
       chiuderebbe l'elenco da cui è stata aperta -->
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

    <!-- sette puntini e, staccato da una tacchetta, l'ottavo che spegne:
         la distanza si vede, ed è l'unica cosa che dice che lì cambia
         il genere di affermazione -->
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

    <button v-if="ritocco || spenta" type="button" class="rimetti" data-tara="rimetti"
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
/* dov'è la taratura di casa: un cerchietto vuoto, così si vede da che
   punto ci si è allontanati */
.puntini span.casa { background:#fff; box-shadow:inset 0 0 0 2px #b9b0d6 }
.puntini span.ora { background:var(--viola); transform:scale(1.35) }
.puntini span.tacchetta { width:2px; height:12px; border-radius:1px; background:#e6cfa0 }
.puntini span.via { background:#efdcb4 }
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
