<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA TACCA A TRE POSIZIONI — ◀ Come dice l'età ▶

   La sorella di `Taratura.vue` per tutto quello che non si sposta di
   mezzo anno. Un pezzo di scuola con delle domande dentro ha una
   difficoltà, quindi una scala; un gioco no, e nemmeno un pezzo di
   scuola che vive solo dentro un gioco — le divisioni del castello o si
   danno per sapute o no. Quello che si sceglie lì non è *quanto*, è
   **chi decide**: l'età, o il grande.

   Le tre posizioni sono sempre quelle, e la seconda è quella che
   mancava finché l'interruttore era un sì/no: «come dice l'età» è il
   ripristino di una riga sola, e senza di lui l'unico modo di tornare
   indietro era ricordarsi com'era.

   ── PERCHÉ È UN COMPONENTE E NON DUE ─────────────────────────────
   Perché è già successo. `Blocco.vue` e `Riga.vue` esistono perché le
   stesse righe scritte a mano cinque volte erano finite diverse senza
   che nessuno l'avesse deciso — una con l'icona, un'altra no. Qui il
   rischio è lo stesso e vale il doppio: due tacche identiche a
   guardarle, che si muovono con le stesse frecce e scrivono cose
   diverse, sono il modo più veloce di far premere «Conferma» a un
   grande che credeva di stare facendo l'altra cosa.

   Le parole invece cambiano, e devono: «Non ce l'ha» parla di una carta
   in home, «Non l'ha ancora fatto» parla di scuola. Le porta chi la
   usa (`InCasa.vue`, `Scuola.vue`), insieme alla riga che spiega la
   posizione di mezzo — l'unica delle tre che non si spiega da sé.

   ── NON SALVA NIENTE ─────────────────────────────────────────────
   Muove una bozza e manda su cosa ha deciso: è il patto di tutte le
   tacche di questa cartella.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'

const props = defineProps({
  /* ── I TRE NOMI CON CUI I TEST RITROVANO IL RIQUADRO ──
     Non sono decorazione: un bersaglio che cambia da solo quando si
     riscrive un componente è un test che diventa verde smettendo di
     guardare. Chi usa questa tacca porta i suoi, che sono quelli che
     aveva prima di essere estratta. */
  radice: { type: String, required: true },   // data-<radice>="<chiave>"
  tasti: { type: String, required: true },    // data-<tasti>="giu|su|applica|lascia"
  ora: { type: String, required: true },      // data-<ora> sul nome della posizione
  chiave: { type: String, default: '' },
  /* la riga in cima: dice di che decisione si tratta, non cosa fa */
  titolo: { type: String, required: true },
  /* le tre posizioni, dal meno al più: `{ chiave, nome, che }` */
  scelte: { type: Array, required: true },
  /* com'è messa adesso: la chiave di una delle tre */
  scelto: { type: String, default: 'difetto' },
  /* cosa vuol dire «come dice l'età» qui e adesso. La posizione di
     mezzo è muta per definizione — non dice niente da sé — e senza
     questa riga sarebbe una posizione che non si sa dove porta. */
  spiega: { type: String, default: '' },
  /* ── LE POSIZIONI CHE NON SI RAGGIUNGONO ──
     Le chiavi delle scelte che qui non vogliono dire niente. Ce n'è
     sempre almeno un caso: un gioco tutto di un pezzo di scuola spento
     non si può tenere in casa, e un pezzo di scuola che a quest'età si
     dà già per saputo non si può «dare per saputo» una seconda volta —
     scriverebbe lo stesso profilo della posizione di mezzo, e chi ha
     premuto «Conferma» vedrebbe la riga tornare dov'era.

     Restano visibili, sbiadite: la tacca dice anche **dov'è la casa**,
     e togliere una posizione dalla fila farebbe sparire quella
     informazione insieme a lei. */
  bloccate: { type: Array, default: () => [] },
  /* cosa leggono le due frecce a chi non vede lo schermo */
  versi: { type: Array, default: () => ['verso il meno', 'verso il più'] },
})
const emit = defineEmits(['applica', 'chiudi'])

const dove = ref(Math.max(0, props.scelte.findIndex(x => x.chiave === props.scelto)))
const posizione = computed(() => props.scelte[dove.value])
const ultima = computed(() => props.scelte.length - 1)

const spiegazione = computed(() => posizione.value.chiave === 'difetto'
  ? (props.spiega || posizione.value.che) : posizione.value.che)

const cambiata = computed(() => posizione.value.chiave !== props.scelto)

const puo = i => i >= 0 && i <= ultima.value &&
  !props.bloccate.includes(props.scelte[i].chiave)
const muovi = passo => { if (puo(dove.value + passo)) dove.value += passo }
</script>

<template>
  <!-- `.stop`: vive dentro una riga che si apre al tocco -->
  <div class="tre" v-bind="{ [`data-${radice}`]: chiave }" @click.stop>
    <p class="dice">{{ titolo }}</p>

    <div class="tacca">
      <button type="button" class="freccia" v-bind="{ [`data-${tasti}`]: 'giu' }"
              :disabled="!puo(dove - 1)" :aria-label="versi[0]" @click="muovi(-1)">◀</button>
      <span class="valore">
        <b v-bind="{ [`data-${ora}`]: '' }">{{ posizione.nome }}</b>
        <em>{{ spiegazione }}</em>
      </span>
      <button type="button" class="freccia" v-bind="{ [`data-${tasti}`]: 'su' }"
              :disabled="!puo(dove + 1)" :aria-label="versi[1]" @click="muovi(1)">▶</button>
    </div>

    <div class="puntini">
      <span v-for="(s, i) in scelte" :key="s.chiave"
            :class="{ ora: i === dove, casa: s.chiave === 'difetto',
                      chiusa: bloccate.includes(s.chiave) }"></span>
    </div>

    <div class="riga">
      <button type="button" class="bottone chiaro" v-bind="{ [`data-${tasti}`]: 'lascia' }"
              @click="emit('chiudi')">Lascia stare</button>
      <button type="button" class="bottone" v-bind="{ [`data-${tasti}`]: 'applica' }"
              :disabled="!cambiata"
              @click="emit('applica', posizione.chiave)">Conferma</button>
    </div>
  </div>
</template>

<style scoped>
.tre { display:flex; flex-direction:column; gap:7px; margin:6px 0 2px;
       background:#f7f5ff; border-radius:13px; padding:9px 10px }
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
.valore em { font-style:normal; font-size:10.5px; color:#7a7a8a; line-height:1.25 }

.puntini { display:flex; align-items:center; justify-content:center; gap:5px }
.puntini span { width:6px; height:6px; border-radius:50%; background:#ded8ee }
/* dov'è la taratura di casa: un cerchietto vuoto, così si vede da che
   punto ci si è allontanati */
.puntini span.casa { background:#fff; box-shadow:inset 0 0 0 2px #b9b0d6 }
.puntini span.ora { background:var(--viola); box-shadow:none; transform:scale(1.35) }
/* una posizione che non si raggiunge resta al suo posto, sbiadita: la
   fila deve continuare a dire quante sono e dov'è la casa */
.puntini span.chiusa { opacity:.3 }

.riga { display:flex; gap:6px }
.bottone { flex:1; border:none; border-radius:12px; padding:9px 6px; font-family:inherit;
           font-size:12.5px; font-weight:800; cursor:pointer; color:#fff;
           background:linear-gradient(180deg, var(--viola), var(--viola-scuro)) }
.bottone.chiaro { color:var(--viola-scuro); background:#eee9fb }
.bottone:disabled { opacity:.35; cursor:default }
.bottone:active:not(:disabled) { transform:translateY(1px) }
</style>
